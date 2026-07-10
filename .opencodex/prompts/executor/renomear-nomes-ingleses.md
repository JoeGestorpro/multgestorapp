# Prompt — Executor: Renomear nomes ingleses para português (Obsidian)

## Origem

Projeto: Organização do Obsidian (chatJoe)
Missão: Renomear base visual do Obsidian para português
Risco: 4 (renomear ~60 arquivos quebra wikilinks em cadeia)
Skills: documentacao, code-review
Agentes: Technical Writer, Platform Architect
Auditoria: Sim

## Objetivo

Renomear arquivos .md com nomes em inglês para português, corrigindo todos os
wikilinks quebrados. O grafo do Obsidian deve mostrar nomes em português.

## Regras

1. Todo rename deve ser `git mv` (preserva histórico)
2. Após cada rename, corrigir TODOS os wikilinks que apontavam para o nome antigo
3. Links quebrados em arquivos protegidos (HOME.md, MAPA-DAS-PASTAS.md etc.)
   NÃO podem ser corrigidos — documentar cada um como pendência
4. Nomes: kebab-case, sem espaços, sem acentos nos nomes de arquivo
   (ex: `mapa-dependencias.md`, nao `Mapa de Dependências.md`)
5. Cada lote tem verificação própria — não pular para o próximo sem validar

---

## LOTE 1 — Críticos (12 hubs do grafo)

### 1.1 `projetos/multgestor/README.md` → `visao-geral.md`
Links a corrigir (procurar `[[projetos/multgestor/visao-geral]]` e `[[projetos/multgestor/visao-geral]]` em
`projetos/multgestor/HOME.md`, `projetos/multgestor/mapas/*`, todos os
Índices MOC na raiz)

### 1.2 `projetos/multgestor/HOME.md` → `inicio.md`
Links a corrigir: `[[projetos/multgestor/inicio]]` em 00-HOME.md e outros.
Nota: `[[projetos/multgestor/inicio]]` sem path também pode existir — verificar.

### 1.3 `projetos/multgestor/INDEX.md` → `indice.md`
Links a corrigir: ~30 links. `[[indice]]`, `[[projetos/multgestor/indice]]`,
`[[projetos/multgestor/indice|...]]`. Verificar em todos os Índices MOC,
Base de Conhecimento, BarberGestor HOME.

### 1.4 `projetos/multgestor/knowledge-os.md` → marcar como legado
NÃO renomear. Apenas adicionar aviso no topo:
```
> **Legado** — conhecimento migrado para [[Base de Conhecimento]]
> Manter este arquivo por links históricos. Novos links devem apontar
> para `Base de Conhecimento`.
```

### 1.5 `projetos/multgestor/DEPENDENCY-MAP.md` → `mapa-dependencias.md`

### 1.6 `areas/produto-roadmap/README.md` → `visao-geral.md`

### 1.7 `areas/produto-roadmap/mission.md` → `missao.md`

### 1.8 `areas/produto-roadmap/niche-radar.md` → `radar-nichos.md`

### 1.9 `decisoes/README.md` → `visao-geral.md`
Corrigir links nos Índices MOC e Base de Conhecimento

### 1.10 `decisoes/architecture-decisions.md` → `decisoes-arquiteturais.md`

### 1.11 `areas/governanca/source-of-truth.md` → `fonte-unica-verdade.md`

### 1.12 `projetos/joefelipe-agent/HOME.md` → `inicio.md`

---

## LOTE 2 — READMEs + Templates

### 2.1 READMEs padronizados (46 arquivos)

Regra por tipo de pasta:

| Tipo de pasta | README → |
|---|---|
| Pasta de conteúdo (projetos/multgestor/, areas/) | `visao-geral.md` |
| Pasta de sub-navegação (nichos/, incidentes/) | `visao-geral.md` |
| Pasta de prompts/ | `visao-geral.md` |
| chatJoe/ e subpastas | `visao-geral.md` |
| auditórias/ | `visao-geral.md` |

Lista completa para rename:
```
areas/operacao/instrucoes-humanas/README.md
areas/operacao/ops/README.md
areas/operacao/ops/checklists/README.md
areas/operacao/ops/governance/README.md
areas/operacao/ops/playbooks/README.md
areas/operacao/ops/routines/README.md
areas/operacao/runbooks/README.md
areas/produto-roadmap/README.md (já renomeado no Lote 1)
areas/produto-roadmap/digital-twin/README.md
areas/produto-roadmap/feature-genome/README.md
areas/produto-roadmap/impact-graph/README.md
areas/produto-roadmap/simulation-center/README.md
auditorias/multgestor/README.md
chatJoe/README.md
chatJoe/skillgate/README.md
chatJoe/projetos/_template/auditorias/README.md
chatJoe/projetos/_template/compactacoes/README.md
chatJoe/projetos/_template/prompts/README.md
chatJoe/projetos/ideias/auditorias/README.md
chatJoe/projetos/ideias/compactacoes/README.md
chatJoe/projetos/ideias/prompts/README.md
chatJoe/projetos/organizacao-obsidian/auditorias/README.md
chatJoe/projetos/organizacao-obsidian/compactacoes/README.md
chatJoe/projetos/organizacao-obsidian/prompts/README.md
decisoes/README.md (já renomeado no Lote 1)
prompts/README.md
prompts/arquitetura/README.md
prompts/auditoria/README.md
prompts/backend/README.md
prompts/banco/README.md
prompts/comercial/README.md
prompts/deploy/README.md
prompts/frontend/README.md
prompts/governanca/README.md
prompts/marketing/README.md
prompts/product/README.md
prompts/qa/README.md
projetos/multgestor/README.md (já renomeado no Lote 1)
projetos/multgestor/agentes/README.md
projetos/multgestor/incidentes/README.md
projetos/multgestor/living-os/README.md
projetos/multgestor/nichos/README.md
projetos/multgestor/nichos/academygestor/README.md
projetos/multgestor/nichos/autogestor/README.md
projetos/multgestor/nichos/barbergestor/README.md
projetos/multgestor/nichos/climagestor/README.md
projetos/multgestor/nichos/fiscalgestor/README.md
projetos/multgestor/nichos/petgestor/README.md
```

### 2.2 Templates e padrões

| Atual | Novo |
|---|---|
| `_inbox/revisar/TEMPLATE-LESSON.md` | `_inbox/revisar/modelo-licao.md` |
| `areas/produto-roadmap/feature-genome/TEMPLATE-FEATURE-GENOME.md` | `areas/produto-roadmap/feature-genome/MODELO-FEATURE-GENOMA.md` |
| `areas/produto-roadmap/impact-graph/IMPACT-TEMPLATE.md` | `areas/produto-roadmap/impact-graph/IMPACTO-MODELO.md` |
| `areas/produto-roadmap/simulation-center/SIMULATION-TEMPLATE.md` | `areas/produto-roadmap/simulation-center/SIMULACAO-MODELO.md` |
| `decisoes/TEMPLATE-DECISION.md` | `decisoes/MODELO-DECISAO.md` |
| `projetos/multgestor/incidentes/TEMPLATE-INCIDENT.md` | `projetos/multgestor/incidentes/MODELO-INCIDENTE.md` |

### 2.3 Prefixos GENOME/IMPACT/SIMULATION

| Atual | Novo |
|---|---|
| `GENOME-agendamento.md` | `GENOMA-agendamento.md` |
| `GENOME-gestao-caixa.md` | `GENOMA-gestao-caixa.md` |
| `IMPACT-adicionar-recorrencia.md` | `IMPACTO-adicionar-recorrencia.md` |
| `IMPACT-migrar-banco.md` | `IMPACTO-migrar-banco.md` |
| `IMPACT-remover-tabela.md` | `IMPACTO-remover-tabela.md` |
| `SIMULATION-adiciona-recorrencia.md` | `SIMULACAO-adicionar-recorrencia.md` |
| `SIMULATION-migra-banco.md` | `SIMULACAO-migrar-banco.md` |
| `SIMULATION-remove-tabela-x.md` | `SIMULACAO-remover-tabela-x.md` |

---

## LOTE 3 — Demais (menor impacto visual no grafo)

### 3.1 Agentes e habilidades

| Atual | Novo |
|---|---|
| `chatJoe/agentes/registry.md` | `chatJoe/agentes/registro.md` |
| `chatJoe/skills/registry.md` | `chatJoe/skills/registro.md` |
| `chatJoe/skillgate/matriz-skills.md` | `chatJoe/skillgate/matriz-habilidades.md` |
| `chatJoe/projetos/*/skills.md` | `habilidades.md` |
| `chatJoe/projetos/*/roadmap.md` | `plano-evolucao.md` |
| `projetos/multgestor/agentes/agent-skill-matrix.md` | `matriz-habilidades-agente.md` |
| `projetos/multgestor/agentes/database-architect.md` | `arquiteto-banco-dados.md` |
| `projetos/multgestor/agentes/global-vision-architect.md` | `arquiteto-visao-global.md` |
| `projetos/multgestor/agentes/mission-builder.md` | `construtor-missoes.md` |
| `projetos/multgestor/agentes/planner.md` | `planejador.md` |
| `projetos/multgestor/agentes/platform-architect.md` | `arquiteto-plataforma.md` |
| `projetos/multgestor/agentes/product-manager.md` | `gerente-produto.md` |
| `projetos/multgestor/agentes/product-owner.md` | `dono-produto.md` |
| `projetos/multgestor/agentes/providers.md` | `provedores.md` |
| `projetos/multgestor/agentes/security.md` | `seguranca.md` |
| `projetos/multgestor/workers.md` | `trabalhadores.md` |
| `projetos/multgestor/storage.md` | `armazenamento.md` |

### 3.2 Operação e runbooks

| Atual | Novo |
|---|---|
| `areas/operacao/production-readiness.md` | `prontidao-producao.md` |
| `areas/operacao/runbooks/backup-restore-plan.md` | `plano-restauracao-backup.md` |
| `areas/operacao/runbooks/reconciliation-plan.md` | `plano-conciliacao.md` |
| `areas/operacao/ops/digital-ops-center.md` | `centro-operacoes-digital.md` |
| `areas/operacao/ops/executive-intelligence.md` | `inteligencia-executiva.md` |
| `areas/operacao/ops/mission-closing-protocol.md` | `protocolo-encerramento-missao.md` |
| `areas/operacao/instrucoes-humanas/backup-external-copy-b2.md` | `backup-copia-externa-b2.md` |
| `areas/operacao/instrucoes-humanas/register-backup-scheduler.md` | `registrar-agendador-backup.md` |

### 3.3 Produto e roadmap

| Atual | Novo |
|---|---|
| `areas/produto-roadmap/commercial-readiness.md` | `prontidao-comercial.md` |
| `areas/produto-roadmap/compliance-intelligence.md` | `inteligencia-conformidade.md` |
| `areas/produto-roadmap/core-power-map.md` | `mapa-forca-core.md` |
| `areas/produto-roadmap/country-readiness-matrix.md` | `matriz-prontidao-paises.md` |
| `areas/produto-roadmap/global-benchmark-memory.md` | `memoria-benchmark-global.md` |
| `areas/produto-roadmap/global-market-radar.md` | `radar-mercado-global.md` |
| `areas/produto-roadmap/internationalization-requirements.md` | `requisitos-internacionalizacao.md` |
| `areas/produto-roadmap/pricing.md` | `precificacao.md` |
| `areas/produto-roadmap/product-futurist-engine.md` | `motor-futurista-produto.md` |
| `areas/produto-roadmap/strategic-decision-log.md` | `registro-decisoes-estrategicas.md` |
| `areas/produto-roadmap/vision.md` | `visao.md` |
| `projetos/multgestor/mapas/core/billing.md` | `faturamento.md` |
| `projetos/multgestor/mapas/nichos/barber-store.md` | `barbearia.md` |

### 3.4 Segurança e auditoria

| Atual | Novo |
|---|---|
| `areas/seguranca/security-secrets-rotation.md` | `rotacao-segredos.md` |
| `projetos/multgestor/mapas/seguranca/backup-restore-check.md` | `verificacao-restauracao-backup.md` |
| `projetos/multgestor/mapas/seguranca/secrets-rotation.md` | `rotacao-segredos.md` |
| `auditorias/multgestor/latest-audit.md` | `ultima-auditoria.md` |
| `auditorias/multgestor/2026-07-03-core-vs-nicho-audit.md` | `2026-07-03-core-vs-nicho-auditoria.md` |
| `auditorias/multgestor/2026-07-03-due-diligence-enterprise.md` | `2026-07-03-diligencia-devida-empresarial.md` |

### 3.5 Automação, filas, regras, templates

| Atual | Novo |
|---|---|
| `automation/autopilot-policy.md` | `politica-autopiloto.md` |
| `automation/command-allowlist.md` | `lista-permitida-comandos.md` |
| `queue/completed-task.md` | `tarefa-concluida.md` |
| `queue/current-task.md` | `tarefa-atual.md` |
| `queue/next-task.md` | `proxima-tarefa.md` |
| `rules/auditor-flow.md` | `fluxo-auditoria.md` |
| `rules/event-contracts.md` | `contratos-evento.md` |
| `rules/route-protection-abuse-control.md` | `protecao-rotas-controle-abuso.md` |
| `templates/preflight-check.md` | `verificacao-pre-voo.md` |
| `_inbox/revisar/agent-archive-index.md` | `indice-arquivo-agente.md` |
| `_inbox/revisar/brain-rules-README.md` | `regras-cerebro-visao-geral.md` |
| `_inbox/revisar/lessons-learned.md` | `licoes-aprendidas.md` |

### 3.6 Auditorias JoeFelipe Agent

| Atual | Novo |
|---|---|
| `auditorias/joefelipe-agent/README.md` | `visao-geral.md` |
| `auditorias/joefelipe-agent/latest-audit.md` | `ultima-auditoria.md` |

---

## Procedimento para cada rename

1. `git mv nome-antigo.md nome-novo.md`
2. Buscar `[[nome-antigo]]`, `[[pasta/nome-antigo]]`, `[[pasta/nome-antigo|alias]]`
   em TODO o `.opencodex/` (exceto `_inbox/antigos/` e arquivos protegidos)
3. Substituir cada ocorrência pelo novo caminho
4. Se o link usava alias (`[[antigo|Alias]]`), manter o alias
5. Avançar para o próximo

## Links quebrados aceitos (não corrigir)

Arquivos protegidos que NÃO podem ser editados:
- `.opencodex/HOME.md`
- `.opencodex/ATLAS.md`
- `.opencodex/MAPA-DAS-PASTAS.md`
- `.opencodex/CONVENCOES.md`
- `.opencodex/FLUXOS.md`
- `.opencodex/GLOSSARIO.md`
- `_inbox/antigos/*` (congelado)

Ao final de cada lote, listar os links quebrados que sobraram
exclusivamente nesses arquivos — para decisão humana posterior.

## Verificação (ao final de cada lote)

- [ ] Todos os `git mv` foram executados (git status mostra renames)
- [ ] Nenhum wikilink `[[nome-antigo]]` sem `[[` escapa sem correção
- [ ] Links quebrados só existem nos arquivos protegidos listados
- [ ] git diff mostra apenas renames + correções de link
- [ ] Nenhum conteúdo de documento foi alterado (só nome do arquivo e links)