# Decisões Executivas

> **Atualizado:** 2026-06-23 · **Propósito:** Registro de decisões pendentes e tomadas.
> **Fonte:** [[../02-painel-executivo|Painel Executivo]], projeto, auditorias

---

## Pendentes

### D-001 | RLS: policies formais vs BYPASSRLS documentado

- **Data:** 2026-06-19
- **Contexto:** `companies` e `users` sem RLS. Runtime tem BYPASSRLS. Duas abordagens possíveis.
- **Opções:**
  - A) Criar policies formais para companies + users (defesa em profundidade)
  - B) Documentar BYPASSRLS como aceito (risco documentado)
- **Recomendação:** Opção A — criar policies formais. Defesa em profundidade é princípio do projeto.
- **Bloqueia:** `security/rls-companies-users-policy`
- **Status:** ⏳ Aguardando decisão humana

### D-002 | Redis: pagar vs aceitar in-memory

- **Data:** 2026-06-19
- **Contexto:** Redis disponível no Render (~$15/mês) vs fallback in-memory atual.
- **Opções:**
  - A) Ativar Redis no Render (custo baixo, ganho alto)
  - B) Aceitar in-memory e documentar risco (rate limit volátil)
- **Recomendação:** Opção A — ~$15/mês é custo irrelevante para segurança operacional.
- **Bloqueia:** `infra/redis-production-config`
- **Status:** ⏳ Aguardando decisão humana

### D-003 | WhatsApp: ativar real vs manter mock

- **Data:** 2026-06-19
- **Contexto:** Meta Cloud API infra existe + credenciais reais no `.env`. Default é mock. Health degraded.
- **Opções:**
  - A) Trocar `WHATSAPP_PROVIDER` para `meta` e ativar real
  - B) Manter mock e documentar como limitação
- **Recomendação:** Opção A — infra já está pronta, credenciais existem. Faltou apenas decisão de ativar.
- **Bloqueia:** Múltiplas missões (notificação ao cliente, confirmação)
- **Status:** ⏳ Aguardando decisão humana

### D-004 | OutboxWorker: break vs continue em sale.created

- **Data:** 2026-06-19
- **Contexto:** `sale.created` está em quarentena lógica (comentado). Decisão sobre comportamento do OutboxWorker ao encontrar evento sem handler.
- **Opções:**
  - A) Break — interrompe processamento e marca como failed
  - B) Continue — pula evento sem handler (no-op), continua fila
- **Recomendação:** Opção B — continuar. F6 já implementou no-op. Melhor ter evento a mais que perder visibilidade.
- **Bloqueia:** Fase-c
- **Status:** ⏳ Aguardando decisão humana

### D-005 | ClimaGestor: investir como 2º vertical ou congelar

- **Data:** 2026-06-19
- **Contexto:** ClimaGestor tem CRUD completo (profissionais, serviços, appointments, availability). Pode ser o segundo vertical real em produção.
- **Opções:**
  - A) Congelar e focar em fechar P1s
  - B) Investir como 2º vertical para validar arquitetura multi-nicho
- **Recomendação:** Opção A — fechar Camada 1 primeiro. ClimaGestor existe como prova de conceito.
- **Bloqueia:** Nada (recomendação é congelar)
- **Status:** ⏳ Aguardando decisão humana

---

## Tomadas (recentes)

### D-014 | Publicação do .opencodex: publicar com ressalvas/redação (2026-06-23)

- **Decisão:** Opção B — publicar `.opencodex` com ressalvas/redação.
  Substituir project ref, host de banco, bucket, backend URL, pooler host e
  outros detalhes operacionais por placeholders antes de publicar.
- **Contexto:** Varredura PLAN_ONLY do `fase-c/decisao-opencodex` concluída.
  Nenhum secret real, token, senha, CPF/CNPJ, email pessoal ou credencial concreta
  encontrada. Porém, detalhes operacionais e estratégicos expostos.
- **Regras:**
  - Redigir antes qualquer project ref, host de banco, bucket, backend URL,
    pooler host e outros detalhes operacionais.
  - Publicação só com autorização humana separada depois da redação.
  - Nenhuma publicação autorizada nesta missão.
- **Status:** ✅ Tomada (2026-06-23)

### D-013 | Sequência da Fase C (2026-06-23)

- **Decisão:** PR-1 (PR #13) concluído → PR-2 backup/B2 checklist READ_ONLY (concluído) → Decisão `.opencodex` (após varredura segredos/PII) → Cleanup (final).
- **Regras:**
  - PR-2 autorizado e executado somente como checklist READ_ONLY; não autorizado para branch, cherry-pick, commit, push ou alterações de código.
  - `.opencodex` continua travado para publicação.
  - Cleanup de branch/worktree continua travado.
  - `agent/joefelipe-consolidation` shelvado até Fase C terminar.
  - Fase C continua sendo resgate cirúrgico, **não merge**.
- **Status:** ✅ Tomada (PR-2 checklist executado conforme plano)

### D-012 | Estratégia de backup validada (2026-06-22)

- **Usar conexão direta** do Supabase para o `pg_dump` de backup (`[DB_HOST]`, user `postgres`).
- **Manter o pooler fora** do fluxo de dump (evita `ECIRCUITBREAKER` do Supavisor).
- **Backblaze B2** como cópia externa **privada** (bucket `[BUCKET_NAME]`).
- **Backup externo validado** (`verified=true`) considerado **gate de produção/governança** atendido.
- Evidência: [[../../audits/AUDITORIA-BACKUP-GOVERNANCA-PROVA-VIVA-2026-06-22|prova viva]].

| ID | Decisão | Data | Detalhe |
|---|---|---|---|
| D-006 | Provedor backup externo: Backblaze B2 | 2026-06-18 | S3-compat, 10GB grátis, sem OAuth |
| D-007 | Branch `ops/backup-restore-check` sem push | 2026-06-18 | Nenhum push até autorização humana |
| D-008 | Ordem: e2e → auditoria → outbox → instruções | 2026-06-18 | Sequência executada e concluída |
| D-009 | XSS ciclo fechado (Bloco A+B+C) | 2026-06-15 | Nenhum XSS armazenado em produção |
| D-010 | Secrets rotation PAUSADA | 2026-06-15 | Deferida por decisão humana |
| D-011 | F6 no-op para eventos sem handler | 2026-06-06 | EventBus não quebra em handler ausente |

---

## Próximas decisões necessárias

| Prioridade | Decisão | Recomendação | Data limite |
|---|---|---|---|
| 1 | RLS policies vs BYPASSRLS | Policies formais | Antes de executar RLS task |
| 2 | Redis produção | Ativar (~$15/mês) | Antes de configurar Redis |
| 3 | WhatsApp real vs mock | Ativar real | Antes de fechar Camada 1 |
| 4 | OutboxWorker break vs continue | Continue | Antes de promover fase-c |
| 5 | ClimaGestor | Congelar | Não urgente |
