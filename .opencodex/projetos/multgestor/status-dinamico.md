# 📊 Estado do Projeto — Current State

> **Status:** OFICIAL • VIVO • ATUALIZADO A CADA MISSÃO
> **Atualizado:** 2026-07-04
> **state_version:** 25
> **Fonte canônica detalhada:** [[status-atual]]
> **Living OS:** [[living-os/02-painel-executivo]]
> **Manual de execução (roadmap+gates vivos):** [[execucao-producao]]

---

## 🔄 Atualização pós-auditoria — 2026-07-03

> Fontes: [[../audits/2026-07-02-auditoria-completa-e-sprint-p0]] · [[../audits/2026-07-03-due-diligence-enterprise]]

**Maturity Index: 57/100** (era 44,5 em 26/06). Sprint P0 autônomo CONCLUÍDO — **17 commits
locais em `main` sem push** (`ace2d05`..`f2de9fe`):

- ✅ **Implementado+testado (local):** writes tenant → `app_runtime` (bypass RLS fechado, `02c5396`) ·
  rotação/revogação de refresh + migração 030 (`f03af4d`) · migrations 018-021 versionadas ·
  TLS verify por env (inerte sem CA) · CSP on · lint frontend 0 errors · terra fantasma removido ·
  purga diária refresh_tokens · fix sale_date fallback (`24d7497`) · unwrap pool client (`57619bd`)
- ✅ **Auditado:** smoke local **20/20** (fluxo completo + isolamento A/B + sessão ao vivo) ·
  enforcement RLS 98/98 vs banco de teste · prod health/booking/frontends 200
- 🔴 **Risco ativo (release):** `main` local **divergiu** de `origin/main` — origin tem PRs #20/#21
  (mesmo conteúdo, SHAs diferentes); local tem 27 commits à frente **incl. geladeira BG-001 e
  `becb0ee` nunca deployados**. Merge dry-run: 3 conflitos pequenos mapeados.
- 🔴 **Gap central self-service (novo, due diligence):** webhook de pagamento NÃO seta
  `companies.plan_type` → cliente pago é bloqueado no fim do trial (raiz do incidente D-016).
  + `plans` vazia em prod + `VITE_KIWIFY_URL_*` não confirmadas no Vercel.
- ⏳ **Bloqueado por humano:** merge+push+deploy (gate `release/push-p0-batch` em queue/next-task.md) ·
  CA TLS no Render · credenciais Meta (WhatsApp é **mock em prod**) · termos/LGPD · lista de
  deleção de artefatos · produtos Kiwify.
- 📌 **Decisões pendentes:** aprovar P0 comercial da due diligence (circuito de receita, ~1 semana).

## 🔄 Atualização pós-auditoria Core×Nicho — 2026-07-03

> Fonte: [[../audits/2026-07-03-core-vs-nicho-audit]] — auditoria separada, mede "pronto para
> virar plataforma multi-nicho" (não confundir com o Maturity Index de produto acima).

**MultGestor Core Completion Index: 52/100.** O Core hoje é, na prática, o BarberGestor com uma
plataforma em construção por baixo. Achado central: 4 pontos de acoplamento indevido em arquivos
que já se declaram genéricos (`company.service.js` importa `barber-helpers` e tem defaults
`'Barbearia'` hardcoded; `clima.routes.js` usa `requireBarberAdminAuth` por engano — bug de
segurança, não só de arquitetura; `ModuleRoute.jsx`/`AuthContext.jsx` têm scopes fixos
`master`/`barber`). Nenhum é grande (~2 dias de correção), mas todos bloqueiam qualquer nicho novo.

O ClimaGestor (único teste real de extensibilidade) prova o tamanho do problema: backend ~50%
(schema+rotas existem, auth errada) e frontend ~1% (`Clima.jsx` é stub de 7 linhas), sem
nenhuma empresa real usando após meses. `capabilities-map.md` foi corrigido: o "Booking Engine"
compartilhado só é real nas funções puras (`scheduling-utils.js`) — os services com estado
(`booking-appointments.service.js`) são 100% barber por dentro.

Maior alavanca identificada: um **registry dinâmico de rotas por módulo** (hoje hardcoded em
`server.js`/`App.jsx`) — sem isso, nenhum template de nicho elimina o "editar arquivo core à
mão". Novo modelo reutilizável criado: [[runbooks/MODELO-AUDITORIA-NICHO]] para auditar
qualquer nicho futuro sem repetir esta investigação inteira.

**Isso não bloqueia a venda do BarberGestor** (due diligence de produto continua valendo) — é
uma frente paralela sobre arquitetura de plataforma, não sobre prontidão comercial.

## 🔄 Atualização — Context Pack canônico — 2026-07-04

> Missão `knowledge/context-pack-padrao`. Detalhe: [[../handoff/context-pack/PACK-00-LEIA-PRIMEIRO]]

Criado `.opencodex/handoff/context-pack/` — 6 arquivos enxutos (~350 linhas) derivados deste
documento + `EXECUTION-PLAYBOOK-PRODUCAO.md` + `MULTGESTOR-PLATFORM-SPECIFICATION.md` +
`decisions/` + `BRIEFING-CLAUDE-CODE.md`, para alimentar os "Arquivos do Projeto" do Claude
Project (cache entre conversas, sem colar documento a cada sessão nova). Regenerado por
`node scripts/generate-context-pack.js`, agora passo obrigatório 11 do Mission Closing
Protocol. Pack é **derivado**, nunca fonte (D-015) — ninguém edita os `PACK-0X.md` à mão.

## 🔄 Atualização Pós-Implementação — Core P0 — 2026-07-03

> Decisão: [[decisions/D-017-core-p0-fronteira-nicho]] · Spec: [[plataforma]]

Os 4 achados P0 da auditoria acima foram **implementados e validados** (commits locais, sem
push): `company.service.js` limpo de `barber-helpers`/defaults `'Barbearia'`/JOIN com
`barber_collaborators` ([backend/src/services/company.service.js](../../backend/src/services/company.service.js));
`getBarberMe` movido para a fronteira correta ([backend/src/services/barber-core.service.js](../../backend/src/services/barber-core.service.js));
guard genérico `requireTenantAdminAuth` criado e em uso em `clima.routes.js`
([backend/src/middlewares/auth.middleware.js](../../backend/src/middlewares/auth.middleware.js));
scopes nomeados em `constants/authScopes.js` substituindo literais em `ModuleRoute.jsx` e
`AuthContext.jsx`. Novos guards genéricos de Core (`ensureCompany`/`ensureAdmin`) em
`shared/tenant/guards.js`.

**Evidência:** suíte backend 678 pass/0 fail · lint frontend 0 errors · build frontend ok ·
smoke local 8/9 (login master, login BarberGestor, `/master/modules`, `/barber/me`,
`/barber/dashboard`, `/clima/info` autenticando e bloqueando por módulo — 403, não 401 —,
`/master/companies`). 1 falha incidental (`/barber/company/theme`, 500) isolada a
`branding.service.js`/`branding.repository.js` — arquivos não tocados por esta missão,
pré-existente no banco de teste local, fora do escopo.

**Nenhuma mudança de comportamento do BarberGestor** — confirmado por suíte completa +
smoke. Documento oficial da plataforma criado:
[[plataforma]] (constituição, contrato Core×Nicho, catálogos,
manifesto de nicho, release gate, DoR/DoD).

**Próximo P1 recomendado:** registry dinâmico de rotas por módulo (maior alavanca de
extensibilidade restante) — condicionado à decisão pendente D-005 (investir ou congelar
ClimaGestor), para não generalizar sem um segundo caso de uso real.

## Identificação

| Campo | Valor |
|---|---|
| **Projeto** | MultGestor v2 |
| **state_version** | 21 |
| **Fase atual** | Knowledge OS 3.0 — Second Brain V3 concluído |
| **Commit HEAD (origin/main)** | `e95d43b` |
| **Último merge** | PR #12 — feat/master-panel-clean |
| **Branch ativa** | `main` (Fase C fechada) |

---

## Ambientes

| Ambiente        | URL                                | Status                      |
| --------------- | ---------------------------------- | --------------------------- |
| **Produção**    | `https://barbergestorapp.com.br`   | 🟢 Online                   |
| **Backend**     | Render                             | 🟢 Health 200, DB conectado |
| **Frontend**    | Vercel                             | 🟢 Ativo                    |
| **Banco**       | Supabase PostgreSQL 17 (sa-east-1) | 🟢 Conectado                |
| **Backup**      | Local + Backblaze B2               | 🟢 `verified=true`          |
| **Homologação** | —                                  | ⚪ Não configurado           |

---

## Clientes em Produção

| Empresa | Plano | Status | Colaboradores | Nota |
|---|---|---|---|---|
| **Barbearia JoeFelipe** (`ed607874…`) | `premium` | 🟢 active | 8 usuários (1 admin + 7 colab.) | Promovida a premium em **2026-06-29** (trial expirado bloqueava caixa). Ver [[decisions/D-016-plano-joefelipe-premium]]. Colaboradores ilimitados. |

---

## Últimos PRs

| PR | Branch | Merge | Deploy |
|---|---|---|---|
| #16 | fase-c/consolidar-segundo-cerebro | `bd13f69` | ✅ Success |
| — | knowledge-os-v3 (doc-only) | — | ⏭️ N/A (doc-only) |
| #15 | fase-c/redacao-opencodex | `af04618` | ⏭️ paths-ignore |
| #13 | fase-c/pr-1 | `863d811` | ✅ Success |
| #12 | feat/master-panel-clean | `e95d43b` | ✅ Success |
| #7 | chore/brain-queue-cleanup | `21317cd` | ✅ Success |
| #6 | xss-register-hardening | — | ✅ Deployado |

---

## Últimos Deploys

| Data | Deploy | Status |
|---|---|---|
| 2026-06-23 | PR #16 (consolidar-segundo-cerebro) | ✅ Success |
| 2026-06-23 | PR #13 (joefelipe-safety-tests) | ✅ Success |
| 2026-06-18 | Backup-restore-check | ✅ Validado |
| 2026-06-15 | XSS Hardening B+C | ✅ Deployado |
| 2026-06-07 | Brain V3 | ✅ Mergeado |

---

## Roadmap — Status Executivo

```
▓▓▓▓▓▓▓▓░░░░░░  Camada 1 — Fundação Segura (7/14)  🟡
▓▓▓▓▓░░░░░░░░░  Camada 2 — Produto Vendável (6/13)  🟡
░░░░░░░░░░░░░░  Camada 3 — Escala Multi-Nicho (0/6) ⚪
```

### Camada 0 — Knowledge OS 3.0 ✅ CONCLUÍDO (2026-06-24)
- ✅ 7 camadas lógicas definidas (INDEX.md)
- ✅ Constitution Knowledge OS criada
- ✅ Mission Closing Protocol V3
- ✅ Digital Twin (6 módulos: barbergestor completo + 5 vision)
- ✅ Feature Genome (template + 2 genomas)
- ✅ Impact Graph (template + 3 análises)
- ✅ Simulation Center (metodologia + 3 cenários)
- ✅ AI Brain reescrito + Agent × Skill Matrix
- ✅ Mission Builder + Planner + Providers documentados
- ✅ Knowledge DNA, Health, Memory criados
- ✅ Decision Graph (11 decididas + 5 pendentes)
- ✅ Digital Ops Center + Executive Intelligence
- ✅ 4 integrações finais (Home, Dashboard, Graph, OS)

### Camada 1 — Produção Segura (7/14 ✅ · 2/14 🟡 · 5/14 ❌)
- ✅ Backup externo B2 validado
- ✅ Restore documentado e validado
- ✅ CI roda testes a cada push
- ✅ Health check profundo
- ✅ Sentry capturando erros
- ✅ Logs com correlation ID
- ✅ Backup diário local ativo
- 🟡 Testes de integração em CI (Postgres configurado)
- 🟡 POST booking testado manual
- ❌ RLS companies/users — A-001
- ❌ Redis produção — A-004
- ❌ Migration fail-fast — A-005
- ❌ Alerta backup/outbox — A-018
- ❌ E2E automatizado — A-008/A-009

### Camada 2 — Vendável (6/13 ✅)
- 🟢 Fluxo onboarding ✅
- 🟢 Cadastro serviços ✅
- 🟢 Trial ativo ✅
- 🟢 Booking público funcional
- 🟡 Confirmação cliente (email/WhatsApp)
- 🟡 Plano definido (Starter/Pro)
- 🟡 Painel do dono utilizável
- ❌ UX sem states vazios
- ❌ Webhook pagamento
- ❌ Feature gate inadimplente
- ❌ Trial → pago testado
- ❌ Canal suporte
- ❌ Política privacidade

---

## Backlog Imediato

| Prioridade | Missão | Tipo |
|---|---|---|
| P1 🚨 | `security/rls-companies-users-policy` | Segurança |
| P1 🚨 | `infra/redis-production-config` | Infraestrutura |
| P1 🚨 | `cicd/migrations-fail-fast` | CI/CD (bloqueado) |
| P2 | `cleanup/fase-c-branches-worktrees` | Higiene |
| P2 | `agent/joefelipe-consolidation` | Agente |
| P2 | `e2e-public-booking-validation` | Qualidade |

---

## Riscos Ativos

| ID | Risco | Severidade | Status |
|---|---|---|---|
| R-001/A-002 | Perda de backup (HD local) | ~~P1~~ 🟢 Monitorado | Backup B2 validado 2026-06-22 |
| R-002/A-001 | Isolamento multi-tenant incompleto | 🔴 P1 | companies/users sem RLS |
| R-003/A-004 | Rate limit volátil sem Redis | 🔴 P1 | Fallback in-memory ativo |
| R-004/A-005 | Migration fail silencioso | 🔴 P1 | continue-on-error: true |
| R-005 | XSS residual em campos não auditados | 🟡 P2 | Ciclo XSS fechado 06-14 |
| R-006 | OutboxWorker sem alerta de acúmulo | 🟡 P2 | Sem monitoramento |
| R-007 | Sem E2E automatizado | 🟡 P2 | Regressão não detectada |
| R-008 | CSP desligado | 🟡 P2 | Helmet sem CSP |

---

## Health Score

| Dimensão | Pontos | Peso | Score |
|---|---|---|---|
| Produção online | 100 | 15% | 15 |
| Backup validado | 100 | 15% | 15 |
| Segurança | 60 | 20% | 12 |
| CI/CD | 70 | 15% | 10.5 |
| Testes | 65 | 15% | 9.75 |
| Produto | 60 | 10% | 6 |
| Governança | 90 | 10% | 9 |
| **Total** | | **100%** | **77.25/100** 🟡 |

---

## Pendências

- [x] `knowledge-os-v3` — CONCLUÍDO (2026-06-24)
- [ ] `cleanup/fase-c-branches-worktrees` — HUMAN_APPROVAL_REQUIRED
- [ ] RLS companies/users — Aguardando decisão
- [ ] Redis produção — Aguardando decisão (custo vs risco)
- [ ] WhatsApp — Real vs mock documentado
- [ ] Migration fail-fast — Bloqueado por OPS-SUPAVISOR
- [ ] Segredo: SECURITY-SECRETS-ROTATION pausada (deferred)

---

## Status Executivo

> **MultGestor v2 está ONLINE e OPERACIONAL.** BarberGestor processa agendamentos reais. Backup está seguro (local + B2). Outbox saudável (failed=0). 
>
> **Ainda NÃO está pronto para venda** — 5 critérios P1 de produção não atendidos (RLS, Redis, migration fail-fast, alertas, E2E). Todos os gates (produção, segurança, vendável) estão 🔴 BLOCKED.
>
> **Fase C foi FECHADA em 2026-06-23** — consolidação do Second Brain concluída. Próximo passo: `cleanup/fase-c-branches-worktrees` (aguardando autorização humana).

---

## Relacionamentos

- [[status-atual]] — Estado detalhado (fonte canônica)
- [[production-readiness]] — Critérios de produção
- [[commercial-readiness]] — Critérios comerciais
- [[living-os/02-painel-executivo]] — Painel executivo Living OS
- [[living-os/03-producao]] — Produção segura Living OS
- [[living-os/gates/gate-producao]] — Gate de produção
- [[living-os/gates/gate-seguranca]] — Gate de segurança
- [[living-os/gates/gate-vendavel]] — Gate vendável
- [[living-os/riscos/riscos-ativos]] — Riscos ativos
- [[living-os/scorecards/producao-scorecard]] — Scorecard produção
- [[living-os/scorecards/vendavel-scorecard]] — Scorecard vendável
- [[00-HOME]] — Homepage do Second Brain
