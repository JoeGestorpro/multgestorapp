// tests/helpers/test-auth.js
// Authentication helpers for tests

const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-secret-do-not-use-in-production-abc123'

function generateToken(payload, options = {}) {
  return jwt.sign(
    {
      id: payload.id || crypto.randomUUID(),
      email: payload.email || 'test@example.com',
      role: payload.role || 'admin',
      company_id: payload.company_id || null,
      auth_scope: payload.auth_scope || null,
      can_launch_sales: payload.can_launch_sales ?? false,
      can_view_own_dashboard: payload.can_view_own_dashboard ?? true,
      can_view_own_reports: payload.can_view_own_reports ?? true,
      ...payload.extra,
    },
    TEST_JWT_SECRET,
    { expiresIn: options.expiresIn || '7d' }
  )
}

function generateAuthHeader(token) {
  return `Bearer ${token}`
}

function createTestUser(options = {}) {
  return {
    id: options.id || crypto.randomUUID(),
    email: options.email || 'test@example.com',
    role: options.role || 'admin',
    company_id: options.company_id || null,
    auth_scope: options.auth_scope || inferScope(options.role),
    name: options.name || 'Test User',
    is_active: options.is_active !== false,
    can_launch_sales: options.can_launch_sales ?? false,
    can_view_own_dashboard: options.can_view_own_dashboard ?? true,
    can_view_own_reports: options.can_view_own_reports ?? true,
  }
}

function inferScope(role) {
  if (role === 'master_admin') return 'master'
  if (['client', 'booking_customer'].includes(role)) return 'booking_customer'
  if (['admin', 'owner', 'collaborator'].includes(role)) return 'barber_admin'
  return null
}

function createAuthenticatedReq(options = {}) {
  const user = createTestUser(options.user || {})
  const token = generateToken(user, options.tokenOptions)

  return {
    body: options.body || {},
    query: options.query || {},
    params: options.params || {},
    headers: {
      'user-agent': 'test-agent',
      authorization: generateAuthHeader(token),
      ...options.headers,
    },
    ip: '127.0.0.1',
    user,
    traceId: options.traceId || 'test-trace-id',
    startTime: Date.now(),
  }
}

module.exports = {
  generateToken,
  generateAuthHeader,
  createTestUser,
  createAuthenticatedReq,
  TEST_JWT_SECRET,
}
