const { appLogger } = require('../logger')

class OutboxWorker {
  constructor(pool, options = {}) {
    this.pool = pool
    this.handlers = new Map()
    this.batchSize = options.batchSize || 50
    this.pollIntervalMs = options.pollIntervalMs || 1000
    this.timer = null
    this.running = false
    this.onError = options.onError || null
  }

  register(eventType, handler) {
    const name = handler.name
    if (!name) {
      throw new Error(`[OutboxWorker] Handler para "${eventType}" deve ser uma função nomeada (handler.name vazio)`)
    }

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Map())
    }

    const handlersMap = this.handlers.get(eventType)
    if (handlersMap.has(name)) {
      throw new Error(`[OutboxWorker] Handler duplicado: "${name}" já registrado para "${eventType}"`)
    }

    handlersMap.set(name, handler)
  }

  start() {
    if (this.running) return
    this.running = true
    this.poll()
  }

  async startAndPoll() {
    if (this.running) return
    this.running = true
    await this.poll()
  }

  stop() {
    this.running = false
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  async poll() {
    try {
      const result = await this.pool.query(
        `UPDATE outbox_messages
         SET status = 'processing',
             locked_at = NOW(),
             locked_by = $1
         WHERE id IN (
           SELECT id FROM outbox_messages
           WHERE status = 'pending'
             AND (next_retry_at IS NULL OR next_retry_at <= NOW())
           ORDER BY created_at ASC
           LIMIT $2
           FOR UPDATE SKIP LOCKED
         )
         RETURNING *`,
        ['worker-' + process.pid, this.batchSize]
      )

      for (const row of result.rows) {
        await this._process(row)
      }
    } catch (err) {
      if (typeof this.onError === 'function') {
        this.onError(err)
      }
    }

    if (this.running) {
      this.timer = setTimeout(() => this.poll(), this.pollIntervalMs)
    }
  }

  async _process(event) {
    const handlersMap = this.handlers.get(event.type)

    if (!handlersMap || handlersMap.size === 0) {
      appLogger.warn({ event_id: event.id, type: event.type }, 'no handler registered — marked processed (no-op)')
      await this.pool.query(
        `UPDATE outbox_messages
         SET status = 'processed', processed_at = NOW()
         WHERE id = $1`,
        [event.id]
      )
      return
    }

    const context = {
      traceId: event.trace_id,
      companyId: event.company_id,
      eventId: event.id
    }

    let processedHandlers = new Set()
    try {
      const result = await this.pool.query(
        `SELECT handler_name FROM outbox_message_handlers
         WHERE message_id = $1 AND status = 'processed'`,
        [event.id]
      )
      for (const row of result.rows) {
        processedHandlers.add(row.handler_name)
      }
    } catch (_) {}

    let anyFailed = false
    let lastError = null

    for (const [name, handler] of handlersMap) {
      if (processedHandlers.has(name)) {
        continue
      }

      try {
        await handler(event.payload, context)
        await this.pool.query(
          `INSERT INTO outbox_message_handlers (message_id, handler_name, status, processed_at)
           VALUES ($1, $2, 'processed', NOW())
           ON CONFLICT (message_id, handler_name) DO UPDATE
             SET status = 'processed', processed_at = NOW(), last_error = NULL`,
          [event.id, name]
        )
      } catch (err) {
        lastError = err
        anyFailed = true
        try {
          await this.pool.query(
            `INSERT INTO outbox_message_handlers (message_id, handler_name, status, last_error)
             VALUES ($1, $2, 'failed', $3)
             ON CONFLICT (message_id, handler_name) DO UPDATE
               SET status = 'failed', last_error = $3`,
            [event.id, name, err.message]
          )
        } catch (_) {}
        break
      }
    }

    if (anyFailed) {
      const nextRetry = (event.retry_count || 0) + 1

      if (nextRetry >= event.max_retries) {
        await this.pool.query(
          `UPDATE outbox_messages
           SET status = 'failed', retry_count = $2, last_error = $3
           WHERE id = $1`,
          [event.id, nextRetry, lastError.message]
        )
      } else {
        const delaySeconds = Math.pow(2, nextRetry)
        await this.pool.query(
          `UPDATE outbox_messages
           SET status = 'pending', retry_count = $2, last_error = $3,
               next_retry_at = NOW() + make_interval(secs => $4)
           WHERE id = $1`,
          [event.id, nextRetry, lastError.message, delaySeconds]
        )
      }
      return
    }

    await this.pool.query(
      `UPDATE outbox_messages
       SET status = 'processed', processed_at = NOW()
       WHERE id = $1`,
      [event.id]
    )
  }
}

module.exports = OutboxWorker
