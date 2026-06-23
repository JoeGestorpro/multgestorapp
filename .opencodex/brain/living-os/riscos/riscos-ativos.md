# Riscos Ativos

> **Atualizado:** 2026-06-22 · **Total:** 8 riscos ativos (3 P1, 5 P2) + R-001/A-002 (backup) rebaixado a 🟢 monitorado em 2026-06-22
> **Fonte:** [[../02-painel-executivo|Painel Executivo]], projeto, auditorias
> **Propósito:** Inventário completo de todos os riscos vivos, com plano de mitigação.

---

## P1 — Catastróficos (bloqueiam produção segura)

### R-002 | Violação multi-tenant (companies/users sem RLS)

- **ID Auditoria:** A-001
- **Descrição:** `companies` e `users` SEM policies de RLS. RLS habilitado mas inerte porque runtime tem BYPASSRLS.
- **Probabilidade:** Baixa (filtros `company_id` na aplicação protegem)
- **Impacto:** Alto (vazamento de dados entre tenants)
- **Plano:** `security/rls-companies-users-policy` — criar policies formais
- **Dono:** backlog (P1)
- **Tendência:** 🟡 Estável
- **Gate:** [[../gates/gate-seguranca|Gate Segurança]] — critério #1

### R-003 | Rate limit + cache volátil (sem Redis em produção)

- **ID Auditoria:** A-004
- **Descrição:** `REDIS_URL` vazio em `.env` e `.env.production`. Produção usa fallback in-memory. Rate limit reinicia no restart do servidor.
- **Probabilidade:** Média
- **Impacto:** Médio (rate limit bypassável via restart, cache não-persistente)
- **Plano:** `infra/redis-production-config` — configurar Redis no Render (~$15/mês) ou aceitar risco documentado
- **Dono:** backlog (P1)
- **Tendência:** 🟡 Estável
- **Gate:** [[../gates/gate-seguranca|Gate Segurança]] — critério #4

### R-004 | Migration falhada não bloqueia deploy

- **ID Auditoria:** A-005
- **Descrição:** `continue-on-error: true` em `deploy.yml`. Migration falhada não interrompe o deploy. Schema drift acumula.
- **Probabilidade:** Alta (já aconteceu com 022 e 023)
- **Impacto:** Alto (schema de produção diverge do repositório)
- **Plano:** `cicd/migrations-fail-fast` — remover continue-on-error. **Bloqueado** por OPS-SUPAVISOR + secrets rotation pausada.
- **Dono:** 🔴 bloqueado (OPS-SUPAVISOR)
- **Tendência:** 🔴 Piorou (não há progresso)
- **Gate:** [[../gates/gate-producao|Gate Produção]] — critério #4

---

## P2 — Significativos

### R-005 | Regressão não detectada (sem E2E automatizado)

- **ID Auditoria:** A-008/A-009
- **Descrição:** Zero E2E automatizado. Fluxo público GET validado manualmente em 2026-06-18, mas sem garantia de não-regressão.
- **Probabilidade:** Média
- **Impacto:** Médio
- **Plano:** `e2e-public-booking-validation` (automatizado) — criar teste E2E do fluxo público
- **Dono:** backlog
- **Tendência:** 🟢 Melhorou (validação manual em 06-18)

### R-006 | Operação cega (sem alerta de falha)

- **ID Auditoria:** A-018
- **Descrição:** Nenhum alerta externo se backup ou outbox falharem. Só descobre-se na próxima verificação manual.
- **Probabilidade:** Alta
- **Impacto:** Médio
- **Plano:** Configurar alertas (email/Slack/health check) para falha de backup + outbox
- **Dono:** backlog (Observability)
- **Tendência:** 🟡 Estável

### R-007 | WhatsApp mock ativo (cliente não notificado em tempo real)

- **Descrição:** Meta Cloud API infra existe + credenciais no `.env`, mas `WHATSAPP_PROVIDER=mock` é o default. Health reporta `degraded`.
- **Probabilidade:** Alta (já está em mock)
- **Impacto:** Médio (cliente não recebe confirmação WhatsApp)
- **Plano:** Decisão formal: ativar real ou manter mock documentado
- **Dono:** Decisão pendente
- **Tendência:** 🟡 Estável

### R-008 | POST booking não testado E2E

- **ID Auditoria:** A-021
- **Descrição:** Fluxo de agendamento POST nunca foi executado em produção (gated). Pode haver erro não detectado.
- **Probabilidade:** Baixa (GET funciona, lógica similar)
- **Impacto:** Médio (cliente não consegue agendar)
- **Plano:** Testar POST em produção com agendamento controlado
- **Dono:** backlog
- **Tendência:** 🟡 Estável

### R-009 | Sem política de privacidade/LGPD

- **ID Auditoria:** A-023
- **Descrição:** Sem política de privacidade, termos de uso ou mecanismo de consentimento. Risco legal.
- **Probabilidade:** Baixa (sem cliente pagante ainda)
- **Impacto:** Médio (risco legal/regulatório)
- **Plano:** Publicar política de privacidade + termos + consentimento antes do primeiro cliente pagante
- **Dono:** backlog
- **Tendência:** 🟡 Estável

---

## 🟢 Monitorados (mitigados, em acompanhamento)

### R-001 | Perda de todos os backups — mitigado 2026-06-22 (A-002)

- **Era:** P1 catastrófico (backup só local). **Agora:** 🟢 monitorado (saiu da seção P1).
- **Mitigação:** `ops/backup-external-copy` concluída — cópia diária externa para Backblaze B2
  (bucket privado `[BUCKET_NAME]`), `verified=true`, `status=OK`, `BRCHK_EXTERNAL_ENABLED=1`,
  dump via conexão direta. Prova viva: [[../../audits/AUDITORIA-BACKUP-GOVERNANCA-PROVA-VIVA-2026-06-22]].
- **Acompanhamento contínuo:**
  - Monitorar `last-status.json` diário/semanal (`OK` + `verified=true`).
  - Teste de restore periódico (ex.: mensal) em projeto descartável.
  - Endurecimento futuro de credenciais (rotação/escopo) antes de produção comercial plena.
  - Limpeza pendente: remover do B2 o objeto de teste de 0 bytes (Gate 6).

---

## Resolvidos

| ID | Risco | Resolvido | Como |
|---|---|---|---|
| A-002 | Perda de backup (só local) | 2026-06-22 | Cópia externa B2 validada (`verified=true`) + conexão direta. Agora **monitorado** (ver R-001) |
| A-003 | Outbox orphaned (cash_session.* failed) | 2026-06-18 | UPDATE direto em produção, `failed=0` |
| A-006 | Stored XSS em companies.name + users.name | 2026-06-15 | Sanitizado via UPDATE, portão /register → 400 |
| — | Drift 022 (outbox_message_handlers) | 2026-06-14 | Migration aplicada via MCP |
| — | Drift 023 (reminder_sent_at) | 2026-06-14 | Migration aplicada via MCP |
| — | DATABASE_URL inválida no CI | 2026-06-15 | Corrigida no GitHub secrets |
