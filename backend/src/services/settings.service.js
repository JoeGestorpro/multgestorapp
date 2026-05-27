const SettingsRepository = require('../repositories/settings.repository')
const { ValidationError, NotFoundError, ForbiddenError } = require('../shared')

const BUSINESS_TIMEZONE = 'America/Cuiaba'
const PIN_RESET_EXPIRATION_MINUTES = 10

function ensureCompany(companyId) {
  if (!companyId) {
    throw new ForbiddenError('Usuario sem empresa vinculada')
  }
}

function ensureAdmin(user, message) {
  if (!['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin'].includes(user?.role)) {
    throw new ForbiddenError(message || 'Apenas admin pode acessar configuracoes')
  }
}

class SettingsService {
  constructor(repository, bookingService = null, companyPlanService = null) {
    this.repository = repository
    this.bookingService = bookingService
    this.companyPlanService = companyPlanService
  }

  async get(companyId, user) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode acessar as configuracoes')

    const [company, bookingSettings] = await Promise.all([
      this.repository.getCompany(companyId),
      this.repository.getBookingSettings(companyId)
    ])

    if (!company) {
      throw new NotFoundError('Empresa')
    }

    return {
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        public_booking_slug: company.public_booking_slug,
        created_at: company.created_at,
        whatsapp_phone: company.whatsapp_phone || '',
        address_line: company.address_line || '',
        city: company.city || '',
        state: company.state || '',
        business_description: company.business_description || '',
        public_display_name: company.public_display_name || '',
        business_email: company.business_email || '',
        logo_url: company.logo_url || '',
        primary_color: company.primary_color || '',
        secondary_color: company.secondary_color || '',
        accent_color: company.accent_color || ''
      },
      security: {
        recovery_email: user?.email || company.email || null,
        pin_configured: null,
        expires_in_minutes: PIN_RESET_EXPIRATION_MINUTES
      },
      agenda: {
        timezone: bookingSettings.timezone || BUSINESS_TIMEZONE,
        slot_interval_minutes: Number(bookingSettings.slot_interval_minutes || 30),
        online_min_advance_enabled: bookingSettings.online_min_advance_enabled === true,
        online_min_advance_value: Math.max(0, Number(bookingSettings.online_min_advance_value || 0)),
        minimum_notice_minutes: Number(bookingSettings.minimum_notice_minutes || 0),
        cancellation_limit_hours: Number(bookingSettings.cancellation_limit_hours || 0),
        allow_customer_select_collaborator: bookingSettings.allow_customer_select_collaborator !== false,
        allow_any_collaborator: bookingSettings.allow_any_collaborator !== false,
        confirmation_message: String(bookingSettings.confirmation_message || '').trim() || ''
      }
    }
  }

  async update(companyId, user, data = {}) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode atualizar as configuracoes')

    const onlineMinAdvanceEnabled = data.online_min_advance_enabled === true
    const rawAdvanceValue = data.online_min_advance_value
    const parsedAdvanceValue = rawAdvanceValue === undefined || rawAdvanceValue === null || rawAdvanceValue === ''
      ? 0
      : Number(rawAdvanceValue)

    if (!Number.isFinite(parsedAdvanceValue) || parsedAdvanceValue < 0) {
      throw new ValidationError('Informe uma antecedencia minima valida para a agenda online.')
    }

    if (onlineMinAdvanceEnabled) {
      const allowedValues = new Set([1, 2, 4, 8, 12, 24])
      if (!allowedValues.has(parsedAdvanceValue)) {
        throw new ValidationError('A antecedencia minima online deve ser informada em horas validas.')
      }
    }

    const normalizedAdvanceValue = onlineMinAdvanceEnabled ? parsedAdvanceValue : 0
    const minimumNoticeMinutes = onlineMinAdvanceEnabled ? normalizedAdvanceValue * 60 : 0

    await this.repository.upsertBookingSettings(companyId, {
      enabled: onlineMinAdvanceEnabled,
      advanceValue: normalizedAdvanceValue,
      noticeMinutes: minimumNoticeMinutes
    })

    return this.get(companyId, user)
  }

  async updateCompanyProfile(companyId, user, data = {}) {
    ensureCompany(companyId)
    ensureAdmin(user, 'Apenas admin pode atualizar o perfil da empresa')

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && value.length > 500) {
        throw new ValidationError(`Campo ${key} excede o limite de 500 caracteres.`)
      }
    }

    return this.repository.updateCompany(companyId, data)
  }
}

module.exports = SettingsService
