const { Pool } = require('pg')

const TEST_SCHEMAS = [
  'companies', 'modules', 'company_modules', 'users', 'collaborator_contracts',
  'barber_services', 'barber_products', 'barber_customers', 'barber_collaborators',
  'barber_sales', 'barber_sale_items', 'barber_commissions',
  'barber_settlements', 'barber_advances', 'barber_cash_sessions', 'barber_cash_movements',
  'barber_appointments', 'barber_booking_settings', 'barber_booking_blocks',
  'barber_booking_landing', 'barber_client_notes', 'barber_client_events', 'barber_client_tags',
  'schema_migrations', 'outbox_messages',
  'integration_configs', 'integration_events', 'payment_gateway_events',
  'auth_audit_logs',
  'company_wallets', 'wallet_transactions', 'topup_requests',
  'customer_packages', 'package_redemptions', 'service_packages',
  'customer_loyalty', 'loyalty_transactions', 'loyalty_programs',
  'anamnesis_templates', 'anamnesis_responses',
  'first_access_tokens', 'password_reset_tokens', 'pin_reset_tokens', 'email_verification_tokens'
]

function createTestPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 5000,
  })
}

async function setupTestDatabase(pool) {
  const dbUrl = process.env.DATABASE_URL || ''
  if (!dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1') && !dbUrl.includes('host.docker.internal')) {
    throw new Error('Test database must be on localhost. Current: ' + dbUrl.replace(/\/\/[^@]+@/, '//[REDACTED]@'))
  }
}

async function cleanupDatabase(pool) {
  for (const table of TEST_SCHEMAS) {
    try {
      await pool.query(`DELETE FROM ${table}`)
    } catch {
      // Table may not exist — skip
    }
  }
}

async function closeTestPool(pool) {
  await pool.end()
}

module.exports = {
  createTestPool,
  setupTestDatabase,
  cleanupDatabase,
  closeTestPool,
}
