# SkillGate — Sistema Obrigatório de Skills e Agentes

> Subsistema do chatJoe que torna skills e agentes obrigatórios em toda missão.
> Nenhum prompt executor é gerado sem passar pelo gate.

---

## Regra de ouro

Toda missão precisa de skills e agentes definidos e justificados antes de gerar prompt.

## Como funciona

```
preparar missão
  → classifica tipo (roteador)
  → mede risco
  → ROTEADOR sugere skills + agentes (automático)
  → GATE: usuário CONFIRMA ou AJUSTA
  → JUSTIFICATIVA registrada
  → SÓ ENTÃO: gerar prompt executor
```

## Mínimos por risco

| Risco | Mín. skills | Mín. agentes | Exige |
|---|---|---|---|
| 1 | 1 skill | 0 | — |
| 2 | 1 skill | 1 agente | — |
| 3 | 2 skills | 1 agente | QA ou Platform Architect |
| 4 | 3 skills | 2 agentes | Security Auditor incluso |
| 5 | 3 skills | 2 agentes | Security Auditor + Platform Architect |

## Bloqueio

O comando `chatJoe gerar prompt executor` verifica:
- skills definidas e justificadas?
- agentes definidos e justificados?
- mínimos por risco respeitados?

Se algo faltar, o prompt não é gerado. O usuário precisa completar a missão primeiro.

## Formato da justificativa

```
Skills selecionadas:
  - backend — justificativa: "missão envolve criar nova API REST"
  - testes — justificativa: "código novo precisa de cobertura"

Agentes selecionados:
  - Backend Specialist — justificativa: "único que conhece os padrões"
  - QA Engineer — justificativa: "risco 3 exige validação"

Aprovado por: chatJoe + usuário (confirmação manual)
Data: 2026-07-07
```
