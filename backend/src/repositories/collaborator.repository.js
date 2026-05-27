const { BaseRepository } = require('../shared/core/database/BaseRepository')

const TABLE_NAME = 'barber_collaborators'

const SELECT_COLUMNS = `
  barber_collaborators.id,
  barber_collaborators.company_id,
  barber_collaborators.user_id,
  barber_collaborators.nickname,
  barber_collaborators.commission_type,
  barber_collaborators.commission_rate,
  barber_collaborators.can_make_barter,
  barber_collaborators.available_for_booking,
  barber_collaborators.avatar_url,
  barber_collaborators.is_active,
  barber_collaborators.is_deleted,
  barber_collaborators.created_at,
  barber_collaborators.updated_at
`

const SELECT_WITH_USER = `
  ${SELECT_COLUMNS},
  users.name,
  users.email,
  users.phone,
  users.role,
  users.can_launch_sales,
  users.can_view_own_dashboard,
  users.can_view_own_reports,
  users.is_active AS user_is_active
`

class CollaboratorRepository extends BaseRepository {
  constructor(db) {
    super(TABLE_NAME, db)
  }

  async findAll(companyId) {
    const result = await this.db.query(
      `SELECT ${SELECT_WITH_USER}
       FROM barber_collaborators
       LEFT JOIN users ON users.id = barber_collaborators.user_id
       WHERE barber_collaborators.company_id = $1
         AND COALESCE(barber_collaborators.is_deleted, false) = false
       ORDER BY barber_collaborators.created_at DESC`,
      [companyId]
    )

    return result.rows
  }

  async findById(companyId, collaboratorId) {
    const result = await this.db.query(
      `SELECT ${SELECT_COLUMNS}
       FROM barber_collaborators
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       LIMIT 1`,
      [collaboratorId, companyId]
    )

    return result.rows[0] || null
  }

  async findByIdWithUser(companyId, collaboratorId) {
    const result = await this.db.query(
      `SELECT ${SELECT_WITH_USER}
       FROM barber_collaborators
       LEFT JOIN users ON users.id = barber_collaborators.user_id
       WHERE barber_collaborators.id = $1
         AND barber_collaborators.company_id = $2
         AND COALESCE(barber_collaborators.is_deleted, false) = false
       LIMIT 1`,
      [collaboratorId, companyId]
    )

    return result.rows[0] || null
  }

  async findByUserId(companyId, userId) {
    const result = await this.db.query(
      `SELECT ${SELECT_COLUMNS}
       FROM barber_collaborators
       WHERE company_id = $1
         AND user_id = $2
         AND COALESCE(is_deleted, false) = false
       LIMIT 1`,
      [companyId, userId]
    )

    return result.rows[0] || null
  }

  async countActive(companyId) {
    const result = await this.db.query(
      `SELECT COUNT(*)::int AS total
       FROM barber_collaborators
       WHERE company_id = $1
         AND COALESCE(is_deleted, false) = false`,
      [companyId]
    )

    return result.rows[0].total
  }

  async create(companyId, data) {
    const result = await this.db.query(
      `INSERT INTO barber_collaborators (
         company_id, user_id, nickname, commission_type,
         commission_rate, can_make_barter, available_for_booking,
         avatar_url, is_active, is_deleted, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, false, NOW())
       RETURNING ${SELECT_COLUMNS}`,
      [
        companyId,
        data.userId,
        data.nickname,
        data.commissionType,
        data.commissionRate,
        data.canMakeBarter,
        data.availableForBooking,
        data.isActive
      ]
    )

    return result.rows[0]
  }

  async update(companyId, collaboratorId, data) {
    const result = await this.db.query(
      `UPDATE barber_collaborators
       SET nickname = $3,
           commission_type = $4,
           commission_rate = $5,
           can_make_barter = $6,
           available_for_booking = $7,
           is_active = $8,
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       RETURNING ${SELECT_COLUMNS}`,
      [
        collaboratorId,
        companyId,
        data.nickname,
        data.commissionType,
        data.commissionRate,
        data.canMakeBarter,
        data.availableForBooking,
        data.isActive
      ]
    )

    return result.rows[0] || null
  }

  async updateStatus(companyId, collaboratorId, isActive) {
    const result = await this.db.query(
      `UPDATE barber_collaborators
       SET is_active = $3,
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       RETURNING ${SELECT_COLUMNS}`,
      [collaboratorId, companyId, isActive]
    )

    return result.rows[0] || null
  }

  async updateAvatar(companyId, collaboratorId, avatarUrl) {
    const result = await this.db.query(
      `UPDATE barber_collaborators
       SET avatar_url = $3,
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       RETURNING ${SELECT_COLUMNS}`,
      [collaboratorId, companyId, avatarUrl]
    )

    return result.rows[0] || null
  }

  async softDelete(companyId, collaboratorId) {
    const result = await this.db.query(
      `UPDATE barber_collaborators
       SET is_deleted = true,
           is_active = false,
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND COALESCE(is_deleted, false) = false
       RETURNING id`,
      [collaboratorId, companyId]
    )

    return result.rows[0] || null
  }
}

module.exports = CollaboratorRepository
