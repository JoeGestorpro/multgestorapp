---
tipo: decisao
area: infra
status: pronto
progresso: 100
criticidade: alta
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# ADR-001 — Supabase como banco de produção

## O que é
Decisão de usar [[supabase]] (PostgreSQL 17 gerenciado, sa-east-1) como banco de produção.

## Estado atual
DECIDIDO e em produção. Auth próprio em `public.users` (não Supabase Auth).

## O que já existe
Projeto ACTIVE_HEALTHY; acesso operacional via MCP read-only.

## O que falta
Avaliar plano pago (PITR); resolver Supavisor para migrations no CI.

## Riscos
Free tier sem PITR; Supavisor bloqueia CI. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
—
### Bloqueia
[[banco-de-dados]]
### Usa
—
### É usado por
[[multgestor-core]]

## Próximas ações
Revisar quando houver volume real de clientes.

## Links
- [[supabase]] · [[banco-de-dados]]
