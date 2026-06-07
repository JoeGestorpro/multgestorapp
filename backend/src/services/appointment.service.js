const crypto = require('crypto')
const AppointmentRepository = require('../repositories/appointment.repository')
const { ValidationError, NotFoundError, ForbiddenError, eventBus, createUnitOfWork } = require('../shared')
const { normalizeEmail } = require('../utils/validators')
const { APPOINTMENT_STATUS } = require('../shared/capabilities/booking-engine/scheduling-utils')
const AppointmentEvents = require('../shared/core/events/factories/appointment-events')

function ensureCompany(companyId) {
  if (!companyId) {
    throw new ForbiddenError('Usuario sem empresa vinculada')
  }
}

function ensureAdminOrCashManager(user, message) {
  const allowedRoles = ['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin', 'collaborator']
  if (!allowedRoles.includes(user?.role)) {
    throw new ForbiddenError(message || 'Apenas usuarios autorizados podem acessar agendamentos')
  }
}

function ensureAdmin(user, message) {
  if (!['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin'].includes(user?.role)) {
    throw new ForbiddenError(message || 'Apenas admin pode acessar agendamentos')
  }
}

function normalizeAppointmentPayload(data = {}) {
  const startsAtValue = String(data.starts_at || data.startsAt || '').trim()
  const startsAt = startsAtValue ? new Date(startsAtValue) : null

  return {
    serviceId: data.service_id || data.serviceId || null,
    collaboratorId: data.collaborator_id || data.collaboratorId || null,
    customerId: data.customer_id || data.customerId || null,
    customerName: String(data.customer_name || data.customerName || '').trim(),
    customerPhone: String(data.customer_phone || data.customerPhone || '').trim(),
    customerEmail: normalizeEmail(data.customer_email || data.customerEmail) || null,
    startsAt,
    status: String(data.status || 'scheduled').trim().toLowerCase() || 'scheduled',
    notes: String(data.notes || '').trim() || null,
    source: String(data.source || 'admin_manual').trim() || 'admin_manual'
  }
}

function validateAppointmentPayload(payload, options = {}) {
  if (!payload.serviceId) {
    throw new ValidationError('Servico e obrigatorio para o agendamento')
  }

  if (!payload.collaboratorId) {
    throw new ValidationError('Profissional e obrigatorio para o agendamento')
  }

  if (!payload.customerName) {
    throw new ValidationError('Nome do cliente e obrigatorio')
  }

  if (!payload.customerPhone) {
    throw new ValidationError('Telefone do cliente e obrigatorio')
  }

  if (!(payload.startsAt instanceof Date) || Number.isNaN(payload.startsAt.getTime())) {
    throw new ValidationError('Data e horario do agendamento sao obrigatorios')
  }

  if (!options.allowCustomStatus && payload.status !== 'scheduled') {
    throw new ValidationError('Status inicial de agendamento invalido')
  }

  if (options.allowCustomStatus && !APPOINTMENT_STATUS.includes(payload.status)) {
    throw new ValidationError('Status do agendamento invalido')
  }
}

class AppointmentService {
  constructor(repository, bookingService = null) {
    this.repository = repository
    this.bookingService = bookingService
  }

  async list(companyId, user, query = {}) {
    ensureCompany(companyId)
    ensureAdminOrCashManager(user, 'Apenas usuarios autorizados podem acessar agendamentos')

    const filters = {}

    if (query.collaboratorId || query.collaborator_id) {
      filters.collaboratorId = query.collaboratorId || query.collaborator_id
    }

    if (query.customerId || query.customer_id) {
      filters.customerId = query.customerId || query.customer_id
    }

    if (query.date) {
      filters.date = query.date
      filters.timezone = query.timezone || 'America/Cuiaba'
    }

    const statusFilter = String(query.status || 'all').trim().toLowerCase()
    if (statusFilter !== 'all') {
      if (!APPOINTMENT_STATUS.includes(statusFilter)) {
        throw new ValidationError('Filtro de status invalido')
      }
      filters.status = statusFilter
    }

    const appointments = await this.repository.findAll(companyId, filters)
    const counts = await this.repository.countByStatus(companyId)

    return {
      summary: {
        appointments_today: counts.total || 0,
        upcoming_slots: (counts.scheduled || 0) + (counts.confirmed || 0),
        canceled_appointments: counts.canceled || 0,
        total: counts.total || 0
      },
      appointments
    }
  }

  async getById(companyId, appointmentId) {
    ensureCompany(companyId)

    const appointment = await this.repository.findById(companyId, appointmentId)

    if (!appointment) {
      throw new NotFoundError('Agendamento')
    }

    return appointment
  }

  async create(companyId, user, data) {
    ensureCompany(companyId)
    ensureAdminOrCashManager(user, 'Apenas usuarios autorizados podem criar agendamentos')

    const payload = normalizeAppointmentPayload(data)
    validateAppointmentPayload(payload)

    const uow = createUnitOfWork()

    try {
      await uow.begin()

      const repo = uow.repository(AppointmentRepository)

      const conflicts = await repo.findConflicts(
        companyId,
        payload.collaboratorId,
        payload.startsAt,
        new Date(payload.startsAt.getTime() + 30 * 60 * 1000)
      )

      if (conflicts.length > 0) {
        throw new ValidationError('Horario ja ocupado para este profissional')
      }

      const appointment = await repo.create(companyId, {
        ...payload,
        endsAt: new Date(payload.startsAt.getTime() + 30 * 60 * 1000)
      })

      const createdEvt = AppointmentEvents.created({
        appointment_id: appointment.id,
        company_id: companyId,
        collaborator_id: appointment.collaborator_id,
        service_id: appointment.service_id,
        customer_name: appointment.customer_name,
        customer_phone: appointment.customer_phone,
        starts_at: appointment.starts_at,
        ends_at: appointment.ends_at,
        status: appointment.status,
        source: appointment.source
      })
      uow.addEvent(createdEvt.event_name, createdEvt.payload, {
        traceId: crypto.randomUUID(),
        companyId,
        aggregateType: createdEvt.aggregate_type,
        aggregateId: createdEvt.aggregate_id
      })

      await uow.commit()

      // Dual-emit in-memory: confirma para o AppointmentIntegrationConsumer (WhatsApp).
      const confirmedEvt = AppointmentEvents.confirmed({
        appointment_id: appointment.id,
        company_id: companyId,
        collaborator_id: appointment.collaborator_id,
        service_id: appointment.service_id,
        customer_name: appointment.customer_name,
        customer_phone: appointment.customer_phone,
        starts_at: appointment.starts_at,
        ends_at: appointment.ends_at
      })
      eventBus.publish(confirmedEvt.event_name, confirmedEvt.payload, {
        company_id: companyId,
        aggregate_type: confirmedEvt.aggregate_type,
        aggregate_id: confirmedEvt.aggregate_id,
        source: 'AppointmentService'
      })

      return appointment
    } catch (err) {
      await uow.rollback()
      throw err
    }
  }

  async update(companyId, user, appointmentId, data = {}) {
    ensureCompany(companyId)
    ensureAdminOrCashManager(user, 'Apenas usuarios autorizados podem atualizar agendamentos')

    const existing = await this.repository.findById(companyId, appointmentId)

    if (!existing) {
      throw new NotFoundError('Agendamento')
    }

    const status = String(data.status || '').trim().toLowerCase()
    const notes = data.notes === undefined ? undefined : String(data.notes || '').trim() || null
    const canceledReason = data.canceled_reason === undefined && data.canceledReason === undefined
      ? undefined
      : String(data.canceled_reason || data.canceledReason || '').trim() || null

    if (!status && notes === undefined && canceledReason === undefined) {
      throw new ValidationError('Nenhuma alteracao enviada para o agendamento')
    }

    if (status && !APPOINTMENT_STATUS.includes(status)) {
      throw new ValidationError('Status do agendamento invalido')
    }

    const uow = createUnitOfWork()

    try {
      await uow.begin()

      const repo = uow.repository(AppointmentRepository)

      // Só atualiza status quando informado — update só-notas não deve gravar status='' (viola CHECK constraint).
      const updatePayload = { notes, canceledReason }
      if (status) updatePayload.status = status

      const updated = await repo.update(companyId, appointmentId, updatePayload)

      let mutationEvt = null
      if (status === 'confirmed') {
        mutationEvt = AppointmentEvents.confirmed({
          appointment_id: appointmentId,
          company_id: companyId,
          collaborator_id: existing.collaborator_id,
          service_id: existing.service_id,
          customer_name: existing.customer_name,
          customer_phone: existing.customer_phone,
          starts_at: existing.starts_at,
          ends_at: existing.ends_at
        })
      } else if (status === 'canceled') {
        mutationEvt = AppointmentEvents.canceled({
          appointment_id: appointmentId,
          company_id: companyId,
          collaborator_id: existing.collaborator_id,
          customer_name: existing.customer_name,
          customer_phone: existing.customer_phone,
          canceled_reason: canceledReason
        })
      } else if (status === 'completed') {
        mutationEvt = AppointmentEvents.completed({
          appointment_id: appointmentId,
          company_id: companyId,
          collaborator_id: existing.collaborator_id,
          service_id: existing.service_id
        })
      }

      if (mutationEvt) {
        uow.addEvent(mutationEvt.event_name, mutationEvt.payload, {
          traceId: crypto.randomUUID(),
          companyId,
          aggregateType: mutationEvt.aggregate_type,
          aggregateId: mutationEvt.aggregate_id
        })
      }

      await uow.commit()

      // Dual-emit in-memory apenas onde há consumer de integração ativo (WhatsApp): confirmed e canceled.
      if (status === 'confirmed' || status === 'canceled') {
        eventBus.publish(mutationEvt.event_name, mutationEvt.payload, {
          company_id: companyId,
          aggregate_type: mutationEvt.aggregate_type,
          aggregate_id: mutationEvt.aggregate_id,
          source: 'AppointmentService'
        })
      }

      return updated
    } catch (err) {
      await uow.rollback()
      throw err
    }
  }

  async cancel(companyId, user, appointmentId, data = {}) {
    return this.update(companyId, user, appointmentId, {
      ...data,
      status: 'canceled',
      canceled_reason: data.reason || null
    })
  }

  async reschedule(companyId, user, appointmentId, data = {}) {
    ensureCompany(companyId)
    ensureAdminOrCashManager(user)

    const existing = await this.repository.findById(companyId, appointmentId)

    if (!existing) {
      throw new NotFoundError('Agendamento')
    }

    const startsAt = data.startsAt || data.starts_at

    if (!startsAt) {
      throw new ValidationError('Nova data e obrigatoria para reagendamento')
    }

    const conflicts = await this.repository.findConflicts(
      companyId,
      existing.collaborator_id,
      new Date(startsAt),
      new Date(new Date(startsAt).getTime() + 30 * 60 * 1000),
      appointmentId
    )

    if (conflicts.length > 0) {
      throw new ValidationError('Horario ja ocupado para este profissional')
    }

    const uow = createUnitOfWork()

    try {
      await uow.begin()

      const repo = uow.repository(AppointmentRepository)

      const updated = await repo.update(companyId, appointmentId, {
        startsAt: new Date(startsAt),
        endsAt: new Date(new Date(startsAt).getTime() + 30 * 60 * 1000)
      })

      const rescheduledEvt = AppointmentEvents.rescheduled({
        appointment_id: appointmentId,
        company_id: companyId,
        collaborator_id: existing.collaborator_id,
        starts_at: updated.starts_at,
        ends_at: updated.ends_at,
        old_starts_at: existing.starts_at
      })
      uow.addEvent(rescheduledEvt.event_name, rescheduledEvt.payload, {
        traceId: crypto.randomUUID(),
        companyId,
        aggregateType: rescheduledEvt.aggregate_type,
        aggregateId: rescheduledEvt.aggregate_id
      })

      await uow.commit()

      return updated
    } catch (err) {
      await uow.rollback()
      throw err
    }
  }

  async delete(companyId, user, appointmentId) {
    ensureCompany(companyId)
    ensureAdmin(user)

    const existing = await this.repository.findById(companyId, appointmentId)

    if (!existing) {
      throw new NotFoundError('Agendamento')
    }

    await this.repository.delete(companyId, appointmentId)
    return true
  }
}

module.exports = AppointmentService
