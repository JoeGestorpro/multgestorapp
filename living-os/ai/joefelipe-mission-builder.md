# Mission Builder — Agente JoeFelipe V3

> **Estágio:** 3 (Gerador de Missões Operacionais) do PRD `prd-joefelipe-v0.1.md`.
> **Modo:** READ-ONLY. LLM propõe, não executa. `canExecute` sempre `false`.
> **Local:** `tools/joefelipe-agent/src/mission/`.

## O que é

O Mission Builder transforma o **estado real do projeto** + uma intenção em uma
**missão operacional segura**: um pacote tipado e auditável que diz ao executor
(Claude Code / OpenCode) exatamente o que fazer, o que **não** fazer, como validar,
como reverter e como commitar — sempre respeitando a governança e a aprovação humana.

Ele **não executa nada**, **não edita a fila** (`.opencodex/queue/`) e **não chama
API externa**. Apenas lê fontes (via `buildState`), consulta o LLM Core mock e grava
um artefato local em `runtime/mission.md` (git-ignored).

## Como rodar

```bash
# missão de exemplo (demonstra elevação para DANGEROUS por banco/RLS/migration)
npm --prefix tools/joefelipe-agent run mission

# missão sob medida
npm --prefix tools/joefelipe-agent run mission -- "<title>" "<intent>"
```

Saída: markdown completo no stdout **e** em `tools/joefelipe-agent/runtime/mission.md`
(ignorado pelo git — nunca entra em commit).

## Modelo de dados (`Mission`)

Definido em `src/mission/mission-types.ts`:

| Campo | Descrição |
|---|---|
| `id` | kebab, ex.: `security/rls-companies-users` |
| `title` | título humano |
| `classification` | `READ_ONLY` · `PLAN_ONLY` · `SAFE_WRITE` · `HUMAN_GATED` · `DANGEROUS` |
| `executor` | `claude-code` · `opencode` |
| `llmMode` | LlmMode da V2 mapeado da classificação |
| `requiresHumanApproval` | `true` a partir de `HUMAN_GATED` |
| `scope.allowed` / `scope.forbidden` | escopo permitido (sanitizado) / proibido (governança) |
| `operationalPrompt` | prompt pronto para o executor |
| `validationChecklist` | checklist de validação |
| `rollbackPlan` | plano de rollback |
| `commitPrompt` | mensagem de commit sugerida (Conventional Commit) |
| `safety` | `LlmSafety` da LLM Core (`canExecute` sempre `false`) |
| `provenance` | auditabilidade: fontes lidas, provider/model, origem do risco |
| `warnings` | avisos de escopo + razões de classificação |

## Classificação de risco

Determinística, com precedência crescente:

```
READ_ONLY < PLAN_ONLY < SAFE_WRITE < HUMAN_GATED < DANGEROUS
```

- **Base:** escopo com arquivos de escrita → `SAFE_WRITE`; intenção de leitura/auditoria
  sem arquivos → `READ_ONLY`; senão `PLAN_ONLY`.
- **Eleva por termos sensíveis** (`src/llm/sensitive.ts`, fonte única de verdade):
  - `dangerous` (banco, migrations, RLS, Redis, WhatsApp real, B2 upload, produção,
    deploy, delete, rm, drop, truncate, secret) → `DANGEROUS`;
  - `gated` (push, merge, commit) → `HUMAN_GATED`.
- **Eleva por `safety.requiresHumanApproval`** retornado pelo LLM Core → `HUMAN_GATED`.

### Mapa classificação → LlmMode (V2, sem quebra de contrato)

| Mission (V3) | LlmMode (V2) |
|---|---|
| READ_ONLY | `READ_ONLY` |
| PLAN_ONLY | `PLAN_ONLY` |
| SAFE_WRITE | `SAFE_WRITE` |
| HUMAN_GATED | `HUMAN_APPROVAL_REQUIRED` |
| DANGEROUS | `LOCKED` |

## Como evita execução perigosa

- `canExecute` sempre `false`; `DANGEROUS` → `LOCKED`.
- Só escreve em `runtime/` (best-effort, try/catch). Nunca em `.opencodex/queue/`,
  `.opencodex/brain/`, código de app ou git.
- Git apenas leitura (reusa `git.ts`).
- `isSensitivePath` remove arquivos sensíveis do escopo permitido.
- `.obsidian/` e `.opencodex/archive/` aparecem **sempre** como proibidos.
- Zero rede, zero secrets, zero deps de runtime.

## Arquitetura (arquivos)

| Arquivo | Função |
|---|---|
| `src/llm/sensitive.ts` | Fonte única de termos sensíveis (usado por MockProvider + classify). |
| `src/mission/mission-types.ts` | Tipos (`Mission`, `MissionInput`, `MissionClassification`). |
| `src/mission/classify.ts` | Classificação de risco determinística. |
| `src/mission/scope.ts` | Escopo permitido/proibido + blocklist de governança. |
| `src/mission/render.ts` | Prompt, checklist, rollback, commit, markdown. |
| `src/mission/templates.ts` | Blocos de texto fixos. |
| `src/mission/MissionBuilder.ts` | Orquestrador estado → LLM → `Mission`. |

## Limites (V3)

- LLM real: fora de escopo (segue só MockProvider).
- Promoção automática para a fila: fora de escopo (continua humano).
- Governance Guard / detecção de drift: V4.
- Endpoint HTTP de prompt livre: fora de escopo (builder é CLI).
