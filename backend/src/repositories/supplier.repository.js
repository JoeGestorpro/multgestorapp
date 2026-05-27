const { BaseRepository } = require('../shared/core/database/BaseRepository')

const TABLE_NAME = 'barber_suppliers'

const SELECT_COLUMNS = `
  id, company_id, name, company_name, phone, email,
  document, notes, is_active, is_deleted, created_at, updated_at
`

class SupplierRepository extends BaseRepository {
  constructor(db) {
    super(TABLE_NAME, db)
  }

  async findAll(companyId, filters = {}) {
    const values = [companyId]
    const where = [
      'barber_suppliers.company_id = $1',
      'COALESCE(barber_suppliers.is_deleted, false) = false'
    ]

    const search = String(filters.search || filters.q || '').trim()
    const status = String(filters.status || 'all').trim()

    if (status === 'active') {
      where.push('barber_suppliers.is_active = true')
    } else if (status === 'inactive') {
      where.push('barber_suppliers.is_active = false')
    }

    if (search) {
      values.push(`%${search}%`)
      where.push(`(
        barber_suppliers.name ILIKE $${values.length}
        OR COALESCE(barber_suppliers.company_name, '') ILIKE $${values.length}
        OR COALESCE(barber_suppliers.email, '') ILIKE $${values.length}
      )`)
    }

    const result = await this.db.query(
      `SELECT ${SELECT_COLUMNS}
       FROM barber_suppliers
       WHERE ${where.join(' AND ')}
       ORDER BY is_active DESC, created_at DESC`,
      values
    )

    return result.rows
  }

  async findById(companyId, supplierId) {
    const result = await this.db.query(
      `SELECT ${SELECT_COLUMNS}
       FROM barber_suppliers
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       LIMIT 1`,
      [supplierId, companyId]
    )

    return result.rows[0] || null
  }

  async create(companyId, data) {
    const result = await this.db.query(
      `INSERT INTO barber_suppliers (
         company_id, name, company_name, phone, email,
         document, notes, is_active, is_deleted, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW())
       RETURNING ${SELECT_COLUMNS}`,
      [
        companyId,
        data.name,
        data.companyName,
        data.phone,
        data.email,
        data.document,
        data.notes,
        data.isActive
      ]
    )

    return result.rows[0]
  }

  async update(companyId, supplierId, data) {
    const result = await this.db.query(
      `UPDATE barber_suppliers
       SET name = $3, company_name = $4, phone = $5, email = $6,
           document = $7, notes = $8, is_active = $9, updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       RETURNING ${SELECT_COLUMNS}`,
      [
        supplierId,
        companyId,
        data.name,
        data.companyName,
        data.phone,
        data.email,
        data.document,
        data.notes,
        data.isActive
      ]
    )

    return result.rows[0] || null
  }

  async updateStatus(companyId, supplierId, isActive) {
    const result = await this.db.query(
      `UPDATE barber_suppliers
       SET is_active = $3, updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       RETURNING ${SELECT_COLUMNS}`,
      [supplierId, companyId, isActive]
    )

    return result.rows[0] || null
  }

  async softDelete(companyId, supplierId) {
    const result = await this.db.query(
      `UPDATE barber_suppliers
       SET is_deleted = true, is_active = false, updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
       RETURNING id`,
      [supplierId, companyId]
    )

    return result.rows[0] || null
  }

  async count(companyId) {
    const result = await this.db.query(
      `SELECT COUNT(*)::int AS total
       FROM barber_suppliers
       WHERE company_id = $1
         AND COALESCE(is_deleted, false) = false`,
      [companyId]
    )

    return result.rows[0].total
  }
}

module.exports = SupplierRepository
