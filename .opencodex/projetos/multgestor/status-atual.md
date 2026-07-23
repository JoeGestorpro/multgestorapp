# 📌 ESTADO DO PROJETO — Estado Atual Real

> ⚠️ **Fonte canônica de estado migrou (KNOWLEDGE-001, 2026-07-23):** o resumo de estado real do projeto agora é [[../../PROJECT-SNAPSHOT]] (1 página) + [[../../02-ESTADO-REAL-DO-PROJETO]] (detalhado). **Este arquivo permanece como continuidade operacional (estado de máquina/fila).** Em conflito de estado, os dois acima prevalecem.
>
> **Atualizado:** 2026-07-23 · **state_version:** 23
> **REGRA:** este arquivo é atualizado a cada missão APPROVE (Loop de Fechamento). Se estiver desatualizado, o CHECK 0 deve bloquear/reduzir o Context Confidence.
> **Origem:** substitui `.opencodex/state/project-state.md` (V2, congelado 06-04) e `.agent/memory/current-state.md`.
> **Formato:** fonte viva de continuidade operacional (YAML = estado de máquina/agentes · Markdown = visão humana). Sequência arquitetural completa em [[roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR|Mapa Mestre]].

```yaml
project: MultGestor v2
state_version: 23
updated: "2026-07-23"
phase: "produto-vendavel — fundacao solida; foco estrategico: fechar circuito comercial (billing em producao, dependente de config externa)"

git:
  branch: main
  ahead_of_origin: 0    # main publicada; R-003 mergeado (#73, 7a313fd) e deployado; verificado 2026-07-23
  diverged: false       # main == origin/main
  origin_main: "7a313fd (origin/main HEAD, 2026-07-23) — Merge PR #73 (R-003 webhooks). Antecessores recentes: #72 paths-ignore, #71 TENANT-003A, #70 SEC-BOOKING-RLS."
  reconciliation: >-
    FASE C FECHADA (2026-06-23). PR #16 (bd13f69) mergeado → deploy disparou e terminou success.
    PR #15 (af04618) mergeado → NÃO disparou deploy (paths-ignore funcionou). origin/main head = af04618.
    PR #13 (863d811) já estava em main. Próximo: cleanup/fase-c-branches-worktrees.

# Reconciliado para main:
in_main:
  - "RLS Fase 1 CI-only (a179085) · F6 outbox no-op (6c3c81a) · F2 inc.1 (823107c)"
  - "F2 inc.2 — mutation paths duráveis (0d654f3) + dual-emit"
  - "GATE-INTEG — testes de integração dos 4 mutation paths em outbox-durability.test.js"
  - "EVENT CONTRACTS — regra + AppointmentEvents factory + gate (50a64dd, bc8e6f8)"
  - "Brain V3 — .opencodex/brain (source-of-truth, CHECK 0, Loop de Fechamento) (67ee6ac)"
  - "fix(outbox) export handleWalletTopup/Failed (c3a06d6)"
  - "XSS register hardening — Bloco B+C (b75d34a, PR #6)"

# Aplicado direto em produção via MCP Supabase (NÃO via CI — Supavisor OPS pendente):
prod_db_migrations_applied:
  - "20260604_022 outbox_message_handlers — 2026-06-14 (idempotência por handler estava ausente)"
  - "20260604_023 barber_appointments_reminder — 2026-06-14 (coluna reminder_sent_at)"

prod_evidence_2026_06_15:
  - "Render conecta no banco: [SUPABASE_POOLER_HOST]:5432/postgres → [database] conectado"
  - "Supabase MCP conectado (project [PROJECT_REF])"
  - "drift reminder_sent_at RESOLVIDO (job AppointmentReminderJob sobe sem erro)"
  - "GET /api/health → 200; login inválido → 401 (não 500)"
  - "POST /api/auth/register com <script> → 400 (portão XSS ativo)"

queue:
  current_task: "KNOWLEDGE-001 (consolidação documental) — em execução 2026-07-23."
  next_task: "Prioridade ESTRATÉGICA: fechar circuito comercial (billing em produção, dependente de config externa Kiwify+secrets — ação humana). Próxima EXECUTÁVEL: item de maior rank desbloqueado na matriz ANEXO F. Ver [[../../PROXIMA-MELHOR-ACAO]]."
  unblocked_ready: "candidatos código-side: IDENT-002 (escopo auth por módulo), AUDIT-001, SEC-003, FRONTCORE-002 (decompor Barber.jsx). RLS-prod e billing bloqueados (externo)."
  backlog_anterior: "R-003-WEBHOOKS CONCLUÍDA (2026-07-23, #73). OPS-MIGRATIONS-03D, TENANT-003A concluídas. Ver timeline em [[../../02-ESTADO-REAL-DO-PROJETO]]."
  last_decision: >-
    Auditoria READ_ONLY do Mapa Mestre concluída (2026-07-10). Próxima missão = Fase 6
    (entitlement de pagamento em prod). Reclassificação de severidade: entitlement = P1
    (não P0) por ausência de vendas reais via gateway; 14 commits unpushed = P1 operacional.
    state_version 21→22.

deploy_blockers:
  - id: "OPS-1"
    status: "RESOLVIDO — Render conecta; DATABASE_URL corrigida (pooler sa-east-1)."
  - id: "OPS-2"
    status: "RESOLVIDO — path Vercel corrigido (4a058d2)."
  - id: "OPS-SUPAVISOR"
    status: "⛔ BLOQUEADO (2026-06-15). SECURITY-SECRETS-ROTATION foi PAUSADA por decisão humana (deferred) — rotação adiada para janela futura. Antes de reconsiderar OPS-SUPAVISOR, confirmar que nenhum log/CI exibirá secrets (ex.: DATABASE_URL em log de migration). NÃO alterar o continue-on-error das migrations até essa confirmação. Detalhe: [[areas/seguranca/rotacao-segredos]]. Pendência técnica original mantida: Supavisor sa-east-1 rejeita tenant; migrations novas aplicadas via MCP. Ver [[project-supavisor-ops-pending]]."

gates_abertos: []

xss_cycle_status: >-
  CLOSED (2026-06-14). companies.name ~ '[<>]' = 0 E users.name ~ '[<>]' = 0;
  public_display_name, business_description, barber_services.name também 0. Portão de
  entrada (/register com <script>) → 400. Bloco A v2 (users.name): UPDATE afetou exatamente
  os 3 IDs autorizados, sem DELETE/migration/schema/código/commit/push. Ciclo XSS fechado de fato.

resolved_this_session:
  - "P1-A: barber.routes.js rotas públicas (GET/POST /public/:slug/*) agora têm rate limit consistente com public-booking.routes.js — IP (10/15min) + tenant (30/60min) para POST, leitura (60/15min) para GET. R-003 parcialmente mitigado: bypass por caminho alternativo eliminado."

open_risks:
  - "Migrations automáticas no CI desativadas (continue-on-error) — drift volta a acumular se novas migrations não forem aplicadas manualmente via MCP."
  - ".agent/ ainda fisicamente presente (rebaixado a histórico) — consolidação de namespaces é backlog separado."
  - "Rotina dump-only diária ATIVA — Task Scheduler 'MultGestor-Backup-Daily' State=Ready, NextRunTime=2026-06-19 02:00 (verificado 2026-06-18). RPO ~24h confirmado."
  - "Restore validado por evidência MCP (Fase 2); log original do restore não disponível — aceito por decisão humana. Replay limpo é opção futura se auditoria exigir."

# RESOLVIDO nesta sessão (state v5):
#   - stored XSS em companies.name (3 registros) → sanitizado via 3 UPDATEs (só name; updated_at não alterado); count(~'[<>]') = 0.
#   - stored XSS em users.name (3 registros) → sanitizado via 3 UPDATEs; count(~'[<>]') = 0 → ciclo XSS CLOSED.
#   - PR #7 (chore/brain-queue-cleanup) — mergeado (21317cd); deploy workflow verde.

ultimas_missoes:
  - "KNOWLEDGE-001 EM EXECUÇÃO (2026-07-23) — consolidação documental do OpenCodex p/ refletir o estado real de julho. Incorpora Arquitetura Canônica (Fase 1), consolida ADRs (007 SUPERSEDED + FASE-C + REDIS), cria PROJECT-SNAPSHOT.md + 02-ESTADO-REAL-DO-PROJETO.md, atualiza estado/backlog/matriz. state_version 22→23."
  - "R-003-WEBHOOKS CONCLUÍDA (2026-07-23, #73 7a313fd) — webhooks públicos (kiwify/abacatepay + whatsapp) com controle de abuso IP-based (fail-open). Deploy dep-d9glrj3eo5us73ccc440 live; health healthy, db ok 177ms; migrations pendentes 0. Evidência: 2026-07-22-r003-webhooks-abuse-hardening.md."
  - "OPS-MIGRATIONS-001 CONCLUÍDA (2026-07-22) — auditoria READ_ONLY do pipeline de migrations; confirmou 03D (automáticas/bloqueantes/estritas/idempotentes); corrigiu tabela 'O que falta' do ADR-006 (#70)."
  - "paths-ignore fix (#72, 2026-07-22) — deploy.yml ignora .opencode/** e docs/** (docs-only não dispara deploy)."
  - "TENANT-003A CONCLUÍDA (2026-07-21, #71) — rotas públicas de booking passam a rodar em contexto de tenant/RLS (runPublicTenantOperation). Deploy live; 10/10 testes de isolamento em banco de teste dedicado."
  - "OPS-MIGRATIONS-03D CONCLUÍDA (2026-07-20) — migrations de produção automáticas e bloqueantes (buildCommand = npm install && npm run migrate:prod)."
  - "Booking Engine rebaixado (ADR-007 SUPERSEDED / ADR-008 / ADR-009, 2026-07-20, #67) — motor permanece em services/barber/; não promovido ao Core."
  - "auditoria-readonly-mapa-mestre CONCLUÍDA (2026-07-10) — auditoria READ_ONLY da raiz real; 16 fases classificadas por evidência; Mapa Mestre criado + painel Seção 15 preenchido + índice atualizado; relatório em .opencodex/auditorias/multgestor/2026-07-10-auditoria-readonly-mapa-mestre.md. Reclassificação: entitlement pagamento P0→P1 (sem vendas reais via gateway); 14 commits unpushed = P1 operacional. Nenhum código/banco/deploy alterado. state_version 21→22."
  - "fase-d/p1a-public-booking-rate-limit CONCLUÍDO (2026-06-23) — rate limit adicionado nas rotas públicas duplicadas em barber.routes.js (GET /public/:slug/booking-info, GET /public/:slug/available-slots, POST /public/:slug/appointments). Mesmos limites de public-booking.routes.js: 60/15min leitura, 10/15min IP + 30/60min tenant para criação. Testes existentes de tenant keyGenerator reaproveitados + novos testes para barber public rates. state_version 19→20. trust proxy já ativo (server.js:92)."
  - "fase-c/consolidar-segundo-cerebro-opencodex-safe-write-1 CONCLUÍDO (2026-06-23) — D-015 criada, .gitignore atualizado (5 padrões), 12 arquivos do Living OS oficial adicionados ao git, wikilinks corrigidos no INDEX.md ([[living-os/...]] → [[brain/living-os/...]]). state_version 19."
  - "FASE C FECHADA (2026-06-23) — PR #16 (bd13f69) MERGED, deploy disparou e terminou success; PR #15 (af04618) MERGED, NÃO disparou deploy (paths-ignore funcionou). origin/main head = af04618. state_version 17→18. Próxima: cleanup/fase-c-branches-worktrees → agent/joefelipe-consolidation."
  - "fase-c/redacao-opencodex CONCLUÍDO (2026-06-23) — 9 arquivos redigidos, 20 substituições aplicadas. Valores reais sensíveis removidos. Domínios frontend públicos preservados. Nenhuma publicação, commit, push, branch, cleanup, deploy ou migration executada. Veredito: pronto para revisão."
  - "fase-c/decisao-opencodex CONCLUÍDO (2026-06-23) — varredura PLAN_ONLY do .opencodex concluída. Nenhum secret real encontrado. Decisão D-014: publicar com ressalvas/redação. ~70% classificado como potencialmente publicável; nenhuma publicação autorizada nesta missão."
  - "fase-c/pr-2-backup-b2-checklist CONCLUÍDO (2026-06-23) — backup/B2 checklist READ_ONLY. Veredito OK: backup local dump 648KB APPROVED; scheduler Ready 02:00 exit 0 0 missed; B2 backblaze-b2 verified=true sha1 match; agente/fila OK conforme inspeção READ_ONLY. Escopo exclusivo backup/B2 — R-002 (RLS/multi-tenant) não resolvido por PR-2."
  - "fase-c/pr-1 (PR #13) CONCLUÍDO (2026-06-23) — JoeFelipe Agent safety tests mergeados em origin/main (863d811). 23/23 verdes. 4 arquivos de teste + 1 linha package.json. Fase C continua como resgate cirúrgico."
  - "ops/reconcile-orphaned-outbox-messages CONCLUÍDA (2026-06-18) — 4 cash_session.* orphaned → processed. outbox_messages.failed=0. Achado A-003 RESOLVIDO."
  - "auditoria-completa-2026-06-18 — 24 seções, veredito APROVADO C/ BLOQUEIOS P1 (backup local, outbox orphaned, Redis, RLS lacunas). Relatório em .opencodex/audits/"
  - "e2e-public-booking-validation CONCLUÍDO (2026-06-18) — GET booking-info ✅ GET slots ✅ no 500s ✅; achados: chave settings (não bookingSettings), 1 colaborador bookable (não 7), serviceId obrigatório p/ slots"
  - "ops/register-daily-backup-scheduler CONCLUÍDO (2026-06-18) — scheduler ativo State=Ready, NextRunTime=2026-06-19 02:00, RPO ~24h verificado"
  - "BACKUP-RESTORE-CHECK gate PASSOU (2026-06-18) — dump Fase 1 OK; restore Fase 2 evidenciado via MCP; missões desbloqueadas"
  - "Drift reminder_sent_at (023) — aplicado em prod via MCP"
  - "Drift outbox_message_handlers (022) — aplicado em prod via MCP"
  - "XSS register hardening (Bloco B+C) — APPROVE, PR #6 mergeado + deployado"
  - "XSS Bloco A (companies.name) — DONE (3 UPDATEs, só name, sem updated_at)"
  - "XSS Bloco A v2 (users.name) — DONE (count=0) → ciclo XSS CLOSED"
  - "PR #7 chore/brain-queue-cleanup — mergeado (21317cd); deploy verde"

next_recommended_action: >-
  fase6/ativacao-entitlement-pagamento-prod — fechar webhook→ativação de plano→liberação
  de recursos em produção. Código pronto (billing-manager: assinatura+idempotência+outbox);
  falta config de produção (plans/produtos Kiwify/VITE_KIWIFY_URL_*, D-016). Pré-condição:
  release/push-p0-batch (gate humano). REGRA: não misturar o push dos 14 commits com a
  ativação de pagamento — gates separados. Paralelo seguro: fase7/onboarding-credenciais-whatsapp-tenant.
  Backlog anterior cleanup/fase-c-branches-worktrees permanece pendente se não executado.
  Ref: [[roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR]].
```

---

## 🧭 Continuidade operacional (visão humana)

> Detalhe operacional completo está no bloco YAML acima (estado de máquina/agentes). Esta seção é a leitura rápida — **não duplica** os dados, resume e aponta.

**Onde paramos:** auditoria READ_ONLY do Mapa Mestre concluída em 2026-07-10 — 16 fases classificadas por evidência real. Relatório: [[../../auditorias/multgestor/2026-07-10-auditoria-readonly-mapa-mestre|auditoria 2026-07-10]].

**Fase ativa:** Fase 6 — Pagamentos / entitlement (`IMPLEMENTADO NÃO VALIDADO`: código pronto, falta config de produção).

**Missão atual:** nenhuma em execução (`queue.current_task = idle`).

**Próxima missão:** `fase6/ativacao-entitlement-pagamento-prod` — pré-condição `release/push-p0-batch` (gate humano). Paralelo seguro: `fase7/onboarding-credenciais-whatsapp-tenant`.

**Bloqueios ativos (severidade revista — ver justificativa abaixo):**
- **P1 operacional** — 14 commits locais não publicados (divergência main/origin; inclui `npm audit fix` 13/14 + migration 031). *Eleva a P0 só se o lote contiver correção de segurança explorável em aberto.*
- **P1 (bloqueador de lançamento comercial)** — entitlement de pagamento não fecha em prod (config `plans`/produtos/env, D-016). *Eleva a P0 se houver cobrança real via gateway aguardando ativação — não confirmado (a única conta premium em prod, JoeFelipe, foi promovida manualmente, não via webhook).*
- **P1** — writes via `pool.connect` podem bypassar RLS (ver `open_risks`/RLS runtime).
- **P1** — migrations em CI com `continue-on-error` = risco de drift (ver `open_risks`).

**Próxima ação:** gerar/validar o plano de `fase6/...` **sem executar**. Regra: NÃO misturar o push do batch com a ativação de pagamento — gates separados.

**Documentos pendentes de sync:** `status-dinamico.md` (duplica papel), Registro de Missões.

---

## Módulos
- **BarberGestor** — completo (agenda, vendas, caixa, comissões, colaboradores, relatórios, agendamento online).
- **ClimaGestor** — scaffold (segundo vertical, valida arquitetura multi-nicho).

## Stack (resumo — detalhe em `architecture-decisions.md`)
React 19 + Vite · Node 18 + Express 5 (CommonJS) · PostgreSQL (Supabase, SQL direto via `pg.Pool`) · Redis 7 (fallback in-memory) · JWT · Resend · Deploy Vercel (front) + Render (back).
