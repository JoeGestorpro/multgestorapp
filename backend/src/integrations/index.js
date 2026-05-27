const { IntegrationManager } = require('./core')
const { ProviderRegistry, providerRegistry } = require('./core/provider-registry')
const { WhatsAppProvider, resolveWhatsAppProvider, createMockWhatsAppProvider } = require('./whatsapp')
const { AppointmentIntegrationConsumer } = require('./consumers')
const { WhatsAppWebhook } = require('./webhooks')
const { integrationConfig, encryption } = require('./config')
const contracts = require('./contracts')
const { ChannelAdapter } = require('./adapters')

module.exports = {
  IntegrationManager,
  ProviderRegistry,
  providerRegistry,
  WhatsAppProvider,
  resolveWhatsAppProvider,
  createMockWhatsAppProvider,
  AppointmentIntegrationConsumer,
  WhatsAppWebhook,
  integrationConfig,
  encryption,
  ChannelAdapter,
  ...contracts
}
