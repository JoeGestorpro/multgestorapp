const ProductRepository = require('../repositories/product.repository')
const { ValidationError, NotFoundError, ForbiddenError } = require('../shared')

const COMMISSION_TYPES = ['percentage', 'fixed']

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function ensureCompany(companyId) {
  if (!companyId) {
    throw new ForbiddenError('Usuario sem empresa vinculada')
  }
}

function ensureAdmin(user, message) {
  if (!['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin'].includes(user?.role)) {
    throw new ForbiddenError(message || 'Apenas admin pode acessar produtos')
  }
}

function isAdmin(user) {
  return ['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin'].includes(user?.role)
}

function normalizeProductPayload(data = {}) {
  const rawStatus = data.status || data.product_status
  const normalizedStatus = String(rawStatus || '').trim().toLowerCase()
  const resolvedIsActive = normalizedStatus
    ? normalizedStatus === 'ativo' || normalizedStatus === 'active'
    : null

  return {
    supplierId: data.supplier_id || data.supplierId || null,
    name: String(data.name || '').trim(),
    description: String(data.description || '').trim() || null,
    category: String(data.category || '').trim() || null,
    brand: String(data.brand || data.marca || '').trim() || null,
    internalCode: String(data.internal_code || data.internalCode || data.codigo_interno || data.codigoInterno || '').trim() || null,
    costPrice: toNumber(data.cost_price || data.costPrice),
    salePrice: toNumber(data.sale_price || data.salePrice),
    stockCurrent: toNumber(data.stock_current || data.stockCurrent || data.estoque_atual || data.estoqueAtual),
    stockMinimum: toNumber(data.stock_minimum || data.stockMinimum || data.estoque_minimo || data.estoqueMinimo),
    unit: String(data.unit || data.unidade || '').trim() || null,
    commissionType: String(data.commission_type || data.commissionType || 'fixed').trim() || 'fixed',
    commissionValue: toNumber(data.commission_value || data.commissionValue),
    commissionEnabled: Boolean(data.commission_enabled ?? data.commissionEnabled ?? false),
    productType: ['product', 'fridge'].includes(String(data.product_type || data.productType || '').trim())
      ? String(data.product_type || data.productType).trim()
      : 'product',
    location: String(data.location || '').trim() || null,
    isFavorite: Boolean(data.is_favorite ?? data.isFavorite ?? false),
    isActive: resolvedIsActive !== null
      ? resolvedIsActive
      : data.is_active === undefined && data.isActive === undefined
        ? true
        : Boolean(data.is_active ?? data.isActive)
  }
}

function validateProductPayload(payload) {
  if (!payload.name) {
    throw new ValidationError('Nome do produto e obrigatorio')
  }

  if (payload.costPrice < 0) {
    throw new ValidationError('Preco de custo invalido')
  }

  if (payload.salePrice < 0) {
    throw new ValidationError('Preco de venda invalido')
  }

  if (payload.stockCurrent < 0) {
    throw new ValidationError('Estoque atual invalido')
  }

  if (payload.stockMinimum < 0) {
    throw new ValidationError('Estoque minimo invalido')
  }

  if (!COMMISSION_TYPES.includes(payload.commissionType)) {
    throw new ValidationError('Tipo de comissao invalido')
  }

  if (payload.commissionValue < 0) {
    throw new ValidationError('Comissao invalida')
  }
}

function enhanceProduct(product) {
  if (!product) return product
  return {
    ...product,
    low_stock: Number(product.stock_minimum || 0) > 0
      && Number(product.stock_current || 0) <= Number(product.stock_minimum || 0),
    status: product.is_active ? 'ativo' : 'inativo'
  }
}

class ProductService {
  constructor(repository, supplierService = null) {
    this.repository = repository
    this.supplierService = supplierService
  }

  async list(companyId, user, filters = {}) {
    ensureCompany(companyId)

    const mergedFilters = { ...filters }

    if (!isAdmin(user)) {
      mergedFilters.status = 'active'
    }

    const products = await this.repository.findAll(companyId, mergedFilters)
    return products.map(enhanceProduct)
  }

  async getById(companyId, user, productId) {
    ensureCompany(companyId)

    const product = await this.repository.findByIdWithSupplier(companyId, productId)

    if (!product) {
      throw new NotFoundError('Produto')
    }

    if (!isAdmin(user) && !product.is_active) {
      throw new NotFoundError('Produto')
    }

    return enhanceProduct(product)
  }

  async create(companyId, user, data) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode cadastrar produto')

    const payload = normalizeProductPayload(data)
    validateProductPayload(payload)

    if (payload.supplierId && this.supplierService) {
      await this.supplierService.ensureExists(companyId, payload.supplierId)
    }

    const product = await this.repository.create(companyId, payload)
    return enhanceProduct(product)
  }

  async update(companyId, user, productId, data) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode alterar produto')

    const existing = await this.repository.findById(companyId, productId)

    if (!existing) {
      throw new NotFoundError('Produto')
    }

    const payload = normalizeProductPayload(data)
    validateProductPayload(payload)

    if (payload.supplierId && this.supplierService) {
      await this.supplierService.ensureExists(companyId, payload.supplierId)
    }

    const product = await this.repository.update(companyId, productId, payload)
    return enhanceProduct(product)
  }

  async updateStatus(companyId, user, productId, data = {}) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode alterar status de produto')

    const existing = await this.repository.findById(companyId, productId)

    if (!existing) {
      throw new NotFoundError('Produto')
    }

    const isActive = data.is_active === undefined && data.isActive === undefined
      ? null
      : Boolean(data.is_active ?? data.isActive)

    if (isActive === null) {
      throw new ValidationError('Status do produto e obrigatorio')
    }

    const product = await this.repository.updateStatus(companyId, productId, isActive)
    return enhanceProduct(product)
  }

  async delete(companyId, user, productId) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode excluir produto')

    const existing = await this.repository.findById(companyId, productId)

    if (!existing) {
      throw new NotFoundError('Produto')
    }

    await this.repository.softDelete(companyId, productId)
    return true
  }

  async getFridgeReport(companyId, user, filters = {}) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode acessar relatorio de geladeira')

    const rows = await this.repository.getFridgeReport(companyId, filters)

    const totalRevenue = rows.reduce((sum, r) => sum + Number(r.total_revenue), 0)
    const totalItemsSold = rows.reduce((sum, r) => sum + Number(r.total_items_sold), 0)
    const lowStock = rows.filter(r =>
      Number(r.stock_minimum) > 0 &&
      Number(r.stock_current) > 0 &&
      Number(r.stock_current) <= Number(r.stock_minimum)
    ).length
    const outOfStock = rows.filter(r => Number(r.stock_current) === 0).length

    return { totalRevenue, totalItemsSold, topSelling: rows, lowStock, outOfStock }
  }

  async toggleFridgeFavorite(companyId, user, productId) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode alterar favorito de geladeira')

    const existing = await this.repository.findById(companyId, productId)

    if (!existing) {
      throw new NotFoundError('Produto')
    }

    if (existing.product_type !== 'fridge') {
      throw new ValidationError('Produto nao e item de geladeira')
    }

    return this.repository.toggleFridgeFavorite(companyId, productId)
  }
}

module.exports = ProductService
