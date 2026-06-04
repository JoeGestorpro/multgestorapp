'use strict';

const mockRedisClient = {
  isAvailable: jest.fn(() => false),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(),
  del: jest.fn().mockResolvedValue(0),
  keys: jest.fn().mockResolvedValue([]),
  incr: jest.fn().mockResolvedValue(NaN),
  incrWithTTL: jest.fn().mockResolvedValue(NaN),
  quit: jest.fn().mockResolvedValue(),
};

jest.mock('../../src/shared/core/cache/redis-client', () => mockRedisClient);

jest.mock('../../src/shared/core/logger', () => ({
  appLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  },
}));

const cacheManager = require('../../src/shared/core/cache/cache-manager');
const createRateLimit = require('../../src/middlewares/rate-limit.middleware');
const { appLogger } = require('../../src/shared/core/logger');

describe('RateLimit Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    cacheManager._fbClear();
    jest.clearAllMocks();
    req = {
      ip: '127.0.0.1',
      method: 'GET',
      path: '/test',
      originalUrl: '/test?foo=bar',
    };
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('deixa passar requests abaixo do limite', async () => {
    const rl = createRateLimit({ windowMs: 60000, max: 5 });
    for (let i = 0; i < 5; i++) {
      await rl(req, res, next);
    }
    expect(next).toHaveBeenCalledTimes(5);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('bloqueia request quando excede o limite', async () => {
    const rl = createRateLimit({ windowMs: 60000, max: 3 });
    for (let i = 0; i < 3; i++) {
      await rl(req, res, next);
    }
    expect(next).toHaveBeenCalledTimes(3);
    await rl(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Muitas tentativas. Tente novamente em alguns minutos.'
    });
  });

  it('define headers de rate limit', async () => {
    const rl = createRateLimit({ windowMs: 60000, max: 10 });
    await rl(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 9);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
  });

  it('usa req.path e ignora query strings', async () => {
    const rl = createRateLimit({ windowMs: 60000, max: 2 });
    await rl(req, res, next);
    req.originalUrl = '/test?bar=baz';
    await rl(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);
    await rl(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('usa valores default quando nenhuma opcao passada', async () => {
    const rl = createRateLimit();
    // Default max = 5, windowMs = 15 min
    for (let i = 0; i < 5; i++) {
      await rl(req, res, next);
    }
    expect(next).toHaveBeenCalledTimes(5);
    await rl(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('diferentes IPs tem contadores separados', async () => {
    const rl = createRateLimit({ windowMs: 60000, max: 2 });
    await rl(req, res, next);
    req.ip = '192.168.1.2';
    await rl(req, res, next);
    await rl(req, res, next);
    expect(next).toHaveBeenCalledTimes(3);
  });
});

describe('RateLimit — Degradação observável (B4)', () => {
  let req, res, next;

  beforeEach(() => {
    cacheManager._fbClear();
    jest.clearAllMocks();
    mockRedisClient.isAvailable.mockReturnValue(false);
    createRateLimit._resetWarnThrottle();
    req = {
      ip: '127.0.0.1',
      method: 'GET',
      path: '/test',
      originalUrl: '/test',
    };
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('emite warn quando Redis indisponível (degradação para memória)', async () => {
    const rl = createRateLimit({ windowMs: 60000, max: 5 });
    await rl(req, res, next);
    expect(appLogger.warn).toHaveBeenCalledWith(
      '[RateLimit] degradado para memória — Redis indisponível'
    );
  });

  it('fallback in-memory ainda limita requests', async () => {
    const rl = createRateLimit({ windowMs: 60000, max: 2 });
    await rl(req, res, next);
    await rl(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);
    await rl(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('throttle do warn: múltiplas degradações em <60s → no máx 1 warn', async () => {
    const rl = createRateLimit({ windowMs: 60000, max: 10 });
    await rl(req, res, next);
    await rl(req, res, next);
    await rl(req, res, next);
    const warnCalls = appLogger.warn.mock.calls.filter(
      call => call[0] === '[RateLimit] degradado para memória — Redis indisponível'
    );
    expect(warnCalls).toHaveLength(1);
  });

  it('não emite warn de degradação quando Redis está disponível', async () => {
    mockRedisClient.isAvailable.mockReturnValue(true);
    mockRedisClient.incrWithTTL.mockResolvedValue(1);
    const rl = createRateLimit({ windowMs: 60000, max: 5 });
    await rl(req, res, next);
    const degradationWarns = appLogger.warn.mock.calls.filter(
      call => typeof call[0] === 'string' && call[0].includes('degradado para memória')
    );
    expect(degradationWarns).toHaveLength(0);
  });
});

describe('RateLimit — Fail-open explícito (B4)', () => {
  let req, res, next;

  beforeEach(() => {
    cacheManager._fbClear();
    jest.clearAllMocks();
    mockRedisClient.isAvailable.mockReturnValue(true);
    createRateLimit._resetWarnThrottle();
    req = {
      ip: '127.0.0.1',
      method: 'GET',
      path: '/test',
      originalUrl: '/test',
    };
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('erro inesperado no incr → next() chamado (fail-open) + warn', async () => {
    jest.spyOn(cacheManager, 'incr').mockRejectedValueOnce(new Error('Redis connection lost'));
    const rl = createRateLimit({ windowMs: 60000, max: 5 });
    await rl(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(429);
    expect(appLogger.warn).toHaveBeenCalledWith(
      { err: 'Redis connection lost' },
      '[RateLimit] erro inesperado — fail-open, request liberada'
    );
    cacheManager.incr.mockRestore();
  });

  it('fail-open não bloqueia tráfego mesmo com erro persistente', async () => {
    jest.spyOn(cacheManager, 'incr').mockRejectedValue(new Error('ECONNREFUSED'));
    const rl = createRateLimit({ windowMs: 60000, max: 1 });
    await rl(req, res, next);
    await rl(req, res, next);
    await rl(req, res, next);
    expect(next).toHaveBeenCalledTimes(3);
    expect(res.status).not.toHaveBeenCalledWith(429);
    cacheManager.incr.mockRestore();
  });
});

describe('RateLimit — Limite compartilhado via Redis (B4)', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisClient.isAvailable.mockReturnValue(true);
    createRateLimit._resetWarnThrottle();
    req = {
      ip: '10.0.0.1',
      method: 'POST',
      path: '/api/auth/login',
      originalUrl: '/api/auth/login',
    };
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('mesma chave/janela Redis → contador acumula entre chamadas (simula N instâncias)', async () => {
    let counter = 0;
    mockRedisClient.incrWithTTL.mockImplementation(() => Promise.resolve(++counter));

    const rl = createRateLimit({ windowMs: 60000, max: 3 });

    await rl(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 2);

    await rl(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 1);

    await rl(req, res, next);
    expect(next).toHaveBeenCalledTimes(3);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 0);

    await rl(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });
});
