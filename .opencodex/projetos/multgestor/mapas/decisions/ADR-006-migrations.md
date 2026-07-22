---
tipo: decisao
area: infra
status: implementado
progresso: 100
criticidade: alta
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-07-20
---

# ADR-006 — Arquitetura oficial de migrations

> ✅ **IMPLEMENTADA EM PRODUÇÃO em 2026-07-20T03:07:34Z** (OPS-MIGRATIONS-03D).
> `buildCommand = npm install && npm run migrate:prod` — gate bloqueante ativo no Render.
> Modo estrito comprovado (`endpoint dedicado=true`), idempotência comprovada em 2º deploy,
> zero migrations reaplicadas, produção HTTP 200 · `database: ok`.
> Rollback de um passo disponível: `buildCommand = npm install`.
> Detalhes e evidências: [[../../../../brain/plans/OPS-MIGRATIONS-03D-plano]] § ENCERRAMENTO.

> **Missão:** OPS-MIGRATIONS-03A · **Marcador alvo:** `ADR_MIGRATIONS_APROVADA`
> **Status:** ✅ **APROVADA** por decisão humana em 2026-07-16 — marcador `ADR_MIGRATIONS_APROVADA`.
> Aprovação autoriza a arquitetura como oficial; **não** autoriza implementação. Cada fase segue gated.
> **Evidência base:** MCP Render (`get_service` + `list_services`, 2026-07-16, read-only) — prevalece sobre [[../../../auditorias/multgestor/2026-07-16-ops-migrations-01]], que fechou como `NÃO_COMPROVADO` por **ausência de acesso ao painel**, não por ausência de mecanismo.

## O que é
Decisão de como as migrations do [[backend]] chegam ao banco de produção ([[ADR-001-supabase]]) durante o deploy ([[ADR-002-render]]).

## Estado atual

O mecanismo de aplicação em produção era **`AUSENTE`** — comprovado por leitura direta da API do Render.

> ⚠️ **SUPERADO em 2026-07-20.** Esta seção descreve o diagnóstico que motivou a ADR. O mecanismo **passou a existir**: `DATAOPS-002` é agora **`ATIVO_AUTOMATICO_COMPROVADO`** — `buildCommand = npm install && npm run migrate:prod`, em modo estrito, com gate bloqueante. O texto abaixo fica preservado como registro histórico do problema original.

A auditoria `OPS-MIGRATIONS-01` fechou como `NÃO_COMPROVADO` porque **não tinha acesso ao painel**. Esse acesso passou a existir (MCP Render conectado). A incógnita que ela registrou foi resolvida: não havia mecanismo escondido no painel. **Evidência posterior e direta prevalece sobre ausência de acesso anterior** — a auditoria não é contradita, é *concluída*.

### Evidência — MCP Render, `srv-d7o2dkbrjlhs73arcsl0`, 2026-07-16 (read-only)

| Campo | Valor observado |
|---|---|
| `name` / `id` | `multgestor-backend` · `srv-d7o2dkbrjlhs73arcsl0` |
| `envSpecificDetails.buildCommand` | **`npm install`** — sem `migrate` |
| `envSpecificDetails.startCommand` | **`npm start`** — sem `migrate` |
| `preDeployCommand` | **campo inexistente na resposta** — não disponível no plano `free` |
| `rootDir` / `branch` | `backend` · `main` |
| `plan` / `buildPlan` | **`free`** · `starter` |
| `region` | `oregon` |
| `autoDeploy` / `autoDeployTrigger` | **`no`** / `off` — deploy só via hook do `deploy.yml` |
| `numInstances` | 1 |
| Serviços no workspace | **1** (`list_services`) — nenhum cron job, worker ou serviço de migration |

### Cadeia de execução — fechada

```text
buildCommand: npm install
        └─ postinstall? → AUSENTE em package.json   ← única via de migrate no build
startCommand: npm start
        └─ prestart?    → AUSENTE em package.json   ← única via de migrate no start
        └─ node src/server.js
                └─ grep migrate|runMigrations → 0 ocorrências
```

Os hooks `postinstall` e `prestart` eram a **última hipótese** pela qual `npm install`/`npm start` poderiam aplicar migrations sem que isso aparecesse no comando configurado. Ambos não existem. Com um único serviço no workspace e `preDeployCommand` indisponível no free tier, **não resta caminho pelo qual uma migration possa ser aplicada automaticamente em produção.**

**Consequência:** toda migration só chega a produção se um humano lembrar de aplicá-la via MCP. O pipeline permanece verde enquanto isso. Foi exatamente assim que os drifts `022` e `023` ocorreram — descobertos por sintoma, não por gate. Isso deixa de ser hipótese e passa a ser mecanismo conhecido.

O que **está** verificado no repositório:

| Fato | Evidência |
|---|---|
| `deploy.yml:48` tem `continue-on-error: true` no job `run-migrations` | leitura direta |
| O job falha 100% contra produção — `ENETUNREACH` (IPv6) | comentário `deploy.yml:41-47`, commit `883e516` |
| `needs: run-migrations` nunca protege nada — o job sempre termina `success` | consequência do `continue-on-error` |
| `render.yaml` e `Procfile` não existem | auditoria §3 |
| `package.json start` = `node src/server.js` — sem `migrate` | auditoria §3 |
| `server.js` não chama migrations no boot | auditoria §3 |
| A premissa "o Render aplica migrations em runtime" (`deploy.yml:44`, commit `3b417a9`) é **factualmente falsa** | refutada pela evidência MCP acima |

**Conclusão:** o `continue-on-error` de `deploy.yml:48` é justificado por um comentário que afirma algo falso. A rede de segurança que ele pressupõe **não existe**. Não há hoje nenhum ponto — CI, Render ou app — em que uma migration pendente impeça o backend novo de entrar no ar.

## Decisão

**Migrations são aplicadas pelo Render, em etapa bloqueante, antes do backend novo servir tráfego. A configuração que determina isso passa a ser versionada.**

Respostas às 10 decisões obrigatórias:

| # | Decisão | Definição |
|---|---|---|
| 1 | Ambiente executor | **Render**, no ciclo de deploy. Não o GitHub Actions. |
| 2 | Momento | Antes do start do backend novo, bloqueante. Ver *Ponto de acoplamento*. |
| 3 | Falha | Deploy abortado. Backend novo não inicia. **Versão anterior permanece ativa.** |
| 4 | Concorrência | `pg_advisory_lock` no runner — **somente após sessão estável comprovada** (Emenda 01). Segunda execução aguarda ou falha limpa — nunca aplica em paralelo. |
| 5 | Confirmação | Drift check pós-deploy: última migration do repo × última de `schema_migrations`. |
| 6 | Registro | `schema_migrations` estendida com `commit`, `ambiente`, `status`, `erro_sanitizado`. |
| 7 | Aplicação parcial | Cada migration em transação explícita, **atômica com seu bookkeeping**. Ver *Lacunas*. |
| 8 | Rollback | **Forward-only.** Nunca desfazer destrutivamente; criar migration corretiva. |
| 9 | GitHub Actions | Remover o job de migration contra produção. Manter validação em Postgres efêmero no `ci.yml`. |
| 10 | Credenciais | `DATABASE_URL` de produção **apenas** no Render. Remover do GitHub Secrets — reduz superfície. |
| 11 | **Endpoint do runner** (Emenda 01) | **`MIGRATION_DATABASE_URL` dedicada**, apontando para endpoint de **sessão estável** — preferencialmente o pooler Supabase em **modo session, porta 5432**. A app **não** muda: segue em `DATABASE_URL`, pooler modo transaction, porta 6543. |
| 12 | **Sigilo** (Emenda 01) | Nenhuma URL, senha, project ref ou credencial real versionada ou emitida em log. Sondas e runner registram **apenas** booleanos, latências e códigos de erro. |

---

## Emenda 01 — endpoint do runner e trava de concorrência

> **Status:** ✅ **APROVADA** por decisão humana em 2026-07-17 — marcador `ADR_006_EMENDA_01_APROVADA`.
> **Origem:** [[../../../auditorias/multgestor/2026-07-16-ops-migrations-03b]] §5
> **Escopo:** documental. `IMPLEMENTACAO_AINDA_NAO_AUTORIZADA`.

### Por que a decisão nº 4 original era inviável

A ADR aprovada decidiu `pg_advisory_lock` no runner. A Fase 2 provou que o backend conecta ao pooler em **modo _transaction_ (porta 6543)**, onde **não existe sessão estável**: cada transação pode sair de um backend físico distinto e a conexão retorna ao pool ao fim dela.

`pg_advisory_lock()` é uma trava **de sessão**. Nesse modo ela é **silenciosamente não confiável** — pode ficar presa numa conexão devolvida ao pool, ou ser perdida sem erro. Seria uma proteção decorativa: exatamente a classe de defeito que esta ADR denuncia em `needs: run-migrations`. Aplicar **DDL** através de pooler em modo transaction é, além disso, desaconselhado pela própria Supabase.

### O que a emenda decide

| # | Decisão |
|---|---|
| 1 | **A app não muda.** Segue em `DATABASE_URL` → pooler, modo transaction, porta 6543. Nada no runtime é tocado. |
| 2 | **O runner usa `MIGRATION_DATABASE_URL`** — variável dedicada, separada da app. |
| 3 | `MIGRATION_DATABASE_URL` aponta para **endpoint de sessão estável** — preferencialmente pooler em **modo session, porta 5432** (mesmo host, mesma família IPv4 já comprovada). |
| 4 | **`pg_advisory_lock` só é permitido após a sessão estável ser comprovada.** Enquanto não comprovada, o runner **não** tem trava válida e **não** pode ser considerado pronto. |
| 5 | **Sigilo:** nenhuma URL, senha, project ref ou credencial versionada ou logada. |
| 6 | **`OPS-MIGRATIONS-03C` fica bloqueada** até a conectividade do **build container** ser comprovada. |
| 7 | O achado de TLS sem validação de certificado sai do escopo desta ADR e passa a [[../../incidentes/SEC-DATABASE-TLS-001]]. |

### O que a emenda NÃO altera

Permanecem válidas e inalteradas: gate bloqueante no Render antes do start · falha aborta o deploy e preserva a versão anterior · forward-only · exit code ≠ 0 · drift check · `buildCommand` como ponto de acoplamento no free tier · `preDeployCommand` como alvo no upgrade.

### Dependência crítica — ✅ RESOLVIDA em 2026-07-17

> Registro original: *"A porta 5432 do pooler em modo session não foi verificada — nenhuma conexão foi emitida (missão read-only). A decisão nº 3 é direcional, não comprovada. Se o modo session não estiver disponível, a alternativa é a conexão direta — IPv6-only e provavelmente inalcançável a partir do Render. Este é o risco aberto da emenda."*

**O risco não se materializou.** A sonda temporária (PR #48, revertida pela #49) executou no build container do Render e provou, com evidência direta ([[../../../auditorias/multgestor/2026-07-16-ops-migrations-03b]] §9):

| Condição | Resultado |
|---|---|
| `DATABASE_URL` disponível em tempo de build | ✅ `true` |
| Build container alcança o banco | ✅ connect 1280ms · `SELECT 1` 179ms |
| Pooler modo session (5432) alcançável do build | ✅ connect 1072ms · `SELECT 1` 178ms |
| Sessão estável — dois clientes independentes | ✅ `estavel=true etapa=COMPLETA` |

**Portanto:**
- decisão nº 3 **comprovada** — `MIGRATION_DATABASE_URL` → pooler 5432 (session) é viável;
- item 4 **satisfeito** — `pg_advisory_lock` **autorizado**;
- item 6 **destravado** — `OPS-MIGRATIONS-03C` liberada para autorização.

### Ponto de acoplamento — decisão condicionada ao tier

O Render **free tier não oferece `preDeployCommand`** — confirmado: `plan: "free"` e o campo sequer aparece em `envSpecificDetails`, que traz apenas `buildCommand` e `startCommand`. Isso restringe as opções:

| Opção | Viável no free? | Avaliação |
|---|---|---|
| **`buildCommand`** = `npm ci && npm run migrate` | ✅ Sim | Build falha → deploy falha → versão anterior permanece. **É um gate real no free tier.** Exige migrations retrocompatíveis (expand/contract), pois o código antigo ainda serve durante o build. |
| `startCommand` = `npm run migrate && node src/server.js` | ✅ Sim | ❌ **Rejeitada.** Free tier hiberna: cada cold start reexecutaria o migrate, somando latência ao já observado (33s). Pior, com múltiplas instâncias vira corrida. |
| `preDeployCommand` | ❌ Requer tier pago | ✅ **Alvo ideal.** Roda uma vez, isolado, sem tocar o build. Adotar se/quando houver upgrade de tier. |

**Decisão:** `buildCommand` enquanto free tier; migrar para `preDeployCommand` no upgrade. Registrar a migração como débito em [[ADR-002-render]].

### Versionamento da configuração

Adotar **`render.yaml` (Blueprint)** para tirar `buildCommand`/`startCommand` do painel e colocá-los sob revisão em PR. Isto ataca o risco R-3 da auditoria (não-falsificabilidade estrutural): hoje a parte mais crítica do pipeline está fora do controle de versão.

⚠️ Converter um serviço existente criado pelo painel para Blueprint é **ação humana, gated** — não é efeito colateral desta ADR.

## O que já existe

`backend/scripts/run-migrations.js` já entrega parte dos requisitos:

- tabela de controle `schema_migrations` (`version` PK, `name`, `applied_at`, `duration_ms`);
- 32 migrations em lista ordenada explícita (`20251231_000` … `20260708_031`);
- **idempotência** — `applied.has(version)` → `[skip]`;
- **exit code ≠ 0 em erro** — `catch` → `process.exit(1)`;
- verificação de integridade pós-migration (exige `pin_reset_tokens`).

## O que falta

> ⚠️ **Tabela parcialmente superada — corrigida em 2026-07-22 (achado da auditoria `OPS-MIGRATIONS-001`).** As 3 lacunas de gravidade Alta abaixo já foram resolvidas pela **OPS-MIGRATIONS-03C** (o próprio `run-migrations.js` se autodescreve no cabeçalho como implementação dessa fase). Esta seção não tinha sido revisada quando a 03C concluiu — o banner de topo do ADR foi atualizado na 03D, mas esta tabela mais antiga ficou para trás. Confirmado por leitura direta do código atual, não por inferência.

Lacunas reais do runner, verificadas por leitura direta:

| Lacuna | Onde | Gravidade | Status |
|---|---|---|---|
| ~~Sem trava de concorrência — nenhum `pg_advisory_lock`~~ | runner inteiro | Alta | ✅ **Resolvido (OPS-MIGRATIONS-03C).** `pg_try_advisory_lock` numa sessão de client único (`run-migrations.js:306-313`); segunda execução concorrente falha limpo (`LOCK_BUSY`). |
| ~~Bookkeeping não-atômico~~ — `pool.query(sql)` e o `INSERT` em `schema_migrations` eram queries separadas | `run-migrations.js:99-108` (linhas antigas) | Alta | ✅ **Resolvido (OPS-MIGRATIONS-03C).** SQL da migration + `INSERT` em `schema_migrations` rodam na mesma transação (`BEGIN`…`COMMIT`, `run-migrations.js:240-260`) — crash entre aplicar e registrar é hoje impossível. |
| ~~Arquivo ausente não falha~~ — `[warn]` e o loop continuava | `run-migrations.js:89-92` (linhas antigas) | Alta | ✅ **Resolvido (OPS-MIGRATIONS-03C).** Arquivo ausente lança `MIGRATION_FILE_MISSING` e interrompe (`run-migrations.js:215-227`) — deixou de ser warning-e-continua. |
| Sem timeout próprio — depende do `timeout` externo do workflow | runner | Média | ⚠️ **Ainda pendente.** O teto externo (`timeout`) só existe no step do `ci.yml`; o caminho de produção (`buildCommand` do Render) não tem timeout próprio do runner, apenas o limite implícito da plataforma. |
| Não registra `commit`, ambiente, executor nem status | `schema_migrations` | Média | ⚠️ **Ainda pendente.** `schema_migrations` continua só com `version/name/applied_at/duration_ms`. |
| Usa o pool da app — sem usuário de privilégio mínimo | `run-migrations.js:4` | Média | ⚠️ **Não verificável pelo agente sem revelar `MIGRATION_DATABASE_URL`** (sigilo é regra vinculante da Emenda 01) — permanece registrado como pendência até confirmação do operador. |

## Riscos

- **A decisão depende da Fase 2 — e o risco aumentou com a evidência nova.** Se o Render também não alcançar o banco (o `ENETUNREACH` do GitHub vem do IPv6-only de `db.<ref>.supabase.co`, e o pooler tem débito Supavisor/sa-east-1 aberto), o acoplamento no `buildCommand` **falha do mesmo modo** e bloquearia todo deploy. Agravante observado: o serviço roda em **`region: oregon`** enquanto o banco está em **sa-east-1** — a conectividade é cross-region e **nunca foi exercida por nenhum processo de migration**, já que nenhum jamais rodou no Render. **Nada da Fase 3 em diante deve ser implementado antes de `CONECTIVIDADE_COMPROVADA`.**
- **`autoDeploy: no`** — o deploy só ocorre pelo hook disparado em `deploy.yml`. Qualquer gate de migration precisa viver nesse caminho; não há push-to-deploy paralelo a cobrir.
- Migrations passam a exigir retrocompatibilidade explícita (expand/contract), pois rodam com o código antigo ainda no ar.
- Remover a `DATABASE_URL` do GitHub Secrets quebra qualquer outro workflow que a use — verificar antes.

## Relações
### Depende de
[[ADR-001-supabase]] · [[ADR-002-render]]
### Bloqueia
[[DATAOPS-001]] · [[DATAOPS-002]]
### Usa
—
### É usado por
[[backend]] · [[render-backend]]

## Próximas ações

1. **Aprovação humana desta ADR** → marcador `ADR_MIGRATIONS_APROVADA`.
2. ~~**OPS-MIGRATIONS-03B** (prova de conectividade Render→Supabase, cross-region).~~ ✅ **CONCLUÍDA** em 2026-07-17 — runtime e build container comprovados. Ver [[../../../auditorias/multgestor/2026-07-16-ops-migrations-03b]].
3. ~~`DATAOPS-002` → **`AUSENTE` (comprovado)**.~~ ✅ **RESOLVIDO em 2026-07-20:** `DATAOPS-002` passa a **`ATIVO_AUTOMATICO_COMPROVADO`** — mecanismo implantado e exercitado em produção (OPS-MIGRATIONS-03D). Reclassificação na matriz de capacidades permanece como tarefa separada.
4. Corrigir o comentário falso em `deploy.yml:41-47` — mas **só junto com a Fase 5**, não isoladamente: remover o `continue-on-error` hoje bloquearia todo deploy, pois a conectividade continua quebrada.

## Links
- [[../../../auditorias/multgestor/2026-07-16-ops-migrations-01]] — evidência base
- [[ADR-002-render]] · [[ADR-001-supabase]] · [[backend]] · [[render-backend]]
