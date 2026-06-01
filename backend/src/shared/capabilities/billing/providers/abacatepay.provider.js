const crypto = require('crypto')
const { PaymentProvider } = require('../payment-provider')
const { normalizeBillingStatus } = require('../contracts')
const { normalizeText, normalizeEmail, normalizeSlug } = require('./kiwify.provider')

const ABACATEPAY_PUBLIC_KEY =
  't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9'

function extractEventId(rawPayload) {
  return normalizeText(
    rawPayload.id ||
    rawPayload.event_id ||
    rawPayload.data?.checkout?.id ||
    rawPayload.data?.transparent?.id ||
    rawPayload.data?.subscription?.id
  ) || `abacatepay-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

function extractCustomer(rawPayload) {
  const customer = rawPayload.data?.customer || rawPayload.customer || {}
  return {
    email: normalizeEmail(customer.email || rawPayload.data?.checkout?.customerId),
    name: normalizeText(customer.name || 'Cliente AbacatePay'),
    document: normalizeText(customer.taxId || customer.document),
    phone: normalizeText(customer.phone)
  }
}

function extractCompany(rawPayload, customer) {
  return {
    name: normalizeText(
      rawPayload.data?.checkout?.customerId ||
      rawPayload.data?.subscription?.customerId ||
      customer.name ||
      'Nova empresa'
    ),
    email: customer.email,
    document: customer.document,
    phone: customer.phone
  }
}

function extractFinance(rawPayload) {
  const checkout = rawPayload.data?.checkout || {}
  const subscription = rawPayload.data?.subscription || {}
  const transparent = rawPayload.data?.transparent || {}
  const payment = rawPayload.data?.payment || {}
  const source = checkout.id ? checkout : transparent.id ? transparent : payment

  const rawPrice = Number(source.amount || 0)
  const rawPaidAmount = Number(source.paidAmount || rawPrice)

  return {
    planName: normalizeText(
      source.items?.[0]?.id ||
      subscription.id ||
      'Plano AbacatePay'
    ),
    billingCycle: normalizeSlug(
      source.frequency ||
      subscription.frequency ||
      checkout.frequency
    ) || 'one-time',
    gateway: 'abacatepay',
    moduleKey: normalizeSlug(source.items?.[0]?.id) || '',
    price: Number.isFinite(rawPaidAmount) ? rawPaidAmount : 0,
    paidAt: source.paidAt || source.updatedAt || null,
    dueAt: null,
    currentPeriodEnd: source.currentPeriodEnd || null,
    currentPeriodStart: source.createdAt || null,
    invoiceId: normalizeText(source.id || checkout.id || transparent.id || payment.id),
    subscriptionExternalId: normalizeText(subscription.id || checkout.id),
    customerExternalId: normalizeText(rawPayload.data?.customer?.id || rawPayload.data?.checkout?.customerId)
  }
}

class AbacatePayProvider extends PaymentProvider {
  getProviderName() {
    return 'abacatepay'
  }

  verifySignature(req) {
    const expectedSecret = process.env.ABACATEPAY_WEBHOOK_SECRET
    const urlSecret = normalizeText(req.query?.webhookSecret)

    if (!expectedSecret) {
      throw new Error('ABACATEPAY_WEBHOOK_SECRET nao configurado')
    }

    if (urlSecret !== expectedSecret) {
      return false
    }

    const headerSig = normalizeText(req.headers['x-webhook-signature'])
    if (!headerSig) {
      return false
    }

    const rawBody = req.rawBody
    if (!rawBody || rawBody.length === 0) {
      return false
    }

    const expectedSig = crypto
      .createHmac('sha256', ABACATEPAY_PUBLIC_KEY)
      .update(Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8'))
      .digest('base64')

    const sigBuffer = Buffer.from(expectedSig)
    const headerBuffer = Buffer.from(headerSig)

    return sigBuffer.length === headerBuffer.length && crypto.timingSafeEqual(sigBuffer, headerBuffer)
  }

  parse(req) {
    return req.body || {}
  }

  normalize(rawPayload) {
    const eventType = normalizeSlug(
      rawPayload.event ||
      rawPayload.type ||
      rawPayload.event_type ||
      'unknown'
    )

    const eventId = extractEventId(rawPayload)
    const customer = extractCustomer(rawPayload)
    const company = extractCompany(rawPayload, customer)
    const finance = extractFinance(rawPayload)
    const status = normalizeBillingStatus(eventType)

    return {
      provider: 'abacatepay',
      event_id: eventId,
      event_type: eventType,
      status,
      company,
      customer,
      finance,
      raw: rawPayload
    }
  }
}

module.exports = { AbacatePayProvider, ABACATEPAY_PUBLIC_KEY, extractEventId, extractCustomer, extractCompany, extractFinance }
