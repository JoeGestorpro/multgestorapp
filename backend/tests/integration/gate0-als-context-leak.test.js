'use strict';

/**
 * Gate 0 — Teste de vazamento de contexto ALS (AsyncLocalStorage)
 *
 * Valida que o isolamento de tenant via ALS funciona corretamente:
 *   - Requisições concorrentes de tenants diferentes não vazam company_id entre si.
 *   - O contexto expira automaticamente após o callback.
 *   - O GUC não persiste após ROLLBACK (a transação não deixa lixo na conexão).
 *
 * Suite 1 (sem banco real):
 *   Usa clientes mock para testar o mecanismo ALS puro.
 *   Roda sempre — sem dependência de TEST_DATABASE_URL.
 *
 * Suite 2 (banco real):
 *   Valida comportamento com set_config real e conexões de DATABASE_URL.
 *   Pula automaticamente sem TEST_DATABASE_URL ou fora de Supabase.
 *
 * Variáveis de ambiente:
 *   DEBUG_RLS=true         habilita console.table com resultados
 *   TEST_DATABASE_URL      banco de teste não-Supabase (Suite 2)
 */

const database = require('../../src/config/database');
const { runWithTenantClient, tenantStore } = database;

const DEBUG = process.env.DEBUG_RLS === 'true';

// IDs de tenant para os testes de vazamento
const COMPANY_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const COMPANY_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function expectGucEmpty(value) {
  expect(value == null || value === '').toBe(true);
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — Mock puro (sem banco real)
// ─────────────────────────────────────────────────────────────────────────────
describe('Gate 0 — ALS Context Leak (mock puro, sem banco)', () => {

  function makeMockClient(companyId) {
    return {
      query: jest.fn(async () => {
        // Delay simulando latência de query para forçar interleaving de contextos
        await delay(Math.floor(Math.random() * 15));
        const store = tenantStore.getStore();
        return {
          rows: [{
            observed_company: store?.companyId ?? null,
            expected_company: companyId,
            context_intact: store?.companyId === companyId,
          }],
          rowCount: 1,
        };
      }),
      release: jest.fn(),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  it('dois tenants concorrentes não vazam company_id entre si', async () => {
    const clientA = makeMockClient(COMPANY_A);
    const clientB = makeMockClient(COMPANY_B);

    const [resA, resB] = await Promise.all([
      runWithTenantClient(clientA, COMPANY_A, async () => {
        await delay(8); // A é mais lento, aumenta interleaving
        const r = await database.query('SELECT 1');
        // Confirma que o ALS ainda aponta para A mesmo com B rodando em paralelo
        expect(tenantStore.getStore()?.companyId).toBe(COMPANY_A);
        return r;
      }),
      runWithTenantClient(clientB, COMPANY_B, async () => {
        const r = await database.query('SELECT 1');
        expect(tenantStore.getStore()?.companyId).toBe(COMPANY_B);
        return r;
      }),
    ]);

    if (DEBUG) {
      console.log('[ALS-LEAK] Dois tenants concorrentes:');
      console.table([
        { tenant: 'A', ...resA.rows[0] },
        { tenant: 'B', ...resB.rows[0] },
      ]);
    }

    expect(resA.rows[0].observed_company).toBe(COMPANY_A);
    expect(resA.rows[0].context_intact).toBe(true);
    expect(resB.rows[0].observed_company).toBe(COMPANY_B);
    expect(resB.rows[0].context_intact).toBe(true);
  }, 10000);

  // ──────────────────────────────────────────────────────────────────────────
  it('100 tenants concorrentes com company_ids únicos — nenhum vaza', async () => {
    const TENANT_COUNT = 100;

    const companyIds = Array.from({ length: TENANT_COUNT }, (_, i) =>
      `${String(i + 1).padStart(8, '0')}-0000-0000-0000-000000000000`
    );

    const results = await Promise.all(
      companyIds.map(async (companyId) => {
        const mockClient = makeMockClient(companyId);
        let observedCompanyId = null;

        await runWithTenantClient(mockClient, companyId, async () => {
          await delay(Math.random() * 25); // delay aleatório para forçar interleaving
          observedCompanyId = tenantStore.getStore()?.companyId ?? null;
          // Dispara um pool.query para também validar o caminho tenantAwareQuery
          await database.query('SELECT 1');
        });

        return {
          expected: companyId,
          observed: observedCompanyId,
          leaked: observedCompanyId !== companyId,
        };
      })
    );

    const leaks = results.filter((r) => r.leaked);

    if (DEBUG || leaks.length > 0) {
      if (leaks.length > 0) {
        console.error('[ALS-LEAK] VAZAMENTOS DETECTADOS:');
        console.table(leaks);
      } else {
        console.log(`[ALS-LEAK] ${TENANT_COUNT} tenants concorrentes — zero vazamentos ✓`);
      }
    }

    expect(leaks).toHaveLength(0);
  }, 15000);

  // ──────────────────────────────────────────────────────────────────────────
  it('contexto ALS expira após o callback — não vaza para código externo', async () => {
    const clientA = makeMockClient(COMPANY_A);
    const clientB = makeMockClient(COMPANY_B);

    let observedInsideA;
    let observedInsideB;

    await runWithTenantClient(clientA, COMPANY_A, async () => {
      observedInsideA = tenantStore.getStore()?.companyId;
    });

    // Fora do contexto A: deve ser undefined
    expect(tenantStore.getStore()).toBeUndefined();

    await runWithTenantClient(clientB, COMPANY_B, async () => {
      observedInsideB = tenantStore.getStore()?.companyId;
    });

    // Fora de B: ainda undefined
    expect(tenantStore.getStore()).toBeUndefined();

    expect(observedInsideA).toBe(COMPANY_A);
    expect(observedInsideB).toBe(COMPANY_B);

    if (DEBUG) {
      console.table({ observedInsideA, observedInsideB, afterBoth: tenantStore.getStore() });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  it('contexto aninhado não polui o contexto pai', async () => {
    const outerClient = makeMockClient(COMPANY_A);
    const innerClient = makeMockClient(COMPANY_B);

    let outerBefore;
    let innerObserved;
    let outerAfter;

    await runWithTenantClient(outerClient, COMPANY_A, async () => {
      outerBefore = tenantStore.getStore()?.companyId;

      await runWithTenantClient(innerClient, COMPANY_B, async () => {
        innerObserved = tenantStore.getStore()?.companyId;
      });

      outerAfter = tenantStore.getStore()?.companyId;
    });

    expect(outerBefore).toBe(COMPANY_A);
    expect(innerObserved).toBe(COMPANY_B);
    // O contexto pai é restaurado após o contexto filho encerrar
    expect(outerAfter).toBe(COMPANY_A);

    if (DEBUG) {
      console.table({ outerBefore, innerObserved, outerAfter });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  it('pool.query() dentro de ALS usa o client do store, não o pool direto', async () => {
    // Confirma que tenantAwareQuery redireciona para store.client quando ALS está ativo.
    // O mock client tem delay para verificar que a associação se mantém durante a execução.
    const mockClient = makeMockClient(COMPANY_A);

    let queryResult;
    await runWithTenantClient(mockClient, COMPANY_A, async () => {
      // pool.query → tenantAwareQuery → store.client.query (mockClient)
      queryResult = await database.query('SELECT 1');
    });

    // O mock client foi chamado — pool não usou _originalQuery
    expect(mockClient.query).toHaveBeenCalled();
    expect(queryResult.rows[0].observed_company).toBe(COMPANY_A);
    expect(queryResult.rows[0].context_intact).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — Banco real
// ─────────────────────────────────────────────────────────────────────────────
const hasDb = !!(
  process.env.TEST_DATABASE_URL ||
  (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('supabase'))
);
const describeDb = hasDb ? describe : describe.skip;

describeDb('Gate 0 — ALS Context Leak (banco real)', () => {

  // ──────────────────────────────────────────────────────────────────────────
  it('GUC app.current_company_id não vaza entre requests concorrentes', async () => {
    const clientA = await database._originalConnect();
    const clientB = await database._originalConnect();

    try {
      await clientA.query('BEGIN');
      await clientA.query(
        `SELECT set_config('app.current_company_id', $1, true)`, [COMPANY_A]
      );

      await clientB.query('BEGIN');
      await clientB.query(
        `SELECT set_config('app.current_company_id', $1, true)`, [COMPANY_B]
      );

      const [resA, resB] = await Promise.all([
        runWithTenantClient(clientA, COMPANY_A, async () => {
          await delay(5);
          return database.query(
            `SELECT current_setting('app.current_company_id', true) AS company_id_guc`
          );
        }),
        runWithTenantClient(clientB, COMPANY_B, async () => {
          return database.query(
            `SELECT current_setting('app.current_company_id', true) AS company_id_guc`
          );
        }),
      ]);

      if (DEBUG) {
        console.log('[ALS-REAL] GUC por tenant concorrente:');
        console.table([
          { tenant: 'A', guc: resA.rows[0].company_id_guc },
          { tenant: 'B', guc: resB.rows[0].company_id_guc },
        ]);
      }

      expect(resA.rows[0].company_id_guc).toBe(COMPANY_A);
      expect(resB.rows[0].company_id_guc).toBe(COMPANY_B);

      await clientA.query('ROLLBACK');
      await clientB.query('ROLLBACK');
    } finally {
      clientA.release();
      clientB.release();
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  it('GUC app.current_user_id não vaza entre requests concorrentes', async () => {
    const USER_A = '11111111-1111-1111-1111-111111111111';
    const USER_B = '22222222-2222-2222-2222-222222222222';

    const clientA = await database._originalConnect();
    const clientB = await database._originalConnect();

    try {
      await clientA.query('BEGIN');
      await clientA.query(`SELECT set_config('app.current_company_id', $1, true)`, [COMPANY_A]);
      await clientA.query(`SELECT set_config('app.current_user_id', $1, true)`, [USER_A]);

      await clientB.query('BEGIN');
      await clientB.query(`SELECT set_config('app.current_company_id', $1, true)`, [COMPANY_B]);
      await clientB.query(`SELECT set_config('app.current_user_id', $1, true)`, [USER_B]);

      const [resA, resB] = await Promise.all([
        runWithTenantClient(clientA, COMPANY_A, async () => {
          await delay(8);
          return database.query(`
            SELECT
              current_setting('app.current_company_id', true) AS company_id_guc,
              current_setting('app.current_user_id',    true) AS user_id_guc
          `);
        }),
        runWithTenantClient(clientB, COMPANY_B, async () => {
          return database.query(`
            SELECT
              current_setting('app.current_company_id', true) AS company_id_guc,
              current_setting('app.current_user_id',    true) AS user_id_guc
          `);
        }),
      ]);

      if (DEBUG) {
        console.log('[ALS-REAL] GUC company_id + user_id por tenant:');
        console.table([
          { tenant: 'A', ...resA.rows[0] },
          { tenant: 'B', ...resB.rows[0] },
        ]);
      }

      expect(resA.rows[0].company_id_guc).toBe(COMPANY_A);
      expect(resA.rows[0].user_id_guc).toBe(USER_A);
      expect(resB.rows[0].company_id_guc).toBe(COMPANY_B);
      expect(resB.rows[0].user_id_guc).toBe(USER_B);

      await clientA.query('ROLLBACK');
      await clientB.query('ROLLBACK');
    } finally {
      clientA.release();
      clientB.release();
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  it('ROLLBACK limpa ambos os GUCs — nenhuma transação deixa lixo na conexão', async () => {
    const client = await database._originalConnect();

    try {
      // Estado inicial: GUCs vazios
      const before = await client.query(`
        SELECT
          current_setting('app.current_company_id', true) AS company_id_guc,
          current_setting('app.current_user_id',    true) AS user_id_guc
      `);
      expectGucEmpty(before.rows[0].company_id_guc);
      expectGucEmpty(before.rows[0].user_id_guc);

      // Seta GUCs dentro de transação (is_local=true)
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_company_id', $1, true)`, [COMPANY_A]);
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, ['test-user-id']);

      const during = await client.query(`
        SELECT
          current_setting('app.current_company_id', true) AS company_id_guc,
          current_setting('app.current_user_id',    true) AS user_id_guc
      `);
      expect(during.rows[0].company_id_guc).toBe(COMPANY_A);
      expect(during.rows[0].user_id_guc).toBe('test-user-id');

      // ROLLBACK: GUCs descartados
      await client.query('ROLLBACK');

      const after = await client.query(`
        SELECT
          current_setting('app.current_company_id', true) AS company_id_guc,
          current_setting('app.current_user_id',    true) AS user_id_guc
      `);
      expectGucEmpty(after.rows[0].company_id_guc);
      expectGucEmpty(after.rows[0].user_id_guc);

      if (DEBUG) {
        console.log('[ROLLBACK-REAL]');
        console.table({ before: before.rows[0], during: during.rows[0], after: after.rows[0] });
      }
    } finally {
      client.release();
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  it('conexão devolvida ao pool após ROLLBACK não carrega GUC residual', async () => {
    // Request 1: abre conexão, seta GUC, faz ROLLBACK, devolve ao pool
    const conn1 = await database._originalConnect();
    await conn1.query('BEGIN');
    await conn1.query(
      `SELECT set_config('app.current_company_id', $1, true)`, [COMPANY_A]
    );
    await conn1.query('ROLLBACK');
    conn1.release(); // conexão volta ao pool

    // Request 2: pode pegar a mesma conexão — GUC deve estar vazio
    const conn2 = await database._originalConnect();
    try {
      const check = await conn2.query(
        `SELECT current_setting('app.current_company_id', true) AS company_id_guc`
      );
      expectGucEmpty(check.rows[0].company_id_guc);

      if (DEBUG) {
        console.log('[ROLLBACK-REAL] Conexão reutilizada sem GUC residual:');
        console.table(check.rows[0]);
      }
    } finally {
      conn2.release();
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  it('20 tenants concorrentes com banco real — GUC isolado em cada request', async () => {
    const TENANT_COUNT = 20;
    const companyIds = Array.from({ length: TENANT_COUNT }, (_, i) =>
      `${String(i + 1).padStart(8, '0')}-0000-0000-0000-000000000000`
    );

    const results = await Promise.all(
      companyIds.map(async (companyId) => {
        const client = await database._originalConnect();
        let observedGuc = null;

        try {
          await client.query('BEGIN');
          await client.query(
            `SELECT set_config('app.current_company_id', $1, true)`, [companyId]
          );

          await runWithTenantClient(client, companyId, async () => {
            await delay(Math.random() * 10);
            const r = await database.query(
              `SELECT current_setting('app.current_company_id', true) AS company_id_guc`
            );
            observedGuc = r.rows[0].company_id_guc;
          });

          await client.query('ROLLBACK');
        } finally {
          client.release();
        }

        return { expected: companyId, observed: observedGuc, leaked: observedGuc !== companyId };
      })
    );

    const leaks = results.filter((r) => r.leaked);

    if (DEBUG || leaks.length > 0) {
      if (leaks.length > 0) {
        console.error('[ALS-REAL] VAZAMENTOS DETECTADOS:');
        console.table(leaks);
      } else {
        console.log(`[ALS-REAL] ${TENANT_COUNT} tenants concorrentes com banco real — zero vazamentos ✓`);
      }
    }

    expect(leaks).toHaveLength(0);
  }, 20000);
});
