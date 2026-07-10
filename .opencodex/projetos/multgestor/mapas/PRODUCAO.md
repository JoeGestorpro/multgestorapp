---
tipo: painel
area: producao
status: parcial
progresso: 65
criticidade: critica
bloqueia_producao: true
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Produção MultGestor

## O que é
Separa o que é necessário, o que bloqueia, o que está em validação e o que já é funcional em produção. Volta para [[MAPA-MULTGESTOR-CORE]].

## Necessário para produção técnica
- [[verificacao-restauracao-backup]] com cópia externa ([[backblaze-b2]])
- [[rls-seguranca]] efetivo em companies/users
- Redis em produção ([[render-backend]])
- [[ci-cd]] com migrations fail-fast
- Rede de testes E2E do [[fluxo-agendamento-publico]]

## O que ainda bloqueia produção
- Backup só local (A-002) → [[backblaze-b2]]
- RLS inerte em companies/users (A-001) → [[rls-seguranca]]
- Redis ausente (A-004) → [[render-backend]]
- Migrations `continue-on-error` (A-005) → [[ci-cd]]

## Em validação
- [[backblaze-b2]] (scripts feature-flagged escritos, upload real não testado)
- [[fluxo-backup-restore]] (externo)

## Já funcional
- Backend healthy ([[render-backend]]) · DB em sync ([[supabase]])
- [[fluxo-login-cadastro]] (XSS endurecido) · [[fluxo-agendamento-publico]] (GET)
- [[verificacao-restauracao-backup]] local diário (RPO ~24h)

## Riscos
Ver [[RISCOS-MULTGESTOR]].

## Próximas ações
[[PROXIMA-MELHOR-ACAO]] → fechar [[backblaze-b2]].

## Links
- [[SISTEMA-VENDAVEL]] · [[DEPENDENCIAS-MULTGESTOR]]
