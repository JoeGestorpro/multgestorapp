# 📥 NEXT TASK — BACKUP-RESTORE-CHECK 🟢 P0 ATIVO

> **Promovido em 2026-06-15.** Fechar gate operacional de backup/restore antes de qualquer
> E2E, criação de dados reais, notificações reais ou data-fix.
> **Mode: PLAN_ONLY** — leitura, diagnóstico e plano. Sem restore ainda. Sem tocar banco.

---
status: pending
task_id: backup-restore-check
phase: governance-infra
title: Verificar/testar restore de backup do Supabase (P0 — bloqueia E2E, data-fix e demais missões)
mode: PLAN_ONLY
priority: P0
requires_human_approval: true
created_by: Claude Code
created_at: 2026-06-15
blocks:
  - e2e-public-booking-validation
  - ops/reconcile-failed-sale-created-outbox
  - security-secrets-rotation
  - OPS-SUPAVISOR
standing_alert: >-
  NENHUM backup automático existe (plano Free). NENHUM dump manual foi executado.
  Risco de perda total de dados. NÃO executar restore real sem nova aprovação.
---

## Diagnóstico inicial (PLAN_ONLY — 2026-06-15)

| Item | Estado |
|---|---|
| Plano Supabase | **Free** |
| Backup diário automático | ❌ **NÃO EXISTE** |
| PITR (Point-in-Time Recovery) | ❌ **NÃO DISPONÍVEL** |
| pg_dump manual | ❌ **NUNCA EXECUTADO** |
| Supabase Branches | ❌ **NENHUMA** |
| Off-site backup | ❌ **NÃO EXISTE** |
| **RPO atual** | ♾️ Infinito (desde criação: 2026-04-20) |

## Risco
🚨 **PERDA TOTAL DE DADOS** em caso de corrupção, erro humano ou incidente.
Sem backup, sem restore possível.

## Objetivo
1. [ ] Executar `pg_dump` da produção (dump de segurança)
2. [ ] Restore em projeto Supabase Free descartável (validar dump)
3. [ ] Documentar RPO/RTO real e plano de backup recorrente
4. [ ] Só então desbloquear E2E, data-fix e demais missões

## Restrições (PLAN_ONLY)
- ❌ Sem restore ainda · ❌ sem tocar banco de produção
- ❌ Sem alterar secrets · ❌ sem deploy · ❌ sem push · ❌ sem merge
- ❌ Sem tocar backend · ❌ sem tocar frontend · ❌ sem migrations
- ❌ Sem SQL de escrita · ❌ sem alterar código
