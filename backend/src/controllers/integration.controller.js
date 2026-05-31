const { asyncHandler, success } = require('../shared')
const { integrationConfig, encryption, WhatsAppResolver } = require('../integrations')
const { INTEGRATION_CHANNELS } = require('../integrations/contracts')

const whatsappResolver = new WhatsAppResolver()

const getWhatsAppConfig = asyncHandler(async (req, res) => {
  const companyId = req.companyId
  const config = await integrationConfig.getConfig(companyId, INTEGRATION_CHANNELS.WHATSAPP)
  return success(res, config || { configured: false })
})

const upsertWhatsAppConfig = asyncHandler(async (req, res) => {
  const companyId = req.companyId
  const data = req.validatedBody || req.body

  let tokenEncrypted = null
  if (data.accessToken) {
    tokenEncrypted = encryption.encrypt(data.accessToken)
  }

  const config = await integrationConfig.upsertConfig(companyId, INTEGRATION_CHANNELS.WHATSAPP, {
    providerType: data.providerType || 'meta_cloud_api',
    apiUrl: data.apiUrl || null,
    phoneNumberId: data.phoneNumberId || null,
    businessAccountId: data.businessAccountId || null,
    tokenEncrypted,
    integrationEnabled: data.integrationEnabled !== false,
    configJson: null
  })

  whatsappResolver.invalidateCache(companyId)

  return success(res, config, { message: 'Configuracao do WhatsApp salva com sucesso' })
})

const deleteWhatsAppConfig = asyncHandler(async (req, res) => {
  const companyId = req.companyId
  await integrationConfig.deleteConfig(companyId, INTEGRATION_CHANNELS.WHATSAPP)
  whatsappResolver.invalidateCache(companyId)
  return success(res, null, { message: 'Configuracao do WhatsApp removida' })
})

const testWhatsAppConfig = asyncHandler(async (req, res) => {
  const companyId = req.companyId
  const { to, template, variables } = req.validatedBody || req.body

  const rawConfig = await integrationConfig.getRawConfig(companyId, INTEGRATION_CHANNELS.WHATSAPP)

  if (!rawConfig || !rawConfig.integration_enabled) {
    return success(res, {
      success: false,
      error: 'WhatsApp nao configurado para esta empresa'
    })
  }

  const provider = await whatsappResolver.resolveProviderForCompany(companyId)

  const result = await provider.send({
    to,
    template: template || 'appointment_confirmed',
    variables: variables || {
      customer_name: 'Cliente Teste',
      appointment_date: new Date().toLocaleDateString('pt-BR'),
      appointment_time: '14:00'
    }
  })

  return success(res, result, {
    message: result.success ? 'Mensagem de teste enviada' : 'Falha ao enviar mensagem de teste'
  })
})

module.exports = {
  getWhatsAppConfig,
  upsertWhatsAppConfig,
  deleteWhatsAppConfig,
  testWhatsAppConfig
}
