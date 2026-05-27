'use strict';

// Silencia o logger antes de importar qualquer módulo
process.env.LOG_LEVEL = 'silent';
process.env.NODE_ENV  = 'test';

const express      = require('express');
const request      = require('supertest');
const correlationId = require('../../src/middlewares/correlation-id.middleware');
const requestLogger = require('../../src/middlewares/request-logger.middleware');
const errorHandler  = require('../../src/middlewares/error-handler.middleware');

function buildApp(extraRoute) {
  const app = express();
  app.use(correlationId);
  app.use(requestLogger);
  if (extraRoute) extraRoute(app);
  app.use(errorHandler);
  return app;
}

describe('correlationId middleware', () => {
  it('gera X-Request-Id quando o header não é enviado', async () => {
    const app = buildApp(a => a.get('/test', (req, res) => res.json({ ok: true })));
    const res = await request(app).get('/test');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(typeof res.headers['x-request-id']).toBe('string');
    expect(res.headers['x-request-id'].length).toBeGreaterThan(10);
  });

  it('propaga X-Request-Id recebido no header', async () => {
    const app = buildApp(a => a.get('/test', (req, res) => res.json({ ok: true })));
    const res = await request(app).get('/test').set('x-request-id', 'meu-id-123');
    expect(res.headers['x-request-id']).toBe('meu-id-123');
  });

  it('adiciona req.correlationId e req.logger', async () => {
    const app = buildApp(a =>
      a.get('/test', (req, res) =>
        res.json({ hasId: !!req.correlationId, hasLogger: !!req.logger })
      )
    );
    const res = await request(app).get('/test');
    expect(res.body.hasId).toBe(true);
    expect(res.body.hasLogger).toBe(true);
  });
});

describe('errorHandler middleware', () => {
  it('retorna 500 para erros sem statusCode', async () => {
    const app = buildApp(a =>
      a.get('/boom', () => { throw new Error('erro inesperado'); })
    );
    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('retorna statusCode do erro quando definido', async () => {
    const app = buildApp(a =>
      a.get('/bad', () => {
        const err = new Error('bad request');
        err.statusCode = 400;
        throw err;
      })
    );
    const res = await request(app).get('/bad');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('bad request');
  });

  it('não vaza stack trace em produção', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const app = buildApp(a =>
      a.get('/leak', () => { throw new Error('segredo'); })
    );
    const res = await request(app).get('/leak');
    expect(res.body.stack).toBeUndefined();
    process.env.NODE_ENV = origEnv;
  });
});
