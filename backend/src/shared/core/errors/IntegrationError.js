const { AppError } = require('./AppError')

class IntegrationError extends AppError {
  constructor(message = 'Falha na integração', channel = 'unknown') {
    super(message, 502, 'INTEGRATION_ERROR', { channel })
  }
}

module.exports = { IntegrationError }
