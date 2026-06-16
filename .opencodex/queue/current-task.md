# ⚙️ CURRENT TASK — Sanitização XSS stored em companies.name + users.name ✅ DONE (ciclo fechado)

---
status: done
task_id: xss-data-sanitization-block-a
phase: security-data-sanitization
title: Sanitizar os 3 registros maliciosos em companies.name + 3 em users.name (stored XSS)
completed_at: 2026-06-15
executed_via: MCP Supabase (3 UPDATEs em companies.name, 3 UPDATEs em users.name; SELECT prévio + aprovação humana + SELECT pós)
---

## Bloco A — companies.name
- [x] 3 UPDATEs executados **somente** em `companies` (tabela correta)
- [x] **Somente coluna `name`** alterada (demais colunas intocadas)
- [x] **`updated_at` NÃO alterado** (conforme regra do auditor)
- [x] SELECT pós confirmou os 3 nomes novos:
  - `ceff8114-b490-4103-9ba8-6b1e7b4133e9` → `Empresa sanitizada 1`
  - `ae9a18dc-9bda-4a94-9c90-2ba09baba58a` → `Empresa sanitizada 2`
  - `db0aaf31-baf2-48b2-af52-e9180983f76e` → `Empresa sanitizada 3`
- [x] `SELECT count(*) FROM companies WHERE name ~ '[<>]'` → **0**

## Bloco A v2 — users.name
- [x] 3 UPDATEs em `users SET name='Usuario (nome sanitizado)', updated_at=now()`
- [x] `updated_at` foi alterado (autorizado para users)
- [x] IDs: `a0b3022a-2d97-4000-9f6b-cb7404538631`, `72ace2b4-2a09-47f3-b266-114fb6d660bf`, `47ff3602-d2d7-4c9f-b72e-3699a1372436`
- [x] `SELECT count(*) FROM users WHERE name ~ '[<>]'` → **0**

## Estado do ciclo XSS — CLOSED ✅
| Superfície | Estado |
|---|---|
| `companies.name ~ '[<>]'` | 0 |
| `users.name ~ '[<>]'` | 0 |
| `public_display_name ~ '[<>]'` | 0 |
| `business_description ~ '[<>]'` | 0 |
| `barber_services.name ~ '[<>]'` | 0 |
| Portão de entrada `/register` com `<script>` | 400 (bloqueado) |

## Garantias da execução
- ❌ Sem DELETE · ❌ sem DROP · ❌ sem INSERT · ❌ sem migration
- ❌ Sem alteração de código · ❌ sem deploy · ❌ sem push · ❌ sem merge
- ❌ `companies.updated_at` não alterado
