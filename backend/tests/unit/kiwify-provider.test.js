const { KiwifyProvider, extractEvent, extractCustomer, extractCompany, extractFinancialPayload, resolveWebhookSecret, normalizeText, normalizeEmail, normalizeSlug } = require('../../src/shared/capabilities/billing/providers/kiwify.provider')

describe('KiwifyProvider — normalize helpers', () => {
  const provider = new KiwifyProvider()

  test('getProviderName returns kiwify', () => {
    expect(provider.getProviderName()).toBe('kiwify')
  })

  test('normalizeText trims and defaults to empty string', () => {
    expect(normalizeText('  hello  ')).toBe('hello')
    expect(normalizeText(null)).toBe('')
    expect(normalizeText(undefined)).toBe('')
    expect(normalizeText('')).toBe('')
  })

  test('normalizeEmail lowercases and trims', () => {
    expect(normalizeEmail('  TEST@Example.COM  ')).toBe('test@example.com')
    expect(normalizeEmail(null)).toBe('')
  })

  test('normalizeSlug converts to kebab-case', () => {
    expect(normalizeSlug('  Hello World  ')).toBe('hello-world')
    expect(normalizeSlug('compra_aprovada')).toBe('compra-aprovada')
    expect(normalizeSlug('  com acentuação ')).toBe('com-acentuacao')
    expect(normalizeSlug(null)).toBe('')
    expect(normalizeSlug('')).toBe('')
  })
})

describe('KiwifyProvider — verifySignature', () => {
  const OLD_ENV = { ...process.env }
  const provider = new KiwifyProvider()

  beforeEach(() => {
    process.env.KIWIFY_WEBHOOK_SECRET = 'test_secret'
  })

  afterEach(() => {
    process.env = { ...OLD_ENV }
  })

  test('returns true for valid token in header', () => {
    const req = { headers: { 'x-kiwify-token': 'test_secret' }, query: {} }
    expect(provider.verifySignature(req)).toBe(true)
  })

  test('returns true for valid token in query', () => {
    const req = { headers: {}, query: { token: 'test_secret' } }
    expect(provider.verifySignature(req)).toBe(true)
  })

  test('returns false for invalid token', () => {
    const req = { headers: { 'x-kiwify-token': 'wrong' }, query: {} }
    expect(provider.verifySignature(req)).toBe(false)
  })

  test('returns false for missing token', () => {
    const req = { headers: {}, query: {} }
    expect(provider.verifySignature(req)).toBe(false)
  })

  test('throws when KIWIFY_WEBHOOK_SECRET is not configured', () => {
    delete process.env.KIWIFY_WEBHOOK_SECRET
    expect(() => provider.verifySignature({ headers: {}, query: {} }))
      .toThrow('KIWIFY_WEBHOOK_SECRET nao configurado')
  })

  test('accepts bearer token', () => {
    const req = { headers: { authorization: 'Bearer test_secret' }, query: {} }
    expect(provider.verifySignature(req)).toBe(true)
  })

  test('accepts x-webhook-token', () => {
    const req = { headers: { 'x-webhook-token': 'test_secret' }, query: {} }
    expect(provider.verifySignature(req)).toBe(true)
  })

  test('accepts x-kiwify-signature', () => {
    const req = { headers: { 'x-kiwify-signature': 'test_secret' }, query: {} }
    expect(provider.verifySignature(req)).toBe(true)
  })
})

describe('KiwifyProvider — extractEvent', () => {
  test('extracts event_type from payload', () => {
    expect(extractEvent({ event_type: 'compra_aprovada' }).eventType).toBe('compra-aprovada')
    expect(extractEvent({ event: 'subscription_canceled' }).eventType).toBe('subscription-canceled')
    expect(extractEvent({ type: 'chargeback' }).eventType).toBe('chargeback')
    expect(extractEvent({ status: 'refunded' }).eventType).toBe('refunded')
  })

  test('uses provided event_id', () => {
    const result = extractEvent({ event_id: 'my-id-123', event_type: 'test' })
    expect(result.eventId).toBe('my-id-123')
    expect(result.eventType).toBe('test')
  })

  test('falls back to other id fields', () => {
    expect(extractEvent({ id: 'id-field' }).eventId).toBe('id-field')
    expect(extractEvent({ webhook_id: 'wh-id' }).eventId).toBe('wh-id')
    expect(extractEvent({ transaction_id: 'tx-id' }).eventId).toBe('tx-id')
    expect(extractEvent({ invoice_id: 'inv-id' }).eventId).toBe('inv-id')
    expect(extractEvent({ order_id: 'order-id' }).eventId).toBe('order-id')
  })

  test('generates kiwify- prefixed id when no id available', () => {
    const result = extractEvent({})
    expect(result.eventId).toMatch(/^kiwify-\d+-\w+$/)
    expect(result.eventType).toBe('unknown')
  })
})

describe('KiwifyProvider — extractCustomer', () => {
  test('extracts from customer object', () => {
    const result = extractCustomer({ customer: { email: 'test@test.com', name: 'John', document: '123', phone: '999' } })
    expect(result.email).toBe('test@test.com')
    expect(result.name).toBe('John')
    expect(result.document).toBe('123')
    expect(result.phone).toBe('999')
  })

  test('extracts from top-level fields', () => {
    const result = extractCustomer({ customer_email: 'TOP@TEST.COM', customer_name: 'Top', customer_document: '456', customer_phone: '888' })
    expect(result.email).toBe('top@test.com')
    expect(result.name).toBe('Top')
    expect(result.document).toBe('456')
    expect(result.phone).toBe('888')
  })

  test('falls back to buyer and client', () => {
    expect(extractCustomer({ buyer: { email: 'buyer@t.com' } }).email).toBe('buyer@t.com')
    expect(extractCustomer({ client: { email: 'client@t.com' } }).email).toBe('client@t.com')
  })

  test('defaults name to Cliente Kiwify', () => {
    expect(extractCustomer({}).name).toBe('Cliente Kiwify')
    expect(extractCustomer({}).email).toBe('')
  })
})

describe('KiwifyProvider — extractCompany', () => {
  test('extracts company_name', () => {
    const result = extractCompany({ company_name: 'Minha Empresa' }, {})
    expect(result.name).toBe('Minha Empresa')
  })

  test('falls back to tenant_name, business_name, customer.name', () => {
    expect(extractCompany({ tenant_name: 'Tenant' }, {}).name).toBe('Tenant')
    expect(extractCompany({ business_name: 'Biz' }, {}).name).toBe('Biz')
    expect(extractCompany({}, { name: 'Customer Name' }).name).toBe('Customer Name')
  })

  test('defaults to Nova empresa', () => {
    expect(extractCompany({}, {}).name).toBe('Nova empresa')
  })

  test('inherits email and document from customer', () => {
    const customer = { email: 'cust@t.com', document: '123', phone: '999' }
    const result = extractCompany({}, customer)
    expect(result.email).toBe('cust@t.com')
    expect(result.document).toBe('123')
    expect(result.phone).toBe('999')
  })
})

describe('KiwifyProvider — extractFinancialPayload', () => {
  test('extracts plan info', () => {
    const result = extractFinancialPayload({ plan_name: 'Plano Ouro', price: 99.90, billing_cycle: 'monthly' })
    expect(result.planName).toBe('Plano Ouro')
    expect(result.price).toBe(99.90)
    expect(result.billingCycle).toBe('monthly')
  })

  test('falls back to other price fields', () => {
    expect(extractFinancialPayload({ amount: 50 }).price).toBe(50)
    expect(extractFinancialPayload({ total_amount: 150 }).price).toBe(150)
    expect(extractFinancialPayload({}).price).toBe(0)
  })

  test('normalizes billing cycle', () => {
    expect(extractFinancialPayload({ recurrence: 'Mensal' }).billingCycle).toBe('mensal')
    expect(extractFinancialPayload({ subscription_cycle: 'SEMESTRAL' }).billingCycle).toBe('semestral')
  })

  test('defaults to monthly for empty cycle', () => {
    expect(extractFinancialPayload({}).billingCycle).toBe('monthly')
  })

  test('extracts module key', () => {
    expect(extractFinancialPayload({ module_key: 'barber' }).moduleKey).toBe('barber')
    expect(extractFinancialPayload({ product_key: 'product-barber' }).moduleKey).toBe('product-barber')
    expect(extractFinancialPayload({}).moduleKey).toBe('')
  })

  test('extracts optional date fields', () => {
    const result = extractFinancialPayload({
      paid_at: '2025-01-01',
      due_at: '2025-02-01',
      next_due_date: '2025-03-01'
    })
    expect(result.paidAt).toBe('2025-01-01')
    expect(result.dueAt).toBe('2025-02-01')
    expect(result.currentPeriodEnd).toBe('2025-03-01')
  })

  test('extracts external ids', () => {
    const result = extractFinancialPayload({
      invoice_id: 'inv-1',
      subscription_id: 'sub-1',
      customer_id: 'cust-1'
    })
    expect(result.invoiceId).toBe('inv-1')
    expect(result.subscriptionExternalId).toBe('sub-1')
    expect(result.customerExternalId).toBe('cust-1')
  })
})

describe('KiwifyProvider — normalize (full integration)', () => {
  const provider = new KiwifyProvider()

  test('normalizes a complete compra_aprovada payload', () => {
    const payload = {
      event_type: 'compra_aprovada',
      event_id: 'evt-001',
      customer: { email: 'john@test.com', name: 'John Doe' },
      company_name: 'John Corp',
      plan_name: 'Gold Plan',
      module_key: 'barber',
      price: 199.90,
      billing_cycle: 'monthly'
    }

    const result = provider.normalize(payload)
    expect(result.provider).toBe('kiwify')
    expect(result.event_id).toBe('evt-001')
    expect(result.event_type).toBe('compra-aprovada')
    expect(result.status).toEqual({ subscriptionStatus: 'active', invoiceStatus: 'paid' })
    expect(result.customer.email).toBe('john@test.com')
    expect(result.company.name).toBe('John Corp')
    expect(result.finance.planName).toBe('Gold Plan')
    expect(result.finance.price).toBe(199.90)
    expect(result.finance.moduleKey).toBe('barber')
    expect(result.raw).toEqual(payload)
  })

  test('normalizes a refund event', () => {
    const payload = {
      event_type: 'compra_reembolsada',
      event_id: 'evt-002',
      customer: { email: 'jane@test.com' },
      price: 50
    }

    const result = provider.normalize(payload)
    expect(result.event_type).toBe('compra-reembolsada')
    expect(result.status).toEqual({ subscriptionStatus: 'refunded', invoiceStatus: 'refunded' })
  })

  test('normalizes chargeback event', () => {
    const payload = { event_type: 'chargeback', event_id: 'evt-003' }
    const result = provider.normalize(payload)
    expect(result.status).toEqual({ subscriptionStatus: 'suspended', invoiceStatus: 'chargeback' })
  })

  test('normalizes unknown event type', () => {
    const result = provider.normalize({})
    expect(result.event_type).toBe('unknown')
    expect(result.status).toEqual({ subscriptionStatus: 'pending', invoiceStatus: 'pending' })
  })
})

describe('KiwifyProvider — parse', () => {
  const provider = new KiwifyProvider()

  test('returns req.body', () => {
    expect(provider.parse({ body: { foo: 1 } })).toEqual({ foo: 1 })
  })

  test('returns empty object for missing body', () => {
    expect(provider.parse({})).toEqual({})
  })
})
