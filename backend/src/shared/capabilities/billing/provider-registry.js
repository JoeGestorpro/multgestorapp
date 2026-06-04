const { appLogger } = require('../../core/logger')

class BillingProviderRegistry {
  constructor() {
    this.providers = new Map()
    this.logger = appLogger.child({ module: 'BillingProviderRegistry' })
  }

  register(gatewayName, ProviderClass) {
    if (this.providers.has(gatewayName)) {
      throw new Error(`Billing provider '${gatewayName}' is already registered`)
    }
    this.providers.set(gatewayName, ProviderClass)
    this.logger.info({ gateway: gatewayName }, 'Billing provider registered')
  }

  get(gatewayName) {
    const ProviderClass = this.providers.get(gatewayName)
    if (!ProviderClass) {
      this.logger.warn({ gateway: gatewayName }, 'No billing provider found for gateway')
      return null
    }
    return ProviderClass
  }

  resolve(gatewayName) {
    const ProviderClass = this.get(gatewayName)
    if (!ProviderClass) {
      throw new Error(`Billing provider '${gatewayName}' not found`)
    }
    return new ProviderClass()
  }

  getRegisteredProviders() {
    return Array.from(this.providers.keys())
  }

  hasProvider(gatewayName) {
    return this.providers.has(gatewayName)
  }
}

const billingProviderRegistry = new BillingProviderRegistry()

module.exports = { BillingProviderRegistry, billingProviderRegistry }
