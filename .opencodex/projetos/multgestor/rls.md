# RLS (Row-Level Security) — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Relacionamentos:** [[technical/seguranca]] · [[technical/banco]] · [[decisoes-arquiteturais#ADR-06]] · [[maps/multgestor-core/seguranca/rls-seguranca]]

---

## Status Atual

| Aspecto | Status |
|---|---|
| RLS ENABLE | 🟢 23/27 tabelas |
| Companies policy | 🔴 Ausente |
| Users policy | 🔴 Ausente |
| WITH CHECK | 🔴 Todas sem |
| Runtime role | 🔴 BYPASSRLS |

## O Problema

RLS está `ENABLE` em 23 das 27 tabelas, mas **inerte em produção** porque:
1. Runtime role (`postgres`) tem BYPASSRLS
2. `companies` e `users` não têm policy
3. Nenhuma tabela tem `WITH CHECK` (escrita cross-tenant não bloqueada)

A defesa real hoje são os filtros `company_id` na aplicação.

## Roadmap RLS

| Fase | Status | Descrição |
|---|---|---|
| Fase 1 (CI-only) | ✅ Concluído | Role `app_runtime` (NOBYPASSRLS) no CI |
| Fase 2 (staging) | ⬜ PLAN_ONLY | Role em staging |
| Fase 3 (produção) | ⬜ PLAN_ONLY | Role em produção |

## Decisão Pendente

**Criar policies formais ou documentar BYPASSRLS como exceção aceita?**

Recomendação: Criar policies formais (defesa em profundidade).

## Referências

- [[decisoes-arquiteturais#ADR-06]] — ADR RLS
- [[technical/seguranca]] — Segurança
- [[technical/banco]] — Banco de dados
- [[maps/multgestor-core/seguranca/rls-seguranca]] — RLS detalhado
- [[maps/multgestor-core/core/multi-tenant]] — Multi-tenant
