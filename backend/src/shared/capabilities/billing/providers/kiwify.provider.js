const { PaymentProvider } = require('../payment-provider')
const { normalizeBillingStatus } = require('../contracts')

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase()
}

function normalizeSlug(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function resolveWebhookSecret(req) {
  const authHeader = normalizeText(req.headers.authorization)
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : ''

  return (
    normalizeText(req.headers['x-kiwify-token']) ||
    normalizeText(req.headers['x-webhook-token']) ||
    normalizeText(req.headers['x-kiwify-signature']) ||
    normalizeText(req.query.token) ||
    bearerToken
  )
}

function extractEvent(rawPayload) {
  const eventType = normalizeSlug(
    rawPayload.event_type ||
    rawPayload.event ||
    rawPayload.type ||
    rawPayload.webhook_event ||
    rawPayload.status
  )

  const baseEventId = normalizeText(
    rawPayload.event_id ||
    rawPayload.id ||
    rawPayload.webhook_id ||
    rawPayload.transaction_id ||
    rawPayload.invoice_id ||
    rawPayload.order_id
  )

  return {
    eventType: eventType || 'unknown',
    eventId: baseEventId || `kiwify-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
  }
}

function extractCustomer(rawPayload) {
  const customer = rawPayload.customer || rawPayload.buyer || rawPayload.client || {}
  return {
    email: normalizeEmail(customer.email || rawPayload.customer_email || rawPayload.email),
    name: normalizeText(customer.name || rawPayload.customer_name || rawPayload.name || 'Cliente Kiwify'),
    document: normalizeText(customer.document || customer.cpf || rawPayload.customer_document),
    phone: normalizeText(customer.phone || customer.whatsapp || rawPayload.customer_phone)
  }
}

function extractCompany(rawPayload, customer) {
  return {
    name: normalizeText(
      rawPayload.company_name ||
      rawPayload.tenant_name ||
      rawPayload.business_name ||
      customer.name ||
      'Nova empresa'
    ),
    email: customer.email || normalizeEmail(rawPayload.company_email),
    document: customer.document || normalizeText(rawPayload.company_document),
    phone: customer.phone || normalizeText(rawPayload.company_phone)
  }
}

function extractFinancialPayload(rawPayload) {
  const rawPrice = Number(
    rawPayload.amount ||
    rawPayload.price ||
    rawPayload.total_amount ||
    rawPayload.subscription_amount ||
    rawPayload.invoice_amount ||
    0
  )

  return {
    planName: normalizeText(rawPayload.plan_name || rawPayload.offer_name || rawPayload.product_name || rawPayload.product?.name || 'Plano Kiwify'),
    billingCycle: normalizeSlug(rawPayload.billing_cycle || rawPayload.plan_cycle || rawPayload.recurrence || rawPayload.subscription_cycle) || 'monthly',
    gateway: normalizeSlug(rawPayload.gateway || rawPayload.gateway_name || rawPayload.payment_gateway) || 'kiwify',
    moduleKey: normalizeSlug(rawPayload.module_key || rawPayload.product_key || rawPayload.module_slug || rawPayload.product?.slug),
    price: Number.isFinite(rawPrice) ? rawPrice : 0,
    paidAt: rawPayload.paid_at || rawPayload.approved_at || rawPayload.payment_date || null,
    dueAt: rawPayload.due_at || rawPayload.next_due_date || rawPayload.expiration_date || null,
    currentPeriodEnd: rawPayload.current_period_end || rawPayload.next_due_date || null,
    currentPeriodStart: rawPayload.current_period_start || rawPayload.subscription_started_at || rawPayload.created_at || null,
    invoiceId: normalizeText(rawPayload.invoice_id || rawPayload.charge_id || rawPayload.payment_id || rawPayload.order_id),
    subscriptionExternalId: normalizeText(rawPayload.subscription_id || rawPayload.subscription_code || rawPayload.order_subscription_id),
    customerExternalId: normalizeText(rawPayload.customer_id || rawPayload.buyer_id)
  }
}

class KiwifyProvider extends PaymentProvider {
  getProviderName() {
    return 'kiwify'
  }

  verifySignature(req) {
    const expectedSecret = normalizeText(process.env.KIWIFY_WEBHOOK_SECRET)
    if (!expectedSecret) {
      throw new Error('KIWIFY_WEBHOOK_SECRET nao configurado')
    }
    return resolveWebhookSecret(req) === expectedSecret
  }

  parse(req) {
    return req.body || {}
  }

  normalize(rawPayload) {
    const event = extractEvent(rawPayload)
    const customer = extractCustomer(rawPayload)
    const company = extractCompany(rawPayload, customer)
    const finance = extractFinancialPayload(rawPayload)
    const status = normalizeBillingStatus(event.eventType)

    return {
      provider: 'kiwify',
      event_id: event.eventId,
      event_type: event.eventType,
      status,
      company,
      customer,
      finance,
      raw: rawPayload
    }
  }
}

module.exports = { KiwifyProvider, extractEvent, extractCustomer, extractCompany, extractFinancialPayload, resolveWebhookSecret, normalizeText, normalizeEmail, normalizeSlug }
