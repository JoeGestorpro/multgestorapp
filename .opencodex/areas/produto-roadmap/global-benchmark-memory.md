---
tipo: estrategia
area: mercado
status: pronto
confianca: media
ultima_revisao: 2026-06-19
---

# 🧭 Global Benchmark Memory — aprendizados externos

> **Propósito:** memória permanente de aprendizados de fora (concorrentes, mercados, padrões). Também serve como `research-memory` (dedup do merge).
> **Regra:** todo registro tem data, origem, aprendizado, impacto, decisão sugerida e confiança. Aprendizado sem origem verificável → confiança **baixa** + marcado como hipótese.

## Como usar
Sempre que o agente estudar um concorrente/mercado, registra aqui uma linha. O `strategic-decision-log` referencia estes aprendizados.

## Registros

| Data | Origem | Aprendizado | Impacto no MultGestor | Decisão sugerida | Confiança |
|---|---|---|---|---|---|
| 2026-06-19 | Conhecimento de domínio (SaaS de booking: Booksy, Square Appointments, Vagaro, Fresha) | Mercado de agendamento beauty/barber é **maduro e competitivo** em US/UK/EU; diferenciação vem de WhatsApp-first + preço local + nicho | Reforça foco BR/LATAM (WhatsApp + Pix) antes de US | Priorizar BR/Portugal; US só com diferencial claro | baixa (hipótese, sem benchmark formal) |
| 2026-06-19 | Padrão de mercado (assinatura em serviços) | "Clube de assinatura" (corte mensal) cresce em barbearias; aumenta LTV e previsibilidade | Fortalece capability **Billing recorrente** | Roadmap: clube de assinatura | média |
| 2026-06-19 | Padrão regulatório (UE AI Act, 2024+) | IA voltada a consumidor na UE tem obrigações por nível de risco | Operar IA na UE é **Blocked** até avaliação | Não lançar IA na UE sem revisão jurídica | média |

> ⚠️ Tamanhos de mercado e participação de concorrentes **não** estão validados — exigem pesquisa formal antes de virar decisão de alta confiança. Não citar como fato.

## Lacunas de pesquisa (a preencher)
- Densidade real do nicho barber/beauty por país.
- Gateways locais e taxas (MB Way, Stripe, locais LATAM).
- Concorrentes WhatsApp-first no Brasil.
- Custo de conformidade GDPR para SaaS pequeno em Portugal.

## Links
- [[global-market-radar]] · [[niche-radar]] · [[strategic-decision-log]]
