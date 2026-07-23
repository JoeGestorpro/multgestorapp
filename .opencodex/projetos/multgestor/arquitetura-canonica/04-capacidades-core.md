# GATE 4 — Capacidades do Core

> **Missão 1 — Arquitetura Canônica do Core MultGestor**
> **Baseline:** `ba55065` · **Data:** 2026-07-20
> **Fonte base:** `capacidades.md` (matriz Gate 4) · **Revalidação:** contra código, migrations, testes, CI/CD

## 1. Resumo da Revalidação

| Resultado | Quantidade |
|-----------|-----------|
| ✅ Estado confirmado | 25 |
| ⚠️ Estado alterado (reclassificado) | 10 |
| 🔴 Conflito com evidência | 5 |
| **Total** | **40** |

---

## 2. Capacidades Revalidadas

### 2.1 Core — Infraestrutura Fundamental

| ID | Nome | Estado Missão 0 | Estado Missão 1 | Evidência | Core/Nicho |
|----|------|----------------|----------------|-----------|-----------|
| C-01 | Multi-tenancy RLS | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | 40+ tabelas com RLS, dual pool, GUC transaction-local, teste tenant-isolation-rls.test.js | CORE |
| C-02 | Auth JWT + Refresh Token | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | auth.service.js, migration v030, refresh-token-rotation.test.js | CORE |
| C-03 | 3 escopos de autenticação | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | authScopes, 6 guards em auth.middleware.js, roles.js | CORE |
| C-04 | Migrations versionadas | ⚠️ REMOTAMENTE | ✅ IMPLEMENTADO_LOCALMENTE | 8 versões (024-031) + runner + schema_migrations table | CORE |
| C-06 | Health checks | ⚠️ REMOTAMENTE | ✅ IMPLEMENTADO_E_VALIDADO_EM_PRODUCAO | /api/health + /api/health/deep (7 checks) | CORE |
| C-19 | Sentry (error tracking) | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | @sentry/node, init em server.js, middleware, sentry.js | CORE |
| C-32 | Redis / cache distribuído | ❌ NÃO_APLICAVEL | ⚠️ IMPLEMENTADO_PARCIALMENTE | cache-manager.js com Redis + fallback; **Redis não configurado em produção** | CORE |
| C-33 | Rate limiting | ⚠️ PARCIAL/REMOTAMENTE | ⚠️ IMPLEMENTADO_PARCIALMENTE | rate-limit.middleware.js, 3 perfis; **Redis ausente → fallback in-memory** | CORE |

### 2.2 Core — Shared Kernel (Governança)

| ID | Nome | Estado Missão 0 | Estado Missão 1 | Evidência | Core/Nicho |
|----|------|----------------|----------------|-----------|-----------|
| C-07 | Error kernel (AppError) | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | 10 tipos de erro, error-handler.middleware.js | CORE |
| C-08 | Validation kernel (Zod) | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | Zod schemas + validateRequest middleware | CORE |
| C-09 | Logging kernel (Pino) | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | Pino logger + request-logger middleware | CORE |
| C-10 | Outbox (eventos duráveis) | ⚠️ CONSOLIDADO/REMOTAMENTE | ✅ IMPLEMENTADO_LOCALMENTE | outbox-worker.js, 15 handlers, polling SQL, retry exponencial | CORE |
| C-11 | Event bus (in-memory) | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | event-bus.js (EventEmitter), contracts.js, consumers | CORE |
| C-12 | Plan gating / feature guards | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | requirePlanFeature, planFeatures.js (0 barber occurrences) | CORE |
| C-34 | columnExists (shared util) | ⚠️ PARCIAL/REMOTAMENTE | ⚠️ IMPLEMENTADO_PARCIALMENTE | Util compartilhado; utilizado em 11+ queries por request | CORE |
| C-35 | Métricas / dashboard | ⚠️ PARCIAL/REMOTAMENTE | ⚠️ IMPLEMENTADO_PARCIALMENTE | Prometheus counters + GET /metrics; **sem dashboard de métricas** | CORE |
| C-36 | Testes automatizados (backend) | ⚠️ PARCIAL/REMOTAMENTE | ⚠️ IMPLEMENTADO_PARCIALMENTE | 70+ unit tests, 15+ integration tests; **cobertura insuficiente** | CORE |

### 2.3 Core — Domínio Compartilhável

| ID | Nome | Estado Missão 0 | Estado Missão 1 | Evidência | Core/Nicho |
|----|------|----------------|----------------|-----------|-----------|
| C-13 | Billing engine (assinaturas) | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | Registry + KiwifyProvider + AbacatePayProvider | CORE |
| C-14 | Booking engine (completo) | ⚠️ PARCIAL/REMOTAMENTE | ⚠️ IMPLEMENTADO_PARCIALMENTE | scheduling-utils puro em shared/; **services acoplados ao BarberGestor** (59+32 barber_) | CORE (🔴 ADR-007 pendente) |
| C-15 | Repository pattern | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | 9 repos, BaseRepository.js, UnitOfWork | CORE |

### 2.4 BarberGestor (Vertical 1)

| ID | Nome | Estado Missão 0 | Estado Missão 1 | Evidência | Core/Nicho |
|----|------|----------------|----------------|-----------|-----------|
| C-16 | CRUD completo (226 endpoints) | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_E_VALIDADO_EM_PRODUCAO | 50 services, 226 endpoints, múltiplos controllers | NICHO |
| C-17 | WhatsApp | ⚠️ PARCIAL/REMOTAMENTE | ⚠️ IMPLEMENTADO_PARCIALMENTE | Mock + Meta Cloud API; **provider mock ativo, real pendente** | NICHO |
| C-18 | Master admin (44 endpoints) | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | master.routes.js, master.controller.js | CORE |
| C-20 | Email (3 providers) | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | Resend + SMTP + Mock, email.service.js | CORE |
| C-21 | Premium UI (32+ componentes) | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | design-system/, features/barber/, pages/ | NICHO |
| C-22 | Landing page (12 seções) | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | barbergestor/pages + booking/pages | NICHO |
| C-23 | Design system (shell, tokens) | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | ds-* components, CSS tokens, migration em andamento | CORE (⚠️ UI genérico) |
| C-24 | Mobile (BottomNav, FAB) | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | components/mobile/ (BottomNav, BottomSheet) | NICHO |
| C-25 | Onboarding (SetupWizard) | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | components/onboarding/SetupWizard | NICHO |
| C-26 | Badge system | ✅ CONSOLIDADO_LOCALMENTE | ✅ IMPLEMENTADO_LOCALMENTE | components/badges/ | NICHO |
| C-28 | God service (barber.service.js) | ⚠️ PARCIAL/REMOTAMENTE | ⚠️ IMPLEMENTADO_PARCIALMENTE | ~6500 linhas, decomposição parcial para services específicos | NICHO |

### 2.5 ClimaGestor (Vertical 2)

| ID | Nome | Estado Missão 0 | Estado Missão 1 | Evidência | Core/Nicho |
|----|------|----------------|----------------|-----------|-----------|
| C-29 | ClimaGestor (scaffold) | ⚠️ PARCIAL/REMOTAMENTE | ⚠️ DOCUMENTADO_MAS_NAO_COMPROVADO | Backend ~50% (1 service, 1 controller, rotas); frontend ~1% | NICHO |

### 2.6 Integração e Deploy

| ID | Nome | Estado Missão 0 | Estado Missão 1 | Evidência | Core/Nicho |
|----|------|----------------|----------------|-----------|-----------|
| C-05 | CI/CD pipeline | ⚠️ CONSOLIDADO/REMOTAMENTE | ✅ IMPLEMENTADO_E_VALIDADO_EM_PRODUCAO | ci.yml (3 jobs), deploy.yml (Render+Vercel) | CORE |
| C-27 | Backup system | ✅ CONSOLIDADO_LOCALMENTE | ⚠️ DOCUMENTADO_MAS_NAO_COMPROVADO | scripts/backup-restore-check.js; **sem evidência de execução regular** | CORE |
| C-31 | Integration Layer | ⚠️ PARCIAL/REMOTAMENTE | ⚠️ IMPLEMENTADO_PARCIALMENTE | integration-manager.js, consumers/, providers/; **apenas WhatsApp ativo** | CORE |

### 2.7 Futuro / Ausente

| ID | Nome | Estado Missão 0 | Estado Missão 1 | Evidência | Core/Nicho |
|----|------|----------------|----------------|-----------|-----------|
| C-30 | AI / LLM Provider | ⚠️ EM_EXPERIMENTO/REMOTAMENTE | ⚠️ IMPLEMENTADO_PARCIALMENTE | LlmService, 3 providers (Nvidia, OpenRouter, Mock), wrappers; **apenas MockProvider testado** | CORE |
| C-37 | Testes frontend | ❌ AUSENTE | ❌ PLANEJADO | 2 arquivos de teste apenas; sem cobertura significativa | CORE |
| C-38 | Automation Engine | ❌ AUSENTE | ❌ PLANEJADO | Nenhum código encontrado | FORA_DO_CORE |
| C-39 | Omnichannel Layer | ❌ AUSENTE | ❌ PLANEJADO | Nenhum código encontrado | FORA_DO_CORE |
| C-40 | Novos nichos (Odonto, Pet, etc.) | ❌ AUSENTE | ❌ PLANEJADO | Apenas scaffold ClimaGestor | FORA_DO_CORE |

---

## 3. Reclassificações (Missão 0 → Missão 1)

| Capacidade | Mudança | Razão |
|-----------|---------|-------|
| C-04 Migrations | REMOTAMENTE → IMPLEMENTADO_LOCALMENTE | Runner + 36 SQL + schema_migrations comprovam execução local |
| C-06 Health checks | REMOTAMENTE → IMPLEMENTADO_EM_PRODUCAO | Código + teste + produção comprovados |
| C-32 Redis | NÃO_APLICAVEL → PARCIAL | Código existe e é usado (fallback in-memory); Redis não configurado |
| C-10 Outbox | REMOTAMENTE → IMPLEMENTADO_LOCALMENTE | Código completo no repositório |
| C-05 CI/CD | REMOTAMENTE → IMPLEMENTADO_EM_PRODUCAO | GitHub Actions + Render + Vercel em operação |
| C-27 Backup | LOCALMENTE → NÃO_COMPROVADO | Script existe mas sem evidência de execução regular |
| C-13 Billing | LOCALMENTE → CONFIRMADO | Registry + 2 providers comprovados |
| C-23 Design System | LOCALMENTE → CORE (reclassificado) | UI genérico compartilhável entre nichos |
| C-30 AI/LLM | EM_EXPERIMENTO → PARCIAL | Framework completo, apenas Mock Provider testado |

---

## 4. Fronteira Core × Nicho (preliminar)

| Domínio | Capacidades | Classificação |
|---------|------------|---------------|
| Multi-tenancy | C-01 | CORE_OBRIGATORIO |
| Auth/Identidade | C-02, C-03 | CORE_OBRIGATORIO |
| Migrations | C-04 | CORE_OBRIGATORIO |
| CI/CD | C-05 | CORE_OBRIGATORIO |
| Health | C-06 | CORE_OBRIGATORIO |
| Error/Validation/Logging | C-07, C-08, C-09 | CORE_OBRIGATORIO |
| Outbox/Event Bus | C-10, C-11 | CORE_OBRIGATORIO |
| Plan/Feature Gating | C-12 | CORE_OBRIGATORIO |
| Billing | C-13 | CORE_OBRIGATORIO |
| Booking Engine (scheduling-utils) | C-14 | CORE_OPCIONAL 🔴 |
| Repository/UoW | C-15 | CORE_OBRIGATORIO |
| Barber CRUD | C-16, C-21, C-22, C-24, C-25, C-26, C-28 | EXCLUSIVO_DO_NICHO |
| WhatsApp | C-17 | EXTENSAO_DE_NICHO |
| Master Admin | C-18 | CORE_OBRIGATORIO |
| Email | C-20 | CORE_OBRIGATORIO |
| Design System | C-23 | CORE_OPCIONAL |
| ClimaGestor | C-29 | EXCLUSIVO_DO_NICHO |
| Backup | C-27 | CORE_OBRIGATORIO |
| Integration Layer | C-31 | CORE_OPCIONAL |
| AI/LLM | C-30 | CORE_OPCIONAL |
| Testes | C-36, C-37 | CORE_OBRIGATORIO |
| Métricas | C-35 | CORE_OPCIONAL |
| Cache/Redis | C-32, C-33 | CORE_OBRIGATORIO |
| Futuro | C-38, C-39, C-40 | FORA_DO_CORE |

---

## 5. Conflitos com Documentação Anterior

| Documento | Afirmava | Evidência Mostra |
|-----------|---------|-----------------|
| `capacidades.md` (D-02) | RLS inerte em runtime | RLS **ativa** desde 02c5396 (2026-07-02) |
| `capacidades.md` (D-03) | RLS 23/27 tabelas | 40+ tabelas com policy |
| `capacidades.md` (D-04) | Gating vocabulário barber | 0 ocorrências — chaves genéricas |
| `capacidades.md` (D-08) | Redis em produção | Redis não configurado |
| `docs/core/runtime-map.md` | Sem refresh token | Implementado desde migration v030 |

---

## 6. POST-GATE 4

| Verificação | Status |
|-------------|--------|
| 40 capacidades revalidadas | ✅ |
| Estado por capacidade | ✅ |
| Evidência por capacidade | ✅ |
| Fronteira Core × Nicho (preliminar) | ✅ |
| Conflitos documentados | ✅ 5 conflitos |
| Reclassificações | ✅ 10 alterações |
| Nenhum arquivo operacional alterado | ✅ |
