# 🧱 MATRIZ DE CONSOLIDAÇÃO DO CORE — MultGestor

> **Tipo:** documento canônico factual. Fonte única da consolidação do Core.
> **Criado:** 2026-07-16 · **Missão:** 12.1A · **Modo:** READ_ONLY sobre código, testes, banco, CI, infra e produção.
> **Revisão 1 — 2026-07-16 (OPS-MIGRATIONS-01):** bloco DATAOPS reclassificado com autorização humana. `DATAOPS-002` → `NÃO_COMPROVADO`; `DATAOPS-001` → job existe mas **não é bloqueante**; risco de drift registrado. Relatório: [[../../auditorias/multgestor/2026-07-16-ops-migrations-01]].
> **Revisão 3 — 2026-07-20 (OPS-MIGRATIONS-03D):** ✅ **MECANISMO CRIADO E COMPROVADO.** `DATAOPS-002` → **`ATIVO_AUTOMATICO_COMPROVADO`**; `DATAOPS-001` → **gate bloqueante ativo**. Migrations de produção agora são automáticas, bloqueantes, estritas, idempotentes e reversíveis (`buildCommand = npm install && npm run migrate:prod`). Backlog `ops/migrations-02-evidencia-painel` **encerrado**. Evidências: [[../../brain/plans/OPS-MIGRATIONS-03D-plano]] § ENCERRAMENTO.
>
> **Revisão 2 — 2026-07-16 (verificação humana):** ✅ **INCÓGNITA FECHADA.** `DATAOPS-002` → **`AUSENTE` confirmado** (o Render **não** roda migration; a afirmação de `deploy.yml:43` é **falsa**). **Drift MENSURADO = ZERO** (banco alinhado até `031`) — mas por **ação manual**, não por processo: as **5 camadas** que deveriam garantir aplicação estão **todas ausentes**. Próxima missão → **`OPS-MIGRATIONS-03`** ([[../../brain/plans/OPS-MIGRATIONS-03-plano]]). Baseline **inalterado** (`4c8ce847`); nenhum código, workflow, banco, Render ou secret tocado.
> **Autoridade:** ver [[../../areas/governanca/fonte-unica-verdade]]. Em conflito com qualquer outro documento sobre o **estado do Core**, esta matriz prevalece.
> **Regra de honestidade:** documento é pista; só código, teste, CI, telemetria ou comportamento observado elevam o nível de comprovação. Ausência de evidência é registrada como ausência — nunca preenchida por inferência.

---

## ANEXO A — Baseline congelado

| Campo | Valor |
|---|---|
| **Data/hora (UTC)** | 2026-07-16T16:18:01Z |
| **Repositório** | `C:/MultGestor.v2` |
| **Branch** | `main` |
| **HEAD** | `4c8ce8470634a6d3fc1b91f8341ed912f845c0e9` |
| **HEAD (data/assunto)** | 2026-07-14T10:44:04-04:00 · "Merge pull request #46 from JoeGestorpro/fix/nodemailer-security-upgrade" |
| **origin/main** | `4c8ce8470634a6d3fc1b91f8341ed912f845c0e9` (idêntico ao HEAD) |
| **Ahead / Behind** | **0 / 0** — sincronizada |
| **Stashes** | **nenhum** (`git stash list` vazio) |
| **PRs abertas** | **0** (`gh pr list --state open --json` → `[]`; autenticado como `JoeGestorpro`) |

**Modificados (rastreados) — todos documentais:**
- `.opencodex/projetos/multgestor/indice.md`
- `.opencodex/projetos/multgestor/roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR.md`

**Untracked:** `.opencode/plans/` · `.opencodex/maps/` · `.opencodex/projetos/multgestor/incidentes/INC-004-exposicao-credencial-runtime-scratch.md` · `.opencodex/projetos/multgestor/roadmap/capacidades.md` · `.opencodex/projetos/multgestor/roadmap/roadmap/`

**Worktrees:**
| Caminho | Commit | Branch |
|---|---|---|
| `C:/MultGestor.v2` | `4c8ce84` | `main` |
| `C:/mg-governanca` | `4c8ce84` | `chore/governanca-fluxo-codigo` |
| `C:/mg-preservacao` | `3c60918` | `recovery/bancada-cleanup-2026-07-12` |

**Desvio durante a auditoria:** nenhum. O `git status` ao final é idêntico ao baseline (verificado após a execução da suíte de testes). Todas as conclusões valem para `4c8ce847`.

---

## ANEXO B — Metodologia e limitações

### Comandos de evidência efetivamente executados

| Evidência | Comando | Resultado |
|---|---|---|
| Baseline Git | `git rev-parse HEAD` · `git rev-list --count` | `4c8ce847`; 0/0 |
| PRs remotas | `gh pr list --state open --json ...` | `[]` (0 abertas) |
| Testes unitários | `NODE_ENV=test JWT_SECRET=… npx jest --testPathPatterns=tests/unit --silent` | **53 suítes / 765 testes — 100% passando**, 19,6s (local, 2026-07-16) |
| Invariante I-1 | `grep -rn "barber_\|clima_" backend/src/shared/` | **1 ocorrência** |
| Acoplamento A7 | `grep -c "barber_" services/booking-*.service.js` | 59 e 32 (**91 total**) |
| Cobertura RLS | `grep -rhoiE "CREATE POLICY … ON …" src/database/*.sql` | **40 tabelas com policy** |
| Tabelas totais | `grep -rhoiE "CREATE TABLE …" src/database/*.sql` | 57 (inclui artefatos de parsing) |

### Limitações desta auditoria — leia antes de usar a matriz

| # | Limitação | Consequência |
|---|---|---|
| **L-1** | **Produção NÃO foi verificada.** O MCP Supabase respondeu `Unauthorized. Please provide a valid access token` — nenhuma consulta ao banco de produção foi possível. | **Nenhuma linha desta matriz atinge `COMPROVADO EM PRODUÇÃO` por verificação própria.** Onde produção é citada, a fonte é documental e está marcada como tal. |
| **L-2** | **CI não foi executado nesta auditoria.** Evidência de CI vem da leitura de `.github/workflows/ci.yml` (o que o pipeline *declara* executar), não de um run observado. | `VALIDADO EM CI` significa "o CI declara e está configurado para provar", não "vi o run verde". |
| **L-3** | **Testes de integração não foram executados localmente** (exigem Postgres + Redis + role `app_runtime`). Só a suíte unitária rodou. | Cobertura de integração é inferida do CI (L-2). |
| **L-4** | **Cobertura de RLS medida por migrations, não pelo banco.** Migrations 027/028 declaram "Já possui RLS habilitado" — ou seja, houve `ENABLE` **fora** dos arquivos versionados. | O número real em prod pode divergir. Contar `ENABLE` subestima; por isso a métrica adotada é **policy por tabela**. |
| **L-5** | **Configuração do Render não é inspecionável** a partir do repositório (sem `render.yaml`/`Procfile`). 🔄 **Confirmado e agravado pela OPS-MIGRATIONS-01 (2026-07-16):** painel e logs também são inacessíveis ao agente (`list_connected_browsers` → `[]`; login vedado; CLI ausente). | ~~A afirmação de que o Render aplica migrations em runtime **permanece `NÃO_COMPROVADO`**. **Só um humano resolve**.~~ ✅ **SUPERADO em 2026-07-20:** o MCP do Render passou a expor a configuração ao agente, e a 03D leu, alterou e comprovou o `buildCommand` por API. A limitação de **não-versionamento** da config persiste (segue sem `render.yaml`), mas ela **deixou de ser inspecionável apenas por humano**. Ver `DATAOPS-002`. |
| **L-6** | **Nenhum secret foi lido.** `backend/check-rls.js` e `check-rls2.js` existem localmente e **não foram abertos** por risco de conter credencial (INC-004). | Conteúdo desses arquivos permanece não auditado, por decisão deliberada. |

### Estados e evidência

Estados: `NÃO EXISTE` · `EXISTE PARCIALMENTE` · `EXISTE MAS PRECISA REESTRUTURAÇÃO` · `EXISTE E PRECISA VALIDAÇÃO` · `CONCLUÍDA`

Progressão: `DOCUMENTADO → IMPLEMENTADO → VALIDADO LOCAL → VALIDADO EM CI → COMPROVADO EM PRODUÇÃO`

`CONCLUÍDA` exige implementação real + posicionamento arquitetural correto + DoD integral + ausência de lacuna crítica + testes proporcionais ao risco + evidência referenciada + nenhuma divergência invalidante. **`CONCLUÍDA` não implica produção**; o DoD individual define o nível mínimo de evidência.

---

## MATRIZ DE CAPACIDADES

> Todas as linhas: Lifecycle `ACTIVE`, salvo indicação. Evidência ancorada em `4c8ce847`.

### Bloco IDENT — Identidade e autenticação

#### `IDENT-001` — Autenticação JWT com escopos
- **Bloco:** IDENT · **Responsabilidade:** CORE · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `VALIDADO EM CI`
- **Proveniência:** `backend/src/middlewares/auth.middleware.js` (símbolos `requireAuth`, `requireBackofficeAuth`, `requireMasterAdminAuth`, `inferAuthScope`) · `backend/src/shared/core/auth/roles.js` · suíte unitária 765/765 (local, 2026-07-16) · commit `4c8ce847`
- **Lacuna:** o escopo emitido é literalmente `'barber_admin'` (`roles.js:17`) — **único auth_scope de tenant-admin do sistema**. Ver `IDENT-002`.
- **Dependências:** — · **Bloqueadores:** `IDENT-002` (P2)
- **DoD:** escopos por módulo emitidos e validados; nenhum nome de nicho no scope. **Não atendido.**
- **Próxima ação:** coberto por `IDENT-002`.

#### `IDENT-002` — Escopo de auth genérico por módulo
- **Bloco:** IDENT · **Responsabilidade:** CORE · **Estado:** `EXISTE PARCIALMENTE` · **Evidência:** `IMPLEMENTADO` (alias apenas)
- **Proveniência:** `backend/src/middlewares/auth.middleware.js:128` → `const requireTenantAdminAuth = requireBarberAdminAuth;` · comentário no código (`:121-127`): *"Alias genérico: hoje 'barber_admin' é o único auth_scope emitido… Quando o sistema emitir auth_scope por módulo, só este alias muda."* · commit `ae31b65` "fix(core): close 4 core-x-nicho coupling findings from p0 audit" (2026-07-03, **confirmado em `main`** via `git merge-base --is-ancestor`)
- **Lacuna:** **o alias é a mesma função.** `clima.routes.js:15` usa `requireTenantAdminAuth`, que resolve para `requireBarberAdminAuth` e exige scope `barber_admin`. O desacoplamento é **nominal, não funcional** — e o próprio código declara isso.
- **Dependências:** `IDENT-001`, `ACCESS-001` · **Bloqueadores:** — · **Severidade:** **P2** (contorno controlado: funciona porque `barber_admin` é o único scope de tenant-admin; não há vazamento entre tenants)
- **DoD:** `auth_scope` emitido por módulo; `requireTenantAdminAuth` deixa de ser alias de uma função com nome de nicho; teste prova negação cross-módulo.
- **Próxima ação:** missão candidata (não é a próxima — ver §Próxima Missão).

> **⚠️ DIVERGÊNCIA D-01 (registrada em ANEXO E):** `capacidades.md` afirma que `clima.routes.js` usa `requireBarberAdminAuth` **"por engano"**. **Factualmente incorreto em dois pontos:** (1) a rota usa `requireTenantAdminAuth` desde `ae31b65`; (2) o acoplamento remanescente é **deliberado e documentado no código**, não um engano. O achado permanece válido em substância (o alias é a mesma função), mas a severidade cai de "bug de autorização" para **débito de acoplamento P2**.

#### `IDENT-003` — Rotação de refresh token e revogação server-side
- **Bloco:** IDENT · **Responsabilidade:** CORE · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `VALIDADO EM CI`
- **Proveniência:** `backend/src/database/20260702_030_refresh_tokens.sql` (tabela `refresh_tokens`, colunas `revoked_at`/`replaced_by`) · `backend/tests/integration/refresh-token-rotation.test.js` (executado pelo job `integration-tests` do CI) · `backend/src/jobs/refresh-token-purge-job.js` · commit `f03af4d` "fix(security): rotate refresh tokens and revoke sessions on logout"
- **Lacuna:** comportamento em produção não verificado (L-1).
- **DoD:** rotação + revogação provadas em CI. **Atendido em CI**; produção não verificada.
- **Próxima ação:** nenhuma para o marco v1.

### Bloco TENANT — Isolamento multi-tenant

#### `TENANT-001` — Contexto de tenant por request (ALS)
- **Bloco:** TENANT · **Responsabilidade:** CORE · **Estado:** `CONCLUÍDA` · **Evidência:** `VALIDADO EM CI`
- **Proveniência:** `backend/src/shared/tenant/{tenant-context.js,middleware.js,guards.js,index.js}` · `backend/src/middlewares/requireCompany.js:44-54` (abre `poolTenant`, `BEGIN`, `SELECT set_config('app.current_company_id', …, true)` — GUC **transaction-local**) · `backend/tests/integration/gate0-als-context-leak.test.js` · `tenant-isolation.test.js` · CI job `integration-tests` (`ci.yml`) · commit `4c8ce847`
- **Lacuna:** nenhuma para o marco v1.
- **Dependências:** `TENANT-002` · **Bloqueadores:** —
- **DoD:** todo request com tenant carrega contexto isolado; teste prova ausência de vazamento entre contextos (ALS). **Atendido.**

#### `TENANT-002` — Enforcement de RLS em runtime (role NOBYPASSRLS)
- **Bloco:** TENANT · **Responsabilidade:** CORE · **Estado:** `CONCLUÍDA` · **Evidência:** `VALIDADO EM CI`
- **Proveniência:** `backend/src/config/database.js:126-150` (`tenantAwareConnect` substitui `pool.connect`: com contexto tenant → `poolTenant`; sem contexto → pool privilegiado, **por design**, documentado) · `requireCompany.js:44` (`pool.poolTenant.connect()`) · `ci.yml` cria role real: `CREATE ROLE app_runtime … NOBYPASSRLS` + `APP_RUNTIME_URL` no job de integração · testes `tenant-isolation-rls.test.js`, `gate0-pool-paths.test.js`, `gate0-runtime-check.test.js` · commits `aeed31c` (PR #20, ativação) e `02c5396` "route tenant writes through app_runtime pool" (2026-07-02, **em `main`**)
- **Lacuna:** produção não verificada nesta auditoria (L-1).
- **Kill-switch:** remover `APP_RUNTIME_URL` → `poolTenant` cai em `DATABASE_URL`.
- **DoD:** writes e reads de tenant passam por role sem BYPASSRLS, provado em CI com role real. **Atendido.**

> **⚠️ DIVERGÊNCIA D-02:** `capacidades.md` (2026-07-03) afirma RLS *"🟡 ENABLE, **inerte em runtime**. Runtime usa role com BYPASSRLS"*. **Factualmente falso** desde `02c5396` (2026-07-02) — um dia antes daquele documento. A doc canônica **subestima a própria segurança do produto**.

#### `TENANT-003` — Cobertura de policies RLS
- **Bloco:** TENANT · **Responsabilidade:** CORE · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `IMPLEMENTADO` (código); **prod `NÃO_VERIFICADO`**
- **Proveniência:** `backend/src/database/*.sql` — **40 tabelas com `CREATE POLICY`** (`grep -rhoiE "CREATE POLICY … ON …"`, 2026-07-16). Inclui `companies` e `users` (`rls_companies_users.sql:9,14,25,30,35` e `20260624_024_rls_companies_users.sql:14,20,33,39`). `refresh_tokens`: RLS **ENABLE sem policy** = default DENY para `app_runtime` — **intencional e documentado** (`20260702_030_refresh_tokens.sql:5-7`: *"RLS habilitado SEM policies = app_runtime não enxerga nada (defesa em profundidade)"*). `modules`: policy de leitura irrestrita (catálogo sem `company_id`), INSERT/UPDATE/DELETE em DENY (`027`).
- **Lacuna:** **contagem real em produção desconhecida (L-1, L-4).** Migrations 027/028 revelam que houve `ENABLE` fora dos arquivos versionados → o repositório **não é fonte completa** do estado de RLS.
- **Dependências:** `TENANT-002` · **Bloqueadores:** `DATAOPS-001` (P1) · **Severidade da lacuna:** **P2**
- **DoD:** inventário tabela-a-tabela **consultado no banco** (não em migrations), com cada tabela sem policy tendo justificativa escrita.
- **Próxima ação:** auditoria adicional — requer acesso read-only ao banco (hoje indisponível).

> **⚠️ DIVERGÊNCIA D-03:** `capacidades.md` e `painel-executivo.md` afirmam **"RLS 23/27 tabelas — companies e users sem policy"**. **Ambos os números e a exceção estão factualmente incorretos**: há 40 tabelas com policy nas migrations, e `companies`/`users` **têm** policies desde a migration 024 (2026-06-24).

### Bloco ACCESS — Autorização e módulos

#### `ACCESS-001` — Guard de módulo por empresa (factory genérica)
- **Bloco:** ACCESS · **Responsabilidade:** CORE · **Estado:** `CONCLUÍDA` · **Evidência:** `VALIDADO LOCAL`
- **Proveniência:** `backend/src/middlewares/createModuleGuard.js` — factory `createModuleGuard(moduleSlug, displayName)`, **sem vocabulário de nicho**, consulta `company_modules ⋈ modules` por slug, com cache (TTL 5min) e invalidação (`invalidateModuleCache`). Consumidores: `requireBarberModule.js` e `requireClimaModule.js` (`createModuleGuard('clima', 'ClimaGestor')`). Suíte unitária 765/765.
- **Lacuna:** nenhuma. **Esta é a peça de kit de nicho mais bem executada do Core** — dois consumidores reais, contrato explícito, zero acoplamento.
- **DoD:** qualquer módulo novo obtém guard sem tocar o Core. **Atendido.**

#### `ACCESS-002` — Papéis e permissões
- **Bloco:** ACCESS · **Responsabilidade:** COMPARTILHADA · **Estado:** `EXISTE PARCIALMENTE` · **Evidência:** `IMPLEMENTADO`
- **Proveniência:** `backend/src/shared/core/auth/roles.js` (`BARBER_ADMIN_ROLES = ['admin','owner','collaborator']`, `BOOKING_CUSTOMER_ROLES`, `MASTER_ROLES`)
- **Lacuna:** a constante que define papéis de tenant-admin chama-se `BARBER_ADMIN_ROLES` e retorna o scope `'barber_admin'` — **é a única violação do invariante I-1 dentro de `shared/`** (`grep` → 1 ocorrência, `roles.js:17`).
- **Bloqueadores:** — · **Severidade:** **P3** (cosmético/nominal; sem impacto funcional)
- **DoD:** nomenclatura de papéis neutra quanto a nicho.

### Bloco COMPANY — Empresa e ciclo de vida

#### `COMPANY-001` — Cadastro e gestão de empresa
- **Bloco:** COMPANY · **Responsabilidade:** CORE · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `VALIDADO LOCAL`
- **Proveniência:** `backend/src/services/company.service.js` · `company-plan.service.js` (**0 ocorrências de `barber`** — verificado por `grep -c`) · `backend/tests/unit/company-service.test.js` · commit `ae31b65` (reduziu `company.service.js` em 51 linhas ao remover acoplamento)
- **Lacuna:** produção não verificada (L-1).
- **DoD:** ciclo de vida da empresa sem vocabulário de nicho. **Atendido no código.**

### Bloco BILLING — Cobrança e assinatura

#### `BILLING-001` — Camada de billing com providers plugáveis
- **Bloco:** BILLING · **Responsabilidade:** CORE · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `VALIDADO LOCAL`
- **Proveniência:** `backend/src/shared/capabilities/billing/` — `billing-manager.js`, `contracts.js`, `payment-provider.js`, `provider-registry.js`, `providers/{abacatepay,kiwify}.provider.js`. **`grep -rn "barber" shared/capabilities/billing/` → 0 ocorrências.** Consumo transacional: `integrations/consumers/billing-provisioning.consumer.js`. Suíte unitária 765/765.
- **Lacuna:** **ativação em produção não comprovada** (L-1). Config de produção (planos/produtos Kiwify, `VITE_KIWIFY_URL_*`) é pendência declarada (D-016) — **não verificável a partir do repositório**.
- **Dependências:** `EVENT-002`, `FEATURE-001` · **Bloqueadores:** — · **Severidade:** **P2**
- **DoD:** webhook → ativação de plano → liberação de recurso, comprovado ponta a ponta **em produção**.
- **Próxima ação:** ver §Próxima Missão (candidata).

#### `BILLING-002` — Webhooks de pagamento
- **Bloco:** BILLING · **Responsabilidade:** CORE · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `IMPLEMENTADO`
- **Proveniência:** `backend/src/routes/webhooks.routes.js` · `controllers/webhooks.controller.js` · `services/webhooks/` · `integrations/webhooks/` · tabela `payment_gateway_events` (`master-finance.sql`)
- **Lacuna:** `payment_gateway_events` **sem policy RLS** (tabela de gateway, provavelmente acessada por pool privilegiado — **não confirmado**). Proteção de rota do webhook não auditada nesta missão.
- **Severidade:** **P2**
- **DoD:** webhook idempotente, com verificação de assinatura e proteção de abuso documentada.

### Bloco FEATURE — Entitlement e gating

#### `FEATURE-001` — Gating de recurso por plano
- **Bloco:** FEATURE · **Responsabilidade:** CORE · **Estado:** `CONCLUÍDA` · **Evidência:** `VALIDADO LOCAL`
- **Proveniência:** `backend/src/middlewares/requirePlanFeature.js` (`requirePlanFeature(featureKey)` → `canUsePlanFeature(planType, featureKey)`) · `backend/src/utils/planFeatures.js` — chaves **genéricas**: `collaborators`, `advanced_reports`, `financial_dashboard`, `extra_permissions`, `advanced_schedule`, `future_modules`; planos `trial|free|essencial|profissional|premium`. `middlewares/requireActivePlan.js`. Suíte unitária 765/765.
- **Lacuna:** nenhuma quanto a vocabulário.
- **DoD:** gating expresso em capacidades genéricas, sem vocabulário de nicho. **Atendido.**

> **⚠️ DIVERGÊNCIA D-04:** `capacidades.md` afirma *"gating de plano ainda com vocabulário do barber"*. **Factualmente falso.** As feature keys já são genéricas (`planFeatures.js`), `shared/capabilities/billing/` tem 0 ocorrências de `barber` e `company-plan.service.js` também. **Esta divergência invalida a recomendação, derivada dela, de "tornar o gating genérico antes da Fase 6"** — esse trabalho já está feito.

### Bloco API — Superfície HTTP

#### `API-001` — Roteamento e verticalização
- **Bloco:** API · **Responsabilidade:** COMPARTILHADA · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `IMPLEMENTADO`
- **Proveniência:** `backend/src/routes/` — 12 arquivos (`auth`, `barber`, `barber-ai`, `booking-auth`, `client`, `clima`, `integration`, `internal`, `master`, `public-auth`, `public-booking`, `webhooks`) · `controllers/barber/` (22 controllers) · `controllers/clima/` (1)
- **Lacuna:** proteção de rota (abuso/custo/rate limit/limite por tenant) **não auditada rota-a-rota** nesta missão.
- **Severidade:** **P2** · **Próxima ação:** auditoria adicional (R-003).

#### `API-002` — Rate limiting
- **Bloco:** API · **Responsabilidade:** CORE · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `VALIDADO LOCAL`
- **Proveniência:** `backend/src/middlewares/rate-limit.middleware.js` — `createRateLimit(options)`; **degrada para memória** quando o Redis está indisponível (`:32` — *"degradado para memória — Redis indisponível"*); **fail-open apenas em erro inesperado** (`:52-54` — *"DECISÃO: fail-open — disponibilidade > limite estrito sob falha de Redis"*). Suíte unitária 765/765.
- **Lacuna:** o degradê para memória é **por instância** — em múltiplas instâncias o limite efetivo multiplica pelo número de réplicas. Não verificado quantas réplicas rodam em produção (L-1).
- **Severidade:** **P3**
- **DoD:** limite eficaz sob falha de Redis, com comportamento documentado por rota crítica.

### Bloco DOMAIN — Domínio compartilhável

#### `DOMAIN-001` — Booking Engine (utilitários puros)
- **Bloco:** DOMAIN · **Responsabilidade:** CORE · **Estado:** `CONCLUÍDA` · **Evidência:** `VALIDADO LOCAL`
- **Proveniência:** `backend/src/shared/capabilities/booking-engine/{index.js,scheduling-utils.js}` · **0 ocorrências de `barber_`/`clima_`** no diretório · suíte unitária 765/765
- **DoD:** funções puras reutilizáveis, sem vocabulário de nicho. **Atendido.**

#### `DOMAIN-002` — Booking Engine (serviços com estado) · ✅ **DECIDIDO E IMPLEMENTADO**
- **Bloco:** DOMAIN · **Responsabilidade:** NICHO (decidido) · **Estado:** ✅ **`REBAIXADO — CONCLUÍDO`** · **Evidência:** `COMPROVADO EM PRODUÇÃO`

> ✅ **RESOLVIDO em 2026-07-20.** [[ADR-008-booking-engine-formalizacao]] (formaliza [[ADR-007-booking-engine]], Opção A) decidiu **rebaixar**. Implementado: `services/booking-appointments.service.js` e `services/booking-scheduling.service.js` → `services/barber/` (PR #67, commit `4af95aa`, produção saudável). `scheduling-utils.js` permanece no Core — é o único código genuinamente compartilhado (0 ocorrências `barber_`/`clima_`).
>
> **Achado novo da auditoria de formalização:** existem **duas trilhas paralelas** de criação de agendamento dentro do próprio BarberGestor — `AppointmentService`/`AppointmentRepository` (staff, com eventos) e `client-booking.service.js`/`booking-appointments.service.js` (público, SQL cru). Não muda esta decisão; registrado como próxima missão técnica (`DOMAIN-002B`).
>
> **Reposicionamento estratégico ([[ADR-009-booking-engine-reposicionamento-estrategico]]), 2026-07-20:** o rebaixamento acima **não muda** — mas não deve ser lido como "booking pertence permanentemente ao nicho". O destino arquitetural de longo prazo é uma **Booking Capability genérica no Core**, com o BarberGestor como primeiro adapter/validador, não como autoridade do domínio. Nenhuma extração autorizada agora; orienta o planejamento futuro de `DOMAIN-002B` e `NICHEKIT-001`.
>
> **Definição arquitetural concluída ([[../core/booking/CORE-BOOKING-001-capability-spec]]), 2026-07-20:** a Booking Capability do Core está agora **especificada** (glossário, modelo de domínio, invariantes, contratos, catálogo de eventos, fronteira Core/adapter, estratégia de testes e mapa de transição do legado) — ainda **não implementada**. O inventário desta missão confirmou, com evidência de código, as duas trilhas paralelas descritas acima e um achado novo, mais crítico: a **trilha pública/cliente usa o pool sem RLS ativo** (`pool.connect()` fora de `requireCompany`), dependendo só de `WHERE company_id` manual — reclassificado como risco `SUBSTITUIR`/**Crítico** no mapa de transição, independente do cronograma de consolidação arquitetural.

- **Proveniência:** `backend/src/services/barber/booking-appointments.service.js` — 59 ocorrências de `barber_` (revalidado 2026-07-20) · `booking-scheduling.service.js` — 32 · `repositories/appointment.repository.js` — **40** (achado novo — não capturado em 16/07) · auditoria `.opencodex/audits/2026-07-03-core-vs-nicho-audit` (A7) · [[../../../auditorias/multgestor/2026-07-20-domain-002-booking-engine]] (evidência completa)
- **Dependências:** `DOMAIN-001` (concluída) · **Bloqueadores:** — · **Severidade:** ~~P1~~ **resolvida**
- **DoD:** ✅ **ATENDIDO** — decisão registrada em ADR (dupla: 007 + 008), implementada, comprovada em produção.
- **Próxima ação:** `DOMAIN-002B` — consolidar as duas trilhas de criação de agendamento e cobrir com testes de conflito/concorrência (ver ADR-008 § Próximas ações). `NICHEKIT-001` foi reconciliado (ver bloco abaixo) para não prometer "motor compartilhado" antes da hora, mas também para não descartar a Booking Capability como destino — ver [[../core/booking/CORE-BOOKING-001-transition-map]] para a sequência completa (`CORE-BOOKING-002` a `CORE-BOOKING-CLOSEOUT`).

> **✅ CONVERGÊNCIA (16/07, ainda válida):** a alegação de "59+ `barber_*`" em `capacidades.md` foi confirmada com precisão. Revalidada novamente em 20/07 nos mesmos números.

### Bloco EVENT — Eventos e entrega durável

#### `EVENT-001` — Contratos de evento + factory
- **Bloco:** EVENT · **Responsabilidade:** CORE · **Estado:** `CONCLUÍDA` · **Evidência:** `VALIDADO LOCAL`
- **Proveniência:** `backend/src/shared/core/events/contracts.js:129` (`validateEventPayload`) · `factories/appointment-events.js` · `event-bus.js` · `consumers.js` · suíte unitária 765/765 · commits `50a64dd`, `bc8e6f8`
- **Lacuna:** existe **apenas uma factory** (`appointment-events`). Eventos de outros domínios (wallet, billing, loyalty) não têm factory equivalente.
- **Severidade:** **P3** · **DoD:** todo evento publicado nasce de factory com contrato validado.

#### `EVENT-002` — Outbox transacional
- **Bloco:** EVENT · **Responsabilidade:** CORE · **Estado:** `CONCLUÍDA` · **Evidência:** `VALIDADO EM CI`
- **Proveniência:** `backend/src/shared/core/database/unit-of-work.js` · `shared/core/outbox/outbox-worker.js` (`register()` **exige handler nomeado** — `:14-17`, lança erro se `handler.name` vazio) · `backend/src/database/{outbox.sql,outbox_message_handlers.sql}` (idempotência por handler) · `backend/tests/integration/outbox-durability.test.js` (job `integration-tests` do CI) · 7 consumers em `integrations/consumers/`
- **Lacuna:** `outbox_messages` e `outbox_message_handlers` **sem policy RLS** — presumivelmente acessadas por pool privilegiado (**não confirmado**). Issue #35 (teardown flaky) referenciada como resolvida por `d0a08f0`.
- **Severidade:** **P3**
- **DoD:** escrita relevante é transacional e idempotente, provada em CI. **Atendido.**

### Bloco NOTIFY — Notificação e canais

#### `NOTIFY-001` — WhatsApp (Meta Cloud API) por tenant
- **Bloco:** NOTIFY · **Responsabilidade:** CORE · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `IMPLEMENTADO`
- **Proveniência:** `backend/src/integrations/whatsapp/` · `integrations/consumers/appointment-integration.consumer.js` · `integrations/config/encryption.js` (AES-256-GCM) · tabela `integration_configs` (**com policy RLS**)
- **Lacuna:** entrega real em produção não verificada (L-1). Onboarding de credenciais por tenant é pendência declarada (fase7) — não verificável no repo.
- **Severidade:** **P2**

#### `NOTIFY-002` — E-mail transacional e sequência de trial
- **Bloco:** NOTIFY · **Responsabilidade:** CORE · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `VALIDADO LOCAL`
- **Proveniência:** `backend/src/services/email/` · `providers/email/` · `templates/email/` · `services/trial-emails.service.js` · `jobs/trial-email-job.js` · tabela `trial_email_log` · commit `dce7efd` (nodemailer 8.x→9.0.3, GHSA-p6gq-j5cr-w38f)
- **Lacuna:** `trial_email_log` sem policy RLS (não confirmado se é por design).

#### `NOTIFY-003` — Job de lembrete de agendamento
- **Bloco:** NOTIFY · **Responsabilidade:** NICHO (barber) · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `IMPLEMENTADO`
- **Proveniência:** `backend/src/jobs/appointment-reminder-job.js` · coluna `reminder_sent_at` (`barber_appointments_reminder.sql`) · padrão mark-before-emit (idempotente)
- **Lacuna:** opera sobre `barber_appointments` — é capacidade de nicho hospedada em `jobs/` do Core. **P3**.

### Bloco AUDIT — Trilha de auditoria

#### `AUDIT-001` — Logs de auditoria
- **Bloco:** AUDIT · **Responsabilidade:** COMPARTILHADA · **Estado:** `EXISTE PARCIALMENTE` · **Evidência:** `IMPLEMENTADO`
- **Proveniência:** tabelas `audit_logs`, `auth_audit_logs`, `barber_audit_logs` (`*.sql`) · consumo em `services/auth.service.js`, `services/barber.service.js`, `repositories/cash-session.repository.js`
- **Lacuna:** **três tabelas de auditoria distintas**, nenhuma com policy RLS; sem capacidade de auditoria unificada no Core; `barber_audit_logs` é específica de nicho. Não há evidência de política de retenção.
- **Severidade:** **P3** · **DoD:** trilha de auditoria unificada, com isolamento e retenção definidos.

### Bloco FILES — Arquivos e mídia

#### `FILES-001` — Upload e armazenamento de mídia
- **Bloco:** FILES · **Responsabilidade:** CORE · **Estado:** `EXISTE PARCIALMENTE` · **Evidência:** `IMPLEMENTADO`
- **Proveniência:** referências a upload/storage em `controllers/barber/company.js`, `routes/barber.routes.js`, `server.js`, `services/branding.service.js` · `config/supabase.js`
- **Lacuna:** **não existe capacidade de arquivos no Core** (`shared/` não tem módulo de storage). A lógica está dispersa em rotas/serviços do nicho barber. Limites, tipos permitidos e antivírus não auditados.
- **Severidade:** **P3** (P2 se houver upload público sem limite — **não verificado**)
- **Próxima ação:** auditoria adicional focada em superfície de upload.

### Bloco CONFIG — Configuração e pools

#### `CONFIG-001` — Pools de banco e roteamento tenant-aware
- **Bloco:** CONFIG · **Responsabilidade:** CORE · **Estado:** `CONCLUÍDA` · **Evidência:** `VALIDADO EM CI`
- **Proveniência:** `backend/src/config/database.js` — `pool`, `poolTenant`, `runWithTenantClient`, `tenantAwareConnect` (`:129`); timeouts configuráveis (`TENANT_STATEMENT_TIMEOUT_MS` 30s, `TENANT_IDLE_TXN_TIMEOUT_MS` 60s em `requireCompany.js:8-9`) · `gate0-pool-paths.test.js` (CI)
- **Lacuna:** nenhuma para o marco v1.

### Bloco SEC — Segurança aplicada

#### `SEC-001` — Higiene de credenciais no repositório
- **Bloco:** SEC · **Responsabilidade:** CORE · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `VALIDADO LOCAL`
- **Proveniência:** `backend/check-rls.js` e `backend/check-rls2.js` existem **no disco local**; `git ls-files` → **não rastreados**; `git check-ignore -v` → **`.gitignore:112` `backend/check-rls*.js`**; `git status --porcelain` → não aparecem. Incidente `INC-004-exposicao-credencial-runtime-scratch`.
- **Lacuna:** **conteúdo desses arquivos NÃO foi lido** (decisão deliberada, L-6). Débito de redação declarado (project-ref de prod em docs pré-existentes) **não reauditado** nesta missão.
- **Severidade:** **P3** (exposição no Git contida; risco local remanescente não avaliado)
- **DoD:** nenhum artefato com credencial no working tree, rastreado ou não.

#### `SEC-002` — Hardening de XSS na entrada
- **Bloco:** SEC · **Responsabilidade:** CORE · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `VALIDADO EM CI`
- **Proveniência:** `backend/tests/integration/register-validation.test.js` (CI) · `shared/core/validation/` (Zod) · commit `b75d34a` (PR #6)
- **Lacuna:** ciclo declarado CLOSED em 2026-06-14 com evidência de banco de produção — **não reverificado** (L-1).

#### `SEC-003` — Auditoria de dependências
- **Bloco:** SEC · **Responsabilidade:** CORE · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `VALIDADO EM CI`
- **Proveniência:** `.github/workflows/security-audit.yml` — **`continue-on-error: true` nos passos `:23` e `:39`** (*"não bloqueia, apenas informa"*) · commit `dce7efd` (nodemailer → 9.0.3)
- **Lacuna:** o gate de segurança **não bloqueia**. Vulnerabilidade nova entra sem impedimento.
- **Severidade:** **P3** · **DoD:** severidade HIGH+ bloqueia merge.

### Bloco OBS — Observabilidade

#### `OBS-001` — Log estruturado e correlação
- **Bloco:** OBS · **Responsabilidade:** CORE · **Estado:** `CONCLUÍDA` · **Evidência:** `VALIDADO LOCAL`
- **Proveniência:** `backend/src/shared/core/logger/` (pino) · `middlewares/correlation-id.middleware.js` · `request-logger.middleware.js` · suíte unitária 765/765

#### `OBS-002` — Métricas e error tracking
- **Bloco:** OBS · **Responsabilidade:** CORE · **Estado:** `EXISTE PARCIALMENTE` · **Evidência:** `IMPLEMENTADO`
- **Proveniência:** `shared/core/monitoring/{metrics.js,sentry.js}` · `middlewares/metrics.middleware.js`
- **Lacuna:** **sem métricas de performance e sem slow query log**; nenhuma evidência de dashboard ou alerta. Baseline inexistente.
- **Severidade:** **P4** (aspiracional para o marco v1; vira P2 sob escala)

### Bloco DATAOPS — Operação de dados

> 🔄 **Bloco atualizado em 2026-07-16 pela missão OPS-MIGRATIONS-01** (READ_ONLY, mesmo baseline `4c8ce847`). Relatório: [[../../auditorias/multgestor/2026-07-16-ops-migrations-01]]. Reclassificação documental autorizada pelo humano; **nenhum código, workflow, banco, Render ou secret foi tocado**.
>
> ✅ **SUPERADO em 2026-07-20 pela OPS-MIGRATIONS-03D.** A transição:
>
> ```text
> Estado observado em 16/07/2026:
> migrations automáticas não comprovadas.
>
> Estado comprovado em 20/07/2026:
> migrations automáticas ativas, bloqueantes, estritas, idempotentes e reversíveis.
> ```
>
> O diagnóstico de 16/07 estava **correto** — a rede de segurança realmente não existia. Ela **foi criada**. Evidências: [[../../brain/plans/OPS-MIGRATIONS-03D-plano]] § ENCERRAMENTO. Os textos abaixo preservam o diagnóstico histórico; o estado canônico atual está marcado em cada capacidade.

#### `DATAOPS-001` — Gate de migrations no deploy · ✅ **BLOQUEANTE E ATIVO**
- **Bloco:** DATAOPS · **Responsabilidade:** CORE · **Estado:** ✅ **`EXISTE E FUNCIONA`** · **Evidência:** `COMPROVADO EM PRODUÇÃO` · **Severidade:** ~~P1~~ **resolvida**

> ✅ **RESOLVIDO em 2026-07-20 (OPS-MIGRATIONS-03D).** O gate bloqueante passou a existir no **Render**, não no GitHub:
> `buildCommand = npm install && npm run migrate:prod`. Migration que falha ⇒ build falha ⇒ deploy falha ⇒ **versão anterior permanece no ar**.
> Comprovado em 2 deploys: `endpoint dedicado=true`, `migrations pendentes: 0`, `Build successful`, saída idêntica (idempotência).
> O `continue-on-error` do `deploy.yml` **deixou de ser o mecanismo relevante** — o gate real vive no Render. A remoção daquele job segue como higiene pendente (GATE 9 do plano 03D).
>
> **Diagnóstico histórico preservado abaixo** (estado de 16/07/2026).
- **Fato central (OPS-MIGRATIONS-01):** **o job de migrations existe, mas não é bloqueante** — `continue-on-error: true` (`deploy.yml:48`) permite o fluxo seguir mesmo quando o `migrate` falha. O step é marcado `success` independentemente do resultado real.
- 🔄 **AGRAVANTE (verificação humana, 2026-07-16):** o débito **não é mais "aceito sobre premissa não comprovada"** — a premissa foi **confirmada FALSA** (`DATAOPS-002` = `AUSENTE`). **O Render não roda migrations e o CI não bloqueia**: hoje **nada** garante que uma migration futura chegue à produção antes do backend novo entrar no ar. O banco está alinhado (`031`) **por ação manual**, não por processo.
- **⚠️ A dependência `needs: run-migrations` é decorativa.** `deploy-backend` (`deploy.yml:63-65`) declara `needs: run-migrations`, mas como esse job **sempre** conclui como `success`, a dependência **nunca protege nada**. O deploy do backend prossegue com migrations falhas. É a **mesma classe de engano** que o commit `3b417a9` admite ter sofrido: *"O 'success' observado nos deploys anteriores era mascarado pelo próprio continue-on-error"*.
- **Proveniência:** `.github/workflows/deploy.yml:48` (`continue-on-error: true`) + justificativa `:40-47` (*"a conexao direta … so expoe IPv6 -> o runner do GitHub Actions nao alcanca (ENETUNREACH) -> migrate falha 100% (visto em 883e516)"*) · `deploy.yml:63-70` (`needs: run-migrations` + trigger por deploy hook `curl`) · `ci.yml`: `npm run migrate` roda **de verdade** contra Postgres 16 efêmero **sem** `continue-on-error` → **migrations são VALIDADAS em CI, não APLICADAS em prod pelo pipeline** · `backend/scripts/run-migrations.js` (tabela `schema_migrations`; 32 migrations `20251231_000`…`20260708_031`; idempotente por `version`; verificação de integridade exige `pin_reset_tokens`)
- **Lacuna:** migration que falha **não bloqueia o deploy**. Drift já escapou 2× (`022 outbox_message_handlers`, `023 reminder_sent_at`, aplicadas manualmente via MCP).
- **Dependências:** — · **Bloqueadores:** `DATAOPS-003` (P1) · **Premissa de aceitação comprometida por:** `DATAOPS-002` (`NÃO_COMPROVADO`)
- **⚠️ Regra vigente:** **NÃO alterar o `continue-on-error`** antes de confirmar que nenhum log/CI exibirá secrets (rotação de segredos **pausada por decisão humana** — `DATAOPS-003`).
- **DoD:** migration falha ⇒ deploy bloqueia; schema de prod == schema do repo, verificado.

#### `DATAOPS-002` — Aplicação de migrations em produção · ✅ **`ATIVO_AUTOMATICO_COMPROVADO`**
- **Bloco:** DATAOPS · **Responsabilidade:** CORE · **Estado:** ✅ **`EXISTE E FUNCIONA`** · **Evidência:** `COMPROVADO EM PRODUÇÃO` (2 deploys observados) · **Severidade:** ~~P1~~ **resolvida**

> ✅ **IMPLANTADO em 2026-07-20T03:07:34Z (OPS-MIGRATIONS-03D).**
>
> | Propriedade | Estado comprovado |
> |---|---|
> | Migrations de produção | **automáticas** — no `buildCommand` do Render |
> | Gate | **bloqueante** — falha impede o deploy |
> | Modo estrito | **ativo** (`--strict` via `migrate:prod`) |
> | Fallback para `DATABASE_URL` | **recusado** — `STRICT_REQUIRES_DEDICATED` antes de conectar |
> | Endpoint dedicado | **obrigatório** (`MIGRATION_DATABASE_URL`) |
> | Porta | **5432** (sessão) — porta explícita exigida |
> | Idempotência | **comprovada** — 2º deploy: `pendentes: 0`, nenhuma reaplicação |
> | Rollback | `buildCommand = npm install` — um passo |
>
> A rede de segurança **nunca existiu até 20/07** — o diagnóstico de 16/07 estava certo. Ela **foi criada**, não consertada.
>
> **Diagnóstico histórico preservado abaixo** (estado de 16/07/2026), incluindo a origem da afirmação falsa em `3b417a9`.

> **✅ A INCÓGNITA ESTÁ FECHADA.** **O Render NÃO roda migrations.** A afirmação de `deploy.yml:43` (*"O Render aplica migrations em runtime pela propria DATABASE_URL do dashboard"*), introduzida pelo commit `3b417a9` sem evidência, é **FALSA**. A rede de segurança **nunca existiu**.
>
> **Proveniência:** verificação executada por **humano com acesso ao painel do Render** e ao banco, reportada em 2026-07-16. Resultado declarado: *"Banco hoje: atualizado até a migration 031 · Render: não roda migration · GitHub Actions: pode deixar migration falhar e continuar."*
> **Nível de evidência:** atestado humano com acesso direto. Os artefatos brutos (print do painel, saída de `schema_migrations`) **não foram anexados a esta matriz** — se forem arquivados, referenciá-los aqui eleva a rastreabilidade.

- **Mecanismo real (por eliminação, agora fechada):** o CI não alcança o banco (ENETUNREACH/IPv6) · o Render não roda migrations · o boot da app não roda migrations (`server.js` → 0 ocorrências) · **e ainda assim o banco está em `031`** ⇒ **as migrations foram aplicadas MANUALMENTE via MCP**. Classificação do mecanismo: **MANUAL**, não `MANUAL_CONTROLADO` — não há processo, gate ou checklist; funciona por memória humana.
- **⚠️ Correção de hipótese própria:** a OPS-MIGRATIONS-01 apontou `20260708_031_ai_suggestions` como *"candidato mais provável de drift ativo"*. **A hipótese estava ERRADA** — a `031` **está aplicada**. O banco está alinhado. O risco era estrutural, não factual.
- **Origem da afirmação:** commit **`3b417a9`** (2026-07-12, *"fix(ci): restaurar continue-on-error nas migrations do deploy"*, `Co-Authored-By: Claude Opus 4.8`) — corpo afirma *"O Render continua aplicando migrations em runtime pela própria DATABASE_URL do dashboard"* **sem citar log, painel ou consulta alguma**. É asserção de agente incorporada como fato.
- **Evidências registradas (OPS-MIGRATIONS-01, 2026-07-16):**
  1. **Relatório** [[../../auditorias/multgestor/2026-07-16-ops-migrations-01]]
  2. **Commit `3b417a9`** — introduz a afirmação sem evidência; **o mesmo commit documenta o precedente do erro** (*"success mascarado pelo continue-on-error"*)
  3. **Ausência de `render.yaml`** — e de `Procfile` (`find . -maxdepth 2 -iname "render.yaml" -o -iname "Procfile"` → vazio). Render é acionado por **deploy hook** (`curl`, `deploy.yml:68-70`); toda a config de build/start vive **apenas no painel, não versionada**
  4. **`start` sem execução de migrations** — `package.json` → `start: "node src/server.js"`; `grep -rn "run-migrations\|runMigrations\|migrate" backend/src/server.js` → **0 ocorrências**
  5. ~~**Painel e logs do Render `NÃO_VERIFICADO`**~~ → 🔄 **VERIFICADO POR HUMANO (2026-07-16): o Render NÃO roda migration.**
  6. ~~**Banco `NÃO_VERIFICADO`**~~ → 🔄 **VERIFICADO POR HUMANO (2026-07-16): banco alinhado até a migration `031`.** (MCP Supabase permanece `Unauthorized` para o agente)
- **Contradição documental `INCONSISTENTE` — RESOLVIDA:** as 3 fontes que afirmavam *"drift acumula se não aplicadas via MCP"* (auditoria 2026-07-10, `status-atual.md:34,77`) estavam **CORRETAS**. O `deploy.yml:43` e o commit `3b417a9` estavam **ERRADOS**. Corrigir o comentário do workflow é escopo de `OPS-MIGRATIONS-03`.
- **DoD:** ~~obter evidência~~ ✅ **ATENDIDO** — evidência humana obtida; classificação final `AUSENTE`.
- **Próxima ação:** **`OPS-MIGRATIONS-03`** — projetar o processo que **passa a existir** (a rede de segurança nunca existiu; não há o que consertar, há o que **criar**). Plano: [[../../brain/plans/OPS-MIGRATIONS-03-plano]].
- **Contradição documental (`INCONSISTENTE`):** 3 fontes afirmam o oposto — auditoria `2026-07-10-auditoria-readonly-mapa-mestre.md:80` (*"drift acumula se não aplicadas via MCP"*), `status-atual.md:77` (`open_risks`, idem) e `status-atual.md:34` (*"Aplicado direto em produção via MCP Supabase (NÃO via CI)"* — migrations `022`/`023`). **Indício forte de aplicação manual:** se o Render aplicasse automaticamente, os drifts `022`/`023` nunca teriam existido. Permanece **indício** — a evidência de painel/log exigida não existe.
- **Evidência de produção obtida (não resolve):** `GET /api/health/deep` → HTTP 200; `database: ok` (173ms); **o health check NÃO expõe `schema_migrations`** (`server.js:235-315`).
- **Dependências:** `DATAOPS-001` · **Severidade:** ~~P1~~ **resolvida em 2026-07-20**
- **DoD:** ✅ **ATENDIDO** — mecanismo implantado, exercitado em produção e reversível.
- ~~**Próxima ação:** `ops/migrations-02-evidencia-painel` — exige humano.~~ **HISTÓRICO ENCERRADO:** essa missão foi superada. A incógnita foi fechada por verificação humana (16/07) e o mecanismo, criado e comprovado pela **OPS-MIGRATIONS-03D** (20/07). **Nada pendente neste item.**

#### `DATAOPS-003` — Conectividade de migrations (OPS-SUPAVISOR) · ⛔ bloqueado
- **Bloco:** DATAOPS · **Responsabilidade:** CORE · **Estado:** `NÃO EXISTE` · **Evidência:** `DOCUMENTADO`
- **Proveniência:** `deploy.yml:41-46` (ENETUNREACH IPv6, `883e516`) · `status-atual.md` (`OPS-SUPAVISOR`, rotação de segredos PAUSADA)
- **Lacuna:** runner do GitHub Actions não alcança o host direto do Supabase (IPv6). Bloqueado por decisão humana sobre rotação de segredos.
- **Severidade:** **P1** · **Bloqueia:** `DATAOPS-001`, `TENANT-003`

#### `DATAOPS-004` — Backup e restore
- **Bloco:** DATAOPS · **Responsabilidade:** CORE · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `DOCUMENTADO`
- **Proveniência:** `backend/scripts/backup-restore-check.js` · `package.json` script `backup-restore-check`
- **Lacuna:** o tooling de backup **não vive neste repositório** (worktree dedicado `C:\MultGestor-backup`, conforme registro histórico). RPO ~24h e `verified=true` são **afirmações documentais não reverificadas** nesta missão (L-1).
- **Severidade:** **P2** · **DoD:** restore exercitado com log próprio, em janela recente.

### Bloco QUALITY — Testes e qualidade

#### `QUALITY-001` — Suíte de testes automatizados
- **Bloco:** QUALITY · **Responsabilidade:** CORE · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `VALIDADO EM CI`
- **Proveniência:** **executado nesta auditoria** — `npx jest --testPathPatterns=tests/unit --silent` → **53 suítes / 765 testes / 100% passando / 19,6s** (local, 2026-07-16, `4c8ce847`). 11 suítes de integração (`tests/integration/`): `tenant-isolation-rls`, `tenant-isolation`, `gate0-als-context-leak`, `gate0-pool-paths`, `gate0-runtime-check`, `outbox-durability`, `refresh-token-rotation`, `register-validation`, `fase2-wallet`, `fase-c-integration`. `ci.yml` executa unit + integration (Postgres 16 + Redis 7 + role `app_runtime` NOBYPASSRLS real) + frontend lint/build.
- **Lacuna:** **cobertura não medida** (`test:coverage` existe, não executado). Sem gate de cobertura. Débito `fix/ci-migrate-hang` com **causa-raiz desconhecida** é risco de flakiness no CI.
- **Severidade:** **P3**
- **DoD:** cobertura proporcional ao risco, medida e com piso definido nas capacidades P0/P1.

### Bloco FRONTCORE — Núcleo do frontend

#### `FRONTCORE-001` — Estrutura e roteamento por módulo
- **Bloco:** FRONTCORE · **Responsabilidade:** CORE · **Estado:** `EXISTE E PRECISA VALIDAÇÃO` · **Evidência:** `VALIDADO EM CI`
- **Proveniência:** `frontend/src/` (`App.jsx`, `routes/`, `contexts/`, `features/`, `pages/`, `hooks/`, `lib/`, `services/`) · `frontend/src/routes/ModuleRoute.jsx` e `constants/authScopes.js` (criados em `ae31b65`) · CI job `frontend` (lint + build)
- **Lacuna:** produção não verificada (L-1).

#### `FRONTCORE-002` — Verticalização do frontend · **débito estrutural**
- **Bloco:** FRONTCORE · **Responsabilidade:** NICHO · **Estado:** `EXISTE MAS PRECISA REESTRUTURAÇÃO` · **Evidência:** `IMPLEMENTADO`
- **Proveniência:** **`frontend/src/pages/Barber.jsx` = 4.990 linhas** (`wc -l`, 2026-07-16) · **`frontend/src/pages/Clima.jsx` = 7 linhas** (stub)
- **Lacuna:** um único arquivo de ~5k linhas concentra a vertical barber; não há kit de UI reutilizável por nicho. O Clima não tem frontend.
- **Severidade:** **P3** (débito de manutenção; **não** bloqueia o marco v1) · **Bloqueia:** marco Multi-nicho
- **DoD:** vertical decomposta em features; kit de UI reaproveitável identificado.

> **✅ CONVERGÊNCIA:** "~4.990 linhas em `Barber.jsx`" e "`Clima.jsx` é stub de 7 linhas" — **ambos confirmados exatamente**.

### Bloco CONTRACT — Contratos de interface

#### `CONTRACT-001` — Validação de request (schemas)
- **Bloco:** CONTRACT · **Responsabilidade:** CORE · **Estado:** `CONCLUÍDA` · **Evidência:** `VALIDADO LOCAL`
- **Proveniência:** `backend/src/shared/core/validation/` — `validateRequest.js` + 9 schemas Zod (`auth`, `auth-requests`, `barber-requests`, `clima-requests`, `id`, `integration`, `pagination`, `query`) · suíte unitária 765/765
- **Lacuna:** schemas de nicho (`barber-requests`, `clima-requests`) moram em `shared/core/` — acoplamento de **localização**, não de código (os nomes de arquivo não violam I-1 por conteúdo). **P3**.

#### `CONTRACT-002` — Contrato de API publicado (OpenAPI)
- **Bloco:** CONTRACT · **Responsabilidade:** CORE · **Estado:** **`NÃO EXISTE`** · **Evidência:** — (ausência verificada)
- **Proveniência:** `find . -iname "*openapi*" -o -iname "*swagger*"` (excluindo `node_modules`) → **nenhum resultado** (2026-07-16)
- **Lacuna:** não há contrato de API formal. O contrato entre backend e frontend é implícito.
- **Severidade:** **P4** (aspiracional para v1; relevante se houver consumidor externo) · **DoD:** contrato versionado e verificado em CI.

#### `CONTRACT-003` — Respostas e erros padronizados
- **Bloco:** CONTRACT · **Responsabilidade:** CORE · **Estado:** `CONCLUÍDA` · **Evidência:** `VALIDADO LOCAL`
- **Proveniência:** `shared/core/responses/{success,fail,pagination}.js` · `shared/core/errors/` — hierarquia `AppError` com 8 subclasses (inclui `TenantIsolationError`), `toAppError.js`, `middleware.js` · suíte unitária 765/765

### Bloco NICHEKIT — Kit de criação de nicho

#### `NICHEKIT-001` — Primitivas de módulo
- **Bloco:** NICHEKIT · **Responsabilidade:** CORE · **Estado:** `EXISTE PARCIALMENTE` · **Evidência:** `VALIDADO LOCAL`
- **Proveniência:** `middlewares/createModuleGuard.js` (factory genérica, **2 consumidores reais**) · tabelas `modules` / `company_modules` (com RLS) · `shared/capabilities/booking-engine/` (utils puras, reusadas por Barber e Clima) · `shared/tenant/`
- **Lacuna:** as primitivas existem, mas **não formam um kit**: não há scaffolding nem documentação de "como criar um nicho".
- ⚠️ **Pressuposição corrigida em 2026-07-20 ([[ADR-008-booking-engine-formalizacao]]):** o DoD abaixo presumia um "motor de booking reusável" que **não existe hoje e não será construído imediatamente** (`DOMAIN-002` = rebaixado no código atual). O kit não pode prometer, no curto prazo, motor de agendamento compartilhado — cada nicho implementa o próprio por enquanto, reaproveitando apenas `scheduling-utils.js`.
- **Reposicionado em 2026-07-20 ([[ADR-009-booking-engine-reposicionamento-estrategico]] + [[../core/booking/CORE-BOOKING-001-capability-spec]]):** "não construir agora" **não é o mesmo que** "nunca existirá". A Booking Capability genérica está **especificada** para o Core (`CORE-BOOKING-001`), com o BarberGestor como primeiro adapter — ainda não implementada. O DoD abaixo deve ser lido como estado de transição, não como destino final do kit.
- **Dependências:** ~~`DOMAIN-002` (P1)~~ resolvida (rebaixada, não promovida) · `IDENT-002` (P2) · `ACCESS-001` (pronto) · `CORE-BOOKING-001` (definição concluída, implementação não iniciada) · **Severidade:** **P1** para o marco Multi-nicho
- **DoD (curto prazo, vigente):** kit cobre guard, contexto tenant, RLS, billing e gating **sem** prometer motor de booking compartilhado.
- **DoD (destino, condicionado à implementação de `CORE-BOOKING-004` a `CORE-BOOKING-VALIDATION-001`):** um nicho novo obtém guard, contexto tenant, RLS, billing, gating **e** a Booking Capability do Core (via adapter), sem reimplementar o motor de agendamento do zero.

#### `NICHEKIT-002` — ClimaGestor como prova do kit
- **Bloco:** NICHEKIT · **Responsabilidade:** NICHO · **Estado:** `EXISTE PARCIALMENTE` · **Evidência:** `IMPLEMENTADO`
- **Proveniência:** `routes/clima.routes.js` (auth+company+module guards aplicados) · `controllers/clima/index.js` · `services/clima-core.service.js` · `database/{clima.sql,clima_appointments.sql}` (3 tabelas com RLS) · `shared/core/validation/schemas/clima-requests.schema.js` · `frontend/src/pages/Clima.jsx` (**7 linhas**)
- **Lacuna:** o Clima **reimplementa o motor de booking** em vez de reusar (`DOMAIN-002`); frontend inexistente; **nenhuma empresa real usando** (afirmação documental, não verificável — L-1).
- **Severidade:** **P1** para o marco Multi-nicho; **P4** como produto
- **DoD:** o Clima consome o motor de booking do Core **sem reimplementar** — é o **teste objetivo do marco Multi-nicho**. Este DoD corresponde à futura missão `CORE-BOOKING-VALIDATION-001` (ver [[../core/booking/CORE-BOOKING-001-transition-map]]) — não atingido hoje, e não esperado antes de `CORE-BOOKING-004` (kernel) e `BARBER-BOOKING-ADAPTER-001` (adapter piloto) existirem.

---

## ANEXO C — Mocks, stubs e capacidades aspiracionais

| Item | Natureza | Evidência | Tratamento |
|---|---|---|---|
| **Automation Engine · AI Operational Layer · N8N Bridge · Omnichannel** | **Aspiracional — NÃO implementado** | Declarados em `docs/` e `.agent/runtime/`; o próprio `capacidades.md` alerta *"não tratar como reais"*. Nenhuma capacidade correspondente encontrada em `backend/src/shared/` | **Não entram na matriz como capacidade.** Não devem constar de nenhum plano como existentes. **P4.** |
| **`services/llm/` + `barber-ai.routes.js` + `ai_suggestions`** | Implementado; provider default declarado como Mock | `backend/src/services/llm/`, `routes/barber-ai.routes.js`, `controllers/barber/ai-insights.js`, migration `20260708_031_ai_suggestions.sql` (tabela **com RLS**) | Não auditado em profundidade nesta missão. **Custo externo de LLM não avaliado** → candidato a `API-001` (proteção de rota). **P3.** |
| **`services/_archive/barber.service.legacy.js`** | Código morto arquivado | Diretório `_archive` | Débito de limpeza. **P4.** |
| **`backend/check-rls.js`, `check-rls2.js`** | Scratch local | Não rastreados; ignorados (`.gitignore:112`) | **Conteúdo não lido** (L-6). **P3.** |
| **`.opencodex/projetos/multgestor/roadmap/capacidades.md`** | **Arquivo vazio (0 bytes)** | `ls -la` | Untracked. Pode capturar wikilinks `[[capacidades]]`. **P3** documental. |

**Referências quebradas verificadas:** `CLAUDE.md` declara `.opencodex/brain/constitution.md` como autoridade vinculante; `find . -iname "constitu*"` → **o arquivo não existe** (só `projetos/multgestor/constituicao.md` e `_inbox/revisar/constitution-knowledge-os.md`). Ver **D-05**.

---

## ANEXO D — Dependências e bloqueadores

### Grafo (sem ciclos)

```text
DATAOPS-003 (OPS-SUPAVISOR, P1, ⛔ humano)
      └──> DATAOPS-001 (continue-on-error, P1)
                 └──> TENANT-003 (cobertura RLS, P2)

DATAOPS-002 (rede de segurança do Render) = AUSENTE — CONFIRMADO 2026-07-16
      └──> premissa de aceitação de DATAOPS-001 = FALSA
                 └──> drift hoje = ZERO (banco em 031), mas por ação MANUAL
                            └──> OPS-MIGRATIONS-03: criar o processo (não é conserto)

TENANT-001 ──> TENANT-002 ──> CONFIG-001        [cadeia CONCLUÍDA]

DOMAIN-001 (utils, CONCLUÍDA)
      └──> DOMAIN-002 (services, P1) ──> NICHEKIT-001 (P1) ──> NICHEKIT-002 (P1)

IDENT-001 ──> IDENT-002 (P2) ──> NICHEKIT-001
ACCESS-001 (CONCLUÍDA) ──> NICHEKIT-001
FEATURE-001 (CONCLUÍDA) ──> BILLING-001 (P2)
EVENT-002 (CONCLUÍDA) ──> BILLING-001
```

**Ciclos:** nenhum detectado.

### Bloqueadores por severidade

| ID | Severidade | Bloqueia | Natureza |
|---|---|---|---|
| `DATAOPS-002` | **P1** | ~~Aceitação de `DATAOPS-001`~~ | ✅ **RESOLVIDA — `AUSENTE` confirmado** (2026-07-16). O Render **não** roda migration; `deploy.yml:43` é **falso**. Deixa de ser incógnita e passa a ser **fato que fundamenta `OPS-MIGRATIONS-03`** |
| `DATAOPS-003` | **P1** | `DATAOPS-001`, `TENANT-003` | ⛔ Bloqueado por decisão humana (rotação de segredos). ⚠️ **Pode deixar de bloquear** se `OPS-MIGRATIONS-03` mover a migration para fora do runner do GitHub (ver plano) |
| `DATAOPS-001` | **P1** | Integridade de schema · **toda migration futura** | 🔄 **Job existe, mas NÃO é bloqueante** — `continue-on-error`; `needs:` decorativo. **A premissa que o justificava é FALSA** (`DATAOPS-002` = `AUSENTE`). **5 camadas ausentes**; o que resta é memória humana |

### ⚠️ RISCO — drift entre migrations do repositório e banco de produção · 🔄 **MENSURADO em 2026-07-16**

**Estado atual do drift: ZERO.** O banco está **alinhado até a migration `031`** (verificação humana, 2026-07-16). As 32 migrations do repositório (`20251231_000` … `20260708_031`) estão aplicadas.

> ⚠️ **A ausência de drift hoje NÃO é resultado do processo — é resultado de intervenção manual.** O risco não estava no passado; está em **toda migration futura**.

**Por que o risco permanece P1 mesmo com drift zero:**

| Camada que deveria garantir | Estado real (confirmado) |
|---|---|
| CI aplicar em prod | ❌ **Não alcança o banco** — ENETUNREACH/IPv6 (`883e516`) |
| CI bloquear o deploy se falhar | ❌ **`continue-on-error: true`** (`deploy.yml:48`); `needs:` decorativo |
| Render aplicar no deploy | ❌ **Não roda migration** (`DATAOPS-002` = `AUSENTE`, confirmado) |
| App aplicar no boot | ❌ `server.js` → 0 ocorrências de `migrate` |
| Alguém detectar o drift | ❌ **Nenhum gate, alerta ou checklist** |

**Todas as cinco camadas estão ausentes.** O que resta é **memória humana**. Já falhou 2× (`022`, `023` — descobertas **por sintoma**, com o job quebrando em produção). Funcionou nas demais **por disciplina, não por desenho**.

**Cenário de falha concreto:** alguém faz merge de uma migration `032` + o código que depende dela. O CI valida a migration contra o Postgres efêmero (passa ✅). O job de migrations contra prod falha (ENETUNREACH) mas é marcado `success` ✅. O Render sobe o backend novo **contra o schema antigo**. **O deploy fica verde e a aplicação quebra em produção** — exatamente o modo de falha que os drifts `022`/`023` produziram.

**Consulta de verificação** (para reexecução futura):
```sql
SELECT version, name, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 10;
```

**Mitigação:** **`OPS-MIGRATIONS-03`** — [[../../brain/plans/OPS-MIGRATIONS-03-plano]]. Não é conserto: é **criação** do processo que nunca existiu.

> **Nota:** `TENANT-003` (cobertura de RLS em prod) **permanece NÃO MENSURADO** — a verificação humana cobriu migrations, não policies.
| `DOMAIN-002` | **P1** | Marco **Multi-nicho** | Decisão arquitetural pendente (ADR) |
| `NICHEKIT-001` | **P1** | Marco **Multi-nicho** | Depende de `DOMAIN-002` |
| `BILLING-001` | **P2** | Circuito comercial | Config de produção (D-016) |
| `IDENT-002` | **P2** | Escopo por módulo | Contorno controlado |
| `TENANT-003` | **P2** | Cobertura RLS auditável | Requer acesso ao banco |

**Nenhum P0 identificado.** Nenhuma evidência de risco imediato de segurança, vazamento entre tenants ou indisponibilidade crítica foi encontrada dentro do escopo auditado. **Isto não é um atestado de ausência de P0** — produção não foi verificada (L-1).

---

## ANEXO E — Divergências registradas

> Formato: informação anterior · estado factual · fonte · decisão de substituição · data.

### D-01 — Auth do ClimaGestor
- **Anterior:** *"`clima.routes.js` usa `requireBarberAdminAuth` **por engano**"* — `capacidades.md` (2026-07-03)
- **Factual:** `clima.routes.js:6,15` usa `requireTenantAdminAuth` desde `ae31b65` (2026-07-03, em `main`). O alias **é** `requireBarberAdminAuth` (`auth.middleware.js:128`), e isso é **deliberado e documentado** (`:121-127`), não um engano.
- **Fonte:** leitura de código + `git merge-base --is-ancestor ae31b65 main` → verdadeiro
- **Decisão:** **SUBSTITUIR.** Reclassificado de "bug de autorização" para **débito de acoplamento P2** (`IDENT-002`). · **Data:** 2026-07-16

### D-02 — Estado da RLS em runtime
- **Anterior:** *"RLS 🟡 ENABLE, **inerte em runtime**; runtime usa role com BYPASSRLS"* — `capacidades.md` (2026-07-03)
- **Factual:** RLS **ativa**. `tenantAwareConnect` (`database.js:129`) roteia conexões com contexto tenant para `poolTenant` (`app_runtime`, NOBYPASSRLS); `requireCompany.js:44-54` injeta GUC transaction-local. CI cria a role real NOBYPASSRLS e executa `tenant-isolation-rls.test.js`.
- **Fonte:** código + `ci.yml` + commits `aeed31c` (2026-07-01), `02c5396` (2026-07-02, **anterior** ao documento)
- **Decisão:** **SUBSTITUIR** por `TENANT-002` (`CONCLUÍDA`, `VALIDADO EM CI`). · **Data:** 2026-07-16

### D-03 — Cobertura de RLS
- **Anterior:** *"RLS 23/27 tabelas — companies e users sem policy"* — `capacidades.md`, `painel-executivo.md`
- **Factual:** **40 tabelas com `CREATE POLICY`** nas migrations. `companies` e `users` **têm** policies desde a migration 024 (2026-06-24). `refresh_tokens` tem ENABLE sem policy **por design documentado**.
- **Fonte:** `grep -rhoiE "CREATE POLICY … ON …" src/database/*.sql`
- **Decisão:** **SUBSTITUIR** por `TENANT-003`. ⚠️ O novo número **também não é o estado de produção** (L-4): migrations 027/028 provam `ENABLE` fora do versionamento. O número correto exige consulta ao banco. · **Data:** 2026-07-16

### D-04 — Vocabulário do gating de plano
- **Anterior:** *"gating de plano ainda com vocabulário do barber"* — `capacidades.md`
- **Factual:** **Falso.** `utils/planFeatures.js` usa chaves genéricas (`collaborators`, `advanced_reports`, `financial_dashboard`, `extra_permissions`, `advanced_schedule`, `future_modules`); `shared/capabilities/billing/` → **0** ocorrências de `barber`; `company-plan.service.js` → **0**.
- **Fonte:** leitura de `planFeatures.js` + `grep -rn "barber" shared/capabilities/billing/` + `grep -c "barber" services/company-plan.service.js`
- **Decisão:** **SUBSTITUIR** por `FEATURE-001` (`CONCLUÍDA`). **Consequência:** invalida qualquer plano que pretenda "generalizar o gating antes da Fase 6" — o trabalho já existe. · **Data:** 2026-07-16

### D-05 — Autoridade de governança inexistente
- **Anterior:** *"em conflito, a autoridade é `.opencodex/brain/constitution.md`"* — `CLAUDE.md` (carregado em toda sessão)
- **Factual:** o arquivo **não existe**. `.opencodex/brain/` contém apenas `fila-de-implementacao.md` e `plans/`. Existem `projetos/multgestor/constituicao.md` e `_inbox/revisar/constitution-knowledge-os.md`.
- **Fonte:** `find . -iname "constitu*"` (2026-07-16)
- **Decisão:** **NÃO SUBSTITUÍDA — exige decisão humana.** Não é competência desta missão eleger a autoridade de governança. Registrada em `fonte-unica-verdade.md`. · **Data:** 2026-07-16

### D-06 — Estado do Git no status-atual
- **Anterior:** `ahead_of_origin: 14` · `diverged: true` · `release/push-p0-batch` como **pré-condição da Fase 6** — `status-atual.md` (v22, 2026-07-10)
- **Factual:** `main` sincronizada, **0/0**, HEAD = origin/main = `4c8ce847`. **0 PRs abertas.**
- **Fonte:** `git rev-list --count` (ambas as direções) + `gh pr list --state open --json`
- **Decisão:** **SUBSTITUIR.** A pré-condição declarada da Fase 6 **está satisfeita**. · **Data:** 2026-07-16

### D-07 — Stash pendente
- **Anterior:** `stash@{1}` com 31 arquivos parciais (registro de organização de bancada, 2026-07-11)
- **Factual:** `git stash list` → **vazio**.
- **Decisão:** **SUBSTITUIR** — pendência inexistente. · **Data:** 2026-07-16

> **Padrão observado nas 7 divergências:** a documentação canônica erra **nos dois sentidos** — otimista em D-06/D-07 (declara pendências já resolvidas) e **pessimista em D-02/D-03/D-04** (declara como quebrado o que já funciona). Documentação que erra em ambas as direções não pode ser descontada por viés; **só verificação direta a torna utilizável**. Esta é a justificativa factual do Gate 0.

---

## ANEXO F — Backlog priorizado

> Ordenação: severidade · bloqueio de marco · dependências desbloqueadas · exposição ao risco · facilidade de produzir evidência · menor esforço. **Severidade isolada não determina a ordem.**
> **Reordenado em 2026-07-20 (duas vezes)** — após a conclusão da OPS-MIGRATIONS-03D e, no mesmo dia, após a formalização de `DOMAIN-002` — ver notas de encerramento abaixo da tabela.

| # | Item | Capacidades | Sev. | Marco | Justificativa da posição |
|---|---|---|---|---|---|
| **1** | **Inventário de RLS consultado no banco** | `TENANT-003` | P2 | v1 | 3 documentos erram a cobertura (D-03) e o repo **não é fonte completa** (L-4). Requer acesso read-only ao banco. |
| **2** | **Ativação do entitlement de billing em produção** | `BILLING-001`, `BILLING-002` | P2 | v1 | Código pronto e gating **já genérico** (D-04 elimina o pré-requisito antes presumido). Falta config (D-016) + evidência de prod. Fecha o circuito comercial. |
| **3** | **Auditoria de proteção de rota (R-003)** | `API-001`, `FILES-001` | P2 | v1 | Rotas de upload e de IA (custo externo) não auditadas. Superfície de abuso desconhecida. |
| **4** | **Escopo de auth por módulo** | `IDENT-002`, `ACCESS-002` | P2/P3 | Multi-nicho | Contorno controlado hoje; vira P1 quando existir um segundo scope real. |
| **5** | **Trilha de auditoria unificada** | `AUDIT-001` | P3 | — | 3 tabelas, nenhuma com RLS, sem retenção. |
| **6** | **Gate de segurança bloqueante** | `SEC-003` | P3 | — | `security-audit.yml` não bloqueia. |
| **7** | **Decomposição de `Barber.jsx`** | `FRONTCORE-002` | P3 | Multi-nicho | 4.990 linhas; débito de manutenção, sem risco imediato. |
| **8** | **Observabilidade de performance** | `OBS-002` | P4 | — | Sem baseline; adiar até o volume justificar. |

**Novo item — `DOMAIN-002B`, achado da formalização (2026-07-20):** consolidar as duas trilhas paralelas de criação de agendamento no BarberGestor (`AppointmentService`/`AppointmentRepository` vs. `client-booking.service.js`/`booking-appointments.service.js`) e cobrir com testes de conflito/concorrência. Sem posição fixa ainda — depende de priorização humana; não bloqueia nenhum marco por si só. Ver [[ADR-008-booking-engine-formalizacao]].

> ✅ **Item #1 anterior — `OPS-MIGRATIONS-03` — CONCLUÍDO em 2026-07-20** como **OPS-MIGRATIONS-03D**. Migrations de produção passaram a ser automáticas, bloqueantes, estritas, idempotentes e reversíveis (`buildCommand = npm install && npm run migrate:prod`, gate no Render). `DATAOPS-001` deixou de ser alvo — está **resolvido** (gate bloqueante ativo). Evidências: [[../../brain/plans/OPS-MIGRATIONS-03D-plano]] § ENCERRAMENTO.
>
> ✅ **Item #1 seguinte — `ADR: rebaixar ou promover o Booking Engine` — CONCLUÍDO em 2026-07-20**, no mesmo dia. Decidido e implementado: rebaixar (`DOMAIN-002`). Formalizado com auditoria completa em [[ADR-008-booking-engine-formalizacao]] (supera [[ADR-007-booking-engine]]). Os itens 2–9 subiram uma posição cada, duas vezes, resultando na numeração 1–8 atual.

**Fora do backlog (bloqueado por humano):** `DATAOPS-003` — a **conectividade IPv6** que o descrevia ficou **moot**: nenhum workflow do GitHub tenta mais alcançar o banco de produção (o job `run-migrations` foi removido do `deploy.yml` no GATE 9). A condição que a própria matriz previa para desbloquear a rotação de segredos — *"remove a `DATABASE_URL` de produção do CI → dissolve a preocupação de secret em log"* — está **satisfeita**: `secrets.DATABASE_URL` tem **0 ocorrências** em `deploy.yml`. A rotação de segredos em si **continua pausada por decisão humana** — este documento não a declara retomada; apenas registra que o bloqueio técnico que a impedia deixou de existir. **Não alterar o `continue-on-error`** (que também já não existe neste job) não se aplica mais — nada a fazer aqui sem decisão humana sobre a rotação.

---

## ANEXO G — Marcos

### Core Consolidado v1 — fundação validada pelo BarberGestor

| Requisito | Estado |
|---|---|
| Fundação multi-tenant isolada e provada | ✅ `TENANT-001`, `TENANT-002`, `CONFIG-001` — `VALIDADO EM CI` |
| Contratos estabilizados | ✅ `CONTRACT-001`, `CONTRACT-003`, `EVENT-001`, `EVENT-002` |
| BarberGestor operando sobre a fundação | 🟡 `IMPLEMENTADO`; **produção não verificada (L-1)** |
| Integridade de schema garantida | 🔴 `DATAOPS-001` (job **não bloqueante**) + `DATAOPS-002` (**`NÃO_COMPROVADO`**) — **risco de drift NÃO MENSURADO** |
| Circuito comercial fechado | 🟡 `BILLING-001` — falta prova em produção |
| Kit de nicho tecnicamente verificável | 🔴 `NICHEKIT-001` — primitivas existem, kit não |

**Veredito:** **NÃO ATINGIDO.** Bloqueadores: `DATAOPS-002` (P1, **`NÃO_COMPROVADO`** após OPS-MIGRATIONS-01), `NICHEKIT-001` (P1), `BILLING-001` (P2).

### Core Multi-nicho Comprovado — segundo nicho real reutilizando a fundação

| Requisito | Estado |
|---|---|
| Segundo nicho consome o motor sem reimplementar | 🔴 `DOMAIN-002`/`NICHEKIT-002` — o Clima **reimplementou** |
| Segundo nicho com frontend real | 🔴 `Clima.jsx` = 7 linhas |
| Segundo nicho em uso real | 🔴 nenhuma empresa (documental, não verificado) |

**Veredito:** **NÃO ATINGIDO.** Depende de `DOMAIN-002` (ADR) → `NICHEKIT-001` → `NICHEKIT-002`.

---

## PRÓXIMA MISSÃO

> ✅ **INCÓGNITA FECHADA em 2026-07-16.** A pergunta *"como as migrations chegam à produção?"* foi respondida por **verificação humana**: o **Render não roda migration**, o **CI não bloqueia**, e o **banco está alinhado até `031`** — ou seja, as migrations vêm sendo aplicadas **manualmente via MCP**. `DATAOPS-002` = **`AUSENTE`** (confirmado). A afirmação de `deploy.yml:43` era **falsa**.
>
> **A próxima missão deixa de ser investigativa e passa a ser de projeto.** O drift hoje é **zero**; o processo é que é **frágil**.

### `OPS-MIGRATIONS-03` — criar o processo seguro de aplicação de migrations

> 📋 **Plano completo:** [[../../brain/plans/OPS-MIGRATIONS-03-plano]] · ⛔ **implementação aguarda autorização humana**

**Problema:** **nada garante que uma migration chegue à produção antes do código que depende dela.** As 5 camadas que deveriam garantir isso — CI aplicar, CI bloquear, Render aplicar, app aplicar no boot, alguém detectar — estão **todas ausentes**. O banco está correto **por disciplina humana**, não por desenho. Já falhou 2× (`022`, `023`, descobertos por sintoma).

**Decisão central proposta:** mover a migration para o **Build Command do Render** (único lugar com conectividade — C-2 — e único que bloqueia deploy no free tier — C-3) e **DELETAR o job `run-migrations` do `deploy.yml`**, que não aplica nada, mascara falha e cria dependência decorativa. **Efeito colateral:** remove a `DATABASE_URL` de produção do CI → **dissolve a preocupação de secret em log** que mantém `DATAOPS-003` bloqueado.

**Cobre os 7 pontos exigidos:** onde rodar (§3) · qual comando (§4) · como falha bloqueia (§5) · concorrência via `pg_try_advisory_lock` (§6 — hoje **não há trava**) · validação pré/pós (§7) · secrets (§8) · reversão (§9 — ⚠️ **hoje não existe rollback de migration**; são forward-only).

**Gate 0 (humano):** confirmar no painel que o build tem `DATABASE_URL` **e** alcança o banco. **Se falhar, o plano muda** (tier pago ou processo manual formalizado com gate de detecção).

**Problema factual.** `DATAOPS-002` permanece **`NÃO_COMPROVADO`**. A afirmação de `deploy.yml:43` (*"O Render aplica migrations em runtime…"*) foi introduzida pelo commit **`3b417a9`** (2026-07-12, co-autoria de agente) **sem nenhuma evidência**, e é **contradita por 3 fontes** do próprio projeto (auditoria 2026-07-10 e `status-atual.md` afirmam que o drift acumula sem aplicação manual via MCP; migrations `022`/`023` foram aplicadas à mão). O `continue-on-error` (`DATAOPS-001`) é aceito **por causa dessa afirmação** — ou seja, o pipeline de produção repousa sobre uma premissa que ninguém verificou e cuja única evidência disponível aponta na direção contrária.

**Por que um agente não resolve isto.** OPS-MIGRATIONS-01 esgotou as vias READ_ONLY automatizáveis: painel e logs do Render são inacessíveis (`list_connected_browsers` → `[]`; **login é vedado ao agente**), o Render CLI não existe, o MCP Supabase responde `Unauthorized` (2ª vez), e `/api/health/deep` — a única evidência de produção obtida — **não expõe `schema_migrations`**. **Nenhuma leitura adicional de repositório resolve:** sem `render.yaml`, a configuração que determina o comportamento **não é versionada** (`DATAOPS-002`, evidência 3). O repositório é estruturalmente incapaz de responder.

**Por que esta e não outra.** Continua sendo a máxima informação por esforço (~10 min de humano) e a única P1 puramente informacional. Seu resultado **reordena o backlog**: se o Render aplica migrations, `DATAOPS-001` cai para débito de CI e a fila segue para o ADR do Booking Engine; se não aplica, o drift é real e `DATAOPS-001` passa à frente de billing e de qualquer refactor.

**Capacidades afetadas:** `DATAOPS-002` (alvo) · `DATAOPS-001`, `TENANT-003` (reclassificação dependente do resultado)

**Escopo — 3 passos:**
1. **Painel do Render** → serviço `multgestor-backend` → **Settings**: transcrever `Build Command`, `Pre-Deploy Command`, `Start Command`. Verificar se algum contém `migrate`.
   - ⚠️ **Free tier não oferece Pre-Deploy Command** (recurso de planos pagos). Se o tier for free (`ADR-002-render`: *"em produção (free tier)"*, corroborado por cold start de 33s observado), a única via possível é o **Build Command**.
2. **Logs do último deploy** → procurar a saída característica do runner: `[migrate] banco alvo:` · `[ok]` · `[skip]` · `[migrate] todas as migrations aplicadas com sucesso.`
3. **Banco (read-only)** — a consulta decisiva:
   ```sql
   SELECT version, name, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 10;
   ```
   - `20260708_031` (`ai_suggestions`) **ausente** → Render **não** aplica; **drift confirmado e ativo**.
   - `applied_at` agrupado em janelas de deploy → automático; esparso/avulso → manual.

**Fora de escopo:** ⛔ alterar o `continue-on-error` (**proibido** até a rotação de segredos ser retomada — `DATAOPS-003`) · aplicar qualquer migration · alterar config do Render · resolver OPS-SUPAVISOR · tocar em billing ou no Booking Engine.

**Riscos:** (1) o painel exibe secrets na tela — **não transcrever valor algum** para nenhum documento; (2) a consulta exige credencial de leitura — usar via read-only existente, **nunca criar credencial nova**.

**Gates:** `BASELINE_CONGELADO` · `EVIDÊNCIA_COLETADA` (log/config observados, **não** afirmação) · `NENHUM_SECRET_REPRODUZIDO` · `DATAOPS-002_CLASSIFICADA` · `DATAOPS-001_RECLASSIFICADA`

**Testes:** nenhum código alterado ⇒ nenhum teste novo. **Reversão:** não aplicável — read-only.

**DoD:** `DATAOPS-002` sai de **`NÃO_COMPROVADO`** para **`AUTOMÁTICO_COMPROVADO`** (a rede existe, com log/config) **ou** **`AUSENTE`** (confirmado que não existe) — com evidência referenciada em ambos os casos; `DATAOPS-001` reclassificada; risco de drift **mensurado** (ANEXO D); backlog reordenado.

**Autorizações humanas necessárias:**
- ✋ **Acesso humano ao painel e logs do Render** — o agente não possui e **não pode fazer login**.
- ✋ **`SUPABASE_ACCESS_TOKEN` válido** para o MCP **ou** execução humana da consulta do passo 3.
- ⛔ **Nenhuma autorização de escrita é requerida ou solicitada.**

> **Nota sobre a Fase 6 (billing).** Esta matriz **não** trata billing como prioridade presumida. Ela foi reavaliada junto das demais e ficou em **4º** no backlog. Dois fatos mudaram sua análise: (1) sua pré-condição declarada (`release/push-p0-batch`) **já está satisfeita** (D-06); (2) o suposto pré-requisito de "generalizar o gating" **não existe** — o gating já é genérico (D-04). Billing está mais perto do que a documentação sugeria; ainda assim, perde para uma verificação de P1 que custa uma inspeção e reordena a fila.

---

## Proteção de rota

Esta missão é documental e READ_ONLY. **Não cria superfície exposta · não gera custo externo · não requer rate limit · não requer limite por tenant/usuário.** As quatro perguntas do `CLAUDE.md` não se aplicam — nenhuma rota foi criada ou alterada.

## Estado Git final

Idêntico ao baseline. Nenhum arquivo de código, teste, migration, workflow ou dependência foi alterado. Nenhum commit, push, PR, deploy ou migration executado. Nenhum secret lido ou reproduzido.
