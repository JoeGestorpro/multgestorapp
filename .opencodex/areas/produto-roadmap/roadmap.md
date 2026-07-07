# Roadmap de Produto — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Relacionamentos:** [[00-HOME#Roadmap Resumido]] · [[status-dinamico#Roadmap — Status Executivo]] · [[strategy/strategic-decision-log]] · [[strategy/product-futurist-engine]]

---

## Camadas

### Camada 1 — Fundação Segura (🔴 BLOCKED)
| Item | Status | Dependência |
|---|---|---|
| Backup externo B2 | ✅ | — |
| RLS companies/users | ⬜ | Decisão humana |
| Redis produção | ⬜ | Decisão humana |
| Migration fail-fast | ⬜ | OPS-SUPAVISOR |
| E2E booking automatizado | ⬜ | — |
| Alertas de falha | ⬜ | — |

### Camada 2 — Produto Vendável (🟡 EM PLANEJAMENTO)
| Item | Status | Dependência |
|---|---|---|
| Fluxo trial → pago | ⬜ | Camada 1 |
| Feature gate inadimplente | ⬜ | Camada 1 |
| WhatsApp real | ⬜ | Decisão D-003 |
| Canal suporte | ⬜ | — |
| Política privacidade | ⬜ | — |
| UX polishing | ⬜ | — |

### Camada 3 — Escala Multi-Nicho (⚪ VISÃO)
| Item | Status | Dependência |
|---|---|---|
| Core vs Vertical boundary map | ⬜ | Camada 2 |
| BeautyGestor / ClimaGestor | ⬜ | Boundary map |
| Onboarding por nicho | ⬜ | Camada 2 |
| Internacionalização | ⬜ | Estratégia |

## Lançamentos

| Versão | Foco | Previsão |
|---|---|---|
| v2.0 | Fundação Segura + Piloto Pago | Q3 2026 |
| v2.1 | WhatsApp real + Trial → Pago | Q3 2026 |
| v2.2 | UX + Relatórios | Q4 2026 |
| v3.0 | Segundo nicho | Q1 2027 |

## Referências

- [[strategy/strategic-decision-log]] — Decisões estratégicas
- [[strategy/product-futurist-engine]] — Ideias futuras
- [[strategy/niche-radar]] — Ranking de nichos
- [[commercial-readiness]] — Prontidão comercial
