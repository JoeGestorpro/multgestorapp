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
  current_task: "fix-xss-register-hardening (DONE — b75d34a, deployado)"
  next_task: "xss-data-sanitization-block-a (pending — MCP guarded, requer aprovação humana)"
  last_decision: "PR #6 squash-merge + deploy automático OK; próximo = sanitizar 3 registros XSS"

deploy_blockers:
  - id: "OPS-1"
    status: "RESOLVIDO — Render conecta; DATABASE_URL corrigida (pooler sa-east-1)."
  - id: "OPS-2"
    status: "RESOLVIDO — path Vercel corrigido (4a058d2)."
  - id: "OPS-SUPAVISOR"
    status: "PENDENTE — migrations no CI com continue-on-error (Supavisor sa-east-1 rejeita tenant). Enquanto durar, cada migration nova é aplicada manualmente via MCP. Ver [[project-supavisor-ops-pending]]."

gates_abertos: []

open_risks:
  - "Migrations automáticas no CI desativadas (continue-on-error) — drift volta a acumular se novas migrations não forem aplicadas manualmente via MCP."
  - "3 registros com stored XSS em companies.name ainda no banco (sem exploração ativa) — Bloco A pendente de aprovação."
  - ".agent/ ainda fisicamente presente (rebaixado a histórico) — consolidação de namespaces é backlog separado."

ultimas_missoes:
  - "F2 inc.2 mutation paths + integração — APPROVE (reconciliado em main)"
  - "Drift reminder_sent_at (023) — aplicado em prod via MCP"
  - "Drift outbox_message_handlers (022) — aplicado em prod via MCP"
  - "XSS register hardening (Bloco B+C) — APPROVE, PR #6 mergeado + deployado"

next_recommended_action: >-
  Executar o Bloco A (sanitização dos 3 registros XSS em companies.name) via MCP Supabase,
  com SELECT prévio + aprovação humana + UPDATE só nos 3 IDs + SELECT pós. Depois, planejar
  remoção do continue-on-error quando o OPS-SUPAVISOR for resolvido.
```

## Módulos
- **BarberGestor** — completo (agenda, vendas, caixa, comissões, colaboradores, relatórios, agendamento online).
- **ClimaGestor** — scaffold (segundo vertical, valida arquitetura multi-nicho).

## Stack (resumo — detalhe em `architecture-decisions.md`)
React 19 + Vite · Node 18 + Express 5 (CommonJS) · PostgreSQL (Supabase, SQL direto via `pg.Pool`) · Redis 7 (fallback in-memory) · JWT · Resend · Deploy Vercel (front) + Render (back).
