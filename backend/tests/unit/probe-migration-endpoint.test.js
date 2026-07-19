'use strict';

const fs = require('fs');
const path = require('path');
const {
  main,
  runProbe,
  shouldRunProbe,
  validateEndpoint,
  PROBE_LOCK_KEY,
} = require('../../scripts/probe-migration-endpoint');

const SAFE_URL = 'postgresql://probe_user:probe_password@session.example.invalid:5432/probe_db';

function createLogger() {
  const lines = [];
  return {
    lines,
    logger: {
      log: jest.fn((line) => lines.push(String(line))),
      error: jest.fn((line) => lines.push(String(line))),
    },
  };
}

function createClientDouble({
  connectError,
  lockAcquired = true,
  unlockSucceeded = true,
  endError,
} = {}) {
  const instances = [];

  class ClientDouble {
    constructor(config) {
      this.config = config;
      this.queries = [];
      this.connect = jest.fn(async () => {
        if (connectError) throw connectError;
      });
      this.query = jest.fn(async (sql, params) => {
        this.queries.push({ sql, params });
        if (sql === 'SELECT 1') return { rows: [{ '?column?': 1 }] };
        if (sql === 'SELECT pg_try_advisory_lock($1) AS ok') {
          return { rows: [{ ok: lockAcquired }] };
        }
        if (sql === 'SELECT pg_advisory_unlock($1) AS ok') {
          return { rows: [{ ok: unlockSucceeded }] };
        }
        throw new Error('SQL não permitido no probe');
      });
      this.end = jest.fn(async () => {
        if (endError) throw endError;
      });
      instances.push(this);
    }
  }

  return { ClientDouble, instances };
}

describe('probe-migration-endpoint — validação fail-closed', () => {
  it('exige MIGRATION_DATABASE_URL e nunca lê DATABASE_URL como fallback', async () => {
    const { ClientDouble, instances } = createClientDouble();
    const { logger } = createLogger();
    const env = new Proxy({}, {
      get(target, prop) {
        if (prop === 'DATABASE_URL') throw new Error('DATABASE_URL foi acessada');
        return target[prop];
      },
    });

    await expect(runProbe({ ClientCtor: ClientDouble, env, logger }))
      .rejects.toMatchObject({ code: 'NO_MIGRATION_URL' });
    expect(instances).toHaveLength(0);
  });

  it('rejeita endpoint cuja porta explícita não é 5432 antes de conectar', async () => {
    const { ClientDouble, instances } = createClientDouble();
    const { logger } = createLogger();

    await expect(runProbe({
      ClientCtor: ClientDouble,
      env: { MIGRATION_DATABASE_URL: SAFE_URL.replace(':5432/', ':6543/'), NODE_ENV: 'test' },
      logger,
    })).rejects.toMatchObject({ code: 'ENDPOINT_INVALIDO' });

    expect(validateEndpoint(SAFE_URL.replace(':5432/', ':6543/')))
      .toEqual({ ok: false, motivo: 'PORTA_NAO_5432' });
    expect(instances).toHaveLength(0);
  });

  it('rejeita protocolo diferente de PostgreSQL antes de conectar', async () => {
    const { ClientDouble, instances } = createClientDouble();
    const { logger } = createLogger();

    await expect(runProbe({
      ClientCtor: ClientDouble,
      env: { MIGRATION_DATABASE_URL: 'https://example.invalid:5432/probe_db', NODE_ENV: 'test' },
      logger,
    })).rejects.toMatchObject({ code: 'ENDPOINT_INVALIDO' });

    expect(instances).toHaveLength(0);
  });

  it('falha quando a conexão falha, fecha o client e não vaza a mensagem crua', async () => {
    const secret = 'probe_password';
    const err = Object.assign(
      new Error(`connect ECONNREFUSED ${SAFE_URL} ${secret}`),
      { code: 'ECONNREFUSED' }
    );
    const { ClientDouble, instances } = createClientDouble({ connectError: err });
    const { logger, lines } = createLogger();

    await expect(main({
      ClientCtor: ClientDouble,
      env: { MIGRATION_DATABASE_URL: SAFE_URL, NODE_ENV: 'test', RENDER: 'true' },
      logger,
    })).resolves.toBe(1);

    expect(instances).toHaveLength(1);
    expect(instances[0].end).toHaveBeenCalledTimes(1);
    const output = lines.join('\n');
    expect(output).toContain('codigo=ECONNREFUSED');
    expect(output).not.toContain(secret);
    expect(output).not.toContain('session.example.invalid');
    expect(output).not.toContain('postgresql://');
  });

  it('falha quando o advisory lock dedicado não é adquirido', async () => {
    const { ClientDouble, instances } = createClientDouble({ lockAcquired: false });
    const { logger } = createLogger();

    await expect(runProbe({
      ClientCtor: ClientDouble,
      env: { MIGRATION_DATABASE_URL: SAFE_URL, NODE_ENV: 'test', RENDER: 'true' },
      logger,
    })).rejects.toMatchObject({ code: 'LOCK_NOT_ACQUIRED' });

    expect(instances[0].queries).toEqual([
      { sql: 'SELECT 1', params: undefined },
      { sql: 'SELECT pg_try_advisory_lock($1) AS ok', params: [PROBE_LOCK_KEY] },
    ]);
    expect(instances[0].end).toHaveBeenCalledTimes(1);
  });

  it('executa somente SELECT 1, lock e unlock e fecha o client no sucesso', async () => {
    const { ClientDouble, instances } = createClientDouble();
    const { logger, lines } = createLogger();

    await expect(runProbe({
      ClientCtor: ClientDouble,
      env: { MIGRATION_DATABASE_URL: SAFE_URL, NODE_ENV: 'test', RENDER: 'true' },
      logger,
    })).resolves.toBeUndefined();

    expect(instances[0].queries).toEqual([
      { sql: 'SELECT 1', params: undefined },
      { sql: 'SELECT pg_try_advisory_lock($1) AS ok', params: [PROBE_LOCK_KEY] },
      { sql: 'SELECT pg_advisory_unlock($1) AS ok', params: [PROBE_LOCK_KEY] },
    ]);
    expect(instances[0].end).toHaveBeenCalledTimes(1);
    expect(lines.join('\n')).not.toContain('probe_password');
    expect(lines.join('\n')).not.toContain('session.example.invalid');
    expect(lines.join('\n')).not.toContain('postgresql://');
  });

  it('falha se o lock não puder ser liberado', async () => {
    const { ClientDouble, instances } = createClientDouble({ unlockSucceeded: false });
    const { logger } = createLogger();

    await expect(runProbe({
      ClientCtor: ClientDouble,
      env: { MIGRATION_DATABASE_URL: SAFE_URL, NODE_ENV: 'test', RENDER: 'true' },
      logger,
    })).rejects.toMatchObject({ code: 'LOCK_RELEASE_FAILED' });
    expect(instances[0].end).toHaveBeenCalledTimes(1);
  });

  it('falha se o client não puder ser fechado', async () => {
    const err = Object.assign(new Error(`close failed ${SAFE_URL}`), { code: 'EPIPE' });
    const { ClientDouble } = createClientDouble({ endError: err });
    const { logger, lines } = createLogger();

    await expect(main({
      ClientCtor: ClientDouble,
      env: { MIGRATION_DATABASE_URL: SAFE_URL, NODE_ENV: 'test', RENDER: 'true' },
      logger,
    })).resolves.toBe(1);
    expect(lines.join('\n')).toContain('codigo=EPIPE');
    expect(lines.join('\n')).not.toContain(SAFE_URL);
  });

  it('não carrega o runner nem a lista de migrations', () => {
    const runnerPath = require.resolve('../../scripts/run-migrations');
    expect(require.cache[runnerPath]).toBeUndefined();
  });

  it('não vaza URI ou segredo para código de erro não mapeado', async () => {
    const maliciousCode = `UNKNOWN_${SAFE_URL}_probe_password`;
    const err = Object.assign(new Error(SAFE_URL), { code: maliciousCode });
    const { ClientDouble } = createClientDouble({ connectError: err });
    const { logger, lines } = createLogger();

    await main({
      ClientCtor: ClientDouble,
      env: { MIGRATION_DATABASE_URL: SAFE_URL, NODE_ENV: 'test', RENDER: 'true' },
      logger,
    });

    const output = lines.join('\n');
    expect(output).toContain('codigo=ERRO_NAO_MAPEADO');
    expect(output).not.toContain('probe_password');
    expect(output).not.toContain('session.example.invalid');
    expect(output).not.toContain('postgresql://');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Guard de ambiente + wiring temporário via postinstall (03D GATE 3).
// ─────────────────────────────────────────────────────────────────────────────

describe('probe — guard de ambiente (shouldRunProbe)', () => {
  it('só é verdadeiro com RENDER exatamente "true"', () => {
    expect(shouldRunProbe({ RENDER: 'true' })).toBe(true);
    expect(shouldRunProbe({ RENDER: 'false' })).toBe(false);
    expect(shouldRunProbe({ RENDER: '1' })).toBe(false);
    expect(shouldRunProbe({ RENDER: true })).toBe(true); // coerção para "true"
    expect(shouldRunProbe({})).toBe(false);
  });
});

describe('probe — FORA do Render: no-op absoluto', () => {
  // Proxy que EXPLODE se qualquer segredo for lido. Prova, de forma ativa,
  // que o guard corta antes de tocar em MIGRATION_DATABASE_URL/DATABASE_URL.
  function envQueExplode(extra = {}) {
    const base = { NODE_ENV: 'test', ...extra };
    return new Proxy(base, {
      get(target, prop) {
        if (prop === 'MIGRATION_DATABASE_URL' || prop === 'DATABASE_URL') {
          throw new Error(`${String(prop)} foi lida fora do Render`);
        }
        return target[prop];
      },
    });
  }

  it('não lê MIGRATION_DATABASE_URL, não cria Client, não conecta e sai com 0', async () => {
    const { ClientDouble, instances } = createClientDouble();
    const { logger, lines } = createLogger();

    await expect(main({
      ClientCtor: ClientDouble,
      env: envQueExplode(),
      logger,
    })).resolves.toBe(0);

    expect(instances).toHaveLength(0);              // nenhum Client construído
    expect(lines.join('\n')).toContain('no-op');    // registrou o desvio
  });

  it('permanece no-op mesmo com RENDER definido com outro valor', async () => {
    const { ClientDouble, instances } = createClientDouble();
    const { logger } = createLogger();

    await expect(main({
      ClientCtor: ClientDouble,
      env: envQueExplode({ RENDER: 'false' }),
      logger,
    })).resolves.toBe(0);

    expect(instances).toHaveLength(0);
  });

  it('no-op não emite nada além da linha de desvio (sem endpoint/segredo)', async () => {
    const { ClientDouble } = createClientDouble();
    const { logger, lines } = createLogger();

    await main({ ClientCtor: ClientDouble, env: envQueExplode(), logger });

    const output = lines.join('\n');
    expect(output).not.toContain('conectando');
    expect(output).not.toContain('postgresql://');
    expect(output).not.toContain('probe_password');
    expect(output).not.toContain('session.example.invalid');
  });
});

describe('probe — DENTRO do Render: fail-closed preservado', () => {
  const envRender = (extra = {}) => ({ NODE_ENV: 'test', RENDER: 'true', ...extra });

  it('executa o probe e sai com 0 no sucesso', async () => {
    const { ClientDouble, instances } = createClientDouble();
    const { logger, lines } = createLogger();

    await expect(main({
      ClientCtor: ClientDouble,
      env: envRender({ MIGRATION_DATABASE_URL: SAFE_URL }),
      logger,
    })).resolves.toBe(0);

    expect(instances).toHaveLength(1);              // conectou de verdade
    expect(lines.join('\n')).toContain('OK');
  });

  it('variável ausente → exit 1 (fail-closed, sem fallback)', async () => {
    const { ClientDouble, instances } = createClientDouble();
    const { logger, lines } = createLogger();

    await expect(main({
      ClientCtor: ClientDouble,
      env: envRender(),
      logger,
    })).resolves.toBe(1);

    expect(instances).toHaveLength(0);
    expect(lines.join('\n')).toContain('codigo=NO_MIGRATION_URL');
  });

  it('porta errada → exit 1 antes de conectar', async () => {
    const { ClientDouble, instances } = createClientDouble();
    const { logger, lines } = createLogger();

    await expect(main({
      ClientCtor: ClientDouble,
      env: envRender({ MIGRATION_DATABASE_URL: SAFE_URL.replace(':5432/', ':6543/') }),
      logger,
    })).resolves.toBe(1);

    expect(instances).toHaveLength(0);
    expect(lines.join('\n')).toContain('codigo=ENDPOINT_INVALIDO');
  });

  it('lock negado → exit 1 e nenhum segredo/endpoint logado', async () => {
    const { ClientDouble } = createClientDouble({ lockAcquired: false });
    const { logger, lines } = createLogger();

    await expect(main({
      ClientCtor: ClientDouble,
      env: envRender({ MIGRATION_DATABASE_URL: SAFE_URL }),
      logger,
    })).resolves.toBe(1);

    const output = lines.join('\n');
    expect(output).toContain('codigo=LOCK_NOT_ACQUIRED');
    expect(output).not.toContain('probe_password');
    expect(output).not.toContain('session.example.invalid');
    expect(output).not.toContain('postgresql://');
    expect(output).not.toContain('probe_db');
  });
});

describe('wiring temporário — postinstall', () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '..', '..', 'package.json'), 'utf8')
  );

  it('postinstall aponta para o probe', () => {
    expect(pkg.scripts.postinstall).toBe('node scripts/probe-migration-endpoint.js');
  });

  it('não altera start nem migrate (wiring isolado)', () => {
    expect(pkg.scripts.start).toBe('node src/server.js');
    expect(pkg.scripts.migrate).toBe('node scripts/run-migrations.js');
  });

  it('o probe invocado pelo postinstall tem o guard — CI não quebra', () => {
    const fonte = fs.readFileSync(
      path.resolve(__dirname, '..', '..', 'scripts', 'probe-migration-endpoint.js'),
      'utf8'
    );
    expect(fonte).toMatch(/shouldRunProbe/);
    expect(fonte).toMatch(/RENDER/);
  });
});
