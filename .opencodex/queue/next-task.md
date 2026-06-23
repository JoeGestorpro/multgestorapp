# 📥 PRÓXIMA MISSÃO — CLEANUP/FASE-C-BRANCHES-WORKTREES (HUMAN_APPROVAL_REQUIRED)

> Fase C **oficialmente FECHADA** em 2026-06-23 (PRs #15/#16 mergeados). Próximo passo:
> higiene dos branches e worktrees acumulados na Fase C. Operação sensível (deleção de
> branch/worktree) — **HUMAN_APPROVAL_REQUIRED**, por fatia, com lista explícita antes de apagar.
> **NÃO** deletar nada sem nova autorização humana e listagem/diff revisados.

---
status: pending
task_id: cleanup/fase-c-branches-worktrees
title: Cleanup — higiene de branches e worktrees pós-Fase C
type: governanca/cleanup
priority: P2
camada: governanca/fase-c
mode: HUMAN_APPROVAL_REQUIRED
created_by: Claude Code
created_at: 2026-06-23
requires_human_approval: true
---

## Contexto — Fase C FECHADA (2026-06-23)

Fase C encerrada oficialmente. Entregas finais:
- **PR #16 MERGED (`bd13f69`)** — deploy disparou e terminou **success**.
- **PR #15 MERGED (`af04618`)** — **não** disparou deploy (`paths-ignore` funcionou como esperado).
- **`origin/main` head = `af04618`**. `state_version` 17 → 18.
- PR #13 (`863d811`, testes do agente) e PR #14 (backup/B2) já tratados nas missões anteriores.

## Objetivo

Inventariar e higienizar os branches locais (33+) e worktrees acumulados durante a Fase C,
preservando backups e o que ainda não foi mergeado. Deleção apenas após lista explícita aprovada.

## ALLOWLIST (escopo)

- Inventário read-only de branches/worktrees (`git branch -vv`, `git worktree list`).
- Proposta de deleção com lista explícita (quais já estão em `main`, quais são obsoletos, quais preservar).
- Deleção/limpeza **somente** após aprovação humana, item a item.

## Escopo proibido

- ❌ Deletar branch/worktree sem lista explícita aprovada.
- ❌ Tocar branches `backup/*` sem confirmação.
- ❌ push / merge / rebase / deploy / migration.
- ❌ Alterar código de produto, `.obsidian`, `vendas/`, `.opencodex/archive/`.

## Critérios de aceite

- [ ] Inventário completo de branches/worktrees apresentado.
- [ ] Lista de deleção explícita aprovada por humano antes de qualquer remoção.
- [ ] Nenhum branch `backup/*` removido sem confirmação.
- [ ] Nenhuma deleção sem autorização item a item.

## Fila pós-cleanup

1. 🔵 **`cleanup/fase-c-branches-worktrees`** (atual — HUMAN_APPROVAL_REQUIRED)
2. ⏳ **`agent/joefelipe-consolidation`** — próxima missão **após o cleanup** (retomar consolidação do agente)
3. ⏳ `security/rls-companies-users-policy` — P1 fundação segura
4. ⏳ `infra/redis-production-config` — P1 (backbone técnico do R-003)
5. ⏳ `cicd/migrations-fail-fast` — 🔴 BLOQUEADO por OPS-SUPAVISOR (A-005)

## Histórico — Fase C (FECHADA 2026-06-23)

- ✅ **PR #16 MERGED (`bd13f69`)** — deploy disparou → **success**.
- ✅ **PR #15 MERGED (`af04618`)** — sem deploy (`paths-ignore` OK). `origin/main` head = `af04618`.
- ✅ `fase-c/revisao-publicacao-opencodex` / publicação `.opencodex` — encerradas com a Fase C.
- ✅ `fase-c/redacao-opencodex`, `decisao-opencodex` (D-014), PR-2 (backup/B2), PR-1 (PR #13 `863d811`) — concluídas.
