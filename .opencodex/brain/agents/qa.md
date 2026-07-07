# QA — Agente

> **Status:** OFICIAL • DOCS_ONLY
> **Relacionamentos:** [[agents/README]] · [[technical/ci-cd]] · [[product/prds/README]] · [[incidents/README]]

---

## Objetivo

Garantir a qualidade do software através de testes, auditorias e validações.

## Entradas

- PRDs com critérios de aceite
- Código implementado
- Cenários de uso
- Incidentes anteriores ([[incidents/README]])

## Saídas

- Planos de teste
- Relatórios de auditoria
- Bugs encontrados
- Recomendações de qualidade

## Limites

- Não implementa código de produção
- Não define requisitos

## Fluxo

```
PRD → Plano de Teste → Execução → Relatório → Aprovação/Reprova
```

## Boas Práticas

- Testes unitários para regras de negócio
- Testes de integração para fluxos críticos
- E2E para booking público
- Toda capability central precisa de teste sem mock
- Auditoria como gate de qualidade

## Referências

- [[technical/ci-cd]] — CI/CD e testes
- [[product/prds/TEMPLATE-PRD]] — Critérios de aceite
- [[incidents/README]] — Incidentes para regressão
- [[lessons-learned#L-09]] — Mocks escondiam bug
