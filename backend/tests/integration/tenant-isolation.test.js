// tests/integration/tenant-isolation.test.js
// BLOCO 2A — Multi-Tenant Security Foundation
// Validates that no company can access data from another company

const crypto = require('crypto')
const {
  getTestPool,
  insertCompany,
  insertUser,
  insertSupplier,
  insertCollaborator,
  insertService,
  insertAppointment,
  activatePlan,
  activateModule,
  cleanupTestData,
  shutdownTestPool,
} = require('./helpers/test-database')

const {
  createCompanyA,
  createCompanyB,
  createUserForCompany,
  createSupplierPayload,
  createCollaboratorPayload,
  createServicePayload,
  createAppointmentPayload,
} = require('../helpers/tenant-factories')

const { generateToken, generateAuthHeader, createTestUser } = require('../helpers/test-auth')
const { createIntegrationApp, registerRoutes } = require('../helpers/integration-app')
const supertest = require('supertest')

// Route modules
const barberRoutes = require('../../src/routes/barber.routes')
const masterRoutes = require('../../src/routes/master.routes')
const clientRoutes = require('../../src/routes/client.routes')

const TEST_COMPANY_IDS = []

let app = null
let companyA = null
let companyB = null
let userA = null
let userB = null
let collabA = null
let collabB = null
let serviceA = null
let serviceB = null
let supplierA = null
let supplierB = null
let appointmentA = null
let appointmentB = null

// Helper: create authenticated request
function authedRequest(token) {
  const agent = supertest.agent(app)
  agent.set('Authorization', generateAuthHeader(token))
  agent.set('Content-Type', 'application/json')
  return agent
}

// Skip all tests if no test database is configured
const hasTestDb = !!(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL)
const describeDb = hasTestDb ? describe : describe.skip

describeDb('Tenant Isolation — Integration Tests', () => {
  beforeAll(async () => {
    // Load test environment
    const path = require('path')
    require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env.test'), quiet: true })

    app = createIntegrationApp()
    registerRoutes(app, [
      { path: '/api/barber', router: barberRoutes },
      { path: '/api/master', router: masterRoutes },
      { path: '/api/client', router: clientRoutes },
    ])

    // Setup test data
    companyA = createCompanyA()
    companyB = createCompanyB()

    await insertCompany(companyA)
    await insertCompany(companyB)
    TEST_COMPANY_IDS.push(companyA.id, companyB.id)

    // Activate barber module for both test companies
    await activateModule(companyA.id, 'barber')
    await activateModule(companyB.id, 'barber')

    // Activate profissional plan — required for advanced_schedule feature (appointments)
    await activatePlan(companyA.id, 'profissional')
    await activatePlan(companyB.id, 'profissional')

    // Create users
    userA = createUserForCompany(companyA.id, 'admin')
    userB = createUserForCompany(companyB.id, 'admin')

    await insertUser(userA)
    await insertUser(userB)

    // Create services
    serviceA = await insertService(createServicePayload(companyA.id, { name: 'Corte Alpha' }))
    serviceB = await insertService(createServicePayload(companyB.id, { name: 'Corte Beta' }))

    // Create collaborators
    collabA = await insertCollaborator(createCollaboratorPayload(companyA.id, { name: 'Colaborador Alpha' }))
    collabB = await insertCollaborator(createCollaboratorPayload(companyB.id, { name: 'Colaborador Beta' }))

    // Create suppliers
    supplierA = await insertSupplier(createSupplierPayload(companyA.id, { name: 'Fornecedor Alpha' }))
    supplierB = await insertSupplier(createSupplierPayload(companyB.id, { name: 'Fornecedor Beta' }))

    // Create appointments
    appointmentA = await insertAppointment(createAppointmentPayload(companyA.id, {
      service_id: serviceA.id,
      collaborator_id: collabA.id,
      customer_name: 'Cliente Alpha',
    }))
    appointmentB = await insertAppointment(createAppointmentPayload(companyB.id, {
      service_id: serviceB.id,
      collaborator_id: collabB.id,
      customer_name: 'Cliente Beta',
    }))
  })

  afterAll(async () => {
    await cleanupTestData(TEST_COMPANY_IDS)
    await shutdownTestPool()
    // Close the shared pg pool used by route handlers to avoid Jest open handles
    const mainPool = require('../../src/config/database')
    if (typeof mainPool.end === 'function') {
      await mainPool.end().catch(() => {})
    }
    // Close Redis client (created when REDIS_URL is set in CI) to avoid Jest open handles
    const redisClient = require('../../src/shared/core/cache/redis-client')
    await redisClient.quit().catch(() => {})
  })

  describe('1. Cross-tenant blocking', () => {
    it('Company A CANNOT access suppliers from Company B', async () => {
      const tokenA = generateToken(userA)
      const response = await authedRequest(tokenA)
        .get(`/api/barber/suppliers/${supplierB.id}`)

      // Should be 403 or 404, never return Company B data
      expect([403, 404]).toContain(response.status)
      if (response.body.data) {
        expect(response.body.data.company_id).not.toBe(companyB.id)
      }
    })

    it('Company A CANNOT access appointments from Company B', async () => {
      const tokenA = generateToken(userA)
      const response = await authedRequest(tokenA)
        .get(`/api/barber/appointments`)
        .query({ date: new Date().toISOString().split('T')[0] })

      expect(response.status).toBe(200)
      const appointments = response.body.data || []
      const hasCompanyB = appointments.some(a => a.company_id === companyB.id)
      expect(hasCompanyB).toBe(false)
    })

    it('Company A CANNOT access collaborators from Company B', async () => {
      const tokenA = generateToken(userA)
      const response = await authedRequest(tokenA)
        .get(`/api/barber/collaborators`)

      expect(response.status).toBe(200)
      const collaborators = response.body.data || []
      const hasCompanyB = collaborators.some(c => c.company_id === companyB.id)
      expect(hasCompanyB).toBe(false)
    })

    it('Company A CANNOT access dashboard from Company B', async () => {
      const tokenA = generateToken(userA)
      const response = await authedRequest(tokenA)
        .get('/api/barber/dashboard')

      expect(response.status).toBe(200)
      // Dashboard data should not contain Company B info
      expect(JSON.stringify(response.body)).not.toContain(companyB.name)
    })

    it('Company B CANNOT access suppliers from Company A', async () => {
      const tokenB = generateToken(userB)
      const response = await authedRequest(tokenB)
        .get(`/api/barber/suppliers/${supplierA.id}`)

      expect([403, 404]).toContain(response.status)
    })

    it('Company B CANNOT access appointments from Company A', async () => {
      const tokenB = generateToken(userB)
      const response = await authedRequest(tokenB)
        .get(`/api/barber/appointments`)
        .query({ date: new Date().toISOString().split('T')[0] })

      expect(response.status).toBe(200)
      const appointments = response.body.data || []
      const hasCompanyA = appointments.some(a => a.company_id === companyA.id)
      expect(hasCompanyA).toBe(false)
    })
  })

  describe('2. company_id obrigatorio', () => {
    it('rejects requests without company_id', async () => {
      const userWithoutCompany = createTestUser({
        id: crypto.randomUUID(),
        email: 'no-company@test.com',
        role: 'admin',
        company_id: null,
      })
      const token = generateToken(userWithoutCompany)

      const response = await authedRequest(token)
        .get('/api/barber/suppliers')

      expect([401, 403]).toContain(response.status)
    })

    it('rejects requests with empty company_id', async () => {
      const userWithEmptyCompany = createTestUser({
        id: crypto.randomUUID(),
        email: 'empty-company@test.com',
        role: 'admin',
        company_id: '',
      })
      const token = generateToken(userWithEmptyCompany)

      const response = await authedRequest(token)
        .get('/api/barber/suppliers')

      expect([401, 403]).toContain(response.status)
    })
  })

  describe('3. Role isolation', () => {
    it('collaborator cannot access admin-only routes', async () => {
      const collabUser = createUserForCompany(companyA.id, 'collaborator')
      await insertUser(collabUser)
      TEST_COMPANY_IDS.push(companyA.id) // Already tracked

      const token = generateToken(collabUser)
      const response = await authedRequest(token)
        .get('/api/barber/suppliers')

      // Collaborators should not access supplier management
      expect([403, 404]).toContain(response.status)
    })

    it('tenant_owner cannot access another company', async () => {
      const ownerB = createUserForCompany(companyB.id, 'admin')
      const token = generateToken(ownerB)

      // Try to access Company A data
      const response = await authedRequest(token)
        .get(`/api/barber/suppliers/${supplierA.id}`)

      expect([403, 404]).toContain(response.status)
    })

    it('master_admin follows correct rules', async () => {
      const masterUser = createTestUser({
        id: crypto.randomUUID(),
        email: 'master@test.com',
        role: 'master_admin',
        company_id: null,
      })
      const token = generateToken(masterUser)

      // Master admin should not access barber routes (different auth scope)
      const response = await authedRequest(token)
        .get('/api/barber/suppliers')

      expect([401, 403]).toContain(response.status)
    })

    it('auth scope is correctly inferred', () => {
      const adminUser = createTestUser({ role: 'admin', company_id: companyA.id })
      expect(adminUser.auth_scope).toBe('barber_admin')

      const clientUser = createTestUser({ role: 'client', company_id: companyA.id })
      expect(clientUser.auth_scope).toBe('booking_customer')

      const masterUser = createTestUser({ role: 'master_admin' })
      expect(masterUser.auth_scope).toBe('master')
    })
  })

  describe('4. Query isolation', () => {
    it('list endpoints return only correct company_id data', async () => {
      const tokenA = generateToken(userA)

      // Test suppliers list
      const suppliersRes = await authedRequest(tokenA)
        .get('/api/barber/suppliers')

      expect(suppliersRes.status).toBe(200)
      const suppliers = suppliersRes.body.data || []
      suppliers.forEach(s => {
        expect(s.company_id).toBe(companyA.id)
      })

      // Test collaborators list
      const collabsRes = await authedRequest(tokenA)
        .get('/api/barber/collaborators')

      expect(collabsRes.status).toBe(200)
      const collabs = collabsRes.body.data || []
      collabs.forEach(c => {
        expect(c.company_id).toBe(companyA.id)
      })
    })

    it('aggregates do not mix tenants', async () => {
      const tokenA = generateToken(userA)

      // Test sales summary (aggregate endpoint)
      const summaryRes = await authedRequest(tokenA)
        .get('/api/barber/sales/summary')

      expect(summaryRes.status).toBe(200)
      // Summary should not contain Company B data
      expect(JSON.stringify(summaryRes.body)).not.toContain(companyB.name)
    })

    it('filters work correctly with tenant isolation', async () => {
      const tokenA = generateToken(userA)

      // Search for suppliers - should only return Company A results
      const searchRes = await authedRequest(tokenA)
        .get('/api/barber/suppliers')
        .query({ search: 'Fornecedor' })

      expect(searchRes.status).toBe(200)
      const suppliers = searchRes.body.data || []
      suppliers.forEach(s => {
        expect(s.company_id).toBe(companyA.id)
      })
    })
  })

  describe('5. Error safety', () => {
    it('errors do not leak SQL details', async () => {
      const tokenA = generateToken(userA)

      // Try to access non-existent resource
      const response = await authedRequest(tokenA)
        .get('/api/barber/suppliers/nonexistent-id')

      expect(response.status).toBeGreaterThanOrEqual(400)
      const body = JSON.stringify(response.body)
      expect(body).not.toMatch(/SELECT|INSERT|UPDATE|DELETE/i)
      expect(body).not.toMatch(/password|secret|token/i)
    })

    it('errors do not leak stack traces', async () => {
      const tokenA = generateToken(userA)

      const response = await authedRequest(tokenA)
        .post('/api/barber/suppliers')
        .send({}) // Invalid payload

      expect(response.status).toBeGreaterThanOrEqual(400)
      const body = JSON.stringify(response.body)
      expect(body).not.toContain('stack')
      expect(body).not.toContain('at ')
    })

    it('errors do not leak tokens or secrets', async () => {
      const tokenA = generateToken(userA)

      const response = await authedRequest(tokenA)
        .get('/api/barber/suppliers')

      const body = JSON.stringify(response.body)
      expect(body).not.toContain('JWT_SECRET')
      expect(body).not.toContain('RESEND_API_KEY')
      expect(body).not.toContain('SUPABASE')
    })

    it('errors do not leak other company_id', async () => {
      const tokenA = generateToken(userA)

      // Try to access Company B resource
      const response = await authedRequest(tokenA)
        .get(`/api/barber/suppliers/${supplierB.id}`)

      if (response.body.data) {
        const body = JSON.stringify(response.body)
        expect(body).not.toContain(companyB.id)
      }
    })
  })
})
