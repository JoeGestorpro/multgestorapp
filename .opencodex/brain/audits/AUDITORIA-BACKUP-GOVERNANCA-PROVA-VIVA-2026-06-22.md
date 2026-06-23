---
tipo: auditoria-prova-viva
escopo: backup local + externo (Backblaze B2) + conexão Supabase
data: 2026-06-22
status: VALIDADO
autor: Claude Code (governança)
relacionado: A-002, ops/backup-external-copy, [[../runbooks/backup-restore-plan]]
sem_secrets: true
---

# 🛟 Auditoria de Prova Viva — Backup MultGestor (2026-06-22)

> Documento de **evidência verificável**. Não contém secrets, connection strings completas, senhas nem tokens.
> Hosts/usuários públicos são citados sem credenciais.

---

## 1. Resumo executivo

O risco **A-002 (perda catastrófica de backup — backup só local)** estava marcado como **P1 crítico/pendente**:
a cópia externa estava implementada porém **desligada por flag**, e o **dump diário local estava saindo vazio (0 bytes)**.

Em **2026-06-22** o fluxo foi **corrigido, validado de ponta a ponta e ligado**:
- Causa raiz do dump vazio identificada (pooler Supabase com `ECIRCUITBREAKER`) e contornada por **conexão direta**.
- Dump local válido gerado (PGDMP legível, ~648 KB).
- Upload externo para **Backblaze B2** validado com **SHA1 local == remoto** (`verified=true`).
- Cópia diária externa **habilitada** (`BRCHK_EXTERNAL_ENABLED=1`).
- Fluxo diário completo executado com `status=OK`, `exit_code=0`, `external_upload.status=OK`.

**Resultado:** o risco sai de **crítico/pendente** para **resolvido/monitorado**. Existe agora cópia off-site verificável.

---

## 2. O que estava quebrado

1. **Dump local saindo vazio (0 bytes):** o `pg_dump` falhava ao conectar e gerava arquivo vazio.
   `last-status.json` registrava `exit_code=1`, `status=FAIL`. Último dump real datava de 2026-06-17.
2. **Causa raiz:** `BRCHK_SOURCE_DB_URL` usava o **pooler** `[SUPABASE_POOLER_HOST]` (usuário no
   formato `postgres.<ref>`), que retornava **`ECIRCUITBREAKER`** (Supavisor tropeçado — mesmo bloqueio que
   afeta as migrations de CI).
3. **Cópia externa desligada:** `BRCHK_EXTERNAL_ENABLED=0`. Mesmo que o dump funcionasse, nada subia para o B2.

---

## 3. O que foi corrigido

| # | Correção | Detalhe |
|---|---|---|
| 1 | **Conexão direta** | `BRCHK_SOURCE_DB_URL` passou a usar o host direto `[DB_HOST]` com usuário `postgres` (sem o sufixo `.<ref>` exigido pelo pooler). O pooler ficou **fora** do fluxo de dump. |
| 2 | **Binário confirmado** | `BRCHK_PG_BIN=C:\Program Files\PostgreSQL\17\bin` (pg_dump 17 — casa com o servidor PG 17.x). |
| 3 | **Gate 0** | Dump local válido gerado e legível (header PGDMP). |
| 4 | **Gate 6** | Upload manual para B2 validado (SHA1 local == remoto). |
| 5 | **Gate 7** | `BRCHK_EXTERNAL_ENABLED=1` — cópia diária externa ligada. |
| 6 | **Fluxo diário** | Execução completa (dump + upload) com sucesso. |

> Nenhum secret foi exposto/commitado. Credenciais permanecem apenas no `brchk.env` **fora do repositório**.

---

## 4. Evidências verificáveis

- **Baseline do banco (read-only, pós-correção):** `public_tables=55`, `policies=45`, `rls_on/off=55/0`.
- **`last-status.json` (fluxo diário):**
  ```json
  {
    "exit_code": 0,
    "status": "OK",
    "external_upload": {
      "enabled": true,
      "provider": "backblaze-b2",
      "bucket": "[BUCKET_NAME]",
      "verified": true,
      "status": "OK",
      "error": null
    }
  }
  ```
- **Como reverificar (sem expor secret):**
  ```powershell
  Get-Content "$env:USERPROFILE\backups\logs\last-status.json" -Raw
  ```
  Esperado continuamente: `status=OK`, `external_upload.status=OK`, `verified=true`.

---

## 5. Arquivos / dumps gerados

| Artefato | Observação |
|---|---|
| `principal-2026-06-22T19-12-08-518Z.dump` | Gate 0 — dump local válido (~648 KB, PGDMP legível). |
| `principal-2026-06-22T19-16-20-151Z.dump` | Fluxo diário completo — dump + upload externo OK. |
| `principal-2026-06-22T18-39-29-229Z.dump` (0 bytes) | ⚠️ Objeto de **teste vazio** enviado no Gate 6 (antes da correção). **Pendência:** remover do B2 (prefixo `daily/`). |

---

## 6. Resultado do Backblaze B2

- Bucket **privado**: `[BUCKET_NAME]` (provider `backblaze-b2`).
- Integridade: **SHA1 local == SHA1 remoto** → `verified=true`.
- `external_upload.status=OK`, `error=null`.
- Credenciais (key id / app key) apenas no `brchk.env` off-repo; nunca em log, código ou commit.

---

## 7. Estado final dos gates

| Gate | Descrição | Estado |
|---|---|---|
| Gate 0 | Backup local válido (dump + PGDMP legível) | ✅ OK |
| Gate 6 | Upload manual B2 validado (SHA1) | ✅ OK |
| Gate 7 | Cópia diária externa ligada (`BRCHK_EXTERNAL_ENABLED=1`) | ✅ OK |
| Scheduler | Task diária `MultGestor-Backup-Daily` (02:00) | ✅ Ready |

---

## 8. Riscos remanescentes

1. **Monitoramento contínuo (P2):** não há alerta automático de falha de backup (A-018). Conferência hoje é
   manual (`last-status.json`). Recomenda-se checagem **diária/semanal** até existir alerta.
2. **Teste de restore periódico (P2):** restore-check validado em 2026-06-17; recomenda-se repetir
   periodicamente (ex.: mensal) em projeto descartável.
3. **Endurecimento de credenciais (P2):** antes de produção comercial plena, revisar rotação/escopo das
   chaves B2 e do `BRCHK_SOURCE_DB_URL`.
4. **Limpeza pendente:** remover o objeto de teste de 0 bytes do B2 (seção 5).
5. **CI migrations:** ainda usam o pooler via `DATABASE_URL` (continue-on-error). O mesmo workaround de
   conexão direta pode ajudar lá — fora do escopo desta missão.

---

## 9. Próxima ação recomendada

1. **Não rodar backup manualmente** — deixar a task diária operar; conferir `last-status.json` amanhã.
2. **Monitorar** (diário/semanal) `status=OK` + `external_upload=OK` + `verified=true`.
3. **Depois:** limpar o objeto vazio do B2.
4. **Retomar** a consolidação do **JoeFelipe Agent** (a governança de backup deixou de ser bloqueador).

---

## 10. Veredito final

✅ **RESOLVIDO E VALIDADO.** O backup do MultGestor agora tem **cópia externa off-site verificável** (Backblaze B2),
com integridade confirmada e cópia diária automática ligada. O risco A-002 deixa de ser bloqueador de produção
e passa a **monitorado**. A base operacional está liberada para retomar trabalho de produto/agente.
