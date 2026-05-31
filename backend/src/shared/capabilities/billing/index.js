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

billingProviderRegistry.register('kiwify', KiwifyProvider)
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
  KiwifyProvider
}
