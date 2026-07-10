---
tipo: estrategia
area: produto
status: pronto
confianca: media
ultima_revisao: 2026-06-19
---

# 🔮 Product Futurist Engine — capacidades → ideias futuras

> **Método:** cruzar capacidades **reais** do Core ([[mapa-forca-core]]) para gerar ideias. Cada ideia diz qual capability fortalece, recebe classificação ([[arquiteto-visao-global]] §8) e confiança.
> Absorve "future-opportunities" e "product-ideas" num só lugar (dedup do merge).

## Matriz capability × capability = ideia

| Combinação (capacidades reais) | Ideia | Fortalece | Classificação | Confiança |
|---|---|---|---|---|
| Agenda + Clientes + WhatsApp | **Lembrete + confirmação + recuperação de no-show** | Notificações, Booking | colocar no roadmap (após D-003 WhatsApp) | média |
| Agenda + Clientes + histórico | **CRM de retorno** (cliente sumido há X dias → campanha) | Clientes, EventBus | colocar no roadmap | média |
| Produto + Pagamento + Cliente | **Barber/Beauty Store** (loja, kit, upsell no checkout) | Estoque, Billing | estudar | média |
| Billing recorrente + Cliente | **Clube de assinatura** (corte mensal, plano VIP) | Billing | colocar no roadmap | média |
| Agenda + WhatsApp + IA (LLM) | **IA recepcionista** (agenda/responde via WhatsApp) | Integração, IA | estudar (passa por [[inteligencia-conformidade]]) | baixa |
| Eventos + Automação (Outbox) | **Workflows inteligentes** (gatilho → ação) | EventBus/Outbox | incubar | baixa |
| Histórico + IA | **Previsão/recomendação** (melhor horário, serviço provável, alerta de churn) | Relatórios, IA | incubar (compliance) | baixa |
| Vendas + Comissão + Relatórios | **Painel financeiro do dono** + metas | Financeiro | colocar no roadmap | média |
| Multi-tenant + Booking | **BeautyGestor / PetGestor** (novo vertical sobre o mesmo motor) | Core inteiro | estudar (após boundary-map) | média |

## Ideias concretas priorizadas (do merge: ex-`product-ideas`)
1. **Vendas/agendamento por WhatsApp** — fortalece Notificações + Booking. *Roadmap* (gated por D-003). Confiança média.
2. **CRM de retorno + recuperação de no-show** — fortalece Clientes + EventBus. *Roadmap*. Média.
3. **Clube de assinatura (barbearia/beleza)** — fortalece Billing recorrente. *Roadmap*. Média.
4. **Barber/Beauty Store dentro do vertical** — fortalece Estoque + Billing. *Estudar* (precisa carrinho/checkout). Média.
5. **IA recepcionista** — fortalece Integração + IA. *Estudar* — **obrigatório** passar por OWASP LLM Top 10 + (UE) AI Act ([[inteligencia-conformidade]]). Baixa.
6. **Expansão para Pet/Auto/Agro Store** — fortalece Core multi-vertical. *Incubar* (após `core-vs-vertical-boundary-map`). Baixa.

## Regras aplicadas (todas)
- Cada ideia nomeia a capability do Core que fortalece ✅
- Ideias com IA marcadas para [[inteligencia-conformidade]] ✅
- Cada ideia tem classificação + confiança ✅
- Nenhuma ideia é declarada "pronta" — Automation Engine / AI Layer continuam **[VISÃO]** no [[../capabilities-map|capabilities-map]] ✅

## Gate
Toda ideia "executar agora"/"roadmap" só avança via decisão humana registrada em [[registro-decisoes-estrategicas]] e (se operacional) encaminhada à [[../living-os/decisoes/decisoes-executivas|Decisões Executivas]]. **Fundação P1 primeiro.**

## Links
- [[mapa-forca-core]] · [[radar-nichos]] · [[inteligencia-conformidade]] · [[registro-decisoes-estrategicas]] · [[memoria-benchmark-global]]
