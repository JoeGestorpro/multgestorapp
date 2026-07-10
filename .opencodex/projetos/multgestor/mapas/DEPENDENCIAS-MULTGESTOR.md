---
tipo: painel
area: core
status: parcial
progresso: 55
criticidade: alta
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Dependências MultGestor

## O que é
Mapa de dependências para produção, venda, escala e entre capabilities/nichos. Volta para [[MAPA-MULTGESTOR-CORE]].

## Dependências para produção
- [[backblaze-b2]] depende de [[verificacao-restauracao-backup]] (cópia externa do dump local)
- [[rls-seguranca]] depende de [[banco-de-dados]] + [[multi-tenant]]
- [[ci-cd]] (fail-fast) depende de OPS-SUPAVISOR resolvido + [[projetos/multgestor/mapas/seguranca/rotacao-segredos]]
- Redis depende de decisão de custo em [[render-backend]]

## Dependências para venda
- [[SISTEMA-VENDAVEL]] depende de [[PRODUCAO]] fechada
- [[fluxo-pagamento]] depende de [[faturamento]] + feature gates
- [[fluxo-onboarding-cliente]] depende de [[frontend]] + [[notificacoes]]

## Dependências para escala
- Nichos novos dependem de `core-vs-vertical-boundary-map` + template de vertical
- [[ia-operacional]] depende de [[notificacoes]] reais + EventBus durável (existe)

## Dependências entre capabilities
- [[agenda]] usa [[multi-tenant]] e [[banco-de-dados]]
- [[financeiro]] usa [[agenda]] e [[servicos]]
- [[notificacoes]] usa [[fluxo-whatsapp]] e email ([[render-backend]])
- [[relatorios]] usa [[financeiro]] e [[clientes]]

## Dependências entre nichos
- [[barbergestor]] é a referência; [[barbearia]], [[petgestor]], [[autogestor]], [[agrogestor]] dependem do Core ([[multgestor-core]]) e do template de vertical (não existe ainda)

## Riscos
Dependência circular se nichos forem criados antes do boundary-map. Ver [[RISCOS-MULTGESTOR]].

## Próximas ações
Ver [[PROXIMA-MELHOR-ACAO]].

## Links
- [[ROADMAP-MESTRE-MULTGESTOR-2026]] · [[PRODUCAO]]
