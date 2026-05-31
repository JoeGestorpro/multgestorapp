const {
  BILLING_EVENTS,
  validateEventPayload,
  normalizeBillingStatus,
  eventTypeToDomainEvent,
  PaymentProvider,
  BillingProviderRegistry,
  billingProviderRegistry
} = require('../../src/shared/capabilities/billing')

describe('Billing Capability — contracts', () => {
  test('exports all expected domain events', () => {
    expect(BILLING_EVENTS).toMatchObject({
      PAYMENT_APPROVED: expect.objectContaining({ event_name: 'payment.approved' }),
      PAYMENT_FAILED: expect.objectContaining({ event_name: 'payment.failed' }),
      SUBSCRIPTION_CREATED: expect.objectContaining({ event_name: 'subscription.created' }),
      SUBSCRIPTION_RENEWED: expect.objectContaining({ event_name: 'subscription.renewed' }),
      SUBSCRIPTION_UPDATED: expect.objectContaining({ event_name: 'subscription.updated' }),
      SUBSCRIPTION_CANCELED: expect.objectContaining({ event_name: 'subscription.canceled' }),
      SUBSCRIPTION_REFUNDED: expect.objectContaining({ event_name: 'subscription.refunded' }),
      SUBSCRIPTION_PAST_DUE: expect.objectContaining({ event_name: 'subscription.past_due' }),
      CHARGEBACK_RECEIVED: expect.objectContaining({ event_name: 'subscription.chargeback' })
    })
  })

  test('each event contract has required fields', () => {
    for (const [key, contract] of Object.entries(BILLING_EVENTS)) {
      expect(contract.event_name).toBeDefined()
      expect(contract.description).toBeDefined()
      expect(contract.aggregate_type).toBeDefined()
      expect(Array.isArray(contract.required_fields)).toBe(true)
      expect(contract.required_fields.length).toBeGreaterThan(0)
    }
  })

  test('validateEventPayload passes for valid payload', () => {
    const payload = {
      provider: 'kiwify',
      event_id: 'evt-1',
      gateway_event_type: 'compra_aprovada',
      company: { id: 'c-1' },
      customer: { email: 'test@test.com' },
      finance: { price: 49.90 }
    }
    expect(() => validateEventPayload(BILLING_EVENTS.PAYMENT_APPROVED, payload)).not.toThrow()
  })

  test('validateEventPayload throws for missing required fields', () => {
    expect(() => validateEventPayload(BILLING_EVENTS.PAYMENT_APPROVED, {}))
      .toThrow('Missing required fields for payment.approved')
  })
})

describe('Billing Capability — normalizeBillingStatus', () => {
  const cases = [
    { event: 'compra-aprovada', sub: 'active', inv: 'paid' },
    { event: 'compra_aprovada', sub: 'active', inv: 'paid' },
    { event: 'purchase-approved', sub: 'active', inv: 'paid' },
    { event: 'purchase_approved', sub: 'active', inv: 'paid' },
    { event: 'subscription-renewed', sub: 'active', inv: 'paid' },
    { event: 'subscription_renewed', sub: 'active', inv: 'paid' },
    { event: 'renewed', sub: 'active', inv: 'paid' },
    { event: 'subscription-late', sub: 'late', inv: 'overdue' },
    { event: 'subscription_late', sub: 'late', inv: 'overdue' },
    { event: 'late', sub: 'late', inv: 'overdue' },
    { event: 'past-due', sub: 'late', inv: 'overdue' },
    { event: 'past_due', sub: 'late', inv: 'overdue' },
    { event: 'overdue', sub: 'late', inv: 'overdue' },
    { event: 'subscription-canceled', sub: 'canceled', inv: 'canceled' },
    { event: 'subscription_canceled', sub: 'canceled', inv: 'canceled' },
    { event: 'canceled', sub: 'canceled', inv: 'canceled' },
    { event: 'compra-reembolsada', sub: 'refunded', inv: 'refunded' },
    { event: 'compra_reembolsada', sub: 'refunded', inv: 'refunded' },
    { event: 'refunded', sub: 'refunded', inv: 'refunded' },
    { event: 'chargeback', sub: 'suspended', inv: 'chargeback' },
    { event: 'unknown', sub: 'pending', inv: 'pending' },
    { event: '', sub: 'pending', inv: 'pending' },
  ]

  test.each(cases)('$event -> sub:$sub, inv:$inv', ({ event, sub, inv }) => {
    const result = normalizeBillingStatus(event)
    expect(result.subscriptionStatus).toBe(sub)
    expect(result.invoiceStatus).toBe(inv)
  })
})

describe('Billing Capability — eventTypeToDomainEvent', () => {
  const cases = [
    { event: 'compra-aprovada', domain: 'payment.approved' },
    { event: 'compra_aprovada', domain: 'payment.approved' },
    { event: 'purchase-approved', domain: 'payment.approved' },
    { event: 'purchase_approved', domain: 'payment.approved' },
    { event: 'subscription-renewed', domain: 'subscription.renewed' },
    { event: 'subscription_renewed', domain: 'subscription.renewed' },
    { event: 'renewed', domain: 'subscription.renewed' },
    { event: 'subscription-late', domain: 'subscription.past_due' },
    { event: 'subscription_late', domain: 'subscription.past_due' },
    { event: 'late', domain: 'subscription.past_due' },
    { event: 'past-due', domain: 'subscription.past_due' },
    { event: 'subscription-canceled', domain: 'subscription.canceled' },
    { event: 'subscription_canceled', domain: 'subscription.canceled' },
    { event: 'canceled', domain: 'subscription.canceled' },
    { event: 'compra-reembolsada', domain: 'subscription.refunded' },
    { event: 'compra_reembolsada', domain: 'subscription.refunded' },
    { event: 'refunded', domain: 'subscription.refunded' },
    { event: 'chargeback', domain: 'subscription.chargeback' },
    { event: 'unknown', domain: 'payment.failed' },
    { event: '', domain: 'payment.failed' },
  ]

  test.each(cases)('$event -> $domain', ({ event, domain }) => {
    expect(eventTypeToDomainEvent(event)).toBe(domain)
  })
})

describe('Billing Capability — PaymentProvider', () => {
  class TestProvider extends PaymentProvider {
    getProviderName() { return 'test' }
    verifySignature() { return true }
    parse(req) { return req?.body || {} }
    normalize(raw) { return { provider: 'test', raw } }
  }

  test('base class throws on unimplemented methods', () => {
    const base = new PaymentProvider()
    expect(() => base.getProviderName()).toThrow(/must implement/)
    expect(() => base.verifySignature()).toThrow(/must implement/)
    expect(() => base.parse()).toThrow(/must implement/)
    expect(() => base.normalize()).toThrow(/must implement/)
  })

  test('subclass can be instantiated and used', () => {
    const provider = new TestProvider()
    expect(provider.getProviderName()).toBe('test')
    expect(provider.verifySignature({})).toBe(true)
    expect(provider.parse({ body: { foo: 1 } })).toEqual({ foo: 1 })
    expect(provider.normalize({ foo: 1 })).toEqual({ provider: 'test', raw: { foo: 1 } })
  })
})

describe('Billing Capability — BillingProviderRegistry', () => {
  beforeEach(() => {
    while (billingProviderRegistry.getRegisteredProviders().length) {
      billingProviderRegistry.providers.clear()
    }
  })

  class FakeProvider extends PaymentProvider {
    getProviderName() { return 'fake' }
    verifySignature() { return true }
    parse(req) { return {} }
    normalize() { return {} }
  }

  test('registers and resolves providers by gateway name', () => {
    billingProviderRegistry.register('fake', FakeProvider)
    expect(billingProviderRegistry.hasProvider('fake')).toBe(true)
    expect(billingProviderRegistry.getRegisteredProviders()).toEqual(['fake'])

    const instance = billingProviderRegistry.resolve('fake')
    expect(instance).toBeInstanceOf(FakeProvider)
    expect(instance.getProviderName()).toBe('fake')
  })

  test('get returns the class (not instance)', () => {
    billingProviderRegistry.register('fake', FakeProvider)
    expect(billingProviderRegistry.get('fake')).toBe(FakeProvider)
  })

  test('throws on duplicate registration', () => {
    billingProviderRegistry.register('fake', FakeProvider)
    expect(() => billingProviderRegistry.register('fake', FakeProvider))
      .toThrow(/already registered/)
  })

  test('resolve throws for unregistered provider', () => {
    expect(() => billingProviderRegistry.resolve('nonexistent'))
      .toThrow(/not found/)
  })

  test('get returns null for unregistered provider', () => {
    expect(billingProviderRegistry.get('nonexistent')).toBeNull()
  })

  test('getRegisteredProviders returns empty array initially', () => {
    const empty = new BillingProviderRegistry()
    expect(empty.getRegisteredProviders()).toEqual([])
  })
})
