# Gate: Segurança

> **Atualizado:** 2026-06-19 · **Status:** 🔴 BLOQUEADO (múltiplos critérios não atendidos)
> **Propósito:** Checklist de segurança obrigatória para produção segura.

---

## Critérios obrigatórios

Se QUALQUER item abaixo for ❌, o gate **BLOQUEIA**.

| # | Critério | Status | Severidade | Gate relacionado |
|---|---|---|---|---|
| 1 | RLS ativo em todas as tabelas com dados de cliente | ❌ | P1 | `security/rls-companies-users-policy` |
| 2 | Runtime role sem BYPASSRLS (ou exceção documentada) | ❌ | P1 | Fase 2/3 runtime-role |
| 3 | Nenhum secret em log, código ou CI | 🟢 OK | — | Resolvido 06-15 |
| 4 | Rate limit persistente (Redis) | ❌ | P1 | `infra/redis-production-config` |
| 5 | CSP ativo no Helmet | ❌ | P2 | backlog |
| 6 | Brute-force protection no login | ❌ | P2 | backlog |
| 7 | Migration falhada bloqueia deploy | ❌ | P1 | `cicd/migrations-fail-fast` |

---

## Critérios recomendados

| # | Critério | Status |
|---|---|---|
| 8 | Política de privacidade publicada | ❌ |
| 9 | Termos de uso publicados | ❌ |
| 10 | Auditoria de segurança periódica | 🟡 Parcial (2026-06-18) |

---

## Resumo

| Status | Total |
|---|---|
| 🟢 OK | 1 |
| ❌ Bloqueante | 5 |
| ❌ Não-bloqueante | 2 |
| 🟡 Parcial | 1 |

## Caminho para aprovação

1. Resolver RLS companies/users (A-001)
2. Decidir e configurar Redis produção (A-004)
3. Remover continue-on-error das migrations (A-005)
4. Ativar CSP no Helmet
5. Implementar brute-force protection
6. Publicar política de privacidade e termos
