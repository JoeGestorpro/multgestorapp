'use strict';

const cacheManager = require('../shared/core/cache/cache-manager');
const redisClient = require('../shared/core/cache/redis-client');
const { appLogger } = require('../shared/core/logger');

let _lastDegradationWarnAt = 0;
const DEGRADATION_WARN_INTERVAL_MS = 60_000;

function createRateLimit(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 5;

  return async function rateLimit(req, res, next) {
    const key = `mg:ratelimit:${req.ip}:${req.method}:${req.path}`;
    const windowKey = `${key}:${Math.floor(Date.now() / windowMs)}`;

    if (!redisClient.isAvailable()) {
      const now = Date.now();
      if (now - _lastDegradationWarnAt >= DEGRADATION_WARN_INTERVAL_MS) {
        _lastDegradationWarnAt = now;
        const logger = req.logger || appLogger;
        logger.warn('[RateLimit] degradado para memória — Redis indisponível');
      }
    }

    try {
      const count = await cacheManager.incr(windowKey, windowMs);

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
      res.setHeader('X-RateLimit-Reset', Math.ceil((Math.floor(Date.now() / windowMs) * windowMs + windowMs) / 1000));

      if (count > max) {
        return res.status(429).json({
          success: false,
          error: 'Muitas tentativas. Tente novamente em alguns minutos.'
        });
      }

      next();
    } catch (err) {
      // DECISÃO: fail-open — disponibilidade > limite estrito sob falha de Redis
      const logger = req.logger || appLogger;
      logger.warn({ err: err.message }, '[RateLimit] erro inesperado — fail-open, request liberada');
      next();
    }
  };
}

createRateLimit._resetWarnThrottle = () => { _lastDegradationWarnAt = 0; };

module.exports = createRateLimit;
