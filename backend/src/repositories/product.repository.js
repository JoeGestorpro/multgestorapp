const { BaseRepository } = require('../shared/core/database/BaseRepository')

const TABLE_NAME = 'barber_products'

const SELECT_COLUMNS = `
  barber_products.id,
  barber_products.company_id,
  barber_products.supplier_id,
  barber_products.name,
  barber_products.description,
  barber_products.category,
  barber_products.brand,
  barber_products.internal_code,
  barber_products.cost_price,
  barber_products.sale_price,
  barber_products.stock_current,
  barber_products.stock_minimum,
  barber_products.unit,
  barber_products.commission_type,
  barber_products.commission_value,
  barber_products.commission_enabled,
  barber_products.product_type,
  barber_products.location,
  barber_products.is_favorite,
  barber_products.is_active,
  barber_products.is_deleted,
  barber_products.created_at,
  barber_products.updated_at
`

const SELECT_WITH_SUPPLIER = `
  ${SELECT_COLUMNS},
  barber_suppliers.name AS supplier_name,
  barber_suppliers.company_name AS supplier_company_name,
  CASE
    WHEN COALESCE(barber_products.stock_minimum, 0) > 0
      AND COALESCE(barber_products.stock_current, 0) <= barber_products.stock_minimum
    THEN true
    ELSE false
  END AS low_stock,
  CASE WHEN barber_products.is_active THEN 'ativo' ELSE 'inativo' END AS status
`

class ProductRepository extends BaseRepository {
  constructor(db) {
    super(TABLE_NAME, db)
  }

  async findAll(companyId, filters = {}) {
    const values = [companyId]
    const where = [
      'barber_products.company_id = $1',
      'COALESCE(barber_products.is_deleted, false) = false'
    ]

    const search = String(filters.search || filters.q || '').trim()
    const status = String(filters.status || 'all').trim()
    const category = String(filters.category || '').trim()

    if (filters.isActive !== undefined) {
      where.push('barber_products.is_active = $2')
      values.push(filters.isActive)
    } else if (status === 'active') {
      where.push('barber_products.is_active = true')
    } else if (status === 'inactive') {
      where.push('barber_products.is_active = false')
    }

    if (search) {
      values.push(`%${search}%`)
      where.push(`(
        barber_products.name ILIKE $${values.length}
        OR COALESCE(barber_products.category, '') ILIKE $${values.length}
        OR COALESCE(barber_products.description, '') ILIKE $${values.length}
        OR COALESCE(barber_products.brand, '') ILIKE $${values.length}
        OR COALESCE(barber_products.internal_code, '') ILIKE $${values.length}
      )`)
    }

    if (category) {
      values.push(category)
      where.push(`COALESCE(barber_products.category, '') = $${values.length}`)
    }

    const productType = String(filters.product_type || filters.productType || '').trim()
    if (productType) {
      values.push(productType)
      where.push(`barber_products.product_type = $${values.length}`)
    }

    const result = await this.db.query(
      `SELECT ${SELECT_WITH_SUPPLIER}
       FROM barber_products
       LEFT JOIN barber_suppliers
         ON barber_suppliers.id = barber_products.supplier_id
        AND barber_suppliers.company_id = barber_products.company_id
       WHERE ${where.join(' AND ')}
       ORDER BY
         CASE
           WHEN COALESCE(barber_products.stock_minimum, 0) > 0
             AND COALESCE(barber_products.stock_current, 0) <= barber_products.stock_minimum
           THEN 0
           ELSE 1
         END,
         barber_products.is_active DESC,
         barber_products.created_at DESC`,
      values
    )

    return result.rows
  }

  async findById(companyId, productId) {
    const result = await this.db.query(
      `SELECT ${SELECT_COLUMNS}
       FROM barber_products
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       LIMIT 1`,
      [productId, companyId]
    )

    return result.rows[0] || null
  }

  async findByIdWithSupplier(companyId, productId) {
    const result = await this.db.query(
      `SELECT ${SELECT_WITH_SUPPLIER}
       FROM barber_products
       LEFT JOIN barber_suppliers
         ON barber_suppliers.id = barber_products.supplier_id
        AND barber_suppliers.company_id = barber_products.company_id
       WHERE barber_products.id = $1
         AND barber_products.company_id = $2
         AND COALESCE(barber_products.is_deleted, false) = false
       LIMIT 1`,
      [productId, companyId]
    )

    return result.rows[0] || null
  }

  async create(companyId, data) {
    const result = await this.db.query(
      `INSERT INTO barber_products (
         company_id, supplier_id, name, description, category,
         brand, internal_code, cost_price, sale_price,
         stock_current, stock_minimum, unit, commission_type,
         commission_value, commission_enabled, product_type,
         location, is_favorite, is_active, is_deleted, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, false, NOW())
       RETURNING ${SELECT_COLUMNS}`,
      [
        companyId,
        data.supplierId,
        data.name,
        data.description,
        data.category,
        data.brand,
        data.internalCode,
        data.costPrice,
        data.salePrice,
        data.stockCurrent,
        data.stockMinimum,
        data.unit,
        data.commissionType,
        data.commissionValue,
        data.commissionEnabled,
        data.productType,
        data.location,
        data.isFavorite,
        data.isActive
      ]
    )

    return result.rows[0]
  }

  async update(companyId, productId, data) {
    const result = await this.db.query(
      `UPDATE barber_products
       SET supplier_id = $3,
           name = $4,
           description = $5,
           category = $6,
           brand = $7,
           internal_code = $8,
           cost_price = $9,
           sale_price = $10,
           stock_current = $11,
           stock_minimum = $12,
           unit = $13,
           commission_type = $14,
           commission_value = $15,
           commission_enabled = $16,
           product_type = $17,
           location = $18,
           is_favorite = $19,
           is_active = $20,
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       RETURNING ${SELECT_COLUMNS}`,
      [
        productId,
        companyId,
        data.supplierId,
        data.name,
        data.description,
        data.category,
        data.brand,
        data.internalCode,
        data.costPrice,
        data.salePrice,
        data.stockCurrent,
        data.stockMinimum,
        data.unit,
        data.commissionType,
        data.commissionValue,
        data.commissionEnabled,
        data.productType,
        data.location,
        data.isFavorite,
        data.isActive
      ]
    )

    return result.rows[0] || null
  }

  async updateStatus(companyId, productId, isActive) {
    const result = await this.db.query(
      `UPDATE barber_products
       SET is_active = $3,
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       RETURNING ${SELECT_COLUMNS}`,
      [productId, companyId, isActive]
    )

    return result.rows[0] || null
  }

  async softDelete(companyId, productId) {
    const result = await this.db.query(
      `UPDATE barber_products
       SET is_deleted = true,
           is_active = false,
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       RETURNING id`,
      [productId, companyId]
    )

    return result.rows[0] || null
  }

  async count(companyId) {
    const result = await this.db.query(
      `SELECT COUNT(*)::int AS total
       FROM barber_products
       WHERE company_id = $1
         AND COALESCE(is_deleted, false) = false`,
      [companyId]
    )

    return result.rows[0].total
  }
}

module.exports = ProductRepository
