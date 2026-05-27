const WhatsAppProvider = require('./whatsapp-provider')
const { INTEGRATION_CHANNELS } = require('../contracts')
const { appLogger } = require('../../shared/core/logger')

class MockWhatsAppProvider extends WhatsAppProvider {
  constructor(config = {}) {
    super({
      ...config,
      name: 'whatsapp-mock',
      providerType: 'mock',
      enabled: true
    })

    this.sentMessages = []
    this.logger = appLogger.child({ module: 'MockWhatsAppProvider' })
  }

  async send(payload) {
    if (!this.isAvailable()) {
      throw new Error('Mock WhatsApp provider is disabled')
    }

    const messageId = `mock-wa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const message = {
      id: messageId,
      to: payload.to,
      from: this.config.phoneNumberId || 'mock-phone',
      template: payload.template,
      text: payload.text,
      variables: payload.variables,
      companyId: this.config.companyId,
      sentAt: new Date().toISOString()
    }

    this.sentMessages.push(message)

    this.logger.info({
      messageId,
      to: payload.to,
      template: payload.template,
      companyId: this.config.companyId
    }, 'Mock WhatsApp message sent')

    return {
      success: true,
      message_id: messageId,
      status: 'sent',
      provider: 'mock'
    }
  }

  async getStatus(messageId) {
    const message = this.sentMessages.find(m => m.id === messageId)

    if (!message) {
      return {
        message_id: messageId,
        status: 'not_found',
        error: 'Message not found in mock store'
      }
    }

    return {
      message_id: messageId,
      status: 'delivered',
      provider: 'mock'
    }
  }

  getSentMessages() {
    return [...this.sentMessages]
  }

  clearMessages() {
    this.sentMessages.splice(0, this.sentMessages.length)
  }
}

function createMockWhatsAppProvider(config = {}) {
  return new MockWhatsAppProvider(config)
}

module.exports = createMockWhatsAppProvider
