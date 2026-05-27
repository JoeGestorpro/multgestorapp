const { appLogger } = require('../../shared/core/logger')

class IntegrationProvider {
  constructor(config = {}) {
    this.name = config.name || 'base'
    this.channel = config.channel || 'unknown'
    this.enabled = config.enabled !== false
    this.logger = appLogger.child({ module: `IntegrationProvider:${this.name}` })
  }

  async send(payload) {
    throw new Error(`IntegrationProvider.send() not implemented for: ${this.name}`)
  }

  async getStatus(messageId) {
    throw new Error(`IntegrationProvider.getStatus() not implemented for: ${this.name}`)
  }

  isAvailable() {
    return this.enabled
  }

  getInfo() {
    return {
      name: this.name,
      channel: this.channel,
      enabled: this.enabled
    }
  }
}

module.exports = { IntegrationProvider }
