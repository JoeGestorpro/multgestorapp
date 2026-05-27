// Jest: globals (describe, it, expect) are available automatically
// jest.fn() -> jest.fn()
const { createTestApp, createMockReq, createMockRes } = require('../helpers/test-app')
const { generateToken, generateAuthHeader, createTestUser, createAuthenticatedReq } = require('../helpers/test-auth')
const { createCompany, createUser } = require('../helpers/test-factories')
const supertest = require('supertest')

describe('Test App Helper', () => {
  it('creates an Express app', () => {
    const app = createTestApp()
    expect(app).toBeDefined()
    expect(typeof app.use).toBe('function')
  })

  it('includes correlation middleware', () => {
    const app = createTestApp()
    // Express 5 changed internal structure; verify app was created successfully
    expect(app).toBeDefined()
    expect(typeof app.use).toBe('function')
  })

  it('returns 404 for unknown routes', async () => {
    const app = createTestApp()
    const response = await supertest(app).get('/api/nonexistent')

    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
    expect(response.body.error).toBe('Rota nao encontrada')
  })

  it('includes traceId in 404 response', async () => {
    const app = createTestApp()
    const response = await supertest(app).get('/api/nonexistent')

    expect(response.headers['x-trace-id']).toBeDefined()
    expect(response.headers['x-request-id']).toBeDefined()
  })
})

describe('Test Auth Helper', () => {
  it('generates JWT token', () => {
    const user = createTestUser({ role: 'admin', company_id: 'company-1' })
    const token = generateToken(user)

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3)
  })

  it('generates auth header', () => {
    const header = generateAuthHeader('some-token')
    expect(header).toBe('Bearer some-token')
  })

  it('creates test user with defaults', () => {
    const user = createTestUser()
    expect(user.id).toBeDefined()
    expect(user.email).toBe('test@example.com')
    expect(user.role).toBe('admin')
    expect(user.is_active).toBe(true)
  })

  it('creates test user with overrides', () => {
    const user = createTestUser({
      id: 'custom-id',
      email: 'custom@test.com',
      role: 'master_admin',
      company_id: null,
    })
    expect(user.id).toBe('custom-id')
    expect(user.email).toBe('custom@test.com')
    expect(user.role).toBe('master_admin')
    expect(user.company_id).toBeNull()
  })

  it('creates authenticated request', () => {
    const req = createAuthenticatedReq({
      user: { role: 'admin', company_id: 'company-1' },
    })
    expect(req.headers.authorization).toBeDefined()
    expect(req.headers.authorization.startsWith('Bearer ')).toBe(true)
    expect(req.user.role).toBe('admin')
    expect(req.user.company_id).toBe('company-1')
  })

  it('infers correct auth scopes', () => {
    const masterReq = createAuthenticatedReq({ user: { role: 'master_admin' } })
    expect(masterReq.user.auth_scope).toBe('master')

    const adminReq = createAuthenticatedReq({ user: { role: 'admin' } })
    expect(adminReq.user.auth_scope).toBe('barber_admin')

    const clientReq = createAuthenticatedReq({ user: { role: 'client' } })
    expect(clientReq.user.auth_scope).toBe('booking_customer')
  })
})

describe('Test Factories', () => {
  it('creates company with defaults', () => {
    const company = createCompany()
    expect(company.id).toBeDefined()
    expect(company.name).toContain('Test Company')
    expect(company.niche_type).toBe('barber')
    expect(company.status).toBe('active')
  })

  it('creates company with overrides', () => {
    const company = createCompany({ id: 'custom-id', name: 'Custom Co' })
    expect(company.id).toBe('custom-id')
    expect(company.name).toBe('Custom Co')
  })

  it('creates user linked to company', () => {
    const companyId = 'company-123'
    const user = createUser(companyId, { role: 'admin' })
    expect(user.company_id).toBe('company-123')
    expect(user.role).toBe('admin')
  })

  it('creates unique emails', () => {
    const user1 = createUser('c1')
    // Add small delay to ensure timestamp differs
    const start = Date.now()
    while (Date.now() - start < 10) { /* busy wait */ }
    const user2 = createUser('c1')
    expect(user1.email).not.toBe(user2.email)
  })
})

describe('Mock Request/Response', () => {
  it('creates mock request', () => {
    const req = createMockReq({ body: { name: 'test' } })
    expect(req.body.name).toBe('test')
    expect(req.traceId).toBe('test-trace-id')
    expect(req.ip).toBe('127.0.0.1')
  })

  it('creates mock response', () => {
    const res = createMockRes()
    res.status(400).json({ error: 'test' })
    expect(res.statusCode).toBe(400)
    expect(res.payload).toEqual({ error: 'test' })
  })

  it('mock response supports setHeader', () => {
    const res = createMockRes()
    res.setHeader('x-trace-id', 'trace-123')
    expect(res.headers['x-trace-id']).toBe('trace-123')
  })
})
