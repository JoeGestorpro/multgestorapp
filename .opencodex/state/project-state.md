# 📌 Project State (V2) — ⛔ SUPERSEDED por `.opencodex/brain/project-state.md`

> 🔴 **OBSOLETO desde 2026-06-07.** Este arquivo (congelado em 06-04) foi substituído pelo Segundo Cérebro V3.
> **Fonte oficial de estado:** [`.opencodex/brain/project-state.md`](../brain/project-state.md).
> Mantido apenas como histórico — **NÃO usar como fonte atual** (campos abaixo estão desatualizados).

> Ponto de entrada **enxuto** para o Cloud Code/Claude reduzir leitura de múltiplos arquivos.
> **NÃO é fonte da verdade** de implementação — apenas um índice de estado.
> Fonte operacional = arquivos da fila `.opencodex/queue/`. Fonte estratégica = `docs/` + `.agent/`.
> Verificado contra o repo em 2026-06-04 (valores reais preenchidos; caminho do audit corrigido).

```yaml
project: MultGestor v2
state_version: 1

current_phase: "governance-hardening"
# branch de trabalho real (não é a principal). main local = c66a2d7.
active_branch: "fase1/b1b-gate-poolconnect"
principal_branch: "main"
principal_branch_commit: "c66a2d7"

queue:
  active_task_file: ".opencodex/queue/next-task.md"
  backlog_file: ".opencodex/queue/backlog.md"
  completed_task_file: ".opencodex/queue/completed-task.md"
  # CORRIGIDO: o audit fica em audits/, não em queue/
  latest_audit_file: ".opencodex/audits/latest-audit.md"
  preflight_file: ".opencodex/templates/preflight-check.md"

active_task:
  task_id: "fase1-b1b-gate-poolconnect-tenant-context"
  status: "pending"            # em next-task.md (NÃO promovido/executado)
  mode: "EXECUTE_WITH_REVIEW"
  caveat: >-
    Dependência de CÓDIGO ausente: o gate estende o binding ALS do B1 (0a85929),
    que NÃO está nesta branch nem em main. Não rodar /next-task até reconciliar o funcional.

last_known_status:
  last_approved_task: "fase2-wa-reminder"      # APPROVE (reconciliado por Claude)
  last_completed_task: "fase2-wa-reminder"
  last_audit_status: "APPROVE"                 # latest-audit.md status: decided
  last_commit: "c66a2d7"                       # HEAD (governança/docs)
  last_mission_commit: "545282d"               # último commit funcional (lembrete WhatsApp)

phase1_blindagem:                              # COMPLETA (commits nas feature branches)
  b3_observability: "APPROVE 1348df3"
  b4_redis_rate_limit: "APPROVE e532285"
  b2_outbox_idempotency: "APPROVE e137217"
  b1_rls_foundation: "APPROVE 0a85929"

blocked_tasks:
  source: ".opencodex/queue/backlog.md"
  rule: "Backlog tasks remain blocked until their dependency is audited and approved."
  notable:
    - "fase1-b1b-rls-prod-activation (gated; depende do gate pool.connect)"
    - "fase-c-integracao-e-testes (desbloqueada por B2, EM ESPERA; gate break-vs-continue)"

execution_rules:
  one_mission_at_a_time: true
  executor_reads_only_next_task: true
  auditor_reads_completed_task_and_diff: true
  cloud_code_promotes_only_after_approval: true
  pre_check_required_before_next_task: true
  never_git_clean_stash_or_auto_switch_branch: true

context_policy:
  purpose: "Reduce token usage by providing a single compact state entrypoint."
  cloud_code_should_read_first:
    - ".opencodex/state/project-state.md"
    - ".opencodex/queue/next-task.md"
    - ".opencodex/audits/latest-audit.md"
  avoid_full_project_scan_unless_needed: true
  strategic_state_refs:
    - ".agent/memory/current-state.md"     # estado amplo de IA (não duplicar aqui)
    - "docs/capabilities-map.md"
    - "docs/runbooks/prompt-orchestration-flow.md"

open_risks:
  - id: "R-FUNC-NOT-IN-MAIN"
    severity: "alto"
    desc: >-
      Nenhum commit funcional (B1/B2/B3/B4/lembrete) está em main nem na branch atual;
      vivem só nas feature branches (fase1/b1-rls-foundation, fase2/wa-reminder, ...).
      Risco de perda se as branches forem apagadas; bloqueia execução do gate.
    safe_action: "Reconciliar funcional em main (merge/rebase encadeado) ANTES de novas missões de código."
  - id: "R-GOV-ONLY-LOCAL"
    severity: "médio"
    desc: "Governança (ce034ae, c7d97fd, c66a2d7) está em main LOCAL; não foi push para origin."
    safe_action: "git push origin main (ação externa — confirmar)."
  - id: "R-DOCS-LOST"
    severity: "médio"
    desc: "Runbooks Fase A/B + WhatsApp/billing e vários .opencode/command perdidos no git clean (untracked)."
    safe_action: "Reconstruir sob demanda; .opencodex/ agora é rastreada."

next_recommended_action: >-
  Reconciliar o trabalho funcional em main (R-FUNC-NOT-IN-MAIN) e rodar o PREFLIGHT
  antes de gerar/promover a próxima missão. NÃO rodar /next-task até o B1 estar na branch.

notes:
  - "This file is a compact state index, not the source of truth for implementation."
  - "Queue files remain the operational source of truth."
  - "Architecture docs remain the strategic source of truth."
  - "Manter atualizado pelo Claude Code a cada decisão/promoção (incrementar state_version em mudanças estruturais)."
```
