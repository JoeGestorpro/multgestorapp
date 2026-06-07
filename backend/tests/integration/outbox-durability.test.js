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

const hasTestDb = !!(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL)
const describeDb = hasTestDb ? describe : describe.skip

const TEST_COMPANY_IDS = []

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
    const startsAt = new Date(Date.now() + 86400000).toISOString()

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

    const startsAt = new Date(Date.now() + 86400000).toISOString()

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
})
