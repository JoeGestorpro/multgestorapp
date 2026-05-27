const { ForbiddenError } = require('./ForbiddenError')

class TenantIsolationError extends ForbiddenError {
  constructor(message = 'Acesso entre empresas não permitido') {
    super(message)
    this.code = 'TENANT_ISOLATION'
  }
}

module.exports = { TenantIsolationError }
