# Ã°Å¸Â§Â± MATRIZ DE CONSOLIDAÃƒâ€¡ÃƒÆ’O DO CORE Ã¢â‚¬â€ MultGestor

> **Tipo:** documento canÃƒÂ´nico factual. Fonte ÃƒÂºnica da consolidaÃƒÂ§ÃƒÂ£o do Core.
> **Criado:** 2026-07-16 Ã‚Â· **MissÃƒÂ£o:** 12.1A Ã‚Â· **Modo:** READ_ONLY sobre cÃƒÂ³digo, testes, banco, CI, infra e produÃƒÂ§ÃƒÂ£o.
> **RevisÃƒÂ£o 1 Ã¢â‚¬â€ 2026-07-16 (OPS-MIGRATIONS-01):** bloco DATAOPS reclassificado com autorizaÃƒÂ§ÃƒÂ£o humana. `DATAOPS-002` Ã¢â€ â€™ `NÃƒÆ’O_COMPROVADO`; `DATAOPS-001` Ã¢â€ â€™ job existe mas **nÃƒÂ£o ÃƒÂ© bloqueante**; risco de drift registrado. RelatÃƒÂ³rio: [[../../auditorias/multgestor/2026-07-16-ops-migrations-01]].
> **RevisÃƒÂ£o 3 Ã¢â‚¬â€ 2026-07-20 (OPS-MIGRATIONS-03D):** Ã¢Å“â€¦ **MECANISMO CRIADO E COMPROVADO.** `DATAOPS-002` Ã¢â€ â€™ **`ATIVO_AUTOMATICO_COMPROVADO`**; `DATAOPS-001` Ã¢â€ â€™ **gate bloqueante ativo**. Migrations de produÃƒÂ§ÃƒÂ£o agora sÃƒÂ£o automÃƒÂ¡ticas, bloqueantes, estritas, idempotentes e reversÃƒÂ­veis (`buildCommand = npm install && npm run migrate:prod`). Backlog `ops/migrations-02-evidencia-painel` **encerrado**. EvidÃƒÂªncias: [[../../brain/plans/OPS-MIGRATIONS-03D-plano]] Ã‚Â§ ENCERRAMENTO.
>
> **RevisÃƒÂ£o 2 Ã¢â‚¬â€ 2026-07-16 (verificaÃƒÂ§ÃƒÂ£o humana):** Ã¢Å“â€¦ **INCÃƒâ€œGNITA FECHADA.** `DATAOPS-002` Ã¢â€ â€™ **`AUSENTE` confirmado** (o Render **nÃƒÂ£o** roda migration; a afirmaÃƒÂ§ÃƒÂ£o de `deploy.yml:43` ÃƒÂ© **falsa**). **Drift MENSURADO = ZERO** (banco alinhado atÃƒÂ© `031`) Ã¢â‚¬â€ mas por **aÃƒÂ§ÃƒÂ£o manual**, nÃƒÂ£o por processo: as **5 camadas** que deveriam garantir aplicaÃƒÂ§ÃƒÂ£o estÃƒÂ£o **todas ausentes**. PrÃƒÂ³xima missÃƒÂ£o Ã¢â€ â€™ **`OPS-MIGRATIONS-03`** ([[../../brain/plans/OPS-MIGRATIONS-03-plano]]). Baseline **inalterado** (`4c8ce847`); nenhum cÃƒÂ³digo, workflow, banco, Render ou secret tocado.
> **Autoridade:** ver [[../../areas/governanca/fonte-unica-verdade]]. Em conflito com qualquer outro documento sobre o **estado do Core**, esta matriz prevalece.
> **Regra de honestidade:** documento ÃƒÂ© pista; sÃƒÂ³ cÃƒÂ³digo, teste, CI, telemetria ou comportamento observado elevam o nÃƒÂ­vel de comprovaÃƒÂ§ÃƒÂ£o. AusÃƒÂªncia de evidÃƒÂªncia ÃƒÂ© registrada como ausÃƒÂªncia Ã¢â‚¬â€ nunca preenchida por inferÃƒÂªncia.

---

## ANEXO A Ã¢â‚¬â€ Baseline congelado

| Campo | Valor |
|---|---|
| **Data/hora (UTC)** | 2026-07-16T16:18:01Z |
| **RepositÃƒÂ³rio** | `C:/MultGestor.v2` |
| **Branch** | `main` |
| **HEAD** | `4c8ce8470634a6d3fc1b91f8341ed912f845c0e9` |
| **HEAD (data/assunto)** | 2026-07-14T10:44:04-04:00 Ã‚Â· "Merge pull request #46 from JoeGestorpro/fix/nodemailer-security-upgrade" |
| **origin/main** | `4c8ce8470634a6d3fc1b91f8341ed912f845c0e9` (idÃƒÂªntico ao HEAD) |
| **Ahead / Behind** | **0 / 0** Ã¢â‚¬â€ sincronizada |
| **Stashes** | **nenhum** (`git stash list` vazio) |
| **PRs abertas** | **0** (`gh pr list --state open --json` Ã¢â€ â€™ `[]`; autenticado como `JoeGestorpro`) |

**Modificados (rastreados) Ã¢â‚¬â€ todos documentais:**
- `.opencodex/projetos/multgestor/indice.md`
- `.opencodex/projetos/multgestor/roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR.md`

**Untracked:** `.opencode/plans/` Ã‚Â· `.opencodex/maps/` Ã‚Â· `.opencodex/projetos/multgestor/incidentes/INC-004-exposicao-credencial-runtime-scratch.md` Ã‚Â· `.opencodex/projetos/multgestor/_inbox/antigos/duplicatas/roadmap-roadmap/capacidades.md` Ã‚Â· `.opencodex/projetos/multgestor/_inbox/antigos/duplicatas/roadmap-roadmap/`

**Worktrees:**
| Caminho | Commit | Branch |
|---|---|---|
| `C:/MultGestor.v2` | `4c8ce84` | `main` |
| `C:/mg-governanca` | `4c8ce84` | `chore/governanca-fluxo-codigo` |
| `C:/mg-preservacao` | `3c60918` | `recovery/bancada-cleanup-2026-07-12` |

**Desvio durante a auditoria:** nenhum. O `git status` ao final ÃƒÂ© idÃƒÂªntico ao baseline (verificado apÃƒÂ³s a execuÃƒÂ§ÃƒÂ£o da suÃƒÂ­te de testes). Todas as conclusÃƒÂµes valem para `4c8ce847`.

---

## ANEXO B Ã¢â‚¬â€ Metodologia e limitaÃƒÂ§ÃƒÂµes

### Comandos de evidÃƒÂªncia efetivamente executados

| EvidÃƒÂªncia | Comando | Resultado |
|---|---|---|
| Baseline Git | `git rev-parse HEAD` Ã‚Â· `git rev-list --count` | `4c8ce847`; 0/0 |
| PRs remotas | `gh pr list --state open --json ...` | `[]` (0 abertas) |
| Testes unitÃƒÂ¡rios | `NODE_ENV=test JWT_SECRET=Ã¢â‚¬Â¦ npx jest --testPathPatterns=tests/unit --silent` | **53 suÃƒÂ­tes / 765 testes Ã¢â‚¬â€ 100% passando**, 19,6s (local, 2026-07-16) |
| Invariante I-1 | `grep -rn "barber_\|clima_" backend/src/shared/` | **1 ocorrÃƒÂªncia** |
| Acoplamento A7 | `grep -c "barber_" services/booking-*.service.js` | 59 e 32 (**91 total**) |
| Cobertura RLS | `grep -rhoiE "CREATE POLICY Ã¢â‚¬Â¦ ON Ã¢â‚¬Â¦" src/database/*.sql` | **40 tabelas com policy** |
| Tabelas totais | `grep -rhoiE "CREATE TABLE Ã¢â‚¬Â¦" src/database/*.sql` | 57 (inclui artefatos de parsing) |

### LimitaÃƒÂ§ÃƒÂµes desta auditoria Ã¢â‚¬â€ leia antes de usar a matriz

| # | LimitaÃƒÂ§ÃƒÂ£o | ConsequÃƒÂªncia |
|---|---|---|
| **L-1** | **ProduÃƒÂ§ÃƒÂ£o NÃƒÆ’O foi verificada.** O MCP Supabase respondeu `Unauthorized. Please provide a valid access token` Ã¢â‚¬â€ nenhuma consulta ao banco de produÃƒÂ§ÃƒÂ£o foi possÃƒÂ­vel. | **Nenhuma linha desta matriz atinge `COMPROVADO EM PRODUÃƒâ€¡ÃƒÆ’O` por verificaÃƒÂ§ÃƒÂ£o prÃƒÂ³pria.** Onde produÃƒÂ§ÃƒÂ£o ÃƒÂ© citada, a fonte ÃƒÂ© documental e estÃƒÂ¡ marcada como tal. |
| **L-2** | **CI nÃƒÂ£o foi executado nesta auditoria.** EvidÃƒÂªncia de CI vem da leitura de `.github/workflows/ci.yml` (o que o pipeline *declara* executar), nÃƒÂ£o de um run observado. | `VALIDADO EM CI` significa "o CI declara e estÃƒÂ¡ configurado para provar", nÃƒÂ£o "vi o run verde". |
| **L-3** | **Testes de integraÃƒÂ§ÃƒÂ£o nÃƒÂ£o foram executados localmente** (exigem Postgres + Redis + role `app_runtime`). SÃƒÂ³ a suÃƒÂ­te unitÃƒÂ¡ria rodou. | Cobertura de integraÃƒÂ§ÃƒÂ£o ÃƒÂ© inferida do CI (L-2). |
| **L-4** | **Cobertura de RLS medida por migrations, nÃƒÂ£o pelo banco.** Migrations 027/028 declaram "JÃƒÂ¡ possui RLS habilitado" Ã¢â‚¬â€ ou seja, houve `ENABLE` **fora** dos arquivos versionados. | O nÃƒÂºmero real em prod pode divergir. Contar `ENABLE` subestima; por isso a mÃƒÂ©trica adotada ÃƒÂ© **policy por tabela**. |
| **L-5** | **ConfiguraÃƒÂ§ÃƒÂ£o do Render nÃƒÂ£o ÃƒÂ© inspecionÃƒÂ¡vel** a partir do repositÃƒÂ³rio (sem `render.yaml`/`Procfile`). Ã°Å¸â€â€ž **Confirmado e agravado pela OPS-MIGRATIONS-01 (2026-07-16):** painel e logs tambÃƒÂ©m sÃƒÂ£o inacessÃƒÂ­veis ao agente (`list_connected_browsers` Ã¢â€ â€™ `[]`; login vedado; CLI ausente). | ~~A afirmaÃƒÂ§ÃƒÂ£o de que o Render aplica migrations em runtime **permanece `NÃƒÆ’O_COMPROVADO`**. **SÃƒÂ³ um humano resolve**.~~ Ã¢Å“â€¦ **SUPERADO em 2026-07-20:** o MCP do Render passou a expor a configuraÃƒÂ§ÃƒÂ£o ao agente, e a 03D leu, alterou e comprovou o `buildCommand` por API. A limitaÃƒÂ§ÃƒÂ£o de **nÃƒÂ£o-versionamento** da config persiste (segue sem `render.yaml`), mas ela **deixou de ser inspecionÃƒÂ¡vel apenas por humano**. Ver `DATAOPS-002`. |
| **L-6** | **Nenhum secret foi lido.** `backend/check-rls.js` e `check-rls2.js` existem localmente e **nÃƒÂ£o foram abertos** por risco de conter credencial (INC-004). | ConteÃƒÂºdo desses arquivos permanece nÃƒÂ£o auditado, por decisÃƒÂ£o deliberada. |

### Estados e evidÃƒÂªncia

Estados: `NÃƒÆ’O EXISTE` Ã‚Â· `EXISTE PARCIALMENTE` Ã‚Â· `EXISTE MAS PRECISA REESTRUTURAÃƒâ€¡ÃƒÆ’O` Ã‚Â· `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· `CONCLUÃƒÂDA`

ProgressÃƒÂ£o: `DOCUMENTADO Ã¢â€ â€™ IMPLEMENTADO Ã¢â€ â€™ VALIDADO LOCAL Ã¢â€ â€™ VALIDADO EM CI Ã¢â€ â€™ COMPROVADO EM PRODUÃƒâ€¡ÃƒÆ’O`

`CONCLUÃƒÂDA` exige implementaÃƒÂ§ÃƒÂ£o real + posicionamento arquitetural correto + DoD integral + ausÃƒÂªncia de lacuna crÃƒÂ­tica + testes proporcionais ao risco + evidÃƒÂªncia referenciada + nenhuma divergÃƒÂªncia invalidante. **`CONCLUÃƒÂDA` nÃƒÂ£o implica produÃƒÂ§ÃƒÂ£o**; o DoD individual define o nÃƒÂ­vel mÃƒÂ­nimo de evidÃƒÂªncia.

---

## MATRIZ DE CAPACIDADES

> Todas as linhas: Lifecycle `ACTIVE`, salvo indicaÃƒÂ§ÃƒÂ£o. EvidÃƒÂªncia ancorada em `4c8ce847`.

### Bloco IDENT Ã¢â‚¬â€ Identidade e autenticaÃƒÂ§ÃƒÂ£o

#### `IDENT-001` Ã¢â‚¬â€ AutenticaÃƒÂ§ÃƒÂ£o JWT com escopos
- **Bloco:** IDENT Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO EM CI`
- **ProveniÃƒÂªncia:** `backend/src/middlewares/auth.middleware.js` (sÃƒÂ­mbolos `requireAuth`, `requireBackofficeAuth`, `requireMasterAdminAuth`, `inferAuthScope`) Ã‚Â· `backend/src/shared/core/auth/roles.js` Ã‚Â· suÃƒÂ­te unitÃƒÂ¡ria 765/765 (local, 2026-07-16) Ã‚Â· commit `4c8ce847`
- **Lacuna:** o escopo emitido ÃƒÂ© literalmente `'barber_admin'` (`roles.js:17`) Ã¢â‚¬â€ **ÃƒÂºnico auth_scope de tenant-admin do sistema**. Ver `IDENT-002`.
- **DependÃƒÂªncias:** Ã¢â‚¬â€ Ã‚Â· **Bloqueadores:** `IDENT-002` (P2)
- **DoD:** escopos por mÃƒÂ³dulo emitidos e validados; nenhum nome de nicho no scope. **NÃƒÂ£o atendido.**
- **PrÃƒÂ³xima aÃƒÂ§ÃƒÂ£o:** coberto por `IDENT-002`.

#### `IDENT-002` Ã¢â‚¬â€ Escopo de auth genÃƒÂ©rico por mÃƒÂ³dulo
- **Bloco:** IDENT Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE PARCIALMENTE` Ã‚Â· **EvidÃƒÂªncia:** `IMPLEMENTADO` (alias apenas)
- **ProveniÃƒÂªncia:** `backend/src/middlewares/auth.middleware.js:128` Ã¢â€ â€™ `const requireTenantAdminAuth = requireBarberAdminAuth;` Ã‚Â· comentÃƒÂ¡rio no cÃƒÂ³digo (`:121-127`): *"Alias genÃƒÂ©rico: hoje 'barber_admin' ÃƒÂ© o ÃƒÂºnico auth_scope emitidoÃ¢â‚¬Â¦ Quando o sistema emitir auth_scope por mÃƒÂ³dulo, sÃƒÂ³ este alias muda."* Ã‚Â· commit `ae31b65` "fix(core): close 4 core-x-nicho coupling findings from p0 audit" (2026-07-03, **confirmado em `main`** via `git merge-base --is-ancestor`)
- **Lacuna:** **o alias ÃƒÂ© a mesma funÃƒÂ§ÃƒÂ£o.** `clima.routes.js:15` usa `requireTenantAdminAuth`, que resolve para `requireBarberAdminAuth` e exige scope `barber_admin`. O desacoplamento ÃƒÂ© **nominal, nÃƒÂ£o funcional** Ã¢â‚¬â€ e o prÃƒÂ³prio cÃƒÂ³digo declara isso.
- **DependÃƒÂªncias:** `IDENT-001`, `ACCESS-001` Ã‚Â· **Bloqueadores:** Ã¢â‚¬â€ Ã‚Â· **Severidade:** **P2** (contorno controlado: funciona porque `barber_admin` ÃƒÂ© o ÃƒÂºnico scope de tenant-admin; nÃƒÂ£o hÃƒÂ¡ vazamento entre tenants)
- **DoD:** `auth_scope` emitido por mÃƒÂ³dulo; `requireTenantAdminAuth` deixa de ser alias de uma funÃƒÂ§ÃƒÂ£o com nome de nicho; teste prova negaÃƒÂ§ÃƒÂ£o cross-mÃƒÂ³dulo.
- **PrÃƒÂ³xima aÃƒÂ§ÃƒÂ£o:** missÃƒÂ£o candidata (nÃƒÂ£o ÃƒÂ© a prÃƒÂ³xima Ã¢â‚¬â€ ver Ã‚Â§PrÃƒÂ³xima MissÃƒÂ£o).

> **Ã¢Å¡Â Ã¯Â¸Â DIVERGÃƒÅ NCIA D-01 (registrada em ANEXO E):** `capacidades.md` afirma que `clima.routes.js` usa `requireBarberAdminAuth` **"por engano"**. **Factualmente incorreto em dois pontos:** (1) a rota usa `requireTenantAdminAuth` desde `ae31b65`; (2) o acoplamento remanescente ÃƒÂ© **deliberado e documentado no cÃƒÂ³digo**, nÃƒÂ£o um engano. O achado permanece vÃƒÂ¡lido em substÃƒÂ¢ncia (o alias ÃƒÂ© a mesma funÃƒÂ§ÃƒÂ£o), mas a severidade cai de "bug de autorizaÃƒÂ§ÃƒÂ£o" para **dÃƒÂ©bito de acoplamento P2**.

#### `IDENT-003` Ã¢â‚¬â€ RotaÃƒÂ§ÃƒÂ£o de refresh token e revogaÃƒÂ§ÃƒÂ£o server-side
- **Bloco:** IDENT Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO EM CI`
- **ProveniÃƒÂªncia:** `backend/src/database/20260702_030_refresh_tokens.sql` (tabela `refresh_tokens`, colunas `revoked_at`/`replaced_by`) Ã‚Â· `backend/tests/integration/refresh-token-rotation.test.js` (executado pelo job `integration-tests` do CI) Ã‚Â· `backend/src/jobs/refresh-token-purge-job.js` Ã‚Â· commit `f03af4d` "fix(security): rotate refresh tokens and revoke sessions on logout"
- **Lacuna:** comportamento em produÃƒÂ§ÃƒÂ£o nÃƒÂ£o verificado (L-1).
- **DoD:** rotaÃƒÂ§ÃƒÂ£o + revogaÃƒÂ§ÃƒÂ£o provadas em CI. **Atendido em CI**; produÃƒÂ§ÃƒÂ£o nÃƒÂ£o verificada.
- **PrÃƒÂ³xima aÃƒÂ§ÃƒÂ£o:** nenhuma para o marco v1.

### Bloco TENANT Ã¢â‚¬â€ Isolamento multi-tenant

#### `TENANT-001` Ã¢â‚¬â€ Contexto de tenant por request (ALS)
- **Bloco:** TENANT Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `CONCLUÃƒÂDA` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO EM CI`
- **ProveniÃƒÂªncia:** `backend/src/shared/tenant/{tenant-context.js,middleware.js,guards.js,index.js}` Ã‚Â· `backend/src/middlewares/requireCompany.js:44-54` (abre `poolTenant`, `BEGIN`, `SELECT set_config('app.current_company_id', Ã¢â‚¬Â¦, true)` Ã¢â‚¬â€ GUC **transaction-local**) Ã‚Â· `backend/tests/integration/gate0-als-context-leak.test.js` Ã‚Â· `tenant-isolation.test.js` Ã‚Â· CI job `integration-tests` (`ci.yml`) Ã‚Â· commit `4c8ce847`
- **Lacuna:** nenhuma para o marco v1.
- **DependÃƒÂªncias:** `TENANT-002` Ã‚Â· **Bloqueadores:** Ã¢â‚¬â€
- **DoD:** todo request com tenant carrega contexto isolado; teste prova ausÃƒÂªncia de vazamento entre contextos (ALS). **Atendido.**

#### `TENANT-002` Ã¢â‚¬â€ Enforcement de RLS em runtime (role NOBYPASSRLS)
- **Bloco:** TENANT Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `CONCLUÃƒÂDA` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO EM CI`
- **ProveniÃƒÂªncia:** `backend/src/config/database.js:126-150` (`tenantAwareConnect` substitui `pool.connect`: com contexto tenant Ã¢â€ â€™ `poolTenant`; sem contexto Ã¢â€ â€™ pool privilegiado, **por design**, documentado) Ã‚Â· `requireCompany.js:44` (`pool.poolTenant.connect()`) Ã‚Â· `ci.yml` cria role real: `CREATE ROLE app_runtime Ã¢â‚¬Â¦ NOBYPASSRLS` + `APP_RUNTIME_URL` no job de integraÃƒÂ§ÃƒÂ£o Ã‚Â· testes `tenant-isolation-rls.test.js`, `gate0-pool-paths.test.js`, `gate0-runtime-check.test.js` Ã‚Â· commits `aeed31c` (PR #20, ativaÃƒÂ§ÃƒÂ£o) e `02c5396` "route tenant writes through app_runtime pool" (2026-07-02, **em `main`**)
- **Lacuna:** produÃƒÂ§ÃƒÂ£o nÃƒÂ£o verificada nesta auditoria (L-1).
- **Kill-switch:** remover `APP_RUNTIME_URL` Ã¢â€ â€™ `poolTenant` cai em `DATABASE_URL`.
- **DoD:** writes e reads de tenant passam por role sem BYPASSRLS, provado em CI com role real. **Atendido.**

> **Ã¢Å¡Â Ã¯Â¸Â DIVERGÃƒÅ NCIA D-02:** `capacidades.md` (2026-07-03) afirma RLS *"Ã°Å¸Å¸Â¡ ENABLE, **inerte em runtime**. Runtime usa role com BYPASSRLS"*. **Factualmente falso** desde `02c5396` (2026-07-02) Ã¢â‚¬â€ um dia antes daquele documento. A doc canÃƒÂ´nica **subestima a prÃƒÂ³pria seguranÃƒÂ§a do produto**.

#### `TENANT-003` Ã¢â‚¬â€ Cobertura de policies RLS
- **Bloco:** TENANT Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `IMPLEMENTADO` (cÃƒÂ³digo); **prod `NÃƒÆ’O_VERIFICADO`**
- **ProveniÃƒÂªncia:** `backend/src/database/*.sql` Ã¢â‚¬â€ **40 tabelas com `CREATE POLICY`** (`grep -rhoiE "CREATE POLICY Ã¢â‚¬Â¦ ON Ã¢â‚¬Â¦"`, 2026-07-16). Inclui `companies` e `users` (`rls_companies_users.sql:9,14,25,30,35` e `20260624_024_rls_companies_users.sql:14,20,33,39`). `refresh_tokens`: RLS **ENABLE sem policy** = default DENY para `app_runtime` Ã¢â‚¬â€ **intencional e documentado** (`20260702_030_refresh_tokens.sql:5-7`: *"RLS habilitado SEM policies = app_runtime nÃƒÂ£o enxerga nada (defesa em profundidade)"*). `modules`: policy de leitura irrestrita (catÃƒÂ¡logo sem `company_id`), INSERT/UPDATE/DELETE em DENY (`027`).
- **Lacuna:** **contagem real em produÃƒÂ§ÃƒÂ£o desconhecida (L-1, L-4).** Migrations 027/028 revelam que houve `ENABLE` fora dos arquivos versionados Ã¢â€ â€™ o repositÃƒÂ³rio **nÃƒÂ£o ÃƒÂ© fonte completa** do estado de RLS.
- **DependÃƒÂªncias:** `TENANT-002` Ã‚Â· **Bloqueadores:** `DATAOPS-001` (P1) Ã‚Â· **Severidade da lacuna:** **P2**
- **DoD:** inventÃƒÂ¡rio tabela-a-tabela **consultado no banco** (nÃƒÂ£o em migrations), com cada tabela sem policy tendo justificativa escrita.
- **PrÃƒÂ³xima aÃƒÂ§ÃƒÂ£o:** auditoria adicional Ã¢â‚¬â€ requer acesso read-only ao banco (hoje indisponÃƒÂ­vel).

> **Ã¢Å¡Â Ã¯Â¸Â DIVERGÃƒÅ NCIA D-03:** `capacidades.md` e `painel-executivo.md` afirmam **"RLS 23/27 tabelas Ã¢â‚¬â€ companies e users sem policy"**. **Ambos os nÃƒÂºmeros e a exceÃƒÂ§ÃƒÂ£o estÃƒÂ£o factualmente incorretos**: hÃƒÂ¡ 40 tabelas com policy nas migrations, e `companies`/`users` **tÃƒÂªm** policies desde a migration 024 (2026-06-24).

### Bloco ACCESS Ã¢â‚¬â€ AutorizaÃƒÂ§ÃƒÂ£o e mÃƒÂ³dulos

#### `ACCESS-001` Ã¢â‚¬â€ Guard de mÃƒÂ³dulo por empresa (factory genÃƒÂ©rica)
- **Bloco:** ACCESS Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `CONCLUÃƒÂDA` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO LOCAL`
- **ProveniÃƒÂªncia:** `backend/src/middlewares/createModuleGuard.js` Ã¢â‚¬â€ factory `createModuleGuard(moduleSlug, displayName)`, **sem vocabulÃƒÂ¡rio de nicho**, consulta `company_modules Ã¢â€¹Ë† modules` por slug, com cache (TTL 5min) e invalidaÃƒÂ§ÃƒÂ£o (`invalidateModuleCache`). Consumidores: `requireBarberModule.js` e `requireClimaModule.js` (`createModuleGuard('clima', 'ClimaGestor')`). SuÃƒÂ­te unitÃƒÂ¡ria 765/765.
- **Lacuna:** nenhuma. **Esta ÃƒÂ© a peÃƒÂ§a de kit de nicho mais bem executada do Core** Ã¢â‚¬â€ dois consumidores reais, contrato explÃƒÂ­cito, zero acoplamento.
- **DoD:** qualquer mÃƒÂ³dulo novo obtÃƒÂ©m guard sem tocar o Core. **Atendido.**

#### `ACCESS-002` Ã¢â‚¬â€ PapÃƒÂ©is e permissÃƒÂµes
- **Bloco:** ACCESS Ã‚Â· **Responsabilidade:** COMPARTILHADA Ã‚Â· **Estado:** `EXISTE PARCIALMENTE` Ã‚Â· **EvidÃƒÂªncia:** `IMPLEMENTADO`
- **ProveniÃƒÂªncia:** `backend/src/shared/core/auth/roles.js` (`BARBER_ADMIN_ROLES = ['admin','owner','collaborator']`, `BOOKING_CUSTOMER_ROLES`, `MASTER_ROLES`)
- **Lacuna:** a constante que define papÃƒÂ©is de tenant-admin chama-se `BARBER_ADMIN_ROLES` e retorna o scope `'barber_admin'` Ã¢â‚¬â€ **ÃƒÂ© a ÃƒÂºnica violaÃƒÂ§ÃƒÂ£o do invariante I-1 dentro de `shared/`** (`grep` Ã¢â€ â€™ 1 ocorrÃƒÂªncia, `roles.js:17`).
- **Bloqueadores:** Ã¢â‚¬â€ Ã‚Â· **Severidade:** **P3** (cosmÃƒÂ©tico/nominal; sem impacto funcional)
- **DoD:** nomenclatura de papÃƒÂ©is neutra quanto a nicho.

### Bloco COMPANY Ã¢â‚¬â€ Empresa e ciclo de vida

#### `COMPANY-001` Ã¢â‚¬â€ Cadastro e gestÃƒÂ£o de empresa
- **Bloco:** COMPANY Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO LOCAL`
- **ProveniÃƒÂªncia:** `backend/src/services/company.service.js` Ã‚Â· `company-plan.service.js` (**0 ocorrÃƒÂªncias de `barber`** Ã¢â‚¬â€ verificado por `grep -c`) Ã‚Â· `backend/tests/unit/company-service.test.js` Ã‚Â· commit `ae31b65` (reduziu `company.service.js` em 51 linhas ao remover acoplamento)
- **Lacuna:** produÃƒÂ§ÃƒÂ£o nÃƒÂ£o verificada (L-1).
- **DoD:** ciclo de vida da empresa sem vocabulÃƒÂ¡rio de nicho. **Atendido no cÃƒÂ³digo.**

### Bloco BILLING Ã¢â‚¬â€ CobranÃƒÂ§a e assinatura

#### `BILLING-001` Ã¢â‚¬â€ Camada de billing com providers plugÃƒÂ¡veis
- **Bloco:** BILLING Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO LOCAL`
- **ProveniÃƒÂªncia:** `backend/src/shared/capabilities/billing/` Ã¢â‚¬â€ `billing-manager.js`, `contracts.js`, `payment-provider.js`, `provider-registry.js`, `providers/{abacatepay,kiwify}.provider.js`. **`grep -rn "barber" shared/capabilities/billing/` Ã¢â€ â€™ 0 ocorrÃƒÂªncias.** Consumo transacional: `integrations/consumers/billing-provisioning.consumer.js`. SuÃƒÂ­te unitÃƒÂ¡ria 765/765.
- **Lacuna:** **ativaÃƒÂ§ÃƒÂ£o em produÃƒÂ§ÃƒÂ£o nÃƒÂ£o comprovada** (L-1). Config de produÃƒÂ§ÃƒÂ£o (planos/produtos Kiwify, `VITE_KIWIFY_URL_*`) ÃƒÂ© pendÃƒÂªncia declarada (D-016) Ã¢â‚¬â€ **nÃƒÂ£o verificÃƒÂ¡vel a partir do repositÃƒÂ³rio**.
- **DependÃƒÂªncias:** `EVENT-002`, `FEATURE-001` Ã‚Â· **Bloqueadores:** Ã¢â‚¬â€ Ã‚Â· **Severidade:** **P2**
- **DoD:** webhook Ã¢â€ â€™ ativaÃƒÂ§ÃƒÂ£o de plano Ã¢â€ â€™ liberaÃƒÂ§ÃƒÂ£o de recurso, comprovado ponta a ponta **em produÃƒÂ§ÃƒÂ£o**.
- **PrÃƒÂ³xima aÃƒÂ§ÃƒÂ£o:** ver Ã‚Â§PrÃƒÂ³xima MissÃƒÂ£o (candidata).

#### `BILLING-002` Ã¢â‚¬â€ Webhooks de pagamento
- **Bloco:** BILLING Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `IMPLEMENTADO`
- **ProveniÃƒÂªncia:** `backend/src/routes/webhooks.routes.js` Ã‚Â· `controllers/webhooks.controller.js` Ã‚Â· `services/webhooks/` Ã‚Â· `integrations/webhooks/` Ã‚Â· tabela `payment_gateway_events` (`master-finance.sql`)
- **Lacuna:** `payment_gateway_events` **sem policy RLS** (tabela de gateway, provavelmente acessada por pool privilegiado Ã¢â‚¬â€ **nÃƒÂ£o confirmado**). ProteÃƒÂ§ÃƒÂ£o de rota do webhook nÃƒÂ£o auditada nesta missÃƒÂ£o.
- **Severidade:** **P2**
- **DoD:** webhook idempotente, com verificaÃƒÂ§ÃƒÂ£o de assinatura e proteÃƒÂ§ÃƒÂ£o de abuso documentada.

### Bloco FEATURE Ã¢â‚¬â€ Entitlement e gating

#### `FEATURE-001` Ã¢â‚¬â€ Gating de recurso por plano
- **Bloco:** FEATURE Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `CONCLUÃƒÂDA` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO LOCAL`
- **ProveniÃƒÂªncia:** `backend/src/middlewares/requirePlanFeature.js` (`requirePlanFeature(featureKey)` Ã¢â€ â€™ `canUsePlanFeature(planType, featureKey)`) Ã‚Â· `backend/src/utils/planFeatures.js` Ã¢â‚¬â€ chaves **genÃƒÂ©ricas**: `collaborators`, `advanced_reports`, `financial_dashboard`, `extra_permissions`, `advanced_schedule`, `future_modules`; planos `trial|free|essencial|profissional|premium`. `middlewares/requireActivePlan.js`. SuÃƒÂ­te unitÃƒÂ¡ria 765/765.
- **Lacuna:** nenhuma quanto a vocabulÃƒÂ¡rio.
- **DoD:** gating expresso em capacidades genÃƒÂ©ricas, sem vocabulÃƒÂ¡rio de nicho. **Atendido.**

> **Ã¢Å¡Â Ã¯Â¸Â DIVERGÃƒÅ NCIA D-04:** `capacidades.md` afirma *"gating de plano ainda com vocabulÃƒÂ¡rio do barber"*. **Factualmente falso.** As feature keys jÃƒÂ¡ sÃƒÂ£o genÃƒÂ©ricas (`planFeatures.js`), `shared/capabilities/billing/` tem 0 ocorrÃƒÂªncias de `barber` e `company-plan.service.js` tambÃƒÂ©m. **Esta divergÃƒÂªncia invalida a recomendaÃƒÂ§ÃƒÂ£o, derivada dela, de "tornar o gating genÃƒÂ©rico antes da Fase 6"** Ã¢â‚¬â€ esse trabalho jÃƒÂ¡ estÃƒÂ¡ feito.

### Bloco API Ã¢â‚¬â€ SuperfÃƒÂ­cie HTTP

#### `API-001` Ã¢â‚¬â€ Roteamento e verticalizaÃƒÂ§ÃƒÂ£o
- **Bloco:** API Ã‚Â· **Responsabilidade:** COMPARTILHADA Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `IMPLEMENTADO`
- **ProveniÃƒÂªncia:** `backend/src/routes/` Ã¢â‚¬â€ 12 arquivos (`auth`, `barber`, `barber-ai`, `booking-auth`, `client`, `clima`, `integration`, `internal`, `master`, `public-auth`, `public-booking`, `webhooks`) Ã‚Â· `controllers/barber/` (22 controllers) Ã‚Â· `controllers/clima/` (1)
- **Lacuna:** proteÃƒÂ§ÃƒÂ£o de rota (abuso/custo/rate limit/limite por tenant) **nÃƒÂ£o auditada rota-a-rota** nesta missÃƒÂ£o.
- **Severidade:** **P2** Ã‚Â· **PrÃƒÂ³xima aÃƒÂ§ÃƒÂ£o:** auditoria adicional (R-003).

#### `API-002` Ã¢â‚¬â€ Rate limiting
- **Bloco:** API Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO LOCAL`
- **ProveniÃƒÂªncia:** `backend/src/middlewares/rate-limit.middleware.js` Ã¢â‚¬â€ `createRateLimit(options)`; **degrada para memÃƒÂ³ria** quando o Redis estÃƒÂ¡ indisponÃƒÂ­vel (`:32` Ã¢â‚¬â€ *"degradado para memÃƒÂ³ria Ã¢â‚¬â€ Redis indisponÃƒÂ­vel"*); **fail-open apenas em erro inesperado** (`:52-54` Ã¢â‚¬â€ *"DECISÃƒÆ’O: fail-open Ã¢â‚¬â€ disponibilidade > limite estrito sob falha de Redis"*). SuÃƒÂ­te unitÃƒÂ¡ria 765/765.
- **Lacuna:** o degradÃƒÂª para memÃƒÂ³ria ÃƒÂ© **por instÃƒÂ¢ncia** Ã¢â‚¬â€ em mÃƒÂºltiplas instÃƒÂ¢ncias o limite efetivo multiplica pelo nÃƒÂºmero de rÃƒÂ©plicas. NÃƒÂ£o verificado quantas rÃƒÂ©plicas rodam em produÃƒÂ§ÃƒÂ£o (L-1).
- **Severidade:** **P3**
- **DoD:** limite eficaz sob falha de Redis, com comportamento documentado por rota crÃƒÂ­tica.

### Bloco DOMAIN Ã¢â‚¬â€ DomÃƒÂ­nio compartilhÃƒÂ¡vel

#### `DOMAIN-001` Ã¢â‚¬â€ Booking Engine (utilitÃƒÂ¡rios puros)
- **Bloco:** DOMAIN Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `CONCLUÃƒÂDA` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO LOCAL`
- **ProveniÃƒÂªncia:** `backend/src/shared/capabilities/booking-engine/{index.js,scheduling-utils.js}` Ã‚Â· **0 ocorrÃƒÂªncias de `barber_`/`clima_`** no diretÃƒÂ³rio Ã‚Â· suÃƒÂ­te unitÃƒÂ¡ria 765/765
- **DoD:** funÃƒÂ§ÃƒÂµes puras reutilizÃƒÂ¡veis, sem vocabulÃƒÂ¡rio de nicho. **Atendido.**

#### `DOMAIN-002` Ã¢â‚¬â€ Booking Engine (serviÃƒÂ§os com estado) Ã‚Â· **Ã°Å¸â€Â´ gap estrutural do Core**
- **Bloco:** DOMAIN Ã‚Â· **Responsabilidade:** deveria ser CORE; **hoje ÃƒÂ© NICHO** Ã‚Â· **Estado:** `EXISTE MAS PRECISA REESTRUTURAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `IMPLEMENTADO`
- **ProveniÃƒÂªncia:** `backend/src/services/booking-appointments.service.js` Ã¢â‚¬â€ **59 ocorrÃƒÂªncias de `barber_`** (`grep -c`, 2026-07-16) Ã‚Â· `backend/src/services/booking-scheduling.service.js` Ã¢â‚¬â€ **32 ocorrÃƒÂªncias** Ã‚Â· **total 91** Ã‚Â· `backend/src/services/clima-core.service.js` (motor prÃƒÂ³prio do Clima) Ã‚Â· auditoria `.opencodex/audits/2026-07-03-core-vs-nicho-audit` (achado **A7**)
- **Lacuna:** os serviÃƒÂ§os **nomeiam-se `booking-*` (genÃƒÂ©rico) mas consultam tabelas `barber_*`**. NÃƒÂ£o sÃƒÂ£o compartilhados: o ClimaGestor reimplementou o prÃƒÂ³prio motor. Moram em `services/` Ã¢â‚¬â€ **nem `shared/`, nem um mÃƒÂ³dulo de nicho**.
- **DependÃƒÂªncias:** `DOMAIN-001` Ã‚Â· **Bloqueadores:** Ã¢â‚¬â€ Ã‚Â· **Severidade:** **P1** (bloqueia o marco **Core Multi-nicho Comprovado**; **nÃƒÂ£o** bloqueia o Core Consolidado v1, que ÃƒÂ© provado pelo BarberGestor)
- **DoD:** decisÃƒÂ£o registrada em ADR entre **(a) rebaixar** para o mÃƒÂ³dulo barber (honesto, barato, elimina o falso rÃƒÂ³tulo de Core) e **(b) promover** extraindo porta de persistÃƒÂªncia (caro; ÃƒÂ© o que torna o Core reutilizÃƒÂ¡vel). Se (b): um segundo nicho consome o motor sem reimplementar.
- **PrÃƒÂ³xima aÃƒÂ§ÃƒÂ£o:** **ADR obrigatÃƒÂ³rio antes de qualquer cÃƒÂ³digo.** Ver Ã‚Â§PrÃƒÂ³xima MissÃƒÂ£o.

> **Ã¢Å“â€¦ CONVERGÃƒÅ NCIA:** a alegaÃƒÂ§ÃƒÂ£o de "59+ `barber_*`" em `capacidades.md` foi **confirmada com precisÃƒÂ£o** (59 exatas em `booking-appointments`). Este ÃƒÂ© o ÃƒÂºnico achado crÃƒÂ­tico da doc canÃƒÂ´nica que resistiu integralmente ÃƒÂ  verificaÃƒÂ§ÃƒÂ£o.

### Bloco EVENT Ã¢â‚¬â€ Eventos e entrega durÃƒÂ¡vel

#### `EVENT-001` Ã¢â‚¬â€ Contratos de evento + factory
- **Bloco:** EVENT Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `CONCLUÃƒÂDA` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO LOCAL`
- **ProveniÃƒÂªncia:** `backend/src/shared/core/events/contracts.js:129` (`validateEventPayload`) Ã‚Â· `factories/appointment-events.js` Ã‚Â· `event-bus.js` Ã‚Â· `consumers.js` Ã‚Â· suÃƒÂ­te unitÃƒÂ¡ria 765/765 Ã‚Â· commits `50a64dd`, `bc8e6f8`
- **Lacuna:** existe **apenas uma factory** (`appointment-events`). Eventos de outros domÃƒÂ­nios (wallet, billing, loyalty) nÃƒÂ£o tÃƒÂªm factory equivalente.
- **Severidade:** **P3** Ã‚Â· **DoD:** todo evento publicado nasce de factory com contrato validado.

#### `EVENT-002` Ã¢â‚¬â€ Outbox transacional
- **Bloco:** EVENT Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `CONCLUÃƒÂDA` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO EM CI`
- **ProveniÃƒÂªncia:** `backend/src/shared/core/database/unit-of-work.js` Ã‚Â· `shared/core/outbox/outbox-worker.js` (`register()` **exige handler nomeado** Ã¢â‚¬â€ `:14-17`, lanÃƒÂ§a erro se `handler.name` vazio) Ã‚Â· `backend/src/database/{outbox.sql,outbox_message_handlers.sql}` (idempotÃƒÂªncia por handler) Ã‚Â· `backend/tests/integration/outbox-durability.test.js` (job `integration-tests` do CI) Ã‚Â· 7 consumers em `integrations/consumers/`
- **Lacuna:** `outbox_messages` e `outbox_message_handlers` **sem policy RLS** Ã¢â‚¬â€ presumivelmente acessadas por pool privilegiado (**nÃƒÂ£o confirmado**). Issue #35 (teardown flaky) referenciada como resolvida por `d0a08f0`.
- **Severidade:** **P3**
- **DoD:** escrita relevante ÃƒÂ© transacional e idempotente, provada em CI. **Atendido.**

### Bloco NOTIFY Ã¢â‚¬â€ NotificaÃƒÂ§ÃƒÂ£o e canais

#### `NOTIFY-001` Ã¢â‚¬â€ WhatsApp (Meta Cloud API) por tenant
- **Bloco:** NOTIFY Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `IMPLEMENTADO`
- **ProveniÃƒÂªncia:** `backend/src/integrations/whatsapp/` Ã‚Â· `integrations/consumers/appointment-integration.consumer.js` Ã‚Â· `integrations/config/encryption.js` (AES-256-GCM) Ã‚Â· tabela `integration_configs` (**com policy RLS**)
- **Lacuna:** entrega real em produÃƒÂ§ÃƒÂ£o nÃƒÂ£o verificada (L-1). Onboarding de credenciais por tenant ÃƒÂ© pendÃƒÂªncia declarada (fase7) Ã¢â‚¬â€ nÃƒÂ£o verificÃƒÂ¡vel no repo.
- **Severidade:** **P2**

#### `NOTIFY-002` Ã¢â‚¬â€ E-mail transacional e sequÃƒÂªncia de trial
- **Bloco:** NOTIFY Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO LOCAL`
- **ProveniÃƒÂªncia:** `backend/src/services/email/` Ã‚Â· `providers/email/` Ã‚Â· `templates/email/` Ã‚Â· `services/trial-emails.service.js` Ã‚Â· `jobs/trial-email-job.js` Ã‚Â· tabela `trial_email_log` Ã‚Â· commit `dce7efd` (nodemailer 8.xÃ¢â€ â€™9.0.3, GHSA-p6gq-j5cr-w38f)
- **Lacuna:** `trial_email_log` sem policy RLS (nÃƒÂ£o confirmado se ÃƒÂ© por design).

#### `NOTIFY-003` Ã¢â‚¬â€ Job de lembrete de agendamento
- **Bloco:** NOTIFY Ã‚Â· **Responsabilidade:** NICHO (barber) Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `IMPLEMENTADO`
- **ProveniÃƒÂªncia:** `backend/src/jobs/appointment-reminder-job.js` Ã‚Â· coluna `reminder_sent_at` (`barber_appointments_reminder.sql`) Ã‚Â· padrÃƒÂ£o mark-before-emit (idempotente)
- **Lacuna:** opera sobre `barber_appointments` Ã¢â‚¬â€ ÃƒÂ© capacidade de nicho hospedada em `jobs/` do Core. **P3**.

### Bloco AUDIT Ã¢â‚¬â€ Trilha de auditoria

#### `AUDIT-001` Ã¢â‚¬â€ Logs de auditoria
- **Bloco:** AUDIT Ã‚Â· **Responsabilidade:** COMPARTILHADA Ã‚Â· **Estado:** `EXISTE PARCIALMENTE` Ã‚Â· **EvidÃƒÂªncia:** `IMPLEMENTADO`
- **ProveniÃƒÂªncia:** tabelas `audit_logs`, `auth_audit_logs`, `barber_audit_logs` (`*.sql`) Ã‚Â· consumo em `services/auth.service.js`, `services/barber.service.js`, `repositories/cash-session.repository.js`
- **Lacuna:** **trÃƒÂªs tabelas de auditoria distintas**, nenhuma com policy RLS; sem capacidade de auditoria unificada no Core; `barber_audit_logs` ÃƒÂ© especÃƒÂ­fica de nicho. NÃƒÂ£o hÃƒÂ¡ evidÃƒÂªncia de polÃƒÂ­tica de retenÃƒÂ§ÃƒÂ£o.
- **Severidade:** **P3** Ã‚Â· **DoD:** trilha de auditoria unificada, com isolamento e retenÃƒÂ§ÃƒÂ£o definidos.

### Bloco FILES Ã¢â‚¬â€ Arquivos e mÃƒÂ­dia

#### `FILES-001` Ã¢â‚¬â€ Upload e armazenamento de mÃƒÂ­dia
- **Bloco:** FILES Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE PARCIALMENTE` Ã‚Â· **EvidÃƒÂªncia:** `IMPLEMENTADO`
- **ProveniÃƒÂªncia:** referÃƒÂªncias a upload/storage em `controllers/barber/company.js`, `routes/barber.routes.js`, `server.js`, `services/branding.service.js` Ã‚Â· `config/supabase.js`
- **Lacuna:** **nÃƒÂ£o existe capacidade de arquivos no Core** (`shared/` nÃƒÂ£o tem mÃƒÂ³dulo de storage). A lÃƒÂ³gica estÃƒÂ¡ dispersa em rotas/serviÃƒÂ§os do nicho barber. Limites, tipos permitidos e antivÃƒÂ­rus nÃƒÂ£o auditados.
- **Severidade:** **P3** (P2 se houver upload pÃƒÂºblico sem limite Ã¢â‚¬â€ **nÃƒÂ£o verificado**)
- **PrÃƒÂ³xima aÃƒÂ§ÃƒÂ£o:** auditoria adicional focada em superfÃƒÂ­cie de upload.

### Bloco CONFIG Ã¢â‚¬â€ ConfiguraÃƒÂ§ÃƒÂ£o e pools

#### `CONFIG-001` Ã¢â‚¬â€ Pools de banco e roteamento tenant-aware
- **Bloco:** CONFIG Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `CONCLUÃƒÂDA` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO EM CI`
- **ProveniÃƒÂªncia:** `backend/src/config/database.js` Ã¢â‚¬â€ `pool`, `poolTenant`, `runWithTenantClient`, `tenantAwareConnect` (`:129`); timeouts configurÃƒÂ¡veis (`TENANT_STATEMENT_TIMEOUT_MS` 30s, `TENANT_IDLE_TXN_TIMEOUT_MS` 60s em `requireCompany.js:8-9`) Ã‚Â· `gate0-pool-paths.test.js` (CI)
- **Lacuna:** nenhuma para o marco v1.

### Bloco SEC Ã¢â‚¬â€ SeguranÃƒÂ§a aplicada

#### `SEC-001` Ã¢â‚¬â€ Higiene de credenciais no repositÃƒÂ³rio
- **Bloco:** SEC Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO LOCAL`
- **ProveniÃƒÂªncia:** `backend/check-rls.js` e `backend/check-rls2.js` existem **no disco local**; `git ls-files` Ã¢â€ â€™ **nÃƒÂ£o rastreados**; `git check-ignore -v` Ã¢â€ â€™ **`.gitignore:112` `backend/check-rls*.js`**; `git status --porcelain` Ã¢â€ â€™ nÃƒÂ£o aparecem. Incidente `INC-004-exposicao-credencial-runtime-scratch`.
- **Lacuna:** **conteÃƒÂºdo desses arquivos NÃƒÆ’O foi lido** (decisÃƒÂ£o deliberada, L-6). DÃƒÂ©bito de redaÃƒÂ§ÃƒÂ£o declarado (project-ref de prod em docs prÃƒÂ©-existentes) **nÃƒÂ£o reauditado** nesta missÃƒÂ£o.
- **Severidade:** **P3** (exposiÃƒÂ§ÃƒÂ£o no Git contida; risco local remanescente nÃƒÂ£o avaliado)
- **DoD:** nenhum artefato com credencial no working tree, rastreado ou nÃƒÂ£o.

#### `SEC-002` Ã¢â‚¬â€ Hardening de XSS na entrada
- **Bloco:** SEC Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO EM CI`
- **ProveniÃƒÂªncia:** `backend/tests/integration/register-validation.test.js` (CI) Ã‚Â· `shared/core/validation/` (Zod) Ã‚Â· commit `b75d34a` (PR #6)
- **Lacuna:** ciclo declarado CLOSED em 2026-06-14 com evidÃƒÂªncia de banco de produÃƒÂ§ÃƒÂ£o Ã¢â‚¬â€ **nÃƒÂ£o reverificado** (L-1).

#### `SEC-003` Ã¢â‚¬â€ Auditoria de dependÃƒÂªncias
- **Bloco:** SEC Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO EM CI`
- **ProveniÃƒÂªncia:** `.github/workflows/security-audit.yml` Ã¢â‚¬â€ **`continue-on-error: true` nos passos `:23` e `:39`** (*"nÃƒÂ£o bloqueia, apenas informa"*) Ã‚Â· commit `dce7efd` (nodemailer Ã¢â€ â€™ 9.0.3)
- **Lacuna:** o gate de seguranÃƒÂ§a **nÃƒÂ£o bloqueia**. Vulnerabilidade nova entra sem impedimento.
- **Severidade:** **P3** Ã‚Â· **DoD:** severidade HIGH+ bloqueia merge.

### Bloco OBS Ã¢â‚¬â€ Observabilidade

#### `OBS-001` Ã¢â‚¬â€ Log estruturado e correlaÃƒÂ§ÃƒÂ£o
- **Bloco:** OBS Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `CONCLUÃƒÂDA` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO LOCAL`
- **ProveniÃƒÂªncia:** `backend/src/shared/core/logger/` (pino) Ã‚Â· `middlewares/correlation-id.middleware.js` Ã‚Â· `request-logger.middleware.js` Ã‚Â· suÃƒÂ­te unitÃƒÂ¡ria 765/765

#### `OBS-002` Ã¢â‚¬â€ MÃƒÂ©tricas e error tracking
- **Bloco:** OBS Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE PARCIALMENTE` Ã‚Â· **EvidÃƒÂªncia:** `IMPLEMENTADO`
- **ProveniÃƒÂªncia:** `shared/core/monitoring/{metrics.js,sentry.js}` Ã‚Â· `middlewares/metrics.middleware.js`
- **Lacuna:** **sem mÃƒÂ©tricas de performance e sem slow query log**; nenhuma evidÃƒÂªncia de dashboard ou alerta. Baseline inexistente.
- **Severidade:** **P4** (aspiracional para o marco v1; vira P2 sob escala)

### Bloco DATAOPS Ã¢â‚¬â€ OperaÃƒÂ§ÃƒÂ£o de dados

> Ã°Å¸â€â€ž **Bloco atualizado em 2026-07-16 pela missÃƒÂ£o OPS-MIGRATIONS-01** (READ_ONLY, mesmo baseline `4c8ce847`). RelatÃƒÂ³rio: [[../../auditorias/multgestor/2026-07-16-ops-migrations-01]]. ReclassificaÃƒÂ§ÃƒÂ£o documental autorizada pelo humano; **nenhum cÃƒÂ³digo, workflow, banco, Render ou secret foi tocado**.
>
> Ã¢Å“â€¦ **SUPERADO em 2026-07-20 pela OPS-MIGRATIONS-03D.** A transiÃƒÂ§ÃƒÂ£o:
>
> ```text
> Estado observado em 16/07/2026:
> migrations automÃƒÂ¡ticas nÃƒÂ£o comprovadas.
>
> Estado comprovado em 20/07/2026:
> migrations automÃƒÂ¡ticas ativas, bloqueantes, estritas, idempotentes e reversÃƒÂ­veis.
> ```
>
> O diagnÃƒÂ³stico de 16/07 estava **correto** Ã¢â‚¬â€ a rede de seguranÃƒÂ§a realmente nÃƒÂ£o existia. Ela **foi criada**. EvidÃƒÂªncias: [[../../brain/plans/OPS-MIGRATIONS-03D-plano]] Ã‚Â§ ENCERRAMENTO. Os textos abaixo preservam o diagnÃƒÂ³stico histÃƒÂ³rico; o estado canÃƒÂ´nico atual estÃƒÂ¡ marcado em cada capacidade.

#### `DATAOPS-001` Ã¢â‚¬â€ Gate de migrations no deploy Ã‚Â· Ã¢Å“â€¦ **BLOQUEANTE E ATIVO**
- **Bloco:** DATAOPS Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** Ã¢Å“â€¦ **`EXISTE E FUNCIONA`** Ã‚Â· **EvidÃƒÂªncia:** `COMPROVADO EM PRODUÃƒâ€¡ÃƒÆ’O` Ã‚Â· **Severidade:** ~~P1~~ **resolvida**

> Ã¢Å“â€¦ **RESOLVIDO em 2026-07-20 (OPS-MIGRATIONS-03D).** O gate bloqueante passou a existir no **Render**, nÃƒÂ£o no GitHub:
> `buildCommand = npm install && npm run migrate:prod`. Migration que falha Ã¢â€¡â€™ build falha Ã¢â€¡â€™ deploy falha Ã¢â€¡â€™ **versÃƒÂ£o anterior permanece no ar**.
> Comprovado em 2 deploys: `endpoint dedicado=true`, `migrations pendentes: 0`, `Build successful`, saÃƒÂ­da idÃƒÂªntica (idempotÃƒÂªncia).
> O `continue-on-error` do `deploy.yml` **deixou de ser o mecanismo relevante** Ã¢â‚¬â€ o gate real vive no Render. A remoÃƒÂ§ÃƒÂ£o daquele job segue como higiene pendente (GATE 9 do plano 03D).
>
> **DiagnÃƒÂ³stico histÃƒÂ³rico preservado abaixo** (estado de 16/07/2026).
- **Fato central (OPS-MIGRATIONS-01):** **o job de migrations existe, mas nÃƒÂ£o ÃƒÂ© bloqueante** Ã¢â‚¬â€ `continue-on-error: true` (`deploy.yml:48`) permite o fluxo seguir mesmo quando o `migrate` falha. O step ÃƒÂ© marcado `success` independentemente do resultado real.
- Ã°Å¸â€â€ž **AGRAVANTE (verificaÃƒÂ§ÃƒÂ£o humana, 2026-07-16):** o dÃƒÂ©bito **nÃƒÂ£o ÃƒÂ© mais "aceito sobre premissa nÃƒÂ£o comprovada"** Ã¢â‚¬â€ a premissa foi **confirmada FALSA** (`DATAOPS-002` = `AUSENTE`). **O Render nÃƒÂ£o roda migrations e o CI nÃƒÂ£o bloqueia**: hoje **nada** garante que uma migration futura chegue ÃƒÂ  produÃƒÂ§ÃƒÂ£o antes do backend novo entrar no ar. O banco estÃƒÂ¡ alinhado (`031`) **por aÃƒÂ§ÃƒÂ£o manual**, nÃƒÂ£o por processo.
- **Ã¢Å¡Â Ã¯Â¸Â A dependÃƒÂªncia `needs: run-migrations` ÃƒÂ© decorativa.** `deploy-backend` (`deploy.yml:63-65`) declara `needs: run-migrations`, mas como esse job **sempre** conclui como `success`, a dependÃƒÂªncia **nunca protege nada**. O deploy do backend prossegue com migrations falhas. Ãƒâ€° a **mesma classe de engano** que o commit `3b417a9` admite ter sofrido: *"O 'success' observado nos deploys anteriores era mascarado pelo prÃƒÂ³prio continue-on-error"*.
- **ProveniÃƒÂªncia:** `.github/workflows/deploy.yml:48` (`continue-on-error: true`) + justificativa `:40-47` (*"a conexao direta Ã¢â‚¬Â¦ so expoe IPv6 -> o runner do GitHub Actions nao alcanca (ENETUNREACH) -> migrate falha 100% (visto em 883e516)"*) Ã‚Â· `deploy.yml:63-70` (`needs: run-migrations` + trigger por deploy hook `curl`) Ã‚Â· `ci.yml`: `npm run migrate` roda **de verdade** contra Postgres 16 efÃƒÂªmero **sem** `continue-on-error` Ã¢â€ â€™ **migrations sÃƒÂ£o VALIDADAS em CI, nÃƒÂ£o APLICADAS em prod pelo pipeline** Ã‚Â· `backend/scripts/run-migrations.js` (tabela `schema_migrations`; 32 migrations `20251231_000`Ã¢â‚¬Â¦`20260708_031`; idempotente por `version`; verificaÃƒÂ§ÃƒÂ£o de integridade exige `pin_reset_tokens`)
- **Lacuna:** migration que falha **nÃƒÂ£o bloqueia o deploy**. Drift jÃƒÂ¡ escapou 2Ãƒâ€” (`022 outbox_message_handlers`, `023 reminder_sent_at`, aplicadas manualmente via MCP).
- **DependÃƒÂªncias:** Ã¢â‚¬â€ Ã‚Â· **Bloqueadores:** `DATAOPS-003` (P1) Ã‚Â· **Premissa de aceitaÃƒÂ§ÃƒÂ£o comprometida por:** `DATAOPS-002` (`NÃƒÆ’O_COMPROVADO`)
- **Ã¢Å¡Â Ã¯Â¸Â Regra vigente:** **NÃƒÆ’O alterar o `continue-on-error`** antes de confirmar que nenhum log/CI exibirÃƒÂ¡ secrets (rotaÃƒÂ§ÃƒÂ£o de segredos **pausada por decisÃƒÂ£o humana** Ã¢â‚¬â€ `DATAOPS-003`).
- **DoD:** migration falha Ã¢â€¡â€™ deploy bloqueia; schema de prod == schema do repo, verificado.

#### `DATAOPS-002` Ã¢â‚¬â€ AplicaÃƒÂ§ÃƒÂ£o de migrations em produÃƒÂ§ÃƒÂ£o Ã‚Â· Ã¢Å“â€¦ **`ATIVO_AUTOMATICO_COMPROVADO`**
- **Bloco:** DATAOPS Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** Ã¢Å“â€¦ **`EXISTE E FUNCIONA`** Ã‚Â· **EvidÃƒÂªncia:** `COMPROVADO EM PRODUÃƒâ€¡ÃƒÆ’O` (2 deploys observados) Ã‚Â· **Severidade:** ~~P1~~ **resolvida**

> Ã¢Å“â€¦ **IMPLANTADO em 2026-07-20T03:07:34Z (OPS-MIGRATIONS-03D).**
>
> | Propriedade | Estado comprovado |
> |---|---|
> | Migrations de produÃƒÂ§ÃƒÂ£o | **automÃƒÂ¡ticas** Ã¢â‚¬â€ no `buildCommand` do Render |
> | Gate | **bloqueante** Ã¢â‚¬â€ falha impede o deploy |
> | Modo estrito | **ativo** (`--strict` via `migrate:prod`) |
> | Fallback para `DATABASE_URL` | **recusado** Ã¢â‚¬â€ `STRICT_REQUIRES_DEDICATED` antes de conectar |
> | Endpoint dedicado | **obrigatÃƒÂ³rio** (`MIGRATION_DATABASE_URL`) |
> | Porta | **5432** (sessÃƒÂ£o) Ã¢â‚¬â€ porta explÃƒÂ­cita exigida |
> | IdempotÃƒÂªncia | **comprovada** Ã¢â‚¬â€ 2Ã‚Âº deploy: `pendentes: 0`, nenhuma reaplicaÃƒÂ§ÃƒÂ£o |
> | Rollback | `buildCommand = npm install` Ã¢â‚¬â€ um passo |
>
> A rede de seguranÃƒÂ§a **nunca existiu atÃƒÂ© 20/07** Ã¢â‚¬â€ o diagnÃƒÂ³stico de 16/07 estava certo. Ela **foi criada**, nÃƒÂ£o consertada.
>
> **DiagnÃƒÂ³stico histÃƒÂ³rico preservado abaixo** (estado de 16/07/2026), incluindo a origem da afirmaÃƒÂ§ÃƒÂ£o falsa em `3b417a9`.

> **Ã¢Å“â€¦ A INCÃƒâ€œGNITA ESTÃƒÂ FECHADA.** **O Render NÃƒÆ’O roda migrations.** A afirmaÃƒÂ§ÃƒÂ£o de `deploy.yml:43` (*"O Render aplica migrations em runtime pela propria DATABASE_URL do dashboard"*), introduzida pelo commit `3b417a9` sem evidÃƒÂªncia, ÃƒÂ© **FALSA**. A rede de seguranÃƒÂ§a **nunca existiu**.
>
> **ProveniÃƒÂªncia:** verificaÃƒÂ§ÃƒÂ£o executada por **humano com acesso ao painel do Render** e ao banco, reportada em 2026-07-16. Resultado declarado: *"Banco hoje: atualizado atÃƒÂ© a migration 031 Ã‚Â· Render: nÃƒÂ£o roda migration Ã‚Â· GitHub Actions: pode deixar migration falhar e continuar."*
> **NÃƒÂ­vel de evidÃƒÂªncia:** atestado humano com acesso direto. Os artefatos brutos (print do painel, saÃƒÂ­da de `schema_migrations`) **nÃƒÂ£o foram anexados a esta matriz** Ã¢â‚¬â€ se forem arquivados, referenciÃƒÂ¡-los aqui eleva a rastreabilidade.

- **Mecanismo real (por eliminaÃƒÂ§ÃƒÂ£o, agora fechada):** o CI nÃƒÂ£o alcanÃƒÂ§a o banco (ENETUNREACH/IPv6) Ã‚Â· o Render nÃƒÂ£o roda migrations Ã‚Â· o boot da app nÃƒÂ£o roda migrations (`server.js` Ã¢â€ â€™ 0 ocorrÃƒÂªncias) Ã‚Â· **e ainda assim o banco estÃƒÂ¡ em `031`** Ã¢â€¡â€™ **as migrations foram aplicadas MANUALMENTE via MCP**. ClassificaÃƒÂ§ÃƒÂ£o do mecanismo: **MANUAL**, nÃƒÂ£o `MANUAL_CONTROLADO` Ã¢â‚¬â€ nÃƒÂ£o hÃƒÂ¡ processo, gate ou checklist; funciona por memÃƒÂ³ria humana.
- **Ã¢Å¡Â Ã¯Â¸Â CorreÃƒÂ§ÃƒÂ£o de hipÃƒÂ³tese prÃƒÂ³pria:** a OPS-MIGRATIONS-01 apontou `20260708_031_ai_suggestions` como *"candidato mais provÃƒÂ¡vel de drift ativo"*. **A hipÃƒÂ³tese estava ERRADA** Ã¢â‚¬â€ a `031` **estÃƒÂ¡ aplicada**. O banco estÃƒÂ¡ alinhado. O risco era estrutural, nÃƒÂ£o factual.
- **Origem da afirmaÃƒÂ§ÃƒÂ£o:** commit **`3b417a9`** (2026-07-12, *"fix(ci): restaurar continue-on-error nas migrations do deploy"*, `Co-Authored-By: Claude Opus 4.8`) Ã¢â‚¬â€ corpo afirma *"O Render continua aplicando migrations em runtime pela prÃƒÂ³pria DATABASE_URL do dashboard"* **sem citar log, painel ou consulta alguma**. Ãƒâ€° asserÃƒÂ§ÃƒÂ£o de agente incorporada como fato.
- **EvidÃƒÂªncias registradas (OPS-MIGRATIONS-01, 2026-07-16):**
  1. **RelatÃƒÂ³rio** [[../../auditorias/multgestor/2026-07-16-ops-migrations-01]]
  2. **Commit `3b417a9`** Ã¢â‚¬â€ introduz a afirmaÃƒÂ§ÃƒÂ£o sem evidÃƒÂªncia; **o mesmo commit documenta o precedente do erro** (*"success mascarado pelo continue-on-error"*)
  3. **AusÃƒÂªncia de `render.yaml`** Ã¢â‚¬â€ e de `Procfile` (`find . -maxdepth 2 -iname "render.yaml" -o -iname "Procfile"` Ã¢â€ â€™ vazio). Render ÃƒÂ© acionado por **deploy hook** (`curl`, `deploy.yml:68-70`); toda a config de build/start vive **apenas no painel, nÃƒÂ£o versionada**
  4. **`start` sem execuÃƒÂ§ÃƒÂ£o de migrations** Ã¢â‚¬â€ `package.json` Ã¢â€ â€™ `start: "node src/server.js"`; `grep -rn "run-migrations\|runMigrations\|migrate" backend/src/server.js` Ã¢â€ â€™ **0 ocorrÃƒÂªncias**
  5. ~~**Painel e logs do Render `NÃƒÆ’O_VERIFICADO`**~~ Ã¢â€ â€™ Ã°Å¸â€â€ž **VERIFICADO POR HUMANO (2026-07-16): o Render NÃƒÆ’O roda migration.**
  6. ~~**Banco `NÃƒÆ’O_VERIFICADO`**~~ Ã¢â€ â€™ Ã°Å¸â€â€ž **VERIFICADO POR HUMANO (2026-07-16): banco alinhado atÃƒÂ© a migration `031`.** (MCP Supabase permanece `Unauthorized` para o agente)
- **ContradiÃƒÂ§ÃƒÂ£o documental `INCONSISTENTE` Ã¢â‚¬â€ RESOLVIDA:** as 3 fontes que afirmavam *"drift acumula se nÃƒÂ£o aplicadas via MCP"* (auditoria 2026-07-10, `status-atual.md:34,77`) estavam **CORRETAS**. O `deploy.yml:43` e o commit `3b417a9` estavam **ERRADOS**. Corrigir o comentÃƒÂ¡rio do workflow ÃƒÂ© escopo de `OPS-MIGRATIONS-03`.
- **DoD:** ~~obter evidÃƒÂªncia~~ Ã¢Å“â€¦ **ATENDIDO** Ã¢â‚¬â€ evidÃƒÂªncia humana obtida; classificaÃƒÂ§ÃƒÂ£o final `AUSENTE`.
- **PrÃƒÂ³xima aÃƒÂ§ÃƒÂ£o:** **`OPS-MIGRATIONS-03`** Ã¢â‚¬â€ projetar o processo que **passa a existir** (a rede de seguranÃƒÂ§a nunca existiu; nÃƒÂ£o hÃƒÂ¡ o que consertar, hÃƒÂ¡ o que **criar**). Plano: [[../../brain/plans/OPS-MIGRATIONS-03-plano]].
- **ContradiÃƒÂ§ÃƒÂ£o documental (`INCONSISTENTE`):** 3 fontes afirmam o oposto Ã¢â‚¬â€ auditoria `2026-07-10-auditoria-readonly-mapa-mestre.md:80` (*"drift acumula se nÃƒÂ£o aplicadas via MCP"*), `status-atual.md:77` (`open_risks`, idem) e `status-atual.md:34` (*"Aplicado direto em produÃƒÂ§ÃƒÂ£o via MCP Supabase (NÃƒÆ’O via CI)"* Ã¢â‚¬â€ migrations `022`/`023`). **IndÃƒÂ­cio forte de aplicaÃƒÂ§ÃƒÂ£o manual:** se o Render aplicasse automaticamente, os drifts `022`/`023` nunca teriam existido. Permanece **indÃƒÂ­cio** Ã¢â‚¬â€ a evidÃƒÂªncia de painel/log exigida nÃƒÂ£o existe.
- **EvidÃƒÂªncia de produÃƒÂ§ÃƒÂ£o obtida (nÃƒÂ£o resolve):** `GET /api/health/deep` Ã¢â€ â€™ HTTP 200; `database: ok` (173ms); **o health check NÃƒÆ’O expÃƒÂµe `schema_migrations`** (`server.js:235-315`).
- **DependÃƒÂªncias:** `DATAOPS-001` Ã‚Â· **Severidade:** ~~P1~~ **resolvida em 2026-07-20**
- **DoD:** Ã¢Å“â€¦ **ATENDIDO** Ã¢â‚¬â€ mecanismo implantado, exercitado em produÃƒÂ§ÃƒÂ£o e reversÃƒÂ­vel.
- ~~**PrÃƒÂ³xima aÃƒÂ§ÃƒÂ£o:** `ops/migrations-02-evidencia-painel` Ã¢â‚¬â€ exige humano.~~ **HISTÃƒâ€œRICO ENCERRADO:** essa missÃƒÂ£o foi superada. A incÃƒÂ³gnita foi fechada por verificaÃƒÂ§ÃƒÂ£o humana (16/07) e o mecanismo, criado e comprovado pela **OPS-MIGRATIONS-03D** (20/07). **Nada pendente neste item.**

#### `DATAOPS-003` Ã¢â‚¬â€ Conectividade de migrations (OPS-SUPAVISOR) Ã‚Â· Ã¢â€ºâ€ bloqueado
- **Bloco:** DATAOPS Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `NÃƒÆ’O EXISTE` Ã‚Â· **EvidÃƒÂªncia:** `DOCUMENTADO`
- **ProveniÃƒÂªncia:** `deploy.yml:41-46` (ENETUNREACH IPv6, `883e516`) Ã‚Â· `status-atual.md` (`OPS-SUPAVISOR`, rotaÃƒÂ§ÃƒÂ£o de segredos PAUSADA)
- **Lacuna:** runner do GitHub Actions nÃƒÂ£o alcanÃƒÂ§a o host direto do Supabase (IPv6). Bloqueado por decisÃƒÂ£o humana sobre rotaÃƒÂ§ÃƒÂ£o de segredos.
- **Severidade:** **P1** Ã‚Â· **Bloqueia:** `DATAOPS-001`, `TENANT-003`

#### `DATAOPS-004` Ã¢â‚¬â€ Backup e restore
- **Bloco:** DATAOPS Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `DOCUMENTADO`
- **ProveniÃƒÂªncia:** `backend/scripts/backup-restore-check.js` Ã‚Â· `package.json` script `backup-restore-check`
- **Lacuna:** o tooling de backup **nÃƒÂ£o vive neste repositÃƒÂ³rio** (worktree dedicado `C:\MultGestor-backup`, conforme registro histÃƒÂ³rico). RPO ~24h e `verified=true` sÃƒÂ£o **afirmaÃƒÂ§ÃƒÂµes documentais nÃƒÂ£o reverificadas** nesta missÃƒÂ£o (L-1).
- **Severidade:** **P2** Ã‚Â· **DoD:** restore exercitado com log prÃƒÂ³prio, em janela recente.

### Bloco QUALITY Ã¢â‚¬â€ Testes e qualidade

#### `QUALITY-001` Ã¢â‚¬â€ SuÃƒÂ­te de testes automatizados
- **Bloco:** QUALITY Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO EM CI`
- **ProveniÃƒÂªncia:** **executado nesta auditoria** Ã¢â‚¬â€ `npx jest --testPathPatterns=tests/unit --silent` Ã¢â€ â€™ **53 suÃƒÂ­tes / 765 testes / 100% passando / 19,6s** (local, 2026-07-16, `4c8ce847`). 11 suÃƒÂ­tes de integraÃƒÂ§ÃƒÂ£o (`tests/integration/`): `tenant-isolation-rls`, `tenant-isolation`, `gate0-als-context-leak`, `gate0-pool-paths`, `gate0-runtime-check`, `outbox-durability`, `refresh-token-rotation`, `register-validation`, `fase2-wallet`, `fase-c-integration`. `ci.yml` executa unit + integration (Postgres 16 + Redis 7 + role `app_runtime` NOBYPASSRLS real) + frontend lint/build.
- **Lacuna:** **cobertura nÃƒÂ£o medida** (`test:coverage` existe, nÃƒÂ£o executado). Sem gate de cobertura. DÃƒÂ©bito `fix/ci-migrate-hang` com **causa-raiz desconhecida** ÃƒÂ© risco de flakiness no CI.
- **Severidade:** **P3**
- **DoD:** cobertura proporcional ao risco, medida e com piso definido nas capacidades P0/P1.

### Bloco FRONTCORE Ã¢â‚¬â€ NÃƒÂºcleo do frontend

#### `FRONTCORE-001` Ã¢â‚¬â€ Estrutura e roteamento por mÃƒÂ³dulo
- **Bloco:** FRONTCORE Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE E PRECISA VALIDAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO EM CI`
- **ProveniÃƒÂªncia:** `frontend/src/` (`App.jsx`, `routes/`, `contexts/`, `features/`, `pages/`, `hooks/`, `lib/`, `services/`) Ã‚Â· `frontend/src/routes/ModuleRoute.jsx` e `constants/authScopes.js` (criados em `ae31b65`) Ã‚Â· CI job `frontend` (lint + build)
- **Lacuna:** produÃƒÂ§ÃƒÂ£o nÃƒÂ£o verificada (L-1).

#### `FRONTCORE-002` Ã¢â‚¬â€ VerticalizaÃƒÂ§ÃƒÂ£o do frontend Ã‚Â· **dÃƒÂ©bito estrutural**
- **Bloco:** FRONTCORE Ã‚Â· **Responsabilidade:** NICHO Ã‚Â· **Estado:** `EXISTE MAS PRECISA REESTRUTURAÃƒâ€¡ÃƒÆ’O` Ã‚Â· **EvidÃƒÂªncia:** `IMPLEMENTADO`
- **ProveniÃƒÂªncia:** **`frontend/src/pages/Barber.jsx` = 4.990 linhas** (`wc -l`, 2026-07-16) Ã‚Â· **`frontend/src/pages/Clima.jsx` = 7 linhas** (stub)
- **Lacuna:** um ÃƒÂºnico arquivo de ~5k linhas concentra a vertical barber; nÃƒÂ£o hÃƒÂ¡ kit de UI reutilizÃƒÂ¡vel por nicho. O Clima nÃƒÂ£o tem frontend.
- **Severidade:** **P3** (dÃƒÂ©bito de manutenÃƒÂ§ÃƒÂ£o; **nÃƒÂ£o** bloqueia o marco v1) Ã‚Â· **Bloqueia:** marco Multi-nicho
- **DoD:** vertical decomposta em features; kit de UI reaproveitÃƒÂ¡vel identificado.

> **Ã¢Å“â€¦ CONVERGÃƒÅ NCIA:** "~4.990 linhas em `Barber.jsx`" e "`Clima.jsx` ÃƒÂ© stub de 7 linhas" Ã¢â‚¬â€ **ambos confirmados exatamente**.

### Bloco CONTRACT Ã¢â‚¬â€ Contratos de interface

#### `CONTRACT-001` Ã¢â‚¬â€ ValidaÃƒÂ§ÃƒÂ£o de request (schemas)
- **Bloco:** CONTRACT Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `CONCLUÃƒÂDA` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO LOCAL`
- **ProveniÃƒÂªncia:** `backend/src/shared/core/validation/` Ã¢â‚¬â€ `validateRequest.js` + 9 schemas Zod (`auth`, `auth-requests`, `barber-requests`, `clima-requests`, `id`, `integration`, `pagination`, `query`) Ã‚Â· suÃƒÂ­te unitÃƒÂ¡ria 765/765
- **Lacuna:** schemas de nicho (`barber-requests`, `clima-requests`) moram em `shared/core/` Ã¢â‚¬â€ acoplamento de **localizaÃƒÂ§ÃƒÂ£o**, nÃƒÂ£o de cÃƒÂ³digo (os nomes de arquivo nÃƒÂ£o violam I-1 por conteÃƒÂºdo). **P3**.

#### `CONTRACT-002` Ã¢â‚¬â€ Contrato de API publicado (OpenAPI)
- **Bloco:** CONTRACT Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** **`NÃƒÆ’O EXISTE`** Ã‚Â· **EvidÃƒÂªncia:** Ã¢â‚¬â€ (ausÃƒÂªncia verificada)
- **ProveniÃƒÂªncia:** `find . -iname "*openapi*" -o -iname "*swagger*"` (excluindo `node_modules`) Ã¢â€ â€™ **nenhum resultado** (2026-07-16)
- **Lacuna:** nÃƒÂ£o hÃƒÂ¡ contrato de API formal. O contrato entre backend e frontend ÃƒÂ© implÃƒÂ­cito.
- **Severidade:** **P4** (aspiracional para v1; relevante se houver consumidor externo) Ã‚Â· **DoD:** contrato versionado e verificado em CI.

#### `CONTRACT-003` Ã¢â‚¬â€ Respostas e erros padronizados
- **Bloco:** CONTRACT Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `CONCLUÃƒÂDA` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO LOCAL`
- **ProveniÃƒÂªncia:** `shared/core/responses/{success,fail,pagination}.js` Ã‚Â· `shared/core/errors/` Ã¢â‚¬â€ hierarquia `AppError` com 8 subclasses (inclui `TenantIsolationError`), `toAppError.js`, `middleware.js` Ã‚Â· suÃƒÂ­te unitÃƒÂ¡ria 765/765

### Bloco NICHEKIT Ã¢â‚¬â€ Kit de criaÃƒÂ§ÃƒÂ£o de nicho

#### `NICHEKIT-001` Ã¢â‚¬â€ Primitivas de mÃƒÂ³dulo
- **Bloco:** NICHEKIT Ã‚Â· **Responsabilidade:** CORE Ã‚Â· **Estado:** `EXISTE PARCIALMENTE` Ã‚Â· **EvidÃƒÂªncia:** `VALIDADO LOCAL`
- **ProveniÃƒÂªncia:** `middlewares/createModuleGuard.js` (factory genÃƒÂ©rica, **2 consumidores reais**) Ã‚Â· tabelas `modules` / `company_modules` (com RLS) Ã‚Â· `shared/capabilities/booking-engine/` (utils puras, reusadas por Barber e Clima) Ã‚Â· `shared/tenant/`
- **Lacuna:** as primitivas existem, mas **nÃƒÂ£o formam um kit**: nÃƒÂ£o hÃƒÂ¡ scaffolding, documentaÃƒÂ§ÃƒÂ£o de "como criar um nicho", nem contrato de persistÃƒÂªncia que permita reusar o motor de booking (`DOMAIN-002`). O que existe hoje permite criar um nicho **guardado e isolado**, mas nÃƒÂ£o **funcional sem reimplementar o domÃƒÂ­nio**.
- **DependÃƒÂªncias:** `DOMAIN-002` (P1), `IDENT-002` (P2), `ACCESS-001` (pronto) Ã‚Â· **Severidade:** **P1** para o marco Multi-nicho
- **DoD:** kit tecnicamente verificÃƒÂ¡vel Ã¢â‚¬â€ um nicho novo obtÃƒÂ©m guard, contexto tenant, RLS, billing, gating e motor de booking **sem reimplementar nenhum deles**.

#### `NICHEKIT-002` Ã¢â‚¬â€ ClimaGestor como prova do kit
- **Bloco:** NICHEKIT Ã‚Â· **Responsabilidade:** NICHO Ã‚Â· **Estado:** `EXISTE PARCIALMENTE` Ã‚Â· **EvidÃƒÂªncia:** `IMPLEMENTADO`
- **ProveniÃƒÂªncia:** `routes/clima.routes.js` (auth+company+module guards aplicados) Ã‚Â· `controllers/clima/index.js` Ã‚Â· `services/clima-core.service.js` Ã‚Â· `database/{clima.sql,clima_appointments.sql}` (3 tabelas com RLS) Ã‚Â· `shared/core/validation/schemas/clima-requests.schema.js` Ã‚Â· `frontend/src/pages/Clima.jsx` (**7 linhas**)
- **Lacuna:** o Clima **reimplementa o motor de booking** em vez de reusar (`DOMAIN-002`); frontend inexistente; **nenhuma empresa real usando** (afirmaÃƒÂ§ÃƒÂ£o documental, nÃƒÂ£o verificÃƒÂ¡vel Ã¢â‚¬â€ L-1).
- **Severidade:** **P1** para o marco Multi-nicho; **P4** como produto
- **DoD:** o Clima consome o motor de booking do Core **sem reimplementar** Ã¢â‚¬â€ ÃƒÂ© o **teste objetivo do marco Multi-nicho**.

---

## ANEXO C Ã¢â‚¬â€ Mocks, stubs e capacidades aspiracionais

| Item | Natureza | EvidÃƒÂªncia | Tratamento |
|---|---|---|---|
| **Automation Engine Ã‚Â· AI Operational Layer Ã‚Â· N8N Bridge Ã‚Â· Omnichannel** | **Aspiracional Ã¢â‚¬â€ NÃƒÆ’O implementado** | Declarados em `docs/` e `.agent/runtime/`; o prÃƒÂ³prio `capacidades.md` alerta *"nÃƒÂ£o tratar como reais"*. Nenhuma capacidade correspondente encontrada em `backend/src/shared/` | **NÃƒÂ£o entram na matriz como capacidade.** NÃƒÂ£o devem constar de nenhum plano como existentes. **P4.** |
| **`services/llm/` + `barber-ai.routes.js` + `ai_suggestions`** | Implementado; provider default declarado como Mock | `backend/src/services/llm/`, `routes/barber-ai.routes.js`, `controllers/barber/ai-insights.js`, migration `20260708_031_ai_suggestions.sql` (tabela **com RLS**) | NÃƒÂ£o auditado em profundidade nesta missÃƒÂ£o. **Custo externo de LLM nÃƒÂ£o avaliado** Ã¢â€ â€™ candidato a `API-001` (proteÃƒÂ§ÃƒÂ£o de rota). **P3.** |
| **`services/_archive/barber.service.legacy.js`** | CÃƒÂ³digo morto arquivado | DiretÃƒÂ³rio `_archive` | DÃƒÂ©bito de limpeza. **P4.** |
| **`backend/check-rls.js`, `check-rls2.js`** | Scratch local | NÃƒÂ£o rastreados; ignorados (`.gitignore:112`) | **ConteÃƒÂºdo nÃƒÂ£o lido** (L-6). **P3.** |
| **`.opencodex/projetos/multgestor/_inbox/antigos/duplicatas/roadmap-roadmap/capacidades.md`** | **Arquivo vazio (0 bytes)** | `ls -la` | Untracked. Pode capturar wikilinks `[[capacidades]]`. **P3** documental. |

**ReferÃƒÂªncias quebradas verificadas:** `CLAUDE.md` declara `.opencodex/brain/constitution.md` como autoridade vinculante; `find . -iname "constitu*"` Ã¢â€ â€™ **o arquivo nÃƒÂ£o existe** (sÃƒÂ³ `projetos/multgestor/constituicao.md` e `_inbox/revisar/constitution-knowledge-os.md`). Ver **D-05**.

---

## ANEXO D Ã¢â‚¬â€ DependÃƒÂªncias e bloqueadores

### Grafo (sem ciclos)

```text
DATAOPS-003 (OPS-SUPAVISOR, P1, Ã¢â€ºâ€ humano)
      Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬> DATAOPS-001 (continue-on-error, P1)
                 Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬> TENANT-003 (cobertura RLS, P2)

DATAOPS-002 (rede de seguranÃƒÂ§a do Render) = AUSENTE Ã¢â‚¬â€ CONFIRMADO 2026-07-16
      Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬> premissa de aceitaÃƒÂ§ÃƒÂ£o de DATAOPS-001 = FALSA
                 Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬> drift hoje = ZERO (banco em 031), mas por aÃƒÂ§ÃƒÂ£o MANUAL
                            Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬> OPS-MIGRATIONS-03: criar o processo (nÃƒÂ£o ÃƒÂ© conserto)

TENANT-001 Ã¢â€â‚¬Ã¢â€â‚¬> TENANT-002 Ã¢â€â‚¬Ã¢â€â‚¬> CONFIG-001        [cadeia CONCLUÃƒÂDA]

DOMAIN-001 (utils, CONCLUÃƒÂDA)
      Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬> DOMAIN-002 (services, P1) Ã¢â€â‚¬Ã¢â€â‚¬> NICHEKIT-001 (P1) Ã¢â€â‚¬Ã¢â€â‚¬> NICHEKIT-002 (P1)

IDENT-001 Ã¢â€â‚¬Ã¢â€â‚¬> IDENT-002 (P2) Ã¢â€â‚¬Ã¢â€â‚¬> NICHEKIT-001
ACCESS-001 (CONCLUÃƒÂDA) Ã¢â€â‚¬Ã¢â€â‚¬> NICHEKIT-001
FEATURE-001 (CONCLUÃƒÂDA) Ã¢â€â‚¬Ã¢â€â‚¬> BILLING-001 (P2)
EVENT-002 (CONCLUÃƒÂDA) Ã¢â€â‚¬Ã¢â€â‚¬> BILLING-001
```

**Ciclos:** nenhum detectado.

### Bloqueadores por severidade

| ID | Severidade | Bloqueia | Natureza |
|---|---|---|---|
| `DATAOPS-002` | **P1** | ~~AceitaÃƒÂ§ÃƒÂ£o de `DATAOPS-001`~~ | Ã¢Å“â€¦ **RESOLVIDA Ã¢â‚¬â€ `AUSENTE` confirmado** (2026-07-16). O Render **nÃƒÂ£o** roda migration; `deploy.yml:43` ÃƒÂ© **falso**. Deixa de ser incÃƒÂ³gnita e passa a ser **fato que fundamenta `OPS-MIGRATIONS-03`** |
| `DATAOPS-003` | **P1** | `DATAOPS-001`, `TENANT-003` | Ã¢â€ºâ€ Bloqueado por decisÃƒÂ£o humana (rotaÃƒÂ§ÃƒÂ£o de segredos). Ã¢Å¡Â Ã¯Â¸Â **Pode deixar de bloquear** se `OPS-MIGRATIONS-03` mover a migration para fora do runner do GitHub (ver plano) |
| `DATAOPS-001` | **P1** | Integridade de schema Ã‚Â· **toda migration futura** | Ã°Å¸â€â€ž **Job existe, mas NÃƒÆ’O ÃƒÂ© bloqueante** Ã¢â‚¬â€ `continue-on-error`; `needs:` decorativo. **A premissa que o justificava ÃƒÂ© FALSA** (`DATAOPS-002` = `AUSENTE`). **5 camadas ausentes**; o que resta ÃƒÂ© memÃƒÂ³ria humana |

### Ã¢Å¡Â Ã¯Â¸Â RISCO Ã¢â‚¬â€ drift entre migrations do repositÃƒÂ³rio e banco de produÃƒÂ§ÃƒÂ£o Ã‚Â· Ã°Å¸â€â€ž **MENSURADO em 2026-07-16**

**Estado atual do drift: ZERO.** O banco estÃƒÂ¡ **alinhado atÃƒÂ© a migration `031`** (verificaÃƒÂ§ÃƒÂ£o humana, 2026-07-16). As 32 migrations do repositÃƒÂ³rio (`20251231_000` Ã¢â‚¬Â¦ `20260708_031`) estÃƒÂ£o aplicadas.

> Ã¢Å¡Â Ã¯Â¸Â **A ausÃƒÂªncia de drift hoje NÃƒÆ’O ÃƒÂ© resultado do processo Ã¢â‚¬â€ ÃƒÂ© resultado de intervenÃƒÂ§ÃƒÂ£o manual.** O risco nÃƒÂ£o estava no passado; estÃƒÂ¡ em **toda migration futura**.

**Por que o risco permanece P1 mesmo com drift zero:**

| Camada que deveria garantir | Estado real (confirmado) |
|---|---|
| CI aplicar em prod | Ã¢ÂÅ’ **NÃƒÂ£o alcanÃƒÂ§a o banco** Ã¢â‚¬â€ ENETUNREACH/IPv6 (`883e516`) |
| CI bloquear o deploy se falhar | Ã¢ÂÅ’ **`continue-on-error: true`** (`deploy.yml:48`); `needs:` decorativo |
| Render aplicar no deploy | Ã¢ÂÅ’ **NÃƒÂ£o roda migration** (`DATAOPS-002` = `AUSENTE`, confirmado) |
| App aplicar no boot | Ã¢ÂÅ’ `server.js` Ã¢â€ â€™ 0 ocorrÃƒÂªncias de `migrate` |
| AlguÃƒÂ©m detectar o drift | Ã¢ÂÅ’ **Nenhum gate, alerta ou checklist** |

**Todas as cinco camadas estÃƒÂ£o ausentes.** O que resta ÃƒÂ© **memÃƒÂ³ria humana**. JÃƒÂ¡ falhou 2Ãƒâ€” (`022`, `023` Ã¢â‚¬â€ descobertas **por sintoma**, com o job quebrando em produÃƒÂ§ÃƒÂ£o). Funcionou nas demais **por disciplina, nÃƒÂ£o por desenho**.

**CenÃƒÂ¡rio de falha concreto:** alguÃƒÂ©m faz merge de uma migration `032` + o cÃƒÂ³digo que depende dela. O CI valida a migration contra o Postgres efÃƒÂªmero (passa Ã¢Å“â€¦). O job de migrations contra prod falha (ENETUNREACH) mas ÃƒÂ© marcado `success` Ã¢Å“â€¦. O Render sobe o backend novo **contra o schema antigo**. **O deploy fica verde e a aplicaÃƒÂ§ÃƒÂ£o quebra em produÃƒÂ§ÃƒÂ£o** Ã¢â‚¬â€ exatamente o modo de falha que os drifts `022`/`023` produziram.

**Consulta de verificaÃƒÂ§ÃƒÂ£o** (para reexecuÃƒÂ§ÃƒÂ£o futura):
```sql
SELECT version, name, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 10;
```

**MitigaÃƒÂ§ÃƒÂ£o:** **`OPS-MIGRATIONS-03`** Ã¢â‚¬â€ [[../../brain/plans/OPS-MIGRATIONS-03-plano]]. NÃƒÂ£o ÃƒÂ© conserto: ÃƒÂ© **criaÃƒÂ§ÃƒÂ£o** do processo que nunca existiu.

> **Nota:** `TENANT-003` (cobertura de RLS em prod) **permanece NÃƒÆ’O MENSURADO** Ã¢â‚¬â€ a verificaÃƒÂ§ÃƒÂ£o humana cobriu migrations, nÃƒÂ£o policies.
| `DOMAIN-002` | **P1** | Marco **Multi-nicho** | DecisÃƒÂ£o arquitetural pendente (ADR) |
| `NICHEKIT-001` | **P1** | Marco **Multi-nicho** | Depende de `DOMAIN-002` |
| `BILLING-001` | **P2** | Circuito comercial | Config de produÃƒÂ§ÃƒÂ£o (D-016) |
| `IDENT-002` | **P2** | Escopo por mÃƒÂ³dulo | Contorno controlado |
| `TENANT-003` | **P2** | Cobertura RLS auditÃƒÂ¡vel | Requer acesso ao banco |

**Nenhum P0 identificado.** Nenhuma evidÃƒÂªncia de risco imediato de seguranÃƒÂ§a, vazamento entre tenants ou indisponibilidade crÃƒÂ­tica foi encontrada dentro do escopo auditado. **Isto nÃƒÂ£o ÃƒÂ© um atestado de ausÃƒÂªncia de P0** Ã¢â‚¬â€ produÃƒÂ§ÃƒÂ£o nÃƒÂ£o foi verificada (L-1).

---

## ANEXO E Ã¢â‚¬â€ DivergÃƒÂªncias registradas

> Formato: informaÃƒÂ§ÃƒÂ£o anterior Ã‚Â· estado factual Ã‚Â· fonte Ã‚Â· decisÃƒÂ£o de substituiÃƒÂ§ÃƒÂ£o Ã‚Â· data.

### D-01 Ã¢â‚¬â€ Auth do ClimaGestor
- **Anterior:** *"`clima.routes.js` usa `requireBarberAdminAuth` **por engano**"* Ã¢â‚¬â€ `capacidades.md` (2026-07-03)
- **Factual:** `clima.routes.js:6,15` usa `requireTenantAdminAuth` desde `ae31b65` (2026-07-03, em `main`). O alias **ÃƒÂ©** `requireBarberAdminAuth` (`auth.middleware.js:128`), e isso ÃƒÂ© **deliberado e documentado** (`:121-127`), nÃƒÂ£o um engano.
- **Fonte:** leitura de cÃƒÂ³digo + `git merge-base --is-ancestor ae31b65 main` Ã¢â€ â€™ verdadeiro
- **DecisÃƒÂ£o:** **SUBSTITUIR.** Reclassificado de "bug de autorizaÃƒÂ§ÃƒÂ£o" para **dÃƒÂ©bito de acoplamento P2** (`IDENT-002`). Ã‚Â· **Data:** 2026-07-16

### D-02 Ã¢â‚¬â€ Estado da RLS em runtime
- **Anterior:** *"RLS Ã°Å¸Å¸Â¡ ENABLE, **inerte em runtime**; runtime usa role com BYPASSRLS"* Ã¢â‚¬â€ `capacidades.md` (2026-07-03)
- **Factual:** RLS **ativa**. `tenantAwareConnect` (`database.js:129`) roteia conexÃƒÂµes com contexto tenant para `poolTenant` (`app_runtime`, NOBYPASSRLS); `requireCompany.js:44-54` injeta GUC transaction-local. CI cria a role real NOBYPASSRLS e executa `tenant-isolation-rls.test.js`.
- **Fonte:** cÃƒÂ³digo + `ci.yml` + commits `aeed31c` (2026-07-01), `02c5396` (2026-07-02, **anterior** ao documento)
- **DecisÃƒÂ£o:** **SUBSTITUIR** por `TENANT-002` (`CONCLUÃƒÂDA`, `VALIDADO EM CI`). Ã‚Â· **Data:** 2026-07-16

### D-03 Ã¢â‚¬â€ Cobertura de RLS
- **Anterior:** *"RLS 23/27 tabelas Ã¢â‚¬â€ companies e users sem policy"* Ã¢â‚¬â€ `capacidades.md`, `painel-executivo.md`
- **Factual:** **40 tabelas com `CREATE POLICY`** nas migrations. `companies` e `users` **tÃƒÂªm** policies desde a migration 024 (2026-06-24). `refresh_tokens` tem ENABLE sem policy **por design documentado**.
- **Fonte:** `grep -rhoiE "CREATE POLICY Ã¢â‚¬Â¦ ON Ã¢â‚¬Â¦" src/database/*.sql`
- **DecisÃƒÂ£o:** **SUBSTITUIR** por `TENANT-003`. Ã¢Å¡Â Ã¯Â¸Â O novo nÃƒÂºmero **tambÃƒÂ©m nÃƒÂ£o ÃƒÂ© o estado de produÃƒÂ§ÃƒÂ£o** (L-4): migrations 027/028 provam `ENABLE` fora do versionamento. O nÃƒÂºmero correto exige consulta ao banco. Ã‚Â· **Data:** 2026-07-16

### D-04 Ã¢â‚¬â€ VocabulÃƒÂ¡rio do gating de plano
- **Anterior:** *"gating de plano ainda com vocabulÃƒÂ¡rio do barber"* Ã¢â‚¬â€ `capacidades.md`
- **Factual:** **Falso.** `utils/planFeatures.js` usa chaves genÃƒÂ©ricas (`collaborators`, `advanced_reports`, `financial_dashboard`, `extra_permissions`, `advanced_schedule`, `future_modules`); `shared/capabilities/billing/` Ã¢â€ â€™ **0** ocorrÃƒÂªncias de `barber`; `company-plan.service.js` Ã¢â€ â€™ **0**.
- **Fonte:** leitura de `planFeatures.js` + `grep -rn "barber" shared/capabilities/billing/` + `grep -c "barber" services/company-plan.service.js`
- **DecisÃƒÂ£o:** **SUBSTITUIR** por `FEATURE-001` (`CONCLUÃƒÂDA`). **ConsequÃƒÂªncia:** invalida qualquer plano que pretenda "generalizar o gating antes da Fase 6" Ã¢â‚¬â€ o trabalho jÃƒÂ¡ existe. Ã‚Â· **Data:** 2026-07-16

### D-05 Ã¢â‚¬â€ Autoridade de governanÃƒÂ§a inexistente
- **Anterior:** *"em conflito, a autoridade ÃƒÂ© `.opencodex/brain/constitution.md`"* Ã¢â‚¬â€ `CLAUDE.md` (carregado em toda sessÃƒÂ£o)
- **Factual:** o arquivo **nÃƒÂ£o existe**. `.opencodex/brain/` contÃƒÂ©m apenas `fila-de-implementacao.md` e `plans/`. Existem `projetos/multgestor/constituicao.md` e `_inbox/revisar/constitution-knowledge-os.md`.
- **Fonte:** `find . -iname "constitu*"` (2026-07-16)
- **DecisÃƒÂ£o:** **NÃƒÆ’O SUBSTITUÃƒÂDA Ã¢â‚¬â€ exige decisÃƒÂ£o humana.** NÃƒÂ£o ÃƒÂ© competÃƒÂªncia desta missÃƒÂ£o eleger a autoridade de governanÃƒÂ§a. Registrada em `fonte-unica-verdade.md`. Ã‚Â· **Data:** 2026-07-16

### D-06 Ã¢â‚¬â€ Estado do Git no status-atual
- **Anterior:** `ahead_of_origin: 14` Ã‚Â· `diverged: true` Ã‚Â· `release/push-p0-batch` como **prÃƒÂ©-condiÃƒÂ§ÃƒÂ£o da Fase 6** Ã¢â‚¬â€ `status-atual.md` (v22, 2026-07-10)
- **Factual:** `main` sincronizada, **0/0**, HEAD = origin/main = `4c8ce847`. **0 PRs abertas.**
- **Fonte:** `git rev-list --count` (ambas as direÃƒÂ§ÃƒÂµes) + `gh pr list --state open --json`
- **DecisÃƒÂ£o:** **SUBSTITUIR.** A prÃƒÂ©-condiÃƒÂ§ÃƒÂ£o declarada da Fase 6 **estÃƒÂ¡ satisfeita**. Ã‚Â· **Data:** 2026-07-16

### D-07 Ã¢â‚¬â€ Stash pendente
- **Anterior:** `stash@{1}` com 31 arquivos parciais (registro de organizaÃƒÂ§ÃƒÂ£o de bancada, 2026-07-11)
- **Factual:** `git stash list` Ã¢â€ â€™ **vazio**.
- **DecisÃƒÂ£o:** **SUBSTITUIR** Ã¢â‚¬â€ pendÃƒÂªncia inexistente. Ã‚Â· **Data:** 2026-07-16

> **PadrÃƒÂ£o observado nas 7 divergÃƒÂªncias:** a documentaÃƒÂ§ÃƒÂ£o canÃƒÂ´nica erra **nos dois sentidos** Ã¢â‚¬â€ otimista em D-06/D-07 (declara pendÃƒÂªncias jÃƒÂ¡ resolvidas) e **pessimista em D-02/D-03/D-04** (declara como quebrado o que jÃƒÂ¡ funciona). DocumentaÃƒÂ§ÃƒÂ£o que erra em ambas as direÃƒÂ§ÃƒÂµes nÃƒÂ£o pode ser descontada por viÃƒÂ©s; **sÃƒÂ³ verificaÃƒÂ§ÃƒÂ£o direta a torna utilizÃƒÂ¡vel**. Esta ÃƒÂ© a justificativa factual do Gate 0.

---

## ANEXO F Ã¢â‚¬â€ Backlog priorizado

> OrdenaÃƒÂ§ÃƒÂ£o: severidade Ã‚Â· bloqueio de marco Ã‚Â· dependÃƒÂªncias desbloqueadas Ã‚Â· exposiÃƒÂ§ÃƒÂ£o ao risco Ã‚Â· facilidade de produzir evidÃƒÂªncia Ã‚Â· menor esforÃƒÂ§o. **Severidade isolada nÃƒÂ£o determina a ordem.**
> **Reordenado em 2026-07-20** apÃƒÂ³s a conclusÃƒÂ£o da OPS-MIGRATIONS-03D Ã¢â‚¬â€ ver nota de encerramento abaixo da tabela.

| # | Item | Capacidades | Sev. | Marco | Justificativa da posiÃƒÂ§ÃƒÂ£o |
|---|---|---|---|---|---|
| **1** | **ADR: rebaixar ou promover o Booking Engine** | `DOMAIN-002`, `NICHEKIT-001` | P1 | Multi-nicho | DecisÃƒÂ£o, nÃƒÂ£o cÃƒÂ³digo. Bloqueia 2 capacidades e o marco Multi-nicho. **Escrever cÃƒÂ³digo antes do ADR ÃƒÂ© o erro que criou o A7.** |
| **2** | **InventÃƒÂ¡rio de RLS consultado no banco** | `TENANT-003` | P2 | v1 | 3 documentos erram a cobertura (D-03) e o repo **nÃƒÂ£o ÃƒÂ© fonte completa** (L-4). Requer acesso read-only ao banco. |
| **3** | **AtivaÃƒÂ§ÃƒÂ£o do entitlement de billing em produÃƒÂ§ÃƒÂ£o** | `BILLING-001`, `BILLING-002` | P2 | v1 | CÃƒÂ³digo pronto e gating **jÃƒÂ¡ genÃƒÂ©rico** (D-04 elimina o prÃƒÂ©-requisito antes presumido). Falta config (D-016) + evidÃƒÂªncia de prod. Fecha o circuito comercial. |
| **4** | **Auditoria de proteÃƒÂ§ÃƒÂ£o de rota (R-003)** | `API-001`, `FILES-001` | P2 | v1 | Rotas de upload e de IA (custo externo) nÃƒÂ£o auditadas. SuperfÃƒÂ­cie de abuso desconhecida. |
| **5** | **Escopo de auth por mÃƒÂ³dulo** | `IDENT-002`, `ACCESS-002` | P2/P3 | Multi-nicho | Contorno controlado hoje; vira P1 quando existir um segundo scope real. |
| **6** | **Trilha de auditoria unificada** | `AUDIT-001` | P3 | Ã¢â‚¬â€ | 3 tabelas, nenhuma com RLS, sem retenÃƒÂ§ÃƒÂ£o. |
| **7** | **Gate de seguranÃƒÂ§a bloqueante** | `SEC-003` | P3 | Ã¢â‚¬â€ | `security-audit.yml` nÃƒÂ£o bloqueia. |
| **8** | **DecomposiÃƒÂ§ÃƒÂ£o de `Barber.jsx`** | `FRONTCORE-002` | P3 | Multi-nicho | 4.990 linhas; dÃƒÂ©bito de manutenÃƒÂ§ÃƒÂ£o, sem risco imediato. |
| **9** | **Observabilidade de performance** | `OBS-002` | P4 | Ã¢â‚¬â€ | Sem baseline; adiar atÃƒÂ© o volume justificar. |

> Ã¢Å“â€¦ **Item #1 anterior Ã¢â‚¬â€ `OPS-MIGRATIONS-03` Ã¢â‚¬â€ CONCLUÃƒÂDO em 2026-07-20** como **OPS-MIGRATIONS-03D**. Migrations de produÃƒÂ§ÃƒÂ£o passaram a ser automÃƒÂ¡ticas, bloqueantes, estritas, idempotentes e reversÃƒÂ­veis (`buildCommand = npm install && npm run migrate:prod`, gate no Render). `DATAOPS-001` deixou de ser alvo Ã¢â‚¬â€ estÃƒÂ¡ **resolvido** (gate bloqueante ativo). EvidÃƒÂªncias: [[../../brain/plans/OPS-MIGRATIONS-03D-plano]] Ã‚Â§ ENCERRAMENTO. Os itens 2Ã¢â‚¬â€œ10 subiram uma posiÃƒÂ§ÃƒÂ£o cada.

**Fora do backlog (bloqueado por humano):** `DATAOPS-003` Ã¢â‚¬â€ a **conectividade IPv6** que o descrevia ficou **moot**: nenhum workflow do GitHub tenta mais alcanÃƒÂ§ar o banco de produÃƒÂ§ÃƒÂ£o (o job `run-migrations` foi removido do `deploy.yml` no GATE 9). A condiÃƒÂ§ÃƒÂ£o que a prÃƒÂ³pria matriz previa para desbloquear a rotaÃƒÂ§ÃƒÂ£o de segredos Ã¢â‚¬â€ *"remove a `DATABASE_URL` de produÃƒÂ§ÃƒÂ£o do CI Ã¢â€ â€™ dissolve a preocupaÃƒÂ§ÃƒÂ£o de secret em log"* Ã¢â‚¬â€ estÃƒÂ¡ **satisfeita**: `secrets.DATABASE_URL` tem **0 ocorrÃƒÂªncias** em `deploy.yml`. A rotaÃƒÂ§ÃƒÂ£o de segredos em si **continua pausada por decisÃƒÂ£o humana** Ã¢â‚¬â€ este documento nÃƒÂ£o a declara retomada; apenas registra que o bloqueio tÃƒÂ©cnico que a impedia deixou de existir. **NÃƒÂ£o alterar o `continue-on-error`** (que tambÃƒÂ©m jÃƒÂ¡ nÃƒÂ£o existe neste job) nÃƒÂ£o se aplica mais Ã¢â‚¬â€ nada a fazer aqui sem decisÃƒÂ£o humana sobre a rotaÃƒÂ§ÃƒÂ£o.

---

## ANEXO G Ã¢â‚¬â€ Marcos

### Core Consolidado v1 Ã¢â‚¬â€ fundaÃƒÂ§ÃƒÂ£o validada pelo BarberGestor

| Requisito | Estado |
|---|---|
| FundaÃƒÂ§ÃƒÂ£o multi-tenant isolada e provada | Ã¢Å“â€¦ `TENANT-001`, `TENANT-002`, `CONFIG-001` Ã¢â‚¬â€ `VALIDADO EM CI` |
| Contratos estabilizados | Ã¢Å“â€¦ `CONTRACT-001`, `CONTRACT-003`, `EVENT-001`, `EVENT-002` |
| BarberGestor operando sobre a fundaÃƒÂ§ÃƒÂ£o | Ã°Å¸Å¸Â¡ `IMPLEMENTADO`; **produÃƒÂ§ÃƒÂ£o nÃƒÂ£o verificada (L-1)** |
| Integridade de schema garantida | Ã°Å¸â€Â´ `DATAOPS-001` (job **nÃƒÂ£o bloqueante**) + `DATAOPS-002` (**`NÃƒÆ’O_COMPROVADO`**) Ã¢â‚¬â€ **risco de drift NÃƒÆ’O MENSURADO** |
| Circuito comercial fechado | Ã°Å¸Å¸Â¡ `BILLING-001` Ã¢â‚¬â€ falta prova em produÃƒÂ§ÃƒÂ£o |
| Kit de nicho tecnicamente verificÃƒÂ¡vel | Ã°Å¸â€Â´ `NICHEKIT-001` Ã¢â‚¬â€ primitivas existem, kit nÃƒÂ£o |

**Veredito:** **NÃƒÆ’O ATINGIDO.** Bloqueadores: `DATAOPS-002` (P1, **`NÃƒÆ’O_COMPROVADO`** apÃƒÂ³s OPS-MIGRATIONS-01), `NICHEKIT-001` (P1), `BILLING-001` (P2).

### Core Multi-nicho Comprovado Ã¢â‚¬â€ segundo nicho real reutilizando a fundaÃƒÂ§ÃƒÂ£o

| Requisito | Estado |
|---|---|
| Segundo nicho consome o motor sem reimplementar | Ã°Å¸â€Â´ `DOMAIN-002`/`NICHEKIT-002` Ã¢â‚¬â€ o Clima **reimplementou** |
| Segundo nicho com frontend real | Ã°Å¸â€Â´ `Clima.jsx` = 7 linhas |
| Segundo nicho em uso real | Ã°Å¸â€Â´ nenhuma empresa (documental, nÃƒÂ£o verificado) |

**Veredito:** **NÃƒÆ’O ATINGIDO.** Depende de `DOMAIN-002` (ADR) Ã¢â€ â€™ `NICHEKIT-001` Ã¢â€ â€™ `NICHEKIT-002`.

---

## PRÃƒâ€œXIMA MISSÃƒÆ’O

> Ã¢Å“â€¦ **INCÃƒâ€œGNITA FECHADA em 2026-07-16.** A pergunta *"como as migrations chegam ÃƒÂ  produÃƒÂ§ÃƒÂ£o?"* foi respondida por **verificaÃƒÂ§ÃƒÂ£o humana**: o **Render nÃƒÂ£o roda migration**, o **CI nÃƒÂ£o bloqueia**, e o **banco estÃƒÂ¡ alinhado atÃƒÂ© `031`** Ã¢â‚¬â€ ou seja, as migrations vÃƒÂªm sendo aplicadas **manualmente via MCP**. `DATAOPS-002` = **`AUSENTE`** (confirmado). A afirmaÃƒÂ§ÃƒÂ£o de `deploy.yml:43` era **falsa**.
>
> **A prÃƒÂ³xima missÃƒÂ£o deixa de ser investigativa e passa a ser de projeto.** O drift hoje ÃƒÂ© **zero**; o processo ÃƒÂ© que ÃƒÂ© **frÃƒÂ¡gil**.

### `OPS-MIGRATIONS-03` Ã¢â‚¬â€ criar o processo seguro de aplicaÃƒÂ§ÃƒÂ£o de migrations

> Ã°Å¸â€œâ€¹ **Plano completo:** [[../../brain/plans/OPS-MIGRATIONS-03-plano]] Ã‚Â· Ã¢â€ºâ€ **implementaÃƒÂ§ÃƒÂ£o aguarda autorizaÃƒÂ§ÃƒÂ£o humana**

**Problema:** **nada garante que uma migration chegue ÃƒÂ  produÃƒÂ§ÃƒÂ£o antes do cÃƒÂ³digo que depende dela.** As 5 camadas que deveriam garantir isso Ã¢â‚¬â€ CI aplicar, CI bloquear, Render aplicar, app aplicar no boot, alguÃƒÂ©m detectar Ã¢â‚¬â€ estÃƒÂ£o **todas ausentes**. O banco estÃƒÂ¡ correto **por disciplina humana**, nÃƒÂ£o por desenho. JÃƒÂ¡ falhou 2Ãƒâ€” (`022`, `023`, descobertos por sintoma).

**DecisÃƒÂ£o central proposta:** mover a migration para o **Build Command do Render** (ÃƒÂºnico lugar com conectividade Ã¢â‚¬â€ C-2 Ã¢â‚¬â€ e ÃƒÂºnico que bloqueia deploy no free tier Ã¢â‚¬â€ C-3) e **DELETAR o job `run-migrations` do `deploy.yml`**, que nÃƒÂ£o aplica nada, mascara falha e cria dependÃƒÂªncia decorativa. **Efeito colateral:** remove a `DATABASE_URL` de produÃƒÂ§ÃƒÂ£o do CI Ã¢â€ â€™ **dissolve a preocupaÃƒÂ§ÃƒÂ£o de secret em log** que mantÃƒÂ©m `DATAOPS-003` bloqueado.

**Cobre os 7 pontos exigidos:** onde rodar (Ã‚Â§3) Ã‚Â· qual comando (Ã‚Â§4) Ã‚Â· como falha bloqueia (Ã‚Â§5) Ã‚Â· concorrÃƒÂªncia via `pg_try_advisory_lock` (Ã‚Â§6 Ã¢â‚¬â€ hoje **nÃƒÂ£o hÃƒÂ¡ trava**) Ã‚Â· validaÃƒÂ§ÃƒÂ£o prÃƒÂ©/pÃƒÂ³s (Ã‚Â§7) Ã‚Â· secrets (Ã‚Â§8) Ã‚Â· reversÃƒÂ£o (Ã‚Â§9 Ã¢â‚¬â€ Ã¢Å¡Â Ã¯Â¸Â **hoje nÃƒÂ£o existe rollback de migration**; sÃƒÂ£o forward-only).

**Gate 0 (humano):** confirmar no painel que o build tem `DATABASE_URL` **e** alcanÃƒÂ§a o banco. **Se falhar, o plano muda** (tier pago ou processo manual formalizado com gate de detecÃƒÂ§ÃƒÂ£o).

**Problema factual.** `DATAOPS-002` permanece **`NÃƒÆ’O_COMPROVADO`**. A afirmaÃƒÂ§ÃƒÂ£o de `deploy.yml:43` (*"O Render aplica migrations em runtimeÃ¢â‚¬Â¦"*) foi introduzida pelo commit **`3b417a9`** (2026-07-12, co-autoria de agente) **sem nenhuma evidÃƒÂªncia**, e ÃƒÂ© **contradita por 3 fontes** do prÃƒÂ³prio projeto (auditoria 2026-07-10 e `status-atual.md` afirmam que o drift acumula sem aplicaÃƒÂ§ÃƒÂ£o manual via MCP; migrations `022`/`023` foram aplicadas ÃƒÂ  mÃƒÂ£o). O `continue-on-error` (`DATAOPS-001`) ÃƒÂ© aceito **por causa dessa afirmaÃƒÂ§ÃƒÂ£o** Ã¢â‚¬â€ ou seja, o pipeline de produÃƒÂ§ÃƒÂ£o repousa sobre uma premissa que ninguÃƒÂ©m verificou e cuja ÃƒÂºnica evidÃƒÂªncia disponÃƒÂ­vel aponta na direÃƒÂ§ÃƒÂ£o contrÃƒÂ¡ria.

**Por que um agente nÃƒÂ£o resolve isto.** OPS-MIGRATIONS-01 esgotou as vias READ_ONLY automatizÃƒÂ¡veis: painel e logs do Render sÃƒÂ£o inacessÃƒÂ­veis (`list_connected_browsers` Ã¢â€ â€™ `[]`; **login ÃƒÂ© vedado ao agente**), o Render CLI nÃƒÂ£o existe, o MCP Supabase responde `Unauthorized` (2Ã‚Âª vez), e `/api/health/deep` Ã¢â‚¬â€ a ÃƒÂºnica evidÃƒÂªncia de produÃƒÂ§ÃƒÂ£o obtida Ã¢â‚¬â€ **nÃƒÂ£o expÃƒÂµe `schema_migrations`**. **Nenhuma leitura adicional de repositÃƒÂ³rio resolve:** sem `render.yaml`, a configuraÃƒÂ§ÃƒÂ£o que determina o comportamento **nÃƒÂ£o ÃƒÂ© versionada** (`DATAOPS-002`, evidÃƒÂªncia 3). O repositÃƒÂ³rio ÃƒÂ© estruturalmente incapaz de responder.

**Por que esta e nÃƒÂ£o outra.** Continua sendo a mÃƒÂ¡xima informaÃƒÂ§ÃƒÂ£o por esforÃƒÂ§o (~10 min de humano) e a ÃƒÂºnica P1 puramente informacional. Seu resultado **reordena o backlog**: se o Render aplica migrations, `DATAOPS-001` cai para dÃƒÂ©bito de CI e a fila segue para o ADR do Booking Engine; se nÃƒÂ£o aplica, o drift ÃƒÂ© real e `DATAOPS-001` passa ÃƒÂ  frente de billing e de qualquer refactor.

**Capacidades afetadas:** `DATAOPS-002` (alvo) Ã‚Â· `DATAOPS-001`, `TENANT-003` (reclassificaÃƒÂ§ÃƒÂ£o dependente do resultado)

**Escopo Ã¢â‚¬â€ 3 passos:**
1. **Painel do Render** Ã¢â€ â€™ serviÃƒÂ§o `multgestor-backend` Ã¢â€ â€™ **Settings**: transcrever `Build Command`, `Pre-Deploy Command`, `Start Command`. Verificar se algum contÃƒÂ©m `migrate`.
   - Ã¢Å¡Â Ã¯Â¸Â **Free tier nÃƒÂ£o oferece Pre-Deploy Command** (recurso de planos pagos). Se o tier for free (`ADR-002-render`: *"em produÃƒÂ§ÃƒÂ£o (free tier)"*, corroborado por cold start de 33s observado), a ÃƒÂºnica via possÃƒÂ­vel ÃƒÂ© o **Build Command**.
2. **Logs do ÃƒÂºltimo deploy** Ã¢â€ â€™ procurar a saÃƒÂ­da caracterÃƒÂ­stica do runner: `[migrate] banco alvo:` Ã‚Â· `[ok]` Ã‚Â· `[skip]` Ã‚Â· `[migrate] todas as migrations aplicadas com sucesso.`
3. **Banco (read-only)** Ã¢â‚¬â€ a consulta decisiva:
   ```sql
   SELECT version, name, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 10;
   ```
   - `20260708_031` (`ai_suggestions`) **ausente** Ã¢â€ â€™ Render **nÃƒÂ£o** aplica; **drift confirmado e ativo**.
   - `applied_at` agrupado em janelas de deploy Ã¢â€ â€™ automÃƒÂ¡tico; esparso/avulso Ã¢â€ â€™ manual.

**Fora de escopo:** Ã¢â€ºâ€ alterar o `continue-on-error` (**proibido** atÃƒÂ© a rotaÃƒÂ§ÃƒÂ£o de segredos ser retomada Ã¢â‚¬â€ `DATAOPS-003`) Ã‚Â· aplicar qualquer migration Ã‚Â· alterar config do Render Ã‚Â· resolver OPS-SUPAVISOR Ã‚Â· tocar em billing ou no Booking Engine.

**Riscos:** (1) o painel exibe secrets na tela Ã¢â‚¬â€ **nÃƒÂ£o transcrever valor algum** para nenhum documento; (2) a consulta exige credencial de leitura Ã¢â‚¬â€ usar via read-only existente, **nunca criar credencial nova**.

**Gates:** `BASELINE_CONGELADO` Ã‚Â· `EVIDÃƒÅ NCIA_COLETADA` (log/config observados, **nÃƒÂ£o** afirmaÃƒÂ§ÃƒÂ£o) Ã‚Â· `NENHUM_SECRET_REPRODUZIDO` Ã‚Â· `DATAOPS-002_CLASSIFICADA` Ã‚Â· `DATAOPS-001_RECLASSIFICADA`

**Testes:** nenhum cÃƒÂ³digo alterado Ã¢â€¡â€™ nenhum teste novo. **ReversÃƒÂ£o:** nÃƒÂ£o aplicÃƒÂ¡vel Ã¢â‚¬â€ read-only.

**DoD:** `DATAOPS-002` sai de **`NÃƒÆ’O_COMPROVADO`** para **`AUTOMÃƒÂTICO_COMPROVADO`** (a rede existe, com log/config) **ou** **`AUSENTE`** (confirmado que nÃƒÂ£o existe) Ã¢â‚¬â€ com evidÃƒÂªncia referenciada em ambos os casos; `DATAOPS-001` reclassificada; risco de drift **mensurado** (ANEXO D); backlog reordenado.

**AutorizaÃƒÂ§ÃƒÂµes humanas necessÃƒÂ¡rias:**
- Ã¢Å“â€¹ **Acesso humano ao painel e logs do Render** Ã¢â‚¬â€ o agente nÃƒÂ£o possui e **nÃƒÂ£o pode fazer login**.
- Ã¢Å“â€¹ **`SUPABASE_ACCESS_TOKEN` vÃƒÂ¡lido** para o MCP **ou** execuÃƒÂ§ÃƒÂ£o humana da consulta do passo 3.
- Ã¢â€ºâ€ **Nenhuma autorizaÃƒÂ§ÃƒÂ£o de escrita ÃƒÂ© requerida ou solicitada.**

> **Nota sobre a Fase 6 (billing).** Esta matriz **nÃƒÂ£o** trata billing como prioridade presumida. Ela foi reavaliada junto das demais e ficou em **4Ã‚Âº** no backlog. Dois fatos mudaram sua anÃƒÂ¡lise: (1) sua prÃƒÂ©-condiÃƒÂ§ÃƒÂ£o declarada (`release/push-p0-batch`) **jÃƒÂ¡ estÃƒÂ¡ satisfeita** (D-06); (2) o suposto prÃƒÂ©-requisito de "generalizar o gating" **nÃƒÂ£o existe** Ã¢â‚¬â€ o gating jÃƒÂ¡ ÃƒÂ© genÃƒÂ©rico (D-04). Billing estÃƒÂ¡ mais perto do que a documentaÃƒÂ§ÃƒÂ£o sugeria; ainda assim, perde para uma verificaÃƒÂ§ÃƒÂ£o de P1 que custa uma inspeÃƒÂ§ÃƒÂ£o e reordena a fila.

---

## ProteÃƒÂ§ÃƒÂ£o de rota

Esta missÃƒÂ£o ÃƒÂ© documental e READ_ONLY. **NÃƒÂ£o cria superfÃƒÂ­cie exposta Ã‚Â· nÃƒÂ£o gera custo externo Ã‚Â· nÃƒÂ£o requer rate limit Ã‚Â· nÃƒÂ£o requer limite por tenant/usuÃƒÂ¡rio.** As quatro perguntas do `CLAUDE.md` nÃƒÂ£o se aplicam Ã¢â‚¬â€ nenhuma rota foi criada ou alterada.

## Estado Git final

IdÃƒÂªntico ao baseline. Nenhum arquivo de cÃƒÂ³digo, teste, migration, workflow ou dependÃƒÂªncia foi alterado. Nenhum commit, push, PR, deploy ou migration executado. Nenhum secret lido ou reproduzido.
