---
tipo: snapshot
projeto: MultGestor
versao_arquitetural: v23
data: 2026-07-23
atualizado_por: KNOWLEDGE-001
regra: "Documento de UMA PÁGINA. Primeiro doc que qualquer IA/humano lê ao entrar no projeto. Atualizado após cada missão grande."
---

# 📸 PROJECT SNAPSHOT — MultGestor

> **Leia isto primeiro.** Uma página com o estado real do projeto hoje. Detalhe em [[02-ESTADO-REAL-DO-PROJETO]]; arquitetura em [[projetos/multgestor/arquitetura-canonica/08-ARQUITETURA-CANONICA-CORE-MULTGESTOR]]; sequência em [[projetos/multgestor/roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR|Mapa Mestre]].

## O que é
Plataforma SaaS multi-tenant. **Core reutilizável** + **nichos**. Nicho piloto em produção: **BarberGestor** (agenda, vendas, caixa, comissões, colaboradores, relatórios, agendamento online). Segundo nicho: ClimaGestor (scaffold).

**Stack:** Express 5 + PostgreSQL 16 (Supabase, `pg`) + Redis (fallback in-memory) · React 19 + Vite (SPA) · Deploy Render (back) + Vercel (front).

## Fundação (Core) — sólida
```
Governança / Knowledge OS   ✅   Constitution + Atlas + rules
CI (GitHub Actions)         ✅   unit + integração (Postgres efêmero) + lint
Deploy                      ✅   Render (back) + Vercel (front), gated por CI
Migrations                  ✅   automáticas, bloqueantes, estritas, idempotentes (OPS-MIGRATIONS-03D)
Banco / Multi-tenant / RLS  ✅   RLS runtime ativo (role NOBYPASSRLS); público de booking contextualizado (TENANT-003A)
Backend                     ✅   modular, outbox/eventos, rate limiting, billing pluggável
Segurança de rota           ✅   R-003: webhooks públicos com controle de abuso (2026-07-23)
```

## Produto (BarberGestor) — funcional, falta fechar comercial
```
Agenda / Clientes           🟡   completo em código; produção não medida
Financeiro / Caixa          🟡   completo em código
Pagamentos / Entitlement    🟡   código pronto + gating genérico; falta config externa (Kiwify) → NÃO vendável ainda
WhatsApp                    🟡   provider real existe; em produção está MOCK
IA operacional              🔴   parcial (LlmService com budget/circuit); sem catálogo de tools gated
```

## Bloqueios reais (externos, não código)
```
Supabase MCP      → sem acesso (Unauthorized) → impede inventário de RLS em produção
Billing (Kiwify)  → configuração externa + secrets → impede ativar cobrança real
TLS do banco      → cert não validado (SEC-DATABASE-TLS-001, aberto)
```

## Próxima prioridade ESTRATÉGICA
> **Transformar o BarberGestor em produto vendável** — fechar o circuito comercial (ativação de billing em produção).

## Próxima missão EXECUTÁVEL
> A de maior rank **desbloqueada** no backlog (matriz [[projetos/multgestor/matriz-consolidacao-core|ANEXO F]]). Os itens de topo dependentes de acesso externo (RLS-prod, billing) estão bloqueados; escolher o próximo item código-side desbloqueado.

## Últimas missões grandes (julho/2026)
| Missão | Estado |
|---|---|
| OPS-MIGRATIONS-03D | ✅ migrations de produção automáticas e bloqueantes |
| Booking Engine (ADR-007/008/009) | ✅ rebaixado a `services/barber/` (não promovido ao Core) |
| TENANT-003A | ✅ rotas públicas de booking com tenant/RLS |
| R-003-WEBHOOKS | ✅ webhooks públicos com controle de abuso (em produção, `7a313fd`) |
| Knowledge OS / Atlas / Constitution | ✅ criados |
| KNOWLEDGE-001 | 🔄 esta missão — consolidação documental |

## Links canônicos
- Estado detalhado: [[02-ESTADO-REAL-DO-PROJETO]]
- Arquitetura: [[projetos/multgestor/arquitetura-canonica/00-LEIA-PRIMEIRO]]
- Matriz de capacidades + backlog: [[projetos/multgestor/matriz-consolidacao-core]]
- Estado operacional (máquina): [[projetos/multgestor/status-atual]]
- Governança: [[brain/constitution]] · [[ATLAS]]
