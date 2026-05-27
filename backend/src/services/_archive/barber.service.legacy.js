/**
 * LEGACY — APOSENTADO EM 2026-05-25
 *
 * Este arquivo foi decomposto em servicos especializados:
 *   - schedule.service.js           (horarios, bloqueios, disponibilidade)
 *   - sale.service.js               (vendas, resumo, cancelamento)
 *   - dashboard.service.js          (dashboards, relatorios, analytics)
 *   - company.service.js            (perfil, PIN, onboarding, plano)
 *   - advance-settlement.service.js (vales, fechamentos)
 *   - customer.service.js           (clientes, CRM)
 *   - collaborator.service.js     (colaboradores, avatar, financeiro)
 *   - cash-flow.service.js          (caixa, historico)
 *   - barber-core.service.js        (facade que delega para todos acima)
 *
 * Nao importar este arquivo em codigo novo.
 * Mantido apenas como referencia historica.
 */

const bcrypt = require('bcryptjs');
const fs = require('fs/promises');
const path = require('path');
const pool = require('../config/database');
const supabase = require('../config/supabase');
const emailService = require('./email/email.service');
const clientBookingService = require('./client-booking.service');
const {
  getPlanLimits,
  getCompanyPlanSnapshot
} = require('./company-plan.service');
const { canUsePlanFeature, getLockedFeatureMessage } = require('../utils/planFeatures');
const {
  isValidEmail,
  isValidPassword,
  isValidPin,
  isFiniteNumberValue
} = require('../utils/validators');
const { appLogger } = require('../shared/core/logger');
const CashFlowService = require('./cash-flow.service');

const cashFlowService = new CashFlowService();

const SaleService = require('./sale.service');
const saleService = new SaleService();

const BUSINESS_TIMEZONE = 'America/Cuiaba';
const PAYMENT_METHODS = ['dinheiro', 'pix', 'credito', 'debito', 'permuta'];
const COMMISSION_TYPES = ['percentage', 'fixed'];
const SERVICE_TYPES = ['service', 'product', 'combo'];
const ADVANCE_STATUS = ['pending', 'approved', 'rejected', 'liquidated'];
const CASH_STATUS = ['open', 'pre_closed', 'closed'];
const APPOINTMENT_STATUS = ['scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'canceled', 'no_show'];
const COLLABORATOR_AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024;
const COLLABORATOR_AVATAR_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};
const UPLOADS_ROOT = path.resolve(__dirname, '..', '..', 'uploads');
const PIN_RESET_EXPIRATION_MINUTES = 10;
const PAYMENT_METHOD_ALIASES = {
  cash: 'dinheiro',
  dinheiro: 'dinheiro',
  pix: 'pix',
  credit: 'credito',
  credito: 'credito',
  debit: 'debito',
  debito: 'debito',
  barter: 'permuta',
  trade: 'permuta',
  permuta: 'permuta'
};

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function createResponseError(statusCode, errorLabel, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.responseBody = {
    error: errorLabel,
    message
  };
  return error;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePin(value) {
  return String(value || '').replace(/\D/g, '');
}

function shouldLogBarberDebug() {
  return String(process.env.NODE_ENV || '').trim().toLowerCase() !== 'production';
}

function getDefaultCollaboratorPermissionState() {
  return {
    canLaunchSales: false,
    canViewOwnDashboard: true,
    canViewOwnReports: true
  };
}

function usesLockedExtraPermissions(payload, baselinePermissions = getDefaultCollaboratorPermissionState()) {
  return [
    ['canLaunchSales', payload.canLaunchSales],
    ['canViewOwnDashboard', payload.canViewOwnDashboard],
    ['canViewOwnReports', payload.canViewOwnReports]
  ].some(([key, value]) => value !== baselinePermissions[key]);
}

function ensureExtraPermissionsFeature(planType, payload, baselinePermissions) {
  // REGRA GLOBAL: bloquear personalizacao de permissoes por plano com 403 amigavel.
  if (canUsePlanFeature(planType, 'extra_permissions')) {
    return;
  }

  if (usesLockedExtraPermissions(payload, baselinePermissions)) {
    throw createError(getLockedFeatureMessage('extra_permissions'), 403);
  }
}

function slugifyText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getPublicAssetUrl(relativePath) {
  return `/${String(relativePath || '').replace(/\\/g, '/').replace(/^\/+/, '')}`;
}

function buildCollaboratorAvatarDirectory(companyId, collaboratorId) {
  return path.join(UPLOADS_ROOT, 'barber-collaborators', String(companyId), String(collaboratorId));
}

function getCollaboratorAvatarRelativePath(companyId, collaboratorId, extension) {
  return path.posix.join('barber-collaborators', String(companyId), String(collaboratorId), `avatar.${extension}`);
}

function parseImageDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i);

  if (!match) {
    throw createError('Envie uma imagem JPG, PNG ou WEBP valida', 400);
  }

  const mimeType = match[1].toLowerCase();
  const base64Content = match[2];
  const extension = COLLABORATOR_AVATAR_MIME_TYPES[mimeType];

  if (!extension) {
    throw createError('Formato de imagem nao suportado', 400);
  }

  const buffer = Buffer.from(base64Content, 'base64');

  if (buffer.length === 0) {
    throw createError('Arquivo de imagem invalido', 400);
  }

  if (buffer.length > COLLABORATOR_AVATAR_MAX_SIZE_BYTES) {
    throw createError('A imagem deve ter no maximo 2MB', 400);
  }

  return {
    mimeType,
    extension,
    buffer
  };
}

function normalizeAvatarPayload(data = {}) {
  return {
    dataUrl: String(data.dataUrl || data.avatarDataUrl || data.avatar || '').trim()
  };
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toNullableInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.round(number);
}

function ensureCompany(companyId) {
  // REGRA MULTI-TENANT: sempre usar company_id.
  if (!companyId) {
    throw createError('Usuario sem empresa vinculada', 403);
  }
}

function ensureCollaboratorCompanyContext(companyId) {
  if (!companyId) {
    throw createError('Empresa nao encontrada no usuario autenticado.', 403);
  }
}

function ensureAdmin(user, message = 'Apenas admin pode alterar o catalogo de servicos') {
  if (!['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin'].includes(user?.role)) {
    throw createError(message, 403);
  }
}

async function columnExists(tableName, columnName) {
  const result = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_name = $2
     LIMIT 1`,
    [tableName, columnName]
  );

  return result.rowCount > 0;
}

async function getAppointmentColumnSupport() {
  const [hasSource, hasCanceledReason] = await Promise.all([
    columnExists('barber_appointments', 'source'),
    columnExists('barber_appointments', 'canceled_reason')
  ]);

  return {
    hasSource,
    hasCanceledReason
  };
}

async function ensureWorkingHoursSchema(client = pool) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS barber_working_hours (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      collaborator_id UUID NULL REFERENCES barber_collaborators(id) ON DELETE CASCADE,
      weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
      opens_at TIME NOT NULL,
      closes_at TIME NOT NULL,
      is_closed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      CONSTRAINT uq_barber_working_hours_comp_coll_day UNIQUE (company_id, collaborator_id, weekday)
    )
  `);

  await client.query('CREATE INDEX IF NOT EXISTS idx_barber_working_hours_company ON barber_working_hours(company_id)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_barber_working_hours_company_weekday ON barber_working_hours(company_id, weekday)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_barber_working_hours_collaborator ON barber_working_hours(collaborator_id)');
}

async function ensurePinRecoverySchema() {
  const requiredPinResetColumns = [
    'id',
    'company_id',
    'user_id',
    'email',
    'token_hash',
    'expires_at',
    'used_at',
    'created_at'
  ];

  const [hasPinHash, hasPinResetTokens, pinResetColumnsResult] = await Promise.all([
    columnExists('users', 'pin_hash'),
    pool.query(
      `SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = 'pin_reset_tokens'
       LIMIT 1`
    ),
    pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'pin_reset_tokens'`
    )
  ]);

  const availableColumns = new Set(pinResetColumnsResult.rows.map((row) => row.column_name));
  const hasRequiredPinResetColumns = requiredPinResetColumns.every((columnName) => availableColumns.has(columnName));

  if (!hasPinHash || hasPinResetTokens.rowCount === 0 || !hasRequiredPinResetColumns) {
    throw createError('Atualizacao de banco pendente para recuperar PIN com seguranca', 503);
  }
}

async function getSettings(companyId, user) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode acessar as configuracoes');

  const hasExtraColumns = await columnExists('companies', 'whatsapp_phone');

  const companyQuery = hasExtraColumns
    ? `SELECT id, name, email, phone, public_booking_slug, created_at,
              whatsapp_phone, address_line, city, state,
              business_description, public_display_name, business_email,
              logo_url, primary_color, secondary_color, accent_color
       FROM companies
       WHERE id = $1
       LIMIT 1`
    : `SELECT id, name, email, phone, public_booking_slug, created_at
       FROM companies
       WHERE id = $1
       LIMIT 1`;

  const [companyResult, bookingSettings, planSnapshot] = await Promise.all([
    pool.query(companyQuery, [companyId]),
    clientBookingService.getBookingSettings(companyId),
    getCompanyPlanSnapshot(companyId)
  ]);

  if (companyResult.rowCount === 0) {
    throw createError('Empresa nao encontrada', 404);
  }

  const company = companyResult.rows[0];

  return {
    company: {
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      public_booking_slug: company.public_booking_slug,
      created_at: company.created_at,
      whatsapp_phone: hasExtraColumns ? (company.whatsapp_phone || '') : '',
      address_line: hasExtraColumns ? (company.address_line || '') : '',
      city: hasExtraColumns ? (company.city || '') : '',
      state: hasExtraColumns ? (company.state || '') : '',
      business_description: hasExtraColumns ? (company.business_description || '') : '',
      public_display_name: hasExtraColumns ? (company.public_display_name || '') : '',
      business_email: hasExtraColumns ? (company.business_email || '') : '',
      logo_url: hasExtraColumns ? (company.logo_url || '') : '',
      primary_color: hasExtraColumns ? (company.primary_color || '') : '',
      secondary_color: hasExtraColumns ? (company.secondary_color || '') : '',
      accent_color: hasExtraColumns ? (company.accent_color || '') : ''
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
    },
    plan: planSnapshot
  };
}

async function updateSettings(companyId, user, data = {}) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode atualizar as configuracoes');

  const onlineMinAdvanceEnabled = data.online_min_advance_enabled === true;
  const rawAdvanceValue = data.online_min_advance_value;
  const parsedAdvanceValue = rawAdvanceValue === undefined || rawAdvanceValue === null || rawAdvanceValue === ''
    ? 0
    : Number(rawAdvanceValue);

  if (!Number.isFinite(parsedAdvanceValue) || parsedAdvanceValue < 0) {
    throw createError('Informe uma antecedencia minima valida para a agenda online.', 400);
  }

  if (onlineMinAdvanceEnabled) {
    const allowedValues = new Set([1, 2, 4, 8, 12, 24]);

    if (!allowedValues.has(parsedAdvanceValue)) {
      throw createError('A antecedencia minima online deve ser informada em horas validas.', 400);
    }
  }

  const normalizedAdvanceValue = onlineMinAdvanceEnabled ? parsedAdvanceValue : 0;
  const minimumNoticeMinutes = onlineMinAdvanceEnabled ? normalizedAdvanceValue * 60 : 0;

  await pool.query(
    `INSERT INTO barber_booking_settings (
       company_id,
       online_min_advance_enabled,
       online_min_advance_value,
       minimum_notice_minutes,
       updated_at
     )
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (company_id) DO UPDATE
       SET online_min_advance_enabled = EXCLUDED.online_min_advance_enabled,
           online_min_advance_value = EXCLUDED.online_min_advance_value,
           minimum_notice_minutes = EXCLUDED.minimum_notice_minutes,
           updated_at = NOW()`,
    [companyId, onlineMinAdvanceEnabled, normalizedAdvanceValue, minimumNoticeMinutes]
  );

  return getSettings(companyId, user);
}

async function updateCompanyProfile(companyId, user, data = {}) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode atualizar o perfil da empresa');

  const allowedFields = [
    'name', 'email', 'phone', 'whatsapp_phone',
    'address_line', 'city', 'state',
    'business_description', 'public_display_name', 'business_email'
  ];

  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (typeof data[field] === 'string' && data[field].length > 500) {
        throw createError(`Campo ${field} excede o limite de 500 caracteres.`, 400);
      }
      setClauses.push(`${field} = $${paramIndex}`);
      values.push(data[field]);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return getSettings(companyId, user);
  }

  values.push(companyId);

  await pool.query(
    `UPDATE companies SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  return getCompanyTheme(companyId);
}

async function getBookingLanding(companyId) {
  const [landingResult, companyResult] = await Promise.all([
    pool.query(
      `SELECT
         id, company_id,
         display_name, slogan, about_text,
          whatsapp, instagram, address_display, hours_display, banner_url,
          booking_primary_color, booking_secondary_color, booking_accent_color,
          button_text, button_text_color,
          extra_info,
          differentials, gallery,
          show_hero, show_info, show_about, show_differentials, show_team, show_gallery,
          created_at, updated_at
       FROM barber_booking_landing
       WHERE company_id = $1
       LIMIT 1`,
      [companyId]
    ),
    pool.query(
      `SELECT logo_url FROM companies WHERE id = $1 LIMIT 1`,
      [companyId]
    )
  ]);

  const c = companyResult.rowCount > 0 ? companyResult.rows[0] : {};
  const logoUrl = c.logo_url || null;

  if (landingResult.rowCount === 0) {
    const companyDetailResult = await pool.query(
      `SELECT
         name, public_display_name,
         business_description,
         logo_url,
         primary_color, secondary_color, accent_color,
          whatsapp_phone, address_line, city, state, wallpaper_url
       FROM companies
       WHERE id = $1
       LIMIT 1`,
      [companyId]
    );

    const cd = companyDetailResult.rowCount > 0 ? companyDetailResult.rows[0] : {};
    const displayName = cd.public_display_name || cd.name || null;
    const addressParts = [cd.address_line, cd.city, cd.state].filter(Boolean);
    const addressDisplay = addressParts.length > 0 ? addressParts.join(', ') : null;

    return {
      company_id: companyId,
      logo_url: logoUrl,
      display_name: displayName,
      slogan: null,
      about_text: cd.business_description || null,
      whatsapp: cd.whatsapp_phone || null,
      instagram: null,
      address_display: addressDisplay,
      hours_display: null,
      banner_url: cd.wallpaper_url || null,
      booking_primary_color: cd.primary_color || DEFAULT_THEME.primary_color,
      booking_secondary_color: cd.secondary_color || DEFAULT_THEME.secondary_color,
      booking_accent_color: cd.accent_color || DEFAULT_THEME.accent_color,
      button_text: 'Agendar Horário',
      button_text_color: null,
      extra_info: null,
      differentials: [],
      gallery: [],
      show_hero: true,
      show_info: true,
      show_about: true,
      show_differentials: true,
      show_team: true,
      show_gallery: false
    };
  }

  const l = landingResult.rows[0];
  return {
    company_id: l.company_id,
    logo_url: logoUrl,
    display_name: l.display_name,
    slogan: l.slogan,
    about_text: l.about_text,
    whatsapp: l.whatsapp,
    instagram: l.instagram,
    address_display: l.address_display,
    hours_display: l.hours_display,
    banner_url: l.banner_url || null,
    booking_primary_color: l.booking_primary_color,
    booking_secondary_color: l.booking_secondary_color,
    booking_accent_color: l.booking_accent_color,
    button_text: l.button_text,
    button_text_color: l.button_text_color,
    extra_info: l.extra_info,
    differentials: Array.isArray(l.differentials) ? l.differentials : [],
    gallery: Array.isArray(l.gallery) ? l.gallery : [],
    show_hero: l.show_hero,
    show_info: l.show_info,
    show_about: l.show_about,
    show_differentials: l.show_differentials,
    show_team: l.show_team,
    show_gallery: l.show_gallery
  };
}

async function updateBookingLanding(companyId, updates) {
  const hasTable = await columnExists('barber_booking_landing', 'company_id');
  if (!hasTable) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS barber_booking_landing (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
        display_name TEXT, slogan TEXT, about_text TEXT,
        whatsapp TEXT, instagram TEXT, address_display TEXT, hours_display TEXT,
        booking_primary_color TEXT, booking_secondary_color TEXT, booking_accent_color TEXT,
        button_text TEXT NOT NULL DEFAULT 'Agendar Horario', button_text_color TEXT,
        extra_info TEXT,
        differentials JSONB NOT NULL DEFAULT '[]'::jsonb,
        gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
        show_hero BOOLEAN NOT NULL DEFAULT true,
        show_info BOOLEAN NOT NULL DEFAULT true,
        show_about BOOLEAN NOT NULL DEFAULT true,
        show_differentials BOOLEAN NOT NULL DEFAULT true,
        show_team BOOLEAN NOT NULL DEFAULT true,
        show_gallery BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_barber_booking_landing_company_id
        ON barber_booking_landing(company_id);
    `);
  }

  await pool.query(
    `INSERT INTO barber_booking_landing (company_id)
     VALUES ($1)
     ON CONFLICT (company_id) DO NOTHING`,
    [companyId]
  );

  const allowedFields = [
    'display_name', 'slogan', 'about_text',
    'whatsapp', 'instagram', 'address_display', 'hours_display',
    'booking_primary_color', 'booking_secondary_color', 'booking_accent_color',
    'button_text', 'button_text_color',
    'banner_url',
    'extra_info',
    'differentials', 'gallery',
    'show_hero', 'show_info', 'show_about', 'show_differentials', 'show_team', 'show_gallery'
  ];

  const HEX_COLOR_FIELDS = ['booking_primary_color', 'booking_secondary_color', 'booking_accent_color', 'button_text_color'];
  const JSONB_FIELDS = ['differentials', 'gallery'];
  const BOOLEAN_FIELDS = ['show_hero', 'show_info', 'show_about', 'show_differentials', 'show_team', 'show_gallery'];

  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      let value = updates[field];

      if (HEX_COLOR_FIELDS.includes(field)) {
        if (value === null || value === '') {
          value = null;
        } else if (typeof value === 'string' && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
          continue;
        }
      }

      if (JSONB_FIELDS.includes(field)) {
        if (!Array.isArray(value)) {
          continue;
        }
      }

      if (BOOLEAN_FIELDS.includes(field)) {
        value = value === true || value === 'true';
      }

      if (typeof value === 'string') {
        value = value.trim();
        if (value.length > 500) {
          value = value.slice(0, 500);
        }
      }

      setClauses.push(`${field} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  const hasUpdates = setClauses.length > 0;
  if (hasUpdates) {
    setClauses.push(`updated_at = NOW()`);
  }

  if (!hasUpdates) {
    return getBookingLanding(companyId);
  }

  values.push(companyId);

  await pool.query(
    `UPDATE companies SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  return getCompanyTheme(companyId);
}

// ============================================================
// CRM — Client Relationship Management
// ============================================================

function computeLoyaltyLevel(totalVisits) {
  if (totalVisits >= 20) return 'vip';
  if (totalVisits >= 10) return 'fiel';
  if (totalVisits >= 3) return 'regular';
  return 'novo';
}

function computeLoyaltyLabel(level) {
  return { vip: 'VIP', fiel: 'Fiel', regular: 'Recorrente', novo: 'Novo' }[level] || 'Novo';
}

async function getClientCrm(companyId, customerId) {
  ensureCompany(companyId);

  const customerResult = await pool.query(
    `SELECT id, company_id, name, phone, email, email_verified, status,
            source, birth_date, notes, avatar_url, crm_score,
            created_at, updated_at, last_login_at
     FROM booking_customers
     WHERE company_id = $1 AND id = $2
     LIMIT 1`,
    [companyId, customerId]
  );

  if (customerResult.rowCount === 0) {
    throw createError('Cliente nao encontrado', 404);
  }

  const customer = customerResult.rows[0];

  const metricsResult = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'completed')::integer AS total_visits,
       COUNT(*) FILTER (WHERE status = 'canceled')::integer AS canceled_count,
       COUNT(*) FILTER (WHERE status = 'no_show')::integer AS no_show_count,
       COUNT(*) FILTER (WHERE status IN ('confirmed', 'arrived', 'in_progress'))::integer AS confirmed_count,
       COUNT(*)::integer AS total_appointments,
       MAX(starts_at) FILTER (WHERE status = 'completed') AS last_visit_at
     FROM barber_appointments
     WHERE company_id = $1 AND customer_id = $2`,
    [companyId, customerId]
  );

  const metrics = metricsResult.rows[0];
  const totalVisits = Number(metrics.total_visits || 0);
  const loyaltyLevel = computeLoyaltyLevel(totalVisits);

  const lastServiceResult = await pool.query(
    `SELECT ba.starts_at, bs.name AS service_name
     FROM barber_appointments ba
     INNER JOIN barber_services bs ON bs.id = ba.service_id AND bs.company_id = ba.company_id
     WHERE ba.company_id = $1 AND ba.customer_id = $2 AND ba.status = 'completed'
     ORDER BY ba.starts_at DESC
     LIMIT 1`,
    [companyId, customerId]
  );

  const lastService = lastServiceResult.rows[0];

  const favoriteResult = await pool.query(
    `SELECT bs.name, COUNT(*)::integer AS total
     FROM barber_appointments ba
     INNER JOIN barber_services bs ON bs.id = ba.service_id AND bs.company_id = ba.company_id
     WHERE ba.company_id = $1 AND ba.customer_id = $2 AND ba.status = 'completed'
     GROUP BY bs.name
     ORDER BY total DESC
     LIMIT 3`,
    [companyId, customerId]
  );

  const favoriteServices = favoriteResult.rows.map(r => ({ name: r.name, count: r.total }));

  const spentResult = await pool.query(
    `SELECT
       COALESCE(SUM(total_amount), 0)::numeric AS total_spent,
       COUNT(*)::integer AS paid_visits
     FROM barber_sales
     WHERE company_id = $1 AND customer_id = $2 AND status NOT IN ('canceled')`,
    [companyId, customerId]
  );

  const totalSpent = Number(spentResult.rows[0].total_spent || 0);
  const paidVisits = Number(spentResult.rows[0].paid_visits || 0);
  const averageTicket = paidVisits > 0 ? (totalSpent / paidVisits) : 0;

  const tagsResult = await pool.query(
    `SELECT tag FROM barber_client_tags
     WHERE company_id = $1 AND client_id = $2
     ORDER BY created_at ASC`,
    [companyId, customerId]
  );

  const tags = tagsResult.rows.map(r => r.tag);

  const notesResult = await pool.query(
    `SELECT n.id, n.note, n.created_at, u.name AS author_name
     FROM barber_client_notes n
     LEFT JOIN users u ON u.id = n.author_user_id
     WHERE n.company_id = $1 AND n.client_id = $2
     ORDER BY n.created_at DESC
     LIMIT 10`,
    [companyId, customerId]
  );

  const eventsResult = await pool.query(
    `SELECT id, event_type, title, description, metadata, created_at
     FROM barber_client_events
     WHERE company_id = $1 AND client_id = $2
     ORDER BY created_at DESC
     LIMIT 20`,
    [companyId, customerId]
  );

  const futureResult = await pool.query(
    `SELECT ba.id, ba.starts_at, ba.ends_at, ba.status, ba.customer_name,
            bs.name AS service_name,
            COALESCE(u.name, bc2.nickname) AS collaborator_name
     FROM barber_appointments ba
     INNER JOIN barber_services bs ON bs.id = ba.service_id AND bs.company_id = ba.company_id
     INNER JOIN barber_collaborators bc2 ON bc2.id = ba.collaborator_id AND bc2.company_id = ba.company_id
     LEFT JOIN users u ON u.id = bc2.user_id
     WHERE ba.company_id = $1 AND ba.customer_id = $2
       AND ba.starts_at >= NOW()
       AND ba.status NOT IN ('canceled', 'completed', 'no_show')
     ORDER BY ba.starts_at ASC
     LIMIT 10`,
    [companyId, customerId]
  );

  const recencyDays = lastService?.starts_at
    ? Math.max(0, Math.floor((Date.now() - new Date(lastService.starts_at).getTime()) / (1000 * 60 * 60 * 24)))
    : 999;
  const recencyScore = Math.max(0, 50 - recencyDays);
  const visitsScore = totalVisits * 10;
  const spendingScore = Math.min(100, totalSpent * 0.1);
  const crmScore = Math.round(visitsScore + recencyScore + spendingScore);

  return {
    ...customer,
    origin: customer.source || 'agendamento_online',
    metrics: {
      total_visits: totalVisits,
      total_appointments: Number(metrics.total_appointments || 0),
      canceled_count: Number(metrics.canceled_count || 0),
      no_show_count: Number(metrics.no_show_count || 0),
      confirmed_count: Number(metrics.confirmed_count || 0),
      total_spent: Number(totalSpent.toFixed(2)),
      average_ticket: Number(averageTicket.toFixed(2)),
      paid_visits: paidVisits
    },
    loyalty: {
      level: loyaltyLevel,
      label: computeLoyaltyLabel(loyaltyLevel),
      score: crmScore
    },
    last_service: lastService ? {
      name: lastService.service_name,
      date: lastService.starts_at
    } : null,
    favorite_services: favoriteServices,
    tags,
    notes: notesResult.rows,
    events: eventsResult.rows,
    future_appointments: futureResult.rows
  };
}

async function getClientHistory(companyId, customerId) {
  ensureCompany(companyId);

  const appointmentsResult = await pool.query(
    `SELECT ba.id, ba.starts_at, ba.ends_at, ba.status, ba.customer_name,
            ba.notes AS appointment_notes, ba.canceled_reason,
            ba.created_at AS appointment_created_at,
            bs.name AS service_name,
            bs.price AS service_price,
            COALESCE(u.name, bc2.nickname) AS collaborator_name
     FROM barber_appointments ba
     INNER JOIN barber_services bs ON bs.id = ba.service_id AND bs.company_id = ba.company_id
     INNER JOIN barber_collaborators bc2 ON bc2.id = ba.collaborator_id AND bc2.company_id = ba.company_id
     LEFT JOIN users u ON u.id = bc2.user_id
     WHERE ba.company_id = $1 AND ba.customer_id = $2
     ORDER BY ba.starts_at DESC
     LIMIT 50`,
    [companyId, customerId]
  );

  const salesResult = await pool.query(
    `SELECT bs.id, bs.sale_date_local, bs.total_amount, bs.payment_method,
            bs.status AS sale_status, bs.created_at AS sale_created_at,
            bc2.nickname AS collaborator_name
     FROM barber_sales bs
     INNER JOIN barber_collaborators bc2 ON bc2.id = bs.collaborator_id AND bc2.company_id = bs.company_id
     WHERE bs.company_id = $1 AND bs.customer_id = $2
     ORDER BY bs.sale_date_local DESC
     LIMIT 50`,
    [companyId, customerId]
  );

  const notesResult = await pool.query(
    `SELECT n.id, n.note, n.created_at, u.name AS author_name
     FROM barber_client_notes n
     LEFT JOIN users u ON u.id = n.author_user_id
     WHERE n.company_id = $1 AND n.client_id = $2
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [companyId, customerId]
  );

  const eventsResult = await pool.query(
    `SELECT id, event_type, title, description, metadata, created_at
     FROM barber_client_events
     WHERE company_id = $1 AND client_id = $2
     ORDER BY created_at DESC
     LIMIT 50`,
    [companyId, customerId]
  );

  return {
    appointments: appointmentsResult.rows,
    sales: salesResult.rows,
    notes: notesResult.rows,
    events: eventsResult.rows
  };
}

async function createClientNote(companyId, customerId, userId, data) {
  ensureCompany(companyId);

  if (!data.note || String(data.note).trim().length === 0) {
    throw createError('A anotacao nao pode estar vazia', 400);
  }

  const result = await pool.query(
    `INSERT INTO barber_client_notes (company_id, client_id, author_user_id, note)
     VALUES ($1, $2, $3, $4)
     RETURNING id, company_id, client_id, author_user_id, note, created_at`,
    [companyId, customerId, userId, String(data.note).trim()]
  );

  return result.rows[0];
}

async function updateCustomer(companyId, customerId, data) {
  ensureCompany(companyId);

  const allowedFields = ['name', 'phone', 'email', 'birth_date', 'notes'];
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  values.push(companyId);
  values.push(customerId);

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      setClauses.push(`${field} = $${paramIndex + 2}`);
      values.push(data[field]);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    throw createError('Nenhum campo valido para atualizar', 400);
  }

  setClauses.push('updated_at = NOW()');

  const result = await pool.query(
    `UPDATE booking_customers
     SET ${setClauses.join(', ')}
     WHERE company_id = $1 AND id = $2
     RETURNING id, company_id, name, phone, email, email_verified, status, source, birth_date, notes, avatar_url, created_at, updated_at, last_login_at`,
    values
  );

  if (result.rowCount === 0) {
    throw createError('Cliente nao encontrado', 404);
  }

  return {
    ...result.rows[0],
    origin: result.rows[0].source || 'agendamento_online'
  };
}

async function uploadBookingBanner(companyId, file) {
  if (!file) {
    throw createError('Envie uma imagem para o banner.', 400);
  }

  const mimeTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };

  const extension = mimeTypes[file.mimetype];
  if (!extension) {
    throw createError('Formato de imagem nao suportado. Aceito apenas JPG, PNG e WEBP.', 400);
  }

  const bucket = process.env.SUPABASE_BUCKET || 'barber-collaborators';
  const storagePath = `booking/${companyId}/banner.${extension}`;

  let bannerUrl;

  if (supabase) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      appLogger.error({ err: error }, '[supabase-banner-upload-error]');
      throw new Error(`Erro ao enviar banner: ${error.message}`);
    }

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    bannerUrl = publicData.publicUrl;
  } else {
    const uploadDir = path.join(UPLOADS_ROOT, 'barber-booking', String(companyId));
    const relativePath = `barber-booking/${companyId}/banner.${extension}`;
    const filePath = path.join(UPLOADS_ROOT, relativePath);

    await fs.mkdir(uploadDir, { recursive: true });

    const existingFiles = await fs.readdir(uploadDir).catch(() => []);
    await Promise.all(
      existingFiles
        .filter((f) => f.startsWith('banner.'))
        .map((f) => fs.unlink(path.join(uploadDir, f)).catch(() => undefined))
    );

    await fs.writeFile(filePath, file.buffer);
    bannerUrl = getPublicAssetUrl(relativePath);
  }

  await pool.query(
    `INSERT INTO barber_booking_landing (company_id, banner_url)
     VALUES ($1, $2)
     ON CONFLICT (company_id) DO UPDATE SET banner_url = EXCLUDED.banner_url, updated_at = NOW()`,
    [companyId, bannerUrl]
  );

  return getBookingLanding(companyId);
}

async function removeBookingBanner(companyId) {
  const landing = await getBookingLanding(companyId);

  if (landing.banner_url && supabase) {
    const bucket = process.env.SUPABASE_BUCKET || 'barber-collaborators';
    const { data: listData } = await supabase.storage
      .from(bucket)
      .list(`booking/${companyId}`);

    if (listData) {
      const bannerFiles = listData
        .filter((f) => f.name.startsWith('banner.'))
        .map((f) => `booking/${companyId}/${f.name}`);

      if (bannerFiles.length > 0) {
        await supabase.storage.from(bucket).remove(bannerFiles);
      }
    }
  }

  if (landing.banner_url && !supabase) {
    const uploadDir = path.join(UPLOADS_ROOT, 'barber-booking', String(companyId));
    const existingFiles = await fs.readdir(uploadDir).catch(() => []);
    await Promise.all(
      existingFiles
        .filter((f) => f.startsWith('banner.'))
        .map((f) => fs.unlink(path.join(uploadDir, f)).catch(() => undefined))
    );
  }

  await pool.query(
    `UPDATE barber_booking_landing SET banner_url = NULL, updated_at = NOW() WHERE company_id = $1`,
    [companyId]
  );

  return getBookingLanding(companyId);
}

async function addBookingGalleryImage(companyId, file) {
  if (!file) {
    throw createError('Envie uma imagem para a galeria.', 400);
  }

  const mimeTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };

  const extension = mimeTypes[file.mimetype];
  if (!extension) {
    throw createError('Formato de imagem nao suportado. Aceito apenas JPG, PNG e WEBP.', 400);
  }

  const imageId = crypto.randomUUID ? crypto.randomUUID() : require('uuid').v4();
  const bucket = process.env.SUPABASE_BUCKET || 'barber-collaborators';
  const storagePath = `booking/${companyId}/gallery/${imageId}.${extension}`;

  let imageUrl;

  if (supabase) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      appLogger.error({ err: error }, '[supabase-gallery-upload-error]');
      throw new Error(`Erro ao enviar imagem: ${error.message}`);
    }

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    imageUrl = publicData.publicUrl;
  } else {
    const uploadDir = path.join(UPLOADS_ROOT, 'barber-booking', String(companyId), 'gallery');
    const relativePath = `barber-booking/${companyId}/gallery/${imageId}.${extension}`;
    const filePath = path.join(UPLOADS_ROOT, relativePath);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, file.buffer);
    imageUrl = getPublicAssetUrl(relativePath);
  }

  await pool.query(
    `INSERT INTO barber_booking_landing (company_id, gallery)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (company_id) DO UPDATE SET gallery = (
       SELECT jsonb_agg(val) FROM (
         SELECT jsonb_array_elements(COALESCE(barber_booking_landing.gallery, '[]'::jsonb) || $2::jsonb) AS val
       ) sub
     ), updated_at = NOW()`,
    [companyId, JSON.stringify([{ id: imageId, url: imageUrl }])]
  );

  return getBookingLanding(companyId);
}

async function removeBookingGalleryImage(companyId, imageId) {
  const landing = await getBookingLanding(companyId);
  const image = (landing.gallery || []).find((img) => img.id === imageId);

  if (image && supabase) {
    const bucket = process.env.SUPABASE_BUCKET || 'barber-collaborators';
    const { data: listData } = await supabase.storage
      .from(bucket)
      .list(`booking/${companyId}/gallery`);

    if (listData) {
      const filesToDelete = listData
        .filter((f) => f.name.startsWith(`${imageId}.`))
        .map((f) => `booking/${companyId}/gallery/${f.name}`);

      if (filesToDelete.length > 0) {
        await supabase.storage.from(bucket).remove(filesToDelete);
      }
    }
  }

  if (image && !supabase) {
    const galleryDir = path.join(UPLOADS_ROOT, 'barber-booking', String(companyId), 'gallery');
    const existingFiles = await fs.readdir(galleryDir).catch(() => []);
    await Promise.all(
      existingFiles
        .filter((f) => f.startsWith(`${imageId}.`))
        .map((f) => fs.unlink(path.join(galleryDir, f)).catch(() => undefined))
    );
  }

  await pool.query(
    `UPDATE barber_booking_landing SET gallery = COALESCE(
       (SELECT jsonb_agg(elem) FROM jsonb_array_elements(gallery) AS elem WHERE elem->>'id' != $2),
       '[]'::jsonb
     ), updated_at = NOW() WHERE company_id = $1`,
    [companyId, imageId]
  );

  return getBookingLanding(companyId);
}

async function getCompanyPlanProfile(companyId) {
  ensureCompany(companyId);

  const companyPlan = await getCompanyPlanSnapshot(companyId);

  if (!companyPlan) {
    throw createError('Empresa nao encontrada para carregar o plano', 404);
  }

  return {
    company_id: companyId,
    plan: companyPlan.plan_type,
    status: companyPlan.plan_status,
    isActive: Boolean(companyPlan.is_active),
    trialEndsAt: companyPlan.trial_ends_at || null,
    currentPeriodStart: companyPlan.current_period_start || null,
    currentPeriodEnd: companyPlan.current_period_end || companyPlan.next_due_date || null,
    nextDueDate: companyPlan.next_due_date || null,
    maxCollaborators: companyPlan.max_collaborators ?? null,
    gateway: companyPlan.gateway || null,
    source: companyPlan.source || 'unknown',
    subscriptionStatus: companyPlan.subscription_status || null,
    features: companyPlan.features || {}
  };
}

async function forgotPin(companyId, user, data = {}) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode iniciar a recuperacao de PIN');
  await ensurePinRecoverySchema();

  const email = normalizeEmail(data.email);

  if (!isValidEmail(email)) {
    throw createError('Informe um e-mail valido para recuperar o PIN.', 400);
  }

  const genericResponse = {
    success: true,
    message: 'Se o e-mail estiver correto, enviaremos um codigo de recuperacao.'
  };

  const accountResult = await pool.query(
    `SELECT users.id, users.name, users.email, companies.name AS company_name
     FROM users
     INNER JOIN companies ON companies.id = users.company_id
     WHERE users.company_id = $1
       AND users.email = $2
       AND users.role IN ('admin', 'owner')
       AND COALESCE(users.is_active, true) = true
     LIMIT 1`,
    [companyId, email]
  );

  if (accountResult.rowCount === 0) {
    return genericResponse;
  }

  const account = accountResult.rows[0];
  const code = String(Math.floor(100000 + (Math.random() * 900000)));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + (PIN_RESET_EXPIRATION_MINUTES * 60 * 1000));

  await pool.query(
    `UPDATE pin_reset_tokens
     SET used_at = NOW()
     WHERE company_id = $1
       AND user_id = $2
       AND used_at IS NULL`,
    [companyId, account.id]
  );

  await pool.query(
    `INSERT INTO pin_reset_tokens (
       company_id,
       user_id,
       email,
       token_hash,
       expires_at
     )
     VALUES ($1, $2, $3, $4, $5)`,
    [companyId, account.id, account.email, codeHash, expiresAt]
  );

  try {
    await emailService.sendBarberPinResetEmail({
      to: account.email,
      name: account.name,
      companyName: account.company_name,
      code,
      expiresAt
    });
  } catch (error) {
    appLogger.error({ companyId, userId: account.id, email: account.email, err: error }, '[pin-reset-email] Falha ao enviar codigo de recuperacao');
  }

  return genericResponse;
}

async function resetPin(companyId, user, data = {}) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode redefinir o PIN');
  await ensurePinRecoverySchema();

  const email = normalizeEmail(data.email);
  const code = String(data.code || '').trim();
  const newPin = normalizePin(data.newPin || data.new_pin);

  if (!isValidEmail(email)) {
    throw createError('Informe um e-mail valido para redefinir o PIN.', 400);
  }

  if (!/^\d{6}$/.test(code)) {
    throw createError('Informe o codigo de 6 digitos enviado por e-mail.', 400);
  }

  if (!isValidPin(newPin, 4)) {
    throw createError('Informe um novo PIN com pelo menos 4 digitos.', 400);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const tokenResult = await client.query(
      `SELECT pin_reset_tokens.id,
              pin_reset_tokens.user_id,
              pin_reset_tokens.token_hash,
              pin_reset_tokens.expires_at,
              pin_reset_tokens.used_at
       FROM pin_reset_tokens
       INNER JOIN users
         ON users.id = pin_reset_tokens.user_id
        AND users.company_id = pin_reset_tokens.company_id
       WHERE pin_reset_tokens.company_id = $1
         AND pin_reset_tokens.email = $2
         AND users.role IN ('admin', 'owner')
       ORDER BY pin_reset_tokens.created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [companyId, email]
    );

    if (tokenResult.rowCount === 0) {
      throw createError('Codigo de recuperacao invalido ou expirado.', 400);
    }

    const tokenRecord = tokenResult.rows[0];

    if (tokenRecord.used_at || new Date(tokenRecord.expires_at).getTime() < Date.now()) {
      throw createError('Codigo de recuperacao invalido ou expirado.', 400);
    }

    const codeMatches = await bcrypt.compare(code, tokenRecord.token_hash);

    if (!codeMatches) {
      throw createError('Codigo de recuperacao invalido ou expirado.', 400);
    }

    const pinHash = await bcrypt.hash(newPin, 10);

    await client.query(
      `UPDATE users
       SET pin_hash = $1,
           updated_at = NOW()
       WHERE id = $2
         AND company_id = $3`,
      [pinHash, tokenRecord.user_id, companyId]
    );

    await client.query(
      `UPDATE pin_reset_tokens
       SET used_at = NOW()
       WHERE company_id = $1
         AND user_id = $2
         AND used_at IS NULL`,
      [companyId, tokenRecord.user_id]
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: 'PIN atualizado com sucesso.'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function ensureCashManager(user, message = 'Apenas usuarios autorizados podem operar o caixa') {
  if (!['admin', 'master_admin', 'secretary'].includes(user?.role)) {
    throw createError(message, 403);
  }
}

function ensureCollaboratorRole(user) {
  if (user?.role !== 'collaborator') {
    throw createError('Acesso permitido apenas para colaborador', 403);
  }
}

function requireCollaboratorPermission(user, permission, message) {
  if (user?.role !== 'collaborator') {
    return;
  }

  if (!user?.[permission]) {
    throw createError(message, 403);
  }
}

function isAdmin(user) {
  return ['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin'].includes(user?.role);
}

function isSaleActiveSql(alias = 'barber_sales') {
  return `LOWER(TRIM(COALESCE(${alias}.status, 'active'))) NOT IN ('deleted', 'cancelled', 'canceled', 'removed')
    AND LOWER(TRIM(COALESCE(${alias}.status, 'active'))) IN ('active', 'completed', 'paid', 'finalized')
    AND ${alias}.canceled_at IS NULL
    AND (
      ${alias}.collaborator_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM barber_collaborators sale_collaborator_filter
        WHERE sale_collaborator_filter.id = ${alias}.collaborator_id
          AND sale_collaborator_filter.company_id = ${alias}.company_id
          AND COALESCE(sale_collaborator_filter.is_deleted, false) = false
          AND COALESCE(sale_collaborator_filter.is_active, true) = true
      )
    )`;
}

function getSaleItemType(item = {}) {
  return String(item.item_type || item.itemType || (item.product_id || item.productId ? 'product' : 'service')).trim().toLowerCase();
}

function getSaleItemId(item = {}, itemType = getSaleItemType(item)) {
  if (itemType === 'product') {
    return item.product_id || item.productId || item.item_id || item.itemId || null;
  }

  return item.service_id || item.serviceId || item.item_id || item.itemId || null;
}

function normalizePaymentMethod(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return PAYMENT_METHOD_ALIASES[normalized] || normalized;
}

function isBarterPayment(paymentMethod) {
  return normalizePaymentMethod(paymentMethod) === 'permuta';
}

function getBusinessDateParts(input = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const values = Object.fromEntries(
    formatter
      .formatToParts(input)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    date: `${values.year}-${values.month}-${values.day}`
  };
}

function getBusinessDateString(input = new Date()) {
  return getBusinessDateParts(input).date;
}

function normalizeDateInput(value, fallback = null) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return fallback;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw createError('Data invalida. Use o formato YYYY-MM-DD', 400);
  }

  return normalized;
}

function normalizeTimeInput(value, fallback = null) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return fallback;
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(normalized)) {
    throw createError('Horario invalido. Use o formato HH:MM', 400);
  }

  return normalized.length === 5 ? `${normalized}:00` : normalized;
}

function getMonthRange(dateInput = getBusinessDateString()) {
  const [year, month] = normalizeDateInput(dateInput).split('-').map(Number);
  const start = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(Date.UTC(year, month, 0));
  const end = `${String(endDate.getUTCFullYear()).padStart(4, '0')}-${String(endDate.getUTCMonth() + 1).padStart(2, '0')}-${String(endDate.getUTCDate()).padStart(2, '0')}`;
  return { start, end };
}

function getWeekRange(dateInput = getBusinessDateString()) {
  const [year, month, day] = normalizeDateInput(dateInput).split('-').map(Number);
  const reference = new Date(Date.UTC(year, month - 1, day));
  const weekDay = reference.getUTCDay();
  const diff = weekDay === 0 ? 6 : weekDay - 1;
  reference.setUTCDate(reference.getUTCDate() - diff);

  const start = `${String(reference.getUTCFullYear()).padStart(4, '0')}-${String(reference.getUTCMonth() + 1).padStart(2, '0')}-${String(reference.getUTCDate()).padStart(2, '0')}`;
  const endDate = new Date(reference);
  endDate.setUTCDate(reference.getUTCDate() + 6);
  const end = `${String(endDate.getUTCFullYear()).padStart(4, '0')}-${String(endDate.getUTCMonth() + 1).padStart(2, '0')}-${String(endDate.getUTCDate()).padStart(2, '0')}`;

  return { start, end };
}

function addDateDays(dateInput, days) {
  const [year, month, day] = normalizeDateInput(dateInput).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + Number(days || 0));

  return `${String(date.getUTCFullYear()).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function buildBusinessTimestampRange(startDate, endDate) {
  const start = normalizeDateInput(startDate);
  const endExclusive = addDateDays(normalizeDateInput(endDate), 1);

  const [startYear, startMonth, startDay] = start.split('-').map(Number);
  const [endYear, endMonth, endDay] = endExclusive.split('-').map(Number);

  const startUTC = new Date(Date.UTC(startYear, startMonth - 1, startDay, 4, 0, 0, 0));
  const endUTC = new Date(Date.UTC(endYear, endMonth - 1, endDay, 4, 0, 0, 0));

  return {
    startAt: startUTC.toISOString(),
    endAt: endUTC.toISOString()
  };
}

function normalizeCashDateFromSale(sale) {
  const saleDate = sale?.sale_date_local
    || sale?.sale_date
    || sale?.created_at
    || sale?.createdAt;

  const cashDate = saleDate instanceof Date
    ? saleDate.toISOString().slice(0, 10)
    : String(saleDate || '').slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cashDate)) {
    throw createError('Data da venda invalida para recalcular o caixa diario.', 400);
  }

  return cashDate;
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
  };
}

function normalizeSupplierPayload(data = {}) {
  return {
    name: String(data.name || '').trim(),
    companyName: String(data.company_name || data.companyName || '').trim() || null,
    phone: String(data.phone || '').trim() || null,
    email: normalizeEmail(data.email) || null,
    document: String(data.document || '').trim() || null,
    notes: String(data.notes || '').trim() || null,
    isActive: data.is_active === undefined && data.isActive === undefined
      ? true
      : Boolean(data.is_active ?? data.isActive)
  };
}

function validateSupplierPayload(payload) {
  if (!payload.name) {
    throw createError('Nome do fornecedor e obrigatorio', 400);
  }
}

function normalizeProductPayload(data = {}) {
  const rawStatus = data.status || data.product_status;
  const normalizedStatus = String(rawStatus || '').trim().toLowerCase();
  const resolvedIsActive = normalizedStatus
    ? normalizedStatus === 'ativo' || normalizedStatus === 'active'
    : null;

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
    isActive: resolvedIsActive !== null
      ? resolvedIsActive
      : data.is_active === undefined && data.isActive === undefined
        ? true
        : Boolean(data.is_active ?? data.isActive)
  };
}

function validateProductPayload(payload) {
  if (!payload.name) {
    throw createError('Nome do produto e obrigatorio', 400);
  }

  if (payload.costPrice < 0) {
    throw createError('Preco de custo invalido', 400);
  }

  if (payload.salePrice < 0) {
    throw createError('Preco de venda invalido', 400);
  }

  if (payload.stockCurrent < 0) {
    throw createError('Estoque atual invalido', 400);
  }

  if (payload.stockMinimum < 0) {
    throw createError('Estoque minimo invalido', 400);
  }

  if (!COMMISSION_TYPES.includes(payload.commissionType)) {
    throw createError('Tipo de comissao invalido', 400);
  }

  if (payload.commissionValue < 0) {
    throw createError('Comissao invalida', 400);
  }
}

function validateServicePayload(payload) {
  if (!payload.name) {
    throw createError('Nome do servico e obrigatorio', 400);
  }

  if (payload.price < 0) {
    throw createError('Preco invalido', 400);
  }

  if (payload.commissionValue < 0) {
    throw createError('Comissao invalida', 400);
  }

  if (!SERVICE_TYPES.includes(payload.serviceType)) {
    throw createError('Tipo de servico invalido', 400);
  }

  if (!COMMISSION_TYPES.includes(payload.commissionType)) {
    throw createError('Tipo de comissao invalido', 400);
  }

  if (payload.estimatedTimeMinutes !== null && payload.estimatedTimeMinutes < 0) {
    throw createError('Tempo medio invalido', 400);
  }
}

function normalizeCollaboratorPayload(data = {}) {
  return {
    name: String(data.name || data.nickname || '').trim(),
    email: normalizeEmail(data.email),
    password: String(data.password || data.initialPassword || ''),
    phone: String(data.phone || '').trim() || null,
    commissionType: String(data.commission_type || data.commissionType || 'percentage').trim() || 'percentage',
    commissionRateRaw: data.commission_rate ?? data.commissionRate,
    commissionRate: toNumber(data.commission_rate || data.commissionRate),
    isActive: data.is_active === undefined && data.isActive === undefined
      ? true
      : Boolean(data.is_active ?? data.isActive),
    canLaunchSales: data.can_launch_sales === undefined && data.canLaunchSales === undefined
      ? false
      : Boolean(data.can_launch_sales ?? data.canLaunchSales),
    canMakeBarter: data.can_make_barter === undefined && data.canMakeBarter === undefined
      ? false
      : Boolean(data.can_make_barter ?? data.canMakeBarter),
    availableForBooking: data.available_for_booking === undefined && data.availableForBooking === undefined
      ? false
      : Boolean(data.available_for_booking ?? data.availableForBooking),
    canViewOwnDashboard: data.can_view_own_dashboard === undefined && data.canViewOwnDashboard === undefined
      ? true
      : Boolean(data.can_view_own_dashboard ?? data.canViewOwnDashboard),
    canViewOwnReports: data.can_view_own_reports === undefined && data.canViewOwnReports === undefined
      ? true
      : Boolean(data.can_view_own_reports ?? data.canViewOwnReports)
  };
}

function validateCollaboratorPayload(payload, options = {}) {
  // REGRA GLOBAL: nunca retornar 500 por erro de input.
  // Toda validacao deve acontecer antes do banco.
  if (!payload.name) {
    throw createError('Nome do colaborador e obrigatorio', 400);
  }

  if (!payload.email) {
    throw createError('Email do colaborador e obrigatorio', 400);
  }

  if (!isValidEmail(payload.email)) {
    throw createError('Informe um e-mail válido para o colaborador.', 400);
  }

  if (!options.allowMissingPassword && !isValidPassword(payload.password, 6)) {
    throw createError('A senha inicial deve ter pelo menos 6 caracteres', 400);
  }

  if (payload.password && !isValidPassword(payload.password, 6)) {
    throw createError('A senha deve ter pelo menos 6 caracteres', 400);
  }

  if (!COMMISSION_TYPES.includes(payload.commissionType)) {
    throw createError('Tipo de comissao invalido', 400);
  }

  if (!isFiniteNumberValue(payload.commissionRateRaw)) {
    throw createError('Informe uma comissao numerica valida', 400);
  }

  if (payload.commissionRate < 0) {
    throw createError('Comissao invalida', 400);
  }
}

function normalizeAppointmentPayload(data = {}) {
  const startsAtValue = String(data.starts_at || data.startsAt || '').trim();
  const startsAt = startsAtValue ? new Date(startsAtValue) : null;

  return {
    serviceId: data.service_id || data.serviceId || null,
    collaboratorId: data.collaborator_id || data.collaboratorId || null,
    customerName: String(data.customer_name || data.customerName || '').trim(),
    customerPhone: String(data.customer_phone || data.customerPhone || '').trim(),
    customerEmail: normalizeEmail(data.customer_email || data.customerEmail) || null,
    startsAt,
    status: String(data.status || 'scheduled').trim().toLowerCase() || 'scheduled',
    notes: String(data.notes || '').trim() || null
  };
}

function validateAppointmentPayload(payload, options = {}) {
  if (!payload.serviceId) {
    throw createError('Servico e obrigatorio para o agendamento', 400);
  }

  if (!payload.collaboratorId) {
    throw createError('Profissional e obrigatorio para o agendamento', 400);
  }

  if (!payload.customerName) {
    throw createError('Nome do cliente e obrigatorio', 400);
  }

  if (!payload.customerPhone) {
    throw createError('Telefone do cliente e obrigatorio', 400);
  }

  if (!(payload.startsAt instanceof Date) || Number.isNaN(payload.startsAt.getTime())) {
    throw createError('Data e horario do agendamento sao obrigatorios', 400);
  }

  if (!options.allowCustomStatus && payload.status !== 'scheduled') {
    throw createError('Status inicial de agendamento invalido', 400);
  }

  if (options.allowCustomStatus && !APPOINTMENT_STATUS.includes(payload.status)) {
    throw createError('Status do agendamento invalido', 400);
  }
}

function buildReportPeriod(filter = 'today', startDate, endDate) {
  const period = String(filter || 'today').trim();
  const today = getBusinessDateString();

  if (period === 'week') {
    return getWeekRange(today);
  }

  if (period === 'month') {
    return getMonthRange(today);
  }

  if (period === 'custom' && startDate && endDate) {
    const start = normalizeDateInput(startDate);
    const end = normalizeDateInput(endDate);

    if (start > end) {
      throw createError('Periodo personalizado invalido', 400);
    }

    return { start, end };
  }

  return {
    start: today,
    end: today
  };
}

async function getCollaboratorForUser(companyId, userId, client = pool) {
  const result = await client.query(
    `SELECT id, nickname, commission_type, commission_rate, can_make_barter, is_active, is_deleted
     FROM barber_collaborators
     WHERE company_id = $1
       AND user_id = $2
       AND COALESCE(is_deleted, false) = false
     LIMIT 1`,
    [companyId, userId]
  );

  if (result.rowCount === 0) {
    throw createError('Colaborador nao vinculado ao usuario', 403);
  }

  return result.rows[0];
}

async function getCollaboratorRecord(companyId, collaboratorId, client = pool) {
  const result = await client.query(
    `SELECT
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
       barber_collaborators.updated_at,
       users.name,
       users.email,
       users.phone,
       users.role,
       users.can_launch_sales,
       users.can_view_own_dashboard,
       users.can_view_own_reports,
       users.is_active AS user_is_active
     FROM barber_collaborators
     LEFT JOIN users ON users.id = barber_collaborators.user_id
     WHERE barber_collaborators.id = $1
       AND barber_collaborators.company_id = $2
       AND COALESCE(barber_collaborators.is_deleted, false) = false
     LIMIT 1`,
    [collaboratorId, companyId]
  );

  if (result.rowCount === 0) {
    throw createError('Colaborador nao encontrado', 404);
  }

  return result.rows[0];
}

async function ensureServiceExists(companyId, serviceId, client = pool) {
  const result = await client.query(
    `SELECT
       id,
       company_id,
       name,
       description,
       price,
       service_type,
       icon,
       commission_type,
       commission_value,
       estimated_time_minutes,
       is_active,
       is_deleted,
       created_at,
       updated_at
     FROM barber_services
     WHERE id = $1
       AND company_id = $2
       AND COALESCE(is_deleted, false) = false
     LIMIT 1`,
    [serviceId, companyId]
  );

  if (result.rowCount === 0) {
    throw createError('Servico nao encontrado', 404);
  }

  return result.rows[0];
}

async function ensureBookableService(companyId, serviceId, client = pool) {
  const service = await ensureServiceExists(companyId, serviceId, client);

  if (!service.is_active) {
    throw createError('Servico indisponivel para agendamento', 400);
  }

  return service;
}

async function ensureBookableCollaborator(companyId, collaboratorId, client = pool) {
  const result = await client.query(
    `SELECT
       barber_collaborators.id,
       barber_collaborators.company_id,
       barber_collaborators.user_id,
       barber_collaborators.nickname,
       barber_collaborators.is_active,
       barber_collaborators.available_for_booking,
       users.name
     FROM barber_collaborators
     LEFT JOIN users ON users.id = barber_collaborators.user_id
     WHERE barber_collaborators.id = $1
       AND barber_collaborators.company_id = $2
       AND COALESCE(barber_collaborators.is_deleted, false) = false
     LIMIT 1`,
    [collaboratorId, companyId]
  );

  if (result.rowCount === 0) {
    throw createError('Profissional nao encontrado', 404);
  }

  const collaborator = result.rows[0];

  if (!collaborator.is_active || !collaborator.available_for_booking) {
    throw createError('Profissional indisponivel para agendamento', 400);
  }

  return collaborator;
}

async function ensureCompanyPublicBookingSlug(companyId, client = pool) {
  const companyResult = await client.query(
    `SELECT id, name, public_booking_slug
     FROM companies
     WHERE id = $1
     LIMIT 1`,
    [companyId]
  );

  if (companyResult.rowCount === 0) {
    throw createError('Empresa da barbearia nao encontrada', 404);
  }

  const company = companyResult.rows[0];

  if (company.public_booking_slug) {
    return {
      companyName: company.name,
      publicBookingSlug: company.public_booking_slug
    };
  }

  const baseSlug = slugifyText(company.name) || `barbearia-${String(company.id).slice(0, 8)}`;
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const conflictResult = await client.query(
      `SELECT id
       FROM companies
       WHERE public_booking_slug = $1
         AND id <> $2
       LIMIT 1`,
      [candidate, companyId]
    );

    if (conflictResult.rowCount === 0) {
      const updateResult = await client.query(
        `UPDATE companies
         SET public_booking_slug = $2
         WHERE id = $1
           AND public_booking_slug IS NULL
         RETURNING public_booking_slug`,
        [companyId, candidate]
      );

      if (updateResult.rowCount > 0) {
        return {
          companyName: company.name,
          publicBookingSlug: updateResult.rows[0].public_booking_slug
        };
      }

      const refreshed = await client.query(
        `SELECT public_booking_slug
         FROM companies
         WHERE id = $1
         LIMIT 1`,
        [companyId]
      );

      return {
        companyName: company.name,
        publicBookingSlug: refreshed.rows[0]?.public_booking_slug || candidate
      };
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function ensureSupplierExists(companyId, supplierId, client = pool) {
  const result = await client.query(
    `SELECT
       id,
       company_id,
       name,
       company_name,
       phone,
       email,
       document,
       notes,
       is_active,
       is_deleted,
       created_at,
       updated_at
     FROM barber_suppliers
     WHERE id = $1
       AND company_id = $2
       AND COALESCE(is_deleted, false) = false
     LIMIT 1`,
    [supplierId, companyId]
  );

  if (result.rowCount === 0) {
    throw createError('Fornecedor nao encontrado', 404);
  }

  return result.rows[0];
}

const PRODUCT_BASE_SELECT = `
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
  barber_products.is_active,
  barber_products.is_deleted,
  barber_products.created_at,
  barber_products.updated_at
`;

async function ensureProductExists(companyId, productId, client = pool) {
  const result = await client.query(
    `SELECT
       ${PRODUCT_BASE_SELECT}
     FROM barber_products
     WHERE id = $1
       AND company_id = $2
       AND COALESCE(is_deleted, false) = false
     LIMIT 1`,
    [productId, companyId]
  );

  if (result.rowCount === 0) {
    throw createError('Produto nao encontrado', 404);
  }

  return result.rows[0];
}

async function getCashSessionRow(companyId, cashDate, client = pool) {
  const result = await client.query(
    `SELECT
       id,
       company_id,
       cash_date,
       status,
       opened_at,
       closed_at,
       opening_balance,
       gross_total,
       net_total,
       pix_total,
       cash_total,
       credit_total,
       debit_total,
       trade_total,
       discount_total,
       change_total,
       total_sales,
       total_services,
       opened_by,
       closed_by,
       notes,
       created_at,
       updated_at
     FROM barber_cash_sessions
     WHERE company_id = $1
       AND cash_date = $2::date
     LIMIT 1`,
    [companyId, cashDate]
  );

  return result.rows[0] || null;
}

async function ensureCashSession(companyId, cashDate, userId, client = pool, options = {}) {
  const normalizedDate = normalizeDateInput(cashDate, getBusinessDateString());
  const openingBalance = toNumber(options.openingBalance);
  const notes = String(options.notes || '').trim() || null;

  await client.query(
    `INSERT INTO barber_cash_sessions (
       company_id,
       cash_date,
       status,
       opened_at,
       opening_balance,
       opened_by,
       notes,
       updated_at
     )
     VALUES ($1, $2::date, 'open', NOW(), $3, $4, $5, NOW())
     ON CONFLICT (company_id, cash_date) DO NOTHING`,
    [companyId, normalizedDate, openingBalance, userId || null, notes]
  );

  return getCashSessionRow(companyId, normalizedDate, client);
}

function ensureCashSessionEditable(session) {
  if (session?.status === 'closed') {
    throw createError('Este caixa ja foi fechado e nao pode ser alterado', 409);
  }
}

async function recalculateCashSession(companyId, cashDate, client = pool) {
  const normalizedDate = normalizeDateInput(cashDate, getBusinessDateString());
  const session = await getCashSessionRow(companyId, normalizedDate, client);

  if (!session) {
    throw createError('Caixa diario nao encontrado', 404);
  }

  const totalsResult = await client.query(
    `SELECT
       COALESCE(SUM(COALESCE(item_totals.gross_total, barber_sales.total_amount)), 0)::numeric AS gross_total,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'pix' THEN COALESCE(item_totals.gross_total, barber_sales.total_amount) ELSE 0 END), 0)::numeric AS pix_total,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'dinheiro' THEN COALESCE(item_totals.gross_total, barber_sales.total_amount) ELSE 0 END), 0)::numeric AS cash_total,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'credito' THEN COALESCE(item_totals.gross_total, barber_sales.total_amount) ELSE 0 END), 0)::numeric AS credit_total,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'debito' THEN COALESCE(item_totals.gross_total, barber_sales.total_amount) ELSE 0 END), 0)::numeric AS debit_total,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN COALESCE(item_totals.gross_total, barber_sales.total_amount) ELSE 0 END), 0)::numeric AS trade_total,
       COALESCE(SUM(barber_sales.change_amount), 0)::numeric AS change_total,
       COUNT(*)::integer AS total_sales
     FROM barber_sales
     LEFT JOIN LATERAL (
       SELECT COALESCE(SUM(total_price), 0)::numeric AS gross_total
       FROM barber_sale_items
       WHERE barber_sale_items.sale_id = barber_sales.id
         AND barber_sale_items.company_id = barber_sales.company_id
     ) item_totals ON true
     WHERE barber_sales.company_id = $1
       AND barber_sales.sale_date_local = $2::date
       AND ${isSaleActiveSql('barber_sales')}`,
    [companyId, normalizedDate]
  );

  const servicesResult = await client.query(
    `SELECT
       COALESCE(SUM(CASE WHEN barber_sale_items.item_type = 'service' THEN barber_sale_items.quantity ELSE 0 END), 0)::numeric AS total_services
     FROM barber_sale_items
     INNER JOIN barber_sales
       ON barber_sales.id = barber_sale_items.sale_id
      AND barber_sales.company_id = barber_sale_items.company_id
     WHERE barber_sales.company_id = $1
       AND barber_sales.sale_date_local = $2::date
       AND ${isSaleActiveSql('barber_sales')}`,
    [companyId, normalizedDate]
  );

  const totals = totalsResult.rows[0];
  const totalServices = toNumber(servicesResult.rows[0].total_services);
  const grossTotal = toNumber(totals.gross_total);
  const tradeTotal = toNumber(totals.trade_total);
  const changeTotal = toNumber(totals.change_total);
  const discountTotal = 0;
  const netTotal = Math.max(
    0,
    toNumber(session.opening_balance) + grossTotal - tradeTotal - changeTotal - discountTotal
  );

  const updateResult = await client.query(
    `UPDATE barber_cash_sessions
     SET gross_total = $3,
         net_total = $4,
         pix_total = $5,
         cash_total = $6,
         credit_total = $7,
         debit_total = $8,
         trade_total = $9,
         discount_total = $10,
         change_total = $11,
         total_sales = $12,
         total_services = $13,
         updated_at = NOW()
    WHERE company_id = $1
      AND cash_date = $2::date
    RETURNING
      id,
      company_id,
       cash_date,
       status,
       opened_at,
       closed_at,
       opening_balance,
       gross_total,
       net_total,
       pix_total,
       cash_total,
       credit_total,
       debit_total,
       trade_total,
       discount_total,
       change_total,
       total_sales,
       total_services,
       opened_by,
       closed_by,
       notes,
       created_at,
       updated_at`,
    [
      companyId,
      normalizedDate,
      grossTotal,
      netTotal,
      toNumber(totals.pix_total),
      toNumber(totals.cash_total),
      toNumber(totals.credit_total),
      toNumber(totals.debit_total),
      tradeTotal,
      discountTotal,
      changeTotal,
      Number(totals.total_sales || 0),
      totalServices
    ]
  );

  return updateResult.rows[0];
}

async function upsertAndRecalculateCashSession(companyId, cashDate, userId, client = pool) {
  const session = await ensureCashSession(companyId, cashDate, userId, client);
  ensureCashSessionEditable(session);
  return recalculateCashSession(companyId, cashDate, client);
}

async function appendCashAuditLog(companyId, userId, action, entityId, details, client = pool) {
  await client.query(
    `INSERT INTO barber_audit_logs (company_id, user_id, action, entity_type, entity_id, details)
     VALUES ($1, $2, $3, 'barber_cash_session', $4, $5)`,
    [companyId, userId, action, entityId || null, JSON.stringify(details || {})]
  );
}

async function listServices(companyId, user, filters = {}) {
  ensureCompany(companyId);

  const values = [companyId];
  const where = [
    'barber_services.company_id = $1',
    'COALESCE(barber_services.is_deleted, false) = false'
  ];

  const search = String(filters.search || filters.q || '').trim();
  const status = String(filters.status || 'all').trim();

  if (!isAdmin(user)) {
    where.push('barber_services.is_active = true');
  } else if (status === 'active') {
    where.push('barber_services.is_active = true');
  } else if (status === 'inactive') {
    where.push('barber_services.is_active = false');
  }

  if (search) {
    values.push(`%${search}%`);
    where.push(`(
      barber_services.name ILIKE $${values.length}
      OR COALESCE(barber_services.description, '') ILIKE $${values.length}
    )`);
  }

  const result = await pool.query(
    `SELECT
       barber_services.id,
       barber_services.company_id,
       barber_services.name,
       barber_services.description,
       barber_services.price,
       barber_services.service_type,
       barber_services.icon,
       barber_services.commission_type,
       barber_services.commission_value,
       barber_services.estimated_time_minutes,
       barber_services.is_active,
       barber_services.is_deleted,
       barber_services.created_at,
       barber_services.updated_at
     FROM barber_services
     WHERE ${where.join(' AND ')}
     ORDER BY barber_services.is_active DESC, barber_services.created_at DESC`,
    values
  );

  return result.rows;
}

async function getServiceById(companyId, user, serviceId) {
  ensureCompany(companyId);

  const service = await ensureServiceExists(companyId, serviceId);

  if (!isAdmin(user) && !service.is_active) {
    throw createError('Servico nao encontrado', 404);
  }

  return service;
}

async function createService(companyId, user, data) {
  ensureCompany(companyId);
  ensureAdmin(user);

  const payload = normalizeServicePayload(data);
  validateServicePayload(payload);

  const result = await pool.query(
    `INSERT INTO barber_services (
       company_id,
       name,
       description,
       price,
       service_type,
       icon,
       commission_type,
       commission_value,
       estimated_time_minutes,
       is_active,
       is_deleted,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, NOW())
     RETURNING
       id,
       company_id,
       name,
       description,
       price,
       service_type,
       icon,
       commission_type,
       commission_value,
       estimated_time_minutes,
       is_active,
       is_deleted,
       created_at,
       updated_at`,
    [
      companyId,
      payload.name,
      payload.description,
      payload.price,
      payload.serviceType,
      payload.icon,
      payload.commissionType,
      payload.commissionValue,
      payload.estimatedTimeMinutes,
      payload.isActive
    ]
  );

  return result.rows[0];
}

async function updateService(companyId, user, serviceId, data) {
  ensureCompany(companyId);
  ensureAdmin(user);
  await ensureServiceExists(companyId, serviceId);

  const payload = normalizeServicePayload(data);
  validateServicePayload(payload);

  const result = await pool.query(
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
     RETURNING
       id,
       company_id,
       name,
       description,
       price,
       service_type,
       icon,
       commission_type,
       commission_value,
       estimated_time_minutes,
       is_active,
       is_deleted,
       created_at,
       updated_at`,
    [
      serviceId,
      companyId,
      payload.name,
      payload.description,
      payload.price,
      payload.serviceType,
      payload.icon,
      payload.commissionType,
      payload.commissionValue,
      payload.estimatedTimeMinutes,
      payload.isActive
    ]
  );

  return result.rows[0];
}

async function updateServiceStatus(companyId, user, serviceId, data = {}) {
  ensureCompany(companyId);
  ensureAdmin(user);
  await ensureServiceExists(companyId, serviceId);

  const isActive = data.is_active === undefined && data.isActive === undefined
    ? null
    : Boolean(data.is_active ?? data.isActive);

  if (isActive === null) {
    throw createError('Status do servico e obrigatorio', 400);
  }

  const result = await pool.query(
    `UPDATE barber_services
     SET is_active = $3,
         updated_at = NOW()
     WHERE id = $1
      AND company_id = $2
      AND COALESCE(is_deleted, false) = false
     RETURNING
       id,
       company_id,
       name,
       description,
       price,
       service_type,
       icon,
       commission_type,
       commission_value,
       estimated_time_minutes,
       is_active,
       is_deleted,
       created_at,
       updated_at`,
    [serviceId, companyId, isActive]
  );

  return result.rows[0];
}

async function deleteService(companyId, user, serviceId, data = {}) {
  ensureCompany(companyId);
  ensureAdmin(user);
  await ensureServiceExists(companyId, serviceId);
  await validateApprovalCredential(companyId, user.id, data);

  const result = await pool.query(
    `UPDATE barber_services
     SET is_deleted = true,
         is_active = false,
         updated_at = NOW()
     WHERE id = $1
       AND company_id = $2
       AND COALESCE(is_deleted, false) = false
     RETURNING id`,
    [serviceId, companyId]
  );

  if (result.rowCount === 0) {
    throw createError('Servico nao encontrado', 404);
  }

  return true;
}

async function listSuppliers(companyId, user, filters = {}) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode listar fornecedores');

  const values = [companyId];
  const where = [
    'barber_suppliers.company_id = $1',
    'COALESCE(barber_suppliers.is_deleted, false) = false'
  ];
  const search = String(filters.search || filters.q || '').trim();
  const status = String(filters.status || 'all').trim();

  if (status === 'active') {
    where.push('barber_suppliers.is_active = true');
  } else if (status === 'inactive') {
    where.push('barber_suppliers.is_active = false');
  }

  if (search) {
    values.push(`%${search}%`);
    where.push(`(
      barber_suppliers.name ILIKE $${values.length}
      OR COALESCE(barber_suppliers.company_name, '') ILIKE $${values.length}
      OR COALESCE(barber_suppliers.email, '') ILIKE $${values.length}
    )`);
  }

  const result = await pool.query(
    `SELECT
       id,
       company_id,
       name,
       company_name,
       phone,
       email,
       document,
       notes,
       is_active,
       is_deleted,
       created_at,
       updated_at
     FROM barber_suppliers
     WHERE ${where.join(' AND ')}
     ORDER BY is_active DESC, created_at DESC`,
    values
  );

  return result.rows;
}

async function getSupplierById(companyId, user, supplierId) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode visualizar fornecedor');
  return ensureSupplierExists(companyId, supplierId);
}

async function createSupplier(companyId, user, data) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode cadastrar fornecedor');

  const payload = normalizeSupplierPayload(data);
  validateSupplierPayload(payload);

  const result = await pool.query(
    `INSERT INTO barber_suppliers (
       company_id,
       name,
       company_name,
       phone,
       email,
       document,
       notes,
       is_active,
       is_deleted,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW())
    RETURNING id, company_id, name, company_name, phone, email, document, notes, is_active, is_deleted, created_at, updated_at`,
    [
      companyId,
      payload.name,
      payload.companyName,
      payload.phone,
      payload.email,
      payload.document,
      payload.notes,
      payload.isActive
    ]
  );

  return result.rows[0];
}

async function updateSupplier(companyId, user, supplierId, data) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode alterar fornecedor');
  await ensureSupplierExists(companyId, supplierId);

  const payload = normalizeSupplierPayload(data);
  validateSupplierPayload(payload);

  const result = await pool.query(
    `UPDATE barber_suppliers
     SET name = $3,
         company_name = $4,
         phone = $5,
         email = $6,
         document = $7,
         notes = $8,
         is_active = $9,
         updated_at = NOW()
     WHERE id = $1
      AND company_id = $2
      AND COALESCE(is_deleted, false) = false
    RETURNING id, company_id, name, company_name, phone, email, document, notes, is_active, is_deleted, created_at, updated_at`,
    [
      supplierId,
      companyId,
      payload.name,
      payload.companyName,
      payload.phone,
      payload.email,
      payload.document,
      payload.notes,
      payload.isActive
    ]
  );

  return result.rows[0];
}

async function updateSupplierStatus(companyId, user, supplierId, data = {}) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode alterar status de fornecedor');
  await ensureSupplierExists(companyId, supplierId);

  const isActive = data.is_active === undefined && data.isActive === undefined
    ? null
    : Boolean(data.is_active ?? data.isActive);

  if (isActive === null) {
    throw createError('Status do fornecedor e obrigatorio', 400);
  }

  const result = await pool.query(
    `UPDATE barber_suppliers
     SET is_active = $3,
         updated_at = NOW()
     WHERE id = $1
      AND company_id = $2
      AND COALESCE(is_deleted, false) = false
    RETURNING id, company_id, name, company_name, phone, email, document, notes, is_active, is_deleted, created_at, updated_at`,
    [supplierId, companyId, isActive]
  );

  return result.rows[0];
}

async function deleteSupplier(companyId, user, supplierId) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode excluir fornecedor');
  await ensureSupplierExists(companyId, supplierId);

  await pool.query(
    `UPDATE barber_suppliers
     SET is_deleted = true,
         is_active = false,
         updated_at = NOW()
     WHERE id = $1
       AND company_id = $2`,
    [supplierId, companyId]
  );

  return true;
}

async function listProducts(companyId, user, filters = {}) {
  ensureCompany(companyId);

  const values = [companyId];
  const where = [
    'barber_products.company_id = $1',
    'COALESCE(barber_products.is_deleted, false) = false'
  ];
  const search = String(filters.search || filters.q || '').trim();
  const status = String(filters.status || 'all').trim();
  const category = String(filters.category || '').trim();

  if (!isAdmin(user)) {
    where.push('barber_products.is_active = true');
  } else if (status === 'active') {
    where.push('barber_products.is_active = true');
  } else if (status === 'inactive') {
    where.push('barber_products.is_active = false');
  }

  if (search) {
    values.push(`%${search}%`);
    where.push(`(
      barber_products.name ILIKE $${values.length}
      OR COALESCE(barber_products.category, '') ILIKE $${values.length}
      OR COALESCE(barber_products.description, '') ILIKE $${values.length}
      OR COALESCE(barber_products.brand, '') ILIKE $${values.length}
      OR COALESCE(barber_products.internal_code, '') ILIKE $${values.length}
    )`);
  }

  if (category) {
    values.push(category);
    where.push(`COALESCE(barber_products.category, '') = $${values.length}`);
  }

  const result = await pool.query(
    `SELECT
       ${PRODUCT_BASE_SELECT},
       barber_suppliers.name AS supplier_name,
       barber_suppliers.company_name AS supplier_company_name,
       CASE
         WHEN COALESCE(barber_products.stock_minimum, 0) > 0
           AND COALESCE(barber_products.stock_current, 0) <= barber_products.stock_minimum
         THEN true
         ELSE false
       END AS low_stock,
       CASE WHEN barber_products.is_active THEN 'ativo' ELSE 'inativo' END AS status
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
  );

  return result.rows;
}

async function getProductById(companyId, user, productId) {
  ensureCompany(companyId);

  const product = await ensureProductExists(companyId, productId);

  if (!isAdmin(user) && !product.is_active) {
    throw createError('Produto nao encontrado', 404);
  }

  const supplierResult = await pool.query(
    `SELECT name, company_name
     FROM barber_suppliers
     WHERE id = $1
       AND company_id = $2
       AND COALESCE(is_deleted, false) = false
     LIMIT 1`,
    [product.supplier_id, companyId]
  );

  return {
    ...product,
    supplier_name: supplierResult.rows[0]?.name || null,
    supplier_company_name: supplierResult.rows[0]?.company_name || null,
    low_stock: Number(product.stock_minimum || 0) > 0 && Number(product.stock_current || 0) <= Number(product.stock_minimum || 0),
    status: product.is_active ? 'ativo' : 'inativo'
  };
}

async function createProduct(companyId, user, data) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode cadastrar produto');

  const payload = normalizeProductPayload(data);
  validateProductPayload(payload);

  if (payload.supplierId) {
    await ensureSupplierExists(companyId, payload.supplierId);
  }

  const result = await pool.query(
    `INSERT INTO barber_products (
       company_id,
       supplier_id,
       name,
       description,
       category,
       brand,
       internal_code,
       cost_price,
       sale_price,
       stock_current,
       stock_minimum,
       unit,
       commission_type,
       commission_value,
       is_active,
       is_deleted,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, false, NOW())
     RETURNING ${PRODUCT_BASE_SELECT}`,
    [
      companyId,
      payload.supplierId,
      payload.name,
      payload.description,
      payload.category,
      payload.brand,
      payload.internalCode,
      payload.costPrice,
      payload.salePrice,
      payload.stockCurrent,
      payload.stockMinimum,
      payload.unit,
      payload.commissionType,
      payload.commissionValue,
      payload.isActive
    ]
  );

  return {
    ...result.rows[0],
    low_stock: Number(result.rows[0].stock_minimum || 0) > 0
      && Number(result.rows[0].stock_current || 0) <= Number(result.rows[0].stock_minimum || 0),
    status: result.rows[0].is_active ? 'ativo' : 'inativo'
  };
}

async function updateProduct(companyId, user, productId, data) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode alterar produto');
  await ensureProductExists(companyId, productId);

  const payload = normalizeProductPayload(data);
  validateProductPayload(payload);

  if (payload.supplierId) {
    await ensureSupplierExists(companyId, payload.supplierId);
  }

  const result = await pool.query(
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
         is_active = $16,
         updated_at = NOW()
     WHERE id = $1
       AND company_id = $2
       AND COALESCE(is_deleted, false) = false
     RETURNING ${PRODUCT_BASE_SELECT}`,
    [
      productId,
      companyId,
      payload.supplierId,
      payload.name,
      payload.description,
      payload.category,
      payload.brand,
      payload.internalCode,
      payload.costPrice,
      payload.salePrice,
      payload.stockCurrent,
      payload.stockMinimum,
      payload.unit,
      payload.commissionType,
      payload.commissionValue,
      payload.isActive
    ]
  );

  return {
    ...result.rows[0],
    low_stock: Number(result.rows[0].stock_minimum || 0) > 0
      && Number(result.rows[0].stock_current || 0) <= Number(result.rows[0].stock_minimum || 0),
    status: result.rows[0].is_active ? 'ativo' : 'inativo'
  };
}

async function updateProductStatus(companyId, user, productId, data = {}) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode alterar status de produto');
  await ensureProductExists(companyId, productId);

  const isActive = data.is_active === undefined && data.isActive === undefined
    ? null
    : Boolean(data.is_active ?? data.isActive);

  if (isActive === null) {
    throw createError('Status do produto e obrigatorio', 400);
  }

  const result = await pool.query(
    `UPDATE barber_products
     SET is_active = $3,
         updated_at = NOW()
     WHERE id = $1
       AND company_id = $2
       AND COALESCE(is_deleted, false) = false
     RETURNING ${PRODUCT_BASE_SELECT}`,
    [productId, companyId, isActive]
  );

  return {
    ...result.rows[0],
    low_stock: Number(result.rows[0].stock_minimum || 0) > 0
      && Number(result.rows[0].stock_current || 0) <= Number(result.rows[0].stock_minimum || 0),
    status: result.rows[0].is_active ? 'ativo' : 'inativo'
  };
}

async function deleteProduct(companyId, user, productId) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode excluir produto');
  await ensureProductExists(companyId, productId);

  await pool.query(
    `UPDATE barber_products
     SET is_deleted = true,
         is_active = false,
         updated_at = NOW()
     WHERE id = $1
       AND company_id = $2`,
    [productId, companyId]
  );

  return true;
}

async function listCollaborators(companyId, user) {
  ensureCollaboratorCompanyContext(companyId);
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode listar colaboradores');

  const result = await pool.query(
    `SELECT
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
       barber_collaborators.updated_at,
       users.name,
       users.email,
       users.phone,
       users.role,
       users.can_launch_sales,
       users.can_view_own_dashboard,
       users.can_view_own_reports,
       users.is_active AS user_is_active
     FROM barber_collaborators
     LEFT JOIN users ON users.id = barber_collaborators.user_id
     WHERE barber_collaborators.company_id = $1
       AND COALESCE(barber_collaborators.is_deleted, false) = false
     ORDER BY barber_collaborators.created_at DESC`,
    [companyId]
  );

  return result.rows;
}

async function listCollaboratorFinancialSummary(companyId, user, query = {}) {
  ensureCompany(companyId);

  const requestedCollaboratorId = query.collaboratorId || query.collaborator_id || null;
  const userCollaborator = user.role === 'collaborator' ? await getCollaboratorForUser(companyId, user.id) : null;
  const collaboratorId = userCollaborator?.id || requestedCollaboratorId || null;

  if (user.role === 'collaborator' && requestedCollaboratorId && requestedCollaboratorId !== userCollaborator.id) {
    ensureAdmin(user, 'Apenas admin pode consultar resumo financeiro de outros colaboradores');
  }

  const { start, end } = buildReportPeriod(query.period, query.startDate || query.start_date, query.endDate || query.end_date);

  const result = await pool.query(
    `WITH filtered_collaborators AS (
       SELECT
         barber_collaborators.id,
         barber_collaborators.nickname,
         barber_collaborators.commission_type,
         barber_collaborators.commission_rate,
         barber_collaborators.can_make_barter,
         barber_collaborators.is_active,
         users.name
       FROM barber_collaborators
       LEFT JOIN users ON users.id = barber_collaborators.user_id
       WHERE barber_collaborators.company_id = $1
         AND COALESCE(barber_collaborators.is_deleted, false) = false
         AND ($4::uuid IS NULL OR barber_collaborators.id = $4::uuid)
     ),
    sale_item_agg AS (
      SELECT
        barber_sale_items.sale_id,
        COALESCE(SUM(barber_sale_items.total_price), 0)::numeric AS gross_total,
        COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN 0 ELSE barber_sale_items.commission_amount END), 0)::numeric AS normal_commission_total,
        COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN barber_sale_items.commission_amount ELSE 0 END), 0)::numeric AS barter_commission_total
      FROM barber_sale_items
       INNER JOIN barber_sales
         ON barber_sales.id = barber_sale_items.sale_id
        AND barber_sales.company_id = barber_sale_items.company_id
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local BETWEEN $2::date AND $3::date
         AND ${isSaleActiveSql('barber_sales')}
       GROUP BY barber_sale_items.sale_id
     ),
     sale_agg AS (
       SELECT
         barber_sales.collaborator_id,
         COUNT(barber_sales.id)::integer AS sales_count,
         COALESCE(SUM(COALESCE(sale_item_agg.gross_total, barber_sales.total_amount)), 0)::numeric AS gross_revenue,
         COALESCE(SUM(
           CASE
             WHEN barber_sales.payment_method = 'permuta' THEN 0
             WHEN sale_item_agg.sale_id IS NOT NULL THEN COALESCE(sale_item_agg.normal_commission_total, 0)
             WHEN filtered_collaborators.commission_type = 'fixed' THEN COALESCE(filtered_collaborators.commission_rate, 0)
             ELSE COALESCE(barber_sales.total_amount, 0) * (COALESCE(filtered_collaborators.commission_rate, 0) / 100.0)
           END
         ), 0)::numeric AS normal_commission_total,
         COALESCE(SUM(
           CASE
             WHEN barber_sales.payment_method <> 'permuta' THEN 0
             WHEN sale_item_agg.sale_id IS NOT NULL THEN COALESCE(sale_item_agg.barter_commission_total, 0)
             WHEN filtered_collaborators.commission_type = 'fixed' THEN COALESCE(filtered_collaborators.commission_rate, 0)
             ELSE COALESCE(barber_sales.total_amount, 0) * (COALESCE(filtered_collaborators.commission_rate, 0) / 100.0)
           END
         ), 0)::numeric AS barter_commission_total,
         MAX(barber_sales.created_at) AS last_sale_at
       FROM barber_sales
       INNER JOIN filtered_collaborators ON filtered_collaborators.id = barber_sales.collaborator_id
       LEFT JOIN sale_item_agg ON sale_item_agg.sale_id = barber_sales.id
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local BETWEEN $2::date AND $3::date
         AND ${isSaleActiveSql('barber_sales')}
       GROUP BY barber_sales.collaborator_id
     ),
     advance_agg AS (
       SELECT
         barber_advances.collaborator_id,
         COALESCE(SUM(barber_advances.amount), 0)::numeric AS advances_total
       FROM barber_advances
       WHERE barber_advances.company_id = $1
         AND barber_advances.created_at::date BETWEEN $2::date AND $3::date
         AND barber_advances.status IN ('approved', 'liquidated')
         AND ($4::uuid IS NULL OR barber_advances.collaborator_id = $4::uuid)
       GROUP BY barber_advances.collaborator_id
     )
     SELECT
       filtered_collaborators.id AS collaborator_id,
       COALESCE(filtered_collaborators.name, filtered_collaborators.nickname) AS collaborator_name,
       filtered_collaborators.nickname AS collaborator_nickname,
       filtered_collaborators.commission_type,
       COALESCE(filtered_collaborators.commission_rate, 0)::numeric AS commission_rate,
       COALESCE(sale_agg.gross_revenue, 0)::numeric AS gross_revenue,
       COALESCE(sale_agg.normal_commission_total, 0)::numeric AS commission_total,
       COALESCE(sale_agg.barter_commission_total, 0)::numeric AS barter_commission_total,
       COALESCE(advance_agg.advances_total, 0)::numeric AS advances_total,
       (COALESCE(sale_agg.normal_commission_total, 0) - COALESCE(sale_agg.barter_commission_total, 0) - COALESCE(advance_agg.advances_total, 0))::numeric AS net_to_receive,
       COALESCE(sale_agg.sales_count, 0)::integer AS sales_count,
       COALESCE(sale_agg.sales_count, 0)::integer AS attendances_count,
       sale_agg.last_sale_at,
       filtered_collaborators.is_active
     FROM filtered_collaborators
     LEFT JOIN sale_agg ON sale_agg.collaborator_id = filtered_collaborators.id
     LEFT JOIN advance_agg ON advance_agg.collaborator_id = filtered_collaborators.id
     ORDER BY COALESCE(sale_agg.gross_revenue, 0) DESC, collaborator_name ASC`,
    [companyId, start, end, collaboratorId]
  );

  return result.rows.map((row) => ({
    ...row,
    period_start: start,
    period_end: end
  }));
}

async function getCollaboratorById(companyId, user, collaboratorId) {
  ensureCollaboratorCompanyContext(companyId);
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode visualizar colaboradores');
  return getCollaboratorRecord(companyId, collaboratorId);
}

async function createCollaborator(companyId, user, data) {
  ensureCollaboratorCompanyContext(companyId);
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode cadastrar colaboradores');

  const payload = normalizeCollaboratorPayload(data);
  validateCollaboratorPayload(payload);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const companyPlan = await getCompanyPlanSnapshot(companyId);
    const maxCollaborators = companyPlan?.max_collaborators ?? getPlanLimits(companyPlan?.plan_type).max_collaborators;
    const defaultPermissions = getDefaultCollaboratorPermissionState();

    if (maxCollaborators !== null) {
      const collaboratorsCountResult = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM barber_collaborators
         WHERE company_id = $1
           AND COALESCE(is_deleted, false) = false`,
        [companyId]
      );

      const collaboratorsCount = collaboratorsCountResult.rows[0]?.total || 0;

      if (collaboratorsCount >= maxCollaborators) {
        throw createResponseError(
          403,
          'Limite atingido',
          `Seu plano atual permite até ${maxCollaborators} colaboradores. Faça upgrade para liberar mais acessos.`
        );
      }
    }

    ensureExtraPermissionsFeature(companyPlan?.plan_type, payload, defaultPermissions);

    const existingUser = await client.query(
      'SELECT id, company_id, role FROM users WHERE email = $1 LIMIT 1',
      [payload.email]
    );

    if (existingUser.rowCount > 0) {
      throw createError('Este e-mail já possui acesso cadastrado.', 400);
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const userResult = await client.query(
      `INSERT INTO users (
         company_id,
         name,
         email,
         password_hash,
         phone,
         role,
         is_active,
         can_launch_sales,
         can_view_own_dashboard,
         can_view_own_reports,
         updated_at
       )
       VALUES ($1, $2, $3, $4, $5, 'collaborator', $6, $7, $8, $9, NOW())
       RETURNING
         id,
         company_id,
         name,
         email,
         phone,
         role,
         is_active,
         can_launch_sales,
         can_view_own_dashboard,
         can_view_own_reports,
         created_at,
         updated_at`,
      [
        companyId,
        payload.name,
        payload.email,
        passwordHash,
        payload.phone,
        payload.isActive,
        payload.canLaunchSales,
        payload.canViewOwnDashboard,
        payload.canViewOwnReports
      ]
    );

    const collaboratorResult = await client.query(
      `INSERT INTO barber_collaborators (
         company_id,
         user_id,
         nickname,
         commission_type,
         commission_rate,
         can_make_barter,
         available_for_booking,
         avatar_url,
         is_active,
         is_deleted,
         updated_at
       )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, false, NOW())
      RETURNING
        id,
        company_id,
         user_id,
         nickname,
         commission_type,
         commission_rate,
         can_make_barter,
         available_for_booking,
         is_active,
         is_deleted,
         created_at,
         updated_at`,
      [
        companyId,
        userResult.rows[0].id,
        payload.nickname || payload.name,
        payload.commissionType,
        payload.commissionRate,
        payload.canMakeBarter,
        payload.availableForBooking,
        payload.isActive
      ]
    );

    const collaborator = {
      ...collaboratorResult.rows[0],
      name: userResult.rows[0].name,
      email: userResult.rows[0].email,
      phone: userResult.rows[0].phone,
      role: userResult.rows[0].role,
      can_launch_sales: userResult.rows[0].can_launch_sales,
      can_view_own_dashboard: userResult.rows[0].can_view_own_dashboard,
      can_view_own_reports: userResult.rows[0].can_view_own_reports,
      avatar_url: collaboratorResult.rows[0].avatar_url,
      user_is_active: userResult.rows[0].is_active
    };

    await client.query('COMMIT');

    return collaborator;
  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      throw createError('Este e-mail já possui acesso cadastrado.', 400);
    }

    throw error;
  } finally {
    client.release();
  }
}

async function updateCollaborator(companyId, user, collaboratorId, data) {
  ensureCollaboratorCompanyContext(companyId);
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode editar colaboradores');

  const existing = await getCollaboratorRecord(companyId, collaboratorId);
  const payload = normalizeCollaboratorPayload(data);
  if (data.can_make_barter === undefined && data.canMakeBarter === undefined) {
    payload.canMakeBarter = Boolean(existing.can_make_barter);
  }
  validateCollaboratorPayload(payload, { allowMissingPassword: true });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const companyPlan = await getCompanyPlanSnapshot(companyId);

    ensureExtraPermissionsFeature(companyPlan?.plan_type, payload, {
      canLaunchSales: existing.can_launch_sales,
      canViewOwnDashboard: existing.can_view_own_dashboard,
      canViewOwnReports: existing.can_view_own_reports
    });

    const duplicateUser = await client.query(
      'SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1',
      [payload.email, existing.user_id]
    );

    if (duplicateUser.rowCount > 0) {
      throw createError('Este e-mail já possui acesso cadastrado.', 400);
    }

    let passwordClause = '';
    const userValues = [
      existing.user_id,
      companyId,
      payload.name,
      payload.email,
      payload.phone,
      payload.isActive,
      payload.canLaunchSales,
      payload.canViewOwnDashboard,
      payload.canViewOwnReports
    ];

    if (payload.password) {
      const passwordHash = await bcrypt.hash(payload.password, 10);
      userValues.push(passwordHash);
      passwordClause = `, password_hash = $${userValues.length}`;
    }

    const userResult = await client.query(
      `UPDATE users
       SET company_id = $2,
           name = $3,
           email = $4,
           phone = $5,
           is_active = $6,
           can_launch_sales = $7,
           can_view_own_dashboard = $8,
           can_view_own_reports = $9
           ${passwordClause},
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
       RETURNING
         id,
         company_id,
         name,
         email,
         phone,
         role,
         is_active,
         can_launch_sales,
         can_view_own_dashboard,
         can_view_own_reports,
         created_at,
         updated_at`,
      userValues
    );

    const collaboratorResult = await client.query(
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
      RETURNING
        id,
        company_id,
        user_id,
         nickname,
         commission_type,
         commission_rate,
         can_make_barter,
         available_for_booking,
         avatar_url,
         is_active,
         is_deleted,
         created_at,
         updated_at`,
      [
        collaboratorId,
        companyId,
        payload.nickname || payload.name,
        payload.commissionType,
        payload.commissionRate,
        payload.canMakeBarter,
        payload.availableForBooking,
        payload.isActive
      ]
    );

    await client.query('COMMIT');

    return {
      ...collaboratorResult.rows[0],
      name: userResult.rows[0].name,
      email: userResult.rows[0].email,
      phone: userResult.rows[0].phone,
      role: userResult.rows[0].role,
      can_launch_sales: userResult.rows[0].can_launch_sales,
      can_view_own_dashboard: userResult.rows[0].can_view_own_dashboard,
      can_view_own_reports: userResult.rows[0].can_view_own_reports,
      avatar_url: collaboratorResult.rows[0].avatar_url,
      user_is_active: userResult.rows[0].is_active
    };
  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      throw createError('Este e-mail já possui acesso cadastrado.', 400);
    }

    throw error;
  } finally {
    client.release();
  }
}

async function updateCollaboratorStatus(companyId, user, collaboratorId, data = {}) {
  ensureCollaboratorCompanyContext(companyId);
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode alterar status de colaborador');

  const collaborator = await getCollaboratorRecord(companyId, collaboratorId);
  const isActive = data.is_active === undefined && data.isActive === undefined
    ? null
    : Boolean(data.is_active ?? data.isActive);

  if (isActive === null) {
    throw createError('Status do colaborador e obrigatorio', 400);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE users
       SET is_active = $2,
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $3`,
      [collaborator.user_id, isActive, companyId]
    );

    const result = await client.query(
      `UPDATE barber_collaborators
       SET is_active = $3,
           updated_at = NOW()
      WHERE id = $1
        AND company_id = $2
        AND COALESCE(is_deleted, false) = false
      RETURNING
        id,
        company_id,
        user_id,
         nickname,
         commission_type,
         commission_rate,
         available_for_booking,
         avatar_url,
         is_active,
         is_deleted,
         created_at,
         updated_at`,
      [collaboratorId, companyId, isActive]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateCollaboratorPermissions(companyId, user, collaboratorId, data = {}) {
  ensureCollaboratorCompanyContext(companyId);
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode alterar permissoes de colaborador');

  const collaborator = await getCollaboratorRecord(companyId, collaboratorId);

  const canLaunchSales = data.can_launch_sales === undefined && data.canLaunchSales === undefined
    ? collaborator.can_launch_sales
    : Boolean(data.can_launch_sales ?? data.canLaunchSales);
  const canViewOwnDashboard = data.can_view_own_dashboard === undefined && data.canViewOwnDashboard === undefined
    ? collaborator.can_view_own_dashboard
    : Boolean(data.can_view_own_dashboard ?? data.canViewOwnDashboard);
  const canViewOwnReports = data.can_view_own_reports === undefined && data.canViewOwnReports === undefined
    ? collaborator.can_view_own_reports
    : Boolean(data.can_view_own_reports ?? data.canViewOwnReports);

  const result = await pool.query(
    `UPDATE users
     SET can_launch_sales = $3,
         can_view_own_dashboard = $4,
         can_view_own_reports = $5,
         updated_at = NOW()
    WHERE id = $1
      AND company_id = $2
    RETURNING
      id,
      company_id,
       name,
       email,
       phone,
       role,
       is_active,
       can_launch_sales,
       can_view_own_dashboard,
       can_view_own_reports,
       created_at,
       updated_at`,
    [collaborator.user_id, companyId, canLaunchSales, canViewOwnDashboard, canViewOwnReports]
  );

  return {
    ...collaborator,
    can_launch_sales: result.rows[0].can_launch_sales,
    can_view_own_dashboard: result.rows[0].can_view_own_dashboard,
    can_view_own_reports: result.rows[0].can_view_own_reports
  };
}

async function saveCollaboratorAvatar(companyId, user, collaboratorId, file) {
  ensureCollaboratorCompanyContext(companyId);
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode alterar a foto do colaborador');

  const collaborator = await getCollaboratorRecord(companyId, collaboratorId);

  if (!file) {
    throw createError('Envie uma imagem para o colaborador', 400);
  }

  const extension = COLLABORATOR_AVATAR_MIME_TYPES[file.mimetype];
  if (!extension) {
    throw createError('Formato de imagem nao suportado', 400);
  }

  const bucket = process.env.SUPABASE_BUCKET || 'barber-collaborators';
  const storagePath = `${companyId}/${collaboratorId}/avatar.${extension}`;

  let avatarUrl;

  if (supabase) {
    // Validações críticas antes do upload
    if (!process.env.SUPABASE_URL) throw createError('SUPABASE_URL ausente no ambiente', 500);
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('INSIRA_SUA')) {
      throw createError('SUPABASE_SERVICE_ROLE_KEY invalida ou nao configurada no .env', 500);
    }

    appLogger.info({ storagePath }, '[supabase-upload] Iniciando upload');
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      appLogger.error({ bucket, storagePath, mimetype: file?.mimetype, size: file?.size, err: error }, '[supabase-avatar-upload-error]');

      throw new Error(`Erro real do Supabase: ${error.message}`);
    }

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    avatarUrl = publicData.publicUrl;
  } else {
    // Fallback local
    const avatarDirectory = buildCollaboratorAvatarDirectory(companyId, collaboratorId);
    const relativePath = getCollaboratorAvatarRelativePath(companyId, collaboratorId, extension);
    const filePath = path.join(UPLOADS_ROOT, relativePath);

    await fs.mkdir(avatarDirectory, { recursive: true });

    const existingFiles = await fs.readdir(avatarDirectory).catch(() => []);
    await Promise.all(
      existingFiles
        .filter((fileName) => fileName.startsWith('avatar.'))
        .map((fileName) => fs.unlink(path.join(avatarDirectory, fileName)).catch(() => undefined))
    );

    await fs.writeFile(filePath, file.buffer);
    avatarUrl = getPublicAssetUrl(relativePath);
  }

  const result = await pool.query(
    `UPDATE barber_collaborators
     SET avatar_url = $3,
         updated_at = NOW()
     WHERE id = $1
       AND company_id = $2
       AND COALESCE(is_deleted, false) = false
    RETURNING
      id,
      company_id,
       user_id,
       nickname,
       commission_type,
       commission_rate,
       available_for_booking,
       avatar_url,
       is_active,
       is_deleted,
       created_at,
       updated_at`,
    [collaboratorId, companyId, avatarUrl]
  );

  return {
    ...collaborator,
    ...result.rows[0]
  };
}

async function removeCollaboratorAvatar(companyId, user, collaboratorId) {
  ensureCollaboratorCompanyContext(companyId);
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode remover a foto do colaborador');

  const collaborator = await getCollaboratorRecord(companyId, collaboratorId);
  const bucket = process.env.ICE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || 'barber-collaborators';

  if (supabase) {
    // Tenta remover do Supabase (independente da extensão)
    const { data: listData, error: listError } = await supabase.storage
      .from(bucket)
      .list(`${companyId}/${collaboratorId}`);

    if (!listError && listData) {
      const filesToDelete = listData
        .filter(file => file.name.startsWith('avatar.'))
        .map(file => `${companyId}/${collaboratorId}/${file.name}`);

      if (filesToDelete.length > 0) {
        await supabase.storage.from(bucket).remove(filesToDelete);
      }
    }
  } else {
    // Fallback local
    const avatarDirectory = buildCollaboratorAvatarDirectory(companyId, collaboratorId);
    const existingFiles = await fs.readdir(avatarDirectory).catch(() => []);

    await Promise.all(
      existingFiles
        .filter((fileName) => fileName.startsWith('avatar.'))
        .map((fileName) => fs.unlink(path.join(avatarDirectory, fileName)).catch(() => undefined))
    );
  }

  const result = await pool.query(
    `UPDATE barber_collaborators
     SET avatar_url = NULL,
         updated_at = NOW()
     WHERE id = $1
       AND company_id = $2
       AND COALESCE(is_deleted, false) = false
    RETURNING
      id,
      company_id,
       user_id,
       nickname,
       commission_type,
       commission_rate,
       available_for_booking,
       avatar_url,
       is_active,
       is_deleted,
       created_at,
       updated_at`,
    [collaboratorId, companyId]
  );

  return {
    ...collaborator,
    ...result.rows[0]
  };
}

async function deleteCollaborator(companyId, user, collaboratorId) {
  ensureCollaboratorCompanyContext(companyId);
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode excluir colaborador');

  const collaborator = await getCollaboratorRecord(companyId, collaboratorId);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE users
       SET is_active = false,
           can_launch_sales = false,
           updated_at = NOW()
       WHERE id = $1`,
      [collaborator.user_id]
    );

    await client.query(
      `UPDATE barber_sales
       SET status = 'canceled',
           canceled_at = COALESCE(canceled_at, NOW()),
           canceled_reason = COALESCE(canceled_reason, 'Colaborador excluido'),
           updated_at = NOW()
       WHERE company_id = $1
         AND collaborator_id = $2
         AND LOWER(TRIM(COALESCE(status, 'active'))) NOT IN ('deleted', 'cancelled', 'canceled', 'removed')
         AND canceled_at IS NULL`,
      [companyId, collaboratorId]
    );

    await client.query(
      `UPDATE barber_collaborators
       SET is_active = false,
           is_deleted = true,
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2`,
      [collaboratorId, companyId]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getCashDailyDetails(companyId, cashDate, client = pool, options = {}) {
  const normalizedDate = normalizeDateInput(cashDate, getBusinessDateString());
  let session = await getCashSessionRow(companyId, normalizedDate, client);

  if (!session && options.createIfMissing) {
    session = await ensureCashSession(companyId, normalizedDate, options.userId, client, {
      openingBalance: options.openingBalance,
      notes: options.notes
    });
    session = await recalculateCashSession(companyId, normalizedDate, client);
  }

  const fallbackSession = session || {
    company_id: companyId,
    cash_date: normalizedDate,
    status: 'open',
    opened_at: null,
    closed_at: null,
    opening_balance: 0,
    gross_total: 0,
    net_total: 0,
    pix_total: 0,
    cash_total: 0,
    credit_total: 0,
    debit_total: 0,
    trade_total: 0,
    discount_total: 0,
    change_total: 0,
    total_sales: 0,
    total_services: 0,
    opened_by: null,
    closed_by: null,
    notes: null,
    created_at: null,
    updated_at: null
  };

  const [salesResult, collaboratorTotalsResult, serviceTotalsResult] = await Promise.all([
    client.query(
      `SELECT
         barber_sales.id,
         barber_sales.company_id,
         barber_sales.collaborator_id,
         barber_sales.payment_method,
         barber_sales.total_amount,
         barber_sales.amount_received,
         barber_sales.change_amount,
         barber_sales.client_name,
         barber_sales.notes,
         barber_sales.created_by,
       barber_sales.created_at,
       barber_sales.sale_date_local,
       barber_collaborators.nickname AS collaborator_name,
       sale_item.item_summary AS service_name
      FROM barber_sales
      LEFT JOIN barber_collaborators
        ON barber_collaborators.id = barber_sales.collaborator_id
       AND barber_collaborators.company_id = barber_sales.company_id
      LEFT JOIN LATERAL (
        SELECT
          STRING_AGG(description, ' + ' ORDER BY created_at ASC) AS item_summary
        FROM barber_sale_items
        WHERE barber_sale_items.sale_id = barber_sales.id
      ) sale_item ON true
      WHERE barber_sales.company_id = $1
        AND barber_sales.sale_date_local = $2::date
        AND ${isSaleActiveSql('barber_sales')}
      ORDER BY barber_sales.created_at DESC`,
      [companyId, normalizedDate]
    ),
    client.query(
      `SELECT
         barber_collaborators.id AS collaborator_id,
         barber_collaborators.nickname AS collaborator_name,
         COUNT(barber_sales.id)::integer AS total_sales,
         COALESCE(SUM(COALESCE(sale_commissions.gross_total, barber_sales.total_amount)), 0)::numeric AS gross_total,
         COALESCE(SUM(COALESCE(sale_commissions.normal_commission, 0)), 0)::numeric AS total_commission,
         COALESCE(SUM(COALESCE(sale_commissions.barter_commission, 0)), 0)::numeric AS barter_commission,
         (COALESCE(SUM(COALESCE(sale_commissions.normal_commission, 0)), 0) - COALESCE(SUM(COALESCE(sale_commissions.barter_commission, 0)), 0))::numeric AS net_commission
       FROM barber_sales
       LEFT JOIN barber_collaborators
         ON barber_collaborators.id = barber_sales.collaborator_id
        AND barber_collaborators.company_id = barber_sales.company_id
       LEFT JOIN (
         SELECT
           sale_id,
           company_id,
           SUM(total_price) AS gross_total,
           SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN 0 ELSE commission_amount END) AS normal_commission,
           SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN commission_amount ELSE 0 END) AS barter_commission
         FROM barber_sale_items
         GROUP BY sale_id, company_id
       ) sale_commissions
         ON sale_commissions.sale_id = barber_sales.id
        AND sale_commissions.company_id = barber_sales.company_id
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local = $2::date
         AND ${isSaleActiveSql('barber_sales')}
       GROUP BY barber_collaborators.id, barber_collaborators.nickname
       ORDER BY gross_total DESC, collaborator_name ASC`,
      [companyId, normalizedDate]
    ),
    client.query(
      `SELECT
         barber_sale_items.description AS service_name,
        COALESCE(SUM(barber_sale_items.quantity), 0)::numeric AS total_services,
        COALESCE(SUM(barber_sale_items.total_price), 0)::numeric AS gross_total
       FROM barber_sale_items
       INNER JOIN barber_sales
         ON barber_sales.id = barber_sale_items.sale_id
        AND barber_sales.company_id = barber_sale_items.company_id
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local = $2::date
         AND ${isSaleActiveSql('barber_sales')}
       GROUP BY barber_sale_items.description
       ORDER BY gross_total DESC, service_name ASC`,
      [companyId, normalizedDate]
    )
  ]);

  return {
    session: fallbackSession,
    sales: salesResult.rows,
    collaboratorTotals: collaboratorTotalsResult.rows,
    serviceTotals: serviceTotalsResult.rows
  };
}

async function openCash(companyId, user, data = {}) {
  const cashDate = normalizeDateInput(data.cash_date || data.cashDate, getBusinessDateString());
  const session = await cashFlowService.openCash(companyId, user, {
    ...data,
    cash_date: cashDate
  });
  return getCashDailyDetails(companyId, cashDate, pool);
}

async function getTodayCash(companyId, user) {
  ensureCompany(companyId);
  ensureCashManager(user);
  return getCashDailyDetails(companyId, getBusinessDateString(), pool, {
    createIfMissing: true,
    userId: user.id
  });
}

async function getDailyCash(companyId, user, cashDate) {
  ensureCompany(companyId);
  ensureCashManager(user);

  return getCashDailyDetails(companyId, cashDate, pool, {
    createIfMissing: normalizeDateInput(cashDate, getBusinessDateString()) === getBusinessDateString(),
    userId: user.id
  });
}

async function listCashHistory(companyId, user, query = {}) {
  ensureCompany(companyId);
  ensureCashManager(user);

  const status = String(query.status || 'all').trim();
  const startDate = normalizeDateInput(query.startDate || query.start_date, null);
  const endDate = normalizeDateInput(query.endDate || query.end_date, null);
  const limit = Math.min(Math.max(Number(query.limit || 45), 1), 180);
  const values = [companyId];
  const where = ['company_id = $1'];

  if (status !== 'all') {
    if (!CASH_STATUS.includes(status)) {
      throw createError('Status do caixa invalido', 400);
    }

    values.push(status);
    where.push(`status = $${values.length}`);
  }

  if (startDate) {
    values.push(startDate);
    where.push(`cash_date >= $${values.length}::date`);
  }

  if (endDate) {
    values.push(endDate);
    where.push(`cash_date <= $${values.length}::date`);
  }

  values.push(limit);

  const result = await pool.query(
    `SELECT
       id,
       company_id,
       cash_date,
       status,
       opened_at,
       closed_at,
       opening_balance,
       gross_total,
       net_total,
       pix_total,
       cash_total,
       credit_total,
       debit_total,
       trade_total,
       discount_total,
       change_total,
       total_sales,
       total_services,
       opened_by,
       closed_by,
       notes,
       created_at,
       updated_at
     FROM barber_cash_sessions
     WHERE ${where.join(' AND ')}
     ORDER BY cash_date DESC
     LIMIT $${values.length}`,
    values
  );

  return result.rows;
}

async function getCashRangeSummary(companyId, user, range) {
  ensureCompany(companyId);
  ensureCashManager(user);

  const sessionsResult = await pool.query(
    `SELECT
       id,
       company_id,
       cash_date,
       status,
       opened_at,
       closed_at,
       opening_balance,
       gross_total,
       net_total,
       pix_total,
       cash_total,
       credit_total,
       debit_total,
       trade_total,
       discount_total,
       change_total,
       total_sales,
       total_services,
       opened_by,
       closed_by,
       notes,
       created_at,
       updated_at
     FROM barber_cash_sessions
     WHERE company_id = $1
       AND cash_date BETWEEN $2::date AND $3::date
     ORDER BY cash_date ASC`,
    [companyId, range.start, range.end]
  );

  const totals = sessionsResult.rows.reduce((accumulator, session) => {
    accumulator.gross_total += toNumber(session.gross_total);
    accumulator.net_total += toNumber(session.net_total);
    accumulator.pix_total += toNumber(session.pix_total);
    accumulator.cash_total += toNumber(session.cash_total);
    accumulator.credit_total += toNumber(session.credit_total);
    accumulator.debit_total += toNumber(session.debit_total);
    accumulator.trade_total += toNumber(session.trade_total);
    accumulator.discount_total += toNumber(session.discount_total);
    accumulator.change_total += toNumber(session.change_total);
    accumulator.total_sales += Number(session.total_sales || 0);
    accumulator.total_services += toNumber(session.total_services);
    return accumulator;
  }, {
    gross_total: 0,
    net_total: 0,
    pix_total: 0,
    cash_total: 0,
    credit_total: 0,
    debit_total: 0,
    trade_total: 0,
    discount_total: 0,
    change_total: 0,
    total_sales: 0,
    total_services: 0
  });

  const [collaboratorTotalsResult, serviceTotalsResult] = await Promise.all([
    pool.query(
      `SELECT
         barber_collaborators.id AS collaborator_id,
         barber_collaborators.nickname AS collaborator_name,
         COUNT(barber_sales.id)::integer AS total_sales,
         COALESCE(SUM(COALESCE(sale_commissions.gross_total, barber_sales.total_amount)), 0)::numeric AS gross_total,
         COALESCE(SUM(COALESCE(sale_commissions.normal_commission, 0)), 0)::numeric AS total_commission,
         COALESCE(SUM(COALESCE(sale_commissions.barter_commission, 0)), 0)::numeric AS barter_commission,
         (COALESCE(SUM(COALESCE(sale_commissions.normal_commission, 0)), 0) - COALESCE(SUM(COALESCE(sale_commissions.barter_commission, 0)), 0))::numeric AS net_commission
       FROM barber_sales
       LEFT JOIN barber_collaborators
         ON barber_collaborators.id = barber_sales.collaborator_id
        AND barber_collaborators.company_id = barber_sales.company_id
       LEFT JOIN (
         SELECT
           sale_id,
           company_id,
           SUM(total_price) AS gross_total,
           SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN 0 ELSE commission_amount END) AS normal_commission,
           SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN commission_amount ELSE 0 END) AS barter_commission
         FROM barber_sale_items
         GROUP BY sale_id, company_id
       ) sale_commissions
         ON sale_commissions.sale_id = barber_sales.id
        AND sale_commissions.company_id = barber_sales.company_id
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local BETWEEN $2::date AND $3::date
         AND ${isSaleActiveSql('barber_sales')}
       GROUP BY barber_collaborators.id, barber_collaborators.nickname
       ORDER BY gross_total DESC, collaborator_name ASC`,
      [companyId, range.start, range.end]
    ),
    pool.query(
      `SELECT
         barber_sale_items.description AS service_name,
        COALESCE(SUM(barber_sale_items.quantity), 0)::numeric AS total_services,
        COALESCE(SUM(barber_sale_items.total_price), 0)::numeric AS gross_total
       FROM barber_sale_items
       INNER JOIN barber_sales
         ON barber_sales.id = barber_sale_items.sale_id
        AND barber_sales.company_id = barber_sale_items.company_id
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local BETWEEN $2::date AND $3::date
         AND ${isSaleActiveSql('barber_sales')}
       GROUP BY barber_sale_items.description
       ORDER BY gross_total DESC, service_name ASC`,
      [companyId, range.start, range.end]
    )
  ]);

  return {
    period: range,
    totals,
    days: sessionsResult.rows,
    collaboratorTotals: collaboratorTotalsResult.rows,
    serviceTotals: serviceTotalsResult.rows
  };
}

async function getWeeklyCash(companyId, user, query = {}) {
  const range = getWeekRange(normalizeDateInput(query.date || query.startDate || query.start_date, getBusinessDateString()));
  return getCashRangeSummary(companyId, user, range);
}

async function getMonthlyCash(companyId, user, query = {}) {
  const monthReference = String(query.month || '').trim()
    ? `${String(query.month).trim()}-01`
    : normalizeDateInput(query.date, getBusinessDateString());
  const range = getMonthRange(monthReference);
  const summary = await getCashRangeSummary(companyId, user, range);

  const ordered = [...summary.days].sort((first, second) => {
    return toNumber(first.gross_total) - toNumber(second.gross_total);
  });

  const totalDays = summary.days.length || 0;

  return {
    ...summary,
    average_daily_gross: totalDays > 0 ? summary.totals.gross_total / totalDays : 0,
    best_day: ordered[ordered.length - 1] || null,
    worst_day: ordered[0] || null
  };
}

async function preCloseCash(companyId, user, data = {}) {
  ensureCompany(companyId);
  ensureCashManager(user);

  const cashDate = normalizeDateInput(data.cash_date || data.cashDate, getBusinessDateString());
  const notes = String(data.notes || '').trim() || null;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const session = await ensureCashSession(companyId, cashDate, user.id, client);
    ensureCashSessionEditable(session);
    await recalculateCashSession(companyId, cashDate, client);

    const result = await client.query(
      `UPDATE barber_cash_sessions
       SET status = 'pre_closed',
           notes = COALESCE($3, notes),
           updated_at = NOW()
       WHERE company_id = $1
         AND cash_date = $2::date
       RETURNING id`,
      [companyId, cashDate, notes]
    );

    await appendCashAuditLog(companyId, user.id, 'pre_close_cash', result.rows[0]?.id || session.id, {
      cash_date: cashDate,
      notes
    }, client);

    await client.query('COMMIT');
    return getCashDailyDetails(companyId, cashDate, pool);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function closeCash(companyId, user, data = {}) {
  const cashDate = normalizeDateInput(data.cash_date || data.cashDate, getBusinessDateString());
  await cashFlowService.closeCash(companyId, user, {
    ...data,
    cash_date: cashDate
  });
  return getCashDailyDetails(companyId, cashDate, pool);
}

async function reopenCash(companyId, user, data = {}) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode reabrir caixa fechado');

  const cashDate = normalizeDateInput(data.cash_date || data.cashDate, getBusinessDateString());
  const notes = String(data.notes || '').trim() || null;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const session = await getCashSessionRow(companyId, cashDate, client);

    if (!session) {
      throw createError('Caixa diario nao encontrado', 404);
    }

    const result = await client.query(
      `UPDATE barber_cash_sessions
       SET status = 'open',
           closed_at = NULL,
           closed_by = NULL,
           notes = COALESCE($3, notes),
           updated_at = NOW()
       WHERE company_id = $1
         AND cash_date = $2::date
       RETURNING id`,
      [companyId, cashDate, notes]
    );

    await recalculateCashSession(companyId, cashDate, client);
    await appendCashAuditLog(companyId, user.id, 'reopen_cash', result.rows[0]?.id || session.id, {
      cash_date: cashDate,
      notes
    }, client);

    await client.query('COMMIT');
    return getCashDailyDetails(companyId, cashDate, pool);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getDashboard(companyId, user) {
  ensureCompany(companyId);

  if (user?.role === 'client') {
    throw createError('Clientes finais nao podem acessar o dashboard administrativo', 403);
  }

  if (user?.role === 'collaborator') {
    return getMyDashboard(companyId, user);
  }

  const todayCash = await getCashDailyDetails(companyId, getBusinessDateString(), pool, {
    createIfMissing: true,
    userId: user.id
  });
  const today = getBusinessDateString();
  const revenueStartDate = addDateDays(today, -6);

  const commissionsResult = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN 0 ELSE barber_sale_items.commission_amount END), 0)::numeric AS total_commissions,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN barber_sale_items.commission_amount ELSE 0 END), 0)::numeric AS barter_commissions
     FROM barber_sale_items
     INNER JOIN barber_sales
       ON barber_sales.id = barber_sale_items.sale_id
      AND barber_sales.company_id = barber_sale_items.company_id
     WHERE barber_sales.company_id = $1
       AND barber_sales.sale_date_local = $2::date
       AND ${isSaleActiveSql('barber_sales')}`,
    [companyId, getBusinessDateString()]
  );

  const recentSalesResult = await pool.query(
    `SELECT
       barber_sales.id,
       barber_collaborators.nickname AS collaborator_name,
       barber_sales.payment_method,
       barber_sales.total_amount,
       barber_sales.sale_date_local,
       barber_sales.created_at
     FROM barber_sales
     LEFT JOIN barber_collaborators
       ON barber_collaborators.id = barber_sales.collaborator_id
      AND barber_collaborators.company_id = barber_sales.company_id
     WHERE barber_sales.company_id = $1
       AND ${isSaleActiveSql('barber_sales')}
     ORDER BY barber_sales.created_at DESC
     LIMIT 10`,
    [companyId]
  );

  const dailyRevenueResult = await pool.query(
    `SELECT
       TO_CHAR(barber_sales.sale_date_local::date, 'YYYY-MM-DD') AS date,
       COALESCE(SUM(COALESCE(item_totals.gross_total, barber_sales.total_amount)), 0)::numeric AS revenue,
       COUNT(barber_sales.id)::integer AS total_sales
     FROM barber_sales
     LEFT JOIN LATERAL (
       SELECT COALESCE(SUM(total_price), 0)::numeric AS gross_total
       FROM barber_sale_items
       WHERE barber_sale_items.sale_id = barber_sales.id
         AND barber_sale_items.company_id = barber_sales.company_id
     ) item_totals ON true
     WHERE barber_sales.company_id = $1
       AND barber_sales.sale_date_local::date BETWEEN $2::date AND $3::date
       AND ${isSaleActiveSql('barber_sales')}
     GROUP BY barber_sales.sale_date_local::date
     ORDER BY barber_sales.sale_date_local::date ASC`,
    [companyId, revenueStartDate, today]
  );

  const collaboratorSummaryResult = await pool.query(
    `SELECT
       barber_collaborators.id AS collaborator_id,
       barber_collaborators.nickname AS collaborator_name,
       COALESCE(sale_totals.total_sales, 0)::numeric AS total_sales,
       COALESCE(sale_totals.normal_commission, 0)::numeric AS total_commission,
       COALESCE(sale_totals.barter_commission, 0)::numeric AS barter_commission,
       COALESCE(approved_advances.total_advances, 0)::numeric AS total_advances,
       (COALESCE(sale_totals.normal_commission, 0) - COALESCE(sale_totals.barter_commission, 0) - COALESCE(approved_advances.total_advances, 0))::numeric AS net_commission
     FROM barber_collaborators
     LEFT JOIN (
       SELECT
         barber_sales.collaborator_id,
         SUM(COALESCE(sale_commissions.gross_total, barber_sales.total_amount)) AS total_sales,
         SUM(COALESCE(sale_commissions.normal_commission, 0)) AS normal_commission,
         SUM(COALESCE(sale_commissions.barter_commission, 0)) AS barter_commission
       FROM barber_sales
       LEFT JOIN (
         SELECT
           sale_id,
           company_id,
           SUM(total_price) AS gross_total,
           SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN 0 ELSE commission_amount END) AS normal_commission,
           SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN commission_amount ELSE 0 END) AS barter_commission
         FROM barber_sale_items
         GROUP BY sale_id, company_id
       ) sale_commissions
         ON sale_commissions.sale_id = barber_sales.id
        AND sale_commissions.company_id = barber_sales.company_id
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local = $2::date
         AND ${isSaleActiveSql('barber_sales')}
       GROUP BY barber_sales.collaborator_id
     ) sale_totals ON sale_totals.collaborator_id = barber_collaborators.id
     LEFT JOIN (
       SELECT collaborator_id, SUM(amount) AS total_advances
       FROM barber_advances
       WHERE company_id = $1 AND status = 'approved'
       GROUP BY collaborator_id
     ) approved_advances ON approved_advances.collaborator_id = barber_collaborators.id
     WHERE barber_collaborators.company_id = $1
       AND COALESCE(barber_collaborators.is_deleted, false) = false
     ORDER BY total_sales DESC`,
    [companyId, getBusinessDateString()]
  );

  const session = todayCash.session;

  return {
    totalDaySales: session.gross_total,
    totalPix: session.pix_total,
    totalCash: session.cash_total,
    totalCredit: session.credit_total,
    totalDebit: session.debit_total,
    totalPermuta: session.trade_total,
    totalCommissions: commissionsResult.rows[0].total_commissions,
    barterCommissions: commissionsResult.rows[0].barter_commissions,
    totalBarterCommissions: commissionsResult.rows[0].barter_commissions,
    dailyRevenue: dailyRevenueResult.rows,
    recentSales: recentSalesResult.rows,
    collaboratorSummary: collaboratorSummaryResult.rows,
    cashSession: session,
    viewMode: 'admin'
  };
}

async function getPersonalCommissionSummary(companyId, collaboratorId, startDate, endDate) {
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN 0 ELSE barber_sale_items.commission_amount END), 0)::numeric AS commission,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN barber_sale_items.commission_amount ELSE 0 END), 0)::numeric AS barter_commission,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN barber_sale_items.total_price ELSE 0 END), 0)::numeric AS barter_total,
       COUNT(DISTINCT barber_sales.id)::integer AS sales
     FROM barber_sales
     LEFT JOIN barber_sale_items
       ON barber_sale_items.sale_id = barber_sales.id
      AND barber_sale_items.company_id = barber_sales.company_id
     WHERE barber_sales.company_id = $1
       AND barber_sales.collaborator_id = $2
       AND COALESCE(barber_sales.sale_date_local, barber_sales.created_at::date) BETWEEN $3::date AND $4::date
       AND ${isSaleActiveSql('barber_sales')}`,
    [companyId, collaboratorId, startDate, endDate]
  );

  const sales = Number(result.rows[0]?.sales || 0);

  return {
    commission: toNumber(result.rows[0]?.commission),
    barterCommission: toNumber(result.rows[0]?.barter_commission),
    barterTotal: toNumber(result.rows[0]?.barter_total),
    netCommission: toNumber(result.rows[0]?.commission) - toNumber(result.rows[0]?.barter_commission),
    appointments: sales,
    sales
  };
}

async function getMyDashboard(companyId, user) {
  ensureCompany(companyId);
  ensureCollaboratorRole(user);
  requireCollaboratorPermission(user, 'can_view_own_dashboard', 'Seu acesso ao dashboard proprio esta desativado');

  const collaborator = await getCollaboratorForUser(companyId, user.id);
  const today = getBusinessDateString();
  const weekRange = getWeekRange(today);
  const monthRange = getMonthRange(today);

  const commissionsResult = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN 0 ELSE barber_sale_items.commission_amount END), 0)::numeric AS total_commission,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN barber_sale_items.commission_amount ELSE 0 END), 0)::numeric AS barter_commission,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN barber_sale_items.total_price ELSE 0 END), 0)::numeric AS barter_total
     FROM barber_sale_items
     INNER JOIN barber_sales
       ON barber_sales.id = barber_sale_items.sale_id
      AND barber_sales.company_id = barber_sale_items.company_id
     WHERE barber_sales.company_id = $1
       AND barber_sales.collaborator_id = $2
       AND ${isSaleActiveSql('barber_sales')}`,
    [companyId, collaborator.id]
  );

  const advancesResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total_advances
     FROM barber_advances
     WHERE company_id = $1
       AND collaborator_id = $2
       AND status IN ('approved', 'liquidated')`,
    [companyId, collaborator.id]
  );

  const [todaySummary, weekSummary, monthSummary] = await Promise.all([
    getPersonalCommissionSummary(companyId, collaborator.id, today, today),
    getPersonalCommissionSummary(companyId, collaborator.id, weekRange.start, weekRange.end),
    getPersonalCommissionSummary(companyId, collaborator.id, monthRange.start, monthRange.end)
  ]);

  const recentSalesResult = await pool.query(
     `SELECT
       barber_sales.id,
       barber_sales.created_at,
       barber_sales.sale_date_local,
       COALESCE(barber_sales.status, 'active') AS status,
       COALESCE(barber_sales.customer_name, barber_sales.client_name) AS customer_name,
       sale_item.item_summary AS service_name,
       barber_sales.payment_method,
       barber_sales.total_amount,
       COALESCE(sale_item.total_commission, 0)::numeric AS commission_amount,
       CASE WHEN barber_sales.payment_method = 'permuta' THEN 'debit' ELSE 'credit' END AS commission_effect
     FROM barber_sales
     LEFT JOIN LATERAL (
       SELECT
         STRING_AGG(description, ' + ' ORDER BY created_at ASC) AS item_summary,
         COALESCE(SUM(commission_amount), 0)::numeric AS total_commission
       FROM barber_sale_items
       WHERE barber_sale_items.sale_id = barber_sales.id
     ) sale_item ON true
     WHERE barber_sales.company_id = $1
       AND barber_sales.collaborator_id = $2
       AND ${isSaleActiveSql('barber_sales')}
     ORDER BY barber_sales.created_at DESC
     LIMIT 8`,
    [companyId, collaborator.id]
  );

  const totalCommission = toNumber(commissionsResult.rows[0].total_commission);
  const barterCommission = toNumber(commissionsResult.rows[0].barter_commission);
  const barterTotal = toNumber(commissionsResult.rows[0].barter_total);
  const totalAdvances = toNumber(advancesResult.rows[0].total_advances);
  const netCommission = totalCommission - barterCommission - totalAdvances;

  return {
    collaborator: {
      id: collaborator.id,
      nickname: collaborator.nickname,
      commission_type: collaborator.commission_type,
      commission_rate: collaborator.commission_rate,
      can_make_barter: collaborator.can_make_barter
    },
    ownMetrics: {
      totalAttendances: todaySummary.appointments,
      myCommissionTotal: totalCommission,
      myCommissionAccumulated: totalCommission,
      myAdvances: totalAdvances,
      mySettlementBalance: netCommission,
      todayCommission: todaySummary.commission,
      todayBarterTotal: todaySummary.barterTotal,
      todayBarterCommission: todaySummary.barterCommission,
      todayNetCommission: todaySummary.netCommission,
      todayAttendances: todaySummary.appointments,
      totalCommission,
      barterCommission,
      barterTotal,
      netCommission,
      weekCommission: weekSummary.commission,
      weekBarterTotal: weekSummary.barterTotal,
      weekBarterCommission: weekSummary.barterCommission,
      weekNetCommission: weekSummary.netCommission,
      weekAttendances: weekSummary.appointments,
      monthCommission: monthSummary.commission,
      monthBarterTotal: monthSummary.barterTotal,
      monthBarterCommission: monthSummary.barterCommission,
      monthNetCommission: monthSummary.netCommission,
      monthAttendances: monthSummary.appointments,
      totalAdvances,
      today: todaySummary,
      week: weekSummary,
      month: monthSummary
    },
    recentSales: recentSalesResult.rows,
    viewMode: 'collaborator'
  };
}

async function listAdvances(companyId, user) {
  ensureCompany(companyId);
  const collaborator = user?.role === 'collaborator'
    ? await getCollaboratorForUser(companyId, user.id)
    : null;
  const values = collaborator ? [companyId, collaborator.id] : [companyId];

  const result = await pool.query(
    `SELECT
       barber_advances.id,
       barber_advances.company_id,
       barber_advances.collaborator_id,
       barber_collaborators.nickname AS collaborator_name,
       barber_advances.amount,
       barber_advances.reason,
       barber_advances.status,
       barber_advances.approved_by,
       barber_advances.approved_at,
       barber_advances.created_at
     FROM barber_advances
     INNER JOIN barber_collaborators
       ON barber_collaborators.id = barber_advances.collaborator_id
      AND barber_collaborators.company_id = barber_advances.company_id
     WHERE barber_advances.company_id = $1
       ${collaborator ? 'AND barber_advances.collaborator_id = $2' : ''}
     ORDER BY barber_advances.created_at DESC`,
    values
  );

  return result.rows;
}

async function createAdvance(companyId, data, user) {
  ensureCompany(companyId);

  const userCollaborator = user?.role === 'collaborator'
    ? await getCollaboratorForUser(companyId, user.id)
    : null;
  const collaboratorId = userCollaborator?.id || data.collaborator_id || data.collaboratorId;
  const amount = toNumber(data.amount);
  const reason = String(data.reason || '').trim() || null;

  if (!collaboratorId) {
    throw createError('Colaborador e obrigatorio', 400);
  }

  if (amount <= 0) {
    throw createError('Valor do vale invalido', 400);
  }

  const collaborator = await pool.query(
    `SELECT id
     FROM barber_collaborators
     WHERE id = $1
       AND company_id = $2
       AND is_active = true
       AND COALESCE(is_deleted, false) = false`,
    [collaboratorId, companyId]
  );

  if (collaborator.rowCount === 0) {
    throw createError('Colaborador nao encontrado', 404);
  }

  const result = await pool.query(
    `INSERT INTO barber_advances (company_id, collaborator_id, amount, reason, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING id, company_id, collaborator_id, amount, reason, status, approved_by, approved_at, created_at`,
    [companyId, collaboratorId, amount, reason]
  );

  return result.rows[0];
}

async function validateApprovalCredential(companyId, userId, data) {
  const pin = String(data.pin || '').trim();
  const adminPassword = String(data.adminPassword || data.admin_password || '');
  const hasPinHash = await columnExists('users', 'pin_hash');

  if (process.env.ADMIN_APPROVAL_PIN && pin && pin === process.env.ADMIN_APPROVAL_PIN) {
    return true;
  }

  const credentialColumns = ['password_hash'];

  if (hasPinHash) {
    credentialColumns.push('pin_hash');
  }

  const result = await pool.query(
    `SELECT ${credentialColumns.join(', ')}
     FROM users
     WHERE id = $1
       AND company_id = $2
     LIMIT 1`,
    [userId, companyId]
  );

  if (result.rowCount === 0) {
    throw createError('Usuario admin nao encontrado', 404);
  }

  if (hasPinHash && pin && result.rows[0].pin_hash) {
    const pinMatches = await bcrypt.compare(pin, result.rows[0].pin_hash);

    if (pinMatches) {
      return true;
    }
  }

  if (!adminPassword) {
    throw createError('Informe a senha admin ou PIN para confirmar', 401);
  }

  const passwordMatches = await bcrypt.compare(adminPassword, result.rows[0].password_hash);

  if (!passwordMatches) {
    throw createError('Senha admin ou PIN invalido', 401);
  }

  return true;
}

async function validateApprovalPin(companyId, user, pinValue) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas dono ou admin pode cancelar vendas');

  const pin = normalizePin(pinValue);

  if (!isValidPin(pin, 4)) {
    throw createError('Informe o PIN admin com pelo menos 4 digitos', 401);
  }

  const hasPinHash = await columnExists('users', 'pin_hash');

  if (!hasPinHash) {
    throw createError('PIN admin ainda nao esta configurado no banco', 503);
  }

  const result = await pool.query(
    `SELECT pin_hash
     FROM users
     WHERE id = $1
       AND company_id = $2
       AND role IN ('admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin')
       AND COALESCE(is_active, true) = true
     LIMIT 1`,
    [user.id, companyId]
  );

  if (result.rowCount === 0) {
    throw createError('Usuario admin nao encontrado para validar PIN', 404);
  }

  if (!result.rows[0].pin_hash) {
    throw createError('Configure um PIN admin antes de cancelar vendas', 409);
  }

  const pinMatches = await bcrypt.compare(pin, result.rows[0].pin_hash);

  if (!pinMatches) {
    throw createError('PIN admin invalido', 401);
  }

  return true;
}

async function updateAdvanceStatus(companyId, userId, advanceId, status, data = {}) {
  ensureCompany(companyId);

  if (!ADVANCE_STATUS.includes(status) || status === 'pending') {
    throw createError('Status de vale invalido', 400);
  }

  await validateApprovalCredential(companyId, userId, data);

  const result = await pool.query(
    `UPDATE barber_advances
     SET status = $1,
         approved_by = $2,
         approved_at = NOW()
     WHERE id = $3
       AND company_id = $4
       AND status = 'pending'
     RETURNING id, company_id, collaborator_id, amount, reason, status, approved_by, approved_at, created_at`,
    [status, userId, advanceId, companyId]
  );

  if (result.rowCount === 0) {
    throw createError('Vale pendente nao encontrado', 404);
  }

  return result.rows[0];
}

async function getLastSettlement(companyId, collaboratorId, client = pool) {
  const result = await client.query(
    `SELECT id, period_end
     FROM barber_settlements
     WHERE company_id = $1 AND collaborator_id = $2
     ORDER BY period_end DESC
     LIMIT 1`,
    [companyId, collaboratorId]
  );

  return result.rows[0] || null;
}

async function calculateSettlement(companyId, collaboratorId, client = pool, options = {}) {
  ensureCompany(companyId);
  const collaborator = await getCollaboratorRecord(companyId, collaboratorId, client);
  const lastSettlement = await getLastSettlement(companyId, collaboratorId, client);
  const requestedStartDate = options.startDate || options.start_date || null;
  const requestedEndDate = options.endDate || options.end_date || null;
  const periodStart = requestedStartDate ? normalizeDateInput(requestedStartDate) : (lastSettlement?.period_end || null);
  const periodEnd = requestedEndDate ? normalizeDateInput(requestedEndDate) : null;

  const salesResult = await client.query(
    `SELECT
       COUNT(barber_sales.id)::integer AS total_attendances,
       COALESCE(SUM(COALESCE(sale_commissions.gross_total, barber_sales.total_amount)), 0)::numeric AS total_sales,
       COALESCE(SUM(COALESCE(sale_commissions.normal_commission, 0)), 0)::numeric AS total_commission,
       COALESCE(SUM(COALESCE(sale_commissions.barter_commission, 0)), 0)::numeric AS barter_commission
     FROM barber_sales
     LEFT JOIN (
       SELECT
         sale_id,
         company_id,
         SUM(total_price) AS gross_total,
         SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN 0 ELSE commission_amount END) AS normal_commission,
         SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN commission_amount ELSE 0 END) AS barter_commission
       FROM barber_sale_items
       GROUP BY sale_id, company_id
     ) sale_commissions
       ON sale_commissions.sale_id = barber_sales.id
      AND sale_commissions.company_id = barber_sales.company_id
     WHERE barber_sales.company_id = $1
       AND barber_sales.collaborator_id = $2
       AND (
         ($4::date IS NOT NULL AND barber_sales.sale_date_local::date BETWEEN $3::date AND $4::date)
         OR ($4::date IS NULL AND $3::date IS NOT NULL AND barber_sales.sale_date_local::date >= $3::date)
         OR ($3::date IS NULL AND $5::timestamp IS NULL)
         OR ($3::date IS NULL AND $5::timestamp IS NOT NULL AND barber_sales.created_at > $5::timestamp)
       )
       AND ${isSaleActiveSql('barber_sales')}`,
    [companyId, collaboratorId, requestedStartDate ? periodStart : null, periodEnd, requestedStartDate ? null : periodStart]
  );

  const advancesResult = await client.query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total_advances
     FROM barber_advances
     WHERE company_id = $1
       AND collaborator_id = $2
       AND status = 'approved'
       AND ($3::date IS NULL OR created_at::date >= $3::date)
       AND ($4::date IS NULL OR created_at::date <= $4::date)`,
    [companyId, collaboratorId, requestedStartDate ? periodStart : null, periodEnd]
  );

  const totalAttendances = Number(salesResult.rows[0].total_attendances || 0);
  const totalSales = toNumber(salesResult.rows[0].total_sales);
  const totalCommission = toNumber(salesResult.rows[0].total_commission);
  const barterCommission = toNumber(salesResult.rows[0].barter_commission);
  const totalAdvances = toNumber(advancesResult.rows[0].total_advances);
  const netAmount = totalCommission - barterCommission - totalAdvances;

  return {
    collaborator_id: collaborator.id,
    collaborator_name: collaborator.nickname,
    total_attendances: totalAttendances,
    total_sales: totalSales.toFixed(2),
    total_commission: totalCommission.toFixed(2),
    barter_commission: barterCommission.toFixed(2),
    total_advances: totalAdvances.toFixed(2),
    net_amount: netAmount.toFixed(2),
    period_start: periodStart,
    period_end: periodEnd || new Date().toISOString().slice(0, 10)
  };
}

async function listSettlements(companyId, collaboratorId, user, options = {}) {
  ensureCompany(companyId);
  const userCollaborator = user?.role === 'collaborator'
    ? await getCollaboratorForUser(companyId, user.id)
    : null;

  if (user?.role === 'collaborator' && collaboratorId && collaboratorId !== userCollaborator?.id) {
    ensureAdmin(user, 'Apenas admin pode consultar fechamentos de outros colaboradores');
  }

  const effectiveCollaboratorId = userCollaborator?.id || collaboratorId;

  const values = [companyId];
  let filter = 'WHERE barber_settlements.company_id = $1';

  if (effectiveCollaboratorId) {
    values.push(effectiveCollaboratorId);
    filter += ` AND barber_settlements.collaborator_id = $${values.length}`;
  }

  const settlementsResult = await pool.query(
    `SELECT
       barber_settlements.id,
       barber_settlements.company_id,
       barber_settlements.collaborator_id,
       barber_collaborators.nickname AS collaborator_name,
       barber_settlements.total_sales,
       barber_settlements.total_commission,
       barber_settlements.total_advances,
       barber_settlements.net_amount,
       barber_settlements.period_start,
       barber_settlements.period_end,
       barber_settlements.closed_by,
       barber_settlements.created_at
     FROM barber_settlements
     INNER JOIN barber_collaborators
       ON barber_collaborators.id = barber_settlements.collaborator_id
      AND barber_collaborators.company_id = barber_settlements.company_id
     ${filter}
     ORDER BY barber_settlements.created_at DESC`,
    values
  );

  const response = {
    settlements: settlementsResult.rows
  };

  if (effectiveCollaboratorId) {
    response.preview = await calculateSettlement(companyId, effectiveCollaboratorId, pool, options);
  }

  return response;
}

async function createSettlement(companyId, user, data) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode realizar fechamento');

  const collaboratorId = data.collaborator_id || data.collaboratorId;

  if (!collaboratorId) {
    throw createError('Colaborador e obrigatorio', 400);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const preview = await calculateSettlement(companyId, collaboratorId, client, {
      startDate: data.startDate || data.start_date,
      endDate: data.endDate || data.end_date
    });
    const periodEnd = data.endDate || data.end_date ? normalizeDateInput(data.endDate || data.end_date) : new Date();

    const result = await client.query(
      `INSERT INTO barber_settlements (
         company_id,
         collaborator_id,
         total_sales,
         total_commission,
         total_advances,
         net_amount,
         period_start,
         period_end,
         closed_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, company_id, collaborator_id, total_sales, total_commission, total_advances, net_amount, period_start, period_end, closed_by, created_at`,
      [
        companyId,
        collaboratorId,
        preview.total_sales,
        preview.total_commission,
        preview.total_advances,
        preview.net_amount,
        preview.period_start,
        periodEnd,
        user.id
      ]
    );

    await client.query(
      `UPDATE barber_advances
       SET status = 'liquidated',
           liquidated_at = NOW(),
           settlement_id = $3
       WHERE company_id = $1
         AND collaborator_id = $2
         AND status = 'approved'
         AND ($4::date IS NULL OR created_at::date >= $4::date)
         AND ($5::date IS NULL OR created_at::date <= $5::date)`,
      [
        companyId,
        collaboratorId,
        result.rows[0].id,
        data.startDate || data.start_date || null,
        data.endDate || data.end_date || null
      ]
    );

    await client.query('COMMIT');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function listAppointments(companyId, user, query = {}) {
  ensureCompany(companyId);

  const isCollaborator = user?.role === 'collaborator';

  if (!isCollaborator) {
    ensureCashManager(user, 'Apenas usuarios autorizados podem acessar agendamentos');
  }

  const slugData = await ensureCompanyPublicBookingSlug(companyId);
  const statusFilter = String(query.status || 'all').trim().toLowerCase();
  const settings = await clientBookingService.getBookingSettings(companyId);
  const timezone = settings.timezone || 'America/Cuiaba';
  const values = [companyId];
  const where = ['barber_appointments.company_id = $1'];

  if (isCollaborator) {
    const collaborator = await getCollaboratorForUser(companyId, user.id);
    values.push(collaborator.id);
    where.push(`barber_appointments.collaborator_id = $${values.length}`);
  } else if (query.collaboratorId || query.collaborator_id) {
    values.push(query.collaboratorId || query.collaborator_id);
    where.push(`barber_appointments.collaborator_id = $${values.length}`);
  }

  if (query.customerId || query.customer_id) {
    values.push(query.customerId || query.customer_id);
    where.push(`barber_appointments.customer_id = $${values.length}`);
  }

  if (query.date) {
    values.push(normalizeDateInput(query.date));
    values.push(timezone);
    where.push(`DATE(barber_appointments.starts_at AT TIME ZONE $${values.length}::text) = $${values.length - 1}::date`);
  }

  if (statusFilter !== 'all') {
    if (!APPOINTMENT_STATUS.includes(statusFilter)) {
      throw createError('Filtro de status invalido', 400);
    }

    values.push(statusFilter);
    where.push(`barber_appointments.status = $${values.length}`);
  }

  try {
    const { hasSource, hasCanceledReason } = await getAppointmentColumnSupport();
    const appointmentsResult = await pool.query(
      `SELECT
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
         ${hasSource ? 'barber_appointments.source' : `'admin_manual'::text AS source`},
         ${hasCanceledReason ? 'barber_appointments.canceled_reason' : 'NULL::text AS canceled_reason'},
         barber_appointments.created_at,
         barber_appointments.updated_at,
         barber_services.name AS service_name,
         barber_services.icon AS service_icon,
         barber_services.price AS service_price,
         COALESCE(users.name, barber_collaborators.nickname) AS collaborator_name,
         barber_collaborators.avatar_url AS collaborator_avatar_url
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
    );

    const today = getBusinessDateString();
    const summaryValues = [companyId, today, timezone];
    const summaryWhere = ['barber_appointments.company_id = $1'];

    if (isCollaborator) {
      const collaboratorId = values[1];
      summaryValues.push(collaboratorId);
      summaryWhere.push(`barber_appointments.collaborator_id = $${summaryValues.length}`);
    } else if (query.collaboratorId || query.collaborator_id) {
      summaryValues.push(query.collaboratorId || query.collaborator_id);
      summaryWhere.push(`barber_appointments.collaborator_id = $${summaryValues.length}`);
    }

    const summaryResult = await pool.query(
      `SELECT
         COUNT(*) FILTER (
           WHERE DATE(barber_appointments.starts_at AT TIME ZONE $3::text) = $2::date
             AND barber_appointments.status <> 'canceled'
         )::integer AS today_count,
         COUNT(*) FILTER (
           WHERE DATE(barber_appointments.starts_at AT TIME ZONE $3::text) >= $2::date
             AND barber_appointments.status IN ('scheduled', 'confirmed')
         )::integer AS upcoming_count,
         COUNT(*) FILTER (
           WHERE barber_appointments.status = 'canceled'
         )::integer AS canceled_count
       FROM barber_appointments
       WHERE ${summaryWhere.join(' AND ')}`,
      summaryValues
    );

    const availableCollaboratorsResult = await pool.query(
      `SELECT COUNT(*)::integer AS total
       FROM barber_collaborators
       WHERE company_id = $1
         AND is_active = true
         AND available_for_booking = true
         AND COALESCE(is_deleted, false) = false`,
      [companyId]
    );

    const activeServicesResult = await pool.query(
      `SELECT COUNT(*)::integer AS total
       FROM barber_services
       WHERE company_id = $1
         AND is_active = true
         AND COALESCE(is_deleted, false) = false`,
      [companyId]
    );

    return {
      company_name: slugData.companyName,
      public_booking_slug: slugData.publicBookingSlug,
      public_booking_path: `/agendar/${slugData.publicBookingSlug}`,
      summary: {
        appointments_today: Number(summaryResult.rows[0]?.today_count || 0),
        upcoming_slots: Number(summaryResult.rows[0]?.upcoming_count || 0),
        canceled_appointments: Number(summaryResult.rows[0]?.canceled_count || 0),
        available_collaborators: Number(availableCollaboratorsResult.rows[0]?.total || 0),
        bookable_services: Number(activeServicesResult.rows[0]?.total || 0)
      },
      appointments: appointmentsResult.rows
    };
  } catch (error) {
    // REGRA GLOBAL: falha de schema da agenda nao deve derrubar outras areas do Barber.
    appLogger.error({ err: error }, '[BARBER APPOINTMENTS] erro ao listar agenda');

    if (error.code === '42703') {
      return {
        company_name: slugData.companyName,
        public_booking_slug: slugData.publicBookingSlug,
        public_booking_path: `/agendar/${slugData.publicBookingSlug}`,
        summary: {
          appointments_today: 0,
          upcoming_slots: 0,
          canceled_appointments: 0,
          available_collaborators: 0,
          bookable_services: 0
        },
        appointments: []
      };
    }

    throw error;
  }
}

async function createAppointment(companyId, user, data) {
  ensureCompany(companyId);
  ensureCashManager(user, 'Apenas usuarios autorizados podem criar agendamentos');

  const payload = normalizeAppointmentPayload(data);
  validateAppointmentPayload(payload);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const settings = await clientBookingService.getBookingSettings(companyId, client);
    const { hasSource } = await getAppointmentColumnSupport();
    const slot = await clientBookingService.validateBookableSlot({
      companyId,
      collaboratorId: payload.collaboratorId,
      serviceId: payload.serviceId,
      startsAt: payload.startsAt,
      settings,
      client,
      user
    });

    if (shouldLogBarberDebug()) {
      appLogger.info({ company_id: companyId, collaborator_id: payload.collaboratorId, service_id: payload.serviceId, starts_at: slot.startsAt.toISOString(), ends_at: slot.endsAt.toISOString(), source: 'admin_manual' }, '[BARBER APPOINTMENT CREATE]');
    }

    const insertColumns = [
      'company_id',
      'service_id',
      'collaborator_id',
      'customer_name',
      'customer_phone',
      'customer_email',
      'starts_at',
      'ends_at',
      'status',
      'notes'
    ];
    const insertValues = [
      companyId,
      payload.serviceId,
      payload.collaboratorId,
      payload.customerName,
      payload.customerPhone,
      payload.customerEmail,
      slot.startsAt.toISOString(),
      slot.endsAt.toISOString(),
      'scheduled',
      payload.notes
    ];

    if (hasSource) {
      insertColumns.push('source');
      insertValues.push('admin_manual');
    }

    insertColumns.push('updated_at');

    let valueIndex = 0;
    const valuesSql = insertColumns
      .map((columnName) => {
        if (columnName === 'updated_at') {
          return 'NOW()';
        }

        valueIndex += 1;

        switch (columnName) {
          case 'starts_at':
          case 'ends_at':
            return `$${valueIndex}::timestamptz`;
          default:
            return `$${valueIndex}`;
        }
      })
      .join(', ');

    const result = await client.query(
       `INSERT INTO barber_appointments (
         ${insertColumns.join(',\n         ')}
       )
      VALUES (${valuesSql})
      RETURNING
        id,
        company_id,
         service_id,
         collaborator_id,
         customer_name,
         customer_phone,
         customer_email,
         starts_at,
         ends_at,
         status,
         notes,
         ${hasSource ? 'source' : `'admin_manual'::text AS source`},
         created_at,
         updated_at`,
      insertValues
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateAppointment(companyId, user, appointmentId, data = {}) {
  ensureCompany(companyId);

  const isCollaborator = user?.role === 'collaborator';

  if (!isCollaborator) {
    ensureCashManager(user, 'Apenas usuarios autorizados podem atualizar agendamentos');
  }

  const status = String(data.status || '').trim().toLowerCase();
  const notes = data.notes === undefined ? undefined : String(data.notes || '').trim() || null;
  const canceledReason = data.canceled_reason === undefined && data.canceledReason === undefined
    ? undefined
    : String(data.canceled_reason || data.canceledReason || '').trim() || null;
  const { hasSource, hasCanceledReason } = await getAppointmentColumnSupport();

  if (!status && notes === undefined && canceledReason === undefined) {
    throw createError('Nenhuma alteracao enviada para o agendamento', 400);
  }

  if (status && !APPOINTMENT_STATUS.includes(status)) {
    throw createError('Status do agendamento invalido', 400);
  }

  let collaborator = null;
  if (isCollaborator) {
    collaborator = await getCollaboratorForUser(companyId, user.id);

    if (status && !['confirmed', 'arrived', 'in_progress', 'completed'].includes(status)) {
      throw createError('Colaborador pode apenas atualizar o proprio status operacional', 403);
    }
  }

  const values = [appointmentId, companyId];
  const sets = ['updated_at = NOW()'];

  if (status) {
    values.push(status);
    sets.push(`status = $${values.length}`);
  }

  if (notes !== undefined) {
    values.push(notes);
    sets.push(`notes = $${values.length}`);
  }

  if (canceledReason !== undefined && hasCanceledReason) {
    values.push(canceledReason);
    sets.push(`canceled_reason = $${values.length}`);
  }

  const collaboratorWhere = collaborator
    ? (() => {
        values.push(collaborator.id);
        return `AND collaborator_id = $${values.length}`;
      })()
    : '';

  const result = await pool.query(
    `UPDATE barber_appointments
     SET ${sets.join(', ')}
     WHERE id = $1
       AND company_id = $2
       ${collaboratorWhere}
    RETURNING
      id,
      company_id,
       service_id,
       collaborator_id,
       customer_name,
       customer_phone,
       customer_email,
       starts_at,
       ends_at,
       status,
       notes,
       ${hasSource ? 'source' : `'admin_manual'::text AS source`},
       ${hasCanceledReason ? 'canceled_reason' : 'NULL::text AS canceled_reason'},
       created_at,
       updated_at`,
    values
  );

  if (result.rowCount === 0) {
    throw createError('Agendamento nao encontrado', 404);
  }

  return result.rows[0];
}

async function cancelAppointment(companyId, user, appointmentId, data = {}) {
  return updateAppointment(companyId, user, appointmentId, {
    ...data,
    status: 'canceled',
    canceled_reason: data.reason || null
  });
}

async function rescheduleAppointment(companyId, user, appointmentId, data = {}) {
  ensureCompany(companyId);
  ensureCashManager(user);

  const startsAt = data.startsAt || data.starts_at;

  const appointmentResult = await pool.query(
    `SELECT barber_appointments.service_id, barber_appointments.collaborator_id
     FROM barber_appointments
     WHERE barber_appointments.id = $1
       AND barber_appointments.company_id = $2
     LIMIT 1`,
    [appointmentId, companyId]
  );

  if (appointmentResult.rowCount === 0) {
    throw createError('Agendamento nao encontrado', 404);
  }

  const settings = await clientBookingService.getBookingSettings(companyId);
  const slot = await clientBookingService.validateBookableSlot({
    companyId,
    collaboratorId: appointmentResult.rows[0].collaborator_id,
    serviceId: appointmentResult.rows[0].service_id,
    startsAt,
    settings,
    appointmentIdToIgnore: appointmentId
  });

  const result = await pool.query(
    `UPDATE barber_appointments
     SET starts_at = $3::timestamptz,
         ends_at = $4::timestamptz,
         updated_at = NOW()
     WHERE id = $1
       AND company_id = $2
     RETURNING *`,
    [appointmentId, companyId, slot.startsAt.toISOString(), slot.endsAt.toISOString()]
  );

  if (result.rowCount === 0) {
    throw createError('Agendamento nao encontrado', 404);
  }

  return result.rows[0];
}

async function deleteAppointment(companyId, user, appointmentId) {
  ensureCompany(companyId);
  ensureAdmin(user);

  const result = await pool.query(
    'DELETE FROM barber_appointments WHERE id = $1 AND company_id = $2',
    [appointmentId, companyId]
  );

  if (result.rowCount === 0) {
    throw createError('Agendamento nao encontrado', 404);
  }

  return true;
}

async function listScheduleBlocks(companyId, user, query = {}) {
  ensureCompany(companyId);
  const result = await pool.query(
    `SELECT * FROM barber_booking_blocks
     WHERE company_id = $1
     ORDER BY starts_at DESC`,
    [companyId]
  );
  return result.rows;
}

async function createScheduleBlock(companyId, user, data) {
  ensureCompany(companyId);
  ensureCashManager(user);

  const result = await pool.query(
    `INSERT INTO barber_booking_blocks (company_id, collaborator_id, starts_at, ends_at, reason)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [companyId, data.collaboratorId || null, data.startsAt, data.endsAt, data.reason]
  );

  return result.rows[0];
}

async function deleteScheduleBlock(companyId, user, blockId) {
  ensureCompany(companyId);
  ensureCashManager(user);

  const result = await pool.query(
    'DELETE FROM barber_booking_blocks WHERE id = $1 AND company_id = $2',
    [blockId, companyId]
  );

  if (result.rowCount === 0) {
    throw createError('Bloqueio nao encontrado', 404);
  }

  return true;
}

async function listWorkingHours(companyId, user) {
  ensureCompany(companyId);

  try {
    await ensureWorkingHoursSchema();

    const result = await pool.query(
      `SELECT *
       FROM barber_working_hours
       WHERE company_id = $1
       ORDER BY weekday ASC, collaborator_id ASC NULLS FIRST`,
      [companyId]
    );

    return result.rows;
  } catch (error) {
    appLogger.error({ err: error }, '[BARBER WORKING HOURS] erro ao listar horarios');

    if (error.code === '42P01') {
      return [];
    }

    throw error;
  }
}

async function updateWorkingHours(companyId, user, data) {
  ensureCompany(companyId);
  ensureAdmin(user);

  await ensureWorkingHoursSchema();

  const { weekday, opensAt, closesAt, isClosed, collaboratorId } = data;

  const result = await pool.query(
    `INSERT INTO barber_working_hours (company_id, collaborator_id, weekday, opens_at, closes_at, is_closed, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (company_id, collaborator_id, weekday)
     DO UPDATE SET opens_at = EXCLUDED.opens_at,
                   closes_at = EXCLUDED.closes_at,
                   is_closed = EXCLUDED.is_closed,
                   updated_at = NOW()
     RETURNING *`,
    [companyId, collaboratorId || null, weekday, opensAt, closesAt, isClosed]
  );

  return result.rows[0];
}

async function getAvailability(companyId, user) {
  ensureCompany(companyId);

  const [collaborators, workingHours, settings] = await Promise.all([
    listCollaborators(companyId, user),
    listWorkingHours(companyId, user),
    clientBookingService.getBookingSettings(companyId)
  ]);

  const blocksResult = await pool.query(
    `SELECT b.*, COALESCE(u.name, c.nickname) AS collaborator_name
     FROM barber_booking_blocks b
     LEFT JOIN barber_collaborators c ON c.id = b.collaborator_id
     LEFT JOIN users u ON u.id = c.user_id
     WHERE b.company_id = $1
     ORDER BY b.starts_at DESC`,
    [companyId]
  );

  return {
    collaborators,
    working_hours: workingHours,
    blocks: blocksResult.rows,
    settings: {
      timezone: settings.timezone || 'America/Cuiaba',
      slot_interval_minutes: Number(settings.slot_interval_minutes || 30)
    }
  };
}

async function updateAvailability(companyId, user, data) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode alterar a disponibilidade');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await ensureWorkingHoursSchema(client);

    const currentRows = await client.query(
      `SELECT id FROM barber_working_hours WHERE company_id = $1`,
      [companyId]
    );
    for (const row of currentRows.rows) {
      await client.query('DELETE FROM barber_working_hours WHERE id = $1 AND company_id = $2', [row.id, companyId]);
    }

    const workingHours = data.working_hours || [];
    for (const wh of workingHours) {
      await client.query(
        `INSERT INTO barber_working_hours (company_id, collaborator_id, weekday, opens_at, closes_at, is_closed, pauses, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          companyId,
          wh.collaborator_id || null,
          wh.weekday,
          wh.opens_at || null,
          wh.closes_at || null,
          wh.is_closed === true,
          JSON.stringify(wh.pauses || [])
        ]
      );
    }

    const weeklyHoursJson = computeWeeklyHoursJson(workingHours);
    await client.query(
      `UPDATE barber_booking_settings SET weekly_hours = $1, updated_at = NOW() WHERE company_id = $2`,
      [JSON.stringify(weeklyHoursJson), companyId]
    );

    await client.query('COMMIT');

    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    appLogger.error({ err: error }, '[BARBER AVAILABILITY] erro ao atualizar disponibilidade');
    throw error;
  } finally {
    client.release();
  }
}

function computeWeeklyHoursJson(workingHours) {
  const weekly = { '0': null, '1': null, '2': null, '3': null, '4': null, '5': null, '6': null };
  const generalHours = workingHours.filter(w => !w.collaborator_id && !w.is_closed && w.opens_at && w.closes_at);
  for (const wh of generalHours) {
    const key = String(wh.weekday);
    if (!weekly[key]) {
      weekly[key] = { start: wh.opens_at.slice(0, 5), end: wh.closes_at.slice(0, 5) };
    }
  }
  return weekly;
}

async function getPublicBooking(slug) {
  const normalizedSlug = String(slug || '').trim().toLowerCase();

  if (!normalizedSlug) {
    throw createError('Slug de agendamento invalido', 400);
  }

  const companyResult = await pool.query(
    `SELECT id, name, public_booking_slug
     FROM companies
     WHERE public_booking_slug = $1
     LIMIT 1`,
    [normalizedSlug]
  );

  if (companyResult.rowCount === 0) {
    throw createError('Barbearia nao encontrada para este link', 404);
  }

  const company = companyResult.rows[0];

  const servicesResult = await pool.query(
    `SELECT
       id,
       name,
       description,
       price,
       service_type,
       icon,
       estimated_time_minutes
     FROM barber_services
     WHERE company_id = $1
       AND is_active = true
       AND COALESCE(is_deleted, false) = false
     ORDER BY created_at DESC`,
    [company.id]
  );

  const collaboratorsResult = await pool.query(
    `SELECT
       barber_collaborators.id,
       COALESCE(users.name, barber_collaborators.nickname) AS name,
       barber_collaborators.nickname,
       barber_collaborators.avatar_url,
       barber_collaborators.available_for_booking
     FROM barber_collaborators
     LEFT JOIN users ON users.id = barber_collaborators.user_id
     WHERE barber_collaborators.company_id = $1
       AND barber_collaborators.is_active = true
       AND barber_collaborators.available_for_booking = true
       AND COALESCE(barber_collaborators.is_deleted, false) = false
     ORDER BY COALESCE(users.name, barber_collaborators.nickname) ASC`,
    [company.id]
  );

  return {
    company: {
      id: company.id,
      name: company.name,
      slug: company.public_booking_slug
    },
    services: servicesResult.rows,
    collaborators: collaboratorsResult.rows
  };
}

async function createPublicBookingAppointment(slug, data) {
  const bookingData = await getPublicBooking(slug);
  const payload = normalizeAppointmentPayload(data);
  validateAppointmentPayload(payload);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const settings = await clientBookingService.getBookingSettings(bookingData.company.id, client);
    await ensureBookableService(bookingData.company.id, payload.serviceId, client);
    await ensureBookableCollaborator(bookingData.company.id, payload.collaboratorId, client);
    const slot = await clientBookingService.validateBookableSlot({
      companyId: bookingData.company.id,
      collaboratorId: payload.collaboratorId,
      serviceId: payload.serviceId,
      startsAt: payload.startsAt,
      settings,
      client
    });

    if (shouldLogBarberDebug()) {
      appLogger.info({ company_id: bookingData.company.id, collaborator_id: payload.collaboratorId, service_id: payload.serviceId, starts_at: slot.startsAt.toISOString(), ends_at: slot.endsAt.toISOString(), source: 'public_link' }, '[BARBER PUBLIC APPOINTMENT CREATE]');
    }

    const result = await client.query(
      `INSERT INTO barber_appointments (
         company_id,
         service_id,
         collaborator_id,
         customer_name,
         customer_phone,
         customer_email,
         starts_at,
         ends_at,
         status,
         notes,
         updated_at
       )
      VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, 'scheduled', $9, NOW())
      RETURNING
        id,
        company_id,
         service_id,
         collaborator_id,
         customer_name,
         customer_phone,
         customer_email,
         starts_at,
         ends_at,
         status,
         notes,
         created_at,
         updated_at`,
      [
        bookingData.company.id,
        payload.serviceId,
        payload.collaboratorId,
        payload.customerName,
        payload.customerPhone,
        payload.customerEmail,
        slot.startsAt.toISOString(),
        slot.endsAt.toISOString(),
        payload.notes
      ]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function listSales(companyId, user, query = {}) {
  ensureCompany(companyId);
  const collaborator = user?.role === 'collaborator'
    ? await getCollaboratorForUser(companyId, user.id)
    : null;
  const requestedCollaboratorId = query.collaborator_id || query.collaboratorId || null;
  const collaboratorId = collaborator?.id || requestedCollaboratorId || null;
  const { start, end } = buildReportPeriod(query.period, query.startDate || query.start_date, query.endDate || query.end_date);
  const values = [companyId, start, end, collaboratorId];
  const filters = [
    'barber_sales.company_id = $1',
    'barber_sales.sale_date_local BETWEEN $2::date AND $3::date',
    '($4::uuid IS NULL OR barber_sales.collaborator_id = $4::uuid)',
    isSaleActiveSql('barber_sales')
  ];

  const result = await pool.query(
    `SELECT
       barber_sales.id,
       barber_sales.company_id,
       barber_sales.collaborator_id,
       barber_collaborators.nickname AS collaborator_name,
       barber_sales.payment_method,
       barber_sales.subtotal,
       barber_sales.discount,
       barber_sales.total_amount,
       barber_sales.commission_amount,
       barber_sales.amount_received,
       barber_sales.change_amount,
       COALESCE(barber_sales.customer_name, barber_sales.client_name) AS customer_name,
       barber_sales.customer_phone,
       barber_sales.client_name,
       barber_sales.status,
       barber_sales.canceled_at,
       barber_sales.canceled_reason,
       barber_sales.notes,
       barber_sales.created_by,
       barber_sales.created_at,
       barber_sales.updated_at,
       barber_sales.sale_date_local,
       sale_item.item_summary AS service_name,
       sale_item.total_commission AS item_commission_amount,
       CASE WHEN barber_sales.payment_method = 'permuta' THEN 'debit' ELSE 'credit' END AS commission_effect
     FROM barber_sales
     LEFT JOIN barber_collaborators
       ON barber_collaborators.id = barber_sales.collaborator_id
      AND barber_collaborators.company_id = barber_sales.company_id
     LEFT JOIN LATERAL (
       SELECT
         STRING_AGG(description, ' + ' ORDER BY created_at ASC) AS item_summary,
         COALESCE(SUM(commission_amount), 0)::numeric AS total_commission
       FROM barber_sale_items
       WHERE barber_sale_items.sale_id = barber_sales.id
         AND barber_sale_items.company_id = barber_sales.company_id
     ) sale_item ON true
     WHERE ${filters.join(' AND ')}
     ORDER BY barber_sales.created_at DESC
     LIMIT 50`,
    values
  );

  return result.rows;
}

async function getSalesSummary(companyId, user, query = {}) {
  ensureCompany(companyId);

  const collaborator = user?.role === 'collaborator'
    ? await getCollaboratorForUser(companyId, user.id)
    : null;
  const collaboratorId = collaborator?.id || query.collaborator_id || query.collaboratorId || null;
  const period = String(query.period || 'today').trim() || 'today';
  const { start, end } = buildReportPeriod(period, query.startDate || query.start_date, query.endDate || query.end_date);
  const today = getBusinessDateString();
  const weekRange = getWeekRange();
  const monthRange = getMonthRange();
  const periodTimestampRange = buildBusinessTimestampRange(start, end);
  const dayTimestampRange = buildBusinessTimestampRange(today, today);
  const weekTimestampRange = buildBusinessTimestampRange(weekRange.start, weekRange.end);
  const monthTimestampRange = buildBusinessTimestampRange(monthRange.start, monthRange.end);
  const periodValues = [companyId, periodTimestampRange.startAt, periodTimestampRange.endAt, collaboratorId];

  appLogger.debug({ companyId, period, startDate: periodTimestampRange.startAt, endDate: periodTimestampRange.endAt, collaboratorId, today, dayStartDate: dayTimestampRange.startAt, dayEndDate: dayTimestampRange.endAt, weekStartDate: weekTimestampRange.startAt, weekEndDate: weekTimestampRange.endAt, monthStartDate: monthTimestampRange.startAt, monthEndDate: monthTimestampRange.endAt }, '[getSalesSummary params]');

  const baseWhere = `
    barber_sales.company_id = $1
    AND ($2::timestamptz IS NULL OR barber_sales.created_at >= ($2::timestamptz AT TIME ZONE 'UTC'))
    AND ($3::timestamptz IS NULL OR barber_sales.created_at < ($3::timestamptz AT TIME ZONE 'UTC'))
    AND ($4::uuid IS NULL OR barber_sales.collaborator_id = $4::uuid)
    AND ${isSaleActiveSql('barber_sales')}
  `;

  const [totalsResult, paymentResult, collaboratorResult, dayResult, weekResult, monthResult] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(barber_sales.id)::integer AS total_sales,
         COALESCE(SUM(COALESCE(item_commissions.gross_total, barber_sales.total_amount)), 0)::numeric AS total_amount,
         COALESCE(SUM(barber_sales.commission_amount), 0)::numeric AS sale_commission_amount,
         COALESCE(SUM(item_commissions.normal_commission), 0)::numeric AS item_commission_amount,
         COALESCE(SUM(item_commissions.barter_commission), 0)::numeric AS barter_commission_amount,
         COALESCE(SUM(barber_sales.discount), 0)::numeric AS total_discount
       FROM barber_sales
       LEFT JOIN LATERAL (
         SELECT
           COALESCE(SUM(total_price), 0)::numeric AS gross_total,
           COALESCE(SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN 0 ELSE commission_amount END), 0)::numeric AS normal_commission,
           COALESCE(SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN commission_amount ELSE 0 END), 0)::numeric AS barter_commission
         FROM barber_sale_items
         WHERE barber_sale_items.sale_id = barber_sales.id
           AND barber_sale_items.company_id = barber_sales.company_id
       ) item_commissions ON true
       WHERE ${baseWhere}`,
      periodValues
    ),
    pool.query(
      `SELECT barber_sales.payment_method,
              COALESCE(SUM(COALESCE(item_totals.gross_total, barber_sales.total_amount)), 0)::numeric AS total_amount,
              COUNT(barber_sales.id)::integer AS total_sales
       FROM barber_sales
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(total_price), 0)::numeric AS gross_total
         FROM barber_sale_items
         WHERE barber_sale_items.sale_id = barber_sales.id
           AND barber_sale_items.company_id = barber_sales.company_id
       ) item_totals ON true
       WHERE ${baseWhere}
       GROUP BY barber_sales.payment_method
       ORDER BY total_amount DESC`,
      periodValues
    ),
    pool.query(
      `SELECT barber_sales.collaborator_id,
              COALESCE(users.name, barber_collaborators.nickname, 'Sem colaborador') AS collaborator_name,
              COUNT(barber_sales.id)::integer AS total_sales,
              COALESCE(SUM(COALESCE(item_commissions.gross_total, barber_sales.total_amount)), 0)::numeric AS total_amount,
              COALESCE(SUM(item_commissions.normal_commission), 0)::numeric AS total_commission,
              COALESCE(SUM(item_commissions.barter_commission), 0)::numeric AS barter_commission,
              (COALESCE(SUM(item_commissions.normal_commission), 0) - COALESCE(SUM(item_commissions.barter_commission), 0))::numeric AS net_commission
       FROM barber_sales
       LEFT JOIN barber_collaborators
         ON barber_collaborators.id = barber_sales.collaborator_id
        AND barber_collaborators.company_id = barber_sales.company_id
       LEFT JOIN users ON users.id = barber_collaborators.user_id
       LEFT JOIN LATERAL (
         SELECT
           COALESCE(SUM(total_price), 0)::numeric AS gross_total,
           COALESCE(SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN 0 ELSE commission_amount END), 0)::numeric AS normal_commission,
           COALESCE(SUM(CASE WHEN payment_method = 'permuta' OR commission_effect = 'debit' THEN commission_amount ELSE 0 END), 0)::numeric AS barter_commission
         FROM barber_sale_items
         WHERE barber_sale_items.sale_id = barber_sales.id
           AND barber_sale_items.company_id = barber_sales.company_id
       ) item_commissions ON true
       WHERE ${baseWhere}
       GROUP BY barber_sales.collaborator_id, users.name, barber_collaborators.nickname
       ORDER BY total_amount DESC`,
      periodValues
    ),
    pool.query(
      `SELECT
         COALESCE(SUM(COALESCE(item_totals.gross_total, barber_sales.total_amount)), 0)::numeric AS total_amount,
         COUNT(barber_sales.id)::integer AS total_sales
       FROM barber_sales
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(total_price), 0)::numeric AS gross_total
         FROM barber_sale_items
         WHERE barber_sale_items.sale_id = barber_sales.id
           AND barber_sale_items.company_id = barber_sales.company_id
       ) item_totals ON true
       WHERE barber_sales.company_id = $1
         AND ($2::timestamptz IS NULL OR barber_sales.created_at >= ($2::timestamptz AT TIME ZONE 'UTC'))
         AND ($3::timestamptz IS NULL OR barber_sales.created_at < ($3::timestamptz AT TIME ZONE 'UTC'))
         AND ($4::uuid IS NULL OR barber_sales.collaborator_id = $4::uuid)
         AND ${isSaleActiveSql('barber_sales')}`,
      [companyId, dayTimestampRange.startAt, dayTimestampRange.endAt, collaboratorId]
    ),
    pool.query(
      `SELECT
         COALESCE(SUM(COALESCE(item_totals.gross_total, barber_sales.total_amount)), 0)::numeric AS total_amount,
         COUNT(barber_sales.id)::integer AS total_sales
       FROM barber_sales
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(total_price), 0)::numeric AS gross_total
         FROM barber_sale_items
         WHERE barber_sale_items.sale_id = barber_sales.id
           AND barber_sale_items.company_id = barber_sales.company_id
       ) item_totals ON true
       WHERE barber_sales.company_id = $1
         AND ($2::timestamptz IS NULL OR barber_sales.created_at >= ($2::timestamptz AT TIME ZONE 'UTC'))
         AND ($3::timestamptz IS NULL OR barber_sales.created_at < ($3::timestamptz AT TIME ZONE 'UTC'))
         AND ($4::uuid IS NULL OR barber_sales.collaborator_id = $4::uuid)
         AND ${isSaleActiveSql('barber_sales')}`,
      [companyId, weekTimestampRange.startAt, weekTimestampRange.endAt, collaboratorId]
    ),
    pool.query(
      `SELECT
         COALESCE(SUM(COALESCE(item_totals.gross_total, barber_sales.total_amount)), 0)::numeric AS total_amount,
         COUNT(barber_sales.id)::integer AS total_sales
       FROM barber_sales
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(total_price), 0)::numeric AS gross_total
         FROM barber_sale_items
         WHERE barber_sale_items.sale_id = barber_sales.id
           AND barber_sale_items.company_id = barber_sales.company_id
       ) item_totals ON true
       WHERE barber_sales.company_id = $1
         AND ($2::timestamptz IS NULL OR barber_sales.created_at >= ($2::timestamptz AT TIME ZONE 'UTC'))
         AND ($3::timestamptz IS NULL OR barber_sales.created_at < ($3::timestamptz AT TIME ZONE 'UTC'))
         AND ($4::uuid IS NULL OR barber_sales.collaborator_id = $4::uuid)
         AND ${isSaleActiveSql('barber_sales')}`,
      [companyId, monthTimestampRange.startAt, monthTimestampRange.endAt, collaboratorId]
    )
  ]);

  const totals = totalsResult.rows[0] || {};

  const filteredResult = {
    totalSales: totals.total_sales,
    totalAmount: totals.total_amount,
    paymentMethods: paymentResult.rows.length,
    collaborators: collaboratorResult.rows.length,
    dayTotal: dayResult.rows[0]?.total_amount,
    daySales: dayResult.rows[0]?.total_sales,
    weekTotal: weekResult.rows[0]?.total_amount,
    weekSales: weekResult.rows[0]?.total_sales,
    monthTotal: monthResult.rows[0]?.total_amount,
    monthSales: monthResult.rows[0]?.total_sales
  };

  appLogger.debug({ filteredResult }, '[getSalesSummary filtered result]');

  return {
    period: {
      start,
      end,
      filter: period
    },
    total_sales: Number(totals.total_sales || 0),
    total_amount: toNumber(totals.total_amount),
    total_commission: toNumber(totals.item_commission_amount || totals.sale_commission_amount),
    barter_commission: toNumber(totals.barter_commission_amount),
    net_commission: toNumber(totals.item_commission_amount || totals.sale_commission_amount) - toNumber(totals.barter_commission_amount),
    total_discount: toNumber(totals.total_discount),
    total_by_payment_method: paymentResult.rows,
    total_by_collaborator: collaboratorResult.rows,
    totals_day: dayResult.rows[0],
    totals_week: weekResult.rows[0],
    totals_month: monthResult.rows[0]
  };
}

async function getMySales(companyId, user) {
  ensureCompany(companyId);
  ensureCollaboratorRole(user);
  requireCollaboratorPermission(user, 'can_view_own_reports', 'Seu acesso ao historico pessoal esta desativado');

  const collaborator = await getCollaboratorForUser(companyId, user.id);

  const result = await pool.query(
    `SELECT
       barber_sales.id,
       barber_sales.created_at,
       barber_sales.sale_date_local,
       COALESCE(barber_sales.status, 'active') AS status,
       COALESCE(barber_sales.customer_name, barber_sales.client_name) AS customer_name,
       barber_sales.payment_method,
       barber_sales.total_amount,
       sale_item.item_summary AS service_name,
       COALESCE(sale_item.total_commission, 0)::numeric AS commission_amount,
       CASE WHEN barber_sales.payment_method = 'permuta' THEN 'debit' ELSE 'credit' END AS commission_effect
     FROM barber_sales
     LEFT JOIN LATERAL (
       SELECT
         STRING_AGG(description, ' + ' ORDER BY created_at ASC) AS item_summary,
         COALESCE(SUM(commission_amount), 0)::numeric AS total_commission
       FROM barber_sale_items
       WHERE barber_sale_items.sale_id = barber_sales.id
         AND barber_sale_items.company_id = barber_sales.company_id
     ) sale_item ON true
     WHERE barber_sales.company_id = $1
       AND barber_sales.collaborator_id = $2
       AND ${isSaleActiveSql('barber_sales')}
     ORDER BY barber_sales.created_at DESC
     LIMIT 50`,
    [companyId, collaborator.id]
  );

  return result.rows;
}

async function cancelSale(companyId, user, saleId, data = {}) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode cancelar vendas');

  const reason = String(data.reason || '').trim();

  if (!reason) {
    throw createError('Motivo do cancelamento e obrigatorio', 400);
  }

  await validateApprovalPin(companyId, user, data.pin);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const saleResult = await client.query(
      `SELECT id, company_id, collaborator_id, payment_method, total_amount, amount_received, change_amount, client_name, customer_name, customer_phone, notes, created_by, created_at, sale_date_local, status, canceled_at
       FROM barber_sales
       WHERE id = $1 AND company_id = $2
       LIMIT 1`,
      [saleId, companyId]
    );

    if (saleResult.rowCount === 0) {
      throw createError('Venda nao encontrada', 404);
    }

    const sale = saleResult.rows[0];
    const cashDate = normalizeCashDateFromSale(sale);

    if (sale.canceled_at || ['canceled', 'cancelled', 'deleted', 'removed'].includes(String(sale.status || '').trim().toLowerCase())) {
      throw createError('Venda ja esta cancelada', 409);
    }

    const saleCashSession = await getCashSessionRow(companyId, cashDate, client);

    if (saleCashSession) {
      ensureCashSessionEditable(saleCashSession);
    }

    const itemsResult = await client.query(
      `SELECT id, sale_id, item_type, item_id, company_id, description, quantity, unit_price, total_price, commission_amount, created_at
       FROM barber_sale_items
       WHERE sale_id = $1
         AND company_id = $2`,
      [saleId, companyId]
    );

    const canceledResult = await client.query(
      `UPDATE barber_sales
       SET status = 'canceled',
           canceled_by = $3,
           canceled_at = NOW(),
           canceled_reason = $4,
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
       RETURNING id, company_id, collaborator_id, payment_method, subtotal, discount, total_amount, commission_amount, amount_received, change_amount, customer_name, customer_phone, client_name, status, canceled_by, canceled_at, canceled_reason, notes, created_by, created_at, updated_at, sale_date_local`,
      [saleId, companyId, user.id, reason]
    );

    await upsertAndRecalculateCashSession(companyId, cashDate, user.id, client);

    await client.query(
      `INSERT INTO barber_audit_logs (company_id, user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, 'cancel_sale', 'barber_sale', $3, $4)`,
      [
        companyId,
        user.id,
        saleId,
        JSON.stringify({
          reason,
          sale: saleResult.rows[0],
          items: itemsResult.rows
        })
      ]
    );

    await client.query('COMMIT');

    return {
      ...canceledResult.rows[0],
      items: itemsResult.rows
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function deleteSale(companyId, user, saleId, data = {}) {
  return cancelSale(companyId, user, saleId, data);
}

function calculateCommission(item, service, collaborator = null) {
  if (!service) {
    return 0;
  }

  const collaboratorCommissionType = collaborator?.commission_type || collaborator?.commissionType;
  const collaboratorCommissionRate = toNumber(collaborator?.commission_rate ?? collaborator?.commissionRate);

  if (item?.item_type === 'service' && COMMISSION_TYPES.includes(collaboratorCommissionType)) {
    if (collaboratorCommissionType === 'fixed') {
      return collaboratorCommissionRate * toNumber(item.quantity);
    }

    return toNumber(item.total_price) * (collaboratorCommissionRate / 100);
  }

  if (service.commission_type === 'fixed') {
    return toNumber(service.commission_value) * toNumber(item.quantity);
  }

  return toNumber(item.total_price) * (toNumber(service.commission_value) / 100);
}

async function createSale(companyId, user, data) {
  ensureCompany(companyId);

  const userCollaborator = user?.role === 'collaborator'
    ? await getCollaboratorForUser(companyId, user.id)
    : null;

  if (user?.role === 'collaborator') {
    requireCollaboratorPermission(user, 'can_launch_sales', 'Seu acesso ao lancamento de vendas esta desativado');
  }

  const collaboratorId = userCollaborator?.id || data.collaborator_id || data.collaboratorId || null;
  const paymentMethod = normalizePaymentMethod(data.payment_method || data.paymentMethod);
  const clientName = String(data.client_name || data.clientName || data.customer_name || data.customerName || '').trim() || null;
  const customerPhone = String(data.customer_phone || data.customerPhone || '').trim() || null;
  const customerId = data.customer_id || data.customerId || null;
  const appointmentId = data.appointment_id || data.appointmentId || null;
  const requestedChangeAmount = toNumber(data.change_amount || data.changeAmount);
  const amountReceived = toNumber(data.amount_received || data.amountReceived);
  const saleDateLocal = normalizeDateInput(data.sale_date_local || data.saleDateLocal, getBusinessDateString());
  const notes = String(data.notes || '').trim() || null;
  const discount = Math.max(0, toNumber(data.discount));
  const items = Array.isArray(data.items) ? data.items : [];

  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw createError('Forma de pagamento invalida', 400);
  }

  if (!collaboratorId) {
    throw createError('Colaborador e obrigatorio', 400);
  }

  if (items.length === 0) {
    throw createError('Informe ao menos um item na venda', 400);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingCashSession = await getCashSessionRow(companyId, saleDateLocal, client);

    if (existingCashSession) {
      ensureCashSessionEditable(existingCashSession);
    }

    let collaboratorRecord = null;

    if (collaboratorId) {
      const collaborator = await client.query(
        `SELECT id, commission_type, commission_rate, can_make_barter
         FROM barber_collaborators
         WHERE id = $1
           AND company_id = $2
           AND is_active = true
           AND COALESCE(is_deleted, false) = false`,
        [collaboratorId, companyId]
      );

      if (collaborator.rowCount === 0) {
        throw createError('Colaborador nao encontrado', 404);
      }

      collaboratorRecord = collaborator.rows[0];
    }

    if (isBarterPayment(paymentMethod) && !collaboratorRecord?.can_make_barter) {
      throw createError('Este colaborador nao esta autorizado a lancar permuta.', 403);
    }

    if (customerId) {
      const customer = await client.query(
        `SELECT id
         FROM booking_customers
         WHERE id = $1
           AND company_id = $2
         LIMIT 1`,
        [customerId, companyId]
      );

      if (customer.rowCount === 0) {
        throw createError('Cliente nao encontrado para esta empresa', 404);
      }
    }

    if (appointmentId) {
      const appointment = await client.query(
        `SELECT id
         FROM barber_appointments
         WHERE id = $1
           AND company_id = $2
         LIMIT 1`,
        [appointmentId, companyId]
      );

      if (appointment.rowCount === 0) {
        throw createError('Agendamento nao encontrado para esta empresa', 404);
      }
    }

    const normalizedItems = items.map((item) => {
      const itemType = getSaleItemType(item);
      const itemId = getSaleItemId(item, itemType);

      if (!['service', 'product'].includes(itemType)) {
        throw createError('Tipo de item invalido', 400);
      }

      if (!itemId) {
        throw createError(itemType === 'product' ? 'Produto e obrigatorio' : 'Servico e obrigatorio', 400);
      }

      return {
        ...item,
        itemType,
        itemId
      };
    });

    const serviceIds = normalizedItems
      .filter((item) => item.itemType === 'service')
      .map((item) => item.itemId);
    const productIds = normalizedItems
      .filter((item) => item.itemType === 'product')
      .map((item) => item.itemId);

    const serviceMap = new Map();
    const productMap = new Map();

    if (serviceIds.length > 0) {
      const services = await client.query(
        `SELECT id, name, description, price, service_type, commission_type, commission_value
         FROM barber_services
         WHERE company_id = $1
           AND id = ANY($2::uuid[])
           AND is_active = true
           AND COALESCE(is_deleted, false) = false`,
        [companyId, serviceIds]
      );

      services.rows.forEach((service) => {
        serviceMap.set(service.id, service);
      });
    }

    if (productIds.length > 0) {
      const products = await client.query(
        `SELECT id, name, description, category, sale_price, commission_type, commission_value
         FROM barber_products
         WHERE company_id = $1
           AND id = ANY($2::uuid[])
           AND is_active = true
           AND COALESCE(is_deleted, false) = false`,
        [companyId, productIds]
      );

      products.rows.forEach((product) => {
        productMap.set(product.id, product);
      });
    }

    const preparedItems = normalizedItems.map((item) => {
      const itemType = item.itemType;
      const itemId = item.itemId;
      const service = itemType === 'service' ? serviceMap.get(itemId) : null;
      const product = itemType === 'product' ? productMap.get(itemId) : null;
      const sourceItem = service || product || null;
      const description = String(item.description || sourceItem?.name || '').trim();
      const quantity = toNumber(item.quantity || 1);
      const unitPrice = toNumber(service?.price ?? product?.sale_price);

      if (!description) {
        throw createError('Descricao do item e obrigatoria', 400);
      }

      if (quantity <= 0 || unitPrice < 0) {
        throw createError('Quantidade ou valor invalido', 400);
      }

      if (itemType === 'service' && itemId && !service) {
        throw createError('Servico nao encontrado para esta empresa', 404);
      }

      if (itemType === 'product' && itemId && !product) {
        throw createError('Produto nao encontrado para esta empresa', 404);
      }

      const totalPrice = quantity * unitPrice;
      const preparedItem = {
        item_type: itemType,
        item_id: itemId,
        service_id: itemType === 'service' ? itemId : null,
        product_id: itemType === 'product' ? itemId : null,
        description,
        item_name_snapshot: description,
        commission_type_snapshot: sourceItem?.commission_type || 'fixed',
        commission_rate_snapshot: toNumber(sourceItem?.commission_value),
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice
      };

      preparedItem.commission_amount = calculateCommission(preparedItem, sourceItem, collaboratorRecord);
      preparedItem.shop_net_amount = Math.max(0, totalPrice - preparedItem.commission_amount);

      return preparedItem;
    });

    const subtotal = preparedItems.reduce((sum, item) => sum + item.total_price, 0);
    const totalAmount = Math.max(0, subtotal - discount);
    const totalCommission = preparedItems.reduce((sum, item) => sum + item.commission_amount, 0);
    let changeAmount = requestedChangeAmount;

    if (paymentMethod === 'dinheiro') {
      if (amountReceived < totalAmount) {
        throw createError('Valor recebido menor que o valor do servico', 400);
      }

      changeAmount = Math.max(0, amountReceived - totalAmount);
    } else {
      changeAmount = 0;
    }

    const saleResult = await client.query(
      `INSERT INTO barber_sales (
         company_id,
         collaborator_id,
         customer_id,
         customer_name,
         customer_phone,
         payment_method,
         subtotal,
         discount,
         total_amount,
         commission_amount,
         amount_received,
         change_amount,
         sale_date_local,
         client_name,
         appointment_id,
         status,
         notes,
         created_by,
         updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active', $16, $17, NOW())
       RETURNING id, company_id, collaborator_id, customer_id, customer_name, customer_phone, payment_method, subtotal, discount, total_amount, commission_amount, amount_received, change_amount, sale_date_local, client_name, appointment_id, status, notes, created_by, created_at, updated_at`,
      [
        companyId,
        collaboratorId,
        customerId,
        clientName,
        customerPhone,
        paymentMethod,
        subtotal,
        discount,
        totalAmount,
        totalCommission,
        paymentMethod === 'dinheiro' ? amountReceived : (isBarterPayment(paymentMethod) ? 0 : totalAmount),
        changeAmount,
        saleDateLocal,
        clientName,
        appointmentId,
        notes,
        user.id
      ]
    );

    const sale = saleResult.rows[0];
    const savedItems = [];

    for (const item of preparedItems) {
      const itemResult = await client.query(
        `INSERT INTO barber_sale_items (
           sale_id,
           item_type,
           item_id,
           company_id,
           collaborator_id,
           service_id,
           product_id,
           description,
           item_name_snapshot,
           commission_type_snapshot,
           commission_rate_snapshot,
           commission_type,
           commission_rate,
           payment_method,
           commission_effect,
           quantity,
           unit_price,
           total_price,
           commission_amount,
           shop_net_amount
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         RETURNING id, sale_id, item_type, item_id, company_id, collaborator_id, service_id, product_id, description, item_name_snapshot, commission_type_snapshot, commission_rate_snapshot, commission_type, commission_rate, payment_method, commission_effect, quantity, unit_price, total_price, commission_amount, shop_net_amount, created_at`,
        [
          sale.id,
          item.item_type,
          item.item_id,
          companyId,
          collaboratorId,
          item.service_id,
          item.product_id,
          item.description,
          item.item_name_snapshot,
          item.commission_type_snapshot,
          item.commission_rate_snapshot,
          paymentMethod,
          isBarterPayment(paymentMethod) ? 'debit' : 'credit',
          item.quantity,
          item.unit_price,
          item.total_price,
          item.commission_amount,
          item.shop_net_amount
        ]
      );

      savedItems.push(itemResult.rows[0]);
    }

    await upsertAndRecalculateCashSession(companyId, saleDateLocal, user.id, client);

    await client.query('COMMIT');

    return {
      ...sale,
      items: savedItems
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getBarberMe(companyId, user) {
  ensureCompany(companyId);

  const result = await pool.query(
    `SELECT
       users.id,
       users.name,
       users.email,
       users.phone,
       users.role,
       users.company_id,
       users.is_active,
       users.can_launch_sales,
       users.can_view_own_dashboard,
       users.can_view_own_reports,
       users.created_at,
       companies.name AS company_name,
       barber_collaborators.id AS collaborator_id,
       barber_collaborators.nickname,
       barber_collaborators.avatar_url,
       barber_collaborators.commission_type,
       barber_collaborators.commission_rate,
       barber_collaborators.can_make_barter
     FROM users
     LEFT JOIN companies ON companies.id = users.company_id
     LEFT JOIN barber_collaborators
       ON barber_collaborators.user_id = users.id
      AND barber_collaborators.company_id = users.company_id
      AND COALESCE(barber_collaborators.is_deleted, false) = false
     WHERE users.id = $1
       AND users.company_id = $2
     LIMIT 1`,
    [user.id, companyId]
  );

  if (result.rowCount === 0) {
    throw createError('Usuario nao encontrado no BarberGestor', 404);
  }

  return result.rows[0];
}

async function getMyReport(companyId, user, query = {}) {
  ensureCompany(companyId);
  ensureCollaboratorRole(user);
  requireCollaboratorPermission(user, 'can_view_own_reports', 'Seu acesso ao relatorio pessoal esta desativado');

  const collaborator = await getCollaboratorForUser(companyId, user.id);
  const { start, end } = buildReportPeriod(query.period, query.startDate || query.start_date, query.endDate || query.end_date);
  const todayDate = getBusinessDateString();
  const weekRange = getWeekRange(todayDate);
  const monthRange = getMonthRange(todayDate);

  const salesResult = await pool.query(
    `SELECT
       barber_sales.id,
       barber_sales.created_at,
       barber_sales.sale_date_local,
       COALESCE(barber_sales.status, 'active') AS status,
       COALESCE(barber_sales.customer_name, barber_sales.client_name) AS customer_name,
       barber_sales.payment_method,
       barber_sales.total_amount,
       sale_item.item_summary AS service_name,
       sale_item.total_commission AS commission_amount,
       CASE WHEN barber_sales.payment_method = 'permuta' THEN 'debit' ELSE 'credit' END AS commission_effect
     FROM barber_sales
     LEFT JOIN LATERAL (
       SELECT
         STRING_AGG(description, ' + ' ORDER BY created_at ASC) AS item_summary,
         COALESCE(SUM(commission_amount), 0)::numeric AS total_commission
       FROM barber_sale_items
       WHERE barber_sale_items.sale_id = barber_sales.id
         AND barber_sale_items.company_id = barber_sales.company_id
     ) sale_item ON true
     WHERE barber_sales.company_id = $1
       AND barber_sales.collaborator_id = $2
       AND COALESCE(barber_sales.sale_date_local, barber_sales.created_at::date) BETWEEN $3::date AND $4::date
       AND ${isSaleActiveSql('barber_sales')}
     ORDER BY barber_sales.created_at DESC`,
    [companyId, collaborator.id, start, end]
  );

  const totals = salesResult.rows.reduce((accumulator, sale) => {
    accumulator.totalCommission += toNumber(sale.commission_amount);
    if (isBarterPayment(sale.payment_method)) {
      accumulator.barterCommission += toNumber(sale.commission_amount);
      accumulator.barterTotal += toNumber(sale.total_amount);
    } else {
      accumulator.normalCommission += toNumber(sale.commission_amount);
    }
    accumulator.attendances += 1;
    return accumulator;
  }, {
    totalCommission: 0,
    normalCommission: 0,
    barterCommission: 0,
    barterTotal: 0,
    attendances: 0
  });

  const advancesResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total_advances
     FROM barber_advances
     WHERE company_id = $1
       AND collaborator_id = $2
       AND created_at::date BETWEEN $3::date AND $4::date
       AND status IN ('approved', 'liquidated')`,
    [companyId, collaborator.id, start, end]
  );

  const totalAdvances = toNumber(advancesResult.rows[0].total_advances);
  const [today, week, month] = await Promise.all([
    getPersonalCommissionSummary(companyId, collaborator.id, todayDate, todayDate),
    getPersonalCommissionSummary(companyId, collaborator.id, weekRange.start, weekRange.end),
    getPersonalCommissionSummary(companyId, collaborator.id, monthRange.start, monthRange.end)
  ]);

  return {
    collaborator: {
      id: collaborator.id,
      nickname: collaborator.nickname,
      commission_type: collaborator.commission_type,
      commission_rate: collaborator.commission_rate,
      can_make_barter: collaborator.can_make_barter
    },
    period: {
      start,
      end,
      filter: query.period || 'today'
    },
    totals: {
      totalCommission: totals.totalCommission,
      normalCommission: totals.normalCommission,
      barterCommission: totals.barterCommission,
      barterTotal: totals.barterTotal,
      totalAdvances,
      netCommission: totals.normalCommission - totals.barterCommission - totalAdvances,
      attendances: totals.attendances
    },
    today,
    week,
    month,
    recentSales: salesResult.rows.slice(0, 8),
    sales: salesResult.rows
  };
}

async function listCustomers(companyId, user, query = {}) {
  ensureCompany(companyId);

  const search = String(query.search || query.q || '').trim().toLowerCase();
  const status = String(query.status || '').trim().toLowerCase();
  const params = [companyId];
  const filters = ['booking_customers.company_id = $1'];

  if (search) {
    const phoneDigits = String(search).replace(/\D/g, '');
    params.push(`%${search}%`);
    params.push(phoneDigits ? `%${phoneDigits}%` : '');
    filters.push(`(
      lower(booking_customers.name) LIKE $${params.length - 1}
      OR lower(booking_customers.email) LIKE $${params.length - 1}
      OR regexp_replace(COALESCE(booking_customers.phone, ''), '\\D', '', 'g') LIKE $${params.length}
    )`);
  }

  if (status && ['pending', 'active', 'blocked'].includes(status)) {
    params.push(status);
    filters.push(`booking_customers.status = $${params.length}`);
  }

  const result = await pool.query(
    `SELECT
       booking_customers.id,
       booking_customers.company_id,
       booking_customers.name,
       booking_customers.phone,
       booking_customers.email,
       booking_customers.email_verified,
       booking_customers.status,
       booking_customers.source,
       booking_customers.created_at,
       booking_customers.updated_at,
       booking_customers.last_login_at,
       COUNT(*) OVER() AS total_count
     FROM booking_customers
     WHERE ${filters.join(' AND ')}
     ORDER BY booking_customers.created_at DESC`,
    params
  );

  return {
    total: Number(result.rows[0]?.total_count || 0),
    items: result.rows.map((row) => ({
      ...row,
      origin: row.source || 'agendamento_online'
    }))
  };
}

async function getCustomerById(companyId, customerId) {
  ensureCompany(companyId);

  const result = await pool.query(
    `SELECT
       id,
       company_id,
       name,
       phone,
       email,
       email_verified,
       status,
       source,
       created_at,
       updated_at,
       last_login_at
     FROM booking_customers
     WHERE company_id = $1
       AND id = $2
     LIMIT 1`,
    [companyId, customerId]
  );

  if (result.rowCount === 0) {
    throw createError('Cliente nao encontrado', 404);
  }

  return {
    ...result.rows[0],
    origin: result.rows[0].source || 'agendamento_online'
  };
}

async function updateCustomerStatus(companyId, customerId, data = {}) {
  ensureCompany(companyId);

  const status = String(data.status || '').trim().toLowerCase();

  if (!['pending', 'active', 'blocked'].includes(status)) {
    throw createError('Status invalido. Use pending, active ou blocked', 400);
  }

  const result = await pool.query(
    `UPDATE booking_customers
     SET status = $3,
         updated_at = NOW()
     WHERE company_id = $1
       AND id = $2
     RETURNING id, company_id, name, phone, email, email_verified, status, source, created_at, updated_at, last_login_at`,
    [companyId, customerId, status]
  );

  if (result.rowCount === 0) {
    throw createError('Cliente nao encontrado', 404);
  }

  return {
    ...result.rows[0],
    origin: result.rows[0].source || 'agendamento_online'
  };
}

async function getCrmSummary(companyId, query = {}) {
  ensureCompany(companyId);

  const period = query.period || 'month';
  let dateFrom, dateTo;
  const now = new Date();

  if (period === 'month') {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    dateTo = nextMonth.toISOString();
  } else if (period === 'last_month') {
    dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    dateTo = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  } else if (period === 'year') {
    dateFrom = new Date(now.getFullYear(), 0, 1).toISOString();
    dateTo = new Date(now.getFullYear() + 1, 0, 1).toISOString();
  } else {
    dateFrom = null;
    dateTo = null;
  }

  const customerResult = await pool.query(`
    WITH customer_stats AS (
      SELECT
        bc.id,
        bc.status,
        bc.created_at,
        COUNT(ba.id) FILTER (WHERE ba.status = 'completed') as completed_visits,
        MAX(ba.starts_at) FILTER (WHERE ba.status = 'completed') as last_visit
      FROM booking_customers bc
      LEFT JOIN barber_appointments ba ON ba.customer_id = bc.id
      WHERE bc.company_id = $1
      GROUP BY bc.id
    )
    SELECT
      COUNT(*) as total_clientes,
      COUNT(*) FILTER (WHERE status = 'active') as clientes_ativos,
      COUNT(*) FILTER (WHERE status = 'pending') as clientes_pendentes,
      COUNT(*) FILTER (WHERE status = 'blocked') as clientes_bloqueados,
      COUNT(*) FILTER (WHERE created_at >= $2 AND created_at < $3) as clientes_novos_mes,
      COUNT(*) FILTER (WHERE completed_visits = 0 OR last_visit IS NULL OR last_visit < CURRENT_DATE - INTERVAL '90 days') as clientes_inativos,
      COUNT(*) FILTER (WHERE completed_visits >= 20) as clientes_vip,
      COUNT(*) FILTER (WHERE completed_visits >= 10 AND completed_visits < 20) as clientes_fieis,
      CASE WHEN COUNT(*) > 0
        THEN ROUND(COUNT(*) FILTER (WHERE completed_visits > 1) * 100.0 / COUNT(*), 1)
        ELSE 0
      END as taxa_retorno
    FROM customer_stats
  `, [companyId, dateFrom, dateTo]);

  const periodResult = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM barber_appointments
       WHERE company_id = $1 AND status = 'completed'
       AND starts_at >= $2 AND starts_at < $3) as atendimentos_no_mes,
      (SELECT COALESCE(SUM(total_amount), 0) FROM barber_sales
       WHERE company_id = $1 AND deleted_at IS NULL
       AND created_at >= $2 AND created_at < $3) as receita_no_mes,
      (SELECT COALESCE(AVG(total_amount), 0) FROM barber_sales
       WHERE company_id = $1 AND deleted_at IS NULL) as ticket_medio
  `, [companyId, dateFrom, dateTo]);

  const customerStats = customerResult.rows[0] || {
    total_clientes: 0, clientes_ativos: 0, clientes_pendentes: 0, clientes_bloqueados: 0,
    clientes_novos_mes: 0, clientes_inativos: 0, clientes_vip: 0, clientes_fieis: 0, taxa_retorno: 0
  };
  const periodStats = periodResult.rows[0] || {
    atendimentos_no_mes: 0, receita_no_mes: '0', ticket_medio: '0'
  };

  return {
    ...customerStats,
    ...periodStats,
    clientes_ativos: Number(customerStats.clientes_ativos) || 0,
    clientes_pendentes: Number(customerStats.clientes_pendentes) || 0,
    clientes_bloqueados: Number(customerStats.clientes_bloqueados) || 0,
    clientes_novos_mes: Number(customerStats.clientes_novos_mes) || 0,
    clientes_inativos: Number(customerStats.clientes_inativos) || 0,
    clientes_vip: Number(customerStats.clientes_vip) || 0,
    clientes_fieis: Number(customerStats.clientes_fieis) || 0,
    taxa_retorno: Number(customerStats.taxa_retorno) || 0,
    total_clientes: Number(customerStats.total_clientes) || 0,
    atendimentos_no_mes: Number(periodStats.atendimentos_no_mes) || 0,
    receita_no_mes: String(periodStats.receita_no_mes || '0'),
    ticket_medio: String(periodStats.ticket_medio || '0')
  };
}

async function getAgendaCrm(companyId, query = {}) {
  ensureCompany(companyId);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const upcomingResult = await pool.query(`
    SELECT bc.id, bc.name, bc.phone, bc.email, bc.status as customer_status,
           ba.id as appointment_id, ba.starts_at, ba.status as appointment_status,
           COALESCE(bs.name, 'Sem servico') as service_name,
           COALESCE(bcol.name, 'Sem profissional') as collaborator_name
    FROM booking_customers bc
    JOIN barber_appointments ba ON ba.customer_id = bc.id
    LEFT JOIN barber_services bs ON ba.service_id = bs.id
    LEFT JOIN collaborators bcol ON ba.collaborator_id = bcol.id
    WHERE bc.company_id = $1
      AND ba.starts_at >= CURRENT_DATE
      AND ba.status IN ('scheduled', 'confirmed')
    ORDER BY ba.starts_at ASC
    LIMIT 20
  `, [companyId]);

  const cancellationsResult = await pool.query(`
    SELECT bc.id, bc.name, bc.phone,
           COUNT(*) as canceled_count,
           MAX(ba.starts_at) as last_canceled
    FROM booking_customers bc
    JOIN barber_appointments ba ON ba.customer_id = bc.id
    WHERE bc.company_id = $1
      AND ba.status = 'canceled'
      AND ba.starts_at >= $2
    GROUP BY bc.id, bc.name, bc.phone
    ORDER BY last_canceled DESC
    LIMIT 15
  `, [companyId, thirtyDaysAgo]);

  const noShowResult = await pool.query(`
    SELECT bc.id, bc.name, bc.phone,
           COUNT(*) as no_show_count,
           MAX(ba.starts_at) as last_no_show
    FROM booking_customers bc
    JOIN barber_appointments ba ON ba.customer_id = bc.id
    WHERE bc.company_id = $1
      AND ba.status = 'no_show'
    GROUP BY bc.id, bc.name, bc.phone
    ORDER BY no_show_count DESC
    LIMIT 15
  `, [companyId]);

  const noReturnResult = await pool.query(`
    WITH last_visits AS (
      SELECT bc.id, bc.name, bc.phone,
             MAX(ba.starts_at) FILTER (WHERE ba.status = 'completed') as last_completed,
             COUNT(ba.id) FILTER (WHERE ba.status = 'completed') as total_visits
      FROM booking_customers bc
      LEFT JOIN barber_appointments ba ON ba.customer_id = bc.id
      WHERE bc.company_id = $1
      GROUP BY bc.id, bc.name, bc.phone
    )
    SELECT
      id, name, phone, last_completed, total_visits,
      CASE
        WHEN last_completed IS NULL THEN 999
        WHEN last_completed < CURRENT_DATE - INTERVAL '90 days' THEN 90
        WHEN last_completed < CURRENT_DATE - INTERVAL '60 days' THEN 60
        WHEN last_completed < CURRENT_DATE - INTERVAL '30 days' THEN 30
        ELSE 0
      END as days_since_last_visit
    FROM last_visits
    WHERE last_completed IS NULL OR last_completed < CURRENT_DATE - INTERVAL '30 days'
    ORDER BY last_completed ASC NULLS FIRST
    LIMIT 20
  `, [companyId]);

  const recurringResult = await pool.query(`
    SELECT bc.id, bc.name, bc.phone, bc.email,
           COUNT(ba.id) as total_visits,
           MAX(ba.starts_at) as last_visit
    FROM booking_customers bc
    JOIN barber_appointments ba ON ba.customer_id = bc.id AND ba.status = 'completed'
    WHERE bc.company_id = $1
    GROUP BY bc.id, bc.name, bc.phone, bc.email
    HAVING COUNT(ba.id) >= 5
    ORDER BY total_visits DESC
    LIMIT 15
  `, [companyId]);

  return {
    upcoming: upcomingResult.rows.map(r => ({
      id: r.id, name: r.name, phone: r.phone, email: r.email,
      customer_status: r.customer_status,
      appointment_id: r.appointment_id, starts_at: r.starts_at,
      appointment_status: r.appointment_status,
      service_name: r.service_name, collaborator_name: r.collaborator_name
    })),
    recent_cancellations: cancellationsResult.rows.map(r => ({
      id: r.id, name: r.name, phone: r.phone,
      canceled_count: Number(r.canceled_count),
      last_canceled: r.last_canceled
    })),
    no_show_customers: noShowResult.rows.map(r => ({
      id: r.id, name: r.name, phone: r.phone,
      no_show_count: Number(r.no_show_count),
      last_no_show: r.last_no_show
    })),
    no_return: noReturnResult.rows.map(r => ({
      id: r.id, name: r.name, phone: r.phone,
      last_completed: r.last_completed,
      total_visits: Number(r.total_visits),
      days_since_last_visit: Number(r.days_since_last_visit)
    })),
    recurring: recurringResult.rows.map(r => ({
      id: r.id, name: r.name, phone: r.phone, email: r.email,
      total_visits: Number(r.total_visits),
      last_visit: r.last_visit
    }))
  };
}

async function getServicesAnalytics(companyId, query = {}) {
  ensureCompany(companyId);

  const period = query.period || 'month';
  let dateFrom;
  const now = new Date();

  if (period === 'month') {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  } else if (period === 'last_month') {
    dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  } else if (period === 'year') {
    dateFrom = new Date(now.getFullYear(), 0, 1).toISOString();
  } else {
    dateFrom = null;
  }

  const maisVendidosResult = await pool.query(`
    SELECT
      COALESCE(si.description, 'Sem nome') as service_name,
      COUNT(*) as quantidade_execucoes,
      SUM(si.quantity) as total_quantidade,
      SUM(si.total_price) as receita_total,
      AVG(si.unit_price) as ticket_medio,
      ROUND(SUM(si.total_price) * 100.0 / NULLIF(SUM(SUM(si.total_price)) OVER (), 0), 1) as participacao_percentual
    FROM barber_sale_items si
    JOIN barber_sales s ON s.id = si.sale_id
    WHERE s.company_id = $1
      AND s.deleted_at IS NULL
      AND ($2::timestamptz IS NULL OR s.created_at >= $2)
    GROUP BY si.description
    ORDER BY receita_total DESC
    LIMIT 30
  `, [companyId, dateFrom]);

  const favoritosResult = await pool.query(`
    SELECT
      COALESCE(si.description, 'Sem nome') as service_name,
      COUNT(DISTINCT si.sale_id) as total_vendas,
      COUNT(DISTINCT s.customer_id) as total_clientes,
      SUM(si.quantity) as total_quantidade,
      MAX(s.created_at) as ultima_execucao
    FROM barber_sale_items si
    JOIN barber_sales s ON s.id = si.sale_id
    WHERE s.company_id = $1
      AND s.deleted_at IS NULL
      AND s.customer_id IS NOT NULL
      AND ($2::timestamptz IS NULL OR s.created_at >= $2)
    GROUP BY si.description
    ORDER BY total_clientes DESC, total_quantidade DESC
    LIMIT 30
  `, [companyId, dateFrom]);

  const comissoesResult = await pool.query(`
    SELECT
      bs.id as service_id,
      bs.name as service_name,
      bs.commission_type,
      bs.commission_value,
      COUNT(si.id) FILTER (WHERE s.deleted_at IS NULL) as total_vendas_periodo,
      COALESCE(SUM(si.total_price) FILTER (WHERE s.deleted_at IS NULL), 0) as receita_periodo,
      CASE
        WHEN bs.commission_type = 'percentage' AND bs.commission_value IS NOT NULL
          THEN ROUND(COALESCE(SUM(si.total_price) FILTER (WHERE s.deleted_at IS NULL), 0) * bs.commission_value / 100, 2)
        WHEN bs.commission_type = 'fixed' AND bs.commission_value IS NOT NULL
          THEN ROUND(COUNT(si.id) FILTER (WHERE s.deleted_at IS NULL) * bs.commission_value, 2)
        ELSE 0
      END as total_comissao_estimada
    FROM barber_services bs
    LEFT JOIN barber_sale_items si ON si.service_id = bs.id AND si.company_id = bs.company_id
    LEFT JOIN barber_sales s ON s.id = si.sale_id AND s.company_id = $1
    WHERE bs.company_id = $1
      AND bs.deleted_at IS NULL
      AND ($2::timestamptz IS NULL OR s.created_at >= $2)
    GROUP BY bs.id, bs.name, bs.commission_type, bs.commission_value
    ORDER BY total_comissao_estimada DESC
    LIMIT 30
  `, [companyId, dateFrom]);

  return {
    mais_vendidos: maisVendidosResult.rows.map(r => ({
      service_name: r.service_name,
      quantidade_execucoes: Number(r.quantidade_execucoes),
      total_quantidade: Number(r.total_quantidade),
      receita_total: String(r.receita_total || '0'),
      ticket_medio: String(r.ticket_medio || '0'),
      participacao_percentual: Number(r.participacao_percentual) || 0
    })),
    favoritos: favoritosResult.rows.map(r => ({
      service_name: r.service_name,
      total_vendas: Number(r.total_vendas),
      total_clientes: Number(r.total_clientes),
      total_quantidade: Number(r.total_quantidade),
      ultima_execucao: r.ultima_execucao
    })),
    comissoes: comissoesResult.rows.map(r => ({
      service_id: r.service_id,
      service_name: r.service_name,
      commission_type: r.commission_type,
      commission_value: r.commission_value ? Number(r.commission_value) : null,
      total_vendas_periodo: Number(r.total_vendas_periodo),
      receita_periodo: String(r.receita_periodo || '0'),
      total_comissao_estimada: String(r.total_comissao_estimada || '0')
    }))
  };
}

module.exports = {
  getSettings,
  updateSettings,
  getCompanyPlanProfile,
  forgotPin,
  resetPin,
  openCash,
  getTodayCash,
  getDailyCash,
  listCashHistory,
  getWeeklyCash,
  getMonthlyCash,
  preCloseCash,
  closeCash,
  reopenCash,
  getDashboard,
  getMyDashboard,
  listServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  updateServiceStatus,
  listSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  updateSupplierStatus,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  listCollaborators,
  listCollaboratorFinancialSummary,
  getCollaboratorById,
  createCollaborator,
  updateCollaborator,
  updateCollaboratorStatus,
  updateCollaboratorPermissions,
  saveCollaboratorAvatar,
  removeCollaboratorAvatar,
  deleteCollaborator,
  listAdvances,
  createAdvance,
  updateAdvanceStatus,
  listSettlements,
  createSettlement,
  listAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  rescheduleAppointment,
  deleteAppointment,
  listScheduleBlocks,
  createScheduleBlock,
  deleteScheduleBlock,
  listWorkingHours,
  updateWorkingHours,
  getAvailability,
  updateAvailability,
  listCustomers,
  getCustomerById,
  updateCustomerStatus,
  getPublicBooking,
  createPublicBookingAppointment,
  listSales,
  getSalesSummary,
  getMySales,
  createSale,
  cancelSale,
  deleteSale,
  getBarberMe,
  getMyReport,
  getCompanyBranding,
  updateCompanyBranding,
  getCompanyTheme,
  updateCompanyTheme,
  getOnboardingStatus,
  saveOnboardingSetup,
  getBookingLanding,
  updateBookingLanding,
  uploadBookingBanner,
  removeBookingBanner,
  addBookingGalleryImage,
  removeBookingGalleryImage,
  getClientCrm,
  getClientHistory,
  createClientNote,
  updateCustomer,
  getCrmSummary,
  getAgendaCrm,
  getServicesAnalytics
};

async function getCompanyBranding(companyId) {
  const hasColumns = await columnExists('companies', 'public_display_name');
  if (!hasColumns) {
    return {
      company_id: companyId,
      logo_url: null,
      name: 'Empresa',
      display_name: null,
      primary_color: '#a3ff12',
      secondary_color: '#0c1017',
      accent_color: '#7fe11e'
    };
  }

  const result = await pool.query(
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
  );

  if (result.rowCount === 0) {
    return {
      company_id: companyId,
      logo_url: null,
      name: 'Empresa',
      display_name: null,
      primary_color: '#a3ff12',
      secondary_color: '#0c1017',
      accent_color: '#7fe11e'
    };
  }

  const row = result.rows[0];
  return {
    company_id: row.company_id,
    logo_url: row.logo_url || null,
    name: row.name || 'Empresa',
    display_name: row.display_name || null,
    primary_color: row.primary_color || '#a3ff12',
    secondary_color: row.secondary_color || '#0c1017',
    accent_color: row.accent_color || '#7fe11e'
  };
}

async function updateCompanyBranding(companyId, updates) {
  const allowedFields = ['logo_url', 'name', 'public_display_name', 'primary_color', 'secondary_color', 'accent_color'];
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (updates[field] !== undefined || updates[field.replace('public_display_name', 'display_name')] !== undefined) {
      const value = updates[field] !== undefined ? updates[field] : updates[field.replace('public_display_name', 'display_name')];
      if (field === 'primary_color' || field === 'secondary_color' || field === 'accent_color') {
        if (typeof value === 'string' && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
          continue;
        }
      }
      setClauses.push(`${field} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return getCompanyBranding(companyId);
  }

  values.push(companyId);
  await pool.query(
    `UPDATE companies SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  return getCompanyBranding(companyId);
}

const DEFAULT_THEME = {
  primary_color: '#a3ff12',
  secondary_color: '#0c1017',
  accent_color: '#7fe11e',
  wallpaper_url: null,
  onboarding_completed: false,
  setup_progress: 0
};

async function getCompanyTheme(companyId) {
  const hasThemeColumns = await columnExists('companies', 'logo_url');
  if (!hasThemeColumns) {
    return {
      company_id: companyId,
      company_name: 'Barbearia',
      logo_url: null,
      wallpaper_url: null,
      ...DEFAULT_THEME
    };
  }

  const hasOnboardingColumns = await columnExists('companies', 'onboarding_completed');
  let onboardingFields = '';
  if (hasOnboardingColumns) {
    onboardingFields = ', onboarding_completed, setup_progress';
  }

  const result = await pool.query(
    `SELECT 
      id as company_id,
      name as company_name,
      logo_url,
      primary_color,
      secondary_color,
      accent_color,
      wallpaper_url
      ${onboardingFields}
    FROM companies
    WHERE id = $1
    LIMIT 1`,
    [companyId]
  );

  if (result.rowCount === 0) {
    return {
      company_id: companyId,
      company_name: 'Barbearia',
      logo_url: null,
      wallpaper_url: null,
      ...DEFAULT_THEME
    };
  }

  const company = result.rows[0];
  return {
    company_id: company.company_id,
    company_name: company.company_name || 'Barbearia',
    logo_url: company.logo_url || null,
    primary_color: company.primary_color || DEFAULT_THEME.primary_color,
    secondary_color: company.secondary_color || DEFAULT_THEME.secondary_color,
    accent_color: company.accent_color || DEFAULT_THEME.accent_color,
    wallpaper_url: company.wallpaper_url || null,
    onboarding_completed: hasOnboardingColumns ? (company.onboarding_completed || false) : DEFAULT_THEME.onboarding_completed,
    setup_progress: hasOnboardingColumns ? (company.setup_progress || 0) : DEFAULT_THEME.setup_progress
  };
}

async function updateCompanyTheme(companyId, updates) {
  const hasThemeColumns = await columnExists('companies', 'logo_url');
  if (!hasThemeColumns) {
    await pool.query(`
      ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS logo_url TEXT,
        ADD COLUMN IF NOT EXISTS primary_color TEXT,
        ADD COLUMN IF NOT EXISTS secondary_color TEXT,
        ADD COLUMN IF NOT EXISTS accent_color TEXT,
        ADD COLUMN IF NOT EXISTS wallpaper_url TEXT
    `);
  }

  const allowedFields = ['logo_url', 'primary_color', 'secondary_color', 'accent_color', 'wallpaper_url'];
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      let value = updates[field];

      if (field === 'primary_color' || field === 'secondary_color' || field === 'accent_color') {
        if (typeof value === 'string' && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
          value = DEFAULT_THEME[field] || null;
        }
      }

      setClauses.push(`${field} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return getCompanyTheme(companyId);
  }

  values.push(companyId);

  await pool.query(
    `UPDATE companies SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  return getCompanyTheme(companyId);
}

async function getOnboardingStatus(companyId) {
  const hasOnboardingColumns = await columnExists('companies', 'onboarding_completed');
  if (!hasOnboardingColumns) {
    return { onboarding_completed: false, setup_progress: 0 };
  }

  const result = await pool.query(
    `SELECT onboarding_completed, setup_progress FROM companies WHERE id = $1`,
    [companyId]
  );

  if (result.rowCount === 0) {
    return { onboarding_completed: false, setup_progress: 0 };
  }

  return {
    onboarding_completed: result.rows[0].onboarding_completed || false,
    setup_progress: result.rows[0].setup_progress || 0
  };
}

async function saveOnboardingSetup(companyId, data) {
  const allowedFields = [
    'company_name', 'logo_url', 'primary_color', 'secondary_color', 'accent_color',
    'phone', 'whatsapp', 'address'
  ];

  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      let value = data[field];

      if (field === 'primary_color' || field === 'secondary_color' || field === 'accent_color') {
        if (typeof value === 'string' && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
          continue;
        }
      }

      setClauses.push(`${field} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  const hasOnboardingColumns = await columnExists('companies', 'onboarding_completed');

  if (hasOnboardingColumns && data.onboarding_completed !== undefined) {
    setClauses.push(`onboarding_completed = $${paramIndex}`);
    values.push(data.onboarding_completed);
    paramIndex++;
  }

  if (hasOnboardingColumns && data.setup_progress !== undefined) {
    setClauses.push(`setup_progress = $${paramIndex}`);
    values.push(data.setup_progress);
    paramIndex++;
  }

  if (setClauses.length === 0) {
    return getCompanyTheme(companyId);
  }

  values.push(companyId);

  await pool.query(
    `UPDATE companies SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  return getCompanyTheme(companyId);
}
