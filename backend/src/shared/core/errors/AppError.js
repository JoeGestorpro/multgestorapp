class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', metadata = {}) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.metadata = metadata
    this.traceId = null
    this.timestamp = new Date().toISOString()
    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = { AppError }
