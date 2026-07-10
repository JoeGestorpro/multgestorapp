---
tipo: decisao
area: core
status: pronto
progresso: 100
criticidade: alta
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# ADR-005 — Segundo Cérebro em `.opencodex/`

## O que é
Decisão de tornar `.opencodex/brain/` a fonte única da verdade operacional/estratégica, com `.agent/` rebaixado a histórico.

## Estado atual
DECIDIDO e vigente (V3, 2026-06-07). Governança rastreada no git; CHECK 0 e Loop de Fechamento ativos.

## O que já existe
`source-of-truth`, `constitution`, `project-state`, `capabilities-map`, regras, filas, runbooks, e este Mapa Vivo.

## O que falta
Manter o mapa vivo atualizado (ritual [[RADAR-SEMANAL-MULTGESTOR]]).

## Riscos
Memória que não se atualiza no fechamento "morre" (L-02). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
—
### Bloqueia
—
### Usa
—
### É usado por
[[MAPA-MULTGESTOR-CORE]] · [[multgestor-core]]

## Próximas ações
Evoluir o mapa por fases; ritual semanal de revisão.

## Links
- [[MAPA-MULTGESTOR-CORE]] · [[fonte-unica-verdade]]
