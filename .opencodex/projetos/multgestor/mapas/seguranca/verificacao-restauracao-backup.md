---
tipo: componente
area: seguranca
status: parcial
progresso: 70
criticidade: critica
bloqueia_producao: true
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Backup / Restore Check

## O que é
Rotina de DR: dump diário `pg_dump -Fc` via `run-backup.ps1` + Task Scheduler; restore validável em projeto descartável.

## Estado atual
Dump diário ativo (`State=Ready`, RPO ~24h, `last-status.json` OK). Restore evidenciado via MCP. Cópia externa em validação ([[backblaze-b2]]).

## O que já existe
`run-backup.ps1` (dump-only, guards SID, retenção 7); scheduler `MultGestor-Backup-Daily`; runbook `backup-restore-plan.md`.

## O que falta
Cópia externa ativa ([[backblaze-b2]], flag ainda 0); RPO/RTO formal documentado; alerta de falha (A-018).

## Riscos
Backup só local = single point of failure (A-002). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[supabase]] · [[banco-de-dados]]
### Bloqueia
[[PRODUCAO]]
### Usa
[[fluxo-backup-restore]]
### É usado por
[[backblaze-b2]]

## Próximas ações
Validar e ativar cópia externa B2 ([[PROXIMA-MELHOR-ACAO]]).

## Links
- [[backblaze-b2]] · [[fluxo-backup-restore]]
