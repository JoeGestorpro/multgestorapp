/**
 * barber-helpers.js
 *
 * Helpers extraidos do barber.service.js (God Class) para uso
 * compartilhado entre os bounded services do modulo BarberGestor.
 *
 * NOTA: Esta e uma etapa temporaria da descontinuacao do
 * barber.service.js. Helpers SQL-specific permanecem nos
 * repositories/services respectivos.
 */

const { appLogger } = require('../shared/core/logger');

const BUSINESS_TIMEZONE = 'America/Cuiaba';

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

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toNullableInteger(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return null;
  if (!Number.isFinite(number)) return null;
  if (number <= 0) return null;
  return Math.floor(number);
}

function ensureCompany(companyId) {
  if (!companyId) {
    throw createError('Usuario sem empresa vinculada', 403);
  }
}

function ensureAdmin(user, message = 'Apenas admin pode alterar o catalogo de servicos') {
  if (!['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin'].includes(user?.role)) {
    throw createError(message, 403);
  }
}

function ensureCashManager(user, message = 'Apenas usuarios autorizados podem operar o caixa') {
  if (!['admin', 'master_admin', 'secretary'].includes(user?.role)) {
    throw createError(message, 403);
  }
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
  if (!normalized) return fallback;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw createError('Data invalida. Use o formato YYYY-MM-DD', 400);
  }
  return normalized;
}

function normalizeTimeInput(value, fallback = null) {
  const normalized = String(value || '').trim();
  if (!normalized) return fallback;
  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    throw createError('Horario invalido. Use o formato HH:MM', 400);
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
  return { startAt: startUTC.toISOString(), endAt: endUTC.toISOString() };
}

function buildReportPeriod(filter = 'today', startDate, endDate) {
  const period = String(filter || 'today').trim();
  const today = getBusinessDateString();
  if (period === 'week') return getWeekRange(today);
  if (period === 'month') return getMonthRange(today);
  if (period === 'custom' && startDate && endDate) {
    const start = normalizeDateInput(startDate);
    const end = normalizeDateInput(endDate);
    if (start > end) throw createError('Periodo personalizado invalido', 400);
    return { start, end };
  }
  return { start: today, end: today };
}

function normalizeCashDateFromSale(sale) {
  const saleDate = sale?.sale_date_local || sale?.sale_date || sale?.created_at || sale?.createdAt;
  const cashDate = saleDate instanceof Date
    ? saleDate.toISOString().slice(0, 10)
    : String(saleDate || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cashDate)) {
    throw createError('Data da venda invalida para recalcular o caixa diario.', 400);
  }
  return cashDate;
}

module.exports = {
  BUSINESS_TIMEZONE,
  PAYMENT_METHOD_ALIASES,
  createError,
  toNumber,
  toNullableInteger,
  ensureCompany,
  ensureAdmin,
  ensureCashManager,
  isSaleActiveSql,
  normalizePaymentMethod,
  isBarterPayment,
  getBusinessDateParts,
  getBusinessDateString,
  normalizeDateInput,
  normalizeTimeInput,
  getMonthRange,
  getWeekRange,
  addDateDays,
  buildBusinessTimestampRange,
  buildReportPeriod,
  normalizeCashDateFromSale
};
