const WhatsAppProvider = require('./whatsapp-provider')
const createMockWhatsAppProvider = require('./mock-whatsapp.provider')
const WhatsAppResolver = require('./whatsapp-resolver')
const { INTEGRATION_CHANNELS } = require('../contracts')

function resolveWhatsAppProvider(config = {}) {
  const providerType = config.providerType || process.env.WHATSAPP_PROVIDER || 'mock'

  if (providerType === 'mock' || !providerType) {
    return createMockWhatsAppProvider(config)
  }

  if (providerType === 'meta_cloud_api') {
    return new WhatsAppProvider({
      ...config,
      providerType: 'meta_cloud_api'
    })
  }

  if (providerType === 'evolution_api') {
    return new WhatsAppProvider({
      ...config,
      providerType: 'evolution_api'
    })
  }

  if (providerType === 'z_api') {
    return new WhatsAppProvider({
      ...config,
      providerType: 'z_api'
    })
  }

  throw new Error(`WhatsApp provider type not supported: ${providerType}`)
}

module.exports = {
  WhatsAppProvider,
  createMockWhatsAppProvider,
  resolveWhatsAppProvider,
  WhatsAppResolver,
  INTEGRATION_CHANNELS
}
