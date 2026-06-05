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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'test' ? false : { rejectUnauthorized: false },
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
  await client.query('SET LOCAL app.current_company_id = $1', [companyId]);
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

  // Forma promise — await pool.connect() (services/UoW): aplica o wrap tenant/RLS.
  const store = tenantStore.getStore();
  const companyId = store?.companyId;

  return _originalConnect().then((client) => {
    if (!companyId) {
      return client;
    }

    const originalQuery = client.query.bind(client);
    let gucSet = false;

    client.query = async function wrappedQuery(...args) {
      const sql = typeof args[0] === 'string' ? args[0] : (args[0]?.text || '');
      const result = await originalQuery(...args);

      if (!gucSet && BEGIN_RE.test(sql)) {
        gucSet = true;
        await originalQuery('SET LOCAL app.current_company_id = $1', [companyId]);
      }

      return result;
    };

    return client;
  });
};

module.exports = pool;
module.exports.tenantStore = tenantStore;
module.exports.runWithTenantClient = runWithTenantClient;
module.exports._originalQuery = _originalQuery;
module.exports._originalConnect = _originalConnect;
