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
  isStrictMode,
  assertStrictEndpoint,
  describeEndpoint,
  sanitizeError,
  formatFatal,
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

describe('run-migrations — describeEndpoint (não identifica ambiente)', () => {
  it('retorna somente o booleano dedicado', () => {
    expect(describeEndpoint(true)).toBe('dedicado=true');
    expect(describeEndpoint(false)).toBe('dedicado=false');
  });

  it('não recebe nem revela nenhuma parte de URL', () => {
    // A função nem aceita connection string — impossível vazar host/db/porta.
    expect(describeEndpoint(true)).not.toMatch(/supabase|pooler|5432|6543|@|:\/\//);
  });
});

describe('run-migrations — sanitizeError (nunca a mensagem crua)', () => {
  it('devolve o código quando é seguro', () => {
    expect(sanitizeError({ code: 'ENETUNREACH' })).toBe('ENETUNREACH');
    expect(sanitizeError({ code: '28P01' })).toBe('28P01');
    expect(sanitizeError({ code: 'LOCK_BUSY' })).toBe('LOCK_BUSY');
  });

  it('nunca vaza host/IP/URL da mensagem — código desconhecido vira genérico', () => {
    const err = new Error('connect ENETUNREACH db.projeto-secreto.supabase.co 2600:1f1e:abcd::1:5432');
    err.code = 'ZZZ_INESPERADO';
    const out = sanitizeError(err);
    expect(out).toBe('ERRO_NAO_MAPEADO');
    expect(out).not.toMatch(/projeto-secreto|supabase|2600|5432/);
  });

  it('erro sem code vira DESCONHECIDO', () => {
    expect(sanitizeError(new Error('qualquer coisa com host.interno:5432'))).toBe('ERRO_DESCONHECIDO');
  });
});

describe('run-migrations — formatFatal (linha de erro segura)', () => {
  it('não contém nenhuma parte de uma mensagem com host/IP/URL', () => {
    const err = new Error('connect ENETUNREACH db.projeto-secreto.supabase.co:5432 - Local (:::0)');
    err.code = 'ENETUNREACH';
    const line = formatFatal(err);
    expect(line).toContain('codigo=ENETUNREACH');
    expect(line).not.toMatch(/projeto-secreto|supabase|:5432|2600|Local/);
  });

  it('inclui a versão da migration (identificador de migration, não de ambiente)', () => {
    const err = new Error('x');
    err.code = 'MIGRATION_APPLY_FAILED';
    err.version = '20260708_031';
    expect(formatFatal(err)).toBe('[migrate] falha — codigo=MIGRATION_APPLY_FAILED migration=20260708_031');
  });
});

describe('run-migrations — log de run() não vaza a URL recebida (requisito 5)', () => {
  it('nenhuma linha logada contém host, usuário, senha ou db da connection string', async () => {
    const URL_SECRETA = 'postgresql://usuarioSecreto:senhaSecreta@db.ref-secreto-xyz.supabase.co:5432/prod_db';
    const capturado = [];
    const orig = {
      log: console.log, warn: console.warn, error: console.error,
    };
    console.log = (...a) => capturado.push(a.join(' '));
    console.warn = (...a) => capturado.push(a.join(' '));
    console.error = (...a) => capturado.push(a.join(' '));

    // Pool injetado que falha no connect com um erro contendo o host secreto —
    // simula o ENETUNREACH real que vazava o IPv6/hostname.
    class FakePool {
      constructor() {}
      async connect() {
        const e = new Error(`connect ENETUNREACH db.ref-secreto-xyz.supabase.co:5432`);
        e.code = 'ENETUNREACH';
        throw e;
      }
      async end() {}
    }

    try {
      await expect(
        run({ PoolCtor: FakePool, env: { DATABASE_URL: URL_SECRETA, NODE_ENV: 'test' } })
      ).rejects.toBeDefined();
    } finally {
      console.log = orig.log; console.warn = orig.warn; console.error = orig.error;
    }

    const todo = capturado.join('\n');
    for (const parte of ['usuarioSecreto', 'senhaSecreta', 'ref-secreto-xyz', 'supabase.co', 'prod_db', ':5432']) {
      expect(todo).not.toContain(parte);
    }
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

// ─────────────────────────────────────────────────────────────────────────────
// Modo estrito — OPS-MIGRATIONS-03D GATE 4.
// Converte a regra invariante ("fallback para DATABASE_URL proibido em
// produção") de disciplina operacional em garantia de código.
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_URL = 'postgresql://u:p@host-exemplo:5432/db';
const TRANSACTION_URL = 'postgresql://u:p@host-exemplo:6543/db';

describe('run-migrations — isStrictMode (ativação)', () => {
  it('ativa por flag --strict (multiplataforma)', () => {
    expect(isStrictMode({}, ['node', 'run-migrations.js', '--strict'])).toBe(true);
  });

  it('ativa por MIGRATION_STRICT=1', () => {
    expect(isStrictMode({ MIGRATION_STRICT: '1' }, ['node', 'x'])).toBe(true);
  });

  it('permanece desligado por padrão (CI não é afetado)', () => {
    expect(isStrictMode({}, ['node', 'x'])).toBe(false);
    expect(isStrictMode({ MIGRATION_STRICT: '0' }, ['node', 'x'])).toBe(false);
    expect(isStrictMode({ MIGRATION_STRICT: 'true' }, ['node', 'x'])).toBe(false);
  });
});

describe('run-migrations — assertStrictEndpoint (invariante em código)', () => {
  it('aceita endpoint dedicado de sessão (5432)', () => {
    expect(() => assertStrictEndpoint(SESSION_URL, true)).not.toThrow();
  });

  it('REJEITA fallback para DATABASE_URL', () => {
    expect(() => assertStrictEndpoint(TRANSACTION_URL, false))
      .toThrow(/fallback proibido/);
    try { assertStrictEndpoint(TRANSACTION_URL, false); } catch (e) {
      expect(e.code).toBe('STRICT_REQUIRES_DEDICATED');
    }
  });

  it('REJEITA endpoint dedicado em modo transaction (6543)', () => {
    try { assertStrictEndpoint(TRANSACTION_URL, true); } catch (e) {
      expect(e.code).toBe('STRICT_REQUIRES_SESSION_PORT');
    }
    expect(() => assertStrictEndpoint(TRANSACTION_URL, true)).toThrow();
  });

  it('REJEITA URL inválida', () => {
    try { assertStrictEndpoint('nao-e-url', true); } catch (e) {
      expect(e.code).toBe('STRICT_INVALID_URL');
    }
  });

  // Achado 1 da auditoria do GATE 4A: porta ausente também é recusada.
  // Deliberado — num gate bloqueante, depender do default implícito do driver
  // torna a intenção ambígua.
  it('REJEITA porta AUSENTE (exige porta explícita)', () => {
    const semPorta = 'postgresql://u:p@host-exemplo/db';
    expect(() => assertStrictEndpoint(semPorta, true)).toThrow(/porta ausente/);
    try { assertStrictEndpoint(semPorta, true); } catch (e) {
      expect(e.code).toBe('STRICT_REQUIRES_SESSION_PORT');
    }
  });

  it('distingue porta ausente de porta errada na mensagem', () => {
    try { assertStrictEndpoint('postgresql://u:p@h/db', true); } catch (e) {
      expect(e.message).toMatch(/porta ausente/);
    }
    try { assertStrictEndpoint(TRANSACTION_URL, true); } catch (e) {
      expect(e.message).toMatch(/porta não é de sessão/);
    }
  });
});

describe('run-migrations — run() em modo estrito falha ANTES de conectar', () => {
  // Pool que explode se instanciado: prova que nenhuma conexão é tentada.
  class PoolProibido {
    constructor() { throw new Error('Pool não deveria ter sido construído'); }
  }

  it('sem MIGRATION_DATABASE_URL: falha STRICT_REQUIRES_DEDICATED sem conectar', async () => {
    await expect(run({
      PoolCtor: PoolProibido,
      env: { DATABASE_URL: TRANSACTION_URL, MIGRATION_STRICT: '1', NODE_ENV: 'test' },
    })).rejects.toMatchObject({ code: 'STRICT_REQUIRES_DEDICATED' });
  });

  it('com endpoint em 6543: falha STRICT_REQUIRES_SESSION_PORT sem conectar', async () => {
    await expect(run({
      PoolCtor: PoolProibido,
      env: { MIGRATION_DATABASE_URL: TRANSACTION_URL, MIGRATION_STRICT: '1', NODE_ENV: 'test' },
    })).rejects.toMatchObject({ code: 'STRICT_REQUIRES_SESSION_PORT' });
  });

  it('sem modo estrito, o fallback continua permitido (CI preservado)', async () => {
    // Não deve lançar erro de modo estrito; falha adiante, ao conectar.
    await expect(run({
      PoolCtor: PoolProibido,
      env: { DATABASE_URL: TRANSACTION_URL, NODE_ENV: 'test' },
      argv: [],
    })).rejects.not.toMatchObject({ code: 'STRICT_REQUIRES_DEDICATED' });
  });

  // Achado 3 da auditoria: argv é injetável — run() não depende de process.argv.
  it('ativa modo estrito por argv INJETADO (sem tocar process.argv)', async () => {
    await expect(run({
      PoolCtor: PoolProibido,
      env: { DATABASE_URL: TRANSACTION_URL, NODE_ENV: 'test' },
      argv: ['node', 'run-migrations.js', '--strict'],
    })).rejects.toMatchObject({ code: 'STRICT_REQUIRES_DEDICATED' });
  });

  it('argv injetado VAZIO neutraliza um --strict do processo hospedeiro', async () => {
    const argvOriginal = process.argv;
    process.argv = ['node', 'jest', '--strict']; // simula contaminação global
    try {
      await expect(run({
        PoolCtor: PoolProibido,
        env: { DATABASE_URL: TRANSACTION_URL, NODE_ENV: 'test' },
        argv: [], // injeção explícita vence o estado global
      })).rejects.not.toMatchObject({ code: 'STRICT_REQUIRES_DEDICATED' });
    } finally {
      process.argv = argvOriginal;
    }
  });
});

describe('run-migrations — códigos do modo estrito são sanitizáveis', () => {
  it('aparecem como código, nunca como mensagem crua', () => {
    ['STRICT_REQUIRES_DEDICATED', 'STRICT_INVALID_URL', 'STRICT_REQUIRES_SESSION_PORT']
      .forEach((code) => {
        const err = new Error(`vazamento ${SESSION_URL}`);
        err.code = code;
        const linha = formatFatal(err);
        expect(linha).toContain(`codigo=${code}`);
        expect(linha).not.toContain('host-exemplo');
        expect(linha).not.toContain('postgresql://');
      });
  });
});
