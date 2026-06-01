# AI Operating Rules — MultGestor / BarberGestor

## Como Qualquer IA Deve Trabalhar no Projeto

Estas regras se aplicam a qualquer agente de IA (ChatGPT, Claude Code, OpenCode, OpenForge, Cursor, etc.) que opere neste repositório.

## 1. Recuperação de Contexto Obrigatória (Regra Zero)

> **Nenhuma IA pode implementar código antes de recuperar contexto do Segundo Cérebro, documentação viva, capabilities existentes e estado atual do projeto.**

Esta é a **regra mais importante deste documento**. Ela se aplica a TODO agente em TODA tarefa — não importa o tamanho.

### Checklist mínimo antes de qualquer implementação:

1. **Segundo Cérebro** — leia:
   - `.agent/context/memory-snapshot.md` — snapshot mestre
   - `.agent/memory/current-state.md` — estado funcional
   - `.agent/memory/next-actions.md` — backlog priorizado
   - `.agent/memory/session-snapshot.md` — última sessão (se relevante)

2. **Documentação viva** — verifique:
   - `docs/` — documentação oficial do projeto (architecture-decisions, capabilities-map, lessons-learned, runbooks/*, frontend/*)
   - `docs/capabilities-map.md` — qual capability esta tarefa fortalece?
   - `docs/runbooks/` — há runbook para esta tarefa?

3. **Capabilities existentes** — antes de criar algo novo, pergunte:
   - Já existe componente / service / capability equivalente?
   - Estou prestes a duplicar algo que já existe?
   - Como esta tarefa se encaixa em: Shared Kernel → Multi-Tenant Engine → Repository Pattern → Event Bus → Integration Layer → Billing → Frontend Foundation Layer?

4. **Estado atual** — leia o relevante:
   - Backend: `.agent/context/{backend,database,deployment}-rules.md`
   - Frontend: `.agent/context/frontend-rules.md` + `docs/frontend/*`
   - Para qualquer área tocada: a skill correspondente em `.agent/skills/`

### Violar esta regra = retrabalho, duplicação, drift arquitetural.

Se a tarefa parecer "simples demais" para esse esforço, ela ainda precisa cumprir o passo 1 (snapshot) e o passo 3 (capabilities). Os outros podem ser pulados com justificativa explícita no relatório.

## 2. Selecionar Skills e Workflows Reais

Se houver arquivos de skill/workflow no workspace, use-os na ordem correta:
- `master-orchestrator.md` — orquestrador principal
- `context-manager.md` — gerenciamento de contexto
- Project Detection — identificar estrutura do projeto
- Frontend Design — para alterações visuais
- Web Design Guidelines — para regras de UI/UX
- Systematic Debugging — para depuração
- Lint and Validate — para validação de código
- Deployment Procedures — para deploy

Verifique se o arquivo existe ANTES de referenciá-lo. Skills no `.opencode/skills/` são carregados via `skill` tool.

## 3. Responder Sempre em Português do Brasil

Toda comunicação, documentação e comentários devem ser em português do Brasil.

## 4. Separar Frontend / Backend

- Frontend: React + Vite em `frontend/`
- Backend: Node.js + Express em `backend/`
- Nunca misturar alterações dos dois lados no mesmo escopo
- Validar build do frontend separadamente

## 5. Ser Cirúrgico

- Alterar apenas o arquivo necessário
- Não reformatar código inteiro
- Não adicionar funcionalidades não solicitadas
- Não "aproveitar" para fazer melhorias não pedidas

## 6. Não Alterar Fora do Escopo

- Se a tarefa é de frontend, não alterar backend
- Se a tarefa é de backend, não alterar frontend
- Se a tarefa é de CSS, não alterar JS
- Se a tarefa é de ícone, não alterar layout

## 7. Explicar Testes e Validação

- Sempre rodar `npm run build` no frontend após alterações
- Informar como testar a mudança
- Se houver testes automatizados, rodá-los

## 8. Respeitar o Fluxo Obrigatório

| Tipo de Tarefa | Fluxo |
|----------------|-------|
| Criação nova | Brainstorm → Architecture → Plan → Create → Debug → Test → Deploy |
| Correção pequena | Context Discovery → Plan → Surgical Fix → Debug → Test |
| Visual/UI | Context Discovery → Frontend Design → UX/UI Review → Create → Test |
| Backend crítico | Context Discovery → Architecture → Backend Security → Database Design → Create → Test |

## 9. Proteger Produção

- Nunca rodar `DROP TABLE` ou `DROP COLUMN` em produção
- Nunca alterar `.env` sem confirmação
- Nunca expor tokens, senhas ou chaves
- Nunca fazer deploy sem testar localmente

## 10. Usar os Arquivos de Contexto como Fonte Oficial

- `.agent/context/project-overview.md` — visão do negócio
- `.agent/context/stack.md` — tecnologias
- `.agent/context/architecture.md` — arquitetura
- `.agent/context/backend-rules.md` — regras de backend
- `.agent/context/frontend-rules.md` — regras de frontend
- `.agent/context/database-rules.md` — regras de banco
- `.agent/context/deployment-rules.md` — regras de deploy
- `.agent/context/roadmap.md` — próximos passos

## 11. Comunicação

- Se não tiver certeza, pergunte
- Se a tarefa for ambígua, peça esclarecimento
- Se for algo que requer permissão especial, avise
- Se for algo destrutivo (deletar dados), ALERTE antes

## 12. MCPs Disponíveis no Ambiente

Este projeto possui MCPs conectados e disponíveis. Use-os conforme as regras abaixo:

### GitHub MCP
- Use para consultar estado do repositório, branches, histórico, PRs e contexto de versionamento.
- **Não crie PR, merge, push ou alteração remota sem autorização explícita.**
- Uso recomendado: leitura, auditoria de histórico, consulta de issues.

### Playwright MCP
- Use para validar fluxos reais no navegador quando necessário.
- Priorize testes de login, booking, dashboard, fluxos críticos e regressões visuais.
- **Não use como substituto de testes automatizados** — use como validação operacional complementar.
- Uso recomendado: smoke tests pós-deploy, regressão visual, verificação de fluxos críticos.

### Supabase MCP
- Use para inspecionar schema, tabelas, policies, migrations e estrutura do banco.
- **Não altere dados reais, não rode migrations destrutivas e não modifique o banco de produção sem autorização explícita.**
- Para qualquer mudança de banco, gere migration versionada antes.
- Uso recomendado: inspeção de schema, auditoria de RLS policies, verificação de índices.

### Regras Gerais para MCPs
1. Sempre explique qual MCP pretende usar antes de ações sensíveis.
2. Nunca executar ação destrutiva sem confirmação do usuário.
3. Preferir leitura/auditoria antes de qualquer escrita.
4. GitHub, Playwright e Supabase são ferramentas auxiliares — a fonte principal continua sendo o código local e os documentos de arquitetura do projeto.

## 13. Troca de Provedor via API Key

Quando o usuário colar uma nova API Key, siga este fluxo automaticamente:

### 13.1 Detecção do Provedor (pelo prefixo da key)

| Prefixo da Key | Provedor | Modelo Sugerido |
|----------------|----------|-----------------|
| `sk-or-v1-` ou `sk-or-` | OpenRouter | openrouter/deepseek/deepseek-chat-v4-0605:free |
| `sk-proj-` ou `sk-` (32+ chars, sem outro match) | OpenAI | openai/gpt-4o |
| `sk-ant-` | Anthropic / Claude | anthropic/claude-sonnet-4-20250514 |
| `AIza` | Google / Gemini | google/gemini-2.5-pro-exp-03-25:free |
| `gsk_` | Groq | groq/llama-3.3-70b-versatile |
| `xai-` | xAI / Grok | xai/grok-2-1212 |
| `pplx-` | Perplexity | perplexity/sonar-pro |
| `tgp-` | Together AI | together/llama-3.3-70b-chat |
| `hf_` | HuggingFace | huggingface/huggingface-model |
| `ds_` ou `sk-` + deepseek.com | DeepSeek | deepseek/deepseek-chat |

### 13.2 Ações a Tomar

1. **Detectar** o provedor pelo prefixo da key.
2. **Perguntar** ao usuário qual modelo ele quer usar (se chave for OpenRouter, perguntar qual modelo; se for OpenAI/Anthropic/etc, já sugerir o modelo padrão).
3. **Atualizar** `opencode.json`:
   - Alterar `provider` para o nome do provedor detectado
   - Alterar `apiKey` para `${NOME_DA_VARIAVEL}`
   - Alterar `model` e `small_model` para o modelo escolhido
4. **Registrar a key como variável USER do Windows** (fonte oficial única):
   ```powershell
   [Environment]::SetEnvironmentVariable("OPENROUTER_API_KEY", "sk-or-v1-...", "User")
   ```
5. **Confirmar** com o usuário o provedor, modelo e que a troca foi feita.
6. **Avisar** que a key só valerá após reiniciar o OpenCode.

> ⚠️ NÃO salvar a key no `.env` — a fonte oficial é USER env var.

### 13.3 Exemplo de Resposta

> Detectei key do **OpenRouter**! Confirme o modelo que deseja usar (ex: `deepseek/deepseek-chat-v4-0605:free`). Vou registrar como USER env var e atualizar `opencode.json`.
