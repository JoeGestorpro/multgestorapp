const { AppError } = require('./AppError')

class UnauthorizedError extends AppError {
  constructor(message = 'Autenticação necessária') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

module.exports = { UnauthorizedError }
