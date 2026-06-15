# 📌 PROJECT STATE — Estado Atual Real

> **Atualizado:** 2026-06-14 · **state_version:** 4
> **REGRA:** este arquivo é atualizado a cada missão APPROVE (Loop de Fechamento). Se estiver desatualizado, o CHECK 0 deve bloquear/reduzir o Context Confidence.
> **Origem:** substitui `.opencodex/state/project-state.md` (V2, congelado 06-04) e `.agent/memory/current-state.md`.

```yaml
project: MultGestor v2
state_version: 4
phase: "prod-stabilization + security-hardening"

git:
  origin_main: "b75d34a (PUSHED 2026-06-14) — XSS register hardening (PR #6, squash)"
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

prod_evidence_2026_06_14:
  - "Render conecta no banco: aws-1-sa-east-1.pooler.supabase.com:5432/postgres → [database] conectado"
  - "Supabase MCP conectado (project mfayajizbkqkcbhqmean)"
  - "drift reminder_sent_at RESOLVIDO (job AppointmentReminderJob sobe sem erro)"
  - "GET /api/health → 200; login inválido → 401 (não 500)"
  - "POST /api/auth/register com <script> → 400 (portão XSS ativo)"

queue:
  current_task: "xss-data-sanitization-block-a-users (DONE — users.name limpo, count=0; ciclo XSS fechado)"
  next_task: "e2e-public-booking-validation (pending — validação read-only do fluxo público)"
  last_decision: "Bloco A v2 executado (UPDATE só nos 3 IDs); ciclo XSS CLOSED; próximo = E2E booking"

deploy_blockers:
  - id: "OPS-1"
    status: "RESOLVIDO — Render conecta; DATABASE_URL corrigida (pooler sa-east-1)."
  - id: "OPS-2"
    status: "RESOLVIDO — path Vercel corrigido (4a058d2)."
  - id: "OPS-SUPAVISOR"
    status: "⛔ BLOQUEADO/PAUSADO (2026-06-15) por missão prioritária SECURITY-SECRETS-ROTATION. NÃO alterar o continue-on-error das migrations até os secrets serem rotacionados e validados (logs de migration podem imprimir DATABASE_URL atual). Detalhe: [[security-secrets-rotation]]. Pendência técnica original mantida: Supavisor sa-east-1 rejeita tenant; migrations novas aplicadas via MCP. Ver [[project-supavisor-ops-pending]]."

gates_abertos: []

xss_cycle_status: >-
  CLOSED (2026-06-14). companies.name ~ '[<>]' = 0 E users.name ~ '[<>]' = 0;
  public_display_name, business_description, barber_services.name também 0. Portão de
  entrada (/register com <script>) → 400. Bloco A v2 (users.name): UPDATE afetou exatamente
  os 3 IDs autorizados, sem DELETE/migration/schema/código/commit/push. Ciclo XSS fechado de fato.

open_risks:
  - "Migrations automáticas no CI desativadas (continue-on-error) — drift volta a acumular se novas migrations não forem aplicadas manualmente via MCP."
  - ".agent/ ainda fisicamente presente (rebaixado a histórico) — consolidação de namespaces é backlog separado."

# RESOLVIDO nesta sessão:
#   - stored XSS em companies.name (3 registros) → sanitizado, count=0.
#   - stored XSS em users.name (3 registros) → sanitizado via Bloco A v2, count=0 → ciclo XSS CLOSED.

ultimas_missoes:
  - "Drift reminder_sent_at (023) — aplicado em prod via MCP"
  - "Drift outbox_message_handlers (022) — aplicado em prod via MCP"
  - "XSS register hardening (Bloco B+C) — APPROVE, PR #6 mergeado + deployado"
  - "XSS Bloco A (companies.name) — DONE (count=0)"
  - "XSS Bloco A v2 (users.name) — DONE (count=0) → ciclo XSS CLOSED"

next_recommended_action: >-
  Validação E2E read-only do fluxo público de agendamento (slug barbearia-joefelipe):
  booking-info + available-slots. Backlog: remover continue-on-error quando OPS-SUPAVISOR
  resolver; consolidar namespaces; opcional desativar as 3 contas de pentest sanitizadas.
```

## Módulos
- **BarberGestor** — completo (agenda, vendas, caixa, comissões, colaboradores, relatórios, agendamento online).
- **ClimaGestor** — scaffold (segundo vertical, valida arquitetura multi-nicho).

## Stack (resumo — detalhe em `architecture-decisions.md`)
React 19 + Vite · Node 18 + Express 5 (CommonJS) · PostgreSQL (Supabase, SQL direto via `pg.Pool`) · Redis 7 (fallback in-memory) · JWT · Resend · Deploy Vercel (front) + Render (back).
