# Database Architect — Agente

> **Status:** OFICIAL • DOCS_ONLY
> **Relacionamentos:** [[agents/README]] · [[technical/banco]] · [[technical/rls]] · [[technical/eventos]]

---

## Objetivo

Projetar e manter o banco de dados PostgreSQL — schema, migrations, performance, RLS e isolamento multi-tenant.

## Entradas

- PRDs com requisitos de dados
- ADRs de arquitetura
- Capacidades do Core
- Requisitos de isolamento multi-tenant

## Saídas

- Migrations SQL
- Policies RLS
- Índices e otimizações
- Schema de dados
- Event contracts (outbox)

## Limites

- Não implementa regras de negócio na aplicação
- Não modifica dados sem migration

## Fluxo

```
Requisito → Modelagem → Migration → RLS → Índices → Review
```

## Boas Práticas

- Sem ORM — SQL direto via `pg.Pool`
- Toda migration tem rollback planejado
- RLS como defesa em profundidade
- Eventos via outbox (não triggers)
- `company_id` em toda query tenant

## Referências

- [[technical/banco]] — Banco detalhado
- [[technical/rls]] — RLS detalhado
- [[technical/eventos]] — Eventos e outbox
- [[decisoes-arquiteturais#ADR-02]] — Sem ORM
- [[decisoes-arquiteturais#ADR-06]] — RLS defesa em profundidade
