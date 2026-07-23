# Arquitetura Canônica do Core MultGestor — LEIA PRIMEIRO

> ✅ **Incorporado como Fase 1 da KNOWLEDGE-001 (2026-07-23).** Esta missão ("Arquitetura Canônica do Core") foi concluída e passa a ser a fonte canônica de arquitetura do Core, encerrando a concorrência com missões anteriores. Todos os 10 gates entregues.

## Propósito

Este diretório documenta a arquitetura **real** do Core MultGestor, baseada em evidências de código, migrations, testes, CI/CD e documentação existente. Nenhuma afirmação aqui é feita sem fonte verificável.

## Missão 1 — Arquitetura Canônica do Core MultGestor

**Baseline:** `ba55065` · **Branch:** `docs/sec-booking-rls-001`
**Modo:** AUTÔNOMO CONTROLADO · **Código alterado:** 0 · **Migrations alteradas:** 0

## Mapa dos Gates

| Gate | Arquivo | Status |
|------|---------|--------|
| 0 — Baseline e Proteção de Escopo | (este documento, §GATE 0) | ✅ |
| 1 — Inventário das Fontes Arquiteturais | `01-inventario-fontes.md` | ✅ |
| 2 — Mapa do Runtime Real | `02-runtime-real.md` | ✅ |
| 3 — Dados, Tenant e RLS | `03-dados-tenant-rls.md` | ✅ |
| 4 — Capacidades do Core | `04-capacidades-core.md` | ✅ |
| 5 — Fronteiras Core × Nicho | `05-fronteiras-core-nicho.md` | ✅ |
| 6 — Contratos Arquiteturais | `06-contratos-arquiteturais.md` | ✅ |
| 7 — Débitos, Conflitos e Lacunas | `07-debitos-conflitos-lacunas.md` | ✅ |
| 8 — ARQUITETURA CANÔNICA | `08-ARQUITETURA-CANONICA-CORE-MULTGESTOR.md` | ✅ |
| 9 — Validação Cruzada | `09-relatorio-validacao-cruzada.md` | ✅ |
| 10 — Plano de Formalização | `10-plano-formalizacao-arquitetura.md` | ✅ |

## Arquitetura em Uma Linha

**Express 5 + PostgreSQL 16 (pg) + Redis/ioredis (fallback in-memory) + JavaScript (CommonJS)**, monolítico modular, organizado em **Routes → Middlewares → Controllers → Services → Repositories → Database**, com camada transversal **Shared Core** (auth, cache, errors, events, logger, monitoring, outbox, responses, tenant, validation) e **Capabilities** (billing, booking-engine), mais **Integrations** para canais externos (WhatsApp, webhooks).

**Frontend:** React 19 + Vite 8 + react-router-dom 7 (SPA), sem SSR/SSG, deploy no Vercel.

## Convenções neste Diretório

- `✅` = comprovado por evidência no código/migration/teste/CI
- `⚠️` = parcial, com ressalvas documentadas
- `❌` = não comprovado ou ausente
- `🔴` = débito ou conflito conhecido

## Regras

1. Evidência prevalece sobre documentação.
2. Ausência de evidência = ausência de comprovação.
3. Core e nicho não se misturam.
4. Estado local e produção são classificados separadamente.
5. Conflitos são expostos, não silenciados.

---

## GATE 0 — Baseline e Proteção de Escopo

| Item | Status |
|------|--------|
| HEAD | `ba55065` ✅ |
| Branch | `docs/sec-booking-rls-001` ✅ |
| Worktrees | `mg-governanca` (4c8ce84), `mg-preservacao` (3c60918) ✅ |
| Status | ahead by 1 commit (Missão 0) ✅ |
| `.mcp.json` | modified (Vercel+Render MCP — pre-existing, excluído por decisão) ✅ |
| `Base de Conhecimento.md` | only LF/CRLF warning, no content diff ✅ |
| Stashes | 0 ✅ |
| Untracked | 0 ✅ |
| Arquivos operacionais alterados | 0 ✅ |
| **Conclusão** | **ESCOPO PROTEGIDO ✅** |

**POST-GATE 0:** `diff` restrito a `.mcp.json` (pre-existing). Nenhum arquivo inesperado. Nenhum código, migration, CI/deploy alterado.
