// BudgetProvider — wrapper de LLM Cost Safety. Envolve qualquer provider e
// impede que uma sessao consuma mais tokens ou custo estimado do que o
// configurado. Nao chama API nenhuma por conta propria: so intercepta
// complete() do provider real.
// Portado de tools/joefelipe-agent/src/llm/providers/BudgetProvider.ts.

const DEFAULT_RATE_PER_TOKEN = 0.000002

/** Estima tokens de uma chamada: usa o valor reportado pelo provider real
 * (metadata.tokensUsed) quando disponivel; caso contrario aproxima por
 * tamanho de texto (~4 caracteres por token). */
function estimateTokens(request, response) {
  const reported = response.metadata?.tokensUsed
  if (typeof reported === 'number' && Number.isFinite(reported) && reported >= 0) return reported
  const chars = (request.task?.length ?? 0) + (response.text?.length ?? 0)
  return Math.ceil(chars / 4)
}

class BudgetProvider {
  constructor(inner, sessionId, config = {}) {
    this._inner = inner
    this._sessionId = sessionId
    this._maxTokensPerSession = config.maxTokensPerSession
    this._maxCostPerSession = config.maxCostPerSession
    this._ratePerToken = config.ratePerToken ?? DEFAULT_RATE_PER_TOKEN
    this._tokensUsed = 0
    this._estimatedCost = 0
  }

  get name() {
    return this._inner.name
  }

  get model() {
    return this._inner.model
  }

  async complete(request) {
    if (this._maxTokensPerSession !== undefined && this._tokensUsed >= this._maxTokensPerSession) {
      return this._blocked(request, `Limite de tokens da sessao excedido: ${this._tokensUsed}/${this._maxTokensPerSession}`)
    }
    if (this._maxCostPerSession !== undefined && this._estimatedCost >= this._maxCostPerSession) {
      return this._blocked(request, `Limite de custo da sessao excedido: $${this._estimatedCost.toFixed(4)}/$${this._maxCostPerSession.toFixed(4)}`)
    }

    const response = await this._inner.complete(request)

    // Chamadas bloqueadas por outro wrapper (rate limit/circuit breaker) nao
    // chegaram a consumir tokens de verdade — nao contam para o orcamento.
    if (!response.metadata?.blocked) {
      const tokens = estimateTokens(request, response)
      this._tokensUsed += tokens
      this._estimatedCost += tokens * this._ratePerToken
    }

    return response
  }

  _blocked(request, reason) {
    return {
      provider: this._inner.name,
      model: this._inner.model,
      mode: request.mode,
      text: `[BudgetProvider] Chamada bloqueada: ${reason}`,
      safety: { canExecute: false, requiresHumanApproval: true, blockedReasons: [reason] },
      metadata: { blocked: true, wrapper: 'budget', sessionId: this._sessionId }
    }
  }

  getUsage() {
    return { tokensUsed: this._tokensUsed, estimatedCost: this._estimatedCost, sessionId: this._sessionId }
  }

  getStatus() {
    return {
      tokensUsed: this._tokensUsed,
      tokensLimit: this._maxTokensPerSession ?? null,
      budgetUsed: this._estimatedCost,
      budgetLimit: this._maxCostPerSession ?? null,
      sessionId: this._sessionId
    }
  }

  reset(sessionId) {
    if (sessionId !== undefined && sessionId !== this._sessionId) return
    this._tokensUsed = 0
    this._estimatedCost = 0
  }
}

module.exports = { BudgetProvider }
