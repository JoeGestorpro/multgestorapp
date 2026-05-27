const { eventBus } = require('../../shared/core/events')
const { appLogger } = require('../../shared/core/logger')
const { INTEGRATION_CHANNELS, INTEGRATION_STATUS } = require('../contracts')

class IntegrationManager {
  constructor(config = {}) {
    this.config = config
    this.logger = appLogger.child({ module: 'IntegrationManager' })
    this.providers = new Map()
  }

  registerProvider(channel, provider) {
    this.providers.set(channel, provider)
    this.logger.info({ channel, provider: provider.name }, 'Integration provider registered')
  }

  getProvider(channel) {
    const provider = this.providers.get(channel)
    if (!provider) {
      this.logger.warn({ channel }, 'No provider found for channel')
      return null
    }
    return provider
  }

  async send(channel, payload, metadata = {}) {
    const provider = this.getProvider(channel)

    if (!provider) {
      this.logger.warn({ channel }, 'No provider available, message dropped')
      return {
        success: false,
        channel,
        error: `No provider configured for channel: ${channel}`
      }
    }

    if (!provider.isAvailable()) {
      this.logger.warn({ channel, provider: provider.name }, 'Provider disabled')
      return {
        success: false,
        channel,
        error: `Provider ${provider.name} is disabled`
      }
    }

    try {
      const result = await provider.send(payload)

      eventBus.publish('integration.message.sent', {
        channel,
        company_id: metadata.company_id,
        message_id: result.message_id,
        provider: provider.name,
        status: INTEGRATION_STATUS.SENT
      }, {
        company_id: metadata.company_id,
        aggregate_type: 'integration_message',
        aggregate_id: result.message_id,
        source: 'IntegrationManager'
      })

      return {
        success: true,
        channel,
        message_id: result.message_id,
        provider: provider.name
      }
    } catch (error) {
      this.logger.error({
        channel,
        provider: provider.name,
        error: error.message
      }, 'Integration send failed')

      eventBus.publish('integration.message.failed', {
        channel,
        company_id: metadata.company_id,
        provider: provider.name,
        error: error.message,
        status: INTEGRATION_STATUS.FAILED
      }, {
        company_id: metadata.company_id,
        aggregate_type: 'integration_message',
        source: 'IntegrationManager'
      })

      return {
        success: false,
        channel,
        error: error.message,
        provider: provider.name
      }
    }
  }

  getChannels() {
    return Array.from(this.providers.keys())
  }

  getHealth() {
    const health = {}
    for (const [channel, provider] of this.providers) {
      health[channel] = {
        provider: provider.name,
        enabled: provider.isAvailable()
      }
    }
    return health
  }
}

module.exports = IntegrationManager
