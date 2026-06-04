'use strict';

const { register, httpMetricsMiddleware } = require('../shared/core/monitoring/metrics');

function metricsAuthMiddleware(req, res, next) {
  const token = process.env.METRICS_TOKEN;
  if (!token) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const provided = authHeader.slice(7);
  if (provided !== token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

async function metricsEndpointHandler(req, res) {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.status(200).send(metrics);
  } catch (err) {
    res.status(500).send('# Error collecting metrics\n');
  }
}

module.exports = {
  httpMetricsMiddleware,
  metricsAuthMiddleware,
  metricsEndpointHandler,
};
