# 00 — MultGestor Living Operating System

> **Status:** MANIFESTO VIVO · **Atualizado:** 2026-06-19
> **Propósito:** Definir o que é o Living OS, seus princípios e sua arquitetura.

---

## O que é

O MultGestor Living Operating System é a **máquina de decisão executiva** do projeto. Diferente de documentação estática, ele é um conjunto de telas vivas, interligadas, que qualquer agente (IA ou humano) pode consultar para responder instantaneamente:

1. O que é o MultGestor?
2. Onde estamos?
3. O que falta para produção?
4. O que falta para venda?
5. O que está bloqueado?
6. Qual maior risco ativo?
7. Qual próxima melhor ação?

---

## Princípios

1. **Vivo, não estático** — cada missão concluída atualiza o Living OS.
2. **Uma fonte da verdade** — não duplica dados existentes; linka para `project-state.md`, `capabilities-map.md`, filas.
3. **Executivo, não técnico** — linguagem simples, sem detalhes de implementação.
4. **Acionável** — toda tela termina com uma decisão ou ação recomendada.
5. **Hierárquico** — do macro (mapa) ao micro (scorecards), passando por painel, produção e venda.

---

## Arquitetura em 5 camadas

```
┌──────────────────────────────────────────────────────────────┐
│  1. IDENTIDADE  (00-manifesto + 01-mapa-vivo)               │
│  → Quem somos, o que fazemos, como estamos organizados       │
├──────────────────────────────────────────────────────────────┤
│  2. CONSCIÊNCIA  (02-painel-executivo)                      │
│  → Onde estamos agora, o que mudou, o que bloqueia          │
├──────────────────────────────────────────────────────────────┤
│  3. PRONTIDÃO  (03-producao + 04-vendavel)                  │
│  → Estamos prontos para produzir? para vender?              │
├──────────────────────────────────────────────────────────────┤
│  4. MÉTRICAS  (scorecards + gates)                          │
│  → Quanto falta? O que é critério de bloqueio?              │
├──────────────────────────────────────────────────────────────┤
│  5. AÇÃO  (05-proxima-melhor-acao + riscos + decisoes)      │
│  → O que fazer agora? O que pode dar errado?                │
└──────────────────────────────────────────────────────────────┘
```

---

## Como o Living OS se mantém vivo

| Evento | Ação |
|---|---|
| Missão concluída | Atualizar scorecards + painel + riscos + próxima ação |
| Novo risco identificado | Adicionar em `riscos-ativos.md` + atualizar `risco-scorecard.md` |
| Decisão tomada | Registrar em `decisoes-executivas.md` |
| Gate aberto/fechado | Atualizar gate correspondente |
| Mudança de estado | Atualizar `02-painel-executivo.md` |
| Fim de ciclo/mês | Revisão completa de todos os indicadores |

---

## Relação com o Segundo Cérebro

O Living OS é uma **camada executiva sobre o Segundo Cérebro**. Ele não substitui:

- `project-state.md` — estado detalhado do projeto (quem mantém é ele)
- `capabilities-map.md` — mapa técnico de capacidades
- `production-readiness.md` — análise detalhada de produção
- `commercial-readiness.md` — análise detalhada comercial
- Filas (`next-task.md`, `backlog.md`) — execução operacional

O Living OS **consolida, simplifica e executa decisões** a partir dessas fontes.
