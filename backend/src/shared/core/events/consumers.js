const { eventBus } = require('./event-bus')
const { appLogger } = require('../logger')

function auditLogConsumer(event) {
  const logger = appLogger.child({ consumer: 'AuditLog' })

  logger.info({
    event_id: event.event_id,
    event_name: event.event_name,
    company_id: event.company_id,
    aggregate_type: event.aggregate_type,
    aggregate_id: event.aggregate_id,
    occurred_at: event.occurred_at,
    payload_keys: Object.keys(event.payload || {})
  }, `AUDIT: ${event.event_name}`)
}

function eventLoggerConsumer(event) {
  const logger = appLogger.child({ consumer: 'EventLogger' })

  logger.debug({
    event_id: event.event_id,
    event_name: event.event_name,
    company_id: event.company_id,
    metadata: event.metadata
  }, `EVENT LOG: ${event.event_name}`)
}

function registerDefaultConsumers() {
  eventBus.subscribe('appointment.created', auditLogConsumer, { consumer_name: 'AuditLog' })
  eventBus.subscribe('appointment.confirmed', auditLogConsumer, { consumer_name: 'AuditLog' })
  eventBus.subscribe('appointment.canceled', auditLogConsumer, { consumer_name: 'AuditLog' })
  eventBus.subscribe('appointment.completed', auditLogConsumer, { consumer_name: 'AuditLog' })
  eventBus.subscribe('appointment.rescheduled', auditLogConsumer, { consumer_name: 'AuditLog' })

  eventBus.subscribe('appointment.created', eventLoggerConsumer, { consumer_name: 'EventLogger' })
  eventBus.subscribe('appointment.confirmed', eventLoggerConsumer, { consumer_name: 'EventLogger' })
  eventBus.subscribe('appointment.canceled', eventLoggerConsumer, { consumer_name: 'EventLogger' })
  eventBus.subscribe('appointment.completed', eventLoggerConsumer, { consumer_name: 'EventLogger' })
  eventBus.subscribe('appointment.rescheduled', eventLoggerConsumer, { consumer_name: 'EventLogger' })
}

module.exports = {
  auditLogConsumer,
  eventLoggerConsumer,
  registerDefaultConsumers
}
