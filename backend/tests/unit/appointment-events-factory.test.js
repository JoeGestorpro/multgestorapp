const AppointmentEvents = require('../../src/shared/core/events/factories/appointment-events')
const {
  AppointmentCreated,
  AppointmentConfirmed,
  AppointmentCanceled,
  AppointmentCompleted,
  AppointmentRescheduled,
} = require('../../src/shared/core/events/contracts')

// NOTA: este teste usa o validateEventPayload REAL (sem mock) — é o ponto da factory.

const base = {
  appointment_id: 'apt-1',
  company_id: 'co-1',
  collaborator_id: 'col-1',
  service_id: 'svc-1',
  customer_name: 'João',
  customer_phone: '5511999999999',
  starts_at: '2026-06-10T14:00:00Z',
  ends_at: '2026-06-10T14:30:00Z',
  status: 'scheduled',
}

describe('AppointmentEvents factory — EVENT CONTRACTS', () => {
  describe('created', () => {
    it('usa event_name e aggregate_type do contrato (sem hardcode)', () => {
      const evt = AppointmentEvents.created(base)
      expect(evt.event_name).toBe(AppointmentCreated.event_name)
      expect(evt.aggregate_type).toBe(AppointmentCreated.aggregate_type)
      expect(evt.aggregate_id).toBe('apt-1')
    })
    it('aplica source default e mantém payload obrigatório', () => {
      const evt = AppointmentEvents.created({ ...base, source: undefined })
      expect(evt.payload.source).toBe('admin_manual')
      expect(evt.payload.appointment_id).toBe('apt-1')
      expect(evt.payload.company_id).toBe('co-1')
    })
    it('falha (validateEventPayload) se faltar campo obrigatório', () => {
      expect(() => AppointmentEvents.created({ ...base, status: undefined })).toThrow(/status/)
      expect(() => AppointmentEvents.created({ ...base, service_id: undefined })).toThrow(/service_id/)
    })
  })

  describe('confirmed', () => {
    it('usa contrato e força status confirmed', () => {
      const evt = AppointmentEvents.confirmed(base)
      expect(evt.event_name).toBe(AppointmentConfirmed.event_name)
      expect(evt.aggregate_type).toBe(AppointmentConfirmed.aggregate_type)
      expect(evt.payload.status).toBe('confirmed')
    })
    it('falha se faltar appointment_id', () => {
      expect(() => AppointmentEvents.confirmed({ ...base, appointment_id: undefined })).toThrow(/appointment_id/)
    })
  })

  describe('canceled', () => {
    it('usa contrato, força status canceled e canceled_reason default null', () => {
      const evt = AppointmentEvents.canceled(base)
      expect(evt.event_name).toBe(AppointmentCanceled.event_name)
      expect(evt.payload.status).toBe('canceled')
      expect(evt.payload.canceled_reason).toBeNull()
    })
  })

  describe('completed', () => {
    it('usa contrato e força status completed', () => {
      const evt = AppointmentEvents.completed(base)
      expect(evt.event_name).toBe(AppointmentCompleted.event_name)
      expect(evt.aggregate_type).toBe(AppointmentCompleted.aggregate_type)
      expect(evt.payload.status).toBe('completed')
    })
  })

  describe('rescheduled', () => {
    it('usa contrato (requer starts_at + ends_at)', () => {
      const evt = AppointmentEvents.rescheduled(base)
      expect(evt.event_name).toBe(AppointmentRescheduled.event_name)
      expect(evt.aggregate_type).toBe(AppointmentRescheduled.aggregate_type)
    })
    it('falha se faltar ends_at', () => {
      expect(() => AppointmentEvents.rescheduled({ ...base, ends_at: undefined })).toThrow(/ends_at/)
    })
  })

  it('nenhum método retorna event_name fora do contrato', () => {
    expect(AppointmentEvents.created(base).event_name).toBe(AppointmentCreated.event_name)
    expect(AppointmentEvents.confirmed(base).event_name).toBe(AppointmentConfirmed.event_name)
    expect(AppointmentEvents.canceled(base).event_name).toBe(AppointmentCanceled.event_name)
    expect(AppointmentEvents.completed(base).event_name).toBe(AppointmentCompleted.event_name)
    expect(AppointmentEvents.rescheduled(base).event_name).toBe(AppointmentRescheduled.event_name)
  })
})
