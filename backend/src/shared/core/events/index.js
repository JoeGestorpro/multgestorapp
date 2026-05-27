const { EventBus, eventBus } = require('./event-bus')
const { APPOINTMENT_EVENTS, validateEventPayload } = require('./contracts')
const { registerDefaultConsumers } = require('./consumers')

module.exports = {
  EventBus,
  eventBus,
  APPOINTMENT_EVENTS,
  validateEventPayload,
  registerDefaultConsumers
}
