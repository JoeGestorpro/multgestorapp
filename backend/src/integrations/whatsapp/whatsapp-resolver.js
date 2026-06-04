const { appLogger } = require('../../shared/core/logger')
const { integrationConfig } = require('../config')
const { encryption } = require('../config')
const { INTEGRATION_CHANNELS } = require('../contracts')
const WhatsAppProvider = require('./whatsapp-provider')
const createMockWhatsAppProvider = require('./mock-whatsapp.provider')

const CACHE_TTL_MS = 5 * 60 * 1000

class WhatsAppResolver {
  constructor() {
    this._cache = new Map()
    this.logger = appLogger.child({ module: 'WhatsAppResolver' })
    this._startCacheCleanup()
  }

  async resolveProviderForCompany(companyId) {
    if (!companyId) {
      this.logger.warn('No companyId provided, returning mock provider')
      return this._createMockProvider(null)
    }

    const cached = this._getFromCache(companyId)
    if (cached) {
      return cached
    }

    const rawConfig = await integrationConfig.getRawConfig(companyId, INTEGRATION_CHANNELS.WHATSAPP)

    if (!rawConfig) {
      this.logger.info({ companyId }, 'No WhatsApp config found, returning mock provider')
      return this._createMockProvider(companyId)
    }

    if (!rawConfig.integration_enabled) {
      this.logger.info({ companyId }, 'WhatsApp integration disabled, returning mock provider')
      return this._createMockProvider(companyId)
    }

    let accessToken = ''
    if (rawConfig.token_encrypted) {
      try {
        accessToken = encryption.decrypt(rawConfig.token_encrypted)
      } catch (err) {
        this.logger.error({ companyId, error: err.message }, 'Failed to decrypt WhatsApp token')
      }
    }

    const providerType = rawConfig.provider_type || 'meta_cloud_api'

    if (providerType === 'mock' || !accessToken) {
      return this._createMockProvider(companyId)
    }

    const provider = new WhatsAppProvider({
      name: `whatsapp-${companyId}`,
      providerType,
      apiBaseUrl: rawConfig.api_url || undefined,
      phoneNumberId: rawConfig.phone_number_id || '',
      businessAccountId: rawConfig.business_account_id || '',
      companyId,
      accessToken,
      enabled: true
    })

    this._setCache(companyId, provider)
    return provider
  }

  invalidateCache(companyId) {
    this._cache.delete(companyId)
    this.logger.debug({ companyId }, 'WhatsApp provider cache invalidated')
  }

  _createMockProvider(companyId) {
    const provider = createMockWhatsAppProvider({
      companyId
    })
    return provider
  }

  _getFromCache(companyId) {
    const entry = this._cache.get(companyId)
    if (!entry) return null

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this._cache.delete(companyId)
      return null
    }

    return entry.provider
  }

  _setCache(companyId, provider) {
    this._cache.set(companyId, {
      provider,
      timestamp: Date.now()
    })
  }

  _startCacheCleanup() {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this._cache.entries()) {
        if (now - entry.timestamp > CACHE_TTL_MS) {
          this._cache.delete(key)
        }
      }
    }, CACHE_TTL_MS).unref()
  }
}

module.exports = WhatsAppResolver
