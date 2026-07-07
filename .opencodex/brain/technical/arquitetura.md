# Arquitetura — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Relacionamentos:** [[technical/DEPENDENCY-MAP]] · [[architecture-decisions]] · [[maps/multgestor-core/MAPA-MULTGESTOR-CORE]]

---

## Visão Geral

Arquitetura monolítica modular com separação de responsabilidades:

```
┌──────────────────────────────────────────────────────────────┐
│                     Frontend (React 19 + Vite)                │
├──────────────────────────────────────────────────────────────┤
│                  API Layer (Express 5)                        │
├──────────────────────────────────────────────────────────────┤
│    Services Layer (30 services) · Regras de Negócio          │
├──────────────────────────────────────────────────────────────┤
│     Core Layer (Cache, EventBus, DB, Outbox, Logger)         │
├──────────────────────────────────────────────────────────────┤
│     Infra Layer (Supabase, Redis, Storage, Workers)          │
└──────────────────────────────────────────────────────────────┘
```

## Princípios Arquiteturais

1. **Multi-tenant por `company_id`** — isolamento na aplicação
2. **Sem ORM** — SQL direto via `pg.Pool`
3. **Event-Driven** — ações relevantes emitem eventos
4. **API-First** — tudo via REST; frontend é cliente
5. **Defesa em profundidade** — filtro app + RLS banco

## Decisões Arquiteturais

Ver [[architecture-decisions]] para ADRs detalhadas:
- ADR-01: Multi-tenant por `company_id`
- ADR-02: Sem ORM
- ADR-03: Event Bus volátil + Outbox durável
- ADR-04: Outbox sem handler = no-op
- ADR-05: EVENT CONTRACTS + Factory obrigatórios
- ADR-06: RLS defesa em profundidade
- ADR-07: Governança em `.opencodex/`
- ADR-08: Windows + PowerShell
- ADR-09: Controle de abuso obrigatório

## Referências

- [[architecture-decisions]] — ADRs completas
- [[technical/DEPENDENCY-MAP]] — Mapa de dependências
- [[technical/backend]] — Backend detalhado
- [[technical/frontend]] — Frontend detalhado
- [[technical/banco]] — Banco detalhado
- [[maps/multgestor-core/MAPA-MULTGESTOR-CORE]] — Mapa vivo do Core
