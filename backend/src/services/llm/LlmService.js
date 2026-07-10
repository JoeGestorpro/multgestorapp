// LlmService — engine plugavel de LLM do MultGestor, portado de
// tools/joefelipe-agent/src/llm/LlmEngine.ts (Fase 1 — IA Operacional).
//
// Diferencas deliberadas em relacao ao original:
//  - Sem integracao com "kernel" (conceito exclusivo do agente joefelipe-agent,
//    inexistente no backend do MultGestor) — o unico gate de chamada externa
//    e `config.externalCallsEnabled` (Fase 1), setado apenas quando
//    LLM_PROVIDER aponta para um provider real com API key presente.
//  - Sem emissao de evento de custo em kernel.events — quem precisar de
//    telemetria de custo consulta getSafetyStatus().

const { appLogger } = require('../../shared/core/logger')
const { loadLlmConfig, loadSafetyConfig } = require('./llm-config')
const { MockProvider } = require('./providers/MockProvider')
const { OpenRouterProvider } = require('./providers/OpenRouterProvider')
const { NvidiaProvider } = require('./providers/NvidiaProvider')
const { BudgetProvider } = require('./wrappers/BudgetProvider')
const { RateLimitProvider } = require('./wrappers/RateLimitProvider')
const { CircuitBreakerProvider } = require('./wrappers/CircuitBreakerProvider')
const { DriverRegistry } = require('./DriverRegistry')
const { DriverManager } = require('./DriverManager')

const logger = appLogger.child({ module: 'LlmService' })

// Defesa em profundidade: qualquer texto vindo de um provider externo passa
// por aqui antes de chegar ao chamador/log — mascara padroes tipicos de
// chave de API caso algum dia vazem por engano (nvapi-... e o prefixo real
// das chaves NVIDIA NIM, formato diferente do sk-... usado por OpenRouter).
const API_KEY_PATTERN = /\b(sk-[A-Za-z0-9_-]{6,}|nvapi-[A-Za-z0-9_-]{6,}|Bearer\s+[A-Za-z0-9._-]{10,})\b/g

function sanitizeErrorMessage(msg) {
  return msg.replace(API_KEY_PATTERN, '[REDACTED]')
}

class LlmService {
  constructor(config, safety) {
    this.config = config ?? loadLlmConfig()
    this.safety = safety ?? loadSafetyConfig()
    this.registry = new DriverRegistry()
    this.manager = new DriverManager(this.registry, this.config.provider)
    this.rawProvider = undefined

    const mock = new MockProvider()
    this.registry.register(mock)

    if (this.config.provider === 'openrouter' && this.config.openRouterApiKey) {
      const orp = new OpenRouterProvider(this.config.openRouterApiKey, this.config.openRouterModel ?? this.config.model)
      this.rawProvider = orp
      this.registry.register(this.wrapWithSafety(orp))
    }

    if (this.config.provider === 'nvidia' && this.config.nvidiaApiKey) {
      const nvp = new NvidiaProvider(this.config.nvidiaApiKey, this.config.nvidiaModel ?? this.config.model)
      this.rawProvider = nvp
      this.registry.register(this.wrapWithSafety(nvp))
    }
  }

  /**
   * Envelopa o provider real com os wrappers de seguranca configurados, na
   * ordem Budget -> RateLimit -> CircuitBreaker -> provider real (o Budget
   * checa primeiro, por ser o mais barato; o CircuitBreaker fica mais perto
   * do provider real, ja que e sobre a saude dele). So aplica o wrapper cuja
   * config foi explicitamente fornecida.
   */
  wrapWithSafety(provider) {
    let wrapped = provider

    if (this.safety?.circuitBreaker) {
      this.circuitBreakerProvider = new CircuitBreakerProvider(wrapped, this.safety.circuitBreaker)
      wrapped = this.circuitBreakerProvider
    }
    if (this.safety?.rateLimit) {
      this.rateLimitProvider = new RateLimitProvider(wrapped, this.safety.rateLimit)
      wrapped = this.rateLimitProvider
    }
    if (this.safety?.budget) {
      this.budgetProvider = new BudgetProvider(wrapped, this.safety.sessionId ?? 'default', this.safety.budget)
      wrapped = this.budgetProvider
    }

    return wrapped
  }

  getProviderInfo() {
    return {
      provider: this.config.provider,
      model: this.config.model,
      externalCallsEnabled: this.config.externalCallsEnabled
    }
  }

  getProviders() {
    return this.registry.list()
  }

  getStatus() {
    return {
      providers: this.registry.total,
      list: this.registry.getStatus(),
      active: this.config.provider,
      mode: this.config.model
    }
  }

  getSafetyStatus(sessionId) {
    if (!this.budgetProvider) return { budgetActive: false }

    const budget = this.budgetProvider.getStatus()
    const rateLimit = this.rateLimitProvider?.getStatus(sessionId)

    return {
      budgetActive: true,
      tokensUsed: budget.tokensUsed,
      tokensLimit: budget.tokensLimit,
      budgetUsed: budget.budgetUsed,
      budgetLimit: budget.budgetLimit,
      rateLimitRemaining: rateLimit?.remaining ?? null,
      rateLimitWindow: rateLimit?.windowMs ?? null,
      circuitState: this.circuitBreakerProvider?.getState() ?? null
    }
  }

  async complete(request) {
    try {
      const provider = this.manager.selectProvider()

      if (provider.name !== 'mock' && !this.config.externalCallsEnabled) {
        const reason = 'Chamadas externas de LLM desabilitadas (externalCallsEnabled=false).'
        const mock = this.registry.get('mock')
        const mockResponse = mock ? await mock.complete(request) : null
        return {
          provider: 'mock',
          model: mockResponse?.model ?? 'mock-safe-v1',
          mode: request.mode,
          text: '[Bloqueado] ' + reason + ' Nenhuma chamada externa foi feita. Resposta de fallback seguro (mock) abaixo.\n\n' + (mockResponse?.text ?? ''),
          safety: { canExecute: false, requiresHumanApproval: true, blockedReasons: [reason] },
          metadata: { blockedByConfig: true }
        }
      }

      return await provider.complete(request)
    } catch (err) {
      // Nenhuma falha do provider real (timeout, 429, 5xx, chave invalida,
      // rede indisponivel, etc.) e propagada ao chamador — sempre devolve
      // uma resposta segura e legivel, com o modo mantido.
      const rawMsg = err instanceof Error ? err.message : String(err)
      const msg = sanitizeErrorMessage(rawMsg)
      logger.warn({ err: msg }, 'LlmService.complete: fallback seguro apos falha do provider real')
      return {
        provider: 'mock',
        model: 'mock-safe-v1',
        mode: request.mode,
        text: `Nao foi possivel obter resposta da LLM real agora (${msg}). Nenhuma acao foi executada; resposta de fallback seguro (mock) exibida abaixo.`,
        safety: {
          canExecute: false,
          requiresHumanApproval: true,
          blockedReasons: [`Erro no provider real: ${msg}`]
        },
        metadata: { fallback: true, error: msg }
      }
    }
  }
}

// Singleton hoisted no import — mesmo padrao do eventBus
// (backend/src/shared/core/events/event-bus.js).
const llmService = new LlmService()

module.exports = { LlmService, llmService }
