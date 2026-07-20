const pool = require('../../config/database');
const {
  addMinutes, toUtcDate, normalizeStartsAtInput, normalizeDateInput,
  normalizeTimeInput, getTimezoneOffset, BRAZIL_TIMEZONE, formatDateKey
} = require('../../shared/capabilities/booking-engine/scheduling-utils');

const { validateBookableSlot, getCompanyBySlug } = require('./booking-scheduling.service');
const WalletService = require('../wallet.service')
const walletService = new WalletService()

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const ACTIVE_APPOINTMENT_STATUSES = ['scheduled', 'confirmed', 'arrived', 'in_progress'];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
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

async function writeAuthAudit(action, options = {}, client = pool) {
  await client.query(
    `INSERT INTO auth_audit_logs (user_id, email, action, ip_address, user_agent, details)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      options.userId || null,
      options.email || null,
      action,
      options.ipAddress || null,
      options.userAgent || null,
      options.details ? JSON.stringify(options.details) : null
    ]
  );
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

async function ensureService(companyId, serviceId, client = pool) {
  const result = await client.query(
    `SELECT id, company_id, name, icon, price, estimated_time_minutes, is_active
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

  if (!result.rows[0].is_active) {
    throw createError('Servico indisponivel para agendamento', 400);
  }

  return result.rows[0];
}

async function ensureCollaborator(companyId, collaboratorId, client = pool) {
  const result = await client.query(
    `SELECT
       barber_collaborators.id,
       barber_collaborators.company_id,
       barber_collaborators.available_for_booking,
       barber_collaborators.is_active,
       COALESCE(users.name, barber_collaborators.nickname) AS name
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

async function listBookableCollaborators(companyId, client = pool) {
  const result = await client.query(
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
    [companyId]
  );

  return result.rows;
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

async function getBookingSettings(companyId, client = pool) {
  await client.query(
    `INSERT INTO barber_booking_settings (company_id)
     VALUES ($1)
     ON CONFLICT (company_id) DO NOTHING`,
    [companyId]
  );

  const result = await client.query(
    `SELECT
       company_id,
       timezone,
       slot_interval_minutes,
       minimum_notice_minutes,
       online_min_advance_enabled,
       online_min_advance_value,
       cancellation_limit_hours,
       weekly_hours,
       allow_customer_select_collaborator,
       allow_any_collaborator,
       confirmation_message
     FROM barber_booking_settings
     WHERE company_id = $1
     LIMIT 1`,
    [companyId]
  );

  if (result.rowCount === 0) {
    throw createError('Configuracoes de agenda nao encontradas', 500);
  }

  const settings = result.rows[0];
  const onlineMinAdvanceEnabled = settings.online_min_advance_enabled === true;
  const onlineMinAdvanceValue = Math.max(0, Number(settings.online_min_advance_value || 0));
  const effectiveMinimumNoticeMinutes = onlineMinAdvanceEnabled
    ? onlineMinAdvanceValue * 60
    : 0;

  return {
    ...settings,
    online_min_advance_enabled: onlineMinAdvanceEnabled,
    online_min_advance_value: onlineMinAdvanceValue,
    minimum_notice_minutes: effectiveMinimumNoticeMinutes
  };
}

async function getSchedulingAvailability(companySlug, query = {}) {
  const company = await getCompanyBySlug(companySlug);
  const companyId = company.id;
  const serviceId = query.serviceId || query.service_id;
  const collaboratorId = query.collaboratorId || query.collaborator_id;
  const date = normalizeDateInput(query.date);

  if (!serviceId) {
    throw createError('Servico e obrigatorio para consultar disponibilidade', 400);
  }

  const settings = await getBookingSettings(companyId);
  const service = await ensureService(companyId, serviceId);
  const durationMinutes = Number(service.estimated_time_minutes || 30);
  const startsAtFloor = addMinutes(new Date(), Number(settings.minimum_notice_minutes || 0));
  const timezone = settings.timezone || BRAZIL_TIMEZONE;

  if (!collaboratorId && settings.allow_any_collaborator === false) {
    throw createError('Selecione um profissional para consultar a disponibilidade', 400);
  }

  let workingHoursByKey = null;
  try {
    const bwhResult = await pool.query(
      `SELECT collaborator_id, weekday, opens_at, closes_at, is_closed, pauses
       FROM barber_working_hours
       WHERE company_id = $1`,
      [companyId]
    );
    if (bwhResult.rows.length > 0) {
      workingHoursByKey = { general: {}, collaborator: {} };
      for (const row of bwhResult.rows) {
        if (row.collaborator_id) {
          workingHoursByKey.collaborator[`${row.collaborator_id}_${row.weekday}`] = row;
        } else {
          workingHoursByKey.general[row.weekday] = row;
        }
      }
    }
  } catch (e) {
    workingHoursByKey = null;
  }

  async function loadCollaboratorSlots(targetCollaboratorId) {
    await ensureCollaborator(companyId, targetCollaboratorId);

    const appointmentsResult = await pool.query(
      `SELECT starts_at, ends_at
       FROM barber_appointments
       WHERE company_id = $1
         AND collaborator_id = $2
         AND DATE(starts_at AT TIME ZONE $4) = $3::date
         AND status = ANY($5::text[])`,
      [companyId, targetCollaboratorId, date, timezone, ACTIVE_APPOINTMENT_STATUSES]
    );

    const blocksResult = await pool.query(
      `SELECT starts_at, ends_at
       FROM barber_booking_blocks
       WHERE company_id = $1
         AND (collaborator_id IS NULL OR collaborator_id = $2)
         AND DATE(starts_at AT TIME ZONE $4) <= $3::date
         AND DATE(ends_at AT TIME ZONE $4) >= $3::date`,
      [companyId, targetCollaboratorId, date, timezone]
    );

    let effectiveSettings = settings;
    let pauseConflicts = [];

    if (workingHoursByKey) {
      const weekdayNum = weekdayFromDate(date, timezone);
      const collKey = `${targetCollaboratorId}_${weekdayNum}`;
      const collOverride = workingHoursByKey.collaborator[collKey];
      const rowOverride = collOverride || workingHoursByKey.general[weekdayNum];

      if (rowOverride) {
        if (rowOverride.is_closed) return [];

        const wh = { ...(settings.weekly_hours || {}) };
        wh[weekdayNum] = {
          start: String(rowOverride.opens_at || '').slice(0, 5),
          end: String(rowOverride.closes_at || '').slice(0, 5)
        };
        effectiveSettings = { ...settings, weekly_hours: wh };

        if (rowOverride.pauses && Array.isArray(rowOverride.pauses)) {
          pauseConflicts = rowOverride.pauses.map(p => {
            try {
              return {
                starts_at: toUtcDate(date, p.start, timezone),
                ends_at: toUtcDate(date, p.end, timezone)
              };
            } catch { return null; }
          }).filter(Boolean);
        }
      }
    }

    const allBlockRows = [...blocksResult.rows];
    for (const p of pauseConflicts) {
      allBlockRows.push(p);
    }

    const conflictsFn = (slotStart, slotEnd) => {
      const appointmentConflict = appointmentsResult.rows.some((item) => {
        const itemStart = new Date(item.starts_at);
        const itemEnd = new Date(item.ends_at);
        return itemStart < slotEnd && itemEnd > slotStart;
      });

      if (appointmentConflict) return true;

      return allBlockRows.some((item) => {
        const itemStart = new Date(item.starts_at);
        const itemEnd = new Date(item.ends_at);
        return itemStart < slotEnd && itemEnd > slotStart;
      });
    };

    return buildAvailabilitySlots({
      date,
      settings: effectiveSettings,
      startsAtFloor,
      durationMinutes,
      conflictsFn
    });
  }

  if (collaboratorId) {
    const collaborator = await ensureCollaborator(companyId, collaboratorId);

    return {
      company: {
        id: company.id,
        name: company.name,
        slug: company.public_booking_slug
      },
      date,
      timezone,
      service: {
        id: service.id,
        name: service.name,
        duration_minutes: durationMinutes
      },
      minimum_notice_minutes: Number(settings.minimum_notice_minutes || 0),
      online_min_advance_enabled: settings.online_min_advance_enabled === true,
      online_min_advance_value: Number(settings.online_min_advance_value || 0),
      any_collaborator: false,
      slots: (await loadCollaboratorSlots(collaboratorId)).map((slot) => ({
        ...slot,
        collaborator_id: collaborator.id,
        collaborator_name: collaborator.name
      }))
    };
  }

  const collaborators = await listBookableCollaborators(companyId);
  const mergedSlots = new Map();

  for (const collaborator of collaborators) {
    const slots = await loadCollaboratorSlots(collaborator.id);

    for (const slot of slots) {
      if (!slot.available) {
        continue;
      }

      const existing = mergedSlots.get(slot.time);
      const collaboratorSummary = {
        id: collaborator.id,
        name: collaborator.name
      };

      if (existing) {
        existing.available_collaborators.push(collaboratorSummary);
        continue;
      }

      mergedSlots.set(slot.time, {
        ...slot,
        collaborator_id: collaborator.id,
        collaborator_name: collaborator.name,
        available_collaborators: [collaboratorSummary]
      });
    }
  }

  return {
    company: {
      id: company.id,
      name: company.name,
      slug: company.public_booking_slug
    },
    date,
    timezone,
    service: {
      id: service.id,
      name: service.name,
      duration_minutes: durationMinutes
    },
    minimum_notice_minutes: Number(settings.minimum_notice_minutes || 0),
    online_min_advance_enabled: settings.online_min_advance_enabled === true,
    online_min_advance_value: Number(settings.online_min_advance_value || 0),
    any_collaborator: true,
    slots: Array.from(mergedSlots.values()).sort((first, second) => first.time.localeCompare(second.time))
  };
}

function ensureClientUser(user) {
  if (!user) {
    throw createError('Usuario nao autenticado', 401);
  }

  if (user.auth_scope !== 'booking_customer' && user.role !== 'booking_customer') {
    throw createError('Este acesso e exclusivo para clientes finais', 403);
  }

  if (!user.company_id || !(user.customer_id || user.id)) {
    throw createError('Cliente sem empresa vinculada', 403);
  }
}

async function listClientAppointments(user) {
  ensureClientUser(user);

  const result = await pool.query(
    `SELECT
       barber_appointments.id,
       barber_appointments.company_id,
       barber_appointments.customer_id,
       barber_appointments.service_id,
       barber_appointments.collaborator_id,
       barber_appointments.customer_name,
       barber_appointments.customer_phone,
       barber_appointments.customer_email,
       barber_appointments.starts_at,
       barber_appointments.ends_at,
       barber_appointments.status,
       barber_appointments.notes,
       barber_appointments.created_at,
       barber_services.name AS service_name,
       COALESCE(collaborator_users.name, barber_collaborators.nickname) AS collaborator_name,
       companies.name AS company_name,
       companies.public_booking_slug
     FROM barber_appointments
     INNER JOIN barber_services
       ON barber_services.id = barber_appointments.service_id
      AND barber_services.company_id = barber_appointments.company_id
     INNER JOIN barber_collaborators
       ON barber_collaborators.id = barber_appointments.collaborator_id
      AND barber_collaborators.company_id = barber_appointments.company_id
     LEFT JOIN users collaborator_users ON collaborator_users.id = barber_collaborators.user_id
     INNER JOIN companies ON companies.id = barber_appointments.company_id
     WHERE barber_appointments.company_id = $1
       AND barber_appointments.customer_id = $2
     ORDER BY barber_appointments.starts_at DESC NULLS LAST, barber_appointments.created_at DESC`,
    [user.company_id, user.customer_id || user.id]
  );

  return result.rows;
}

async function createClientAppointment(user, data) {
  ensureClientUser(user);

  if (!user.email_verified || user.status !== 'active') {
    throw createError('Confirme seu email antes de agendar', 403);
  }

  const companyResult = await pool.query(
    `SELECT id, name, public_booking_slug
     FROM companies
     WHERE id = $1
     LIMIT 1`,
    [user.company_id]
  );

  if (companyResult.rowCount === 0) {
    throw createError('Empresa do cliente nao encontrada', 404);
  }

  const company = companyResult.rows[0];
  const expectedSlug = String(data.companySlug || data.company_slug || company.public_booking_slug || '').trim().toLowerCase();

  if (!expectedSlug || expectedSlug !== String(company.public_booking_slug || '').trim().toLowerCase()) {
    throw createError('A empresa do agendamento nao corresponde ao cliente autenticado', 403);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const settings = await getBookingSettings(company.id, client);
    const slot = await validateBookableSlot({
      companyId: company.id,
      collaboratorId: data.collaboratorId || data.collaborator_id,
      serviceId: data.serviceId || data.service_id,
      startsAt: data.startsAt || data.starts_at,
      settings,
      client,
      user
    });

    const result = await client.query(
      `INSERT INTO barber_appointments (
         company_id,
         customer_id,
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
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9::timestamptz, 'scheduled', $10, NOW())
       RETURNING id, company_id, customer_id, service_id, collaborator_id, starts_at, ends_at, status, notes, created_at, updated_at`,
      [
        company.id,
        user.customer_id || user.id,
        data.serviceId || data.service_id,
        data.collaboratorId || data.collaborator_id,
        user.name,
        user.phone || null,
        user.email,
        slot.startsAt.toISOString(),
        slot.endsAt.toISOString(),
        String(data.notes || '').trim() || null
      ]
    );

    await writeAuthAudit('client_appointment_created', {
      email: user.email,
      details: {
        appointment_id: result.rows[0].id,
        company_id: company.id,
        booking_customer_id: user.customer_id || user.id
      }
    }, client);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function createPublicAppointment(companySlug, data = {}) {
  const company = await getCompanyBySlug(companySlug);
  const client = await pool.connect();

  const customerName = String(data.customerName || data.customer_name || '').trim();
  const customerPhone = normalizePhone(data.customerPhone || data.customer_phone || '');
  const customerEmail = normalizeEmail(data.customerEmail || data.customer_email || '') || null;
  const notes = String(data.notes || '').trim() || null;
  const serviceId = data.serviceId || data.service_id;
  const requestedCollaboratorId = data.collaboratorId || data.collaborator_id || null;
  const startsAtInput = data.startsAt || data.starts_at;

  if (!customerName) {
    throw createError('Nome do cliente e obrigatorio', 400);
  }

  if (!customerPhone) {
    throw createError('WhatsApp do cliente e obrigatorio', 400);
  }

  if (!serviceId) {
    throw createError('Servico e obrigatorio para concluir o agendamento', 400);
  }

  try {
    await client.query('BEGIN');

    const settings = await getBookingSettings(company.id, client);

    // Verificar configuração de depósito
    let depositRequired = false
    let depositAmount = 0
    const depositConfig = await walletService.getDepositConfig(company.id)
    if (depositConfig.deposit_enabled) {
      const service = await ensureService(company.id, serviceId, client)
      if (depositConfig.deposit_type === 'percentage') {
        depositAmount = Math.round((Number(service.price) * depositConfig.deposit_value / 100) * 100) / 100
      } else {
        depositAmount = Number(depositConfig.deposit_value)
      }
      depositRequired = depositAmount > 0
    }

    // Se depósito obrigatório, verificar se pagamento já foi confirmado
    if (depositRequired) {
      const depositPaymentId = data.deposit_payment_id || data.depositPaymentId
      if (!depositPaymentId) {
        throw createError(`Depósito de R$ ${depositAmount.toFixed(2)} obrigatório para este agendamento. Inicie o pagamento antes de confirmar.`, 402)
      }

      // verificar se o topup_request foi completado
      const topup = await client.query(
        `SELECT id, status, amount FROM topup_requests
         WHERE id = $1 AND company_id = $2 AND status = 'completed'
         LIMIT 1`,
        [depositPaymentId, company.id]
      )
      if (topup.rowCount === 0) {
        throw createError('Pagamento do depósito ainda não confirmado. Aguarde ou tente novamente.', 402)
      }
    }

    let resolvedCollaboratorId = requestedCollaboratorId;

    if (requestedCollaboratorId && settings.allow_customer_select_collaborator === false) {
      throw createError('A escolha direta de profissional nao esta disponivel para este link', 403);
    }

    if (!resolvedCollaboratorId) {
      if (settings.allow_any_collaborator === false) {
        throw createError('Selecione um profissional para continuar com o agendamento', 400);
      }

      const availability = await getSchedulingAvailability(companySlug, {
        serviceId,
        date: getLocalDateTimeParts(normalizeStartsAtInput(startsAtInput), settings.timezone || BRAZIL_TIMEZONE).date
      });

      const selectedSlot = availability.slots.find((slot) => slot.starts_at === normalizeStartsAtInput(startsAtInput).toISOString() && slot.available);

      if (!selectedSlot?.collaborator_id) {
        throw createError('Nao existe profissional disponivel neste horario', 409);
      }

      resolvedCollaboratorId = selectedSlot.collaborator_id;
    }

    const slot = await validateBookableSlot({
      companyId: company.id,
      collaboratorId: resolvedCollaboratorId,
      serviceId,
      startsAt: startsAtInput,
      settings,
      client
    });

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
      company.id,
      serviceId,
      resolvedCollaboratorId,
      customerName,
      customerPhone,
      customerEmail,
      slot.startsAt.toISOString(),
      slot.endsAt.toISOString(),
      'scheduled',
      notes
    ];

    // Coluna 'source' sempre existe após migration barber.sql (ADD COLUMN IF NOT EXISTS).
    insertColumns.push('source');
    insertValues.push('public_link');

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
       RETURNING id, company_id, service_id, collaborator_id, customer_name, customer_phone, customer_email, starts_at, ends_at, status, notes, source, created_at, updated_at`,
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

async function cancelClientAppointment(user, appointmentId) {
  ensureClientUser(user);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const appointmentResult = await client.query(
      `SELECT id, starts_at, status
       FROM barber_appointments
       WHERE id = $1
         AND company_id = $2
         AND customer_id = $3
       LIMIT 1
       FOR UPDATE`,
      [appointmentId, user.company_id, user.customer_id || user.id]
    );

    if (appointmentResult.rowCount === 0) {
      throw createError('Agendamento nao encontrado', 404);
    }

    const appointment = appointmentResult.rows[0];

    if (!ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status)) {
      throw createError('Apenas agendamentos futuros podem ser cancelados', 400);
    }

    const settings = await getBookingSettings(user.company_id, client);
    const minimumCancelDate = addMinutes(new Date(), Number(settings.cancellation_limit_hours || 0) * 60);

    // Verificar taxa de cancelamento
    const depositConfig = await walletService.getDepositConfig(user.company_id, client)
    let cancelFee = 0
    if (depositConfig.cancel_fee_enabled) {
      const cancelWindowCutoff = addMinutes(new Date(), -(depositConfig.cancel_fee_window_hours * 60))
      if (new Date(appointment.starts_at) <= cancelWindowCutoff) {
        cancelFee = depositConfig.cancel_fee_percentage
        // taxa registrada mas sem cobrança automática nesta versão
        // (reembolso parcial requer integração com AbacatePay refund API)
      }
    }

    if (new Date(appointment.starts_at) < minimumCancelDate) {
      throw createError('Este agendamento nao pode mais ser cancelado dentro do prazo configurado pela empresa', 400);
    }

    const result = await client.query(
      `UPDATE barber_appointments
       SET status = 'canceled',
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND customer_id = $3
       RETURNING id, status, updated_at`,
      [appointmentId, user.company_id, user.customer_id || user.id]
    );

    await writeAuthAudit('client_appointment_canceled', {
      email: user.email,
      details: {
        appointment_id: appointmentId,
        booking_customer_id: user.customer_id || user.id
      }
    }, client);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { createPublicAppointment, createClientAppointment, listClientAppointments, cancelClientAppointment };
