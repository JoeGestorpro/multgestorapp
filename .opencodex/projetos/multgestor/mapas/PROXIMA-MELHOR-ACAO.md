---
tipo: missao
area: core
status: vigente
progresso: 0
criticidade: alta
bloqueia_producao: false
bloqueia_venda: true
ultima_revisao: 2026-07-23
atualizado_por: KNOWLEDGE-001
---

# Próxima Melhor Ação

> Fonte canônica de estado: [[../../../PROJECT-SNAPSHOT]] · [[../../../02-ESTADO-REAL-DO-PROJETO]]. Backlog priorizado: [[../matriz-consolidacao-core|matriz ANEXO F]]. Este documento aponta a próxima ação; não a executa.

## Estado atual (2026-07-23)
Fundação **sólida**: migrations automáticas/bloqueantes (OPS-MIGRATIONS-03D), RLS runtime ativo, booking público contextualizado (TENANT-003A), webhooks públicos com controle de abuso (R-003, em produção `7a313fd`). BarberGestor **funcional em código**, mas o **circuito comercial não fecha** (billing depende de config externa Kiwify + secrets).

## Recomendação — separar as duas próximas ações

### Prioridade ESTRATÉGICA
**Transformar o BarberGestor em produto vendável** — ativar o entitlement de billing em produção. Código pronto e gating **já genérico** (D-04 elimina o pré-requisito antes presumido). Falta: config de produção (planos/produtos Kiwify, `VITE_KIWIFY_URL_*`, D-016) + evidência ponta a ponta — **ação externa/humana**, não código.

### Próxima missão EXECUTÁVEL (código-side, desbloqueada)
Eleger o item de maior rank **desbloqueado** na [[../matriz-consolidacao-core|matriz ANEXO F]]. Bloqueados hoje: `TENANT-003` (inventário de RLS em prod — Supabase MCP `Unauthorized`), billing (externo). Candidatos código-side desbloqueados: `IDENT-002` (escopo de auth por módulo), `AUDIT-001` (trilha de auditoria unificada), `SEC-003` (gate de segurança bloqueante), `FRONTCORE-002` (decompor `Barber.jsx`).

## Por que esta separação
Priorizar produto sem confundir com o que é executável agora: a ação de maior valor (billing) está bloqueada por dependência externa; a ação executável imediata é a de maior rank desbloqueada. Não escolher missão de infra só porque há dívida técnica.

## Bloqueios ativos
- Supabase MCP sem acesso → sem inventário de RLS em produção.
- Billing → config externa Kiwify + secrets.
- TLS do banco sem validação de cert (`SEC-DATABASE-TLS-001`).

## Links
- [[../../../PROJECT-SNAPSHOT]] · [[../../../02-ESTADO-REAL-DO-PROJETO]] · [[../matriz-consolidacao-core]] · [[../roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR]]
