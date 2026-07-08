# Diário do Projeto

> Responde: **"O que aconteceu?"**
> Registro cronológico de eventos reais — o que foi feito, quando, e por quem
> (humano ou IA). Não é o lugar para "por que decidimos" (isso são as
> [[decisoes/README|Decisões]]) nem para "como funciona" (isso é a
> [[Base de Conhecimento]]).

## Template de entrada

```markdown
## AAAA-MM-DD

**Resumo:** uma frase sobre o dia.

**O que foi feito:**
- Item 1
- Item 2

**Decisões tomadas:** (link para `decisoes/` se virou ADR formal)

**Pendências para o próximo dia:**
- Item 1
```

---

## 2026-07-07

**Resumo:** Fase 10/11 do JoeFelipe Agent implementadas e testadas; `.opencodex/brain/` reorganizado por projetos/áreas; camada de navegação MOC e governança documental estabelecidas.

**O que foi feito:**
- Fase 10 (LLM Cost Safety): `BudgetProvider`, `RateLimitProvider`, `CircuitBreakerProvider` envelopando o `LlmEngine`; custo real parseado da API; evento `llm:cost` persistido; card "LLM Cost" no painel.
- Fase 11-B.1 (E2E Foundation): endpoint `/api/llm/test` sem side effects; parser resiliente em `LLMPlanningStrategy`; suíte `e2e.test.ts` com provider simulado.
- Reorganização do `.opencodex/brain/` (monolítico) em `projetos/`, `areas/`, `auditorias/`, `decisoes/`, `prompts/`, `_inbox/` — 324 arquivos movidos via `git mv`, 127 wikilinks corrigidos.
- Camada MOC: `00-HOME.md` reformulado, `BarberGestor - HOME.md`, `MultCriativos - HOME.md`, 6 índices de área técnica.
- Governança documental: [[Governanca-Documental]] com 8 documentos canônicos, [[Base de Conhecimento]] consolidada, [[Segundo Cérebro]] indexado, este diário criado.

**Decisões tomadas:**
- `knowledge-os.md` marcado como legado — conhecimento técnico permanente migrado para [[Base de Conhecimento]].
- Mapa de correspondência entre pergunta canônica e arquivo real documentado em [[Governanca-Documental]] (inclui a resolução da ambiguidade "Índice Geral" vs "Mapa do Projeto").

**Pendências para o próximo dia:**
- Os 6 arquivos-raiz protegidos (`ATLAS.md`, `CONVENCOES.md`, `FLUXOS.md`, `GLOSSARIO.md`, `HOME.md`, `MAPA-DAS-PASTAS.md`) ainda referenciam o antigo `brain/` e têm links quebrados — precisam de revisão manual humana (não podem ser editados por missão automatizada, por regra).
- `_inbox/revisar/` e `_inbox/antigos/` ainda têm itens pendentes de classificação final.
