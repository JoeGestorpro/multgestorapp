const { appLogger } = require('../shared/core/logger');
const { Pool } = require('pg');

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
  // SSL apenas fora de testes locais: Postgres CI container não tem SSL habilitado
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

/**
 * Executa uma função dentro de um contexto de tenant (RLS).
 * Define app.current_company_id via SET LOCAL, que reseta automaticamente
 * ao fim da transação.
 */
async function withTenantContext(client, companyId, fn) {
  if (!companyId) {
    throw new Error('companyId obrigatorio para withTenantContext');
  }
  await client.query('SET LOCAL app.current_company_id = $1', [companyId]);
  return fn(client);
}

pool.withTenantContext = withTenantContext;

module.exports = pool;
