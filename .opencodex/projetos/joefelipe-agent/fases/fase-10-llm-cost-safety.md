## Fase 10 — LLM Cost Safety (P1)

### Objetivo
Adicionar controles de custo, rate limit e circuito ao LlmEngine para que uma LLM real (OpenRouter, Nvidia) possa ser conectada sem risco de gasto descontrolado.

### Contexto arquitetural
- `src/llm/LlmEngine.ts` — orquestrador, hoje tem gate de kernel mode + sanitizeError + MockProvider fallback
- `src/llm/LlmProvider.ts` — interface LlmRequest tem `maxTokens?: number`
- Providers (`OpenRouterProvider`, `NvidiaProvider`) têm hardcoded `max_tokens: 1024` e `DEFAULT_MAX_RETRIES = 2`
- UI polling em `server.ts` (função `refreshAll()`) chama 13 endpoints a cada 5s, nenhum deles LLM — seguro
- `src/llm/LlmEngine.test.ts` e `src/server.test.ts` são os arquivos de teste

### O que implementar

**1. BudgetProvider (wrapper)**

Crie `src/llm/providers/BudgetProvider.ts` implementando `LlmProvider` que:
- Envolve qualquer outro provider (OpenRouter, Nvidia, etc.)
- Mantém contador acumulado de tokens por sessão (recebe sessionId no constructor)
- Mantém contador estimado de $ (usa rate $/token configurável via constructor)
- Rejeita (throw ou retorna response com safety.blocked) se:
  - `maxTokensPerSession` for excedido
  - `maxCostPerSession` for excedido
- Expõe `getUsage(): { tokensUsed, estimatedCost, sessionId }`
- Implementa `reset(sessionId)` para zerar contadores

**2. RateLimitProvider (wrapper)**

Crie `src/llm/providers/RateLimitProvider.ts` implementando `LlmProvider` que:
- Envolve qualquer outro provider
- Mantém sliding-window de chamadas por sessão (ex.: max 10 chamadas / 60s)
- Usa `Map<sessionId, Array<timestamp>>` em memória
- Rejeita com `safety.blockedReasons: ["Rate limit excedido: X chamadas nos últimos Ys"]`
- Tempo e limite configuráveis no constructor

**3. CircuitBreakerProvider (wrapper)**

Crie `src/llm/providers/CircuitBreakerProvider.ts` que:
- Envolve qualquer outro provider
- 3 estados: CLOSED (normal), OPEN (rejeita rápido), HALF_OPEN (testa)
- Abre após N falhas consecutivas (configurável, default 5)
- Fecha após M segundos (configurável, default 30s) + 1 chamada de teste bem-sucedida
- Falhas = HTTP 5xx, timeout, network error (NÃO 4xx exceto 429)
- Quando OPEN, retorna response com `safety.blockedReasons: ["Provedor temporariamente indisponível"]`

**4. Integrar no LlmEngine**

Em `LlmEngine`:
- Adicionar método ou constructor que aceite `budget`, `rateLimit`, `circuitBreaker` configs
- Envelopar o provider ativo com BudgetProvider → RateLimitProvider → CircuitBreakerProvider (nesta ordem)
- Preservar fallback para MockProvider
- Se uma config não for fornecida, não usar aquele wrapper (backward compat)

**5. Expor na rota /api/llm/status**

No `server.ts`:
- Adicionar ao objeto retornado por `/api/llm/status` os campos:
  - `budgetUsed`, `budgetLimit`, `tokensUsed`, `tokensLimit`
  - `rateLimitRemaining`, `rateLimitWindow`
  - `circuitState` (CLOSED/OPEN/HALF_OPEN)
- Se BudgetProvider não estiver ativo, retornar `{ budgetActive: false }`

**6. Expor no dashboard**

No HTML template do dashboard em `server.ts`:
- Adicionar seção "LLM Cost" abaixo do status atual do LLM
- Mostrar: tokens usados / limite, $ estimado / limite, estado do circuit breaker
- Se budget não estiver ativo, mostrar aviso amarelo: "Sem controle de custo ativo"

**7. Remover max_tokens hardcoded nos providers**

Em `OpenRouterProvider.ts` e `NvidiaProvider.ts`:
- Se `request.maxTokens` for fornecido, usar esse valor
- Se não for fornecido, usar 1024 como default (backward compat)
- Atualizar testes para cobrir ambos os casos

**8. Cost logging**

No `LlmEngine`:
- Após cada `complete()` bem-sucedido, emitir evento pelo EventBus (já existe em Kernel):
  - Tipo: `"llm:cost"`
  - Payload: `{ provider, model, sessionId, tokens, estimatedCost, mode, taskSummary }`
- O EventBus já persiste em `events.jsonl` via `Kernel.emit()` (verifique se já funciona)

### Testes

Para cada provider wrapper, criar seu próprio arquivo `.test.ts` correspondente:
- `BudgetProvider.test.ts` — testa limite de tokens, limite de $, reset, pass-through
- `RateLimitProvider.test.ts` — testa N chamadas dentro da janela, bloqueio, reset após janela
- `CircuitBreakerProvider.test.ts` — testa CLOSED→OPEN com N falhas, OPEN→HALF_OPEN após tempo, HALF_OPEN→CLOSED com sucesso, pass-through de 4xx
- `LlmEngine.test.ts` — atualizar testes existentes para verificar wrapping e fallback

No `server.test.ts`:
- Testar que `/api/llm/status` retorna campos de budget/circuit
- Testar que dashboard mostra seção "LLM Cost"
- Não precisa testar UI polling (já testado na Fase 9)

### Critérios de sucesso

1. `npm run build` — 0 erros
2. `npm test` — todos os testes existentes continuam passando + novos testes passam
3. Com BudgetProvider ativo e sem tokens, chamada ao provider é bloqueada com safety message
4. Com CircuitBreakerProvider e 5 falhas consecutivas, a 6ª chamada é rejeitada rápido (sem fetch)
5. Dashboard mostra estado de custo corretamente
