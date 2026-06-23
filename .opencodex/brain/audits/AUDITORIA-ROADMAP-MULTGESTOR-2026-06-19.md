# Auditoria Roadmap MultGestor — 2026-06-19

> **Base:** `state_version 13` · `ROADMAP-MESTRE-MULTGESTOR-2026.md` · `capabilities-map.md` · `project-state.md`
> **Modo:** READ-ONLY. Nenhum dado alterado, nenhum POST executado, nenhuma migration aplicada.
> **Propósito:** Confirmar estado atual, mapear capacidades reais vs documentadas, organizar próximas missões.

---

## 1. Resumo executivo

| Item | Estado |
|---|---|
| Backend | 🟢 saudável (Express 5, 16 controllers, 30 services, core reutilizável) |
| Frontend | 🟢 estrutura completa (33 páginas, booking flow completo, 22 arquivos booking) |
| Banco Supabase | 🟢 23 migrations, schema em sync |
| Backup/restore | 🟢 diário ativo, restore evidenciado; cópia externa ❌ |
| EventBus/outbox | 🟢 15 handlers, 11 eventos, `failed=0` |
| WhatsApp | 🟡 Meta API existe + credenciais, mas health reporta **mock** |
| Redis | 🟡 código dual-mode; produção usa fallback in-memory |
| RLS | 🟡 23 tabelas com policies; `companies`+`users` ❌ |
| CI/CD migrations | 🔴 `continue-on-error: true` |
| Testes | 🟡 51 arquivos, sem E2E |
| Governança `.opencodex` | 🟢 atualizada, coerente |
| Pronto para próxima missão? | sim — `ops/backup-external-copy` |

---

## 2. Onde estamos hoje

| Dimensão | Estado real | Evidência |
|---|---|---|
| **Backend Render** | 🟢 `/api/health/deep` → 200, DB conectado, Redis degradado | health check |
| **Frontend Vercel** | 🟢 build CI passa, URL: barbergestor.com.br | workflow |
| **Supabase** | 🟢 project `[PROJECT_REF]`, sa-east-1 | MCP |
| **Backup local** | 🟢 Task Scheduler `State=Ready`, dump 635KB diário, 7 dias retenção | last-status.json |
| **Backup externo** | ❌ ausente — single point of failure no HD | A-002 |
| **Restore** | 🟢 evidenciado via MCP (contagens match) | runbook backup-restore-check |
| **Scheduler** | 🟢 `MultGestor-Backup-Daily`, NextRunTime 02:00 | Get-ScheduledTask |
| **Outbox** | 🟢 `failed=0` pós data-fix (commit `642343a`) | MCP |
| **WhatsApp provider** | 🟡 Meta Cloud API infra existe + `.env` com credenciais reais; mas `WHATSAPP_PROVIDER=mock` é o default e health reporta `degraded` | server.js:278-290 |
| **Redis** | 🟡 `shared/core/cache/` → fallback in-memory quando `REDIS_URL` vazio; `.env` e `.env.production` sem Redis configurado | health reporta `degraded` |
| **RLS tabelas negócio** | 🟢 23/23 com policies `company_id` | rls_tenant_tables.sql |
| **RLS companies/users** | ❌ 0 policies — RLS habilitado mas inerte | base-schema.sql |
| **CI/CD migrations** | 🔴 `continue-on-error: true` | deploy.yml:36 |
| **Testes** | 🟡 51 arquivos (45 unit, 4 integration, 2 flow) | tests/ |
| **E2E** | ❌ ausente — GET booking validado manualmente | A-008/A-009 |
| **ClimaGestor** | 🟢 mais que scaffold — CRUD completo com 7 arquivos backend + frontend + testes | código |

---

## 3. Capacidades reais do sistema

### Core (infraestrutura fundamental)

| Capacidade | Status real | Onde |
|---|---|---|
| Multi-Tenant Engine | ✅ `company_id` em toda query | shared/tenant/ |
| RLS | 🟡 23/27 tabelas; companies+users sem policy | rls_tenant_tables.sql |
| EventBus in-memory | ✅ pub/sub com correlation ID | shared/core/events/ |
| Outbox durável | ✅ polling 1s, retry exponencial, idempotente | outbox-worker.js |
| Cache | 🟡 dual-mode; produção sem Redis = in-memory | cache-manager.js |
| Logger/Observabilidade | ✅ Pino + Sentry + Prometheus | shared/core/logger/ |
| Validation | ✅ Zod schemas + AppError hierarchy | shared/core/ |
| Rate Limiting | 🟡 Redis em dev/prod = in-memory volátil | rate-limit.middleware.js |

### Domínio (lógica compartilhável)

| Capacidade | Status real | Onde |
|---|---|---|
| Booking Engine | ✅ 19 funções puras, reusado por Barber + Clima | shared/capabilities/booking-engine/ |
| Billing/Planos | ✅ Kiwify + AbacatePay providers | shared/capabilities/billing/ |
| Appointment Reminder | ✅ job com idempotência | jobs/appointment-reminder-job.js |
| Trial Email | ✅ TrialEmailJob ativo | services/trial-emails.service.js |
| Token Encryption | ✅ AES-256-GCM | integrations/config/encryption.js |

### Verticais

| Vertical | Status | Evidência |
|---|---|---|
| BarberGestor | ✅ Completo — 16 controllers, 30 services, frontend completo | código |
| ClimaGestor | 🟢 CRUD completo — profissionais, serviços, appointments, availability, frontend, testes | 7 backend + 1 frontend + 1 test |

### Divergências capabilities-map vs código real

| Documentado como | Realidade | Correção necessária |
|---|---|---|
| WhatsApp ✅ Produção | 🟡 Meta API infra + credenciais existem, mas *default é mock*. Health reporta `degraded`. NÃO comprovado em produção. | Mudar para 🟡 |
| Redis ✅ Produção | 🟡 Código dual-mode existe, mas `REDIS_URL` vazio em `.env` e `.env.production`. Produção usa in-memory. Health reporta `degraded`. | Mudar para 🟡 |
| ClimaGestor 🟡 Scaffold | 🟢 CRUD completo (profissionais, serviços, appointments), middleware module-guard, frontend, testes | Mudar para 🟢 Parcial |

---

## 4. O que está pronto vs parcial vs mockado vs bloqueado vs visão

### ✅ Pronto para produção
- Login/cadastro/auth JWT com HttpOnly cookies
- Fluxo público de agendamento GET (booking-info + slots)
- Outbox durável com 15 handlers, `failed=0`
- Backup diário local (scheduler `State=Ready`)
- Restore validado via MCP
- XSS hardening fechado
- 51 testes (unit + integration)
- Auditoria base concluída

### 🟡 Parcial (funciona, mas com risco ou incompleto)
- **WhatsApp** — infra existe, credenciais reais no `.env`, mas produção roda mock. Decisão pendente.
- **Redis** — código existe para ambos os modos, mas produção sem Redis = rate limit volátil.
- **RLS companies/users** — 0 policies. Defesa em profundidade ausente nas tabelas-mãe.
- **Billing** — Kiwify/AbacatePay integrados, mas não testado E2E.
- **Frontend UX** — build CI passa, mas experiência real não validada em produção.
- **Email** — Resend configurado, mas entrega real ao cliente não auditada.
- **Painel do dono** — rotas existem (`/barber/*`), mas não validado como "produto utilizável".

### 🟡 Mockado (infra existe, mas não opera)
- **WhatsApp** — exatamente este caso. Meta Cloud API está codificada e com credenciais, mas o sistema opera em modo mock.
- **Redis** — poderia ser chamado de "não configurado em produção" em vez de mock.

### 🔴 Bloqueado
- **CI/CD migrations fail-fast** — bloqueado por OPS-SUPAVISOR (Supavisor sa-east-1 rejeita tenant) + secrets-rotation pausada.
- **Secrets rotation** — pausada por decisão humana (deferred).

### ⚪ Visão futura (não iniciado)
- PetGestor, AutoGestor, AgroGestor, MultAcademy, Barber Store
- Automation Engine, AI Operational Layer, N8N Bridge
- Multi-nicho template (`core-vs-vertical-boundary-map`)
- Observabilidade com alertas externos
- LGPD completa (exclusão de conta, consentimento, política de privacidade)
- MRR/churn/ativação medidos
- Onboarding self-service por nicho

---

## 5. O que falta para produção segura

Critérios obrigatórios (Roadmap Mestre §15 — Piloto Pago):

- [ ] Backup com cópia externa ativa e restore documentado (RPO/RTO) — **A-002**
- [ ] RLS em `companies` + `users` OU BYPASSRLS documentado — **A-001**
- [ ] Redis em produção OU risco in-memory aceito e documentado — **A-004**
- [ ] CI não faz deploy com migration falhada — **A-005**
- [ ] E2E mínimo do fluxo público verde em CI — **A-008/A-009**
- [ ] POST agendamento testado em produção (gated) — **A-021**
- [ ] Email transacional real confirmado
- [ ] WhatsApp: decisão formal tomada (real ou mock documentado) — **A-010**
- [ ] Fluxo trial → pago testado E2E — **A-022**
- [ ] Feature gate bloqueia tenant inadimplente
- [ ] Política de privacidade + consentimento mínimos (LGPD) — **A-023**
- [ ] Alerta externo se backup ou outbox falhar — **A-018**

---

## 6. O que falta para o sistema ser vendável

Além da produção segura:

- Painel do dono utilizável sem suporte
- Fluxo de onboarding de empresa + serviços + colaboradores + horários
- Booking público com mensagens de erro amigáveis (estados vazios, slug inválido)
- Notificações reais ao cliente (email + WhatsApp pelo menos um)
- Fluxo trial → assinatura → pagamento → ativação → bloqueio por inadimplência
- UX mobile funcional (booking público já tem componentes mobile)
- Suporte básico documentado

---

## 7. Próximas missões por prioridade

### P1 — Fundação segura (fechar antes de vender)

| Ordem | Missão | Status | Gate |
|---|---|---|---|
| 1 | `ops/backup-external-copy` | 🔵 PRONTA (next-task.md) | backup local OK |
| 2 | `security/rls-companies-users-policy` | ⏳ aguarda #1 | backup externo + decisão |
| 3 | `infra/redis-production-config` | ⏳ aguarda decisão | decisão custo |
| 4 | `cicd/migrations-fail-fast` | 🔴 bloqueado | OPS-SUPAVISOR + secrets |

### P2 — Produto vendável

| Ordem | Missão | Status | Gate |
|---|---|---|---|
| 5 | `e2e-public-booking-validation` (automated) | 🔵 pronto | ambiente teste |
| 6 | `booking-public-flow-hardening` | ⏳ aguarda #5 | E2E verde |
| 7 | `owner-dashboard-minimum` | 🔵 pronto | — |
| 8 | `email-real-production` | 🔵 pronto | DNS |
| 9 | `whatsapp-official-decision` | ⏳ decisão | corrigir capabilities-map |
| 10 | `billing-trial-to-paid-flow` | ⏳ aguarda fundação | fundação P1 |

### P3 — Melhoria estratégica

| Ordem | Missão | Status | Gate |
|---|---|---|---|
| 11 | `core-vs-vertical-boundary-map` | 🔵 pronto | risco zero |
| 12 | `infra/observability-alerts` | ⏳ aguarda #1 | backup externo |

---

## 8. Decisões pendentes

| # | Decisão | Impacto |
|---|---|---|
| 1 | RLS: criar policies formais OU documentar BYPASSRLS? | Bloqueia #2 |
| 2 | Redis: pagar no Render OU aceitar in-memory? | Bloqueia #3 |
| 3 | WhatsApp: Meta Cloud API real OU mock documentado? | Bloqueia #9 + corrigir capabilities-map |
| 4 | OutboxWorker: break vs continue no sale.created? | Bloqueia fase-c |
| 5 | ClimaGestor: investir como 2º vertical OU congelar? | Roadmap multi-nicho |

---

## 9. Veredito

```
VEREDITO ROADMAP 2026-06-19:

APROVADO PARA PRÓXIMA MISSÃO — COM DIVERGÊNCIAS A CORRIGIR.

O projeto tem fundação sólida: core multi-tenant, event-driven, booking engine
reutilizável, backup diário, restore validado, outbox com failed=0, 51 testes.

4 P1s abertos (backup externo, RLS companies/users, Redis produção,
migrations fail-fast). Nenhum P0.

2 divergências no capabilities-map:
  - WhatsApp: documentado como ✅ Produção, é 🟡 (mock ativo, infra existe)
  - Redis: documentado como ✅ Produção, é 🟡 (fallback in-memory ativo)
  
1 capacidade sub-documentada:
  - ClimaGestor: documentado como scaffold, é CRUD completo

PRÓXIMA MISSÃO OFICIAL: ops/backup-external-copy (P1, Camada 1).
Já em next-task.md com instrução humana criada.

RECOMENDAÇÃO: Fechar Camada 1 antes de investir em receita.
Corrigir capabilities-map antes de promover WhatsApp/Redis como produção.
```
