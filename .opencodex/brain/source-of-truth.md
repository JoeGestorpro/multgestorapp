# 📜 SOURCE OF TRUTH — Hierarquia de Autoridade (canônico)

> **Status:** OFICIAL • VINCULANTE · **Criado:** 2026-06-07
> Resolve o cisma identificado na auditoria do Segundo Cérebro (2026-06-07).

## Declaração oficial

1. **`.opencodex/brain/` é o Segundo Cérebro oficial** — fonte única da verdade estratégica e de estado.
2. **`.agent/` é biblioteca histórica**, NÃO autoridade operacional. Preservada e indexada em [`archive-index/agent-archive-index.md`](archive-index/agent-archive-index.md). Nenhuma decisão atual deve se basear nela sem revalidação.
3. **`.opencodex/queue/`** continua sendo a **fila operacional** (next-task, current-task, completed-task, backlog).
4. **`.opencodex/rules/`** continua sendo a **governança executável** (preflight, auditor-flow, event-contracts). O brain referencia; não duplica.
5. **`docs/`** continua sendo **documentação de produto/arquitetura**. Decisões **operacionais** novas devem ser refletidas no brain (`architecture-decisions.md`, `capabilities-map.md`); `docs/` pode aprofundar, mas o brain é o índice canônico.
6. **Nenhuma missão pode iniciar sem consultar o brain** (CHECK 0 — Context Confidence).
7. **Nenhuma missão pode fechar sem atualizar o brain** quando houver mudança relevante (Loop de Fechamento — `auditor-flow`).

## Mapa de autoridade por tipo de pergunta
| Pergunta | Fonte canônica |
|---|---|
| "Qual o estado atual? branch? main?" | `brain/project-state.md` |
| "Posso fazer X? qual a regra?" | `brain/constitution.md` + `.opencodex/rules/` |
| "Que capability faz Y? existe?" | `brain/capabilities-map.md` |
| "Por que foi decidido Z?" | `brain/architecture-decisions.md` |
| "O que já foi implementado?" | `brain/implementation-log.md` |
| "Que erro não posso repetir?" | `brain/lessons-learned.md` |
| "O que executar agora?" | `.opencodex/queue/next-task.md` |
| "Como audito/promovo?" | `.opencodex/rules/auditor-flow.md` |

## Precedência em caso de conflito
`brain/constitution.md` > `brain/architecture-decisions.md` > `.opencodex/rules/` > `brain/project-state.md` > `docs/` > `.agent/` (apenas histórico).

> Se `.agent/` contradiz o brain, **o brain prevalece** — o `.agent/` reflete o estado até 2026-06-04.
