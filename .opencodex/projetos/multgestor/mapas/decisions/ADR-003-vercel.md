---
tipo: decisao
area: infra
status: pronto
progresso: 100
criticidade: media
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# ADR-003 — Vercel para o frontend

## O que é
Decisão de hospedar o [[frontend]] no [[vercel-frontend]].

## Estado atual
DECIDIDO e em produção. Root directory corrigido (OPS-2).

## O que já existe
Deploy em push para main; domínios barbergestor.com.br / multgestorapp.com.br.

## O que falta
Validar UX em produção; revisar warnings de build.

## Riscos
CI só faz lint+build (não pega runtime). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
—
### Bloqueia
[[vercel-frontend]]
### Usa
—
### É usado por
[[frontend]]

## Próximas ações
Validar UX real antes do piloto pago.

## Links
- [[vercel-frontend]] · [[frontend]]
