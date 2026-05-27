const { eventBus } = require('../../shared/core/events')
const { appLogger } = require('../../shared/core/logger')
const { INTEGRATION_CHANNELS, INTEGRATION_DIRECTIONS } = require('../contracts')

class WhatsAppWebhook {
  constructor(config = {}) {
    this.config = config
    this.logger = appLogger.child({ module: 'WhatsAppWebhook' })
    this.verifyToken = config.verifyToken || process.env.WHATSAPP_VERIFY_TOKEN || ''
  }

  async handleVerification(req, res) {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']

    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.info('WhatsApp webhook verified successfully')
      res.status(200).send(challenge)
      return true
    }

    this.logger.warn({ mode, token }, 'WhatsApp webhook verification failed')
    res.status(403).json({ error: 'Verification failed' })
    return false
  }

  async handleIncoming(req, res) {
    try {
      const body = req.body

      if (!body || !body.object) {
        res.status(400).json({ error: 'Invalid webhook payload' })
        return
      }

      if (body.object !== 'whatsapp_business_account') {
        res.status(200).json({ status: 'ignored' })
        return
      }

      const entries = body.entry || []

      for (const entry of entries) {
        const changes = entry.changes || []

        for (const change of changes) {
          if (change.field === 'messages') {
            await this._processMessageChange(change.value)
          }
        }
      }

      res.status(200).json({ status: 'received' })
    } catch (error) {
      this.logger.error({ error: error.message }, 'Error processing WhatsApp webhook')
      res.status(500).json({ error: 'Internal error processing webhook' })
    }
  }

  async _processMessageChange(value) {
    if (!value) return

    const messages = value.messages || []

    for (const message of messages) {
      eventBus.publish('integration.whatsapp.message_received', {
        provider_message_id: message.id,
        from: message.from,
        timestamp: message.timestamp,
        type: message.type,
        text: message.text?.body || null,
        companyId: value.metadata?.phone_number_id || null
      }, {
        company_id: value.metadata?.phone_number_id || null,
        aggregate_type: 'whatsapp_message',
        aggregate_id: message.id,
        source: 'WhatsAppWebhook'
      })
    }

    const statuses = value.statuses || []

    for (const status of statuses) {
      eventBus.publish('integration.whatsapp.status_update', {
        provider_message_id: status.id,
        status: status.status,
        timestamp: status.timestamp,
        recipient_id: status.recipient_id,
        errors: status.errors || []
      }, {
        company_id: value.metadata?.phone_number_id || null,
        aggregate_type: 'whatsapp_status',
        aggregate_id: status.id,
        source: 'WhatsAppWebhook'
      })
    }
  }

  validatePayload(body) {
    if (!body) return { valid: false, error: 'Empty body' }
    if (!body.object) return { valid: false, error: 'Missing object field' }
    if (!body.entry || !Array.isArray(body.entry)) {
      return { valid: false, error: 'Missing or invalid entry array' }
    }
    return { valid: true }
  }
}

module.exports = WhatsAppWebhook
