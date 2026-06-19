# 🤖 Autopilot Policy — MultGestor Autopilot Runner

> **Status:** FASE 0 — DOCUMENTAÇÃO INERTE (não executável)
> **Criado:** 2026-06-19 · **Modo:** PLAN_ONLY
> **Autoridade:** subordinado a [`../brain/constitution.md`](../brain/constitution.md), [`../brain/source-of-truth.md`](../brain/source-of-truth.md), [`../rules/auditor-flow.md`](../rules/auditor-flow.md) e [`../templates/preflight-check.md`](../templates/preflight-check.md). Em conflito, **o freio humano vence**.

---

## 0. O que este documento é (e o que NÃO é)

Este arquivo é **especificação inerte** da política do Autopilot Runner. Ele **não executa nada** e não é um script. Descreve como uma futura camada de automação (Fases 1+) deve se comportar para mecanizar os passos **determinísticos** do loop de governança **sem remover os freios humanos**.

**Princípio-mãe:** o Autopilot automatiza *verificação e transporte*. O humano mantém *autoria de código, promoção de fila e travessia de gates irreversíveis*. Nenhuma automação revoga um freio humano.

**Fail-closed em tudo:** qualquer dúvida, parse inválido, comando desconhecido ou estado ambíguo → **parar** e classificar como `HUMAN_REQUIRED`/`BLOCKED`. Nunca "assumir seguro".

---

## 1. Níveis de automação

Derivam do campo `mode:` já usado nos cards (`EXECUTE`, `EXECUTE_WITH_REVIEW`, `PLAN_ONLY`, `ESCALATE`). Recomenda-se adicionar `automation_level:` explícito ao schema do card.

| Nível | O Autopilot pode… | Mapeia `mode:` | Exemplos |
|---|---|---|---|
| **`AUTO_SAFE`** | rodar ponta-a-ponta e emitir veredito **sem humano** | `EXECUTE` determinístico | validação read-only (e2e GET), geração de doc/auditoria, test run, dry-run de data-fix |
| **`AUTO_WITH_REVIEW`** | preflight + executar em branch + testes + evidências, **PARA antes de commit/promote** | `EXECUTE_WITH_REVIEW` | edição de código com testes; humano/Claude aprova o diff |
| **`HUMAN_REQUIRED`** | **só planejar/abortar** — nunca muta | `ESCALATE` | prod, secrets, cloud, push, merge, RLS, billing, migrations, criar/trocar branch |
| **`PLAN_ONLY`** | gerar plano + evidências, **zero mutação** | `PLAN_ONLY` | design docs, esta própria fase |

> Card sem `automation_level` parseável → tratado como **`HUMAN_REQUIRED`** (fail-closed).
> `HUMAN_REQUIRED` é fronteira permanente — nenhuma fase futura "alcança" esse nível.

---

## 2. Gates de segurança obrigatórios

Reusam o preflight existente (CHECK 0–5) e acrescentam gates novos. **Falha em qualquer gate = parar + escrever veredito + não mutar.**

| # | Gate | Origem | Veredito se falhar |
|---|---|---|---|
| 0 | Context Confidence ≥ 95 | CHECK 0 ([`context-confidence-engine`](../brain/context-confidence-engine.md)) | `BLOCKED` (<70) / `HUMAN_GATE` (70–94) |
| 1 | Workspace limpo (de código) | CHECK 1 + CHECK 5 | `BLOCKED` |
| 2 | Branch correta | CHECK 2 | `HUMAN_GATE` (runner não troca branch) |
| 3 | Task não bloqueada | CHECK 4 + `unblock_condition` do backlog | `BLOCKED` |
| 4 | Modo da task permitido para o nível | `autopilot-policy.md` (este doc) | `HUMAN_GATE` |
| 5 | Ausência de secrets no diff | secret-scan no diff pré-commit | `SCOPE_VIOLATION` |
| 6 | Comandos dentro da allowlist | [`command-allowlist.md`](command-allowlist.md) | `BLOCKED` |
| 7 | Sem alteração fora do escopo | ALLOWLIST do card + diff pós-exec 1:1 | `SCOPE_VIOLATION` |
| 8 | Sem push/merge automático | regra runner #2 (inviolável) | `HUMAN_GATE` |
| 9 | Sem produção sem aprovação | classificação `HUMAN_REQUIRED` | `HUMAN_GATE` |
| 10 | Sem cloud/secrets sem aprovação | classificação `HUMAN_REQUIRED` | `HUMAN_GATE` |

**Gate 7 (anti-drift, coração da segurança):** após executar, comparar `git diff --cached --name-only` 1:1 contra a ALLOWLIST do card. Qualquer arquivo fora → `SCOPE_VIOLATION` + reverter o stage (jamais commitar).

---

## 3. Fluxo (pipeline)

```
Preflight (CHECK 0–5)
   → Task Reader (parse do card: task_id, mode, automation_level, allowlist, critérios)
   → Safety Gate (10 gates)
   → Executor (somente comandos da allowlist; único estágio que pode exigir modelo/LLM)
   → Validator (testes / lint / build)
   → Evidence Writer (.opencodex/runs/<ts>_<task-id>/)
   → Verdict Writer (PASS / FAIL / HUMAN_GATE / BLOCKED / SCOPE_VIOLATION)
   → Queue Updater (status mecânico — NUNCA promove backlog→next)
```

- Cada estágio é **fail-closed**: erro/dúvida → para, grava veredito, não avança.
- **Executor** é o único estágio que pode exigir um modelo (LLM) para escrever código → por isso código fica em `AUTO_WITH_REVIEW`, nunca em `AUTO_SAFE`.
- **Queue Updater** só altera `current-task`/`completed-task` (status mecânico). **Promover backlog→next-task é monopólio permanente do Claude Code/humano** (regra de promoção em `auditor-flow.md`).

---

## 4. Vereditos

| Veredito | Significado | Ação automática |
|---|---|---|
| **`PASS`** | gates ✅ + validação ✅ + diff dentro do escopo | grava evidências; `completed-task` → `awaiting-audit` (não promove) |
| **`FAIL`** | executou mas testes/validação falharam | grava log do erro; reverte stage; para |
| **`HUMAN_GATE`** | bateu num ponto que exige humano (branch, prod, secrets, push, modo) | para limpo; descreve a decisão necessária |
| **`BLOCKED`** | preflight/gate impeditivo (workspace sujo, task bloqueada, comando fora da allowlist, confiança baixa) | aborta antes de mutar; imprime problema · risco · ação segura |
| **`SCOPE_VIOLATION`** | tocou arquivo fora da ALLOWLIST ou secret no diff | reverte stage imediatamente; alerta; nunca commita |

---

## 5. Relatório de execução — `.opencodex/runs/<timestamp>_<task-id>/`

```
.opencodex/runs/2026-06-19T14-03-22_infra-autopilot/
├── task.md          # snapshot imutável do card executado
├── preflight.md     # CHECK 0–5 + resultado de cada gate
├── execution.log    # comandos rodados (só allowlist) + stdout/stderr
├── validation.log   # testes / lint / build
├── diff.patch       # git diff do que foi alterado (staged)
└── verdict.md       # veredito + evidências + próximo passo
```

> ⚠️ **`.opencodex/runs/` é `.gitignored`.** `execution.log` e `diff.patch` podem conter dados sensíveis (cruza com achado A-019 — PII em logs). Apenas `verdict.md` curado (sem secrets) pode ser promovido a `.opencodex/audits/` quando relevante.

---

## 6. O que é automatizável × o que permanece humano

| ✅ Automatizável (determinístico) | 🔒 Permanece humano |
|---|---|
| Preflight (CHECK 0–5) | **Promover** backlog → next-task |
| Validação de schema do card | Decisão final APPROVE / REQUEST_CHANGES |
| Secret-scan no diff | Criar / trocar branch |
| Enforcement da allowlist de comandos | Push / merge / deploy |
| Rodar testes / lint / build | Mexer em prod, secrets, cloud, `.env`, migrations |
| Data-fix com dry-run (read antes de write) | Aprovar travessia de qualquer gate `HUMAN_REQUIRED` |
| Validação read-only (e2e GET) | Escrever código de risco (revisão obrigatória) |
| Geração de evidências + veredito | Decisões arquiteturais pendentes |
| Atualizar status mecânico de fila | Loop de Fechamento do brain (julgamento) |

---

## 7. Freios invioláveis (herdados de `auto-queue-runner.md`)

O Autopilot, como executor automatizado do **mesmo** preflight, **NUNCA**:
- `git stash`, `git checkout`/trocar branch, `git clean`
- criar branch sem autorização humana
- executar missão em branch errada
- push / merge / deploy
- promover fila (backlog → next-task)
- cruzar qualquer gate `HUMAN_REQUIRED` (prod, secrets, cloud, `.env`)

Em qualquer um desses pontos → **parar** e emitir `HUMAN_GATE` com problema · risco · ação segura.

---

## 8. Roadmap de fases (referência)

| Fase | Entrega | Nível | Pré-condição |
|---|---|---|---|
| **0** | `autopilot-policy.md` + `command-allowlist.md` (docs inertes) + `runs/` no `.gitignore` | PLAN_ONLY | aprovação humana ✅ (esta fase) |
| **1** | `safety-gates.ps1` + `validate-task.ps1` **read-only** (dry-run; só lê, emite veredito) | AUTO_SAFE (sobre si) | bater 1:1 com preflight manual |
| **2** | `run-task.ps1` + `start-autopilot.ps1` com `--execute` para tarefas `AUTO_SAFE` determinísticas | AUTO_SAFE | 5 execuções verdes auditadas |
| **3** | `AUTO_WITH_REVIEW`: executa código em branch, para antes do commit p/ revisão | AUTO_WITH_REVIEW | revisão de segurança + decisão humana |
| **4** | Observabilidade do runner (alertas, histórico de runs) | — | — |

> Cada fase sobe de nível **somente com aprovação humana explícita**. Construir o Autopilot não autoriza o Autopilot a executar missões reais.
