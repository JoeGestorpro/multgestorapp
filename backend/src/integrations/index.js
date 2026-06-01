const { IntegrationManager } = require('./core')
const { ProviderRegistry, providerRegistry } = require('./core/provider-registry')
const { WhatsAppProvider, resolveWhatsAppProvider, createMockWhatsAppProvider, WhatsAppResolver } = require('./whatsapp')
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
  WhatsAppResolver,
  resolveWhatsAppProvider,
  createMockWhatsAppProvider,
  AppointmentIntegrationConsumer,
  WhatsAppWebhook,
  integrationConfig,
  encryption,
  ChannelAdapter,
  ...contracts
}
