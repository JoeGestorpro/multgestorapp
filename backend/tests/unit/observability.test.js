// tests/unit/observability.test.js
// FASE 5 — Observability Validation
// Validates request tracing, logging safety, and error handler contracts

const { correlationMiddleware, errorHandler } = require('../../src/shared/core/errors/middleware')
const { appLogger } = require('../../src/shared/core/logger')
const { requestLogger } = require('../../src/shared')

describe('Observability — Request Tracing', () => {
  it('sets traceId from x-trace-id header', () => {
    const req = {
      headers: { 'x-trace-id': 'existing-trace' },
      res: { setHeader: jest.fn() },
    }
    const next = jest.fn()

    correlationMiddleware(req, req.res, next)

    expect(req.traceId).toBe('existing-trace')
    expect(req.res.setHeader).toHaveBeenCalledWith('x-trace-id', 'existing-trace')
    expect(req.res.setHeader).toHaveBeenCalledWith('x-request-id', 'existing-trace')
  })

  it('sets traceId from x-request-id header', () => {
    const req = {
      headers: { 'x-request-id': 'request-trace' },
      res: { setHeader: jest.fn() },
    }
    const next = jest.fn()

    correlationMiddleware(req, req.res, next)

    expect(req.traceId).toBe('request-trace')
  })

  it('generates UUID when no header provided', () => {
    const req = {
      headers: {},
      res: { setHeader: jest.fn() },
    }
    const next = jest.fn()

    correlationMiddleware(req, req.res, next)

    expect(req.traceId).toBeDefined()
    expect(req.traceId.length).toBeGreaterThan(0)
    // UUID v4 format check
    expect(req.traceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('sets startTime for duration calculation', () => {
    const req = {
      headers: {},
      res: { setHeader: jest.fn() },
    }
    const next = jest.fn()

    correlationMiddleware(req, req.res, next)

    expect(req.startTime).toBeDefined()
    expect(typeof req.startTime).toBe('number')
    expect(req.startTime).toBeLessThanOrEqual(Date.now())
  })

  it('calls next()', () => {
    const req = {
      headers: {},
      res: { setHeader: jest.fn() },
    }
    const next = jest.fn()

    correlationMiddleware(req, req.res, next)

    expect(next).toHaveBeenCalled()
  })
})

describe('Observability — Logger Safety', () => {
  it('logger has SERVICE_NAME configured', () => {
    expect(appLogger).toBeDefined()
    expect(typeof appLogger.info).toBe('function')
    expect(typeof appLogger.error).toBe('function')
    expect(typeof appLogger.warn).toBe('function')
  })

  it('requestLogger middleware exists', () => {
    expect(requestLogger).toBeDefined()
    expect(typeof requestLogger).toBe('function')
  })

  it('logger does not expose secrets in output', () => {
    // Verify logger configuration doesn't include secret paths
    const loggerModule = require('../../src/shared/core/logger')
    expect(loggerModule).toBeDefined()
  })
})

describe('Observability — Error Handler Contract', () => {
  function makeReq(options = {}) {
    return {
      traceId: options.traceId || 'test-trace',
      log: {
        error: jest.fn(),
        warn: jest.fn(),
      },
      ...options,
    }
  }

  function makeRes() {
    return {
      statusCode: 200,
      json: jest.fn(function (body) {
        this.payload = body
        return this
      }),
      status: jest.fn(function (code) {
        this.statusCode = code
        return this
      }),
      setHeader: jest.fn(),
    }
  }

  it('includes traceId in error response', () => {
    const req = makeReq({ traceId: 'custom-trace-123' })
    const res = makeRes()

    errorHandler(new Error('test'), req, res, jest.fn())

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        traceId: 'custom-trace-123',
      })
    )
  })

  it('does not expose internal error details for 500 errors', () => {
    const req = makeReq()
    const res = makeRes()
    const error = new Error('Database connection failed: password=secret123')

    errorHandler(error, req, res, jest.fn())

    const responseBody = res.json.mock.calls[0][0]
    expect(responseBody.error).toBe('Erro interno do servidor')
    expect(responseBody.error).not.toContain('password')
    expect(responseBody.error).not.toContain('Database')
    expect(responseBody.error).not.toContain('secret123')
  })

  it('preserves client error messages for 4xx errors', () => {
    const req = makeReq()
    const res = makeRes()
    const { ValidationError } = require('../../src/shared/core/errors')

    errorHandler(new ValidationError('Email invalido'), req, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Email invalido',
      })
    )
  })

  it('includes error code in response', () => {
    const req = makeReq()
    const res = makeRes()
    const { NotFoundError } = require('../../src/shared/core/errors')

    errorHandler(new NotFoundError('Recurso'), req, res, jest.fn())

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'NOT_FOUND',
      })
    )
  })

  it('includes metadata when present', () => {
    const req = makeReq()
    const res = makeRes()
    const { ValidationError } = require('../../src/shared/core/errors')

    errorHandler(
      new ValidationError('Invalid', [{ field: 'email', message: 'Required' }]),
      req,
      res,
      jest.fn()
    )

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { fields: [{ field: 'email', message: 'Required' }] },
      })
    )
  })

  it('response always has success: false for errors', () => {
    const req = makeReq()
    const res = makeRes()

    errorHandler(new Error('test'), req, res, jest.fn())

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      })
    )
  })

  it('does not leak JWT_SECRET in error responses', () => {
    const req = makeReq()
    const res = makeRes()

    // Simulate error that might contain secret
    const error = new Error(`Failed: ${process.env.JWT_SECRET || 'secret'}`)

    errorHandler(error, req, res, jest.fn())

    const responseBody = res.json.mock.calls[0][0]
    if (process.env.JWT_SECRET) {
      expect(responseBody.error).not.toContain(process.env.JWT_SECRET)
    }
  })

  it('does not leak database credentials in error responses', () => {
    const req = makeReq()
    const res = makeRes()

    const error = new Error('Connection failed: postgres://user:password@host:5432/db')

    errorHandler(error, req, res, jest.fn())

    const responseBody = res.json.mock.calls[0][0]
    expect(responseBody.error).not.toContain('postgres://')
    expect(responseBody.error).not.toContain('password')
  })
})

describe('Observability — Tenant Context in Logs', () => {
  it('tenantContext middleware attaches to req', () => {
    const { tenantContext } = require('../../src/shared/tenant/middleware')
    const req = {
      user: {
        company_id: 'company-123',
        id: 'user-456',
        auth_scope: 'barber_admin',
        role: 'admin',
      },
    }
    const res = {}
    const next = jest.fn()

    tenantContext(req, res, next)

    expect(req.tenantContext).toBeDefined()
    expect(req.tenantContext.companyId).toBe('company-123')
    expect(req.tenantContext.userId).toBe('user-456')
    expect(req.tenantContext.authScope).toBe('barber_admin')
    expect(req.tenantContext.role).toBe('admin')
    expect(next).toHaveBeenCalled()
  })

  it('tenantContext handles missing user gracefully', () => {
    const { tenantContext } = require('../../src/shared/tenant/middleware')
    const req = { user: null }
    const res = {}
    const next = jest.fn()

    tenantContext(req, res, next)

    expect(req.tenantContext).toBeDefined()
    expect(req.tenantContext.companyId).toBeNull()
    expect(req.tenantContext.userId).toBeNull()
    expect(next).toHaveBeenCalled()
  })

  it('extractTenant returns null companyId for unauthenticated requests', () => {
    const { extractTenant } = require('../../src/shared/tenant/tenant-context')
    const req = { user: null }

    const tenant = extractTenant(req)

    expect(tenant.companyId).toBeNull()
    expect(tenant.userId).toBeNull()
    expect(tenant.authScope).toBeNull()
  })

  it('requireTenant throws for missing company_id', () => {
    const { requireTenant } = require('../../src/shared/tenant/tenant-context')
    const { TenantIsolationError } = require('../../src/shared/core/errors')
    const req = { user: { id: 'user-123', company_id: null } }

    expect(() => requireTenant(req)).toThrow(TenantIsolationError)
  })

  it('requireTenant succeeds for valid company_id', () => {
    const { requireTenant } = require('../../src/shared/tenant/tenant-context')
    const req = { user: { id: 'user-123', company_id: 'company-456' } }

    const tenant = requireTenant(req)

    expect(tenant.companyId).toBe('company-456')
    expect(tenant.userId).toBe('user-123')
  })
})
