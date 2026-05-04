const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/database');
const emailService = require('./email/email.service');

const APPOINTMENT_STATUS = ['scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'canceled', 'no_show'];
const ACTIVE_APPOINTMENT_STATUSES = ['scheduled', 'confirmed', 'arrived', 'in_progress'];
const BRAZIL_TIMEZONE = 'America/Cuiaba';
const TIMEZONE_OFFSETS = {
  'America/Cuiaba': '-04:00',
  'America/Sao_Paulo': '-03:00'
};

function logFlowStep(flow, step, details = {}) {
  console.log(`[client-booking:${flow}] ${step}`, details);
}

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

async function columnExists(tableName, columnName, client = pool) {
  const result = await client.query(
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

async function getCompanyBySlug(companySlug, client = pool) {
  const slug = String(companySlug || '').trim().toLowerCase();

  if (!slug) {
    throw createError('Empresa de agendamento invalida', 400);
  }

  const result = await client.query(
    `SELECT companies.id, companies.name, companies.public_booking_slug
     FROM companies
     INNER JOIN company_modules ON company_modules.company_id = companies.id
     INNER JOIN modules ON modules.id = company_modules.module_id
     WHERE companies.public_booking_slug = $1
       AND COALESCE(companies.is_deleted, false) = false
       AND company_modules.status = 'active'
       AND modules.slug = 'barber'
       AND modules.is_active = true
     LIMIT 1`,
    [slug]
  );

  if (result.rowCount === 0) {
    throw createError('Empresa não encontrada', 404);
  }

  return result.rows[0];
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

function getOnlineMinimumAdvanceHours(settings = {}) {
  const enabled = settings.online_min_advance_enabled === true;
  const value = Math.max(0, Number(settings.online_min_advance_value || 0));

  return enabled ? value : 0;
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

async function getConflicts(companyId, collaboratorId, startsAt, endsAt, client = pool, appointmentIdToIgnore = null) {
  const appointmentsResult = await client.query(
    `SELECT id
     FROM barber_appointments
     WHERE company_id = $1
       AND collaborator_id = $2
       AND status = ANY($3::text[])
       AND starts_at < $5::timestamptz
       AND ends_at > $4::timestamptz
       ${appointmentIdToIgnore ? 'AND id <> $6' : ''}`,
    appointmentIdToIgnore
      ? [companyId, collaboratorId, ACTIVE_APPOINTMENT_STATUSES, startsAt.toISOString(), endsAt.toISOString(), appointmentIdToIgnore]
      : [companyId, collaboratorId, ACTIVE_APPOINTMENT_STATUSES, startsAt.toISOString(), endsAt.toISOString()]
  );

  const blocksResult = await client.query(
     `SELECT id
      FROM barber_booking_blocks
      WHERE company_id = $1
        AND (collaborator_id IS NULL OR collaborator_id = $2)
        AND starts_at < $4::timestamptz
        AND ends_at > $3::timestamptz`,
    [companyId, collaboratorId, startsAt.toISOString(), endsAt.toISOString()]
  );

  return {
    hasAppointmentConflict: appointmentsResult.rowCount > 0,
    hasBlockConflict: blocksResult.rowCount > 0
  };
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

async function validateBookableSlot({ companyId, collaboratorId, serviceId, date, time, startsAt: startsAtInput, settings, client, appointmentIdToIgnore = null, user = null }) {
  const timezone = settings.timezone || BRAZIL_TIMEZONE;
  const service = await ensureService(companyId, serviceId, client);
  await ensureCollaborator(companyId, collaboratorId, client);

  const durationMinutes = Number(service.estimated_time_minutes || 30);
  const startsAt = startsAtInput
    ? normalizeStartsAtInput(startsAtInput)
    : toUtcDate(normalizeDateInput(date), normalizeTimeInput(time), timezone);
  const endsAt = addMinutes(startsAt, durationMinutes);
  const { date: normalizedDate, time: normalizedTime } = getLocalDateTimeParts(startsAt, timezone);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw createError('Nao foi possivel interpretar a data e o horario do agendamento', 400);
  }

  const workingWindow = getWorkingWindow(normalizedDate, settings);

  if (!workingWindow) {
    throw createError('A empresa nao atende neste dia da semana', 400);
  }

  const ignoresMinimumNotice = ['admin', 'owner'].includes(String(user?.role || '').trim().toLowerCase());
  const minimumAdvanceHours = getOnlineMinimumAdvanceHours(settings);

  if (!ignoresMinimumNotice && minimumAdvanceHours > 0 && startsAt < addMinutes(new Date(), minimumAdvanceHours * 60)) {
    throw createError(
      `Este horario nao esta disponivel para agendamento online. Escolha um horario com pelo menos ${minimumAdvanceHours} horas de antecedencia.`,
      400
    );
  }

  if (startsAt < workingWindow.start || endsAt > workingWindow.end) {
    throw createError('O horario escolhido esta fora do horario de funcionamento', 400);
  }

  const conflicts = await getConflicts(companyId, collaboratorId, startsAt, endsAt, client, appointmentIdToIgnore);

  if (conflicts.hasAppointmentConflict) {
    throw createError('Ja existe um agendamento neste horario para o profissional selecionado', 409);
  }

  if (conflicts.hasBlockConflict) {
    throw createError('O horario escolhido esta bloqueado pela empresa', 409);
  }

  return {
    service,
    startsAt,
    endsAt,
    startDateKey: normalizedDate,
    startTimeLabel: normalizedTime
  };
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

async function getPublicBookingInfo(companySlug) {
  const company = await getCompanyBySlug(companySlug);
  const settings = await getBookingSettings(company.id);

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

  const collaborators = await listBookableCollaborators(company.id);

  return {
    company: {
      id: company.id,
      name: company.name,
      slug: company.public_booking_slug
    },
    services: servicesResult.rows,
    collaborators,
    settings: {
      timezone: settings.timezone || BRAZIL_TIMEZONE,
      slot_interval_minutes: Number(settings.slot_interval_minutes || 30),
      minimum_notice_minutes: Number(settings.minimum_notice_minutes || 0),
      online_min_advance_enabled: settings.online_min_advance_enabled === true,
      online_min_advance_value: Number(settings.online_min_advance_value || 0),
      cancellation_limit_hours: Number(settings.cancellation_limit_hours || 0),
      allow_customer_select_collaborator: settings.allow_customer_select_collaborator !== false,
      allow_any_collaborator: settings.allow_any_collaborator !== false,
      confirmation_message: String(settings.confirmation_message || '').trim() || null
    }
  };
}

function validateEmailConfiguration() {
  const resendApiKeyExists = Boolean(String(process.env.RESEND_API_KEY || '').trim());
  const emailFromAddress = String(process.env.EMAIL_FROM || '').trim();
  const emailFromName = String(process.env.EMAIL_NAME || 'MultGestor').trim();
  const emailFrom = emailFromAddress ? `${emailFromName} <${emailFromAddress}>` : '';
  const emailFromIsValid = /^.+<[^<>@\s]+@[^<>@\s]+>$/.test(emailFrom) || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailFrom);

  return {
    resendApiKeyExists,
    emailFrom,
    emailFromIsValid,
    appUrlExists: Boolean(
      String(process.env.APP_BASE_URL || process.env.FRONTEND_URL || process.env.APP_URL || '').trim()
    ),
    apiUrlExists: Boolean(String(process.env.API_URL || '').trim())
  };
}

async function createVerificationToken({ customer, company, client = pool }) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresInHours = Math.max(Number(process.env.EMAIL_VERIFICATION_TOKEN_HOURS || 24), 1);

  await client.query(
    `UPDATE email_verification_tokens
     SET used_at = COALESCE(used_at, NOW())
     WHERE booking_customer_id = $1
       AND used_at IS NULL`,
    [customer.id]
  );

  const tokenResult = await client.query(
    `INSERT INTO email_verification_tokens (booking_customer_id, company_id, token_hash, expires_at)
     VALUES ($1, $2, $3, NOW() + ($4 * INTERVAL '1 hour'))
     RETURNING id, expires_at`,
    [customer.id, company.id, tokenHash, expiresInHours]
  );

  return {
    tokenId: tokenResult.rows[0].id,
    expiresAt: tokenResult.rows[0].expires_at,
    rawToken
  };
}

async function dispatchVerificationEmail({ customer, tokenId, rawToken, expiresAt, client = pool }) {
  const emailResult = await emailService.sendClientEmailVerificationEmail({
    to: customer.email,
    name: customer.name,
    token: rawToken,
    expiresAt
  });

  await writeAuthAudit('client_email_verification_sent', {
    email: customer.email,
    details: {
      booking_customer_id: customer.id,
      token_id: tokenId,
      token_preview: maskTokenPreview(rawToken),
      provider: emailResult.provider,
      message_id: emailResult.messageId
    }
  }, client);

  return emailResult;
}

async function preRegisterClient(companySlug, data, meta = {}) {
  logFlowStep('pre-register', 'request_received', {
    companySlug: String(companySlug || '').trim(),
    email: maskEmailPreview(data.email)
  });

  const name = String(data.name || '').trim();
  const phone = normalizePhone(data.phone);
  const email = normalizeEmail(data.email);
  const password = String(data.password || '');
  const confirmPassword = String(data.confirmPassword || data.confirm_password || '');

  if (!name || !phone || !email || !password || !confirmPassword) {
    throw createError('Nome, telefone, email, senha e confirmacao de senha sao obrigatorios', 400);
  }

  if (password.length < 6) {
    throw createError('A senha deve ter pelo menos 6 caracteres', 400);
  }

  if (password !== confirmPassword) {
    throw createError('As senhas nao conferem', 400);
  }

  logFlowStep('pre-register', 'payload_validated', {
    hasName: Boolean(name),
    hasPhone: Boolean(phone),
    email: maskEmailPreview(email)
  });

  const client = await pool.connect();
  let verificationEmailJob = null;
  let responsePayload = null;

  try {
    await client.query('BEGIN');

    const company = await getCompanyBySlug(companySlug, client);
    logFlowStep('pre-register', 'company_resolved', {
      companySlug: company.public_booking_slug,
      companyId: company.id
    });

    const existingCustomerResult = await client.query(
      `SELECT id, company_id, email_verified, status
       FROM booking_customers
       WHERE company_id = $1
         AND lower(email) = $2
       LIMIT 1`,
      [company.id, email]
    );

    const conflictingAdminResult = await client.query(
      `SELECT id
       FROM users
       WHERE company_id = $1
         AND lower(email) = $2
       LIMIT 1`,
      [company.id, email]
    );

    const passwordHash = await bcrypt.hash(password, 10);

    if (conflictingAdminResult.rowCount > 0) {
      throw createError('Este email ja pertence a um usuario administrativo desta empresa. Faca login com a conta existente.', 409);
    }

    if (existingCustomerResult.rowCount > 0) {
      const existingCustomer = existingCustomerResult.rows[0];
      logFlowStep('pre-register', 'existing_user_found', {
        customerId: existingCustomer.id,
        companyMatches: String(existingCustomer.company_id) === String(company.id),
        emailVerified: existingCustomer.email_verified,
        status: existingCustomer.status
      });


      if (existingCustomer.email_verified && existingCustomer.status === 'active') {
        throw createError('E-mail já cadastrado. Faça login.', 409);
      }

      await client.query(
        `UPDATE booking_customers
         SET name = $1,
             phone = $2,
             password_hash = $3,
             email_verified = false,
             status = 'pending',
             source = 'agendamento_online',
             updated_at = NOW()
         WHERE id = $4
           AND company_id = $5`,
        [name, phone, passwordHash, existingCustomer.id, company.id]
      );
      logFlowStep('pre-register', 'pending_user_updated', {
        customerId: existingCustomer.id
      });

      verificationEmailJob = await createVerificationToken({
        customer: {
          id: existingCustomer.id,
          name,
          email
        },
        company,
        client
      });
      logFlowStep('pre-register', 'verification_token_created', {
        customerId: existingCustomer.id,
        tokenId: verificationEmailJob.tokenId,
        tokenPreview: maskTokenPreview(verificationEmailJob.rawToken)
      });

      await client.query('COMMIT');
      logFlowStep('pre-register', 'transaction_committed', {
        customerId: existingCustomer.id
      });

      responsePayload = {
        alreadyExisted: true,
        message: 'Cadastro já iniciado. Reenviamos a confirmação.',
        customer: {
          id: existingCustomer.id,
          name,
          email
        },
        token: verificationEmailJob
      };
    } else {
      const userResult = await client.query(
        `INSERT INTO booking_customers (
           company_id,
           name,
           phone,
           email,
           password_hash,
           email_verified,
           status,
           source,
           updated_at
         )
         VALUES ($1, $2, $3, $4, $5, false, 'pending', 'agendamento_online', NOW())
         RETURNING id, name, email`,
        [company.id, name, phone, email, passwordHash]
      );
      logFlowStep('pre-register', 'client_user_created', {
        customerId: userResult.rows[0].id,
        companyId: company.id
      });

      verificationEmailJob = await createVerificationToken({
        customer: userResult.rows[0],
        company,
        client
      });
      logFlowStep('pre-register', 'verification_token_created', {
        customerId: userResult.rows[0].id,
        tokenId: verificationEmailJob.tokenId,
        tokenPreview: maskTokenPreview(verificationEmailJob.rawToken)
      });

      await writeAuthAudit('client_pre_registered', {
        email,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        details: {
          company_id: company.id,
          booking_customer_id: userResult.rows[0].id
        }
      }, client);

      await client.query('COMMIT');
      logFlowStep('pre-register', 'transaction_committed', {
        customerId: userResult.rows[0].id
      });

      responsePayload = {
        message: 'Cadastro iniciado. Verifique seu e-mail.',
        customer: userResult.rows[0],
        token: verificationEmailJob
      };
    }
  } catch (error) {
    await client.query('ROLLBACK');
    logFlowStep('pre-register', 'transaction_rolled_back', {
      error: error.message,
      statusCode: error.statusCode || 500
    });
    throw error;
  } finally {
    client.release();
  }

  const emailConfig = validateEmailConfiguration();
  logFlowStep('pre-register', 'email_configuration_checked', {
    resendConfigured: emailConfig.resendApiKeyExists,
    emailFromConfigured: Boolean(emailConfig.emailFrom),
    emailFromIsValid: emailConfig.emailFromIsValid,
    appUrlConfigured: emailConfig.appUrlExists,
    apiUrlConfigured: emailConfig.apiUrlExists
  });

  let emailSent = false;
  let emailError = null;

  try {
    logFlowStep('pre-register', 'sending_confirmation_email', {
      customerId: responsePayload.customer.id,
      tokenId: responsePayload.token.tokenId
    });
    await dispatchVerificationEmail({
      customer: responsePayload.customer,
      tokenId: responsePayload.token.tokenId,
      rawToken: responsePayload.token.rawToken,
      expiresAt: responsePayload.token.expiresAt
    });
    logFlowStep('pre-register', 'confirmation_email_sent', {
      customerId: responsePayload.customer.id,
      tokenId: responsePayload.token.tokenId
    });
    emailSent = true;
  } catch (error) {
    emailSent = false;
    emailError = error.message || 'Erro ao enviar e-mail de confirmação';

    console.error('[client-booking:pre-register] confirmation_email_failed', {
      customerId: responsePayload.customer.id,
      tokenId: responsePayload.token.tokenId,
      emailError,
      provider: 'resend'
    });
  }

  return {
    success: true,
    alreadyExisted: responsePayload.alreadyExisted || false,
    emailSent,
    message: emailSent
      ? responsePayload.message
      : 'Cadastro iniciado, mas não conseguimos enviar o e-mail de confirmação. Use reenviar confirmação.'
  };
}

async function resendClientConfirmation(data, meta = {}) {
  const email = normalizeEmail(data.email);
  const companySlug = String(data.companySlug || data.company_slug || '').trim().toLowerCase();

  if (!email || !companySlug) {
    throw createError('Email e companySlug sao obrigatorios', 400);
  }

  const client = await pool.connect();
  let emailJob = null;
  let user = null;
  let company = null;

  try {
    await client.query('BEGIN');

    logFlowStep('resend-confirmation', 'request_received', {
      companySlug,
      email: maskEmailPreview(email)
    });

    company = await getCompanyBySlug(companySlug, client);
    logFlowStep('resend-confirmation', 'company_resolved', {
      companyId: company.id
    });
    const userResult = await client.query(
      `SELECT id, name, email, company_id, email_verified, status
       FROM booking_customers
       WHERE company_id = $1
         AND lower(email) = $2
       LIMIT 1`,
      [company.id, email]
    );

    if (userResult.rowCount === 0) {
      throw createError('Nao encontramos um pre-cadastro pendente para este email', 404);
    }

    user = userResult.rows[0];

    if (user.email_verified && user.status === 'active') {
      throw createError('Este email ja foi confirmado. Faca login para continuar.', 409);
    }

    emailJob = await createVerificationToken({ customer: user, company, client });
    logFlowStep('resend-confirmation', 'verification_token_created', {
      customerId: user.id,
      tokenId: emailJob.tokenId,
      tokenPreview: maskTokenPreview(emailJob.rawToken)
    });

    await writeAuthAudit('client_email_verification_resent', {
      email,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        company_id: company.id,
        booking_customer_id: user.id
      }
    }, client);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  let emailSent = false;
  let emailError = null;

  try {
    logFlowStep('resend-confirmation', 'sending_confirmation_email', {
      customerId: user.id,
      tokenId: emailJob.tokenId
    });
    await dispatchVerificationEmail({
      customer: user,
      tokenId: emailJob.tokenId,
      rawToken: emailJob.rawToken,
      expiresAt: emailJob.expiresAt
    });
    logFlowStep('resend-confirmation', 'confirmation_email_sent', {
      customerId: user.id,
      tokenId: emailJob.tokenId
    });
    emailSent = true;
  } catch (error) {
    emailSent = false;
    emailError = error.message || 'Erro ao enviar e-mail de confirmação';

    console.error('[client-booking:resend-confirmation] confirmation_email_failed', {
      customerId: user.id,
      tokenId: emailJob.tokenId,
      emailError,
      provider: 'resend'
    });
  }

  return {
    success: true,
    emailSent,
    message: emailSent
      ? 'Cadastro já iniciado. Reenviamos a confirmação.'
      : 'Não conseguimos enviar o e-mail de confirmação. Tente novamente em instantes.'
  };
}

async function confirmClientEmail(token, meta = {}) {
  const rawToken = String(token || '').trim();

  if (!rawToken) {
    throw createError('Token de confirmacao obrigatorio', 400);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    logFlowStep('confirm-email', 'request_received', {
      tokenPreview: maskTokenPreview(rawToken)
    });

    const tokenResult = await client.query(
      `SELECT
         email_verification_tokens.id,
         email_verification_tokens.booking_customer_id,
         email_verification_tokens.company_id,
         email_verification_tokens.expires_at,
         email_verification_tokens.used_at,
         booking_customers.name,
         booking_customers.email,
         companies.public_booking_slug
       FROM email_verification_tokens
       INNER JOIN booking_customers
         ON booking_customers.id = email_verification_tokens.booking_customer_id
        AND booking_customers.company_id = email_verification_tokens.company_id
       INNER JOIN companies ON companies.id = email_verification_tokens.company_id
       WHERE email_verification_tokens.token_hash = $1
       LIMIT 1
       FOR UPDATE`,
      [hashToken(rawToken)]
    );

    if (tokenResult.rowCount === 0) {
      throw createError('Token de confirmacao invalido', 404);
    }

    const verification = tokenResult.rows[0];
    logFlowStep('confirm-email', 'token_resolved', {
      tokenId: verification.id,
      customerId: verification.booking_customer_id,
      tokenAlreadyUsed: Boolean(verification.used_at)
    });

    if (verification.used_at) {
      throw createError('Este token ja foi utilizado', 410);
    }

    if (new Date(verification.expires_at) <= new Date()) {
      throw createError('Este token expirou', 410);
    }

    await client.query(
      `UPDATE email_verification_tokens
       SET used_at = NOW()
       WHERE id = $1`,
      [verification.id]
    );

    await client.query(
      `UPDATE booking_customers
       SET email_verified = true,
           status = 'active',
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2`,
      [verification.booking_customer_id, verification.company_id]
    );

    await writeAuthAudit('client_email_confirmed', {
      email: verification.email,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        booking_customer_id: verification.booking_customer_id,
        token_id: verification.id,
        token_preview: maskTokenPreview(rawToken)
      }
    }, client);

    await client.query('COMMIT');

    const bookingUrl = `/agendar/${verification.public_booking_slug}`;

    return {
      message: 'Email confirmado com sucesso.',
      booking_url: bookingUrl,
      login_url: `/agendar/${verification.public_booking_slug}/login?redirect=${encodeURIComponent(bookingUrl)}`
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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

    const conflictsFn = (slotStart, slotEnd) => {
      const appointmentConflict = appointmentsResult.rows.some((item) => {
        const itemStart = new Date(item.starts_at);
        const itemEnd = new Date(item.ends_at);
        return itemStart < slotEnd && itemEnd > slotStart;
      });

      if (appointmentConflict) {
        return true;
      }

      return blocksResult.rows.some((item) => {
        const itemStart = new Date(item.starts_at);
        const itemEnd = new Date(item.ends_at);
        return itemStart < slotEnd && itemEnd > slotStart;
      });
    };

    return buildAvailabilitySlots({
      date,
      settings,
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
    const hasAppointmentSource = await columnExists('barber_appointments', 'source', client);

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

    if (hasAppointmentSource) {
      insertColumns.push('source');
      insertValues.push('public_link');
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
       RETURNING id, company_id, service_id, collaborator_id, customer_name, customer_phone, customer_email, starts_at, ends_at, status, notes, ${hasAppointmentSource ? 'source' : `'public_link'::text AS source`}, created_at, updated_at`,
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

module.exports = {
  preRegisterClient,
  resendClientConfirmation,
  confirmClientEmail,
  getBookingSettings,
  validateBookableSlot,
  getPublicBookingInfo,
  getSchedulingAvailability,
  createPublicAppointment,
  listClientAppointments,
  createClientAppointment,
  cancelClientAppointment
};
