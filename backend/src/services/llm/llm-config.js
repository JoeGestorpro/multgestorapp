// Portado de tools/joefelipe-agent/src/llm/llm-config.ts (Fase 1 — IA Operacional).
// Nomes de env var adaptados ao MultGestor (sem o prefixo legado JOEFELIPE_).

const { appLogger } = require('../../shared/core/logger')

const logger = appLogger.child({ module: 'llm-config' })

const VALID_PROVIDERS = new Set(['mock', 'openrouter', 'nvidia'])

const PROVIDER_MODEL_MAP = {
  mock: 'mock-safe-v1',
  openrouter: 'openrouter/auto',
  nvidia: 'deepseek-ai/deepseek-v4-flash'
}

function readEnv(name) {
  return (process.env[name] ?? '').trim()
}

function readNumberEnv(name) {
  const raw = readEnv(name)
  if (!raw) return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Regra de segurança: o provider real NUNCA é escolhido só pela presença de
 * uma chave no ambiente. LLM_PROVIDER é a ÚNICA fonte de decisão explícita —
 * sem ela (env ausente/vazia), o default é sempre "mock", mesmo com
 * OPENROUTER_API_KEY setada. Isso evita que uma variável de nome genérico,
 * já presente no host por outro motivo, mude o comportamento do serviço (e
 * de testes) sem decisão humana.
 */
function loadLlmConfig() {
  const rawProvider = readEnv('LLM_PROVIDER').toLowerCase() || 'mock'
  const rawModel = readEnv('LLM_MODEL')
  const openRouterApiKey = readEnv('OPENROUTER_API_KEY')
  const openRouterRawModel = readEnv('OPENROUTER_MODEL')
  const nvidiaApiKey = readEnv('NVIDIA_API_KEY')
  const nvidiaRawModel = readEnv('NVIDIA_MODEL')

  let provider
  let model
  let externalCallsEnabled = false

  if (rawProvider === 'openrouter') {
    if (openRouterApiKey) {
      provider = 'openrouter'
      model = openRouterRawModel || rawModel || PROVIDER_MODEL_MAP.openrouter
      externalCallsEnabled = true
    } else {
      provider = 'mock'
      model = rawModel || 'mock-safe-v1'
      logger.warn('LLM_PROVIDER=openrouter mas OPENROUTER_API_KEY ausente. Usando MockProvider.')
    }
  } else if (rawProvider === 'nvidia') {
    if (nvidiaApiKey) {
      provider = 'nvidia'
      model = nvidiaRawModel || rawModel || PROVIDER_MODEL_MAP.nvidia
      externalCallsEnabled = true
    } else {
      provider = 'mock'
      model = rawModel || 'mock-safe-v1'
      logger.warn('LLM_PROVIDER=nvidia mas NVIDIA_API_KEY ausente. Usando MockProvider.')
    }
  } else if (VALID_PROVIDERS.has(rawProvider)) {
    provider = rawProvider
    model = rawModel || PROVIDER_MODEL_MAP[rawProvider] || 'unknown-v1'
  } else {
    provider = 'mock'
    model = rawModel || 'mock-safe-v1'
    logger.warn({ rawProvider }, 'LLM_PROVIDER invalido. Usando MockProvider.')
  }

  return {
    provider,
    model,
    externalCallsEnabled,
    openRouterApiKey: openRouterApiKey || undefined,
    openRouterModel: openRouterRawModel || undefined,
    nvidiaApiKey: nvidiaApiKey || undefined,
    nvidiaModel: nvidiaRawModel || undefined
  }
}

/**
 * Lê os limites de orçamento/rate limit/circuit breaker do ambiente. Cada
 * wrapper (budget/rateLimit/circuitBreaker) só é ativado se as envs
 * relevantes estiverem presentes — sem nenhuma env, o retorno é `{}` e o
 * LlmService funciona sem nenhum wrapper aplicado.
 */
function loadSafetyConfig() {
  const sessionId = readEnv('LLM_SESSION_ID') || undefined

  const maxTokensPerSession = readNumberEnv('LLM_MAX_TOKENS_PER_SESSION')
  const maxCostPerSession = readNumberEnv('LLM_MAX_COST_PER_SESSION')
  const ratePerToken = readNumberEnv('LLM_RATE_PER_TOKEN')
  const budget = maxTokensPerSession !== undefined || maxCostPerSession !== undefined
    ? { maxTokensPerSession, maxCostPerSession, ratePerToken }
    : undefined

  const maxCalls = readNumberEnv('LLM_RATE_LIMIT_MAX_CALLS')
  const windowMs = readNumberEnv('LLM_RATE_LIMIT_WINDOW_MS')
  const rateLimit = maxCalls !== undefined && windowMs !== undefined
    ? { maxCalls, windowMs }
    : undefined

  const failureThreshold = readNumberEnv('LLM_CIRCUIT_FAILURE_THRESHOLD')
  const resetTimeoutMs = readNumberEnv('LLM_CIRCUIT_RESET_TIMEOUT_MS')
  const circuitBreaker = failureThreshold !== undefined || resetTimeoutMs !== undefined
    ? { failureThreshold, resetTimeoutMs }
    : undefined

  return { sessionId, budget, rateLimit, circuitBreaker }
}

module.exports = { loadLlmConfig, loadSafetyConfig }
