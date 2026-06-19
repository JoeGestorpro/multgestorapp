---
tipo: decisao
area: core
status: pronto
progresso: 100
criticidade: media
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Ontologia MultGestor

## O que é
Define os tipos oficiais usados no campo `tipo:` das notas do mapa. Volta para [[MAPA-MULTGESTOR-CORE]].

## Estado atual
Tipos oficiais da Fase 1.

## Tipos oficiais
- **componente** — peça do Core (ex.: [[backend]], [[frontend]], [[auth]], [[banco-de-dados]], [[multi-tenant]], [[billing]])
- **integracao** — serviço externo/integração (ex.: [[supabase]], [[backblaze-b2]], [[render-backend]], [[vercel-frontend]])
- **capability** — bloco de domínio reutilizável (ex.: [[agenda]], [[clientes]], [[financeiro]])
- **nicho** — vertical de mercado (ex.: [[barbergestor]], [[petgestor]])
- **fluxo** — jornada/processo (ex.: [[fluxo-agendamento-publico]])
- **risco** — risco mapeado (ex.: [[RISCOS-MULTGESTOR]])
- **decisao** — ADR/decisão de arquitetura (ex.: [[ADR-001-supabase]])
- **ambiente** — ambiente de execução (ex.: [[ambientes]])
- **missao** — ação/missão da fila (ex.: [[PROXIMA-MELHOR-ACAO]])
- **bloqueador** — item que trava produção/venda

> Tipos auxiliares de meta-notas: `mapa` (hub) e `painel` (dashboards). Não são domínio, são navegação.

## Campos do frontmatter
`tipo · area · status · progresso · criticidade · bloqueia_producao · bloqueia_venda · ultima_revisao`
Valores: status ∈ {pronto, parcial, bloqueado, planejado, em_validacao}; criticidade ∈ {baixa, media, alta, critica}; progresso 0–100.

## Riscos
Inconsistência de tipos entre notas. Mitigação: revisar no [[RADAR-SEMANAL-MULTGESTOR]].

## Próximas ações
Aplicar os tipos de forma consistente em fases futuras.

## Links
- [[MAPA-MULTGESTOR-CORE]] · [[RADAR-SEMANAL-MULTGESTOR]]
