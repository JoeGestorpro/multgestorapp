import type { LlmProvider, LlmRequest, LlmResponse, LlmProviderName, LlmSafety } from "../types.ts"
import { detectSensitive } from "../sensitive.ts"

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_RETRIES = 2
// Fase 10 (LLM Cost Safety): default preservado quando request.maxTokens nao
// e informado — mesmo valor hardcoded que existia antes desta fase.
const DEFAULT_MAX_TOKENS = 1024
// Fase 9.19 (mesmo racional do OpenRouterProvider): resposta acima disso e
// truncada — protege o chat/UI de payloads anomalos.
const MAX_RESPONSE_CHARS = 20_000

// Erros 4xx (exceto 429) sao permanentes: repetir a mesma chamada nao muda o
// resultado (chave invalida, modelo inexistente, payload rejeitado). Falhar
// rapido evita segurar o usuario por varios segundos de retry inutil.
const NON_RETRYABLE_STATUS = new Set([400, 401, 403, 404, 422])

class NvidiaHttpError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/**
 * Timeout NAO e re-tentado (mesmo racional do OpenRouterProvider): a chamada
 * ja consumiu o orcamento inteiro de `timeoutMs` uma vez, e re-tentar
 * multiplicaria a espera do usuario por (maxRetries+1) vezes o timeout.
 */
class NvidiaTimeoutError extends Error {}

/** Mensagem categorizada por status HTTP — nunca inclui a chave/Authorization. */
function describeHttpError(status: number): string {
  if (status === 401 || status === 403) return "NVIDIA API error: " + status + " (chave invalida ou nao autorizada)"
  if (status === 400) return "NVIDIA API error: " + status + " (requisicao invalida — modelo inexistente ou parametros invalidos)"
  if (status === 404) return "NVIDIA API error: " + status + " (modelo ou recurso nao encontrado)"
  if (status === 429) return "NVIDIA API error: " + status + " (limite de requisicoes atingido, tente novamente mais tarde)"
  if (status >= 500) return "NVIDIA API error: " + status + " (erro interno do provedor)"
  return "NVIDIA API error: " + status
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

/**
 * Fase 9.19 — provider real para a NVIDIA NIM API (endpoint compativel com
 * chat/completions da OpenAI). Nao-streaming nesta fase (decisao explicita).
 *
 * IMPORTANTE (decisao explicita, nao mude sem nova aprovacao): modelos de
 * raciocinio (ex.: DeepSeek) podem devolver um campo separado de
 * raciocinio/chain-of-thought (`reasoning`/`reasoning_content`) na mensagem.
 * Esse campo e SEMPRE descartado aqui — nunca aparece em LlmResponse.text
 * nem em nenhum outro campo. So `choices[0].message.content` vira a
 * resposta final. Nao ha suporte a `extra_body`/`chat_template_kwargs`
 * (ex.: habilitar "thinking") nesta versao minima.
 */
export class NvidiaProvider implements LlmProvider {
  name: LlmProviderName = "nvidia"
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
        provider: "nvidia",
        model: this.model,
        mode: request.mode,
        text: "[NVIDIA] Acao bloqueada: " + safety.blockedReasons.join("; "),
        safety,
        metadata: { external: false, blocked: true, timestamp: new Date().toISOString() },
      }
    }

    const maxTokens = request.maxTokens ?? DEFAULT_MAX_TOKENS
    const { text, tokensUsed } = await this.#callWithRetry(request.task, maxTokens)

    return {
      provider: "nvidia",
      model: this.model,
      mode: request.mode,
      text,
      safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
      metadata: { external: true, timestamp: new Date().toISOString(), model: this.model, tokensUsed },
    }
  }

  async #callWithRetry(task: string, maxTokens: number): Promise<{ text: string; tokensUsed?: number }> {
    let last: Error | null = null
    for (let attempt = 0; attempt <= this.#maxRetries; attempt++) {
      try {
        return await this.#callApi(task, maxTokens)
      } catch (err) {
        last = err instanceof Error ? err : new Error(String(err))
        if (err instanceof NvidiaHttpError && NON_RETRYABLE_STATUS.has(err.status)) {
          throw last
        }
        if (err instanceof NvidiaTimeoutError) {
          throw last
        }
        if (attempt < this.#maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        }
      }
    }
    throw last!
  }

  async #callApi(task: string, maxTokens: number): Promise<{ text: string; tokensUsed?: number }> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.#timeoutMs)

    try {
      const res = await fetch(NVIDIA_API_URL, {
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
          stream: false,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new NvidiaHttpError(res.status, describeHttpError(res.status))
      }

      // Descarta deliberadamente qualquer campo de raciocinio (reasoning /
      // reasoning_content) que a mensagem possa trazer — so o content final
      // e usado. Ver comentario da classe.
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string; reasoning_content?: string; reasoning?: string } }>; usage?: { total_tokens?: number } }
      const content = data?.choices?.[0]?.message?.content
      const tokensUsed = typeof data?.usage?.total_tokens === "number" ? data.usage.total_tokens : undefined
      if (!content || content.length === 0) return { text: "[NVIDIA] Sem resposta da API", tokensUsed }
      return { text: truncateResponse(content), tokensUsed }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new NvidiaTimeoutError("NVIDIA timeout apos " + (this.#timeoutMs / 1000) + "s")
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }
}
