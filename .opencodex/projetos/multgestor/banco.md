# Banco de Dados — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Stack:** PostgreSQL 17 (Supabase)
> **Driver:** pg.Pool (sem ORM)
> **Relacionamentos:** [[technical/README]] · [[technical/rls]] · [[technical/eventos]] · [[maps/multgestor-core/core/banco-de-dados]]

---

## Stack

| Tecnologia | Versão | Função |
|---|---|---|
| PostgreSQL | 17 | Database |
| Supabase | — | Host + Pooler |
| pg.Pool | — | Node.js driver |
| RLS | — | Row-Level Security |

## Status

| Indicador | Status |
|---|---|
| **Tabelas** | 27+ |
| **Migrations** | SQL manuais via script |
| **RLS** | 🟡 23/27 tabelas |
| **Outbox** | 🟢 `failed=0` |
| **Backup** | 🟢 Local + B2 |
| **Performance** | 🟡 Sem monitoramento |

## Migrations

- Scripts SQL em `scripts/run-migrations.js`
- Aplicadas manualmente via MCP (não via CI)
- `continue-on-error: true` no CI (A-005)

## Estrutura

- Schema principal com tabelas tenant-scoped
- Outbox table para eventos duráveis
- RLS policies na maioria das tabelas
- Índices para performance

## Riscos

1. **RLS incompleto** — companies + users sem policy (A-001)
2. **Migration fail silencioso** — `continue-on-error` (A-005)
3. **Sem slow query log** — performance cega

## Referências

- [[technical/rls]] — RLS detalhado
- [[technical/eventos]] — Outbox e eventos
- [[technical/performance]] — Performance
- [[maps/multgestor-core/core/banco-de-dados]] — Detalhamento no mapa vivo
- [[maps/multgestor-core/seguranca/rls-seguranca]] — RLS segurança
