const { AppError } = require('./AppError')

class ConflictError extends AppError {
  constructor(message = 'Conflito') {
    super(message, 409, 'CONFLICT')
  }
}

module.exports = { ConflictError }
