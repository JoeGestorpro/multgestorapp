# ⚖️ Constituição do Knowledge OS

> **Status:** OFICIAL • VINCULANTE
> **Criado:** 2026-06-24
> **Propósito:** Princípios, governança e critérios de qualidade do Sistema Operacional de Conhecimento do MultGestor
> **Relação:** Complementa [[constituicao]]. Esta constituição rege o conhecimento; a `constitution.md` rege o produto e a engenharia.

---

## 1. Princípios do Knowledge OS

1. **O `.opencodex/brain` é a única Fonte Oficial da Verdade.** Nenhum conhecimento relevante pode existir apenas em conversas, issues ou comentários de código.
2. **O Obsidian é a Interface Oficial do Conhecimento.** Todo documento deve ser navegável via Graph View.
3. **Toda documentação deve possuir relacionamentos explícitos.** Nenhum documento é uma ilha — todo arquivo deve conter ao menos um [[wikilink]].
4. **Conhecimento não documentado é conhecimento perdido.** Se uma decisão foi tomada, um incidente ocorreu, ou uma lição foi aprendida, deve estar registrada.
5. **Cada missão começa e termina no Second Brain.** Nenhuma missão é concluída sem atualizar o Knowledge OS.
6. **Prefira referências cruzadas a duplicação.** Informação duplicada deteriora; referências cruzadas escalam.
7. **A hierarquia existe, mas o grafo é soberano.** A estrutura de diretórios organiza; os wikilinks conectam.
8. **Qualidade sobre quantidade.** Um documento bem escrito vale mais que dez documentos vazios.
9. **O Knowledge OS evolui com o projeto.** A estrutura não é fixa — novos módulos, nichos e camadas devem ser adicionados conforme o MultGestor cresce.
10. **IA deve compreender o projeto apenas lendo o Second Brain.** Todo contexto necessário para uma IA executar uma missão deve estar documentado.

---

## 2. Governança

### 2.1 Autoridade

| Documento | Autoridade | Escopo |
|---|---|---|
| [[constituicao]] | Vinculante | Produto, engenharia, segurança |
| **constitution-knowledge-os** (este) | **Vinculante** | **Knowledge OS, documentação, conhecimento** |
| [[fonte-unica-verdade]] | Vinculante | Hierarquia entre fontes |
| [[rules/README]] | Vinculante | Regras operacionais e de segurança |
| [[00-HOME]] | Navegação | Homepage do Second Brain |

### 2.2 Quem mantém

- **AI Agents (Claude Code, etc.):** Responsáveis por criar, atualizar e manter documentos conforme executam missões.
- **Humanos (JoeFelipe):** Aprovação final, decisões de arquivamento, definição de escopo.
- **Auditores:** Verificam consistência, qualidade e conformidade com esta constituição.

### 2.3 Ciclo de vida de um documento

```
CRIAÇÃO → Rascunho (draft) → Revisão → Publicação (oficial)
  → Atualização (conforme missões)
  → Arquivamento (quando obsoleto, com referência ao substituto)
```

### 2.4 Obrigação pós-missão

Toda missão **deve** terminar executando o [[ops/mission-closing-protocol|Mission Closing Protocol V3]], que inclui obrigatoriamente:

- Implementação verificada
- Testes validados
- Auditoria realizada
- **Knowledge OS atualizado**
- **Knowledge Graph atualizado**
- **Memória atualizada**
- Timeline atualizada
- Decisões registradas
- Lições registradas
- Próxima missão gerada

---

## 3. Estrutura de 7 Camadas

O Knowledge OS organiza-se em **7 camadas lógicas**. A estrutura de diretórios física permanece inalterada; as camadas são representadas no [[indice]].

| Camada | Nome | Conteúdo |
|---|---|---|
| 1 | **Conhecimento** | Documentação, PRDs, Runbooks, ADRs, Arquitetura, Digital Twin, Feature Genome, Impact Graph, Simulation Center |
| 2 | **Contexto** | Roadmap, Backlog, Estado Atual, Produção, Riscos |
| 3 | **Inteligência** | Agentes, Skills, Prompts, Mission Builder, Planner, Providers, Orquestrador |
| 4 | **Produto** | Fluxos, MVP, Nichos, Clientes, Comercial, Pricing |
| 5 | **Engenharia** | Frontend, Backend, Banco, Infra, CI/CD, Deploy, Observabilidade |
| 6 | **Operações** | Playbooks, Auditorias, Incidentes, Checklists, Rotinas |
| 7 | **Memória** | Timeline, Lições, Decisões, DNA, Histórico, Knowledge Graph, Knowledge Health |

A navegação entre camadas é feita via [[indice]], que organiza todos os documentos por camada.

---

## 4. Critérios de Qualidade

### 4.1 Scorecard de qualidade documental

Cada documento é avaliado nos seguintes critérios (0-5):

| Critério | Descrição |
|---|---|
| **Completude** | O documento cobre o escopo proposto sem lacunas? |
| **Precisão** | As informações estão corretas e atualizadas? |
| **Rastreabilidade** | O documento possui wikilinks para documentos relacionados? |
| **Navegabilidade** | É possível chegar a este documento via INDEX ou Graph View? |
| **Utilidade** | O documento é útil para seu público-alvo? |
| **Consistência** | Segue os padrões de formatação e naming? |

**Score mínimo aceitável:** 3/5 em cada critério.

### 4.2 Knowledge Health Scores

Indicadores globais de saúde do conhecimento, calculados e registrados em [[saude]]:

- **Cobertura:** % de módulos/funcionalidades com documentação completa
- **Atualização:** % de documentos atualizados nos últimos 30 dias
- **Conectividade:** média de wikilinks por documento
- **Consistência:** % de documentos seguindo os templates padronizados
- **Rastreabilidade:** % de decisões com alternativa documentada

---

## 5. Padronização

### 5.1 Frontmatter

```
---
status: draft \| oficial \| archived
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [tag1, tag2]
layer: 1-7
---
```

### 5.2 Naming de arquivos

- **kebab-case** (ex: `meu-arquivo.md`)
- Prefixos para tipos específicos:
  - `TEMPLATE-*` — Templates reutilizáveis
  - `INC-*` — Incidentes (ex: `INC-001`)
  - `D-*` — Decisões (ex: `D-015`)
  - `GENOME-*` — Feature Genomes
  - `IMPACT-*` — Impact Graphs
  - `SIMULATION-*` — Simulation Center
  - `AUDITORIA-*` — Auditorias

### 5.3 Status badges

| Badge | Significado |
|---|---|
| `**Status:** OFICIAL • VINCULANTE` | Regra obrigatória |
| `**Status:** OFICIAL • VIVO` | Documento ativo e atualizado |
| `**Status:** DRAFT • NÃO VINCULANTE` | Rascunho em elaboração |
| `**Status:** ARCHIVED • REFERÊNCIA` | Documento histórico |

---

## 6. Critérios para Criação e Arquivamento

### 6.1 Quando criar

| Tipo | Critério |
|---|---|
| PRD | Toda nova funcionalidade com escopo definido |
| Decisão | Toda decisão com alternativas consideradas |
| Incidente | Todo problema em produção que afetou usuários |
| Lição | Todo aprendizado relevante não coberto por incidente |
| Agente | Novo agente introduzido no ecossistema |
| Skill | Nova skill identificada ou criada |
| Prompt | Novo padrão de prompt validado |
| Feature Genome | Toda funcionalidade implementada com 2+ componentes envolvidos |
| Impact Graph | Toda alteração que afete 3+ áreas |
| Digital Twin | Todo módulo/nicho com escopo definido |

### 6.2 Quando NÃO criar

- Informação já documentada → use wikilink
- Informação trivial ou temporária → use comentário ou issue
- Informação pessoal não relacionada ao projeto

### 6.3 Quando arquivar

- Funcionalidade removida ou substituída
- Decisão superada por nova decisão
- Agente substituído por versão mais recente
- Documento obsoleto com substituto disponível

---

## 7. Templates Obrigatórios

| Template | Localização | Uso |
|---|---|---|
| PRD | [[product/prds/TEMPLATE-PRD]] | Toda nova funcionalidade |
| Decisão | [[decisions/TEMPLATE-DECISION]] | Toda decisão arquitetural ou de produto |
| Incidente | [[incidents/TEMPLATE-INCIDENT]] | Todo incidente |
| Lição | [[lessons/TEMPLATE-LESSON]] | Toda lição aprendida |
| Feature Genome | `product/feature-genome/TEMPLATE-FEATURE-GENOME` | Toda funcionalidade complexa |
| Impact Graph | `product/impact-graph/IMPACT-TEMPLATE` | Toda alteração cross-área |
| Simulation | `product/simulation-center/SIMULATION-TEMPLATE` | Todo cenário simulado |

---

## 8. Relação com Outros Documentos

| Documento | Relação |
|---|---|
| [[constituicao]] | Constituição do produto (supercede em regras de engenharia/segurança) |
| [[fonte-unica-verdade]] | Hierarquia de fontes |
| [[saude]] | Scorecards de saúde do conhecimento |
| [[dna]] | Identidade do projeto (princípios, padrões, valores) |
| [[memoria]] | Memória evolutiva do projeto |
| [[grafo-conhecimento]] | Mapa de relacionamentos entre documentos |
| [[knowledge-os]] | Knowledge OS — respostas rápidas |
| [[indice]] | Navegação por camadas |
| [[00-HOME]] | Homepage do Second Brain |
| [[ops/mission-closing-protocol]] | Protocolo de encerramento de missões |

---

## 9. Versionamento

O Knowledge OS possui versionamento próprio:

- **state_version** (em `01-CURRENT-STATE.md`): incrementado a cada missão que altera o brain
- **knowledge_os_version**: semver (ex: 3.0.0)

Toda alteração relevante no Knowledge OS deve ser registrada em [[linha-do-tempo]].

---

## 10. Auditoria do Conhecimento

Auditorias do Knowledge OS devem ocorrer:
- **Após cada missão:** verificação via mission closing protocol
- **Mensal:** auditoria completa de qualidade documental
- **Por gatilho:** quando um documento obsoleto é identificado

### Checklist de Auditoria

- [ ] Todos os wikilinks resolvem?
- [ ] Nenhum documento duplicado?
- [ ] Frontmatter presente e correto?
- [ ] Documentos seguem templates?
- [ ] Nenhuma informação importante apenas em conversas?
- [ ] Health scores calculados?
- [ ] INDEX reflete a estrutura atual?

---

## 11. Disposições Finais

1. Esta constituição entra em vigor imediatamente após aprovação.
2. Conflitos entre esta constituição e documentos existentes devem ser resolvidos pelo mais específico.
3. Propostas de alteração devem ser documentadas como decisão (TEMPLATE-DECISION).
4. O não cumprimento dos critérios de qualidade deve gerar um incidente ou tarefa de correção.
5. Esta constituição deve ser revisada a cada 3 meses ou quando o Knowledge OS atingir uma nova versão major.
