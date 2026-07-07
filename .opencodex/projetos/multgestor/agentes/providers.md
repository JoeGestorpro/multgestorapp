# 🔌 Providers — Provedores de IA

> **Status:** OFICIAL • VIVO
> **Camada:** 3 — Inteligência
> **Propósito:** Documentar os provedores de IA, serviços e ferramentas que compõem o ecossistema de inteligência do MultGestor.
> **Relacionamentos:** [[agents/README]] · [[agents/agent-skill-matrix]] · [[technical/README]]

---

## Provedores de Modelo

### OpenRouter
| Campo | Valor |
|---|---|
| **Provider** | OpenRouter |
| **Modelo principal** | `deepseek/deepseek-chat-v4-0605:free` |
| **Modelo pequeno** | `deepseek/deepseek-chat-v4-0605:free` |
| **Autenticação** | API Key (`OPENROUTER_API_KEY`) |
| **Uso** | Modelo principal do opencode |
| **Alternativas** | Suporta fallback para Anthropic, OpenAI |

## MCP Servers

### Supabase MCP
| Campo | Valor |
|---|---|
| **Pacote** | `@supabase/mcp-server-supabase` |
| **Autenticação** | `SUPABASE_PROJECT_REF` + `SUPABASE_SERVICE_ROLE_KEY` |
| **Funções** | Query SQL, migrations, list tables, edge functions |
| **Agentes que usam** | Platform Architect, Database Architect |
| **Documentação** | [[technical/README]] |

### GitHub MCP
| Campo | Valor |
|---|---|
| **Pacote** | `@modelcontextprotocol/server-github` |
| **Autenticação** | `GITHUB_TOKEN` |
| **Funções** | Issues, PRs, commits, branches, files |
| **Agentes que usam** | Platform Architect, JoeFelipe Agent |
| **Documentação** | — |

### Playwright MCP
| Campo | Valor |
|---|---|
| **Pacote** | `@playwright/mcp` |
| **Autenticação** | Nenhuma |
| **Funções** | Browser automation, screenshots, snapshots |
| **Agentes que usam** | QA |
| **Documentação** | — |

## Plugins

| Plugin | Função | Localização |
|---|---|---|
| `@opencode-ai/plugin` | Hook system para opencode | `.opencode/node_modules/` |

## Pipeline de Execução

```
USUÁRIO → OPENCODE (OpenRouter)
            → CHECK 0 (Context Confidence)
            → MISSION BUILDER (seleciona agente)
            → PLANNER (gera plano)
            → AGENT POOL (seleciona agente específico)
            → SKILLS & MCP SERVERS (execução)
            → KNOWLEDGE OS (registro)
```

## Hierarquia de Providers

```
Camada 1: OpenRouter (Modelo)
  └── Modelo: DeepSeek Chat V4
Camada 2: MCP Servers (Ferramentas)
  ├── Supabase — Banco de dados
  ├── GitHub — Repositório
  └── Playwright — Browser
Camada 3: Plugins (Extensões)
  └── @opencode-ai/plugin — Hooks do sistema
```

## Fluxo de Seleção de Provider

1. Prompt chega ao opencode
2. opencode seleciona o modelo configurado (OpenRouter/DeepSeek)
3. Se a tarefa exige banco → ativa Supabase MCP
4. Se a tarefa exige repositório → ativa GitHub MCP
5. Se a tarefa exige browser → ativa Playwright MCP
6. Se a tarefa exige hook → ativa plugins

## Segurança

- API keys armazenadas em variáveis de ambiente (`.env`)
- Nenhum secret versionado no git
- Tokens de serviço com permissões mínimas necessárias

## Referências

- [[agents/README]] — AI Brain
- [[agents/agent-skill-matrix]] — Matriz de agentes
- [[agents/mission-builder]] — Construção de missões
- [[agents/planner]] — Geração de planos
- [[technical/README]] — Technical Brain
