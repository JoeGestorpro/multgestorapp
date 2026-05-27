// Jest: globals (describe, it, expect, beforeEach) are available automatically
// vi.fn() -> jest.fn()
const { correlationMiddleware, errorHandler } = require('../../src/shared/core/errors/middleware')
const { AppError, ValidationError } = require('../../src/shared/core/errors')

describe('correlationMiddleware', () => {
  it('sets traceId from x-trace-id header', () => {
    const req = { headers: { 'x-trace-id': 'existing-trace' }, res: { setHeader: jest.fn() } }
    const next = jest.fn()

    correlationMiddleware(req, req.res, next)

    expect(req.traceId).toBe('existing-trace')
    expect(req.startTime).toBeDefined()
    expect(req.res.setHeader).toHaveBeenCalledWith('x-trace-id', 'existing-trace')
    expect(req.res.setHeader).toHaveBeenCalledWith('x-request-id', 'existing-trace')
  })

  it('sets traceId from x-request-id header', () => {
    const req = { headers: { 'x-request-id': 'request-trace' }, res: { setHeader: jest.fn() } }
    const next = jest.fn()

    correlationMiddleware(req, req.res, next)

    expect(req.traceId).toBe('request-trace')
  })

  it('generates UUID when no header provided', () => {
    const req = { headers: {}, res: { setHeader: jest.fn() } }
    const next = jest.fn()

    correlationMiddleware(req, req.res, next)

    expect(req.traceId).toBeDefined()
    expect(req.traceId.length).toBeGreaterThan(0)
  })

  it('calls next()', () => {
    const req = { headers: {}, res: { setHeader: jest.fn() } }
    const next = jest.fn()

    correlationMiddleware(req, req.res, next)

    expect(next).toHaveBeenCalled()
  })
})

describe('errorHandler', () => {
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

  it('handles AppError with correct status code', () => {
    const req = makeReq()
    const res = makeRes()
    const appError = new ValidationError('Invalid data')

    errorHandler(appError, req, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Invalid data',
        traceId: 'test-trace',
        code: 'VALIDATION_ERROR',
      })
    )
  })

  it('handles generic Error as 500', () => {
    const req = makeReq()
    const res = makeRes()
    const error = new Error('Something broke')

    errorHandler(error, req, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Erro interno do servidor',
        traceId: 'test-trace',
      })
    )
  })

  it('includes traceId in response', () => {
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
  })

  it('includes metadata when present', () => {
    const req = makeReq()
    const res = makeRes()
    const error = new ValidationError('Invalid', [{ field: 'email', message: 'Required' }])

    errorHandler(error, req, res, jest.fn())

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { fields: [{ field: 'email', message: 'Required' }] },
      })
    )
  })

  it('uses fallback message for 500 errors', () => {
    const req = makeReq({ fallbackMessage: 'Custom fallback' })
    const res = makeRes()
    const error = new Error('Internal failure')

    errorHandler(error, req, res, jest.fn())

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Custom fallback',
      })
    )
  })
})
