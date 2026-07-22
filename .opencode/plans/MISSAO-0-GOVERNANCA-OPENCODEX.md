# MISSÃO 0 — GOVERNANÇA DO OPENCODEX

**Versão:** 1.0 | **Data:** 2026-07-20
**Modo atual:** PLAN — nenhuma alteração em `.opencodex/` autorizada
**Dependências:** Inventário OpenCodex (já executado parcialmente)
**Base branch:** `docs/sec-booking-rls-001` | **HEAD:** `0d392e6`

---

## 0. Justificativa

O OpenCodex possui **417 arquivos, 400 `.md`, 94 diretórios** e uma arquitetura
documental já definida (ATLAS → HOME → MAPA → GLOSSARIO → FLUXOS → CONVENCOES).
O problema não é falta de documentação — é **falta de governança sobre o que já
existe**. Criar mais documentos sem antes organizar o ecossistema atual aumenta
a complexidade em vez de reduzi-la.

Esta missão antecede qualquer trabalho de arquitetura canônica do MultGestor.
A MISSÃO 1 — ARQUITETURA CANÔNICA DO MULTGESTOR permanece bloqueada até o
encerramento desta.

---

## 1. Objetivo

Garantir que o OpenCodex possua:

- uma **fonte canônica** para cada assunto;
- **responsabilidades documentais** claras;
- **navegação consistente**;
- documentos **históricos separados** dos documentos **normativos**;
- **ausência de duplicidade** lógica;
- **ausência de documentos órfãos** relevantes;
- arquitetura documental **compatível com o estado atual** do MultGestor.

Esta missão **não cria** uma nova arquitetura documental paralela.
Ela audita, classifica e consolida a estrutura já existente.

---

## 2. Escopo autorizado

### Permitido

- leitura de arquivos
- inventário
- comparação
- classificação
- identificação de conflitos
- proposição de links e responsabilidades
- escrita apenas em `.opencode/plans/`

### Não permitido

- alterar arquivos existentes em `.opencodex/`
- apagar, mover ou renomear arquivos
- alterar código
- alterar permissões
- branch, commit, push ou PR
- banco, migration, deploy ou produção

---

## 3. Modelo de classificação

Cada documento relevante será classificado em um dos quatro níveis:

### NÍVEL 1 — CONSTITUIÇÃO

Documentos normativos que orientam todo o OpenCodex.

Candidatos:
- `ATLAS.md` — visão e filosofia do Knowledge OS
- `Governanca-Documental.md` — regras de governança documental
- `CONVENCOES.md` — regras da casa para contribuição
- `GLOSSARIO.md` — vocabulário técnico do Knowledge OS

---

### NÍVEL 2 — ARQUITETURA

Documentos que descrevem estrutura, decisões e contratos.

Candidatos:
- `projetos/multgestor/mapas/` — 55 arquivos (core, capabilities, infra, flows, ADRs, nichos, segurança)
- `decisoes/` — ADRs e decisões arquiteturais
- `projetos/multgestor/` — arquitetura, backend, frontend, banco, capacidades
- `areas/produto-roadmap/` — digital twin, feature genome, impact graph
- `Nichos/` — templates e instrutores de nicho
- `maps/multgestor-core/`

---

### NÍVEL 3 — OPERAÇÃO

Documentos utilizados para executar e manter o sistema.

Candidatos:
- `areas/operacao/` — runbooks, playbooks, checklists, instruções humanas
- `areas/seguranca/`
- `projetos/multgestor/incidentes/`
- `projetos/multgestor/living-os/`
- `handoff/`
- `automation/`

---

### NÍVEL 4 — HISTÓRICO

Registros que preservam contexto, mas **não governam** o estado atual.

Candidatos:
- `auditorias/` — 22 arquivos (joefelipe-agent + multgestor)
- `handoff/context-pack/` — pacotes de transferência
- `_inbox/` — conteúdo não processado
- `chatJoe/` — execução, agentes, memória, projetos
- `Diario do Projeto.md`

---

## 4. Perguntas obrigatórias da auditoria

Para cada grupo documental, responder:

1. Existe documento **sem responsabilidade clara**?
2. Mais de um documento **responde à mesma pergunta**?
3. Existe documento importante **não referenciado** por nenhum índice?
4. Algum índice **não aponta** para os documentos atuais?
5. Alguma pasta ou estrutura **perdeu função** após reorganizações?
6. Há documento **histórico sendo tratado como fonte atual**?
7. Há documento canônico **contradizendo código ou operação**?
8. Há **nomes iguais ou equivalentes** em locais diferentes?
9. Há **links quebrados** ou navegação circular?
10. Qual documento deve ser a **fonte única** para cada assunto?

---

## 5. Gates

### GATE 0 — MODELO DE CONHECIMENTO

Construir o grafo documental:

- quem aponta para quem
- quais são as portas de entrada
- quais são documentos normativos
- quais são índices
- quais são mapas
- quais são históricos
- quais estão órfãos (não referenciados, sem referências para eles)

**Saída:** `MODELO_DE_CONHECIMENTO_MAPEADO`

---

### GATE 1 — INVENTÁRIO COMPLETO

Consolidar em formato tabular:

- quantidade de arquivos (total: 417, `.md`: 400)
- diretórios (total: 94)
- formatos (`.md`, `.json`, `.canvas`)
- documentos de navegação (HOME, ATLAS, MAPA, GLOSSARIO, FLUXOS, CONVENCOES)
- documentos por projeto e área
- nomes repetidos (ex: `MAPA-MULTGESTOR-CORE.md` em 2 locais)
- placeholders (ex: `HOME.md` vazio)

**Saída:** `INVENTARIO_OPENCODEX_VALIDADO`

---

### GATE 2 — CLASSIFICAÇÃO

Classificar todos os documentos relevantes em:

**Por nível (4):**
- Constituição
- Arquitetura
- Operação
- Histórico

**Por assunto (12):**
- governança
- arquitetura
- backend
- frontend
- banco
- segurança
- deploy
- billing
- nichos
- operação
- ChatJoe
- agentes

**Saída:** `CLASSIFICACAO_DOCUMENTAL_APROVADA`

---

### GATE 3 — DUPLICIDADES E SOBREPOSIÇÕES

Analisar especialmente:

- `HOME.md` (vazio) versus `00-HOME.md` (painel principal, 41 linhas)
- `ATLAS.md` (filosofia) versus `01-MAPA-GERAL.md` (reorganização)
- `MAPA-DAS-PASTAS.md` (responsabilidades) versus `01-MAPA-GERAL.md` (estrutura)
- `Governanca-Documental.md` versus `CONVENCOES.md` versus `02-COMO-USAR.md`
- `maps/multgestor-core/MAPA-MULTGESTOR-CORE.md` versus `projetos/multgestor/mapas/MAPA-MULTGESTOR-CORE.md`
- múltiplos arquivos `visao-geral.md` (dezenas)
- `ROADMAP-MESTRE-MULTGESTOR-2026.md` na raiz do roadmap versus cópia em `roadmap/roadmap/`

Não apagar ou modificar nada. Apenas documentar.

**Saída:** `DUPLICIDADES_DOCUMENTADAS`

---

### GATE 4 — CONFLITOS E DESATUALIZAÇÃO

Identificar:

- documentos que contradizem o código (ex: `AUDIT_REPORT.md` com 5 objeções descartadas)
- documentos que contradizem produção
- documentos antigos apresentados como atuais
- status divergentes (ex: capabilities-map marca Repository como "planned", código já implementa)
- métricas incompatíveis
- conceitos com nomes diferentes para a mesma coisa

**Saída:** `CONFLITOS_DOCUMENTAIS_MARCADOS`

---

### GATE 5 — FONTES CANÔNICAS

Definir proposta de fonte única por assunto.

Hipótese inicial (a validar pela auditoria):

| Assunto | Fonte canônica candidata |
|---------|-------------------------|
| Visão e filosofia | `ATLAS.md` |
| Entrada principal | `00-HOME.md` |
| Organização macro | `01-MAPA-GERAL.md` |
| Responsabilidades de pastas | `MAPA-DAS-PASTAS.md` |
| Governança documental | `Governanca-Documental.md` |
| Convenções | `CONVENCOES.md` |
| Processos e fluxos | `FLUXOS.md` |
| Vocabulário | `GLOSSARIO.md` |
| Backend | `Backend - Indice.md` |
| Frontend | `Frontend - Indice.md` |
| Banco de dados | `Banco de Dados - Indice.md` |
| Deploy | `Deploy e Producao - Indice.md` |
| Segurança | `Seguranca - Indice.md` |
| Billing | `Billing e Pagamentos - Indice.md` |

Documentos que não forem a fonte canônica passam a apontar para ela,
em vez de repetir conteúdo.

**Saída:** `MAPA_DE_FONTES_CANONICAS_PROPOSTO`

---

### GATE 6 — PLANO DE CONSOLIDAÇÃO

Produzir plano de ação (sem executar alterações) contendo:

- documentos a **manter** como estão
- documentos a **transformar em índice** (redirecionar para a fonte canônica)
- documentos a **marcar como histórico**
- documentos a **redirecionar** (inserir front matter/link no topo)
- documentos a **revisar** (conteúdo desatualizado)
- possíveis arquivos **obsoletos**
- **ordem segura** de atualização (qual documento atualizar primeiro)
- **riscos** de cada ação
- **dependências** entre documentos
- **autorizações necessárias** para cada tipo de alteração

**Saída:** `PLANO_DE_CONSOLIDACAO_PRONTO`

---

## 6. Arquivos de evidência base

Os seguintes documentos em `.opencode/plans/` contêm a fotografia arquitetural
do MultGestor que servirá como referência para detectar conflitos (Gate 4):

| Arquivo | Conteúdo |
|---------|----------|
| `consolidacao-readme.md` | Resumo executivo dos 3 terminais |
| `consolidacao-matriz-evidencias.md` | 40 capacidades classificadas pós-Gate 4 |
| `consolidacao-objecoes.md` | 7 objeções confirmadas, 5 descartadas |
| `consolidacao-fronteira-core-nichos.md` | Fronteira Core x capacidades x nichos |
| `consolidacao-gate-4.md` | Reconciliação com métricas corrigidas |
| `consolidacao-proximas-validacoes.md` | 23 validações pendentes |

---

## 7. Gates de parada

Ao final de cada gate, **parar** e apresentar:

- evidências coletadas
- arquivos analisados
- decisões propostas
- contradições encontradas
- riscos identificados
- itens inconclusivos
- ações que exigem autorização

**Não avançar automaticamente** para alterações em `.opencodex/`.
Cada transação entre gates exige autorização explícita.

---

## 8. Condição de encerramento

A Missão 0 só será considerada concluída quando existirem **todos** os seguintes
artefatos em `.opencode/plans/`:

- [ ] GRAFO_DOCUMENTAL.md (Gate 0)
- [ ] INVENTARIO_OPENCODEX.md (Gate 1)
- [ ] CLASSIFICACAO_DOCUMENTAL.md (Gate 2)
- [ ] DUPLICIDADES.md (Gate 3)
- [ ] CONFLITOS_DOCUMENTAIS.md (Gate 4)
- [ ] FONTES_CANONICAS.md (Gate 5)
- [ ] PLANO_DE_CONSOLIDACAO.md (Gate 6)

E **nenhuma alteração** aplicada fora de `.opencode/plans/`.

---

## 9. Status final esperado

```
MISSAO_0_PLANEJADA
ALTERACOES_OPENCODEX: NAO_EXECUTADAS
MISSAO_1_ARQUITETURA_CANONICA: BLOQUEADA_ATE_APROVACAO
```

---

## 10. Anexo — Inventário preliminar do OpenCodex

### Estatísticas gerais

| Métrica | Valor |
|---------|-------|
| Total de arquivos | **417** |
| Arquivos `.md` | **400** |
| Arquivos não-MD | 17 (JSON, canvas) |
| Diretórios | **94** |
| Arquivos README.md | **14** |
| Documentos de navegação na raiz | 16 |

### Estrutura de diretórios (resumo)

```
.opencodex/
├── agents/                    (2 arquivos)
├── areas/
│   ├── governanca/            (1 arquivo)
│   ├── operacao/              (17 arquivos em 7 subpastas)
│   ├── produto-roadmap/       (31 arquivos em 6 subpastas)
│   └── seguranca/             (1 arquivo)
├── auditorias/
│   ├── joefelipe-agent/       (3 arquivos)
│   └── multgestor/            (19 arquivos)
├── automation/                (2 arquivos)
├── brain/
│   ├── raiz                   (1 arquivo)
│   └── plans/                 (4 arquivos)
├── chatJoe/                   (30+ arquivos em 15 subpastas)
├── decisoes/                  (6 arquivos)
├── handoff/context-pack/      (6 arquivos)
├── living-os/riscos/          (1 arquivo)
├── maps/multgestor-core/      (1 arquivo)
├── Nichos/                    (6 arquivos)
├── ops/                       (1 arquivo)
├── projetos/
│   ├── joefelipe-agent/       (5 arquivos)
│   └── multgestor/            (133 arquivos em 12 subpastas)
├── prompts/                   (18 arquivos em 12 subpastas)
├── queue/                     (6+ arquivos)
├── rules/                     (3 arquivos)
├── templates/                 (1 arquivo)
└── _inbox/                    (14+ arquivos)
```

### Documentos de navegação na raiz

| Arquivo | Linhas | Função aparente |
|---------|--------|----------------|
| `00-HOME.md` | 41 | Painel central — porta de entrada |
| `01-MAPA-GERAL.md` | 40 | Mapa da reorganização de 2026-07-07 |
| `02-COMO-USAR.md` | 22 | Guia rápido de onde colocar/procurar |
| `ATLAS.md` | 76 | Filosofia do Knowledge OS |
| `MAPA-DAS-PASTAS.md` | 56 | Matriz de responsabilidades das pastas |
| `GLOSSARIO.md` | 166 | Vocabulário técnico |
| `CONVENCOES.md` | 72 | Regras da casa |
| `FLUXOS.md` | 144 | Navegação por situação/jornada |
| `Governanca-Documental.md` | 70 | Regras de governança documental |
| `HOME.md` | 1 | Placeholder vazio ("C:\Users\Joefe") |
| `Base de Conhecimento.md` | 44 | Índice de conhecimento técnico |
| `Diario do Projeto.md` | — | Registro cronológico |
| `Segundo Cerebro.md` | — | Ideias e material histórico |

### Duplicações conhecidas (pré-Gate 3)

- `HOME.md` vs `00-HOME.md` — um vazio, um real
- `MAPA-MULTGESTOR-CORE.md` em `maps/multgestor-core/` e em `projetos/multgestor/mapas/`
- `ROADMAP-MESTRE-MULTGESTOR-2026.md` na raiz de roadmap e cópia em `roadmap/roadmap/`
- Múltiplos `visao-geral.md` — dezenas, um por pasta (padrão consistente, mas dificulta navegação)
