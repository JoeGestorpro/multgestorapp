# 📥 PRÓXIMA MISSÃO — OPS/BACKUP-EXTERNAL-COPY 🔵 PENDENTE

> **Promovido em 2026-06-18** (aprovação humana — promoção limpa da fila, escopo governança/documentação).
> Adicionar cópia automática do dump diário para destino externo (cloud), eliminando o
> single point of failure local. **NÃO INICIAR EXECUÇÃO** sem autorização humana explícita.

---
status: pending
task_id: ops/backup-external-copy
title: Cópia externa/cloud automática do dump diário (eliminar single point of failure local)
type: ops-infra
priority: P1
camada: 1 — Fundação segura
mode: PLAN_ONLY
created_by: Claude Code
created_at: 2026-06-18
promoted_at: 2026-06-18
promoted_by: Claude Code (aprovação humana — "promoção limpa da fila")
requires_human_approval: true
requires_human_action: true
provider: backblaze-b2
provider_decision: RESOLVED (2026-06-18) — Backblaze B2 escolhido (10GB grátis, S3-compat sem OAuth)
plan_source: .opencodex/brain/runbooks/backup-restore-plan.md §10 (checklists, env vars, integração, schema)
execution_state: NÃO EXECUTADA — nenhum bucket/key/secret/upload criado; aguarda gates humanos
origem_evidencia: A-002 (auditoria-completa-2026-06-18 §10) + Roadmap Mestre §19
standing_alert: >-
  Card de planejamento. NÃO criar cloud storage, NÃO mexer em secrets, NÃO alterar
  scripts de backup, NÃO rodar comandos operacionais, NÃO fazer push até autorização
  humana explícita de execução. Esta promoção é apenas sincronização de fila.
---

## Contexto

A auditoria 2026-06-18 (§10, achado A-002) confirmou: backup diário **funcional** mas
**apenas local** em `C:\MultGestor.v2\ops\backup\` (na verdade `C:\Users\Joefe\backups\` —
ver env file off-repo). Todos os 7 dumps de retenção ficam no mesmo HD. Risco P1:
perda do HD/computador = perda de **todos** os backups.

Estado verificado da base de backup (já funcionando):
- Scheduler `MultGestor-Backup-Daily` — `State=Ready`, `NextRunTime=2026-06-19 02:00`
- `last-status.json`: `exit_code=0`, `status=OK`, dump 635KB (2026-06-18T03:39)
- Retenção: 7 dumps; guard dump-only ativo (`BRCHK_TARGET_DB_URL` removido)

## Objetivo

Adicionar um passo de **upload externo** ao fluxo de backup já existente, de forma que
cada dump diário também seja copiado para um destino off-site (cloud), com verificação
de integridade. Sem alterar a lógica de dump/restore atual.

## Por que vem agora (Roadmap Mestre §19, Camada 1)

Maior redução de risco catastrófico com menor blast radius. O backup local já funciona —
falta apenas redundância off-site. É a primeira missão da Fundação Segura porque protege
o ativo mais crítico (dados) antes de qualquer investimento em produto/receita.

## Arquivos permitidos (quando autorizado a executar)

- `ops/backup/run-backup.ps1` (adicionar chamada ao passo de upload)
- `ops/backup/upload-external.ps1` (novo — script de upload)
- `.opencodex/brain/runbooks/backup-restore-plan.md` (documentar cópia externa + RPO/RTO)

> ❌ Nenhum arquivo de código de aplicação (backend/frontend/migrations).

## Ambiente

Local Windows + provedor cloud a definir (Google Drive API / S3 / Backblaze).
Credenciais **somente** em env file off-repo (padrão `brchk.env`, fora do repositório).

## Gate de entrada

- [x] Backup diário local OK (`last-status.json` exit_code=0) — já satisfeito
- [x] **Decisão humana do provedor cloud** — ✅ RESOLVIDO 2026-06-18: **Backblaze B2**
- [ ] Gates humanos pendentes (ver runbook §10.7): criar bucket → criar app key → popular `brchk.env` → autorizar escrita de scripts → autorizar upload real → virar `BRCHK_EXTERNAL_ENABLED=1`
- [ ] Autorização humana explícita para iniciar execução (este card é PLAN_ONLY)

> 📄 Plano completo (checklists de bucket/key, env vars com placeholders, plano de integração feature-flagged,
> schema `external_upload`) persistido em [`../brain/runbooks/backup-restore-plan.md`](../brain/runbooks/backup-restore-plan.md) §10.

## Critério de aceite

- [ ] Dump diário copiado automaticamente para destino externo após cada execução
- [ ] Verificação de integridade pós-upload (checksum local == remoto)
- [ ] `last-status.json` registra status do upload externo (sucesso/falha)
- [ ] Nenhum secret exposto em log ou no repositório

## Critério de rollback

Desabilitar o passo de upload no `run-backup.ps1` → backup local permanece intacto
(operação não-destrutiva por design; o estado atual já é "só local").

## Evidências obrigatórias (no fechamento)

- Log de upload bem-sucedido
- Listagem do arquivo no destino externo
- Checksum local == remoto
- `last-status.json` com campo de status externo

## Restrições invioláveis (fase atual = planejamento)

- ❌ NÃO criar cloud storage agora
- ❌ NÃO mexer em secrets / env file
- ❌ NÃO alterar scripts de backup agora
- ❌ NÃO rodar comandos operacionais
- ❌ NÃO push, merge, deploy

## Próximas na fila (ordem aprovada — Roadmap Mestre §20)

1. 🔵 **`ops/backup-external-copy`** (atual — pending, aguarda autorização de execução)
2. ⏳ `security/rls-companies-users-policy` — policies companies + users (A-001)
3. ⏳ `infra/redis-production-config` — Redis em produção (A-004)
4. ⏳ `cicd/migrations-fail-fast` — 🔴 BLOQUEADO por OPS-SUPAVISOR (A-005)
