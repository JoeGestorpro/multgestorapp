---
tipo: risco
area: core
status: parcial
progresso: 50
criticidade: critica
bloqueia_producao: true
bloqueia_venda: true
ultima_revisao: 2026-06-19
---

# Riscos MultGestor

## O que é
Riscos por categoria, derivados da auditoria 2026-06-18. Volta para [[MAPA-MULTGESTOR-CORE]].

## Estado atual
A-003 (outbox orphaned) RESOLVIDO. Restam 4 P1 abertos.

## Riscos por categoria

### Segurança
- RLS inerte em companies/users (A-001, P1) → [[rls-seguranca]]
- CSP desativado no Helmet (A-007, P2) → [[politicas-producao]]
- Rotação de secrets pausada (deferred) → [[secrets-rotation]]

### Banco de dados
- Free tier sem PITR/auto-backup (A-014) → [[supabase]]
- Drift recorrente por migrations manuais → [[ci-cd]]

### Backup/restore
- Backup só local — single point of failure (A-002, P1) → [[backblaze-b2]] / [[backup-restore-check]]

### Deploy
- Migrations `continue-on-error` — deploy prossegue com falha (A-005, P1) → [[ci-cd]]
- OPS-SUPAVISOR bloqueia migrations no CI → [[ci-cd]]

### Produto
- Sem E2E do [[fluxo-agendamento-publico]] (A-008/9, P2)
- Cold start 4s (A-014, P2) → [[render-backend]]
- [[fluxo-whatsapp]] em mock (A-010, P2)

### Comercial
- [[billing]] não testado E2E (A-022) → [[fluxo-pagamento]]
- Onboarding/suporte mínimos ausentes → [[SISTEMA-VENDAVEL]]

### Operação
- Redis ausente — rate limit/cache voláteis (A-004, P1) → [[render-backend]]
- Sem alertas externos (A-018) → [[politicas-producao]]

### IA/agentes
- [[ia-operacional]] aspiracional, não implementado — não tratar como real
- Autopilot Runner congelado na Fase 0 (gated)

## Relações
### Depende de
[[STATUS-GERAL]]
### Bloqueia
[[PRODUCAO]] · [[SISTEMA-VENDAVEL]]
### Usa
auditoria-completa-2026-06-18
### É usado por
[[PAINEL-EXECUTIVO-MULTGESTOR]]

## Próximas ações
Fechar P1 na ordem do [[ROADMAP-MESTRE-MULTGESTOR-2026]] → [[PROXIMA-MELHOR-ACAO]].

## Links
- [[DEPENDENCIAS-MULTGESTOR]] · [[politicas-producao]]
