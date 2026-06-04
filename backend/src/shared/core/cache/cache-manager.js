'use strict';

const redis = require('./redis-client');

// Fallback in-memory para quando Redis não está disponível
const _fallback = new Map();

const MAX_FALLBACK_ENTRIES = 10000;

function _ensureFallbackSpace() {
  if (_fallback.size >= MAX_FALLBACK_ENTRIES) {
    const oldest = _fallback.keys().next().value;
    if (oldest) _fallback.delete(oldest);
  }
}

function _fbGet(key) {
  const entry = _fallback.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _fallback.delete(key); return null; }
  return entry.value;
}

function _fbSet(key, value, ttlMs) {
  _ensureFallbackSpace();
  _fallback.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function _fbIncr(key, ttlMs) {
  const entry = _fallback.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    _ensureFallbackSpace();
    _fallback.set(key, { count: 1, expiresAt: Date.now() + ttlMs });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

function _fbDel(key) { _fallback.delete(key); }

function _fbDelPattern(prefix) {
  for (const k of _fallback.keys()) {
    if (k.startsWith(prefix)) _fallback.delete(k);
  }
}

function _fbClear() { _fallback.clear(); }

const cacheManager = {
  async get(key) {
    if (redis.isAvailable()) {
      const raw = await redis.get(key);
      return raw !== null ? JSON.parse(raw) : null;
    }
    return _fbGet(key);
  },

  async set(key, value, ttlMs) {
    if (redis.isAvailable()) {
      await redis.set(key, JSON.stringify(value), 'PX', ttlMs);
    } else {
      _fbSet(key, value, ttlMs);
    }
  },

  async del(key) {
    if (redis.isAvailable()) {
      await redis.del(key);
    } else {
      _fbDel(key);
    }
  },

  // Deleta todas as chaves que começam com prefix
  async delByPrefix(prefix) {
    if (redis.isAvailable()) {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length) await redis.del(...keys);
    } else {
      _fbDelPattern(prefix);
    }
  },

  // Incrementa contador atômico com TTL (rate limiting)
  async incr(key, ttlMs) {
    if (redis.isAvailable()) {
      try {
        // Tenta caminho atômico via Lua script primeiro
        if (redis.incrWithTTL) {
          return await redis.incrWithTTL(key, ttlMs);
        }
        // Fallback: INCR + SET PX em duas etapas
        const count = await redis.incr(key);
        if (count === 1 && ttlMs) {
          await redis.set(key, count, 'PX', ttlMs);
        }
        return count;
      } catch (_) {
        // fallback in-memory se Redis falhar no meio da operação
      }
    }
    return _fbIncr(key, ttlMs);
  },

  // Expõe o fallback Map para testes (sem Redis)
  _fallback,
  _fbClear,
};

module.exports = cacheManager;
