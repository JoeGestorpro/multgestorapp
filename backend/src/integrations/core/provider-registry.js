const { appLogger } = require('../../shared/core/logger')

class ProviderRegistry {
  constructor() {
    this.providers = new Map()
    this.logger = appLogger.child({ module: 'ProviderRegistry' })
  }

  register(channel, providerName, factory) {
    const key = `${channel}:${providerName}`
    this.providers.set(key, {
      channel,
      providerName,
      factory,
      created: false,
      instance: null
    })
    this.logger.info({ channel, providerName }, 'Provider registered')
  }

  async resolve(channel, companyName) {
    const key = `${channel}:${companyName}`
    const entry = this.providers.get(key)

    if (!entry) {
      this.logger.warn({ channel, companyName }, 'No provider registered for channel')
      return null
    }

    if (!entry.created) {
      entry.instance = await entry.factory()
      entry.created = true
    }

    return entry.instance
  }

  getAvailableProviders(channel) {
    const result = []
    for (const [key, entry] of this.providers) {
      if (entry.channel === channel) {
        result.push({
          channel: entry.channel,
          providerName: entry.providerName
        })
      }
    }
    return result
  }

  hasProvider(channel, providerName) {
    return this.providers.has(`${channel}:${providerName}`)
  }
}

const providerRegistry = new ProviderRegistry()

module.exports = { ProviderRegistry, providerRegistry }
