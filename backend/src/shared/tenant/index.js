const { extractTenant, requireTenant } = require('./tenant-context')
const { ensureSameTenant, isMasterAdmin, isBarberAdmin, isBookingCustomer } = require('./guards')
const { tenantContext } = require('./middleware')

module.exports = {
  extractTenant,
  requireTenant,
  ensureSameTenant,
  isMasterAdmin,
  isBarberAdmin,
  isBookingCustomer,
  tenantContext,
}
