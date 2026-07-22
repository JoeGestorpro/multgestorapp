'use strict';

// R-003 — Controle de abuso/flood dos webhooks públicos.
// Prova que os endpoints públicos de webhook (pagamento) aplicam rate limit
// IP-based ANTES do controller: após exceder o teto, a request recebe 429 sem
// alcançar a verificação de assinatura nem o banco.
//
// Não requer banco: o teto é atingido pelo middleware, que responde 429 antes
// de qualquer acesso a DB. As requests sob o teto falham cedo na verificação de
// assinatura (secret ausente em teste) — o que basta para incrementar o balde.

const supertest = require('supertest');

const TEST_MAX = 2; // teto pequeno só para o teste (default de produção é 600/min)

describe('Webhooks públicos — rate limit de abuso (R-003)', () => {
  let app;

  beforeAll(() => {
    jest.resetModules();
    process.env.WEBHOOK_RATELIMIT_MAX = String(TEST_MAX);
    process.env.WEBHOOK_RATELIMIT_WINDOW_MS = String(60 * 1000);

    // Requerido APÓS setar env — webhook-rate-limit.js lê o env no load.
    const { createIntegrationApp, registerRoutes } = require('../helpers/integration-app');
    const webhooksRoutes = require('../../src/routes/webhooks.routes');

    app = createIntegrationApp();
    registerRoutes(app, [{ path: '/api/webhooks', router: webhooksRoutes }]);
  });

  afterAll(() => {
    delete process.env.WEBHOOK_RATELIMIT_MAX;
    delete process.env.WEBHOOK_RATELIMIT_WINDOW_MS;
  });

  it('retorna 429 após exceder o teto no /kiwify, com corpo controlado', async () => {
    let last;
    // TEST_MAX requests passam do limiter (e falham cedo na assinatura); a
    // seguinte (TEST_MAX+1) é barrada pelo próprio limiter com 429.
    for (let i = 0; i < TEST_MAX + 1; i += 1) {
      last = await supertest(app).post('/api/webhooks/kiwify').send({ ping: i });
    }

    expect(last.status).toBe(429);
    expect(last.body).toMatchObject({ success: false });
    expect(String(last.body.error || '')).toMatch(/tentativas|minutos/i);
    // Header padrão do limiter presente.
    expect(last.headers['x-ratelimit-limit']).toBe(String(TEST_MAX));
  });

  it('mantém baldes independentes por endpoint (path no keyGenerator)', async () => {
    // /abacatepay tem balde próprio: a 1ª request nunca deve ser 429 mesmo após
    // o /kiwify já ter estourado no teste anterior.
    const first = await supertest(app).post('/api/webhooks/abacatepay').send({ ping: 'a' });
    expect(first.status).not.toBe(429);
  });
});
