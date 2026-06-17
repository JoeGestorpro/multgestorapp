# 📦 ARQUIVADO — SECURITY-SECRETS-ROTATION (adiado, prioridade futura)

> Arquivado em 2026-06-15. Promovido BACKUP-RESTORE-CHECK como P0.
> Motivo: backup/restore é pré-requisito para qualquer operação que crie/altere dados.
> SECURITY-SECRETS-ROTATION mantém prioridade futura (não cancelado).

---
status: archived
task_id: security-secrets-rotation
title: Rotacionar secrets potencialmente expostos na working tree (contenção feita) — gated, prioridade FUTURA
mode: EXECUTE_WITH_REVIEW
required_branch: security/secrets-rotation
requires_human_approval: true
requires_security_review: true
created_by: Claude Code
created_at: 2026-06-15
archived_at: 2026-06-15
archived_reason: >-
  Repromovido para prioridade futura. BACKUP-RESTORE-CHECK (P0) tomou lugar como next-task.
  SECURITY-SECRETS-ROTATION mantém todo o seu conteúdo e plano; será repromovido quando
  backup/restore estiver confirmado e aprovado.
---

> ⏸️ **PAUSADA em 2026-06-15 por decisão humana.** Execução adiada — NÃO rotacionar nada.
> Motivo: secrets não considerados expostos em produção pública; ambiente controlado/teste; a
> **contenção já está aplicada** (`docs/private/` + `body-login.json` no `.gitignore`). Rotação fica
> para uma janela futura, para evitar impacto operacional desnecessário agora.
> Etapa 1 chegou a iniciar só o Passo 1 (criar nova key) — **interrompida**; nada foi revogado/trocado.
> Promovida de PLAN_ONLY → executável (2026-06-15). Detalhe: [[security-secrets-rotation]].

---
status: deferred
paused_by_human: true
paused_at: 2026-06-15
pause_reason: >-
  Decisão humana: execução adiada. Secrets não expostos em produção pública (ambiente controlado/teste);
  contenção já aplicada via .gitignore; rotação adiada para janela futura para evitar impacto operacional.
blocks: OPS-SUPAVISOR
standing_alert: >-
  Qualquer push/compartilhamento dos arquivos sensíveis (docs/private/, body-login.json) permanece PROIBIDO.
  OPS-SUPAVISOR só volta a ser considerado após confirmar que nenhum log/CI exibirá secrets.
---

## AVALIAÇÃO DE CAPACIDADE DO MODELO
- **Executor recomendado:** Big Pickle, **EXECUTE_WITH_REVIEW** (mexe em credenciais de produção em provedores externos → auditoria final do Claude obrigatória).
- **Modo de execução:** **GATED por etapa.** Cada secret é um portão: PARAR → reportar nome + onde atualizar → aguardar aprovação humana → só então o humano aplica no provedor. O executor **não** rotaciona secret sozinho.
- **Nível de risco:** **Alto** (sessões/usuários, conexão de banco, integrações de pagamento/WhatsApp). Blast radius de produção real.
- **Escalonamento (PARAR e reportar):** qualquer tentativa de imprimir valor de secret, abrir arquivo plaintext para ler valor, resetar senha de banco sem janela aprovada, ou alterar Render/Vercel/GitHub/Supabase sem aprovação explícita da etapa → **ESCALATE**.
- **Regra inviolável:** apenas NOMES de variáveis, NUNCA valores. Sem deploy/push/PR/migration até aprovação final.

## Contexto
Diagnóstico read-only (2026-06-15) achou valores reais na **working tree** (não no histórico do git):
`docs/private/prod_secrets.json`, `docs/private/env-inventory-full.md`, `docs/private/env-inventory-masked.md`,
`body-login.json`. **Contenção já aplicada** (commit `86a8541`): esses caminhos foram para o `.gitignore`
(`docs/private/` + `body-login.json`) e seguem untracked + ignored. Histórico do git limpo → **não** precisa `filter-repo`.

## Objetivo
Rotacionar os secrets potencialmente expostos e validar o sistema pós-rotação, **sem downtime evitável**,
com cada etapa aprovada por humano antes de aplicar.

## Variáveis no escopo (APENAS NOMES — nunca valores)
**Principais (rotação obrigatória):**
`SUPABASE_SERVICE_ROLE_KEY` · `DATABASE_URL` · `JWT_SECRET` · `JWT_REFRESH_SECRET` · `COOKIE_SECRET`
**Condicional/opcional:** `SUPABASE_ANON_KEY` (pública — só se rotação total de chaves Supabase; exige rebuild Vercel).
**Mesmo blast radius (incluídos, também gated):**
`RESEND_API_KEY` · `KIWIFY_WEBHOOK_SECRET` · `META_APP_SECRET` · `META_ACCESS_TOKEN` · `META_VERIFY_TOKEN` ·
`META_WEBHOOK_VERIFY_TOKEN` · `WHATSAPP_TOKEN_ENCRYPTION_KEY` · `WHATSAPP_VERIFY_TOKEN` · `MASTER_ADMIN_PASSWORD` (se aplicável)

## Ordem segura de rotação (cada item = um portão aprovado por humano)
0. ✅ Contenção (gitignore) — feito (`86a8541`).
1. `SUPABASE_SERVICE_ROLE_KEY` — regen no Supabase → atualizar Render + `.env` local. (Backend-only, sem impacto de usuário.)
2. `DATABASE_URL` — reset de senha do DB no Supabase → atualizar Render + GitHub Secrets + `.env`. **Coordenar com OPS-SUPAVISOR** (blip de conexão).
3. **Janela única (invalida sessões):** `JWT_REFRESH_SECRET` + `JWT_SECRET` + `COOKIE_SECRET` → atualizar Render + `.env`. Comunicar re-login geral.
4. Integrações: `RESEND_API_KEY`, `KIWIFY_WEBHOOK_SECRET`, `META_*`, `WHATSAPP_*` — rotacionar no provedor + reconfigurar webhook + atualizar Render/`.env`.
5. `MASTER_ADMIN_PASSWORD` — redefinir (se a captura `body-login.json` o expôs).
6. `SUPABASE_ANON_KEY` — **opcional**; só se rotação total. Atualizar Supabase + Vercel (`VITE_SUPABASE_ANON_KEY`) + `.env` → rebuild frontend.

## Onde atualizar (mapa)
- **Supabase:** origem de `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, senha do `DATABASE_URL`.
- **Render (backend env):** `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `JWT_*`, `COOKIE_SECRET`, integrações.
- **Vercel (só `VITE_*`):** `VITE_SUPABASE_ANON_KEY` (se rotacionar anon).
- **GitHub Secrets (hoje):** `DATABASE_URL`, `RENDER_DEPLOY_HOOK_URL`, `VERCEL_*`. (JWT/COOKIE/SERVICE_ROLE vivem direto no Render.)
- **`.env` local:** `backend/.env` (e `frontend/.env` se anon).

## Critérios de aceite / validação pós-rotação
- [ ] `GET /api/health` → 200.
- [ ] Login → 200 + emite JWT novo (valida `JWT_SECRET`).
- [ ] Refresh token → 200 + novo access (valida `JWT_REFRESH_SECRET`).
- [ ] Chamada autenticada (rota protegida) → 200 (valida verificação JWT + cookie).
- [ ] Storage/Supabase (bucket `barber-collaborators`) → ok (valida `SUPABASE_SERVICE_ROLE_KEY`).
- [ ] Conexão DB ativa pós-reset de senha.
- [ ] Sessões antigas rejeitadas (esperado após rotação JWT).

## Proibições (até aprovação de cada etapa)
- ❌ Imprimir valores · ❌ abrir plaintext para ler valor · ❌ rotacionar sem aprovação da etapa.
- ❌ Alterar Render/Vercel/GitHub/Supabase sem aprovação · ❌ resetar senha do banco sem janela.
- ❌ migration · ❌ deploy · ❌ push · ❌ PR · ❌ alterar backend/frontend/banco.
- ❌ Executar OPS-SUPAVISOR (permanece **bloqueado** até rotação + validação concluídas).

## Gate de saída
OPS-SUPAVISOR só é desbloqueado (remover `continue-on-error` do `deploy.yml`) **após** todas as rotações
obrigatórias aplicadas E o checklist de validação verde.
