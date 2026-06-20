# Roadmap Mestre — JoeFelipe Agent

> Auditoria READ_ONLY · MultGestor · 2026-06-20 · base de análise: branch `feat/joefelipe-mission-builder` (contém V1+V2+V3 local) + PR #9 (`feat/joefelipe-agent-foundation-clean`) + docs canônicos.

## Resumo executivo

O **JoeFelipe Agent** é o agente operacional pessoal do fundador dentro do MultGestor: lê o estado real do projeto e o apresenta, **sem nunca executar ação perigosa sozinho**. Hoje ele tem duas camadas entregues e validadas — **V1 Painel Vivo READ_ONLY** e **V2 LLM Core Mock/Plugável** — empacotadas numa PR limpa e mergeable (**#9**). Uma terceira camada, **V3 Mission Builder** (que corresponde exatamente à "Fase 2 — Mission Planner" deste roadmap), **já está construída e local-only** na branch `feat/joefelipe-mission-builder`, aguardando o merge da #9 para virar PR própria.

O caminho seguro é incremental: **mergear #9 → validar `main` → trazer a V3 como PR limpa (Mission Planner) → Prompt Generator → providers reais desligados por padrão → execução controlada com aprovação humana**. A invariante que atravessa todas as fases: `canExecute=false`, `externalCallsEnabled=false`, zero secrets, zero rede, humano como comandante.

**Veredito de prontidão atual:** utilizável localmente e seguro para desenvolvimento. Ainda não pronto para LLM real nem para execução de ações.

---

## Estado atual

### O que já existe (V1 — fundação) — entregue
- Console local Node/TypeScript em `tools/joefelipe-agent/`, **zero dependências de runtime** (só `http`/`fs`/`child_process`; `tsx`+`typescript` são devDeps de checagem).
- Comandos: `dev` (servidor `:3333` + watcher), `status`, `morning`, `close`.
- Painel HTML + `GET /api/state` (JSON).
- Leitura read-only de fontes canônicas (Segundo Cérebro, Living OS, fila) com degradação graciosa (marca "ausente", nunca cria).
- Estado do Git read-only (`branch`/`status`/`log`/`rev-list`).
- `prompt-builder.ts` gera "prompt recomendado" com regras de governança.
- Guard de arquivos sensíveis (`isSensitivePath`) — `.env`, `*.key`, `*.pem`, `brchk.env`, `body-login.json`, `opencode.json` são ignorados por conteúdo.
- Runtime artifacts (`state.json`, `events.jsonl`, `session.md`) gravados em `runtime/` **git-ignored**.

### O que já existe (V2 — LLM Core) — entregue
- Interface plugável: `LlmProvider` / `LlmEngine` / `llm-config` / `providers/MockProvider`.
- `LlmMode`: `READ_ONLY · PLAN_ONLY · SAFE_WRITE · HUMAN_APPROVAL_REQUIRED · EXECUTE_APPROVED · LOCKED`.
- `LlmSafety`: `canExecute` (sempre `false`), `requiresHumanApproval`, `blockedReasons`.
- Config por env (`JOEFELIPE_LLM_PROVIDER`, `JOEFELIPE_LLM_MODEL`); provider inválido/não-mock → **fallback mock**; `externalCallsEnabled=false` fixo.
- `MockProvider` detecta termos sensíveis (push, deploy, secret, banco, migration, RLS, Redis, WhatsApp real, B2 upload, produção, delete, rm, drop, truncate, merge, commit) → bloqueia com `requiresHumanApproval`.

### O que está mockado
- **Toda a inteligência.** O `MockProvider` responde deterministicamente por `mode`; não há raciocínio real. Respostas são templates, não geração.

### O que ainda não executa ação real
- Nada além de ler arquivos e rodar git read-only. Sem commit/push/merge/deploy, sem migrations, sem rede, sem escrita fora de `runtime/`.

### O que está seguro
- `canExecute=false` em 100% dos caminhos; `externalCallsEnabled=false`; nenhum secret lido/impresso; nenhuma dependência de rede; runtime fora do Git.

### O que está incompleto
- Inteligência real (mock apenas); providers reais (só desenhados); **taxonomia de modos não unificada** (ver Divergências); camada de segurança espalhada (lógica em `MockProvider` + V3 `classify`/`scope`, sem módulo `safety/` próprio); sem allowlist/denylist formal de comandos; sem Prompt Generator; integração Living OS é leitura, sem "próxima melhor ação" inteligente.

### O que depende da PR #9 ser mergeada
- Ter a fundação V1+V2 em `main` (hoje `main` **não tem** `tools/joefelipe-agent/` nem `living-os/ai/`).
- **Desbloqueia a V3:** a branch `feat/joefelipe-mission-builder` está empilhada sobre a V2; só vira PR limpa após `main` conter a fundação (rebase em `main`).
- Toda evolução futura (Fases 2–8) assume a fundação em `main`.

---

## Visão do agente

O JoeFelipe Agent é o **chefe de gabinete digital do fundador**: um agente operacional pessoal, local e seguro, que deve:
- **ler** o estado do projeto (código, Living OS, Segundo Cérebro, fila, git);
- **resumir** contexto e responder "onde estamos / o que falta / qual o risco / qual a próxima ação";
- **organizar** próximas ações por prioridade e risco;
- **gerar planos seguros** (missões) com escopo permitido/proibido;
- **ajudar na governança** (apontar canônico, evitar fonte paralela, sinalizar decisões pendentes);
- **preparar prompts** prontos para Claude Code / OpenCode;
- **futuramente** usar provedores LLM plugáveis (desligados por padrão);
- **futuramente** operar um **Mission Planner / Modo Missão Segura**;
- **nunca** executar ações perigosas sem autorização humana explícita.

Distinção essencial: **JoeFelipe Agent propõe e organiza; Claude Code/OpenCode executam (sob aprovação humana); o humano comanda.** O agente nunca é fonte de verdade — referencia o Living OS (autoridade executiva) e o Segundo Cérebro (memória oficial).

---

## Arquitetura atual

```
tools/joefelipe-agent/
├── package.json            # scripts dev/status/morning/close/build/start
├── tsconfig.json           # strict, NodeNext, allowImportingTsExtensions
├── .gitignore              # node_modules, .env*, runtime/*
├── runtime/                # .gitkeep + .gitignore (artefatos efêmeros, fora do Git)
└── src/
    ├── index.ts            # CLI (switch de comandos)
    ├── server.ts           # painel HTML + /api/state
    ├── state.ts            # buildState: consolida fontes → AgentState
    ├── readers.ts          # leitura read-only + isSensitivePath + parsers
    ├── git.ts              # git read-only
    ├── watcher.ts          # fs.watch das fontes
    ├── prompt-builder.ts   # prompt recomendado
    ├── types.ts            # tipos compartilhados
    └── llm/                # V2 LLM Core
        ├── LlmProvider.ts  # contratos
        ├── LlmEngine.ts    # engine + fallback mock
        ├── llm-config.ts   # config por env
        └── providers/MockProvider.ts
```
(Na branch V3 local há ainda `src/mission/**` + `src/llm/sensitive.ts` — **fora** da PR #9.)

**Pontos fortes:** camadas claras (fontes → normalização → inteligência → interface), zero deps, segurança por padrão.
**Dívidas:** segurança espalhada (sem `safety/`), normalização e leitura acopladas em `state.ts`/`readers.ts`, sem `context/` dedicado, gravação de runtime duplicada em `state.ts` e (na V3) `MissionBuilder.ts`.

---

## Arquitetura recomendada (futura — sem alterar nada agora)

```
tools/joefelipe-agent/src/
├── context/            # Camada de fontes + normalização
│   ├── readers.ts          # leitura read-only (migra de src/readers.ts)
│   ├── state.ts            # AgentState (migra de src/state.ts)
│   └── git.ts              # git read-only
├── llm/                # Camada de inteligência
│   ├── LlmProvider.ts · LlmEngine.ts · llm-config.ts
│   └── providers/          # mock + (futuro) openrouter/openai/local
├── safety/             # Camada de segurança (NOVA — consolida o que hoje é espalhado)
│   ├── sensitive.ts        # fonte única de termos sensíveis (hoje na V3)
│   ├── classify.ts         # classificação de risco (hoje na V3)
│   ├── scope.ts            # escopo permitido/proibido (hoje na V3)
│   ├── allowlist.ts        # comandos permitidos
│   └── denylist.ts         # comandos proibidos
├── mission/            # Mission Planner (hoje na V3 local)
│   ├── mission-types.ts · MissionBuilder.ts · render.ts · templates.ts
├── prompt-generator/   # Fase 3 — ideia bruta → prompt técnico padronizado
│   ├── templates.ts        # audit/exec/PR/validation/rollback
│   └── PromptGenerator.ts
├── runtime/            # Persistência local efêmera (centraliza gravação)
│   └── artifacts.ts        # writeRuntimeState/Session/Mission (best-effort)
└── interface/          # CLI + painel + (futuro) UI web
    ├── cli.ts · server.ts · views/
```

| Pasta | Papel |
|---|---|
| `context/` | Ler fontes e normalizar para um modelo único (`AgentState`). Sem inteligência, sem efeitos colaterais externos. |
| `llm/` | Inteligência plugável. Providers implementam um contrato; engine faz fallback seguro. |
| `safety/` | **Guardião central**: termos sensíveis, classificação de risco, escopo, allow/denylist, gates de aprovação. Fonte única consumida por mission/prompt-generator/llm. |
| `mission/` | Transforma estado + intenção em missão segura (classificação, escopo, checklist, rollback, commit). |
| `prompt-generator/` | Transforma ideia bruta em prompt técnico padronizado por tipo (auditoria/execução/PR/validação/rollback). |
| `runtime/` | Único ponto de escrita local (artefatos efêmeros, git-ignored). |
| `interface/` | Apresentação: CLI, painel HTML, futura UI web. |

---

## Roadmap por fases

### Fase 0 — Fundação limpa (entregue, em PR #9)
V1 + LLM Core V2 mock; scripts `joefelipe:*`; painel/status/morning/close; docs canônicas (`prd-joefelipe-v0.1.md`, `joefelipe-llm-core.md`, identidade do agente). **Estado:** PR #9 OPEN, `MERGEABLE`, 23 arquivos. Aguarda revisão/merge humano.

### Fase 1 — Pós-merge da PR #9
- Validar `main` limpa (fundação presente, build verde a partir de `main`).
- Revisar scripts `joefelipe:*` na raiz.
- Consolidar documentação (apontar para canônico; remover referências órfãs).
- Garantir ausência de secrets e runtime artifacts ignorados.
- Criar **checklist de uso local** (`npm ci` → `build` → `status`).
- **Saída:** base estável para empilhar Fases seguintes.

### Fase 2 — Mission Planner / Modo Missão Segura — **já construído na V3 local**
Classificar risco (`READ_ONLY→DANGEROUS`), escopo permitido/proibido, exigir autorização humana para ações perigosas, gerar plano + prompt + checklist + rollback + commit; bloquear deploy/secrets/migrations/push/destrutivos sem autorização. **Status:** implementado em `feat/joefelipe-mission-builder`. **Ação:** após #9, rebasear em `main` e abrir PR limpa da V3 — **não reconstruir**.

### Fase 3 — Prompt Generator Mode
Ideia bruta → prompt técnico padronizado (objetivo, contexto, escopo, proibições, validações, relatório final). Variantes: auditoria, execução, PR, validação, rollback. Evolui o `prompt-builder.ts` para um módulo `prompt-generator/`.

### Fase 4 — Provedores LLM plugáveis (desligados por padrão)
Manter MockProvider como fallback; desenhar `OpenRouterProvider`/`OpenAIProvider`/`LocalProvider` (e `BigPickleProvider` se fizer sentido); chaves só por env, nunca commitadas; `externalCallsEnabled=false` por padrão; LLM **nunca** dispara ação perigosa automaticamente.

### Fase 5 — Integração Living OS / Segundo Cérebro
Ler roadmap, riscos ativos, decisões executivas, fila; sugerir próxima melhor ação com justificativa; apontar canônico; **não criar fonte paralela**; registrar decisões só quando autorizado.

### Fase 6 — Interface operacional
Melhorar painel; visões de estado/missão/riscos/fila; consolidar `morning`/`status`/`close`; futura UI web local mais rica.

### Fase 7 — Segurança e governança
Política de autorização humana formal; logs locais seguros; bloqueio de secrets e de chamadas externas por padrão; **allowlist** e **denylist** de comandos; auditoria antes de PR; checklist antes de merge.

### Fase 8 — Autonomia controlada
Agente sugere, humano aprova; agente prepara plano, humano (ou executor autorizado) executa; **nunca** decide sozinho deploy/banco/secrets/pagamento/produção/git remoto. Níveis: `READ_ONLY · PLAN_ONLY · SAFE_WRITE · HUMAN_APPROVED_EXECUTION`.

```
Fase 0 → Fase 1 (pós-#9) → Fase 2 (V3 já pronta) → Fase 3 → Fase 4 → Fase 5 → Fase 6 → Fase 7 → Fase 8
 fundação   main limpa       Mission Planner      Prompt Gen  Providers  Living OS  Interface Governança Autonomia
```

---

## Backlog priorizado

### P0 — obrigatório antes de qualquer evolução
**P0.1 — Merge da PR #9 (fundação em `main`)**
- Objetivo: levar V1+V2 limpos para `main`. · Valor: base única e auditável. · Risco: baixo (mergeable, sem conflito). · Dependências: revisão humana. · Validação: `npm ci` + `build` a partir de `main`. · Autorização humana: **sim** (merge).

**P0.2 — Validação pós-merge + checklist de uso local (Fase 1)**
- Objetivo: confirmar `main` saudável e documentar uso. · Valor: confiança operacional. · Risco: baixo. · Dependências: P0.1. · Validação: build verde + `status` rodando. · Autorização: não (read-only).

**P0.3 — Unificar taxonomia de modos/níveis**
- Objetivo: reconciliar `LlmMode` (6 modos) × `MissionClassification` V3 (5 níveis) × níveis de autonomia da Fase 8. · Valor: evita ambiguidade de segurança. · Risco: médio (decisão de design). · Dependências: P0.1. · Validação: doc único de taxonomia + tipos coerentes. · Autorização: não (planejamento), sim para implementar.

### P1 — próximo valor alto
**P1.1 — PR limpa da V3 (Mission Planner) — rebase em `main`**
- Objetivo: entregar Fase 2 já construída. · Valor: gera missões seguras. · Risco: médio (rebase). · Dependências: P0.1. · Validação: build + `mission` + diff só da V3. · Autorização: **sim** (rebase + push + PR).

**P1.2 — Módulo `safety/` consolidado**
- Objetivo: centralizar sensitive/classify/scope/allowlist/denylist. · Valor: guardião único. · Risco: médio (refactor). · Dependências: P1.1. · Validação: build + testes de classificação. · Autorização: sim (escrita).

**P1.3 — Prompt Generator (Fase 3)**
- Objetivo: ideia bruta → prompt técnico padronizado. · Valor: acelera Claude Code/OpenCode. · Risco: baixo. · Dependências: P1.2. · Validação: snapshots de prompt por tipo. · Autorização: sim (escrita).

### P2 — melhorias importantes
**P2.1 — Scaffolding de providers reais (desligados)** — contratos + stubs `OpenRouter/OpenAI/Local`, `externalCallsEnabled=false`. Risco: médio (segurança/custo). Dep.: P1.2. Validação: fallback mock garantido. Autorização: sim.
**P2.2 — Integração Living OS profunda (Fase 5)** — próxima melhor ação inteligente. Risco: baixo. Dep.: P1.1. Autorização: não (leitura) / sim (registrar decisão).
**P2.3 — Interface operacional (Fase 6)** — visões de missão/risco/fila. Risco: baixo. Dep.: P1.1. Autorização: sim (escrita).
**P2.4 — Allowlist/denylist de comandos (Fase 7)** — Risco: médio. Dep.: P1.2. Autorização: sim.

### P3 — ideias futuras
**P3.1 — Provider real com gates ligados** (custo/segurança; autorização explícita).
**P3.2 — Execução controlada `HUMAN_APPROVED_EXECUTION` (Fase 8)**.
**P3.3 — UI web local rica**.
**P3.4 — `BigPickleProvider`** (se fizer sentido no fluxo OpenCode).
Todos: risco alto/variável, dependem das fases anteriores, **exigem autorização humana**.

---

## Estratégia de PRs
- **#9 (fundação V1+V2)** — já aberta, mergeable. **Mergear primeiro.**
- **Depois do merge da #9:** rebasear `feat/joefelipe-mission-builder` em `main` e abrir **PR separada do Mission Planner** (V3). Diff limpo (só `src/mission/`, `sensitive.ts`, doc V3, ajustes de `index.ts`/`package.json`/`README`/`state.ts`).
- **Depois:** PR separada do **Prompt Generator**.
- **Depois:** PR separada de **provider LLM real, desligado por padrão**.
- **Regras invioláveis:** nunca misturar V3 com fundação; nunca misturar docs+runtime+secrets+deploy+feature grande no mesmo PR; uma capacidade por PR; staging explícito (sem `git add .`); `.obsidian/` e `.opencodex/archive/` nunca entram.

---

## Critérios de pronto
- **Utilizável localmente:** hoje — `npm ci` + `build` + `status`/`dev` funcionam; painel + `/api/state`.
- **Seguro para desenvolvimento:** hoje — `canExecute=false`, sem rede, sem secrets, runtime ignorado.
- **Pronto para gerar missões:** pronto no código (V3 local); falta virar PR após #9.
- **Pronto para LLM real:** exige Fase 4 (scaffolding) + Fase 7 (gates) + autorização; `externalCallsEnabled` default `false`.
- **Pronto para ajudar na governança:** parcial — lê fontes; falta "próxima melhor ação" inteligente (Fase 5).
- **Pronto para uso diário do JoeFelipe:** após #9 + Fase 1 (checklist de uso) será uso diário básico; pleno após Fases 2–3.

---

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Agente executar algo perigoso | `canExecute=false` invariante; só escreve em `runtime/`; git read-only; gates de aprovação (Fase 7). |
| LLM inventar comando | LLM **propõe, não executa**; `safety/` valida antes; denylist; humano aprova. |
| Vazamento de secret | `isSensitivePath` ignora `.env`/keys; `externalCallsEnabled=false`; nunca logar secret; checklist anti-secret antes de PR. |
| PR contaminada | Lição da #8: PR por caminho explícito, sem `git add .`, validação de diff (já aplicado na #9). |
| Branch divergente | `main` é a base única; sempre rebasear em `origin/main`; verificar `merge-base` antes de abrir PR. |
| Arquivo canônico duplicado | Agente referencia, não duplica; identidade canônica única em `.opencodex/brain/agents/`. |
| Dependência externa instável | Zero deps de runtime; providers reais opcionais e com fallback mock. |
| Custo de API | `externalCallsEnabled=false` por padrão; ligar só com autorização e limites; mock no desenvolvimento. |
| Excesso de autonomia | Níveis explícitos; `AUTONOMOUS` proibido; humano comanda toda ação sensível. |
| Confusão Claude Code × OpenCode × JoeFelipe Agent | Papéis documentados: JoeFelipe **propõe/organiza**, Claude Code/OpenCode **executam** sob aprovação, humano **comanda**. |
| Taxonomia de modos divergente (achado) | Unificar `LlmMode`/`MissionClassification`/níveis de autonomia num doc único (P0.3). |

---

## Próxima melhor ação
**Mergear a PR #9** (revisão humana) para fixar a fundação em `main`. É P0, está `MERGEABLE`, sem conflito, e **desbloqueia tudo** (especialmente a V3 já pronta). Imediatamente após: validação pós-merge (Fase 1) e, em seguida, trazer a V3 (Mission Planner) como PR limpa via rebase em `main`.

---

## Checklist de autorização humana
Cada item abaixo **exige "sim" explícito** antes de executar:
- [ ] Mergear a PR #9 em `main`.
- [ ] Após merge: rebasear `feat/joefelipe-mission-builder` em `main`.
- [ ] Abrir a PR limpa da V3 (Mission Planner).
- [ ] Qualquer escrita de código (Fases 2–8).
- [ ] Ligar `externalCallsEnabled=true` / integrar provider real (Fase 4+).
- [ ] Adicionar chaves de API (sempre via env, nunca commit).
- [ ] Qualquer `git push`, `merge`, `rebase`, deploy.
- [ ] Registrar decisão no Living OS / Segundo Cérebro.
- [ ] Criar automação de Windows / agendador.

---

## Notas finais

**Divergências encontradas na auditoria:**
1. **Taxonomia de modos não unificada** — `LlmMode` (6: …`HUMAN_APPROVAL_REQUIRED`/`EXECUTE_APPROVED`/`LOCKED`) × `MissionClassification` da V3 (5: …`HUMAN_GATED`/`DANGEROUS`) × níveis de autonomia (`HUMAN_APPROVED_EXECUTION`). Recomendado unificar (P0.3).
2. **Regex de `migration`** — na fundação (PR #9) é `/\bmigration\b/i` (singular); na V3 local virou `/\bmigrations?\b/i` (plural). Convergir quando a V3 for PR.
3. **Versão** — fundação `2.0.0 (V2…)`; V3 local `3.0.0 (V3…)`. Coerente com a separação de escopo.
4. **Doc da identidade** diz "zero dependências"; há devDeps (`tsx`/`typescript`) — o README esclarece que são só para checagem. Ajuste cosmético de redação.
5. **Segurança espalhada** — lógica sensível vive em `MockProvider` + (V3) `classify`/`scope`, sem módulo `safety/`. Consolidar (P1.2).

**A PR #9 é a base correta?** Sim. É a única que contém a fundação coerente (V1+V2) criada a partir de `origin/main`, `MERGEABLE`, 23 arquivos, sem `.obsidian`/`archive`/V3, com `canExecute=false`/`externalCallsEnabled=false`. A #8 foi corretamente fechada (37 commits/156 arquivos por divergência de base). A V3 depende da #9 estar em `main`.

**Próxima missão após o merge da PR #9:**
1. **Fase 1 — validação pós-merge** (build a partir de `main`, checklist de uso local, confirmar ausência de secrets e runtime ignorado).
2. **Trazer a V3 (Mission Planner) como PR limpa:** `git rebase main feat/joefelipe-mission-builder` → validar diff só-V3 → abrir PR. Isso entrega a **Fase 2** sem reconstruir nada.

---

> **Nota de versionamento:** este roadmap foi salvo a partir de `origin/main` em `living-os/ai/` porque o `main` ainda não contém `.opencodex/brain/`. Quando o Segundo Cérebro for reconciliado com o `main`, considere mover/espelhar este documento para `.opencodex/brain/roadmaps/` e linká-lo no índice canônico.
