const { eventBus } = require('./event-bus')
const { appLogger } = require('../logger')
const {
  AppointmentCreated,
  AppointmentConfirmed,
  AppointmentCanceled,
  AppointmentCompleted,
  AppointmentRescheduled,
  AiSuggestionGenerated
} = require('./contracts')

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
  eventBus.subscribe(AppointmentCreated.event_name, auditLogConsumer, { consumer_name: 'AuditLog' })
  eventBus.subscribe(AppointmentConfirmed.event_name, auditLogConsumer, { consumer_name: 'AuditLog' })
  eventBus.subscribe(AppointmentCanceled.event_name, auditLogConsumer, { consumer_name: 'AuditLog' })
  eventBus.subscribe(AppointmentCompleted.event_name, auditLogConsumer, { consumer_name: 'AuditLog' })
  eventBus.subscribe(AppointmentRescheduled.event_name, auditLogConsumer, { consumer_name: 'AuditLog' })

  eventBus.subscribe(AppointmentCreated.event_name, eventLoggerConsumer, { consumer_name: 'EventLogger' })
  eventBus.subscribe(AppointmentConfirmed.event_name, eventLoggerConsumer, { consumer_name: 'EventLogger' })
  eventBus.subscribe(AppointmentCanceled.event_name, eventLoggerConsumer, { consumer_name: 'EventLogger' })
  eventBus.subscribe(AppointmentCompleted.event_name, eventLoggerConsumer, { consumer_name: 'EventLogger' })
  eventBus.subscribe(AppointmentRescheduled.event_name, eventLoggerConsumer, { consumer_name: 'EventLogger' })

  eventBus.subscribe(AiSuggestionGenerated.event_name, auditLogConsumer, { consumer_name: 'AuditLog' })
}

function handleAppointmentCreated(payload, context) {
  const logger = appLogger.child({ consumer: 'AuditLog', handler: 'outbox' })

  logger.info({
    event_id: context.eventId,
    event_name: AppointmentCreated.event_name,
    company_id: context.companyId,
    aggregate_type: AppointmentCreated.aggregate_type,
    aggregate_id: payload.appointment_id,
    occurred_at: new Date().toISOString(),
    payload_keys: Object.keys(payload || {})
  }, `AUDIT: ${AppointmentCreated.event_name}`)
}

function handleAppointmentCreatedEventLog(payload, context) {
  const logger = appLogger.child({ consumer: 'EventLogger', handler: 'outbox' })

  logger.debug({
    event_id: context.eventId,
    event_name: AppointmentCreated.event_name,
    company_id: context.companyId,
    metadata: { traceId: context.traceId, companyId: context.companyId }
  }, `EVENT LOG: ${AppointmentCreated.event_name}`)
}

function handleAppointmentConfirmed(payload, context) {
  const logger = appLogger.child({ consumer: 'AuditLog', handler: 'outbox' })

  logger.info({
    event_id: context.eventId,
    event_name: AppointmentConfirmed.event_name,
    company_id: context.companyId,
    aggregate_type: AppointmentConfirmed.aggregate_type,
    aggregate_id: payload.appointment_id,
    occurred_at: new Date().toISOString(),
    payload_keys: Object.keys(payload || {})
  }, `AUDIT: ${AppointmentConfirmed.event_name}`)
}

function handleAppointmentCanceled(payload, context) {
  const logger = appLogger.child({ consumer: 'AuditLog', handler: 'outbox' })

  logger.info({
    event_id: context.eventId,
    event_name: AppointmentCanceled.event_name,
    company_id: context.companyId,
    aggregate_type: AppointmentCanceled.aggregate_type,
    aggregate_id: payload.appointment_id,
    occurred_at: new Date().toISOString(),
    payload_keys: Object.keys(payload || {})
  }, `AUDIT: ${AppointmentCanceled.event_name}`)
}

function handleAppointmentCompleted(payload, context) {
  const logger = appLogger.child({ consumer: 'AuditLog', handler: 'outbox' })

  logger.info({
    event_id: context.eventId,
    event_name: AppointmentCompleted.event_name,
    company_id: context.companyId,
    aggregate_type: AppointmentCompleted.aggregate_type,
    aggregate_id: payload.appointment_id,
    occurred_at: new Date().toISOString(),
    payload_keys: Object.keys(payload || {})
  }, `AUDIT: ${AppointmentCompleted.event_name}`)
}

function handleAppointmentRescheduled(payload, context) {
  const logger = appLogger.child({ consumer: 'AuditLog', handler: 'outbox' })

  logger.info({
    event_id: context.eventId,
    event_name: AppointmentRescheduled.event_name,
    company_id: context.companyId,
    aggregate_type: AppointmentRescheduled.aggregate_type,
    aggregate_id: payload.appointment_id,
    occurred_at: new Date().toISOString(),
    payload_keys: Object.keys(payload || {})
  }, `AUDIT: ${AppointmentRescheduled.event_name}`)
}

module.exports = {
  auditLogConsumer,
  eventLoggerConsumer,
  handleAppointmentCreated,
  handleAppointmentCreatedEventLog,
  handleAppointmentConfirmed,
  handleAppointmentCanceled,
  handleAppointmentCompleted,
  handleAppointmentRescheduled,
  registerDefaultConsumers
}
