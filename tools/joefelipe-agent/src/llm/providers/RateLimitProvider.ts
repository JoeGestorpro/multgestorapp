// RateLimitProvider — wrapper de LLM Cost Safety (Fase 10).
// Envolve qualquer LlmProvider e limita quantas chamadas uma sessao pode
// fazer dentro de uma janela deslizante (sliding window), em memoria.

import type { LlmProvider, LlmRequest, LlmResponse, LlmProviderName } from "../types.ts"

export interface RateLimitConfig {
  maxCalls: number
  windowMs: number
}

export interface RateLimitStatus {
  remaining: number
  maxCalls: number
  windowMs: number
}

const DEFAULT_SESSION = "default"

export class RateLimitProvider implements LlmProvider {
  #inner: LlmProvider
  #maxCalls: number
  #windowMs: number
  #calls = new Map<string, number[]>()

  constructor(inner: LlmProvider, config: RateLimitConfig) {
    this.#inner = inner
    this.#maxCalls = config.maxCalls
    this.#windowMs = config.windowMs
  }

  get name(): LlmProviderName {
    return this.#inner.name
  }

  get model(): string {
    return this.#inner.model
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    const sessionId = request.sessionId ?? DEFAULT_SESSION
    const now = Date.now()
    const recent = this.#recentCalls(sessionId, now)

    if (recent.length >= this.#maxCalls) {
      this.#calls.set(sessionId, recent)
      const windowSec = Math.round(this.#windowMs / 1000)
      return this.#blocked(request, `Rate limit excedido: ${recent.length} chamadas nos ultimos ${windowSec}s`)
    }

    recent.push(now)
    this.#calls.set(sessionId, recent)
    return this.#inner.complete(request)
  }

  #recentCalls(sessionId: string, now: number): number[] {
    const timestamps = this.#calls.get(sessionId) ?? []
    return timestamps.filter((t) => now - t < this.#windowMs)
  }

  #blocked(request: LlmRequest, reason: string): LlmResponse {
    return {
      provider: this.#inner.name,
      model: this.#inner.model,
      mode: request.mode,
      text: "[RateLimitProvider] Chamada bloqueada: " + reason,
      safety: { canExecute: false, requiresHumanApproval: true, blockedReasons: [reason] },
      metadata: { blocked: true, wrapper: "rate-limit" },
    }
  }

  getStatus(sessionId: string = DEFAULT_SESSION): RateLimitStatus {
    const recent = this.#recentCalls(sessionId, Date.now())
    return {
      remaining: Math.max(0, this.#maxCalls - recent.length),
      maxCalls: this.#maxCalls,
      windowMs: this.#windowMs,
    }
  }

  reset(sessionId?: string): void {
    if (sessionId === undefined) {
      this.#calls.clear()
      return
    }
    this.#calls.delete(sessionId)
  }
}
