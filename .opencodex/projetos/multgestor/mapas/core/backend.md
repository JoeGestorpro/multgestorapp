---
tipo: componente
area: core
status: parcial
progresso: 75
criticidade: critica
bloqueia_producao: true
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Backend

## O que é
API Node + Express 5 (CommonJS), `pg` direto (sem ORM), JWT, Zod, Pino, Sentry, EventBus/outbox. Roda no [[render-backend]].

## Estado atual
Saudável em produção (`/api/health/deep` 200). Estrutura limpa: routes→controllers→services→repositories.

## O que já existe
Correlation ID, error handler central, graceful shutdown, Sentry+Prometheus, OutboxWorker, jobs (trial-email, appointment-reminder).

## O que falta
Ativar CSP (A-007), Redis em produção (A-004), versão semântica (A-016), remover `_archive/legacy`.

## Riscos
CSP off; Redis ausente. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[banco-de-dados]] · [[render-backend]]
### Bloqueia
[[fluxo-agendamento-publico]] · [[fluxo-pagamento]]
### Usa
[[auth]] · [[multi-tenant]] · [[billing]]
### É usado por
[[frontend]] · [[notificacoes]]

## Próximas ações
Redis em produção; ativar CSP em [[politicas-producao]].

## Links
- [[multgestor-core]] · [[render-backend]]
