// RateLimitProvider — wrapper de LLM Cost Safety. Envolve qualquer provider e
// limita quantas chamadas uma sessao pode fazer dentro de uma janela
// deslizante (sliding window), em memoria.
// Portado de tools/joefelipe-agent/src/llm/providers/RateLimitProvider.ts.

const DEFAULT_SESSION = 'default'

class RateLimitProvider {
  constructor(inner, config) {
    this._inner = inner
    this._maxCalls = config.maxCalls
    this._windowMs = config.windowMs
    this._calls = new Map()
  }

  get name() {
    return this._inner.name
  }

  get model() {
    return this._inner.model
  }

  async complete(request) {
    const sessionId = request.sessionId ?? DEFAULT_SESSION
    const now = Date.now()
    const recent = this._recentCalls(sessionId, now)

    if (recent.length >= this._maxCalls) {
      this._calls.set(sessionId, recent)
      const windowSec = Math.round(this._windowMs / 1000)
      return this._blocked(request, `Rate limit excedido: ${recent.length} chamadas nos ultimos ${windowSec}s`)
    }

    recent.push(now)
    this._calls.set(sessionId, recent)
    return this._inner.complete(request)
  }

  _recentCalls(sessionId, now) {
    const timestamps = this._calls.get(sessionId) ?? []
    return timestamps.filter((t) => now - t < this._windowMs)
  }

  _blocked(request, reason) {
    return {
      provider: this._inner.name,
      model: this._inner.model,
      mode: request.mode,
      text: `[RateLimitProvider] Chamada bloqueada: ${reason}`,
      safety: { canExecute: false, requiresHumanApproval: true, blockedReasons: [reason] },
      metadata: { blocked: true, wrapper: 'rate-limit' }
    }
  }

  getStatus(sessionId = DEFAULT_SESSION) {
    const recent = this._recentCalls(sessionId, Date.now())
    return {
      remaining: Math.max(0, this._maxCalls - recent.length),
      maxCalls: this._maxCalls,
      windowMs: this._windowMs
    }
  }

  reset(sessionId) {
    if (sessionId === undefined) {
      this._calls.clear()
      return
    }
    this._calls.delete(sessionId)
  }
}

module.exports = { RateLimitProvider }
