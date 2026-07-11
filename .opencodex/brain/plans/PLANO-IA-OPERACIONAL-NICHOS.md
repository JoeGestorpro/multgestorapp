# Plano: IA Operacional nos Nichos

> **Criado:** 2026-07-07
> **Status:** Planejado (não iniciado)
> **Versão:** 1.1 — Conexão com Instrutor Gerador de Nichos

---

## Conexão com o Instrutor Gerador de Nichos

Este plano é ATIVADO quando um nicho já passou pelo ciclo completo do [[../../Nichos/00-INSTRUTOR-GERADOR-DE-NICHOS.md]] e tem dados reais em produção.

### Ciclo de ativação

```
Nichos/01-TEMPLATE seção 19 → "Camada de IA Operacional"
       ↓
Nicho gera dados reais (agendamentos, clientes)
       ↓
Semáforo de IA muda: 🔴 → 🟡 → 🟢
       ↓
Ativar este plano
       ↓
IA segue o Prompt 5 (Nichos/02-PROMPTS-PARA-CODE-NICHO.md)
       ↓
Features de IA aparecem no dashboard do nicho
```

### Semáforo de IA

| Status | Significado | Quando ativar |
|---|---|---|
| 🔴 | Nicho sem dados | — |
| 🟡 | 100+ agendamentos | Previsão de demanda |
| 🟢 | 500+ interações | Churn detection + sugestões |
| 🔵 | Nicho maduro | Automação avançada |

### Nichos vinculados

| Nicho | Semáforo IA | Features ativas |
|---|---|---|
| BarberGestor | 🟡 | Previsão demanda (planejada) |
| — | 🔴 | — |

### Documentos relacionados

- [[../../Nichos/00-INSTRUTOR-GERADOR-DE-NICHOS.md]]
- [[../../Nichos/01-TEMPLATE-ARQUITETURA-DE-NICHO.md]]
- [[../../Nichos/02-PROMPTS-PARA-CODE-NICHO.md]]
- [[../../.agent/skills/create-vertical/SKILL.md]]

---

## Propósito

Criar a primeira camada de IA operacional dentro do MultGestor, começando pelo BarberGestor (único nicho com dados reais), com design agnóstico para expandir a outros nichos.

## Decisões Arquiteturais

| Decisão | Escolha | Justificativa |
|---|---|---|
| Engine de LLM | Portar `tools/joefelipe-agent/src/llm/` para JS no backend | Zero deps externas, sem novo infra, mais confiável que bridge HTTP |
| Primeira feature | Previsão de demanda + Churn detection | Dados reais de agendamentos existem; LLM agrega valor imediato |
| Escopo do design | Serviço genérico (por `company_id`), implementação inicial apenas BarberGestor | Único nicho com dados; sem abstração prematura |
| Provedor inicial | MockProvider (dev) → OpenRouter/Nvidia (prod) | Já implementado e testado no agente |
| Event Bus | Reutilizar o existente (`event-bus.js` + `OutboxWorker`) | Já em produção, consumidores de IA são só mais um handler |

## Arquitetura

```
┌─────────────────────────────────────────┐
│           BarberGestor Dashboard         │
│  [📊 Insights IA] [📈 Previsão Demanda] │
└────────────────────┬────────────────────┘
                     │ GET /api/barber/ai/insights
                     ▼
┌─────────────────────────────────────────┐
│         LlmService (novo)               │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Provider │ │ Safety   │ │ Prompt  │ │
│  │ Registry │ │ Wrappers │ │ Builder │ │
│  └─────────┘ └──────────┘ └─────────┘ │
│  (portado do joefelipe-agent)          │
└──────────┬──────────────────────────┬──┘
           │                          │
           ▼                          ▼
┌──────────────────┐   ┌──────────────────────────┐
│   Supabase DB    │   │   Event Bus + Outbox     │
│  appointments    │   │  ← appointment.created   │
│  customers       │   │  ← AI.SuggestionGenerated│
│  ai_suggestions  │   │                          │
└──────────────────┘   └──────────────────────────┘
```

## Fases

### Fase 1 — Engine + Primeira Feature (1ª semana)

#### 1.1 Portar LlmEngine para o backend
- Criar `backend/src/services/llm/`
- Portar: `LlmProvider` interface → JS, `MockProvider`, `OpenRouterProvider`, `NvidiaProvider`
- Portar: `BudgetProvider`, `RateLimitProvider`, `CircuitBreakerProvider`
- Portar: `DriverRegistry` + `DriverManager`
- Criar `LlmService.js` (singleton, hoisted como no agente)
- Variáveis de ambiente: `LLM_PROVIDER`, `LLM_MODEL`, `OPENROUTER_API_KEY`, `NVIDIA_API_KEY`, `LLM_MAX_TOKENS_PER_SESSION`, etc.

#### 1.2 Tabela `ai_suggestions` (migration 031)
```sql
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  type VARCHAR(50) NOT NULL, -- 'demand_prediction', 'churn_alert', 'service_suggestion'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  data JSONB,
  status VARCHAR(20) DEFAULT 'active', -- active, dismissed, applied
  source VARCHAR(50) DEFAULT 'llm',    -- llm, rule-based
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX idx_ai_suggestions_company ON ai_suggestions(company_id, type, status);
```

#### 1.3 Serviço de Previsão de Demanda
- `backend/src/services/llm/demand-prediction.service.js`
- Busca agendamentos dos últimos 60 dias
- Monta prompt: "Com base nos {N} agendamentos desta barbearia, quais os dias mais movimentados? Responda em JSON com dias, horários de pico e tendências."
- Chama `LlmService.complete()` com `mode: READ_ONLY`
- Armazena resultado em `ai_suggestions` (type: `demand_prediction`)
- Cache: 24h (expires_at)

#### 1.4 Serviço de Churn Detection
- `backend/src/services/llm/churn-detection.service.js`
- Busca clientes sem agendamento há 30+ dias
- Monta prompt: "Analise estes clientes que não visitam há {X} dias. Identifique risco de churn (alto/médio/baixo) para cada um e sugira uma mensagem de recuperação."
- Armazena em `ai_suggestions` (type: `churn_alert`)

#### 1.5 Endpoint `/api/barber/ai/insights`
- `backend/src/routes/barber-ai.routes.js`
- `GET /api/barber/ai/insights` — retorna sugestões ativas da empresa
- `POST /api/barber/ai/insights/:id/dismiss` — marcar como lida
- `GET /api/barber/ai/insights/refresh` — força nova previsão (rate-limited)

#### 1.6 Card "Insights IA" no Dashboard
- Componente React em `frontend/src/components/BarberDashboard/AiInsightsCard.jsx`
- Mostra: previsão de dias cheios, alertas de churn
- Botão "Atualizar" (chama refresh)
- Loading state + fallback (se LLM desligado, mostra "Indisponível")

#### 1.7 Evento `AI.SuggestionGenerated`
- Contrato no `contracts.js`
- Publicado no EventBus quando sugestão é criada
- Consumidor: AuditLog (registra que IA sugeriu algo)

### Fase 2 — Consumidor de Eventos (2ª semana)

#### 2.1 Contratos AI.*
- Adicionar em `contracts.js`: `AI.SuggestionGenerated`, `AI.PredictionCompleted`, `AI.ActionSuggested`
- Validação com `validateEventPayload()`

#### 2.2 AI Consumer no OutboxWorker
- `backend/src/integrations/consumers/ai-suggestion.consumer.js`
- Escuta `appointment.created` → gera previsão de demanda se necessário
- Escuta `appointment.canceled` → verifica se cliente está em risco de churn
- Registra no OutboxWorker em `server.js`

#### 2.3 DLQ Table (migration 032)
```sql
CREATE TABLE event_dlq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_message_id UUID REFERENCES outbox_messages(id),
  event_type VARCHAR(100),
  payload JSONB,
  error TEXT,
  failed_at TIMESTAMPTZ DEFAULT NOW(),
  retry_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending'
);
```

### Fase 3 — Automation Engine v0 (futuro)

Planejada, não executada agora. Ver `.opencodex/brain/fase-11b1-e2e-foundation.md`.

## Estrutura de Arquivos (a criar)

```
backend/src/
├── services/llm/
│   ├── index.js                    # barrel exports
│   ├── LlmService.js               # singleton engine (portado)
│   ├── LlmProvider.js              # interface base
│   ├── DriverRegistry.js           # registro de providers
│   ├── DriverManager.js            # seleciona provider ativo
│   ├── sensitive.js                # detecção de termos sensíveis
│   ├── llm-config.js               # carrega config de env vars
│   ├── providers/
│   │   ├── MockProvider.js
│   │   ├── OpenRouterProvider.js
│   │   └── NvidiaProvider.js
│   ├── wrappers/
│   │   ├── BudgetProvider.js
│   │   ├── RateLimitProvider.js
│   │   └── CircuitBreakerProvider.js
│   ├── demand-prediction.service.js
│   └── churn-detection.service.js
├── routes/barber-ai.routes.js
└── integrations/consumers/
    └── ai-suggestion.consumer.js
frontend/src/
└── components/BarberDashboard/
    └── AiInsightsCard.jsx
database/
└── migrations/
    ├── 031_ai_suggestions.sql
    └── 032_event_dlq.sql
```

## Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Custo de API LLM subir | BudgetProvider com limite por empresa/sessão; fallback rule-based |
| LLM gerar sugestão errada | Sempre `mode: READ_ONLY`; sugestões são informativas, não autônomas |
| Latência alta na primeira chamada | Cache de 24h; refresh manual; timeout de 15s no provider |
| ClimaGestor nunca ter dados | Design agnóstico, mas só implementa quando houver 2º nicho com dados |
| Provider de API cair | CircuitBreakerProvider + fallback pra MockProvider (resposta rule-based) |

## Critérios de Done (DoD)

- [ ] `LlmService.complete()` funciona com MockProvider (sem API key)
- [ ] `LlmService.complete()` funciona com OpenRouter/NVIDIA (com API key)
- [ ] BudgetProvider bloqueia após limite definido
- [ ] RateLimitProvider bloqueia após N chamadas
- [ ] CircuitBreakerProvider abre após N falhas consecutivas
- [ ] Migration 031 aplicada (tabela `ai_suggestions`)
- [ ] `/api/barber/ai/insights` retorna dados
- [ ] Card "Insights IA" renderiza no dashboard
- [ ] Evento `AI.SuggestionGenerated` é publicado no EventBus
- [ ] Suíte de testes backend passa (0 fails)
- [ ] Lint frontend 0 errors
- [ ] Build frontend ok

---

## Referências

- C-04 — Event Bus: `docs/event-bus-architecture.md`
- C-07 — AI Operational Layer: `.opencodex/brain/maps/multgestor-core/capabilities/ia-operacional.md`
- JoeFelipe Agent LlmEngine: `tools/joefelipe-agent/src/llm/`
- Fase 11-B.1 (E2E Foundation): `.opencodex/brain/fase-11b1-e2e-foundation.md`
