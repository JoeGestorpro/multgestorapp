// REGRA GLOBAL: nunca retornar 500 por erro de input.
// Toda validacao de entrada deve acontecer antes do banco.

function isNonEmptyString(value) {
  return String(value || '').trim().length > 0;
}

function hasMinLength(value, minLength) {
  return String(value || '').length >= Number(minLength || 0);
}

function normalizeEmail(email) {
  if (!email) return null;
  return String(email).toLowerCase().trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function isValidPassword(password, minLength = 6) {
  return hasMinLength(password, minLength);
}

function isValidPin(pin, minLength = 4) {
  const normalized = String(pin || '').trim();
  return new RegExp(`^\\d{${Number(minLength || 4)},}$`).test(normalized);
}

function isFiniteNumberValue(value) {
  return value !== undefined && value !== null && value !== '' && Number.isFinite(Number(value));
}

function normalizePhone(phone) {
  if (!phone) return null;
  return String(phone).replace(/\D/g, '');
}

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeDateInput(value, fallback = null) {
  const normalized = String(value || '').trim();
  if (!normalized) return fallback;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const err = new Error('Data invalida. Use o formato YYYY-MM-DD');
    err.statusCode = 400;
    throw err;
  }
  return normalized;
}

function normalizeTimeInput(value, fallback = null) {
  const normalized = String(value || '').trim();
  if (!normalized) return fallback;
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(normalized)) {
    const err = new Error('Horario invalido. Use o formato HH:MM');
    err.statusCode = 400;
    throw err;
  }
  return normalized.length === 5 ? `${normalized}:00` : normalized;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toNullableInteger(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.round(number);
}

module.exports = {
  isNonEmptyString,
  hasMinLength,
  normalizeEmail,
  isValidEmail,
  isValidPassword,
  isValidPin,
  isFiniteNumberValue,
  normalizePhone,
  normalizeSlug,
  normalizeDateInput,
  normalizeTimeInput,
  toNumber,
  toNullableInteger,
};
