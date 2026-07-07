// CircuitBreakerProvider — wrapper de LLM Cost Safety (Fase 10).
// Envolve qualquer LlmProvider e para de tentar chamar um provider que esta
// falhando repetidamente (5xx, timeout, erro de rede), evitando gastar tempo
// e dinheiro em chamadas que tendem a falhar de novo.

import type { LlmProvider, LlmRequest, LlmResponse, LlmProviderName } from "../types.ts"

export interface CircuitBreakerConfig {
  /** Falhas consecutivas ate abrir o circuito. Default: 5. */
  failureThreshold?: number
  /** Tempo em OPEN antes de tentar uma chamada de teste (HALF_OPEN). Default: 30000ms. */
  resetTimeoutMs?: number
}

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN"

const DEFAULT_FAILURE_THRESHOLD = 5
const DEFAULT_RESET_TIMEOUT_MS = 30_000

/**
 * Decide se um erro conta como falha de circuito. Erros com `.status`
 * numerico (lancados pelos providers reais como OpenRouterHttpError/
 * NvidiaHttpError) so contam em 5xx ou 429 — um 4xx "normal" (chave invalida,
 * payload malformado) e um problema da requisicao, nao do provider estar
 * fora do ar, e por isso nao deve abrir o circuito. Erros sem `.status`
 * (timeout, falha de rede, erro generico) sempre contam.
 */
function isCircuitFailure(err: unknown): boolean {
  const status = (err as { status?: unknown } | null)?.status
  if (typeof status === "number") {
    return status === 429 || status >= 500
  }
  return true
}

export class CircuitBreakerProvider implements LlmProvider {
  #inner: LlmProvider
  #failureThreshold: number
  #resetTimeoutMs: number
  #state: CircuitState = "CLOSED"
  #consecutiveFailures = 0
  #openedAt = 0

  constructor(inner: LlmProvider, config: CircuitBreakerConfig = {}) {
    this.#inner = inner
    this.#failureThreshold = config.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD
    this.#resetTimeoutMs = config.resetTimeoutMs ?? DEFAULT_RESET_TIMEOUT_MS
  }

  get name(): LlmProviderName {
    return this.#inner.name
  }

  get model(): string {
    return this.#inner.model
  }

  getState(): CircuitState {
    return this.#state
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    if (this.#state === "OPEN") {
      if (Date.now() - this.#openedAt < this.#resetTimeoutMs) {
        return this.#blocked(request)
      }
      this.#state = "HALF_OPEN"
    }

    try {
      const response = await this.#inner.complete(request)
      this.#consecutiveFailures = 0
      this.#state = "CLOSED"
      return response
    } catch (err) {
      if (!isCircuitFailure(err)) throw err

      if (this.#state === "HALF_OPEN") {
        this.#open()
        throw err
      }

      this.#consecutiveFailures += 1
      if (this.#consecutiveFailures >= this.#failureThreshold) {
        this.#open()
      }
      throw err
    }
  }

  #open(): void {
    this.#state = "OPEN"
    this.#openedAt = Date.now()
  }

  #blocked(request: LlmRequest): LlmResponse {
    return {
      provider: this.#inner.name,
      model: this.#inner.model,
      mode: request.mode,
      text: "[CircuitBreakerProvider] Provedor temporariamente indisponivel.",
      safety: { canExecute: false, requiresHumanApproval: true, blockedReasons: ["Provedor temporariamente indisponivel"] },
      metadata: { blocked: true, wrapper: "circuit-breaker", circuitState: this.#state },
    }
  }
}
