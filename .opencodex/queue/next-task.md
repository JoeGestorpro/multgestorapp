# 📥 NEXT TASK — Validação E2E do fluxo de agendamento público

> Escrito pelo **Claude Code**. Missão de validação (read-only / curl), sem alteração de código.
> Ciclo XSS já fechado (companies.name=0, users.name=0, portão de entrada ativo).

---
status: pending
task_id: e2e-public-booking-validation
title: Validar o fluxo público de agendamento end-to-end (slug barbearia-joefelipe)
mode: READ_ONLY_VALIDATION
requires_human_approval: false
created_by: Claude Code
created_at: 2026-06-14
---

## Contexto
Backend estável em prod (health 200, login 401, DB conectado, drifts 022/023 resolvidos).
Tenant completo para teste: **`barbearia-joefelipe`** (16 serviços, 7 colaboradores, 7 working_hours).
`barbearia-teste` tem 0 working_hours → slots vazios (não usar).

## Objetivo
Provar, via requisições reais (sem tocar código), que o fluxo público funciona:
1. `GET /api/public/booking/barbearia-joefelipe` → 200 com info do tenant.
2. `GET /api/barber/public/barbearia-joefelipe/available-slots?date=<futura>` → 200 com horários.
3. (Opcional, cria dado real) `POST /api/public/booking/barbearia-joefelipe/appointments` →
   **só com aprovação humana**, pois grava agendamento + dispara outbox.

## Proibições
- ❌ Alterar código/backend/frontend · ❌ SQL de escrita · ❌ deploy.
- ❌ POST de agendamento sem aprovação humana explícita (cria dado de produção).

## Critérios de aceite
- [ ] booking-info 200 · available-slots 200 com lista não vazia.
- [ ] Separar erro de dados/config de erro de código (se houver).

## Backlog (missões separadas, fora desta)
- OPS-SUPAVISOR: resolver tenant sa-east-1 e remover `continue-on-error` do deploy.yml.
- Consolidar namespaces `.agent/` vs `.opencode/` vs `.opencodex/`.
- Limpeza de branches locais órfãs.
- (Opcional) Desativar — não deletar — as 3 contas admin de pentest já sanitizadas.
