# Auditoria do Agente JoeFelipe — Estado Atual, Poder Futuro e Integração LLM

**Data:** 2026-06-19
**Modo:** READ_ONLY / PLAN_ONLY
**Auditor:** Análise local baseada em código, documentação, fila e Living OS
**Commit base:** `3716c26` + `00674cd` (branch `feat/joefelipe-agent-v1`)

---

## 1. Resumo Executivo

O **Agente JoeFelipe** é um agente local, residente e read-only que conecta o fundador (Joe Felipe) ao Segundo Cérebro do MultGestor (memória oficial em `.opencodex/brain/`) e ao Living OS (autoridade executiva em `.opencodex/brain/living-os/`).

Hoje ele já:
- Lê 12 fontes canônicas do projeto
- Consolida estado (missão, riscos, decisões, Git, fontes)
- Serve um painel HTML local (`localhost:3333`)
- Serve uma API JSON (`/api/state`)
- Gera prompt operacional para Claude Code / OpenCode
- Opera exclusivamente em modo **READ_ONLY** — zero execução, zero escrita

**Problema que resolve:** O MultGestor cresceu além do que uma pessoa pode acompanhar de memória. O agente centraliza o estado real e responde "onde estamos, o que vem agora, quais os riscos" sem exigir que o humano leia 20 arquivos manualmente.

**Visão de evolução:** De painel vivo para sistema operacional executivo com LLM plugável, gerador de missões, guardião de governança e eventual executor controlado (Estágios 1→7 do PRD v0.1).

---

## 2. Inventário do que já existe

### Estrutura de pastas

```
tools/joefelipe-agent/
├── .gitignore                   (defense-in-depth: node_modules/, .env, runtime/)
├── package.json                 (5 scripts: dev, status, morning, close, build)
├── package-lock.json            (build determinístico)
├── tsconfig.json                (ES2022, NodeNext, strict, noEmit)
├── README.md                    (documentação completa, 111 linhas)
├── runtime/
│   ├── .gitignore               (* → só .gitkeep/.gitignore escapam)
│   ├── .gitkeep
│   ├── state.json               (snapshot do último estado — ignorado pelo git)
│   ├── events.jsonl             (eventos do watcher — ignorado)
│   └── session.md               (último morning/close — ignorado)
├── src/
│   ├── types.ts                 (88 linhas — interfaces: AgentState, GitInfo, etc.)
│   ├── readers.ts               (285 linhas — leitura de fontes, parse, extração)
│   ├── state.ts                 (171 linhas — buildState, runtime persist)
│   ├── git.ts                   (66 linhas — comandos git read-only)
│   ├── prompt-builder.ts        (56 linhas — gera prompt para executor)
│   ├── server.ts                (127 linhas — HTTP server + HTML inline)
│   ├── watcher.ts               (40 linhas — fs.watch em 5 diretórios)
│   └── index.ts                 (82 linhas — CLI dispatcher)
└── node_modules/                (ignorado — tsx, typescript, @types/node)
```

### Scripts npm

| Comando raiz | Comando local | Função |
|---|---|---|
| `joefelipe:dev` | `dev` | Sobe servidor `:3333` + watcher |
| `joefelipe:status` | `status` | Estado completo no terminal |
| `joefelipe:morning` | `morning` | Bom dia operacional |
| `joefelipe:close` | `close` | Encerramento de sessão |
| — | `build` | `tsc --noEmit` (type-check) |

### Endpoints

| URL | Tipo | Conteúdo |
|---|---|---|
| `http://localhost:3333` | HTML | Painel com estado, missão, riscos, decisões, Git, prompt |
| `http://localhost:3333/api/state` | JSON | Estado completo estruturado |

### Runtime (efêmero, não versionado)

- `state.json` — último snapshot do `buildState()`, ~229 linhas
- `events.jsonl` — eventos de watcher, ~12 eventos capturados em teste
- `session.md` — último resumo de sessão

### Documentos canônicos encontrados

| Documento | Papel |
|---|---|
| `.opencodex/brain/agents/joefelipe-personal-operating-agent.md` (141 linhas) | Agente canônico — identidade, regras, limites |
| `.opencodex/brain/agents/global-vision-architect.md` (93 linhas) | Agente de estratégia DOCS_ONLY |
| `living-os/ai/prd-joefelipe-v0.1.md` (523 linhas) | PRD do Agente — visão, estágios, requisitos |
| `.opencodex/queue/current-task.md` | Missão atual: idle |
| `.opencodex/queue/next-task.md` (118 linhas) | Próxima: ops/backup-external-copy (PLAN_ONLY) |
| `.opencodex/brain/living-os/riscos/riscos-ativos.md` (118 linhas) | 9 riscos (4 P1, 4 P2, 1 resolvido) |
| `.opencodex/brain/living-os/decisoes/decisoes-executivas.md` (88 linhas) | 5 decisões pendentes |
| `.opencodex/brain/living-os/05-proxima-melhor-acao.md` (75 linhas) | Próxima ação: ops/backup-external-copy |

### Commits relevantes

```
00674cd docs(prd): add JoeFelipe agent PRD v0.1 + agent gitignore
3716c26 feat(agent): add JoeFelipe personal operating agent v1
```

---

## 3. Capacidades Atuais

| # | Capacidade | Como funciona | Implementado em |
|---|---|---|---|
| 1 | Lê 12 fontes canônicas | `collectSources()` em `readers.ts` — INDEX, project-state, queue, living-os, roadmap | `readers.ts:139-160` |
| 2 | Consolida estado centralizado | `buildState()` em `state.ts` — missão, riscos, decisões, Git, fontes | `state.ts:30-134` |
| 3 | Mostra missão atual | Lê `current-task.md`, extrai frontmatter `status` + `task_id` | `state.ts:34-43` |
| 4 | Mostra próxima missão | Lê `next-task.md`, extrai `task_id`, `status`, `mode` | `state.ts:109-112` |
| 5 | Mostra riscos ativos | Parseia `riscos-ativos.md` — extrai severidade (P1/P2), id, título | `readers.ts:225-249` |
| 6 | Mostra decisões pendentes | Parseia `decisoes-executivas.md` — extrai seção "Pendentes" | `readers.ts:251-265` |
| 7 | Mostra estado Git | `git branch`, `git status --porcelain`, `git rev-list --count`, `git log -5` | `git.ts:21-65` |
| 8 | Gera prompt recomendado | Monta prompt com contexto + regras de governança | `prompt-builder.ts:6-56` |
| 9 | Painel HTML local | Servidor HTTP inline com CSS dark mode, auto-reload 30s | `server.ts:28-123` |
| 10 | API JSON `/api/state` | Serializa `AgentState` completo | `server.ts:14-18` |
| 11 | Watcher de arquivos | `fs.watch` recursivo em 5 diretórios do brain | `watcher.ts:14-40` |
| 12 | Modo READ_ONLY explícito | `AGENT_META.mode = "READ_ONLY"` — zero escrita | `state.ts:20-25` |
| 13 | Detecção de caminhos sensíveis | Regex bloqueia `.env`, secrets, chaves, `brchk.env` | `readers.ts:14-31` |
| 14 | Geração de resumo de sessão | `morning` + `close` — com pendências e próxima ação | `index.ts:52-76` |
| 15 | Runtime persist local | `state.json`, `events.jsonl`, `session.md` em `runtime/` | `state.ts:136-171` |

---

## 4. Limitações Atuais

| # | Limitação | Impacto |
|---|---|---|
| 1 | **Não usa LLM real** | Não interpreta estado — só exibe dados crus. "Por que isso é prioridade?" não tem resposta |
| 2 | **Não executa ações** | Zero comandos de escrita, zero git operations, zero criação de arquivos |
| 3 | **Não escreve arquivos** | Não pode criar docs, atualizar estado, gerar relatórios |
| 4 | **Não decide sozinho** | Toda ação significativa depende de humano |
| 5 | **Não monitora produção** | Sem health check de backend, frontend, banco, deploy |
| 6 | **Não envia alertas** | Sem notificações, sem e-mail, sem integração com calendário |
| 7 | **Não aciona ferramentas externas** | Sem Git write, Supabase, Render, Vercel, B2 |
| 8 | **Não tem modos de permissão** | Apenas READ_ONLY — sem SAFE_WRITE, HUMAN_GATED, etc. |
| 9 | **Não tem memória operacional própria** | Só lê fontes — não aprende com interações passadas |
| 10 | **Watcher Windows limitado** | `fs.watch recursive` não detecta pastas criadas depois da inicialização |
| 11 | **Painel inline sem interatividade** | HTML estático sem React, sem WebSocket, sem atualização em tempo real |
| 12 | **Prompt é template fixo** | Não adapta o prompt ao contexto — sempre o mesmo formato |
| 13 | **Sem classificação de riscos** | Só exibe os riscos — não calcula score, tendência, prioridade relativa |

---

## 5. Arquitetura Atual Inferida

```
┌──────────────────────────────────────────────────┐
│                   index.ts                        │
│  (CLI dispatcher: dev / status / morning / close) │
└─────────┬──────────────┬──────────────┬───────────┘
          │              │              │
          ▼              ▼              ▼
┌────────────────┐ ┌────────────┐ ┌────────────────┐
│   server.ts     │ │ state.ts   │ │  watcher.ts    │
│ HTTP :3333      │ │ buildState │ │ fs.watch × 5   │
│ HTML + JSON     │ │ writeState │ │ dirs           │
└────────────────┘ └─────┬──────┘ └────────────────┘
          │               │
          ▼               ▼
┌──────────────────────────────────────────────────┐
│                  readers.ts                       │
│  collectSources · safeReadFile · extractRisks     │
│  extractDecisions · extractNextBestAction         │
│  parseFrontmatter · firstHeading · findRepoRoot   │
│  SENSITIVE_PATTERNS (bloqueio de secrets)         │
└──────────┬──────────────────────────────────┬─────┘
           │                                  │
           ▼                                  ▼
┌──────────────────┐              ┌──────────────────┐
│     git.ts        │              │ prompt-builder.ts│
│ git read-only     │              │ monta prompt     │
│ (branch,status,   │              │ para executor    │
│  log,rev-list)    │              │                  │
└──────────────────┘              └──────────────────┘
           │
           ▼
┌──────────────────┐
│  runtime/         │
│ state.json        │  ← snapshot efêmero (ignorado)
│ events.jsonl      │  ← watcher log
│ session.md        │  ← resumo de sessão
└──────────────────┘

Camadas (inferidas do PRD v0.1):
1. Camada de Fontes    → readers.ts (leitura + parse)
2. Camada de Normalização → state.ts (consolidação)
3. Camada de Inteligência → ❌ AUSENTE (placeholder para LLM)
4. Camada de Segurança  → readers.ts: SENSITIVE_PATTERNS + state.ts: modo READ_ONLY
5. Camada de Interface  → server.ts (HTML + JSON) + index.ts (terminal)
6. Camada de Execução   → ❌ AUSENTE (futuro)
```

---

## 6. O que significa "dar poder" ao agente

| Poder | Nome | O que faz | Implementado? |
|---|---|---|---|
| **0** | Ler e exibir | Lê fontes, consolida, mostra painel + terminal | ✅ Completo |
| **1** | Interpretar com LLM | Explica por que algo é prioridade, qual risco é pior, etc. | ❌ Ausente |
| **2** | Gerar planos e missões | Cria prompt operacional com escopo, proibições, critérios | 🔶 Parcial (template fixo) |
| **3** | Validar escopo e riscos | Alerta arquivos fora do escopo, missão sem aprovação, drift | ❌ Ausente |
| **4** | Escrever arquivos seguros | Criar/atualizar docs, relatórios, checklists (com aprovação) | ❌ Ausente |
| **5** | Executar comandos seguros | Git read, npm build, type-check, geração de arquivos | ❌ Ausente |
| **6** | Operar ferramentas externas | Supabase queries read-only, Render status, health checks | ❌ Ausente |
| **❌ Proibido** | Ações destrutivas | Deploy, push, migration, banco, secrets, produção | 🔒 Bloqueado por design |

**Observação:** Poder 2 está parcial — o `prompt-builder.ts` gera um template, mas ele não adapta o conteúdo dinamicamente ao risco/decisão mais relevante. É um template estático com placeholders.

---

## 7. Proposta de Integração LLM

### Arquitetura plugável

```
┌───────────────────────────────────────────┐
│              LlmProvider (interface)       │
│  generate(context: LlmContext): LlmResponse │
└──────────────────┬────────────────────────┘
                   │ implementa
         ┌─────────┼──────────┐
         ▼                    ▼
┌─────────────────┐  ┌──────────────────┐
│  MockProvider    │  │  RealProvider     │
│  (mock seguro,   │  │  (OpenRouter,     │
│   sem chamada    │  │   OpenAI, etc.)   │
│   externa)       │  │                  │
└─────────────────┘  └──────────────────┘
         │                    │
         ▼                    ▼
┌───────────────────────────────────────────┐
│              LlmEngine                     │
│  · sanitizeContext() — remove secrets      │
│  · classifyRisk() — classifica ação        │
│  · guardContext() — limita tamanho         │
│  · logSanitized() — registra sem segredos  │
└───────────────────────────────────────────┘
```

### Interface `LlmProvider`

```typescript
interface LlmProvider {
  readonly name: string;
  supportsStructured: boolean;
  generate(context: LlmContext): Promise<LlmResponse>;
  isAvailable(): boolean;
}

interface LlmContext {
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  temperature?: number;
}

interface LlmResponse {
  content: string;
  provider: string;
  model: string | null;
  tokensUsed: { input: number; output: number } | null;
  generatedAt: string;
}
```

### `MockProvider` (implementação prioritária)

```typescript
class MockProvider implements LlmProvider {
  name = "mock";
  supportsStructured = true;

  async generate(context: LlmContext): Promise<LlmResponse> {
    // Analisa o contexto localmente sem chamada externa:
    // - Se perguntar sobre riscos → responde com dados do state
    // - Se perguntar sobre próxima ação → responde com NBA do Living OS
    // - Se pedir explicação → template baseado em regras
    // - NUNCA inventa estado
    return {
      content: this.buildMockResponse(context),
      provider: "mock",
      model: null,
      tokensUsed: null,
      generatedAt: new Date().toISOString(),
    };
  }
}
```

### Provedores futuros possíveis

| Provedor | Tipo | Quando usar |
|---|---|---|
| OpenRouter | API (paga, multi-modelo) | Produção — acesso a GPT-4, Claude, Gemini |
| OpenAI | API (paga) | Se preferir OpenAI direto |
| Anthropic | API (paga) | Se preferir Claude direto |
| Modelo local (Ollama) | Local (grátis) | Sem internet, sem custo |
| Outros provedores | API | Qualquer compatível com OpenAI-style chat |

### Configuração por ambiente

```env
# Opcional — se vazio ou "mock", usa MockProvider
JOEFELIPE_LLM_PROVIDER=mock
JOEFELIPE_LLM_MODEL=
JOEFELIPE_LLM_API_KEY=
JOEFELIPE_LLM_API_BASE=
JOEFELIPE_LLM_MAX_TOKENS=4096
JOEFELIPE_LLM_TEMPERATURE=0.3
```

### Regras da integração

- Se `JOEFELIPE_LLM_PROVIDER` não for definido ou for `"mock"` → usa **MockProvider** (zero custo, zero internet)
- Se for definido mas a chave estiver vazia → fallback automático para mock, com aviso
- O `LlmEngine.sanitizeContext()` **remove** qualquer conteúdo que case com `SENSITIVE_PATTERNS` antes de enviar ao provider
- O provedor real **nunca recebe secrets** — o `sanitizeContext()` bloqueia antes
- Respostas estruturadas são parseadas por tipo (explicação, plano, alerta, prompt)
- Logs sanitizados registram apenas metadados (provider, tokens, tempo, tipo) — nunca input/output completos

---

## 8. Regras de Segurança para LLM

| Regra | Descrição |
|---|---|
| **LLM propõe, não executa** | O LLM gera explicações e planos. Nunca executa comandos, não chama APIs, não escreve arquivos |
| **LLM não recebe secrets** | `sanitizeContext()` remove todo conteúdo sensível antes de enviar |
| **LLM não decide deploy** | Qualquer recomendação de deploy é sinalizada como "requer aprovação humana" |
| **LLM não altera banco** | Sugestões de migração são rotuladas como `DANGEROUS` — bloqueadas |
| **LLM não faz push** | TODAS as ações de git write são classificadas como `HUMAN_GATED` |
| **LLM não liga integrações reais** | Ativar WhatsApp real, ligar B2, virar feature flags → sempre `HUMAN_APPROVAL_REQUIRED` |
| **Ação perigosa → aprovação humana** | O `SafetyClassifier` classifica toda ação antes de sugerir execução |
| **Modo padrão = READ_ONLY** | A LLM opera dentro do modo atual do agente; se for READ_ONLY, só explica |
| **Contexto limitado** | `guardContext()` limita o prompt enviado ao LLM para evitar estouro de tokens |
| **Fallback sempre disponível** | Se LLM real falhar (timeout, erro, quota), mock assume — agente nunca quebra |

---

## 9. Modos Operacionais Recomendados

| Modo | O que permite | O que bloqueia | Status |
|---|---|---|---|
| **READ_ONLY** | Ler fontes, consolidar estado, exibir painel, gerar prompt, watcher | Qualquer escrita, execução, chamada externa | ✅ Ativo |
| **PLAN_ONLY** | Tudo do READ_ONLY + gerar planos com LLM (mock ou real) + classificar riscos | Escrever arquivos, executar comandos, chamar APIs | 🎯 Próximo |
| **SAFE_WRITE** | Tudo do PLAN_ONLY + escrever arquivos seguros (docs em `living-os/ai/`, relatórios em `runtime/`) | Git write, deploy, banco, APIs, produção | 🔒 Futuro |
| **HUMAN_APPROVAL_REQUIRED** | Tudo do SAFE_WRITE + preparar ações que exigem ok humano — mostra diff, mostra riscos, aguarda | Executar sem aprovação explícita | 🔒 Futuro |
| **EXECUTE_APPROVED** | Tudo do HUMAN_APPROVAL + executar ações aprovadas (git commit, npm build, criação de branch) | Ações não aprovadas, deploy, banco, produção | 🔒 Futuro |
| **LOCKED** | Nada — agente desliga todas as capacidades não essenciais | Tudo exceto "estou bloqueado" | 🔒 Emergência |

---

## 10. Próximos Módulos Recomendados

| Módulo | Descrição | Depende de |
|---|---|---|
| `llm/core` | Interfaces LlmProvider, LlmEngine, providers, sanitizer | Nada |
| `llm/mock-provider` | MockProvider que responde com base no state | `llm/core` |
| `mission-builder` | Gera prompt operacional com escopo, proibições, critérios | `llm/core` |
| `governance-guard` | Valida escopo, alerta drift, verifica fila vs ação | `readers.ts` (já existe) |
| `safety-classifier` | Classifica ações por risco (SAFE / HUMAN_GATED / DANGEROUS) | `types.ts` |
| `tool-orchestrator` | Gerencia permissão e execução de ferramentas | `safety-classifier` |
| `report-generator` | Gera relatórios diários, resumo de sessão, changelog | `mission-builder` |
| `production-monitor` | Health check de backend, frontend, CI, backup | `tool-orchestrator` |
| `revenue-copilot` | Score de vendável/produção/receita por vertical | `production-monitor` |
| `memory-indexer` | Memória operacional entre sessões (além do state.json) | `llm/core` |

---

## 11. Roadmap Técnico Sugerido

### Fase 1: LLM Core Mock (recomendado como PRÓXIMA)

**Objetivo:** Adicionar interfaces de LLM + MockProvider que funciona sem internet.

**Arquivos prováveis:**
- `tools/joefelipe-agent/src/llm/provider.ts` — interface LlmProvider
- `tools/joefelipe-agent/src/llm/engine.ts` — LlmEngine com sanitizeContext, guardContext
- `tools/joefelipe-agent/src/llm/mock-provider.ts` — MockProvider
- `tools/joefelipe-agent/src/llm/types.ts` — tipos específicos de LLM
- `tools/joefelipe-agent/src/safety.ts` — SafetyClassifier inicial
- `tools/joefelipe-agent/src/llm/` — diretório do módulo

**Riscos:** Baixo — não toca produção, não gasta dinheiro, não chama API externa

**Critério de aceite:**
- [ ] `LlmProvider` interface definida e documentada
- [ ] `MockProvider` implementado sem dependências externas
- [ ] `LlmEngine` com `sanitizeContext()` que remove secrets
- [ ] MockProvider responde explicações baseadas no state real
- [ ] Nenhuma dependência nova instalada
- [ ] Modo READ_ONLY continua funcionando sem LLM
- [ ] `npm run build` passa sem erros
- [ ] Modo PLAN_ONLY funcional (mock gera plano básico)

---

### Fase 2: Mission Builder

**Objetivo:** Transformar estado em missão operacional executável.

**Arquivos prováveis:**
- `tools/joefelipe-agent/src/mission/builder.ts`
- `tools/joefelipe-agent/src/mission/types.ts`
- `tools/joefelipe-agent/src/mission/classifier.ts`

**Riscos:** Médio — pode gerar prompts imprecisos se o contexto estiver incompleto

**Critério de aceite:**
- [ ] Gera prompt para Claude Code com escopo + proibições
- [ ] Classifica missão como `PLAN_ONLY` / `READ_ONLY` / `SAFE_WRITE` / `HUMAN_GATED` / `DANGEROUS`
- [ ] Inclui checklist de validação
- [ ] Inclui critério de rollback
- [ ] Gera plano de validação sem execução

---

### Fase 3: Governance Guard

**Objetivo:** Impedir bagunça operacional.

**Arquivos prováveis:**
- `tools/joefelipe-agent/src/governance/guard.ts`
- `tools/joefelipe-agent/src/governance/rules.ts`

**Riscos:** Médio — falsos positivos podem atrapalhar

**Critério de aceite:**
- [ ] Alerta arquivos modificados fora do escopo da missão
- [ ] Alerta `.obsidian` alterado (auto-metadata)
- [ ] Alerta secrets no git status
- [ ] Alerta se a missão proposta não corresponde à fila
- [ ] Verifica se `requires_human_approval` está sendo respeitado

---

### Fase 4: LLM Real via Provider Plugável

**Objetivo:** Conectar LLM real mantendo segurança.

**Arquivos prováveis:**
- `tools/joefelipe-agent/src/llm/providers/openrouter.ts`
- `tools/joefelipe-agent/src/llm/providers/openai.ts`
- `tools/joefelipe-agent/src/llm/providers/anthropic.ts`
- `.env.example` para JOEFELIPE_LLM_*

**Riscos:** Alto — vazamento de contexto, custo financeiro

**Critério de aceite:**
- [ ] Provider real configurável via env
- [ ] Fallback automático para mock se chave vazia
- [ ] `sanitizeContext()` bloqueia secrets antes de enviar
- [ ] Log sanitizado (sem input/output completos)
- [ ] Limite de tokens configurável
- [ ] Timeout configurável
- [ ] Custo estimado antes de cada chamada

---

### Fase 5: Relatórios e Alertas

**Objetivo:** Gerar relatórios automáticos diários e alertas.

**Arquivos prováveis:**
- `tools/joefelipe-agent/src/reports/daily.ts`
- `tools/joefelipe-agent/src/reports/weekly.ts`
- `tools/joefelipe-agent/src/reports/session.ts`

**Riscos:** Baixo — só gera arquivos em `runtime/`

---

### Fase 6: Execução Controlada com Aprovação Humana

**Objetivo:** Permitir execução segura com gates.

**Arquivos prováveis:**
- `tools/joefelipe-agent/src/executor/orchestrator.ts`
- `tools/joefelipe-agent/src/executor/approval.ts`
- `tools/joefelipe-agent/src/executor/tools/git.ts`
- `tools/joefelipe-agent/src/executor/tools/files.ts`

**Riscos:** Alto — requer maturidade das fases anteriores

---

## 12. Riscos de Evolução

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Agente inventar estado (alucinação LLM) | Média | Alto | LLM só responde com base em `AgentState` carregado; mock nunca inventa |
| LLM vazar contexto sensível | Baixa | Crítico | `sanitizeContext()` + `SENSITIVE_PATTERNS` + logs sem conteúdo |
| Execução indevida (fase 6) | Baixa | Crítico | Toda ação perigosa exige aprovação humana explícita |
| Duplicação de fonte de verdade | Média | Alto | Princípio: agente referencia, não duplica. Living OS é autoridade |
| Aumento de complexidade | Alta | Médio | Manter arquitetura em camadas, testes, documentação |
| Custo com LLM | Média | Médio | Mock por padrão; LLM real só com opt-in humano + limite de gasto |
| Dependência de provedor externo | Média | Baixo | MockProvider é o fallback padrão — agente nunca fica cego |

---

## 13. Recomendações Finais

### Qual é a próxima melhor evolução?

**Fase 1 — LLM Core Mock.** É a evolução mais segura, de menor risco e que mais agrega valor imediato. Permite que o agente **interprete** o estado atual em vez de apenas exibi-lo, sem depender de API externa, sem custo, sem vazamento.

### O que deve ser feito primeiro?

1. Criar `tools/joefelipe-agent/src/llm/` com interfaces + MockProvider
2. Integrar LlmEngine ao `buildState()` — o prompt recomendado passa a ser gerado com interpretação
3. Adicionar modo `PLAN_ONLY` ao `index.ts`
4. Testar sem internet, sem chave, sem custo

### O que não deve ser feito ainda?

1. ❌ **LLM real** (OpenAI/Anthropic) — só depois que o core mock estiver estável
2. ❌ **Execução de comandos** — requer SafetyClassifier + HUMAN_GATED mode
3. ❌ **Git write** — requer Fase 6 completa
4. ❌ **Health check de produção** — requer integração com ferramentas externas
5. ❌ **Novas dependências npm** — a V1 é zero dependências de runtime; manter enquanto possível

### Qual commit futuro seria seguro?

**Após Fase 1 implementada e testada:**

```
feat(llm): add LLM core with MockProvider and PLAN_ONLY mode
```

Arquivos esperados:
- `tools/joefelipe-agent/src/llm/provider.ts` (interface)
- `tools/joefelipe-agent/src/llm/engine.ts` (engine + sanitize)
- `tools/joefelipe-agent/src/llm/mock-provider.ts` (mock)
- `tools/joefelipe-agent/src/llm/types.ts` (tipos)
- `tools/joefelipe-agent/src/safety.ts` (classificador inicial)

### Qual parte precisa de decisão humana?

| Decisão | Descrição |
|---|---|
| **LLM real vs apenas mock na Fase 1?** | Recomendo: mock primeiro, LLM real só depois com opt-in |
| **Modo PLAN_ONLY — o que pode gerar?** | Só planos de arquivos seguros ou também sugestões de arquivos sensíveis? |
| **Novas dependências?** | MockProvider é zero dependências. LLM real exigirá `fetch` nativo ou axios |
| **Diretório `llm/` dentro de `src/`?** | Confirmar estrutura antes de implementar |
| **Relatórios automáticos — sim ou não?** | Pode ser útil mas adiciona complexidade |

---

## 14. Veredito

### V1 pronto com notas ⚠️

**O que está maduro:**
- Arquitetura limpa e modular (readers, state, server, watcher separados)
- Leitura de todas as 12 fontes canônicas funcionando
- Painel HTML + API JSON + terminal — 3 interfaces
- Segurança: SENSITIVE_PATTERNS, modo READ_ONLY, runtime ignorado
- Documentação: agente canônico (141 linhas), README (111 linhas), PRD (523 linhas)
- Git: 0 commits não autorizados, 0 pushes

**O que precisa de atenção:**
- `prompt-builder.ts` é template fixo — não interpreta estado, não adapta ao contexto
- Nenhuma camada de inteligência (LLM) — agente é "cego" para significado dos dados
- Watcher Windows tem limitação conhecida (pastas criadas post-init)
- Painel HTML é inline — manutenção verbosa (CSS + HTML no mesmo arquivo)
- Sem testes automatizados para o agente (zero arquivos `.test.ts`)
- Modo PLAN_ONLY não implementado — só READ_ONLY existe

**Classificação:** V1 entregue, operacional e segura. **Pronta para Fase 2 (LLM Core Mock).**
