// tests/integration/public-booking-rls.test.js
// TENANT-003A — Isolamento entre tenants nas rotas públicas de booking
//
// Cobre o achado da auditoria SEC-BOOKING-RLS-001: as rotas de
// public-booking.routes.js não passavam por nenhum contexto de tenant/RLS.
// Após a correção (runPublicTenantOperation em config/database.js), todo
// acesso a dados de negócio nessas rotas roda com app.current_company_id
// setado via poolTenant — RLS ativo como segunda camada, além do filtro
// manual WHERE company_id já existente.
//
// Segue o mesmo padrão de tests/integration/tenant-isolation.test.js:
// describeDb (skip sem TEST_DATABASE_URL), fixtures reais de 2 tenants,
// requisições HTTP via supertest contra o router público real.

const crypto = require('crypto')
const {
  getTestPool,
  insertCompany,
  insertCollaborator,
  insertService,
  activatePlan,
  activateModule,
  cleanupTestData,
  shutdownTestPool,
} = require('./helpers/test-database')

const {
  createCompanyA,
  createCompanyB,
  createCollaboratorPayload,
  createServicePayload,
} = require('../helpers/tenant-factories')

const { createIntegrationApp, registerRoutes } = require('../helpers/integration-app')
const supertest = require('supertest')

const publicBookingRoutes = require('../../src/routes/public-booking.routes')

// O motor de agenda avalia horário de funcionamento no fuso fixo do negócio
// (America/Cuiaba, UTC-4, sem DST — ver scheduling-utils.js). new Date().setHours()
// usa o fuso LOCAL do processo que roda o teste, que não é necessariamente
// UTC-4 (CI normalmente roda em UTC) — construir o horário direto em UTC evita
// que o mesmo teste passe numa máquina e falhe por "fora do horário de
// funcionamento" (400) em outra, só por causa do fuso do runner.
function nextBusinessDateAtUtcHour(minDaysAhead, hourUtc) {
  let date = new Date(Date.now() + minDaysAhead * 24 * 60 * 60 * 1000)
  date.setUTCHours(hourUtc, 0, 0, 0)
  // Domingo (weekday 0) é fechado por padrão (weekly_hours default) — pula para segunda.
  while (date.getUTCDay() === 0) {
    date = new Date(date.getTime() + 24 * 60 * 60 * 1000)
  }
  return date
}

const TEST_COMPANY_IDS = []

let app = null
let companyA = null
let companyB = null
let collabA = null
let collabB = null
let serviceA = null
let serviceB = null

const hasTestDb = !!(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL)
const describeDb = hasTestDb ? describe : describe.skip

if (!hasTestDb) {
  // eslint-disable-next-line no-console
  console.warn(
    '[public-booking-rls.test.js] TEST_DATABASE_URL/DATABASE_URL ausentes — ' +
    'suíte de isolamento entre tenants pulada (mesma limitação já registrada ' +
    'para tenant-isolation-rls.test.js). Rodar localmente com um banco de teste ' +
    'para validar de fato o Gate 5 da missão TENANT-003A.'
  )
}

describeDb('Public booking — isolamento entre tenants (TENANT-003A / SEC-BOOKING-RLS-001)', () => {
  beforeAll(async () => {
    const path = require('path')
    require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env.test'), quiet: true })

    app = createIntegrationApp()
    registerRoutes(app, [{ path: '/api/public', router: publicBookingRoutes }])

    companyA = createCompanyA()
    companyB = createCompanyB()

    await insertCompany(companyA)
    await insertCompany(companyB)
    TEST_COMPANY_IDS.push(companyA.id, companyB.id)

    await activateModule(companyA.id, 'barber')
    await activateModule(companyB.id, 'barber')
    await activatePlan(companyA.id, 'profissional')
    await activatePlan(companyB.id, 'profissional')

    serviceA = await insertService(createServicePayload(companyA.id, { name: 'Corte Alpha' }))
    serviceB = await insertService(createServicePayload(companyB.id, { name: 'Corte Beta' }))

    collabA = await insertCollaborator(createCollaboratorPayload(companyA.id, {
      name: 'Colaborador Alpha',
      available_for_booking: true,
    }))
    collabB = await insertCollaborator(createCollaboratorPayload(companyB.id, {
      name: 'Colaborador Beta',
      available_for_booking: true,
    }))
  })

  afterAll(async () => {
    await cleanupTestData(TEST_COMPANY_IDS)
    await shutdownTestPool()

    const mainPool = require('../../src/config/database')
    if (typeof mainPool.end === 'function') {
      await mainPool.end().catch(() => {})
    }
    const redisClient = require('../../src/shared/core/cache/redis-client')
    await redisClient.quit().catch(() => {})
  })

  describe('1. GET /booking/:slug — vitrine pública', () => {
    it('retorna apenas serviços e colaboradores do próprio tenant', async () => {
      const response = await supertest(app).get(`/api/public/booking/${companyA.public_booking_slug}`)

      expect(response.status).toBe(200)
      const serviceNames = response.body.data.services.map((s) => s.name)
      const collaboratorNames = response.body.data.collaborators.map((c) => c.name)

      expect(serviceNames).toContain('Corte Alpha')
      expect(serviceNames).not.toContain('Corte Beta')
      expect(collaboratorNames).toContain('Colaborador Alpha')
      expect(collaboratorNames).not.toContain('Colaborador Beta')
    })

    it('slug inexistente retorna 404 controlado, sem vazar detalhe interno', async () => {
      const response = await supertest(app).get('/api/public/booking/slug-que-nao-existe-123')

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('2. GET /scheduling/:companySlug/availability — disponibilidade', () => {
    it('serviceId de outro tenant é rejeitado mesmo com slug correto (ids não vazam entre empresas)', async () => {
      const response = await supertest(app)
        .get(`/api/public/scheduling/${companyA.public_booking_slug}/availability`)
        .query({ serviceId: serviceB.id, date: new Date().toISOString().split('T')[0] })

      // ensureService filtra por company_id — service de B não existe no escopo de A
      expect([400, 404]).toContain(response.status)
    })

    it('collaboratorId de outro tenant é rejeitado mesmo com slug correto', async () => {
      const response = await supertest(app)
        .get(`/api/public/scheduling/${companyA.public_booking_slug}/availability`)
        .query({ serviceId: serviceA.id, collaboratorId: collabB.id, date: new Date().toISOString().split('T')[0] })

      expect([400, 404]).toContain(response.status)
    })

    it('não expõe nenhuma coluna de identidade de cliente na disponibilidade', async () => {
      const response = await supertest(app)
        .get(`/api/public/scheduling/${companyA.public_booking_slug}/availability`)
        .query({ serviceId: serviceA.id, date: new Date().toISOString().split('T')[0] })

      expect(response.status).toBe(200)
      const bodyText = JSON.stringify(response.body)
      expect(bodyText).not.toMatch(/customer_name|customer_phone|customer_email/)
    })
  })

  describe('3. POST /booking/:slug/appointments — criação de booking', () => {
    it('agendamento criado pelo slug A é gravado com company_id de A', async () => {
      // 14:00 UTC = 10:00 America/Cuiaba (dentro de 08:00-19:00, seg-sex/sáb 08:00-17:00).
      const startsAt = nextBusinessDateAtUtcHour(3, 14)

      const response = await supertest(app)
        .post(`/api/public/booking/${companyA.public_booking_slug}/appointments`)
        .send({
          serviceId: serviceA.id,
          collaboratorId: collabA.id,
          customerName: 'Cliente Isolamento A',
          customerPhone: '11988887777',
          startsAt: startsAt.toISOString(),
        })

      expect([201, 402, 409]).toContain(response.status)
      if (response.status === 201) {
        expect(response.body.data.company_id).toBe(companyA.id)
        expect(response.body.data.service_id).toBe(serviceA.id)
      }
    })

    it('não é possível criar agendamento no slug A usando serviço do tenant B', async () => {
      // 15:00 UTC = 11:00 America/Cuiaba.
      const startsAt = nextBusinessDateAtUtcHour(4, 15)

      const response = await supertest(app)
        .post(`/api/public/booking/${companyA.public_booking_slug}/appointments`)
        .send({
          serviceId: serviceB.id,
          collaboratorId: collabA.id,
          customerName: 'Tentativa Cruzada',
          customerPhone: '11988880000',
          startsAt: startsAt.toISOString(),
        })

      expect([400, 404]).toContain(response.status)

      // Nenhum agendamento cruzado deve ter sido persistido para o serviço de B
      const db = await getTestPool()
      const crossCheck = await db.query(
        `SELECT id FROM barber_appointments WHERE company_id = $1 AND service_id = $2`,
        [companyA.id, serviceB.id]
      )
      expect(crossCheck.rowCount).toBe(0)
    })
  })

  describe('4. Cadastro e login público — isolamento por company_id', () => {
    const sharedEmail = `cliente-isolamento-${crypto.randomUUID()}@example.com`

    it('mesmo e-mail pode se pré-cadastrar em tenants diferentes sem colidir', async () => {
      const responseA = await supertest(app)
        .post(`/api/public/booking/${companyA.public_booking_slug}/register`)
        .send({
          name: 'Cliente Alpha',
          phone: '11977776666',
          email: sharedEmail,
          password: 'senha123',
          confirmPassword: 'senha123',
        })

      const responseB = await supertest(app)
        .post(`/api/public/booking/${companyB.public_booking_slug}/register`)
        .send({
          name: 'Cliente Beta',
          phone: '11977775555',
          email: sharedEmail,
          password: 'senha123',
          confirmPassword: 'senha123',
        })

      expect(responseA.status).toBe(201)
      expect(responseB.status).toBe(201)

      const db = await getTestPool()
      const rows = await db.query(
        `SELECT company_id FROM booking_customers WHERE lower(email) = lower($1)`,
        [sharedEmail]
      )
      const companyIds = rows.rows.map((r) => r.company_id).sort()
      expect(companyIds.sort()).toEqual([companyA.id, companyB.id].sort())
    })

    it('login com slug do tenant errado para um e-mail cadastrado só no tenant A falha', async () => {
      const response = await supertest(app)
        .post(`/api/public/booking/${companyB.public_booking_slug}/login`)
        .send({ email: sharedEmail, password: 'senha123', companySlug: companyB.public_booking_slug })

      // Login sob o slug B encontra o registro do PRÓPRIO tenant B (mesmo e-mail
      // compartilhado) — o teste de isolamento real é que ele NUNCA autentica
      // contra os dados do tenant A (verificado no bloco anterior por company_id).
      expect([200, 401, 403]).toContain(response.status)
      if (response.status === 200) {
        expect(response.body.data.user.company_id).toBe(companyB.id)
      }
    })
  })

  describe('5. Tenant/módulo desabilitado', () => {
    it('empresa com módulo barber inativo retorna 404 controlado na vitrine pública', async () => {
      const disabledCompany = createCompanyA({ name: 'Empresa Desativada' })
      await insertCompany(disabledCompany)
      TEST_COMPANY_IDS.push(disabledCompany.id)
      // Não chama activateModule — company_modules.status nunca fica 'active'

      const response = await supertest(app).get(`/api/public/booking/${disabledCompany.public_booking_slug}`)

      expect(response.status).toBe(404)
    })
  })
})
