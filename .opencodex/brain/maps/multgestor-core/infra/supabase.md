---
tipo: integracao
area: infra
status: parcial
progresso: 70
criticidade: critica
bloqueia_producao: true
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Supabase

## O que é
Provedor do PostgreSQL 17 de produção (sa-east-1, projeto `mfayajizbkqkcbhqmean`). Acesso operacional via MCP (somente leitura por padrão).

## Estado atual
ACTIVE_HEALTHY, schema em sync. Free tier (sem PITR, sem auto-backup). 16 MB.

## O que já existe
DB de produção + projeto descartável de restore-test; conexão via pooler sa-east-1.

## O que falta
PITR (plano pago); Supavisor sa-east-1 aceitar tenant para migrations no CI (OPS-SUPAVISOR).

## Riscos
Sem PITR; Supavisor bloqueia CI. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
—
### Bloqueia
[[banco-de-dados]] · [[ci-cd]]
### Usa
—
### É usado por
[[backend]] · [[backup-restore-check]]

## Próximas ações
Resolver OPS-SUPAVISOR; avaliar plano pago para PITR.

## Links
- [[ADR-001-supabase]] · [[banco-de-dados]] · [[backup-restore-check]]
