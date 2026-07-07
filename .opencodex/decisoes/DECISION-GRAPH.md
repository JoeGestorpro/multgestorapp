# 🔀 Decision Graph — Grafo de Decisões

> **Status:** OFICIAL • VIVO
> **Camada:** 7 — Memória
> **Propósito:** Mapa completo de decisões do MultGestor com contexto, alternativas, justificativa, consequências, arquivos, PRs, deploys e decisões derivadas.
> **Relacionamentos:** [[decisions/README]] · [[architecture-decisions]] · [[linha-do-tempo]] · [[memoria]]

---

## Estrutura do Grafo

Toda decisão possui:
- **Contexto** — por que foi tomada
- **Alternativas** — o que foi considerado
- **Justificativa** — por que esta opção venceu
- **Consequências** — o que mudou
- **Arquivos** — documentos relacionados
- **PR/Deploy** — pull request e deploy associados
- **Derivadas** — decisões que surgiram a partir desta
- **Relacionamentos** — conexões com outras decisões

## Decisões Técnicas (ADRs)

### ADR-01 — Multi-tenant por company_id
| Campo | Valor |
|---|---|
| **Contexto** | Necessidade de isolar dados entre tenants sem custo de bancos separados |
| **Alternativas** | `owner_id`, banco por tenant, schema por tenant |
| **Decisão** | Isolamento via `company_id` em toda query |
| **Justificativa** | Menor custo, mais simples, RLS complementar |
| **Consequências** | Toda query precisa filtrar por company_id |
| **Derivadas** | ADR-06 (RLS), ADR-05 (Event Contracts) |

### ADR-02 — SQL direto via pg.Pool (sem ORM)
| Campo | Valor |
|---|---|
| **Contexto** | Prisma/TypeORM causavam complexidade e lentidão |
| **Alternativas** | Prisma, TypeORM, Knex, SQL puro |
| **Decisão** | SQL direto com `pg.Pool` |
| **Justificativa** | Performance, controle total, sem magic |
| **Consequências** | Queries manuais, migrations manuais |
| **Derivadas** | Migration flow via MCP |

### ADR-03 — Event Bus volátil + Outbox durável
| Campo | Valor |
|---|---|
| **Contexto** | Eventos precisavam ser publicados de forma confiável |
| **Alternativas** | Só EventBus (volátil), só Outbox (lento), ambos |
| **Decisão** | Dual: EventBus (in-memory) + Outbox (DB) |
| **Justificativa** | Performance + confiabilidade |
| **Consequências** | Complexidade de coordenação (UnitOfWork) |
| **Derivadas** | ADR-04 (no-op handler), ADR-05 (Event Contracts) |

### ADR-06 — RLS como defesa em profundidade
| Campo | Valor |
|---|---|
| **Contexto** | company_id na app não era suficiente para segurança |
| **Alternativas** | Só app layer, Só RLS, Ambos |
| **Decisão** | Ambos — company_id na app + RLS no banco |
| **Justificativa** | Defesa em profundidade |
| **Consequências** | app_runtime role sem BYPASSRLS |
| **Derivadas** | D-001 (RLS policies formais vs BYPASSRLS) |

## Decisões de Governança

### D-014 — Publicar .opencodex com ressalvas
| Campo | Valor |
|---|---|
| **Contexto** | `.opencodex` continha informações sensíveis |
| **Alternativas** | Não publicar, publicar com redação, publicar integral |
| **Decisão** | Publicar com redação de 9 arquivos |
| **Justificativa** | Transparência sem expor segurança |
| **Consequências** | ~70% do `.opencodex` publicável |

### D-015 — Fonte única do Segundo Cérebro
| Campo | Valor |
|---|---|
| **Contexto** | Dois cérebros desconectados (`.opencodex/brain` e `.agent/`) |
| **Alternativas** | Manter ambos, migrar tudo, fundir |
| **Decisão** | `.opencodex/brain` como fonte única; `.agent/` como arquivo histórico |
| **Justificativa** | Fim da duplicação e divergência |
| **Consequências** | `.agent/` congelado em 2026-06-04 |
| **Arquivo** | [[decisions/D-015-fonte-unica-segundo-cerebro]] |

### D-017 — Fechar 4 acoplamentos indevidos Core×Nicho (P0)
| Campo | Valor |
|---|---|
| **Contexto** | Auditoria Core×Nicho 2026-07-03 achou `company.service.js`/`clima.routes.js`/frontend com acoplamento de nicho em arquivos genéricos |
| **Alternativas** | Reescrever auth por módulo agora, deixar como dívida, correção pontual + nomes honestos |
| **Decisão** | Correção pontual (extrair Core, mover Nicho, alias genérico documentado) |
| **Justificativa** | Menor raio de mudança, zero risco a BarberGestor, não inventa capacidade inexistente |
| **Consequências** | `requireTenantAdminAuth` existe mas ainda é a mesma implementação de `requireBarberAdminAuth` — dívida documentada, não resolvida |
| **Derivadas** | Informa D-005 (ClimaGestor) — a correção de segurança do guard já foi feita independente da decisão de investir/congelar |
| **Arquivo** | [[decisions/D-017-core-p0-fronteira-nicho]] |

## Decisões Pendentes

| ID | Decisão | Contexto | Bloqueio |
|---|---|---|---|
| D-001 | RLS: policies formais vs BYPASSRLS | Modelo de RLS atual vs policies explícitas | Humano |
| D-002 | Redis: pagar vs aceitar in-memory | Rate limit e cache sem Redis são limitados | Custo |
| D-003 | WhatsApp: real vs mock | Integração WhatsApp real vs mock atual | Custo/contrato |
| D-004 | OutboxWorker: break vs continue | Comportamento em caso de erro | Decisão técnica |
| D-005 | ClimaGestor: investir vs congelar | Prioridade do próximo nicho — auditoria 2026-07-03 mostrou backend ~50%/frontend ~1%, guard de auth já corrigido (D-017) | Estratégia |

## Mapa Visual de Dependências entre Decisões

```
ADR-01 (company_id)
  ├── ADR-06 (RLS)
  │   └── D-001 (RLS policies) [PENDENTE]
  └── ADR-05 (Event Contracts)
      └── D-004 (OutboxWorker) [PENDENTE]

ADR-03 (EventBus + Outbox)
  ├── ADR-04 (no-op handler)
  └── ADR-05 (Event Contracts)

D-014 (Publicar .opencodex)
  └── D-015 (Fonte única)

D-002 (Redis) [PENDENTE]
  └── D-003 (WhatsApp) [PENDENTE]
```

## Estatísticas do Grafo

| Métrica | Valor |
|---|---|
| Decisões tomadas | 12 (9 ADRs + 3 D decisões) |
| Decisões pendentes | 5 |
| Decisões com alternativas | 12/12 (100%) |
| Decisões com PR associado | 4 |
| Decisões com deploy associado | 3 |
| Profundidade média do grafo | 2.1 níveis |

## Referências

- [[decisions/README]] — Decision Center (índice)
- [[architecture-decisions]] — ADRs completas
- [[strategy/strategic-decision-log]] — Decisões estratégicas
- [[living-os/decisoes/decisoes-executivas]] — Decisões executivas pendentes
- [[linha-do-tempo]] — Timeline (quando cada decisão foi tomada)
- [[memoria]] — Memória do conhecimento
