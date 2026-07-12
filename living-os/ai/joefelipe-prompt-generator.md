# JoeFelipe Agent — V4 Prompt Generator Mode

> **Componente:** Prompt Generator do Agente JoeFelipe
> **Versão:** V4
> **Status:** Implementado — local/mock, sem chamada externa
> **Local:** `tools/joefelipe-agent/src/prompt/`

## 1. O que é a V4

A V4 adiciona uma camada que **transforma uma missão já classificada pela V3 (Mission Builder) em um prompt textual seguro**, pronto para colar em Claude Code / OpenCode.

Em linguagem simples:
- **V3 (Mission Builder)** = entende e **classifica** a missão (risco, escopo, aprovação humana).
- **V4 (Prompt Generator)** = transforma a missão em um **prompt seguro** para outro agente executar de forma assistida.

## 2. Relação Mission Builder → Prompt Generator

```
estado do projeto + intenção
        ↓  V3 MissionBuilder.buildMission()
Mission { classification, scope, requiresHumanApproval, safety, validationChecklist, ... }
        ↓  V4 generatePrompt({ mission })
GeneratedPrompt { text: "prompt seguro pronto para colar", safety, validation }
```

A V4 **consome** os campos de segurança da missão (`classification`, `requiresHumanApproval`,
`safety.canExecute`, `provenance.externalCallsEnabled`, `scope.allowed/forbidden`,
`validationChecklist`) e **nunca os afrouxa**.

## 3. O que o Prompt Generator faz

Gera um prompt textual contendo, no mínimo:
- **Objetivo** da missão;
- **Contexto**;
- **Escopo permitido** / **Escopo proibido**;
- **Classificação de risco** (+ `llmMode`);
- **Aprovação humana** necessária;
- **Validações obrigatórias**;
- **Regras de segurança** (anti-secrets, anti-execução perigosa, anti-push/merge sem autorização);
- **Relatório final esperado**;
- **Instrução clara de parada** (“Pare após o relatório final.”).

## 4. O que ele NÃO faz

- ❌ Não executa ações.
- ❌ Não chama LLM real (OpenAI/OpenRouter/Anthropic) nem API externa.
- ❌ Não acessa secrets, banco, deploy, migrations, GitHub/Supabase/Render/Vercel.
- ❌ Não substitui aprovação humana.
- ✅ Apenas **gera texto seguro** para execução assistida.

## 5. Limites de segurança (invariantes)

- `canExecute: false` sempre (propor, não executar).
- `externalCalls: false` sempre (tudo local/mock/inerte).
- Missão `DANGEROUS` → o prompt deixa explícito: `requiresHumanApproval: true`, `canExecute: false`,
  não executar/push/secrets/banco/deploy/migrations/comandos destrutivos sem autorização, e
  **parar** diante de estado sujo, divergência ou risco não previsto.

## 6. Como usar

```bash
# prompt seguro a partir da missão de exemplo
npm run joefelipe:prompt

# sob medida
npm --prefix tools/joefelipe-agent run prompt -- "<title>" "<intent>"
```

O comando `joefelipe:mission` também passa a incluir a seção **“Prompt seguro gerado (V4)”**
na saída e no artefato `runtime/mission.md`. O comando `joefelipe:prompt` imprime o prompt puro
e grava `runtime/prompt.md` (ambos git-ignored).

## 7. Exemplo resumido de prompt gerado

```text
Você está autorizado a executar somente a missão descrita abaixo.

Contexto:
Missão security/rls-companies-users (executor-alvo: claude-code) ...

Objetivo:
Criar a migration e as políticas RLS no banco ...

Escopo permitido:
- supabase/migrations/
- docs/security/rls.md

Escopo proibido:
- .obsidian/ ...
- .opencodex/archive/ ...

Classificação de risco:
DANGEROUS (llmMode LOCKED)

Aprovação humana:
requiresHumanApproval: true — OBRIGATÓRIA antes de qualquer execução.

Regras de segurança:
- ⚠ requiresHumanApproval: true — NÃO inicie execução sem autorização humana explícita.
- canExecute: false — propor, nunca executar diretamente.
- externalCalls: false — sem chamadas externas / sem LLM real.
- ...

Pare após o relatório final.
```

## 8. Arquitetura (arquivos)

| Arquivo | Função |
|---|---|
| `src/prompt/prompt-types.ts` | Tipos: `PromptGeneratorInput`, `GeneratedPrompt`, `PromptSafetyRules`, `PromptValidation`. |
| `src/prompt/PromptTemplate.ts` | Deriva regras de segurança/validações e monta o texto do prompt. |
| `src/prompt/PromptGenerator.ts` | `generatePrompt()` + `writePromptArtifact()` (runtime, git-ignored). |

## 9. Validações

```bash
npm --prefix tools/joefelipe-agent run build   # tsc --noEmit
npm run joefelipe:mission                       # inclui seção "Prompt seguro gerado (V4)"
npm run joefelipe:prompt                        # prompt puro + runtime/prompt.md
```

## 10. Próximos passos futuros

- V5: Provider LLM real com gates de segurança (desligado por padrão).
- Variantes de prompt por tipo (auditoria / execução / PR / validação / rollback).
- Integração da “próxima melhor ação” do Living OS na geração de missões + prompts.
