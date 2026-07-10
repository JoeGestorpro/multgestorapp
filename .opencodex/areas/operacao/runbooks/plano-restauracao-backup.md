# 🛟 RUNBOOK — Backup & Restore (DR) do Supabase — MultGestor v2

> **Status:** Fase 1 dump-only CONCLUÍDA (2026-06-18) · Fase 2 restore PLAN_ONLY / human-gated.
> **Deliverable do objetivo #3** da missão [`backup-restore-check`](../../queue/next-task.md).
> Restore real exige **nova aprovação humana** (standing alert). Claude/MCP = **só leitura**.

---

## ✅ Estado atual validado (2026-06-22)

- **Cópia externa LIGADA:** `BRCHK_EXTERNAL_ENABLED=1`. Cada dump diário é enviado ao Backblaze B2
  (bucket privado `[BUCKET_NAME]`) com verificação de integridade SHA1.
- **Conexão de dump:** **direta** `[DB_HOST]` (user `postgres`). O **pooler**
  `[SUPABASE_POOLER_HOST]` ficou **fora** do fluxo (retornava `ECIRCUITBREAKER`).
- **Binário:** `BRCHK_PG_BIN=C:\Program Files\PostgreSQL\17\bin` (pg_dump 17).
- **Scheduler:** task `MultGestor-Backup-Daily` (02:00) · retenção 7 dumps.

### Fluxo diário atual
```
run-backup.ps1 (self-load brchk.env, guards)
  → pg_dump -Fc (conexão direta)  → dump local em BRCHK_BACKUP_DIR
  → se exit_code=0 e BRCHK_EXTERNAL_ENABLED=1 → upload-external.ps1 → B2 (SHA1 verificado)
  → grava last-status.json
```

### Evidência esperada no `last-status.json`
```json
{ "exit_code": 0, "status": "OK",
  "external_upload": { "enabled": true, "provider": "backblaze-b2",
    "bucket": "[BUCKET_NAME]", "verified": true, "status": "OK", "error": null } }
```

### Verificação (sem expor secret)
```powershell
Get-Content "$env:USERPROFILE\backups\logs\last-status.json" -Raw
```
Conferir: `status=OK`, `external_upload.status=OK`, `verified=true`. **Nunca** imprimir `brchk.env`
nem `BRCHK_SOURCE_DB_URL`.

### Troubleshooting
| Sintoma | Provável causa | Ação |
|---|---|---|
| `exit_code != 0` / dump 0 bytes | conexão falhou (ex.: `ECIRCUITBREAKER` no pooler) | usar/confirmar **conexão direta**; testar `Test-NetConnection db.<ref>.supabase.co -Port 5432` |
| `status != OK` | dump falhou antes do upload | checar binário (`BRCHK_PG_BIN`) e conexão; **não** ligar nada novo |
| `verified=false` | SHA1 local ≠ remoto | reenviar; se persistir, suspeitar de corrupção/credencial B2 |
| `external_upload.status=SKIPPED` | flag off **ou** dump falhou | confirmar `BRCHK_EXTERNAL_ENABLED=1` e `exit_code=0` |

> Prova viva completa: [[../audits/AUDITORIA-BACKUP-GOVERNANCA-PROVA-VIVA-2026-06-22]].

## 0. Regras invioláveis
- ❌ Agente/MCP **NUNCA** roda `pg_dump` / `pg_restore` / `supabase db dump` / restore / migration / deploy.
- ❌ **Nunca** registrar connection string, host, senha, token ou URL privada. Usar placeholders
  `<SUPABASE_DB_URL>` e `$env:SUPABASE_DB_URL`. A string vive **só na sessão do humano** — nunca commitada,
  nunca ecoada em log (ver [[areas/seguranca/rotacao-segredos]] + `docs/private/`).
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
| Task diária | ✅ registrada e verificada (2026-06-18) — `State: Ready` · `NextRunTime: 2026-06-19 02:00` · `LastRunTime` ausente (primeira execução pendente — esperado). Ver §9. |
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

## 9. Scheduler diário — estado real e comandos de registro

> **Auditoria 2026-06-18:** `Get-ScheduledTask -TaskName "MultGestor-Backup-Daily"` = nenhum resultado.
> A task foi declarada registrada na governança da Fase 1, mas **nunca foi criada**. O RPO ~24h
> declarado não está garantido automaticamente. Missão `ops/register-daily-backup-scheduler` aberta (P0).

### Verificação do estado atual (read-only)

```powershell
Get-ScheduledTask -TaskName 'MultGestor-Backup-Daily' | Select-Object TaskName, State, TaskPath
# Se vazio: task não existe — executar bloco de registro abaixo.
# Se State = Ready: task registrada corretamente.
```

### Registro (humano executa uma única vez — PowerShell como Administrador)

```powershell
$action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument ('-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}"' -f 'C:\MultGestor.v2\ops\backup\run-backup.ps1') `
    -WorkingDirectory 'C:\MultGestor.v2'

$trigger = New-ScheduledTaskTrigger -Daily -At '02:00'

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -MultipleInstances IgnoreNew `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName 'MultGestor-Backup-Daily' `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -RunLevel Highest `
    -Description 'MultGestor v2 — backup diario dump-only (run-backup.ps1). BRCHK_TARGET_DB_URL ausente por design.'
```

### Verificação pós-registro

```powershell
# Confirmar que a task existe e está Ready
Get-ScheduledTask -TaskName 'MultGestor-Backup-Daily' | Select-Object TaskName, State

# Confirmar que BRCHK_TARGET_DB_URL não está nas variáveis de sistema ou usuário
[System.Environment]::GetEnvironmentVariable('BRCHK_TARGET_DB_URL', 'Machine')
[System.Environment]::GetEnvironmentVariable('BRCHK_TARGET_DB_URL', 'User')
# Ambos devem retornar vazio/$null — correto; o script nunca restaura por design.
```

> **Após `Get-ScheduledTask` retornar `State: Ready`:** informar Claude Code para atualizar governança —
> substituir "scheduler pendente" por "scheduler ativo (verificado)". RPO ~24h passa de **declarado**
> para **verificado**. Missão `ops/register-daily-backup-scheduler` pode ser encerrada.

### Estado verificado (2026-06-18)

| Resultado | Valor |
|---|---|
| `TaskName` | `MultGestor-Backup-Daily` |
| `State` | `Ready` ✅ |
| `NextRunTime` | `2026-06-19 02:00` ✅ |
| `LastRunTime` | `1999-11-30` (ainda não executou — esperado) |
| `LastTaskResult` | `267011` (SCHED_S_TASK_HAS_NOT_RUN — ainda não executou — esperado) |

Missão `ops/register-daily-backup-scheduler` **CONCLUÍDA**. RPO ~24h verificado.

## 10. Cópia externa/cloud — plano Backblaze B2 (PLAN_ONLY · documentação inerte 2026-06-19)

> **Achado A-002** (auditoria 2026-06-18 §10): backup diário funcional, mas **apenas local** —
> single point of failure no HD. Missão `ops/backup-external-copy` (`pending` em `next-task.md`).
> **Provedor escolhido: Backblaze B2** (decisão humana 2026-06-18). 10GB grátis cobrem 635KB/dia × 7;
> application keys S3-compatíveis dispensam OAuth (ideal p/ Task Scheduler não-assistido).
>
> **Atualização 2026-06-19:** bucket B2 + application key criados pelo humano; `brchk.env` preenchido
> localmente (ACL owner-only, flag `BRCHK_EXTERNAL_ENABLED=0`). Scripts feature-flagged **escritos**
> (`upload-external.ps1` criado; `run-backup.ps1` integrado) — ver §10.5. **Nenhum upload/API call
> executado, nenhum secret no repo, flag permanece 0.** Restam os gates humanos 6 e 7 (§10.7).

### 10.1 Checklist humano — criar o bucket B2 (console web; o humano faz)
- [ ] Criar/entrar na conta em **backblaze.com** e habilitar **B2 Cloud Storage**
- [ ] **Buckets → Create a Bucket**
- [ ] **Bucket Unique Name:** globalmente único (6–50 chars, minúsculas/dígitos/hífen, não pode começar com `b2-`)
- [ ] **Files in Bucket:** `Private` ⚠️ (contém dump com PII — nunca Public)
- [ ] **Default Encryption:** `Enable` (SSE-B2)
- [ ] **Object Lock:** `Disable` (opcional avançado; imutabilidade anti-ransomware no futuro)
- [ ] Anotar **Bucket Name** + **Bucket ID**

### 10.2 Checklist humano — criar a application key
- [ ] **App Keys → Add a New Application Key**
- [ ] **Name of Key:** rótulo legível
- [ ] **Allow access to Bucket(s):** ⚠️ restringir ao bucket específico (não "All") — menor privilégio
- [ ] **Type of Access:** `Read and Write` (inclui `deleteFiles` p/ retenção remota)
- [ ] **Create** → capturar **na hora** (aparece uma única vez): `keyID`, `applicationKey`, e o `bucketId`

### 10.3 Nomes recomendados (sugestão — não criar nada)
| Recurso | Nome sugerido | Nota |
|---|---|---|
| Bucket | `multgestor-v2-db-backups` | nome global no B2; se tomado, usar sufixo (`-prod`/token) |
| App key (rótulo) | `mg-v2-backup-writer` | rótulo livre, escopo = só o bucket, Read+Write |
| Prefixo interno | `daily/` | organiza os dumps no bucket |

### 10.4 Variáveis de ambiente (placeholders — NÃO inserir secrets reais aqui)
Vão no env file off-repo que `run-backup.ps1` já carrega: `%USERPROFILE%\.mg-backup\brchk.env`.
```ini
# --- Cópia externa (flag começa em 0: backup segue só-local até alguém virar 1 E autorizar) ---
BRCHK_EXTERNAL_ENABLED=0
BRCHK_B2_KEY_ID=<COLE_O_keyID_AQUI>
BRCHK_B2_APP_KEY=<COLE_O_applicationKey_AQUI>
BRCHK_B2_BUCKET=multgestor-v2-db-backups
BRCHK_B2_BUCKET_ID=<COLE_O_bucketId_AQUI>
```
> Após editar o env file, reaplicar ACL restritiva ao seu usuário (o guard SID do script bloqueia perms inseguras).

### 10.5 Integração feature-flagged — ESCRITA (2026-06-19, flag OFF)
**a) `ops/backup/upload-external.ps1`** ✅ CRIADO (inerte até flag=1):
`Get-FileHash -Algorithm SHA1` do dump → B2 nativo via `Invoke-RestMethod`
(`b2_authorize_account` v3 → `b2_get_upload_url` → upload com header `X-Bz-Content-Sha1`, que o B2 verifica
server-side) → compara SHA1 retornado vs local → retorna objeto sem secrets. TLS 1.2 forçado.
Nunca ecoa `BRCHK_B2_APP_KEY`/`BRCHK_B2_KEY_ID`/`BRCHK_SOURCE_DB_URL`. Em qualquer falha → status FAIL,
dump local intocado.

**b) `run-backup.ps1` — 2 enxertos feature-flagged** ✅ APLICADOS:
- **Guard 3:** se `BRCHK_EXTERNAL_ENABLED='1'`, exige também `BRCHK_B2_KEY_ID/APP_KEY/BUCKET/BUCKET_ID`. Flag `0`/ausente → lista de obrigatórias idêntica ao comportamento atual.
- **Após dump OK + retenção:** se flag `1` e `$code -eq 0`, chama `upload-external.ps1` para o `.dump` mais recente e captura o resultado em `external_upload`. Flag OFF → `SKIPPED`.

Falha de upload **não** invalida o dump local: `exit $code` segue refletindo só o dump; o upload entra como status separado (visível p/ futuro alerta — cruza com A-018). Reversão = `BRCHK_EXTERNAL_ENABLED=0`.

### 10.6 Schema proposto `external_upload` no `last-status.json`
A ser acrescentado ao hashtable do status (linha ~116 do `run-backup.ps1`):
```powershell
external_upload = [ordered]@{
  enabled     = $true
  provider    = 'backblaze-b2'
  bucket      = $env:BRCHK_B2_BUCKET
  file        = <nome-do-dump>
  sha1_local  = <hash>
  sha1_remote = <hash>          # retornado pelo B2; deve bater com sha1_local
  verified    = $true           # sha1_local -eq sha1_remote
  uploaded_at = <iso8601>
  status      = 'OK'            # OK | FAIL | SKIPPED (flag=0)
}
```

### 10.7 Gates humanos pendentes
| # | Intervenção humana | Por quê |
|---|---|---|
| 1 | Criar conta + bucket B2 | gera recurso na conta do humano |
| 2 | Criar app key + capturar keyID/appKey | secret, aparece uma vez |
| 3 | Editar `brchk.env` (5 vars) + reaplicar ACL | mexe em secret/`.env` off-repo |
| 4 | ✅ Decidir nome final do bucket (uniqueness global) | FEITO 2026-06-19 |
| 5 | ✅ Autorizar escrita de `upload-external.ps1` + enxertos | FEITO 2026-06-19 (scripts escritos, flag OFF) |
| 6 | ⏳ Autorizar teste de upload real | primeira gravação no B2 — PENDENTE |
| 7 | ⏳ Virar `BRCHK_EXTERNAL_ENABLED=1` | liga a cópia externa de fato — PENDENTE |

### 10.8 Impacto RPO/RTO (após cópia externa ativa)
RPO segue ~24h (frequência inalterada) mas **sobrevive à perda do HD local**. RTO = download do B2
(minutos, arquivo pequeno) + restore (~30–120min, como hoje). Rollback = `BRCHK_EXTERNAL_ENABLED=0`.
