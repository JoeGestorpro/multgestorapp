---
tipo: componente
area: core
status: parcial
progresso: 70
criticidade: critica
bloqueia_producao: true
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Banco de Dados

## O que é
PostgreSQL 17 no [[supabase]] (sa-east-1), SQL direto via `pg.Pool`, sem Supabase Auth (auth próprio em `public.users`).

## Estado atual
Schema em sync (23 migrations). 8 companies, 25 users. Free tier (sem PITR).

## O que já existe
55 tabelas em `public`, migrations versionadas, RLS habilitado na maioria das tabelas tenant.

## O que falta
Policies em companies/users ([[rls-seguranca]]); migrations confiáveis no CI ([[ci-cd]]); PITR (plano pago).

## Riscos
RLS inerte em companies/users (A-001); drift por migrations manuais. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[supabase]]
### Bloqueia
[[backend]] · [[multi-tenant]]
### Usa
[[multi-tenant]]
### É usado por
[[agenda]] · [[clientes]] · [[financeiro]] · [[relatorios]]

## Próximas ações
Fechar [[rls-seguranca]] em companies/users.

## Links
- [[supabase]] · [[backup-restore-check]]
