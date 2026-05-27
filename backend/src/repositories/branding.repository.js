const pool = require('../config/database')

const DEFAULT_THEME = {
  primary_color: '#a3ff12',
  secondary_color: '#0c1017',
  accent_color: '#7fe11e',
  wallpaper_url: null,
  onboarding_completed: false,
  setup_progress: 0
}

class BrandingRepository {
  constructor(db = pool) {
    this.db = db
  }

  async getBranding(companyId) {
    const result = await this.db.query(
      `SELECT
        id as company_id,
        logo_url,
        name,
        public_display_name as display_name,
        primary_color,
        secondary_color,
        accent_color
      FROM companies
      WHERE id = $1
      LIMIT 1`,
      [companyId]
    )

    if (result.rowCount === 0) {
      return {
        company_id: companyId,
        logo_url: null,
        name: 'Empresa',
        display_name: null,
        primary_color: DEFAULT_THEME.primary_color,
        secondary_color: DEFAULT_THEME.secondary_color,
        accent_color: DEFAULT_THEME.accent_color
      }
    }

    const row = result.rows[0]
    return {
      company_id: row.company_id,
      logo_url: row.logo_url || null,
      name: row.name || 'Empresa',
      display_name: row.display_name || null,
      primary_color: row.primary_color || DEFAULT_THEME.primary_color,
      secondary_color: row.secondary_color || DEFAULT_THEME.secondary_color,
      accent_color: row.accent_color || DEFAULT_THEME.accent_color
    }
  }

  async updateBranding(companyId, updates) {
    const allowedFields = ['logo_url', 'name', 'public_display_name', 'primary_color', 'secondary_color', 'accent_color']
    const setClauses = []
    const values = []
    let paramIndex = 1

    for (const field of allowedFields) {
      if (updates[field] !== undefined || updates[field.replace('public_display_name', 'display_name')] !== undefined) {
        const value = updates[field] !== undefined ? updates[field] : updates[field.replace('public_display_name', 'display_name')]
        if (field === 'primary_color' || field === 'secondary_color' || field === 'accent_color') {
          if (typeof value === 'string' && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
            continue
          }
        }
        setClauses.push(`${field} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    }

    if (setClauses.length === 0) return this.getBranding(companyId)

    values.push(companyId)
    await this.db.query(
      `UPDATE companies SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    )

    return this.getBranding(companyId)
  }

  async getTheme(companyId) {
    const result = await this.db.query(
      `SELECT
        id as company_id,
        name as company_name,
        logo_url,
        primary_color,
        secondary_color,
        accent_color,
        wallpaper_url,
        onboarding_completed,
        setup_progress
      FROM companies
      WHERE id = $1
      LIMIT 1`,
      [companyId]
    )

    if (result.rowCount === 0) {
      return {
        company_id: companyId,
        company_name: 'Barbearia',
        logo_url: null,
        wallpaper_url: null,
        ...DEFAULT_THEME
      }
    }

    const company = result.rows[0]
    return {
      company_id: company.company_id,
      company_name: company.company_name || 'Barbearia',
      logo_url: company.logo_url || null,
      primary_color: company.primary_color || DEFAULT_THEME.primary_color,
      secondary_color: company.secondary_color || DEFAULT_THEME.secondary_color,
      accent_color: company.accent_color || DEFAULT_THEME.accent_color,
      wallpaper_url: company.wallpaper_url || null,
      onboarding_completed: company.onboarding_completed || DEFAULT_THEME.onboarding_completed,
      setup_progress: company.setup_progress || DEFAULT_THEME.setup_progress
    }
  }

  async updateTheme(companyId, updates) {
    const allowedFields = ['logo_url', 'primary_color', 'secondary_color', 'accent_color', 'wallpaper_url']
    const setClauses = []
    const values = []
    let paramIndex = 1

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        let value = updates[field]
        if (field === 'primary_color' || field === 'secondary_color' || field === 'accent_color') {
          if (typeof value === 'string' && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
            value = DEFAULT_THEME[field] || null
          }
        }
        setClauses.push(`${field} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    }

    if (setClauses.length === 0) return this.getTheme(companyId)

    values.push(companyId)
    await this.db.query(
      `UPDATE companies SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    )

    return this.getTheme(companyId)
  }

  async getBookingLanding(companyId) {
    const result = await this.db.query(
      `SELECT id, company_id, landing_headline, landing_description,
              landing_banner_url, landing_gallery, landing_hero_url,
              is_active, updated_at
       FROM barber_booking_landing
       WHERE company_id = $1
       LIMIT 1`,
      [companyId]
    )

    return result.rows[0] || null
  }

  async upsertBookingLanding(companyId, data) {
    const result = await this.db.query(
      `INSERT INTO barber_booking_landing (
         company_id, landing_headline, landing_description,
         landing_banner_url, landing_gallery, landing_hero_url,
         is_active, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (company_id) DO UPDATE
         SET landing_headline = EXCLUDED.landing_headline,
             landing_description = EXCLUDED.landing_description,
             landing_banner_url = EXCLUDED.landing_banner_url,
             landing_gallery = EXCLUDED.landing_gallery,
             landing_hero_url = EXCLUDED.landing_hero_url,
             is_active = EXCLUDED.is_active,
             updated_at = NOW()
       RETURNING *`,
      [
        companyId,
        data.headline,
        data.description,
        data.bannerUrl,
        JSON.stringify(data.gallery || []),
        data.heroUrl,
        data.isActive !== false
      ]
    )

    return result.rows[0]
  }
}

module.exports = BrandingRepository
