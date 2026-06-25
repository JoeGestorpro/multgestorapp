'use strict';

/**
 * Gate 0 — Validação empírica dos caminhos de pool
 *
 * Confirma para cada caminho:
 *   role_name         — qual role está executando
 *   bypass_rls        — se o role ignora RLS (somente com LOG_POOL_DIAGNOSTICS=true)
 *   company_id_guc    — se app.current_company_id está presente e correto
 *   user_id_guc       — se app.current_user_id está presente e correto
 *
 * Caminhos testados:
 *   PATH-A  pool.query() sem contexto ALS        → _originalQuery → DATABASE_URL
 *   PATH-B  pool.query() com contexto ALS         → store.client   → client do requireCompany
 *   PATH-C  pool.connect() dentro de ALS          → _originalConnect → DATABASE_URL (bypass residual)
 *   PATH-D  pool.poolTenant.connect()             → APP_RUNTIME_URL (ou DATABASE_URL se ausente)
 *
 * Variáveis de ambiente:
 *   DEBUG_RLS=true           habilita console.table com resultados diagnósticos
 *   LOG_POOL_DIAGNOSTICS=true  inclui consulta a pg_roles (bypass_rls)
 *   TEST_DATABASE_URL          banco de teste não-Supabase (obrigatório para este arquivo)
 */

const database = require('../../src/config/database');
const { runWithTenantClient, tenantStore } = database;

const FAKE_COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const FAKE_USER_ID    = '00000000-0000-0000-0000-000000000002';

const DEBUG = process.env.DEBUG_RLS === 'true';
const DIAG  = process.env.LOG_POOL_DIAGNOSTICS === 'true';

// Todos os testes deste arquivo abrem conexões reais.
const hasDb = !!(
  process.env.TEST_DATABASE_URL ||
  (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('supabase'))
);
const describeDb = hasDb ? describe : describe.skip;

// ─────────────────────────────────────────────────────────────────────────────
// Helper — coleta informações da conexão atual
// Consulta pg_roles (bypass_rls) apenas com LOG_POOL_DIAGNOSTICS=true para
// não adicionar overhead desnecessário em operação normal.
// ─────────────────────────────────────────────────────────────────────────────
async function queryConnectionInfo(queryFn) {
  const base = await queryFn(`
    SELECT
      current_user                                          AS role_name,
      current_setting('app.current_company_id', true)      AS company_id_guc,
      current_setting('app.current_user_id',    true)      AS user_id_guc
  `);
  const info = { ...base.rows[0] };

  if (DIAG) {
    const diag = await queryFn(
      `SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user`
    );
    info.bypass_rls = diag.rows[0]?.rolbypassrls ?? null;
  }

  return info;
}

function expectGucEmpty(value) {
  expect(value == null || value === '').toBe(true);
}

// ─────────────────────────────────────────────────────────────────────────────

describeDb('Gate 0 — Pool Path Validation (requer banco de teste)', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // PATH-A: pool.query() sem contexto ALS
  // ──────────────────────────────────────────────────────────────────────────
  describe('PATH-A: pool.query() sem contexto ALS', () => {
    it('usa DATABASE_URL e não tem GUC de tenant ou usuário', async () => {
      expect(tenantStore.getStore()).toBeUndefined();

      const info = await queryConnectionInfo((sql) => database.query(sql));

      if (DEBUG) { console.log('[PATH-A]'); console.table(info); }

      expect(info.role_name).toBeDefined();
      expectGucEmpty(info.company_id_guc);
      expectGucEmpty(info.user_id_guc);

      // bypass_rls presente somente com LOG_POOL_DIAGNOSTICS=true.
      // Se true: DATABASE_URL tem BYPASSRLS (esperado em Supabase com service_role/postgres).
      // Se false: DATABASE_URL conecta como role sem BYPASSRLS — auth/master routes
      //           precisarão de policies explícitas para continuar funcionando.
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PATH-B: pool.query() com contexto ALS ativo
  // Simula o estado após requireCompany abrir a conexão e guardar no ALS.
  // ──────────────────────────────────────────────────────────────────────────
  describe('PATH-B: pool.query() dentro de runWithTenantClient', () => {
    it('usa o client do ALS e tem ambos os GUCs presentes', async () => {
      const client = await database._originalConnect();

      try {
        await client.query('BEGIN');
        await client.query(
          `SELECT set_config('app.current_company_id', $1, true)`,
          [FAKE_COMPANY_ID]
        );
        await client.query(
          `SELECT set_config('app.current_user_id', $1, true)`,
          [FAKE_USER_ID]
        );

        let info;
        await runWithTenantClient(client, FAKE_COMPANY_ID, async () => {
          // pool.query → tenantAwareQuery → ALS store.client.query
          info = await queryConnectionInfo((sql) => database.query(sql));
        });

        if (DEBUG) { console.log('[PATH-B]'); console.table(info); }

        expect(info.company_id_guc).toBe(FAKE_COMPANY_ID);
        expect(info.user_id_guc).toBe(FAKE_USER_ID);
        expect(info.role_name).toBeDefined();

        // DIAGNÓSTICO (LOG_POOL_DIAGNOSTICS=true):
        // Antes da mudança: bypass_rls=true (DATABASE_URL com BYPASSRLS → RLS inerte).
        // Após  a mudança: bypass_rls=false (poolTenant sem BYPASSRLS → RLS ativa).

        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PATH-C: pool.connect() dentro de contexto ALS
  // Prova do "bypass residual": serviços que chamam pool.connect() explicitamente
  // (collaborator.service, company.service, sale.service…) SEMPRE obtêm uma
  // conexão de DATABASE_URL, mesmo quando ALS está ativo.
  // ──────────────────────────────────────────────────────────────────────────
  describe('PATH-C: pool.connect() dentro de contexto ALS', () => {
    it('GUC company_id é injetado via tenantAwareConnect, mas role vem de DATABASE_URL', async () => {
      // Objeto mínimo que simula o client do requireCompany no ALS.
      // pool.query() usaria este client, mas PATH-C testa innerClient diretamente.
      const fakeAlsClient = {
        query: () => Promise.resolve({ rows: [], rowCount: 0 }),
        release: () => {},
      };

      let info;
      await runWithTenantClient(fakeAlsClient, FAKE_COMPANY_ID, async () => {
        // database.connect() = tenantAwareConnect:
        //   vê companyId no ALS → wrapper injeta set_config após BEGIN.
        //   mas _originalConnect() sempre retorna client de DATABASE_URL.
        const innerClient = await database.connect();

        try {
          await innerClient.query('BEGIN');
          // O wrapper injetou set_config('app.current_company_id') após o BEGIN acima.
          info = await queryConnectionInfo((sql) => innerClient.query(sql));

          if (DEBUG) { console.log('[PATH-C — bypass residual]'); console.table(info); }

          // company_id setado pelo wrapper ✓
          expect(info.company_id_guc).toBe(FAKE_COMPANY_ID);

          // user_id NÃO é injetado pelo tenantAwareConnect — só company_id.
          // Policies que dependem de app.current_user_id NÃO são cobertas por este caminho.
          expectGucEmpty(info.user_id_guc);

          // role_name é o de DATABASE_URL (pode ter BYPASSRLS).
          expect(info.role_name).toBeDefined();

          await innerClient.query('ROLLBACK');
        } finally {
          innerClient.release();
        }
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PATH-D: pool.poolTenant.connect()
  // Este é o caminho que requireCompany deve usar após a mudança.
  // ──────────────────────────────────────────────────────────────────────────
  describe('PATH-D: pool.poolTenant.connect()', () => {
    it('aceita ambos os GUCs e reporta o role de APP_RUNTIME_URL', async () => {
      const client = await database.poolTenant.connect();

      try {
        await client.query('BEGIN');
        await client.query(
          `SELECT set_config('app.current_company_id', $1, true)`,
          [FAKE_COMPANY_ID]
        );
        await client.query(
          `SELECT set_config('app.current_user_id', $1, true)`,
          [FAKE_USER_ID]
        );

        const info = await queryConnectionInfo((sql) => client.query(sql));

        if (DEBUG) { console.log('[PATH-D]'); console.table(info); }

        expect(info.company_id_guc).toBe(FAKE_COMPANY_ID);
        expect(info.user_id_guc).toBe(FAKE_USER_ID);
        expect(info.role_name).toBeDefined();

        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    });

    it('GATE CRÍTICO: poolTenant NÃO deve ter BYPASSRLS quando APP_RUNTIME_URL configurada', async () => {
      if (!process.env.APP_RUNTIME_URL) {
        // Sem APP_RUNTIME_URL, poolTenant = pool (DATABASE_URL).
        // Não é possível validar este gate sem a variável configurada.
        return;
      }

      const client = await database.poolTenant.connect();
      try {
        // Consulta pg_roles aqui é intencional: este é o gate de segurança crítico,
        // executado explicitamente, não a cada requisição.
        const result = await client.query(
          `SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user`
        );
        const bypassRls = result.rows[0]?.rolbypassrls;

        if (DEBUG) console.log(`[PATH-D GATE CRÍTICO] bypass_rls=${bypassRls}`);

        // Se bypassRls for true: APP_RUNTIME_URL aponta para o role errado.
        // A mudança em requireCompany teria efeito zero em produção.
        expect(bypassRls).toBe(false);
      } finally {
        client.release();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ROLLBACK — GUC transaction-local não deixa lixo após ROLLBACK nem COMMIT
  // ──────────────────────────────────────────────────────────────────────────
  describe('Rollback — GUC não persiste além da transação', () => {
    it('app.current_company_id e app.current_user_id são limpos após ROLLBACK', async () => {
      const client = await database._originalConnect();

      try {
        // 1. Estado inicial: GUCs vazios
        const before = await client.query(`
          SELECT
            current_setting('app.current_company_id', true) AS company_id_guc,
            current_setting('app.current_user_id',    true) AS user_id_guc
        `);
        expectGucEmpty(before.rows[0].company_id_guc);
        expectGucEmpty(before.rows[0].user_id_guc);

        // 2. Dentro da transação: GUCs setados (is_local=true)
        await client.query('BEGIN');
        await client.query(
          `SELECT set_config('app.current_company_id', $1, true)`, [FAKE_COMPANY_ID]
        );
        await client.query(
          `SELECT set_config('app.current_user_id', $1, true)`, [FAKE_USER_ID]
        );

        const during = await client.query(`
          SELECT
            current_setting('app.current_company_id', true) AS company_id_guc,
            current_setting('app.current_user_id',    true) AS user_id_guc
        `);
        expect(during.rows[0].company_id_guc).toBe(FAKE_COMPANY_ID);
        expect(during.rows[0].user_id_guc).toBe(FAKE_USER_ID);

        // 3. ROLLBACK: GUCs transaction-local são descartados
        await client.query('ROLLBACK');

        const after = await client.query(`
          SELECT
            current_setting('app.current_company_id', true) AS company_id_guc,
            current_setting('app.current_user_id',    true) AS user_id_guc
        `);
        expectGucEmpty(after.rows[0].company_id_guc);
        expectGucEmpty(after.rows[0].user_id_guc);

        if (DEBUG) {
          console.log('[ROLLBACK]');
          console.table({ before: before.rows[0], during: during.rows[0], after: after.rows[0] });
        }
      } finally {
        client.release();
      }
    });

    it('GUC não persiste entre transações sequenciais na mesma conexão', async () => {
      const client = await database._originalConnect();

      try {
        // Transação 1: seta e commita
        await client.query('BEGIN');
        await client.query(
          `SELECT set_config('app.current_company_id', $1, true)`, [FAKE_COMPANY_ID]
        );
        await client.query('COMMIT');

        // Após COMMIT: GUC transaction-local é descartado
        const afterCommit = await client.query(
          `SELECT current_setting('app.current_company_id', true) AS company_id_guc`
        );
        expectGucEmpty(afterCommit.rows[0].company_id_guc);

        // Transação 2: começa sem GUC
        await client.query('BEGIN');
        const inTx2 = await client.query(
          `SELECT current_setting('app.current_company_id', true) AS company_id_guc`
        );
        expectGucEmpty(inTx2.rows[0].company_id_guc);
        await client.query('ROLLBACK');

        if (DEBUG) console.log('[ROLLBACK] GUC não persiste entre transações ✓');
      } finally {
        client.release();
      }
    });

    it('pool devolve conexão limpa ao retornar ao pool após request', async () => {
      // Simula o ciclo completo de uma request barber:
      // requireCompany abre → BEGIN → set GUC → [request] → COMMIT → release.
      // A próxima request que pegar a mesma conexão não deve ver o GUC anterior.

      // Request A: abre, seta GUC, commita, libera
      const clientA = await database._originalConnect();
      await clientA.query('BEGIN');
      await clientA.query(
        `SELECT set_config('app.current_company_id', $1, true)`, [FAKE_COMPANY_ID]
      );
      const duringA = await clientA.query(
        `SELECT current_setting('app.current_company_id', true) AS company_id_guc`
      );
      expect(duringA.rows[0].company_id_guc).toBe(FAKE_COMPANY_ID);
      await clientA.query('COMMIT');
      clientA.release(); // conexão volta ao pool

      // Request B: pega uma conexão (pode ser a mesma de A)
      const clientB = await database._originalConnect();
      try {
        // GUC deve estar limpo — is_local=true não sobrevive ao COMMIT
        const beforeB = await clientB.query(
          `SELECT current_setting('app.current_company_id', true) AS company_id_guc`
        );
        expectGucEmpty(beforeB.rows[0].company_id_guc);

        if (DEBUG) console.log('[ROLLBACK] Conexão reutilizada sem GUC residual ✓');
      } finally {
        clientB.release();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUMÁRIO — snapshot comparativo de todos os caminhos
  // ──────────────────────────────────────────────────────────────────────────
  describe('Sumário comparativo dos caminhos', () => {
    it('captura e compara role, bypass_rls e GUCs de cada caminho', async () => {
      const snapshot = {};

      // PATH-A
      snapshot['A: pool.query() sem ALS'] =
        await queryConnectionInfo((sql) => database.query(sql));

      // PATH-B
      const clientB = await database._originalConnect();
      await clientB.query('BEGIN');
      await clientB.query(`SELECT set_config('app.current_company_id', $1, true)`, [FAKE_COMPANY_ID]);
      await clientB.query(`SELECT set_config('app.current_user_id', $1, true)`, [FAKE_USER_ID]);
      await runWithTenantClient(clientB, FAKE_COMPANY_ID, async () => {
        snapshot['B: pool.query() com ALS'] =
          await queryConnectionInfo((sql) => database.query(sql));
      });
      await clientB.query('ROLLBACK');
      clientB.release();

      // PATH-C
      const fakeAls = { query: () => Promise.resolve({ rows: [], rowCount: 0 }), release: () => {} };
      await runWithTenantClient(fakeAls, FAKE_COMPANY_ID, async () => {
        const innerC = await database.connect();
        await innerC.query('BEGIN');
        snapshot['C: pool.connect() no ALS'] =
          await queryConnectionInfo((sql) => innerC.query(sql));
        await innerC.query('ROLLBACK');
        innerC.release();
      });

      // PATH-D
      const clientD = await database.poolTenant.connect();
      await clientD.query('BEGIN');
      await clientD.query(`SELECT set_config('app.current_company_id', $1, true)`, [FAKE_COMPANY_ID]);
      await clientD.query(`SELECT set_config('app.current_user_id', $1, true)`, [FAKE_USER_ID]);
      snapshot['D: pool.poolTenant.connect()'] =
        await queryConnectionInfo((sql) => clientD.query(sql));
      await clientD.query('ROLLBACK');
      clientD.release();

      if (DEBUG) {
        console.log('\n[Gate 0 — Sumário de Caminhos de Pool]');
        console.table(
          Object.entries(snapshot).map(([path, info]) => ({ path, ...info }))
        );
      }

      // Assertions estruturais mínimas
      expectGucEmpty(snapshot['A: pool.query() sem ALS'].company_id_guc);
      expectGucEmpty(snapshot['A: pool.query() sem ALS'].user_id_guc);

      expect(snapshot['B: pool.query() com ALS'].company_id_guc).toBe(FAKE_COMPANY_ID);
      expect(snapshot['B: pool.query() com ALS'].user_id_guc).toBe(FAKE_USER_ID);

      expect(snapshot['C: pool.connect() no ALS'].company_id_guc).toBe(FAKE_COMPANY_ID);
      // tenantAwareConnect injeta apenas company_id, não user_id
      expectGucEmpty(snapshot['C: pool.connect() no ALS'].user_id_guc);

      expect(snapshot['D: pool.poolTenant.connect()'].company_id_guc).toBe(FAKE_COMPANY_ID);
      expect(snapshot['D: pool.poolTenant.connect()'].user_id_guc).toBe(FAKE_USER_ID);

      // Comparação de roles entre caminhos
      const roleA = snapshot['A: pool.query() sem ALS'].role_name;
      const roleD = snapshot['D: pool.poolTenant.connect()'].role_name;

      if (process.env.APP_RUNTIME_URL) {
        // Com APP_RUNTIME_URL configurada, PATH-D deve usar role diferente de PATH-A
        expect(roleD).not.toBe(roleA);
      }
      // Sem APP_RUNTIME_URL: roleA === roleD (ambos usam DATABASE_URL) — OK, apenas documentado
    });
  });
});
