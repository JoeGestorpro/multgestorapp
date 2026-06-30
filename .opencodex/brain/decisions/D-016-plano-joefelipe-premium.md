# D-016 — Promover Barbearia JoeFelipe para plano Premium (produção)

> **Status:** DECIDIDO
> **Data:** 2026-06-29
> **Responsável:** Joe Felipe (autorização humana explícita) · execução Claude Code
> **Relacionamentos:** [[decisions/README]] · [[decisions/DECISION-GRAPH]] · [[03-TIMELINE]] · [[01-CURRENT-STATE]]

---

## Problema

A empresa real **Barbearia JoeFelipe** (`companies.id = ed607874-0520-4227-b2d6-5a98e868d329`) não conseguia operar o caixa em produção: `POST /api/barber/sales` e `POST /api/barber/collaborators` retornavam **403 "Seu período de teste expirou"**.

## Contexto

- A empresa estava com `plan_type='trial'` e `trial_ends_at=2026-05-05`, **expirado há ~7 semanas** (data da auditoria: 2026-06-29).
- `isPlanActive()` (`backend/src/services/company-plan.service.js:118`) retorna `false` para trial expirado, mesmo com `plan_status='active'`.
- O middleware `requireActivePlan` protege as rotas de escrita do BarberGestor → caixa inoperante.
- A empresa tem **7 colaboradores** ativos. Limites de plano: essencial=2, profissional=5, premium=ilimitado, trial=ilimitado.
- As 2 `subscriptions` da empresa têm `plan_id`/`plan_name` NULL → o snapshot de plano cai no `companies.plan_type`, então o `UPDATE` em `companies` é o lever efetivo.

## Alternativas

### Alternativa A — Estender trial +30 dias
Destrava rápido, ilimitado, reversível. **Contra:** volta a expirar em 30 dias (problema recorrente).

### Alternativa B — Premium (pago, ativo) ✅ ESCOLHIDA
Desbloqueio permanente. Único plano pago que comporta os 7 colaboradores (ilimitado). **Contra:** nenhum relevante para o caso.

### Alternativa C — Profissional/Essencial
Limites 5/2 colaboradores → abaixo dos 7 atuais; bloquearia criação de novos colaboradores. **Rejeitada.**

## Decisão

Aplicado em produção (Supabase `db.mfayaji…`):
```sql
UPDATE companies
SET plan_type='premium', plan_status='active', updated_at=now()
WHERE id='ed607874-0520-4227-b2d6-5a98e868d329';
```
Executado em **2026-06-29 ~22:40 (-04) / 2026-06-30 06:40 UTC** (rowCount=1).

## Justificativa

Premium é o único plano pago compatível com 7 colaboradores (`max_collaborators` ilimitado) e remove a dependência de `trial_ends_at`. Para plano pago, `isPlanActive` só exige `plan_status='active'`.

## Impacto

### Positivo
- Caixa e gestão de colaboradores operacionais para a empresa real.
- `plan = premium / active`, `max_collaborators = ilimitado`.
- Cache de plano (TTL 60s) → backend live reflete em ≤1 min, sem deploy.
- Smoke validado: `/company/plan` retorna premium com todas as features `true`; 14/15 endpoints admin 200.

### Riscos / Follow-up
- Mudança de **dado em produção** (não versionada em código). Registrada aqui e no [[03-TIMELINE]] e na memória `project-joefelipe-plan-premium`.
- Mecanismo recorrente: qualquer empresa em trial expirado fica bloqueada nas rotas de escrita mesmo com `plan_status='active'` — considerar UX/alerta de trial vencendo.
