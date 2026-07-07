# 💈 BarberGestor

> **Status:** ✅ COMPLETO — Produção ativa
> **URL:** `barbergestor.com.br`
> **Relacionamentos:** [[nichos/README]] · [[maps/multgestor-core/nichos/barbergestor]] · [[product/README]] · [[technical/README]]

---

## Arquitetura

BarberGestor é o **vertical de prova** do MultGestor. Usa o Core compartilhado:
- Booking Engine (19 funções puras)
- Multi-tenant Engine
- Billing (AbacatePay + Kiwify)
- EventBus + Outbox
- WhatsApp (mock ativo)

## Módulos

| Módulo | Status | Detalhe |
|---|---|---|
| Agenda | ✅ Completo | Booking público, gestão de horários |
| Caixa | ✅ Completo | Vendas, comissões, múltiplos pagamentos |
| Clientes | ✅ Completo | Cadastro, histórico |
| Colaboradores | ✅ Completo | Perfis, escala, comissões |
| Serviços | ✅ Completo | Catálogo, preços, duração |
| Estoque | 🟡 Parcial | Controle básico |
| Relatórios | 🟡 Parcial | Básicos |
| Notificações | 🟡 Parcial | Lembrete ativo, WhatsApp mock |

## Status

- **Controllers:** 16
- **Services:** 30
- **Frontend:** 33 páginas
- **Booking público:** Online e funcional
- **Clientes reais:** Atendendo

## Roadmap

- [ ] WhatsApp real (D-003)
- [ ] UX polishing
- [ ] Recuperação de no-show
- [ ] CRM de retorno

## Referências

- [[maps/multgestor-core/nichos/barbergestor]] — Detalhamento no mapa vivo
- [[product/README]] — Product Brain
- [[technical/README]] — Technical Brain
- [[maps/multgestor-core/STATUS-GERAL]] — Status geral
