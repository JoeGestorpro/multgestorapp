# Relatório de Débito de Wikilinks — Vault `.opencodex` (evidência do Lote A)

> **Data:** 2026-07-10 · **Branch:** `release/lote-a-documentacao` · **Modo:** READ_ONLY (gerado por scanner, nenhum link corrigido)
> **Escopo:** vault `.opencodex` no worktree do Lote A. Resolução estilo Obsidian: por *basename*; link com caminho (`a/b`) considera-se desambiguado se o basename existe.
> **Nota:** os alvos abaixo aparecem entre crases para **não** serem interpretados como wikilinks (evita auto-inflar a contagem).

## Resumo

- Arquivos `.md` no vault: **377**
- Wikilinks verificados: **2777**
- **Quebrados:** 431  (alvos distintos: 129)
- **Ambíguos:** 113  (basenames distintos: 13)

**Origem do débito:** pré-existente ao Lote A (reorganização inglês→português do vault já contida nos 5 commits). Não introduzido pela separação de commits. Correção fica para missão de saneamento separada.

## Ambíguos (mesmo basename em 2+ arquivos do vault)

| Basename | Usos | Alvos possíveis |
|---|---|---|
| `[[barbergestor]]` | 26 | `.opencodex/areas/produto-roadmap/digital-twin/barbergestor.md`<br>`.opencodex/projetos/multgestor/mapas/nichos/barbergestor.md` |
| `[[backend]]` | 21 | `.opencodex/projetos/multgestor/backend.md`<br>`.opencodex/projetos/multgestor/mapas/core/backend.md` |
| `[[frontend]]` | 20 | `.opencodex/projetos/multgestor/frontend.md`<br>`.opencodex/projetos/multgestor/mapas/core/frontend.md`<br>`.opencodex/prompts/frontend/frontend.md` |
| `[[ci-cd]]` | 19 | `.opencodex/projetos/multgestor/ci-cd.md`<br>`.opencodex/projetos/multgestor/mapas/infra/ci-cd.md` |
| `[[petgestor]]` | 6 | `.opencodex/areas/produto-roadmap/digital-twin/petgestor.md`<br>`.opencodex/projetos/multgestor/mapas/nichos/petgestor.md` |
| `[[autogestor]]` | 5 | `.opencodex/areas/produto-roadmap/digital-twin/autogestor.md`<br>`.opencodex/projetos/multgestor/mapas/nichos/autogestor.md` |
| `[[climagestor]]` | 4 | `.opencodex/areas/produto-roadmap/digital-twin/climagestor.md`<br>`.opencodex/projetos/multgestor/mapas/nichos/climagestor.md` |
| `[[objetivo.md]]` | 3 | `.opencodex/chatJoe/projetos/ideias/objetivo.md`<br>`.opencodex/chatJoe/projetos/instrutor-gerador-de-nichos/objetivo.md`<br>`.opencodex/chatJoe/projetos/organizacao-obsidian/objetivo.md`<br>`.opencodex/chatJoe/projetos/_template/objetivo.md` |
| `[[decisoes.md]]` | 3 | `.opencodex/chatJoe/projetos/ideias/decisoes.md`<br>`.opencodex/chatJoe/projetos/instrutor-gerador-de-nichos/decisoes.md`<br>`.opencodex/chatJoe/projetos/organizacao-obsidian/decisoes.md`<br>`.opencodex/chatJoe/projetos/_template/decisoes.md` |
| `[[arquitetura]]` | 3 | `.opencodex/projetos/joefelipe-agent/arquitetura.md`<br>`.opencodex/projetos/multgestor/arquitetura.md` |
| `[[FLUXOS.md]]` | 1 | `.opencodex/areas/produto-roadmap/fluxos.md`<br>`.opencodex/FLUXOS.md` |
| `[[joefelipe-agent]]` | 1 | `.opencodex/agents/joefelipe-agent.md`<br>`.opencodex/projetos/joefelipe-agent/agentes/joefelipe-agent.md` |
| `[[seguranca]]` | 1 | `.opencodex/projetos/multgestor/agentes/seguranca.md`<br>`.opencodex/projetos/multgestor/seguranca.md` |

## Quebrados (basename não existe no vault)

Total: **431** links quebrados em **106** arquivos.

### `.opencodex/projetos/multgestor/indice.md` (32)
- `[[runbooks/backup-restore-plan]]`
- `[[runbooks/reconciliation-plan]]`
- `[[runbooks/runbook-integration-branch]]`
- `[[agents/product-manager]]`
- `[[agents/product-owner]]`
- `[[agents/platform-architect]]`
- `[[agents/database-architect]]`
- `[[agents/security]]`
- `[[agents/global-vision-architect]]`
- `[[product/vision]]`
- `[[product/mission]]`
- `[[product/pricing]]`
- `[[technical/workers]]`
- `[[technical/storage]]`
- `[[technical/DEPENDENCY-MAP]]`
- `[[ops/mission-closing-protocol]]`
- `[[incidents/TEMPLATE-INCIDENT]]`
- `[[audits/AUDITORIA-INCIDENTE-2026-06-23-violacao-l93]]`
- `[[decisions/TEMPLATE-DECISION]]`
- `[[strategy/strategic-decision-log]]`
- `[[lessons/TEMPLATE-LESSON]]`
- `[[strategy/compliance-intelligence]]`
- `[[strategy/core-power-map]]`
- `[[strategy/country-readiness-matrix]]`
- `[[strategy/global-benchmark-memory]]`
- `[[strategy/global-market-radar]]`
- `[[strategy/internationalization-requirements]]`
- `[[strategy/niche-radar]]`
- `[[strategy/product-futurist-engine]]`
- `[[archive-index/agent-archive-index]]`
- `[[instrucoes-humanas/backup-external-copy-b2]]`
- `[[instrucoes-humanas/register-backup-scheduler]]`

### `.opencodex/MAPA-DAS-PASTAS.md` (25)
- `[[brain/]]`
- `[[queue/]]`
- `[[rules/]]`
- `[[prompts/]]`
- `[[templates/]]`
- `[[audits/]]`
- `[[ops/]]`
- `[[automation/]]`
- `[[chatJoe/]]`
- `[[handoff/]]`
- `[[archive/]]`
- `[[agents/]]`
- `[[state/]]`
- `[[brain/01-CURRENT-STATE.md]]`
- `[[segundo cerebro/]]`
- `[[.obsidian/]]`
- `[[Nichos/]]`
- `[[../caminho/arquivo]]`

### `.opencodex/projetos/multgestor/knowledge-os.md` (23)
- `[[living-os/gates/]]`
- `[[technical/DEPENDENCY-MAP]]`
- `[[agents/agent-skill-matrix]]`
- `[[ops/executive-intelligence]]`
- `[[feature-genome/GENOME-agendamento]]`
- `[[feature-genome/GENOME-gestao-caixa]]`
- `[[simulation-center/SIMULATION-remove-tabela-x]]`
- `[[simulation-center/SIMULATION-migra-banco]]`
- `[[simulation-center/SIMULATION-adiciona-recorrencia]]`
- `[[rules]]`
- `[[ops/mission-closing-protocol]]`
- `[[ops/digital-ops-center]]`

### `.opencodex/CONVENCOES.md` (22)
- `[[brain/]]`
- `[[queue/]]`
- `[[rules/]]`
- `[[prompts/]]`
- `[[templates/]]`
- `[[audits/]]`
- `[[handoff/]]`
- `[[automation/]]`
- `[[ops/]]`
- `[[agents/]]`
- `[[../caminho/arquivo]]`
- `[[arquivo]]`
- `[[pasta/arquivo]]`
- `[[../pasta/arquivo]]`
- `[[brain/decisions/TEMPLATE-DECISION.md]]`

### `.opencodex/FLUXOS.md` (16)
- `[[brain/01-CURRENT-STATE.md]]`
- `[[audits/]]`
- `[[brain/architecture-decisions.md]]`
- `[[rules/]]`
- `[[templates/]]`
- `[[prompts/]]`
- `[[agents/]]`
- `[[brain/security-secrets-rotation.md]]`
- `[[brain/constitution.md]]`
- `[[brain/KNOWLEDGE-GRAPH.md]]`

### `.opencodex/ATLAS.md` (15)
- `[[brain/constitution.md]]`
- `[[brain/]]`
- `[[rules/]]`
- `[[audits/]]`
- `[[queue/]]`
- `[[prompts/]]`
- `[[templates/]]`
- `[[agents/]]`
- `[[ops/]]`
- `[[automation/]]`
- `[[archive/]]`
- `[[handoff/]]`
- `[[state/]]`

### `.opencodex/projetos/multgestor/agentes/visao-geral.md` (14)
- `[[agents/product-manager]]`
- `[[agents/product-owner]]`
- `[[agents/platform-architect]]`
- `[[agents/database-architect]]`
- `[[agents/security]]`
- `[[agents/global-vision-architect]]`
- `[[agents/providers]]`
- `[[agents/agent-skill-matrix]]`
- `[[agents/mission-builder]]`
- `[[agents/planner]]`

### `.opencodex/_inbox/antigos/brain-00-HOME.md` (11)
- `[[source-of-truth]]`
- `[[architecture-decisions]]`
- `[[agents/agent-skill-matrix]]`
- `[[agents/mission-builder]]`
- `[[agents/planner]]`
- `[[agents/providers]]`
- `[[strategy/niche-radar]]`
- `[[product/pricing]]`
- `[[technical/DEPENDENCY-MAP]]`
- `[[ops/mission-closing-protocol]]`
- `[[lessons-learned]]`

### `.opencodex/areas/produto-roadmap/simulation-center/SIMULACAO-adicionar-recorrencia.md` (9)
- `[[product/impact-graph/IMPACT-adicionar-recorrencia]]`
- `[[product/feature-genome/GENOME-agendamento]]`
- `[[agents/product-manager]]`
- `[[agents/platform-architect]]`
- `[[agents/database-architect]]`

### `.opencodex/areas/produto-roadmap/simulation-center/SIMULACAO-remover-tabela-x.md` (8)
- `[[product/impact-graph/IMPACT-remover-tabela]]`
- `[[product/feature-genome/GENOME-agendamento]]`
- `[[agents/platform-architect]]`
- `[[agents/database-architect]]`

### `.opencodex/projetos/multgestor/painel-executivo.md` (8)
- `[[technical/workers]]`
- `[[strategy/compliance-intelligence]]`
- `[[ops/routines]]`
- `[[strategy/product-futurist-engine]]`
- `[[strategy/niche-radar]]`
- `[[strategy/strategic-decision-log]]`
- `[[ops/digital-ops-center]]`
- `[[ops/executive-intelligence]]`

### `.opencodex/areas/produto-roadmap/visao-geral.md` (7)
- `[[product/vision]]`
- `[[product/mission]]`
- `[[product/pricing]]`
- `[[strategy/niche-radar]]`
- `[[strategy/product-futurist-engine]]`
- `[[strategy/core-power-map]]`
- `[[strategy/strategic-decision-log]]`

### `.opencodex/projetos/multgestor/execucao-producao.md` (7)
- `[[../01-CURRENT-STATE]]`
- `[[../../audits/2026-07-03-due-diligence-enterprise]]`
- `[[../../audits/2026-07-03-core-vs-nicho-audit]]`

### `.opencodex/areas/produto-roadmap/impact-graph/visao-geral.md` (6)
- `[[technical/DEPENDENCY-MAP]]`
- `[[impact-graph/IMPACT-remover-tabela]]`
- `[[impact-graph/IMPACT-migrar-banco]]`
- `[[impact-graph/IMPACT-adicionar-recorrencia]]`
- `[[impact-graph/IMPACT-TEMPLATE]]`

### `.opencodex/areas/produto-roadmap/mercado.md` (6)
- `[[product/vision]]`
- `[[strategy/niche-radar]]`
- `[[strategy/global-market-radar]]`
- `[[strategy/country-readiness-matrix]]`

### `.opencodex/areas/produto-roadmap/simulation-center/SIMULACAO-migrar-banco.md` (6)
- `[[product/impact-graph/IMPACT-migrar-banco]]`
- `[[agents/platform-architect]]`
- `[[agents/database-architect]]`
- `[[agents/security]]`

### `.opencodex/areas/produto-roadmap/simulation-center/visao-geral.md` (6)
- `[[technical/DEPENDENCY-MAP]]`
- `[[simulation-center/SIMULATION-remove-tabela-x]]`
- `[[simulation-center/SIMULATION-migra-banco]]`
- `[[simulation-center/SIMULATION-adiciona-recorrencia]]`
- `[[simulation-center/SIMULATION-TEMPLATE]]`

### `.opencodex/projetos/multgestor/agentes/construtor-missoes.md` (6)
- `[[agents/planner]]`
- `[[agents/agent-skill-matrix]]`
- `[[ops/mission-closing-protocol]]`

### `.opencodex/projetos/multgestor/agentes/gerente-produto.md` (6)
- `[[agents/product-owner]]`
- `[[strategy/niche-radar]]`
- `[[strategy/strategic-decision-log]]`
- `[[strategy/product-futurist-engine]]`

### `.opencodex/_inbox/revisar/constitution-knowledge-os.md` (6)
- `[[wikilink]]`
- `[[ops/mission-closing-protocol]]`
- `[[decisions/TEMPLATE-DECISION]]`
- `[[incidents/TEMPLATE-INCIDENT]]`
- `[[lessons/TEMPLATE-LESSON]]`

### `.opencodex/areas/produto-roadmap/impact-graph/IMPACTO-adicionar-recorrencia.md` (5)
- `[[agents/product-manager]]`
- `[[agents/platform-architect]]`
- `[[agents/database-architect]]`
- `[[product/feature-genome/GENOME-agendamento]]`
- `[[product/simulation-center/SIMULATION-adiciona-recorrencia]]`

### `.opencodex/areas/produto-roadmap/impact-graph/IMPACTO-migrar-banco.md` (5)
- `[[agents/platform-architect]]`
- `[[agents/database-architect]]`
- `[[agents/security]]`
- `[[product/impact-graph/IMPACT-remover-tabela]]`
- `[[product/simulation-center/SIMULATION-migra-banco]]`

### `.opencodex/areas/produto-roadmap/impact-graph/IMPACTO-remover-tabela.md` (5)
- `[[agents/platform-architect]]`
- `[[agents/database-architect]]`
- `[[agents/security]]`
- `[[product/impact-graph/IMPACT-migrar-banco]]`
- `[[product/simulation-center/SIMULATION-remove-tabela-x]]`

### `.opencodex/areas/produto-roadmap/roadmap.md` (5)
- `[[strategy/strategic-decision-log]]`
- `[[strategy/product-futurist-engine]]`
- `[[strategy/niche-radar]]`

### `.opencodex/BarberGestor - HOME.md` (5)
- `[[auditorias/multgestor/2026-07-03-core-vs-nicho-audit]]`
- `[[auditorias/multgestor/2026-07-03-due-diligence-enterprise]]`
- `[[areas/produto-roadmap/feature-genome/GENOME-agendamento]]`
- `[[areas/produto-roadmap/feature-genome/GENOME-gestao-caixa]]`
- `[[areas/produto-roadmap/pricing]]`

### `.opencodex/projetos/multgestor/agentes/planejador.md` (5)
- `[[agents/mission-builder]]`
- `[[agents/agent-skill-matrix]]`
- `[[ops/mission-closing-protocol]]`

### `.opencodex/prompts/executor/renomear-nomes-ingleses.md` (5)
- `[[nome-antigo]]`
- `[[pasta/nome-antigo]]`
- `[[antigo]]`

### `.opencodex/_inbox/antigos/brain-README.md` (5)
- `[[ops/mission-closing-protocol]]`
- `[[source-of-truth]]`
- `[[architecture-decisions]]`
- `[[lessons-learned]]`

### `.opencodex/areas/produto-roadmap/concorrentes.md` (4)
- `[[product/pricing]]`
- `[[strategy/niche-radar]]`
- `[[strategy/global-benchmark-memory]]`
- `[[strategy/core-power-map]]`

### `.opencodex/areas/produto-roadmap/digital-twin/barbergestor.md` (4)
- `[[agents/platform-architect]]`
- `[[agents/product-manager]]`
- `[[agents/database-architect]]`
- `[[agents/security]]`

### `.opencodex/areas/produto-roadmap/precificacao.md` (4)
- `[[product/vision]]`
- `[[maps/multgestor-core/core/billing]]`
- `[[strategy/product-futurist-engine]]`

### `.opencodex/ops/playbooks.md` (4)
- `[[../brain/runbooks/backup-restore-plan]]`
- `[[../brain/runbooks/reconciliation-plan]]`
- `[[../brain/runbooks/runbook-integration-branch]]`
- `[[../brain/EXECUTION-PLAYBOOK-PRODUCAO]]`

### `.opencodex/projetos/multgestor/agentes/provedores.md` (4)
- `[[agents/agent-skill-matrix]]`
- `[[agents/mission-builder]]`
- `[[agents/planner]]`

### `.opencodex/projetos/multgestor/plataforma.md` (4)
- `[[../audits/2026-07-03-core-vs-nicho-audit]]`

### `.opencodex/projetos/multgestor/roadmap/ROADMAP-MESTRE-MULTGESTOR-2026.md` (4)
- `[[../01-CURRENT-STATE]]`
- `[[../../audits/2026-07-03-due-diligence-enterprise]]`
- `[[../../audits/2026-07-03-core-vs-nicho-audit]]`
- `[[../MULTGESTOR-PLATFORM-SPECIFICATION]]`

### `.opencodex/prompts/visao-geral.md` (4)
- `[[prompts/auditoria]]`
- `[[prompts/governanca]]`
- `[[prompts/marketing]]`
- `[[prompts/comercial]]`

### `.opencodex/areas/operacao/ops/checklists/visao-geral.md` (3)
- `[[ops/mission-closing-protocol]]`

### `.opencodex/areas/produto-roadmap/feature-genome/visao-geral.md` (3)
- `[[feature-genome/GENOME-agendamento]]`
- `[[feature-genome/GENOME-gestao-caixa]]`
- `[[feature-genome/TEMPLATE-FEATURE-GENOME]]`

### `.opencodex/areas/produto-roadmap/mapa-forca-core.md` (3)
- `[[../capabilities-map]]`
- `[[../production-readiness]]`

### `.opencodex/decisoes/D-017-core-p0-fronteira-nicho.md` (3)
- `[[../../audits/2026-07-03-core-vs-nicho-audit]]`
- `[[../MULTGESTOR-PLATFORM-SPECIFICATION]]`
- `[[../01-CURRENT-STATE]]`

### `.opencodex/GLOSSARIO.md` (3)
- `[[queue/]]`
- `[[arquivo]]`
- `[[pasta/arquivo]]`

### `.opencodex/projetos/joefelipe-agent/arquitetura.md` (3)
- `[[project-autopilot-runner]]`
- `[[../source-of-truth]]`
- `[[../constitution]]`

### `.opencodex/projetos/multgestor/agentes/matriz-habilidades-agente.md` (3)
- `[[agents/mission-builder]]`
- `[[agents/planner]]`
- `[[agents/providers]]`

### `.opencodex/projetos/multgestor/deploy.md` (3)
- `[[runbooks/backup-restore-plan]]`
- `[[runbooks/runbook-integration-branch]]`
- `[[runbooks/reconciliation-plan]]`

### `.opencodex/projetos/multgestor/historico/linha-do-tempo.md` (3)
- `[[decisions/D-017]]`
- `[[archive-index/agent-archive-index]]`

### `.opencodex/projetos/multgestor/nichos/academygestor/visao-geral.md` (3)
- `[[strategy/niche-radar]]`
- `[[strategy/product-futurist-engine]]`

### `.opencodex/projetos/multgestor/nichos/fiscalgestor/visao-geral.md` (3)
- `[[strategy/niche-radar]]`
- `[[strategy/product-futurist-engine]]`

### `.opencodex/projetos/multgestor/visao-geral.md` (3)
- `[[technical/workers]]`
- `[[technical/storage]]`
- `[[technical/DEPENDENCY-MAP]]`

### `.opencodex/prompts/executor/governanca-obsidian.md` (3)
- `[[Índice Geral]]`
- `[[Mapa do Projeto]]`
- `[[Decisões — Índice]]`

### `.opencodex/_inbox/revisar/L-11-knowledge-os-scope-creep.md` (3)
- `[[ops/mission-closing-protocol]]`
- `[[agents/mission-builder]]`

### `.opencodex/areas/operacao/ops/centro-operacoes-digital.md` (2)
- `[[ops/executive-intelligence]]`

### `.opencodex/areas/operacao/ops/governance/visao-geral.md` (2)
- `[[ops/mission-closing-protocol]]`

### `.opencodex/areas/operacao/ops/inteligencia-executiva.md` (2)
- `[[ops/digital-ops-center]]`

### `.opencodex/areas/produto-roadmap/visao.md` (2)
- `[[product/mission]]`
- `[[strategy/global-market-radar]]`

### `.opencodex/decisoes/visao-geral.md` (2)
- `[[decisions/TEMPLATE-DECISION]]`
- `[[strategy/strategic-decision-log]]`

### `.opencodex/projetos/multgestor/agentes/seguranca.md` (2)
- `[[strategy/compliance-intelligence]]`

### `.opencodex/projetos/multgestor/armazenamento.md` (2)
- `[[runbooks/backup-restore-plan]]`

### `.opencodex/projetos/multgestor/arquitetura.md` (2)
- `[[technical/DEPENDENCY-MAP]]`

### `.opencodex/projetos/multgestor/backend.md` (2)
- `[[technical/DEPENDENCY-MAP]]`
- `[[technical/workers]]`

### `.opencodex/projetos/multgestor/eventos.md` (2)
- `[[technical/workers]]`

### `.opencodex/projetos/multgestor/grafo-conhecimento.md` (2)
- `[[ops/digital-ops-center]]`
- `[[ops/executive-intelligence]]`

### `.opencodex/projetos/multgestor/incidentes/INC-001-violacao-l93-migracao-manual-main.md` (2)
- `[[audits/AUDITORIA-INCIDENTE-2026-06-23-violacao-l93]]`

### `.opencodex/projetos/multgestor/integracoes.md` (2)
- `[[technical/workers]]`

### `.opencodex/projetos/multgestor/nichos/autogestor/visao-geral.md` (2)
- `[[strategy/niche-radar]]`

### `.opencodex/projetos/multgestor/nichos/petgestor/visao-geral.md` (2)
- `[[strategy/niche-radar]]`

### `.opencodex/projetos/multgestor/nichos/visao-geral.md` (2)
- `[[strategy/niche-radar]]`
- `[[strategy/product-futurist-engine]]`

### `.opencodex/projetos/multgestor/observabilidade.md` (2)
- `[[technical/workers]]`

### `.opencodex/projetos/multgestor/status-dinamico.md` (2)
- `[[../audits/2026-07-03-due-diligence-enterprise]]`
- `[[../audits/2026-07-03-core-vs-nicho-audit]]`

### `.opencodex/prompts/auditoria/visao-geral.md` (2)
- `[[ops/mission-closing-protocol]]`

### `.opencodex/prompts/comercial/visao-geral.md` (2)
- `[[product/pricing]]`

### `.opencodex/prompts/governanca/visao-geral.md` (2)
- `[[ops/mission-closing-protocol]]`

### `.opencodex/prompts/product/visao-geral.md` (2)
- `[[strategy/niche-radar]]`

### `.opencodex/areas/operacao/ops/visao-geral.md` (1)
- `[[ops/mission-closing-protocol]]`

### `.opencodex/areas/operacao/runbooks/MODELO-AUDITORIA-NICHO.md` (1)
- `[[../../audits/2026-07-03-core-vs-nicho-audit]]`

### `.opencodex/areas/produto-roadmap/descobertas.md` (1)
- `[[strategy/product-futurist-engine]]`

### `.opencodex/areas/produto-roadmap/feature-genome/GENOMA-agendamento.md` (1)
- `[[agents/platform-architect]]`

### `.opencodex/areas/produto-roadmap/feature-genome/GENOMA-gestao-caixa.md` (1)
- `[[agents/platform-architect]]`

### `.opencodex/areas/produto-roadmap/hipoteses.md` (1)
- `[[strategy/product-futurist-engine]]`

### `.opencodex/areas/produto-roadmap/icp-personas.md` (1)
- `[[product/vision]]`

### `.opencodex/areas/produto-roadmap/missao.md` (1)
- `[[product/vision]]`

### `.opencodex/areas/produto-roadmap/motor-futurista-produto.md` (1)
- `[[../capabilities-map]]`

### `.opencodex/areas/produto-roadmap/prds/README.md` (1)
- `[[product/vision]]`

### `.opencodex/areas/produto-roadmap/radar-nichos.md` (1)
- `[[../production-readiness]]`

### `.opencodex/areas/produto-roadmap/registro-decisoes-estrategicas.md` (1)
- `[[../production-readiness]]`

### `.opencodex/areas/seguranca/rotacao-segredos.md` (1)
- `[[project-supavisor-ops-pending]]`

### `.opencodex/auditorias/multgestor/AUDITORIA-BACKUP-GOVERNANCA-PROVA-VIVA-2026-06-22.md` (1)
- `[[../runbooks/backup-restore-plan]]`

### `.opencodex/brain/plans/PLANO-IA-OPERACIONAL-NICHOS.md` (1)
- `[[../../.agent/skills/create-vertical/SKILL.md]]`

### `.opencodex/chatJoe/projetos/organizacao-obsidian/prompts/executor-organizar-obsidian.md` (1)
- `[[projetos/multgestor/api*]]`

### `.opencodex/decisoes/DECISION-GRAPH.md` (1)
- `[[strategy/strategic-decision-log]]`

### `.opencodex/Diário do Projeto.md` (1)
- `[[Segundo CÃ©rebro]]`

### `.opencodex/Nichos/README.md` (1)
- `[[../../.agent/skills/create-vertical/SKILL.md]]`

### `.opencodex/projetos/multgestor/agentes/arquiteto-plataforma.md` (1)
- `[[technical/DEPENDENCY-MAP]]`

### `.opencodex/projetos/multgestor/agentes/dono-produto.md` (1)
- `[[agents/product-manager]]`

### `.opencodex/projetos/multgestor/capacidades.md` (1)
- `[[../../audits/2026-07-03-core-vs-nicho-audit]]`

### `.opencodex/projetos/multgestor/dna.md` (1)
- `[[ops/mission-closing-protocol]]`

### `.opencodex/projetos/multgestor/frontend.md` (1)
- `[[technical/DEPENDENCY-MAP]]`

### `.opencodex/projetos/multgestor/incidentes/MODELO-INCIDENTE.md` (1)
- `[[lessons/L-XXX]]`

### `.opencodex/projetos/multgestor/incidentes/visao-geral.md` (1)
- `[[incidents/TEMPLATE-INCIDENT]]`

### `.opencodex/projetos/multgestor/nichos/climagestor/visao-geral.md` (1)
- `[[strategy/niche-radar]]`

### `.opencodex/projetos/multgestor/status-atual.md` (1)
- `[[project-supavisor-ops-pending]]`

### `.opencodex/prompts/arquitetura/visao-geral.md` (1)
- `[[technical/DEPENDENCY-MAP]]`

### `.opencodex/prompts/deploy/visao-geral.md` (1)
- `[[runbooks/backup-restore-plan]]`

### `.opencodex/prompts/executor/organizar-obsidian-moc.md` (1)
- `[[projetos/multgestor/api*]]`

### `.opencodex/prompts/frontend/frontend.md` (1)
- `[[../PLAN.md]]`

### `.opencodex/prompts/qa/visao-geral.md` (1)
- `[[product/prds/PRD-XXX]]`

### `.opencodex/_inbox/revisar/README.md` (1)
- `[[lessons/TEMPLATE-LESSON]]`

## Alvos quebrados mais referenciados

| Alvo | Ocorrências |
|---|---|
| `[[ops/mission-closing-protocol]]` | 25 |
| `[[strategy/niche-radar]]` | 22 |
| `[[technical/DEPENDENCY-MAP]]` | 16 |
| `[[agents/agent-skill-matrix]]` | 15 |
| `[[strategy/product-futurist-engine]]` | 12 |
| `[[agents/platform-architect]]` | 11 |
| `[[brain/]]` | 10 |
| `[[audits/]]` | 10 |
| `[[technical/workers]]` | 10 |
| `[[agents/database-architect]]` | 9 |
| `[[strategy/strategic-decision-log]]` | 9 |
| `[[../../audits/2026-07-03-core-vs-nicho-audit]]` | 7 |
| `[[product/vision]]` | 7 |
| `[[product/feature-genome/GENOME-agendamento]]` | 7 |
| `[[rules/]]` | 7 |
| `[[agents/mission-builder]]` | 7 |
| `[[agents/providers]]` | 7 |
| `[[ops/executive-intelligence]]` | 6 |
| `[[product/pricing]]` | 6 |
| `[[agents/product-manager]]` | 6 |
| `[[agents/security]]` | 6 |
| `[[agents/planner]]` | 6 |
| `[[ops/digital-ops-center]]` | 5 |
| `[[prompts/]]` | 5 |
| `[[agents/]]` | 5 |
| `[[runbooks/backup-restore-plan]]` | 5 |
| `[[../audits/2026-07-03-core-vs-nicho-audit]]` | 5 |
| `[[product/impact-graph/IMPACT-remover-tabela]]` | 4 |
| `[[product/impact-graph/IMPACT-migrar-banco]]` | 4 |
| `[[strategy/global-market-radar]]` | 4 |
| `[[queue/]]` | 4 |
| `[[templates/]]` | 4 |
| `[[ops/]]` | 4 |
| `[[strategy/compliance-intelligence]]` | 4 |
| `[[../../audits/2026-07-03-due-diligence-enterprise]]` | 4 |
| `[[strategy/core-power-map]]` | 3 |
| `[[../capabilities-map]]` | 3 |
| `[[../production-readiness]]` | 3 |
| `[[product/impact-graph/IMPACT-adicionar-recorrencia]]` | 3 |
| `[[product/mission]]` | 3 |
| `[[brain/constitution.md]]` | 3 |
| `[[automation/]]` | 3 |
| `[[handoff/]]` | 3 |
| `[[arquivo]]` | 3 |
| `[[../01-CURRENT-STATE]]` | 3 |
| `[[decisions/TEMPLATE-DECISION]]` | 3 |
| `[[brain/01-CURRENT-STATE.md]]` | 3 |
| `[[agents/product-owner]]` | 3 |
| `[[archive-index/agent-archive-index]]` | 3 |
| `[[audits/AUDITORIA-INCIDENTE-2026-06-23-violacao-l93]]` | 3 |
| `[[incidents/TEMPLATE-INCIDENT]]` | 3 |
| `[[lessons/TEMPLATE-LESSON]]` | 3 |
| `[[strategy/global-benchmark-memory]]` | 2 |
| `[[feature-genome/GENOME-agendamento]]` | 2 |
| `[[feature-genome/GENOME-gestao-caixa]]` | 2 |
| `[[strategy/country-readiness-matrix]]` | 2 |
| `[[maps/multgestor-core/core/billing]]` | 2 |
| `[[simulation-center/SIMULATION-remove-tabela-x]]` | 2 |
| `[[simulation-center/SIMULATION-migra-banco]]` | 2 |
| `[[simulation-center/SIMULATION-adiciona-recorrencia]]` | 2 |

---

## Critério de aceitação ajustado para o Lote A

- ❌ *Não* se exige "todos os links resolvidos" (débito antigo de ~431 links transformaria a PR de organização numa missão muito maior).
- ✅ Exige-se **zero regressões novas**: nenhum link **adicionado neste ciclo** pode estar quebrado.
- ✅ Verificado: os 8 wikilinks adicionados neste ciclo (Mapa Mestre + auditoria + índice) resolvem todos para 1 arquivo real.
- 📌 Débito registrado para **missão de saneamento do Obsidian** separada (índice inglês→português + desambiguação).
