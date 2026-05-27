'use strict';

let client = null;
let _available = false;

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

module.exports = {
  isAvailable: () => _available,
  get:  (key)          => client ? client.get(key)               : Promise.resolve(null),
  set:  (key, val, ex, ttl) => client ? client.set(key, val, ex, ttl) : Promise.resolve(),
  del:  (...keys)      => client ? client.del(...keys)           : Promise.resolve(0),
  keys: (pattern)      => client ? client.keys(pattern)         : Promise.resolve([]),
  quit: ()             => client ? client.quit()                 : Promise.resolve(),
};
