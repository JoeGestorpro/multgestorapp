# Descobertas de Produto — MultGestor

> **Status:** VIVO
> **Atualizado:** 2026-06-24
> **Relacionamentos:** [[product/hipoteses]] · [[product/feedbacks]] · [[product/prds/README]]

---

## Descobertas Registradas

### D-001 — Booking Público é feature crítica
- **Data:** 2026-06-18
- **Descoberta:** Validação E2E do booking público revelou que chave `settings` (não `bookingSettings`) e `serviceId` obrigatório para slots são barreiras de usabilidade.
- **Impacto:** Correção de nomenclatura necessária antes de venda.
- **Fonte:** `e2e-public-booking-validation`

### D-002 — 90% do código é barber-specific
- **Data:** 2026-06-19
- **Descoberta:** Apesar da arquitetura multi-tenant, ~90% do código ainda referencia barber diretamente.
- **Impacto:** Boundary map core-vs-vertical é pré-requisito para segundo nicho.
- **Fonte:** Auditoria roadmap 2026-06-19

### D-003 — Cliente prefere WhatsApp a email
- **Data:** 2026-06-15
- **Descoberta:** Lembrete por email tem baixa efetividade. Clientes respondem mais a WhatsApp.
- **Impacto:** Ativar Meta Cloud API (hoje mock) é prioridade para venda.
- **Fonte:** Observação operacional

### D-004 — No-show é a maior dor do barbeiro
- **Data:** 2026-06-19
- **Descoberta:** Entrevistas com barbeiros confirmam que 20-30% de no-show é o principal problema.
- **Impacto:** Confirmação automática + recuperação são features de retenção.
- **Fonte:** Pesquisa qualitativa

## Referências

- [[product/hipoteses]] — Hipóteses a validar
- [[product/feedbacks]] — Feedbacks recebidos
- [[strategy/product-futurist-engine]] — Ideias futuras
