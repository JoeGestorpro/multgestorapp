---
tipo: integracao
area: infra
status: parcial
progresso: 60
criticidade: alta
bloqueia_producao: true
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# CI/CD

## O que é
GitHub Actions: testes unit/integração, lint+build frontend, migrations, deploy [[render-backend]] e [[vercel-frontend]].

## Estado atual
Testes verdes; deploy funcional. Migrations com `continue-on-error: true` (A-005) → deploy prossegue mesmo com migration falhada.

## O que já existe
Jobs de teste (Postgres+Redis reais), lint/build, deploy automático em main.

## O que falta
Migrations fail-fast (gated por OPS-SUPAVISOR + [[secrets-rotation]]); gates E2E/RLS/backup.

## Riscos
Deploy com schema drift silencioso. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[supabase]] · [[secrets-rotation]]
### Bloqueia
[[render-backend]] · [[vercel-frontend]]
### Usa
—
### É usado por
[[banco-de-dados]]

## Próximas ações
Resolver OPS-SUPAVISOR e remover `continue-on-error` (missão `cicd/migrations-fail-fast`).

## Links
- [[politicas-producao]] · [[ROADMAP-MESTRE-MULTGESTOR-2026]]
