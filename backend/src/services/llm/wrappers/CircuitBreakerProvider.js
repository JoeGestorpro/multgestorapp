// CircuitBreakerProvider — wrapper de LLM Cost Safety. Envolve qualquer
// provider e para de tentar chamar um provider que esta falhando
// repetidamente (5xx, timeout, erro de rede), evitando gastar tempo e
// dinheiro em chamadas que tendem a falhar de novo.
// Portado de tools/joefelipe-agent/src/llm/providers/CircuitBreakerProvider.ts.

const DEFAULT_FAILURE_THRESHOLD = 5
const DEFAULT_RESET_TIMEOUT_MS = 30_000

/**
 * Decide se um erro conta como falha de circuito. Erros com `.status`
 * numerico (lancados pelos providers reais) so contam em 5xx ou 429 — um 4xx
 * "normal" (chave invalida, payload malformado) e um problema da requisicao,
 * nao do provider estar fora do ar. Erros sem `.status` (timeout, falha de
 * rede, erro generico) sempre contam.
 */
function isCircuitFailure(err) {
  const status = err?.status
  if (typeof status === 'number') {
    return status === 429 || status >= 500
  }
  return true
}

class CircuitBreakerProvider {
  constructor(inner, config = {}) {
    this._inner = inner
    this._failureThreshold = config.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD
    this._resetTimeoutMs = config.resetTimeoutMs ?? DEFAULT_RESET_TIMEOUT_MS
    this._state = 'CLOSED'
    this._consecutiveFailures = 0
    this._openedAt = 0
  }

  get name() {
    return this._inner.name
  }

  get model() {
    return this._inner.model
  }

  getState() {
    return this._state
  }

  async complete(request) {
    if (this._state === 'OPEN') {
      if (Date.now() - this._openedAt < this._resetTimeoutMs) {
        return this._blocked(request)
      }
      this._state = 'HALF_OPEN'
    }

    try {
      const response = await this._inner.complete(request)
      this._consecutiveFailures = 0
      this._state = 'CLOSED'
      return response
    } catch (err) {
      if (!isCircuitFailure(err)) throw err

      if (this._state === 'HALF_OPEN') {
        this._open()
        throw err
      }

      this._consecutiveFailures += 1
      if (this._consecutiveFailures >= this._failureThreshold) {
        this._open()
      }
      throw err
    }
  }

  _open() {
    this._state = 'OPEN'
    this._openedAt = Date.now()
  }

  _blocked(request) {
    return {
      provider: this._inner.name,
      model: this._inner.model,
      mode: request.mode,
      text: '[CircuitBreakerProvider] Provedor temporariamente indisponivel.',
      safety: { canExecute: false, requiresHumanApproval: true, blockedReasons: ['Provedor temporariamente indisponivel'] },
      metadata: { blocked: true, wrapper: 'circuit-breaker', circuitState: this._state }
    }
  }
}

module.exports = { CircuitBreakerProvider }
