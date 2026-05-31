const { eventBus } = require('../../shared/core/events')
const { appLogger } = require('../../shared/core/logger')
const { INTEGRATION_CHANNELS } = require('../contracts')

class AppointmentIntegrationConsumer {
  constructor(integrationManager, options = {}) {
    this.integrationManager = integrationManager
    this.whatsappResolver = options.whatsappResolver || null
    this.logger = appLogger.child({ module: 'AppointmentIntegrationConsumer' })
  }

  async handleConfirmed(event) {
    const { payload, company_id } = event

    this.logger.info({
      event_id: event.event_id,
      appointment_id: payload.appointment_id,
      company_id
    }, 'Processing appointment.confirmed for integration')

    if (!company_id) {
      this.logger.warn({ event_id: event.event_id }, 'Missing company_id, skipping integration')
      return
    }

    const whatsappPayload = {
      to: payload.customer_phone,
      template: 'appointment_confirmed',
      variables: {
        customer_name: payload.customer_name || 'Cliente',
        appointment_date: payload.starts_at ? new Date(payload.starts_at).toLocaleDateString('pt-BR') : '',
        appointment_time: payload.starts_at ? new Date(payload.starts_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
      }
    }

    const result = await this._sendWithResolver(
      INTEGRATION_CHANNELS.WHATSAPP,
      whatsappPayload,
      { company_id }
    )

    this.logger.info({
      event_id: event.event_id,
      appointment_id: payload.appointment_id,
      result
    }, 'Appointment confirmed integration processed')

    return result
  }

  async handleCanceled(event) {
    const { payload, company_id } = event

    this.logger.info({
      event_id: event.event_id,
      appointment_id: payload.appointment_id,
      company_id
    }, 'Processing appointment.canceled for integration')

    if (!company_id) {
      this.logger.warn({ event_id: event.event_id }, 'Missing company_id, skipping integration')
      return
    }

    const whatsappPayload = {
      to: payload.customer_phone,
      template: 'appointment_canceled',
      variables: {
        customer_name: payload.customer_name || 'Cliente',
        canceled_reason: payload.canceled_reason || ''
      }
    }

    const result = await this._sendWithResolver(
      INTEGRATION_CHANNELS.WHATSAPP,
      whatsappPayload,
      { company_id }
    )

    this.logger.info({
      event_id: event.event_id,
      appointment_id: payload.appointment_id,
      result
    }, 'Appointment canceled integration processed')

    return result
  }

  async _sendWithResolver(channel, payload, metadata) {
    if (this.whatsappResolver) {
      try {
        const provider = await this.whatsappResolver.resolveProviderForCompany(metadata.company_id)
        if (provider) {
          return {
            ...await provider.send(payload),
            channel,
            company_id: metadata.company_id
          }
        }
      } catch (err) {
        this.logger.warn({ error: err.message, company_id: metadata.company_id }, 'Resolver failed, falling back to integration manager')
      }
    }

    return this.integrationManager.send(channel, payload, metadata)
  }

  register() {
    eventBus.subscribe(
      'appointment.confirmed',
      (event) => this.handleConfirmed(event),
      { consumer_name: 'AppointmentIntegrationConsumer:confirmed' }
    )

    eventBus.subscribe(
      'appointment.canceled',
      (event) => this.handleCanceled(event),
      { consumer_name: 'AppointmentIntegrationConsumer:canceled' }
    )

    this.logger.info('Appointment integration consumers registered')
  }
}

module.exports = AppointmentIntegrationConsumer
