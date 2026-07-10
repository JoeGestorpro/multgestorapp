# Backup / Restore Check — Runbook

## O que é

`backend/scripts/backup-restore-check.js` é uma rotina Node (`npm run backup-restore-check`) que prova,
de ponta a ponta e em ambiente **descartável**, que um backup do banco do MultGestor é **restaurável** e
**fiel** no schema `public`. Ela:

1. faz `pg_dump -Fc` da **origem** (somente leitura);
2. confere que o dump é legível (`pg_restore -l`);
3. restaura num projeto Supabase **descartável/teste**;
4. valida `public` (tabelas, policies, RLS) e as contagens das tabelas críticas entre origem e destino;
5. grava um log estruturado (sem secrets) e dá veredito **APROVADO/BLOQUEADO**.

> ⚠️ **Nunca** restaura na produção. A origem é só dump/leitura; o restore exige `--target-is-disposable`
> e um destino distinto. Uso **manual** no Windows — não automatiza restore em produção.

## Regras de segurança (codificadas no script)

- Origem = **somente** `pg_dump` + validação `READ ONLY`. Nunca há restore/escrita contra a origem.
- Restore só no **target descartável**, e só com a flag `--target-is-disposable`.
- Aborta se origem == destino (host:port/db) ou se o host de destino estiver na denylist
  (`BRCHK_PROTECTED_HOSTS`). A origem é **sempre** adicionada à denylist automaticamente.
- Erros de objetos internos do Supabase (`auth`/`storage`/`realtime`/`vault`/`extensions`/event triggers)
  são tratados como **warning**, não falha fatal.
- O log **nunca** contém connection string, host, usuário, senha, service_role key ou conteúdo do dump —
  só labels (`BRCHK_SOURCE_LABEL`/`BRCHK_TARGET_LABEL`) e métricas.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `BRCHK_SOURCE_DB_URL` | **sim** | Conexão da **origem** (principal). Só leitura/dump. |
| `BRCHK_TARGET_DB_URL` | **sim** | Conexão do **destino descartável**. Recebe o restore. |
| `BRCHK_PROTECTED_HOSTS` | recomendada | Hosts proibidos como destino (CSV). A origem já entra sozinha. |
| `BRCHK_SOURCE_LABEL` / `BRCHK_TARGET_LABEL` | não | Rótulos p/ log (default `source`/`target`). |
| `BRCHK_BACKUP_DIR` | não | Pasta do `.dump` (default `~/backups`). **Fora do repo.** |
| `BRCHK_LOG_DIR` | não | Pasta do log JSON (default = `BRCHK_BACKUP_DIR`). |
| `BRCHK_CRITICAL_TABLES` | não | CSV de tabelas críticas (default: `companies,users,modules,plans,subscriptions,company_modules`). |
| `BRCHK_PG_BIN` | não | Pasta dos binários `pg_dump`/`pg_restore` se não estiverem no PATH. |
| `BRCHK_SSL_REJECT_UNAUTHORIZED` | não | `true` p/ validação estrita de cert TLS (default lax, compatível com pooler). |

> 🔒 Defina as connection strings **só na sessão** do PowerShell; nunca commite, nunca ecoe em log.

## Uso (Windows / PowerShell)

```powershell
$env:BRCHK_SOURCE_DB_URL = '<SUPABASE_DB_URL principal>'     # ?sslmode=require
$env:BRCHK_TARGET_DB_URL = '<SUPABASE_DB_URL descartável>'   # ?sslmode=require
$env:BRCHK_SOURCE_LABEL  = 'principal'
$env:BRCHK_TARGET_LABEL  = 'descartavel'
$env:BRCHK_BACKUP_DIR    = 'C:\Users\Joefe\backups'

cd backend
npm run backup-restore-check -- --target-is-disposable
```

Pré-requisitos: `pg_dump`/`pg_restore` 17+ no PATH (ou `BRCHK_PG_BIN`); um projeto Supabase Free
descartável já criado (o pooler de ambos validado).

## Critério de aprovação (regra #6)

APROVADO **somente** se: dump gerado e legível **E** restore executado **E** `public_tables`,
`public_policies`, `rls_on`, `rls_off` baterem **E** todas as tabelas críticas tiverem a mesma contagem
na origem e no destino. Caso contrário → **BLOQUEADO** com os motivos listados.

Baseline de referência (2026-06-17): `public_tables=55`, `public_policies=45`, `rls_on=37`, `rls_off=18`;
`companies=8`, `users=25`, `modules=2`, `subscriptions=4`, `company_modules=2`, `plans=0`.

## Exit codes

| Código | Significado |
|---|---|
| 0 | APROVADO — backup/restore-check válido p/ schema public |
| 1 | BLOQUEADO — alguma validação divergiu (ver motivos/log) |
| 2 | Abortado por guard de segurança ou erro de config (ex.: faltou `--target-is-disposable`) |

## Log

JSON em `BRCHK_LOG_DIR/backup-restore-check-<timestamp>.json` com: data/hora, origem/destino (labels),
arquivo (basename), status do dump, status do restore, nº de warnings de objetos gerenciados,
`public_tables`/`public_policies`/`rls_on`/`rls_off` (origem×destino), contagens críticas e veredito.

## Observação sobre cobertura

Valida o **núcleo do app** (`public` + RLS + policies + dados críticos). **Não** cobre o clone completo
dos objetos gerenciados do Supabase (`auth`/`storage`/`vault`/`realtime`/event triggers) nem os **arquivos
do bucket de Storage** (o `pg_dump` guarda só o metadado `storage.objects`) — esses exigem backup à parte.
Plano completo de DR + baseline: `.opencodex/brain/runbooks/backup-restore-plan.md`.

## Modos de execução

| Modo | Comando | Faz |
|---|---|---|
| **dump-only** (Fase 1) | `npm run backup-restore-check -- --dump-only` | Só `pg_dump` da origem (read-only). **Nunca** invoca `pg_restore`. Legibilidade verificada pelo header `PGDMP` + tamanho. Não exige `BRCHK_TARGET_DB_URL`. |
| **full restore-check** (Fase 2) | `npm run backup-restore-check -- --target-is-disposable` | Dump + restore no descartável + validação `public`/RLS/contagens. Exige `BRCHK_TARGET_DB_URL`. |

## Agendamento — Fase 1 (dump diário, Windows Task Scheduler)

Host inicial: **Windows Task Scheduler local**. Roda **só o dump diário** (dump-only). O semanal é Fase 2 (ver abaixo).

**1. Crie o env file FORA do repo** em `%USERPROFILE%\.mg-backup\brchk.env` (ACL restrita ao seu usuário):
```
BRCHK_SOURCE_DB_URL=<SUPABASE_DB_URL principal>   # ?sslmode=require — SÓ dump/leitura
BRCHK_SOURCE_LABEL=principal
BRCHK_BACKUP_DIR=C:\Users\Joefe\backups\daily
BRCHK_LOG_DIR=C:\Users\Joefe\backups\logs
BRCHK_PROTECTED_HOSTS=<host de produção>          # denylist (a origem já entra sozinha)
# NÃO definir BRCHK_TARGET_DB_URL na Fase 1 — a task diária nunca restaura.
```

**2. Registre a task** (uma vez):
```powershell
powershell -ExecutionPolicy Bypass -File .\ops\backup\register-tasks.ps1          # 02:00 default
# powershell -ExecutionPolicy Bypass -File .\ops\backup\register-tasks.ps1 -Time 03:30
```

**O que o wrapper `ops/backup/run-backup.ps1` faz a cada execução:**
- carrega o env file (aborta se **ausente**, **incompleto** ou com **permissões inseguras**);
- **remove** `BRCHK_TARGET_DB_URL` do ambiente (garante dump-only);
- roda `npm run backup-restore-check -- --dump-only` (connection string via env, **nunca** em argv);
- **retenção:** mantém **7** dumps mais recentes; apaga logs JSON com **> 30 dias**;
- grava `last-status.json` (sem secrets) em `BRCHK_LOG_DIR`.

**Critério de sucesso:** `.dump` gerado em `daily\` + header `PGDMP` válido + exit 0 → `last-status.status = OK`. Caso contrário `FAIL`.

**Remover a task:** `Unregister-ScheduledTask -TaskName 'MultGestor-Backup-Daily' -Confirm:$false`.

> ⚠️ Limitação Fase 1: a task roda com `LogonType Interactive` (executa quando o usuário está logado) e
> depende da máquina ligada no horário. `-StartWhenAvailable` recupera execuções perdidas. Para execução
> 100% desatendida, migrar para um host always-on (fora do escopo desta fase).

## Fase 2 (semanal — NÃO agendada ainda)

O **full restore-check** semanal no projeto descartável (que exige `BRCHK_TARGET_DB_URL` + `--target-is-disposable`)
**não é registrado** nesta fase. Será proposto e aprovado separadamente. O `register-tasks.ps1 -IncludeWeekly`
aborta de propósito até lá.
