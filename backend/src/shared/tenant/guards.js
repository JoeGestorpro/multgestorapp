const { TenantIsolationError, ForbiddenError } = require('../core/errors')

const ADMIN_TIER_ROLES = ['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin']

function ensureSameTenant(companyId, targetCompanyId) {
  if (!companyId || !targetCompanyId) return
  if (String(companyId) !== String(targetCompanyId)) {
    throw new TenantIsolationError('Acesso entre empresas não permitido')
  }
}

// Guards genéricos de Core: qualquer service (de qualquer módulo/nicho) pode
// usá-los sem depender de helpers específicos de um vertical.
function ensureCompany(companyId) {
  if (!companyId) {
    throw new ForbiddenError('Usuario sem empresa vinculada')
  }
}

function ensureAdmin(user, message = 'Apenas admin pode executar esta acao') {
  if (!ADMIN_TIER_ROLES.includes(user?.role)) {
    throw new ForbiddenError(message)
  }
}

function isMasterAdmin(user) {
  return user?.role === 'master_admin'
}

function isBarberAdmin(user) {
  if (!user) return false
  return ['admin', 'owner', 'collaborator'].includes(user.role)
}

function isBookingCustomer(user) {
  if (!user) return false
  return ['client', 'booking_customer'].includes(user.role)
}

module.exports = { ensureSameTenant, isMasterAdmin, isBarberAdmin, isBookingCustomer, ensureCompany, ensureAdmin }
