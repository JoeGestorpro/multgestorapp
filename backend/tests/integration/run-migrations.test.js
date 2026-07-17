'use strict';

// Testes do runner de migrations endurecido — OPS-MIGRATIONS-03C.
// Unitários (sem banco) sempre rodam. Os de banco exigem TEST_DATABASE_URL
// (efêmero do CI) e são pulados localmente.

const { Pool } = require('pg');
const path = require('path');
const {
  run,
  migrations,
  resolveMigrationConnectionString,
  describeTarget,
  buildSslConfig,
  readMigrationSql,
  MIGRATION_LOCK_KEY,
} = require('../../scripts/run-migrations');

describe('run-migrations — resolveMigrationConnectionString (Emenda 01)', () => {
  it('prefere MIGRATION_DATABASE_URL quando presente', () => {
    const r = resolveMigrationConnectionString({
      MIGRATION_DATABASE_URL: 'postgresql://u:p@host:5432/db',
      DATABASE_URL: 'postgresql://u:p@outro:6543/db',
    });
    expect(r.dedicated).toBe(true);
    expect(r.connectionString).toContain(':5432/');
  });

  it('cai em DATABASE_URL quando a dedicada falta', () => {
    const r = resolveMigrationConnectionString({ DATABASE_URL: 'postgresql://u:p@host:6543/db' });
    expect(r.dedicated).toBe(false);
    expect(r.connectionString).toContain(':6543/');
  });

  it('connectionString vazia quando nenhuma existe', () => {
    const r = resolveMigrationConnectionString({});
    expect(r.connectionString).toBe('');
  });
});

describe('run-migrations — describeTarget (sem credenciais)', () => {
  it('retorna host:porta/db sem usuário nem senha', () => {
    const label = describeTarget('postgresql://usuario:senhaSecreta@meu-host:5432/meudb');
    expect(label).toBe('meu-host:5432/meudb');
    expect(label).not.toMatch(/usuario|senhaSecreta/);
  });

  it('não lança em URL inválida', () => {
    expect(describeTarget('nao-e-url')).toBe('(connection string inválida)');
  });
});

describe('run-migrations — buildSslConfig', () => {
  it('desliga TLS em NODE_ENV=test', () => {
    expect(buildSslConfig({ NODE_ENV: 'test' })).toBe(false);
  });

  it('verifica certificado quando há CA', () => {
    const cfg = buildSslConfig({ DATABASE_SSL_CA: 'linha1\\nlinha2' });
    expect(cfg.rejectUnauthorized).toBe(true);
    expect(cfg.ca).toBe('linha1\nlinha2');
  });

  it('sem CA, cifra sem verificar (ver SEC-DATABASE-TLS-001)', () => {
    expect(buildSslConfig({})).toEqual({ rejectUnauthorized: false });
  });
});

describe('run-migrations — readMigrationSql', () => {
  it('arquivo ausente é ERRO, não warning', () => {
    expect(() => readMigrationSql('nao-existe-jamais_999.sql')).toThrow(/não encontrado/);
  });

  it('lê um arquivo real da lista', () => {
    const sql = readMigrationSql(migrations[0].file);
    expect(typeof sql).toBe('string');
    expect(sql.length).toBeGreaterThan(0);
    expect(sql.charCodeAt(0)).not.toBe(0xfeff); // BOM removido
  });
});

describe('run-migrations — lista de migrations', () => {
  it('versões são únicas e ordenadas', () => {
    const versions = migrations.map((m) => m.version);
    expect(new Set(versions).size).toBe(versions.length);
    const ordenado = [...versions].sort();
    expect(versions).toEqual(ordenado);
  });
});

describe('run-migrations — contra Postgres real', () => {
  // SOMENTE TEST_DATABASE_URL. NUNCA cair em DATABASE_URL: o runner carrega
  // backend/.env via dotenv, e esse .env aponta para o pooler de PRODUÇÃO —
  // um fallback conectaria os testes à produção. Guard extra abaixo recusa
  // qualquer alvo que não seja local/efêmero.
  const raw = process.env.TEST_DATABASE_URL;
  const ehSeguro = (u) => {
    if (!u) return false;
    try {
      const h = new URL(u).hostname;
      return h === 'localhost' || h === '127.0.0.1' || h === 'postgres';
    } catch {
      return false;
    }
  };
  const url = ehSeguro(raw) ? raw : null;
  const rodar = url ? describe : describe.skip;

  rodar('run() + trava de concorrência', () => {
    const env = { DATABASE_URL: url, NODE_ENV: 'test' };

    it('é idempotente — reexecução com tudo aplicado conclui sem erro', async () => {
      // No CI as migrations já foram aplicadas pelo step anterior; run() deve
      // apenas [skip] tudo e concluir (exit implícito 0, sem throw).
      await expect(run({ env })).resolves.toBeUndefined();
    }, 60000);

    it('falha LIMPA quando a trava já está ocupada (nunca aplica em paralelo)', async () => {
      const holder = new Pool({ connectionString: url, max: 1 });
      const held = await holder.connect();
      try {
        // Segura a trava numa sessão separada.
        const r = await held.query('SELECT pg_try_advisory_lock($1) AS ok', [MIGRATION_LOCK_KEY]);
        expect(r.rows[0].ok).toBe(true);

        // run() deve recusar-se a prosseguir, com mensagem clara.
        await expect(run({ env })).rejects.toThrow(/advisory lock ocupada|andamento/);
      } finally {
        await held.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY]).catch(() => {});
        held.release();
        await holder.end().catch(() => {});
      }
    }, 60000);

    it('libera a trava após concluir — nova execução consegue adquiri-la', async () => {
      await run({ env });
      const probe = new Pool({ connectionString: url, max: 1 });
      const c = await probe.connect();
      try {
        const r = await c.query('SELECT pg_try_advisory_lock($1) AS ok', [MIGRATION_LOCK_KEY]);
        expect(r.rows[0].ok).toBe(true); // ninguém reteve a trava
        await c.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_KEY]);
      } finally {
        c.release();
        await probe.end().catch(() => {});
      }
    }, 60000);
  });
});
