---
status: draft
updated_at: 2026-06-19
based_on: state_version 13, AUDITORIA-ROADMAP-MULTGESTOR-2026-06-19
---

# Production Readiness — MultGestor

> Critérios objetivos para considerar a produção segura para cliente pagante.
> Cada item é binário: atende ou não atende. Parcial = não atende.

---

## 1. Backup e resiliência

- [ ] Backup com cópia externa ativa (não apenas local) — **A-002**
- [ ] Restore documentado com RPO ≤ 24h e RTO ≤ 1h
- [ ] Restore testado em banco descartável nos últimos 30 dias
- [ ] Alerta se backup falhar — **A-018**
- [ ] Retenção de backups ≥ 7 dias

## 2. Segurança

- [ ] RLS ativo em todas as tabelas com dados de cliente (incluindo `companies` e `users`) — **A-001**
- [ ] Role de runtime sem BYPASSRLS (ou documentação formal da exceção) — **A-011**
- [ ] CSP ativo no Helmet — **A-007**
- [ ] Rate limit persistente (Redis em produção) — **A-004**
- [ ] Nenhum secret em log, código ou CI — **A-005**
- [ ] Brute-force protection no login

## 3. CI/CD

- [ ] Migration falhada bloqueia deploy — **A-005**
- [ ] CI roda testes a cada push
- [ ] Testes de integração com banco real rodam em CI
- [ ] Release Safety Gate (pre-release validation) disponível

## 4. Qualidade

- [ ] E2E mínimo do fluxo público verde em CI — **A-008/A-009**
- [ ] Testes de isolamento multi-tenant verdes — tenant-isolation-rls.test.js
- [ ] POST de agendamento testado em produção pelo menos 1x — **A-021**
- [ ] Cobertura de testes ≥ 30% (ou aceito documentado)

## 5. Observabilidade

- [ ] Health check profundo reporta DB, Redis, outbox, backup
- [ ] Logs com correlation ID por request
- [ ] Sentry capturando erros de produção
- [ ] Alerta externo se outbox acumular > 100 pending — **A-018**

---

## Checklist atual

| Critério | Status | Responsável |
|---|---|---|
| Backup externo | ❌ | `ops/backup-external-copy` |
| Restore documentado | 🟡 parcial | runbook existe, sem cópia externa |
| Alerta backup | ❌ | backlog |
| RLS companies/users | ❌ | `security/rls-companies-users-policy` |
| Role runtime | ❌ | backlog (Fase 2/3) |
| CSP | ❌ | backlog |
| Redis produção | ❌ | `infra/redis-production-config` |
| Secrets em log | 🟢 resolvido | contenção 2026-06-15 |
| Migration fail-fast | ❌ | bloqueado OPS-SUPAVISOR |
| E2E booking | ❌ | `e2e-public-booking-validation` |
| POST booking testado | 🟡 manual | read-only validado |
| Alerta outbox | ❌ | backlog |
| CI com integração | 🟢 OK | ci.yml com Postgres + Redis |
| Health check | 🟢 OK | `/api/health/deep` |
| Sentry | 🟢 OK | configurado |

**Total:** 4/14 ✅ · 2/14 🟡 · 8/14 ❌

---

## Veredito

Produção ainda **não está segura** para cliente pagante. 8 critérios críticos não atendidos. A Camada 1 (Fundação Segura) precisa ser fechada antes de qualquer venda.
