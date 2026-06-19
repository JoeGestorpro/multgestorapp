# 05 — Próxima Melhor Ação

> **Status:** VIVO · **Atualizado:** 2026-06-19
> **Propósito:** Responder qual missão gera mais valor agora, reduz mais risco, desbloqueia produção/venda e deve ser executada primeiro.

---

## Matriz de decisão

| Critério | Missão | Nota |
|---|---|---|
| **Mais valor agora** | `ops/backup-external-copy` | Elimina SPOF de backup (maior risco catastrófico) |
| **Reduz mais risco** | `ops/backup-external-copy` | P1, risco catastrófico, baixo esforço |
| **Desbloqueia produção** | `ops/backup-external-copy` | Primeiro passo do caminho crítico |
| **Desbloqueia venda** | `security/rls-companies-users-policy` | Segurança é pré-requisito para cliente pagante |
| **Menor esforço** | `ops/backup-external-copy` | Script já existe, plano pronto, instrução humana criada |

---

## Próxima missão: `ops/backup-external-copy`

### Por que esta?

1. **Maior redução de risco catastrófico** — backup só no HD local hoje. Perda do computador = perda de todos os backups.
2. **Menor blast radius** — script isolado, sem tocar código de aplicação. Feature flag (`BRCHK_EXTERNAL_ENABLED=0`).
3. **Já planejada** — próxima na fila (`next-task.md`), instrução humana criada (`instrucoes-humanas/backup-external-copy-b2.md`), provedor decidido (Backblaze B2).
4. **Desbloqueia todo o resto** — sem backup externo, nenhum cliente pagante deve ser aceito.

### O que precisa acontecer

1. **Ação humana:** Criar bucket B2 + app key + popular `brchk.env` (fora do repo)
2. **Autorizar:** Escrita do script `upload-external.ps1` e modificação do `run-backup.ps1`
3. **Validar:** Upload real com checksum verificado
4. **Ativar:** `BRCHK_EXTERNAL_ENABLED=1`

---

## Próximas 3 ações recomendadas

| Ordem | Missão | Prioridade | Desbloqueia |
|---|---|---|---|
| 1 | `ops/backup-external-copy` | P1 | Backup seguro |
| 2 | `security/rls-companies-users-policy` | P1 | Segurança multi-tenant |
| 3 | `infra/redis-production-config` | P1 | Rate limit + cache persistente |

Após essas 3, a fundação P1 estará fechada e o sistema estará pronto para:
- `cicd/migrations-fail-fast` (se OPS-SUPAVISOR resolvido)
- `e2e-public-booking-validation` (automatizado)
- Fluxo trial → pago (venda)

---

## Decisões que bloqueiam

| Decisão | Bloqueia | Recomendação |
|---|---|---|
| RLS: policies formais vs BYPASSRLS | `security/rls-companies-users-policy` | Criar policies formais (defesa em profundidade) |
| Redis: pagar vs aceitar in-memory | `infra/redis-production-config` | Pagar (~$15/mês no Render) — risco baixo, ganho alto |
| WhatsApp: real vs mock | Múltiplas missões | Ativar real — infra já existe, credenciais no .env |
| OutboxWorker: break vs continue | Fase-c | Continuar — melhor ter evento a mais que perder |

---

## Matriz completa

```
Missão                      Valor  Risco  Esforço  Prioridade
─────────────────────────────────────────────────────────────
backup-external-copy        Alto   ↓↓↓    Baixo    1º
rls-companies-users         Alto   ↓↓     Médio    2º
redis-production-config     Médio  ↓      Baixo    3º
cicd-migrations-fail-fast   Alto   ↓↓     Alto     ⏳ bloqueado
e2e-booking-automated       Médio  ↓      Médio    Após P1
fluxo-trial-pago            Alto   —      Alto     Após P1
```
