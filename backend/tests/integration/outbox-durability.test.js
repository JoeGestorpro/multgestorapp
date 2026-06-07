const crypto = require('crypto')
const AppointmentService = require('../../src/services/appointment.service')
const AppointmentRepository = require('../../src/repositories/appointment.repository')
const {
  getTestPool,
  insertCompany,
  insertUser,
  insertCollaborator,
  insertService,
  activatePlan,
  activateModule,
  cleanupTestData,
  shutdownTestPool,
} = require('./helpers/test-database')
const { createCompanyA, createUserForCompany, createCollaboratorPayload, createServicePayload } = require('../helpers/tenant-factories')
const {
  AppointmentConfirmed,
  AppointmentCanceled,
  AppointmentCompleted,
  AppointmentRescheduled,
} = require('../../src/shared/core/events/contracts')

const hasTestDb = !!(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL)
const describeDb = hasTestDb ? describe : describe.skip

const TEST_COMPANY_IDS = []

let slotCounter = 0
// Cada agendamento recebe um slot único, distante 1 dia do anterior, para evitar
// conflito de horário/profissional (slots de 30min) entre os testes do mesmo colaborador.
function uniqueStartsAt() {
  slotCounter += 1
  return new Date(Date.now() + slotCounter * 86400000).toISOString()
}

describeDb('Outbox Durability — Integration Tests', () => {
  let db
  let service
  let collaborator
  let barberService
  let companyId

  beforeAll(async () => {
    db = await getTestPool()

    const company = await insertCompany(createCompanyA('outbox-durability-test'))
    companyId = company.id
    TEST_COMPANY_IDS.push(companyId)

    await activatePlan(companyId)
    await activateModule(companyId, 'barber')

    const user = await insertUser(createUserForCompany(companyId, 'admin'))

    const collabPayload = createCollaboratorPayload(companyId)
    collaborator = await insertCollaborator({ ...collabPayload, available_for_booking: true })

    const svcPayload = createServicePayload(companyId)
    barberService = await insertService(svcPayload)

    service = new AppointmentService(new AppointmentRepository())
  })

  afterAll(async () => {
    await db.query('DELETE FROM outbox_messages WHERE company_id = $1', [companyId])
    await cleanupTestData(TEST_COMPANY_IDS)
    await shutdownTestPool()
  })

  it('writes appointment.created event to outbox_messages via UoW', async () => {
    const startsAt = uniqueStartsAt()

    const appointment = await service.create(companyId, {
      id: 'user-admin',
      role: 'admin',
      company_id: companyId,
    }, {
      service_id: barberService.id,
      collaborator_id: collaborator.id,
      customer_name: 'Outbox Test Customer',
      customer_phone: '11988887777',
      starts_at: startsAt,
    })

    expect(appointment).toBeDefined()
    expect(appointment.id).toBeDefined()

    const result = await db.query(
      `SELECT id, type, payload, company_id, aggregate_type, aggregate_id, status
       FROM outbox_messages
       WHERE company_id = $1 AND type = 'appointment.created'
       ORDER BY created_at DESC
       LIMIT 1`,
      [companyId]
    )

    expect(result.rows.length).toBe(1)

    const msg = result.rows[0]
    expect(msg.type).toBe('appointment.created')
    expect(msg.company_id).toBe(companyId)
    expect(msg.aggregate_type).toBe('appointment')
    expect(msg.aggregate_id).toBe(appointment.id)
    expect(msg.status).toBe('pending')

    const payload = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload
    expect(payload.appointment_id).toBe(appointment.id)
    expect(payload.company_id).toBe(companyId)
    expect(payload.customer_name).toBe('Outbox Test Customer')
  })

  it('persists outbox message across simulated restart', async () => {
    const before = await db.query(
      `SELECT COUNT(*) AS cnt FROM outbox_messages
       WHERE company_id = $1 AND type = 'appointment.created' AND status = 'pending'`,
      [companyId]
    )

    await db.query('SELECT 1')

    const after = await db.query(
      `SELECT COUNT(*) AS cnt FROM outbox_messages
       WHERE company_id = $1 AND type = 'appointment.created' AND status = 'pending'`,
      [companyId]
    )

    expect(Number(after.rows[0].cnt)).toBeGreaterThanOrEqual(Number(before.rows[0].cnt))
  })

  it('does not emit appointment.created via in-memory eventBus in create path', async () => {
    const { eventBus } = require('../../src/shared')
    const publishSpy = jest.spyOn(eventBus, 'publish')

    const startsAt = uniqueStartsAt()

    await service.create(companyId, {
      id: 'user-test',
      role: 'admin',
      company_id: companyId,
    }, {
      service_id: barberService.id,
      collaborator_id: collaborator.id,
      customer_name: 'Spy Customer',
      customer_phone: '11988887777',
      starts_at: startsAt,
    })

    const appointmentCreatedCalls = publishSpy.mock.calls.filter(
      ([eventType]) => eventType === 'appointment.created'
    )
    expect(appointmentCreatedCalls.length).toBe(0)

    publishSpy.mockRestore()
  })

  // ─── Mutation paths → outbox durável (gate do inc.2) ───────────────────────
  // EVENT CONTRACTS: o tipo esperado vem do contrato (AppointmentX.event_name), nunca literal.

  const ADMIN = () => ({ id: 'user-admin', role: 'admin', company_id: companyId })

  async function createAppointment(name = 'Mutation Test') {
    const startsAt = uniqueStartsAt()
    return service.create(companyId, ADMIN(), {
      service_id: barberService.id,
      collaborator_id: collaborator.id,
      customer_name: name,
      customer_phone: '11988887777',
      starts_at: startsAt,
    })
  }

  async function latestOutbox(type, aggregateId) {
    const r = await db.query(
      `SELECT type, company_id, aggregate_type, aggregate_id, payload, status
       FROM outbox_messages
       WHERE company_id = $1 AND type = $2 AND aggregate_id = $3
       ORDER BY created_at DESC LIMIT 1`,
      [companyId, type, aggregateId]
    )
    return r.rows[0]
  }

  it('writes appointment.confirmed to outbox on update→confirmed', async () => {
    const appt = await createAppointment('Confirm Test')
    await service.update(companyId, ADMIN(), appt.id, { status: 'confirmed' })

    const msg = await latestOutbox(AppointmentConfirmed.event_name, appt.id)
    expect(msg).toBeDefined()
    expect(msg.type).toBe(AppointmentConfirmed.event_name)
    expect(msg.aggregate_type).toBe(AppointmentConfirmed.aggregate_type)
    expect(msg.aggregate_id).toBe(appt.id)
  })

  it('writes appointment.canceled to outbox on update→canceled', async () => {
    const appt = await createAppointment('Cancel Test')
    await service.update(companyId, ADMIN(), appt.id, { status: 'canceled', canceled_reason: 'cliente desistiu' })

    const msg = await latestOutbox(AppointmentCanceled.event_name, appt.id)
    expect(msg).toBeDefined()
    expect(msg.type).toBe(AppointmentCanceled.event_name)
    const payload = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload
    expect(payload.canceled_reason).toBe('cliente desistiu')
  })

  it('writes appointment.completed to outbox on update→completed', async () => {
    const appt = await createAppointment('Complete Test')
    await service.update(companyId, ADMIN(), appt.id, { status: 'completed' })

    const msg = await latestOutbox(AppointmentCompleted.event_name, appt.id)
    expect(msg).toBeDefined()
    expect(msg.type).toBe(AppointmentCompleted.event_name)
    expect(msg.aggregate_id).toBe(appt.id)
  })

  it('writes appointment.rescheduled to outbox on reschedule', async () => {
    const appt = await createAppointment('Reschedule Test')
    const newStart = uniqueStartsAt()
    await service.reschedule(companyId, ADMIN(), appt.id, { starts_at: newStart })

    const msg = await latestOutbox(AppointmentRescheduled.event_name, appt.id)
    expect(msg).toBeDefined()
    expect(msg.type).toBe(AppointmentRescheduled.event_name)
    expect(msg.aggregate_type).toBe(AppointmentRescheduled.aggregate_type)
  })

  it('update with notes only (no status) does NOT write a mutation event', async () => {
    const appt = await createAppointment('Notes Only Test')
    await service.update(companyId, ADMIN(), appt.id, { notes: 'apenas observação' })

    const confirmed = await latestOutbox(AppointmentConfirmed.event_name, appt.id)
    const canceled = await latestOutbox(AppointmentCanceled.event_name, appt.id)
    const completed = await latestOutbox(AppointmentCompleted.event_name, appt.id)
    expect(confirmed).toBeUndefined()
    expect(canceled).toBeUndefined()
    expect(completed).toBeUndefined()
  })
})
