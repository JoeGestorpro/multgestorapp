---
tipo: estrategia
area: produto
status: pronto
confianca: media
ultima_revisao: 2026-06-19
---

# 🎯 Niche Radar — ranking de nichos por fit com o Core

> **Método:** rubrica do [[global-vision-architect]] §7 (1–5 por dimensão). Risco/compliance entram invertidos.
> **Confiança:** média (fit/reuso = alta evidência via [[core-power-map]]; receita/mercado = estimativa).
> **Regra:** cada nicho diz qual capability do Core fortalece. Expansão internacional → [[country-readiness-matrix]].

## Ranking (score médio, 1–5)

| Nicho | Fit Core | Receita | Vel. MVP | Reuso | Risco⁻¹ | Compl.⁻¹ | Nac. | Intl. | Score | Classificação | Confiança |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **BarberGestor** (atual) | 5 | 4 | 5 | 5 | 5 | 4 | 5 | 4 | **4.6** | executar agora | alta |
| **BeautyGestor** (estética/salão) | 5 | 4 | 5 | 5 | 4 | 4 | 5 | 4 | **4.5** | colocar no roadmap | média |
| **PetGestor** (banho&tosa/vet) | 4 | 4 | 4 | 4 | 4 | 3 | 4 | 4 | **3.9** | estudar | média |
| **Barber/Beauty Store** (e-commerce) | 4 | 4 | 3 | 4 | 3 | 3 | 4 | 4 | **3.6** | estudar | média |
| **AutoGestor** (oficinas/OS) | 3 | 4 | 3 | 3 | 3 | 3 | 4 | 3 | **3.3** | incubar | baixa |
| **AgroGestor** (gestão agro) | 2 | 4 | 2 | 2 | 2 | 3 | 4 | 3 | **2.8** | incubar | baixa |
| **MultAcademy** (cursos/LMS) | 2 | 3 | 2 | 2 | 3 | 3 | 3 | 3 | **2.6** | descartar por enquanto | baixa |

## Leitura
- **BarberGestor**: já é o vertical de prova; foco = torná-lo vendável (fundação P1 + receita).
- **BeautyGestor**: maior alavancagem — quase idêntico ao Barber (booking + clientes + billing). Reaproveita o Core quase 1:1. **Melhor candidato a 2º vertical comercial** depois do Barber.
- **PetGestor**: agendamento + clientes + recorrência (vacina/banho) — bom fit, exige domínio novo (vacinas/raças).
- **Store (e-commerce)**: depende de [[../maps/multgestor-core/capabilities/estoque|estoque]] + carrinho; fortalece billing/estoque, mas é jornada nova (checkout).
- **Auto/Agro**: fit menor (OS/safra fogem do booking puro); incubar até boundary-map existir.

## Qual capability do Core cada nicho fortalece
- Beauty/Pet → **Booking Engine + Clientes + Notificações** (mesmo motor do Barber).
- Store → **Estoque + Billing + Clientes**.
- Auto → **Ordens de serviço + Estoque** (capability nova).
- Agro → **Multi-tenant + Relatórios + Eventos** (domínio distante de agenda).

## Gate
Nenhum nicho novo deve sair de "estudar/incubar" antes de: (1) fundação P1 fechada ([[../production-readiness|readiness]]); (2) `core-vs-vertical-boundary-map` publicado; (3) decisão humana registrada em [[strategic-decision-log]].

## Links
- [[core-power-map]] · [[product-futurist-engine]] · [[country-readiness-matrix]] · [[strategic-decision-log]]
