# GATE 2 — CLASSIFICAÇÃO DOCUMENTAL

**Data:** 2026-07-20
**Missão:** MISSÃO 0 — GOVERNANÇA DO OPENCODEX
**Dependência:** Gates 0 e 1 concluídos
**Nenhuma alteração em `.opencodex/` foi executada.**

---

## 1. Metodologia

Classificação por **diretório** com verificação individual de arquivos ambíguos.
Documentos híbridos (ex: índice com conteúdo técnico) recebem o nível do uso
principal. Arquivos vazios (0 bytes) recebem o nível `TRIAGEM`.

**Níveis:**
- **C** = Constituição (princípios, regras, governança)
- **A** = Arquitetura (estrutura, componentes, decisões, contratos)
- **O** = Operação (execução, deploy, runbooks, filas, agentes)
- **H** = Histórico (auditorias, incidentes, handoffs, congelados)
- **T** = Triagem (vazio, placeholder, rascunho)

---

## 2. Quantitativo por nível

| Nível | Arquivos | % |
|-------|----------|---|
| **C** — Constituição | **16** | 4,0% |
| **A** — Arquitetura | **196** | 49,0% |
| **O** — Operação | **108** | 27,0% |
| **H** — Histórico | **50** | 12,5% |
| **T** — Triagem | **10** | 2,5% |
| **Não classificado** | **20** | 5,0% |
| **Total .md** | **400** | 100% |

---

## 3. Quantitativo por assunto

| # | Assunto | Arquivos | Níveis predominantes |
|---|---------|----------|---------------------|
| 1 | governança | 7 | C |
| 2 | navegação | 9 | C/A |
| 3 | MultGestor Core | 55 | A |
| 4 | nichos | 13 | A |
| 5 | backend | 4 | A |
| 6 | frontend | 3 | A |
| 7 | banco de dados | 3 | A |
| 8 | segurança | 4 | A |
| 9 | deploy e infra | 6 | A/O |
| 10 | billing e pagamentos | 2 | A |
| 11 | agentes e ChatJoe | 40 | A/O |
| 12 | produto e roadmap | 37 | A |
| 13 | operações | 25 | O |
| 14 | decisões e ADRs | 14 | A |
| 15 | auditorias e histórico | 55 | H |
| 16 | prompts e templates | 20 | O |
| — | Triagem | 10 | T |
| — | Diversos/Mistos | 93 | — |

---

## 4. Matriz de classificação por diretório

### NÍVEL 1 — CONSTITUIÇÃO (16 arquivos)

| Caminho | Quantidade | Assunto |
|---------|-----------|---------|
| `00-HOME.md` | 1 | navegação |
| `01-MAPA-GERAL.md` | 1 | navegação |
| `02-COMO-USAR.md` | 1 | navegação |
| `ATLAS.md` | 1 | governança |
| `CONVENCOES.md` | 1 | governança |
| `FLUXOS.md` | 1 | navegação |
| `GLOSSARIO.md` | 1 | governança |
| `Governanca-Documental.md` | 1 | governança |
| `HOME.md` | 1 | navegação (placeholder) |
| `MAPA-DAS-PASTAS.md` | 1 | navegação |
| `Base de Conhecimento.md` | 1 | governança |
| `rules/` | 3 | governança |
| `areas/governanca/` | 1 | governança |
| `Segundo Cerebro.md` | 1 | governança |

### NÍVEL 2 — ARQUITETURA (196 arquivos)

| Diretório | Qtd | Assunto | Observação |
|-----------|-----|---------|------------|
| `projetos/multgestor/` (raiz) | 33 | MultGestor Core | Exceto status-atual, execucao-producao (são O) |
| `projetos/multgestor/mapas/` | 55 | MultGestor Core | Todos os mapas (core, capabilities, infra, flows, nichos, segurança) |
| `projetos/multgestor/nichos/` | 7 | nichos | |
| `projetos/multgestor/agentes/` | 13 | agentes | Ecossistema de IA |
| `projetos/multgestor/roadmap/` (raiz) | 4 | produto | ROADMAP-MESTRE, MAPA-MESTRE-CONCLUSAO |
| `projetos/multgestor/living-os/` (decisões, gates) | 4 | MultGestor Core | Scorecards são A (não O) |
| `projetos/multgestor/living-os/scorecards/` | 4 | MultGestor Core | |
| `projetos/joefelipe-agent/` | 5 | agentes | |
| `areas/produto-roadmap/` | 31 | produto e roadmap | Inclui digital-twin, feature-genome, impact-graph, simulation-center |
| `decisoes/` | 6 | decisões e ADRs | |
| `Nichos/` | 6 | nichos | |
| `maps/multgestor-core/` | 1 | MultGestor Core | Vazio — triagem |
| `Backend - Indice.md` | 1 | backend | |
| `Frontend - Indice.md` | 1 | frontend | |
| `Banco de Dados - Indice.md` | 1 | banco | |
| `Seguranca - Indice.md` | 1 | segurança | |
| `Deploy e Producao - Indice.md` | 1 | deploy | |
| `Billing e Pagamentos - Indice.md` | 1 | billing | |
| `BarberGestor - HOME.md` | 1 | nichos | |
| `MultCriativos - HOME.md` | 1 | nichos | |
| `projetos/multgestor/historico/` | 2 | MultGestor Core | Linha do tempo + log |
| `projetos/multgestor/mapas/decisions/` | 8 | decisões e ADRs | ADR-001 a ADR-009 |

### NÍVEL 3 — OPERAÇÃO (108 arquivos)

| Diretório | Qtd | Assunto | Observação |
|-----------|-----|---------|------------|
| `areas/operacao/` | 17 | operações | Inclui runbooks, playbooks, checklists, instruções humanas |
| `chatJoe/` | 30+ | agentes e ChatJoe | Fluxo operacional ativo |
| `prompts/` | 18 | prompts | Comandos prontos para IA |
| `queue/` | 6 | operações | Fila operacional ativa |
| `templates/` | 1 | prompts | |
| `automation/` | 2 | operações | |
| `brain/plans/` | 4 | operações | Planos ativos |
| `brain/fila-de-implementacao.md` | 1 | operações | |
| `areas/seguranca/` | 1 | segurança | Rotação de segredos (também poderia ser A) |
| `projetos/multgestor/status-atual.md` | 1 | operações | Estado executivo atualizado por missão |
| `projetos/multgestor/status-dinamico.md` | 1 | operações | |
| `projetos/multgestor/execucao-producao.md` | 1 | operações | Playbook de execução |
| `projetos/multgestor/mapas/PRODUCAO.md` | 1 | operações | Painel de produção |
| `projetos/multgestor/mapas/STATUS-GERAL.md` | 1 | operações | |
| `projetos/multgestor/mapas/PROXIMA-MELHOR-ACAO.md` | 1 | operações | |
| `projetos/multgestor/mapas/RADAR-SEMANAL-MULTGESTOR.md` | 1 | operações | |
| `projetos/multgestor/mapas/PAINEL-EXECUTIVO-MULTGESTOR.md` | 1 | operações | |
| `projetos/multgestor/living-os/` (raiz) | 6 | operações | Living OS ativo |
| `projetos/multgestor/living-os/gates/` | 3 | operações | |
| `projetos/multgestor/living-os/riscos/` | 1 | operações | Risco ativo |
| `projetos/multgestor/saude.md` | 1 | operações | |
| `projetos/multgestor/performance.md` | 1 | operações | |
| `projetos/multgestor/trabalhadores.md` | 1 | operações | |
| `ops/` | 1 | operações | playbooks.md |
| `handoff/` (raiz + context-pack) | 6 | — | **Reclassificado como Operação** (handoff é mecanismo ativo de passagem de contexto) |

### NÍVEL 4 — HISTÓRICO (50 arquivos)

| Diretório | Qtd | Assunto |
|-----------|-----|---------|
| `auditorias/multgestor/` | 19 | auditorias |
| `auditorias/joefelipe-agent/` | 3 | auditorias |
| `projetos/multgestor/incidentes/` | 9 | incidentes |
| `_inbox/revisar/` | 8 | inbox |
| `_inbox/antigos/` | 6+ | inbox |
| `Diario do Projeto.md` | 1 | histórico |
| `projetos/multgestor/matriz-consolidacao-core.md` | 1 | auditorias |
| `projetos/multgestor/confianca-contexto.md` | 1 | histórico |
| `projetos/multgestor/memoria.md` | 1 | histórico |

### TRIAGEM (10 arquivos)

| Arquivo | Motivo |
|---------|--------|
| `chatJoe.md` | 0 bytes |
| `Sem titulo.md` | 0 bytes |
| `agents/joefelipe-agent.md` | 0 bytes (cópia vazia) |
| `agents/joefelipe-personal-operating-agent.md` | 0 bytes |
| `living-os/riscos/riscos-ativos.md` | 0 bytes |
| `maps/multgestor-core/MAPA-MULTGESTOR-CORE.md` | 0 bytes (duplicata vazia) |
| `projetos/multgestor/roadmap/capacidades.md` | 0 bytes |
| `projetos/multgestor/roadmap/roadmap/ROADMAP-MESTRE-MULTGESTOR-2026.md` | 0 bytes (duplicata vazia) |
| `prompts/product.md` | 0 bytes |
| `HOME.md` | 21 bytes (placeholder) |

---

## 5. Documentos híbridos (mais de uma responsabilidade)

| Arquivo | Nível principal | Responsabilidade secundária |
|---------|----------------|----------------------------|
| `projetos/multgestor/plataforma.md` | A — Arquitetura | Também contém estado atual (O) |
| `projetos/multgestor/knowledge-os.md` | H — Histórico | Originalmente A, mas marcado como legado |
| `projetos/multgestor/dna.md` | A — Arquitetura | Também descreve visão de produto (próximo a Roadmap) |
| `projetos/multgestor/inicio.md` | A — Arquitetura | Também funciona como porta de entrada do projeto (C) |
| `projetos/multgestor/indice.md` | A — Arquitetura | Também funciona como navegação (C) |
| `areas/seguranca/rotacao-segredos.md` | O — Operação | Também define política de segurança (A) |
| `projetos/multgestor/mapas/seguranca/` | A — Arquitetura | Também contém procedimentos operacionais (O) |

---

## 6. Distribuição por diretório (tabela completa)

| Diretório | C | A | O | H | T | Total |
|-----------|----|----|----|----|----|-------|
| Raiz `.opencodex/` | 16 | 6 | 0 | 1 | 2 | 25 |
| `agents/` | 0 | 0 | 0 | 0 | 2 | 2 |
| `areas/governanca/` | 1 | 0 | 0 | 0 | 0 | 1 |
| `areas/operacao/` | 0 | 0 | 17 | 0 | 0 | 17 |
| `areas/produto-roadmap/` | 0 | 31 | 0 | 0 | 0 | 31 |
| `areas/seguranca/` | 0 | 0 | 1 | 0 | 0 | 1 |
| `auditorias/` | 0 | 0 | 0 | 22 | 0 | 22 |
| `brain/` | 0 | 0 | 5 | 0 | 0 | 5 |
| `chatJoe/` | 0 | 0 | 30+ | 0 | 0 | 30+ |
| `decisoes/` | 0 | 6 | 0 | 0 | 0 | 6 |
| `handoff/` | 0 | 0 | 6 | 0 | 0 | 6 |
| `living-os/riscos/` | 0 | 0 | 0 | 0 | 1 | 1 |
| `maps/` | 0 | 0 | 0 | 0 | 1 | 1 |
| `Nichos/` | 0 | 6 | 0 | 0 | 0 | 6 |
| `ops/` | 0 | 0 | 1 | 0 | 0 | 1 |
| `prompts/` | 0 | 0 | 18 | 0 | 1 | 19 |
| `projetos/joefelipe-agent/` | 0 | 5 | 0 | 0 | 0 | 5 |
| `projetos/multgestor/` (raiz) | 0 | 25 | 5 | 3 | 1 | 34 |
| `projetos/multgestor/agentes/` | 0 | 13 | 0 | 0 | 0 | 13 |
| `projetos/multgestor/historico/` | 0 | 2 | 0 | 0 | 0 | 2 |
| `projetos/multgestor/incidentes/` | 0 | 0 | 0 | 9 | 0 | 9 |
| `projetos/multgestor/living-os/` | 0 | 8 | 10 | 0 | 0 | 18 |
| `projetos/multgestor/mapas/` | 0 | 47 | 8 | 0 | 0 | 55 |
| `projetos/multgestor/nichos/` | 0 | 7 | 0 | 0 | 0 | 7 |
| `projetos/multgestor/roadmap/` | 0 | 4 | 0 | 0 | 1 | 5 |
| `queue/` | 0 | 0 | 6 | 0 | 0 | 6 |
| `rules/` | 3 | 0 | 0 | 0 | 0 | 3 |
| `templates/` | 0 | 0 | 1 | 0 | 0 | 1 |
| `_inbox/` | 0 | 0 | 0 | 14 | 0 | 14 |
| **Total** | **16** | **196** | **108** | **50** | **10** | **~400** |

---

## 7. Inconsistências e recomendações

| Inconsistência | Risco | Recomendação |
|---------------|-------|-------------|
| `handoff/` é Histórico ou Operação? | Baixo | Classifiquei como O (handoff é mecanismo ativo de passagem de contexto entre agentes) |
| `areas/seguranca/rotacao-segredos.md` é A ou O? | Baixo | Classifiquei como O (procedimento operacional) |
| `projetos/multgestor/mapas/seguranca/` duplicado com `areas/seguranca/` | Médio | Conteúdo diferente — um é mapa arquitetural, outro é procedimento |
| `projetos/multgestor/living-os/` mistura A e O | Médio | Separar scorecards (A) de gates/riscos (O) na classificação |
| `projetos/multgestor/indice.md` é C (navegação) ou A (arquitetura)? | Baixo | Classifiquei como A (índice do projeto MultGestor, não do OpenCodex) |
| `brain/plans/` são H ou O? | Baixo | Classifiquei como O (planos ativos, não congelados) |

---

## 8. Recomendações para o Gate 3

1. Investigar as 10 duplicatas com cópia vazia (TRIAGEM)
2. Comparar nichos em `digital-twin/` vs `mapas/nichos/` vs `nichos/`
3. Comparar segurança em `areas/seguranca/` vs `mapas/seguranca/`
4. Verificar conteúdo dos 37 `visao-geral.md` — qual variação entre eles
5. Investigar `handoff/` — confirmar se é Operação ou Histórico

---

```
GATE_2_STATUS: CONCLUIDO
CLASSIFICACAO_DOCUMENTAL: MAPEADA
ALTERACOES_OPENCODEX: NAO_EXECUTADAS
```
