# 🏛️ DECISÕES DE ARQUITETURA (ADRs) — MultGestor

> **Status:** OFICIAL • VINCULANTE · **Atualizado:** 2026-06-07
> **Origem:** `docs/architecture-decisions.md` (v1.0, OURO) — **Consolidado** + ADRs novas de 06-05→06-07.
> Formato: decisão · contexto · status.

## ADR-01 — Multi-tenant por `company_id` (não `owner_id`)
Isolamento por empresa. Master Admin tem `company_id` NULL e é isolado dos tenants. **Status: vigente.**

## ADR-02 — Sem ORM; SQL direto via `pg.Pool`
Migrations = scripts SQL manuais (`scripts/run-migrations.js`). **Status: vigente.**

## ADR-03 — Event Bus volátil + Outbox durável (coexistência)
- **In-memory `eventBus`**: notificações best-effort (WhatsApp confirmação/cancelamento/lembrete).
- **Outbox durável (UnitOfWork)**: eventos que exigem garantia (sale, cash-flow, appointment.* durável).
- **Dual-emit**: eventos com consumer in-memory ativo (confirmed/canceled) são emitidos durável **e** in-memory pós-commit até o consumer ser migrado. **Status: vigente (F2 inc.1/inc.2).**

## ADR-04 — Outbox: evento sem handler = no-op (`processed`), não `failed` (F6)
"Produtores não conhecem consumidores" — marcar `failed` violava o princípio e acumulava lixo (incidente `sale.created`). Sem handler → `processed` + WARN. **Status: vigente (commit 6c3c81a).**

## ADR-05 — EVENT CONTRACTS + Factory obrigatórios
Após incidente de `event_name`/`aggregate_type` hardcoded sem `validateEventPayload`, todo producer de domínio usa contrato (`contracts.js`) via factory (`AppointmentEvents`). Gate de auditoria reprova violação. **Status: vigente (regra `.opencodex/rules/event-contracts.md`).**

## ADR-06 — RLS é defesa-em-profundidade; runtime atual tem BYPASSRLS
RLS está `ENABLE` mas **inerte em produção** porque o role de runtime (`postgres`) tem BYPASSRLS. Isolamento real hoje = filtros `company_id` na aplicação. **Decisão:** introduzir role `app_runtime` (NOSUPERUSER, NOBYPASSRLS, não-owner) — Fase 1 (CI-only) **concluída**; Fases 2 (staging) e 3 (produção) são **PLAN_ONLY/ESCALATE**. **Status: em evolução.**
> ⚠️ Policies RLS hoje só têm `USING` (sem `WITH CHECK`) — escrita cross-tenant não é bloqueada no banco. Tratar na Fase 2/3.

## ADR-07 — Governança operacional em `.opencodex/` (não `.agent/`)
A autoridade operacional é a fila/regras `.opencodex/`. `.agent/` é histórico. Brain V3 (`.opencodex/brain/`) é a fonte única estratégica. **Status: vigente (2026-06-07).**

## ADR-08 — Ambiente oficial Windows + PowerShell
Estabelecido após incidente. Comandos operacionais compatíveis com PowerShell. **Status: vigente.**

## Decisões estratégicas herdadas (de `.agent/memory/decisions.md` — revalidar antes de citar)
- JWT em HttpOnly cookie (refresh) em vez de localStorage (Sprint 2).
- Shared kernel / capabilities como base multi-nicho (Sprint 8+).
- Booking Engine como primeira capability reutilizável.
