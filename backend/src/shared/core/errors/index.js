const { AppError } = require('./AppError')
const { ValidationError } = require('./ValidationError')
const { UnauthorizedError } = require('./UnauthorizedError')
const { ForbiddenError } = require('./ForbiddenError')
const { NotFoundError } = require('./NotFoundError')
const { ConflictError } = require('./ConflictError')
const { TenantIsolationError } = require('./TenantIsolationError')
const { ExternalServiceError } = require('./ExternalServiceError')
const { IntegrationError } = require('./IntegrationError')
const { toAppError } = require('./toAppError')
const { correlationMiddleware, errorHandler, asyncHandler } = require('./middleware')

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TenantIsolationError,
  ExternalServiceError,
  IntegrationError,
  toAppError,
  correlationMiddleware,
  errorHandler,
  asyncHandler,
}
