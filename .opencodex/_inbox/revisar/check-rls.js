const path = require('path');
process.chdir(path.resolve(__dirname, '../../backend'));
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    const { rows: migrations } = await pool.query(
      `SELECT version, name, applied_at FROM schema_migrations WHERE version LIKE '%026%' ORDER BY applied_at DESC`
    );
    console.log('Migration 026:', migrations.length > 0 ? 'APLICADA' : 'NAO APLICADA');
    console.log('  Detalhes:', JSON.stringify(migrations, null, 2));

    const { rows: roles } = await pool.query(
      `SELECT rolname, rolbypassrls, rolcanlogin FROM pg_roles WHERE rolname = 'app_runtime'`
    );
    console.log('Role app_runtime:', roles.length > 0 ? 'EXISTE' : 'NAO EXISTE');
    if (roles.length > 0) {
      console.log('  Detalhes:', JSON.stringify(roles[0], null, 2));
    }

    const { rows: user } = await pool.query('SELECT current_user, (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS bypass');
    console.log('Conexao atual:', JSON.stringify(user[0], null, 2));

    if (process.env.APP_RUNTIME_URL) {
      try {
        const rtPool = new Pool({ connectionString: process.env.APP_RUNTIME_URL, max: 1, ssl: { rejectUnauthorized: false } });
        const { rows: rtUser } = await rtPool.query('SELECT current_user, (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS bypass');
        console.log('app_runtime conectado:', JSON.stringify(rtUser[0], null, 2));
        await rtPool.end();
      } catch(e) {
        console.log('app_runtime FALHOU ao conectar:', e.message);
      }
    } else {
      console.log('APP_RUNTIME_URL: NAO CONFIGURADA');
    }

    const { rows: loginRoles } = await pool.query(
      `SELECT rolname, rolbypassrls, rolcanlogin FROM pg_roles WHERE rolcanlogin = true ORDER BY rolname`
    );
    console.log('\nRoles com login disponiveis:');
    loginRoles.forEach(r => console.log('  ' + r.rolname + ' (bypassRLS: ' + r.rolbypassrls + ')'));

    await pool.end();
  } catch(e) {
    console.log('ERRO:', e.message);
  }
})();
