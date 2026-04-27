const bcrypt = require('bcryptjs');
const fs = require('fs/promises');
const path = require('path');
const pool = require('../config/database');
const supabase = require('../config/supabase');

const BUSINESS_TIMEZONE = 'America/Cuiaba';
const PAYMENT_METHODS = ['dinheiro', 'pix', 'credito', 'debito', 'permuta'];
const COMMISSION_TYPES = ['percentage', 'fixed'];
const SERVICE_TYPES = ['service', 'product', 'combo'];
const ADVANCE_STATUS = ['pending', 'approved', 'rejected', 'liquidated'];
const CASH_STATUS = ['open', 'pre_closed', 'closed'];
const APPOINTMENT_STATUS = ['scheduled', 'confirmed', 'completed', 'canceled', 'no_show'];
const COLLABORATOR_AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024;
const COLLABORATOR_AVATAR_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};
const UPLOADS_ROOT = path.resolve(__dirname, '..', '..', 'uploads');
const PAYMENT_METHOD_ALIASES = {
  cash: 'dinheiro',
  dinheiro: 'dinheiro',
  pix: 'pix',
  credit: 'credito',
  credito: 'credito',
  debit: 'debito',
  debito: 'debito',
  trade: 'permuta',
  permuta: 'permuta'
};

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
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

function buildCollaboratorAvatarDirectory(ownerId, collaboratorId) {
  return path.join(UPLOADS_ROOT, 'barber-collaborators', String(ownerId), String(collaboratorId));
}

function getCollaboratorAvatarRelativePath(ownerId, collaboratorId, extension) {
  return path.posix.join('barber-collaborators', String(ownerId), String(collaboratorId), `avatar.${extension}`);
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
  if (!companyId) {
    throw createError('Usuario sem empresa vinculada', 403);
  }
}

function ensureAdmin(user, message = 'Apenas admin pode alterar o catalogo de servicos') {
  if (!['admin', 'master_admin'].includes(user?.role)) {
    throw createError(message, 403);
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
  return ['admin', 'master_admin'].includes(user?.role);
}

function normalizePaymentMethod(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return PAYMENT_METHOD_ALIASES[normalized] || normalized;
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
    commissionRate: toNumber(data.commission_rate || data.commissionRate),
    isActive: data.is_active === undefined && data.isActive === undefined
      ? true
      : Boolean(data.is_active ?? data.isActive),
    canLaunchSales: data.can_launch_sales === undefined && data.canLaunchSales === undefined
      ? false
      : Boolean(data.can_launch_sales ?? data.canLaunchSales),
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
  if (!payload.name) {
    throw createError('Nome do colaborador e obrigatorio', 400);
  }

  if (!payload.email) {
    throw createError('Email do colaborador e obrigatorio', 400);
  }

  if (!options.allowMissingPassword && payload.password.length < 6) {
    throw createError('A senha inicial deve ter pelo menos 6 caracteres', 400);
  }

  if (payload.password && payload.password.length < 6) {
    throw createError('A senha deve ter pelo menos 6 caracteres', 400);
  }

  if (!COMMISSION_TYPES.includes(payload.commissionType)) {
    throw createError('Tipo de comissao invalido', 400);
  }

  if (payload.commissionRate < 0) {
    throw createError('Comissao invalida', 400);
  }
}

function normalizeAppointmentPayload(data = {}) {
  return {
    serviceId: data.service_id || data.serviceId || null,
    collaboratorId: data.collaborator_id || data.collaboratorId || null,
    customerName: String(data.customer_name || data.customerName || '').trim(),
    customerPhone: String(data.customer_phone || data.customerPhone || '').trim(),
    customerEmail: normalizeEmail(data.customer_email || data.customerEmail) || null,
    appointmentDate: normalizeDateInput(data.appointment_date || data.appointmentDate, null),
    appointmentTime: String(data.appointment_time || data.appointmentTime || '').trim(),
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

  if (!payload.appointmentDate) {
    throw createError('Data do agendamento e obrigatoria', 400);
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(payload.appointmentTime)) {
    throw createError('Horario do agendamento invalido. Use HH:MM', 400);
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
    `SELECT id, nickname, commission_type, commission_rate, is_active, is_deleted
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
       barber_collaborators.owner_id,
       barber_collaborators.company_id,
       barber_collaborators.user_id,
       barber_collaborators.nickname,
       barber_collaborators.commission_type,
       barber_collaborators.commission_rate,
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
       owner_id,
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
       barber_collaborators.owner_id,
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
  barber_products.owner_id,
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
       owner_id,
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
       owner_id,
       company_id,
       cash_date,
       status,
       opened_at,
       opening_balance,
       opened_by,
       notes,
       updated_at
     )
     VALUES ($1, $1, $2::date, 'open', NOW(), $3, $4, $5, NOW())
     ON CONFLICT (owner_id, cash_date) DO NOTHING`,
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
       COALESCE(SUM(barber_sales.total_amount), 0)::numeric AS gross_total,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'pix' THEN barber_sales.total_amount ELSE 0 END), 0)::numeric AS pix_total,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'dinheiro' THEN barber_sales.total_amount ELSE 0 END), 0)::numeric AS cash_total,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'credito' THEN barber_sales.total_amount ELSE 0 END), 0)::numeric AS credit_total,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'debito' THEN barber_sales.total_amount ELSE 0 END), 0)::numeric AS debit_total,
       COALESCE(SUM(CASE WHEN barber_sales.payment_method = 'permuta' THEN barber_sales.total_amount ELSE 0 END), 0)::numeric AS trade_total,
       COALESCE(SUM(barber_sales.change_amount), 0)::numeric AS change_total,
       COUNT(*)::integer AS total_sales
     FROM barber_sales
     WHERE barber_sales.company_id = $1
       AND barber_sales.sale_date_local = $2::date`,
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
       AND barber_sales.sale_date_local = $2::date`,
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
      owner_id,
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

async function deleteService(companyId, user, serviceId) {
  ensureCompany(companyId);
  ensureAdmin(user);
  await ensureServiceExists(companyId, serviceId);

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
       owner_id,
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
       owner_id,
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
     VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, false, NOW())
    RETURNING id, owner_id, company_id, name, company_name, phone, email, document, notes, is_active, is_deleted, created_at, updated_at`,
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
    RETURNING id, owner_id, company_id, name, company_name, phone, email, document, notes, is_active, is_deleted, created_at, updated_at`,
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
    RETURNING id, owner_id, company_id, name, company_name, phone, email, document, notes, is_active, is_deleted, created_at, updated_at`,
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
       owner_id,
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
     VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, false, NOW())
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
        COALESCE(SUM(barber_sale_items.commission_amount), 0)::numeric AS commission_total
      FROM barber_sale_items
       INNER JOIN barber_sales
         ON barber_sales.id = barber_sale_items.sale_id
        AND barber_sales.company_id = barber_sale_items.company_id
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local BETWEEN $2::date AND $3::date
       GROUP BY barber_sale_items.sale_id
     ),
     sale_agg AS (
       SELECT
         barber_sales.collaborator_id,
         COUNT(barber_sales.id)::integer AS sales_count,
         COALESCE(SUM(COALESCE(sale_item_agg.gross_total, barber_sales.total_amount)), 0)::numeric AS gross_revenue,
         COALESCE(SUM(
           CASE
             WHEN sale_item_agg.sale_id IS NOT NULL THEN COALESCE(sale_item_agg.commission_total, 0)
             WHEN filtered_collaborators.commission_type = 'fixed' THEN COALESCE(filtered_collaborators.commission_rate, 0)
             ELSE COALESCE(barber_sales.total_amount, 0) * (COALESCE(filtered_collaborators.commission_rate, 0) / 100.0)
           END
         ), 0)::numeric AS commission_total,
         MAX(barber_sales.created_at) AS last_sale_at
       FROM barber_sales
       INNER JOIN filtered_collaborators ON filtered_collaborators.id = barber_sales.collaborator_id
       LEFT JOIN sale_item_agg ON sale_item_agg.sale_id = barber_sales.id
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local BETWEEN $2::date AND $3::date
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
       COALESCE(sale_agg.commission_total, 0)::numeric AS commission_total,
       COALESCE(advance_agg.advances_total, 0)::numeric AS advances_total,
       (COALESCE(sale_agg.commission_total, 0) - COALESCE(advance_agg.advances_total, 0))::numeric AS net_to_receive,
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
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode visualizar colaboradores');
  return getCollaboratorRecord(companyId, collaboratorId);
}

async function createCollaborator(companyId, user, data) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode cadastrar colaboradores');

  const payload = normalizeCollaboratorPayload(data);
  validateCollaboratorPayload(payload);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingUser = await client.query(
      'SELECT id, company_id, role FROM users WHERE email = $1 LIMIT 1',
      [payload.email]
    );

    if (existingUser.rowCount > 0) {
      throw createError('Email ja cadastrado', 409);
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const userResult = await client.query(
      `INSERT INTO users (
         owner_id,
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
       VALUES ($1, $1, $2, $3, $4, $5, 'collaborator', $6, $7, $8, $9, NOW())
       RETURNING
         id,
         owner_id,
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
         owner_id,
         company_id,
         user_id,
         nickname,
         commission_type,
         commission_rate,
         available_for_booking,
         avatar_url,
         is_active,
         is_deleted,
         updated_at
       )
      VALUES ($1, $1, $2, $3, $4, $5, $6, NULL, $7, false, NOW())
      RETURNING
        id,
        owner_id,
        company_id,
         user_id,
         nickname,
         commission_type,
         commission_rate,
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
    throw error;
  } finally {
    client.release();
  }
}

async function updateCollaborator(companyId, user, collaboratorId, data) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode editar colaboradores');

  const existing = await getCollaboratorRecord(companyId, collaboratorId);
  const payload = normalizeCollaboratorPayload(data);
  validateCollaboratorPayload(payload, { allowMissingPassword: true });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const duplicateUser = await client.query(
      'SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1',
      [payload.email, existing.user_id]
    );

    if (duplicateUser.rowCount > 0) {
      throw createError('Email ja cadastrado', 409);
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
         owner_id,
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
           available_for_booking = $6,
           is_active = $7,
           updated_at = NOW()
      WHERE id = $1
        AND company_id = $2
        AND COALESCE(is_deleted, false) = false
      RETURNING
        id,
        owner_id,
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
      [
        collaboratorId,
        companyId,
        payload.nickname || payload.name,
        payload.commissionType,
        payload.commissionRate,
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
    throw error;
  } finally {
    client.release();
  }
}

async function updateCollaboratorStatus(companyId, user, collaboratorId, data = {}) {
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
        owner_id,
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
       owner_id,
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

    console.log('[supabase-upload] Iniciando upload:', storagePath);
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.error('[supabase-avatar-upload-error]', {
        bucket,
        storagePath,
        mimetype: file?.mimetype,
        size: file?.size,
        message: error?.message,
        statusCode: error?.statusCode,
        error
      });

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
      owner_id,
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
      owner_id,
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
      ORDER BY barber_sales.created_at DESC`,
      [companyId, normalizedDate]
    ),
    client.query(
      `SELECT
         barber_collaborators.id AS collaborator_id,
         barber_collaborators.nickname AS collaborator_name,
         COUNT(barber_sales.id)::integer AS total_sales,
         COALESCE(SUM(barber_sales.total_amount), 0)::numeric AS gross_total,
         COALESCE(SUM(COALESCE(sale_commissions.total_commission, 0)), 0)::numeric AS total_commission
       FROM barber_sales
       LEFT JOIN barber_collaborators
         ON barber_collaborators.id = barber_sales.collaborator_id
        AND barber_collaborators.company_id = barber_sales.company_id
       LEFT JOIN (
         SELECT sale_id, SUM(commission_amount) AS total_commission
         FROM barber_sale_items
         GROUP BY sale_id
       ) sale_commissions ON sale_commissions.sale_id = barber_sales.id
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local = $2::date
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
  ensureCompany(companyId);
  ensureCashManager(user);

  const cashDate = normalizeDateInput(data.cash_date || data.cashDate, getBusinessDateString());
  const openingBalance = toNumber(data.opening_balance ?? data.openingBalance);
  const notes = String(data.notes || '').trim() || null;

  if (openingBalance < 0) {
    throw createError('Saldo inicial invalido', 400);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await ensureCashSession(companyId, cashDate, user.id, client, {
      openingBalance,
      notes
    });

    ensureCashSessionEditable(existing);

    const openedResult = await client.query(
      `UPDATE barber_cash_sessions
       SET status = 'open',
           opened_at = COALESCE(opened_at, NOW()),
           opening_balance = $3,
           opened_by = COALESCE(opened_by, $4),
           notes = COALESCE($5, notes),
           updated_at = NOW()
       WHERE company_id = $1
         AND cash_date = $2::date
       RETURNING id`,
      [companyId, cashDate, openingBalance, user.id, notes]
    );

    const session = await recalculateCashSession(companyId, cashDate, client);

    await appendCashAuditLog(companyId, user.id, 'open_cash', openedResult.rows[0]?.id || session.id, {
      cash_date: cashDate,
      opening_balance: openingBalance,
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
       owner_id,
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
       owner_id,
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
         COALESCE(SUM(barber_sales.total_amount), 0)::numeric AS gross_total,
         COALESCE(SUM(COALESCE(sale_commissions.total_commission, 0)), 0)::numeric AS total_commission
       FROM barber_sales
       LEFT JOIN barber_collaborators
         ON barber_collaborators.id = barber_sales.collaborator_id
        AND barber_collaborators.company_id = barber_sales.company_id
       LEFT JOIN (
         SELECT sale_id, SUM(commission_amount) AS total_commission
         FROM barber_sale_items
         GROUP BY sale_id
       ) sale_commissions ON sale_commissions.sale_id = barber_sales.id
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local BETWEEN $2::date AND $3::date
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
       SET status = 'closed',
           closed_at = NOW(),
           closed_by = $3,
           notes = COALESCE($4, notes),
           updated_at = NOW()
       WHERE company_id = $1
         AND cash_date = $2::date
       RETURNING id`,
      [companyId, cashDate, user.id, notes]
    );

    await appendCashAuditLog(companyId, user.id, 'close_cash', result.rows[0]?.id || session.id, {
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

  const commissionsResult = await pool.query(
    `SELECT COALESCE(SUM(barber_sale_items.commission_amount), 0)::numeric AS total_commissions
     FROM barber_sale_items
     INNER JOIN barber_sales
       ON barber_sales.id = barber_sale_items.sale_id
      AND barber_sales.company_id = barber_sale_items.company_id
     WHERE barber_sales.company_id = $1
       AND barber_sales.sale_date_local = $2::date`,
    [companyId, getBusinessDateString()]
  );

  const recentSalesResult = await pool.query(
    `SELECT
       barber_sales.id,
       barber_collaborators.nickname AS collaborator_name,
       barber_sales.payment_method,
       barber_sales.total_amount,
       barber_sales.created_at
     FROM barber_sales
     LEFT JOIN barber_collaborators
       ON barber_collaborators.id = barber_sales.collaborator_id
      AND barber_collaborators.company_id = barber_sales.company_id
     WHERE barber_sales.company_id = $1
     ORDER BY barber_sales.created_at DESC
     LIMIT 10`,
    [companyId]
  );

  const collaboratorSummaryResult = await pool.query(
    `SELECT
       barber_collaborators.id AS collaborator_id,
       barber_collaborators.nickname AS collaborator_name,
       COALESCE(sale_totals.total_sales, 0)::numeric AS total_sales,
       COALESCE(sale_totals.total_commission, 0)::numeric AS total_commission,
       COALESCE(approved_advances.total_advances, 0)::numeric AS total_advances,
       (COALESCE(sale_totals.total_commission, 0) - COALESCE(approved_advances.total_advances, 0))::numeric AS net_commission
     FROM barber_collaborators
     LEFT JOIN (
       SELECT
         barber_sales.collaborator_id,
         SUM(barber_sales.total_amount) AS total_sales,
         SUM(COALESCE(sale_commissions.total_commission, 0)) AS total_commission
       FROM barber_sales
       LEFT JOIN (
         SELECT sale_id, SUM(commission_amount) AS total_commission
         FROM barber_sale_items
         GROUP BY sale_id
       ) sale_commissions ON sale_commissions.sale_id = barber_sales.id
       WHERE barber_sales.company_id = $1
         AND barber_sales.sale_date_local = $2::date
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
    recentSales: recentSalesResult.rows,
    collaboratorSummary: collaboratorSummaryResult.rows,
    cashSession: session,
    viewMode: 'admin'
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

  const summaryResult = await pool.query(
    `SELECT
       COALESCE(SUM(barber_sales.total_amount), 0)::numeric AS total_sales,
       COALESCE(SUM(CASE WHEN barber_sales.sale_date_local = $3::date THEN barber_sales.total_amount ELSE 0 END), 0)::numeric AS today_sales,
       COUNT(CASE WHEN barber_sales.sale_date_local = $3::date THEN 1 END) AS today_attendances
     FROM barber_sales
     WHERE barber_sales.company_id = $1
       AND barber_sales.collaborator_id = $2`,
    [companyId, collaborator.id, today]
  );

  const commissionsResult = await pool.query(
    `SELECT COALESCE(SUM(barber_sale_items.commission_amount), 0)::numeric AS total_commission
     FROM barber_sale_items
     INNER JOIN barber_sales
       ON barber_sales.id = barber_sale_items.sale_id
      AND barber_sales.company_id = barber_sale_items.company_id
     WHERE barber_sales.company_id = $1
       AND barber_sales.collaborator_id = $2`,
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

  const weekResult = await pool.query(
    `SELECT COALESCE(SUM(barber_sale_items.commission_amount), 0)::numeric AS week_commission
     FROM barber_sale_items
     INNER JOIN barber_sales
       ON barber_sales.id = barber_sale_items.sale_id
      AND barber_sales.company_id = barber_sale_items.company_id
     WHERE barber_sales.company_id = $1
       AND barber_sales.collaborator_id = $2
       AND barber_sales.sale_date_local BETWEEN $3::date AND $4::date`,
    [companyId, collaborator.id, weekRange.start, weekRange.end]
  );

  const monthResult = await pool.query(
    `SELECT COALESCE(SUM(barber_sale_items.commission_amount), 0)::numeric AS month_commission
     FROM barber_sale_items
     INNER JOIN barber_sales
       ON barber_sales.id = barber_sale_items.sale_id
      AND barber_sales.company_id = barber_sale_items.company_id
     WHERE barber_sales.company_id = $1
       AND barber_sales.collaborator_id = $2
       AND barber_sales.sale_date_local BETWEEN $3::date AND $4::date`,
    [companyId, collaborator.id, monthRange.start, monthRange.end]
  );

  const recentSalesResult = await pool.query(
    `SELECT
       barber_sales.id,
       barber_sales.payment_method,
       barber_sales.total_amount,
       barber_sales.created_at,
       barber_sales.sale_date_local,
       sale_item.item_summary AS service_name,
       COALESCE(sale_item.total_commission, 0)::numeric AS commission_amount
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
     ORDER BY barber_sales.created_at DESC
     LIMIT 8`,
    [companyId, collaborator.id]
  );

  const totalSales = toNumber(summaryResult.rows[0].total_sales);
  const totalCommission = toNumber(commissionsResult.rows[0].total_commission);
  const totalAdvances = toNumber(advancesResult.rows[0].total_advances);

  return {
    collaborator: {
      id: collaborator.id,
      nickname: collaborator.nickname,
      commission_type: collaborator.commission_type,
      commission_rate: collaborator.commission_rate
    },
    ownMetrics: {
      totalAttendances: Number(summaryResult.rows[0].today_attendances || 0),
      myCommissionTotal: totalCommission,
      myCommissionAccumulated: totalCommission,
      myAdvances: totalAdvances,
      mySettlementBalance: Math.max(0, totalCommission - totalAdvances),
      todayAttendances: Number(summaryResult.rows[0].today_attendances || 0),
      totalCommission,
      netCommission: Math.max(0, totalCommission - totalAdvances),
      weekCommission: toNumber(weekResult.rows[0].week_commission),
      monthCommission: toNumber(monthResult.rows[0].month_commission),
      totalAdvances
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

async function validateApprovalCredential(userId, data) {
  const pin = String(data.pin || '').trim();
  const adminPassword = String(data.adminPassword || data.admin_password || '');

  if (process.env.ADMIN_APPROVAL_PIN && pin && pin === process.env.ADMIN_APPROVAL_PIN) {
    return true;
  }

  if (!adminPassword) {
    throw createError('Informe a senha admin ou PIN para confirmar', 401);
  }

  const result = await pool.query(
    'SELECT password_hash FROM users WHERE id = $1 LIMIT 1',
    [userId]
  );

  if (result.rowCount === 0) {
    throw createError('Usuario admin nao encontrado', 404);
  }

  const passwordMatches = await bcrypt.compare(adminPassword, result.rows[0].password_hash);

  if (!passwordMatches) {
    throw createError('Senha admin ou PIN invalido', 401);
  }

  return true;
}

async function updateAdvanceStatus(companyId, userId, advanceId, status, data = {}) {
  ensureCompany(companyId);

  if (!ADVANCE_STATUS.includes(status) || status === 'pending') {
    throw createError('Status de vale invalido', 400);
  }

  await validateApprovalCredential(userId, data);

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

async function calculateSettlement(companyId, collaboratorId, client = pool) {
  ensureCompany(companyId);
  const collaborator = await getCollaboratorRecord(companyId, collaboratorId, client);
  const lastSettlement = await getLastSettlement(companyId, collaboratorId, client);
  const periodStart = lastSettlement?.period_end || null;

  const salesResult = await client.query(
    `SELECT
       COALESCE(SUM(barber_sales.total_amount), 0)::numeric AS total_sales,
       COALESCE(SUM(COALESCE(sale_commissions.total_commission, 0)), 0)::numeric AS total_commission
     FROM barber_sales
     LEFT JOIN (
       SELECT sale_id, SUM(commission_amount) AS total_commission
       FROM barber_sale_items
       GROUP BY sale_id
     ) sale_commissions ON sale_commissions.sale_id = barber_sales.id
     WHERE barber_sales.company_id = $1
       AND barber_sales.collaborator_id = $2
       AND ($3::timestamp IS NULL OR barber_sales.created_at > $3::timestamp)`,
    [companyId, collaboratorId, periodStart]
  );

  const advancesResult = await client.query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total_advances
     FROM barber_advances
     WHERE company_id = $1
       AND collaborator_id = $2
       AND status = 'approved'`,
    [companyId, collaboratorId]
  );

  const totalSales = toNumber(salesResult.rows[0].total_sales);
  const totalCommission = toNumber(salesResult.rows[0].total_commission);
  const totalAdvances = toNumber(advancesResult.rows[0].total_advances);
  const netAmount = Math.max(0, totalCommission - totalAdvances);

  return {
    collaborator_id: collaborator.id,
    collaborator_name: collaborator.nickname,
    total_sales: totalSales.toFixed(2),
    total_commission: totalCommission.toFixed(2),
    total_advances: totalAdvances.toFixed(2),
    net_amount: netAmount.toFixed(2),
    period_start: periodStart,
    period_end: new Date().toISOString()
  };
}

async function listSettlements(companyId, collaboratorId, user) {
  ensureCompany(companyId);
  const userCollaborator = user?.role === 'collaborator'
    ? await getCollaboratorForUser(companyId, user.id)
    : null;
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
    response.preview = await calculateSettlement(companyId, effectiveCollaboratorId);
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

    const preview = await calculateSettlement(companyId, collaboratorId, client);
    const periodEnd = new Date();

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
         AND status = 'approved'`,
      [companyId, collaboratorId, result.rows[0].id]
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
  ensureCashManager(user, 'Apenas usuarios autorizados podem acessar agendamentos');

  const slugData = await ensureCompanyPublicBookingSlug(companyId);
  const statusFilter = String(query.status || 'all').trim().toLowerCase();
  const values = [companyId];
  const where = ['barber_appointments.company_id = $1'];

  if (statusFilter !== 'all') {
    if (!APPOINTMENT_STATUS.includes(statusFilter)) {
      throw createError('Filtro de status invalido', 400);
    }

    values.push(statusFilter);
    where.push(`barber_appointments.status = $${values.length}`);
  }

  const appointmentsResult = await pool.query(
    `SELECT
       barber_appointments.id,
       barber_appointments.owner_id,
       barber_appointments.company_id,
       barber_appointments.service_id,
       barber_appointments.collaborator_id,
       barber_appointments.customer_name,
       barber_appointments.customer_phone,
       barber_appointments.customer_email,
       barber_appointments.appointment_date,
       barber_appointments.appointment_time::text AS appointment_time,
       barber_appointments.status,
       barber_appointments.notes,
       barber_appointments.created_at,
       barber_appointments.updated_at,
       barber_services.name AS service_name,
       barber_services.icon AS service_icon,
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
     ORDER BY barber_appointments.appointment_date ASC, barber_appointments.appointment_time ASC, barber_appointments.created_at DESC`,
    values
  );

  const today = getBusinessDateString();

  const summaryResult = await pool.query(
    `SELECT
       COUNT(*) FILTER (
         WHERE barber_appointments.appointment_date = $2::date
           AND barber_appointments.status <> 'canceled'
       )::integer AS today_count,
       COUNT(*) FILTER (
         WHERE barber_appointments.appointment_date >= $2::date
           AND barber_appointments.status IN ('scheduled', 'confirmed')
       )::integer AS upcoming_count,
       COUNT(*) FILTER (
         WHERE barber_appointments.status = 'canceled'
       )::integer AS canceled_count
     FROM barber_appointments
     WHERE barber_appointments.company_id = $1`,
    [companyId, today]
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
}

async function createAppointment(companyId, user, data) {
  ensureCompany(companyId);
  ensureCashManager(user, 'Apenas usuarios autorizados podem criar agendamentos');

  const payload = normalizeAppointmentPayload(data);
  validateAppointmentPayload(payload);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await ensureBookableService(companyId, payload.serviceId, client);
    await ensureBookableCollaborator(companyId, payload.collaboratorId, client);

    const result = await client.query(
      `INSERT INTO barber_appointments (
         owner_id,
         company_id,
         service_id,
         collaborator_id,
         customer_name,
         customer_phone,
         customer_email,
         appointment_date,
         appointment_time,
         status,
         notes,
         updated_at
       )
      VALUES ($1, $1, $2, $3, $4, $5, $6, $7::date, $8::time, 'scheduled', $9, NOW())
      RETURNING
        id,
        owner_id,
        company_id,
         service_id,
         collaborator_id,
         customer_name,
         customer_phone,
         customer_email,
         appointment_date,
         appointment_time::text AS appointment_time,
         status,
         notes,
         created_at,
         updated_at`,
      [
        companyId,
        payload.serviceId,
        payload.collaboratorId,
        payload.customerName,
        payload.customerPhone,
        payload.customerEmail,
        payload.appointmentDate,
        payload.appointmentTime,
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

async function updateAppointment(companyId, user, appointmentId, data = {}) {
  ensureCompany(companyId);
  ensureCashManager(user, 'Apenas usuarios autorizados podem atualizar agendamentos');

  const status = String(data.status || '').trim().toLowerCase();
  const notes = data.notes === undefined ? undefined : String(data.notes || '').trim() || null;

  if (!status && notes === undefined) {
    throw createError('Nenhuma alteracao enviada para o agendamento', 400);
  }

  if (status && !APPOINTMENT_STATUS.includes(status)) {
    throw createError('Status do agendamento invalido', 400);
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

  const result = await pool.query(
    `UPDATE barber_appointments
     SET ${sets.join(', ')}
     WHERE id = $1
       AND company_id = $2
    RETURNING
      id,
      owner_id,
      company_id,
       service_id,
       collaborator_id,
       customer_name,
       customer_phone,
       customer_email,
       appointment_date,
       appointment_time::text AS appointment_time,
       status,
       notes,
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
    status: 'canceled'
  });
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

    await ensureBookableService(bookingData.company.id, payload.serviceId, client);
    await ensureBookableCollaborator(bookingData.company.id, payload.collaboratorId, client);

    const result = await client.query(
      `INSERT INTO barber_appointments (
         owner_id,
         company_id,
         service_id,
         collaborator_id,
         customer_name,
         customer_phone,
         customer_email,
         appointment_date,
         appointment_time,
         status,
         notes,
         updated_at
       )
      VALUES ($1, $1, $2, $3, $4, $5, $6, $7::date, $8::time, 'scheduled', $9, NOW())
      RETURNING
        id,
        owner_id,
        company_id,
         service_id,
         collaborator_id,
         customer_name,
         customer_phone,
         customer_email,
         appointment_date,
         appointment_time::text AS appointment_time,
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
        payload.appointmentDate,
        payload.appointmentTime,
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

async function listSales(companyId, user) {
  ensureCompany(companyId);
  const collaborator = user?.role === 'collaborator'
    ? await getCollaboratorForUser(companyId, user.id)
    : null;
  const values = collaborator ? [companyId, collaborator.id] : [companyId];

  const result = await pool.query(
    `SELECT
       barber_sales.id,
       barber_sales.company_id,
       barber_sales.collaborator_id,
       barber_collaborators.nickname AS collaborator_name,
       barber_sales.payment_method,
       barber_sales.total_amount,
       barber_sales.amount_received,
       barber_sales.change_amount,
       barber_sales.client_name,
       barber_sales.notes,
       barber_sales.created_by,
       barber_sales.created_at,
       barber_sales.sale_date_local,
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
       ${collaborator ? 'AND barber_sales.collaborator_id = $2' : ''}
     ORDER BY barber_sales.created_at DESC
     LIMIT 50`,
    values
  );

  return result.rows;
}

async function getMySales(companyId, user) {
  ensureCompany(companyId);
  ensureCollaboratorRole(user);
  requireCollaboratorPermission(user, 'can_view_own_reports', 'Seu acesso ao historico pessoal esta desativado');
  return listSales(companyId, user);
}

async function deleteSale(companyId, user, saleId, data = {}) {
  ensureCompany(companyId);
  ensureAdmin(user, 'Apenas admin pode excluir vendas');

  const reason = String(data.reason || '').trim();

  if (!reason) {
    throw createError('Motivo da exclusao e obrigatorio', 400);
  }

  await validateApprovalCredential(user.id, data);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const saleResult = await client.query(
      `SELECT id, company_id, collaborator_id, payment_method, total_amount, amount_received, change_amount, client_name, notes, created_by, created_at, sale_date_local
       FROM barber_sales
       WHERE id = $1 AND company_id = $2
       LIMIT 1`,
      [saleId, companyId]
    );

    if (saleResult.rowCount === 0) {
      throw createError('Venda nao encontrada', 404);
    }

    const sale = saleResult.rows[0];
    const saleCashSession = await getCashSessionRow(companyId, sale.sale_date_local, client);

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

    await client.query(
      'DELETE FROM barber_sale_items WHERE sale_id = $1 AND company_id = $2',
      [saleId, companyId]
    );
    await client.query('DELETE FROM barber_sales WHERE id = $1 AND company_id = $2', [saleId, companyId]);
    await upsertAndRecalculateCashSession(companyId, sale.sale_date_local, user.id, client);

    await client.query(
      `INSERT INTO barber_audit_logs (company_id, user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, 'delete_sale', 'barber_sale', $3, $4)`,
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

    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function calculateCommission(item, service, collaborator = null) {
  if (!service) {
    return 0;
  }

  const collaboratorCommissionType = collaborator?.commission_type || collaborator?.commissionType;
  const collaboratorCommissionRate = toNumber(collaborator?.commission_rate ?? collaborator?.commissionRate);

  if (item?.item_type === 'service' && collaboratorCommissionType === 'percentage') {
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
  const clientName = String(data.client_name || data.clientName || '').trim() || null;
  const requestedChangeAmount = toNumber(data.change_amount || data.changeAmount);
  const amountReceived = toNumber(data.amount_received || data.amountReceived);
  const saleDateLocal = normalizeDateInput(data.sale_date_local || data.saleDateLocal, getBusinessDateString());
  const notes = String(data.notes || '').trim() || null;
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
        `SELECT id, commission_type, commission_rate
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

    const serviceIds = items
      .filter((item) => (item.item_type || item.itemType || 'service') === 'service' && (item.item_id || item.itemId))
      .map((item) => item.item_id || item.itemId);
    const productIds = items
      .filter((item) => (item.item_type || item.itemType) === 'product' && (item.item_id || item.itemId))
      .map((item) => item.item_id || item.itemId);

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

    const preparedItems = items.map((item) => {
      const itemType = item.item_type || item.itemType || 'service';
      const itemId = item.item_id || item.itemId || null;
      const service = itemType === 'service' ? serviceMap.get(itemId) : null;
      const product = itemType === 'product' ? productMap.get(itemId) : null;
      const sourceItem = service || product || null;
      const description = String(item.description || sourceItem?.name || '').trim();
      const quantity = toNumber(item.quantity || 1);
      const unitPrice = item.unit_price !== undefined || item.unitPrice !== undefined
        ? toNumber(item.unit_price || item.unitPrice)
        : toNumber(service?.price ?? product?.sale_price);

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

    const totalAmount = preparedItems.reduce((sum, item) => sum + item.total_price, 0);
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
         payment_method,
         total_amount,
         amount_received,
         change_amount,
         sale_date_local,
         client_name,
       notes,
        created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, company_id, collaborator_id, payment_method, total_amount, amount_received, change_amount, sale_date_local, client_name, notes, created_by, created_at`,
      [
        companyId,
        collaboratorId,
        paymentMethod,
        totalAmount,
        paymentMethod === 'dinheiro' ? amountReceived : totalAmount,
        changeAmount,
        saleDateLocal,
        clientName,
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
           quantity,
           unit_price,
           total_price,
           commission_amount,
           shop_net_amount
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING id, sale_id, item_type, item_id, company_id, collaborator_id, service_id, product_id, description, item_name_snapshot, commission_type_snapshot, commission_rate_snapshot, quantity, unit_price, total_price, commission_amount, shop_net_amount, created_at`,
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
       users.owner_id,
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
       barber_collaborators.commission_rate
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

  const salesResult = await pool.query(
    `SELECT
       barber_sales.id,
       barber_sales.payment_method,
       barber_sales.total_amount,
       barber_sales.created_at,
       barber_sales.sale_date_local,
       sale_item.item_summary AS service_name,
       sale_item.total_commission AS commission_amount
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
       AND barber_sales.sale_date_local BETWEEN $3::date AND $4::date
     ORDER BY barber_sales.created_at DESC`,
    [companyId, collaborator.id, start, end]
  );

  const totals = salesResult.rows.reduce((accumulator, sale) => {
    accumulator.totalSales += toNumber(sale.total_amount);
    accumulator.totalCommission += toNumber(sale.commission_amount);
    accumulator.attendances += 1;
    return accumulator;
  }, {
    totalSales: 0,
    totalCommission: 0,
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

  return {
    collaborator: {
      id: collaborator.id,
      nickname: collaborator.nickname,
      commission_type: collaborator.commission_type,
      commission_rate: collaborator.commission_rate
    },
    period: {
      start,
      end,
      filter: query.period || 'today'
    },
    totals: {
      totalSales: totals.totalSales,
      totalCommission: totals.totalCommission,
      totalAdvances,
      netCommission: Math.max(0, totals.totalCommission - totalAdvances),
      attendances: totals.attendances
    },
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

module.exports = {
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
  listCustomers,
  getCustomerById,
  updateCustomerStatus,
  getPublicBooking,
  createPublicBookingAppointment,
  listSales,
  getMySales,
  createSale,
  deleteSale,
  getBarberMe,
  getMyReport
};
