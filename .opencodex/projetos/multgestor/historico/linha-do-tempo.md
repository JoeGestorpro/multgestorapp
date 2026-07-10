# 📅 Timeline — MultGestor

> **Status:** OFICIAL • VIVO • ATUALIZADO A CADA MISSÃO
> **Atualizado:** 2026-07-04
> **Propósito:** Registro cronológico permanente de eventos, missões, deploys e decisões.
> **Fonte primária:** [[implementacao-log]]
> **Formato:** Mais recente primeiro.

---

## 2026-07-04

### `knowledge/context-pack-padrao` — Context Pack canônico para o Claude Project
- **Resumo:** Criado `.opencodex/handoff/context-pack/` (6 arquivos, ~350 linhas totais) —
  pacote enxuto derivado do Segundo Cérebro para alimentar os "Arquivos do Projeto" do Claude
  Project, evitando colar documentos a cada conversa nova. Script `scripts/generate-context-pack.js`
  regenera metadados (data/state_version/commit) e checa conteúdo sensível a cada fechamento de
  missão — desenho deliberado: o script NÃO tenta auto-sumarizar prosa (exigiria julgamento
  editorial), só detecta deriva das fontes canônicas e sinaliza quais packs precisam de revisão.
  Mission Closing Protocol V3 ganhou o passo 11 (regenerar pack + avisar o Joe), obrigatório
  daqui em diante. Princípio D-015 preservado: pack é derivado, nunca fonte.
- **Commits:** local, sem push
- **PR:** —
- **Deploy:** N/A (doc-only + automação leve)
- **Resultado:** Pack gerado, checagem de sensíveis passou (0 achados), Mission Closing
  Protocol atualizado.

### `atualizacao-vault-obsidian` — Sincronização do vault com estado real do projeto
- **Resumo:** Atualização completa do Knowledge OS vault (.opencodex/) — 25+ arquivos tocados. Limpeza de boilerplate Obsidian, atualização de 00-HOME, Timeline, Dashboard, project-state, production-readiness, commercial-readiness, knowledge-health, lessons-learned. Preenchimento de arquivos vazios (ops/playbooks, agents/joefelipe-agent, prompts/frontend). Resolução de duplicidade de fontes de estado.
- **Commits:** —
- **PR:** —
- **Deploy:** —
- **Resultado:** Vault sincronizado com o estado real do projeto em 2026-07-04.

---

## 2026-07-03

### `core/p0-sync` — Platform Specification + Core×Nicho audit + Due Diligence
- **Resumo:** Três entregas do Core P0: (1) **MULTGESTOR-PLATFORM-SPECIFICATION.md** — documento constitucional definindo Core vs Nicho, com princípios invioláveis, contrato Core×Nicho, catálogo de capacidades, release gates. (2) **Core×Nicho Audit** — investigação de 4 paralelas (backend, dados/módulos, frontend, onboarding) revelando 4 pontos de acoplamento indevido em arquivos genéricos. Core Completion Index: **52/100** — "não é plataforma multi-nicho, é BarberGestor com plataforma por baixo". (3) **Due Diligence Enterprise** — avaliação de maturity para venda em escala: Engineering 🟢, Product 🟡, Commercial 🟡, Self-Service 🔴, Compliance/LGPD 🔴. Enterprise Maturity Index: **57/100** (era 44,5 em 26/06).
- **Achados corrigidos no mesmo dia:** `company.service.js` limpo de acoplamento barber; `clima.routes.js` corrigido para `requireTenantAdminAuth`; `ModuleRoute.jsx`/`AuthContext.jsx` generalizados com `constants/authScopes.js`.
- **Decisão:** [[decisions/D-017]]
- **Commits:** `e34c0b9` · `ae31b65` · `7046bd4` · `08b0fb9` (+ merge `e661259`)
- **PR:** —
- **Deploy:** —
- **Resultado:** Core P0 auditado, corrigido e documentado. Gap central: webhook de pagamento não seta `companies.plan_type` (D-016).

### Sprint P0 autônomo — Batch 2 (validação e fechamento)
- **Resumo:** Smoke local **20/20 PASS** (backend real, banco de teste `multgestor_test`): registro, login, serviço, colaborador, working-hours, caixa, venda sob `app_runtime`, dashboard, rotação de refresh + revogação ao vivo, isolamento cross-tenant A/B.
- **Fixes adicionais:** `24d7497` fallback `sale_date_local` (bug exposto pelo smoke) · `57619bd` unwrap pool client · `fa5ffc8` purga diária refresh_tokens · `f3ea68e` módulo fantasma "terra" removido · `f8e1813` docs audit.
- **Commits:** +7 commits locais (total 29 commits do sprint)
- **Pre-release gate:** workflows OK, testes OK, lint OK. **Bloqueado** por working tree sujo + divergência `origin/main`.

---

## 2026-07-02

### Sprint P0 autônomo — Batch 1 (execução)
- **Resumo:** Sprint autônomo pós-auditoria — resolução de 4 P0 de código + validação. Nenhum push/deploy/migration em produção.
- **Commits locais (8):**
  - `ace2d05` fix(barber): remove runtime DDL de schedule service
  - `e906039` docs(governance): reconciliação da fila
  - `8056831` fix(db): migrations 018-021 (mg_prepaid, packages, loyalty, anamnese)
  - `02c5396` **P0 CENTRAL FEITO**: writes tenant → `app_runtime` (NOBYPASSRLS)
  - `d112950` feat(security): TLS certificate verification (inerte sem CA)
  - `f03af4d` feat(security): rotação/revogação de refresh tokens + migração 030
  - `d7f2fd1` fix(frontend): zero eslint errors (antes 13)
  - `d262676` fix(security): helmet Content Security Policy ativo
- **Testes:** 678 unit pass · 97/97 integração (tenant-isolation-rls, gate0-*, outbox-durability)
- **Auditoria:** smoke prod → health 200, booking 200, Redis degraded, WhatsApp mock. 17 achados (F-01..F-17), P0 resolvidos.
- **Resultado:** 4 P0 de código resolvidos localmente. Pendências humanas: merge origin/main, push/deploy, CA TLS, WhatsApp real.
- **Fonte:** [[../audits/2026-07-02-auditoria-completa-e-sprint-p0]]

---

## 2026-06-29

### `auditoria-retomada` — Auditoria completa de retomada + fix de plano JoeFelipe
- **Resumo:** Auditoria full-stack de retomada (git, backend, RLS, banco, frontend, testes). Identificado bloqueador de produção: **Barbearia JoeFelipe** com `plan_type='trial'` e `trial_ends_at=2026-05-05` (expirado), `isPlanActive()=false` → `requireActivePlan` bloqueava `POST /api/barber/sales` e `POST /api/barber/collaborators` (caixa inoperante).
- **Ação em PRODUÇÃO (Supabase `db.mfayaji…`, autorizada):** `UPDATE companies SET plan_type='premium', plan_status='active'` para `id=ed607874-0520-4227-b2d6-5a98e868d329`, em **2026-06-29 ~22:40 (-04) / 2026-06-30 06:40 UTC**.
  - **plan = premium / active**
  - **max_collaborators = ilimitado** (premium; empresa tem 7 colaboradores)
  - **Verificado:** snapshot do serviço → premium/active/is_active=true; smoke HTTP com token admin → `/api/barber/company/plan` retorna premium com TODAS as features `true`; 14/15 endpoints 200 (único 403 = `/my-report`, rota exclusiva de colaborador — comportamento correto).
- **Achados de auditoria:** RLS sólido (app_runtime NOBYPASSRLS; alerta "RLS inerte" ausente); migrations 027/028 aplicadas em prod mas **não registradas** em `run-migrations.js` (P1 reprodutibilidade); "bypass residual" conhecido em transações `pool.connect()` (P1, documentado em gate0); 15 tabelas sistêmicas RLS+0 policies (default-deny intencional, P2); dados de teste poluindo prod (P2).
- **Testes:** backend unit **661 passed**; frontend build OK; lint 13 errors triviais; gate0/integração **pendentes** (sem `TEST_DATABASE_URL` local).
- **Commits:** — (10 commits locais não enviados; nada commitado nesta missão)
- **PR:** —
- **Deploy:** — (mudança foi dado em prod, não código; backend live reflete em ≤60s via cache TTL)
- **Decisão:** [[decisions/D-016-plano-joefelipe-premium]]
- **Resultado:** Bloqueador P0 da empresa real resolvido. Barbearia JoeFelipe operacional.

---

## 2026-06-24

### `knowledge-os-v3` — Evolução definitiva para Knowledge OS 3.0
- **Resumo:** Transformação do Second Brain V2 em Knowledge OS 3.0 — 7 camadas lógicas, Constitution Knowledge OS, Mission Closing Protocol V3, Digital Twin (6 módulos), Feature Genome (template + 2 exemplos), Impact Graph (template + 3 exemplos), Simulation Center (metodologia + 3 cenários), AI Brain, Agent × Skill Matrix, Mission Builder, Planner, Providers, Knowledge DNA, Knowledge Health (15 áreas scorecard), Knowledge Memory, Decision Graph, Digital Operations Center, Executive Intelligence
- **Arquivos:** `constitution-knowledge-os.md`, `knowledge-dna.md`, `knowledge-health.md`, `knowledge-memory.md`, `product/digital-twin/*`, `product/feature-genome/*`, `product/impact-graph/*`, `product/simulation-center/*`, `agents/README.md` (reescrito), `agents/agent-skill-matrix.md`, `agents/mission-builder.md`, `agents/planner.md`, `agents/providers.md`, `decisions/DECISION-GRAPH.md`, `ops/digital-ops-center.md`, `ops/executive-intelligence.md`, `INDEX.md` (reescrito), `README.md` (reescrito), `ops/mission-closing-protocol.md` (V3)
- **Commits:** —
- **PR:** —
- **Deploy:** —
- **knowledge_os_version:** 3.0.0
- **Resultado:** Knowledge OS 3.0 completo — ~60 novos/alterados arquivos

### `second-brain-v2-evolution` — Evolução do `.opencodex` + Obsidian
- **Resumo:** Criação da arquitetura Second Brain V2: Fase 1 (Homepage, Current State, Dashboard, Timeline), Fase 2 (Product Brain, Technical Brain, PRD Library, Incident Library, Prompt Library, nichos, agentes, ops), Fase 3 (wikilinks, frontmatter, Knowledge Graph, Knowledge OS)
- **Arquivos:** `.opencodex/brain/00-HOME.md`, `01-CURRENT-STATE.md`, `02-EXECUTIVE-DASHBOARD.md`, `03-TIMELINE.md`, `product/*`, `technical/*`, `incidents/*`, `lessons/*`, `nichos/*`, `agents/*`, `prompts/*`, `ops/*`
- **Commits:** — (em progresso)
- **PR:** —
- **Deploy:** —
- **Resultado:** Estrutura evolutiva do Segundo Cérebro criada

---

## 2026-06-23

### `fase-d/p1a-public-booking-rate-limit` — Rate limit em rotas públicas duplicadas
- **Resumo:** Rate limit adicionado em `barber.routes.js` (GET /public/:slug/booking-info, GET /public/:slug/available-slots, POST /public/:slug/appointments). Mesmos limites de public-booking.routes.js.
- **Arquivos:** `backend/src/routes/barber.routes.js`
- **Commits:** —
- **PR:** —
- **Deploy:** —
- **Resultado:** R-003 parcialmente mitigado. state_version 19→20

### FASE C FECHADA — Consolidação do Second Brain
- **Resumo:** PR #16 (bd13f69) merged, deploy success. PR #15 (af04618) merged, paths-ignore funcionou. D-015 criada. .gitignore atualizado. Living OS oficial no git.
- **Arquivos:** `.opencodex/brain/decisions/D-015-fonte-unica-segundo-cerebro.md`
- **Commits:** `bd13f69`, `af04618`
- **PR:** #15, #16
- **Deploy:** ✅ Success (PR #16)
- **Resultado:** Fase C fechada. state_version 17→18
- **Lições:** D-015 registrada como decisão formal

### `fase-c/redacao-opencodex` — Redação de segurança do `.opencodex`
- **Resumo:** 9 arquivos redigidos, 20 substituições aplicadas. Valores sensíveis removidos. Nenhum commit/push.
- **Resultado:** ~70% do `.opencodex` classificável como publicável

### `fase-c/decisao-opencodex` — Decisão D-014
- **Resumo:** Varredura PLAN_ONLY do `.opencodex`. Nenhum secret real encontrado. Decisão D-014: publicar com ressalvas/redação.
- **Arquivos:** —
- **Resultado:** D-014 criada

### Auditoria Incidente L-93 — Violação de migração manual em main
- **Resumo:** Migração parcial aplicada manualmente em `main` com alterações experimentais. Schema drift L-93 detectado.
- **Arquivos:** `.opencodex/brain/audits/AUDITORIA-INCIDENTE-2026-06-23-violacao-l93.md`
- **Lições:** L-93 registrada

### `fase-c/pr-2-backup-b2-checklist` — Validação backup/B2
- **Resumo:** Checklist READ_ONLY do backup/B2. Backup local 648KB APPROVED. Scheduler Ready. B2 verified=true.
- **Resultado:** Backup OK validado

### `fase-c/pr-1 (PR #13)` — JoeFelipe Agent safety tests
- **Resumo:** 23/23 testes verdes mergeados em `origin/main` (863d811). 4 arquivos de teste + 1 linha package.json.
- **Commits:** `863d811`
- **PR:** #13
- **Deploy:** ✅ Success
- **Resultado:** JoeFelipe Agent V1 seguro

---

## 2026-06-22

### `ops/backup-external-copy` — Backup externo B2 validado
- **Resumo:** Backup externo corrigido, validado e ligado. Conexão dump passou de pooler (ECIRCUITBREAKER) para direta. BRCHK_EXTERNAL_ENABLED=1, verified=true.
- **Arquivos:** `.opencodex/brain/audits/AUDITORIA-BACKUP-GOVERNANCA-PROVA-VIVA-2026-06-22.md`
- **Resultado:** A-002 resolvido. Risco P1 catastrófico rebaixado para monitorado.
- **Lições:** A-002 — conexão direta essencial para dump estável

### P0 Segurança fechado — Exposição anon/PostgREST
- **Resumo:** Exposição `anon`/`PostgREST` via RLS + REVOKE corrigida. Booking público E2E validado em produção.
- **Resultado:** P0 de segurança fechado

---

## 2026-06-19

### Auditoria de Roadmap
- **Resumo:** Auditoria roadmap completa (24 seções). Divergências corrigidas no capabilities-map.
- **Arquivos:** `.opencodex/brain/audits/AUDITORIA-ROADMAP-MULTGESTOR-2026-06-19.md`
- **Resultado:** production-readiness + commercial-readiness criados

---

## 2026-06-18

### Auditoria Completa (24 seções)
- **Resumo:** 24 seções auditadas. Veredito APROVADO C/ BLOQUEIOS P1 (backup local, outbox orphaned, Redis, RLS).
- **Arquivos:** `.opencodex/audits/`
- **Resultado:** Achados A-001 a A-024 documentados

### `ops/reconcile-orphaned-outbox-messages`
- **Resumo:** 4 cash_session orphaned → processed. outbox_messages.failed=0.
- **Resultado:** A-003 resolvido

### `e2e-public-booking-validation`
- **Resumo:** GET booking-info ✅, GET slots ✅, no 500s. Achados: chave settings (não bookingSettings), 1 colaborador bookable, serviceId obrigatório.
- **Resultado:** Validação E2E manual do booking público

### `ops/register-daily-backup-scheduler`
- **Resumo:** Scheduler ativo State=Ready, NextRunTime 02:00, RPO ~24h.
- **Resultado:** Backup automático ativo

### BACKUP-RESTORE-CHECK
- **Resumo:** Dump Fase 1 OK. Restore Fase 2 evidenciado via MCP. Gate passou.
- **Resultado:** Missões desbloqueadas

---

## 2026-06-17

### Restore testado em banco descartável
- **Resumo:** Restore-check 2026-06-17 executado com sucesso
- **Resultado:** Gate de restore validado

---

## 2026-06-15

### Auditoria Fundamental MultGestor
- **Resumo:** Auditoria completa do sistema. ~70% pronto para piloto pago.
- **Arquivos:** `.opencodex/brain/audits/AUDITORIA-FUNDAMENTAL-MULTGESTOR-2026-06-15.md`

### XSS Hardening — Bloco B+C (PR #6)
- **Resumo:** Portão de entrada XSS fechado. POST /api/auth/register com <script> → 400. PR #6 mergeado + deployado.
- **PR:** #6
- **Deploy:** ✅ Success
- **Resultado:** Ciclo XSS Bloco B+C fechado

### XSS Bloco A — companies.name + users.name
- **Resumo:** 3 registros sanitizados via UPDATE (só name). Count(~'[<>]') = 0. Ciclo XSS CLOSED.
- **Resultado:** Stored XSS eliminado

### SECURITY-SECRETS-ROTATION pausada
- **Resumo:** Rotação de segredos adiada por decisão humana (deferred)
- **Resultado:** OPS-SUPAVISOR bloqueado até revisão

### Drift reminder_sent_at (023) + outbox_message_handlers (022)
- **Resumo:** Migrações aplicadas em prod via MCP (não via CI — Supavisor OPS pendente)
- **Resultado:** Schema drift corrigido

---

## 2026-06-07

### Brain V3 — Criação do Segundo Cérebro
- **Resumo:** Criação de `.opencodex/brain/` como fonte única. CHECK 0 + Loop de Fechamento. Archive-index do `.agent/`. Branch `chore/second-brain-v3`.
- **Arquivos:** `.opencodex/brain/*` (source-of-truth, constitution, project-state, capabilities-map, architecture-decisions, context-confidence-engine, implementation-log, lessons-learned, INDEX, README)
- **Commits:** `67ee6ac`
- **PR:** —
- **Deploy:** —
- **Resultado:** Cisma de governança resolvido. Fonte única estabelecida.
- **Lições:** L-02 — Dois cérebros desconectados. L-01 — git clean apagou governança.

### EVENT CONTRACTS factory + gate
- **Resumo:** AppointmentEvents factory. Refactor do AppointmentService (zero hardcode, validateEventPayload centralizado). Gate no auditor-flow.
- **Commits:** `50a64dd`, `bc8e6f8`
- **Resultado:** 653 unit tests. APPROVE.

### F2 inc.2 — Mutation paths duráveis
- **Resumo:** update (confirmed/canceled/completed) + reschedule via UnitOfWork. Dual-emit in-memory.
- **Commits:** `0d654f3`
- **Resultado:** APPROVE_WITH_NOTES (pendente integração)

### F2 inc.1 — appointment.created durável
- **Resumo:** AppointmentService.create → UnitOfWork + uow.addEvent atômico. appointment.confirmed in-memory pós-commit.
- **Commits:** `823107c`
- **Resultado:** APPROVE. Em origin/main (fea9708).
- **Lições:** L-04 — Migração não pode dropar comportamento.

### Reconciliação para main (GATE-INTEG)
- **Resumo:** CI run 27097235191 = SUCCESS. FF autorizado → main avança de fea9708. CI em main.

### fix-eventbus-publish — Bug crítico pego pelo GATE-INTEG
- **Resumo:** event-bus.js:31 event_name solto → ReferenceError. 7 call sites afetados. 1º teste de integração real expôs.
- **Lições:** L-09 — Mocks escondiam bug crítico. GATE-INTEG provou valor na 1ª execução.

### fix update só-notas (L-10)
- **Resumo:** AppointmentService.update normalizava status para '' quando ausente → violava CHECK constraint.
- **Lições:** L-10 — Normalização defensiva pode transformar ausente em valor inválido.

---

## 2026-06-06

### F6 — OutboxWorker no-op sem handler
- **Resumo:** Evento sem handler → processed + WARN (antes: failed). Cura sale.created acumulando failed.
- **Commits:** `6c3c81a`
- **Resultado:** APPROVE. Em origin/main.

---

## 2026-06-05/06

### RLS Fase 1 (CI-only)
- **Resumo:** Role app_runtime (NOBYPASSRLS) no CI. Testes de isolamento. 32/32 integração.
- **Commits:** `a179085`
- **Resultado:** APPROVE. Em origin/main.

---

## < 2026-06-05

### Histórico anterior
- **Resumo:** Sprints 0–17. Estabilização, shared kernel, booking-engine, ClimaGestor scaffold, Redis, Pino, Sentry, RLS shadow, CI/CD, trial emails, lembrete WhatsApp.
- **Fonte:** [[archive-index/agent-archive-index]] (histórico `.agent/`)

---

## Registro de Lições por Evento

| Data | Evento | Lição |
|---|---|---|
| 2026-06-23 | Violação L-93 | L-93 — Migração manual em main |
| 2026-06-15 | Secrets rotation | Deferred por decisão humana |
| 2026-06-07 | Dois cérebros | L-02 — Fonte única necessária |
| 2026-06-07 | git clean | L-01 — Governança rastreada |
| 2026-06-07 | Dual-emit | L-04 — Não dropar consumer ativo |
| 2026-06-07 | F2 inc.2 | L-06 — Auditor automático subestima regra nova |
| 2026-06-07 | EVENT CONTRACTS | L-05 — Hardcode sem validação |
| 2026-06-07 | EventBus bug | L-09 — Mocks escondem bug |
| 2026-06-07 | Status '' | L-10 — Normalização defensiva |
| 2026-06-07 | Dois formatos | L-08 — Formato único de evento |
| 2026-06-05/06 | RLS | L-07 — BYPASSRLS inerte |
| 2026-06-04 | git clean | L-01 — Runner sem git clean |
| F2 | Transporte volátil | L-03 — Eventos críticos na outbox |

---

## Relacionamentos

- [[implementacao-log]] — Log de implementações (fonte primária)
- [[00-HOME]] — Homepage
- [[status-dinamico]] — Estado atual
- [[status-atual]] — Estado detalhado
- [[licoes-aprendidas]] — Lições aprendidas
- [[incidents/README]] — Biblioteca de incidentes
- [[living-os/02-painel-executivo]] — O que mudou (Living OS)
- [[archive-index/agent-archive-index]] — Histórico anterior a 06-05
