# Prompt — Executor: Governança Documental do Obsidian

## Origem

Projeto: Organização do Obsidian (chatJoe)
Missão: Governança Documental
Risco: 3 (rename de conteúdo existente — precisa revisão)
Skills: documentacao, produto, code-review
Agentes: Technical Writer, Platform Architect
Auditoria: Sim

## Objetivo

Estabelecer governança documental no `.opencodex/` com 8 documentos canônicos,
cada um respondendo UMA pergunta. Consolidar hubs duplicados. Padronizar
nomes em português via aliases (sem renomear READMEs).

## Regra fundamental

Cada documento responde uma única pergunta:

| Documento | Pergunta |
|---|---|
| Início | "Onde entro?" |
| Índice Geral | "Onde está cada coisa?" |
| Base de Conhecimento | "Como funciona?" |
| Segundo Cérebro | "O que pensei/planejei?" |
| Diário do Projeto | "O que aconteceu?" |
| Decisões | "Por que foi feito assim?" |
| Arquitetura | "Como o sistema funciona?" |
| Mapa do Projeto | "Onde cada coisa fica?" |

Nunca duas.

## Entrega 1 — Documento de Governança

Criar `Governanca-Documental.md` na raiz de `.opencodex/` com:

1. Tabela dos 8 documentos canônicos e suas perguntas
2. Regra "um documento = uma responsabilidade"
3. Mapa de quais arquivos hoje correspondem a cada papel
4. Instruções: ao criar documento novo, primeiro identificar qual pergunta
   ele responde e qual documento canônico ele pertence

## Entrega 2 — Aliases (nomes em português)

Nos Índices existentes (`00-HOME.md`, `BarberGestor - HOME.md`,
`Segurança - Índice.md`, etc.), substituir links puros por links com alias:

| Link atual | Novo |
|---|---|
| `[[decisoes/visao-geral]]` | `[[decisoes/visao-geral\|Visão Geral — Decisões]]` |
| `[[areas/operacao/runbooks/visao-geral]]` | `[[areas/operacao/runbooks/visao-geral\|Runbooks Operacionais]]` |
| `[[projetos/multgestor/visao-geral]]` | `[[projetos/multgestor/visao-geral\|Visão Geral — MultGestor]]` |
| `[[projetos/multgestor/indice]]` | `[[projetos/multgestor/indice\|Índice do MultGestor]]` |
| `[[projetos/multgestor/knowledge-os]]` | `[[projetos/multgestor/knowledge-os\|Knowledge OS (legado)]]` |
| `[[chatJoe/README]]` | `[[chatJoe/README\|chatJoe — Planejamento]]` |
| `[[areas/produto-roadmap/visao-geral]]` | `[[areas/produto-roadmap/visao-geral\|Roadmap — Visão Geral]]` |

NÃO renomear os arquivos. Só mudar como aparecem nos Índices.

## Entrega 3 — Consolidar Base de Conhecimento

O arquivo `projetos/multgestor/knowledge-os.md` (232 linhas) mistura
conhecimento permanente com metadados de governança.

1. Criar `Base de Conhecimento.md` na raiz de `.opencodex/` com:
   - Conhecimento técnico permanente (arquitetura, banco, segurança, etc.)
   - Links para docs técnicos em `projetos/multgestor/` e `areas/`
   - Estrutura por assunto, não por projeto
2. Em `knowledge-os.md` (existente), adicionar aviso no topo:
   "Legado — conhecimento migrado para [[Base de Conhecimento]]"
3. Atualizar `00-HOME.md` para incluir link a `[[Base de Conhecimento]]`
   na seção "Áreas técnicas"

## Entrega 4 — Consolidar Segundo Cérebro

Hoje o "segundo cérebro" está disperso em:
- `chatJoe/projetos/ideias/` — ideias de melhoria
- `chatJoe/memoria/preferencias-do-joe.md` — preferências
- `_inbox/antigos/segundo cerebro/` — vault arquivado
- `_inbox/antigos/brain-*.md` — brain arquivado
- `_inbox/revisar/` — itens não classificados

1. Criar `Segundo Cérebro.md` na raiz de `.opencodex/` com:
   - Seção "Ideias em aberto" — link para `chatJoe/projetos/ideias/`
   - Seção "Arquivo Histórico" — link para `_inbox/antigos/`
   - Seção "Pendências de classificação" — link para `_inbox/revisar/`
2. Atualizar `00-HOME.md` para incluir `[[Segundo Cérebro]]` na seção Pensamento

## Entrega 5 — Criar Diário do Projeto

1. Criar `Diário do Projeto.md` na raiz de `.opencodex/` com template
2. Adicionar entrada inicial do dia de hoje
3. Atualizar `00-HOME.md` para incluir `[[Diário do Projeto]]`

## Entrega 6 — Atualizar 00-HOME.md (painel central)

```markdown
# Open Codex — Painel Central

## Projetos
- [[projetos/multgestor/inicio|MultGestor]]
- [[projetos/joefelipe-agent/inicio|JoeFelipe Agent]]
- [[BarberGestor - HOME]]
- [[MultCriativos - HOME]]

## Navegação
- [[Índice Geral]]
- [[Mapa do Projeto]]

## Conhecimento
- [[Base de Conhecimento]]
- [[Arquitetura]]
- [[Decisões — Índice]]

## Pensamento
- [[Segundo Cérebro]]
- [[Diário do Projeto]]

## Áreas técnicas
- [[Segurança - Índice]] · [[Banco de Dados - Índice]]
- [[Frontend - Índice]] · [[Backend - Índice]]
- [[Deploy e Produção - Índice]]
- [[Billing e Pagamentos - Índice]]

## Operação
- [[chatJoe/README|chatJoe — Planejamento]]
- [[decisoes/visao-geral|Visão Geral — Decisões (ADRs)]]
- [[areas/operacao/runbooks/visao-geral|Runbooks Operacionais]]
```

## Restrições

1. NÃO renomear ou mover arquivos existentes
2. NÃO mexer em HOME.md, MAPA-DAS-PASTAS.md, CONVENCOES.md,
   FLUXOS.md, GLOSSARIO.md, ATLAS.md (protegidos)
3. NÃO mexer em queue/, rules/, handoff/, templates/,
   chatJoe/, automation/, ops/playbooks.md
4. Aliases só mudam como o link aparece

## Verificação

- [ ] `Governanca-Documental.md` criado com os 8 documentos canônicos
- [ ] Todos os links em Índices usam alias em português
- [ ] `Base de Conhecimento.md` criado com conhecimento técnico
- [ ] `knowledge-os.md` marcado como legado
- [ ] `Segundo Cérebro.md` criado indexando ideias dispersas
- [ ] `Diário do Projeto.md` criado com template + entrada inicial
- [ ] `00-HOME.md` reflete os 8 documentos canônicos
- [ ] Nenhum arquivo renomeado ou movido
- [ ] Nenhum arquivo protegido alterado