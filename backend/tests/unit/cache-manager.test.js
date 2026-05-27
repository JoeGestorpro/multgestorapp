'use strict';

// Garante que redis-client não tenta conectar (sem REDIS_URL em unit tests)
jest.mock('../../src/shared/core/cache/redis-client', () => ({
  isAvailable: () => false,
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(),
  del: jest.fn().mockResolvedValue(0),
  keys: jest.fn().mockResolvedValue([]),
  quit: jest.fn().mockResolvedValue(),
}));

const cacheManager = require('../../src/shared/core/cache/cache-manager');

describe('CacheManager — fallback in-memory', () => {
  beforeEach(() => cacheManager._fallback.clear());

  it('retorna null para chave inexistente', async () => {
    expect(await cacheManager.get('nao:existe')).toBeNull();
  });

  it('set + get retorna valor armazenado', async () => {
    await cacheManager.set('test:key', { foo: 'bar' }, 60_000);
    expect(await cacheManager.get('test:key')).toEqual({ foo: 'bar' });
  });

  it('del remove a chave', async () => {
    await cacheManager.set('test:key2', 42, 60_000);
    await cacheManager.del('test:key2');
    expect(await cacheManager.get('test:key2')).toBeNull();
  });

  it('delByPrefix remove todas as chaves com o prefixo', async () => {
    await cacheManager.set('mg:plan:1', 'a', 60_000);
    await cacheManager.set('mg:plan:2', 'b', 60_000);
    await cacheManager.set('mg:module:1:barber', true, 60_000);
    await cacheManager.delByPrefix('mg:plan:');
    expect(await cacheManager.get('mg:plan:1')).toBeNull();
    expect(await cacheManager.get('mg:plan:2')).toBeNull();
    expect(await cacheManager.get('mg:module:1:barber')).toBe(true);
  });

  it('respeita TTL expirado', async () => {
    await cacheManager.set('test:ttl', 'valor', 1); // 1ms TTL
    await new Promise(r => setTimeout(r, 10));
    expect(await cacheManager.get('test:ttl')).toBeNull();
  });
});
