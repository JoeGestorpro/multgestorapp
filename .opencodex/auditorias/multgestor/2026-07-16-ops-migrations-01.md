# OPS-MIGRATIONS-01 — Como as migrations são aplicadas em produção

> **Missão:** OPS-MIGRATIONS-01 (`ops/verificar-aplicacao-migrations-producao`) · **Modo:** AUTÔNOMO CONTROLADO, READ_ONLY
> **Data:** 2026-07-16T19:44:09Z → 19:55Z · **Capacidade alvo:** `DATAOPS-002` · **Possível reclassificação:** `DATAOPS-001`
> **Fonte canônica relacionada:** [[../../projetos/multgestor/matriz-consolidacao-core]]
> **Gates executados:** 0 a 9.

---

## VEREDITO

# `NÃO_COMPROVADO`

**A afirmação de que o Render aplica migrations em runtime não pôde ser verificada — e não há, em nenhum lugar do repositório ou da documentação, evidência que a sustente.**

Secundariamente, o registro documental é **`INCONSISTENTE`**: duas fontes do próprio projeto afirmam coisas mutuamente exclusivas, com 2 dias de intervalo (ver §5).

> ⚠️ **`NÃO_COMPROVADO` não significa "provavelmente está tudo bem".** Significa que o pipeline de produção opera sobre uma premissa que **ninguém verificou** — e que a única evidência documental disponível **aponta na direção contrária**.

---

## 1. Baseline

| Campo | Valor |
|---|---|
| **Data/hora início (UTC)** | 2026-07-16T19:44:09Z |
| **Repositório** | `C:/MultGestor.v2` · branch `main` |
| **HEAD** | `4c8ce8470634a6d3fc1b91f8341ed912f845c0e9` |
| **origin/main** | `4c8ce847…` — **0 ahead / 0 behind** |
| **Baseline idêntico ao da missão 12.1A** | ✅ Sim — as evidências das duas missões são diretamente comparáveis |

**Modificados (rastreados), todos documentais e pré-existentes:** `fonte-unica-verdade.md` · `capacidades.md` · `indice.md` · `plataforma.md` · `00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR.md`

---

## 2. Fluxo real (verificado no repositório)

```text
push em main
   ↓
ci.yml  ──> unit (765 testes) + integration (Postgres 16 efêmero + Redis 7 + role app_runtime)
   │         └─ `npm run migrate` roda DE VERDADE aqui, SEM continue-on-error
   ↓            (prova que as migrations são VÁLIDAS — não que foram APLICADAS em prod)
deploy.yml
   ├── job run-migrations
   │     └─ `timeout 3m npm run migrate` contra o banco de PRODUÇÃO
   │        └─ ⚠️ FALHA 100% — `connect ENETUNREACH …:5432` (IPv6, visto em 883e516)
   │        └─ `continue-on-error: true` (deploy.yml:48) → step marcado SUCCESS mesmo falhando
   ↓
   └── job deploy-backend  (needs: run-migrations)
         └─ `curl` para deploy hook do Render (URL secreta)
               ↓
         Render faz build + start do serviço
               └─ ❓ AQUI ESTÁ A INCÓGNITA: build/preDeploy/start commands vivem
                  SOMENTE no painel do Render — não versionados, não inspecionáveis
```

**Ponto crítico do fluxo:** o job `deploy-backend` declara `needs: run-migrations`. Como `run-migrations` **sempre** termina como `success` (por causa do `continue-on-error`), a dependência **nunca protege nada**. O deploy do backend prossegue independentemente do resultado real das migrations.

### O mecanismo do runner (`backend/scripts/run-migrations.js`)

- Tabela de controle **`schema_migrations`** (`version` PK, `name`, `applied_at`, `duration_ms`) — criada com `CREATE TABLE IF NOT EXISTS`.
- **32 migrations** enumeradas em lista ordenada (`20251231_000` … `20260708_031`).
- **Idempotente:** `applied.has(version)` → `[skip]`. Reexecução é segura.
- **Verificação de integridade pós-migration:** exige que a tabela `pin_reset_tokens` exista, senão lança erro.
- **Consequência útil:** `schema_migrations.applied_at` **distinguiria automático de manual em uma única consulta** — timestamps agrupados por deploy indicam automático; esparsos e avulsos indicam manual. **Essa consulta não pôde ser executada** (§4).

---

## 3. Configuração encontrada

| Item | Estado | Evidência |
|---|---|---|
| `render.yaml` | ❌ **NÃO EXISTE** | `find . -maxdepth 2 -iname "render.yaml"` → vazio |
| `Procfile` | ❌ **NÃO EXISTE** | idem |
| `startCommand` versionado | ❌ Só `package.json` → `start: "node src/server.js"` — **sem `migrate`** | `node -e "require('./package.json').scripts.start"` |
| Migration no boot da app | ❌ **NÃO EXISTE** | `grep -rn "run-migrations\|runMigrations\|migrate" backend/src/server.js` → **0 ocorrências** |
| `buildCommand` / `preDeployCommand` | ❓ **NÃO INSPECIONÁVEL** — vivem apenas no painel | — |
| Acionamento do Render | Deploy hook via `curl` (URL secreta) | `deploy.yml:62-70` |
| Render CLI local | ❌ Ausente | `command -v render` → vazio |
| Tier do Render | Free tier (declarado) | `ADR-002-render.md`: *"DECIDIDO e em produção (free tier)"* · corroborado por cold start observado (§4) |

**Leitura:** **nenhuma parte da configuração que responderia à pergunta está versionada.** O repositório é, por construção, incapaz de responder — o que torna a afirmação do workflow não-falsificável a partir do código, e por isso mesmo perigosa.

---

## 4. Evidências

### 4.1 Produção — observada diretamente (não inferida)

`GET https://multgestor-backend.onrender.com/api/health` → **HTTP 200** em **33,07s** (cold start).
`GET /api/health/deep` → **HTTP 200**, resposta observada em 2026-07-16T19:48:25Z:

| Check | Resultado observado |
|---|---|
| `database` | ✅ `ok` — latência **173ms** |
| `redis` | 🔴 **`degraded` — "Redis nao configurado — fallback in-memory ativo"** |
| `outbox` | ✅ `ok` — **0** mensagens pendentes |
| `email_provider` | ✅ `ok` — `resend` |
| `whatsapp_provider` | 🟡 `degraded` — `provider: "mock"`, **`is_mock: true`** |
| `uptime_seconds` | **32** — o serviço havia acabado de cold-startar (acordado pela primeira sonda) |
| `version` | `1.0.0` |

> **Nenhum secret foi lido ou reproduzido.** O endpoint expõe apenas *booleans* de configuração; nenhum valor foi transcrito.

**O que isso prova:** produção está no ar, o banco responde e o outbox está limpo.
**O que isso NÃO prova:** nada sobre migrations. **O health check não expõe `schema_migrations`** — verificado em `server.js:235-315`.

### 4.2 A origem da afirmação — commit `3b417a9` (2026-07-12)

A frase do workflow foi introduzida por `3b417a9` *"fix(ci): restaurar continue-on-error nas migrations do deploy"*. O corpo do commit afirma:

> *"O Render continua aplicando migrations em runtime pela própria DATABASE_URL do dashboard."*

**Nenhuma evidência é citada** — nem log, nem print de painel, nem consulta a `schema_migrations`. É uma asserção. O commit é `Co-Authored-By: Claude Opus 4.8` — ou seja, **a premissa que hoje sustenta o `continue-on-error` foi afirmada por um agente, sem verificação, e incorporada como fato**.

**O mesmo commit documenta o precedente exato deste erro:**

> *"O 'success' observado nos deploys anteriores era **mascarado pelo próprio continue-on-error** (que marca a conclusão do step como success)."*

**Este é o achado central desta missão.** O commit reconhece ter sido enganado por um sinal de sucesso falso — e, no mesmo texto, introduz uma **nova suposição não verificada da mesma natureza** para justificar restaurar exatamente o mecanismo que produziu o engano anterior.

### 4.3 Contradição documental — `INCONSISTENTE`

| Fonte | Data | Afirma |
|---|---|---|
| `2026-07-10-auditoria-readonly-mapa-mestre.md:80` | **2026-07-10** | *"migrations em CI com `continue-on-error` (**drift acumula se não aplicadas via MCP** — risco conhecido)"* |
| `status-atual.md:77` (`open_risks`) | 2026-07-10 | *"Migrations automáticas no CI desativadas (continue-on-error) — **drift volta a acumular se novas migrations não forem aplicadas manualmente via MCP**"* |
| `status-atual.md:34` | 2026-06-14 | *"Aplicado direto em produção via MCP Supabase (**NÃO via CI**)"* — migrations `022` e `023` |
| **`deploy.yml:43` + `3b417a9`** | **2026-07-12** | *"**O Render aplica migrations em runtime** pela propria DATABASE_URL do dashboard"* |

As três primeiras dizem que **não há** aplicação automática (por isso o drift, por isso o MCP manual). A quarta — **dois dias depois, sem evidência** — diz que **há**. Ambas não podem ser verdadeiras.

**Sinal adicional:** se o Render aplicasse migrations automaticamente, os drifts `022` (`outbox_message_handlers`) e `023` (`reminder_sent_at`) **nunca teriam existido** — eles seriam aplicados no primeiro deploy seguinte. Eles existiram e exigiram aplicação manual via MCP. **Isto é indício forte de `MANUAL_CONTROLADO`, mas permanece indício:** a regra 2 desta missão exige evidência de painel ou log para afirmar o mecanismo, e ela não existe.

### 4.4 Acessos indisponíveis — `NÃO_VERIFICADO`

| Acesso | Resultado | Detalhe |
|---|---|---|
| **Painel do Render** | ❌ `NÃO_VERIFICADO` | `list_connected_browsers` → `[]`. Nenhuma sessão autenticada. **Login não foi tentado** — inserir credenciais é vedado ao agente. |
| **Logs de deploy do Render** | ❌ `NÃO_VERIFICADO` | Mesma causa. |
| **Banco de produção (`schema_migrations`)** | ❌ `NÃO_VERIFICADO` | MCP Supabase → `Unauthorized. Please provide a valid access token…` (2ª tentativa; idêntico à 12.1A) |
| **Render CLI / API** | ❌ Indisponível | CLI ausente; nenhuma API key acessível sem manipular secret |
| **Produção via HTTP** | ✅ Verificado | Mas não expõe estado de migrations (§4.1) |

---

## 5. Classificação

| Dimensão | Classificação |
|---|---|
| **Mecanismo de aplicação de migrations em produção** | **`NÃO_COMPROVADO`** |
| **Registro documental sobre o mecanismo** | **`INCONSISTENTE`** (§4.3) |
| **Rede de segurança declarada no `deploy.yml` (`DATAOPS-002`)** | **`NÃO_COMPROVADO`** — asserção sem evidência (§4.2) |
| **Gate de migrations no deploy (`DATAOPS-001`)** | **Reclassificação RECOMENDADA: P1 → `P1` mantido, com severidade reinterpretada** (ver §6) |

### Por que não é `AUSENTE`

`AUSENTE` exigiria provar que **não existe** mecanismo. Não posso provar isso: `buildCommand`/`preDeployCommand` do painel são invisíveis para mim e **poderiam** conter `npm run migrate`. A honestidade da matriz obriga a distinguir *"não existe"* de *"não consegui ver"*.

### Por que não é `MANUAL_CONTROLADO`

O indício aponta para manual (§4.3), mas `MANUAL_CONTROLADO` afirmaria positivamente um mecanismo — e a regra 2 exige painel ou log. Além disso, **"controlado" seria factualmente generoso**: não há processo, checklist ou gate que garanta a aplicação manual. Os drifts `022`/`023` foram descobertos **depois**, não prevenidos.

---

## 6. Riscos

### R-1 · A premissa que sustenta o `continue-on-error` é uma asserção não verificada · **P1**

`DATAOPS-001` é aceito hoje porque `DATAOPS-002` supostamente o cobre. **`DATAOPS-002` não tem evidência alguma.** Se a rede não existir:
- toda migration nova só chega a produção **se um humano lembrar** de aplicá-la via MCP;
- o pipeline permanece **verde** enquanto isso;
- o drift é descoberto **por sintoma** (job quebrando em produção), não por gate. Foi exatamente assim com `022` e `023`.

### R-2 · O `needs: run-migrations` é uma proteção decorativa · **P1**

`deploy-backend` depende de `run-migrations`, mas `continue-on-error` garante que esse job **sempre** passe. A dependência **transmite uma sensação de gate que não existe**. É a mesma classe de engano que o commit `3b417a9` documenta ter sofrido ("success mascarado").

### R-3 · Não-falsificabilidade estrutural · **P2**

Com `render.yaml` ausente, a configuração que determina o comportamento de produção **não é versionada, não é revisável em PR e não é auditável por código**. Qualquer afirmação sobre ela é fé. Isto não é um detalhe de infra — é uma lacuna de governança: **a parte mais crítica do pipeline está fora do controle de versão**.

### R-4 · Redis não está configurado em produção · **P2** · ⚠️ achado incidental fora do alvo

`GET /api/health/deep` → `redis: {"status":"degraded","message":"Redis nao configurado — fallback in-memory ativo"}`.

Isto **contradiz `capacidades.md`**, que declara *"Cache ✅ Produção — Redis + fallback in-memory"*, e o `painel-executivo.md`. Consequências reais:
- **Rate limiting (`API-002`) opera em memória, por instância** — o limite não é compartilhado e some a cada cold start;
- o cache do `createModuleGuard` (TTL 5min) também é por instância e volátil;
- corrobora o `ADR-002-render` ("Redis ausente" como risco aberto) — ou seja, **a doc de capacidades está mais otimista que o próprio ADR**.

**Não faz parte de `DATAOPS-002`.** Registrado aqui porque foi observado em produção e nenhuma missão o encomendou. Não corrigido.

### R-5 · WhatsApp em mock em produção · **P3** · achado incidental

`whatsapp_provider: {"provider":"mock","is_mock":true}`. **Coerente** com o Mapa Mestre (Fase 7 = "PARCIAL / MOCK em prod"). Registrado como confirmação em produção de algo até aqui apenas documentado.

---

## 7. Proposta de próxima missão

> ⚠️ **NÃO INICIADA.** Regra 5 respeitada. Requer autorização humana explícita.

### `ops/migrations-02-evidencia-painel` — **exige um humano, não um agente**

**Problema:** `DATAOPS-002` continua `NÃO_COMPROVADO` porque **todos** os acessos que responderiam à pergunta são inacessíveis ao agente (§4.4). Nenhuma engenhosidade adicional de leitura de repositório resolve isto — **o repositório é estruturalmente incapaz de responder** (§3).

**Escopo (3 passos, ~10 minutos de humano):**
1. **Painel do Render** → serviço `multgestor-backend` → **Settings**: transcrever `Build Command`, `Pre-Deploy Command` e `Start Command`. Verificar se algum contém `migrate`.
   - ⚠️ Free tier **não oferece Pre-Deploy Command** (recurso de planos pagos). Se o tier for free (ADR-002), a única via possível é o **Build Command**.
2. **Logs do último deploy** → procurar a saída característica do runner: `[migrate] banco alvo:` / `[ok]` / `[skip]` / `[migrate] todas as migrations aplicadas com sucesso.`
3. **Banco (read-only)** — a consulta decisiva:
   ```sql
   SELECT version, name, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 10;
   ```
   - Se `20260708_031` (`ai_suggestions`) **não** constar → o Render **não** aplica; drift confirmado e ativo.
   - Se `applied_at` agrupar-se em janelas de deploy → automático. Se for esparso/avulso → manual.

**Resultado esperado:** `DATAOPS-002` sai de `NÃO_COMPROVADO` para `AUTOMÁTICO_COMPROVADO` **ou** `AUSENTE` — com evidência em ambos os casos. `DATAOPS-001` reclassificada em função disso.

**Autorizações necessárias:** ✋ acesso humano ao painel/logs do Render · ✋ `SUPABASE_ACCESS_TOKEN` válido para o MCP **ou** execução humana da consulta acima.
**⛔ Nenhuma escrita solicitada.** Continua proibido alterar o `continue-on-error` (débito `DATAOPS-003`, rotação de segredos pausada por decisão humana).

### Recomendação de reclassificação (⚠️ NÃO aplicada — requer autorização)

| Capacidade | Hoje | Recomendado | Motivo |
|---|---|---|---|
| `DATAOPS-002` | `NÃO EXISTE` / `DOCUMENTADO` | **manter `DOCUMENTADO`**, com nota: *asserção de agente sem evidência, contradita por 3 fontes* | §4.2, §4.3 |
| `DATAOPS-001` | P1 | **manter P1** e registrar que **sua justificativa está comprometida** | R-1, R-2 |

> Não editei a matriz: esta missão permite *"criar relatório documental"*, não corrigir a matriz. Rule 9 da 12.1A: divergência registrada, correção interrompida.

---

## 8. Confirmação de ausência de alterações

| Verificação | Resultado |
|---|---|
| **HEAD** | `4c8ce8470634a6d3fc1b91f8341ed912f845c0e9` — **inalterado** |
| **Ahead / Behind** | 0 / 0 — inalterado |
| **Código, testes, migrations, workflows** | **nada tocado** — `git status --porcelain -- backend/ frontend/ .github/` → vazio |
| **Banco de produção** | **não alterado** — nenhuma conexão de escrita; MCP sequer autorizou leitura |
| **Render** | **não alterado** — nenhum deploy disparado, nenhum serviço reiniciado, nenhuma variável tocada |
| **Secrets** | **nenhum lido, nenhum exibido.** Login não tentado. `backend/check-rls*.js` permanecem fechados |
| **Commit / push / PR** | **nenhum** |
| **Correções** | **nenhuma executada** |
| **Único arquivo criado** | este relatório |

**Requisições HTTP emitidas (todas GET, públicas, não mutantes):** `/api/health` (1×), `/api/health/deep` (2×). Efeito colateral: o cold start do free tier foi acordado — o serviço subiu sozinho, comportamento normal de qualquer visitante.
