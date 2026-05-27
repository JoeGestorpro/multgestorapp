const BarberServicesRepository = require('../repositories/barber-services.repository')
const { ValidationError, NotFoundError, ForbiddenError } = require('../shared')

const COMMISSION_TYPES = ['percentage', 'fixed']
const SERVICE_TYPES = ['service', 'product', 'combo']

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function toNullableInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }
  const number = Number(value)
  if (!Number.isFinite(number)) {
    return null
  }
  return Math.round(number)
}

function ensureCompany(companyId) {
  if (!companyId) {
    throw new ForbiddenError('Usuario sem empresa vinculada')
  }
}

function ensureAdmin(user) {
  if (!['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin'].includes(user?.role)) {
    throw new ForbiddenError('Apenas admin pode alterar o catalogo de servicos')
  }
}

function isAdmin(user) {
  return ['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin'].includes(user?.role)
}

function normalizeServicePayload(data = {}) {
  return {
    name: String(data.name || '').trim(),
    description: String(data.description || '').trim() || null,
    price: toNumber(data.price),
    serviceType: String(data.service_type || data.serviceType || 'service').trim() || 'service',
    icon: String(data.icon || data.service_icon || data.serviceIcon || 'scissors').trim() || 'scissors',
    commissionType: String(data.commission_type || data.commissionType || 'percentage').trim() || 'percentage',
    commissionValue: toNumber(data.commission_value || data.commissionValue),
    estimatedTimeMinutes: toNullableInteger(data.estimated_time_minutes || data.estimatedTimeMinutes),
    isActive: data.is_active === undefined && data.isActive === undefined
      ? true
      : Boolean(data.is_active ?? data.isActive)
  }
}

function validateServicePayload(payload) {
  if (!payload.name) {
    throw new ValidationError('Nome do servico e obrigatorio')
  }

  if (payload.price < 0) {
    throw new ValidationError('Preco invalido')
  }

  if (payload.commissionValue < 0) {
    throw new ValidationError('Comissao invalida')
  }

  if (!SERVICE_TYPES.includes(payload.serviceType)) {
    throw new ValidationError('Tipo de servico invalido')
  }

  if (!COMMISSION_TYPES.includes(payload.commissionType)) {
    throw new ValidationError('Tipo de comissao invalido')
  }

  if (payload.estimatedTimeMinutes !== null && payload.estimatedTimeMinutes < 0) {
    throw new ValidationError('Tempo medio invalido')
  }
}

class BarberServiceService {
  constructor(repository, validateCredential = null) {
    this.repository = repository
    this.validateCredentialFn = validateCredential
  }

  async list(companyId, user, filters = {}) {
    ensureCompany(companyId)

    const mergedFilters = { ...filters }

    if (!isAdmin(user)) {
      mergedFilters.status = 'active'
    }

    return this.repository.findAll(companyId, mergedFilters)
  }

  async getById(companyId, user, serviceId) {
    ensureCompany(companyId)

    const service = await this.repository.findById(companyId, serviceId)

    if (!service) {
      throw new NotFoundError('Servico')
    }

    if (!isAdmin(user) && !service.is_active) {
      throw new NotFoundError('Servico')
    }

    return service
  }

  async create(companyId, user, data) {
    ensureCompany(companyId)
    ensureAdmin(user)

    const payload = normalizeServicePayload(data)
    validateServicePayload(payload)

    return this.repository.create(companyId, payload)
  }

  async update(companyId, user, serviceId, data) {
    ensureCompany(companyId)
    ensureAdmin(user)

    const existing = await this.repository.findById(companyId, serviceId)

    if (!existing) {
      throw new NotFoundError('Servico')
    }

    const payload = normalizeServicePayload(data)
    validateServicePayload(payload)

    return this.repository.update(companyId, serviceId, payload)
  }

  async updateStatus(companyId, user, serviceId, data = {}) {
    ensureCompany(companyId)
    ensureAdmin(user)

    const existing = await this.repository.findById(companyId, serviceId)

    if (!existing) {
      throw new NotFoundError('Servico')
    }

    const isActive = data.is_active === undefined && data.isActive === undefined
      ? null
      : Boolean(data.is_active ?? data.isActive)

    if (isActive === null) {
      throw new ValidationError('Status do servico e obrigatorio')
    }

    return this.repository.updateStatus(companyId, serviceId, isActive)
  }

  async delete(companyId, user, serviceId, credentialData = {}) {
    ensureCompany(companyId)
    ensureAdmin(user)

    if (this.validateCredentialFn) {
      await this.validateCredentialFn(companyId, user.id, credentialData)
    }

    const existing = await this.repository.findById(companyId, serviceId)

    if (!existing) {
      throw new NotFoundError('Servico')
    }

    const result = await this.repository.softDelete(companyId, serviceId)

    if (!result) {
      throw new NotFoundError('Servico')
    }

    return true
  }
}

module.exports = BarberServiceService
