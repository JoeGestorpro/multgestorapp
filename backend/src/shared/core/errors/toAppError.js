const { AppError } = require('./AppError')
const { ValidationError } = require('./ValidationError')
const { UnauthorizedError } = require('./UnauthorizedError')
const { ForbiddenError } = require('./ForbiddenError')
const { NotFoundError } = require('./NotFoundError')
const { ConflictError } = require('./ConflictError')

const STATUS_TO_ERROR_CLASS = {
  400: ValidationError,
  401: UnauthorizedError,
  403: ForbiddenError,
  404: NotFoundError,
  409: ConflictError,
}

function toAppError(err) {
  if (err instanceof AppError) return err

  const statusCode = err.statusCode || 500
  const ErrorClass = STATUS_TO_ERROR_CLASS[statusCode]

  if (ErrorClass) {
    return new ErrorClass(err.message)
  }

  return new AppError(err.message || 'Erro interno do servidor', statusCode, 'INTERNAL_ERROR')
}

module.exports = { toAppError }
