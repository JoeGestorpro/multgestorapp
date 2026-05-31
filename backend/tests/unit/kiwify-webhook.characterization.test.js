let mockQuery

jest.mock('../../src/config/database', () => {
  mockQuery = jest.fn()
  return {
    query: mockQuery,
    connect: jest.fn().mockResolvedValue({ query: mockQuery, release: jest.fn() })
  }
})

jest.mock('../../src/services/master.service', () => ({
  generateFirstAccess: jest.fn()
}))

jest.mock('../../src/services/email/email.service', () => ({
  sendFirstAccessEmail: jest.fn()
}))

const kiwifyService = require('../../src/services/webhooks/kiwify.service')
const masterService = require('../../src/services/master.service')

function q(query) {
  if (typeof query === 'string') return query.toLowerCase()
  if (query && typeof query.text === 'string') return query.text.toLowerCase()
  return ''
}

function smartMock(handlers) {
  mockQuery.mockImplementation(async (query, ...args) => {
    const sql = q(query)
    for (const [pattern, result] of handlers) {
      if (sql.includes(pattern.toLowerCase())) {
        return typeof result === 'function' ? result(query, args) : result
      }
    }
    return { rows: [], rowCount: 0 }
  })
}

const TABLES_OK = {
  rows: [{
    payment_gateway_events: 'public.payment_gateway_events',
    invoices: 'public.invoices',
    subscription_events: 'public.subscription_events'
  }]
}

describe('Kiwify webhook — characterization', () => {
  const OLD_ENV = { ...process.env }

  beforeEach(() => {
    jest.clearAllMocks()
    mockQuery.mockReset()
    process.env.KIWIFY_WEBHOOK_SECRET = 'test_secret_value'
  })

  afterEach(() => {
    process.env = { ...OLD_ENV }
  })

  describe('authentication', () => {
    it('rejects invalid webhook secret with 401', async () => {
      await expect(kiwifyService.processKiwifyWebhook({}, { headers: {}, query: {} }))
        .rejects.toThrow('Webhook nao autorizado')
    })

    it('rejects when KIWIFY_WEBHOOK_SECRET is not configured with 500', async () => {
      delete process.env.KIWIFY_WEBHOOK_SECRET
      await expect(kiwifyService.processKiwifyWebhook({}, { headers: { 'x-kiwify-token': 'anything' }, query: {} }))
        .rejects.toThrow('KIWIFY_WEBHOOK_SECRET nao configurado')
    })
  })

  describe('duplicate event handling', () => {
    it('returns duplicate:true when ON CONFLICT triggers (already processed)', async () => {
      smartMock([
        ['to_regclass', TABLES_OK],
        ['insert into payment_gateway_events', { rows: [], rowCount: 0 }],
        ['from payment_gateway_events', {
          rows: [{
            id: 'existing-pge-1',
            processing_status: 'processed',
            company_id: null,
            subscription_id: null,
            created_at: new Date()
          }],
          rowCount: 1
        }],
      ])

      const result = await kiwifyService.processKiwifyWebhook(
        { event_id: 'dup-event-123' },
        { headers: { 'x-kiwify-token': 'test_secret_value' }, query: {} }
      )
      expect(result).toMatchObject({
        duplicate: true,
        eventId: 'dup-event-123',
        eventType: 'unknown'
      })
    })
  })

  describe('validation', () => {
    it('processes purchase event without customer email (validation does not match normalized event_type)', async () => {
      smartMock([
        ['to_regclass', TABLES_OK],
        ['insert into payment_gateway_events', { rows: [{ id: 'pge-1' }], rowCount: 1 }],
        ['insert into companies', { rows: [{ id: 'company-1', name: 'Nov', status: 'active', owner_user_id: null }], rowCount: 1 }],
        ['from subscriptions', { rows: [], rowCount: 0 }],
        ['insert into subscriptions', { rows: [{ id: 'sub-1' }], rowCount: 1 }],
        ['insert into invoices', { rows: [{ id: 'inv-1' }], rowCount: 1 }],
        ['update companies', { rows: [{ id: 'company-1', status: 'active' }], rowCount: 1 }],
        ['insert into subscription_events', { rows: [], rowCount: 1 }],
      ])

      const result = await kiwifyService.processKiwifyWebhook(
        { event_type: 'compra-aprovada' },
        { headers: { 'x-kiwify-token': 'test_secret_value' }, query: {} }
      )
      expect(result).toMatchObject({ processed: true, eventType: 'compra-aprovada' })
    })

    it('throws 503 when finance tables are missing', async () => {
      smartMock([['to_regclass', { rows: [{ payment_gateway_events: null, invoices: null, subscription_events: null }] }]])

      await expect(kiwifyService.processKiwifyWebhook(
        {},
        { headers: { 'x-kiwify-token': 'test_secret_value' }, query: {} }
      )).rejects.toThrow('Migrations financeiras nao aplicadas')
    })
  })

  describe('full processing', () => {
    it('processes valid webhook with empty payload (unknown event type)', async () => {
      smartMock([
        ['to_regclass', TABLES_OK],
        ['insert into payment_gateway_events', { rows: [{ id: 'pge-1' }], rowCount: 1 }],
        ['insert into companies', { rows: [{ id: 'company-1', name: 'Nova empresa', status: 'active', owner_user_id: null }], rowCount: 1 }],
        ['from subscriptions', { rows: [], rowCount: 0 }],
        ['insert into subscriptions', { rows: [{ id: 'sub-1' }], rowCount: 1 }],
        ['insert into invoices', { rows: [{ id: 'inv-1' }], rowCount: 1 }],
        ['update companies', { rows: [{ id: 'company-1', status: 'active' }], rowCount: 1 }],
        ['insert into subscription_events', { rows: [], rowCount: 1 }],
      ])

      const result = await kiwifyService.processKiwifyWebhook(
        {},
        { headers: { 'x-kiwify-token': 'test_secret_value' }, query: {} }
      )
      expect(result).toMatchObject({
        processed: true,
        eventId: expect.stringContaining('kiwify-'),
        eventType: 'unknown',
        companyId: 'company-1',
        subscriptionId: 'sub-1',
        invoiceId: 'inv-1'
      })
    })

    it('processes compra_aprovada — provisions and sends first access', async () => {
      smartMock([
        ['to_regclass', TABLES_OK],
        ['insert into payment_gateway_events', { rows: [{ id: 'pge-2' }], rowCount: 1 }],
        ['insert into companies', { rows: [{ id: 'company-2', name: 'New Co', status: 'active', owner_user_id: null }], rowCount: 1 }],
        ['from subscriptions', { rows: [], rowCount: 0 }],
        ['insert into subscriptions', { rows: [{ id: 'sub-2' }], rowCount: 1 }],
        ['insert into invoices', { rows: [{ id: 'inv-2' }], rowCount: 1 }],
        ['update companies', { rows: [{ id: 'company-2', status: 'active' }], rowCount: 1 }],
        ['insert into subscription_events', { rows: [], rowCount: 1 }],
      ])

      masterService.generateFirstAccess.mockResolvedValue({
        user: { id: 'user-1' },
        firstAccess: {
          user_email: 'customer@test.com',
          user_name: 'Customer',
          token: 'tok-abc',
          expires_at: new Date(Date.now() + 172800000)
        }
      })

      const result = await kiwifyService.processKiwifyWebhook({
        event_type: 'compra_aprovada',
        customer: { email: 'customer@test.com', name: 'Customer' },
        company_name: 'New Co',
        plan_name: 'Plano Mensal',
        module_key: 'barber',
        price: 49.90
      }, { headers: { 'x-kiwify-token': 'test_secret_value' }, query: {} })

      expect(result).toMatchObject({
        processed: true,
        companyId: 'company-2',
        subscriptionId: 'sub-2',
        invoiceId: 'inv-2'
      })
      expect(masterService.generateFirstAccess).toHaveBeenCalledTimes(1)
    })
  })
})
