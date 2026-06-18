# ✅ MISSÃO CONCLUÍDA — BACKUP-RESTORE-CHECK (GATE PASSOU 2026-06-18)

> **Promovido em 2026-06-15.** Fechar gate operacional de backup/restore antes de qualquer
> E2E, criação de dados reais, notificações reais ou data-fix.
> **Gate encerrado em 2026-06-18** com aprovação humana explícita. Missões bloqueadas desbloqueadas.

---
status: completed
task_id: backup-restore-check
phase: governance-infra
title: Verificar/testar restore de backup do Supabase (P0 — GATE PASSOU 2026-06-18)
mode: GATE_PASSED
priority: P0
requires_human_approval: true
created_by: Claude Code
created_at: 2026-06-15
completed_at: 2026-06-18
blocks:
  - e2e-public-booking-validation
  - fase-c-integracao-e-testes
  - ops/reconcile-failed-sale-created-outbox
  - security-secrets-rotation
  - OPS-SUPAVISOR
standing_alert: >-
  GATE PASSOU (2026-06-18). Dump-only executado (Fase 1). Restore evidenciado via MCP read-only
  (Fase 2 — lacuna de log aceita por decisão humana). Missões desbloqueadas. Tarefa encerrada.
---

## Diagnóstico inicial — histórico 2026-06-15

> Condição no momento da abertura da missão. Preservado como registro histórico.

| Item                          | Estado em 2026-06-15                    |
| ----------------------------- | --------------------------------------- |
| Plano Supabase                | **Free**                                |
| Backup diário automático      | ❌ NÃO EXISTIA                           |
| PITR (Point-in-Time Recovery) | ❌ NÃO DISPONÍVEL                        |
| pg_dump manual                | ❌ NUNCA EXECUTADO                       |
| Supabase Branches             | ❌ NENHUMA                               |
| Off-site backup               | ❌ NÃO EXISTIA                           |
| **RPO**                       | ♾️ Infinito (desde criação: 2026-04-20) |

**Risco original:** 🚨 perda total de dados em caso de corrupção, erro humano ou incidente. Sem backup, sem restore possível.

## Estado atual — pós-Fase 1 dump-only (2026-06-18)

| Item                             | Estado                                               |
| -------------------------------- | ---------------------------------------------------- |
| Backup dump-only                 | ✅ executado (2026-06-18T07:39:26Z)                   |
| Dump gerado                      | ✅ `principal-2026-06-18T07-39-26-586Z.dump` (650 kB) |
| Dump legível (header PGDMP)      | ✅ verificado                                         |
| Log JSON criado                  | ✅ `last-status.json` status=OK, exit_code=0          |
| Baseline registrado              | ✅ public_tables=55 · policies=45 · rls_on/off=37/18  |
| Task diária registrada           | ✅ `MultGestor-Backup-Daily` 02:00 (dump-only)        |
| **RPO**                          | **~24 h**                                            |
| Restore executado                | ❌ não executado (Fase 2, human-gated)                |
| `BRCHK_TARGET_DB_URL` definido   | ❌ não definido (correto para Fase 1)                 |
| Validação backup/restore completa | ❌ pendente — E2E e data-fix permanecem bloqueados   |
| Fase 2 restore                   | ⛔ human-gated · PLAN_ONLY · sem data definida        |
| Atrito operacional documentado   | ✅ runbook §7 Troubleshooting Windows PowerShell adicionado (2026-06-18) |

## Objetivo
1. [x] Executar `pg_dump` da produção — **Fase 1 dump-only concluída (2026-06-18). Ver resultado abaixo.**
2. [ ] Restore em projeto Supabase Free descartável (validar dump) — **PENDENTE, human-gated (Fase 2)**
3. [x] Documentar RPO/RTO real e plano de backup recorrente — [`../brain/runbooks/backup-restore-plan.md`](../brain/runbooks/backup-restore-plan.md)
4. [ ] Só então desbloquear E2E, data-fix e demais missões — **bloqueado até Fase 2 aprovada**

## Fase 1 — resultado da execução manual (2026-06-18)

```
Executor:          humano (Windows, run-backup.ps1 manual)
Modo:              dump-only (sem restore, sem BRCHK_TARGET_DB_URL)
Data/hora:         2026-06-18T07:39:26.586Z
Dump:              principal-2026-06-18T07-39-26-586Z.dump (650 645 bytes)
Log:               backup-restore-check-2026-06-18T07-39-26-586Z.json
last-status.json:  status=OK, exit_code=0
Baseline:          public_tables=55  policies=45  rls_on/off=37/18
Restore:           NÃO executado
Target DB:         não definido
Task diária:       registrada (MultGestor-Backup-Daily, 02:00, dump-only)
RPO anterior:      ♾️ (infinito)
RPO atual:         ~24 h
```

> **Nota operacional:** durante a execução houve erros de copy/paste no PowerShell
> (prompts `PS C:\...>` e `>>` colados como comandos). Não afetaram o backup.
> Correção documentada no runbook §7.
>
> **Nota sobre RPO:** rotina recorrente de backup/RPO ~24h ainda não comprovada por
> execução agendada observada. Até validação do scheduler, considerar backup como
> procedimento manual validado.
>
> Arquivos locais — NÃO versionados: `.mg-backup\brchk.env`, `backups\daily\*.dump`, `backups\logs\*.json`.

## Restrições (PLAN_ONLY)
- ❌ Sem restore ainda · ❌ sem tocar banco de produção
- ❌ Sem alterar secrets · ❌ sem deploy · ❌ sem push · ❌ sem merge
- ❌ Sem tocar backend · ❌ sem tocar frontend · ❌ sem migrations
- ❌ Sem SQL de escrita · ❌ sem alterar código

---

## 🔒 Próxima na fila (BLOQUEADA) — só depois do plano de backup aprovado
- **Missão:** Fase C — Integração de Negócio + Testes de Integração Reais (`fase-c-integracao-e-testes`).
- **Bloqueio:** ⛔ BLOQUEADA por `backup-restore-check`. **Só sai do bloqueio depois do PLANO DE BACKUP
  APROVADO** (backup verificado + restore testado + aprovação humana). Liga `sale.created` a múltiplos
  handlers e credita dados reais (loyalty + package) — sem restore confirmado, um erro fica sem recuperação.
- **Card completo:** em [`backlog.md`](backlog.md). Missões bloqueadas vivem no backlog, **nunca** aqui no
  slot executável (CHECK 3 do preflight só roda `status: pending`). Esta seção é apenas um ponteiro de ordem.

## 🔒 Demais missões bloqueadas pelo gate de backup
- **Validação E2E** (`e2e-public-booking-validation`) — bloqueada até backup/restore confirmado.
- **Data-fix outbox** (`ops/reconcile-failed-sale-created-outbox`) — bloqueado até backup/restore confirmado.
- **Fase C Integração** (`fase-c-integracao-e-testes`) — bloqueada até plano de backup aprovado.
