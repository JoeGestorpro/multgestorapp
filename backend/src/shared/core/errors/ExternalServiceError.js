const { AppError } = require('./AppError')

class ExternalServiceError extends AppError {
  constructor(message = 'Serviço externo indisponível', service = 'unknown') {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', { service })
  }
}

module.exports = { ExternalServiceError }
