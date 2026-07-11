# Gate: Produção Segura

> **Atualizado:** 2026-06-19 · **Status:** 🔴 BLOQUEADO (6/14 critérios não atendidos)
> **Propósito:** Checklist formal para aprovar que o sistema está seguro para cliente pagante.

---

## Critérios de bloqueio

Se QUALQUER item abaixo for ❌, o gate **BLOQUEIA**.

| # | Critério | Status | Gate relacionado |
|---|---|---|---|
| 1 | Backup com cópia externa ativa | ❌ | `ops/backup-external-copy` |
| 2 | RLS em todas as tabelas de dados de cliente | ❌ | `security/rls-companies-users-policy` |
| 3 | Redis em produção (rate limit + cache) | ❌ | `infra/redis-production-config` |
| 4 | Migration falhada bloqueia deploy | ❌ | `cicd/migrations-fail-fast` |
| 5 | Alerta se backup ou outbox falhar | ❌ | Observability |
| 6 | E2E automatizado do fluxo público | ❌ | `e2e-public-booking-validation` |

## Critérios não-bloqueantes (desejáveis, não obrigatórios)

| # | Critério | Status |
|---|---|---|
| 7 | CSP ativo no Helmet | ❌ |
| 8 | Brute-force protection no login | ❌ |
| 9 | Cobertura de testes ≥ 30% | 🟡 Parcial |
| 10 | POST de agendamento testado E2E | 🟡 Parcial |

---

## Como passar

1. Executar as 6 missões de bloqueio em ordem (ver [[../05-proxima-melhor-acao|Próxima Melhor Ação]])
2. Cada missão concluída deve ter evidência registrada
3. Auditoria final de produção com runbook canônico (`auditoria-completa-padrao.md`)
4. Veredito: `APPROVED` ou `APPROVED_WITH_NOTES` (sem bloqueios P1)

---

## Template de veredito

```markdown
## Veredito Gate Produção — YYYY-MM-DD

### Resultado
[APROVADO | BLOQUEADO | APROVADO_COM_NOTAS]

### Bloqueios
- [ ] Backup externo: [OK | PENDENTE]
- [ ] RLS completo: [OK | PENDENTE]
- [ ] Redis produção: [OK | PENDENTE]
- [ ] Migration fail-fast: [OK | PENDENTE]
- [ ] Alertas: [OK | PENDENTE]
- [ ] E2E automatizado: [OK | PENDENTE]

### Não-bloqueantes
- [ ] CSP: [OK | PENDENTE]
- [ ] Brute-force: [OK | PENDENTE]
- [ ] Cobertura testes: [%]
- [ ] POST testado: [OK | PENDENTE]

### Assinatura
- **Humano:** [nome]
- **Agente:** [modelo + data]

### Notas
[observações livres]
```
