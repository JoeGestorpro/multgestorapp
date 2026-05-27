const { requireTenant } = require('../shared/tenant')

module.exports = function requireCompany(req, res, next) {
  try {
    const tenant = requireTenant(req)
    req.tenantContext = tenant
    next()
  } catch {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' })
    }
    return res.status(403).json({ success: false, error: 'Empresa não identificada' })
  }
}
