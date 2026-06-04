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

const { handleBillingProvisioning } = require('../../src/integrations/consumers/billing-provisioning.consumer')
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

describe('Billing provisioning consumer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockQuery.mockReset()
  })

  const eventPayload = {
    payment_gateway_event_id: 'pge-1',
    provider: 'kiwify',
    event_id: 'evt-001',
    event_type: 'compra-aprovada',
    status: { subscriptionStatus: 'active', invoiceStatus: 'paid' },
    company: { name: 'New Co', email: 'admin@newco.com', document: '', phone: '' },
    customer: { email: 'customer@test.com', name: 'Customer', document: '', phone: '' },
    finance: { planName: 'Gold', billingCycle: 'monthly', gateway: 'kiwify', moduleKey: 'barber', price: 99.90 }
  }

  it('provisions company, subscription, invoice, module and sends first access', async () => {
    smartMock([
      ['from payment_gateway_events', { rows: [{ processing_status: 'pending' }], rowCount: 1 }],
      ['insert into companies', { rows: [{ id: 'company-1', name: 'New Co', status: 'active', owner_user_id: null }], rowCount: 1 }],
      ['from modules', { rows: [{ id: 'mod-1', slug: 'barber' }], rowCount: 1 }],
      ['from plans', { rows: [{ id: 'plan-1', name: 'Gold' }], rowCount: 1 }],
      ['from subscriptions', { rows: [], rowCount: 0 }],
      ['insert into subscriptions', { rows: [{ id: 'sub-1' }], rowCount: 1 }],
      ['insert into invoices', { rows: [{ id: 'inv-1' }], rowCount: 1 }],
      ['from company_modules', { rows: [], rowCount: 0 }],
      ['insert into company_modules', { rows: [{ id: 'cm-1' }], rowCount: 1 }],
      ['update companies', { rows: [{ id: 'company-1', status: 'active' }], rowCount: 1 }],
      ['insert into subscription_events', { rows: [], rowCount: 1 }],
      ['set processing_status', { rows: [{ id: 'pge-1', processing_status: 'processed' }], rowCount: 1 }],
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

    await handleBillingProvisioning(eventPayload, {})

    expect(masterService.generateFirstAccess).toHaveBeenCalledTimes(1)
  })

  it('skips provisioning when event is already processed', async () => {
    smartMock([
      ['from payment_gateway_events', { rows: [{ processing_status: 'processed' }], rowCount: 1 }],
    ])

    await handleBillingProvisioning(eventPayload, {})

    expect(mockQuery.mock.calls.length).toBe(3)
  })

  it('skips provisioning when payment_gateway_event is not found', async () => {
    smartMock([
      ['from payment_gateway_events', { rows: [], rowCount: 0 }],
    ])

    await handleBillingProvisioning(eventPayload, {})

    expect(mockQuery.mock.calls.length).toBe(3)
  })
})
