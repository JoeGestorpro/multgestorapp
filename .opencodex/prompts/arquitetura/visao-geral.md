# Prompts de Arquitetura

> **Status:** VIVO
> **Relacionamentos:** [[prompts/visao-geral]] · [[technical/arquitetura]] · [[decisoes-arquiteturais]]

---

## Prompt: Propor ADR

```
Proponha uma Architecture Decision Record (ADR) para:

Problema: [PROBLEMA]
Contexto: [CONTEXTO]

Formato ADR:
1. Título e número
2. Contexto e problema
3. Alternativas consideradas
4. Decisão tomada
5. Justificativa
6. Impacto (positivo e negativo)
7. Status (proposta/aceita/deprecada)

Consulte ADRs existentes: [[decisoes-arquiteturais]]
Stack: [[technical/README]]
```

## Prompt: Revisar Arquitetura

```
Revise a arquitetura proposta para [FUNÇÃO] no MultGestor.

Princípios:
1. Multi-tenant por company_id
2. Sem ORM (SQL direto)
3. Event-driven (EventBus + Outbox)
4. API-first
5. Defesa em profundidade

A proposta está alinhada com ADR vigentes? [[decisoes-arquiteturais]]
```

## Referências

- [[technical/README]] — Technical Brain
- [[decisoes-arquiteturais]] — ADRs
- [[technical/DEPENDENCY-MAP]] — Mapa de dependências
