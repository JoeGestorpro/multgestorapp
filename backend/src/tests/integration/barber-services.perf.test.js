const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '..', '.env'), quiet: true });

const pool = require('../../config/database');

let testCompanyId = null;

async function setup() {
  const result = await pool.query(
    `INSERT INTO companies (name, public_booking_slug)
     VALUES ($1, $2)
     RETURNING id`,
    ['Repo Pilot Perf Test', 'repo-pilot-perf-' + Date.now()]
  );
  testCompanyId = result.rows[0].id;

  for (let i = 0; i < 100; i++) {
    await pool.query(
      `INSERT INTO barber_services (company_id, name, price, service_type, commission_type, commission_value, is_active)
       VALUES ($1, $2, $3, 'service', 'percentage', 10, $4)`,
      [testCompanyId, `Service ${i}`, i * 10, i % 2 === 0]
    );
  }
}

async function cleanup() {
  if (testCompanyId) {
    await pool.query('DELETE FROM barber_services WHERE company_id = $1', [testCompanyId]);
    await pool.query('DELETE FROM companies WHERE id = $1', [testCompanyId]);
  }
}

async function explain(label, query, params) {
  const result = await pool.query(`EXPLAIN (ANALYZE, COSTS, BUFFERS, FORMAT TEXT) ${query}`, params);
  console.log(`\n[${label}]`);
  console.log(result.rows.map(r => '  ' + r['QUERY PLAN']).join('\n'));
}

async function run() {
  console.log('========================================');
  console.log('Repository Pilot — Performance (EXPLAIN ANALYZE)');
  console.log('========================================');

  try {
    await setup();
    console.log(`\nSetup: company_id=${testCompanyId}, 100 services inserted`);

    await explain(
      'findAll (sem filtro)',
      `SELECT id, company_id, name, description, price,
              service_type, icon, commission_type,
              commission_value, estimated_time_minutes,
              is_active, is_deleted, created_at, updated_at
       FROM barber_services
       WHERE company_id = $1
         AND COALESCE(is_deleted, false) = false
       ORDER BY is_active DESC, created_at DESC`,
      [testCompanyId]
    );

    await explain(
      'findById (PK + tenant)',
      `SELECT id, company_id, name, description, price,
              service_type, icon, commission_type,
              commission_value, estimated_time_minutes,
              is_active, is_deleted, created_at, updated_at
       FROM barber_services
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       LIMIT 1`,
      ['00000000-0000-0000-0000-000000000000', testCompanyId]
    );

    await explain(
      'findAll com status = active',
      `SELECT id, company_id, name, description, price,
              service_type, icon, commission_type,
              commission_value, estimated_time_minutes,
              is_active, is_deleted, created_at, updated_at
       FROM barber_services
       WHERE company_id = $1
         AND COALESCE(is_deleted, false) = false
         AND is_active = true
       ORDER BY is_active DESC, created_at DESC`,
      [testCompanyId]
    );

    await explain(
      'findAll com search (ILIKE)',
      `SELECT id, company_id, name, description, price,
              service_type, icon, commission_type,
              commission_value, estimated_time_minutes,
              is_active, is_deleted, created_at, updated_at
       FROM barber_services
       WHERE company_id = $1
         AND COALESCE(is_deleted, false) = false
         AND (
           name ILIKE $2
           OR COALESCE(description, '') ILIKE $2
         )
       ORDER BY is_active DESC, created_at DESC`,
      [testCompanyId, '%Service 5%']
    );

    await explain(
      'count',
      `SELECT COUNT(*)::int AS total
       FROM barber_services
       WHERE company_id = $1
         AND COALESCE(is_deleted, false) = false`,
      [testCompanyId]
    );

    await explain(
      'update (tenant-scoped)',
      `UPDATE barber_services
       SET name = $3, updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       RETURNING id`,
      ['00000000-0000-0000-0000-000000000000', testCompanyId, 'Updated']
    );

    await explain(
      'softDelete (tenant-scoped)',
      `UPDATE barber_services
       SET is_deleted = true, is_active = false, updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       RETURNING id`,
      ['00000000-0000-0000-0000-000000000000', testCompanyId]
    );

  } finally {
    await cleanup();
  }

  await pool.end();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
