const NormalizedBillingEvent = {
  provider: 'string',
  event_id: 'string',
  event_type: 'string',
  status: {
    subscriptionStatus: 'string',
    invoiceStatus: 'string'
  },
  company: {
    name: 'string',
    email: 'string',
    document: 'string',
    phone: 'string'
  },
  customer: {
    email: 'string',
    name: 'string',
    document: 'string',
    phone: 'string'
  },
  finance: {
    planName: 'string',
    billingCycle: 'string',
    gateway: 'string',
    moduleKey: 'string',
    price: 'number',
    paidAt: 'string|null',
    dueAt: 'string|null',
    currentPeriodEnd: 'string|null',
    currentPeriodStart: 'string|null',
    invoiceId: 'string',
    subscriptionExternalId: 'string',
    customerExternalId: 'string'
  },
  raw: 'object'
}

const PaymentApproved = {
  event_name: 'payment.approved',
  description: 'Pagamento aprovado',
  aggregate_type: 'payment',
  required_fields: ['provider', 'event_id', 'gateway_event_type', 'company', 'customer', 'finance'],
  optional_fields: ['invoice', 'subscription']
}

const PaymentFailed = {
  event_name: 'payment.failed',
  description: 'Pagamento recusado ou falhou',
  aggregate_type: 'payment',
  required_fields: ['provider', 'event_id', 'gateway_event_type'],
  optional_fields: ['company', 'customer', 'finance', 'failure_reason']
}

const SubscriptionCreated = {
  event_name: 'subscription.created',
  description: 'Nova assinatura criada',
  aggregate_type: 'subscription',
  required_fields: ['provider', 'company_id', 'plan_name', 'status', 'billing_cycle'],
  optional_fields: ['module_key', 'price', 'external_subscription_id', 'trial_end']
}

const SubscriptionRenewed = {
  event_name: 'subscription.renewed',
  description: 'Assinatura renovada',
  aggregate_type: 'subscription',
  required_fields: ['provider', 'subscription_id', 'company_id', 'status'],
  optional_fields: ['plan_name', 'price', 'next_due_date', 'current_period_end']
}

const SubscriptionUpdated = {
  event_name: 'subscription.updated',
  description: 'Assinatura atualizada (status/plano)',
  aggregate_type: 'subscription',
  required_fields: ['provider', 'subscription_id', 'company_id', 'status'],
  optional_fields: ['plan_name', 'price', 'billing_cycle', 'previous_status']
}

const SubscriptionCanceled = {
  event_name: 'subscription.canceled',
  description: 'Assinatura cancelada',
  aggregate_type: 'subscription',
  required_fields: ['provider', 'subscription_id', 'company_id'],
  optional_fields: ['canceled_reason', 'plan_name', 'effective_date']
}

const SubscriptionRefunded = {
  event_name: 'subscription.refunded',
  description: 'Assinatura reembolsada',
  aggregate_type: 'subscription',
  required_fields: ['provider', 'subscription_id', 'company_id'],
  optional_fields: ['amount', 'refund_reason', 'invoice_id']
}

const SubscriptionPastDue = {
  event_name: 'subscription.past_due',
  description: 'Assinatura em atraso',
  aggregate_type: 'subscription',
  required_fields: ['provider', 'subscription_id', 'company_id', 'status'],
  optional_fields: ['days_overdue', 'next_due_date', 'plan_name']
}

const ChargebackReceived = {
  event_name: 'subscription.chargeback',
  description: 'Chargeback recebido',
  aggregate_type: 'subscription',
  required_fields: ['provider', 'subscription_id', 'company_id', 'amount'],
  optional_fields: ['reason', 'dispute_id', 'invoice_id']
}

const BILLING_EVENTS = {
  PAYMENT_APPROVED: PaymentApproved,
  PAYMENT_FAILED: PaymentFailed,
  SUBSCRIPTION_CREATED: SubscriptionCreated,
  SUBSCRIPTION_RENEWED: SubscriptionRenewed,
  SUBSCRIPTION_UPDATED: SubscriptionUpdated,
  SUBSCRIPTION_CANCELED: SubscriptionCanceled,
  SUBSCRIPTION_REFUNDED: SubscriptionRefunded,
  SUBSCRIPTION_PAST_DUE: SubscriptionPastDue,
  CHARGEBACK_RECEIVED: ChargebackReceived
}

function validateEventPayload(contract, payload) {
  const missing = contract.required_fields.filter(field => payload[field] === undefined || payload[field] === null)
  if (missing.length > 0) {
    throw new Error(`Missing required fields for ${contract.event_name}: ${missing.join(', ')}`)
  }
}

function normalizeBillingStatus(eventType) {
  switch (eventType) {
    case 'compra-aprovada':
    case 'compra_aprovada':
    case 'purchase-approved':
    case 'purchase_approved':
    case 'subscription-renewed':
    case 'subscription_renewed':
    case 'renewed':
      return { subscriptionStatus: 'active', invoiceStatus: 'paid' }
    case 'subscription-late':
    case 'subscription_late':
    case 'late':
    case 'past-due':
    case 'past_due':
    case 'overdue':
      return { subscriptionStatus: 'late', invoiceStatus: 'overdue' }
    case 'subscription-canceled':
    case 'subscription_canceled':
    case 'canceled':
      return { subscriptionStatus: 'canceled', invoiceStatus: 'canceled' }
    case 'compra-reembolsada':
    case 'compra_reembolsada':
    case 'refunded':
      return { subscriptionStatus: 'refunded', invoiceStatus: 'refunded' }
    case 'chargeback':
      return { subscriptionStatus: 'suspended', invoiceStatus: 'chargeback' }
    default:
      return { subscriptionStatus: 'pending', invoiceStatus: 'pending' }
  }
}

function eventTypeToDomainEvent(eventType) {
  switch (eventType) {
    case 'compra-aprovada':
    case 'compra_aprovada':
    case 'purchase-approved':
    case 'purchase_approved':
      return 'payment.approved'
    case 'subscription-renewed':
    case 'subscription_renewed':
    case 'renewed':
      return 'subscription.renewed'
    case 'subscription-late':
    case 'subscription_late':
    case 'late':
    case 'past-due':
    case 'past_due':
    case 'overdue':
      return 'subscription.past_due'
    case 'subscription-canceled':
    case 'subscription_canceled':
    case 'canceled':
      return 'subscription.canceled'
    case 'compra-reembolsada':
    case 'compra_reembolsada':
    case 'refunded':
      return 'subscription.refunded'
    case 'chargeback':
      return 'subscription.chargeback'
    default:
      return 'payment.failed'
  }
}

module.exports = {
  NormalizedBillingEvent,
  BILLING_EVENTS,
  PaymentApproved,
  PaymentFailed,
  SubscriptionCreated,
  SubscriptionRenewed,
  SubscriptionUpdated,
  SubscriptionCanceled,
  SubscriptionRefunded,
  SubscriptionPastDue,
  ChargebackReceived,
  validateEventPayload,
  normalizeBillingStatus,
  eventTypeToDomainEvent
}
