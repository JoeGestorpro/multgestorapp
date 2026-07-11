---
tipo: decisao
area: infra
status: pronto
progresso: 100
criticidade: alta
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# ADR-004 — Backblaze B2 para cópia externa de backup

## O que é
Decisão de usar [[backblaze-b2]] como destino off-site do dump diário (resolve A-002).

## Estado atual
DECIDIDO (2026-06-18). 10GB grátis; application keys S3-compatíveis (sem OAuth) ideais p/ upload não-assistido no Windows.

## O que já existe
Bucket + key criados; `brchk.env` preenchido (flag 0); scripts feature-flagged escritos.

## O que falta
Validar primeiro upload (Método A); ligar `BRCHK_EXTERNAL_ENABLED=1`.

## Riscos
Até ligar, backup segue só local (A-002). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[verificacao-restauracao-backup]]
### Bloqueia
[[backblaze-b2]]
### Usa
—
### É usado por
[[fluxo-backup-restore]]

## Próximas ações
Pré-teste de upload → ativar flag ([[PROXIMA-MELHOR-ACAO]]).

## Links
- [[backblaze-b2]] · [[fluxo-backup-restore]]
