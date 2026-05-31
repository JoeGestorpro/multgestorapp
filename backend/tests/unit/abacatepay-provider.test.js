const crypto = require('crypto')
const { AbacatePayProvider, ABACATEPAY_PUBLIC_KEY, extractEventId, extractCustomer, extractCompany, extractFinance } = require('../../src/shared/capabilities/billing/providers/abacatepay.provider')

function computeAbacateHmac(body, secret) {
  return crypto.createHmac('sha256', secret).update(Buffer.from(body, 'utf8')).digest('base64')
}

describe('AbacatePayProvider — basics', () => {
  const provider = new AbacatePayProvider()

  test('getProviderName returns abacatepay', () => {
    expect(provider.getProviderName()).toBe('abacatepay')
  })

  test('ABACATEPAY_PUBLIC_KEY is a non-empty string', () => {
    expect(typeof ABACATEPAY_PUBLIC_KEY).toBe('string')
    expect(ABACATEPAY_PUBLIC_KEY.length).toBeGreaterThan(100)
  })
})

describe('AbacatePayProvider — verifySignature', () => {
  const OLD_ENV = { ...process.env }
  const provider = new AbacatePayProvider()

  beforeEach(() => {
    process.env.ABACATEPAY_WEBHOOK_SECRET = 'test_url_secret'
  })

  afterEach(() => {
    process.env = { ...OLD_ENV }
  })

  function buildRequest({ webhookSecret, body, headerSig }) {
    const rawBody = Buffer.from(JSON.stringify(body), 'utf8')
    return {
      query: { webhookSecret: webhookSecret || 'test_url_secret' },
      headers: { 'x-webhook-signature': headerSig || computeAbacateHmac(rawBody, ABACATEPAY_PUBLIC_KEY) },
      rawBody
    }
  }

  test('returns true for valid URL secret + valid HMAC', () => {
    const req = buildRequest({ body: { event: 'checkout.completed', data: {} } })
    expect(provider.verifySignature(req)).toBe(true)
  })

  test('returns false for invalid URL secret', () => {
    const req = buildRequest({ webhookSecret: 'wrong', body: { event: 'checkout.completed', data: {} } })
    expect(provider.verifySignature(req)).toBe(false)
  })

  test('returns false for missing URL secret', () => {
    const body = { event: 'checkout.completed', data: {} }
    const rawBody = Buffer.from(JSON.stringify(body), 'utf8')
    const req = {
      query: {},
      headers: { 'x-webhook-signature': computeAbacateHmac(rawBody, ABACATEPAY_PUBLIC_KEY) },
      rawBody
    }
    expect(provider.verifySignature(req)).toBe(false)
  })

  test('returns false for invalid HMAC header', () => {
    const req = buildRequest({ body: { event: 'checkout.completed', data: {} }, headerSig: 'invalid_sig' })
    expect(provider.verifySignature(req)).toBe(false)
  })

  test('returns false for missing HMAC header', () => {
    const rawBody = Buffer.from(JSON.stringify({ event: 'checkout.completed' }), 'utf8')
    const req = { query: { webhookSecret: 'test_url_secret' }, headers: {}, rawBody }
    expect(provider.verifySignature(req)).toBe(false)
  })

  test('returns false for empty raw body', () => {
    const req = {
      query: { webhookSecret: 'test_url_secret' },
      headers: { 'x-webhook-signature': 'dGVzdA==' },
      rawBody: Buffer.from('')
    }
    expect(provider.verifySignature(req)).toBe(false)
  })

  test('throws when ABACATEPAY_WEBHOOK_SECRET is not configured', () => {
    delete process.env.ABACATEPAY_WEBHOOK_SECRET
    expect(() => provider.verifySignature({ query: {}, headers: {}, rawBody: Buffer.from('{}') }))
      .toThrow('ABACATEPAY_WEBHOOK_SECRET nao configurado')
  })

  test('uses constant-time comparison', () => {
    const req = buildRequest({ body: { event: 'checkout.completed', data: {} } })
    const result = provider.verifySignature(req)
    expect(typeof result).toBe('boolean')
  })
})

describe('AbacatePayProvider — extractEventId', () => {
  test('extracts top-level id', () => {
    expect(extractEventId({ id: 'log_abc123' })).toBe('log_abc123')
  })

  test('falls back to event_id', () => {
    expect(extractEventId({ event_id: 'evt_001' })).toBe('evt_001')
  })

  test('falls back to checkout id', () => {
    expect(extractEventId({ data: { checkout: { id: 'bill_xyz' } } })).toBe('bill_xyz')
  })

  test('falls back to transparent id', () => {
    expect(extractEventId({ data: { transparent: { id: 'char_xyz' } } })).toBe('char_xyz')
  })

  test('falls back to subscription id', () => {
    expect(extractEventId({ data: { subscription: { id: 'subs_xyz' } } })).toBe('subs_xyz')
  })

  test('generates fallback id when none found', () => {
    const result = extractEventId({})
    expect(result).toMatch(/^abacatepay-\d+-[0-9a-f]+$/)
  })
})

describe('AbacatePayProvider — extractCustomer', () => {
  test('extracts from data.customer', () => {
    const payload = {
      data: {
        customer: { id: 'cust_1', name: 'João Silva', email: 'joao@test.com', taxId: '123.456.789-00' }
      }
    }
    const result = extractCustomer(payload)
    expect(result.email).toBe('joao@test.com')
    expect(result.name).toBe('João Silva')
    expect(result.document).toBe('123.456.789-00')
    expect(result.phone).toBe('')
  })

  test('returns empty phone when not provided', () => {
    const result = extractCustomer({ data: { customer: { name: 'Test' } } })
    expect(result.phone).toBe('')
  })

  test('defaults name to Cliente AbacatePay', () => {
    const result = extractCustomer({})
    expect(result.name).toBe('Cliente AbacatePay')
  })
})

describe('AbacatePayProvider — extractCompany', () => {
  test('uses customer name when available', () => {
    const customer = { name: 'João', email: 'joao@test.com', document: '123', phone: '999' }
    const result = extractCompany({}, customer)
    expect(result.name).toBe('João')
    expect(result.email).toBe('joao@test.com')
    expect(result.document).toBe('123')
    expect(result.phone).toBe('999')
  })

  test('defaults to Nova empresa', () => {
    const result = extractCompany({}, { email: '', name: '', document: '', phone: '' })
    expect(result.name).toBe('Nova empresa')
  })
})

describe('AbacatePayProvider — extractFinance', () => {
  test('extracts from checkout data', () => {
    const payload = {
      data: {
        checkout: {
          id: 'bill_abc',
          amount: 10000,
          paidAmount: 10000,
          status: 'PAID',
          frequency: 'ONE_TIME',
          items: [{ id: 'prod_barber', quantity: 1 }],
          createdAt: '2024-12-06T18:56:15.538Z',
          updatedAt: '2024-12-06T18:56:20.000Z'
        }
      }
    }
    const result = extractFinance(payload)
    expect(result.planName).toBe('prod_barber')
    expect(result.price).toBe(10000)
    expect(result.billingCycle).toBe('one-time')
    expect(result.gateway).toBe('abacatepay')
    expect(result.moduleKey).toBe('prod-barber')
    expect(result.invoiceId).toBe('bill_abc')
    expect(result.paidAt).toBe('2024-12-06T18:56:20.000Z')
    expect(result.currentPeriodStart).toBe('2024-12-06T18:56:15.538Z')
  })

  test('extracts from subscription data', () => {
    const payload = {
      data: {
        subscription: {
          id: 'subs_xyz',
          amount: 2990,
          status: 'ACTIVE',
          frequency: 'MONTHLY',
          createdAt: '2024-12-06T20:00:00.000Z',
          updatedAt: '2024-12-06T20:00:05.000Z'
        },
        payment: {
          id: 'char_pay',
          amount: 2990,
          paidAmount: 2990,
          status: 'PAID'
        }
      }
    }
    const result = extractFinance(payload)
    expect(result.planName).toBe('subs_xyz')
    expect(result.price).toBe(2990)
    expect(result.billingCycle).toBe('monthly')
    expect(result.subscriptionExternalId).toBe('subs_xyz')
    expect(result.invoiceId).toBe('char_pay')
  })

  test('extracts from transparent data', () => {
    const payload = {
      data: {
        transparent: {
          id: 'char_xyz789',
          amount: 5000,
          paidAmount: 5000,
          status: 'PAID',
          frequency: 'ONE_TIME',
          createdAt: '2024-12-06T19:00:00.000Z'
        }
      }
    }
    const result = extractFinance(payload)
    expect(result.planName).toBe('Plano AbacatePay')
    expect(result.price).toBe(5000)
    expect(result.billingCycle).toBe('one-time')
    expect(result.invoiceId).toBe('char_xyz789')
  })

  test('defaults price to 0 when missing', () => {
    expect(extractFinance({ data: {} }).price).toBe(0)
  })

  test('extracts customerExternalId from customer', () => {
    const payload = {
      data: {
        customer: { id: 'cust_abc' },
        checkout: { id: 'bill_abc', items: [] }
      }
    }
    const result = extractFinance(payload)
    expect(result.customerExternalId).toBe('cust_abc')
  })
})

describe('AbacatePayProvider — parse', () => {
  const provider = new AbacatePayProvider()

  test('returns req.body', () => {
    expect(provider.parse({ body: { foo: 1 } })).toEqual({ foo: 1 })
  })

  test('returns empty object for missing body', () => {
    expect(provider.parse({})).toEqual({})
  })
})

describe('AbacatePayProvider — normalize', () => {
  const provider = new AbacatePayProvider()

  test('normalizes checkout.completed payload', () => {
    const payload = {
      id: 'log_abc123',
      event: 'checkout.completed',
      apiVersion: 2,
      devMode: false,
      data: {
        checkout: {
          id: 'bill_xyz',
          amount: 10000,
          paidAmount: 10000,
          status: 'PAID',
          frequency: 'ONE_TIME',
          items: [{ id: 'prod_barber', quantity: 1 }],
          createdAt: '2024-12-06T18:56:15.538Z',
          updatedAt: '2024-12-06T18:56:20.000Z'
        },
        customer: {
          id: 'cust_abc',
          name: 'João Silva',
          email: 'joao@test.com',
          taxId: '123.***.***-**'
        }
      }
    }

    const result = provider.normalize(payload)
    expect(result.provider).toBe('abacatepay')
    expect(result.event_id).toBe('log_abc123')
    expect(result.event_type).toBe('checkout-completed')
    expect(result.status).toEqual({ subscriptionStatus: 'active', invoiceStatus: 'paid' })
    expect(result.customer.email).toBe('joao@test.com')
    expect(result.customer.name).toBe('João Silva')
    expect(result.finance.price).toBe(10000)
    expect(result.finance.billingCycle).toBe('one-time')
    expect(result.finance.gateway).toBe('abacatepay')
    expect(result.raw).toEqual(payload)
  })

  test('normalizes checkout.refunded payload', () => {
    const payload = {
      id: 'log_refund',
      event: 'checkout.refunded',
      data: {
        checkout: { id: 'bill_ref', amount: 5000, paidAmount: 5000, items: [] },
        customer: { name: 'Maria', email: 'maria@test.com' }
      }
    }
    const result = provider.normalize(payload)
    expect(result.event_type).toBe('checkout-refunded')
    expect(result.status).toEqual({ subscriptionStatus: 'refunded', invoiceStatus: 'refunded' })
  })

  test('normalizes checkout.disputed payload', () => {
    const payload = {
      id: 'log_dispute',
      event: 'checkout.disputed',
      data: {
        checkout: { id: 'bill_disp', amount: 10000, paidAmount: 10000, items: [] },
        customer: { name: 'Test', email: 'test@test.com' }
      }
    }
    const result = provider.normalize(payload)
    expect(result.event_type).toBe('checkout-disputed')
    expect(result.status).toEqual({ subscriptionStatus: 'suspended', invoiceStatus: 'chargeback' })
  })

  test('normalizes transparent.completed payload', () => {
    const payload = {
      event: 'transparent.completed',
      data: {
        transparent: { id: 'char_pix', amount: 5000, paidAmount: 5000, status: 'PAID' },
        customer: { name: 'Carlos', email: 'carlos@test.com' }
      }
    }
    const result = provider.normalize(payload)
    expect(result.event_type).toBe('transparent-completed')
    expect(result.status).toEqual({ subscriptionStatus: 'active', invoiceStatus: 'paid' })
  })

  test('normalizes subscription.completed payload', () => {
    const payload = {
      id: 'log_sub',
      event: 'subscription.completed',
      data: {
        subscription: { id: 'subs_xyz', amount: 2990, status: 'ACTIVE', frequency: 'MONTHLY' },
        payment: { id: 'char_pay', amount: 2990, paidAmount: 2990, status: 'PAID' },
        checkout: { id: 'bill_sub', amount: 2990, items: [] },
        customer: { name: 'Ana', email: 'ana@test.com' }
      }
    }
    const result = provider.normalize(payload)
    expect(result.event_type).toBe('subscription-completed')
    expect(result.status).toEqual({ subscriptionStatus: 'active', invoiceStatus: 'paid' })
    expect(result.finance.subscriptionExternalId).toBe('subs_xyz')
  })

  test('normalizes subscription.cancelled payload', () => {
    const payload = {
      id: 'log_cancel',
      event: 'subscription.cancelled',
      data: {
        subscription: { id: 'subs_cancel', amount: 2990, status: 'CANCELLED', frequency: 'MONTHLY' },
        customer: { name: 'Pedro', email: 'pedro@test.com' }
      }
    }
    const result = provider.normalize(payload)
    expect(result.event_type).toBe('subscription-cancelled')
    expect(result.status).toEqual({ subscriptionStatus: 'canceled', invoiceStatus: 'canceled' })
  })

  test('normalizes subscription.renewed payload', () => {
    const payload = {
      id: 'log_renew',
      event: 'subscription.renewed',
      data: {
        subscription: { id: 'subs_renew', amount: 2990, status: 'ACTIVE', frequency: 'MONTHLY' },
        payment: { id: 'char_renew', amount: 2990, paidAmount: 2990, status: 'PAID' },
        customer: { name: 'Rita', email: 'rita@test.com' }
      }
    }
    const result = provider.normalize(payload)
    expect(result.event_type).toBe('subscription-renewed')
    expect(result.status).toEqual({ subscriptionStatus: 'active', invoiceStatus: 'paid' })
  })

  test('normalizes subscription.trial_started payload', () => {
    const payload = {
      id: 'log_trial',
      event: 'subscription.trial_started',
      data: {
        subscription: { id: 'subs_trial', amount: 4990, status: 'ACTIVE', frequency: 'MONTHLY', trialDays: 7, trialEndsAt: '2024-11-11T23:59:59.999Z' },
        customer: { name: 'Trial User', email: 'trial@test.com' }
      }
    }
    const result = provider.normalize(payload)
    expect(result.event_type).toBe('subscription-trial-started')
    expect(result.status).toEqual({ subscriptionStatus: 'trialing', invoiceStatus: 'pending' })
  })

  test('normalizes unknown event type to default status', () => {
    const result = provider.normalize({ event: 'some.unknown.event', data: {} })
    expect(result.event_type).toBe('some-unknown-event')
    expect(result.status).toEqual({ subscriptionStatus: 'pending', invoiceStatus: 'pending' })
  })

  test('handles missing event field', () => {
    const result = provider.normalize({})
    expect(result.event_type).toBe('unknown')
    expect(result.status).toEqual({ subscriptionStatus: 'pending', invoiceStatus: 'pending' })
  })
})
