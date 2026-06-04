'use strict';

let client = null;
let _available = false;

if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
  // eslint-disable-next-line no-console
  console.warn('[Redis] REDIS_URL ausente em produção — rate limit cairá para memória por-instância');
}

if (process.env.REDIS_URL) {
  try {
    const Redis = require('ioredis');
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    client.on('ready', () => { _available = true; });
    client.on('error', () => { _available = false; });
    client.connect().catch(() => { _available = false; });
  } catch (_) {
    client = null;
    _available = false;
  }
}

// Script Lua atômico: INCR + PEXPIRE condicional
const INCR_WITH_TTL_SCRIPT = `
  local count = redis.call('INCR', KEYS[1])
  if count == 1 then
    redis.call('PEXPIRE', KEYS[1], ARGV[1])
  end
  return count
`;

module.exports = {
  isAvailable: () => _available,
  get:    (key)            => client ? client.get(key)                           : Promise.resolve(null),
  set:    (key, val, ex, ttl) => client ? client.set(key, val, ex, ttl)         : Promise.resolve(),
  del:    (...keys)        => client ? client.del(...keys)                       : Promise.resolve(0),
  keys:   (pattern)        => client ? client.keys(pattern)                     : Promise.resolve([]),
  incr:   (key)            => client ? client.incr(key)                          : Promise.resolve(NaN),
  quit:   ()               => client ? client.quit()                             : Promise.resolve(),

  // INCR atômico com TTL via Lua script — elimina race condition INCR + PEXPIRE
  incrWithTTL(key, ttlMs) {
    if (!client) return Promise.resolve(NaN);
    return client.eval(INCR_WITH_TTL_SCRIPT, 1, key, ttlMs);
  },
};
