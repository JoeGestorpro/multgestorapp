'use strict';

const { AsyncLocalStorage } = require('async_hooks');
const { appLogger } = require('../shared/core/logger');
const { Pool } = require('pg');

const tenantStore = new AsyncLocalStorage();

function getDatabaseTargetSummary() {
  const rawConnectionString = String(process.env.DATABASE_URL || '').trim();

  if (!rawConnectionString) {
    return {
      engine: 'postgresql',
      configured: false,
      label: 'DATABASE_URL nao configurada'
    };
  }

  try {
    const parsed = new URL(rawConnectionString);
    const databaseName = parsed.pathname.replace(/^\/+/, '') || '(sem nome)';

    return {
      engine: 'postgresql',
      configured: true,
      host: parsed.hostname || '(sem host)',
      port: parsed.port || '5432',
      database: databaseName,
      label: `${parsed.hostname || '(sem host)'}:${parsed.port || '5432'}/${databaseName}`
    };
  } catch (error) {
    return {
      engine: 'postgresql',
      configured: true,
      label: 'DATABASE_URL invalida'
    };
  }
}

const databaseTarget = getDatabaseTargetSummary();

// TLS: com DATABASE_SSL_CA (PEM inline, \n escapado) ou DATABASE_SSL_CA_PATH
// (arquivo .crt), a verificação de certificado é ativada (rejectUnauthorized:
// true). Sem CA configurado, mantém o comportamento anterior com warning.
// Path configurado mas ilegível = erro de boot (fail-fast, nunca degradar TLS
// silenciosamente).
function buildSslConfig() {
  if (process.env.NODE_ENV === 'test') return false;

  let ca = null;
  if (process.env.DATABASE_SSL_CA) {
    ca = process.env.DATABASE_SSL_CA.replace(/\\n/g, '\n');
  } else if (process.env.DATABASE_SSL_CA_PATH) {
    ca = require('fs').readFileSync(process.env.DATABASE_SSL_CA_PATH, 'utf8');
  }

  if (ca) {
    return { ca, rejectUnauthorized: true };
  }

  appLogger.warn('[database] TLS sem verificação de certificado — configure DATABASE_SSL_CA ou DATABASE_SSL_CA_PATH');
  return { rejectUnauthorized: false };
}

const sslConfig = buildSslConfig();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
});

// poolTenant: usa APP_RUNTIME_URL (role app_runtime, NOBYPASSRLS) em prod/CI.
// Sem APP_RUNTIME_URL configurada, cai em DATABASE_URL e RLS permanece inerte.
if (!process.env.APP_RUNTIME_URL) {
  appLogger.warn('[database] APP_RUNTIME_URL não configurada — poolTenant usando DATABASE_URL; RLS pode permanecer inerte');
}
const poolTenant = new Pool({
  connectionString: process.env.APP_RUNTIME_URL || process.env.DATABASE_URL,
  ssl: sslConfig,
});

let hasLoggedDatabaseTarget = false;

pool.on('connect', () => {
  if (!hasLoggedDatabaseTarget) {
    hasLoggedDatabaseTarget = true;
    appLogger.info({ target: databaseTarget.label }, '[database] conectado');
  }
});

pool.getDatabaseTargetSummary = getDatabaseTargetSummary;

const _originalQuery = pool.query.bind(pool);

pool.query = function tenantAwareQuery(...args) {
  const store = tenantStore.getStore();
  if (store?.client) {
    return store.client.query(...args);
  }
  return _originalQuery(...args);
};

async function withTenantContext(client, companyId, fn) {
  if (!companyId) {
    throw new Error('companyId obrigatorio para withTenantContext');
  }
  await client.query('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyId)]);
  return fn(client);
}

pool.withTenantContext = withTenantContext;

function runWithTenantClient(client, companyIdOrFn, maybeFn) {
  let companyId, fn;
  if (typeof companyIdOrFn === 'function') {
    fn = companyIdOrFn;
    companyId = null;
  } else {
    companyId = companyIdOrFn;
    fn = maybeFn;
  }
  return tenantStore.run({ client, companyId }, fn);
}

const _originalConnect = pool.connect.bind(pool);
const BEGIN_RE = /^\s*(BEGIN|START\s+TRANSACTION)\b/i;

pool.connect = function tenantAwareConnect(cb) {
  // Forma callback — usada INTERNAMENTE pelo pg em Pool.query (this.connect((err, client) => ...)).
  // Delega ao connect original; queries avulsas do pool não abrem transação tenant, então não há wrap.
  // (Sem isto, o callback nunca é chamado e TODO pool.query trava — bug do override anterior.)
  if (typeof cb === 'function') {
    return _originalConnect(cb);
  }

  // Forma promise — await pool.connect() (services/UoW).
  const store = tenantStore.getStore();
  const companyId = store?.companyId;

  // Sem contexto tenant (auth, master, jobs): pool privilegiado, sem wrap.
  if (!companyId) {
    return _originalConnect();
  }

  // Com contexto tenant: conexão sai do poolTenant (app_runtime, NOBYPASSRLS),
  // fechando o bypass residual de RLS em writes transacionais (PATH-C do Gate 0).
  // O GUC é transaction-local: só é injetado após BEGIN.
  return poolTenant.connect().then((client) => {
    const originalQuery = client.query.bind(client);
    let gucSet = false;

    client.query = async function wrappedQuery(...args) {
      const sql = typeof args[0] === 'string' ? args[0] : (args[0]?.text || '');
      const result = await originalQuery(...args);

      if (!gucSet && BEGIN_RE.test(sql)) {
        gucSet = true;
        await originalQuery('SELECT set_config($1, $2, true)', ['app.current_company_id', String(companyId)]);
      }

      return result;
    };

    return client;
  });
};

module.exports = pool;
module.exports.poolTenant = poolTenant;
module.exports.tenantStore = tenantStore;
module.exports.runWithTenantClient = runWithTenantClient;
module.exports._originalQuery = _originalQuery;
module.exports._originalConnect = _originalConnect;
