'use strict';

// Paths que não devem poluir o log (healthcheck, etc.)
const SKIP_PATHS = ['/api/health', '/api/health/deep', '/favicon.ico'];

function requestLoggerMiddleware(req, res, next) {
  if (SKIP_PATHS.some(p => req.path.startsWith(p))) return next();

  const startAt = Date.now();
  const log = req.logger || req.log || require('../shared/core/logger/logger');

  log.info({ method: req.method, url: req.originalUrl }, 'request started');

  res.on('finish', () => {
    const durationMs = Date.now() - startAt;
    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'info';

    log[level](
      { method: req.method, url: req.originalUrl, statusCode: res.statusCode, durationMs },
      'request completed'
    );
  });

  next();
}

module.exports = requestLoggerMiddleware;
