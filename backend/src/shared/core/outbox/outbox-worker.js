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
    this.handlers.set(eventType, handler)
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
    const handler = this.handlers.get(event.type)

    if (!handler) {
      await this.pool.query(
        `UPDATE outbox_messages
         SET status = 'failed', last_error = $2
         WHERE id = $1`,
        [event.id, 'No handler registered for type: ' + event.type]
      )
      return
    }

    try {
      await handler(event.payload, {
        traceId: event.trace_id,
        companyId: event.company_id,
        eventId: event.id
      })

      await this.pool.query(
        `UPDATE outbox_messages
         SET status = 'processed', processed_at = NOW()
         WHERE id = $1`,
        [event.id]
      )
    } catch (err) {
      const nextRetry = (event.retry_count || 0) + 1

      if (nextRetry >= event.max_retries) {
        await this.pool.query(
          `UPDATE outbox_messages
           SET status = 'failed', retry_count = $2, last_error = $3
           WHERE id = $1`,
          [event.id, nextRetry, err.message]
        )
      } else {
        const delaySeconds = Math.pow(2, nextRetry)
        await this.pool.query(
          `UPDATE outbox_messages
           SET status = 'pending', retry_count = $2, last_error = $3,
               next_retry_at = NOW() + make_interval(secs => $4)
           WHERE id = $1`,
          [event.id, nextRetry, err.message, delaySeconds]
        )
      }
    }
  }
}

module.exports = OutboxWorker
