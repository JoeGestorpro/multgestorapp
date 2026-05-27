const { AppError } = require('./AppError')

class ValidationError extends AppError {
  constructor(message = 'Dados inválidos', errors = []) {
    super(message, 400, 'VALIDATION_ERROR', { fields: errors })
  }
}

module.exports = { ValidationError }
