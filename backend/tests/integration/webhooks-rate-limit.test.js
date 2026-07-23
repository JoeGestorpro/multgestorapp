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
  let originalRedisUrl;

  beforeAll(() => {
    jest.resetModules();
    process.env.WEBHOOK_RATELIMIT_MAX = String(TEST_MAX);
    process.env.WEBHOOK_RATELIMIT_WINDOW_MS = String(60 * 1000);

    // Força o path IN-MEMORY do limiter (determinístico) removendo REDIS_URL antes
    // de carregar os módulos. Em CI, REDIS_URL está presente e o redis-client conecta
    // de forma assíncrona (_available só vira true no evento 'ready') — durante o
    // warmup, requests iniciais caem em memória e as seguintes em Redis, dividindo o
    // contador entre dois backends e tornando o teste flaky. O objetivo aqui é validar
    // a LÓGICA de decisão do limiter (429 após o teto), não a integração com Redis;
    // o fallback in-memory é um caminho legítimo e documentado do middleware.
    originalRedisUrl = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    jest.resetModules();

    // Requerido APÓS setar/limpar env — webhook-rate-limit.js e redis-client leem env no load.
    const { createIntegrationApp, registerRoutes } = require('../helpers/integration-app');
    const webhooksRoutes = require('../../src/routes/webhooks.routes');

    app = createIntegrationApp();
    registerRoutes(app, [{ path: '/api/webhooks', router: webhooksRoutes }]);
  });

  afterAll(() => {
    delete process.env.WEBHOOK_RATELIMIT_MAX;
    delete process.env.WEBHOOK_RATELIMIT_WINDOW_MS;
    if (originalRedisUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalRedisUrl;
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
