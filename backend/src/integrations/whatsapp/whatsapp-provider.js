const { IntegrationProvider } = require('../providers')
const { INTEGRATION_CHANNELS } = require('../contracts')
const { appLogger } = require('../../shared/core/logger')

class WhatsAppProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: config.name || 'whatsapp-base',
      channel: INTEGRATION_CHANNELS.WHATSAPP,
      enabled: config.enabled !== false
    })

    this.config = {
      providerType: config.providerType || 'meta_cloud_api',
      apiBaseUrl: config.apiBaseUrl || '',
      phoneNumberId: config.phoneNumberId || '',
      businessAccountId: config.businessAccountId || '',
      verifyToken: config.verifyToken || '',
      encryptionKey: config.encryptionKey || '',
      companyId: config.companyId || null
    }

    this.logger = appLogger.child({
      module: 'WhatsAppProvider',
      providerType: this.config.providerType,
      companyId: this.config.companyId
    })
  }

  async send(payload) {
    if (!this.isAvailable()) {
      throw new Error('WhatsApp provider is disabled')
    }

    this.logger.info({
      to: payload.to,
      template: payload.template,
      companyId: this.config.companyId
    }, 'WhatsApp send (placeholder - not implemented yet)')

    return {
      success: false,
      message_id: null,
      status: 'not_implemented',
      error: 'WhatsApp send not implemented yet. This is a foundation placeholder.'
    }
  }

  async getStatus(messageId) {
    this.logger.debug({ messageId }, 'WhatsApp getStatus (placeholder)')

    return {
      message_id: messageId,
      status: 'unknown',
      error: 'WhatsApp status check not implemented yet'
    }
  }

  validateConfig() {
    const errors = []

    if (!this.config.providerType) {
      errors.push('providerType is required')
    }

    const supportedProviders = ['meta_cloud_api', 'evolution_api', 'z_api', 'mock']
    if (!supportedProviders.includes(this.config.providerType)) {
      errors.push(`providerType must be one of: ${supportedProviders.join(', ')}`)
    }

    if (this.config.providerType !== 'mock' && !this.config.apiBaseUrl) {
      errors.push('apiBaseUrl is required for non-mock providers')
    }

    if (this.config.providerType !== 'mock' && !this.config.phoneNumberId) {
      errors.push('phoneNumberId is required for non-mock providers')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  getInfo() {
    return {
      ...super.getInfo(),
      providerType: this.config.providerType,
      phoneNumberId: this.config.phoneNumberId ? '***configured***' : null,
      businessAccountId: this.config.businessAccountId ? '***configured***' : null,
      companyId: this.config.companyId,
      apiBaseUrl: this.config.apiBaseUrl ? '***configured***' : null
    }
  }
}

module.exports = WhatsAppProvider
