# 📥 NEXT TASK — Fila de Execução OpenCode

> Escrito pelo **Claude Code**. Lido e executado pelo **OpenCode Executor** via `/next-task`.
> Fluxo oficial: `docs/runbooks/prompt-orchestration-flow.md`.

---
status: pending
task_id: gov-reconcile-functional-to-main
title: Governança — Reconciliar trabalho funcional (fase2/wa-reminder) com a governança em main (merge conflito-zero)
created_by: Claude Code
created_at: 2026-06-04
origin_audit: BRANCH RECONCILIATION AUDIT (INSPECTION_ONLY, 2026-06-04) — SAFE_TO_RECONCILE
---

## MODEL CAPABILITY ASSESSMENT
- Executor recomendado: Big Pickle, **MAS** com **confirmação humana obrigatória** nos passos que tocam `main`/`origin`.
- Nível de risco: **Médio** — operação puramente git (sem código). Conflito de conteúdo = **nulo** (overlap vazio,
  verificado na auditoria). Risco real é de processo (atualizar `main` errado / push indevido).
- Justificativa: `fase2/wa-reminder` (`545282d`) é o **tip funcional completo** (contém B1/B2/B3/B4/frontend/billing/
  WhatsApp/lembrete). A branch atual já tem a **governança completa**. Os conjuntos de arquivos são **disjuntos**.
- Regra de escalonamento: toca `main` → **auditoria/decisão final do Claude obrigatória**; push a `origin` só com humano.
- Modo de execução: **EXECUTE_WITH_REVIEW**

## Contexto (por que esta missão existe)
A auditoria de reconciliação concluiu **SAFE_TO_RECONCILE**:
- `fase2/wa-reminder` contém TODO o stack funcional linear (B1`0a85929` ⊂ B2 ⊂ B4 ⊂ B3 ⊂ frontend ⊂ billing ⊂ reminder).
- `main`/branch atual têm a **governança** (`.opencodex/`, `.opencode/`, `docs/runbooks`, `docs/*`, `.agent/*`).
- **Overlap de arquivos governança × funcional = VAZIO** → merge sem conflito.
- Condição R1 **RESOLVIDA**: o commit de segurança `4071952` (enforce `company_id` on create) **já está coberto**
  em wa-reminder (idêntico) → `fase-1/estabilizacao` é superseded, **fica de fora** sem perda.
- Hoje o funcional **não está em `main` nem na branch atual** → o gate `pool.connect` não pode rodar. Esta missão destrava.

## Estratégia "à prova de perda" (sem trocar de branch)
Trabalhar **na branch atual** (`fase1/b1b-gate-poolconnect`, que já tem a governança). Merge do funcional aqui,
testar, e só então avançar `main` por FF. Nenhum `checkout`/troca de branch.

## Missão (sequência EXATA)
1. **Pré-checagem (abortar se falhar):**
   ```bash
   git status --short                  # deve estar limpo (só ?? docs/private/)
   git branch --show-current           # deve ser fase1/b1b-gate-poolconnect
   git merge-base --is-ancestor 0a85929 fase2/wa-reminder && echo OK-B1-em-wa-reminder
   ```
2. **Merge do funcional na branch atual (conflito-zero esperado):**
   ```bash
   git merge --no-ff fase2/wa-reminder -m "merge(reconcile): consolidar funcional (Fase 1 + billing + WhatsApp + lembrete) sob governança"
   ```
   - Se **qualquer conflito** aparecer → `git merge --abort` e **PARE/reporte** (a auditoria previu zero; conflito = anomalia).
3. **Bateria de testes obrigatória** (ver seção própria). Se algo falhar → **PARE e reporte** (não avançar `main`).
4. **Verificações manuais pós-merge:**
   - Quarentena Fase C intacta: `grep -n "// outboxWorker.register('sale.created" backend/src/server.js` (deve achar 2 comentadas).
   - RLS **sem FORCE**: `activate_rls.sql` não é executado em lugar nenhum.
   - `git status` limpo; nenhum `.opencodex/` antigo reintroduzido/sobrescrito.
5. **Avançar `main` por FF (sem checkout) — APÓS testes verdes e confirmação humana:**
   ```bash
   git log --oneline HEAD..main      # deve ser VAZIO (FF garantido)
   git push . HEAD:main              # FF do main local; NÃO troca de branch
   ```
6. **PARAR.** Não fazer push para `origin`, não deletar branches.

## ✅ ALLOWLIST (git/estado — esta é uma missão de governança, não de código)
- Operações git: `merge --no-ff fase2/wa-reminder` na branch atual; `git push . HEAD:main` (FF local).
- Atualizar `.opencodex/queue/current-task.md` / `completed-task.md` (registro do resultado).
- **NÃO** editar código de backend/frontend (o conteúdo vem pronto do merge).

## ❌ ESCOPO PROIBIDO
- ❌ **NÃO** trocar de branch (`checkout`), **NÃO** `git stash`, **NÃO** `git clean`.
- ❌ **NÃO** push para `origin` (nem `main`, nem nada) — fica para decisão humana.
- ❌ **NÃO** deletar nem renomear nenhuma branch (`principal`, `backup/*`, `fase1/*`, `estabilizacao`).
- ❌ **NÃO** incluir `fase-1/estabilizacao` (superseded; R1 já coberto).
- ❌ **NÃO** ativar FORCE RLS, **NÃO** reativar Fase C (`sale.created`).
- ❌ **NÃO** resolver conflito "na marra": se houver conflito, `merge --abort` e reporte.
- ❌ **NÃO** rebase, **NÃO** `--force`, **NÃO** reescrever histórico.

## 🛑 HARD STOP RULES
1. Se `git status` não estiver limpo (fora `docs/private/`) na pré-checagem → **PARE**.
2. Se a branch atual não for `fase1/b1b-gate-poolconnect` → **PARE** (não trocar de branch).
3. Se o merge gerar **qualquer** conflito → `git merge --abort` + **PARE/reporte** (anomalia vs auditoria).
4. Se **qualquer** teste falhar → **PARE**, não avançar `main`.
5. O passo `git push . HEAD:main` exige **confirmação humana**; sem ela, parar antes dele e reportar pronto-para-FF.

## Critérios de aceite
- [ ] Merge `--no-ff` de `fase2/wa-reminder` na branch atual **sem conflito**.
- [ ] Suíte de testes **verde** pós-merge (ver abaixo).
- [ ] Quarentena Fase C intacta; FORCE RLS não ativado.
- [ ] `main` avançado por **FF** para o tip integrado (após confirmação) — OU deixado "pronto-para-FF" reportado.
- [ ] Nenhuma branch deletada; `origin` não tocado; `estabilizacao` fora.
- [ ] `completed-task.md` preenchido com hashes (merge commit + main).

## Testes obrigatórios (pós-merge, ANTES de avançar main)
```bash
cd backend && npx jest tests/unit/ --no-coverage --silent      # esperado ~676+ verdes
cd backend && npx jest --no-coverage --silent                   # suíte completa (integração skip sem DB)
node --check backend/src/server.js                              # sanidade do entrypoint
cd frontend && npm run build                                    # build do frontend OK
```

## Estratégia de rollback
- Antes de `git push . HEAD:main`, **nada em `main` mudou** → rollback do merge na branch atual:
  `git reset --hard ORIG_HEAD` (ou `4c42534`). Branches funcionais intactas.
- Após o FF de `main`: como não houve push a `origin`, reverter `main` local é seguro
  (`git push . 4c42534:main --force-with-lease` apenas se necessário e com confirmação) — preferir não chegar aqui sem testes verdes.

## Instruções para o OpenCode Executor
1. Ler este `next-task.md` na íntegra.
2. Espelhar para `current-task.md` (`status: running`). **NÃO criar branch nova** (trabalha na atual).
3. Executar a sequência EXATA (pré-checagem → merge → testes → verificações → **parar antes do FF de main**).
4. `/complete-task`: registrar resultado (merge commit, testes, estado "pronto-para-FF" ou FF feito).
5. **EXECUTE_WITH_REVIEW**: `/audit-task` + devolver ao Claude Code. O FF de `main` e qualquer push a `origin`
   só ocorrem com **confirmação humana**.

> ⚠️ Histórico: o executor já causou um `git clean` que apagou governança. Esta missão é **git-sensível** →
> seguir a allowlist git à risca; na dúvida, **PARAR e reportar** em vez de improvisar.
