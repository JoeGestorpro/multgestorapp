# OPS-MIGRATIONS-03 — Processo seguro de aplicação de migrations

> **Tipo:** PLANO · **Status:** ⛔ **AGUARDANDO AUTORIZAÇÃO PARA IMPLEMENTAR** · **Criado:** 2026-07-16
> **Objetivo:** garantir que **toda migration futura rode ANTES do backend novo entrar no ar** — e que, se falhar, o backend novo **não entre**.
> **Capacidades:** `DATAOPS-001` (alvo) · `DATAOPS-002` (fato fundante) · `DATAOPS-003` (pode ser dissolvido) · `QUALITY-001`
> **Fonte canônica:** [[../../projetos/multgestor/matriz-consolidacao-core]] (Revisão 2) · [[../../auditorias/multgestor/2026-07-16-ops-migrations-01]]
> **Baseline:** `4c8ce8470634a6d3fc1b91f8341ed912f845c0e9`

---

## 1. O problema, em uma frase

**Nada garante que uma migration chegue à produção antes do código que depende dela.** O banco está alinhado hoje (`031`) por **disciplina humana**, não por processo.

### As 5 camadas — todas ausentes (confirmado 2026-07-16)

| Camada que deveria garantir | Estado real |
|---|---|
| CI aplicar em prod | ❌ Não alcança o banco — **ENETUNREACH/IPv6** (`883e516`) |
| CI bloquear deploy se falhar | ❌ **`continue-on-error: true`** (`deploy.yml:48`); `needs: run-migrations` **decorativo** |
| Render aplicar no deploy | ❌ **Não roda migration** — `DATAOPS-002` = `AUSENTE`, **confirmado por humano** |
| App aplicar no boot | ❌ `server.js` → **0** ocorrências de `migrate`; `start` = `node src/server.js` |
| Alguém **detectar** o drift | ❌ Nenhum gate, alerta ou checklist |

### O cenário de falha que isto permite hoje

> Merge de uma migration `032` + o código que a usa → CI valida contra Postgres efêmero (**passa** ✅) → job de migrations contra prod falha por ENETUNREACH mas é marcado **`success`** ✅ → Render sobe o backend novo **contra o schema antigo** → **deploy verde, aplicação quebrada**.

É exatamente o modo de falha dos drifts `022` e `023` — descobertos **por sintoma**, não por gate.

> ⚠️ **Isto não é conserto — é criação.** A rede de segurança nunca existiu. Não há regressão a reverter; há um processo a construir.

---

## 2. Restrições reais (não negociáveis pelo desenho)

| # | Restrição | Evidência | Consequência de projeto |
|---|---|---|---|
| **C-1** | O runner do **GitHub Actions não alcança** `db.<ref>.supabase.co` (só IPv6) | `deploy.yml:41-46`; falha 100% em `883e516` | **O GitHub Actions é o lugar errado** para aplicar em prod |
| **C-2** | O **Render alcança o banco** normalmente | `health/deep` → `database: ok` (173ms) em prod | **O Render é o lugar certo** — já tem conectividade e `DATABASE_URL` |
| **C-3** | **Free tier não tem Pre-Deploy Command** (recurso pago) | `ADR-002-render` (free tier); cold start de 33s observado | No free tier, a única via é o **Build Command** |
| **C-4** | **Rotação de segredos PAUSADA** por decisão humana | `status-atual.md:63` | ⛔ **Não mexer no `continue-on-error`** sem tratar o risco de secret em log — **este plano resolve isso removendo o job, não editando-o** |
| **C-5** | O runner de migrations **não tem trava de concorrência** | `grep advisory\|LOCK scripts/run-migrations.js` → **vazio** | Dois deploys simultâneos podem rodar `migrate` **em paralelo** |
| **C-6** | O runner **é idempotente** | `applied.has(version)` → `[skip]`; `schema_migrations` PK por `version` | Reexecução é segura; **rerun não é o risco** |
| **C-7** | O log do runner **não vaza credencial** | `getDatabaseTargetSummary` → `label` = `host:port/database` (**sem user/senha**) | Ponto de partida seguro; falta garantir que **nada mais** imprima a URL |

---

## 3. Onde a migration vai rodar — **decisão central**

### Opções avaliadas

| Opção | Bloqueia deploy? | Viável no free tier? | Veredito |
|---|---|---|---|
| **A. GitHub Actions (hoje)** | Só se remover `continue-on-error` | ❌ **Não alcança o banco (C-1)** | ❌ **Descartada.** Remover o `continue-on-error` **quebraria 100% dos deploys**, não os protegeria. Foi exatamente isso que a PR #26 causou (`883e516`) |
| **B. Render — Pre-Deploy Command** | ✅ Sim, nativamente | ❌ **Exige tier pago (C-3)** | 🟡 **Ideal, mas custa.** É o mecanismo desenhado para isto: roda antes de trocar o tráfego; falhou ⇒ deploy abortado |
| **C. Render — Build Command** | ✅ Sim — build falhou ⇒ deploy não acontece | ✅ **Sim** | ✅ **RECOMENDADA para o free tier.** Único caminho que bloqueia de fato sem custo |
| **D. Migration no boot da app** | ❌ **Não** — o processo já está no ar | ✅ Sim | ❌ **Descartada.** Roda a cada cold start (o free tier hiberna); se falhar, o backend **já subiu** |
| **E. Manter manual + gate de detecção** | ❌ Não previne | ✅ Sim | 🟡 **Complemento**, não solução |

### Recomendação

> **Opção C (Build Command) como mecanismo primário**, com migração para **B (Pre-Deploy)** se/quando o tier for pago.
> **+ Opção E como rede secundária** — detecção independente, porque um único mecanismo sem verificação é como o `continue-on-error`: parece proteger.

**E, crucialmente: DELETAR o job `run-migrations` do `deploy.yml`.**

Ele não aplica nada (C-1), mascara falha (`continue-on-error`) e cria uma dependência decorativa (`needs:`) que **transmite falsa segurança**. Mantê-lo "para o dia em que o IPv6 for resolvido" é manter a armadilha ativa. **Remover o job dissolve o bloqueio `DATAOPS-003`/OPS-SUPAVISOR para o deploy** — o Supavisor deixa de estar no caminho crítico.

> ⚠️ **Nota de risco sobre a Opção C:** no Render, o Build Command roda no ambiente de build. É preciso **confirmar no painel** que (a) `DATABASE_URL` está disponível em build e (b) o build alcança o banco. **Se qualquer uma falhar, a Opção C cai** e a decisão vira: pagar o tier (B) ou assumir formalmente o processo manual com gate de detecção (E). **Este é o primeiro passo da implementação — e é um passo humano.**

---

## 4. Qual comando

```bash
npm ci --omit=dev && npm run migrate && npm run build   # (ordem ilustrativa; build só se existir)
```

- `npm run migrate` → `node scripts/run-migrations.js` — **já existe, já é idempotente (C-6)**.
- **Não** criar runner novo. **Não** trocar de ferramenta. O runner atual: enumera 32 migrations, controla por `schema_migrations`, faz `[skip]` do que já foi aplicado, mede `duration_ms`, e tem verificação de integridade pós-migration (exige `pin_reset_tokens`).
- **Alteração mínima necessária:** adicionar **advisory lock** (§6) e **pré/pós-validação** (§7).

---

## 5. Como uma falha vai bloquear o deploy

| Mecanismo | Como bloqueia |
|---|---|
| **Build Command** (Opção C) | `npm run migrate` sai com **exit 1** (o runner já faz: `catch → process.exit(1)`) ⇒ **o build falha** ⇒ o Render **não promove** a nova versão ⇒ a versão antiga segue no ar |
| **Pre-Deploy** (Opção B, se pago) | Falha ⇒ deploy abortado antes da troca de tráfego |
| **Wrapper de timeout** | Manter `timeout 3m` (`124`/`137` ⇒ falha **visível**) — débito `fix/ci-migrate-hang`, **causa-raiz ainda DESCONHECIDA** |

**Propriedade essencial:** a versão antiga do backend continua no ar contra o schema antigo — **estado consistente**. O deploy falha **ruidosamente**, que é o oposto exato do comportamento atual (falha silenciosa + deploy verde).

**Regra permanente:** ⛔ **nunca** `continue-on-error` em passo de migration. **Nunca** `|| true`. **Nunca** dependência (`needs:`) que só verifica conclusão, e não resultado.

---

## 6. Como evitar duas migrations ao mesmo tempo

**Hoje não há proteção (C-5).** Dois deploys em sequência rápida podem executar `migrate` em paralelo: ambos leem `schema_migrations`, ambos veem a `032` como pendente, ambos executam o DDL. O `ON CONFLICT DO NOTHING` protege a **tabela de controle**, mas **não** o DDL — `CREATE TABLE` duplicado, `CREATE POLICY` duplicado etc.

**Solução: advisory lock do Postgres.**

```sql
SELECT pg_try_advisory_lock(<chave-fixa>);   -- no início; se false → abortar com mensagem clara
-- ... aplica migrations ...
SELECT pg_advisory_unlock(<chave-fixa>);     -- no fim (e no catch)
```

Por que `pg_try_advisory_lock` e **não** `pg_advisory_lock`: o `try` **falha rápido** com mensagem explícita ("outra migration em andamento") em vez de **pendurar** o build até o timeout. Dado o débito de hang com causa-raiz desconhecida, **não queremos introduzir uma nova forma de travar**.

O lock é por **sessão** e liberado automaticamente se a conexão cair — não deixa lock órfão.

---

## 7. Como validar antes e depois

**Antes (pré-flight, aborta se falhar):**
1. `DATABASE_URL` presente e parseável (`getDatabaseTargetSummary().configured`).
2. Log do alvo — **`label` apenas** (`host:port/database`), **nunca** a URL (C-7).
3. Advisory lock obtido (§6).
4. Listar pendentes: `repo − schema_migrations` → registrar **quais** vão rodar (se zero → `[skip]` de tudo, sucesso trivial).

**Depois (pós-flight, falha o build se não bater):**
1. Reconsultar `schema_migrations` — **toda** migration enumerada deve constar.
2. Verificação de integridade — **já existe** (`pin_reset_tokens`); avaliar ampliar para a tabela da última migration aplicada.
3. Registrar `applied_at`/`duration_ms` — o log do build vira a **evidência** que faltou nesta investigação inteira.
4. Liberar o lock.

**Rede secundária (Opção E) — recomendada:** expor o estado de migrations em **`/api/health/deep`** (ex.: `migrations: {applied: N, pending: [...]}`). Custo baixo, valor alto: **teria respondido a OPS-MIGRATIONS-01 em 1 requisição**, sem painel e sem banco. Transforma drift em **sintoma observável** em vez de descoberta arqueológica.

---

## 8. Como evitar vazamento de secrets

**Contexto:** a rotação de segredos está **PAUSADA por decisão humana** (C-4), precisamente por risco de `DATABASE_URL` aparecer em log de CI. **Este plano contorna o problema em vez de esbarrar nele:** ao **remover** o job do GitHub Actions, a `DATABASE_URL` de produção **deixa de transitar pelo CI**. O secret fica onde já está — no Render, que já o possui.

| Regra | Como |
|---|---|
| Nunca imprimir a URL | Só `label` = `host:port/database` (C-7 — **já conforme**) |
| Nunca `set -x` / `bash -x` no passo de migration | Expande variáveis no log |
| Erro do `pg` pode conter a connection string | **Sanitizar no `catch`**: hoje o runner imprime `err.message` — auditar se algum erro do driver embute a URL |
| Não adicionar `DATABASE_URL` de prod ao GitHub Secrets | **Não é mais necessária lá** — o job sai |
| Log de build do Render é visível a quem tem acesso ao painel | Aceitável: mesmo público que já vê as env vars |
| ⛔ Não tocar no `continue-on-error` isoladamente | O job **inteiro** sai; a linha deixa de existir |

> **Efeito colateral positivo:** remover o job **desbloqueia parcialmente `DATAOPS-003`** — a preocupação "secret em log de migration no CI" **desaparece** quando não há migration no CI.

---

## 9. Como reverter se algo der errado

> ⚠️ **Verdade desconfortável: hoje NÃO existe rollback de migration.** As 32 migrations são **forward-only** — não há scripts `down`, e o runner não os suporta. Isto **não é uma lacuna deste plano**; é um fato pré-existente que o plano **expõe**.

| Cenário | Reversão |
|---|---|
| **Migration falha no meio do build** | ✅ **Automático** — build falha, versão antiga permanece no ar. **Estado do banco:** depende de a migration ser transacional (ver abaixo) |
| **Migration aplica, mas o código novo quebra** | Rollback **do código** no Render (deploy anterior). O schema fica à frente — **tolerável se as migrations forem aditivas** |
| **Migration aplica algo destrutivo** | 🔴 **Só restore de backup.** Backup local + B2 existe (`verified=true`), RPO ~24h — **perda de até 24h** |
| **Rollback do processo (OPS-MIGRATIONS-03 em si)** | Reverter o Build Command no painel + `git revert` do commit do workflow. **Baixo risco:** volta ao estado atual (frágil, porém conhecido) |

**Atomicidade — a ser verificada na implementação:** o runner faz `pool.query(sql)` com o **arquivo inteiro**. No Postgres, um `query` multi-statement roda em **transação implícita** — um erro no meio **desfaz o arquivo todo**. Isso é **bom** (atômico por arquivo), mas: (a) migrations com `CREATE INDEX CONCURRENTLY` **não podem** rodar em transação; (b) **não há atomicidade entre arquivos** — se a `032` passa e a `033` falha, a `032` fica aplicada (mitigado pela idempotência, C-6).

**Regra de projeto proposta (vira ADR):** **migrations devem ser aditivas e compatíveis para trás** — nunca `DROP COLUMN`/`DROP TABLE` no mesmo deploy que remove o uso. Assim o rollback de código **sempre** funciona sem tocar no banco. Destrutivo vira missão própria, com backup fresco e janela.

---

## 10. Escopo da implementação (quando autorizada)

| # | Mudança | Arquivo | Risco |
|---|---|---|---|
| 1 | **Confirmar no painel** que o build tem `DATABASE_URL` **e** alcança o banco | — (**humano**) | ⚠️ **Gate 0 — se falhar, o plano muda** |
| 2 | Advisory lock (`pg_try_advisory_lock`) | `backend/scripts/run-migrations.js` | Baixo |
| 3 | Pré/pós-validação + log de pendentes | `backend/scripts/run-migrations.js` | Baixo |
| 4 | Sanitizar `err.message` no `catch` | `backend/scripts/run-migrations.js` | Baixo |
| 5 | **Remover o job `run-migrations`** e o `needs:` correspondente | `.github/workflows/deploy.yml` | Médio — **muda o pipeline** |
| 6 | **Corrigir o comentário falso** do `deploy.yml:43` | `.github/workflows/deploy.yml` | Nenhum — é a afirmação **provada falsa** |
| 7 | Build Command no Render → incluir `npm run migrate` | Painel (**humano**) | **Alto — é o passo que passa a bloquear deploy** |
| 8 | (Opcional) `migrations` em `/api/health/deep` | `backend/src/server.js` | Baixo |
| 9 | ADR "migrations aditivas e compatíveis para trás" | `.opencodex/decisoes/` | Nenhum |

**Fora de escopo:** ⛔ aplicar migration · alterar dados · resolver OPS-SUPAVISOR/IPv6 (**dissolvido**, não resolvido) · rotação de segredos · pagar tier · Redis (`GAP-05`) · `render.yaml` versionado (bom, mas é missão própria).

**Ordem obrigatória:** `1` (gate humano) → `2,3,4` (runner, sem efeito no pipeline) → **validar em branch** → `7` (Render) → `5,6` (remover o job) → `8,9`.

> **Por que `7` antes de `5`:** primeiro o novo mecanismo passa a existir e a bloquear; **só então** o antigo (que não protege nada) é removido. Inverter deixaria uma janela **sem nenhum** dos dois.

---

## 11. Gates e DoD

**Gates:** `PAINEL_CONFIRMA_ACESSO_AO_BANCO_NO_BUILD` (humano; se falhar, replanejar) · `LOCK_TESTADO` (2 execuções simultâneas → a 2ª aborta com mensagem clara, **não trava**) · `FALHA_BLOQUEIA_DEPLOY` (**testado de verdade**: migration propositalmente inválida em branch ⇒ build falha ⇒ versão antiga no ar) · `NENHUM_SECRET_EM_LOG` (inspecionar o log de build) · `IDEMPOTENCIA_MANTIDA` (rerun → `[skip]`) · `AUTORIZACAO_HUMANA` para `5` e `7`.

**DoD:**
1. Migration que falha ⇒ **deploy bloqueado**, comprovado por **teste real**, não por raciocínio.
2. `schema_migrations` == migrations do repo após deploy verde.
3. Duas execuções concorrentes não corrompem nem travam.
4. Nenhum secret em log de build ou de CI.
5. Job `run-migrations` **removido**; nenhum `continue-on-error` em migration.
6. Comentário falso do `deploy.yml:43` **corrigido**.
7. `DATAOPS-001` → `CONCLUÍDA`; `DATAOPS-002` → substituída pelo mecanismo real e documentada; **as 5 camadas deixam de estar todas ausentes**.

**Autorizações necessárias:** ✋ painel do Render (passos 1 e 7) · ✋ alterar workflow (passos 5 e 6) · ✋ deploy de teste para provar o bloqueio.

---

## 12. O que este plano NÃO resolve

Registrado para não virar promessa implícita:

- **Rollback de migration destrutiva** — continua sendo **restore de backup** (RPO ~24h). Mitigado pela regra "aditivas", não eliminado.
- **OPS-SUPAVISOR / IPv6** — **dissolvido do caminho do deploy**, não corrigido. Continua afetando qualquer uso do banco a partir do GitHub Actions.
- **`fix/ci-migrate-hang`** — causa-raiz **DESCONHECIDA**. O plano contém (timeout + `try_advisory_lock` que não pendura); não explica.
- **`TENANT-003`** (cobertura de RLS em prod) — cegueira independente; a verificação humana cobriu migrations, não policies.
- **`render.yaml` não versionado** — a config seguirá vivendo no painel, **fora do controle de versão**. É a causa-raiz de toda esta investigação ter sido necessária; merece missão própria.
