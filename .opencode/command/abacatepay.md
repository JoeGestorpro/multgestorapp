---
description: Adicionar AbacatePay como segundo PaymentProvider da Billing Capability
---

Carregar e executar o runbook em `docs/runbooks/abacatepay-provider.md` — Adicionar AbacatePay como segundo PaymentProvider da Billing Capability.

Regras críticas:
- **HMAC usa chave PÚBLICA hardcoded** (constante fixa no provider), NÃO shared secret
- **Encoding é BASE64**, não hex
- **Duas camadas** em `verifySignature()`: URL secret (`req.query.webhookSecret`) + HMAC do raw body
- `ABACATEPAY_WEBHOOK_SECRET` é token de URL (comparação direta), NÃO chave HMAC
- ZERO mudança em billing-manager, consumer, registry, payment-provider, kiwify ou read-model
- `contracts.js` apenas ADIÇÃO de cases (nunca remover/alterar existentes)
- `subscription.trial_started` sem equivalente direto — PARE e reporte se aparecer

Seguir fases: Fase 0 → Fase A → Fase B → Fase C. PARE em cada checkpoint.
