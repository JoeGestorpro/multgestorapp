---
tipo: estrategia
area: core
status: pronto
confianca: alta
ultima_revisao: 2026-06-19
---

# 🔋 Core Power Map — o poder reutilizável do MultGestor

> **Fonte:** [[../capabilities-map|capabilities-map]] (canônico) + [[../maps/multgestor-core/MAPA-MULTGESTOR-CORE|Mapa Vivo]]. Este doc interpreta o poder estratégico; o estado real vive no capabilities-map.
> **Confiança:** alta (baseado em capacidades comprovadas).

## O que é o MultGestor Core
A fundação reutilizável que sustenta qualquer vertical sem reescrita: multi-tenant real, orientado a eventos, com booking, billing e integrações compartilháveis. Verticais são *configurações* do Core, não projetos novos.

## O poder do Core (capacidades reutilizáveis e seu valor estratégico)
| Capacidade | Status real | Poder estratégico (o que destrava) |
|---|---|---|
| Multi-Tenant Engine | ✅ | Um banco, N clientes/verticais isolados por `company_id` |
| EventBus + Outbox durável | ✅ | Automação confiável: lembrete, campanha, workflow, integração |
| Booking Engine | ✅ (Barber + Clima) | Qualquer nicho de **agendamento** nasce quase de graça |
| Billing/Planos (Kiwify/AbacatePay) | ✅ | Receita recorrente, feature gates, planos por vertical |
| Integration Layer + Token Encryption | ✅ | Conectores (WhatsApp, gateways) seguros e per-tenant |
| Cache/Rate Limit | 🟡 (in-memory em prod) | Escala e proteção — depende de Redis ([[../living-os/riscos/riscos-ativos\|R-003]]) |
| WhatsApp (Meta API) | 🟡 (mock default) | Canal de cliente — decisão pendente ([[../living-os/decisoes/decisoes-executivas\|D-003]]) |
| Observabilidade (Pino/Sentry/Prom) | ✅ | Operar com N clientes sem voar cego |

## Relação Core ↔ Verticais
```
              ┌──────────────── MultGestor Core ────────────────┐
              │ multi-tenant · events · booking · billing · int. │
              └───────┬───────────┬───────────┬──────────┬───────┘
                      │           │           │          │
                BarberGestor  ClimaGestor   (Pet/Auto/  (Beauty/
                  ✅ completo   🟡 CRUD       Agro)       Store)
                                              [VISÃO]     [VISÃO]
```

## Como cada vertical reaproveita o Core
| Vertical | Status | Reaproveita do Core | Específico do vertical |
|---|---|---|---|
| **BarberGestor** | ✅ completo | tudo (booking, billing, multi-tenant, notif.) | serviços/colaboradores/caixa barber |
| **ClimaGestor** | 🟡 CRUD parcial | booking engine, multi-tenant, validação | domínio clima |
| **PetGestor** | [VISÃO] | booking, clientes, billing, notificações | vacinas, raças, banho&tosa |
| **AutoGestor** | [VISÃO] | booking, billing, estoque, OS | peças, ordens de serviço |
| **AgroGestor** | [VISÃO] | multi-tenant, eventos, relatórios | safra, insumos, talhões |
| **BeautyGestor** | [VISÃO] | booking, clientes, billing (≈ Barber) | procedimentos estéticos |
| **Barber Store / *-Store** | [VISÃO] | estoque, billing, clientes | catálogo, carrinho, pedidos |

## Tese estratégica
> Quanto mais o Core é exercitado por verticais reais (hoje Barber + Clima), maior o leverage: cada nova capability vira valor para todos os nichos. O gargalo não é o Core — é a **separação formal Core/Vertical** (boundary-map, ainda não feita; A-024) e a **fundação P1** ([[../production-readiness|production-readiness]]).

## Próxima ação estratégica
Fechar Camada 1 (fundação) antes de multiplicar verticais; depois `core-vs-vertical-boundary-map` + template de vertical. Detalhe em [[radar-nichos]] e [[motor-futurista-produto]].

## Links
- [[../capabilities-map|capabilities-map]] · [[radar-nichos]] · [[motor-futurista-produto]] · [[arquiteto-visao-global]]
