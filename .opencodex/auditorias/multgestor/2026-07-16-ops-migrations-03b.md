# OPS-MIGRATIONS-03B — Prova de conectividade Render → banco de produção

> **Missão:** OPS-MIGRATIONS-03B (Fase 2 do plano DataOps) · **Modo:** READ-ONLY
> **Data:** 2026-07-17 · **Autorização:** humana, explícita, somente leitura
> **ADR vigente:** [[../../projetos/multgestor/mapas/decisions/ADR-006-migrations]] (`ADR_MIGRATIONS_APROVADA`)

---

## VEREDITO

# `CONECTIVIDADE_COMPROVADA` — runtime **e** build container

> **Atualizado em 2026-07-17** após a execução da sonda temporária no build (autorizada). A leitura original — `NÃO_COMPROVADA` para o build — está preservada em §3 como registro do que era conhecido antes da prova.

O Render **alcança** o banco de produção, tanto no runtime quanto no **build container**, que é onde a ADR-006 colocou o gate.

> ⚠️ **A Fase 2 também produziu um achado que invalidou uma decisão da ADR-006 aprovada.** Ver §5 — resolvido pela Emenda 01 e comprovado em §9.

---

## 9. Prova no build container — evidência direta

**Origem:** sonda temporária `probe-build-connectivity.js` (PR #48, revertida pela PR #49).
**Deploy:** `dep-d9d26bnaqgkc73co41e0` @ `16a9d7e` · 2026-07-17T12:42:31Z → 12:42:37Z (~5,8s).

```text
[probe] DATABASE_URL presente: true
[probe] porta de origem: 6543
[probe] connect origem(6543): ok — 1280ms
[probe] SELECT 1 origem(6543): ok — 179ms
[probe] origem reconhecida como pooler Supabase 6543 — testando 5432 (session)
[probe] connect session(5432): ok — 1072ms
[probe] SELECT 1 session(5432): ok — 178ms
[probe] advisory lock 2 clientes session(5432): estavel=true etapa=COMPLETA
```

| Pergunta em aberto | Resposta |
|---|---|
| `DATABASE_URL` existe em tempo de build? | ✅ **sim** — o Render expõe env vars ao build |
| O build container alcança o banco? | ✅ **sim** — connect 1280ms, `SELECT 1` 179ms |
| O pooler em modo session (5432) é alcançável do build? | ✅ **sim** — connect 1072ms, `SELECT 1` 178ms |
| A sessão é estável (pré-condição do `pg_advisory_lock`)? | ✅ **sim** — `estavel=true etapa=COMPLETA` |

**Ciclo da prova de sessão** (dois clientes independentes, ambos mantidos adquiridos): A travou → B recebeu `false` → A liberou → B recebeu `true`.

### Consequências

- **Emenda 01, decisão 3** (`MIGRATION_DATABASE_URL` → pooler 5432 session): era *direcional, não comprovada* — agora **comprovada**. O risco aberto que a emenda registrou (modo session indisponível, sobrando só a conexão direta IPv6-only) **não se materializou**.
- **Emenda 01, item 4** (`pg_advisory_lock` só após sessão estável comprovada): condição **satisfeita** → a trava está **autorizada**.
- **Emenda 01, item 6** (`OPS-MIGRATIONS-03C` bloqueada até a conectividade do build): **destravada**.
- Produção não foi afetada: deploy `live`, `GET /api/health/deep` → HTTP 200 em 1,55s, `database: ok`.
- O sucesso mascarado de `Run Database Migrations` no `deploy.yml` **permanece inalterado** — o gate decorativo segue como estava, e continua sendo débito da Fase 5.

---

## 1. Evidência

### 1.1 Conectividade em runtime — provada

`GET /api/health/deep` → HTTP 200 em 22,48s (cold start; `uptime_seconds: 5`).

| Check | Resultado |
|---|---|
| `database` | ✅ **`ok` — 172ms** |
| `redis` | 🔴 `degraded` — não configurado, fallback in-memory |
| `outbox` / `email_provider` | ✅ `ok` |
| `whatsapp_provider` | 🟡 `degraded` — mock |

### 1.2 O alvo real — logs do Render (`list_logs`, read-only)

```text
[database] alvo do backend  → [POOLER_HOST]:6543/postgres
[database] conectado        → [POOLER_HOST]:6543/postgres
[database] poolTenant OK — role sem BYPASSRLS  (rolname: app_runtime)
```

Padrão estável em 4 cold starts distintos (16/07 18:12, 19:47; 17/07 01:33, 02:55). Tempo do primeiro connect: **~1,26s**.

**`APP_RUNTIME_URL` está configurada em produção** — `poolTenant` sobe com `app_runtime` sem BYPASSRLS. RLS em runtime está ativa.

### 1.3 DNS e IPv4/IPv6 — a causa-raiz do `ENETUNREACH`

| Host | A (IPv4) | AAAA (IPv6) |
|---|---|---|
| `[POOLER_HOST]` | **2 registros A** (IPv4, não reproduzidos) | **nenhum** |
| `db.<ref>.supabase.co` (conexão direta) | nenhum | somente IPv6 (`deploy.yml:42`) |

**Os dois ambientes usam `DATABASE_URL` diferentes.** Isto explica toda a confusão acumulada:

```text
GitHub Actions  → DATABASE_URL = db.<ref>.supabase.co:5432  (IPv6-only)
                  runner do GitHub não tem IPv6 → ENETUNREACH → falha 100%

Render          → DATABASE_URL = [POOLER_HOST]:6543  (IPv4)
                  conecta normalmente → database ok, 172ms
```

Não é que "o Render aplique migrations". É que **o Render alcança o banco e o GitHub não** — por apontarem para endpoints distintos. O `continue-on-error` mascarou a falha do GitHub; a ausência de qualquer chamada a `migrate` no Render fez o resto.

### 1.4 SSL — encriptado, **não verificado**

```text
[database] TLS sem verificação de certificado — configure DATABASE_SSL_CA ou DATABASE_SSL_CA_PATH
```

Emitido em **todo** cold start de produção. `buildSslConfig()` (`database.js:48-64`) cai em `{ rejectUnauthorized: false }` porque nem `DATABASE_SSL_CA` nem `DATABASE_SSL_CA_PATH` estão configuradas. A conexão é cifrada, mas **o certificado do servidor não é validado** — não há proteção contra MITM no caminho até o banco. Achado da Fase 2, item 5.

---

## 2. Checklist da Fase 2

| # | Validação | Resultado |
|---|---|---|
| 1 | `DATABASE_URL` disponível no ambiente necessário | ✅ runtime · ❓ **build não verificável** — o MCP do Render **não expõe leitura de env vars** (só `update_environment_variables`, que é escrita) |
| 2 | Resolução de DNS | ✅ pooler resolve, 2 registros A |
| 3 | Suporte IPv4/IPv6 | ✅ caracterizado — pooler IPv4-only; direto IPv6-only |
| 4 | Pooler ou conexão direta | ✅ **pooler, porta 6543 — modo _transaction_** |
| 5 | SSL | ⚠️ ativo, **sem verificação de certificado** (§1.4) |
| 6 | Runner abre/fecha conexão | ❓ **não exercido** — exigiria executar `migrate` (fora do escopo read-only) |
| 7 | Tempo e erros | ✅ connect ~1,26s · query 172ms · cold start 22,5s · zero erros de conexão nos logs |

---

## 3. O que permanece não provado

**Conectividade a partir do build container.** A ADR-006 escolheu `buildCommand` como ponto do gate — mas o build roda em container separado do runtime. Provar que ele alcança o banco exigiria executar algo num build, o que significa **disparar um deploy** — vedado nesta missão.

A expectativa é favorável (mesmo egress, mesma região, e o Render expõe env vars durante o build), mas **expectativa não é prova** — e foi exatamente uma expectativa não verificada que produziu o `continue-on-error` que esta linha de missões está desfazendo.

---

## 4. Estado do deploy

| Campo | Valor |
|---|---|
| Deploy vivo | `dep-d9b4mtvlk1mc73cf0hug` · `status: live` |
| Commit em produção | `4c8ce847…` — **idêntico ao HEAD local** |
| Trigger | `deploy_hook` (todos os 5 últimos) — coerente com `autoDeploy: no` |
| Duração do deploy | ~62s (14:45:11 → 14:46:13) — compatível com `npm install` puro, sem migration |

---

## 5. ⚠️ Achado que exige emenda à ADR-006

**A decisão nº 4 da ADR-006 aprovada é tecnicamente inviável no endpoint atual.**

A ADR decidiu: *"Concorrência → `pg_advisory_lock` no runner."*

`pg_advisory_lock()` é uma trava **de sessão**. O backend conecta no pooler em **porta 6543 = modo _transaction_**, onde não existe sessão estável: cada transação pode sair de um backend físico diferente, e a conexão volta ao pool ao fim dela. Uma trava de sessão nesse modo é **silenciosamente não confiável** — pode ficar presa numa conexão devolvida ao pool ou ser perdida. Seria uma proteção decorativa, exatamente a classe de defeito que a ADR nomeia em `needs: run-migrations`.

Some-se que aplicar **DDL através de pooler em modo transaction** é desaconselhado pela própria Supabase.

**Correção proposta (não aplicada — requer nova aprovação):**

| Item | Decisão aprovada | Correção proposta |
|---|---|---|
| Endpoint das migrations | herdar `DATABASE_URL` (6543, transaction) | **`MIGRATION_DATABASE_URL` própria** → pooler **porta 5432 (modo _session_)**, IPv4, mesmo host |
| Trava | `pg_advisory_lock` | `pg_advisory_lock` **em modo session** (viável na 5432) ou `pg_advisory_xact_lock` dentro da transação |

Isto preserva a arquitetura aprovada — gate bloqueante no Render, forward-only, exit code — e corrige apenas o endpoint e a mecânica da trava. **Não editei a ADR:** ela foi aprovada por decisão humana há minutos; alterar uma decisão aprovada sem nova aprovação anularia o valor do gate.

---

## 6. Achados preservados (Fase 3)

Inalterados e ainda válidos — nada nesta missão os contradiz:

- ausência de trava de concorrência no runner;
- `pool.query(sql)` e `INSERT` em `schema_migrations` **sem atomicidade conjunta** (`run-migrations.js:99-108`);
- arquivo `.sql` ausente tratado apenas como `[warn]`, com o loop **continuando** (`run-migrations.js:89-92`);
- necessidade de exit code bloqueante (já existe: `process.exit(1)`);
- `preDeployCommand` indisponível no plano `free`.

**Novo, desta missão:** TLS sem verificação de certificado em produção (§1.4).

---

## 7. Recomendação

**Não avançar para a Fase 3 (implementação) ainda.** Duas pendências, nesta ordem:

1. **Emendar a ADR-006** com a correção do §5 → nova aprovação humana.
2. **Provar a conectividade do build container** — exige um deploy de teste, que é ação gated. Sem isso, o gate do `buildCommand` pode falhar no primeiro uso e bloquear todos os deploys.

---

## 8. Confirmação de ausência de alterações

| Verificação | Resultado |
|---|---|
| Configuração do Render | **não alterada** — apenas `get_service`, `list_services`, `list_deploys`, `list_logs` (leitura) |
| Variáveis de ambiente | **não lidas** (MCP não oferece leitura) e **não escritas** |
| Deploy | **nenhum disparado** — `trigger_deploy` não invocado |
| Migration | **nenhuma aplicada** — `migrate` não executado; nenhuma conexão de escrita ao banco |
| Banco | **nenhuma conexão emitida por esta missão** — DNS resolvido, não conectado |
| Código / workflows | **nada tocado** |
| Commit / push | **nenhum** |
| Segredos | **nenhum lido ou exibido** — hostname do pooler é infraestrutura compartilhada, não credencial |

**Requisições HTTP:** `GET /api/health/deep` (1×, pública, não-mutante). Efeito colateral: cold start do free tier acordado — comportamento de qualquer visitante.
