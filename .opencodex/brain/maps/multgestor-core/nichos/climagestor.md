---
tipo: nicho
area: produto
status: parcial
progresso: 50
criticidade: media
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# ClimaGestor

## O que é
Segundo vertical do MultGestor — valida na prática a arquitetura multi-nicho reaproveitando o Core.

## Estado atual
**CRUD real/parcial** (reconciliado 2026-06-19 com a auditoria de roadmap e o [[capabilities-map]]): não é mero scaffold. Reusa o Booking Engine ([[agenda]]). Não está em produção real / não é produto vendido.

## O que já existe
Backend: `clima.routes.js`, `clima-core.service.js`, `clima.sql`, `clima_appointments.sql`, `clima-requests.schema.js` (profissionais, serviços, appointments, availability) + middleware module-guard. Frontend: `Clima.jsx`. Testes presentes.

## O que falta
Decisão estratégica: investir como 2º vertical real ou congelar (decisão pendente do roadmap). Onboarding por nicho; paridade com [[barbergestor]] onde fizer sentido.

## Riscos
Sem template de vertical, evolução do Clima ainda copia padrões do barber (dívida multi-nicho A-024). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[multgestor-core]] · [[multi-tenant]]
### Bloqueia
—
### Usa
[[agenda]] · [[banco-de-dados]]
### É usado por
clientes do nicho clima (futuro)

## Próximas ações
Decisão investir vs congelar (ver [[DEPENDENCIAS-MULTGESTOR]] / roadmap multi-nicho).

## Links
- [[barbergestor]] · [[multgestor-core]] · [[capabilities-map]]
