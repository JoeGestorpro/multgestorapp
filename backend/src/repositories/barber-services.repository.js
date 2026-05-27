const { BaseRepository } = require('../shared/core/database/BaseRepository')

const TABLE_NAME = 'barber_services'

const SELECT_COLUMNS = `
  id, company_id, name, description, price,
  service_type, icon, commission_type,
  commission_value, estimated_time_minutes,
  is_active, is_deleted, created_at, updated_at
`

class BarberServicesRepository extends BaseRepository {
  constructor(db) {
    super(TABLE_NAME, db)
  }

  async findAll(companyId, filters = {}) {
    const values = [companyId]
    const where = [
      'barber_services.company_id = $1',
      "COALESCE(barber_services.is_deleted, false) = false"
    ]

    const search = String(filters.search || filters.q || '').trim()
    const status = String(filters.status || 'all').trim()

    if (status === 'active') {
      where.push('barber_services.is_active = true')
    } else if (status === 'inactive') {
      where.push('barber_services.is_active = false')
    }

    if (search) {
      values.push(`%${search}%`)
      where.push(`(
        barber_services.name ILIKE $${values.length}
        OR COALESCE(barber_services.description, '') ILIKE $${values.length}
      )`)
    }

    const result = await this.db.query(
      `SELECT ${SELECT_COLUMNS}
       FROM barber_services
       WHERE ${where.join(' AND ')}
       ORDER BY barber_services.is_active DESC, barber_services.created_at DESC`,
      values
    )

    return result.rows
  }

  async findById(companyId, serviceId) {
    const result = await this.db.query(
      `SELECT ${SELECT_COLUMNS}
       FROM barber_services
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       LIMIT 1`,
      [serviceId, companyId]
    )

    return result.rows[0] || null
  }

  async create(companyId, data) {
    const result = await this.db.query(
      `INSERT INTO barber_services (
         company_id, name, description, price,
         service_type, icon, commission_type,
         commission_value, estimated_time_minutes,
         is_active, is_deleted, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, NOW())
       RETURNING ${SELECT_COLUMNS}`,
      [
        companyId,
        data.name,
        data.description,
        data.price,
        data.serviceType,
        data.icon,
        data.commissionType,
        data.commissionValue,
        data.estimatedTimeMinutes,
        data.isActive
      ]
    )

    return result.rows[0]
  }

  async update(companyId, serviceId, data) {
    const result = await this.db.query(
      `UPDATE barber_services
       SET name = $3,
           description = $4,
           price = $5,
           service_type = $6,
           icon = $7,
           commission_type = $8,
           commission_value = $9,
           estimated_time_minutes = $10,
           is_active = $11,
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       RETURNING ${SELECT_COLUMNS}`,
      [
        serviceId,
        companyId,
        data.name,
        data.description,
        data.price,
        data.serviceType,
        data.icon,
        data.commissionType,
        data.commissionValue,
        data.estimatedTimeMinutes,
        data.isActive
      ]
    )

    return result.rows[0] || null
  }

  async updateStatus(companyId, serviceId, isActive) {
    const result = await this.db.query(
      `UPDATE barber_services
       SET is_active = $3,
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       RETURNING ${SELECT_COLUMNS}`,
      [serviceId, companyId, isActive]
    )

    return result.rows[0] || null
  }

  async softDelete(companyId, serviceId) {
    const result = await this.db.query(
      `UPDATE barber_services
       SET is_deleted = true,
           is_active = false,
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       RETURNING id`,
      [serviceId, companyId]
    )

    return result.rows[0] || null
  }

  async count(companyId) {
    const result = await this.db.query(
      `SELECT COUNT(*)::int AS total
       FROM barber_services
       WHERE company_id = $1
         AND COALESCE(is_deleted, false) = false`,
      [companyId]
    )

    return result.rows[0].total
  }
}

module.exports = BarberServicesRepository
