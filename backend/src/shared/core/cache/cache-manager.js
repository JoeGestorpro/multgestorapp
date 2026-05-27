'use strict';

const redis = require('./redis-client');

// Fallback in-memory para quando Redis não está disponível
const _fallback = new Map();

function _fbGet(key) {
  const entry = _fallback.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _fallback.delete(key); return null; }
  return entry.value;
}

function _fbSet(key, value, ttlMs) {
  _fallback.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function _fbDel(key) { _fallback.delete(key); }

function _fbDelPattern(prefix) {
  for (const k of _fallback.keys()) {
    if (k.startsWith(prefix)) _fallback.delete(k);
  }
}

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

  // Expõe o fallback Map para testes (sem Redis)
  _fallback,
};

module.exports = cacheManager;
