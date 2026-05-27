'use strict';

const { randomUUID } = require('crypto');
const logger = require('../shared/core/logger/logger');

function correlationIdMiddleware(req, res, next) {
  const id = req.headers['x-request-id'] || randomUUID();
  req.correlationId = id;
  res.setHeader('X-Request-Id', id);
  req.logger = logger.child({ requestId: id });
  // Compatibilidade com código existente que usa req.log
  req.log = req.logger;
  next();
}

module.exports = correlationIdMiddleware;
