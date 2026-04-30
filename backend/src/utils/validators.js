// REGRA GLOBAL: nunca retornar 500 por erro de input.
// Toda validacao de entrada deve acontecer antes do banco.

function isNonEmptyString(value) {
  return String(value || '').trim().length > 0;
}

function hasMinLength(value, minLength) {
  return String(value || '').length >= Number(minLength || 0);
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

module.exports = {
  isNonEmptyString,
  hasMinLength,
  isValidEmail,
  isValidPassword,
  isValidPin,
  isFiniteNumberValue
};
