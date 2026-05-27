const { TenantIsolationError } = require('../core/errors')

function ensureSameTenant(companyId, targetCompanyId) {
  if (!companyId || !targetCompanyId) return
  if (String(companyId) !== String(targetCompanyId)) {
    throw new TenantIsolationError('Acesso entre empresas não permitido')
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

module.exports = { ensureSameTenant, isMasterAdmin, isBarberAdmin, isBookingCustomer }
