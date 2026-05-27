'use strict';

const logger = require('../shared/core/logger/logger');
const sentry = require('../shared/core/monitoring/sentry');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const log = req.logger || req.log || logger;
  const statusCode = err.statusCode || err.status || 500;

  if (statusCode >= 500) {
    log.error(
      { err: { message: err.message, stack: err.stack, code: err.code }, statusCode },
      'unhandled server error'
    );
    if (sentry.isEnabled()) {
      sentry.captureException(err, { requestId: req.correlationId });
    }
  } else {
    log.warn(
      { err: { message: err.message, code: err.code }, statusCode },
      'client error'
    );
  }

  if (res.headersSent) return next(err);

  return res.status(statusCode).json({
    success: false,
    error: statusCode < 500 ? err.message : 'Erro interno do servidor.',
    ...(process.env.NODE_ENV !== 'production' && statusCode >= 500
      ? { stack: err.stack }
      : {}),
  });
}

module.exports = errorHandler;
