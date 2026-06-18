# 🛟 RUNBOOK — Backup & Restore (DR) do Supabase — MultGestor v2

> **Status:** Fase 1 dump-only CONCLUÍDA (2026-06-18) · Fase 2 restore PLAN_ONLY / human-gated.
> **Deliverable do objetivo #3** da missão [`backup-restore-check`](../../queue/next-task.md).
> Restore real exige **nova aprovação humana** (standing alert). Claude/MCP = **só leitura**.

## 0. Regras invioláveis
- ❌ Agente/MCP **NUNCA** roda `pg_dump` / `pg_restore` / `supabase db dump` / restore / migration / deploy.
- ❌ **Nunca** registrar connection string, host, senha, token ou URL privada. Usar placeholders
  `<SUPABASE_DB_URL>` e `$env:SUPABASE_DB_URL`. A string vive **só na sessão do humano** — nunca commitada,
  nunca ecoada em log (ver [[security-secrets-rotation]] + `docs/private/`).
- ✅ MCP/Claude = **só leitura** (contagens, roles, extensões, schemas, verificação pós-restore).

## 1. Baseline read-only (capturado via MCP — 2026-06-17)

| Fato | Valor |
|---|---|
| Engine | PostgreSQL **17.6** |
| Região | sa-east-1 |
| Plano | **Free** |
| Tamanho total do banco | **16 MB** |
| Backup automático / PITR | ❌ não existe |
| Dev branches | ❌ nenhuma (`list_branches` = `[]`) |
| **RPO atual** | ♾️ infinito (nenhum backup desde 2026-04-20) |
| **RTO estimado** | baixo — 16 MB: dump < 1 min; restore em poucos min (gargalo = provisionar o projeto) |

**Schemas (tabelas / tamanho):** `public` 55 / 4176 kB · `auth` 23 / 968 kB · `storage` 8 / 312 kB ·
`realtime` 3 / 56 kB · `supabase_migrations` 1 / 48 kB · `vault` 1 / 48 kB · `extensions` 1 / 16 kB ·
(`graphql` / `graphql_public` sem tabelas).

**Contagens exatas (âncora de verificação pós-restore):**

| Tabela | Linhas |
|---|---|
| `public.companies` (tenants) | 8 |
| `public.users` (contas — auth próprio) | 25 |
| **`auth.users` (Supabase Auth)** | **0** |
| `public.barber_services` | 19 |
| `public.barber_collaborators` | 12 |
| `public.barber_working_hours` | 7 |
| `public.barber_appointments` | 1 |
| `storage.objects` (metadados) | 4 |

> ⚠️ Os estimates de `pg_stat_user_tables` estavam **desatualizados** (mostravam `users=1`); os números acima
> são `COUNT(*)` exatos. **Recapturar no momento do dump** — esses valores mudam.

**Roles (padrão Supabase):** `anon`, `authenticated` (NOLOGIN), `authenticator`, `service_role` (BYPASSRLS),
`postgres` (BYPASSRLS+LOGIN) + família `supabase_*` admin.
**Extensões:** `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`, `wrappers`, `plpgsql`.

## 2. Decisões de arquitetura (correções ao plano do Big Pickle)

1. **DR primário = `pg_dump -Fc` do banco INTEIRO** (custom format, comprimido). É a fonte de recuperação
   completa de desastre.
2. **`supabase db dump` (public-only) NÃO é suficiente** para desastre completo — serve como artefato de
   migração (schema/data/roles separados), não como backup de DR.
3. **`auth.users` e schemas gerenciados (`auth`/`storage`/`vault`) exigem cuidado especial:**
   - Hoje o app usa **auth próprio em `public.users` (25 contas)** e `auth.users` está **vazio** → as contas
     reais vivem no schema `public` (capturado pelo dump). ✅ Risco menor **para o estado atual**.
   - `pg_dump` do banco inteiro inclui `auth`/`storage`/`vault`, mas **restaurar esses schemas gerenciados num
     projeto Supabase novo pode conflitar** com os que ele já provisiona → restaurar **data-only seletivo**
     (`public.*`; e, se um dia adotar Supabase Auth, `auth.users` data-only), **não** recriar schema gerenciado.
   - 🔴 **Arquivos do Storage NÃO estão no `pg_dump`.** `storage.objects` (4 linhas) é só **metadado**; os
     binários vivem no serviço de Storage → **backup separado** via Storage API/dashboard (trivial p/ 4 arquivos).
4. **Restore local BLOQUEADO** — sem Docker/Podman funcional no Windows (mesmo motivo do
   `release-safety-gate-v2`, backlog #0c-v2). `supabase db start --from-backup` **não roda local**.
5. **Teste real de restore = projeto Supabase Free descartável** (nuvem). Já existe um **2º projeto INACTIVE**
   na mesma org que pode servir, ou criar um Free novo. (Objetivo #2 da missão.)
6. **Execução é humana/manual no Windows.** `pg_dump`/`pg_restore` precisam de binário local + connection
   string direta — **fora do alcance do MCP/executor**.
7. **Claude/MCP só auxilia verificação read-only** (Passo 4).

## 3. Procedimento (HUMANO · Windows/PowerShell) — só após aprovação

### Pré-requisitos (humano)
- `pg_dump.exe` / `pg_restore.exe` (PostgreSQL 17 client **ou** bundle da Supabase CLI). Client ≥ engine (17).
- Connection string direta (Settings → Database). Definir só na sessão:
  ```powershell
  $env:SUPABASE_DB_URL = '<SUPABASE_DB_URL>'   # precisa conter ?sslmode=require ; NUNCA commitar/ecoar
  ```

### Passo 1 — Backup DR primário (full, custom format)
```powershell
pg_dump.exe $env:SUPABASE_DB_URL -Fc -b -v -f ("backup_multgestor_{0}.dump" -f (Get-Date -Format yyyyMMdd))
```
`-Fc` custom (comprimido) · `-b` large objects · `-v` verbose. Guardar o `.dump` **fora do repo**
(`docs/private/` gitignored ou off-site).

### Passo 2 — Backups auxiliares (migração; opcional) + Storage
```powershell
supabase link --project-ref <PROJECT_REF>
supabase db dump -f backup_schema.sql             # schema public
supabase db dump --data-only -f backup_data.sql   # dados public
supabase db dump --role-only  -f backup_roles.sql
```
+ **Storage:** baixar os 4 objetos do(s) bucket(s) via dashboard/Storage API (não vão no `pg_dump`).

### Passo 3 — Restore de teste (projeto descartável)
```powershell
$env:TARGET_DB_URL = '<SUPABASE_DB_URL>'   # do projeto DESCARTÁVEL ; ?sslmode=require
pg_restore.exe --no-owner --no-privileges --data-only --schema=public -d $env:TARGET_DB_URL -v backup_multgestor_YYYYMMDD.dump
```
- Destino **Supabase**: `anon`/`authenticated`/`service_role` **já existem** → `--no-owner --no-privileges` basta.
- Destino **Postgres puro**: **pré-criar** antes:
  ```sql
  CREATE ROLE anon NOINHERIT; CREATE ROLE authenticated NOINHERIT; CREATE ROLE service_role NOINHERIT BYPASSRLS;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
  ```

### Passo 4 — Verificação (Claude via MCP, read-only)
Comparar `COUNT(*)` source × destino nas âncoras do Baseline (companies 8, users 25, barber_services 19,
barber_collaborators 12, working_hours 7, appointments 1, storage.objects 4). Sem escrita.

### Passo 5 — Documentar e agendar
- Registrar RPO/RTO reais medidos.
- Cadência recorrente (ex.: `pg_dump` diário via Windows Task Scheduler) → RPO de ♾️ para ~24 h.
- **Só então desbloquear** E2E, Fase C e data-fix (gate da missão).

## 4. Checklist de segurança
- [ ] String de conexão só em `$env:` da sessão; nunca commitada, nunca em log.
- [ ] `.dump` + SQLs em `docs/private/` (gitignored) ou off-site — nunca no repo.
- [ ] `sslmode=require` em toda string · `--no-owner --no-privileges` no restore.
- [ ] Teste sempre em projeto descartável — **nunca** restore direto em produção.
- [ ] Arquivos do Storage backupeados à parte.

## 5. Veredito
Missão **continua PLAN_ONLY / human-gated para Fase 2 (restore)**. Fase 1 dump-only concluída.
Núcleo (`pg_restore`) não roda via executor/MCP. Próximo passo real = humano executa Passos 3–4 sob
aprovação; Claude faz o Passo 4 (verificação read-only).

## 6. Fase 1 — execução manual (2026-06-18)

| Item | Valor |
|---|---|
| Modo | dump-only (`run-backup.ps1 --dump-only`, sem restore) |
| Data/hora UTC | 2026-06-18T07:39:26.586Z |
| Dump | `principal-2026-06-18T07-39-26-586Z.dump` · 650 645 bytes |
| Legibilidade | ✅ header PGDMP válido |
| Baseline capturado | `public_tables=55` · `policies=45` · `rls_on/off=37/18` |
| Restore | ❌ não executado (fora do escopo Fase 1) |
| Target DB | não definido (`BRCHK_TARGET_DB_URL` ausente) |
| `last-status.json` | `status=OK, exit_code=0` |
| Task diária | registrada (`MultGestor-Backup-Daily`, 02:00, dump-only) |
| RPO | ♾️ → **~24 h** |

> Arquivos locais (NÃO versionados): `.mg-backup\brchk.env` · `backups\daily\*.dump` · `backups\logs\*.json`

## 7. Fase 2 — restore evidenciado via MCP read-only (2026-06-18)

| Item | Valor |
|---|---|
| Projeto descartável | `multgestor-restore-test` (us-east-2, criado 2026-06-17) |
| Método de validação | MCP read-only `list_tables` + counts — sem novo restore executado |
| Lacuna | log/comando original do restore não disponível; evento ocorreu em 2026-06-17 |
| Decisão humana | evidência posterior aceita como suficiente (2026-06-18) |

**Counts verificados via MCP (batem com baseline):**

| Tabela | Baseline | Encontrado |
|---|---|---|
| `public.companies` | 8 | ✅ 8 |
| `public.users` | 25 | ✅ 25 |
| `public.barber_services` | 19 | ✅ 19 |
| `public.barber_collaborators` | 12 | ✅ 12 |
| `public.barber_working_hours` | 7 | ✅ 7 |
| `public.barber_appointments` | 1 | ✅ 1 |

**Gate encerrado.** Missões `fase-c-integracao-e-testes`, `e2e-public-booking-validation` e
`ops/reconcile-failed-sale-created-outbox` desbloqueadas por decisão humana em 2026-06-18.

> Replay limpo (truncar + pg_restore do dump de Fase 1) permanece disponível se auditoria futura exigir.

## 8. Troubleshooting — Windows PowerShell (aprendizado 2026-06-18)

Durante a primeira execução manual da Fase 1 dump-only, o operador encontrou erros
de sintaxe no PowerShell causados por colagem acidental de prompts e saídas do terminal.

**Problema:** trechos como `PS C:\Users\Joefe>`, `PS C:\MultGestor.v2>`, `>>` (continuação),
`BRCHK_SOURCE_DB_URL=***OCULTO***` foram colados como comandos, gerando:

- `ParserError` (string não terminada, `>>` preso)
- `CommandNotFoundException` (`PS C:\ ...` não é um comando)
- caminho inválido por caractere `>` no final

> ⚠️ Isso **não afetou o backup final** — o dump foi gerado com sucesso. O problema foi
> exclusivamente de operabilidade/runbook.

**Orientações para evitar:**

| Prática | ✅ Correto | ❌ Incorreto |
|---|---|---|
| Copiar comandos | Copiar **só o comando** (ex.: `cd "C:\MultGestor.v2"`) | Copiar prompt inteiro (`PS C:\...> cd ...`) |
| Continuação `>>` | Fechar string/parênteses na mesma linha ou escapar | Colar `>>` como parte do comando |
| Saída mascarada | Ignorar linhas `BRCHK_...=***OCULTO***` — não são comandos | Colar a saída como entrada |
| Prompt preso em `>>` | Pressionar `Ctrl+C` para cancelar e começar de novo | Digitar `exit` ou acumular comandos |
| Múltiplos comandos | Colar **um comando por vez** e aguardar execução | Colar vários comandos de uma vez |
| Caminho com `>` | Usar `cd "C:\MultGestor.v2"` (aspas, sem `>` no final) | `cd C:\MultGestor.v2>` (inválido) |
| Sessão limpa | Abrir PowerShell **novo** se o histórico estiver confuso | Continuar na mesma sessão cheia de erros |

> **Aprendizado registrado:** o runbook agora documenta que a colagem de prompts e saídas
> do terminal é a principal fonte de erro operacional. Futuras execuções devem usar um
> "modo limpo": janela PowerShell dedicada, comando por vez, sem copiar prompts.
