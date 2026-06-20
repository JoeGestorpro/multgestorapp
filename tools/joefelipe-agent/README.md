# Agente JoeFelipe Vivo Local (V3)

> **Nome humano:** Agente JoeFelipe
> **Nome técnico:** `joefelipe-personal-operating-agent`
> **Modo:** READ-ONLY
> **LLM Core:** MockProvider (V2)
> **Mission Builder:** V3 (gerador de missões operacionais seguras)
> **Identidade canônica:** `.opencodex/brain/agents/joefelipe-personal-operating-agent.md`

## O que é

Um agente local, residente e READ-ONLY que conecta o **Primeiro Cérebro do JoeFelipe** (fundador) ao **Segundo Cérebro do MultGestor** (memória oficial) e ao **Living OS** (autoridade executiva).

Ele lê, consolida e apresenta o estado real do projeto em um painel local. Desde a V2, possui um **LLM Core plugável** com provider mock, que simula respostas de IA sem chamar API externa. **Nunca escreve no Segundo Cérebro, nunca edita a fila, nunca executa.**

## Como rodar

```bash
# 1. Instalar dependências (uma vez)
npm install --prefix tools/joefelipe-agent

# 2. Iniciar servidor vivo
npm run joefelipe:dev
# → http://localhost:3333

# 3. Ver estado no terminal
npm run joefelipe:status

# 4. Bom dia operacional
npm run joefelipe:morning

# 5. Encerrar sessão
npm run joefelipe:close
```

## O que ele lê (fontes canônicas)

| Fonte | Papel |
|---|---|
| `.opencodex/brain/INDEX.md` | Índice do Segundo Cérebro |
| `.opencodex/brain/project-state.md` | Estado do projeto |
| `.opencodex/queue/current-task.md` | Missão atual |
| `.opencodex/queue/next-task.md` | Próxima missão |
| `.opencodex/queue/backlog.md` | Backlog |
| `.opencodex/brain/living-os/` | Living OS (autoridade executiva) |
| `.opencodex/brain/strategy/` | Estratégia Global Vision Architect |
| `.opencodex/brain/agents/` | Agentes de governança |
| Git | Branch, status, log (read-only) |

## LLM Core (V2)

O Agente JoeFelipe V2 possui um **LLM Core plugável** em `src/llm/`.

| Camada | Arquivo | Função |
|---|---|---|
| Interface | `src/llm/LlmProvider.ts` | Contratos `LlmProvider`, `LlmRequest`, `LlmResponse` |
| Engine | `src/llm/LlmEngine.ts` | Central: carrega config, instancia provider, fallback mock |
| Config | `src/llm/llm-config.ts` | Leitura segura por env `JOEFELIPE_LLM_PROVIDER` |
| Provider | `src/llm/providers/MockProvider.ts` | LLM simulada, sem API externa, sem secrets |

**Regras do LLM Core:**
- LLM propõe, não executa.
- `canExecute` é sempre `false` na V2.
- Ações sensíveis (push, deploy, secret, migration, etc.) são bloqueadas com `requiresHumanApproval: true`.
- Fallback seguro para mock se config inválida.
- Nenhuma chamada externa, nenhum secret lido.

**Configuração:**
```bash
JOEFELIPE_LLM_PROVIDER=mock   # único funcional na V2
JOEFELIPE_LLM_MODEL=mock-safe-v1
```

## Mission Builder (V3)

O Mission Builder transforma o estado do projeto + uma intenção em uma **missão
operacional segura** para Claude Code / OpenCode. READ-ONLY: LLM propõe, não executa;
`canExecute` continua sempre `false`.

```bash
# missão de exemplo (demonstra elevação para DANGEROUS por banco/RLS/migration)
npm --prefix tools/joefelipe-agent run mission

# missão sob medida
npm --prefix tools/joefelipe-agent run mission -- "<title>" "<intent>"
```

Cada missão gera: `id`, `title`, `classification`, `executor`, `llmMode`,
`requiresHumanApproval`, escopo permitido/proibido, `operationalPrompt`,
`validationChecklist`, `rollbackPlan`, `commitPrompt`, `safety`, `provenance`, `warnings`.

A saída vai para o stdout **e** para `runtime/mission.md` (git-ignored — nunca entra em commit).

| Camada | Arquivo | Função |
|---|---|---|
| Termos sensíveis | `src/llm/sensitive.ts` | Fonte única (usada por MockProvider + classify) |
| Tipos | `src/mission/mission-types.ts` | `Mission`, `MissionInput`, `MissionClassification` |
| Classificação | `src/mission/classify.ts` | READ_ONLY → DANGEROUS (precedência + safety) |
| Escopo | `src/mission/scope.ts` | Permitido/proibido + blocklist de governança |
| Render | `src/mission/render.ts` | Prompt, checklist, rollback, commit, markdown |
| Orquestrador | `src/mission/MissionBuilder.ts` | Estado → LLM Core → `Mission` |

Documentação completa: [`living-os/ai/joefelipe-mission-builder.md`](../../living-os/ai/joefelipe-mission-builder.md).

**Classificação → LlmMode:** READ_ONLY→`READ_ONLY` · PLAN_ONLY→`PLAN_ONLY` ·
SAFE_WRITE→`SAFE_WRITE` · HUMAN_GATED→`HUMAN_APPROVAL_REQUIRED` · DANGEROUS→`LOCKED`.

## O que ele NÃO faz (V3)

- ❌ `git commit`, `git push`, deploy
- ❌ Rodar migrations, mexer em banco
- ❌ Ler secrets, `.env`, tokens, chaves
- ❌ Chamar APIs externas
- ❌ Criar fontes paralelas de verdade
- ❌ Editar a fila (`.opencodex/queue/`)
- ❌ Promover missões automaticamente para a fila (continua humano)
- ❌ Qualquer comando destrutivo

## Comandos disponíveis

| Comando raiz | Comando local | Efeito |
|---|---|---|
| `npm run joefelipe:dev` | `npm run dev` | Sobe servidor `:3333` + watcher |
| `npm run joefelipe:status` | `npm run status` | Imprime estado no terminal |
| `npm run joefelipe:morning` | `npm run morning` | Bom dia operacional |
| `npm run joefelipe:close` | `npm run close` | Encerramento de sessão |
| — | `npm run mission` | Gera missão operacional (V3) → stdout + `runtime/mission.md` |

## Filosofia

- **A V1 é READ-ONLY.** Nenhuma execução, mutação ou decisão parte daqui.
- **Living OS é autoridade executiva.** O agente referencia, não duplica.
- **Segundo Cérebro é memória oficial.** O agente lê, não escreve.
- **Segurança primeiro.** Arquivos sensíveis são ignorados automaticamente.
- **Zero dependências de runtime.** Só APIs nativas do Node (`http`, `fs`, `child_process`). As devDependencies (`tsx`, `typescript`, `@types/node`) servem apenas para rodar/checar o TypeScript.
- **Zero rede.** Nenhum dado sai da máquina.

## Endpoints

| URL | Descrição |
|---|---|
| `http://localhost:3333` | Painel HTML |
| `http://localhost:3333/api/state` | Estado completo em JSON |

## Validação

```bash
# 1. Servidor vivo
npm run joefelipe:dev

# 2. Testar HTML
curl http://localhost:3333

# 3. Testar API
curl http://localhost:3333/api/state

# 4. Terminal
npm run joefelipe:status
npm run joefelipe:morning
npm run joefelipe:close
```

## Limitações (V2)

1. Watcher no Windows com `recursive: true` não detecta pastas criadas após a inicialização.
2. Painel HTML inline, sem React — serve para V1/V2.
3. Logs runtime são best-effort (nunca derrubam o agente).
4. Estado não persiste entre reinicializações (apenas snapshot JSON local).
5. LLM Core V2: apenas MockProvider funcional. Providers reais (OpenAI, OpenRouter, Anthropic) serão adicionados em versões futuras.
6. LLM Core V2: sem endpoint de prompt livre. A LLM só é consumida internamente pelo agente.

## Próximos passos futuros

- ✅ V3: Mission Builder (gerador de missões para Claude Code/OpenCode) — entregue
- V4: Governance Guard (validação de escopo, detecção de drift)
- V5: Provider real com gates de segurança
