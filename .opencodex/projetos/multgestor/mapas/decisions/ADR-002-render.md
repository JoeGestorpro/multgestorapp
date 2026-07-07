---
tipo: decisao
area: infra
status: pronto
progresso: 100
criticidade: media
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# ADR-002 — Render para o backend

## O que é
Decisão de hospedar o [[backend]] no [[render-backend]].

## Estado atual
DECIDIDO e em produção (free tier).

## O que já existe
Deploy via workflow; health check; Sentry/Prometheus.

## O que falta
Decidir paid tier (cold start) e Redis em produção.

## Riscos
Cold start ~4s; Redis ausente. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
—
### Bloqueia
[[render-backend]]
### Usa
—
### É usado por
[[backend]]

## Próximas ações
Reavaliar tier ao iniciar piloto pago.

## Links
- [[render-backend]] · [[backend]]
