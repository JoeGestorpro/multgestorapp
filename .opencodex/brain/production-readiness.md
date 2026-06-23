---
status: draft
updated_at: 2026-06-22
based_on: state_version 13, AUDITORIA-ROADMAP-MULTGESTOR-2026-06-19
---

# Production Readiness — MultGestor

> **Atualização 2026-06-22 (governança):** Backup local **e** externo B2 corrigidos e validados.
> A conexão do dump passou do pooler Supabase (`ECIRCUITBREAKER`) para **conexão direta**; `BRCHK_EXTERNAL_ENABLED=1`.
> Último `last-status.json`: `exit_code 0`, `status OK`, `external_upload OK`, `verified true`
> (dump `principal-2026-06-22T19-16-20-151Z.dump`). No mesmo dia foi **fechado o P0** de exposição
> `anon`/`authenticated` no PostgREST (RLS + REVOKE) e validado o booking público E2E em produção.
> Ver memórias `project-backup-b2-validated` e `security-anon-postgrest-exposure-fix`.

> Critérios objetivos para considerar a produção segura para cliente pagante.
> Cada item é binário: atende ou não atende. Parcial = não atende.

---

## 1. Backup e resiliência

- [x] Backup com cópia externa ativa (não apenas local) — **A-002** ✅ 2026-06-22 (B2, upload verificado)
- [ ] Restore documentado com RPO ≤ 24h e RTO ≤ 1h
- [x] Restore testado em banco descartável nos últimos 30 dias — restore-check 2026-06-17
- [ ] Alerta se backup falhar — **A-018**
- [x] Retenção de backups ≥ 7 dias — 7 dumps na rotina diária

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
| Backup externo | 🟢 | ✅ ligado e validado 2026-06-22 (B2, verified=true) |
| Restore documentado | 🟢 | runbook + restore-check 2026-06-17; cópia externa ativa |
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

**Total:** 6/14 ✅ · 1/14 🟡 · 7/14 ❌ _(atualizado 2026-06-22: backup externo + restore documentado → 🟢)_

---

## Veredito

**Atualizado 2026-06-22:** o **P0 de segurança** (exposição `anon`/PostgREST) foi **fechado** e o **backup externo** está **ligado e validado** — os dois maiores bloqueadores caíram. Restam **7 critérios** (CSP no Helmet, role runtime sem BYPASSRLS, alerta de backup/outbox, migration fail-fast, E2E do fluxo público em CI, policies RLS em `companies`/`users`). Para **venda assistida/manual ao primeiro cliente**, a base está **liberada**; os 7 restantes seguem no roadmap da Fundação Segura para escala/self-service.
