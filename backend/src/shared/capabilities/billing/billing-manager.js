const { AppError, UnauthorizedError } = require('../../core/errors')
const { appLogger } = require('../../core/logger')
const pool = require('../../../config/database')
const { eventTypeToDomainEvent } = require('./contracts')
const { createUnitOfWork } = require('../../core/database/unit-of-work')

async function requireFinanceTables() {
  const result = await pool.query(
    `SELECT to_regclass('public.payment_gateway_events') AS payment_gateway_events,
            to_regclass('public.invoices') AS invoices,
            to_regclass('public.subscription_events') AS subscription_events`
  )

  const row = result.rows[0] || {}
  if (!row.payment_gateway_events || !row.invoices || !row.subscription_events) {
    throw new AppError('Migrations financeiras nao aplicadas', 503, 'MIGRATION_PENDING')
  }
}

class BillingManager {
  constructor(providerRegistry) {
    this.providerRegistry = providerRegistry
  }

  async handleWebhook(providerName, req, rawPayload) {
    const ProviderClass = this.providerRegistry.get(providerName)
    if (!ProviderClass) {
      throw new AppError(`Billing provider '${providerName}' not found`, 400)
    }

    const provider = new ProviderClass()

    let isValid
    try {
      isValid = provider.verifySignature(req)
    } catch (err) {
      throw new AppError(err.message, 500, 'CONFIGURATION_ERROR')
    }
    if (!isValid) {
      throw new UnauthorizedError('Webhook nao autorizado')
    }

    if (rawPayload === undefined) {
      rawPayload = provider.parse(req)
    }
    const normalized = provider.normalize(rawPayload)

    await requireFinanceTables()

    const rawBody = JSON.stringify(rawPayload || {})
    const uow = createUnitOfWork()
    await uow.begin()

    try {
      const inserted = await uow.client.query(
        `INSERT INTO payment_gateway_events (gateway, event_id, event_type, processing_status, raw_body, payload)
         VALUES ($1, $2, $3, 'pending', $4, $5::jsonb)
         ON CONFLICT (gateway, event_id) DO NOTHING
         RETURNING id`,
        [normalized.provider, normalized.event_id, normalized.event_type, rawBody, rawBody]
      )

      if (inserted.rowCount === 0) {
        const existing = await uow.client.query(
          `SELECT id, processing_status, company_id, subscription_id, created_at
           FROM payment_gateway_events
           WHERE gateway = $1 AND event_id = $2
           LIMIT 1`,
          [normalized.provider, normalized.event_id]
        )

        await uow.rollback()
        return {
          duplicate: true,
          eventId: normalized.event_id,
          eventType: normalized.event_type,
          paymentGatewayEvent: existing.rows[0] || null
        }
      }

      const paymentEventId = inserted.rows[0].id
      const domainEventType = eventTypeToDomainEvent(normalized.event_type)

      uow.addEvent(domainEventType, {
        payment_gateway_event_id: paymentEventId,
        provider: normalized.provider,
        event_id: normalized.event_id,
        event_type: normalized.event_type,
        status: normalized.status,
        company: normalized.company,
        customer: normalized.customer,
        finance: normalized.finance,
        raw: normalized.raw
      }, {
        aggregateType: 'payment',
        aggregateId: normalized.event_id
      })

      await uow.commit()

      return {
        processed: true,
        eventId: normalized.event_id,
        eventType: normalized.event_type,
        duplicate: false
      }
    } catch (error) {
      await uow.rollback()

      try {
        await pool.query(
          `UPDATE payment_gateway_events
           SET processing_status = 'error',
               error_message = $2,
               processed_at = NOW()
           WHERE gateway = $1 AND event_id = $2`,
          [normalized.provider, normalized.event_id]
        )
      } catch (updateError) {
        appLogger.error({ err: updateError }, '[billing-webhook-error-log-failed]')
      }

      throw error
    }
  }
}

module.exports = { BillingManager, requireFinanceTables }
