const pool = require('../config/database')

class SettingsRepository {
  constructor(db = pool) {
    this.db = db
  }

  async getCompany(companyId) {
    const result = await this.db.query(
      `SELECT id, name, email, phone, public_booking_slug, created_at,
              whatsapp_phone, address_line, city, state,
              business_description, public_display_name, business_email,
              logo_url, primary_color, secondary_color, accent_color
       FROM companies
       WHERE id = $1
       LIMIT 1`,
      [companyId]
    )

    return result.rows[0] || null
  }

  async updateCompany(companyId, data) {
    const allowedFields = [
      'name', 'email', 'phone', 'whatsapp_phone',
      'address_line', 'city', 'state',
      'business_description', 'public_display_name', 'business_email'
    ]

    const setClauses = []
    const values = []
    let paramIndex = 1

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`)
        values.push(data[field])
        paramIndex++
      }
    }

    if (setClauses.length === 0) return this.getCompany(companyId)

    values.push(companyId)
    await this.db.query(
      `UPDATE companies SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    )

    return this.getCompany(companyId)
  }

  async getBookingSettings(companyId) {
    const result = await this.db.query(
      `SELECT * FROM barber_booking_settings WHERE company_id = $1 LIMIT 1`,
      [companyId]
    )

    return result.rows[0] || {
      timezone: 'America/Cuiaba',
      slot_interval_minutes: 30,
      online_min_advance_enabled: false,
      online_min_advance_value: 0,
      minimum_notice_minutes: 0,
      cancellation_limit_hours: 0,
      allow_customer_select_collaborator: true,
      allow_any_collaborator: true,
      confirmation_message: ''
    }
  }

  async upsertBookingSettings(companyId, data) {
    await this.db.query(
      `INSERT INTO barber_booking_settings (
         company_id, online_min_advance_enabled, online_min_advance_value,
         minimum_notice_minutes, updated_at
       )
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (company_id) DO UPDATE
         SET online_min_advance_enabled = EXCLUDED.online_min_advance_enabled,
             online_min_advance_value = EXCLUDED.online_min_advance_value,
             minimum_notice_minutes = EXCLUDED.minimum_notice_minutes,
             updated_at = NOW()`,
      [companyId, data.enabled, data.advanceValue, data.noticeMinutes]
    )
  }
}

module.exports = SettingsRepository
