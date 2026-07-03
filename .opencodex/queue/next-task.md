# 📥 PRÓXIMA MISSÃO — RELEASE/PUSH-P0-BATCH (HUMAN_APPROVAL_REQUIRED)

> Sprint autônomo de 2026-07-02 deixou **8 commits locais em `main`** prontos e validados
> (ver `current-task.md`). O push é **uma decisão humana**: dispara deploy no Render e o
> passo de migrations em produção (018-021 + 030, `continue-on-error` — validar manualmente
> depois). Nada aqui pode ser executado por agente sem autorização explícita.

---
status: pending
task_id: release/push-p0-batch
title: Release — push dos commits P0 + ativação TLS + smoke pós-deploy
type: release/deploy
priority: P0
camada: release
mode: HUMAN_APPROVAL_REQUIRED
created_by: Claude Code
created_at: 2026-07-02
requires_human_approval: true
---

## Conteúdo do batch (local, sem push)

`ace2d05` schedule DDL fix · `e906039`+governança · `8056831` migrations 018-021 ·
`02c5396` **tenant writes → app_runtime (P0 central)** · `d112950` TLS verify (inerte) ·
`f03af4d` refresh rotation + migração 030 · `d7f2fd1` lint zero · `d262676` CSP.

## ⚠️ PRÉ-PASSO OBRIGATÓRIO — sincronizar main com origin (descoberto 2026-07-02)

`origin/main` e `main` local **divergiram**: origin tem 8 commits (merges dos PRs #20/#21 —
conteúdo idêntico ao trabalho local, recomitado com SHAs diferentes, + remoção do
`rls_fix_nullif_tenant_isolation.sql`) e o local tem 21 commits à frente, **incluindo a
feature geladeira (BG-001) e o fix de auth `becb0ee`, que NUNCA foram deployados**.

Dry-run (`git merge-tree`) mostra só 3 conflitos pequenos: `backend/.env.example`,
`backend/scripts/run-migrations.js`, `backend/tests/integration/gate0-pool-paths.test.js`
(add/add — versão do PR #20 vs versão endurecida local). Merge é operação **gated**:
executar `git merge origin/main` somente com autorização humana, resolver os 3 conflitos
mantendo as versões locais endurecidas (+ a deleção do arquivo obsoleto vinda do origin),
rodar a suíte completa e só então prosseguir com o push.

## Sequência recomendada (humano no volante, agente pode assistir)

1. **Autorizar o merge de `origin/main`** (pré-passo acima) e revisar `git log origin/main..main`.
2. **Autorizar push** para `main` → deploy dispara (Render + Vercel). Atenção: o batch
   inclui a feature geladeira e ~10k linhas nunca deployadas, não só os fixes P0.
3. Verificar migrations em prod: 018-021 devem aplicar idempotente (tabelas provavelmente
   já existem) e 030 cria `refresh_tokens`. Como o step é `continue-on-error`, conferir o
   log do workflow — se falhar, rodar `npm run migrate` manualmente contra prod (gate humano).
4. Canário: `GET /api/health/deep` 200; login barber/master/booking; venda+caixa na
   JoeFelipe (valida writes sob app_runtime). `LOG_POOL_DIAGNOSTICS=true` temporário se
   quiser ver o role nas transações.
5. **Kill-switch** se writes quebrarem: remover `APP_RUNTIME_URL` no Render (reverte para
   pool único) e investigar grant faltante.
6. TLS: baixar CA (Supabase → Settings → Database → SSL Certificate), subir no Render e
   setar `DATABASE_SSL_CA_PATH` (ou `DATABASE_SSL_CA` inline). Reiniciar e conferir boot.
7. Smoke completo: roteiro da auditoria 2026-07-02 (seção 6) — incluir logout→refresh=401
   (agora deve falhar de verdade com a revogação server-side).

## Critérios de aceite

- [ ] Push autorizado e deploy verde (Render + Vercel).
- [ ] Migrations 018-021/030 aplicadas em prod (verificadas, não presumidas).
- [ ] Login/refresh/logout OK nos 3 escopos; logout invalida refresh (401).
- [ ] Venda/caixa/agendamento funcionando (writes sob app_runtime).
- [ ] Health deep 200; sem erro novo nos logs por 24h.
- [ ] TLS com `rejectUnauthorized: true` ativo (sem warning de CA no boot).

## Fila pós-release (reordenada pela due diligence 2026-07-03)

**P0 — circuito de receita** (ver `.opencodex/audits/2026-07-03-due-diligence-enterprise.md`):
1. ⏳ `billing/plan-type-provisioning-fix` — P0 (IA): webhook deve setar `companies.plan_type`
   + `trial_ends_at`; raiz do incidente D-016 (cliente pago bloqueado no fim do trial)
2. ⏳ `billing/seed-plans-prod` — P0 (IA+humano): popular `plans` + produtos Kiwify +
   `VITE_KIWIFY_URL_*` no Vercel
3. ⏳ `onboarding/auto-activate-barber-on-register` — P0 (IA): registro nicho barber sai com
   módulo ativo em trial, sem toque do master
4. ⏳ `legal/termos-privacidade-lgpd` — P0 (IA rascunha, humano valida)
5. ⏳ `qa/pagamento-real-teste` — P0 (humano): 1 checkout real/sandbox ponta a ponta

**P1:**
6. ⏳ `ops/alertas-uptime-sentry` · `ops/whatsapp-real-provider-activation` (Meta) ·
   `cs/faq-tutoriais-suporte` · `product/cancelamento-exclusao-conta` · `ops/restore-drill`
7. ⏳ `chore/repo-artifact-cleanup` — P2 (lista aprovada item a item) ·
   `cleanup/fase-c-branches-worktrees` — P2 (HUMAN_APPROVAL_REQUIRED)

## Trilha paralela — Core multi-nicho (não bloqueia a fila acima)

> Fonte: `.opencodex/audits/2026-07-03-core-vs-nicho-audit.md` — Core Completion Index 52/100.
> Spec oficial: `.opencodex/brain/MULTGESTOR-PLATFORM-SPECIFICATION.md` · Decisão: D-017.
> Não reordena o P0 comercial acima; roda em paralelo, sem dependência.

8. ✅ **`core/fix-company-service-barber-coupling`** — CONCLUÍDO 2026-07-03 (commit local).
   `company.service.js` limpo; `getBarberMe` movido para `barber-core.service.js`.
9. ✅ **`core/fix-clima-auth-guard`** — CONCLUÍDO 2026-07-03. `clima.routes.js` usa
   `requireTenantAdminAuth` (alias genérico, mesma implementação hoje — dívida documentada
   em D-017 porque não existe scope por módulo ainda).
10. ✅ **`core/generalize-auth-scopes`** — CONCLUÍDO 2026-07-03. `ModuleRoute.jsx`/`AuthContext.jsx`
    usam `constants/authScopes.js` em vez de literais.
11. ⏳ `core/dynamic-module-route-registry` — P1 do Core (IA): maior alavanca de extensibilidade;
    hoje rotas são hardcoded em `server.js`/`App.jsx`. **Depende do item 12.**
12. ⏳ Decisão humana (D-005): ClimaGestor vira piloto real ou congela até o Core evoluir —
    guard de auth já corrigido (item 9), mas frontend ainda ~1% (stub)
13. ⏳ Push dos commits do Core P0 — mesmo gate humano de `release/push-p0-batch` acima
    (nenhuma migration nova; risco baixo, mas ainda gated)
