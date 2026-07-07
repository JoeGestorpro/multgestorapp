---
tipo: integracao
area: infra
status: parcial
progresso: 65
criticidade: media
bloqueia_producao: false
bloqueia_venda: true
ultima_revisao: 2026-06-19
---

# Vercel (Frontend)

## O que é
Hospedagem do [[frontend]] (barbergestor.com.br / multgestorapp.com.br). Deploy em push para main.

## Estado atual
Build CI passa; deploy funcional. Root directory corrigido (OPS-2 resolvido).

## O que já existe
Pipeline de deploy; `VITE_API_URL` apontando para o [[render-backend]].

## O que falta
Validar UX em produção; warnings de build não auditados.

## Riscos
Erros de runtime não detectados pelo CI (só lint+build). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[ci-cd]]
### Bloqueia
[[frontend]]
### Usa
[[render-backend]]
### É usado por
[[barbergestor]]

## Próximas ações
Validar UX real; revisar warnings de build.

## Links
- [[ADR-003-vercel]] · [[frontend]]
