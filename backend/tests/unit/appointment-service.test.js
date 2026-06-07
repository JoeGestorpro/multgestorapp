const AppointmentRepository = require('../../src/repositories/appointment.repository')
const AppointmentService = require('../../src/services/appointment.service')
const { ValidationError, NotFoundError, ForbiddenError, eventBus } = require('../../src/shared')
const {
  AppointmentCreated,
  AppointmentConfirmed,
  AppointmentCanceled,
  AppointmentCompleted,
  AppointmentRescheduled,
  validateEventPayload
} = require('../../src/shared/core/events/contracts')

let mockUow
let mockUowRepo

jest.mock('../../src/shared/core/database/unit-of-work', () => ({
  UnitOfWork: jest.fn(),
  createUnitOfWork: jest.fn(() => mockUow),
}))

jest.mock('../../src/shared/core/events/event-bus', () => {
  const mockPublish = jest.fn()
  return {
    EventBus: jest.fn(),
    eventBus: { publish: mockPublish },
  }
})

jest.mock('../../src/shared/core/events/contracts', () => {
  const actual = jest.requireActual('../../src/shared/core/events/contracts')
  return {
    ...actual,
    validateEventPayload: jest.fn(),
  }
})

function createMockRepository() {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findConflicts: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    countByStatus: jest.fn(),
  }
}

function createDefaultUow() {
  return {
    begin: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    addEvent: jest.fn(),
    repository: jest.fn(),
    client: null,
    events: [],
    isActive: false,
  }
}

function createDefaultUowRepo() {
  return {
    findConflicts: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
  }
}

const ADMIN_USER = { id: 'user-1', role: 'admin', company_id: 'company-a' }
const COLLABORATOR_USER = { id: 'user-2', role: 'collaborator', company_id: 'company-a' }
const CLIENT_USER = { id: 'user-3', role: 'client', company_id: 'company-a' }
const COMPANY_ID = 'company-a'

const FUTURE_DATE = new Date(Date.now() + 86400000).toISOString()

describe('AppointmentService — Unit Tests', () => {
  let service
  let repo

  beforeEach(() => {
    mockUow = createDefaultUow()
    mockUowRepo = createDefaultUowRepo()
    mockUow.repository.mockReturnValue(mockUowRepo)

    repo = createMockRepository()
    service = new AppointmentService(repo)
    jest.clearAllMocks()

    mockUow.repository.mockReturnValue(mockUowRepo)
  })

  describe('list', () => {
    it('returns appointments with summary', async () => {
      repo.findAll.mockResolvedValue([{ id: 'apt-1' }])
      repo.countByStatus.mockResolvedValue({ total: 5, scheduled: 2, confirmed: 1, canceled: 1 })

      const result = await service.list(COMPANY_ID, ADMIN_USER)

      expect(result.appointments).toEqual([{ id: 'apt-1' }])
      expect(result.summary.total).toBe(5)
      expect(result.summary.appointments_today).toBe(5)
    })

    it('passes date filter to repository', async () => {
      repo.findAll.mockResolvedValue([])
      repo.countByStatus.mockResolvedValue({})

      await service.list(COMPANY_ID, ADMIN_USER, { date: '2024-01-15' })

      expect(repo.findAll).toHaveBeenCalledWith(COMPANY_ID, expect.objectContaining({
        date: '2024-01-15',
        timezone: 'America/Cuiaba',
      }))
    })

    it('passes collaborator filter to repository', async () => {
      repo.findAll.mockResolvedValue([])
      repo.countByStatus.mockResolvedValue({})

      await service.list(COMPANY_ID, ADMIN_USER, { collaborator_id: 'col-1' })

      expect(repo.findAll).toHaveBeenCalledWith(COMPANY_ID, expect.objectContaining({
        collaboratorId: 'col-1',
      }))
    })

    it('passes status filter to repository', async () => {
      repo.findAll.mockResolvedValue([])
      repo.countByStatus.mockResolvedValue({})

      await service.list(COMPANY_ID, ADMIN_USER, { status: 'scheduled' })

      expect(repo.findAll).toHaveBeenCalledWith(COMPANY_ID, expect.objectContaining({
        status: 'scheduled',
      }))
    })

    it('throws ValidationError for invalid status filter', async () => {
      await expect(service.list(COMPANY_ID, ADMIN_USER, { status: 'invalid' })).rejects.toThrow(ValidationError)
    })

    it('allows collaborator to list appointments', async () => {
      repo.findAll.mockResolvedValue([])
      repo.countByStatus.mockResolvedValue({})

      const result = await service.list(COMPANY_ID, COLLABORATOR_USER)

      expect(result.appointments).toEqual([])
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.list(null, ADMIN_USER)).rejects.toThrow(ForbiddenError)
    })

    it('throws ForbiddenError when client tries to list', async () => {
      await expect(service.list(COMPANY_ID, CLIENT_USER)).rejects.toThrow(ForbiddenError)
    })
  })

  describe('getById', () => {
    it('returns appointment when found', async () => {
      const appointment = { id: 'apt-1', company_id: COMPANY_ID }
      repo.findById.mockResolvedValue(appointment)

      const result = await service.getById(COMPANY_ID, 'apt-1')

      expect(result).toEqual(appointment)
      expect(repo.findById).toHaveBeenCalledWith(COMPANY_ID, 'apt-1')
    })

    it('throws NotFoundError when not found', async () => {
      repo.findById.mockResolvedValue(null)

      await expect(service.getById(COMPANY_ID, 'nonexistent')).rejects.toThrow(NotFoundError)
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.getById(null, 'apt-1')).rejects.toThrow(ForbiddenError)
    })
  })

  describe('create', () => {
    it('creates appointment with valid data', async () => {
      mockUowRepo.findConflicts.mockResolvedValue([])
      mockUowRepo.create.mockResolvedValue({
        id: 'apt-new',
        company_id: COMPANY_ID,
        collaborator_id: 'col-1',
        service_id: 'svc-1',
        customer_name: 'Test Customer',
        customer_phone: '11999999999',
        starts_at: FUTURE_DATE,
        ends_at: new Date(new Date(FUTURE_DATE).getTime() + 30 * 60 * 1000).toISOString(),
        status: 'scheduled',
        source: 'admin_manual',
      })

      const result = await service.create(COMPANY_ID, ADMIN_USER, {
        service_id: 'svc-1',
        collaborator_id: 'col-1',
        customer_name: 'Test Customer',
        customer_phone: '11999999999',
        starts_at: FUTURE_DATE,
      })

      expect(mockUow.begin).toHaveBeenCalled()
      expect(mockUow.repository).toHaveBeenCalledWith(AppointmentRepository)
      expect(mockUowRepo.create).toHaveBeenCalledWith(COMPANY_ID, expect.objectContaining({
        serviceId: 'svc-1',
        collaboratorId: 'col-1',
        customerName: 'Test Customer',
        customerPhone: '11999999999',
      }))
      expect(mockUow.addEvent).toHaveBeenCalledWith(
        AppointmentCreated.event_name,
        expect.objectContaining({
          appointment_id: 'apt-new',
          company_id: COMPANY_ID,
        }),
        expect.objectContaining({
          companyId: COMPANY_ID,
          aggregateType: AppointmentCreated.aggregate_type,
          aggregateId: 'apt-new',
        })
      )
      expect(mockUow.commit).toHaveBeenCalled()
      expect(result.id).toBe('apt-new')

      expect(validateEventPayload).toHaveBeenCalledWith(AppointmentCreated, expect.objectContaining({
        appointment_id: 'apt-new',
        company_id: COMPANY_ID,
      }))
      expect(validateEventPayload).toHaveBeenCalledWith(AppointmentConfirmed, expect.objectContaining({
        appointment_id: 'apt-new',
        company_id: COMPANY_ID,
      }))

      expect(eventBus.publish).toHaveBeenCalledWith(
        AppointmentConfirmed.event_name,
        expect.objectContaining({
          appointment_id: 'apt-new',
          company_id: COMPANY_ID,
        }),
        expect.any(Object)
      )

      const createdCalls = eventBus.publish.mock.calls.filter(
        ([type]) => type === AppointmentCreated.event_name
      )
      expect(createdCalls.length).toBe(0)
    })

    it('throws ValidationError when service_id is missing', async () => {
      await expect(service.create(COMPANY_ID, ADMIN_USER, {
        collaborator_id: 'col-1',
        customer_name: 'Test',
        customer_phone: '11999999999',
        starts_at: FUTURE_DATE,
      })).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError when collaborator_id is missing', async () => {
      await expect(service.create(COMPANY_ID, ADMIN_USER, {
        service_id: 'svc-1',
        customer_name: 'Test',
        customer_phone: '11999999999',
        starts_at: FUTURE_DATE,
      })).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError when customer_name is missing', async () => {
      await expect(service.create(COMPANY_ID, ADMIN_USER, {
        service_id: 'svc-1',
        collaborator_id: 'col-1',
        customer_phone: '11999999999',
        starts_at: FUTURE_DATE,
      })).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError when customer_phone is missing', async () => {
      await expect(service.create(COMPANY_ID, ADMIN_USER, {
        service_id: 'svc-1',
        collaborator_id: 'col-1',
        customer_name: 'Test',
        starts_at: FUTURE_DATE,
      })).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError when starts_at is missing', async () => {
      await expect(service.create(COMPANY_ID, ADMIN_USER, {
        service_id: 'svc-1',
        collaborator_id: 'col-1',
        customer_name: 'Test',
        customer_phone: '11999999999',
      })).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError when there is a scheduling conflict', async () => {
      mockUowRepo.findConflicts.mockResolvedValue([{ id: 'apt-conflict' }])

      await expect(service.create(COMPANY_ID, ADMIN_USER, {
        service_id: 'svc-1',
        collaborator_id: 'col-1',
        customer_name: 'Test',
        customer_phone: '11999999999',
        starts_at: FUTURE_DATE,
      })).rejects.toThrow(ValidationError)

      expect(mockUow.begin).toHaveBeenCalled()
      expect(mockUowRepo.findConflicts).toHaveBeenCalled()
      expect(mockUow.rollback).toHaveBeenCalled()
      expect(mockUow.commit).not.toHaveBeenCalled()
    })

    it('normalizes email before creating', async () => {
      mockUowRepo.findConflicts.mockResolvedValue([])
      mockUowRepo.create.mockResolvedValue({ id: 'apt-new' })

      await service.create(COMPANY_ID, ADMIN_USER, {
        service_id: 'svc-1',
        collaborator_id: 'col-1',
        customer_name: 'Test',
        customer_phone: '11999999999',
        customer_email: '  TEST@EXAMPLE.COM  ',
        starts_at: FUTURE_DATE,
      })

      expect(mockUowRepo.create).toHaveBeenCalledWith(COMPANY_ID, expect.objectContaining({
        customerEmail: 'test@example.com',
      }))
    })

    it('allows collaborator to create appointment', async () => {
      mockUowRepo.findConflicts.mockResolvedValue([])
      mockUowRepo.create.mockResolvedValue({ id: 'apt-new' })

      const result = await service.create(COMPANY_ID, COLLABORATOR_USER, {
        service_id: 'svc-1',
        collaborator_id: 'col-1',
        customer_name: 'Test',
        customer_phone: '11999999999',
        starts_at: FUTURE_DATE,
      })

      expect(result.id).toBe('apt-new')
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.create(null, ADMIN_USER, {
        service_id: 'svc-1',
        collaborator_id: 'col-1',
        customer_name: 'Test',
        customer_phone: '11999999999',
        starts_at: FUTURE_DATE,
      })).rejects.toThrow(ForbiddenError)
    })

    it('rolls back on repository error', async () => {
      mockUowRepo.findConflicts.mockResolvedValue([])
      mockUowRepo.create.mockRejectedValue(new Error('DB_ERROR'))

      await expect(service.create(COMPANY_ID, ADMIN_USER, {
        service_id: 'svc-1',
        collaborator_id: 'col-1',
        customer_name: 'Test',
        customer_phone: '11999999999',
        starts_at: FUTURE_DATE,
      })).rejects.toThrow('DB_ERROR')

      expect(mockUow.begin).toHaveBeenCalled()
      expect(mockUowRepo.create).toHaveBeenCalled()
      expect(mockUow.rollback).toHaveBeenCalled()
      expect(mockUow.commit).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    const EXISTING_APPOINTMENT = {
      id: 'apt-1',
      collaborator_id: 'col-1',
      service_id: 'svc-1',
      customer_name: 'Test Customer',
      customer_phone: '11999999999',
      starts_at: FUTURE_DATE,
      ends_at: new Date(new Date(FUTURE_DATE).getTime() + 30 * 60 * 1000).toISOString(),
    }

    it('updates status to confirmed with UoW + outbox + dual-emit', async () => {
      repo.findById.mockResolvedValue(EXISTING_APPOINTMENT)
      mockUowRepo.update.mockResolvedValue({ id: 'apt-1', status: 'confirmed' })

      const result = await service.update(COMPANY_ID, ADMIN_USER, 'apt-1', { status: 'confirmed' })

      expect(result.status).toBe('confirmed')

      expect(mockUow.begin).toHaveBeenCalled()
      expect(mockUow.repository).toHaveBeenCalledWith(AppointmentRepository)
      expect(mockUowRepo.update).toHaveBeenCalledWith(COMPANY_ID, 'apt-1', {
        status: 'confirmed',
        notes: undefined,
        canceledReason: undefined,
      })
      expect(mockUow.addEvent).toHaveBeenCalledWith(
        AppointmentConfirmed.event_name,
        expect.objectContaining({ appointment_id: 'apt-1', company_id: COMPANY_ID }),
        expect.objectContaining({ companyId: COMPANY_ID, aggregateType: AppointmentConfirmed.aggregate_type, aggregateId: 'apt-1' })
      )
      expect(mockUow.commit).toHaveBeenCalled()

      expect(validateEventPayload).toHaveBeenCalledWith(AppointmentConfirmed, expect.objectContaining({
        appointment_id: 'apt-1',
        company_id: COMPANY_ID,
      }))

      expect(eventBus.publish).toHaveBeenCalledWith(
        AppointmentConfirmed.event_name,
        expect.objectContaining({ appointment_id: 'apt-1', company_id: COMPANY_ID }),
        expect.any(Object)
      )

      const canceledCalls = eventBus.publish.mock.calls.filter(([t]) => t === AppointmentCanceled.event_name)
      expect(canceledCalls.length).toBe(0)
    })

    it('updates notes without events', async () => {
      repo.findById.mockResolvedValue({ id: 'apt-1' })
      mockUowRepo.update.mockResolvedValue({ id: 'apt-1' })

      await service.update(COMPANY_ID, ADMIN_USER, 'apt-1', { notes: 'New notes' })

      expect(mockUow.begin).toHaveBeenCalled()
      expect(mockUowRepo.update).toHaveBeenCalledWith(COMPANY_ID, 'apt-1', expect.objectContaining({
        notes: 'New notes',
      }))
      expect(mockUow.addEvent).not.toHaveBeenCalled()
      expect(mockUow.commit).toHaveBeenCalled()
      expect(validateEventPayload).not.toHaveBeenCalled()
      expect(eventBus.publish).not.toHaveBeenCalled()
    })

    it('throws ValidationError when no changes provided', async () => {
      repo.findById.mockResolvedValue({ id: 'apt-1' })

      await expect(service.update(COMPANY_ID, ADMIN_USER, 'apt-1', {})).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError for invalid status', async () => {
      repo.findById.mockResolvedValue({ id: 'apt-1' })

      await expect(service.update(COMPANY_ID, ADMIN_USER, 'apt-1', { status: 'invalid' })).rejects.toThrow(ValidationError)
    })

    it('throws NotFoundError when appointment does not exist', async () => {
      repo.findById.mockResolvedValue(null)

      await expect(service.update(COMPANY_ID, ADMIN_USER, 'nonexistent', { status: 'confirmed' })).rejects.toThrow(NotFoundError)
    })

    it('allows collaborator to update', async () => {
      repo.findById.mockResolvedValue(EXISTING_APPOINTMENT)
      mockUowRepo.update.mockResolvedValue({ id: 'apt-1' })

      const result = await service.update(COMPANY_ID, COLLABORATOR_USER, 'apt-1', { status: 'confirmed' })

      expect(result).toBeDefined()
      expect(mockUow.begin).toHaveBeenCalled()
      expect(mockUow.commit).toHaveBeenCalled()
    })

    it('rolls back on repository error', async () => {
      repo.findById.mockResolvedValue(EXISTING_APPOINTMENT)
      mockUowRepo.update.mockRejectedValue(new Error('DB_ERROR'))

      await expect(service.update(COMPANY_ID, ADMIN_USER, 'apt-1', { status: 'confirmed' })).rejects.toThrow('DB_ERROR')

      expect(mockUow.begin).toHaveBeenCalled()
      expect(mockUow.rollback).toHaveBeenCalled()
      expect(mockUow.commit).not.toHaveBeenCalled()
    })
  })

  describe('cancel', () => {
    const EXISTING_APPOINTMENT = {
      id: 'apt-1',
      collaborator_id: 'col-1',
      service_id: 'svc-1',
      customer_name: 'Test Customer',
      customer_phone: '11999999999',
      starts_at: FUTURE_DATE,
      ends_at: new Date(new Date(FUTURE_DATE).getTime() + 30 * 60 * 1000).toISOString(),
    }

    it('cancels appointment with reason via UoW + outbox + dual-emit', async () => {
      repo.findById.mockResolvedValue(EXISTING_APPOINTMENT)
      mockUowRepo.update.mockResolvedValue({ id: 'apt-1', status: 'canceled' })

      const result = await service.cancel(COMPANY_ID, ADMIN_USER, 'apt-1', { reason: 'Customer requested' })

      expect(result.status).toBe('canceled')

      expect(mockUow.begin).toHaveBeenCalled()
      expect(mockUow.repository).toHaveBeenCalledWith(AppointmentRepository)
      expect(mockUowRepo.update).toHaveBeenCalledWith(COMPANY_ID, 'apt-1', expect.objectContaining({
        status: 'canceled',
        canceledReason: 'Customer requested',
      }))
      expect(mockUow.addEvent).toHaveBeenCalledWith(
        AppointmentCanceled.event_name,
        expect.objectContaining({ appointment_id: 'apt-1', company_id: COMPANY_ID }),
        expect.any(Object)
      )
      expect(mockUow.commit).toHaveBeenCalled()

      expect(validateEventPayload).toHaveBeenCalledWith(AppointmentCanceled, expect.objectContaining({
        appointment_id: 'apt-1',
        company_id: COMPANY_ID,
      }))

      expect(eventBus.publish).toHaveBeenCalledWith(
        AppointmentCanceled.event_name,
        expect.objectContaining({ appointment_id: 'apt-1', company_id: COMPANY_ID }),
        expect.any(Object)
      )
    })

    it('cancels appointment without reason', async () => {
      repo.findById.mockResolvedValue(EXISTING_APPOINTMENT)
      mockUowRepo.update.mockResolvedValue({ id: 'apt-1', status: 'canceled' })

      await service.cancel(COMPANY_ID, ADMIN_USER, 'apt-1')

      expect(mockUow.begin).toHaveBeenCalled()
      expect(mockUowRepo.update).toHaveBeenCalledWith(COMPANY_ID, 'apt-1', expect.objectContaining({
        status: 'canceled',
      }))
      expect(mockUow.addEvent).toHaveBeenCalledWith(
        AppointmentCanceled.event_name,
        expect.any(Object),
        expect.any(Object)
      )
      expect(mockUow.commit).toHaveBeenCalled()
    })
  })

  describe('reschedule', () => {
    it('reschedules appointment when no conflict via UoW + outbox', async () => {
      const newDate = new Date(Date.now() + 172800000).toISOString()
      repo.findById.mockResolvedValue({ id: 'apt-1', collaborator_id: 'col-1', starts_at: FUTURE_DATE })
      repo.findConflicts.mockResolvedValue([])
      mockUowRepo.update.mockResolvedValue({ id: 'apt-1', starts_at: newDate })

      const result = await service.reschedule(COMPANY_ID, ADMIN_USER, 'apt-1', { starts_at: newDate })

      expect(result.starts_at).toBe(newDate)
      expect(repo.findConflicts).toHaveBeenCalledWith(
        COMPANY_ID,
        'col-1',
        expect.any(Date),
        expect.any(Date),
        'apt-1'
      )

      expect(mockUow.begin).toHaveBeenCalled()
      expect(mockUow.repository).toHaveBeenCalledWith(AppointmentRepository)
      expect(mockUowRepo.update).toHaveBeenCalledWith(COMPANY_ID, 'apt-1', expect.objectContaining({
        startsAt: expect.any(Date),
        endsAt: expect.any(Date),
      }))
      expect(mockUow.addEvent).toHaveBeenCalledWith(
        AppointmentRescheduled.event_name,
        expect.objectContaining({ appointment_id: 'apt-1', company_id: COMPANY_ID }),
        expect.any(Object)
      )
      expect(mockUow.commit).toHaveBeenCalled()
    })

    it('throws ValidationError when new date is missing', async () => {
      repo.findById.mockResolvedValue({ id: 'apt-1' })

      await expect(service.reschedule(COMPANY_ID, ADMIN_USER, 'apt-1', {})).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError when there is a conflict', async () => {
      const newDate = new Date(Date.now() + 172800000).toISOString()
      repo.findById.mockResolvedValue({ id: 'apt-1', collaborator_id: 'col-1' })
      repo.findConflicts.mockResolvedValue([{ id: 'apt-conflict' }])

      await expect(service.reschedule(COMPANY_ID, ADMIN_USER, 'apt-1', { starts_at: newDate })).rejects.toThrow(ValidationError)
    })

    it('throws NotFoundError when appointment does not exist', async () => {
      repo.findById.mockResolvedValue(null)

      await expect(service.reschedule(COMPANY_ID, ADMIN_USER, 'nonexistent', { starts_at: FUTURE_DATE })).rejects.toThrow(NotFoundError)
    })
  })

  describe('delete', () => {
    it('deletes existing appointment', async () => {
      repo.findById.mockResolvedValue({ id: 'apt-1' })
      repo.delete.mockResolvedValue({ id: 'apt-1' })

      const result = await service.delete(COMPANY_ID, ADMIN_USER, 'apt-1')

      expect(result).toBe(true)
      expect(repo.delete).toHaveBeenCalledWith(COMPANY_ID, 'apt-1')
    })

    it('throws NotFoundError when appointment does not exist', async () => {
      repo.findById.mockResolvedValue(null)

      await expect(service.delete(COMPANY_ID, ADMIN_USER, 'nonexistent')).rejects.toThrow(NotFoundError)
    })

    it('throws ForbiddenError when user is collaborator (admin only)', async () => {
      await expect(service.delete(COMPANY_ID, COLLABORATOR_USER, 'apt-1')).rejects.toThrow(ForbiddenError)
    })

    it('throws ForbiddenError when company_id is missing', async () => {
      await expect(service.delete(null, ADMIN_USER, 'apt-1')).rejects.toThrow(ForbiddenError)
    })
  })

  describe('Tenant isolation', () => {
    it('passes correct company_id to repository on list', async () => {
      repo.findAll.mockResolvedValue([])
      repo.countByStatus.mockResolvedValue({})
      await service.list('company-b', ADMIN_USER)
      expect(repo.findAll).toHaveBeenCalledWith('company-b', expect.any(Object))
    })

    it('passes correct company_id to UoW repository on create', async () => {
      mockUowRepo.findConflicts.mockResolvedValue([])
      mockUowRepo.create.mockResolvedValue({ id: 'apt-new' })
      await service.create('company-b', ADMIN_USER, {
        service_id: 'svc-1',
        collaborator_id: 'col-1',
        customer_name: 'Test',
        customer_phone: '11999999999',
        starts_at: FUTURE_DATE,
      })
      expect(mockUowRepo.create).toHaveBeenCalledWith('company-b', expect.any(Object))
    })

    it('passes correct company_id to UoW repository on update', async () => {
      repo.findById.mockResolvedValue({ id: 'apt-1', collaborator_id: 'col-1', service_id: 'svc-1', customer_name: 'Test', customer_phone: '11999999999', starts_at: FUTURE_DATE, ends_at: new Date(new Date(FUTURE_DATE).getTime() + 30 * 60 * 1000).toISOString() })
      mockUowRepo.update.mockResolvedValue({ id: 'apt-1' })
      await service.update('company-b', ADMIN_USER, 'apt-1', { status: 'confirmed' })
      expect(mockUowRepo.update).toHaveBeenCalledWith('company-b', 'apt-1', expect.any(Object))
    })

    it('passes correct company_id to repository on delete', async () => {
      repo.findById.mockResolvedValue({ id: 'apt-1' })
      repo.delete.mockResolvedValue({ id: 'apt-1' })
      await service.delete('company-b', ADMIN_USER, 'apt-1')
      expect(repo.delete).toHaveBeenCalledWith('company-b', 'apt-1')
    })
  })
})
