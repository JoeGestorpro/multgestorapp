# Auditoria Completa MultGestor v2 — 2026-06-18

> **Executada por:** Claude Code (Sonnet 4.6)  
> **Data:** 2026-06-18 (UTC-4 Cuiabá)  
> **Branch auditada:** `ops/backup-restore-check` (6 commits à frente de `main`)  
> **Modo:** READ-ONLY. Nenhum dado alterado, nenhum POST executado, nenhuma migration aplicada.

---

## 1. Resumo executivo

| Item | Estado |
| --- | --- |
| Backend (Render) | **saudável** — deep health 200, DB ok, Redis degradado |
| Frontend (Vercel) | **parcial** — build CI passa, UX não testada em produção |
| Banco Supabase | **saudável** — schema em sync, dados consistentes |
| Produção Render/Vercel | **saudável** — deploy pipeline funcional |
| Segurança | **atenção** — CSP desativado, RLS lacunas, companies/users sem policy |
| Backup/restore | **validado** — dump diário ativo, restore evidenciado; cópia cloud ausente |
| Testes | **frágeis** — unit+integration OK; sem E2E, sem cobertura do fluxo público |
| Governança `.opencodex` | **atualizada** — coerente com estado real pós-sessão |
| Pronto para próxima missão? | **sim com ressalvas** — ops/reconcile pode avançar; ver lista P1 |

---

## 2. Identidade do projeto

| Atributo | Valor |
| --- | --- |
| Nome | MultGestor v2 |
| Repositório | github.com/JoeGestorpro/multgestorapp |
| Branch principal | `main` (último commit mergeado: `21317cd`) |
| Branch atual | `ops/backup-restore-check` (**não pushed ao remote**) |
| PRs abertos | Não verificado via CLI (não bloqueador) |

**Branches remotas ativas:** main · chore/brain-queue-cleanup · chore/second-brain-v3 · feat/frontend-foundation-layer · fix/xss-register-hardening-clean · principal

**Branches locais não remotas (relevantes):** ops/backup-restore-check · backup/principal-before-commit3 · backup/principal-before-commit6 · fase-1/estabilizacao · fase1/* · fase2/* · security/secrets-rotation

**Ambientes:**

| Ambiente | URL / Local | Estado |
| --- | --- | --- |
| Backend Render | https://[BACKEND_URL] | ✅ healthy |
| Frontend Vercel | https://barbergestor.com.br / https://multgestorapp.com.br | ✅ presumido (build CI passa) |
| Supabase produção | sa-east-1, project `[PROJECT_REF]` | ✅ ACTIVE_HEALTHY |
| Supabase restore-test | us-east-2, project `multgestor-restore-test` | ✅ ACTIVE_HEALTHY |
| Local Windows | C:\MultGestor.v2 | ✅ operacional |
| Task Scheduler | MultGestor-Backup-Daily | ✅ State=Ready |

**Stack real:**
- **Backend:** Node ≥18 (CI usa Node 20), Express 5.2.1 (ESM-free, CommonJS), `pg` 8.20 (SQL direto, sem ORM), JWT (`jsonwebtoken`), Bcrypt, Zod, Pino, Sentry, prom-client, Helmet, Resend, ioredis (fallback in-memory), Multer
- **Frontend:** React 19, Vite, lazy loading, React Router, ErrorBoundary
- **Database:** PostgreSQL 16 (Supabase), sem Supabase Auth — auth próprio JWT
- **EventBus:** OutboxWorker (polling 1s, `outbox_messages` table), pub/sub via registro de handlers
- **Backup:** `pg_dump -Fc` via `run-backup.ps1`, Windows Task Scheduler

---

## 3. Governança `.opencodex`

### Estado verificado

| Arquivo | Estado |
| --- | --- |
| `current-task.md` | ✅ idle — correto (e2e concluído) |
| `next-task.md` | ✅ e2e-public-booking-validation marcado COMPLETED com achados |
| `backlog.md` | ✅ ops/reconcile e fase-c na fila, ordem definida |
| `project-state.md` | ✅ state_version 11, ultimas_missoes coerentes |
| `runbooks/backup-restore-plan.md` | ✅ atualizado (§9 adicionado) |
| `runbooks/auditoria-completa-padrao.md` | ✅ criado nesta sessão |
| `audits/` | ✅ este arquivo |

### Diferença tarefa ativa / pendente / concluída

- **Ativa:** nenhuma (slot idle) ✅
- **Pendente:** ops/reconcile-failed-sale-created-outbox · fase-c (aguarda decisão break vs continue)
- **Bloqueada:** fase-c (decisão arquitetural pendente)
- **Concluída:** e2e-public-booking-validation · ops/register-daily-backup-scheduler · backup-restore-check GATE

### Verificação: governança está mentindo?

**Não.** Todos os estados registrados batem com evidências verificadas nesta sessão.

**Uma divergência identificada:** O task card `ops/reconcile-failed-sale-created-outbox` nomeia incorretamente o tipo de evento. Os 4 eventos failed em produção são `cash_session.opened` e `cash_session.closed` — não `sale.created`. Ver achado A-012.

---

## 4. Produção — Backend Render

### Health check

```
GET https://[BACKEND_URL]/api/health/deep

status: healthy (200)
database: ok — latency 4034ms (cold start)
redis: degraded — não configurado, fallback in-memory ativo
outbox: ok — pending_messages: 0
email_provider: ok — resend
whatsapp_provider: degraded — mock (não Meta Cloud API)
uptime_seconds: 10 (cold start pelo request da auditoria)
version: 1.0.0
```

### Observações
- **Cold start evidente:** 4034ms de latência no banco → resultado direto do Render free tier dormir após inatividade.
- **Redis ausente em produção:** fallback in-memory ativo. Rate limiting e cache não persistem entre restarts.
- **WhatsApp em mock:** mensagens de confirmação de agendamento não são enviadas (recurso degradado).
- **Jobs ativos:** TrialEmailJob (1h) + AppointmentReminderJob (15min) — ambos registrados em startup.
- **OutboxWorker:** polling 1s, batchSize 50. `sale.created` em QUARENTENA (comentado em server.js linha 413).
- **Sentry:** integrado e inicializado antes de qualquer I/O.
- **Graceful shutdown:** SIGTERM/SIGINT implementados com timeout 10s.

### Endpoints validados

| Endpoint | Resultado |
| --- | --- |
| `GET /api/health` | ✅ 200 |
| `GET /api/health/deep` | ✅ 200 healthy |
| `GET /api/public/booking/barbearia-joefelipe` | ✅ 200 (validado em missão anterior) |
| `GET /api/barber/public/barbearia-joefelipe/available-slots` | ✅ 200 com serviceId |

---

## 5. Produção — Frontend Vercel

### Configuração verificada
- `frontend/.env.production`: `VITE_API_URL=https://[BACKEND_URL]` ✅ (único arquivo .env tracked — exceção intencional no .gitignore)
- CI: lint + build validados em todo push — nenhum warning catastrófico detectável
- Node 20 usado no build ✅

### Rotas mapeadas

| Tipo | Rotas |
| --- | --- |
| Públicas | `/`, `/barbergestor`, `/register`, `/forgot-password`, `/reset-password`, `/confirmar-email`, `/agendar/:slug*` |
| Booking protegido | `/agendar/:slug/minha-conta`, `/agendar/:slug/perfil` |
| Barber (admin) | `/barber/dashboard`, `/barber/agenda`, `/barber/servicos`, `/barber/colaboradores`, etc. |
| Master (super-admin) | `/master/dashboard`, `/master/modules`, `/master/clients`, `/master/subscriptions` |

- Todas as rotas `/barber/*` protegidas por `BarberPrivateRoute` ✅
- Todas as rotas `/master/*` protegidas por `MasterPrivateRoute` ✅
- ErrorBoundary em todas as rotas de booking ✅
- Lazy loading em todas as páginas ✅
- Catch-all `path="*"` redireciona para `/barber/login` ✅

### Não verificado (limitação read-only)
- UX real em produção (requer navegador)
- Comportamento de estados vazios
- Responsividade mobile
- Build warnings (não rodado localmente)

---

## 6. Banco de dados Supabase

### Contagens de produção

| Tabela | Registros |
| --- | --- |
| companies | 8 |
| users | 25 |
| barber_appointments | 1 |
| barber_services | 19 |
| barber_collaborators | 12 |
| barber_working_hours | 7 |
| barber_sales | 35 |
| outbox_messages | 4 (total) |

### Migrations

| Versão mais recente | Data aplicada | Origem |
| --- | --- | --- |
| 20260604_023 | 2026-06-14 | MCP (manual) |
| 20260604_022 | 2026-06-14 | MCP (manual) |
| 20260603_021 | 2026-06-03 | CI |
| ... | ... | ... |

**Total: 23 migrations aplicadas. Schema em SYNC com repositório.** ✅

### Drift
Nenhum drift detectado. Migrations 022 e 023 foram aplicadas manualmente via MCP (Supavisor sa-east-1 bloqueado para CI).

---

## 7. RLS e segurança multi-tenant

### Estado das tabelas (produção)

**✅ RLS habilitado + políticas ativas (isolamento por company_id):**
barber_services (2) · barber_collaborators (2) · barber_appointments (2) · barber_sales (2) · barber_sale_items (2) · barber_products (2) · barber_suppliers (2) · barber_cash_sessions (2) · barber_advances (2) · barber_settlements (2) · barber_working_hours · barber_booking_blocks · barber_booking_landing · barber_booking_settings · barber_client_notes · barber_client_events · barber_client_tags · barber_audit_logs · booking_customers · integration_configs · clima_* · company_wallets · customer_loyalty · customer_packages · deposit_configs · loyalty_programs · loyalty_transactions · package_redemptions · service_packages · topup_requests · wallet_transactions · anamnesis_*

**⚠️ RLS habilitado MAS 0 políticas (gap crítico):**

| Tabela | Risco |
| --- | --- |
| `companies` | RLS=true, 0 policies → `app_runtime` retorna 0 linhas. Backend usa `postgres` (BYPASSRLS). Frágil. |
| `users` | Mesmo problema — acesso via `postgres` funciona, mas sem policy formal |

**⚠️ RLS desabilitado (potencial cross-tenant):**

| Tabela | Risco |
| --- | --- |
| `company_modules` | Módulos de qualquer empresa visíveis sem RLS |
| `subscriptions` | Dados de assinatura sem isolamento |
| `subscription_events` | Eventos de billing sem isolamento |
| `invoices` | Faturas sem isolamento |
| `payment_gateway_events` | Eventos de gateway sem isolamento |

**✅ RLS desabilitado por design (global/master):**
`outbox_messages` · `settings` · `audit_logs` · `auth_audit_logs` · `trial_email_log` · `schema_migrations` · `plans` · `modules`

### Mecanismo de isolamento atual
O backend usa a role `postgres` (BYPASSRLS) para todas as queries. O isolamento é feito por application-level filtering: `requireCompany` middleware executa `BEGIN` + `SET LOCAL app.current_company_id` + usa `withTenantContext`. O RLS é camada de defesa em profundidade.

**`app_runtime` em produção: NÃO EXISTE.** A query de grants retornou vazio. A role só existe no CI local. O RLS como principal proteção não está ativo em produção para o backend real.

### Pergunta central
> Existe algum caminho onde um tenant consegue ver dado de outro tenant?

**Com a role `postgres` (BYPASSRLS):** apenas se o código esquecer de filtrar por `company_id`. O middleware `requireCompany` garante o contexto, mas queries públicas (`getPublicBookingInfo`, `getSchedulingAvailability`) usam `pool.query()` direto sem `withTenantContext` — correto para endpoints públicos, mas significa que RLS não os protege.

---

## 8. Autenticação e sessão

### Verificado
- Login `/api/auth/login`: JWT emitido, cookie HttpOnly ✅
- Middleware `auth.middleware.js`: valida JWT, extrai user ✅
- Helmet ativo com headers de segurança ✅
- CORS com whitelist explícita (`barbergestor.com.br`, `multgestorapp.com.br`, localhost) ✅
- Rotas protegidas exigem JWT ✅
- Fluxo de cadastro `/register` com XSS hardening ✅ (missão anterior concluída)
- `GET /register com <script>` → 400 confirmado em produção (state.md)

### Gaps
- `contentSecurityPolicy: false` no Helmet → CSP desativado. Vetor XSS residual no frontend se scripts inline existirem.
- Rate limit no `requireBarberModule`, mas não visível nos endpoints públicos de booking.
- Brute force no login: não verificado (existe `auth-security.sql` que pode ter rate limiting via DB).
- Enumeração de usuário: resposta de login inválido não auditada nesta sessão.
- Refresh token / expiração de JWT: não verificado.
- Reset de senha: rota existe (`/forgot-password`, `/reset-password`), funcionamento não testado.

---

## 9. Secrets e variáveis de ambiente

### .gitignore — verificado

| Item | Status |
| --- | --- |
| `.env`, `.env.*` | ✅ ignorado |
| `backend/.env`, `frontend/.env` | ✅ ignorados |
| `frontend/.env.production` | ⚠️ EXCEPTION — tracked (só tem VITE_API_URL, sem secrets) |
| `docs/private/` | ✅ ignorado |
| `opencode.json` | ✅ ignorado |
| `body-login.json` | ✅ ignorado |

### Variáveis esperadas (sem expor valores)

| Variável | Ambiente | Risco |
| --- | --- | --- |
| `DATABASE_URL` | Render | crítico |
| `JWT_SECRET` | Render | crítico |
| `RESEND_API_KEY` | Render | médio |
| `RENDER_DEPLOY_HOOK_URL` | GitHub Secrets | alto |
| `VERCEL_TOKEN` | GitHub Secrets | alto |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | GitHub Secrets | alto |
| `SENTRY_DSN` | Render | médio |
| `VITE_API_URL` | frontend/.env.production | público (esperado) |

### Verificação de leaks
- Nenhum secret encontrado no código lido (controllers, services, server.js)
- Histórico git: missão `SECURITY-SECRETS-ROTATION` conteve artifacts privados (2026-06-15)
- Sem `.env` files rastreados (exceção `.env.production` intencional)
- `opencode.json` não commitado ✅

**Resposta à pergunta central:** Nenhum secret aparentemente vazado em código, Markdown ou commits visíveis.

---

## 10. Backup e restore

| Item | Estado |
| --- | --- |
| Dump manual (2026-06-17) | ✅ 546KB |
| Daily dump (2026-06-18 03:39) | ✅ 650KB (Task Scheduler rodou) |
| Scheduler diário | ✅ State=Ready, NextRunTime=2026-06-19 02:00 |
| Log de sucesso | ✅ `last-status.json`: exit_code=0, status=OK |
| Restore em banco descartável | ✅ evidenciado via MCP (contagens match) |
| RPO real | ~24h |
| RTO estimado | 30-120min (depende de rede e tamanho) |
| Retenção | ✅ 7 dumps (automático via script), logs >30 dias removidos |
| Cópia externa/cloud | ❌ AUSENTE — apenas local Windows |
| Guard dump-only | ✅ `BRCHK_TARGET_DB_URL` removido antes de executar |

**Resposta à pergunta central:** Se o banco sumir, conseguimos restaurar — **desde que o computador local esteja disponível**. O dump mais recente tem menos de 24h. RTO ~1h. Risco P1: falha do HD local ou perda do computador = perda de todos os backups.

---

## 11. Testes e CI/CD

### Cobertura atual

| Categoria | Arquivos | Estado |
| --- | --- | --- |
| Unitários | 40+ (auth, schedule, security, validators, outbox, event-bus, billing, anamnesis, backup...) | ✅ |
| Integração | 4 (tenant-isolation, tenant-isolation-rls, outbox-durability, register-validation) | ✅ |
| E2E automatizado | 0 | ❌ |
| Fluxo público booking | 0 (só validação manual desta sessão) | ❌ |
| RLS isolation (banco real) | 1 arquivo — **descarta.skip se sem TEST_DATABASE_URL** | ⚠️ |

### CI/CD

| Job | Trigger | Estado |
| --- | --- | --- |
| Unit Tests | Todo push | ✅ |
| Integration Tests | Todo push | ✅ (Postgres + Redis reais) |
| Frontend Lint + Build | Todo push | ✅ |
| Database Migrations | Push em `main` | ⚠️ `continue-on-error: true` |
| Deploy Backend (Render) | Após migrations | ✅ |
| Deploy Frontend (Vercel) | Push em `main` | ✅ |

**Alerta:** `continue-on-error: true` nas migrations significa que deploy acontece mesmo com migration falhando silenciosamente.

### Gates ausentes que deveriam existir
```
- backup/restore smoke test
- public booking E2E (pelo menos health + booking-info + slots)
- RLS isolation (com banco real, não skip)
- billing webhook smoke test
```

---

## 12. EventBus e outbox

### Estado dos 4 eventos failed em produção

| Tipo | Quantidade | Erro | Data | Retry |
| --- | --- | --- | --- | --- |
| `cash_session.opened` | 3 | "No handler registered for type: cash_session.opened" | 2026-05-19 | 0/5 |
| `cash_session.closed` | 1 | "No handler registered for type: cash_session.closed" | 2026-05-19 | 0/5 |

**⚠️ ACHADO CRÍTICO:** O task card `ops/reconcile-failed-sale-created-outbox` está com nome errado. Os eventos failed NÃO são `sale.created` — são `cash_session.*`. O handler para esses eventos nunca foi registrado. Os eventos datam de 2026-05-19 (pré-scripts atuais).

### Handlers registrados em produção

| Tipo de evento | Handler | Estado |
| --- | --- | --- |
| `payment.approved`, `subscription.*`, `payment.failed` | `handleBillingProvisioning` | ✅ |
| `wallet.topup.approved/failed` | `handleWalletTopup*` | ✅ |
| `appointment.created` | `handleAppointmentCreated` + `handleAppointmentCreatedEventLog` | ✅ |
| `appointment.confirmed/canceled/completed/rescheduled` | handlers registrados | ✅ |
| `sale.created` | `handleSaleLoyaltyAccrual` + `handleSalePackageRedemption` | 🔒 QUARENTENA |
| `cash_session.opened/closed` | **NENHUM** | ❌ |

### OutboxWorker
- Polling: 1s
- batchSize: 50
- `sale.created` em quarentena lógica (comentado em `server.js:413`) com warn no log ✅
- idempotência: via `outbox_message_handlers` table (migration 022) ✅

**Pergunta central:** Quando algo acontece, o sistema registra e processa? Para cash_session events: registra mas **não processa** (sem handler) → falha silenciosa após max_retries=5. Os 4 eventos nunca foram retentados (retry_count=0) — isso pode indicar que o worker viu e marcou como failed imediatamente por "no handler".

---

## 13. Frontend

### Estrutura
- **Design System próprio:** `/components/design-system/` (Button, Card, Badge, Input, Empty, Skeleton, Shell, StatCard)
- **ErrorBoundary:** implementado no fluxo de agendamento ✅
- **Contextos:** `auth.context.js`, `booking.context.js`
- **Rotas protegidas:** BarberPrivateRoute, MasterPrivateRoute, BookingPrivateRoute ✅
- **Vertical barber:** completa (agenda, atendimento, colaboradores, clientes, vendas, caixa, acertos, relatórios, configurações)
- **Vertical clima:** scaffold (página placeholder)
- **Master (super-admin):** dashboard, modules, clients, subscriptions, activations, settings

### O que não foi verificado (limitação read-only)
- Estados vazios (Empty components existem mas não testados visualmente)
- Responsividade mobile
- Runtime errors em produção
- Build warnings locais
- Performance de carregamento

### Riscos
- Nenhum teste de frontend (zero arquivos .test no src/)
- CI só faz lint + build (não detecta erros de runtime)
- UX do fluxo de booking não testada end-to-end com navegador real

---

## 14. Backend

### Estrutura
```
backend/src/
├── controllers/       barber/ (15 arquivos), client-booking, clima/, master, auth
├── services/          20+ arquivos (core domain logic)
├── repositories/      10 arquivos (SQL queries nomeadas)
├── middlewares/        auth, correlation-id, error-handler, requireActivePlan, requireBarberModule, requireClimaModule, requirePlanFeature, metrics, requireCompany
├── routes/            10 arquivos (auth, barber, booking-auth, client, clima, master, public-auth, public-booking, webhooks)
├── shared/            capabilities/, core/ (auth/roles, database, errors, events, monitoring, outbox)
├── integrations/      billing (Kiwify, AbacatePay), WhatsApp (mock, Meta), adapters
├── jobs/              trial-email-job, appointment-reminder-job
└── database/          21 arquivos .sql
```

### Pontos fortes
- Separação clara routes → controllers → services → repositories
- Correlation ID em todos os requests ✅
- Error handler centralizado ✅
- Graceful shutdown implementado ✅
- Sentry + Prometheus + Pino (structured logging) ✅
- Zod para validação de input ✅
- Arquitetura event-driven (outbox + worker) ✅
- Multi-tenant via middleware `requireCompany` + `SET LOCAL app.current_company_id` ✅

### Problemas identificados

| Área | Problema | Severidade |
| --- | --- | --- |
| Helmet | `contentSecurityPolicy: false` — CSP desabilitado | P2 |
| Redis | Não configurado em produção | P1 |
| `cash_session.*` | Sem handler no OutboxWorker | P1 |
| Versão | `version: "1.0.0"` sem gestão semântica | P3 |
| Arquivos `_archive/` | `barber.service.legacy.js` não removido | P3 |
| WhatsApp | Mock em produção | P2 |

---

## 15. Arquitetura multi-nicho

### Estado atual

| Aspecto | Estado |
| --- | --- |
| Multi-tenant real | ✅ (company_id em todas as tabelas) |
| BarberGestor | ✅ completo (vertical 1) |
| ClimaGestor | ⚠️ scaffold (stub — sem funcionalidade real) |
| Separação de rotas | ✅ barber.routes.js + clima.routes.js separados |
| Separação de tabelas | ✅ barber_* + clima_* separados |
| Slug público por empresa | ✅ |
| Capabilities (billing, booking) | ✅ arquitetura em `/shared/capabilities/` |
| Código hardcoded "barber" | ⚠️ muitos arquivos com prefixo barber_* e controllers/barber/ |

**Resposta à pergunta estratégica:** O sistema está **começando** a virar plataforma multi-nicho mas está ~90% barber-specific. A arquitetura de `shared/capabilities/` e multi-tenant real é sólida. Adicionar PetGestor ou AutoGestor precisaria de novas tabelas `pet_*`/`auto_*` e controllers específicos, mas a fundação multi-tenant está pronta.

---

## 16. Performance e custo

| Item | Estado |
| --- | --- |
| Cold start Render | 4034ms (free tier — dorme após inatividade) |
| Redis | Não configurado (in-memory fallback) |
| DB latência | ~4s (cold start) → <50ms quando quente |
| Plano Supabase | Free (sem PITR, sem auto-backup) |
| Plano Render | Free tier (sleep após inatividade) |
| Plano Vercel | Não verificado |
| Índices | Incluídos nas migrations (.sql) — não auditados individualmente |

**Risco:** Um primeiro usuário real pode encontrar 4+ segundos de espera (cold start Render) e pensar que o sistema está quebrado.

---

## 17. Observabilidade

| Componente | Estado |
| --- | --- |
| Logs estruturados (Pino) | ✅ |
| Correlation ID por request | ✅ |
| Sentry (erros de runtime) | ✅ (requer DSN em prod env) |
| Prometheus metrics (`/metrics`) | ✅ (auth protegida) |
| Health check básico | ✅ `/api/health` |
| Health check deep | ✅ `/api/health/deep` (DB + Redis + Outbox + Email + WhatsApp) |
| Job status | Apenas via logs |
| Backup status | `last-status.json` local |
| Alerta de falha crítica | ❌ Sem alertas externos |
| Dashboard externo | ❌ Sem Grafana/Datadog |
| Uptime monitoring | ❌ Não verificado |

**Gap crítico:** Nenhum alerta externo configurado. Se o backup falhar, o Task Scheduler grava em log local mas ninguém é notificado. Se o OutboxWorker morrer, os eventos acumulam silenciosamente.

---

## 18. LGPD e dados sensíveis

| Item | Estado |
| --- | --- |
| Dados pessoais coletados | nome, email, telefone (users, booking_customers) |
| Armazenamento | Supabase sa-east-1 (Brasil region) ✅ |
| Backups com PII | ✅ (pg_dump inclui todos os dados) |
| Acesso administrativo | Via master role + Supabase MCP |
| Exclusão de conta | ❌ Não verificada — rota não encontrada |
| Política de privacidade | ❌ Não verificada |
| Consentimento | ❌ Não verificado no fluxo de cadastro |
| Logs com PII | ⚠️ Pino pode logar request bodies (configuração não auditada) |
| Exposição em endpoints públicos | `getPublicBookingInfo` expõe apenas dados de empresa (slug, nome, serviços, colaboradores) — sem PII de clientes ✅ |

---

## 19. Produto e prontidão comercial

| Para vender precisa de quê? | Estado |
| --- | --- |
| Landing pública | ✅ (`/` + `/barbergestor`) |
| Cadastro de empresa | ✅ (`/register`) |
| Agenda pública | ✅ (`/agendar/:slug` — booking flow) |
| Painel administrativo | ✅ (`/barber/*` — completo) |
| Agendamento (criação) | ⚠️ Backend OK, não testado em produção via POST |
| Pagamento/assinatura | ⚠️ Kiwify integrado, não testado E2E |
| Notificações (email) | ✅ Resend configurado |
| Notificações (WhatsApp) | ❌ Mock (não real) |
| Onboarding | ✅ First-access flow |
| Relatórios | ✅ Rotas/controllers existem |
| Backup | ✅ |
| Segurança mínima | ⚠️ XSS resolvido, CSP ausente, RLS gaps |

**Bloqueadores para primeiro cliente pagante:**
1. POST de agendamento não testado em produção (criar agendamento real)
2. WhatsApp mock (confirmação não chega ao cliente)
3. Fluxo de pagamento/assinatura não testado E2E

---

## 20. Classificação de riscos

| Severidade | Significado |
| --- | --- |
| P0 | Bloqueia produção ou causa perda/vazamento de dados |
| P1 | Risco sério com mitigação temporária |
| P2 | Problema importante, não bloqueia tudo |
| P3 | Melhoria ou limpeza |
| P4 | Decisão estratégica/futura |

---

## 21. Lista de achados

| ID | Severidade | Área | Achado | Status |
| --- | --- | --- | --- | --- |
| A-001 | P1 | RLS | `companies` + `users` com RLS=true mas 0 policies → se `app_runtime` for usado, retorna 0 linhas | aberto |
| A-002 | P1 | Backup | Backup apenas local (Windows) — sem cópia externa/cloud | aberto |
| A-003 | P1 | EventBus | 4 mensagens `cash_session.opened/closed` failed desde 2026-05-19 sem handler registrado | aberto |
| A-004 | P1 | Redis | Redis não configurado em produção — fallback in-memory (rate limit e cache perdem estado a cada restart) | aberto |
| A-005 | P1 | CI/CD | Migrations com `continue-on-error: true` — falha de migration não bloqueia deploy | aberto (conhecido) |
| A-006 | P2 | RLS | `company_modules`, `subscriptions`, `invoices`, `subscription_events`, `payment_gateway_events` sem RLS | aberto |
| A-007 | P2 | Segurança | `contentSecurityPolicy: false` no Helmet — CSP desativado | aberto |
| A-008 | P2 | Testes | Sem testes E2E automatizados (playwright/cypress) | aberto |
| A-009 | P2 | Testes | Fluxo público de agendamento sem cobertura automatizada | aberto |
| A-010 | P2 | WhatsApp | Provider em modo mock — confirmações não chegam aos clientes | aberto |
| A-011 | P2 | RLS | Role `app_runtime` não existe em produção — RLS defense-in-depth inativa | aberto |
| A-012 | P2 | Governança | Task card `ops/reconcile-failed-sale-created-outbox` com nome incorreto — eventos são `cash_session.*` não `sale.created` | requer correção |
| A-013 | P3 | Governança | Task card `e2e-public-booking-validation` tinha estrutura de API desatualizada — corrigido nesta sessão | corrigido |
| A-014 | P2 | Performance | Cold start Render 4+ segundos — UX ruim para primeiro request | aberto |
| A-015 | P3 | Produto | ClimaGestor é scaffold sem funcionalidade | aberto |
| A-016 | P3 | Backend | `version: "1.0.0"` em package.json e health — sem gestão semântica de versão | aberto |
| A-017 | P3 | Git | Branch `ops/backup-restore-check` não pushed ao remote (6 commits locais) | aberto |
| A-018 | P3 | Observabilidade | Sem alertas externos — falha de backup ou outbox passa despercebida | aberto |
| A-019 | P3 | LGPD | Logs Pino podem expor PII em request bodies (configuração não auditada) | aberto |
| A-020 | P3 | Segurança | CSP ausente abre vetor para injection de scripts inline no frontend | aberto |
| A-021 | P4 | Produto | POST de agendamento não testado em produção | pendente aprovação |
| A-022 | P4 | Produto | Fluxo Kiwify/billing não testado E2E em produção | pendente |
| A-023 | P4 | LGPD | Exclusão de conta, consentimento e política de privacidade não verificados | pendente |
| A-024 | P4 | Arquitetura | Multi-nicho: 90% código barber-specific — ClimaGestor/outros nichos requerem trabalho significativo | estratégico |

---

## 22. Plano de correção

### Agora (P0/P1)
1. **A-003** — Reconciliar `cash_session.opened/closed` failed: decidir se adicionar handler ou marcar como descartado (missão `ops/reconcile` — renomear card)
2. **A-002** — Configurar backup externo (Google Drive, S3, ou similar) para dump diário
3. **A-004** — Avaliar configurar Redis em Render (ou aceitar risco e documentar)
4. **A-001** — Adicionar policies para `companies` e `users` (ou documentar BYPASSRLS como intencional)

### Depois (P2)
5. **A-006** — Adicionar RLS a `company_modules`, `subscriptions`, `invoices`
6. **A-007/A-020** — Ativar CSP no Helmet (requer config cuidadosa com React)
7. **A-009** — Escrever testes de integração para fluxo público de booking
8. **A-011** — Criar `app_runtime` em produção e migrar backend para usá-la
9. **A-010** — Planejar WhatsApp real (Meta Cloud API)
10. **A-014** — Avaliar Render paid tier (sem sleep) ou warm-up automático

### Futuro (P3/P4)
11. **A-023** — LGPD: exclusão de conta, política de privacidade, consentimento
12. **A-021/A-022** — Testes E2E completos do fluxo de agendamento e billing
13. **A-015** — Roadmap ClimaGestor (implementar vertical 2)
14. **A-017** — Push `ops/backup-restore-check` ou merge para main
15. **A-018** — Configurar alertas externos (Sentry alerts, uptime monitor)

---

## 23. Próximas missões recomendadas

Em ordem de execução:

```
1. ops/reconcile-cash-session-outbox
   → Renomear card + decidir: handler ou descarte dos 4 eventos cash_session.*
   → Prioridade: P1 (dados inconsistentes em produção)

2. ops/backup-external-copy
   → Configurar cópia automática do dump para cloud (Google Drive API, S3, Backblaze)
   → Prioridade: P1 (single point of failure local)

3. security/rls-companies-users-policy
   → Adicionar policies para companies + users (ou BYPASSRLS documentation)
   → Prioridade: P1 (gap em RLS defense-in-depth)

4. fase-c-integracao-e-testes
   → Decisão break vs continue no OutboxWorker
   → Requer: A-012 corrigido antes

5. tests/public-booking-integration
   → Testes de integração para getPublicBookingInfo + getSchedulingAvailability
   → Prioridade: P2

6. security/csp-helmet
   → Ativar Content-Security-Policy
   → Prioridade: P2
```

---

## 24. Veredito final

```
VEREDITO: APROVADO PARA PRÓXIMA MISSÃO — COM BLOQUEIOS P1 CONHECIDOS

O projeto está operacional em produção, governança coerente, backup ativo e
fluxo público de agendamento (GET) validado. Os bloqueios P1 são conhecidos e
gerenciáveis: cash_session events orphaned (sem handler), backup só local,
Redis não configurado, RLS incompleto para companies/users.

NÃO recomendo avançar para vendas reais sem:
  1. Resolver A-003 (cash_session orphaned events)
  2. Configurar backup externo (A-002)
  3. Testar POST de agendamento em produção (A-021)

Para a próxima missão técnica (ops/reconcile renomeado), pode avançar agora.
```

---

## Evidências coletadas

| Evidência | Tipo | Verificada por |
| --- | --- | --- |
| `GET /api/health/deep` → 200 healthy | Curl produção | Bash |
| `outbox_messages` — 4 failed (cash_session) | SQL Supabase MCP | mcp__supabase__execute_sql |
| RLS status — 55 tabelas | SQL Supabase MCP | pg_tables + pg_policies |
| Migrations — 23 aplicadas, última 20260604_023 | SQL Supabase MCP | schema_migrations |
| Contagens (companies=8, users=25, sales=35...) | SQL Supabase MCP | SELECT COUNT(*) |
| `GET /api/public/booking/barbearia-joefelipe` → 200 | Sessão anterior | Curl/PowerShell |
| `GET /api/barber/public/.../available-slots` → 200 com serviceId | Sessão anterior | PowerShell |
| `BRCHK_TARGET_DB_URL` removida (guard dump-only) | Código | Read `run-backup.ps1:84` |
| Task Scheduler State=Ready, NextRunTime=2026-06-19 02:00 | PowerShell sessão anterior | Get-ScheduledTaskInfo |
| `last-status.json` exit_code=0, status=OK | PowerShell sessão anterior | Get-Content |
| `contentSecurityPolicy: false` | Código | Read `server.js:200` |
| `sale.created` em QUARENTENA (comentado) | Código | Read `server.js:413` |
| `app_runtime` grants vazio em produção | SQL Supabase MCP | information_schema |
| CI: `continue-on-error: true` | Código | Read `deploy.yml:36` |
| RLS isolation test (tenant-isolation-rls.test.js) | Código | Read |
| `.gitignore` — sem leaks óbvios | Arquivo | Read |
