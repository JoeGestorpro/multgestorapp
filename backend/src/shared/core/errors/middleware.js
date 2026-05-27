const { randomUUID } = require('crypto')
const { AppError } = require('./AppError')
const { toAppError } = require('./toAppError')
const { appLogger } = require('../logger')

function correlationMiddleware(req, res, next) {
  req.traceId = req.headers['x-trace-id'] || req.headers['x-request-id'] || randomUUID()
  req.startTime = Date.now()
  res.setHeader('x-trace-id', req.traceId)
  res.setHeader('x-request-id', req.traceId)
  next()
}

function resolveFallbackMessage(err, req, res) {
  return req?.fallbackMessage || res?.locals?.fallbackMessage || null
}

function errorHandler(err, req, res, _next) {
  const traceId = req.traceId || randomUUID()
  const log = req.log || appLogger.child({ traceId })
  const appError = toAppError(err)
  appError.traceId = traceId

  const fallbackMessage = resolveFallbackMessage(err, req, res)
  const isInternal = appError.statusCode >= 500
  const responseMessage = isInternal
    ? (fallbackMessage || 'Erro interno do servidor')
    : appError.message

  if (isInternal) {
    log.error({ err: appError, statusCode: appError.statusCode, code: appError.code, metadata: appError.metadata, traceId }, appError.message)
  } else {
    log.warn({ err: appError, statusCode: appError.statusCode, code: appError.code, metadata: appError.metadata, traceId }, appError.message)
  }

  const body = {
    success: false,
    error: responseMessage,
    traceId,
  }

  if (appError.code) {
    body.code = appError.code
  }

  if (appError.metadata && Object.keys(appError.metadata).length > 0) {
    body.metadata = appError.metadata
  }

  return res.status(appError.statusCode).json(body)
}

function asyncHandler(fn, fallbackMessage) {
  return (req, res, next) => {
    if (fallbackMessage) {
      req.fallbackMessage = fallbackMessage
    }
    try {
      return Promise.resolve(fn(req, res, next)).catch(next)
    } catch (err) {
      next(err)
    }
  }
}

module.exports = { correlationMiddleware, errorHandler, asyncHandler }
