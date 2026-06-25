// tests/helpers/test-db.js
// Database utilities for tests — with PRODUCTION PROTECTION

const PRODUCTION_INDICATORS = [
  'supabase.co',
  'supabase.com',
  'production',
  'prod-db',
]

function guardAgainstProduction() {
  if (process.env.SUPABASE_TEST_ALLOW === 'true') return
  const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || ''

  if (!dbUrl) {
    throw new Error(
      'TEST_DATABASE_URL or DATABASE_URL is not set. ' +
      'Tests require an isolated database. ' +
      'Set TEST_DATABASE_URL to a dedicated test database.'
    )
  }

  const lower = dbUrl.toLowerCase()
  const isProduction = PRODUCTION_INDICATORS.some((indicator) =>
    lower.includes(indicator)
  )

  if (isProduction) {
    throw new Error(
      'FATAL: Test attempted to connect to production database. ' +
      'DATABASE_URL contains production indicator. ' +
      'Set TEST_DATABASE_URL to an isolated test database. ' +
      'URL: ' + dbUrl.replace(/\/\/[^@]+@/, '//[REDACTED]@')
    )
  }
}

async function cleanupCompany(pool, companyId) {
  if (!companyId) return

  const tables = [
    'barber_sales',
    'barber_appointments',
    'barber_services',
    'barber_collaborators',
    'barber_suppliers',
    'barber_products',
    'barber_cash_sessions',
    'barber_cash_movements',
    'barber_advances',
    'barber_settlements',
    'barber_booking_settings',
    'barber_booking_blocks',
    'barber_booking_landing',
    'barber_client_notes',
    'barber_client_events',
    'barber_client_tags',
    'company_modules',
    'first_access_tokens',
    'password_reset_tokens',
    'pin_reset_tokens',
    'email_verification_tokens',
    'auth_audit_logs',
    'barber_audit_logs',
    'users',
    'companies',
  ]

  for (const table of tables) {
    try {
      await pool.query(
        `DELETE FROM ${table} WHERE company_id = $1`,
        [companyId]
      )
    } catch {
      // Table may not exist — skip silently
    }
  }
}

async function cleanupEmails(pool, emails) {
  if (!emails || emails.length === 0) return

  try {
    await pool.query('DELETE FROM auth_audit_logs WHERE email = ANY($1)', [emails])
    await pool.query('DELETE FROM users WHERE email = ANY($1)', [emails])
  } catch {
    // Tables may not exist
  }
}

async function cleanupModules(pool, slugs) {
  if (!slugs || slugs.length === 0) return

  for (const slug of slugs) {
    try {
      await pool.query('DELETE FROM modules WHERE slug = $1', [slug])
    } catch {
      // Module may not exist
    }
  }
}

module.exports = {
  guardAgainstProduction,
  cleanupCompany,
  cleanupEmails,
  cleanupModules,
}
