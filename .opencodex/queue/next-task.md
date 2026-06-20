# 📥 PRÓXIMA MISSÃO — OPS/BACKUP-EXTERNAL-COPY 🟡 IMPLEMENTAÇÃO ENTREGUE · VALIDAÇÃO EXTERNA PENDENTE

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
execution_state: >-
  Implementação entregue; validação externa pendente. Scripts feature-flagged commitados
  (66ee852): upload-external.ps1 criado + run-backup.ps1 integrado; BRCHK_EXTERNAL_ENABLED=0
  (OFF) por padrão. Bucket B2 + application key criados pelo humano; brchk.env preenchido
  off-repo (flag OFF). Nenhum upload/API call/secret no repositório. PENDENTE: upload real de
  teste (gate 6) e ativação de BRCHK_EXTERNAL_ENABLED=1 (gate 7). status=pending até gates 6/7.
origem_evidencia: A-002 (auditoria-completa-2026-06-18 §10) + Roadmap Mestre §19
standing_alert: >-
  Código/scripts entregues (feature-flagged, flag OFF). Restrições ainda válidas:
  NÃO fazer upload real, NÃO virar BRCHK_EXTERNAL_ENABLED=1, NÃO mexer em secrets/brchk.env,
  NÃO criar/alterar bucket, NÃO fazer push/deploy sem autorização humana explícita.
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
- [x] Criar bucket B2 + application key (humano) — ✅ FEITO 2026-06-19 (runbook §10.7)
- [x] Popular `brchk.env` off-repo com vars B2 (`BRCHK_EXTERNAL_ENABLED=0`) — ✅ FEITO 2026-06-19
- [x] Autorizar escrita dos scripts feature-flagged — ✅ FEITO (commit 66ee852)
- [ ] Autorizar upload real de teste (gate 6) — ⏳ PENDENTE
- [ ] Virar `BRCHK_EXTERNAL_ENABLED=1` (gate 7) — ⏳ PENDENTE

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

## Restrições invioláveis (fase atual = validação externa pendente)

- ❌ NÃO fazer upload real sem autorização humana (gate 6)
- ❌ NÃO virar `BRCHK_EXTERNAL_ENABLED=1` sem autorização humana (gate 7)
- ❌ NÃO mexer em secrets / `brchk.env` / bucket / application key
- ❌ NÃO push, merge, deploy

## Próximas na fila (ordem aprovada — Roadmap Mestre §20)

1. 🟡 **`ops/backup-external-copy`** (atual — `status: pending`; implementação entregue, validação externa pendente: upload real de teste + ativar flag)
2. ⏳ `security/rls-companies-users-policy` — policies companies + users (A-001)
3. ⏳ `infra/redis-production-config` — Redis em produção (A-004)
4. ⏳ `cicd/migrations-fail-fast` — 🔴 BLOQUEADO por OPS-SUPAVISOR (A-005)
