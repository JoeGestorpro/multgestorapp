const pool = require('../../config/database');
const {
  addMinutes, toUtcDate, buildAvailabilitySlots, getWorkingWindow,
  getTimezoneOffset, BRAZIL_TIMEZONE, formatDateKey, normalizeDateInput,
  normalizeTimeInput, getLocalDateTimeParts, weekdayFromDate,
  normalizeEmail, normalizePhone
} = require('../../shared/capabilities/booking-engine/scheduling-utils');

const ACTIVE_APPOINTMENT_STATUSES = ['scheduled', 'confirmed', 'arrived', 'in_progress'];

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
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

function getOnlineMinimumAdvanceHours(settings = {}) {
  const enabled = settings.online_min_advance_enabled === true;
  const value = Math.max(0, Number(settings.online_min_advance_value || 0));

  return enabled ? value : 0;
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

  // Load landing config with fallback to company profile
  const [landingResult, companyResult] = await Promise.all([
    pool.query(
      `SELECT
         display_name, slogan, about_text,
         whatsapp, instagram, address_display, hours_display, banner_url,
         booking_primary_color, booking_secondary_color, booking_accent_color,
         button_text, button_text_color,
         extra_info,
         differentials, gallery,
         show_hero, show_info, show_about, show_differentials, show_team, show_gallery
       FROM barber_booking_landing
       WHERE company_id = $1
       LIMIT 1`,
      [company.id]
    ),
    pool.query(
      `SELECT
         public_display_name, business_description,
         whatsapp_phone,
         logo_url, primary_color, secondary_color, accent_color, wallpaper_url,
         address_line, city, state
       FROM companies
       WHERE id = $1
       LIMIT 1`,
      [company.id]
    )
  ]);

  const c = companyResult.rowCount > 0 ? companyResult.rows[0] : {};

  let l = {};
  if (landingResult.rowCount > 0) {
    l = landingResult.rows[0];
  }

  const displayName = l.display_name || c.public_display_name || company.name;
  const aboutText = l.about_text || c.business_description || company.name;
  const whatsapp = l.whatsapp || c.whatsapp_phone || null;
  const addressParts = [c.address_line, c.city, c.state].filter(Boolean);
  const addressDisplay = l.address_display || (addressParts.length > 0 ? addressParts.join(', ') : null);
  const primaryColor = l.booking_primary_color || c.primary_color || '#a3ff12';
  const secondaryColor = l.booking_secondary_color || c.secondary_color || '#0c1017';
  const accentColor = l.booking_accent_color || c.accent_color || '#7fe11e';
  const buttonText = l.button_text || 'Agendar Horário';
  const buttonTextColor = l.button_text_color || null;
  const differentials = Array.isArray(l.differentials) ? l.differentials : [];
  const gallery = Array.isArray(l.gallery) ? l.gallery : [];
  const showHero = typeof l.show_hero === 'boolean' ? l.show_hero : true;
  const showInfo = typeof l.show_info === 'boolean' ? l.show_info : true;
  const showAbout = typeof l.show_about === 'boolean' ? l.show_about : true;
  const showDifferentials = typeof l.show_differentials === 'boolean' ? l.show_differentials : true;
  const showTeam = typeof l.show_team === 'boolean' ? l.show_team : true;
  const showGallery = typeof l.show_gallery === 'boolean' ? l.show_gallery : false;

  return {
    company: {
      id: company.id,
      name: displayName,
      slug: company.public_booking_slug,
      description: aboutText,
      logo_url: c.logo_url || null,
      banner_url: l.banner_url || c.wallpaper_url || null,
      slogan: l.slogan || null,
      display_name: displayName,
      phone: whatsapp,
      whatsapp,
      address: addressDisplay,
      instagram: l.instagram || null,
      working_hours: l.hours_display ? [{ day: l.hours_display }] : null,
      differentials,
      gallery,
      extra_info: l.extra_info || null,
      button_text: buttonText,
      show_sections: {
        hero: showHero,
        info: showInfo,
        about: showAbout,
        differentials: showDifferentials,
        team: showTeam,
        gallery: showGallery
      },
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
        button_text: buttonTextColor
      }
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

module.exports = { getPublicBookingInfo, getSchedulingAvailability, validateBookableSlot, getBookingSettings, getCompanyBySlug };
