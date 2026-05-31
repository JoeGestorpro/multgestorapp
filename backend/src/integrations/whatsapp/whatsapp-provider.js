const https = require('node:https')
const { URL } = require('url')
const { IntegrationProvider } = require('../providers')
const { INTEGRATION_CHANNELS } = require('../contracts')
const { appLogger } = require('../../shared/core/logger')

const META_API_BASE = 'https://graph.facebook.com/v19.0'

class WhatsAppProvider extends IntegrationProvider {
  constructor(config = {}) {
    super({
      name: config.name || 'whatsapp-base',
      channel: INTEGRATION_CHANNELS.WHATSAPP,
      enabled: config.enabled !== false
    })

    this.config = {
      providerType: config.providerType || 'meta_cloud_api',
      apiBaseUrl: config.apiBaseUrl || META_API_BASE,
      phoneNumberId: config.phoneNumberId || '',
      businessAccountId: config.businessAccountId || '',
      verifyToken: config.verifyToken || '',
      encryptionKey: config.encryptionKey || '',
      companyId: config.companyId || null,
      accessToken: config.accessToken || ''
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

    if (this.config.providerType === 'mock') {
      throw new Error('Use MockWhatsAppProvider for mock type')
    }

    if (this.config.providerType === 'meta_cloud_api') {
      return this._sendMetaCloud(payload)
    }

    return this._sendGeneric(payload)
  }

  async _sendMetaCloud(payload) {
    const { phoneNumberId, accessToken, apiBaseUrl } = this.config

    if (!phoneNumberId) {
      return {
        success: false,
        message_id: null,
        status: 'error',
        error: 'phoneNumberId is required for Meta Cloud API'
      }
    }

    if (!accessToken) {
      return {
        success: false,
        message_id: null,
        status: 'error',
        error: 'accessToken is required for Meta Cloud API'
      }
    }

    if (!payload.to) {
      return {
        success: false,
        message_id: null,
        status: 'error',
        error: 'Recipient (to) is required'
      }
    }

    const body = this._buildMessageBody(payload)

    try {
      const response = await this._httpsPost(
        `${apiBaseUrl}/${phoneNumberId}/messages`,
        accessToken,
        body
      )

      if (response.error) {
        this.logger.error({
          to: payload.to,
          template: payload.template,
          metaError: response.error
        }, 'Meta Cloud API returned error')

        return {
          success: false,
          message_id: null,
          status: 'failed',
          error: response.error.message || JSON.stringify(response.error),
          provider: 'meta_cloud_api'
        }
      }

      const messageId = response.messages?.[0]?.id || null

      this.logger.info({
        messageId,
        to: payload.to,
        template: payload.template,
        companyId: this.config.companyId
      }, 'WhatsApp message sent via Meta Cloud API')

      return {
        success: true,
        message_id: messageId,
        status: 'sent',
        provider: 'meta_cloud_api'
      }
    } catch (error) {
      this.logger.error({
        to: payload.to,
        template: payload.template,
        error: error.message
      }, 'Meta Cloud API request failed')

      return {
        success: false,
        message_id: null,
        status: 'failed',
        error: error.message,
        provider: 'meta_cloud_api'
      }
    }
  }

  _buildMessageBody(payload) {
    const base = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: payload.to
    }

    if (payload.template) {
      const variables = payload.variables || {}
      const parameters = Object.values(variables).map(value => ({
        type: 'text',
        text: String(value)
      }))

      base.type = 'template'
      base.template = {
        name: payload.template,
        language: {
          code: 'pt_BR'
        }
      }

      if (parameters.length > 0) {
        base.template.components = [
          {
            type: 'body',
            parameters
          }
        ]
      }
    } else if (payload.text) {
      base.type = 'text'
      base.text = {
        preview_url: false,
        body: payload.text
      }
    }

    return base
  }

  _sendGeneric(payload) {
    this.logger.info({
      to: payload.to,
      template: payload.template,
      providerType: this.config.providerType,
      companyId: this.config.companyId
    }, 'WhatsApp send (generic provider — not implemented)')

    return {
      success: false,
      message_id: null,
      status: 'not_implemented',
      error: `Send not implemented for provider type: ${this.config.providerType}`
    }
  }

  _httpsPost(url, token, body) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url)

      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }

      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data)
            resolve(parsed)
          } catch {
            resolve({ error: { message: `Non-JSON response: ${data.slice(0, 200)}` } })
          }
        })
      })

      req.on('error', (err) => reject(new Error(`HTTP request failed: ${err.message}`)))
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')) })

      req.write(JSON.stringify(body))
      req.end()
    })
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

    if (this.config.providerType !== 'mock' && !this.config.accessToken) {
      errors.push('accessToken is required for non-mock providers')
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
      apiBaseUrl: this.config.apiBaseUrl ? '***configured***' : null,
      tokenConfigured: !!this.config.accessToken
    }
  }
}

module.exports = WhatsAppProvider
