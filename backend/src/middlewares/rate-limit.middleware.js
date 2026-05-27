function createRateLimit(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 5;
  const hits = new Map();

  // Remove entradas expiradas periodicamente para evitar memory leak.
  // .unref() garante que o timer nao impeca o processo de encerrar normalmente.
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of hits) {
      if (value.resetAt <= now) hits.delete(key);
    }
  }, windowMs).unref();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const key = `${req.ip}:${req.method}:${req.originalUrl}`;
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return next();
    }

    current.count += 1;

    if (current.count > max) {
      return res.status(429).json({
        success: false,
        error: 'Muitas tentativas. Tente novamente em alguns minutos.'
      });
    }

    hits.set(key, current);
    return next();
  };
}

module.exports = createRateLimit;
