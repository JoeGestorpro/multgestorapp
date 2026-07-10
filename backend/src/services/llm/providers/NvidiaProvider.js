// Portado de tools/joefelipe-agent/src/llm/providers/NvidiaProvider.ts
// (Fase 1 — IA Operacional). Provider real para a NVIDIA NIM API (endpoint
// compativel com chat/completions da OpenAI). Nao-streaming.
//
// IMPORTANTE (decisao herdada do agente, nao mude sem nova aprovacao):
// modelos de raciocinio (ex.: DeepSeek) podem devolver um campo separado de
// raciocinio/chain-of-thought (`reasoning`/`reasoning_content`) na mensagem.
// Esse campo e SEMPRE descartado aqui — nunca aparece em nenhum campo da
// resposta. So `choices[0].message.content` vira a resposta final.

const { detectSensitive } = require('../sensitive')

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_MAX_TOKENS = 1024
const MAX_RESPONSE_CHARS = 20_000

const NON_RETRYABLE_STATUS = new Set([400, 401, 403, 404, 422])

class NvidiaHttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

class NvidiaTimeoutError extends Error {}

function describeHttpError(status) {
  if (status === 401 || status === 403) return `NVIDIA API error: ${status} (chave invalida ou nao autorizada)`
  if (status === 400) return `NVIDIA API error: ${status} (requisicao invalida — modelo inexistente ou parametros invalidos)`
  if (status === 404) return `NVIDIA API error: ${status} (modelo ou recurso nao encontrado)`
  if (status === 429) return `NVIDIA API error: ${status} (limite de requisicoes atingido, tente novamente mais tarde)`
  if (status >= 500) return `NVIDIA API error: ${status} (erro interno do provedor)`
  return `NVIDIA API error: ${status}`
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

class NvidiaProvider {
  constructor(apiKey, model, timeoutMs = DEFAULT_TIMEOUT_MS, maxRetries = DEFAULT_MAX_RETRIES) {
    this.name = 'nvidia'
    this.model = model
    this._apiKey = apiKey
    this._timeoutMs = timeoutMs
    this._maxRetries = maxRetries
  }

  async complete(request) {
    const safety = buildSafety(request.task)

    if (safety.blockedReasons.length > 0) {
      return {
        provider: 'nvidia',
        model: this.model,
        mode: request.mode,
        text: `[NVIDIA] Acao bloqueada: ${safety.blockedReasons.join('; ')}`,
        safety,
        metadata: { external: false, blocked: true, timestamp: new Date().toISOString() }
      }
    }

    const maxTokens = request.maxTokens ?? DEFAULT_MAX_TOKENS
    const { text, tokensUsed } = await this._callWithRetry(request.task, maxTokens)

    return {
      provider: 'nvidia',
      model: this.model,
      mode: request.mode,
      text,
      safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
      metadata: { external: true, timestamp: new Date().toISOString(), model: this.model, tokensUsed }
    }
  }

  async _callWithRetry(task, maxTokens) {
    let last = null
    for (let attempt = 0; attempt <= this._maxRetries; attempt++) {
      try {
        return await this._callApi(task, maxTokens)
      } catch (err) {
        last = err instanceof Error ? err : new Error(String(err))
        if (err instanceof NvidiaHttpError && NON_RETRYABLE_STATUS.has(err.status)) {
          throw last
        }
        if (err instanceof NvidiaTimeoutError) {
          throw last
        }
        if (attempt < this._maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        }
      }
    }
    throw last
  }

  async _callApi(task, maxTokens) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this._timeoutMs)

    try {
      const res = await fetch(NVIDIA_API_URL, {
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
          max_tokens: maxTokens,
          stream: false
        }),
        signal: controller.signal
      })

      if (!res.ok) {
        throw new NvidiaHttpError(res.status, describeHttpError(res.status))
      }

      // Descarta deliberadamente qualquer campo de raciocinio (reasoning /
      // reasoning_content) — so o content final e usado. Ver comentario da classe.
      const data = await res.json()
      const content = data?.choices?.[0]?.message?.content
      const tokensUsed = typeof data?.usage?.total_tokens === 'number' ? data.usage.total_tokens : undefined
      if (!content || content.length === 0) return { text: '[NVIDIA] Sem resposta da API', tokensUsed }
      return { text: truncateResponse(content), tokensUsed }
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new NvidiaTimeoutError(`NVIDIA timeout apos ${this._timeoutMs / 1000}s`)
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }
}

module.exports = { NvidiaProvider }
