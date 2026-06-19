# 🧠 Segundo Cérebro V3 — MultGestor

> **Status:** OFICIAL • VIVO • VINCULANTE
> **Criado:** 2026-06-07 · **Base operacional:** `.opencodex/`
> Resultado da auditoria do cisma de governança (`.agent` congelado vs `.opencodex` vivo).

Este diretório é a **fonte única da verdade operacional** do MultGestor. Toda missão **começa** consultando o brain e **termina** atualizando o brain quando houver mudança relevante.

## Arquivos canônicos
| Arquivo | Papel |
|---|---|
| [`source-of-truth.md`](source-of-truth.md) | Declara a hierarquia de autoridade (quem manda em quê) |
| [`constitution.md`](constitution.md) | Princípios e regras invioláveis (não mudam por missão) |
| [`project-state.md`](project-state.md) | Estado atual real (branch, main, missões, riscos) — **atualizado a cada APPROVE** |
| [`capabilities-map.md`](capabilities-map.md) | Capabilities do Core e seu status |
| [`architecture-decisions.md`](architecture-decisions.md) | ADRs vinculantes (consolidadas + recentes) |
| [`implementation-log.md`](implementation-log.md) | Registro cronológico do que foi implementado |
| [`lessons-learned.md`](lessons-learned.md) | Incidentes e aprendizados (para não repetir) |
| [`context-confidence-engine.md`](context-confidence-engine.md) | Como toda missão mede se tem contexto suficiente para agir |

## Pastas
| Pasta | Conteúdo |
|---|---|
| [`rules/`](rules/) | Índice das regras executáveis vinculantes ao brain (canônico continua em `.opencodex/rules/`) |
| [`runbooks/`](runbooks/) | Índice de runbooks operacionais — inclui [`auditoria-completa-padrao.md`](runbooks/auditoria-completa-padrao.md) (padrão canônico) |
| [`audits/`](audits/) | Auditorias estratégicas do brain (drift, maturidade) |
| [`archive-index/`](archive-index/) | Ponte rastreável para o histórico `.agent/` (preservado, não apagado) |

## Fluxo obrigatório (resumo)
```
Nova missão
  → CHECK 0 (Context Confidence): ler source-of-truth + project-state + capabilities + regras → gerar score
  → score ≥ 80 planeja · ≥ 95 executa · 70–79 só investiga · < 70 PARA e pergunta
  → execução → /audit-task
  → LOOP DE FECHAMENTO: se mudou arquitetura/capability/regra/evento/deploy/segurança/estado → atualizar o brain ANTES de APPROVE
```

## Princípio
**`.opencodex/brain` é autoridade. `.agent/` é biblioteca histórica.** Nada obsoleto vira autoridade; nada valioso é perdido; nada duplicado é copiado sem decisão.
