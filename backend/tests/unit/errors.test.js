// Jest: globals (describe, it, expect) are available automatically
const {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TenantIsolationError,
  ExternalServiceError,
  IntegrationError,
  toAppError,
} = require('../../src/shared/core/errors')

describe('AppError', () => {
  it('creates with default values', () => {
    const error = new AppError('Test error')
    expect(error.message).toBe('Test error')
    expect(error.statusCode).toBe(500)
    expect(error.code).toBe('INTERNAL_ERROR')
    expect(error.metadata).toEqual({})
    expect(error.traceId).toBeNull()
  })

  it('creates with custom values', () => {
    const error = new AppError('Custom', 400, 'CUSTOM_CODE', { key: 'value' })
    expect(error.message).toBe('Custom')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('CUSTOM_CODE')
    expect(error.metadata).toEqual({ key: 'value' })
  })

  it('is an instance of Error', () => {
    expect(new AppError('test')).toBeInstanceOf(Error)
  })
})

describe('ValidationError', () => {
  it('has 400 status code', () => {
    const error = new ValidationError('Invalid data')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('VALIDATION_ERROR')
  })

  it('accepts field errors', () => {
    const fields = [{ field: 'email', message: 'Required' }]
    const error = new ValidationError('Invalid data', fields)
    expect(error.metadata.fields).toEqual(fields)
  })
})

describe('UnauthorizedError', () => {
  it('has 401 status code', () => {
    const error = new UnauthorizedError('Unauthorized')
    expect(error.statusCode).toBe(401)
    expect(error.code).toBe('UNAUTHORIZED')
  })
})

describe('ForbiddenError', () => {
  it('has 403 status code', () => {
    const error = new ForbiddenError('Forbidden')
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('FORBIDDEN')
  })
})

describe('NotFoundError', () => {
  it('has 404 status code', () => {
    const error = new NotFoundError('Not found')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
  })
})

describe('ConflictError', () => {
  it('has 409 status code', () => {
    const error = new ConflictError('Conflict')
    expect(error.statusCode).toBe(409)
    expect(error.code).toBe('CONFLICT')
  })
})

describe('TenantIsolationError', () => {
  it('has 403 status code', () => {
    const error = new TenantIsolationError('Tenant violation')
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('TENANT_ISOLATION')
  })
})

describe('ExternalServiceError', () => {
  it('has 502 status code', () => {
    const error = new ExternalServiceError('Service down')
    expect(error.statusCode).toBe(502)
    expect(error.code).toBe('EXTERNAL_SERVICE_ERROR')
  })
})

describe('IntegrationError', () => {
  it('has 502 status code', () => {
    const error = new IntegrationError('Integration failed')
    expect(error.statusCode).toBe(502)
    expect(error.code).toBe('INTEGRATION_ERROR')
  })
})

describe('toAppError', () => {
  it('converts AppError to itself', () => {
    const original = new AppError('test', 400, 'CODE')
    const converted = toAppError(original)
    expect(converted).toBe(original)
  })

  it('converts plain Error to AppError', () => {
    const original = new Error('Plain error')
    const converted = toAppError(original)
    expect(converted).toBeInstanceOf(AppError)
    expect(converted.message).toBe('Plain error')
    expect(converted.statusCode).toBe(500)
  })

  it('converts string to AppError with default message', () => {
    const converted = toAppError('String error')
    expect(converted).toBeInstanceOf(AppError)
    expect(converted.message).toBe('Erro interno do servidor')
  })

  it('preserves statusCode from Express-style errors', () => {
    const original = new Error('Express error')
    original.statusCode = 404
    const converted = toAppError(original)
    expect(converted.statusCode).toBe(404)
  })
})
