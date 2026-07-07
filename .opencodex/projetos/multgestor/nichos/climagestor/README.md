# 🌤️ ClimaGestor

> **Status:** 🟢 PARCIAL — Scaffold + agendamento
> **Relacionamentos:** [[nichos/README]] · [[maps/multgestor-core/nichos/climagestor]] · [[product/README]] · [[technical/README]]

---

## Arquitetura

ClimaGestor é o **segundo vertical** em desenvolvimento. Reusa o Core:
- Booking Engine (mesmo do BarberGestor)
- Multi-tenant Engine
- EventBus + Outbox

## Módulos

| Módulo | Status | Detalhe |
|---|---|---|
| Agenda | 🟢 Parcial | CRUD completo, disponibilidade |
| Clientes | 🟢 Parcial | Cadastro, histórico |
| Colaboradores | 🟢 Parcial | Profissionais |
| Serviços | 🟢 Parcial | Catálogo |
| Frontend | 🟢 Parcial | Testes existentes |

## Roadmap

- [ ] Completar integração com Core
- [ ] Fluxos específicos de climatização
- [ ] Testes de nicho
- [ ] Publicação

## Referências

- [[maps/multgestor-core/nichos/climagestor]] — Detalhamento no mapa vivo
- [[product/README]] — Product Brain
- [[technical/README]] — Technical Brain
- [[strategy/niche-radar]] — Ranking de nichos
