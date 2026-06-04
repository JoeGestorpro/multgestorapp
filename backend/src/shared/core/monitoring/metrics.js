'use strict';

const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_class'],
  registers: [register],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_class'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const outboxMessagesCount = new client.Gauge({
  name: 'outbox_messages_count',
  help: 'Number of outbox messages by status',
  labelNames: ['status'],
  registers: [register],
});

const dbPoolTotal = new client.Gauge({
  name: 'db_pool_total',
  help: 'Total connections in database pool',
  registers: [register],
});

const dbPoolIdle = new client.Gauge({
  name: 'db_pool_idle',
  help: 'Idle connections in database pool',
  registers: [register],
});

const dbPoolWaiting = new client.Gauge({
  name: 'db_pool_waiting',
  help: 'Clients waiting for a database connection',
  registers: [register],
});

const redisUp = new client.Gauge({
  name: 'redis_up',
  help: 'Redis availability (1 = up, 0 = down)',
  registers: [register],
});

function normalizeRoute(req) {
  const route = req.route?.path;
  if (!route) return 'unknown';
  if (typeof route === 'string') return route;
  if (route instanceof RegExp) return 'regex';
  return 'unknown';
}

function statusClass(statusCode) {
  if (statusCode >= 500) return '5xx';
  if (statusCode >= 400) return '4xx';
  if (statusCode >= 300) return '3xx';
  if (statusCode >= 200) return '2xx';
  return 'other';
}

function httpMetricsMiddleware(req, res, next) {
  const end = httpRequestDurationSeconds.startTimer({
    method: req.method,
    route: normalizeRoute(req),
  });

  res.on('finish', () => {
    const route = normalizeRoute(req);
    const sc = statusClass(res.statusCode);
    end({ route, status_class: sc });
    httpRequestsTotal.inc({ method: req.method, route, status_class: sc });
  });

  next();
}

let _poolRef = null;
let _redisRef = null;
let _refreshTimer = null;

function setPoolRef(pool) {
  _poolRef = pool;
}

function setRedisRef(redis) {
  _redisRef = redis;
}

function updatePoolMetrics() {
  if (!_poolRef) return;
  try {
    dbPoolTotal.set(_poolRef.totalCount || 0);
    dbPoolIdle.set(_poolRef.idleCount || 0);
    dbPoolWaiting.set(_poolRef.waitingCount || 0);
  } catch (_) {}
}

function updateRedisMetrics() {
  if (!_redisRef) return;
  try {
    redisUp.set(_redisRef.isAvailable() ? 1 : 0);
  } catch (_) {
    redisUp.set(0);
  }
}

async function updateOutboxMetrics(pool) {
  if (!pool) return;
  try {
    const result = await pool.query(
      'SELECT status, count(*)::int AS cnt FROM outbox_messages GROUP BY status'
    );
    for (const row of result.rows) {
      outboxMessagesCount.set({ status: row.status }, row.cnt);
    }
  } catch (_) {}
}

function startPeriodicRefresh(pool, intervalMs) {
  const ms = intervalMs || Number(process.env.METRICS_REFRESH_MS || 15000);
  setPoolRef(pool);

  updatePoolMetrics();
  updateRedisMetrics();
  updateOutboxMetrics(pool);

  _refreshTimer = setInterval(() => {
    updatePoolMetrics();
    updateRedisMetrics();
    updateOutboxMetrics(pool);
  }, ms);

  if (_refreshTimer.unref) _refreshTimer.unref();
}

function stopPeriodicRefresh() {
  if (_refreshTimer) {
    clearInterval(_refreshTimer);
    _refreshTimer = null;
  }
}

module.exports = {
  register,
  httpMetricsMiddleware,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  outboxMessagesCount,
  dbPoolTotal,
  dbPoolIdle,
  dbPoolWaiting,
  redisUp,
  setPoolRef,
  setRedisRef,
  startPeriodicRefresh,
  stopPeriodicRefresh,
  normalizeRoute,
  statusClass,
  updateOutboxMetrics,
};
