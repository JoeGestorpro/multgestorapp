---
tipo: estrategia
area: mercado
status: pronto
confianca: media
ultima_revisao: 2026-06-19
---

# 🗺️ Country Readiness Matrix — prontidão de expansão

> **Regra (inviolável):** toda expansão internacional passa por esta matriz antes de virar roadmap/execução.
> **Status:** Ready · Not Ready · Incubation · Blocked. **Confiança:** média.
> Hoje o produto é **pt-BR/BRL single-locale** → nenhum país está "Ready" até a i18n base existir ([[internationalization-requirements]]).

## Matriz

| País/Região | Idioma | Moeda | Fuso | Pagamento | Compliance | Suporte | Fit nicho | Status |
|---|---|---|---|---|---|---|---|---|
| 🇧🇷 Brasil | pt-BR ✅ | BRL ✅ | UTC-3 ✅ | Pix/cartão ✅ | LGPD/CDC 🟡 | pt ✅ | alto ✅ | **Incubation→Ready** (falta só fundação P1 + LGPD pública) |
| 🇵🇹 Portugal | pt-PT 🟡 | EUR ❌ | UTC±0 🟡 | MB Way/SEPA ❌ | GDPR ❌ | pt ✅ | alto | **Not Ready** (moeda + GDPR + i18n) |
| 🌎 LATAM (es) | es-419 ❌ | multi ❌ | vários | gateways locais ❌ | heterogêneo ❌ | es ❌ | alto | **Incubation** |
| 🇺🇸 EUA | en-US ❌ | USD ❌ | múltiplos ❌ | Stripe ❌ | CCPA/CPRA ❌ | en ❌ | alto/competitivo | **Not Ready** |
| 🇨🇦 Canadá | en+fr-CA ❌ | CAD ❌ | múltiplos ❌ | Stripe ❌ | PIPEDA/Lei25 ❌ | en/fr ❌ | médio | **Incubation** |
| 🇪🇺 UE | multi ❌ | EUR ❌ | vários | SEPA/Stripe ❌ | GDPR+AI Act ❌ | multi ❌ | alto/regulado | **Blocked** (AI Act + i18n + GDPR) |
| 🇬🇧 Reino Unido | en-GB ❌ | GBP ❌ | UTC±0 🟡 | Stripe ❌ | UK GDPR ❌ | en ❌ | alto | **Not Ready** |
| 🇦🇺🇳🇿 AU/NZ | en ❌ | AUD/NZD ❌ | UTC+10/12 ❌ | Stripe ❌ | Privacy Acts ❌ | en (fuso) ❌ | médio | **Incubation** |

Legenda: ✅ pronto · 🟡 parcial · ❌ ausente.

## Critérios de cada status
- **Ready** — idioma, moeda, pagamento, compliance e suporte todos ✅; pode receber cliente real.
- **Not Ready** — fit existe, mas falta capacidade técnica/legal concreta (i18n, moeda, gateway, privacidade).
- **Incubation** — potencial mapeado; manter vivo, estudar concorrência/benchmark; não investir build.
- **Blocked** — barreira dura (ex.: AI Act exige conformidade antes de operar IA na UE).

## Pré-condições globais (valem para qualquer país ≠ Brasil)
1. i18n base implementada ([[internationalization-requirements]]).
2. Multi-currency + gateway local.
3. Regime de privacidade do país coberto ([[compliance-intelligence]]).
4. Suporte no idioma/fuso.
5. Decisão humana registrada em [[strategic-decision-log]].

## Recomendação atual
Foco em **Brasil** (levar de Incubation→Ready fechando fundação P1 + LGPD pública). **Portugal** é o próximo estudo natural (mesma língua), mas exige EUR + GDPR + i18n. Confiança média.

## Links
- [[global-market-radar]] · [[internationalization-requirements]] · [[compliance-intelligence]]
