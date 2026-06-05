# PROMPT (PLAN_ONLY / ESCALATE) — Runtime role least-privilege para RLS enforcement real

> **NÃO É FILA DE EXECUÇÃO.** Este arquivo é o `mission_source` da missão
> `runtime-role-least-privilege-rls-enforcement` (backlog, status `blocked/gated`).
> Só pode ser copiado para `.opencodex/queue/next-task.md` **após aprovação humana explícita +
> revisão de segurança**, e mesmo assim **somente em modo PLAN_ONLY** (planejar, não executar).
> Diagnóstico que originou esta missão: `docs/SECURITY-TENANT-ISOLATION.md`.

---
status: blocked
task_id: runtime-role-least-privilege-rls-enforcement
title: RLS enforcement real via role de runtime least-privilege (sem BYPASSRLS)
created_by: Claude Code
created_at: 2026-06-05
shell: powershell
mode: PLAN_ONLY
escalation: ESCALATE
requires_human_approval: true
requires_security_review: true
supersedes: fase1-b1b-rls-prod-activation
mission_source: docs/SECURITY-TENANT-ISOLATION.md
---

## MODEL CAPABILITY ASSESSMENT
- **Executor recomendado:** Big Pickle — **apenas para PLANEJAR**. Nenhuma execução de mudança.
- **Nível de risco:** **ALTO (blast radius máximo)** — a mudança real troca o role de runtime do app em
  produção e no CI. Por isso esta missão é **PLAN_ONLY**: o executor produz um plano e escala; **não** altera
  role, secret, banco, código de conexão, nem testes.
- **Modo de execução:** **PLAN_ONLY**. Qualquer passo que exija mudança real → **ESCALATE** ao humano.
- **Regra de escalonamento:** toca role/secret/`DATABASE_URL`/DDL/deploy → **PROIBIDO nesta missão**; só sai
  do plano para a execução após aprovação humana + revisão de segurança registradas na governança.
- **Justificativa:** a auditoria (Supabase MCP, read-only, 2026-06-05) provou que o runtime conecta como
  `postgres` (BYPASSRLS). RLS está ENABLE porém **inerte**. A correção é arquitetural e irreversível na prática
  sem janela controlada — não cabe a um executor autônomo decidir/aplicar.

## Contexto (por que esta missão existe)
- Isolamento de produção hoje = **100% filtros `company_id` na aplicação**. RLS é defesa-em-profundidade
  **não ativa** (BYPASSRLS ignora policies, inclusive FORCE).
- A missão anterior `fase1-b1b-rls-prod-activation` (ativar FORCE) foi **cancelada** — premissa inválida.
- A infra ALS (`config/database.js`, `requireCompany.js`, wrap de `pool.connect`) já está pronta e correta;
  ela passa a ser **efetiva** assim que o runtime deixar de ter BYPASSRLS.

## Entregáveis do PLANO (somente documento — nenhuma mudança aplicada)
Produzir um plano de implementação escrito (markdown) cobrindo:

1. **Decisão de role:** `authenticated` (existente, não-bypass) **vs.** criar `app_runtime` dedicado.
   Listar prós/contras de cada um no contexto Supabase (pooler, ownership, GRANTs, interações com PostgREST).
2. **Matriz de GRANTs:** quais privilégios (SELECT/INSERT/UPDATE/DELETE) em quais tabelas tenant o role
   runtime precisa. Confirmar que o role é **não-owner e não-bypass** (assim `ENABLE` basta; FORCE desnecessário).
3. **Tratamento de jobs cross-tenant** (cada um, explicitamente):
   - `backend/src/jobs/appointment-reminder-job.js` — varre `barber_appointments` sem GUC → sob role
     não-bypass retornaria 0 linhas. Plano: setar GUC por empresa (loop por company) **ou** rodar sob role
     admin controlado e auditado. Recomendar uma das duas com justificativa.
   - OutboxWorker e demais jobs background — auditar e classificar igual.
4. **Master admin** (`/api/master/*`) e **`service_role`** (bypass): definir o que continua bypass por design
   e o que migra para o role least-privilege.
5. **Pooler:** validar interação do novo role com o modo de pool (session vs. transaction) — risco de
   `SET LOCAL`/GUC não persistir em transaction mode.
6. **Plano de CI:** apontar `DATABASE_URL` do CI para o role não-bypass e ajustar
   `backend/tests/integration/tenant-isolation-rls.test.js` para conectar com ele. Critério de sucesso:
   suíte completa verde (alvo declarado: 32/32) com isolamento **realmente** aplicado.
7. **Rollout faseado** (staging → produção) com critérios de monitoramento (métricas B3) e **rollback**
   (reverter `DATABASE_URL` para `postgres` restaura o estado atual em segundos).
8. **Checklist de aprovação humana + revisão de segurança** que precisa ser satisfeito antes de qualquer
   execução.

## RESTRIÇÕES INVIOLÁVEIS (não negociáveis nesta missão)
- ❌ **NÃO** fazer deploy.
- ❌ **NÃO** criar/alterar role, GRANT, ou qualquer DDL.
- ❌ **NÃO** trocar `DATABASE_URL`/secret (prod ou CI).
- ❌ **NÃO** apontar testes para o Supabase de produção (`.env` é produção; há `guardAgainstProduction`).
- ❌ **NÃO** alterar código de conexão (`config/database.js`) nem os jobs.
- ✅ **APENAS** produzir o documento de plano e **ESCALAR** ao humano.

## Critério de conclusão da missão (PLAN_ONLY)
- Documento de plano completo entregue (8 seções acima).
- Nenhuma alteração de código/infra/DB no diff além do próprio documento de plano.
- Escalonamento explícito: "pronto para revisão de segurança + aprovação humana".
