# MCP Governance — MultGestor Core

**Documento oficial de governança central dos MCPs, integrações, capabilities e AI Operational Architecture**  
**Versão:** 1.0.0  
**Data:** 2026-05-18  
**Status:** OFICIAL • VINCULANTE  
**Tipo:** Core Foundation — Governance  
**Classificação:** CRITICAL — Aplicável a todos os agentes, workflows e skills do ecossistema

---

## Índice

1. [Objetivo](#1-objetivo)
2. [Filosofia do Core](#2-filosofia-do-core)
3. [MCP Stack Oficial](#3-mcp-stack-oficial)
4. [Regras de Segurança](#4-regras-de-segurança)
5. [Capability Architecture](#5-capability-architecture)
6. [Fluxo Oficial dos Agentes](#6-fluxo-oficial-dos-agentes)
7. [Prompt Governance](#7-prompt-governance)
8. [AI Operational Layer](#8-ai-operational-layer)
9. [MCP Approval Policy](#9-mcp-approval-policy)
10. [Enterprise Evolution Roadmap](#10-enterprise-evolution-roadmap)

---

## 1. Objetivo

### 1.1 Propósito da Governança MCP

Este documento estabelece a **governança central** de todos os MCPs (Model Context Protocols) operando no ecossistema MultGestor. Cada MCP não é uma mera integração técnica — é uma **capacidade operacional** que adiciona inteligência, autonomia e poder de execução ao Core.

### 1.2 Padronização Operacional

Todo MCP deve seguir:

- **Contrato de capacidade**: cada MCP declara publicamente o que faz, como faz e o que NÃO faz
- **Interface padronizada**: todos os MCPs expõem tools via protocolo MCP; nenhum acessa o Core por fora
- **Registro oficial**: todo MCP ativo deve estar registrado em `.agent/memory/mcp-registry/`
- **Lifecycle tracking**: cada MCP tem estado (provisionado, ativo, degradado, desativado)
- **Dependency mapping**: todo MCP declara de quais capabilities do Core depende

### 1.3 Segurança

- **Zero token exposto**: nenhum secret, access token ou chave de API pode estar hardcoded em arquivos de configuração
- **Principle of Least Privilege**: cada MCP opera com o mínimo de permissão necessário para sua função
- **Auditoria obrigatória**: todo MCP tem logging estruturado e capacidade de auditoria
- **Rollback planejado**: antes de qualquer alteração via MCP, um plano de rollback deve existir
- **Rotação de credenciais**: tokens MCP têm data de expiração e rotação obrigatória

### 1.4 Capabilities

MCPs são **capabilities de infraestrutura** (tipo MCP no mapa oficial). Cada MCP adiciona uma camada operacional ao Core:

```
MCP Layer       → Capacidade que adiciona ao Core
─────────────────────────────────────────────────────
GitHub MCP      → Development Intelligence Layer
Supabase MCP    → Data Intelligence Layer
Filesystem MCP  → Workspace Operational Layer
Terminal MCP    → Execution Layer
Playwright MCP  → Autonomous QA Layer
Figma MCP       → Visual Intelligence Layer
Stitch MCP      → Design-to-Code Layer
N8N MCP         → Automation Layer
WhatsApp MCP    → Communication Layer
OpenAI/Anthropic → AI Operational Layer
```

### 1.5 AI-Native Architecture

O MultGestor Core foi projetado para ser **AI-native**. MCPs são o mecanismo pelo qual agentes de IA interagem com o sistema:

- **Agentes não tocam no Core diretamente** — tudo passa por MCPs
- **MCPs são a camada de tradução** entre linguagem natural e operações de sistema
- **Cada MCP encapsula um domínio de conhecimento** que a IA pode consultar/atuar
- **A orquestração entre MCPs é feita pelo OpenCode** (engine principal), não por scripts manuais

---

## 2. Filosofia do Core

### 2.1 Capability-Driven Architecture

O MultGestor não é construído em torno de features — é construído em torno de **capabilities**. Uma capability é um bloco de infraestrutura, domínio ou inteligência que pode ser utilizado por qualquer módulo vertical.

**Hierarquia de capabilities:**

```
Camada 0 — Core Foundation
├── Shared Kernel (C-01)
├── Multi-Tenant Engine (C-02)
├── Repository Pattern (C-03)
├── Event Bus (C-04)

Camada 1 — Integration
├── Integration Layer (C-05)
├── N8N Bridge (C-09)

Camada 2 — Operational
├── Automation Engine (C-06)

Camada 3 — AI & Intelligence
├── AI Operational Layer (C-07)

Camada 4 — Experience
├── Omnichannel Layer (C-08)

Camada MCP — Infrastructure Intelligence
├── M-01 a M-N (MCPs)
```

**Cada capability tem:**
- ID único (ex: C-01, M-01)
- D dono claro
- Contrato/interface definido
- Dependências mapeadas
- Estado de lifecycle conhecido
- Criticidade classificada (P0-P4)

### 2.2 Operational Intelligence

MCPs não são ferramentas passivas — são **camadas de inteligência operacional**:

| MCP | Intelligence Layer | Como opera |
|-----|-------------------|------------|
| GitHub MCP | Development Intelligence | Rastreia histórico, gerencia branches, versiona código |
| Supabase MCP | Data Intelligence | Consulta schema, executa migrations, valida dados |
| Filesystem MCP | Workspace Intelligence | Lê e modifica código local no workspace |
| Terminal MCP | Execution Intelligence | Compila, testa, faz deploy, executa comandos |
| Playwright MCP | QA Intelligence | Testa UX, valida fluxos, captura regressões |
| Figma MCP | Visual Intelligence | Extrai design tokens, componentes, specs visuais |
| Stitch MCP | Design-to-Code Intelligence | Converte designs em código |
| N8N MCP | Automation Intelligence | Orquestra workflows externos |
| WhatsApp MCP | Communication Intelligence | Gerencia mensagens, notificações, campanhas |
| OpenAI/Anthropic MCP | AI Intelligence | Processa linguagem natural, gera conteúdo, toma decisões |

### 2.3 Orchestration-First Architecture

Nenhum MCP age sozinho. Todo comando passa pelo **Orchestration Engine** (OpenCode) que:

1. **Classifica a tarefa** (tipo, risco, criticidade, camada)
2. **Seleciona o pipeline** (quais MCPs, workflows, skills)
3. **Executa na ordem correta** (dependências respeitadas)
4. **Valida o resultado** (gates obrigatórios)
5. **Registra a operação** (auditoria, memória, logs)

### 2.4 AI Operational Mindset

O Core do MultGestor opera sob estes princípios:

- **MCPs são extensões do sistema nervoso da IA** — cada MCP é um nervo que conecta a IA a um domínio específico
- **A IA não precisa saber detalhes de implementação** — cada MCP abstrai a complexidade do domínio
- **Toda operação é rastreável** — desde o prompt inicial até o resultado final
- **Falha de MCP é esperada e tratada** — todo pipeline tem fallback, retry e rollback
- **MCPs evoluem independentemente** — um MCP pode ser atualizado sem impactar outros

---

## 3. MCP Stack Oficial

### 3.1 Foundation MCPs (Sempre Ativos)

Estes MCPs são a **base operacional** do OpenCode e devem estar sempre disponíveis. Sem eles, nenhuma operação é possível.

| ID | MCP | Provider | Versão | Tools | Status | Config |
|----|-----|----------|--------|-------|--------|--------|
| M-01 | **GitHub** | `@modelcontextprotocol/server-github` | v0.6.2 | 26 | ✅ Ativo | `GITHUB_MCP_TOKEN` |
| M-02 | **Supabase** | `@supabase/mcp-server-supabase` | latest | 29 | ✅ Ativo | `SUPABASE_ACCESS_TOKEN` |
| M-03 | **Terminal** | Built-in OpenCode | — | n/a | ✅ Ativo | Nenhuma |
| M-04 | **Filesystem** | Built-in OpenCode | — | n/a | ✅ Ativo | Nenhuma |
| M-05 | **Playwright** | Pendente | — | — | 📋 Planejado | Pendente |

#### M-01: GitHub MCP — Development Intelligence Layer

| Campo | Valor |
|-------|-------|
| **Responsabilidade** | Histórico, branches, PRs, versionamento, rastreabilidade de código |
| **NÃO substitui** | Filesystem MCP (código local) |
| **Depende de** | Git local configurado |
| **Token** | `${GITHUB_MCP_TOKEN}` (User env var) |
| **Lifecycle** | ✅ Provisionado → ✅ Ativo |
| **Criticidade** | P1 — Essencial |

**Tools oficiais (26):** `create_or_update_file`, `search_repositories`, `get_file_contents`, `push_files`, `create_issue`, `create_pull_request`, `list_commits`, `list_issues`, `search_code`, `search_users`, `fork_repository`, `merge_pull_request`, `get_pull_request`, `get_pull_request_files`, `get_pull_request_comments`, `get_pull_request_reviews`, `get_pull_request_status`, `list_pull_requests`, `create_pull_request_review`, `update_pull_request_branch`, `create_repository`, `update_issue`, `get_issue`, `add_issue_comment`, `github_search_issues`, `github_create_branch`

**Limitações conhecidas:**
- Não substitui Filesystem MCP para leitura/escrita local
- Depende de conectividade com GitHub (não funciona offline)

#### M-02: Supabase MCP — Data Intelligence Layer

| Campo | Valor |
|-------|-------|
| **Responsabilidade** | Schema, tabelas, migrations, RLS, índices, queries, validação de dados |
| **NÃO substitui** | Terminal MCP (execução de migrations locais) |
| **Depende de** | Projeto Supabase ativo, access token válido |
| **Token** | `${SUPABASE_ACCESS_TOKEN}` (User env var) |
| **Lifecycle** | ✅ Provisionado → ✅ Ativo |
| **Criticidade** | P0 — Crítico |

**Tools oficiais (29):** `execute_sql`, `list_tables`, `list_migrations`, `apply_migration`, `get_schema`, `list_extensions`, `generate_typescript_types`, `deploy_edge_function`, `list_edge_functions`, `get_edge_function`, `get_project`, `get_project_url`, `get_publishable_keys`, `get_advisors`, `get_logs`, `get_cost`, `confirm_cost`, `create_project`, `create_branch`, `list_branches`, `merge_branch`, `rebase_branch`, `reset_branch`, `delete_branch`, `pause_project`, `restore_project`, `list_organizations`, `get_organization`, `list_projects`

**Regras de uso (do Master Orchestrator, seção 11):**
- Usar para consultar estrutura real do banco
- Nunca expor tokens ou secrets em logs
- Validar multi-tenant (`company_id`) em toda operação
- Operações destrutivas exigem plano + confirmação manual
- Registrar no plano quando usar Supabase MCP

#### M-03: Terminal MCP — Execution Layer

| Campo | Valor |
|-------|-------|
| **Responsabilidade** | Comandos shell, build, testes, migrations, lint, debug, deploy |
| **NÃO substitui** | Nenhum MCP específico |
| **Depende de** | Ambiente de desenvolvimento configurado |
| **Lifecycle** | ✅ Provisionado → ✅ Ativo |
| **Criticidade** | P0 — Crítico |

**Built-in via OpenCode:** Bash tool com execução de comandos PowerShell (Windows) com timeout configurável.

**Limitações conhecidas:**
- Apenas Windows PowerShell 5.1 (não PowerShell Core)
- Timeout padrão de 120s

#### M-04: Filesystem MCP — Workspace Operational Layer

| Campo | Valor |
|-------|-------|
| **Responsabilidade** | Ler, escrever, editar, buscar arquivos no workspace local |
| **NÃO substitui** | GitHub MCP (não versiona, não faz commit) |
| **Depende de** | Acesso ao sistema de arquivos |
| **Lifecycle** | ✅ Provisionado → ✅ Ativo |
| **Criticidade** | P0 — Crítico |

**Built-in via OpenCode:** Ferramentas Read, Write, Edit, Glob, Grep.

**Regras:**
- Sempre ler antes de editar
- Preferir edições cirúrgicas (edit) a reescritas completas
- Verificar diretório pai antes de criar novos arquivos

### 3.2 Operational MCPs (Integrações Externas)

Estes MCPs estendem o Core com capacidades operacionais de terceiros. São **plugáveis** — podem ser ativados/desativados sem impacto no Core.

| ID | MCP | Provider | Status | Criticidade |
|----|-----|----------|--------|-------------|
| M-06 | **Stitch** | Google MCP (`.agent/mcp_config.json`) | ⚠️ Parcial | P2 |
| M-07 | **Context7** | `.agent/mcp_config.json` | ⚠️ Parcial | P3 |
| M-08 | **Shadcn** | `.agent/mcp_config.json` | ⚠️ Parcial | P3 |

#### M-06: Stitch MCP — Design-to-Code Layer

| Campo | Valor |
|-------|-------|
| **Responsabilidade** | Gerar/editar componentes UI via IA de design |
| **NÃO substitui** | Filesystem MCP (não gerencia arquivos locais) |
| **Token** | `X-Goog-Api-Key` via `${STITCH_API_KEY}` em `.agent/mcp_config.json` ✅ |
| **Lifecycle** | ⚠️ Provisionado → ✅ Ativo (token migrado para env var) |
| **Criticidade** | P2 — Estratégico |

**Ação:** Token migrado para `STITCH_API_KEY` env var (User scope). Próxima rotação: 2026-08-16.

#### M-07: Context7 MCP — Context Intelligence Layer

| Campo | Valor |
|-------|-------|
| **Responsabilidade** | Contexto de engenharia, documentação técnica, busca semântica |
| **Lifecycle** | ⚠️ Provisionado → ⚠️ Inativo (não testado) |
| **Criticidade** | P3 — Baixa |

#### M-08: Shadcn MCP — UI Component Layer

| Campo | Valor |
|-------|-------|
| **Responsabilidade** | Gerenciamento de componentes Shadcn/ui |
| **Lifecycle** | ⚠️ Provisionado → ⚠️ Inativo (não testado) |
| **Criticidade** | P3 — Baixa |

### 3.3 Intelligence MCPs (Futuro)

Estes MCPs estão no roadmap e serão integrados conforme as fases do Enterprise Evolution Roadmap.

| ID | MCP | Provider | Previsão | Fase |
|----|-----|----------|----------|------|
| M-09 | **Figma MCP** | `@modelcontextprotocol/server-figma` | Fase 3 | AI-Native |
| M-10 | **OpenAI MCP** | `@openai/mcp-server` | Fase 3 | AI-Native |
| M-11 | **Anthropic MCP** | `@anthropic/mcp-server` | Fase 3 | AI-Native |
| M-12 | **N8N MCP** | `@n8n/mcp-server` | Fase 2 | Automation |
| M-13 | **WhatsApp MCP** | Custom (MultGestor) | Fase 2 | Communication |
| M-14 | **Redis MCP** | `@modelcontextprotocol/server-redis` | Fase 4 | Performance |
| M-15 | **Stripe MCP** | `@stripe/mcp-server` | Fase 3 | Payments |

### 3.4 MCP Stack Proibida

| MCP | Motivo | Alternativa |
|-----|--------|-------------|
| `@github/github-mcp-server` | **Não existe no npm** (404) | `@modelcontextprotocol/server-github` |
| Docker/K8s MCP | Infra atual (Render + Vercel) não justifica | Terminal MCP + Deploy manual |
| Qualquer MCP com token hardcoded | Violação de segurança | Env var pattern `${VAR}` |

---

## 4. Regras de Segurança

### 4.1 Tokens

**Regra G-TKN-01: Nenhum token hardcoded**

Nenhum token, access key, secret ou credential pode estar hardcoded em qualquer arquivo de configuração, código ou documentação.

```
✅ Correto:
  "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_MCP_TOKEN}" }

❌ Incorreto:
  "command": ["npx", "-y", "@supabase/...", "--access-token", "sbp_abc123"]

✅ Correto:
  "env": { "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}" }

❌ Incorreto:
  "headers": { "X-Goog-Api-Key": "AIzaSy..." }
```

**Regra G-TKN-02: Variáveis de ambiente**

Todo token MCP deve ser injetado via variável de ambiente, nunca via argumento de linha de comando.

**Padrão oficial:**
```
Arquivo: opencode.json
Formato: "${NOME_DA_VARIAVEL}"
Escopo: User (ambiente Windows)
Provider: [Environment]::SetEnvironmentVariable("NOME", "valor", "User")
```

**Registro de variáveis de ambiente MCP:**

| Variável | MCP | Escopo | Status |
|----------|-----|--------|--------|
| `GITHUB_MCP_TOKEN` | GitHub | User | ✅ Configurado |
| `SUPABASE_ACCESS_TOKEN` | Supabase | User | ✅ Configurado |
| `STITCH_API_KEY` | Stitch | User | ✅ Configurado (2026-05-18) |

**Regra G-TKN-03: Rotação de credenciais**

- Tokens MCP devem ser rotacionados a cada **90 dias**
- Rotação segue padrão: gerar novo token → configurar env var → testar MCP → revogar token antigo
- Rotação deve ser registrada em `.agent/memory/mcp-registry/<mcp-id>.md`

### 4.2 Arquivos .env

**Regra G-ENV-01: Separação de configuração de código**

- `.env` é para variáveis de ambiente da aplicação (backend/frontend)
- Tokens MCP nunca devem estar em `.env` do projeto
- Tokens MCP vivem no **sistema operacional** (env vars User/Machine) e em `opencode.json` (via `${VAR}`)

**Regra G-ENV-02: .env fora do versionamento**

- `.env` está em `.gitignore` — confirmado no repositório
- Nenhum commit pode conter `.env` com secrets

### 4.3 Segregação de Ambientes

**Regra G-AMB-01: Ambientes isolados**

| Ambiente | Uso | MCPs disponíveis | Nível de risco aceito |
|----------|-----|------------------|----------------------|
| **Desenvolvimento** | OpenCode local, edição, debug | Todos | CRITICAL_RISK |
| **Staging** | Homologação (futuro) | Leitura apenas | MEDIUM_RISK |
| **Produção** | Deploy, emergências | Somente leitura + deploy autorizado | LOW_RISK apenas |

**Regra G-AMB-02: Operações destrutivas**

No ambiente de desenvolvimento (único atual), operações destrutivas através de MCPs exigem:

1. Plano explícito via `plan-writing/SKILL.md`
2. Classificação CRITICAL_RISK
3. Confirmação manual do usuário (Gate 4 — Safe To Implement)
4. Rollback planejado antes da execução

### 4.4 Principle of Least Privilege (PoLP)

**Regra G-PLP-01: Mínimo de permissão**

Cada MCP opera com o mínimo de permissão necessário:

| MCP | Permissões mínimas | O que NÃO pode fazer |
|-----|-------------------|---------------------|
| GitHub MCP | Acesso ao repositório `JoeGestorpro/multgestorapp` | Deletar repositórios (não tem permissão no GitHub) |
| Supabase MCP | Acesso ao projeto Supabase via access token | Excluir projetos, modificar configurações de billing |
| Terminal MCP | Comandos no workspace | Comandos fora do workspace (restringido pelo OpenCode) |
| Filesystem MCP | Arquivos no workspace | Arquivos fora do workspace (restringido pelo OpenCode) |

**Regra G-PLP-02: Auditoria de permissões**

- A cada 30 dias, revisar escopo de tokens MCP
- Verificar se tokens têm acesso a recursos não utilizados
- Remover permissões não utilizadas

### 4.5 Auditoria

**Regra G-AUD-01: Registro de operações**

Toda operação via MCP deve ser registrada:

- **Log automático do OpenCode**: cada tool call é registrada
- **Implementation Log**: operações importantes registradas em `.agent/memory/implementation-log.md`
- **AI Audit System**: `.agent/system/ai-audit-system.md` valida consistência pós-tarefa

**Regra G-AUD-02: Rastreabilidade**

Toda operação MCP deve poder ser rastreada até:

- O prompt que a originou
- O agente/workflow que a executou
- A sessão OpenCode onde ocorreu
- O timestamp da operação

### 4.6 Logs

**Regra G-LOG-01: Logs sem tokens**

- Logs de operações MCP nunca devem conter tokens, secrets ou dados sensíveis
- Se um MCP retornar erro com token, o agente deve interceptar e sanitizar antes de exibir

**Regra G-LOG-02: Padrão de log**

```
[YYYY-MM-DD HH:MM:SS] [MCP: <id>] [TOOL: <name>] [STATUS: ok/error] [DURATION: <ms>] - <descrição segura>
```

### 4.7 Rollback

**Regra G-RLB-01: Rollback obrigatório**

Antes de qualquer operação destrutiva via MCP, um plano de rollback deve ser documentado:

```markdown
## Rollback Plan

### Operação
<descrição>

### Pontos de falha
- <o que pode falhar>

### Rollback
1. <passo 1 para reverter>
2. <passo 2 para reverter>

### Verificação
- <como verificar que o rollback funcionou>
```

**Regra G-RLB-02: Rollback por MCP**

| MCP | Método de rollback |
|-----|-------------------|
| GitHub MCP | `git revert`, `git reset`, reabrir PR |
| Supabase MCP | Migration reversa, restore de backup |
| Terminal MCP | `git checkout` de arquivos, rebuild |
| Filesystem MCP | `git checkout` (se versionado) |

### 4.8 Rotação de Credenciais

**Regra G-RTC-01: Ciclo de rotação**

```
90 dias: rotação obrigatória de tokens
30 dias: revisão de permissões
7 dias: alerta de expiração
```

**Regra G-RTC-02: Procedimento de rotação**

1. Gerar novo token no provider (GitHub, Supabase, etc.)
2. Definir nova env var: `[Environment]::SetEnvironmentVariable("NOME", "novo-token", "User")`
3. Testar MCP: abrir nova sessão OpenCode e verificar conexão
4. Revogar token antigo no provider
5. Registrar rotação em `.agent/memory/mcp-registry/<mcp-id>.md`

---

## 5. Capability Architecture

### 5.1 Matriz de Capabilities MCP

Cada MCP é mapeado como uma capability de infraestrutura no mapa oficial de capabilities.

| ID | MCP | Capability Layer | Depende de | Dependem dele | Status |
|----|-----|------------------|------------|---------------|--------|
| M-01 | GitHub | Development Intelligence | Git local | Nenhum | ✅ Ativo |
| M-02 | Supabase | Data Intelligence | Supabase project | N-01, N-02 | ✅ Ativo |
| M-03 | Terminal | Execution | Ambiente dev | Todos | ✅ Ativo |
| M-04 | Filesystem | Workspace | Workspace | Todos | ✅ Ativo |
| M-05 | Playwright | QA Intelligence | Aplicação rodando | N-01, N-02 | 📋 Planejado |
| M-06 | Stitch | Design-to-Code | Nenhum | Frontend | ⚠️ Parcial |
| M-07 | Context7 | Context Intelligence | Nenhum | Nenhum | ⚠️ Parcial |
| M-08 | Shadcn | UI Components | Nenhum | Frontend | ⚠️ Parcial |
| M-09 | Figma | Visual Intelligence | Figma API key | Frontend | 🔮 Futuro |
| M-10 | OpenAI | AI Intelligence | API key | N-01 | 🔮 Futuro |
| M-11 | Anthropic | AI Intelligence | API key | N-01 | 🔮 Futuro |
| M-12 | N8N | Automation | Event Bus (C-04) | Workflows | 🔮 Futuro |
| M-13 | WhatsApp | Communication | Integration Layer (C-05) | Clientes | 🔮 Futuro |
| M-14 | Redis | Performance | Repository (C-03) | Nenhum | 🔮 Futuro |
| M-15 | Stripe | Payments | Event Bus (C-04) | Billing | 🔮 Futuro |

### 5.2 Dependências entre MCPs e Core Capabilities

```
                    Core Capabilities                     MCP Layer
                    ──────────────────                   ─────────
C-01 Shared Kernel ──────────────────────────────────── M-03 Terminal
                                                        M-04 Filesystem
                                                        
C-02 Multi-Tenant ───────────────────────────────────── M-02 Supabase
                                                        
C-03 Repository ─────────────────────────────────────── M-02 Supabase
                                                        M-14 Redis (futuro)
                                                        
C-04 Event Bus ───────────────────────────────────────── M-12 N8N
                                                        M-13 WhatsApp
                                                        M-15 Stripe
                                                        
C-05 Integration Layer ──────────────────────────────── M-13 WhatsApp
                                                        
C-06 Automation Engine ──────────────────────────────── M-12 N8N
                                                        
C-07 AI Layer ────────────────────────────────────────── M-10 OpenAI
                                                        M-11 Anthropic
```

### 5.3 Lifecycle de Capability MCP

Cada MCP segue este lifecycle:

```
PROVISIONADO → [configurado em opencode.json]
     │
     ▼
ATIVO → [testado, funcionando, tools registradas]
     │
     ├──→ DEGRADADO → [funciona parcialmente, token expirando, erro conhecido]
     │        │
     │        ▼
     │    REATIVADO → [problema resolvido]
     │
     ├──→ INATIVO → [não usado, configurado mas não testado]
     │
     └──→ DESATIVADO → [removido do opencode.json, não utilizado]
```

**Estados atuais:**

| MCP | Lifecycle | Última verificação |
|-----|-----------|-------------------|
| GitHub MCP | ✅ Ativo | 2026-05-18 |
| Supabase MCP | ✅ Ativo | 2026-05-18 |
| Terminal MCP | ✅ Ativo | Built-in |
| Filesystem MCP | ✅ Ativo | Built-in |
| Stitch MCP | ✅ Ativo (token migrado para env var) | 2026-05-18 |
| Context7 MCP | ⚠️ Inativo | Nunca testado |
| Shadcn MCP | ⚠️ Inativo | Nunca testado |

### 5.4 Criticidade

| Nível | Definição | MCPs |
|-------|-----------|------|
| **P0 — Crítico** | Core operation: sem este MCP, nada funciona | Terminal, Filesystem, Supabase |
| **P1 — Essencial** | Operações diárias: sem este MCP, produtividade cai | GitHub |
| **P2 — Estratégico** | Acelera desenvolvimento: sem este MCP, trabalho manual | Stitch, Figma |
| **P3 — Conveniência** | Aumenta qualidade: sem este MCP, ainda funciona | Context7, Shadcn |
| **P4 — Futuro** | Roadmap: ainda não necessário | N8N, WhatsApp, OpenAI, Redis, Stripe |

### 5.5 Observabilidade

**Regra G-OBS-01: Health check de MCP**

Ao iniciar uma sessão OpenCode, verificar:

- [ ] GitHub MCP conectado (26 tools)
- [ ] Supabase MCP conectado (29 tools)
- [ ] Terminal MCP disponível
- [ ] Filesystem MCP disponível
- [ ] Nenhum erro de conexão MCP nos logs

**Regra G-OBS-02: Métricas de MCP**

| Métrica | O que mede | Frequência |
|---------|-----------|------------|
| Tool calls por sessão | Utilização do MCP | Por sessão |
| Taxa de erro | Estabilidade | Por tool call |
| Tempo de resposta | Performance | Por tool call |
| Uptime | Disponibilidade | Por sessão |

---

## 6. Fluxo Oficial dos Agentes

### 6.1 Ordem Obrigatória dos Workflows

O Master Orchestrator (`.agent/Joe-orchestrators/agents/master-orchestrator.md`) define a ordem obrigatória de execução:

```
Brainstorm → Architecture → Plan → Create → Debug → Test → Deploy
```

Para correções:

```
Context Discovery → Systematic Debugging → Surgical Fix → Test
```

### 6.2 Responsabilidades dos MCPs em Cada Workflow

| Workflow | MCPs envolvidos | Responsabilidade |
|----------|----------------|-----------------|
| **Brainstorm** | Nenhum (análise apenas) | Explorar opções antes de implementar |
| **Architecture** | Supabase MCP, GitHub MCP | Validar schema atual, histórico de decisões |
| **Plan** | Nenhum (planejamento apenas) | Documentar plano, riscos, rollback |
| **Create** | Filesystem MCP, Terminal MCP, GitHub MCP | Escrever código, build, commit |
| **Debug** | Terminal MCP, Supabase MCP, GitHub MCP | Rodar debug, consultar banco, git diff |
| **Test** | Terminal MCP, Playwright MCP (futuro) | Rodar testes, validar UX |
| **Deploy** | Terminal MCP, GitHub MCP, Supabase MCP | Build, deploy, migration |

### 6.3 Gates Obrigatórios

**Gate 1 — Contexto Reconstruído** (antes de qualquer ação)
- [ ] Memória operacional lida (`.agent/memory/`)
- [ ] `git status` executado
- [ ] `git diff` executado
- [ ] Arquivos impactados identificados
- [ ] Módulo atual identificado
- [ ] Feature ativa identificada
- [ ] MCPs necessários verificados (conectados? tools disponíveis?)

**Gate 2 — Risco Classificado** (antes de montar o plano)
- [ ] Risco classificado (LOW/MEDIUM/HIGH/CRITICAL)
- [ ] Criticidade definida (P0-P4)
- [ ] Modo operacional selecionado
- [ ] MCPs necessários para a operação identificados

**Gate 3 — Pipeline Montado** (antes da implementação)
- [ ] Workflow(s) selecionado(s)
- [ ] MCPs necessários ativos e testados
- [ ] Skills carregadas na ordem correta
- [ ] Dependências resolvidas
- [ ] Rollback planejado (se operação destrutiva via MCP)

**Gate 4 — Safe To Implement** (antes de alterar qualquer arquivo)
- [ ] Escopo confirmado com o usuário
- [ ] Arquivos alvo definidos
- [ ] Riscos conhecidos comunicados
- [ ] Rollback considerado
- [ ] Multi-tenant validado (se Supabase MCP envolvido)
- [ ] Tokens MCP seguros (nenhum hardcoded)

**Gate 5 — Final Validation** (após qualquer alteração)
- [ ] Build frontend passa sem erros (se frontend)
- [ ] Lint/ESLint sem erros
- [ ] Rotas e imports funcionando
- [ ] Segurança validada (se backend/auth via MCP)
- [ ] `company_id` preservado (se Supabase MCP usado)
- [ ] Nenhum token ou segredo exposto
- [ ] Memória atualizada (implementation-log.md, current-state.md, session-snapshot.md)
- [ ] AI Audit System executado
- [ ] Resumo final gerado

### 6.4 Classificação de Risco para Operações MCP

| Risco | Operaçōes MCP típicas | Fluxo |
|-------|----------------------|-------|
| **LOW_RISK** | Leitura via Supabase MCP, consulta git log via GitHub MCP | Compacto |
| **MEDIUM_RISK** | Criar arquivo via Filesystem MCP, commit via GitHub MCP | Intermediário |
| **HIGH_RISK** | Migration via Supabase MCP, deploy via Terminal MCP | Completo |
| **CRITICAL_RISK** | DROP TABLE via Supabase MCP, alterar RLS policy, operação destrutiva no banco | Máximo |

### 6.5 Modos Operacionais

| Modo | Quando usar | MCPs restritos |
|------|------------|----------------|
| **SAFE_MODE** | Auth, financeiro, migrations, deploy | Supabase MCP: somente leitura |
| **FAST_MODE** | LOW_RISK, ajustes visuais, CSS | Todos liberados |
| **ENTERPRISE_MODE** | Produção, arquitetura, crítico | Supabase MCP: somente leitura |
| **DEBUG_MODE** | Bugs, runtime, regressão | Todos liberados |
| **CREATIVE_MODE** | Landing pages, design, UX | Stitch MCP prioritário |
| **ARCHITECT_MODE** | Estrutura, escalabilidade, multi-tenant | Supabase MCP + GitHub MCP |

---

## 7. Prompt Governance

### 7.1 Padrões Obrigatórios de Prompts

Todo prompt que envolva MCPs deve seguir esta estrutura:

```markdown
## Contexto
<estado atual do projeto ou feature>

## Objetivo
<o que deve ser feito>

## MCPs necessários
- <MCP-ID>: <qual operação>
- <MCP-ID>: <qual operação>

## Restrições
- <limitações, regras de segurança, tokens>

## Resultado esperado
- <critérios de aceite>
```

### 7.2 Uso de Agents Reais

Todo prompt deve referenciar **agentes reais do workspace** (`.agent/agents/`):

| Tipo de tarefa | Agente principal | MCPs que o agente pode usar |
|----------------|-----------------|----------------------------|
| Frontend | frontend-specialist.md | Filesystem, Terminal |
| Backend | backend-specialist.md | Filesystem, Terminal, Supabase MCP |
| Database | database-architect.md | Supabase MCP |
| Segurança | security-auditor.md | Supabase MCP, GitHub MCP |
| Deploy | devops-engineer.md | Terminal, GitHub MCP, Supabase MCP |
| QA | qa-automation-engineer.md | Terminal, Playwright MCP |
| Estratégia | project-planner.md | Nenhum (análise) |

### 7.3 Uso de Workflows Reais

Todo prompt deve referenciar **workflows reais do workspace** (`.agent/workflows/`):

| Workflow | Quando usar | MCPs obrigatórios |
|----------|-------------|-------------------|
| `brainstorm.md` | Explorar opções | Nenhum |
| `create.md` | Criar novo código | Filesystem, GitHub |
| `enhance.md` | Melhorar código existente | Filesystem, GitHub |
| `debug.md` | Corrigir bugs | Terminal, GitHub |
| `deploy.md` | Publicar em produção | Terminal, GitHub, Supabase |
| `plan.md` | Planejar tarefa complexa | Nenhum |
| `test.md` | Executar/gerar testes | Terminal |
| `orchestrate.md` | Coordenar múltiplos agentes | Múltiplos MCPs |
| `preview.md` | Visualizar alterações | Terminal |
| `status.md` | Verificar estado do projeto | GitHub, Filesystem |
| `ui-ux-pro-max.md` | Design premium | Stitch, Filesystem |

### 7.4 Uso de Skills Reais

Todo prompt deve carregar **skills reais do workspace** (`.agent/skills/`) na ordem correta de dependência:

| Skill | MCPs associados | Dependências |
|-------|----------------|--------------|
| `architecture/SKILL.md` | Supabase MCP (consulta) | `context-discovery.md` |
| `plan-writing/SKILL.md` | Nenhum | Nenhuma |
| `api-patterns/security-testing.md` | Supabase MCP (validação) | `auth.md` |
| `api-patterns/auth.md` | Supabase MCP (tabelas auth) | Nenhuma |
| `api-patterns/api-style.md` | Nenhum | Nenhuma |
| `api-patterns/versioning.md` | Nenhum | Nenhuma |
| `api-patterns/rate-limiting.md` | Nenhum | Nenhuma |
| `database-design/SKILL.md` | Supabase MCP | `schema-design.md` |
| `testing-patterns/SKILL.md` | Terminal MCP | `systematic-debugging/SKILL.md` |
| `deployment-procedures/SKILL.md` | Terminal, GitHub, Supabase MCPs | `testing-patterns/SKILL.md` |
| `clean-code/SKILL.md` | Nenhum | Nenhuma |
| `security-testing.md` | Supabase MCP | `auth.md` |
| `seo-fundamentals/SKILL.md` | Nenhum | Nenhuma |

### 7.5 Estrutura Obrigatória de Prompt com MCPs

```markdown
## Análise Operacional

### Tipo da tarefa
<descrição>

### Risco
<LOW/MEDIUM/HIGH/CRITICAL>

### Modo operacional
<SAFE/FAST/ENTERPRISE/DEBUG/CREATIVE/ARCHITECT>

### Prioridade
<P0-P4>

### MCPs necessários
- <M-ID>: <ferramentas específicas>

### Pipeline selecionado
<workflow1.md → workflow2.md → ...>

### Agentes selecionados
- <agent1.md>
- <agent2.md>

### Skills selecionadas
- <skill1/SKILL.md>
- <skill2/SKILL.md>

### Dependências
- <dependências>

### Arquivos prováveis
- <arquivos>

### Checklist antes de implementar
- [ ] Gate 1 — Contexto Reconstruído
- [ ] Gate 2 — Risco Classificado
- [ ] Gate 3 — Pipeline Montado
- [ ] Gate 4 — Safe To Implement
- [ ] MCPs verificados (conectados? tools disponíveis?)
- [ ] Tokens seguros (nenhum hardcoded)
- [ ] Rollback planejado (se operação destrutiva)
```

### 7.6 Anti-Fragilidade

**Regra G-PRO-01: Prompts são antifrágeis**

- Nunca assumir que um MCP está disponível — verificar antes de usar
- Nunca assumir que um token é válido — testar antes de operar
- Nunca assumir que uma tool MCP retornará sucesso — tratar erro em todo tool call
- Sempre ter fallback: se MCP falhar, usar método alternativo (ex: se Supabase MCP falhar, usar SQL local)

**Regra G-PRO-02: Sanitização de saída MCP**

- Todo output de MCP deve ser sanitizado antes de exibir ao usuário
- Remover tokens, secrets, connection strings de logs e respostas
- Se MCP retornar erro com dados sensíveis, interceptar e substituir por mensagem segura

---

## 8. AI Operational Layer

### 8.1 Autonomous Workflows

A AI Operational Layer do MultGestor (C-07, futura) operará através de MCPs para executar workflows autônomos:

```
Trigger (evento do Core)
    │
    ▼
AI Operational Layer (C-07)
    │
    ├──→ GitHub MCP: consultar histórico, criar branch
    ├──→ Supabase MCP: consultar schema, preparar migration
    ├──→ Filesystem MCP: modificar código
    ├──→ Terminal MCP: executar build, testes
    └──→ GitHub MCP: criar PR, registrar mudança
```

### 8.2 Orchestration Engine

O OpenCode é o **Orchestration Engine Principal**. Ele:

1. Gerencia o lifecycle de todos os MCPs
2. Roteia prompts para os MCPs corretos
3. Coordena a ordem de execução entre MCPs
4. Valida resultados de cada tool call
5. Trata erros e executa fallback

**Arquitetura de Orquestração:**

```
User Prompt
    │
    ▼
┌─────────────────────────────────────┐
│         OpenCode Engine             │
│  (Orquestrador Principal)           │
└─────────────────────────────────────┘
    │
    ├──→ Master Orchestrator (regras globais)
    ├──→ Adaptive Intelligence Engine (classificação)
    ├──→ Runtime Decision Engine (decisões)
    ├──→ Dynamic Pipeline Builder (pipeline)
    └──→ Execution (via MCPs)
```

### 8.3 Memory Systems

MCPs interagem com o sistema de memória do MultGestor:

| Memória | O que contém | MCPs que consultam | MCPs que escrevem |
|---------|-------------|-------------------|-------------------|
| `.agent/memory/project-context.md` | Contexto do projeto | Todos | Nenhum (manual) |
| `.agent/memory/current-state.md` | Estado atual | Todos | Todos |
| `.agent/memory/implementation-log.md` | Log de implementações | GitHub MCP | Filesystem MCP |
| `.agent/memory/decisions.md` | Decisões técnicas | Todos | Filesystem MCP |
| `.agent/memory/next-actions.md` | Próximas ações | Todos | Todos |
| `.agent/memory/session-snapshot.md` | Estado da sessão | Todos | Filesystem MCP |
| `.agent/memory/mcp-registry/` | Registro de MCPs | Todos | Filesystem MCP |

### 8.4 AI Routing

O roteamento de prompts entre MCPs segue regras definidas pelo Smart Routing System (Master Orchestrator, seção 8):

| Detecção | Rota MCP | Workflow |
|----------|---------|----------|
| Frontend/UI | Filesystem MCP + Terminal MCP | Frontend visual |
| Backend/API | Filesystem MCP + Terminal MCP + Supabase MCP | Backend |
| Database/Migration | Supabase MCP | Database |
| Arquitetura | Nenhum (análise) | Arquitetura |
| Deploy | Terminal MCP + GitHub MCP + Supabase MCP | Deploy |
| WhatsApp/Integração | Supabase MCP + Terminal MCP | Integração |

### 8.5 Adaptive Prioritization

A priorização de operações MCP segue a Priority Engine (Master Orchestrator, seção 15):

| Prioridade | Operação MCP | Exemplo |
|------------|-------------|---------|
| **1 — Segurança** | Auditoria de tokens, validação de permissões | Supabase MCP: verificar RLS |
| **2 — Multi-tenant** | Verificação de isolamento | Supabase MCP: consultar company_id |
| **3 — Auth** | Validação de autenticação | Supabase MCP: verificar JWT |
| **4 — Banco/Dados** | Schema, migrations | Supabase MCP: migration |
| **5 — Backend** | API, regras de negócio | Filesystem MCP + Terminal MCP |
| **6 — Agenda/Pagamentos** | Dados críticos | Supabase MCP + Filesystem MCP |
| **7 — Frontend funcional** | Rotas, componentes | Filesystem MCP + Terminal MCP |
| **8 — UX/UI** | Design, responsividade | Filesystem MCP |
| **9 — Performance** | Otimização | Terminal MCP |
| **10 — Refino visual** | Ajustes estéticos | Filesystem MCP |
| **11 — Documentação** | Docs, README | Filesystem MCP |

### 8.6 Operational Compression

Diferentes níveis de risco comprimem ou expandem o uso de MCPs:

| Risco | MCPs utilizados | Pipeline |
|-------|----------------|----------|
| **LOW_RISK** | Filesystem MCP + Terminal MCP | 2 MCPs, mínimo |
| **MEDIUM_RISK** | Filesystem + Terminal + GitHub | 3 MCPs, intermediário |
| **HIGH_RISK** | Filesystem + Terminal + GitHub + Supabase | 4 MCPs, completo |
| **CRITICAL_RISK** | Filesystem + Terminal + GitHub + Supabase + AI Audit | 5 MCPs, máximo |

### 8.7 Intelligence Pipelines

MCPs podem ser encadeados em **pipelines de inteligência** para executar tarefas complexas:

**Exemplo: Pipeline de Correção de Bug**

```
1. GitHub MCP: git diff → identificar alterações recentes
2. Terminal MCP: npm run build → capturar erro
3. Supabase MCP: consultar schema → validar estrutura
4. Filesystem MCP: ler arquivos afetados
5. Terminal MCP: executar debug
6. Filesystem MCP: aplicar correção
7. Terminal MCP: npm run build → validar correção
8. GitHub MCP: commit + push
```

**Exemplo: Pipeline de Deploy**

```
1. Terminal MCP: npm run build → validar build
2. Supabase MCP: list_migrations → verificar pendentes
3. GitHub MCP: push → enviar código
4. Terminal MCP: git push → deploy Vercel/Render
5. Supabase MCP: apply_migration → migrar banco
```

---

## 9. MCP Approval Policy

### 9.1 Critérios para Aprovar Novos MCPs

Nenhum MCP pode ser adicionado ao `opencode.json` sem atender a **todos** estes critérios:

| # | Critério | Obrigatório | Verificação |
|---|----------|-------------|-------------|
| 1 | **Necessidade comprovada**: a capability não existe no Core | ✅ Sim | Mapa de capabilities |
| 2 | **Provedor confiável**: MCP de fonte oficial (npm oficial, GitHub verified) | ✅ Sim | npm audit, GitHub verification |
| 3 | **Token seguro**: suporta env var para token (não exige hardcoded) | ✅ Sim | Documentação do MCP |
| 4 | **Código aberto**: pode auditar o que o MCP faz | ✅ Sim | Código-fonte disponível |
| 5 | **Documentação clara**: tools documentadas | ✅ Sim | README do pacote |
| 6 | **Manutenção ativa**: atualizações recentes (< 6 meses) | ✅ Sim | npm last publish, GitHub commits |
| 7 | **Rollback planejado**: é possível remover sem impacto no Core | ✅ Sim | Análise de impacto |

### 9.2 Validação de Segurança

| # | Verificação | Como |
|---|-------------|------|
| 1 | Token não fica em arquivo | Configurar via `${VAR}` no `opencode.json` |
| 2 | MCP não acessa recursos fora do escopo | Revisar permissões do token |
| 3 | MCP não expõe dados do Core | Testar tools, verificar outputs |
| 4 | MCP não executa comandos arbitrários | Auditar código-fonte |
| 5 | MCP respeita principle of least privilege | Configurar token com mínimo escopo |

### 9.3 Validação de Custos

| # | Verificação | Como |
|---|-------------|------|
| 1 | MCP é gratuito ou pago? | Documentação do provedor |
| 2 | Tem custo por request? | Pricing page |
| 3 | Tem custo de infraestrutura? | CPU/memória necessários |
| 4 | Pode gerar custo inesperado? | Rate limiting, quota |

### 9.4 Validação de Impacto

| # | Impacto | Como avaliar |
|---|---------|-------------|
| 1 | Quais capabilities do Core são afetadas? | Mapa de dependências |
| 2 | Quais workflows usam este MCP? | Fluxo oficial dos agentes |
| 3 | Quais agentes usam este MCP? | Responsabilidades dos agentes |
| 4 | O que acontece se o MCP falhar? | Análise de fallback |
| 5 | O Core funciona sem este MCP? | Verificação de dependência |

### 9.5 Validação de Escalabilidade

| # | Verificação | Critério |
|---|-------------|----------|
| 1 | MCP funciona com projetos grandes? | Testar com repositório grande |
| 2 | MCP tem rate limiting? | Documentação |
| 3 | MCP tem timeout configurável? | Configuração |
| 4 | MCP suporta paralelismo? | Múltiplas chamadas simultâneas |

### 9.6 Rollback Obrigatório

**Regra G-APR-01: Rollback de MCP**

Antes de adicionar qualquer MCP novo:

1. Documentar procedimento de remoção
2. Verificar que remoção não quebra outros MCPs
3. Verificar que remoção não quebra workflows
4. Testar remoção em ambiente de desenvolvimento

**Regra G-APR-02: Período de avaliação**

- Todo MCP novo entra em **período de avaliação de 14 dias**
- Durante este período, o MCP é marcado como `⚠️ Avaliação`
- Após 14 dias sem problemas, é promovido para `✅ Ativo`

### 9.7 Template de Proposta de Novo MCP

```markdown
## Proposta de Novo MCP

### Identificação
- **Nome**: 
- **Provider**: 
- **Versão**: 
- **Package**: 

### Justificativa
- **Problema que resolve**: 
- **Capability que adiciona**: 
- **Por que não existe no Core**: 

### Segurança
- **Token via env var**: Sim / Não
- **Escopo mínimo do token**: 
- **Código auditável**: Sim / Não

### Impacto
- **Depende de**: 
- **Dependem dele**: 
- **Workflows afetados**: 
- **Agentes que usarão**: 

### Rollback
- **Procedimento de remoção**: 
- **Impacto da remoção**: 

### Decisão
✅ Aprovado / ❌ Rejeitado / ⏳ Em avaliação
```

---

## 10. Enterprise Evolution Roadmap

### Fase 1: Core Foundation (Atual)

**Objetivo:** Estabilizar MCPs fundamentais e segurança.

| Marco | MCPs | Prazo |
|-------|------|-------|
| ✅ Tokens GitHub + Supabase em env vars | GitHub MCP, Supabase MCP | Concluído |
| ✅ Validação de conectividade | GitHub MCP (26 tools), Supabase MCP (29 tools) | Concluído |
| ✅ Documentação de governança | Todos | Concluído (este documento) |
| ✅ Stitch token migrado para env var | Stitch MCP | Concluído (2026-05-18) |
| ❌ MCP Registry criado | Todos | Pendente |
| ❌ Playwright MCP provisionado | Playwright MCP | Pendente |

### Fase 2: Operational Intelligence (Próximo)

**Objetivo:** Adicionar MCPs operacionais e automatizar pipelines.

| Marco | MCPs | Dependências |
|-------|------|-------------|
| Playwright MCP ativo | Playwright MCP | Nenhuma |
| N8N MCP provisionado | N8N MCP | Event Bus (C-04) |
| WhatsApp MCP planejado | WhatsApp MCP | Integration Layer (C-05) |
| Pipeline de QA autônomo | Playwright MCP + Terminal MCP | Ambos ativos |
| Pipeline de deploy inteligente | GitHub + Terminal + Supabase | Todos ativos |
| AI Audit System integrado com MCPs | Todos | System engines ativos |

### Fase 3: Autonomous Operations

**Objetivo:** MCPs começam a operar de forma autônoma baseados em eventos.

| Marco | MCPs | Dependências |
|-------|------|-------------|
| OpenAI/Anthropic MCP ativo | OpenAI/Anthropic MCP | AI Layer (C-07) |
| Figma MCP ativo | Figma MCP | Nenhuma |
| Stripe MCP ativo | Stripe MCP | Event Bus (C-04) |
| Pipeline de desenvolvimento autônomo | Múltiplos | Core Foundation |
| Agentes autônomos via MCPs | Todos | AI Layer |
| Auto-remediação de falhas | Terminal + GitHub + Supabase | Event Bus |

### Fase 4: AI Engineering OS

**Objetivo:** MCPs formam um sistema operacional de engenharia completo.

| Marco | Descrição |
|-------|-----------|
| Orquestração multi-MCP inteligente | AI decide qual MCP chamar baseada em contexto |
| Memory-MCP bridge | MCPs consultam e escrevem memória automaticamente |
| MCP auto-discovery | Novos MCPs são detectados e registrados automaticamente |
| MCP health auto-repair | MCPs com falha são reiniciados ou substituídos |
| Pipeline auto-optimization | Pipeline se otimiza baseado em métricas de performance |

### Fase 5: Enterprise Operational Network

**Objetivo:** MCPs operam como uma rede neural operacional.

| Marco | Descrição |
|-------|-----------|
| MCP marketplace interno | Catálogo de MCPs disponíveis para todos os módulos |
| MCP dependency graph dinâmico | Dependências entre MCPs atualizadas automaticamente |
| MCP SLA monitoring | Garantia de disponibilidade por MCP |
| MCP auto-scaling | Múltiplas instâncias de MCP por demanda |
| MCP disaster recovery | Failover automático entre MCPs |

### Roadmap Visual

```
Fase 1 — Core Foundation (Agora)
████████████████████░░░░░░░░░░ 60%

Fase 2 — Operational Intelligence (2-4 semanas)
██░░░░░░░░░░░░░░░░░░░░░░░░░░ 15%

Fase 3 — Autonomous Operations (1-2 meses)
░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%

Fase 4 — AI Engineering OS (3-4 meses)
░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%

Fase 5 — Enterprise Network (6+ meses)
░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
```

---

## Apêndices

### A. Glossário MCP

| Termo | Definição |
|-------|-----------|
| **MCP** | Model Context Protocol — protocolo que permite agentes IA interagirem com ferramentas e sistemas |
| **Tool** | Função exposta por um MCP (ex: `execute_sql`, `create_or_update_file`) |
| **Capability** | Bloco de infraestrutura/domínio que adiciona inteligência operacional ao Core |
| **Lifecycle** | Estado atual de um MCP (provisionado, ativo, degradado, inativo, desativado) |
| **Foundation MCP** | MCP essencial sem o qual o Core não opera |
| **Operational MCP** | MCP de integração externa que estende o Core |
| **Intelligence MCP** | MCP de IA que adiciona camada cognitiva ao Core |
| **Env var pattern** | `${NOME_DA_VARIAVEL}` — padrão oficial para injetar tokens |

### B. Checklist de Verificação Semanal

- [ ] GitHub MCP conectado e funcional
- [ ] Supabase MCP conectado e funcional
- [ ] Nenhum token exposto em arquivos de configuração
- [ ] Memory/ atualizada com últimas operações
- [ ] MCP registry sincronizado com opencode.json

### C. Checklist de Verificação Mensal

- [ ] Rotação de tokens (a cada 90 dias ou quando necessário)
- [ ] Revisão de permissões de tokens MCP
- [ ] Auditoria de logs MCP (erros, falhas, lentidão)
- [ ] Revisão de MCPs não utilizados (desativar se necessário)
- [ ] Atualização de versões de MCPs (npm outdated)

### D. Referências

| Documento | Caminho |
|-----------|---------|
| OpenCode config | `C:\Users\Joefe\.config\opencode\opencode.json` |
| Master Orchestrator | `.agent/Joe-orchestrators/agents/master-orchestrator.md` |
| Architecture Decisions | `docs/architecture-decisions.md` |
| Capabilities Map | `docs/capabilities-map.md` |
| Lessons Learned | `docs/lessons-learned.md` |
| Core History | `docs/MULTGESTOR_CORE_HISTORY.md` |
| Memory | `.agent/memory/` |
| GitHub MCP Registry | `.agent/memory/github-mcp-registry.md` |
| MCP Config (terceiros) | `.agent/mcp_config.json` |
| Context | `.agent/context/` |

---

---

## 11. Proteção Arquitetural — MCP Layer

### 11.1 Riscos Específicos de MCPs

MCPs introduzem riscos únicos à arquitetura do Core que exigem proteção específica:

| # | Risco | Descrição | Mitigação |
|---|-------|-----------|-----------|
| PR-MCP-01 | **MCP como substituto de capability do Core** | Usar MCP externo para funcionalidade que deveria ser capability nativa | Todo MCP deve ser classificado como Infrastructure Intelligence, nunca como Core |
| PR-MCP-02 | **Acoplamento a provedor MCP** | Dependência de MCP de terceiro que pode deixar de existir | Todo MCP deve ter fallback documentado |
| PR-MCP-03 | **MCP acessando recursos além do escopo** | MCP com token de permissão ampla demais | Principle of Least Privilege (G-PLP-01) |
| PR-MCP-04 | **MCP como atalho para implementação** | Agente usando MCP para implementar fora da ordem topológica | Gate 6 — Proteção Arquitetural |
| PR-MCP-05 | **Múltiplos MCPs concorrentes** | Dois MCPs com a mesma responsabilidade | Consolidar em um MCP oficial |

### 11.2 Regras de Proteção para MCPs

| # | Regra | Violação | Consequência |
|---|-------|----------|-------------|
| R-MCP-ARC-01 | **Nenhum MCP pode substituir capability do Core** | MCP executa função que deveria ser C-01 a C-09 | MCP reclassificado como Integration, não como Foundation |
| R-MCP-ARC-02 | **Nenhum MCP pode ser usado como atalho para violar ordem topológica** | Implementar C-07 via MCP antes de C-04 | Bloqueado por Gate 6 |
| R-MCP-ARC-03 | **Nenhum MCP pode acessar produção sem autorização explícita** | MCP executando comando destrutivo em produção | Apenas operações de leitura em produção |
| R-MCP-ARC-04 | **Nenhum MCP pode ser adicionado sem fallback documentado** | MCP sem alternativa caso o provedor caia | Rejeitado na aprovação |
| R-MCP-ARC-05 | **MCPs não podem existir sem estar registrados no MCP Registry** | MCP configurado mas não documentado | Registro obrigatório em `.agent/memory/mcp-registry/` |

### 11.3 Validação Pré-MCP

Antes de adicionar qualquer MCP ao `opencode.json`, validar:

- [ ] Este MCP adiciona uma capacidade que o Core não tem?
- [ ] Esta capacidade poderia ser uma capability nativa (C-N)?
- [ ] Existe fallback se este MCP falhar?
- [ ] O token do MCP segue o padrão `${VAR}` (env var)?
- [ ] O escopo do token é mínimo necessário?
- [ ] Este MCP respeita a ordem topológica do Core?
- [ ] Este MCP não duplica responsabilidade de MCP existente?

---

*Este documento é vinculante para todos os agentes, workflows, skills e operações MCP no ecossistema MultGestor.*

*Nenhuma capacidade MCP pode ser adicionada, modificada ou removida sem seguir as políticas definidas neste documento.*

*Dúvidas de governança devem ser resolvidas consultando o Master Orchestrator ou o arquiteto principal do projeto.*
