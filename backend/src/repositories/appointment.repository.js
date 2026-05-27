const { BaseRepository } = require('../shared/core/database/BaseRepository')

const TABLE_NAME = 'barber_appointments'

const SELECT_COLUMNS = `
  barber_appointments.id,
  barber_appointments.company_id,
  barber_appointments.service_id,
  barber_appointments.collaborator_id,
  barber_appointments.customer_id,
  barber_appointments.customer_name,
  barber_appointments.customer_phone,
  barber_appointments.customer_email,
  barber_appointments.starts_at,
  barber_appointments.ends_at,
  barber_appointments.status,
  barber_appointments.notes,
  barber_appointments.created_at,
  barber_appointments.updated_at
`

const SELECT_WITH_DETAILS = `
  ${SELECT_COLUMNS},
  barber_services.name AS service_name,
  barber_services.icon AS service_icon,
  barber_services.price AS service_price,
  COALESCE(users.name, barber_collaborators.nickname) AS collaborator_name,
  barber_collaborators.avatar_url AS collaborator_avatar_url
`

class AppointmentRepository extends BaseRepository {
  constructor(db) {
    super(TABLE_NAME, db)
  }

  async findAll(companyId, filters = {}) {
    const values = [companyId]
    const where = ['barber_appointments.company_id = $1']

    if (filters.collaboratorId) {
      values.push(filters.collaboratorId)
      where.push(`barber_appointments.collaborator_id = $${values.length}`)
    }

    if (filters.customerId) {
      values.push(filters.customerId)
      where.push(`barber_appointments.customer_id = $${values.length}`)
    }

    if (filters.date) {
      values.push(filters.date)
      values.push(filters.timezone || 'America/Cuiaba')
      where.push(`DATE(barber_appointments.starts_at AT TIME ZONE $${values.length}::text) = $${values.length - 1}::date`)
    }

    if (filters.status && filters.status !== 'all') {
      values.push(filters.status)
      where.push(`barber_appointments.status = $${values.length}`)
    }

    const result = await this.db.query(
      `SELECT ${SELECT_WITH_DETAILS}
       FROM barber_appointments
       INNER JOIN barber_services
         ON barber_services.id = barber_appointments.service_id
        AND barber_services.company_id = barber_appointments.company_id
       INNER JOIN barber_collaborators
         ON barber_collaborators.id = barber_appointments.collaborator_id
        AND barber_collaborators.company_id = barber_appointments.company_id
       LEFT JOIN users ON users.id = barber_collaborators.user_id
       WHERE ${where.join(' AND ')}
       ORDER BY barber_appointments.starts_at ASC, barber_appointments.created_at DESC`,
      values
    )

    return result.rows
  }

  async findById(companyId, appointmentId) {
    const result = await this.db.query(
      `SELECT ${SELECT_COLUMNS}
       FROM barber_appointments
       WHERE id = $1
         AND company_id = $2
       LIMIT 1`,
      [appointmentId, companyId]
    )

    return result.rows[0] || null
  }

  async findConflicts(companyId, collaboratorId, startsAt, endsAt, excludeId = null) {
    const values = [companyId, collaboratorId, startsAt, endsAt]
    let where = `company_id = $1
       AND collaborator_id = $2
       AND status NOT IN ('canceled', 'no_show')
       AND starts_at < $4
       AND ends_at > $3`

    if (excludeId) {
      values.push(excludeId)
      where += ` AND id != $${values.length}`
    }

    const result = await this.db.query(
      `SELECT id FROM barber_appointments WHERE ${where}`,
      values
    )

    return result.rows
  }

  async create(companyId, data) {
    const result = await this.db.query(
      `INSERT INTO barber_appointments (
         company_id, service_id, collaborator_id, customer_id,
         customer_name, customer_phone, customer_email,
         starts_at, ends_at, status, notes, source, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       RETURNING ${SELECT_COLUMNS}`,
      [
        companyId,
        data.serviceId,
        data.collaboratorId,
        data.customerId || null,
        data.customerName,
        data.customerPhone,
        data.customerEmail,
        data.startsAt,
        data.endsAt,
        data.status || 'scheduled',
        data.notes,
        data.source || 'admin_manual'
      ]
    )

    return result.rows[0]
  }

  async update(companyId, appointmentId, data) {
    const sets = ['updated_at = NOW()']
    const values = [appointmentId, companyId]
    let paramIndex = 3

    if (data.status !== undefined) {
      values.push(data.status)
      sets.push(`status = $${paramIndex}`)
      paramIndex++
    }

    if (data.notes !== undefined) {
      values.push(data.notes)
      sets.push(`notes = $${paramIndex}`)
      paramIndex++
    }

    if (data.startsAt !== undefined) {
      values.push(data.startsAt)
      sets.push(`starts_at = $${paramIndex}::timestamptz`)
      paramIndex++
    }

    if (data.endsAt !== undefined) {
      values.push(data.endsAt)
      sets.push(`ends_at = $${paramIndex}::timestamptz`)
      paramIndex++
    }

    if (data.canceledReason !== undefined) {
      values.push(data.canceledReason)
      sets.push(`canceled_reason = $${paramIndex}`)
      paramIndex++
    }

    const result = await this.db.query(
      `UPDATE barber_appointments
       SET ${sets.join(', ')}
       WHERE id = $1
         AND company_id = $2
       RETURNING ${SELECT_COLUMNS}`,
      values
    )

    return result.rows[0] || null
  }

  async delete(companyId, appointmentId) {
    const result = await this.db.query(
      'DELETE FROM barber_appointments WHERE id = $1 AND company_id = $2 RETURNING id',
      [appointmentId, companyId]
    )

    return result.rows[0] || null
  }

  async countByStatus(companyId, collaboratorId = null) {
    const values = [companyId]
    let where = 'company_id = $1'

    if (collaboratorId) {
      values.push(collaboratorId)
      where += ` AND collaborator_id = $${values.length}`
    }

    const result = await this.db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status <> 'canceled')::integer AS total,
         COUNT(*) FILTER (WHERE status = 'scheduled')::integer AS scheduled,
         COUNT(*) FILTER (WHERE status = 'confirmed')::integer AS confirmed,
         COUNT(*) FILTER (WHERE status = 'completed')::integer AS completed,
         COUNT(*) FILTER (WHERE status = 'canceled')::integer AS canceled
       FROM barber_appointments
       WHERE ${where}`,
      values
    )

    return result.rows[0]
  }
}

module.exports = AppointmentRepository
