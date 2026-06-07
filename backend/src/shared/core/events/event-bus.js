const { EventEmitter } = require('events')
const { randomUUID } = require('crypto')
const { appLogger } = require('../logger')

class EventBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(50)
    this.consumers = new Map()
    this.logger = appLogger.child({ module: 'EventBus' })
  }

  publish(eventName, payload, metadata = {}) {
    const event = {
      event_id: randomUUID(),
      event_name: eventName,
      company_id: metadata.company_id || null,
      aggregate_type: metadata.aggregate_type || null,
      aggregate_id: metadata.aggregate_id || null,
      occurred_at: new Date().toISOString(),
      payload: payload || {},
      metadata: {
        source: metadata.source || 'unknown',
        trace_id: metadata.trace_id || null,
        ...metadata
      }
    }

    this.logger.info({
      event_id: event.event_id,
      event_name: event.event_name,
      company_id: event.company_id,
      aggregate_type: event.aggregate_type,
      aggregate_id: event.aggregate_id
    }, `Event published: ${eventName}`)

    this.emit(eventName, event)
    this.emit('*', event)

    return event
  }

  subscribe(eventName, handler, options = {}) {
    const consumerName = options.consumer_name || handler.name || 'anonymous'

    const wrappedHandler = async (event) => {
      const start = Date.now()
      try {
        await handler(event)
        this.logger.info({
          event_id: event.event_id,
          event_name: eventName,
          consumer: consumerName,
          duration_ms: Date.now() - start
        }, `Consumer processed: ${consumerName}`)
      } catch (err) {
        this.logger.error({
          event_id: event.event_id,
          event_name: eventName,
          consumer: consumerName,
          error: err.message,
          duration_ms: Date.now() - start
        }, `Consumer failed: ${consumerName}`)
      }
    }

    this.on(eventName, wrappedHandler)

    if (!this.consumers.has(eventName)) {
      this.consumers.set(eventName, [])
    }
    this.consumers.get(eventName).push({ consumer_name: consumerName, handler: wrappedHandler })

    this.logger.info({ event_name: eventName, consumer: consumerName }, 'Consumer registered')
  }

  getConsumerCount(eventName) {
    return this.consumers.get(eventName)?.length || 0
  }

  getRegisteredEvents() {
    return Array.from(this.consumers.keys())
  }
}

const eventBus = new EventBus()

module.exports = { EventBus, eventBus }
