---
tipo: integracao
area: infra
status: parcial
progresso: 65
criticidade: alta
bloqueia_producao: true
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Render (Backend)

## O que é
Hospedagem do [[backend]] (https://multgestor-backend.onrender.com). Free tier.

## Estado atual
Healthy; cold start ~4s (free tier dorme). Redis não configurado (fallback in-memory).

## O que já existe
Deploy via workflow; health check deep; Sentry/Prometheus; jobs ativos.

## O que falta
Redis em produção (A-004); mitigar cold start (warm-up ou paid tier, A-014).

## Riscos
Rate limit/cache voláteis; cold start dá impressão de sistema quebrado. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[ci-cd]]
### Bloqueia
[[backend]]
### Usa
[[supabase]]
### É usado por
[[frontend]] · [[notificacoes]]

## Próximas ações
Provisionar Redis (decisão de custo); avaliar warm-up.

## Links
- [[ADR-002-render]] · [[backend]]
