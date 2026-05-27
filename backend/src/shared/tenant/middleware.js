const { extractTenant } = require('./tenant-context')

function tenantContext(req, res, next) {
  Object.defineProperty(req, 'tenantContext', {
    get() {
      return extractTenant(req)
    },
    enumerable: true,
    configurable: true,
  })
  next()
}

module.exports = { tenantContext }
