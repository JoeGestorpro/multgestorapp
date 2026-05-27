'use strict'
// shared/capabilities/booking-engine/scheduling-utils.js
// Pure scheduling utilities — no database dependency.
// Reusable across verticals.

const crypto = require('crypto');

const APPOINTMENT_STATUS = ['scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'canceled', 'no_show'];
const ACTIVE_APPOINTMENT_STATUSES = ['scheduled', 'confirmed', 'arrived', 'in_progress'];
const BRAZIL_TIMEZONE = 'America/Cuiaba';
const TIMEZONE_OFFSETS = {
  'America/Cuiaba': '-04:00',
  'America/Sao_Paulo': '-03:00'
};

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function normalizeDateInput(value) {
  const normalized = String(value || '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw createError('Data invalida. Use o formato YYYY-MM-DD', 400);
  }

  return normalized;
}

function normalizeTimeInput(value) {
  const normalized = String(value || '').trim();

  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    throw createError('Horario invalido. Use o formato HH:MM', 400);
  }

  return normalized;
}

function normalizeStartsAtInput(value) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    throw createError('Data e horario do agendamento sao obrigatorios', 400);
  }

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw createError('Data e horario do agendamento invalidos', 400);
  }

  return parsed;
}

function getTimezoneOffset(timezone) {
  return TIMEZONE_OFFSETS[timezone] || TIMEZONE_OFFSETS[BRAZIL_TIMEZONE];
}

function toUtcDate(date, time, timezone = BRAZIL_TIMEZONE) {
  return new Date(`${date}T${time}:00${getTimezoneOffset(timezone)}`);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function formatDateKey(date, timezone = BRAZIL_TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function getLocalDateTimeParts(date, timezone = BRAZIL_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);

  const value = (type) => parts.find((part) => part.type === type)?.value || '';

  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    time: `${value('hour')}:${value('minute')}`
  };
}

function weekdayFromDate(date, timezone = BRAZIL_TIMEZONE) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short'
  }).format(new Date(`${date}T12:00:00${getTimezoneOffset(timezone)}`));

  return {
    Sun: '0',
    Mon: '1',
    Tue: '2',
    Wed: '3',
    Thu: '4',
    Fri: '5',
    Sat: '6'
  }[weekday];
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function maskTokenPreview(token) {
  const normalized = String(token || '');
  return normalized ? `${normalized.slice(0, 8)}...` : 'vazio';
}

function maskEmailPreview(email) {
  const normalized = normalizeEmail(email);

  if (!normalized || !normalized.includes('@')) {
    return 'invalido';
  }

  const [local, domain] = normalized.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
}

function getOnlineMinimumAdvanceHours(settings = {}) {
  const enabled = settings.online_min_advance_enabled === true;
  const value = Math.max(0, Number(settings.online_min_advance_value || 0));

  return enabled ? value : 0;
}

function getWorkingWindow(date, settings) {
  const weeklyHours = settings.weekly_hours || {};
  const weekday = weekdayFromDate(date, settings.timezone || BRAZIL_TIMEZONE);
  const window = weeklyHours?.[weekday];

  if (!window || !window.start || !window.end) {
    return null;
  }

  const start = toUtcDate(date, window.start, settings.timezone);
  const end = toUtcDate(date, window.end, settings.timezone);

  return { start, end };
}

function buildAvailabilitySlots({ date, settings, startsAtFloor, durationMinutes, conflictsFn }) {
  const workingWindow = getWorkingWindow(date, settings);

  if (!workingWindow) {
    return [];
  }

  const slots = [];
  const interval = Number(settings.slot_interval_minutes || 30);
  let cursor = new Date(workingWindow.start);

  while (cursor < workingWindow.end) {
    const slotEnd = addMinutes(cursor, durationMinutes);

    if (slotEnd > workingWindow.end) {
      break;
    }

    const slotTime = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: settings.timezone || BRAZIL_TIMEZONE
    }).format(cursor);

    const isAfterNotice = cursor >= startsAtFloor;
    const isAvailable = isAfterNotice && !conflictsFn(cursor, slotEnd);

    slots.push({
      time: slotTime,
      starts_at: cursor.toISOString(),
      ends_at: slotEnd.toISOString(),
      available: isAvailable
    });

    cursor = addMinutes(cursor, interval);
  }

  return slots;
}

module.exports = {
  APPOINTMENT_STATUS,
  ACTIVE_APPOINTMENT_STATUSES,
  BRAZIL_TIMEZONE,
  TIMEZONE_OFFSETS,
  createError,
  normalizeEmail,
  normalizePhone,
  normalizeDateInput,
  normalizeTimeInput,
  normalizeStartsAtInput,
  getTimezoneOffset,
  toUtcDate,
  addMinutes,
  formatDateKey,
  getLocalDateTimeParts,
  weekdayFromDate,
  hashToken,
  maskTokenPreview,
  maskEmailPreview,
  getOnlineMinimumAdvanceHours,
  getWorkingWindow,
  buildAvailabilitySlots
};
