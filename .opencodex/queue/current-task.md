# ⚙️ CURRENT TASK — Bloco A v2: sanitização XSS em users.name ✅ DONE (ciclo fechado)

---
status: done
task_id: xss-data-sanitization-block-a-users
phase: security-data-sanitization
title: Sanitizar os 3 registros maliciosos em users.name (stored XSS) — fecha o ciclo XSS
completed_at: 2026-06-14
executed_via: MCP Supabase (UPDATE guardado, SELECT prévio + aprovação humana + SELECT pós)
---

## Resultado
- [x] `UPDATE users SET name='Usuario (nome sanitizado)', updated_at=now()` nos **3 IDs autorizados**:
  - `a0b3022a-2d97-4000-9f6b-cb7404538631` (martelo@gmail.com)
  - `72ace2b4-2a09-47f3-b266-114fb6d660bf` (kidbengala@gmail.com)
  - `47ff3602-d2d7-4c9f-b72e-3699a1372436` (testeaaa@email.com)
- [x] UPDATE afetou **exatamente os 3 IDs autorizados** (nenhum outro).
- [x] `SELECT count(*) FROM users WHERE name ~ '[<>]'` → **0**.

## Estado do ciclo XSS — CLOSED ✅
| Superfície | Estado |
|---|---|
| `companies.name ~ '[<>]'` | 0 |
| `users.name ~ '[<>]'` | 0 |
| Portão de entrada `/register` com `<script>` | 400 (bloqueado) |

## Garantias da execução
- ❌ Sem DELETE · ❌ sem migration · ❌ sem schema change.
- ❌ `companies` não tocado nesta etapa · ❌ backend/frontend intactos.
- ❌ Sem commit · ❌ sem push · ❌ PR #7 intacto.

> Bloco A (companies.name) registrado em archive; Bloco A v2 (users.name) fecha o ciclo.
