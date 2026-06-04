# 📥 NEXT TASK — Fila de Execução OpenCode

> Escrito pelo **Claude Code**. Lido e executado pelo **OpenCode Executor** via `/next-task`.
> Fluxo oficial: `docs/runbooks/prompt-orchestration-flow.md`.
> **Ambiente oficial: Windows + PowerShell.** Todos os comandos abaixo são PowerShell puro
> (sem `grep`/`head`/`tail`/`sed`/`awk`/`xargs`/here-doc). Ver `.opencodex/templates/preflight-check.md`.

---
status: pending
task_id: gov-reconcile-functional-to-main
title: Governança — Reconciliar trabalho funcional (fase2/wa-reminder) com a governança em main (merge conflito-zero)
created_by: Claude Code
created_at: 2026-06-04
shell: powershell
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

## Missão (sequência EXATA — PowerShell)
1. **Pré-checagem (abortar se falhar):**
   ```powershell
   git status --short                 # deve estar limpo (somente: ?? docs/private/)
   git branch --show-current          # deve ser: fase1/b1b-gate-poolconnect
   git merge-base --is-ancestor 0a85929 fase2/wa-reminder
   if ($LASTEXITCODE -eq 0) { "OK: B1 contido em wa-reminder" } else { "ABORTAR: B1 nao contido"; }
   ```
2. **Merge do funcional na branch atual (conflito-zero esperado):**
   ```powershell
   git merge --no-ff fase2/wa-reminder -m "merge(reconcile): consolidar funcional (Fase 1 + billing + WhatsApp + lembrete) sob governanca"
   ```
   - Se **qualquer conflito** aparecer → `git merge --abort` e **PARE/reporte** (a auditoria previu zero; conflito = anomalia).
3. **Bateria de testes obrigatória** (ver seção própria). Se algo falhar → **PARE e reporte** (não avançar `main`).
4. **Verificações manuais pós-merge (PowerShell):**
   ```powershell
   # Quarentena Fase C intacta — deve retornar 2 linhas COMENTADAS:
   Select-String -SimpleMatch "// outboxWorker.register('sale.created" backend\src\server.js
   # RLS sem FORCE — activate_rls.sql NAO deve ser executado em lugar nenhum (apenas conferir que existe, nao rodar):
   Test-Path backend\src\database\activate_rls.sql
   git status --short                 # limpo; nenhum .opencodex/ antigo reintroduzido
   ```
5. **Avançar `main` por FF (sem checkout) — APÓS testes verdes e confirmação humana:**
   ```powershell
   git log --oneline HEAD..main       # deve sair VAZIO (FF garantido)
   git push . HEAD:main               # FF do main local; NAO troca de branch
   ```
6. **PARAR.** Não fazer push para `origin`, não deletar branches.

## ✅ ALLOWLIST (git/estado — esta é uma missão de governança, não de código)
- Operações git: `merge --no-ff fase2/wa-reminder` na branch atual; `git push . HEAD:main` (FF local).
- Atualizar `.opencodex/queue/current-task.md` / `completed-task.md` (registro do resultado) via `Set-Content`/`Add-Content`.
- **NÃO** editar código de backend/frontend (o conteúdo vem pronto do merge).

## ❌ ESCOPO PROIBIDO
- ❌ **NÃO** trocar de branch (`git checkout`), **NÃO** `git stash`, **NÃO** `git clean`.
- ❌ **NÃO** push para `origin` (nem `main`, nem nada) — fica para decisão humana.
- ❌ **NÃO** deletar nem renomear nenhuma branch (`principal`, `backup/*`, `fase1/*`, `estabilizacao`).
- ❌ **NÃO** incluir `fase-1/estabilizacao` (superseded; R1 já coberto).
- ❌ **NÃO** ativar FORCE RLS, **NÃO** reativar Fase C (`sale.created`).
- ❌ **NÃO** resolver conflito "na marra": se houver conflito, `git merge --abort` e reporte.
- ❌ **NÃO** rebase, **NÃO** `--force`, **NÃO** reescrever histórico.
- ❌ **NÃO** usar comandos Unix (`grep`/`head`/`tail`/`sed`/`awk`/`xargs`/here-doc) — ambiente é PowerShell.

## 🛑 HARD STOP RULES
1. Se `git status --short` não estiver limpo (fora `docs/private/`) na pré-checagem → **PARE**.
2. Se `git branch --show-current` não for `fase1/b1b-gate-poolconnect` → **PARE** (não trocar de branch).
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

## Testes obrigatórios (pós-merge, ANTES de avançar main) — PowerShell
```powershell
Set-Location backend
npx jest tests/unit/ --no-coverage --silent      # esperado ~676+ verdes
npx jest --no-coverage --silent                   # suite completa (integração skip sem DB)
node --check src/server.js                         # sanidade do entrypoint
Set-Location ..\frontend
npm run build                                      # build do frontend OK
Set-Location ..
```

## Estratégia de rollback (PowerShell)
- Antes de `git push . HEAD:main`, **nada em `main` mudou** → desfazer o merge na branch atual:
  ```powershell
  git reset --hard ORIG_HEAD          # ou: git reset --hard 4c42534
  ```
  Branches funcionais permanecem intactas.
- Após o FF de `main` (só se necessário e com confirmação; não chegar aqui sem testes verdes):
  ```powershell
  git push . 4c42534:main --force-with-lease
  ```

## Instruções para o OpenCode Executor
1. Ler este `next-task.md` na íntegra.
2. Espelhar para `current-task.md` (`status: running`). **NÃO criar branch nova** (trabalha na atual).
3. Executar a sequência EXATA (pré-checagem → merge → testes → verificações → **parar antes do FF de main**).
4. `/complete-task`: registrar resultado (merge commit, testes, estado "pronto-para-FF" ou FF feito).
5. **EXECUTE_WITH_REVIEW**: `/audit-task` + devolver ao Claude Code. O FF de `main` e qualquer push a `origin`
   só ocorrem com **confirmação humana**.

> ⚠️ Histórico: o executor já causou um `git clean` que apagou governança. Esta missão é **git-sensível** →
> seguir a allowlist git à risca; na dúvida, **PARAR e reportar** em vez de improvisar.
> ⚠️ **Ambiente Windows + PowerShell** — não traduzir para Bash; usar os comandos PowerShell deste card.
