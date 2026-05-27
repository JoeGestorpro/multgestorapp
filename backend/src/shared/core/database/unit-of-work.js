const pool = require('../../../config/database')
const crypto = require('crypto')

class UnitOfWork {
  constructor(poolInstance) {
    this.pool = poolInstance
    this.client = null
    this.events = []
  }

  get isActive() {
    return this.client !== null
  }

  async begin() {
    if (this.isActive) {
      throw new Error('UnitOfWork already active')
    }

    this.client = await this.pool.connect()
    await this.client.query('BEGIN')
  }

  repository(RepoClass) {
    if (!this.isActive) {
      throw new Error('UnitOfWork not active — call begin() first')
    }

    return new RepoClass(this.client)
  }

  addEvent(type, payload, metadata = {}) {
    this.events.push({
      id: crypto.randomUUID(),
      type,
      payload,
      traceId: metadata.traceId || null,
      companyId: metadata.companyId || null,
      aggregateType: metadata.aggregateType || null,
      aggregateId: metadata.aggregateId || null,
      maxRetries: metadata.maxRetries ?? 5
    })
  }

  async commit() {
    if (!this.isActive) {
      throw new Error('UnitOfWork not active')
    }

    for (const event of this.events) {
      await this.client.query(
        `INSERT INTO outbox_messages
           (id, type, payload, trace_id, company_id,
            aggregate_type, aggregate_id, max_retries)
         VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [event.id, event.type, JSON.stringify(event.payload),
         event.traceId, event.companyId,
         event.aggregateType, event.aggregateId,
         event.maxRetries]
      )
    }

    await this.client.query('COMMIT')
    this._release()
  }

  async rollback() {
    if (!this.isActive) {
      return
    }

    try {
      await this.client.query('ROLLBACK')
    } finally {
      this.events = []
      this._release()
    }
  }

  _release() {
    if (this.client) {
      this.client.release()
      this.client = null
    }
  }
}

function createUnitOfWork() {
  return new UnitOfWork(pool)
}

module.exports = { UnitOfWork, createUnitOfWork }
