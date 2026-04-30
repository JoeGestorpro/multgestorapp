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
  ssl: {
    rejectUnauthorized: false
  }
});

let hasLoggedDatabaseTarget = false;

pool.on('connect', () => {
  if (!hasLoggedDatabaseTarget) {
    hasLoggedDatabaseTarget = true;
    console.log(`[database] conectado em ${databaseTarget.label}`);
  }
});

pool.getDatabaseTargetSummary = getDatabaseTargetSummary;

module.exports = pool;
