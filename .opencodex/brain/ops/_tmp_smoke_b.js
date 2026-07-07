require('dotenv').config({ path: require('path').resolve(__dirname, '../../backend/.env') });
const pool = require('../../backend/src/config/database');
(async () => {
  try {
    console.log('[B1] schema_migrations...');
    let r = await pool.query('SELECT count(*)::int AS total FROM schema_migrations');
    const totalMigrations = r.rows[0].total;
    r = await pool.query('SELECT version, name, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 3');
    console.log(`  total=${totalMigrations}, ultimas3=${r.rows.map(x => x.version).join(', ')}`);
    console.log('[B2] plans...');
    r = await pool.query('SELECT count(*)::int AS total FROM plans');
    console.log(`  total=${r.rows[0].total}`);
    console.log('[B3] companies (JoeFelipe)...');
    r = await pool.query("SELECT plan_type, is_active FROM companies WHERE id = 'ed607874-0520-4227-b2d6-5a98e868d329'");
    if (r.rows.length > 0) console.log(`  plan_type=${r.rows[0].plan_type}, is_active=${r.rows[0].is_active}`);
    else console.log('  NOT FOUND');
    console.log('[B4] outbox failed...');
    r = await pool.query("SELECT count(*)::int AS total FROM outbox_messages WHERE status = 'failed'");
    console.log(`  total=${r.rows[0].total}`);
    console.log('[B5] refresh_tokens exists...');
    r = await pool.query("SELECT count(*)::int AS total FROM refresh_tokens");
    console.log(`  total=${r.rows[0].total}`);
    console.log('[B6] appointments since deploy...');
    r = await pool.query("SELECT count(*)::int AS total FROM barber_appointments WHERE created_at > '2026-07-04T16:26:00Z'");
    console.log(`  total=${r.rows[0].total}`);
  } catch (err) { console.error('ERRO:', err.message); }
  await pool.end().catch(() => {});
})();
