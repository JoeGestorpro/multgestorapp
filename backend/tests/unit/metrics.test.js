'use strict';

describe('metrics.js — Prometheus observability', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('register.metrics()', () => {
    it('retorna string com todas as metricas esperadas', async () => {
      const { register } = require('../../src/shared/core/monitoring/metrics');
      const output = await register.metrics();

      expect(typeof output).toBe('string');
      expect(output).toContain('http_requests_total');
      expect(output).toContain('http_request_duration_seconds');
      expect(output).toContain('outbox_messages_count');
      expect(output).toContain('db_pool_total');
      expect(output).toContain('db_pool_idle');
      expect(output).toContain('db_pool_waiting');
      expect(output).toContain('redis_up');
      expect(output).toContain('process_cpu');
    });
  });

  describe('httpMetricsMiddleware', () => {
    it('incrementa http_requests_total e observa duracao com status_class correto', (done) => {
      const { httpMetricsMiddleware, httpRequestsTotal } = require('../../src/shared/core/monitoring/metrics');

      const beforeValue = () => {
        const keys = Object.keys(httpRequestsTotal.hashMap);
        const match = keys.find(k => k.includes('method:GET') && k.includes('status_class:2xx'));
        return match ? httpRequestsTotal.hashMap[match].value : 0;
      };

      const before = beforeValue();

      const req = {
        method: 'GET',
        route: { path: '/api/test' },
      };

      const res = {
        statusCode: 200,
        on(event, cb) {
          if (event === 'finish') {
            cb();
            const after = beforeValue();
            expect(after).toBeGreaterThan(before);
            done();
          }
        },
      };

      httpMetricsMiddleware(req, res, () => {});
    });

    it('classifica 5xx corretamente', (done) => {
      jest.resetModules();
      const { httpMetricsMiddleware, httpRequestsTotal } = require('../../src/shared/core/monitoring/metrics');

      const beforeValue = () => {
        const keys = Object.keys(httpRequestsTotal.hashMap);
        const match = keys.find(k => k.includes('method:POST') && k.includes('status_class:5xx'));
        return match ? httpRequestsTotal.hashMap[match].value : 0;
      };

      const before = beforeValue();

      const req = {
        method: 'POST',
        route: { path: '/api/error' },
      };

      const res = {
        statusCode: 500,
        on(event, cb) {
          if (event === 'finish') {
            cb();
            const after = beforeValue();
            expect(after).toBeGreaterThan(before);
            done();
          }
        },
      };

      httpMetricsMiddleware(req, res, () => {});
    });
  });

  describe('updateOutboxMetrics', () => {
    it('popula gauge a partir de resultado de query mockado', async () => {
      const { updateOutboxMetrics, outboxMessagesCount } = require('../../src/shared/core/monitoring/metrics');

      const mockPool = {
        query: jest.fn().mockResolvedValue({
          rows: [
            { status: 'pending', cnt: 5 },
            { status: 'completed', cnt: 120 },
            { status: 'failed', cnt: 2 },
          ],
        }),
      };

      await updateOutboxMetrics(mockPool);

      const getGaugeValue = (status) => {
        const keys = Object.keys(outboxMessagesCount.hashMap);
        const match = keys.find(k => k.includes(`status:${status}`));
        return match ? outboxMessagesCount.hashMap[match].value : undefined;
      };

      expect(getGaugeValue('pending')).toBe(5);
      expect(getGaugeValue('completed')).toBe(120);
      expect(getGaugeValue('failed')).toBe(2);
    });
  });

  describe('normalizeRoute', () => {
    it('retorna route.path quando disponivel', () => {
      const { normalizeRoute } = require('../../src/shared/core/monitoring/metrics');
      expect(normalizeRoute({ route: { path: '/api/users/:id' } })).toBe('/api/users/:id');
    });

    it('retorna unknown quando route nao existe', () => {
      const { normalizeRoute } = require('../../src/shared/core/monitoring/metrics');
      expect(normalizeRoute({})).toBe('unknown');
    });
  });

  describe('statusClass', () => {
    it('classifica corretamente', () => {
      const { statusClass } = require('../../src/shared/core/monitoring/metrics');
      expect(statusClass(200)).toBe('2xx');
      expect(statusClass(301)).toBe('3xx');
      expect(statusClass(404)).toBe('4xx');
      expect(statusClass(500)).toBe('5xx');
    });
  });
});

describe('metrics.middleware.js — auth + endpoint', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('metricsAuthMiddleware', () => {
    it('retorna 401 quando METRICS_TOKEN esta setado e request sem Authorization', () => {
      process.env.METRICS_TOKEN = 'secret-token';
      jest.resetModules();
      const { metricsAuthMiddleware } = require('../../src/middlewares/metrics.middleware');

      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      metricsAuthMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('retorna 401 quando token fornecido nao confere', () => {
      process.env.METRICS_TOKEN = 'secret-token';
      jest.resetModules();
      const { metricsAuthMiddleware } = require('../../src/middlewares/metrics.middleware');

      const req = { headers: { authorization: 'Bearer wrong-token' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      metricsAuthMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('chama next quando token valido', () => {
      process.env.METRICS_TOKEN = 'secret-token';
      jest.resetModules();
      const { metricsAuthMiddleware } = require('../../src/middlewares/metrics.middleware');

      const req = { headers: { authorization: 'Bearer secret-token' } };
      const res = {};
      const next = jest.fn();

      metricsAuthMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('chama next quando METRICS_TOKEN nao esta setado (acesso livre)', () => {
      delete process.env.METRICS_TOKEN;
      jest.resetModules();
      const { metricsAuthMiddleware } = require('../../src/middlewares/metrics.middleware');

      const req = { headers: {} };
      const res = {};
      const next = jest.fn();

      metricsAuthMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('metricsEndpointHandler', () => {
    it('retorna 200 com Content-Type correto', async () => {
      jest.resetModules();
      const { metricsEndpointHandler } = require('../../src/middlewares/metrics.middleware');

      const res = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await metricsEndpointHandler({}, res);

      expect(res.set).toHaveBeenCalledWith('Content-Type', expect.stringContaining('text/plain'));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.any(String));
    });
  });
});
