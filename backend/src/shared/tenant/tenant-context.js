const { TenantIsolationError } = require('../core/errors')

function extractTenant(req) {
  const user = req.user || {}
  return {
    companyId: user.company_id || null,
    userId: user.id || null,
    authScope: user.auth_scope || null,
    role: user.role || null,
  }
}

function requireTenant(req) {
  const tenant = extractTenant(req)
  if (!tenant.companyId) {
    throw new TenantIsolationError('Empresa não identificada')
  }
  return tenant
}

module.exports = { extractTenant, requireTenant }
