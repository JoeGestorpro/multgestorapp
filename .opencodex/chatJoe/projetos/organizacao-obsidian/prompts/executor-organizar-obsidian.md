# Prompt — Executor: Organizar Navegação do Obsidian (MOC)

## Origem

Projeto: Organização do Obsidian (chatJoe)
Risco: 1 (criação de arquivos novos apenas)
Skills: documentacao, produto
Agentes: Technical Writer

## Objetivo

Criar uma camada de navegação MOC (Map of Content) na raiz de `.opencodex/` para que o Obsidian fique organizado e navegável — sem mover, renomear ou alterar arquivos existentes.

## Escopo

Criar **8 arquivos novos** na raiz de `.opencodex/` e **atualizar 1 arquivo existente** (`00-HOME.md`).

### Entrega 1 — Painel Central (`00-HOME.md`)

Substituir o conteúdo de `00-HOME.md` por:

```markdown
# Open Codex — Painel Central

> Porta de entrada para todo o conhecimento do vault.
> Navegue por projetos, áreas técnicas ou operação.

## Projetos

- [[projetos/multgestor/inicio|MultGestor]]
- [[projetos/joefelipe-agent/inicio|JoeFelipe Agent]]
- [[BarberGestor - HOME]]
- [[MultCriativos - HOME]]

## Áreas técnicas

- [[Segurança - Índice]]
- [[Banco de Dados - Índice]]
- [[Frontend - Índice]]
- [[Backend - Índice]]
- [[Deploy e Produção - Índice]]
- [[Billing e Pagamentos - Índice]]

## Operação

- [[chatJoe/README|chatJoe — planejamento de missões]]
- [[decisoes/visao-geral|Decisões arquiteturais (ADRs)]]
- [[areas/operacao/runbooks/visao-geral|Runbooks operacionais]]
- [[00-HOME|Início]]
- [[01-MAPA-GERAL|Mapa da estrutura de pastas]]
- [[02-COMO-USAR|Como usar esta estrutura]]
```

### Entrega 2 — BarberGestor - HOME.md

Criar `BarberGestor - HOME.md` na raiz de `.opencodex/`:

```markdown
# 💈 BarberGestor — HOME

> Vertical de prova do MultGestor. Primeiro nicho em produção ativa.

## Links rápidos

- **Digital Twin:** [[areas/produto-roadmap/digital-twin/barbergestor]]
- **Nicho (docs técnicas):** [[projetos/multgestor/nichos/barbergestor/visao-geral]]
- **Roadmap específico:** [[projetos/multgestor/roadmap/ROADMAP-MULTGESTOR-AUDITORIA-ATUAL]]
- **Auditorias:**
  - [[auditorias/multgestor/AUDITORIA-MULTGESTOR-BARBERGESTOR-ATUAL]]
  - [[auditorias/multgestor/2026-07-03-core-vs-nicho-auditoria]]
  - [[auditorias/multgestor/2026-07-03-diligencia-devida-empresarial]]
- **Feature Genomes:** [[areas/produto-roadmap/feature-genome/GENOMA-agendamento]], [[areas/produto-roadmap/feature-genome/GENOMA-gestao-caixa]]
- **Status atual:** [[projetos/multgestor/status-atual]] • [[projetos/multgestor/status-dinamico]]
- **Capacidades:** [[projetos/multgestor/capacidades]]
- **Precificação:** [[areas/produto-roadmap/precificacao]]

## Contexto

BarberGestor é o primeiro e único vertical em produção do MultGestor. Todo o Core foi construído a partir dele. Serve como referência arquitetural para os demais nichos.
```

### Entrega 3 — MultCriativos - HOME.md

Criar `MultCriativos - HOME.md` na raiz de `.opencodex/`:

```markdown
# MultCriativos — HOME

> Projeto mencionado como ativo nas preferências do Joe, mas sem documentação dedicada no vault ainda.

## Estado atual

- **Documentação:** pendente
- **Repositório:** não identificado neste vault
- **Próximo passo:** definir escopo e criar documentação inicial

## Links relacionados

- Menção em: [[chatJoe/memoria/preferencias-do-joe]]
- Menção em: [[chatJoe/projetos/ideias/contexto]]
```

### Entrega 4 — Segurança - Índice.md

```markdown
# Segurança — Índice

> Documentos sobre segurança, RLS, autenticação e autorização.

## Documentos

- [[projetos/multgestor/seguranca]] — segurança do MultGestor
- [[projetos/multgestor/rls]] — políticas Row Level Security
- [[areas/seguranca/rotacao-segredos]] — rotação de segredos
- [[projetos/multgestor/rate-limit]] — rate limiting
- [[projetos/multgestor/confianca-contexto]] — confiança e contexto multi-tenant
```

### Entrega 5 — Banco de Dados - Índice.md

```markdown
# Banco de Dados — Índice

> Documentos sobre banco de dados, schema, migrações e storage.

## Documentos

- [[projetos/multgestor/banco]] — banco de dados do MultGestor
- [[projetos/multgestor/armazenamento]] — storage Supabase
- [[areas/operacao/runbooks/banco-de-teste-local]] — runbook banco local
- [[decisoes/DECISION-GRAPH]] — decisões arquiteturais sobre DB
```

### Entrega 6 — Frontend - Índice.md

```markdown
# Frontend — Índice

> Documentos sobre frontend, UI e componentes.

## Documentos

- [[projetos/multgestor/frontend]] — frontend do MultGestor
- [[prompts/frontend/visao-geral]] — prompts de frontend
- [[projetos/multgestor/indice]] — índice completo do MultGestor (contém seção frontend)
```

### Entrega 7 — Backend - Índice.md

```markdown
# Backend — Índice

> Documentos sobre backend, API e serviços.

## Documentos

- [[projetos/multgestor/backend]] — backend do MultGestor
- [[projetos/multgestor/arquitetura]] — arquitetura geral
- [[projetos/multgestor/api*]] — contratos de API
- [[projetos/multgestor/trabalhadores]] — workers e jobs
- [[projetos/multgestor/eventos]] — event bus e mensageria
- [[projetos/multgestor/integracoes]] — integrações externas
- [[areas/operacao/runbooks/plano-conciliacao]]
```

### Entrega 8 — Deploy e Produção - Índice.md

```markdown
# Deploy e Produção — Índice

> Documentos sobre deploy, CI/CD, infraestrutura e produção.

## Documentos

- [[projetos/multgestor/deploy]] — deploy do MultGestor
- [[projetos/multgestor/ci-cd]] — CI/CD
- [[projetos/multgestor/infra]] — infraestrutura
- [[projetos/multgestor/observabilidade]] — observabilidade
- [[projetos/multgestor/performance]] — performance
- [[projetos/multgestor/saude]] — saúde do sistema
- [[areas/operacao/prontidao-producao]] — production readiness
- [[areas/operacao/runbooks/visao-geral]] — runbooks operacionais
- [[projetos/multgestor/execucao-producao]] — execução em produção
```

### Entrega 9 — Billing e Pagamentos - Índice.md

```markdown
# Billing e Pagamentos — Índice

> Documentos sobre billing, planos, pagamentos e assinaturas.

## Documentos

- Buscar no vault arquivos com "billing" ou "pagamento" no nome ou conteúdo:
  - `grep -i "billing\|pagament" .opencodex/projetos/multgestor/`
  - Linkar todos os encontrados
```

## Restrições

1. **NÃO alterar** nenhum arquivo existente — apenas criar novos e modificar `00-HOME.md`
2. **NÃO mexer** em `HOME.md`, `MAPA-DAS-PASTAS.md`, `CONVENCOES.md`, `FLUXOS.md`, `GLOSSARIO.md`, `ATLAS.md`
3. **NÃO mexer** em `queue/`, `rules/`, `handoff/`, `templates/`, `chatJoe/`, `automation/`, `ops/playbooks.md`
4. Nomes dos arquivos: exatamente como especificado (hífen + espaço antes de "HOME" e "Índice")
5. Todos os arquivos na raiz de `.opencodex/`

## Verificação

- [ ] `00-HOME.md` exibe seções Projetos, Áreas Técnicas e Operação com links
- [ ] `BarberGestor - HOME.md` criado com links para documentos existentes
- [ ] `MultCriativos - HOME.md` criado como placeholder
- [ ] 6 Índices de área criados (Segurança, Banco de Dados, Frontend, Backend, Deploy e Produção, Billing e Pagamentos)
- [ ] Nenhum arquivo existente foi alterado ou movido
- [ ] Todos os wikilinks em arquivos novos apontam para destinos que existem
- [ ] `00-HOME.md` anterior (versão com tabela) foi substituído pelo novo painel