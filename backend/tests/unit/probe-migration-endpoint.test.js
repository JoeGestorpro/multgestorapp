'use strict';

const {
  main,
  runProbe,
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
      env: { MIGRATION_DATABASE_URL: SAFE_URL, NODE_ENV: 'test' },
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
      env: { MIGRATION_DATABASE_URL: SAFE_URL, NODE_ENV: 'test' },
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
      env: { MIGRATION_DATABASE_URL: SAFE_URL, NODE_ENV: 'test' },
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
      env: { MIGRATION_DATABASE_URL: SAFE_URL, NODE_ENV: 'test' },
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
      env: { MIGRATION_DATABASE_URL: SAFE_URL, NODE_ENV: 'test' },
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
      env: { MIGRATION_DATABASE_URL: SAFE_URL, NODE_ENV: 'test' },
      logger,
    });

    const output = lines.join('\n');
    expect(output).toContain('codigo=ERRO_NAO_MAPEADO');
    expect(output).not.toContain('probe_password');
    expect(output).not.toContain('session.example.invalid');
    expect(output).not.toContain('postgresql://');
  });
});
