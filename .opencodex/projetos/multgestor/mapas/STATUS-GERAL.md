---
tipo: painel
area: core
status: em_validacao
progresso: 60
criticidade: alta
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Status Geral MultGestor

## O que é
Tabela-resumo de status de cada nó do mapa. Volta para [[MAPA-MULTGESTOR-CORE]].

## Estado atual (2026-06-18 / state_version 13)

| Área | Nó | Status | Progresso |
|---|---|---|---|
| Core | [[backend]] | parcial | 75 |
| Core | [[frontend]] | parcial | 55 |
| Core | [[banco-de-dados]] | parcial | 70 |
| Core | [[auth]] | parcial | 70 |
| Core | [[billing]] | parcial | 50 |
| Core | [[multi-tenant]] | parcial | 70 |
| Infra | [[supabase]] | parcial | 70 |
| Infra | [[render-backend]] | parcial | 65 |
| Infra | [[vercel-frontend]] | parcial | 65 |
| Infra | [[backblaze-b2]] | em_validacao | 60 |
| Infra | [[ci-cd]] | parcial | 60 |
| Segurança | [[rls-seguranca]] | bloqueado | 50 |
| Segurança | [[secrets-rotation]] | bloqueado | 30 |
| Segurança | [[backup-restore-check]] | parcial | 70 |
| Capability | [[agenda]] | pronto | 80 |
| Capability | [[notificacoes]] | parcial | 50 |
| Capability | [[ia-operacional]] | planejado | 5 |
| Nicho | [[barbergestor]] | pronto | 85 |
| Nicho | [[climagestor]] | parcial | 50 |
| Nicho | [[agrogestor]] / [[autogestor]] / [[petgestor]] / [[barber-store]] | planejado | 0 |

## O que falta
Fechar P1 de fundação (ver [[PRODUCAO]] e [[RISCOS-MULTGESTOR]]).

## Riscos
Ver [[RISCOS-MULTGESTOR]].

## Próximas ações
Ver [[PROXIMA-MELHOR-ACAO]].

## Links
- [[PAINEL-EXECUTIVO-MULTGESTOR]] · [[capacidades]]
