import type { LlmProvider, LlmRequest, LlmResponse, LlmProviderName, LlmSafety } from "../types.ts"
import { detectSensitive } from "../sensitive.ts"

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_RETRIES = 2
// Fase 10 (LLM Cost Safety): default preservado quando request.maxTokens nao
// e informado — mesmo valor hardcoded que existia antes desta fase.
const DEFAULT_MAX_TOKENS = 1024
// Fase 9.6 (canary): resposta acima disso e truncada — protege o chat/UI de
// payloads anomalos (provider com bug, modelo que "foge" do limite pedido).
const MAX_RESPONSE_CHARS = 20_000

// Erros 4xx (exceto 429) sao permanentes: repetir a mesma chamada nao muda o
// resultado (chave invalida, modelo inexistente, payload rejeitado). Falhar
// rapido evita segurar o usuario por varios segundos de retry inutil.
const NON_RETRYABLE_STATUS = new Set([400, 401, 403, 404, 422])

class OpenRouterHttpError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/**
 * Timeout NAO e re-tentado (ver #callWithRetry): a chamada ja consumiu o
 * orcamento inteiro de `timeoutMs` uma vez, e o chat e uma requisicao HTTP
 * sincrona — re-tentar multiplicaria a espera do usuario por (maxRetries+1)
 * vezes o timeout (ex.: 30s vira ~90s), o que pareceria a interface travada.
 */
class OpenRouterTimeoutError extends Error {}

/** Mensagem categorizada por status HTTP — nunca inclui a chave/Authorization. */
function describeHttpError(status: number): string {
  if (status === 401 || status === 403) return "OpenRouter API error: " + status + " (chave invalida ou nao autorizada)"
  // 400 e o status real observado no canary da Fase 9.6 para modelo
  // inexistente/invalido (nao 404, como seria intuitivo supor).
  if (status === 400) return "OpenRouter API error: " + status + " (requisicao invalida — modelo inexistente ou parametros invalidos)"
  if (status === 404) return "OpenRouter API error: " + status + " (modelo ou recurso nao encontrado)"
  if (status === 429) return "OpenRouter API error: " + status + " (limite de requisicoes atingido, tente novamente mais tarde)"
  if (status >= 500) return "OpenRouter API error: " + status + " (erro interno do provedor)"
  return "OpenRouter API error: " + status
}

function truncateResponse(text: string): string {
  if (text.length <= MAX_RESPONSE_CHARS) return text
  return text.slice(0, MAX_RESPONSE_CHARS) + "\n\n[...resposta truncada: excedeu " + MAX_RESPONSE_CHARS + " caracteres]"
}

function buildSafety(task: string): LlmSafety {
  const sensitive = detectSensitive(task)
  const blocked: string[] = []
  for (const word of sensitive) {
    blocked.push("Acao sensivel detectada: \"" + word + "\" requer aprovacao humana")
  }
  return {
    canExecute: false,
    requiresHumanApproval: blocked.length > 0,
    blockedReasons: blocked,
  }
}

export class OpenRouterProvider implements LlmProvider {
  name: LlmProviderName = "openrouter"
  model: string
  #apiKey: string
  #timeoutMs: number
  #maxRetries: number

  constructor(apiKey: string, model: string, timeoutMs = DEFAULT_TIMEOUT_MS, maxRetries = DEFAULT_MAX_RETRIES) {
    this.#apiKey = apiKey
    this.model = model
    this.#timeoutMs = timeoutMs
    this.#maxRetries = maxRetries
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    const safety = buildSafety(request.task)

    if (safety.blockedReasons.length > 0) {
      return {
        provider: "openrouter",
        model: this.model,
        mode: request.mode,
        text: "[OpenRouter] Acao bloqueada: " + safety.blockedReasons.join("; "),
        safety,
        metadata: { external: false, blocked: true, timestamp: new Date().toISOString() },
      }
    }

    const maxTokens = request.maxTokens ?? DEFAULT_MAX_TOKENS
    const { text, tokensUsed } = await this.#callWithRetry(request.task, request.mode, maxTokens)

    return {
      provider: "openrouter",
      model: this.model,
      mode: request.mode,
      text,
      safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
      metadata: { external: true, timestamp: new Date().toISOString(), model: this.model, tokensUsed },
    }
  }

  async #callWithRetry(task: string, mode: string, maxTokens: number): Promise<{ text: string; tokensUsed?: number }> {
    let last: Error | null = null
    for (let attempt = 0; attempt <= this.#maxRetries; attempt++) {
      try {
        return await this.#callApi(task, mode, maxTokens)
      } catch (err) {
        last = err instanceof Error ? err : new Error(String(err))
        // Erro permanente (4xx exceto 429): nao adianta tentar de novo com o
        // mesmo payload/chave/modelo. Falha rapido em vez de segurar o
        // usuario por ate maxRetries * backoff segundos.
        if (err instanceof OpenRouterHttpError && NON_RETRYABLE_STATUS.has(err.status)) {
          throw last
        }
        // Timeout tambem nao e re-tentado (ver doc da classe) — evita que o
        // chat pareça travado por multiplos ciclos de timeoutMs completo.
        if (err instanceof OpenRouterTimeoutError) {
          throw last
        }
        if (attempt < this.#maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        }
      }
    }
    throw last!
  }

  async #callApi(task: string, mode: string, maxTokens: number): Promise<{ text: string; tokensUsed?: number }> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.#timeoutMs)

    try {
      const res = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + this.#apiKey,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: "You are JoeFelipe, an AI agent assistant. Respond in Portuguese. Be concise and safe. Propose actions, never execute them." },
            { role: "user", content: task },
          ],
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new OpenRouterHttpError(res.status, describeHttpError(res.status))
      }

      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }>; usage?: { total_tokens?: number } }
      const content = data?.choices?.[0]?.message?.content
      const tokensUsed = typeof data?.usage?.total_tokens === "number" ? data.usage.total_tokens : undefined
      if (!content || content.length === 0) return { text: "[OpenRouter] Sem resposta da API", tokensUsed }
      return { text: truncateResponse(content), tokensUsed }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new OpenRouterTimeoutError("OpenRouter timeout apos " + (this.#timeoutMs / 1000) + "s")
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }
}