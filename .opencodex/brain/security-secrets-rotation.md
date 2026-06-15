# 🔐 SECURITY-SECRETS-ROTATION — Registro de Governança

> Registro interno da governança `.opencodex` (NÃO é memória externa). Criado 2026-06-15.
> **Regra inviolável deste registro:** nunca imprimir/armazenar VALORES de secrets. Apenas NOMES.

---
status: plan_only
task_id: security-secrets-rotation
mode: PLAN_ONLY
priority: prioritária (bloqueia OPS-SUPAVISOR)
created_by: Claude Code
created_at: 2026-06-15
---

## Decisões registradas
1. **OPS-SUPAVISOR está PAUSADO/BLOQUEADO.**
2. **Motivo do bloqueio:** missão prioritária `SECURITY-SECRETS-ROTATION`.
3. **Sequência obrigatória:** a rotação de secrets deve ocorrer **ANTES** de qualquer alteração no
   `continue-on-error` das migrations no `deploy.yml` (logs de migration podem expor a `DATABASE_URL` atual).
4. **Nunca imprimir valores sensíveis** — em terminal, log ou relatório.
5. **Registrar apenas NOMES das variáveis, nunca valores.**
6. **Próximo passo autorizado agora = somente contenção inicial** (gitignore dos artefatos privados).

## Superfície de exposição (diagnóstico read-only 2026-06-15)
- Exposição está na **working tree**, **não no histórico do git** (varredura `git log --all` só achou
  `frontend/.env.production`, que contém apenas `VITE_API_URL` público).
- Artefatos com valores reais que **não estavam** no `.gitignore` (corrigido na contenção):
  `docs/private/prod_secrets.json`, `docs/private/env-inventory-full.md`,
  `docs/private/env-inventory-masked.md`, `body-login.json`.

## Variáveis afetadas (APENAS NOMES — sem valores)
- **Escopo de rotação:** `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
  `COOKIE_SECRET`, `DATABASE_URL` (valor completo c/ senha exposto → entra), `SUPABASE_ANON_KEY` (pública — opcional).
- **Mesmo blast radius (recomendado incluir):** `RESEND_API_KEY`, `KIWIFY_WEBHOOK_SECRET`,
  `META_APP_SECRET`, `META_ACCESS_TOKEN`, `META_VERIFY_TOKEN`, `META_WEBHOOK_VERIFY_TOKEN`,
  `WHATSAPP_TOKEN_ENCRYPTION_KEY`, `WHATSAPP_VERIFY_TOKEN`, `MASTER_ADMIN_PASSWORD`.

## Ordem segura de rotação (resumo)
0. Contenção (gitignore) — ✅ feito 2026-06-15 (sem commit).
1. `SUPABASE_SERVICE_ROLE_KEY` → 2. `DATABASE_URL` (coordenar Supavisor) →
3. `JWT_REFRESH_SECRET` + `JWT_SECRET` (janela; invalida sessões) → 4. `COOKIE_SECRET` →
5. integrações (Meta/Resend/Kiwify/WhatsApp) → 6. `SUPABASE_ANON_KEY` (opcional, rebuild Vercel).

## Onde atualizar
Supabase (origem das keys/DB), Render (env do backend), Vercel (só `VITE_*`),
GitHub Secrets (hoje: `DATABASE_URL`, `RENDER_DEPLOY_HOOK_URL`, `VERCEL_*`), `.env` local.

## Validação pós-rotação
`GET /api/health` · login · refresh token · chamada autenticada · storage/Supabase.

## Estado da contenção (2026-06-15)
- `.gitignore`: adicionados `docs/private/` e `body-login.json`.
- Arquivos sensíveis permanecem **untracked + ignored**. Sem commit, sem push, sem PR.
- Backend/frontend/banco/secrets/deploy **não** tocados.

Relacionado: [[project-supavisor-ops-pending]] · [[project-state]]
