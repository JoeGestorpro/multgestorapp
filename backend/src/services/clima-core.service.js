'use strict';

const pool = require('../config/database');
const { AppError } = require('../shared/core/errors');
const {
  APPOINTMENT_STATUS,
  ACTIVE_APPOINTMENT_STATUSES,
  addMinutes,
  buildAvailabilitySlots,
  normalizeDateInput
} = require('../shared/capabilities/booking-engine/scheduling-utils');

class ClimaGestor {
  constructor(deps = {}) {
    this.pool = deps.pool || pool;
  }

  // ─── Profissionais ────────────────────────────────────────────────────────

  async listProfessionals(companyId) {
    if (!companyId) throw new AppError('company_id obrigatorio', 403, 'FORBIDDEN');
    const result = await this.pool.query(
      `SELECT id, name, role, specialties, working_hours, is_active, created_at
       FROM clima_professionals WHERE company_id = $1 ORDER BY name ASC`,
      [companyId]
    );
    return result.rows;
  }

  async createProfessional(companyId, data) {
    if (!companyId) throw new AppError('company_id obrigatorio', 403, 'FORBIDDEN');
    const name = String(data.name || '').trim();
    if (!name) throw new AppError('Nome e obrigatorio', 400, 'VALIDATION_ERROR');
    const result = await this.pool.query(
      `INSERT INTO clima_professionals (company_id, name, role, specialties, working_hours)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, role, specialties, working_hours, is_active, created_at`,
      [companyId, name, data.role || 'professional', data.specialties || [],
       data.working_hours ? JSON.stringify(data.working_hours) : undefined]
    );
    return result.rows[0];
  }

  // ─── Servicos/Procedimentos ───────────────────────────────────────────────

  async listServices(companyId) {
    if (!companyId) throw new AppError('company_id obrigatorio', 403, 'FORBIDDEN');
    const result = await this.pool.query(
      `SELECT id, name, price, duration_minutes, category, is_active, created_at
       FROM clima_services WHERE company_id = $1 ORDER BY name ASC`,
      [companyId]
    );
    return result.rows;
  }

  async createService(companyId, data) {
    if (!companyId) throw new AppError('company_id obrigatorio', 403, 'FORBIDDEN');
    const name = String(data.name || '').trim();
    if (!name) throw new AppError('Nome e obrigatorio', 400, 'VALIDATION_ERROR');
    const price = Number(data.price || 0);
    const durationMinutes = Number(data.duration_minutes || 60);
    const result = await this.pool.query(
      `INSERT INTO clima_services (company_id, name, price, duration_minutes, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, price, duration_minutes, category, is_active, created_at`,
      [companyId, name, price, durationMinutes, data.category || null]
    );
    return result.rows[0];
  }

  // ─── Disponibilidade ──────────────────────────────────────────────────────

  /**
   * Retorna slots disponiveis para um profissional em uma data.
   * Usa buildAvailabilitySlots da booking-engine capability.
   */
  async getAvailability(companyId, { professional_id, date, service_id }) {
    if (!companyId) throw new AppError('company_id obrigatorio', 403, 'FORBIDDEN');
    if (!professional_id) throw new AppError('professional_id obrigatorio', 400, 'VALIDATION_ERROR');

    const dateStr = normalizeDateInput(date); // valida formato YYYY-MM-DD

    // Buscar profissional + working_hours
    const profResult = await this.pool.query(
      `SELECT id, name, working_hours FROM clima_professionals
       WHERE id = $1 AND company_id = $2 AND is_active = true`,
      [professional_id, companyId]
    );
    if (!profResult.rows.length) throw new AppError('Profissional nao encontrado', 404, 'NOT_FOUND');
    const professional = profResult.rows[0];

    // Duracao do slot: pegar do servico (se informado) ou default 60min
    let durationMinutes = 60;
    if (service_id) {
      const svcResult = await this.pool.query(
        `SELECT duration_minutes FROM clima_services WHERE id = $1 AND company_id = $2`,
        [service_id, companyId]
      );
      if (svcResult.rows.length) durationMinutes = svcResult.rows[0].duration_minutes;
    }

    // Buscar agendamentos existentes do profissional nesta data
    const apptResult = await this.pool.query(
      `SELECT start_at, end_at FROM clima_appointments
       WHERE professional_id = $1
         AND status = ANY($2)
         AND start_at >= $3::date
         AND start_at <  ($3::date + interval '1 day')`,
      [professional_id, ACTIVE_APPOINTMENT_STATUSES, dateStr]
    );
    const existingAppointments = apptResult.rows;

    // conflictsFn: slot [slotStart, slotEnd) conflita com qualquer agendamento existente?
    const conflictsFn = (slotStart, slotEnd) =>
      existingAppointments.some(apt => {
        const aptStart = new Date(apt.start_at);
        const aptEnd   = new Date(apt.end_at);
        return aptStart < slotEnd && aptEnd > slotStart;
      });

    return buildAvailabilitySlots({
      date: dateStr,
      settings: professional.working_hours,
      startsAtFloor: new Date(), // bloqueia slots no passado
      durationMinutes,
      conflictsFn,
    });
  }

  // ─── Agendamentos ─────────────────────────────────────────────────────────

  async createAppointment(companyId, data) {
    if (!companyId) throw new AppError('company_id obrigatorio', 403, 'FORBIDDEN');

    const { professional_id, service_id, client_name, start_at, client_phone, client_email, notes } = data;

    if (!professional_id) throw new AppError('professional_id obrigatorio', 400, 'VALIDATION_ERROR');
    if (!service_id)      throw new AppError('service_id obrigatorio', 400, 'VALIDATION_ERROR');
    if (!client_name?.trim()) throw new AppError('client_name obrigatorio', 400, 'VALIDATION_ERROR');
    if (!start_at)        throw new AppError('start_at obrigatorio', 400, 'VALIDATION_ERROR');

    const startDate = new Date(start_at);
    if (isNaN(startDate.getTime())) throw new AppError('start_at invalido', 400, 'VALIDATION_ERROR');
    if (startDate <= new Date()) throw new AppError('Horario deve ser no futuro', 400, 'VALIDATION_ERROR');

    // Buscar duracao do servico
    const svcResult = await this.pool.query(
      `SELECT duration_minutes FROM clima_services WHERE id = $1 AND company_id = $2 AND is_active = true`,
      [service_id, companyId]
    );
    if (!svcResult.rows.length) throw new AppError('Servico nao encontrado', 404, 'NOT_FOUND');
    const durationMinutes = svcResult.rows[0].duration_minutes;
    const endDate = addMinutes(startDate, durationMinutes);

    // Verificar conflito de horario
    const conflictResult = await this.pool.query(
      `SELECT id FROM clima_appointments
       WHERE professional_id = $1
         AND status = ANY($2)
         AND start_at < $3
         AND end_at   > $4
       LIMIT 1`,
      [professional_id, ACTIVE_APPOINTMENT_STATUSES, endDate.toISOString(), startDate.toISOString()]
    );
    if (conflictResult.rows.length) throw new AppError('Horario indisponivel — conflito com agendamento existente', 409, 'CONFLICT');

    const result = await this.pool.query(
      `INSERT INTO clima_appointments
         (company_id, professional_id, service_id, client_name, client_phone, client_email, start_at, end_at, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [companyId, professional_id, service_id, client_name.trim(),
       client_phone || null, client_email || null,
       startDate.toISOString(), endDate.toISOString(), notes || null]
    );
    return result.rows[0];
  }

  async listAppointments(companyId, filters = {}) {
    if (!companyId) throw new AppError('company_id obrigatorio', 403, 'FORBIDDEN');

    const conditions = ['a.company_id = $1'];
    const params = [companyId];
    let idx = 2;

    if (filters.professional_id) {
      conditions.push(`a.professional_id = $${idx++}`);
      params.push(filters.professional_id);
    }
    if (filters.status) {
      conditions.push(`a.status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.date) {
      conditions.push(`a.start_at >= $${idx}::date AND a.start_at < ($${idx}::date + interval '1 day')`);
      params.push(filters.date);
      idx++;
    }

    const where = conditions.join(' AND ');
    const result = await this.pool.query(
      `SELECT a.*, p.name AS professional_name, s.name AS service_name
       FROM clima_appointments a
       JOIN clima_professionals p ON p.id = a.professional_id
       JOIN clima_services      s ON s.id = a.service_id
       WHERE ${where}
       ORDER BY a.start_at ASC
       LIMIT 100`,
      params
    );
    return result.rows;
  }

  async getAppointment(companyId, appointmentId) {
    if (!companyId) throw new AppError('company_id obrigatorio', 403, 'FORBIDDEN');
    const result = await this.pool.query(
      `SELECT a.*, p.name AS professional_name, s.name AS service_name, s.duration_minutes
       FROM clima_appointments a
       JOIN clima_professionals p ON p.id = a.professional_id
       JOIN clima_services      s ON s.id = a.service_id
       WHERE a.id = $1 AND a.company_id = $2`,
      [appointmentId, companyId]
    );
    if (!result.rows.length) throw new AppError('Agendamento nao encontrado', 404, 'NOT_FOUND');
    return result.rows[0];
  }

  async cancelAppointment(companyId, appointmentId) {
    if (!companyId) throw new AppError('company_id obrigatorio', 403, 'FORBIDDEN');
    const result = await this.pool.query(
      `UPDATE clima_appointments
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND company_id = $2
         AND status = ANY($3)
       RETURNING *`,
      [appointmentId, companyId, ACTIVE_APPOINTMENT_STATUSES]
    );
    if (!result.rows.length) throw new AppError('Agendamento nao encontrado ou ja cancelado', 404, 'NOT_FOUND');
    return result.rows[0];
  }

  // ─── Utilitarios da capability ────────────────────────────────────────────

  getAvailableSlots({ date, workingHours, durationMinutes, existingAppointments }) {
    const conflicts = new Set(existingAppointments.map(a => a.starts_at));
    return buildAvailabilitySlots({
      date,
      settings: workingHours,
      startsAtFloor: workingHours.start_time || '08:00',
      durationMinutes: durationMinutes || 60,
      conflictsFn: (slotStart) => conflicts.has(slotStart.toISOString())
    });
  }

  getAppointmentStatuses() { return APPOINTMENT_STATUS; }
  addMinutesToDate(date, minutes) { return addMinutes(date, minutes); }
}

module.exports = ClimaGestor;
