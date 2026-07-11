# Scorecard: Vendável

> **Atualizado:** 2026-06-19 · **Tendência:** 🟡 Estável (sem mudança comercial recente)
> **Fonte:** [[../04-vendavel|04 — Vendável]]

---

## Estágio 1 — Piloto Pago Controlado (13 critérios)

| # | Critério | Status | Notas |
|---|---|---|---|
| 1 | Onboarding de empresa (first-access) | 🟢 OK | Fluxo existe |
| 2 | Cadastro serviços + colaboradores + horários | 🟢 OK | Funcional |
| 3 | Trial ativo (TrialEmailJob) | 🟢 OK | Job rodando |
| 4 | Booking público GET | 🟢 OK | Validado E2E |
| 5 | Health check + monitoramento | 🟢 OK | |
| 6 | Sistema em produção real | 🟢 OK | barbergestor.com.br |
| 7 | Booking público POST | 🟡 Parcial | Gated, não testado E2E |
| 8 | Confirmação ao cliente | 🟡 Parcial | WhatsApp mock, email não validado |
| 9 | Painel do dono utilizável | 🟡 Parcial | Existe, não validado |
| 10 | Fluxo trial → pago E2E | ❌ | Não testado |
| 11 | Webhook pagamento ativa assinatura | ❌ | Não testado |
| 12 | Feature gate inadimplente | ❌ | Não existe |
| 13 | Política privacidade + consentimento | ❌ | Não existe |

**Total Piloto:** 🟢 6 · 🟡 3 · ❌ 4

---

## Estágio 2 — SaaS Self-Service (7 critérios adicionais)

| # | Critério | Status |
|---|---|---|
| 1 | Onboarding self-service sem suporte | ❌ |
| 2 | Planos e preços claros na landing | 🟡 Parcial |
| 3 | Cadastro com cartão (ou trial sem cartão) | ❌ |
| 4 | Cancelamento/upgrade/downgrade self-service | ❌ |
| 5 | Documentação de ajuda para o cliente | ❌ |
| 6 | Métricas MRR, churn, ativação | ❌ |
| 7 | Alertas de falha operacional | ❌ |

**Total Self-Service:** 🟢 0 · 🟡 1 · ❌ 6

---

## Estágio 3 — Escala Multi-Nicho (6 critérios adicionais)

| # | Critério | Status |
|---|---|---|
| 1 | core-vs-vertical-boundary-map publicado | ❌ |
| 2 | Template engine para novo vertical sem fork | ❌ |
| 3 | 2+ verticais em produção | ❌ |
| 4 | Nomenclatura sem hardcode barber | ❌ |
| 5 | Onboarding por nicho | ❌ |
| 6 | Custo por tenant previsível | ❌ |

**Total Multi-Nicho:** 🟢 0 · 🟡 0 · ❌ 6

---

## Tendência

| Mês | Piloto (OK/total) |
|---|---|
| 2026-06-19 | 6/13 |

Estágio 1 ainda não está pronto — estágios 2 e 3 são visão futura.
