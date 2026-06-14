# ⚙️ CURRENT TASK — XSS hardening (register) ✅ CONCLUÍDO

---
status: done
task_id: fix-xss-register-hardening
phase: security-input-validation
title: Endurecer validação de input do registro contra stored XSS (Bloco B+C)
branch: fix/xss-register-hardening-clean
pr: 6
merge_commit: b75d34a
completed_at: 2026-06-14
---

## Resultado
- [x] **Bloco B** — `registerSchema` bloqueia `<`/`>` em `name`, `company_name`, `companyName`, `niche_type`, `nicheType` (helper `noHtmlText`, regex `^[^<>]*$`).
- [x] **Bloco B** — testes unitários (rejeita `<script>`, regressão "Barbearia João & Filhos").
- [x] **Bloco B** — teste de integração (`POST /api/auth/register` → 400 sem tocar DB).
- [x] **Bloco C** — ESLint `no-restricted-syntax` bloqueia `dangerouslySetInnerHTML` (sem nova dependência; `react/no-danger` evitado por exigir `eslint-plugin-react`).
- [x] Suíte unit completa **652/652 verde**; lint frontend **0 errors**.
- [x] **PR #6 mergeado** na `main` (squash, `b75d34a`).
- [x] Deploy automático (Render) **success** (workflow run 27511295814).

## Validação em produção (2026-06-14)
- `GET /api/health` → **200** (`Backend rodando`).
- Login inválido → **401** (não 500).
- `POST /api/auth/register` com `name = "<script>alert(1)</script>"` → **400** `Dados inválidos` (portão ativo).
- Sem erro `reminder_sent_at` (DB conecta e consulta normalmente).

## Diff (4 arquivos, sem contaminação)
- `backend/src/shared/core/validation/schemas/auth-requests.schema.js`
- `backend/tests/unit/validation-schemas.test.js`
- `backend/tests/integration/register-validation.test.js`
- `frontend/eslint.config.js`

> Histórico da fila anterior (appointment/outbox inc.2) arquivado em
> `.opencodex/queue/archive/2026-06-14-appointment-outbox-inc2-closeout.md`.
