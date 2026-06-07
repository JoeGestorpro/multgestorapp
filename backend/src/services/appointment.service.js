const crypto = require('crypto')
const AppointmentRepository = require('../repositories/appointment.repository')
const { ValidationError, NotFoundError, ForbiddenError, eventBus, createUnitOfWork } = require('../shared')
const { normalizeEmail } = require('../utils/validators')
const { APPOINTMENT_STATUS } = require('../shared/capabilities/booking-engine/scheduling-utils')
const {
  AppointmentCreated,
  AppointmentConfirmed,
  AppointmentCanceled,
  AppointmentCompleted,
  AppointmentRescheduled,
  validateEventPayload
} = require('../shared/core/events/contracts')

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

      const createdPayload = {
        appointment_id: appointment.id,
        company_id: companyId,
        collaborator_id: appointment.collaborator_id,
        service_id: appointment.service_id,
        customer_name: appointment.customer_name,
        customer_phone: appointment.customer_phone,
        starts_at: appointment.starts_at,
        ends_at: appointment.ends_at,
        status: appointment.status,
        source: appointment.source || 'admin_manual'
      }
      validateEventPayload(AppointmentCreated, createdPayload)
      uow.addEvent(AppointmentCreated.event_name, createdPayload, {
        traceId: crypto.randomUUID(),
        companyId,
        aggregateType: AppointmentCreated.aggregate_type,
        aggregateId: appointment.id
      })

      await uow.commit()

      const confirmedPayload = {
        appointment_id: appointment.id,
        company_id: companyId,
        status: 'confirmed',
        collaborator_id: appointment.collaborator_id,
        service_id: appointment.service_id,
        customer_name: appointment.customer_name,
        customer_phone: appointment.customer_phone,
        starts_at: appointment.starts_at,
        ends_at: appointment.ends_at
      }
      validateEventPayload(AppointmentConfirmed, confirmedPayload)
      eventBus.publish(AppointmentConfirmed.event_name, confirmedPayload, {
        company_id: companyId,
        aggregate_type: AppointmentConfirmed.aggregate_type,
        aggregate_id: appointment.id,
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

      const updated = await repo.update(companyId, appointmentId, {
        status,
        notes,
        canceledReason
      })

      if (status === 'confirmed') {
        const confirmedOutboxPayload = {
          appointment_id: appointmentId,
          company_id: companyId,
          status: 'confirmed',
          collaborator_id: existing.collaborator_id,
          service_id: existing.service_id,
          customer_name: existing.customer_name,
          customer_phone: existing.customer_phone,
          starts_at: existing.starts_at,
          ends_at: existing.ends_at
        }
        validateEventPayload(AppointmentConfirmed, confirmedOutboxPayload)
        uow.addEvent(AppointmentConfirmed.event_name, confirmedOutboxPayload, {
          traceId: crypto.randomUUID(),
          companyId,
          aggregateType: AppointmentConfirmed.aggregate_type,
          aggregateId: appointmentId
        })
      } else if (status === 'canceled') {
        const canceledOutboxPayload = {
          appointment_id: appointmentId,
          company_id: companyId,
          status: 'canceled',
          collaborator_id: existing.collaborator_id,
          customer_name: existing.customer_name,
          customer_phone: existing.customer_phone,
          canceled_reason: canceledReason
        }
        validateEventPayload(AppointmentCanceled, canceledOutboxPayload)
        uow.addEvent(AppointmentCanceled.event_name, canceledOutboxPayload, {
          traceId: crypto.randomUUID(),
          companyId,
          aggregateType: AppointmentCanceled.aggregate_type,
          aggregateId: appointmentId
        })
      } else if (status === 'completed') {
        const completedOutboxPayload = {
          appointment_id: appointmentId,
          company_id: companyId,
          status: 'completed',
          collaborator_id: existing.collaborator_id,
          service_id: existing.service_id
        }
        validateEventPayload(AppointmentCompleted, completedOutboxPayload)
        uow.addEvent(AppointmentCompleted.event_name, completedOutboxPayload, {
          traceId: crypto.randomUUID(),
          companyId,
          aggregateType: AppointmentCompleted.aggregate_type,
          aggregateId: appointmentId
        })
      }

      await uow.commit()

      if (status === 'confirmed') {
        const confirmedInMemoryPayload = {
          appointment_id: appointmentId,
          company_id: companyId,
          status: 'confirmed',
          collaborator_id: existing.collaborator_id,
          service_id: existing.service_id,
          customer_name: existing.customer_name,
          customer_phone: existing.customer_phone,
          starts_at: existing.starts_at,
          ends_at: existing.ends_at
        }
        validateEventPayload(AppointmentConfirmed, confirmedInMemoryPayload)
        eventBus.publish(AppointmentConfirmed.event_name, confirmedInMemoryPayload, {
          company_id: companyId,
          aggregate_type: AppointmentConfirmed.aggregate_type,
          aggregate_id: appointmentId,
          source: 'AppointmentService'
        })
      } else if (status === 'canceled') {
        const canceledInMemoryPayload = {
          appointment_id: appointmentId,
          company_id: companyId,
          status: 'canceled',
          collaborator_id: existing.collaborator_id,
          customer_name: existing.customer_name,
          customer_phone: existing.customer_phone,
          canceled_reason: canceledReason
        }
        validateEventPayload(AppointmentCanceled, canceledInMemoryPayload)
        eventBus.publish(AppointmentCanceled.event_name, canceledInMemoryPayload, {
          company_id: companyId,
          aggregate_type: AppointmentCanceled.aggregate_type,
          aggregate_id: appointmentId,
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

      const rescheduledPayload = {
        appointment_id: appointmentId,
        company_id: companyId,
        collaborator_id: existing.collaborator_id,
        starts_at: updated.starts_at,
        ends_at: updated.ends_at,
        old_starts_at: existing.starts_at
      }
      validateEventPayload(AppointmentRescheduled, rescheduledPayload)
      uow.addEvent(AppointmentRescheduled.event_name, rescheduledPayload, {
        traceId: crypto.randomUUID(),
        companyId,
        aggregateType: AppointmentRescheduled.aggregate_type,
        aggregateId: appointmentId
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
