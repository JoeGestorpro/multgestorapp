# ðŸ“¥ PRÃ“XIMA MISSÃƒO â€” RELEASE/PUSH-P0-BATCH (HUMAN_APPROVAL_REQUIRED)

> Sprint autÃ´nomo de 2026-07-02 deixou **8 commits locais em `main`** prontos e validados
> (ver `current-task.md`). O push Ã© **uma decisÃ£o humana**: dispara deploy no Render e o
> passo de migrations em produÃ§Ã£o (018-021 + 030, `continue-on-error` â€” validar manualmente
> depois). Nada aqui pode ser executado por agente sem autoriza

> **Atualizado em 2026-07-15:** Feature AI auditada e pronta para staging.
> PRs obsoletos (#4, #5) fechados. PR #24 mergeado. Auditoria completa
> do sistema concluida (Aprovado com ressalvas). Vault atualizado.Ã§Ã£o explÃ­cita.

---
status: pending
task_id: release/push-p0-batch
title: Release â€” push dos commits P0 + ativaÃ§Ã£o TLS + smoke pÃ³s-deploy
type: release/deploy
priority: P0
camada: release
mode: HUMAN_APPROVAL_REQUIRED
created_by: Claude Code
created_at: 2026-07-02
requires_human_approval: true
---

## ConteÃºdo do batch (local, sem push)

`ace2d05` schedule DDL fix Â· `e906039`+governanÃ§a Â· `8056831` migrations 018-021 Â·
`02c5396` **tenant writes â†’ app_runtime (P0 central)** Â· `d112950` TLS verify (inerte) Â·
`f03af4d` refresh rotation + migraÃ§Ã£o 030 Â· `d7f2fd1` lint zero Â· `d262676` CSP.

## âš ï¸ PRÃ‰-PASSO OBRIGATÃ“RIO â€” sincronizar main com origin (descoberto 2026-07-02)

`origin/main` e `main` local **divergiram**: origin tem 8 commits (merges dos PRs #20/#21 â€”
conteÃºdo idÃªntico ao trabalho local, recomitado com SHAs diferentes, + remoÃ§Ã£o do
`rls_fix_nullif_tenant_isolation.sql`) e o local tem 21 commits Ã  frente, **incluindo a
feature geladeira (BG-001) e o fix de auth `becb0ee`, que NUNCA foram deployados**.

Dry-run (`git merge-tree`) mostra sÃ³ 3 conflitos pequenos: `backend/.env.example`,
`backend/scripts/run-migrations.js`, `backend/tests/integration/gate0-pool-paths.test.js`
(add/add â€” versÃ£o do PR #20 vs versÃ£o endurecida local). Merge Ã© operaÃ§Ã£o **gated**:
executar `git merge origin/main` somente com autorizaÃ§Ã£o humana, resolver os 3 conflitos
mantendo as versÃµes locais endurecidas (+ a deleÃ§Ã£o do arquivo obsoleto vinda do origin),
rodar a suÃ­te completa e sÃ³ entÃ£o prosseguir com o push.

## SequÃªncia recomendada (humano no volante, agente pode assistir)

1. **Autorizar o merge de `origin/main`** (prÃ©-passo acima) e revisar `git log origin/main..main`.
2. **Autorizar push** para `main` â†’ deploy dispara (Render + Vercel). AtenÃ§Ã£o: o batch
   inclui a feature geladeira e ~10k linhas nunca deployadas, nÃ£o sÃ³ os fixes P0.
3. Verificar migrations em prod: 018-021 devem aplicar idempotente (tabelas provavelmente
   jÃ¡ existem) e 030 cria `refresh_tokens`. Como o step Ã© `continue-on-error`, conferir o
   log do workflow â€” se falhar, rodar `npm run migrate` manualmente contra prod (gate humano).
4. CanÃ¡rio: `GET /api/health/deep` 200; login barber/master/booking; venda+caixa na
   JoeFelipe (valida writes sob app_runtime). `LOG_POOL_DIAGNOSTICS=true` temporÃ¡rio se
   quiser ver o role nas transaÃ§Ãµes.
5. **Kill-switch** se writes quebrarem: remover `APP_RUNTIME_URL` no Render (reverte para
   pool Ãºnico) e investigar grant faltante.
6. TLS: baixar CA (Supabase â†’ Settings â†’ Database â†’ SSL Certificate), subir no Render e
   setar `DATABASE_SSL_CA_PATH` (ou `DATABASE_SSL_CA` inline). Reiniciar e conferir boot.
7. Smoke completo: roteiro da auditoria 2026-07-02 (seÃ§Ã£o 6) â€” incluir logoutâ†’refresh=401
   (agora deve falhar de verdade com a revogaÃ§Ã£o server-side).

## CritÃ©rios de aceite

- [ ] Push autorizado e deploy verde (Render + Vercel).
- [ ] Migrations 018-021/030 aplicadas em prod (verificadas, nÃ£o presumidas).
- [ ] Login/refresh/logout OK nos 3 escopos; logout invalida refresh (401).
- [ ] Venda/caixa/agendamento funcionando (writes sob app_runtime).
- [ ] Health deep 200; sem erro novo nos logs por 24h.
- [ ] TLS com `rejectUnauthorized: true` ativo (sem warning de CA no boot).

## Fila pÃ³s-release (reordenada pela due diligence 2026-07-03)

**P0 â€” circuito de receita** (ver `.opencodex/audits/2026-07-03-due-diligence-enterprise.md`):
1. â³ `billing/plan-type-provisioning-fix` â€” P0 (IA): webhook deve setar `companies.plan_type`
   + `trial_ends_at`; raiz do incidente D-016 (cliente pago bloqueado no fim do trial)
2. â³ `billing/seed-plans-prod` â€” P0 (IA+humano): popular `plans` + produtos Kiwify +
   `VITE_KIWIFY_URL_*` no Vercel
3. â³ `onboarding/auto-activate-barber-on-register` â€” P0 (IA): registro nicho barber sai com
   mÃ³dulo ativo em trial, sem toque do master
4. â³ `legal/termos-privacidade-lgpd` â€” P0 (IA rascunha, humano valida)
5. â³ `qa/pagamento-real-teste` â€” P0 (humano): 1 checkout real/sandbox ponta a ponta

**P1:**
6. â³ `ops/alertas-uptime-sentry` Â· `ops/whatsapp-real-provider-activation` (Meta) Â·
   `cs/faq-tutoriais-suporte` Â· `product/cancelamento-exclusao-conta` Â· `ops/restore-drill`
7. â³ `chore/repo-artifact-cleanup` â€” P2 (lista aprovada item a item) Â·
   `cleanup/fase-c-branches-worktrees` â€” P2 (HUMAN_APPROVAL_REQUIRED)

## Trilha paralela â€” Core multi-nicho (nÃ£o bloqueia a fila acima)

> Fonte: `.opencodex/audits/2026-07-03-core-vs-nicho-audit.md` â€” Core Completion Index 52/100.
> Spec oficial: `.opencodex/brain/MULTGESTOR-PLATFORM-SPECIFICATION.md` Â· DecisÃ£o: D-017.
> NÃ£o reordena o P0 comercial acima; roda em paralelo, sem dependÃªncia.

8. âœ… **`core/fix-company-service-barber-coupling`** â€” CONCLUÃDO 2026-07-03 (commit local).
   `company.service.js` limpo; `getBarberMe` movido para `barber-core.service.js`.
9. âœ… **`core/fix-clima-auth-guard`** â€” CONCLUÃDO 2026-07-03. `clima.routes.js` usa
   `requireTenantAdminAuth` (alias genÃ©rico, mesma implementaÃ§Ã£o hoje â€” dÃ­vida documentada
   em D-017 porque nÃ£o existe scope por mÃ³dulo ainda).
10. âœ… **`core/generalize-auth-scopes`** â€” CONCLUÃDO 2026-07-03. `ModuleRoute.jsx`/`AuthContext.jsx`
    usam `constants/authScopes.js` em vez de literais.
11. â³ `core/dynamic-module-route-registry` â€” P1 do Core (IA): maior alavanca de extensibilidade;
    hoje rotas sÃ£o hardcoded em `server.js`/`App.jsx`. **Depende do item 12.**
12. â³ DecisÃ£o humana (D-005): ClimaGestor vira piloto real ou congela atÃ© o Core evoluir â€”
    guard de auth jÃ¡ corrigido (item 9), mas frontend ainda ~1% (stub)
13. â³ Push dos commits do Core P0 â€” mesmo gate humano de `release/push-p0-batch` acima
    (nenhuma migration nova; risco baixo, mas ainda gated)

