// tests/integration/helpers/test-database.js
// Database setup for integration tests with cleanup strategy
// Uses TEST_DATABASE_URL or DATABASE_URL with production guard

const { guardAgainstProduction, cleanupCompany } = require('../../helpers/test-db')

let pool = null

async function getTestPool() {
  if (pool) return pool

  guardAgainstProduction()

  const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error(
      'No test database configured. ' +
      'Set TEST_DATABASE_URL to run integration tests.'
    )
  }

  const { Client } = require('pg')
  const client = new Client({ connectionString: dbUrl })
  await client.connect()

  // Wrap client to match pool interface
  pool = {
    async query(text, params) {
      return client.query(text, params)
    },
    async end() {
      return client.end()
    },
  }

  return pool
}

async function insertCompany(companyData) {
  const db = await getTestPool()
  const result = await db.query(
    `INSERT INTO companies (id, name, niche_type, public_booking_slug, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      companyData.id,
      companyData.name,
      companyData.niche_type || 'barber',
      companyData.public_booking_slug,
      companyData.status || 'active',
    ]
  )
  return result.rows[0]
}

async function insertUser(userData) {
  const db = await getTestPool()
  const bcrypt = require('bcryptjs')
  const hashedPassword = await bcrypt.hash(userData.password || 'testpass123', 10)

  const result = await db.query(
    `INSERT INTO users (id, name, email, password_hash, role, company_id, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, email, role, company_id, is_active`,
    [
      userData.id,
      userData.name,
      userData.email,
      hashedPassword,
      userData.role,
      userData.company_id,
      userData.is_active !== false,
    ]
  )
  return result.rows[0]
}

async function insertSupplier(supplierData) {
  const db = await getTestPool()
  const result = await db.query(
    `INSERT INTO barber_suppliers (id, company_id, name, company_name, phone, email, is_active, is_deleted)
     VALUES ($1, $2, $3, $4, $5, $6, $7, false)
     RETURNING *`,
    [
      supplierData.id || require('crypto').randomUUID(),
      supplierData.company_id,
      supplierData.name,
      supplierData.company_name || null,
      supplierData.phone || null,
      supplierData.email || null,
      supplierData.is_active !== false,
    ]
  )
  return result.rows[0]
}

async function insertCollaborator(collabData) {
  const db = await getTestPool()
  const result = await db.query(
    `INSERT INTO barber_collaborators (id, company_id, nickname, commission_type, commission_rate, is_active, is_deleted, available_for_booking)
     VALUES ($1, $2, $3, $4, $5, $6, false, $7)
     RETURNING *`,
    [
      collabData.id || require('crypto').randomUUID(),
      collabData.company_id,
      collabData.name || collabData.nickname,
      collabData.commission_type || 'percentage',
      collabData.commission_rate ?? 10,
      collabData.is_active !== false,
      collabData.available_for_booking ?? false,
    ]
  )
  return result.rows[0]
}

async function insertService(serviceData) {
  const db = await getTestPool()
  const result = await db.query(
    `INSERT INTO barber_services (id, company_id, name, description, price, service_type, icon, commission_type, commission_value, estimated_time_minutes, is_active, is_deleted)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false)
     RETURNING *`,
    [
      serviceData.id || require('crypto').randomUUID(),
      serviceData.company_id,
      serviceData.name,
      serviceData.description || null,
      serviceData.price ?? 50,
      serviceData.service_type || 'service',
      serviceData.icon || 'scissors',
      serviceData.commission_type || 'percentage',
      serviceData.commission_value ?? 10,
      serviceData.estimated_time_minutes || 30,
      serviceData.is_active !== false,
    ]
  )
  return result.rows[0]
}

async function insertAppointment(apptData) {
  const db = await getTestPool()
  const result = await db.query(
    `INSERT INTO barber_appointments (id, company_id, service_id, collaborator_id, customer_name, customer_phone, customer_email, starts_at, ends_at, status, notes, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      apptData.id || require('crypto').randomUUID(),
      apptData.company_id,
      apptData.service_id,
      apptData.collaborator_id,
      apptData.customer_name,
      apptData.customer_phone,
      apptData.customer_email || null,
      apptData.starts_at,
      apptData.ends_at,
      apptData.status || 'scheduled',
      apptData.notes || null,
      apptData.source || 'test',
    ]
  )
  return result.rows[0]
}

async function activateModule(companyId, moduleSlug = 'barber') {
  const db = await getTestPool()
  await db.query(
    `INSERT INTO company_modules (company_id, module_id, status, activated_at)
     SELECT $1, modules.id, 'active', NOW()
     FROM modules
     WHERE modules.slug = $2
       AND modules.is_active = true
     ON CONFLICT (company_id, module_id) DO UPDATE
       SET status = 'active', activated_at = NOW()`,
    [companyId, moduleSlug]
  )
}

async function cleanupTestData(companyIds) {
  if (!companyIds || companyIds.length === 0) return

  const db = await getTestPool()
  for (const companyId of companyIds) {
    try {
      await cleanupCompany(db, companyId)
    } catch {
      // Ignore cleanup errors
    }
  }
}

async function shutdownTestPool() {
  if (pool) {
    try {
      await pool.end()
    } catch {
      // Ignore shutdown errors
    }
    pool = null
  }
}

module.exports = {
  getTestPool,
  insertCompany,
  insertUser,
  insertSupplier,
  insertCollaborator,
  insertService,
  insertAppointment,
  activateModule,
  cleanupTestData,
  shutdownTestPool,
}
