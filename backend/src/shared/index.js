const errors = require('./core/errors')
const responses = require('./core/responses')
const logger = require('./core/logger')
const { requestLogger } = require('./core/logger/middleware')
const tenant = require('./tenant')
const validation = require('./core/validation')
const { UnitOfWork, createUnitOfWork } = require('./core/database/unit-of-work')
const { BaseRepository } = require('./core/database/BaseRepository')
const OutboxWorker = require('./core/outbox/outbox-worker')
const { eventBus, APPOINTMENT_EVENTS, validateEventPayload, registerDefaultConsumers } = require('./core/events')
const integration = require('../integrations')

module.exports = {
  ...errors,
  ...responses,
  ...logger,
  requestLogger,
  ...tenant,
  ...validation,
  schemas: validation.schemas,
  UnitOfWork,
  createUnitOfWork,
  BaseRepository,
  OutboxWorker,
  eventBus,
  APPOINTMENT_EVENTS,
  validateEventPayload,
  registerDefaultConsumers,
  integration,
}
