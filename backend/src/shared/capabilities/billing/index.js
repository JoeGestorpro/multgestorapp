const {
  BILLING_EVENTS,
  validateEventPayload,
  normalizeBillingStatus,
  eventTypeToDomainEvent
} = require('./contracts')

const { PaymentProvider } = require('./payment-provider')
const { BillingProviderRegistry, billingProviderRegistry } = require('./provider-registry')
const { BillingManager } = require('./billing-manager')
const { KiwifyProvider } = require('./providers/kiwify.provider')
const { AbacatePayProvider } = require('./providers/abacatepay.provider')

billingProviderRegistry.register('kiwify', KiwifyProvider)
billingProviderRegistry.register('abacatepay', AbacatePayProvider)
const billingManager = new BillingManager(billingProviderRegistry)

module.exports = {
  BILLING_EVENTS,
  validateEventPayload,
  normalizeBillingStatus,
  eventTypeToDomainEvent,
  PaymentProvider,
  BillingProviderRegistry,
  billingProviderRegistry,
  BillingManager,
  billingManager,
  KiwifyProvider,
  AbacatePayProvider
}
