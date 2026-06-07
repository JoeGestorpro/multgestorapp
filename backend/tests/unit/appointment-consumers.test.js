const { appLogger } = require('../../src/shared/core/logger')

jest.mock('../../src/shared/core/logger', () => ({
  appLogger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      debug: jest.fn(),
    })),
  },
}))

const {
  handleAppointmentConfirmed,
  handleAppointmentCanceled,
  handleAppointmentCompleted,
  handleAppointmentRescheduled,
  handleAppointmentCreated,
  handleAppointmentCreatedEventLog,
} = require('../../src/shared/core/events/consumers')

function createPayload(overrides = {}) {
  return {
    appointment_id: 'apt-1',
    company_id: 'company-a',
    status: 'confirmed',
    collaborator_id: 'col-1',
    service_id: 'svc-1',
    customer_name: 'Test',
    customer_phone: '11999999999',
    ...overrides,
  }
}

function createContext(overrides = {}) {
  return {
    eventId: 'evt-001',
    companyId: 'company-a',
    traceId: 'trace-abc',
    aggregateType: 'appointment',
    aggregateId: 'apt-1',
    ...overrides,
  }
}

describe('Appointment outbox consumer handlers', () => {
  let mockHandlerLogger

  beforeEach(() => {
    jest.clearAllMocks()
    mockHandlerLogger = { info: jest.fn(), debug: jest.fn() }
    appLogger.child.mockReturnValue(mockHandlerLogger)
  })

  describe('handleAppointmentConfirmed', () => {
    it('logs audit info with payload.* and context.* fields', () => {
      const payload = createPayload()
      const context = createContext()

      handleAppointmentConfirmed(payload, context)

      expect(appLogger.child).toHaveBeenCalledWith({ consumer: 'AuditLog', handler: 'outbox' })
      expect(mockHandlerLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event_id: context.eventId,
          event_name: 'appointment.confirmed',
          company_id: context.companyId,
          aggregate_type: 'appointment',
          aggregate_id: payload.appointment_id,
        }),
        expect.stringContaining('AUDIT')
      )
    })
  })

  describe('handleAppointmentCanceled', () => {
    it('logs audit info with payload.* and context.* fields', () => {
      const payload = createPayload({ status: 'canceled', canceled_reason: 'Customer request' })
      const context = createContext()

      handleAppointmentCanceled(payload, context)

      expect(mockHandlerLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event_id: context.eventId,
          event_name: 'appointment.canceled',
          company_id: context.companyId,
          aggregate_type: 'appointment',
          aggregate_id: payload.appointment_id,
        }),
        expect.any(String)
      )
    })
  })

  describe('handleAppointmentCompleted', () => {
    it('logs audit info with payload.* and context.* fields', () => {
      const payload = createPayload({ status: 'completed' })
      const context = createContext()

      handleAppointmentCompleted(payload, context)

      expect(mockHandlerLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event_id: context.eventId,
          event_name: 'appointment.completed',
          company_id: context.companyId,
          aggregate_type: 'appointment',
          aggregate_id: payload.appointment_id,
        }),
        expect.any(String)
      )
    })
  })

  describe('handleAppointmentRescheduled', () => {
    it('logs audit info with payload.* and context.* fields', () => {
      const payload = createPayload({ starts_at: '2026-06-10T10:00:00Z', ends_at: '2026-06-10T10:30:00Z', old_starts_at: '2026-06-09T10:00:00Z' })
      const context = createContext()

      handleAppointmentRescheduled(payload, context)

      expect(mockHandlerLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event_id: context.eventId,
          event_name: 'appointment.rescheduled',
          company_id: context.companyId,
          aggregate_type: 'appointment',
          aggregate_id: payload.appointment_id,
        }),
        expect.any(String)
      )
    })
  })

  describe('handleAppointmentCreated', () => {
    it('logs audit info using payload.* + context.*', () => {
      handleAppointmentCreated(createPayload(), createContext())

      expect(mockHandlerLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event_name: 'appointment.created',
          aggregate_type: 'appointment',
        }),
        expect.stringContaining('AUDIT')
      )
    })
  })

  describe('handleAppointmentCreatedEventLog', () => {
    it('logs debug event log using payload.* + context.*', () => {
      const context = createContext()
      handleAppointmentCreatedEventLog(createPayload(), context)

      expect(mockHandlerLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          event_name: 'appointment.created',
          metadata: expect.objectContaining({ traceId: context.traceId, companyId: context.companyId }),
        }),
        expect.any(String)
      )
    })
  })
})
