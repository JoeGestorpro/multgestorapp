# 🗄️ ÍNDICE DE ARQUIVO DO AGENT — Ponte rastreável para `.agent/` (histórico)

> **Status:** OFICIAL · **Criado:** 2026-06-07
> `.agent/` foi **rebaixado a biblioteca histórica** (NÃO apagado). Em conflito com o brain, **o brain prevalece**.
> Triagem baseada na auditoria de 2026-06-07 (mtimes + cross-reference + leitura).

## Categorias
- **OURO (migrado):** consolidado no `brain/`.
- **REVISAR:** possivelmente útil, desatualizado/duplicado — revalidar antes de usar.
- **ARQUIVAR:** histórico/genérico — não governa a operação.
- **OBSOLETO:** incorreto/perigoso se usado como fonte atual.

## Triagem por cluster
| Origem (`.agent/...`) | Categoria | Motivo | Destino |
|---|---|---|---|
| `context/memory-snapshot.md` | OURO → **migrado** | Visão/stack/regras críticas | `brain/constitution.md` + `project-state.md` |
| `context/ai-operating-rules.md` | OURO → **REVISAR/migrado parcial** | Regras de operação reais | `brain/constitution.md` §4 (revalidar resto) |
| `memory/decisions.md` | OURO → **REVISAR** | Decisões estratégicas (JWT cookie, shared kernel) | `brain/architecture-decisions.md` (revalidar antes de citar) |
| `memory/implementation-log.md` | OURO → **migrado (ponte)** | Histórico Sprints 0–17 | `brain/implementation-log.md` aponta para cá |
| `Joe-orchestrators/agents/master-orchestrator.md` | **REVISAR** | Fluxo prescrito útil, mas não era seguido | princípios em `brain/constitution.md`; fluxo real no brain |
| `memory/current-state.md`, `session-snapshot.md`, `next-actions.md` | **OBSOLETO** | Estado de 06-04, factualmente errado hoje | substituído por `brain/project-state.md` |
| `INDEX.md` | **OBSOLETO** | Aponta branch `principal` inexistente; protocolo não seguido | substituído por `brain/README.md` + `source-of-truth.md` |
| `runtime/engines/*`, `runtime-kernel.md` | **OBSOLETO/aspiracional** | Arquitetura de orquestração nunca executada | não migrar; manter histórico |
| `skills/{game-development,mobile-design,rust-pro,nextjs-react-expert,vr-ar,seo,...}` | **ARQUIVAR** | Boilerplate genérico irrelevante p/ barbearia SaaS | não migrar |
| `skills/{multi-tenant-patterns,event-driven-patterns,create-capability,create-vertical}` | **REVISAR** | Específicas do domínio; podem virar runbooks | avaliar migração futura p/ `brain/runbooks/` |
| `marketing/*` (~60) | **ARQUIVAR** | Fora do escopo de engenharia | manter como asset separado |
| `agents/{event-driven,multi-tenant-security,observability,saas-billing,platform-architect}.md` | **REVISAR** | Personas úteis; não acionadas | avaliar como referência |
| `workflows/{audit-tenant-isolation,generate-migration,prepare-release,run-migrations,smoke-test}.md` | **REVISAR** | Workflows reais; sobrepõem `docs/runbooks/` | consolidar em runbooks (sem duplicar) |
| `context/{backend,frontend,database,deployment}-rules.md` | **REVISAR** | Regras técnicas; podem ter conteúdo válido | revalidar vs `brain/constitution` + `.opencodex/rules` |

## Regra de uso
- Consultar `.agent/` **apenas** via este índice e **somente** itens marcados OURO/REVISAR já revalidados.
- **Nunca** iniciar missão a partir de `.agent/` (CHECK 0 só aceita o brain).
- Itens REVISAR migram sob demanda, com `Origem:`/`Status:` e revalidação.

## Não apagar
`.agent/` permanece fisicamente no repo nesta fase. Decisão de remoção/extração para submódulo é missão futura separada.
