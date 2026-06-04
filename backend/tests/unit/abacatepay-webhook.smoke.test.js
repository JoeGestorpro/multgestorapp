const crypto = require('crypto')
const { AbacatePayProvider, ABACATEPAY_PUBLIC_KEY } = require('../../src/shared/capabilities/billing/providers/abacatepay.provider')
const {
  billingProviderRegistry,
  eventTypeToDomainEvent
} = require('../../src/shared/capabilities/billing')

function computeAbacateHmac(body, secret) {
  return crypto.createHmac('sha256', secret).update(Buffer.from(body, 'utf8')).digest('base64')
}

describe('AbacatePay — smoke: provider registrado no registry', () => {
  test('AbacatePayProvider está registrado no billingProviderRegistry', () => {
    expect(billingProviderRegistry.hasProvider('abacatepay')).toBe(true)
  })

  test('billingManager consegue instanciar o provider', () => {
    const instance = billingProviderRegistry.resolve('abacatepay')
    expect(instance.getProviderName()).toBe('abacatepay')
  })
})

describe('AbacatePay — smoke: verifySignature -> parse -> normalize -> eventTypeToDomainEvent', () => {
  const OLD_ENV = { ...process.env }
  const provider = new AbacatePayProvider()

  beforeAll(() => {
    process.env.ABACATEPAY_WEBHOOK_SECRET = 'test_smoke_secret'
  })

  afterAll(() => {
    process.env = { ...OLD_ENV }
  })

  function buildRequest(body) {
    const rawBody = Buffer.from(JSON.stringify(body), 'utf8')
    return {
      query: { webhookSecret: 'test_smoke_secret' },
      headers: { 'x-webhook-signature': computeAbacateHmac(rawBody, ABACATEPAY_PUBLIC_KEY) },
      rawBody,
      body
    }
  }

  const smokeCases = [
    {
      name: 'checkout.completed (one-time payment)',
      payload: {
        id: 'log_abc123',
        event: 'checkout.completed',
        apiVersion: 2,
        devMode: false,
        data: {
          checkout: { id: 'bill_xyz', amount: 10000, paidAmount: 10000, status: 'PAID', frequency: 'ONE_TIME', items: [{ id: 'prod_barber', quantity: 1 }], createdAt: '2024-12-06T18:56:15.538Z', updatedAt: '2024-12-06T18:56:20.000Z' },
          customer: { id: 'cust_abc', name: 'João Silva', email: 'joao@test.com', taxId: '123.***.***-**' }
        }
      },
      expectedEventType: 'checkout-completed',
      expectedDomainEvent: 'payment.approved',
      expectedSubStatus: 'active'
    },
    {
      name: 'subscription.trial_started',
      payload: {
        id: 'log_trial',
        event: 'subscription.trial_started',
        data: {
          subscription: { id: 'subs_trial', amount: 4990, status: 'ACTIVE', frequency: 'MONTHLY', trialDays: 7, trialEndsAt: '2024-11-11T23:59:59.999Z' },
          customer: { name: 'Trial User', email: 'trial@test.com' }
        }
      },
      expectedEventType: 'subscription-trial-started',
      expectedDomainEvent: 'subscription.created',
      expectedSubStatus: 'trialing'
    },
    {
      name: 'subscription.completed (renewal)',
      payload: {
        id: 'log_renew',
        event: 'subscription.completed',
        data: {
          subscription: { id: 'subs_renew', amount: 2990, status: 'ACTIVE', frequency: 'MONTHLY' },
          payment: { id: 'char_renew', amount: 2990, paidAmount: 2990, status: 'PAID' },
          checkout: { id: 'bill_renew', amount: 2990, frequency: 'SUBSCRIPTION', items: [] },
          customer: { name: 'Maria', email: 'maria@test.com' }
        }
      },
      expectedEventType: 'subscription-completed',
      expectedDomainEvent: 'subscription.renewed',
      expectedSubStatus: 'active'
    },
    {
      name: 'subscription.cancelled',
      payload: {
        id: 'log_cancel',
        event: 'subscription.cancelled',
        data: {
          subscription: { id: 'subs_cancel', amount: 2990, status: 'CANCELLED', frequency: 'MONTHLY' },
          customer: { name: 'Pedro', email: 'pedro@test.com' }
        }
      },
      expectedEventType: 'subscription-cancelled',
      expectedDomainEvent: 'subscription.canceled',
      expectedSubStatus: 'canceled'
    },
    {
      name: 'checkout.refunded',
      payload: {
        id: 'log_refund',
        event: 'checkout.refunded',
        data: {
          checkout: { id: 'bill_ref', amount: 5000, paidAmount: 5000, items: [] },
          customer: { name: 'Carlos', email: 'carlos@test.com' }
        }
      },
      expectedEventType: 'checkout-refunded',
      expectedDomainEvent: 'subscription.refunded',
      expectedSubStatus: 'refunded'
    },
    {
      name: 'checkout.disputed',
      payload: {
        id: 'log_dispute',
        event: 'checkout.disputed',
        data: {
          checkout: { id: 'bill_disp', amount: 10000, paidAmount: 10000, items: [] },
          customer: { name: 'Ana', email: 'ana@test.com' }
        }
      },
      expectedEventType: 'checkout-disputed',
      expectedDomainEvent: 'subscription.chargeback',
      expectedSubStatus: 'suspended'
    },
    {
      name: 'transparent.completed (PIX)',
      payload: {
        event: 'transparent.completed',
        data: {
          transparent: { id: 'char_pix', amount: 5000, paidAmount: 5000, status: 'PAID' },
          customer: { name: 'Lucas', email: 'lucas@test.com' }
        }
      },
      expectedEventType: 'transparent-completed',
      expectedDomainEvent: 'payment.approved',
      expectedSubStatus: 'active'
    }
  ]

  test.each(smokeCases)('$name → domain event: $expectedDomainEvent', ({ payload, expectedEventType, expectedDomainEvent, expectedSubStatus }) => {
    const req = buildRequest(payload)

    expect(provider.verifySignature(req)).toBe(true)

    const raw = provider.parse(req)
    expect(raw).toEqual(payload)

    const normalized = provider.normalize(raw)
    expect(normalized.event_type).toBe(expectedEventType)
    expect(normalized.status.subscriptionStatus).toBe(expectedSubStatus)

    const domainEvent = eventTypeToDomainEvent(normalized.event_type, normalized.status)
    expect(domainEvent).toBe(expectedDomainEvent)
  })

  test('verifySignature rejeita webhook invalido (URL secret errado)', () => {
    const req = buildRequest({ event: 'checkout.completed', data: {} })
    req.query.webhookSecret = 'wrong_secret'
    expect(provider.verifySignature(req)).toBe(false)
  })

  test('verifySignature rejeita webhook invalido (HMAC errado)', () => {
    const req = buildRequest({ event: 'checkout.completed', data: {} })
    req.headers['x-webhook-signature'] = 'aW52YWxpZA=='
    expect(provider.verifySignature(req)).toBe(false)
  })
})
