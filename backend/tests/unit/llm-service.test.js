// Testes do LlmService (Fase 1 — IA Operacional), portado de
// tools/joefelipe-agent/src/llm/LlmEngine.test.ts. Cobre os itens do DoD do
// plano: MockProvider funciona sem API key, BudgetProvider bloqueia apos
// limite, RateLimitProvider bloqueia apos N chamadas, CircuitBreakerProvider
// abre apos N falhas consecutivas, e nenhuma excecao escapa de complete().

const { LlmService } = require('../../src/services/llm/LlmService')

describe('LlmService.complete — MockProvider (default, sem API key)', () => {
  it('funciona normalmente sem qualquer configuracao', async () => {
    const service = new LlmService()
    const response = await service.complete({ mode: 'READ_ONLY', task: 'analisar estado' })

    expect(response.provider).toBe('mock')
    expect(response.safety.canExecute).toBe(false)
  })

  it('preserva o modo solicitado mesmo apos falha do provider real', async () => {
    const service = new LlmService()
    service.registry.register({
      name: 'mock',
      model: 'test-model',
      complete: async () => { throw new Error('network down') }
    })

    const response = await service.complete({ mode: 'PLAN_ONLY', task: 'teste' })
    expect(response.mode).toBe('PLAN_ONLY')
    expect(response.safety.canExecute).toBe(false)
    expect(response.text.length).toBeGreaterThan(0)
  })

  it('nunca propaga excecao — fallback seguro sempre', async () => {
    const service = new LlmService()
    service.registry.register({
      name: 'mock',
      model: 'test-model',
      complete: async () => { throw new Error('boom') }
    })

    await expect(service.complete({ mode: 'READ_ONLY', task: 'teste' })).resolves.toBeDefined()
  })

  it('sanitiza chave de API vazada na mensagem de erro (sk-...)', async () => {
    const service = new LlmService()
    service.registry.register({
      name: 'mock',
      model: 'test-model',
      complete: async () => { throw new Error('falha ao chamar API com Authorization: Bearer sk-super-secret-should-not-leak-123456') }
    })

    const response = await service.complete({ mode: 'READ_ONLY', task: 'teste' })
    expect(response.text).not.toContain('sk-super-secret-should-not-leak-123456')
    expect(JSON.stringify(response)).not.toContain('sk-super-secret-should-not-leak-123456')
  })

  it('sanitiza chave NVIDIA (nvapi-...) mesmo fora do padrao "Bearer <token>"', async () => {
    const service = new LlmService()
    service.registry.register({
      name: 'mock',
      model: 'test-model',
      complete: async () => { throw new Error('chave invalida: nvapi-super-secret-should-not-leak-654321 rejeitada pelo provedor') }
    })

    const response = await service.complete({ mode: 'READ_ONLY', task: 'teste' })
    expect(response.text).not.toContain('nvapi-super-secret-should-not-leak-654321')
  })
})

describe('LlmService.complete — gate de externalCallsEnabled', () => {
  const ENABLED_CONFIG = {
    provider: 'openrouter',
    model: 'fake-real-model',
    externalCallsEnabled: true,
    openRouterApiKey: 'sk-fake-key-for-test'
  }

  function fakeRealProvider() {
    let called = false
    return {
      provider: {
        name: 'openrouter',
        model: 'fake-real-model',
        async complete(request) {
          called = true
          return {
            provider: 'openrouter',
            model: 'fake-real-model',
            mode: request.mode,
            text: 'resposta real',
            safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
            metadata: { external: true }
          }
        }
      },
      called: () => called
    }
  }

  it('chama o provider real quando externalCallsEnabled=true', async () => {
    const service = new LlmService(ENABLED_CONFIG)
    const { provider, called } = fakeRealProvider()
    service.registry.register(provider)

    const response = await service.complete({ mode: 'READ_ONLY', task: 'analisar estado' })
    expect(called()).toBe(true)
    expect(response.provider).toBe('openrouter')
  })

  it('bloqueia o provider real quando externalCallsEnabled=false, mesmo com provider registrado', async () => {
    const disabledConfig = { ...ENABLED_CONFIG, externalCallsEnabled: false }
    const service = new LlmService(disabledConfig)
    const { provider, called } = fakeRealProvider()
    service.registry.register(provider)

    const response = await service.complete({ mode: 'READ_ONLY', task: 'analisar estado' })
    expect(called()).toBe(false)
    expect(response.provider).toBe('mock')
    expect(response.text).toContain('[Bloqueado]')
  })
})

describe('LlmService — BudgetProvider', () => {
  it('bloqueia a segunda chamada ao exceder o limite de tokens da sessao', async () => {
    let calls = 0
    const service = new LlmService(
      { provider: 'openrouter', model: 'fake', externalCallsEnabled: true, openRouterApiKey: 'sk-fake' },
      { budget: { maxTokensPerSession: 50 } }
    )
    const provider = {
      name: 'openrouter',
      model: 'fake',
      async complete(request) {
        calls += 1
        return {
          provider: 'openrouter',
          model: 'fake',
          mode: request.mode,
          text: 'resposta real',
          safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
          metadata: { tokensUsed: 60 }
        }
      }
    }
    service.registry.register(service.wrapWithSafety(provider))

    const first = await service.complete({ mode: 'READ_ONLY', task: 'a' })
    expect(first.text).toBe('resposta real')

    const second = await service.complete({ mode: 'READ_ONLY', task: 'b' })
    expect(calls).toBe(1)
    expect(second.safety.canExecute).toBe(false)
    expect(second.safety.blockedReasons[0]).toMatch(/Limite de tokens/)
  })

  it('getSafetyStatus reflete uso real apos uma chamada', async () => {
    const service = new LlmService(
      { provider: 'openrouter', model: 'fake', externalCallsEnabled: true, openRouterApiKey: 'sk-fake' },
      { sessionId: 'sess-1', budget: { maxTokensPerSession: 1000, ratePerToken: 0.01 }, rateLimit: { maxCalls: 10, windowMs: 60_000 } }
    )
    const provider = {
      name: 'openrouter',
      model: 'fake',
      async complete(request) {
        return {
          provider: 'openrouter',
          model: 'fake',
          mode: request.mode,
          text: 'ok',
          safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
          metadata: { tokensUsed: 30 }
        }
      }
    }
    service.registry.register(service.wrapWithSafety(provider))

    await service.complete({ mode: 'READ_ONLY', task: 'a' })
    const status = service.getSafetyStatus()
    expect(status.budgetActive).toBe(true)
    expect(status.tokensUsed).toBe(30)
    expect(status.tokensLimit).toBe(1000)
    expect(status.budgetUsed).toBeCloseTo(0.3)
    expect(status.rateLimitRemaining).toBe(9)
  })

  it('sem safety config, budgetActive e false (backward compat)', () => {
    const service = new LlmService({ provider: 'openrouter', model: 'fake', externalCallsEnabled: true, openRouterApiKey: 'sk-fake' })
    expect(service.getSafetyStatus()).toEqual({ budgetActive: false })
  })
})

describe('LlmService — RateLimitProvider', () => {
  it('bloqueia apos N chamadas na janela', async () => {
    const service = new LlmService(
      { provider: 'openrouter', model: 'fake', externalCallsEnabled: true, openRouterApiKey: 'sk-fake' },
      { rateLimit: { maxCalls: 2, windowMs: 60_000 } }
    )
    let calls = 0
    const provider = {
      name: 'openrouter',
      model: 'fake',
      async complete(request) {
        calls += 1
        return {
          provider: 'openrouter',
          model: 'fake',
          mode: request.mode,
          text: 'ok',
          safety: { canExecute: false, requiresHumanApproval: false, blockedReasons: [] },
          metadata: {}
        }
      }
    }
    service.registry.register(service.wrapWithSafety(provider))

    await service.complete({ mode: 'READ_ONLY', task: 'a' })
    await service.complete({ mode: 'READ_ONLY', task: 'b' })
    const third = await service.complete({ mode: 'READ_ONLY', task: 'c' })

    expect(calls).toBe(2)
    expect(third.safety.canExecute).toBe(false)
    expect(third.safety.blockedReasons[0]).toMatch(/Rate limit excedido/)
  })
})

describe('LlmService — CircuitBreakerProvider', () => {
  it('abre o circuito apos N falhas consecutivas e passa a bloquear sem chamar o provider', async () => {
    let calls = 0
    const service = new LlmService(
      { provider: 'openrouter', model: 'fake', externalCallsEnabled: true, openRouterApiKey: 'sk-fake' },
      { circuitBreaker: { failureThreshold: 2, resetTimeoutMs: 60_000 } }
    )
    const failing = {
      name: 'openrouter',
      model: 'fake',
      async complete() {
        calls += 1
        const err = new Error('provider down')
        err.status = 500
        throw err
      }
    }
    const wrapped = service.wrapWithSafety(failing)
    service.registry.register(wrapped)

    // Duas falhas consecutivas abrem o circuito (threshold=2). O caminho
    // complete() nunca propaga a excecao ao chamador — cai no fallback mock.
    await service.complete({ mode: 'READ_ONLY', task: 'a' })
    await service.complete({ mode: 'READ_ONLY', task: 'b' })
    expect(calls).toBe(2)
    expect(service.circuitBreakerProvider.getState()).toBe('OPEN')

    // Terceira chamada: circuito OPEN bloqueia antes de chegar ao provider real.
    await service.complete({ mode: 'READ_ONLY', task: 'c' })
    expect(calls).toBe(2)
  })
})
