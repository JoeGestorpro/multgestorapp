// Jest: globals (describe, it, expect, afterEach) are available automatically
const { guardAgainstProduction } = require('../helpers/test-db')

describe('Database Production Protection', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('throws when no DATABASE_URL is set', () => {
    delete process.env.DATABASE_URL
    delete process.env.TEST_DATABASE_URL

    expect(() => guardAgainstProduction()).toThrow(
      'TEST_DATABASE_URL or DATABASE_URL is not set'
    )
  })

  it('throws when URL contains supabase.co (production indicator)', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@db.xyz123.supabase.co:5432/production'

    expect(() => guardAgainstProduction()).toThrow(
      'FATAL: Test attempted to connect to production database'
    )
  })

  it('throws when URL contains production keyword', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@host:5432/my-production-db'

    expect(() => guardAgainstProduction()).toThrow(
      'FATAL: Test attempted to connect to production database'
    )
  })

  it('passes for test database URL', () => {
    process.env.TEST_DATABASE_URL = 'postgres://user:pass@localhost:5432/test_db'

    expect(() => guardAgainstProduction()).not.toThrow()
  })

  it('passes for localhost database', () => {
    process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/multgestor_test'

    expect(() => guardAgainstProduction()).not.toThrow()
  })

  it('redacts credentials in error message', () => {
    process.env.DATABASE_URL = 'postgres://admin:secret123@db.prod.supabase.co:5432/prod'

    try {
      guardAgainstProduction()
    } catch (error) {
      expect(error.message).not.toContain('admin')
      expect(error.message).not.toContain('secret123')
      expect(error.message).toContain('[REDACTED]')
    }
  })
})
