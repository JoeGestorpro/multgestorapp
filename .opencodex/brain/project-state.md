# 📌 ESTADO DO PROJETO — Estado Atual Real

> **Atualizado:** 2026-06-17 · **state_version:** 6
> **REGRA:** este arquivo é atualizado a cada missão APPROVE (Loop de Fechamento). Se estiver desatualizado, o CHECK 0 deve bloquear/reduzir o Context Confidence.
> **Origem:** substitui `.opencodex/state/project-state.md` (V2, congelado 06-04) e `.agent/memory/current-state.md`.

```yaml
project: MultGestor v2
state_version: 6
phase: "estabilizacao-de-producao + endurecimento-de-seguranca"

git:
  origin_main: "21317cd (PUSHED 2026-06-15) — PR #6 (b75d34a) + PR #7 chore/brain-queue-cleanup (squash)"
  reconciliation: >-
    inc.2 + EVENT CONTRACTS + Brain V3 já reconciliados em main (state v3). Em 2026-06-14:
    drifts de schema aplicados em prod via MCP Supabase (022 + 023) e PR #6 (XSS hardening)
    mergeado + deployado (Render workflow run 27511295814 = success).

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
  - "Render conecta no banco: aws-1-sa-east-1.pooler.supabase.com:5432/postgres → [database] conectado"
  - "Supabase MCP conectado (project mfayajizbkqkcbhqmean)"
  - "drift reminder_sent_at RESOLVIDO (job AppointmentReminderJob sobe sem erro)"
  - "GET /api/health → 200; login inválido → 401 (não 500)"
  - "POST /api/auth/register com <script> → 400 (portão XSS ativo)"

queue:
  current_task: "idle — ciclo XSS data-sanitization (Bloco A + A v2) ARQUIVADO em queue/archive/2026-06-15-xss-data-sanitization.md"
  next_task: "backup-restore-check (P0 PLAN_ONLY — backup/restore bloqueia E2E, Fase C integração e data-fix)"
  blocked_behind_backup: "fase-c-integracao-e-testes (Integração) · e2e-public-booking-validation · ops/reconcile-failed-sale-created-outbox"
  last_decision: "Fila normalizada (2026-06-17): XSS arquivada; backup-restore-check = P0 atual; Fase C Integração bloqueada explicitamente atrás do plano de backup aprovado"

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
  - "NENHUM backup do Supabase (plano Free) — risco de perda total de dados. BACKUP-RESTORE-CHECK (P0) bloqueia E2E e data-fix até backup/restore ser confirmado."

# RESOLVIDO nesta sessão (state v5):
#   - stored XSS em companies.name (3 registros) → sanitizado via 3 UPDATEs (só name; updated_at não alterado); count(~'[<>]') = 0.
#   - stored XSS em users.name (3 registros) → sanitizado via 3 UPDATEs; count(~'[<>]') = 0 → ciclo XSS CLOSED.
#   - PR #7 (chore/brain-queue-cleanup) — mergeado (21317cd); deploy workflow verde.

ultimas_missoes:
  - "Drift reminder_sent_at (023) — aplicado em prod via MCP"
  - "Drift outbox_message_handlers (022) — aplicado em prod via MCP"
  - "XSS register hardening (Bloco B+C) — APPROVE, PR #6 mergeado + deployado"
  - "XSS Bloco A (companies.name) — DONE (3 UPDATEs, só name, sem updated_at)"
  - "XSS Bloco A v2 (users.name) — DONE (count=0) → ciclo XSS CLOSED"
  - "PR #7 chore/brain-queue-cleanup — mergeado (21317cd); deploy verde"

next_recommended_action: >-
  BACKUP-RESTORE-CHECK (P0 PLAN_ONLY) — verificar/testar restore de backup do Supabase.
  E2E booking permanece BLOQUEADO até backup/restore ser confirmado.
  OPS-SUPAVISOR mantido como candidato técnico futuro (não promovido agora).
```

## Módulos
- **BarberGestor** — completo (agenda, vendas, caixa, comissões, colaboradores, relatórios, agendamento online).
- **ClimaGestor** — scaffold (segundo vertical, valida arquitetura multi-nicho).

## Stack (resumo — detalhe em `architecture-decisions.md`)
React 19 + Vite · Node 18 + Express 5 (CommonJS) · PostgreSQL (Supabase, SQL direto via `pg.Pool`) · Redis 7 (fallback in-memory) · JWT · Resend · Deploy Vercel (front) + Render (back).
