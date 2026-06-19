---
tipo: estrategia
area: mercado
status: pronto
confianca: media
ultima_revisao: 2026-06-19
---

# 🌎 Global Market Radar — mercados de referência

> **Confiança:** média (estrutura e critérios = alta; tamanhos de mercado = estimativa, exigem benchmark — ver [[global-benchmark-memory]]).
> **Regra:** nenhum mercado vira "executar" sem passar por [[country-readiness-matrix]] e [[compliance-intelligence]].

## Critérios para estudar cada país/região
1. **Idioma** — esforço de tradução vs base atual pt-BR.
2. **Moeda & pagamentos** — gateway local disponível? (Pix, Stripe, MB Way…)
3. **Fuso horário** — suporte e operação.
4. **Compliance** — regime de privacidade e e-commerce ([[compliance-intelligence]]).
5. **Fit com nicho** — densidade de barbearias/salões/pet etc.
6. **Concorrência madura** — há SaaS consolidado? (benchmark a fazer)
7. **Custo de aquisição & suporte** — idioma, fuso, canal.
8. **Barreira de entrada legal** — registro fiscal, fatura local.

## Mercados de referência

### 🇧🇷 Brasil — mercado-mãe
pt-BR · BRL · Pix/cartão · LGPD + Marco Civil + CDC. **Base atual.** Maior densidade conhecida do nicho barber/beauty. Classificação: **executar agora** (já é onde operamos). Confiança alta.

### 🇵🇹 Portugal — porta de entrada Europa
pt-PT (mesma língua, baixa fricção) · EUR · MB Way/cartão/SEPA · GDPR. **Melhor primeiro passo internacional** (idioma quase idêntico). Classificação: **estudar**. Confiança média.

### 🌎 América Latina (MX, AR, CO, CL)
es-419 (tradução) · multi-moeda · gateways locais variados · leis de privacidade heterogêneas (LGPD-like). Grande mercado de serviços. Classificação: **incubar** (tradução + multi-currency primeiro). Confiança baixa.

### 🇺🇸 Estados Unidos
en-US · USD · Stripe domina · sem lei federal de privacidade (CCPA/CPRA na CA + leis estaduais). Mercado enorme e competitivo (Booksy, Square Appointments, Vagaro). Classificação: **estudar** (alto potencial, alta concorrência). Confiança baixa.

### 🇨🇦 Canadá
en-CA + fr-CA (Québec, bilíngue obrigatório em alguns contextos) · CAD · Stripe · PIPEDA + Lei 25 (Québec). Classificação: **incubar**. Confiança baixa.

### 🇪🇺 União Europeia
multi-idioma · EUR (+ locais) · SEPA/Stripe · GDPR + AI Act + e-Privacy. Alta exigência regulatória. Classificação: **incubar** (após Portugal validar). Confiança baixa.

### 🇬🇧 Reino Unido
en-GB · GBP · Stripe · UK GDPR + DPA 2018. Mercado maduro de booking. Classificação: **estudar**. Confiança baixa.

### 🇦🇺🇳🇿 Austrália / Nova Zelândia
en-AU/NZ · AUD/NZD · Stripe · Privacy Act 1988 (AU) / Privacy Act 2020 (NZ). Fuso muito distante (suporte). Classificação: **incubar**. Confiança baixa.

## Sequência recomendada (hipótese, confiança média)
```
Brasil (consolidar) → Portugal (mesma língua, EU-lite) → LATAM (es) →
UK/EU (regulação madura) → US (escala/concorrência) → CA/AU/NZ
```

## Próxima ação
Antes de qualquer expansão: i18n base ([[internationalization-requirements]]) + 1 país piloto via [[country-readiness-matrix]]. Registrar aprendizados de concorrentes em [[global-benchmark-memory]].

## Links
- [[country-readiness-matrix]] · [[internationalization-requirements]] · [[compliance-intelligence]] · [[global-benchmark-memory]]
