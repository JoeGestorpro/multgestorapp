// BudgetProvider — wrapper de LLM Cost Safety (Fase 10).
// Envolve qualquer LlmProvider e impede que uma sessao consuma mais tokens
// ou custo estimado do que o configurado. Nao chama API nenhuma por conta
// propria: so intercepta complete() do provider real.

import type { LlmProvider, LlmRequest, LlmResponse, LlmProviderName } from "../types.ts"

export interface BudgetConfig {
  maxTokensPerSession?: number
  maxCostPerSession?: number
  /** $ por token, usado so para estimar custo quando o provider real nao
   * reporta usage.total_tokens. Default e um valor generico e conservador —
   * ajuste via config para refletir o preco real do modelo em uso. */
  ratePerToken?: number
}

export interface BudgetUsage {
  tokensUsed: number
  estimatedCost: number
  sessionId: string
}

export interface BudgetStatus {
  tokensUsed: number
  tokensLimit: number | null
  budgetUsed: number
  budgetLimit: number | null
  sessionId: string
}

const DEFAULT_RATE_PER_TOKEN = 0.000002

/** Estima tokens de uma chamada: usa o valor reportado pelo provider real
 * (metadata.tokensUsed, ex.: usage.total_tokens da API) quando disponivel;
 * caso contrario aproxima por tamanho de texto (~4 caracteres por token,
 * heuristica comum para modelos em ingles/portugues). */
function estimateTokens(request: LlmRequest, response: LlmResponse): number {
  const reported = response.metadata?.tokensUsed
  if (typeof reported === "number" && Number.isFinite(reported) && reported >= 0) return reported
  const chars = (request.task?.length ?? 0) + (response.text?.length ?? 0)
  return Math.ceil(chars / 4)
}

export class BudgetProvider implements LlmProvider {
  #inner: LlmProvider
  #sessionId: string
  #maxTokensPerSession?: number
  #maxCostPerSession?: number
  #ratePerToken: number
  #tokensUsed = 0
  #estimatedCost = 0

  constructor(inner: LlmProvider, sessionId: string, config: BudgetConfig = {}) {
    this.#inner = inner
    this.#sessionId = sessionId
    this.#maxTokensPerSession = config.maxTokensPerSession
    this.#maxCostPerSession = config.maxCostPerSession
    this.#ratePerToken = config.ratePerToken ?? DEFAULT_RATE_PER_TOKEN
  }

  get name(): LlmProviderName {
    return this.#inner.name
  }

  get model(): string {
    return this.#inner.model
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    if (this.#maxTokensPerSession !== undefined && this.#tokensUsed >= this.#maxTokensPerSession) {
      return this.#blocked(request, `Limite de tokens da sessao excedido: ${this.#tokensUsed}/${this.#maxTokensPerSession}`)
    }
    if (this.#maxCostPerSession !== undefined && this.#estimatedCost >= this.#maxCostPerSession) {
      return this.#blocked(request, `Limite de custo da sessao excedido: $${this.#estimatedCost.toFixed(4)}/$${this.#maxCostPerSession.toFixed(4)}`)
    }

    const response = await this.#inner.complete(request)

    // Chamadas bloqueadas por outro wrapper (rate limit/circuit breaker) nao
    // chegaram a consumir tokens de verdade — nao contam para o orcamento.
    if (!response.metadata?.blocked) {
      const tokens = estimateTokens(request, response)
      this.#tokensUsed += tokens
      this.#estimatedCost += tokens * this.#ratePerToken
    }

    return response
  }

  #blocked(request: LlmRequest, reason: string): LlmResponse {
    return {
      provider: this.#inner.name,
      model: this.#inner.model,
      mode: request.mode,
      text: "[BudgetProvider] Chamada bloqueada: " + reason,
      safety: { canExecute: false, requiresHumanApproval: true, blockedReasons: [reason] },
      metadata: { blocked: true, wrapper: "budget", sessionId: this.#sessionId },
    }
  }

  getUsage(): BudgetUsage {
    return { tokensUsed: this.#tokensUsed, estimatedCost: this.#estimatedCost, sessionId: this.#sessionId }
  }

  getStatus(): BudgetStatus {
    return {
      tokensUsed: this.#tokensUsed,
      tokensLimit: this.#maxTokensPerSession ?? null,
      budgetUsed: this.#estimatedCost,
      budgetLimit: this.#maxCostPerSession ?? null,
      sessionId: this.#sessionId,
    }
  }

  /** Zera os contadores da sessao. Sem argumento, reseta a sessao gerenciada
   * por esta instancia; com argumento, so reseta se bater com ela (evita
   * reset acidental por id errado). */
  reset(sessionId?: string): void {
    if (sessionId !== undefined && sessionId !== this.#sessionId) return
    this.#tokensUsed = 0
    this.#estimatedCost = 0
  }
}
