# 04 — Vendável

> **Status:** VIVO · **Atualizado:** 2026-06-19
> **Propósito:** Responder se o sistema pode ser vendido, o que falta para cada estágio de maturidade comercial.

---

## O sistema pode ser vendido?

**Não.** O sistema está em operação, mas não está pronto para cobrar de cliente pagante.

## Estágio 1 — Piloto Pago Controlado

> Para um cliente pagante usar com suporte ao lado.

### ✅ Atendidos (6/13)

- [x] Fluxo de onboarding de empresa (first-access flow)
- [x] Cadastro de serviços + colaboradores + horários
- [x] Trial ativo e funcional (TrialEmailJob)
- [x] Booking público GET (booking-info + slots)
- [x] Health check / monitoramento básico
- [x] Sistema em produção real (barbergestor.com.br)

### 🟡 Parciais (3/13)

- [~] Booking público POST funcional (gated, não testado E2E)
- [~] Confirmação ao cliente (WhatsApp mock, email não validado)
- [~] Painel do dono existe (não validado como utilizável)

### ❌ Não atendidos (4/13)

- [ ] Fluxo trial → pago testado E2E
- [ ] Webhook de pagamento processa ativação
- [ ] Feature gate bloqueia tenant inadimplente
- [ ] Política de privacidade + consentimento mínimos

### Veredito Piloto

```
PILOTO PAGO: 🔴 NÃO PRONTO — 4/13 critérios não atendidos
Próximo passo: Fechar Camada 1 (Fundação Segura) → depois atacar fluxo financeiro.
```

---

## Estágio 2 — SaaS Self-Service

> Cliente se cadastra, configura e usa sem suporte humano.

### Status atual

```
SELF-SERVICE: 🔴 LONGE — 0/7 critérios adicionais atendidos
Pré-requisito: Piloto pago fechado primeiro.
```

### O que falta (além do piloto)
- Onboarding self-service sem suporte
- Planos e preços claros na landing
- Cadastro com cartão (ou trial sem cartão)
- Cancelamento/upgrade/downgrade self-service
- Documentação de ajuda
- Métricas de MRR, churn, ativação
- Alertas de falha operacional

---

## Estágio 3 — Escala Multi-Nicho

> Múltiplos verticais sobre o mesmo Core.

```
MULTI-NICHO: ⚪ VISÃO FUTURA
Pré-requisito: Self-service fechado + boundary map publicado.
```

### O que falta
- `core-vs-vertical-boundary-map` publicado
- Template engine para novo vertical sem fork
- Pelo menos 2 verticais reais em produção
- Nomenclatura sem hardcode `barber` (~90% barber-specific)
- Onboarding por nicho

---

## Resumo executivo

| Estágio | Status | Prazo estimado |
|---|---|---|
| Piloto pago controlado | 🔴 6/13 critérios | 30-60 dias (após fundação) |
| SaaS self-service | 🔴 0/7 adicionais | 90-180 dias |
| Escala multi-nicho | ⚪ visão | 180-365 dias |

**Recomendação:** Não vender até Camada 1 (Fundação Segura) fechada. Usar o tempo para corrigir P1s e validar fluxo financeiro E2E.
