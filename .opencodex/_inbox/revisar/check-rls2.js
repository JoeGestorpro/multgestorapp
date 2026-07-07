const module = require('module');
const path = require('path');
const backendDir = path.resolve(__dirname, '../../backend');
process.chdir(backendDir);
process.env.NODE_PATH = backendDir + '/node_modules';
require('module').Module._initPaths();
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const r1 = await pool.query("SELECT rolname, rolcanlogin, rolsuper, rolinherit, rolbypassrls FROM pg_roles WHERE rolname = 'app_runtime'");
    console.log('Role app_runtime:', JSON.stringify(r1.rows[0], null, 2));

    try {
      const p2 = new Pool({connectionString:'postgresql://app_runtime:app_runtime@db.mfayajizbkqkcbhqmean.supabase.co:6543/postgres?pgbouncer=true', ssl:{rejectUnauthorized:false}, max:1});
      const r2 = await p2.query('SELECT current_user');
      console.log('Porta 6543 conectou:', JSON.stringify(r2.rows[0]));
      await p2.end();
    } catch(e) { console.log('Porta 6543 falhou:', e.message); }

    await pool.end();
  } catch(e) { console.log('ERRO:', e.message); }
})();
