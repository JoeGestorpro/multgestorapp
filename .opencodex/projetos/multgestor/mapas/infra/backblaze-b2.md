---
tipo: integracao
area: infra
status: em_validacao
progresso: 60
criticidade: alta
bloqueia_producao: true
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Backblaze B2

## O que é
Destino de cópia externa/cloud do dump diário, escolhido para resolver o achado A-002 (backup só local). Missão `ops/backup-external-copy`.

## Estado atual
Bucket privado + application key criados; `brchk.env` preenchido (flag `BRCHK_EXTERNAL_ENABLED=0`). Scripts feature-flagged escritos (`upload-external.ps1` + integração em `run-backup.ps1`). **Upload real ainda não testado.**

## O que já existe
Scripts (flag OFF), verificação SHA1 server-side planejada, plano em `runbooks/backup-restore-plan.md §10`.

## O que falta
Teste de upload controlado (Método A); ligar `BRCHK_EXTERNAL_ENABLED=1` após validar.

## Riscos
Sem cópia externa, backup é single point of failure local (A-002). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[backup-restore-check]]
### Bloqueia
[[PRODUCAO]]
### Usa
[[fluxo-backup-restore]]
### É usado por
[[backup-restore-check]]

## Próximas ações
Validar primeiro upload (ver [[PROXIMA-MELHOR-ACAO]]); depois ativar a flag.

## Links
- [[ADR-004-backblaze-b2]] · [[fluxo-backup-restore]] · [[backup-restore-check]]
