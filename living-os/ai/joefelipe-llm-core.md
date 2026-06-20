# JoeFelipe LLM Core

> **Componente:** LLM Core do Agente JoeFelipe
> **Versão:** V2 (Mock/Plugável)
> **Status:** Implementado — apenas MockProvider funcional
> **Data:** 2026-06-20

---

## 1. O que é

O **JoeFelipe LLM Core** é a camada de inteligência plugável do Agente JoeFelipe. Ele define uma interface genérica para provedores de LLM (Large Language Model) e implementa um provider mock seguro para a V2.

O LLM Core permite que o agente:
- interprete o estado do projeto;
- gere explicações estratégicas;
- classifique riscos e ações;
- prepare prompts para execução segura.

Mas com a regra central: **a LLM propõe, não executa**.

---

## 2. Arquitetura

```
tools/joefelipe-agent/src/llm/
├── LlmProvider.ts          # Interfaces e tipos
├── LlmEngine.ts            # Engine central (fallback mock)
├── llm-config.ts           # Configuração por env
└── providers/
    └── MockProvider.ts     # Provider mock (V2)
```

### 2.1 LlmProvider.ts

Define os contratos:

| Tipo | Descrição |
|---|---|
| `LlmMode` | Modo de operação: `READ_ONLY`, `PLAN_ONLY`, `SAFE_WRITE`, `HUMAN_APPROVAL_REQUIRED`, `EXECUTE_APPROVED`, `LOCKED` |
| `LlmProviderName` | Nome do provedor: `mock`, `openrouter`, `openai`, `anthropic`, `local` |
| `LlmRequest` | Requisição: mode + task + context opcional |
| `LlmResponse` | Resposta: provider + model + mode + text + safety |
| `LlmSafety` | Segurança: `canExecute`, `requiresHumanApproval`, `blockedReasons` |
| `LlmProvider` | Interface do provedor: `name`, `model`, `complete(request)` |

### 2.2 LlmEngine.ts

Engine central que:
1. Carrega configuração via `loadLlmConfig()`
2. Instancia o provider correto
3. Na V2, suporta apenas MockProvider
4. Fallback seguro para mock em caso de erro

### 2.3 llm-config.ts

Leitura segura de configuração por variáveis de ambiente:

| Variável | Padrão | Descrição |
|---|---|---|
| `JOEFELIPE_LLM_PROVIDER` | `mock` | Nome do provedor |
| `JOEFELIPE_LLM_MODEL` | `mock-safe-v1` | Nome do modelo |

Regras:
- Provider inválido → fallback para mock
- Provider não-mock na V2 → fallback para mock
- `externalCallsEnabled` = `false` (fixo na V2)
- Nunca lê `OPENAI_API_KEY`, `OPENROUTER_API_KEY` ou `ANTHROPIC_API_KEY`

### 2.4 MockProvider.ts

Provider simulado que:
- Não chama API externa
- Não lê secrets
- Responde deterministicamente
- `canExecute` = `false` sempre
- Detecta palavras sensíveis (case-insensitive) e preenche `blockedReasons`
- Ações sensíveis: push, deploy, secret, migration, RLS, Redis, WhatsApp real, B2 upload, produção, delete, rm, drop, truncate, merge, commit

---

## 3. Provedores futuros

| Provedor | Status | Previsão |
|---|---|---|
| MockProvider | ✅ Funcional (V2) | — |
| OpenRouter | 🔜 Planejado | V5+ |
| OpenAI | 🔜 Planejado | V5+ |
| Anthropic | 🔜 Planejado | V5+ |
| Local (ollama, etc.) | 🔜 Planejado | V5+ |

A arquitetura permite adicionar novos provedores sem alterar o engine:
1. Criar `src/llm/providers/NovoProvider.ts` implementando `LlmProvider`
2. Registrar no `LlmEngine`
3. Configurar via `JOEFELIPE_LLM_PROVIDER`

---

## 4. Configuração

```bash
# Provider (único funcional na V2)
JOEFELIPE_LLM_PROVIDER=mock

# Modelo
JOEFELIPE_LLM_MODEL=mock-safe-v1
```

Sem secrets. Sem `.env` com chaves reais.

---

## 5. Regras de segurança

1. **LLM propõe, não executa.** Nunca `canExecute: true` na V2.
2. **Sem secrets.** Nenhuma chave de API é lida ou armazenada.
3. **Sem chamada externa.** MockProvider é 100% local.
4. **Fallback seguro.** Se algo falhar, o engine retorna resposta mock segura.
5. **Ações sensíveis bloqueadas.** Palavras como `deploy`, `push`, `migration` disparam `blockedReasons`.
6. **Modo READ_ONLY do agente preservado.** O agente continua sem executar comandos.

---

## 6. Integração no agente

Na V2, o LLM Core é integrado ao estado do agente:

```json
{
  "llm": {
    "provider": "mock",
    "model": "mock-safe-v1",
    "externalCallsEnabled": false
  }
}
```

Disponível no painel HTML e na API `/api/state`.

**Não há endpoint de prompt livre.** A LLM é consumida internamente pelo agente.

---

## 7. Roadmap pós-V2

| Versão | Foco | LLM Core |
|---|---|---|
| V2 | LLM Core Mock/Plugável | MockProvider |
| V3 | Mission Builder | LLM + geração de missões |
| V4 | Governance Guard | LLM + validação de escopo |
| V5 | Provider real com gates | OpenAI / OpenRouter / Anthropic + gates |
| V6 | Operations Copilot | LLM + health checks |
| V7 | Controlled Execution | LLM + execução com aprovação |

---

## 8. Validação

```bash
# Build
npm --prefix tools/joefelipe-agent run build

# Status (deve mostrar LLM: mock-safe-v1)
npm run joefelipe:status
```

---

## 9. Glossário

| Termo | Definição |
|---|---|
| LLM Core | Camada de inteligência plugável do agente |
| MockProvider | Provedor simulado, sem chamada externa |
| LlmMode | Modo de operação da LLM (READ_ONLY, PLAN_ONLY, etc.) |
| LlmSafety | Estrutura de segurança da resposta (canExecute, blockedReasons) |
| Provider | Implementação concreta de LlmProvider |
| Engine | Central que gerencia providers e configuração |

---

## 10. Histórico

| Data | Versão | Mudança |
|---|---|---|
| 2026-06-20 | V2 | Criação do LLM Core com MockProvider |
