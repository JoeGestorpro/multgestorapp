# JoeFelipe Agent — Execution Core

> **Componente:** Execution Core (Planner → Orchestrator → Engine → Registry → Executor → Policy)
> **Versão:** V1 (núcleo funcional, executores reais ainda como stub)
> **Status:** Implementado — shell real e execução externa continuam desligados por padrão
> **Data:** 2026-07-05

---

## 1. O que é

O **Execution Core** é o pipeline que transforma uma missão planejada em passos executáveis, com segurança e persistência em cada etapa. Cobre desde a criação da orquestração até o registro de eventos operacionais, passando por um Policy Engine que aprova ou nega cada step.

Regra central, igual ao LLM Core: **o agente propõe e orquestra, mas só executa write real quando o modo do kernel e as políticas permitirem explicitamente.**

---

## 2. Arquitetura

```
tools/joefelipe-agent/src/
├── orchestrator/
│   ├── TaskOrchestrator.ts   # cria/persiste orquestrações e steps (orchestration.jsonl)
│   └── StepDeriver.ts        # deriva steps a partir do tipo/classificação da missão
├── execution/
│   ├── ExecutionEngine.ts    # laço principal: policy → registry → executor → eventos → estado
│   ├── ExecutionStateStore.ts# snapshot persistente da execução ativa (execution-state.json)
│   ├── errors.ts             # erros padronizados (nunca escapam do engine sem contexto)
│   ├── executors/
│   │   ├── NoopExecutor.ts       # sempre sucesso, usado em testes e fallback legado
│   │   ├── HumanExecutor.ts      # stub controlado (nunca pede input interativo)
│   │   ├── ClaudeExecutor.ts     # stub — sem chamada externa, sem secrets
│   │   ├── OpenCodeExecutor.ts   # stub — sem chamada externa, sem secrets
│   │   ├── ShellExecutor.ts      # executa comando real (whitelist) — bloqueado por policy por padrão
│   │   └── CommandValidator.ts   # whitelist de comandos seguros para o ShellExecutor
│   └── policy/
│       ├── PolicyEngine.ts       # monta a cadeia de políticas padrão
│       └── ExecutionPolicyChain.ts # ModePolicy, StepTypePolicy, SafetyPolicy, ScopePolicy,
│                                    # ShellPolicy, GitPolicy, DeployPolicy, SecretsPolicy
└── events/
    └── EventStore.ts         # já existente; o engine reusa (não recria um paralelo)
```

---

## 3. Fluxo completo: plan → run → engine → registry → executor → policy

1. `plan "<goal>"` gera um `Plan` com `PlannedMission[]` (runtime/queue.json).
2. `run` (ou `run <mission-id>`) pega a missão e chama `TaskOrchestrator.create(mission)`,
   que usa o `StepDeriver` para transformar o tipo/classificação da missão em uma lista
   de `OrchestrationStep` (ex.: `analyze → implement → test → commit`).
3. A orquestração é persistida em `runtime/orchestration.jsonl` (append-only, com rotação).
4. O `ExecutionEngine.runAll()`:
   - persiste o snapshot inicial (`ExecutionStateStore`, status `running`);
   - emite `execution_started` no `EventStore`;
   - chama `runOnce()` em loop até não haver mais step `pending`, até um step falhar,
     ou até detectar abort.
5. Em cada `runOnce()`:
   - monta o `ExecutionCommand` (`TaskOrchestrator.buildCommand`);
   - avalia o `PolicyEngine` (cadeia de políticas — primeira negação vence);
   - se negado: marca o step como `failed`, emite `policy_denied`, persiste erro;
   - se permitido: resolve o executor via `ExecutorRegistry.resolveStrict()` (erro claro
     se o id não existir — sem fallback silencioso nesse caminho);
   - executa o step (try/catch — exceção do executor vira `StepResult` falho, nunca derruba
     o processo);
   - se o resultado tiver `metadata.pending === "true"` (caso do `HumanExecutor`), o step
     vira `waiting_human` — a orquestração **não** é marcada como falha, apenas pausada;
   - caso contrário, `completeStep`/`failStep` como de costume, com evento e persistência.
6. Ao final do `runAll()`: `execution_completed` (e limpa o estado persistido),
   `execution_failed`, ou `execution_aborted` — conforme o desfecho.

---

## 4. Abort persistente

- `ExecutionStateStore` (`runtime/execution-state.json`) guarda o snapshot da execução
  ativa: status, steps, `abortRequested`, etc. Não é um log histórico (isso já é o
  `orchestration.jsonl`); é "o que está rodando agora".
- `run abort` chama `ExecutionEngine.abort()`, que marca `abortRequested = true` em
  memória **e** persiste no arquivo — mesmo que o processo que pediu abort seja diferente
  do processo que está rodando `run`.
- Antes de cada step, `runOnce()` chama `checkAbort()`, que olha tanto a flag em memória
  quanto o arquivo persistido (comparando `orchestrationId` para não vazar abort de uma
  execução antiga para uma nova). Se detectar abort, para sem rodar mais nada.
- `run` (sem argumento) detecta uma orquestração ativa da mesma missão e a **retoma**
  em vez de criar uma nova — importante para não perder progresso após abort/reinício.

---

## 5. Como funciona o approval humano

- Missões cujo tipo gera um step do tipo `approval` (ex.: `security`) roteiam esse step
  para o executor `human`.
- O `HumanExecutor` é um stub controlado: **nunca pede input interativo**, apenas retorna
  um resultado com `success: false` e `metadata.pending = "true"`.
- O engine reconhece esse sinal e chama `TaskOrchestrator.markWaitingHuman(stepId)` —
  o step fica `waiting_human` e a orquestração continua com status `running` (não falha).
- Comandos de CLI:
  - `run status` — lista os steps e destaca os que estão `waiting_human`.
  - `run approve-step <step-id> [nota]` — completa o step com uma nota e permite retomar.
  - `run reject-step <step-id> [motivo]` — falha o step (e a orquestração) com o motivo.
- Depois de um approve, `run` (sem argumento) resume a mesma orquestração e continua
  para os próximos steps.

---

## 6. Por que o shell é bloqueado

- `ShellExecutor` não entra no `ExecutorRegistry` por padrão — só é resolvido se alguém
  o registrar explicitamente.
- Mesmo registrado, o `ShellPolicy` (parte da cadeia padrão do `PolicyEngine`) nega
  qualquer comando roteado para `local-shell`, a menos que:
  1. a env `JOEFELIPE_SHELL_EXECUTION_ENABLED=1` esteja setada explicitamente, **e**
  2. o kernel esteja em modo `EXECUTE_APPROVED`.
- Mesmo assim, o `CommandValidator` restringe a uma whitelist de comandos somente-leitura
  (`git status`, `Get-ChildItem`, etc.) e rejeita qualquer encadeamento (`;`, `|`, `&&`,
  redirecionamento, quebra de linha).
- Isso é defesa em profundidade: três camadas (registry opt-in, policy explícita,
  whitelist de comando) precisam falhar juntas para que um comando real rode.

---

## 7. Políticas ativas (PolicyEngine)

| Policy | O que faz |
|---|---|
| `SecretsPolicy` | Nega **sempre** (mesmo em `EXECUTE_APPROVED`) se o prompt/caminho tocar em secrets, ou se houver `environment` customizado. |
| `ModePolicy` | Garante que o `ExecutionMode` do step é compatível com o modo atual do kernel. |
| `StepTypePolicy` | Exige `SAFE_WRITE`+ para steps perigosos (`commit`, `implement`, `test`). |
| `SafetyPolicy` | Bloqueia termos "dangerous" (deploy, drop, rm, migration...) fora de `EXECUTE_APPROVED`. |
| `GitPolicy` | Bloqueia `push`/`merge` (ação remota/compartilhada) fora de `HUMAN_APPROVAL_REQUIRED`/`EXECUTE_APPROVED`. Commit local continua liberado em `SAFE_WRITE`. |
| `DeployPolicy` | Bloqueia deploy fora de `EXECUTE_APPROVED`. |
| `ScopePolicy` | Bloqueia diretórios sempre-proibidos (`.obsidian/`, `.opencodex/archive`, `.opencodex/queue`). |
| `ShellPolicy` | Ver seção 6. |

Toda execução passa por essa cadeia — a primeira política que negar decide o resultado.
Uma exceção lançada por qualquer policy é capturada pelo engine e vira `StepResult`
falho (não derruba o processo).

---

## 8. Como testar

```bash
cd tools/joefelipe-agent
npm run build   # tsc --noEmit
npm test        # node --import tsx --test "src/**/*.test.ts"
```

Arquivos de teste relevantes para este core:
- `execution/ExecutionEngine.test.ts`, `execution/RunFlow.test.ts` — fluxo básico.
- `execution/ExecutionPersistence.test.ts` — estado persistido e abort.
- `execution/ExecutionEvents.test.ts` — eventos emitidos no `EventStore`.
- `execution/HumanApproval.test.ts` — fluxo de aprovação humana.
- `execution/errors.test.ts` — erros padronizados.
- `execution/executors/StubExecutors.test.ts` — executores stub + registry (`resolveStrict`).
- `execution/policy/ExecutionPolicy.test.ts` — toda a cadeia de políticas, incluindo
  `ShellPolicy`, `GitPolicy`, `DeployPolicy`, `SecretsPolicy`.

---

## 9. Próximos passos recomendados

1. Ligar o `ClaudeExecutor`/`OpenCodeExecutor` a uma integração real (hoje são stubs
   que retornam sucesso simulado, sem chamada externa).
2. Decidir a política de retenção do `orchestration.jsonl`/`events.jsonl` em produção —
   já existe rotação por tamanho, mas vale revisar o intervalo e o volume observado
   (ver auditoria de 2026-07-05 sobre `events.jsonl` de ~4.5GB).
3. Expor `run status`/`run approve-step` também via `server.ts` (hoje só CLI) se o painel
   web precisar do mesmo fluxo de aprovação.
4. Avaliar se `ShellPolicy`/`ShellExecutor` devem ganhar um modo de execução real
   controlado (allowlist mais ampla) quando houver um caso de uso concreto — por ora,
   permanece desligado por padrão de propósito.
