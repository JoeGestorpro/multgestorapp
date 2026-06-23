---
tipo: painel
area: core
status: em_validacao
progresso: 60
criticidade: critica
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Painel Executivo MultGestor

## O que é
Visão de uma página para decisão: onde estamos, o que falta, riscos e próxima ação. Volta para [[MAPA-MULTGESTOR-CORE]].

## Onde estamos
Produção saudável, governança coerente (`state_version 13`), [[fluxo-agendamento-publico]] (GET) validado, [[backup-restore-check]] local ativo. Achado A-003 (outbox orphaned) resolvido. Restam bloqueios P1.

## O que falta para produção
Ver [[PRODUCAO]]. Pontos P1: [[backblaze-b2]] (cópia externa), [[rls-seguranca]] (companies/users sem policy), Redis em produção, [[ci-cd]] (migrations fail-fast).

## O que falta para venda
Ver [[SISTEMA-VENDAVEL]]. POST de agendamento testado em produção, [[fluxo-pagamento]] E2E, [[fluxo-whatsapp]] real ou decisão formal, onboarding e suporte mínimos.

## Riscos principais
Ver [[RISCOS-MULTGESTOR]]. Top: backup só local, RLS inerte em companies/users, Redis ausente, migrations silenciosas.

## Próxima melhor ação
Ver [[PROXIMA-MELHOR-ACAO]] → fechar [[backblaze-b2]] (cópia externa, missão `ops/backup-external-copy`).

## Áreas mais avançadas
[[barbergestor]] (vertical completo) · [[agenda]] · [[servicos]] · [[colaboradores]] · [[auth]].

## Áreas que precisam de fechamento
[[ia-operacional]] (planejado) · [[estoque]] · [[fluxo-whatsapp]] · [[fluxo-pagamento]] · nichos [[agrogestor]]/[[autogestor]]/[[petgestor]]/[[barber-store]] (não iniciados).

## Links
- [[STATUS-GERAL]] · [[DEPENDENCIAS-MULTGESTOR]] · [[ROADMAP-MESTRE-MULTGESTOR-2026]]
