# Matriz de Evidências — MultGestor Core (pós-Gate 4)

**Data:** 2026-07-20 | **Gate 4:** Reconciliação aplicada

---

## Legenda

| Estado | Critério |
|--------|----------|
| CONSOLIDADO | Código + integração + teste + deploy + sem objeção |
| CONSOLIDADO_LOCALMENTE | Código + testes; sem confirmação produção |
| PARCIAL | Implementação existe mas incompleta |
| EM_EXPERIMENTO | Mock ou interface; sem uso real |
| DESCONHECIDO | Sem evidência suficiente |
| AUSENTE | Nenhum código encontrado |

---

## Matriz

| ID | Domínio | Capacidade | T3 declarou | Prova | Tipo | Ambiente | Gate 4 | Falta |
|----|---------|-----------|------------|-------|------|----------|--------|-------|
| C-04 | INFRA | Migrations | CONSOLIDADO | 37 SQL, runner, migrate:prod | CONFIG_PRODUCAO | Produção | **CONSOLIDADO** | — |
| C-05 | DEPLOY | CI/CD | CONSOLIDADO | ci.yml+deploy.yml | CI_CONFIRMADO | GitHub | **CONSOLIDADO** | — |
| C-06 | INFRA | Health checks | CONSOLIDADO | /api/health+deep | ENDPOINT | Deploy | **CONSOLIDADO** | — |
| C-10 | GOV | Outbox | CONSOLIDADO | started, 15 handlers | DEPLOY | Produção | **CONSOLIDADO** | — |
| C-01 | INFRA | Multi-tenancy RLS | CONSOLIDADO | 10 SQL RLS, middleware | INFERENCIA | Local/Test | **LOCALMENTE** | Cross-tenant test |
| C-02 | INFRA | Auth JWT+Refresh | CONSOLIDADO | auth.service, v030 | INFERENCIA | Local/Test | **LOCALMENTE** | Auth logs |
| C-03 | INFRA | 3 escopos auth | CONSOLIDADO | authScopes, 6 guards | INFERENCIA | Local/Test | **LOCALMENTE** | — |
| C-07 | GOV | Errors kernel | CONSOLIDADO | 10 tipos, middleware | TESTE_LOCAL | Local | **LOCALMENTE** | — |
| C-08 | GOV | Validation kernel | CONSOLIDADO | Zod, validateRequest | TESTE_LOCAL | Local | **LOCALMENTE** | — |
| C-09 | GOV | Logging kernel | CONSOLIDADO | Pino, request-logger | CODIGO | Local | **LOCALMENTE** | Prod logs |
| C-11 | GOV | Event bus | CONSOLIDADO | event-bus.js, contracts | TESTE_LOCAL | Local | **LOCALMENTE** | Consumers |
| C-12 | GOV | Plan gating | CONSOLIDADO | requirePlanFeature | CODIGO | Local | **LOCALMENTE** | — |
| C-13 | CORE | Billing engine | CONSOLIDADO | Registry, Kiwify+AbacatePay | ENDPOINT | Local | **LOCALMENTE** | Real tx |
| C-15 | CORE | Repository pattern | LOCAL | 10 repos, BaseRepo, UoW | TESTE_LOCAL | Local | **LOCALMENTE** | barber não usa |
| C-16 | BARBER | CRUD completo | CONSOLIDADO | 226 endpoints, 50 services | ENDPOINT | Local/CI | **LOCALMENTE** | Prod verify |
| C-18 | BARBER | Master admin | CONSOLIDADO | 44 endpoints | ENDPOINT | Local/CI | **LOCALMENTE** | — |
| C-20 | BARBER | Email | CONSOLIDADO | 3 providers | CODIGO | Local | **LOCALMENTE** | Send confirm |
| C-19 | INFRA | Sentry | CONSOLIDADO | @sentry/* | CODIGO | Local | **LOCALMENTE** | Dashboard |
| C-21 | BARBER | Premium UI | LOCAL | 32+ components | CODIGO | Local | **LOCALMENTE** | — |
| C-22 | BARBER | Landing page | LOCAL | 12 sections | CODIGO | Local | **LOCALMENTE** | — |
| C-23 | BARBER | Design system | LOCAL | Shell, tokens | CODIGO | Local | **LOCALMENTE** | — |
| C-24 | BARBER | Mobile | LOCAL | BottomNav, FAB | CODIGO | Local | **LOCALMENTE** | Tests |
| C-25 | BARBER | Onboarding | LOCAL | SetupWizard | CODIGO | Local | **LOCALMENTE** | — |
| C-26 | BARBER | Badges | LOCAL | BadgeSystem | CODIGO | Local | **LOCALMENTE** | — |
| C-27 | DEPLOY | Backup | LOCAL | ops/backup/ | CODIGO | Local | **LOCALMENTE** | — |
| C-17 | BARBER | WhatsApp | CONSOLIDADO | Mock+Real | CODIGO | Local | **PARCIAL** | Real send |
| C-14 | CORE | Booking completo | CONSOLIDADO | scheduling+routes | TESTE_LOCAL | Local | **PARCIAL** | VIEW=barber |
| C-28 | BARBER | God service | PARCIAL | facade 264 linhas | CODIGO | Local | **PARCIAL** | Controllers |
| C-29 | NICHO | ClimaGestor | PARCIAL | 3 tables, 10 endpoints | CODIGO | Backend | **PARCIAL** | Frontend |
| C-31 | FUTURO | Integration | PARCIAL | Framework | CODIGO | Local | **PARCIAL** | Providers |
| C-33 | INFRA | Rate limiting | PARCIAL | Middleware | CODIGO | Prod(degrad) | **PARCIAL** | Redis |
| C-34 | GOV | columnExists | PARCIAL | Cache em 1 | CODIGO | Prod(lento) | **PARCIAL** | Shared util |
| C-35 | GOV | Metrics | PARCIAL | Prometheus | CODIGO | Local | **PARCIAL** | Dashboard |
| C-36 | GOV | Testes backend | PARCIAL | 71 files | CI | CI | **PARCIAL** | Coverage |
| C-32 | INFRA | Redis | PARCIAL | Fallback no-op | CODIGO | Dev | **DESCONHECIDO** | Render check |
| C-30 | FUTURO | AI/LLM | EXPERIMENTO | MockProvider | CODIGO | Dev | **EM_EXPERIMENTO** | Real provider |
| C-37 | GOV | Testes frontend | AUSENTE | 2 files | — | — | **AUSENTE** | — |
| C-38 | FUTURO | Automation | AUSENTE | — | — | — | **AUSENTE** | — |
| C-39 | FUTURO | Omnichannel | AUSENTE | — | — | — | **AUSENTE** | — |
| C-40 | FUTURO | Novos nichos | AUSENTE | Clima scaffold | — | — | **AUSENTE** | — |

---

## Contagem

| Estado | Qtd |
|--------|-----|
| CONSOLIDADO | 4 |
| CONSOLIDADO_LOCALMENTE | 20 |
| PARCIAL | 9 |
| EM_EXPERIMENTO | 1 |
| DESCONHECIDO | 1 |
| AUSENTE | 4 |
| **Total** | **40** |
