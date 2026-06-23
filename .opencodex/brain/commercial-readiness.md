---
status: draft
updated_at: 2026-06-19
based_on: state_version 13, AUDITORIA-ROADMAP-MULTGESTOR-2026-06-19
---

# Commercial Readiness — MultGestor

> O que é necessário para o MultGestor ser vendável como piloto pago.
> Separado em 3 estágios: piloto controlado → SaaS self-service → escala multi-nicho.

---

## Estágio 1 — Piloto Pago Controlado

> Para um cliente pagante usar com suporte ao lado.

### Produto

- [ ] Fluxo de onboarding de empresa (já existe: first-access flow) ✅
- [ ] Cadastro de serviços + colaboradores + horários funcionando ✅
- [ ] Booking público funcional (GET validado, POST gated) 🟡
- [ ] Confirmação chega ao cliente (email ou WhatsApp) 🟡
- [ ] Painel do dono utilizável (visão de agenda, clientes, financeiro) 🟡
- [ ] UX sem states vazios ou erros confusos ❌

### Financeiro

- [ ] Trial ativo e funcional ✅ (TrialEmailJob)
- [ ] Plano definido (Starter/Pro) 🟡 (tabelas existem)
- [ ] Webhook de pagamento processa ativação ❌ (não testado E2E)
- [ ] Feature gate bloqueia tenant inadimplente ❌
- [ ] Fluxo trial → pago testado E2E ❌

### Suporte

- [ ] Canal de suporte definido (email/WhatsApp) ❌
- [ ] Runbook de incidente (perda de banco, deploy ruim) ❌
- [ ] Política de privacidade + consentimento mínimos ❌

### Veredito piloto

**NÃO PRONTO.** 7 critérios de 13 não atendidos. Booking público funcional mas sem confirmação E2E. Sem fluxo financeiro testado.

**Próximo passo:** Fechar Camada 1 (Fundação Segura) primeiro, depois atacar fluxo trial → pago + notificações.

---

## Estágio 2 — SaaS Self-Service

> Cliente se cadastra, configura e usa sem suporte humano.

### Requisitos adicionais (além do estágio 1)

- [ ] Onboarding self-service sem suporte ❌
- [ ] Planos e preços claros na landing 🟡 (landing existe)
- [ ] Cadastro com cartão antes de usar (ou trial sem cartão) ❌
- [ ] Cancelamento/upgrade/downgrade self-service ❌
- [ ] Documentação de ajuda para o cliente ❌
- [ ] Métricas de MRR, churn, ativação ❌
- [ ] Alertas de falha (backup, outbox, pagamento) ❌

### Veredito self-service

**LONGE.** Piloto pago ainda não está pronto. Self-service exige maturidade operacional que hoje não existe.

---

## Estágio 3 — Escala Multi-Nicho

> Múltiplos verticais sobre o mesmo Core.

### Requisitos adicionais

- [ ] `core-vs-vertical-boundary-map` publicado ❌
- [ ] `vertical-template-engine` para novo vertical sem fork ❌
- [ ] Pelo menos 2 verticais reais em produção Barber + 1 ❌ (ClimaGestor existe mas não em produção real)
- [ ] Nomenclatura sem hardcode `barber` ❌ (~90% barber-specific)
- [ ] Onboarding por nicho ❌
- [ ] Custo por tenant previsível ❌

### Veredito multi-nicho

**VISÃO FUTURA.** O Core é forte (booking engine, billing, multi-tenant), mas a separação formal Core vs Vertical não existe. O código ainda é ~90% barber-hardcoded.

---

## Resumo

| Estágio | Status | Prazo estimado |
|---|---|---|
| Piloto pago controlado | 🟡 6/13 critérios | 30-60 dias (após fundação) |
| SaaS self-service | 🔴 0/7 critérios adicionais | 90-180 dias |
| Escala multi-nicho | ⚪ visão | 180-365 dias |

**Recomendação:** Não vender até Camada 1 fechada. Usar o tempo para corrigir os P1s e validar o fluxo financeiro E2E.
