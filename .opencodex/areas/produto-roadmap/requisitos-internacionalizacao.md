---
tipo: estrategia
area: arquitetura
status: pronto
confianca: media
ultima_revisao: 2026-06-19
---

# 🌐 Internationalization Requirements — requisitos globais

> **Propósito:** definir o que o Core precisa para operar fora do pt-BR/BRL single-locale atual.
> **Confiança:** média (requisitos = alta; esforço de implementação = estimativa).
> **Estado atual:** produto é **pt-BR / BRL / America/Sao_Paulo (Cuiabá)** — i18n **não implementada**. Tudo abaixo é requisito [VISÃO], não estado.

## Campos por tenant (perfil de localização)
| Campo | Descrição | Exemplo |
|---|---|---|
| `locale` | idioma+região (BCP-47) | `pt-BR`, `pt-PT`, `es-419`, `en-US` |
| `currency` | ISO 4217 | `BRL`, `EUR`, `USD` |
| `timezone` | IANA | `America/Sao_Paulo`, `Europe/Lisbon` |
| `country_code` | ISO 3166-1 | `BR`, `PT`, `US` |
| `tax_profile` | regime fiscal | `BR-MEI`, `PT-IVA`, `US-sales-tax` |
| `payment_profile` | gateway + métodos | `pix+card`, `mbway+sepa`, `stripe-card` |
| `document_type` / `document_number` | doc fiscal | `CPF/CNPJ`, `NIF`, `EIN/SSN` |
| `phone_format` | E.164 + máscara local | `+55`, `+351`, `+1` |
| `address_format` | ordem/campos por país | CEP vs ZIP vs Postcode |

## Requisitos técnicos
1. **Tradução (i18n)** — externalizar strings (front + emails + WhatsApp); catálogo por `locale`; fallback pt-BR.
2. **Currency** — armazenar valores com moeda; formatação por locale; nunca assumir BRL.
3. **Timezone** — já existe por tenant no booking (`America/Cuiaba`); generalizar para todo cálculo de data; armazenar UTC, exibir local.
4. **Document/tax** — validação plugável por país (CPF/CNPJ hoje; NIF/EIN depois).
5. **Phone** — E.164 normalizado (impacta WhatsApp).
6. **Address** — schema flexível por país.
7. **Termos legais por país** — política de privacidade, termos de uso e consentimento por `country_code` (ver [[inteligencia-conformidade]]).

## Impacto no Core
- **Booking Engine** — timezone já é per-tenant ✅; falta locale de exibição.
- **Billing** — multi-currency + gateway por `payment_profile` (hoje Kiwify/AbacatePay = BR).
- **Notificações** — templates por locale; phone E.164.
- **Auth/cadastro** — document_type plugável.

## Faseamento sugerido (confiança média)
```
Fase 0: extrair strings + introduzir locale/currency/timezone no modelo (sem trocar default)
Fase 1: pt-PT + EUR (Portugal) — menor salto
Fase 2: es-419 + multi-currency (LATAM)
Fase 3: en + Stripe (UK/US)
```

## Gate
Nada disto entra em execução sem: fundação P1 fechada + decisão humana ([[registro-decisoes-estrategicas]]). i18n é pré-requisito de **toda** linha "Not Ready" da [[matriz-prontidao-paises]].

## Links
- [[matriz-prontidao-paises]] · [[inteligencia-conformidade]] · [[mapa-forca-core]]
