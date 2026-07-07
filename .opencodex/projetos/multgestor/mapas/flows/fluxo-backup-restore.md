---
tipo: fluxo
area: seguranca
status: parcial
progresso: 70
criticidade: critica
bloqueia_producao: true
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Fluxo: Backup e Restore

## O que é
Dump diário → retenção local → (futuro) cópia externa B2 → restore validável em projeto descartável.

## Estado atual
Dump diário ativo (RPO ~24h); restore evidenciado via MCP. Cópia externa B2 escrita mas inativa (flag 0).

## O que já existe
`run-backup.ps1` (dump-only); scheduler; `upload-external.ps1` (feature-flagged); runbook §10.

## O que falta
Validar primeiro upload B2; ligar flag; documentar RPO/RTO formal; alerta de falha.

## Riscos
Backup só local até a flag ligar (A-002). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[supabase]] · [[banco-de-dados]]
### Bloqueia
[[PRODUCAO]]
### Usa
[[backblaze-b2]]
### É usado por
[[backup-restore-check]]

## Próximas ações
Pré-teste de upload (Método A) → ativar `BRCHK_EXTERNAL_ENABLED=1` ([[PROXIMA-MELHOR-ACAO]]).

## Links
- [[backup-restore-check]] · [[backblaze-b2]]
