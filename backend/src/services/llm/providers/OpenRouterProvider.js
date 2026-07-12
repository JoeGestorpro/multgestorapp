// Portado de tools/joefelipe-agent/src/llm/providers/OpenRouterProvider.ts
// (Fase 1 — IA Operacional). Provider real para a API do OpenRouter.

const { detectSensitive } = require('../sensitive')

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_MAX_TOKENS = 1024
// Resposta acima disso é truncada — protege o chamador de payloads anômalos
// (provider com bug, modelo que "foge" do limite pedido).
const MAX_RESPONSE_CHARS = 20_000

// Erros 4xx (exceto 429) são permanentes: repetir a mesma chamada não muda o
// resultado (chave inválida, modelo inexistente, payload rejeitado). Falhar
// rápido evita segurar o chamador por vários segundos de retry inútil.
const NON_RETRYABLE_STATUS = new Set([400, 401, 403, 404, 422])

class OpenRouterHttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

class OpenRouterTimeoutError extends Error {}

function describeHttpError(status) {
  if (status === 401 || status === 403) return `OpenRouter API error: ${status} (chave invalida ou nao autorizada)`
  if (status === 400) return `OpenRouter API error: ${status} (requisicao invalida — modelo inexistente ou parametros invalidos)`
  if (status === 404) return `OpenRouter API error: ${status} (modelo ou recurso nao encontrado)`
  if (status === 429) return `OpenRouter API error: ${status} (limite de requisicoes atingido, tente novamente mais tarde)`
  if (status >= 500) return `OpenRouter API error: ${status} (erro interno do provedor)`
  return `OpenRouter API error: ${status}`
}

function truncateResponse(text) {
  if (text.length <= MAX_RESPONSE_CHARS) return text
  return text.slice(0, MAX_RESPONSE_CHARS) + `\n\n[...resposta truncada: excedeu ${MAX_RESPONSE_CHARS} caracteres]`
}

function buildSafety(task) {
  const sensitive = detectSensitive(task)
  const blocked = sensitive.map((word) => `Acao sensivel detectada: "${word}" requer aprovacao humana`)
  return {
    canExecute: false,
    requiresHumanApproval: blocked.length > 0,
    blockedReasons: blocked
  }
}

class OpenRouterProvider {
  constructor(apiKey, model, timeoutMs = DEFAULT_TIMEOUT_MS, maxRetries = DEFAULT_MAX_RETRIES) {
    this.name = 'openrouter'
    this.model = model
    this._apiKey = apiKey
    this._timeoutMs = timeoutMs
    this._maxRetries = maxRetries
  }

  async complete(request) {
    const safety = buildSafety(request.task)

    if (safety.blockedReasons.length > 0) {
      return {
        provider: 'openrouter',
        model: this.model,
        mode: request.mode,
        text: `[OpenRouter] Acao bloqueada: ${safety.blockedReasons.join('; ')}`,
        safety,
        metadata: { external: false, blocked: true, timestamp: new Date().toISOString() }
      }
    }

    const maxTokens = request.maxTokens ?? DEFAULT_MAX_TOKENS
    const { text, tokensUsed } = await this._callWithRetry(request.task, request.mode, maxTokens)

    return {
      provider: 'openrouter',
      model: this.model,
      mode: request.mode,
      text,
      safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
      metadata: { external: true, timestamp: new Date().toISOString(), model: this.model, tokensUsed }
    }
  }

  async _callWithRetry(task, mode, maxTokens) {
    let last = null
    for (let attempt = 0; attempt <= this._maxRetries; attempt++) {
      try {
        return await this._callApi(task, mode, maxTokens)
      } catch (err) {
        last = err instanceof Error ? err : new Error(String(err))
        if (err instanceof OpenRouterHttpError && NON_RETRYABLE_STATUS.has(err.status)) {
          throw last
        }
        if (err instanceof OpenRouterTimeoutError) {
          throw last
        }
        if (attempt < this._maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        }
      }
    }
    throw last
  }

  async _callApi(task, mode, maxTokens) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this._timeoutMs)

    try {
      const res = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this._apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: 'You are the MultGestor AI insights assistant. Respond in Portuguese. Be concise and safe. Propose insights, never execute actions.' },
            { role: 'user', content: task }
          ],
          max_tokens: maxTokens
        }),
        signal: controller.signal
      })

      if (!res.ok) {
        throw new OpenRouterHttpError(res.status, describeHttpError(res.status))
      }

      const data = await res.json()
      const content = data?.choices?.[0]?.message?.content
      const tokensUsed = typeof data?.usage?.total_tokens === 'number' ? data.usage.total_tokens : undefined
      if (!content || content.length === 0) return { text: '[OpenRouter] Sem resposta da API', tokensUsed }
      return { text: truncateResponse(content), tokensUsed }
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new OpenRouterTimeoutError(`OpenRouter timeout apos ${this._timeoutMs / 1000}s`)
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }
}

module.exports = { OpenRouterProvider }
