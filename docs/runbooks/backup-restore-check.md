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
