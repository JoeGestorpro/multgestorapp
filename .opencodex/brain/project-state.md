# 📌 ESTADO DO PROJETO — Estado Atual Real

> **Atualizado:** 2026-06-23 · **state_version:** 18
> **REGRA:** este arquivo é atualizado a cada missão APPROVE (Loop de Fechamento). Se estiver desatualizado, o CHECK 0 deve bloquear/reduzir o Context Confidence.
> **Origem:** substitui `.opencodex/state/project-state.md` (V2, congelado 06-04) e `.agent/memory/current-state.md`.

```yaml
project: MultGestor v2
state_version: 18
phase: "estabilizacao-de-producao + endurecimento-de-seguranca"

git:
  origin_main: "af04618 (PUSHED 2026-06-23) — PR #15 MERGED (head). PR #16 (bd13f69) MERGED antes — deploy success."
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
  current_task: "idle — FASE C FECHADA (2026-06-23). PRs #15/#16 mergeados."
  next_task: "cleanup/fase-c-branches-worktrees — HUMAN_APPROVAL_REQUIRED: higiene de branches/worktrees acumulados na Fase C; deleção só com lista explícita aprovada. Depois: agent/joefelipe-consolidation."
  unblocked_ready: "cleanup/fase-c-branches-worktrees (aguardando autorização humana — HUMAN_APPROVAL_REQUIRED)"
  last_decision: >-
    FASE C FECHADA (2026-06-23). PR #16 (bd13f69) MERGED — deploy disparou e terminou success.
    PR #15 (af04618) MERGED — NÃO disparou deploy (paths-ignore funcionou). origin/main head = af04618.
    Próxima missão: cleanup/fase-c-branches-worktrees; depois agent/joefelipe-consolidation.

deploy_blockers:
  - id: "OPS-1"
    status: "RESOLVIDO — Render conecta; DATABASE_URL corrigida (pooler sa-east-1)."
  - id: "OPS-2"
    status: "RESOLVIDO — path Vercel corrigido (4a058d2)."
  - id: "OPS-SUPAVISOR"
    status: "⛔ BLOQUEADO (2026-06-15). SECURITY-SECRETS-ROTATION foi PAUSADA por decisão humana (deferred) — rotação adiada para janela futura. Antes de reconsiderar OPS-SUPAVISOR, confirmar que nenhum log/CI exibirá secrets (ex.: DATABASE_URL em log de migration). NÃO alterar o continue-on-error das migrations até essa confirmação. Detalhe: [[security-secrets-rotation]]. Pendência técnica original mantida: Supavisor sa-east-1 rejeita tenant; migrations novas aplicadas via MCP. Ver [[project-supavisor-ops-pending]]."

gates_abertos: []

xss_cycle_status: >-
  CLOSED (2026-06-14). companies.name ~ '[<>]' = 0 E users.name ~ '[<>]' = 0;
  public_display_name, business_description, barber_services.name também 0. Portão de
  entrada (/register com <script>) → 400. Bloco A v2 (users.name): UPDATE afetou exatamente
  os 3 IDs autorizados, sem DELETE/migration/schema/código/commit/push. Ciclo XSS fechado de fato.

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
  cleanup/fase-c-branches-worktrees: HUMAN_APPROVAL_REQUIRED — inventariar e
  higienizar branches/worktrees acumulados na Fase C (agora FECHADA); deleção
  só com lista explícita aprovada item a item, preservando backup/*. Depois do
  cleanup: agent/joefelipe-consolidation (retomar consolidação do agente).
```

## Módulos
- **BarberGestor** — completo (agenda, vendas, caixa, comissões, colaboradores, relatórios, agendamento online).
- **ClimaGestor** — scaffold (segundo vertical, valida arquitetura multi-nicho).

## Stack (resumo — detalhe em `architecture-decisions.md`)
React 19 + Vite · Node 18 + Express 5 (CommonJS) · PostgreSQL (Supabase, SQL direto via `pg.Pool`) · Redis 7 (fallback in-memory) · JWT · Resend · Deploy Vercel (front) + Render (back).
