const SupplierRepository = require('../repositories/supplier.repository')
const { ValidationError, NotFoundError, ForbiddenError } = require('../shared')
const { normalizeEmail } = require('../utils/validators')

function ensureCompany(companyId) {
  if (!companyId) {
    throw new ForbiddenError('Usuario sem empresa vinculada')
  }
}

function ensureAdmin(user, message) {
  if (!['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin'].includes(user?.role)) {
    throw new ForbiddenError(message || 'Apenas admin pode acessar fornecedores')
  }
}

function normalizeSupplierPayload(data = {}) {
  return {
    name: String(data.name || '').trim(),
    companyName: String(data.company_name || data.companyName || '').trim() || null,
    phone: String(data.phone || '').trim() || null,
    email: normalizeEmail(data.email) || null,
    document: String(data.document || '').trim() || null,
    notes: String(data.notes || '').trim() || null,
    isActive: data.is_active === undefined && data.isActive === undefined
      ? true
      : Boolean(data.is_active ?? data.isActive)
  }
}

function validateSupplierPayload(payload) {
  if (!payload.name) {
    throw new ValidationError('Nome do fornecedor e obrigatorio')
  }
}

class SupplierService {
  constructor(repository) {
    this.repository = repository
  }

  async list(companyId, user, filters = {}) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode listar fornecedores')

    return this.repository.findAll(companyId, filters)
  }

  async getById(companyId, user, supplierId) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode visualizar fornecedor')

    const supplier = await this.repository.findById(companyId, supplierId)

    if (!supplier) {
      throw new NotFoundError('Fornecedor')
    }

    return supplier
  }

  async ensureExists(companyId, supplierId) {
    const supplier = await this.repository.findById(companyId, supplierId)

    if (!supplier) {
      throw new NotFoundError('Fornecedor')
    }

    return supplier
  }

  async create(companyId, user, data) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode cadastrar fornecedor')

    const payload = normalizeSupplierPayload(data)
    validateSupplierPayload(payload)

    return this.repository.create(companyId, payload)
  }

  async update(companyId, user, supplierId, data) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode alterar fornecedor')

    const existing = await this.repository.findById(companyId, supplierId)

    if (!existing) {
      throw new NotFoundError('Fornecedor')
    }

    const payload = normalizeSupplierPayload(data)
    validateSupplierPayload(payload)

    return this.repository.update(companyId, supplierId, payload)
  }

  async updateStatus(companyId, user, supplierId, data = {}) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode alterar status de fornecedor')

    const existing = await this.repository.findById(companyId, supplierId)

    if (!existing) {
      throw new NotFoundError('Fornecedor')
    }

    const isActive = data.is_active === undefined && data.isActive === undefined
      ? null
      : Boolean(data.is_active ?? data.isActive)

    if (isActive === null) {
      throw new ValidationError('Status do fornecedor e obrigatorio')
    }

    return this.repository.updateStatus(companyId, supplierId, isActive)
  }

  async delete(companyId, user, supplierId) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode excluir fornecedor')

    const existing = await this.repository.findById(companyId, supplierId)

    if (!existing) {
      throw new NotFoundError('Fornecedor')
    }

    await this.repository.softDelete(companyId, supplierId)
    return true
  }
}

module.exports = SupplierService
