# AUDITORIA FUNDAMENTAL MULTGESTOR

> **Status:** OFICIAL · Segundo Cérebro (`.opencodex/brain/audits/`)
> **Modo:** READ_ONLY / AUDIT_ONLY · **Data:** 2026-06-15 · **Branch:** `security/secrets-rotation`
> **Garantia:** nada foi alterado; nenhum valor sensível exibido (apenas nomes de variáveis e flags).

---
type: audit
audit_id: auditoria-fundamental-2026-06-15
created_by: Claude Code
created_at: 2026-06-15
scope: sistema inteiro (backend, frontend, banco, CI/CD, integrações, segurança, produto, roadmap)
verdict: ~70% pronto para piloto pago; integrações de notificação (e-mail/WhatsApp) em MOCK em produção
---

## 1. Sumário executivo
- **Veredito geral:** produto **substancialmente construído e arquiteturalmente maduro** para um MVP de SaaS vertical. Backend modular-monolith real (183 arquivos JS, 29 services, outbox durável, event bus, multi-tenant, billing) e frontend extenso (254 arquivos, React 19 + design-system). **Não é vaporware** — BarberGestor é um sistema de gestão funcional.
- **Nível de prontidão:** **~70% para piloto pago**, ~45% para venda em escala. O código está à frente da operação: as **integrações que geram valor percebido (e-mail e WhatsApp) estão em modo MOCK em produção**.
- **Pronto para piloto?** ⚠️ **Quase** — com 1 barbearia controlada e acompanhamento manual, sim. Falta ligar e-mail/WhatsApp reais e testar booking E2E em prod.
- **Pronto para venda?** ❌ **Ainda não** — notificações reais, restore de backup testado, e validação E2E pendentes.
- **Pronto para escala?** ❌ **Não** — RLS inerte (isolamento só na aplicação), migrations manuais (Supavisor), sem observabilidade ligada (Sentry vazio), 4 migrations faltando no repo.
- **Maior risco atual:** 🔴 **isolamento multi-tenant depende 100% de filtros `company_id` na aplicação** (RLS está ENABLE mas inerte por BYPASSRLS). Um único `WHERE company_id` esquecido vaza dados entre barbearias.
- **Maior oportunidade comercial:** BarberGestor + **agendamento público + lembrete WhatsApp** é um combo que barbearias pagam hoje. O motor já existe; falta ativar o canal real.

## 2. Estado atual real
- **Branch atual:** `security/secrets-rotation` (criada para a missão pausada). **main:** `b75d34a` (pushed 2026-06-14).
- **Commits importantes recentes:** XSS hardening (`b75d34a`, PR #6) · deploy fixes (`c94ea02`, `4a058d2`) · outbox crash fix (`c3a06d6`) · contenção de secrets (`86a8541`) · promoção da fila (`943b400`).
- **Produção:** Render (backend) conecta no Supabase pooler sa-east-1; `GET /api/health` 200; login inválido 401; `/register` com `<script>` → 400 (portão XSS ativo). Vercel (frontend).
- **CI/CD:** CI com 3 jobs (unit / integração com Postgres+Redis reais / frontend lint+build). Deploy roda migrations com **`continue-on-error: true`** (Supavisor rejeita tenant) → migrations novas aplicadas **manualmente via MCP**.
- **Banco:** Supabase Postgres, ~40 tabelas reais.
- **Governança:** `.opencodex/brain` é fonte da verdade; fila `next-task` = `security-secrets-rotation` (⏸️ pausada por decisão humana); `e2e-public-booking-validation` deferida no backlog.
- **Filas:** OPS-SUPAVISOR bloqueado; Fase C (loyalty/package) em quarentena lógica; RLS Fase 2/3 gated.

## 3. Arquitetura
**Mapa de módulos (backend):**
```
server.js → [CORS, helmet, cookieParser, correlationId, metrics, requestLogger, tenantContext]
  routes/ (10) → controllers/ (7) → services/ (29) → repositories/ (10) → config/database (pg.Pool)
  shared/core/   → events (EventBus in-memory + contracts/factory), outbox (UnitOfWork + worker durável),
                   cache (redis + fallback), logger (pino), monitoring (sentry+métricas), auth/roles, errors
  shared/capabilities/ → billing (Kiwify, AbacatePay), booking-engine (19 funções puras, reuso Barber+Clima)
  integrations/  → IntegrationManager + WhatsApp (Meta/mock) + consumers (appointment, billing, wallet)
  jobs/          → appointment-reminder (15min), trial-email (1h)
```
- **Aderência ao modular-monolith:** ✅ **forte** — capabilities com contrato/dono, verticais (Barber/Clima) sobre core compartilhado.
- **Event-driven:** ✅ real — outbox transacional para eventos P0 (`appointment.*`, billing), EventBus volátil p/ notificação. Lição L-03/L-09 incorporadas (todo evento crítico tem teste sem mock).
- **Multi-tenant:** ✅ na aplicação (`company_id` + `tenantContext` + ALS); 🟡 RLS inerte no banco.
- **Integration-ready:** ✅ camada de adapter/registry desacoplada por provider.
- **AI-ready:** ❌ aspiracional (documentado em `.agent/`, não implementado — ver `lessons-learned` L-02).

## 4. Backend
- **Rotas (10 grupos):** auth, booking-auth, barber, clima, master, client, public-auth, public-booking, webhooks, integration.
- **Auth:** JWT Bearer + scopes (`barber_admin`, `booking_customer`, `master`) e roles. Bem estruturado em `backend/src/middlewares/auth.middleware.js`. Falha fechada se `JWT_SECRET` ausente (500).
- **Validação:** Zod (`shared/core/validation`). XSS de entrada endurecido no register.
- **Multi-tenant:** `tenantContext` + guards de módulo (`requireBarberModule`, `requireActivePlan`, `requirePlanFeature`).
- **Event bus / Outbox:** outbox durável com idempotência por handler (022); consumers de appointment (audit) e billing ativos; **Fase C (loyalty/package) em quarentena** (`backend/src/server.js:407-415`).
- **Billing:** Kiwify (real) + AbacatePay (presente). Provisionamento via outbox (`payment.approved`, `subscription.*`).
- **Problemas/riscos:**
  - 🔴 **Wallet topup consumers registrados** (`wallet.topup.approved/failed`) mas **migration de prepaid faltando** (ver §5) → handler pode quebrar se acionado.
  - 🟡 `BaseRepository` interpola nomes de coluna → exige allowlist no caller (registrado em capabilities-map).
  - 🟡 `uncaughtException` → `process.exit(1)`: correto, mas sem supervisor robusto pode derrubar o serviço.
- **Próximos passos:** ligar provider real de notificação; resolver migrations faltantes; validar E2E.

## 5. Banco/Supabase
- **Tabelas principais (reais, ~40):** `companies`, `users`, `plans`, `subscriptions`, `subscription_events`, `invoices`, `payment_gateway_events`, `modules`, `company_modules`, `outbox_messages`, `outbox_message_handlers`, `barber_*` (appointments, services, sales, sale_items, cash_sessions, advances, settlements, working_hours, collaborators, products, suppliers, booking_*, client_*), `clima_*`, `booking_customers`, tokens (`password_reset`, `pin_reset`, `first_access`, `email_verification`), `audit_logs`, `trial_email_log`.
- **Migrations:** 24 registradas em `backend/scripts/run-migrations.js`.
  - 🔴 **ACHADO CRÍTICO:** as migrations **018–021** (`mg_prepaid_v1.sql`, `mg_packages_v1.sql`, `mg_loyalty_v1.sql`, `mg_anamnese_v1.sql`) estão **referenciadas no runner mas os arquivos NÃO existem no repo**. O runner emite `[warn] arquivo não encontrado` e **pula sem registrar** → o schema de **carteira pré-paga, pacotes, fidelidade e anamnese pode não existir**. Há `anamnesis.service.js` e consumers de wallet/loyalty/package referenciando essas estruturas. **Exige validação humana:** ou os arquivos se perderam (incidente `git clean` L-01) ou nunca foram aplicados.
- **RLS:** policies `tenant_isolation` em todas as tabelas tenant (`backend/src/database/rls_tenant_tables.sql`) — corretas, mas **inertes** porque o runtime conecta com role BYPASSRLS (L-07). `runtime_role_grants.sql` + `app_runtime` validados **só no CI** (Fase 1); Fases 2/3 (staging/prod) gated.
- **Storage:** bucket `barber-collaborators` (avatares) via service role; fallback local se key ausente.
- **Riscos/validações necessárias:** confirmar existência real das tabelas mg_*; testar restore de backup (nunca feito — backlog #0); plano de rotação de secrets (pausado).

## 6. Frontend/UX
- **Stack:** React 19 + Vite + react-router-dom 7 + axios + Sentry + lucide. 254 arquivos.
- **Estrutura:** `pages/` (barber, barbergestor, master, booking), `features/barber/` (views), `components/design-system/` (tokens, ui, charts, layout, feedback), onboarding, tutorial, premium, mobile, reports.
- **Rotas protegidas:** `ProtectedRoute`, `BarberPrivateRoute`, `BookingPrivateRoute`, `MasterPrivateRoute`, `ModuleRoute`, `HomeRedirect`.
- **Auth:** `AuthContext` + `BookingAuthContext` (dois fluxos: admin barbearia e cliente final), `authStorage`, api client central (`frontend/src/services/api.js`).
- **Booking público:** fluxo dedicado (`pages/barber/client`, booking context).
- **Gaps de UX (a validar com uso real):** responsividade mobile (há pasta `mobile/` — sinal positivo, mas precisa teste em campo); onboarding completo até primeiro agendamento; estados de erro/vazio; o "dia-a-dia" do barbeiro (caixa, comissão) precisa de teste de usabilidade real.

## 7. Integrações
| Integração | Status | Onde | Risco | Valor comercial | Próximo passo |
|---|---|---|---|---|---|
| **Supabase (DB)** | ✅ real | `config/database` | médio (Supavisor) | base de tudo | resolver pooler/migrations |
| **Supabase Storage** | ✅ real | `config/supabase.js` | baixo | avatares | validar com nova key |
| **Render** | ✅ real | deploy.yml | baixo | hospeda backend | — |
| **Vercel** | ✅ real | deploy.yml | baixo | hospeda front | — |
| **Kiwify (pagamento)** | ✅ real | `billing/providers/kiwify` | médio | **receita** | testar webhook fim-a-fim |
| **AbacatePay (Pix)** | 🟡 parcial | `billing/providers/abacatepay` | — | receita Pix | secret vazio → ativar |
| **WhatsApp (Meta)** | 🟡 **mock em prod** | `integrations/whatsapp` | **alto p/ valor** | **lembrete = retenção** | trocar `WHATSAPP_PROVIDER=meta_cloud_api` + credenciais |
| **E-mail (Resend/SMTP)** | 🟡 **mock em prod** | `providers/email` | alto | verificação/trial | `EMAIL_PROVIDER=resend` + validar domínio |
| **Redis** | ✅ real (opcional) | `cache/redis-client` | baixo | rate limit/cache | configurar `REDIS_URL` em prod |
| **Sentry** | 🟡 inativo | `monitoring/sentry` | médio | observabilidade | configurar DSN |

> **Real vs mock — resumo:** o **código** das integrações é real e bem-feito; o que está **mock em produção** é **e-mail e WhatsApp** (por env), e **AbacatePay/Sentry/Redis** estão inativos por config vazia. Loyalty/packages/anamnese/wallet têm código mas **schema não confirmado**.

## 8. Segurança
- **XSS:** ✅ ciclo fechado (entrada bloqueada no `/register`, dados sanitizados; `companies.name`/`users.name` = 0).
- **Secrets:** 🟡 contenção feita (`.gitignore`), **rotação pausada por decisão humana**. Inventário plaintext local existe mas ignorado; histórico do git limpo. Alerta permanente: não compartilhar/`push` dos artefatos.
- **JWT:** ✅ verificação correta; falha-fechada sem secret. Rotação invalidaria sessões (gated).
- **Cookies:** `cookie-parser` + `COOKIE_SECRET`. OK.
- **RLS:** 🔴 **inerte** — risco multi-tenant nº 1.
- **CORS:** ✅ allowlist explícita (`backend/src/server.js:173`).
- **Rate limit:** ✅ Redis fail-open (`rate-limit.middleware.js`).
- **SQL injection latente:** 🟡 `BaseRepository` interpola identificadores → exige allowlist; queries de valor usam `$1` parametrizado (bom).
- **Upload/storage:** multer + Supabase; validar limites/tipos.
- **Logs:** pino com correlation id; cuidado para **não logar secrets** (startup loga só prefixo `sb_secret_` de 10 chars — seguro).
- **LGPD:** ⚠️ dados de clientes (nome, telefone, anamnese) — falta política de retenção/export/delete formal.
- **Bloqueantes:** RLS inerte (P1 p/ escala), restore de backup não testado (P0 operacional).

## 9. Testes e qualidade
- **Volume:** 50 arquivos de teste (44 unit, 4 integração, 2 fluxos auxiliares).
- **Real vs mock:** unit mockam EventBus/DB; **integração roda Postgres+Redis reais no CI** com role `app_runtime` não-bypass (valida RLS de verdade no CI). Lição L-09: o GATE-INTEG pegou bug crítico que os mocks escondiam.
- **O que o CI valida de verdade:** unit + migrations + integração (outbox durability, mutation paths, tenant isolation) + frontend lint/build.
- **Gaps:** 🔴 **zero E2E de produto** (booking público real, fluxo de pagamento Kiwify fim-a-fim, envio real de WhatsApp/e-mail). Cobertura de billing provisioning end-to-end limitada.
- **Testes mínimos antes de cliente:** E2E de booking público (já planejado, deferido) + webhook Kiwify simulado → provisiona assinatura + 1 teste de envio real de notificação.

## 10. Produção
- **Render:** backend ativo, health 200.
- **Vercel:** frontend deployado.
- **Supabase:** DB conectado (pooler sa-east-1); migrations **manuais** enquanto Supavisor não resolve.
- **Health checks:** `/api/health` (leve) + `/api/health/deep` (DB, Redis, outbox pending, providers) — ✅ excelente.
- **Migrations:** ⚠️ `continue-on-error` mascara falha; drift acumula se esquecer o MCP manual.
- **Observabilidade:** métricas Prometheus (`/metrics`) ✅; Sentry inativo (DSN vazio) 🟡.
- **Backup/restore:** 🔴 **nunca testado** (backlog #0, prioridade máxima).
- **Plano free vs starter:** Render free dorme (cold start) — inviável p/ cliente pagante; precisa starter.
- **Riscos de operação:** cold start (free tier), migrations manuais, sem alerta de erro real (Sentry off).

## 11. Produto
- **Já entrega valor:** agenda, agendamento online público, serviços, profissionais/colaboradores, clientes/CRM, caixa, vendas, comissões, relatórios, multi-tenant, planos/assinatura. **É um sistema de gestão de barbearia completo.**
- **Tela sem valor suficiente ainda:** fidelidade/pacotes/anamnese/carteira pré-paga (código existe, schema não confirmado, wiring em quarentena) — **não prometer ao cliente ainda**.
- **O que o cliente pagaria hoje:** agenda + agendamento online + (quando ligado) **lembrete por WhatsApp** + controle de caixa/comissão.
- **O que o cliente reclamaria hoje:** WhatsApp/e-mail não chegam (mock), cold start do Render free, ausência de E2E pode esconder bug de fluxo real.
- **Features que vendem primeiro:** **agendamento online + lembrete WhatsApp** (reduz no-show — dor real e cara).

## 12. Monetização
- **Plano piloto:** 1–3 barbearias reais, gratuito/simbólico por 30–60 dias em troca de feedback, com acompanhamento manual.
- **Preço inicial sugerido:** **R$ 49–99/mês** (Starter) por barbearia, com plano Pro (R$ 129–199) adicionando WhatsApp multi-janela/relatórios avançados. Validar com piloto.
- **Quando ganhar dinheiro real:** após **(a)** ligar WhatsApp+e-mail reais, **(b)** E2E de booking verde, **(c)** webhook Kiwify provisionando assinatura, **(d)** Render starter. Estimável em **30–45 dias** de execução focada.
- **Checklist 1º cliente pago:** notificações reais ✅ · booking E2E ✅ · pagamento Kiwify fim-a-fim ✅ · backup/restore testado ✅ · plano de suporte mínimo ✅.
- **Riscos de churn:** notificação que não chega, lentidão (cold start), bug de isolamento (vazar dados de outra barbearia), perda de dado (backup não testado).

## 13. Roadmap 30/60/90 dias
- **30d — Piloto e estabilidade (P0):** ligar e-mail+WhatsApp reais; E2E booking público; resolver/confirmar migrations 018–021; Render starter; testar restore de backup; rotação de secrets (retomar quando decidir).
- **60d — Cobrança/notificações (P1):** webhook Kiwify fim-a-fim provisionando assinatura; AbacatePay/Pix ativo; Sentry ligado; lembrete WhatsApp multi-janela (24h+2h); onboarding guiado.
- **90d — Crescimento/diferenciação (P2):** RLS enforcement real (role least-privilege Fase 2/3); fidelidade/pacotes saindo da quarentena (com schema confirmado e testes); relatórios avançados; dashboard de métricas do dono.

## 14. Roadmap 6/12/24 meses
- **6m — Consolidação:** multi-tenant blindado (RLS real), observabilidade completa, SLA, 10–30 clientes pagantes, suporte estruturado.
- **12m — Multi-nicho:** ClimaGestor em produção; provar a tese de plataforma multi-vertical; templates de onboarding por nicho (Pet/Auto/Agro como scaffolds).
- **24m — Marketplace/automação/IA:** automation engine real, omnichannel, camada de IA operacional (hoje aspiracional), marketplace de módulos/integrações.

## 15. Matriz de prioridades
| Item | Prioridade | Impacto | Esforço | Risco | Ordem |
|---|---|---|---|---|---|
| Testar restore de backup | **P0** | catastrófico se faltar | baixo | dados | 1 |
| Confirmar/recriar migrations 018–021 | **P0** | features quebram | médio | dados/runtime | 2 |
| Ligar e-mail + WhatsApp reais | **P0** | valor percebido | baixo-médio | config | 3 |
| E2E booking público | **P0** | confiança p/ vender | baixo | — | 4 |
| Render starter (sem cold start) | **P1** | UX cliente | baixo | custo | 5 |
| Webhook Kiwify fim-a-fim | **P1** | receita | médio | billing | 6 |
| Rotação de secrets (retomar) | **P1** | segurança | médio | sessões | 7 |
| Sentry ativo | **P1** | operação | baixo | — | 8 |
| RLS enforcement real (Fase 2/3) | **P2** | escala/segurança | alto | prod | 9 |
| Fidelidade/pacotes (sair da quarentena) | **P2** | upsell | médio | — | 10 |
| Multi-nicho / IA / marketplace | **P3** | futuro | alto | — | 11+ |

## 16. Próxima missão recomendada (UMA)
**Missão: `e2e-public-booking-validation` (READ_ONLY) + diagnóstico das migrations 018–021.**
- **Por que essa:** é a **mais barata e mais reveladora** — prova (ou refuta) que o fluxo que você vai vender funciona em prod, sem tocar código/secrets, e naturalmente expõe se o schema de prepaid/packages está faltando (achado P0 desta auditoria). Desbloqueia a decisão de monetização com fato, não suposição. **Não depende** da rotação de secrets (que está pausada).
- **Por que não as outras:** restore de backup é P0 mas é **ops/infra** (ação humana no Supabase, não missão de código); ligar WhatsApp/e-mail real exige credenciais/decisão humana; RLS Fase 2/3 é gated e de alto risco. Todas vêm **depois** de saber que o fluxo base funciona.
- **Modo:** **PLAN_ONLY** para o diagnóstico das migrations (decidir recriar vs aplicar) + **READ_ONLY_VALIDATION** para o booking (curl). Nenhuma escrita.
- **Arquivos prováveis:** nenhum de código (validação). Para o follow-up das migrations: `backend/src/database/` + `backend/scripts/run-migrations.js`.
- **Critérios de aceite:** booking-info 200 · available-slots 200 não-vazio (slug `barbearia-joefelipe`) · relatório claro do estado das tabelas mg_* (existem em prod? sim/não) · separar erro de dado/config de erro de código.
- **Riscos:** o POST de agendamento cria dado real → **só com aprovação humana** (GET é seguro).

## 17. Anexos
- **Arquivos lidos (principais):** `.opencodex/brain/{project-state,source-of-truth,capabilities-map,lessons-learned,security-secrets-rotation}.md`, `.opencodex/queue/{next-task,current-task,backlog}.md`, `backend/src/server.js`, `backend/src/middlewares/auth.middleware.js`, `backend/src/database/rls_tenant_tables.sql`, `backend/scripts/run-migrations.js`, `backend/src/shared/capabilities/billing/providers/kiwify.provider.js`, `backend/src/config/supabase.js`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, + listagens de routes/controllers/services/integrations/jobs/middlewares/frontend.
- **Comandos read-only executados:** `git branch/log/check-ignore`, `ls`, `find`, `grep` (apenas nomes/contagens), leitura de SQL/JS. **Nenhum** `UPDATE/INSERT/DELETE/DROP`, migration, deploy, push ou escrita.
- **Limitações:** não acessei o banco de produção (não rodei SQL contra prod); estado real das tabelas mg_* (018–021) **não confirmado** — inferido do repo. Valores de env vêm do inventário **mascarado** (não abri o full). Não medi cobertura de testes numérica (só contei arquivos).
- **Exigem validação humana:** (1) tabelas prepaid/packages/loyalty/anamnese existem em prod? (2) backup automático existe e restaura? (3) decisão de ligar WhatsApp/e-mail reais; (4) retomar rotação de secrets.

---

## Resumo executivo de 10 linhas (cliente/investidor)
1. MultGestor é uma plataforma SaaS de gestão para negócios de serviço, começando pelo **BarberGestor** (barbearias).
2. Entrega **agenda, agendamento online, clientes/CRM, caixa, vendas, comissões e relatórios** num sistema multi-tenant real.
3. Arquitetura **modular** pensada para multi-nicho (Clima/Pet/Auto/Agro) reusando o mesmo núcleo.
4. Backend Node/Express robusto com **eventos duráveis (outbox)**, billing (Kiwify/Pix) e camada de integrações.
5. Frontend React moderno com design-system próprio e fluxos separados de dono e de cliente final.
6. Já roda em **produção** (Render + Vercel + Supabase) com health-checks e métricas.
7. Diferencial comercial imediato: **agendamento online + lembrete por WhatsApp** (reduz faltas — dor cara do setor).
8. Hoje em fase de **piloto controlado**; falta ativar notificações reais e validar o fluxo ponta-a-ponta.
9. Caminho para receita é curto (~30–45 dias): ligar canais, testar pagamento e backup, e cobrar **R$ 49–99/mês** por unidade.
10. Visão: tornar-se o **sistema operacional de pequenos negócios de serviço no Brasil**, multi-nicho e orientado a automação.

---

## Follow-ups registrados (decisões humanas pós-auditoria)
- **Auditoria APROVADA** pelo humano em 2026-06-15.
- Antes de executar `e2e-public-booking-validation`, o humano quer avaliar um mini-gate **`BACKUP-RESTORE-CHECK`** em modo **PLAN_ONLY** (backup/restore é P0 operacional — item #1 da matriz). Ver §10 e §15.

Relacionado: [[project-state]] · [[capabilities-map]] · [[lessons-learned]] · [[security-secrets-rotation]]
