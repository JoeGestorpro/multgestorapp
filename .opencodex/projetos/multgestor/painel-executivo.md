oque # 📈 Executive Dashboard

> **Status:** OFICIAL • VIVO
> **Atualizado:** 2026-06-24
> **Propósito:** Panorama executivo do MultGestor — cada dimensão com status claro e link para aprofundamento.

---

## Produção

| Indicador | Status | Detalhe |
|---|---|---|
| **Site** | 🟢 Online | `barbergestor.com.br` — health 200 |
| **Backend** | 🟢 Operacional | Render, health check profundo OK |
| **Frontend** | 🟢 Ativo | Vercel, SPA React 19 |
| **Banco** | 🟢 Conectado | Supabase PostgreSQL 17 (sa-east-1) |
| **Performance** | 🟡 Sem métricas | Sem monitoramento de performance |
| **Produção Segura** | 🔴 7/14 critérios | [[prontidao-producao]] |

---

## Deploy

| Indicador | Status | Detalhe |
|---|---|---|
| **CI** | 🟢 Verde | Unit + Integration passam |
| **CD** | 🟢 Completo | Deploy automático **+ migrations automáticas** (2026-07-20) |
| **Migrations** | 🟢 Gate bloqueante | `buildCommand = npm install && npm run migrate:prod` — falha impede o deploy |
| **Modo estrito** | 🟢 Ativo | Recusa fallback p/ `DATABASE_URL` e endpoint fora de sessão, antes de conectar |
| **Idempotência** | 🟢 Comprovada | 2º deploy: `pendentes: 0`, nenhuma migration reaplicada |
| **Rollback** | 🟢 Documentado | Um passo: `buildCommand = npm install` |
| **Deploy Frontend** | 🟢 Vercel | Automático via CI |
| **Deploy Backend** | 🟢 Render | Automático via CI |

### Capacidade `DATAOPS-002` — aplicação de migrations em produção

| | |
|---|---|
| **Antes** | `AUSENTE` — nenhum mecanismo aplicava migrations; o job do GitHub falhava com `ENETUNREACH` (IPv6) e era mascarado por `continue-on-error` |
| **Agora** | ✅ **`ATIVO_AUTOMATICO_COMPROVADO`** — gate bloqueante no `buildCommand` do Render, em modo estrito |
| **Ativado em** | 2026-07-20T03:07:34Z (OPS-MIGRATIONS-03D) |
| **Evidência** | `endpoint dedicado=true` · `migrations pendentes: 0` · `Build successful` em **2 deploys** com saída idêntica |

Diagnóstico encerrado: Render → banco **funciona**; a falha histórica era o caminho IPv6 do GitHub Actions. Ver [[../mapas/decisions/ADR-006-migrations]] e [[../../../brain/plans/OPS-MIGRATIONS-03D-plano]] § ENCERRAMENTO.

**Links:** [[technical/ci-cd]] · [[technical/deploy]]

---

## Banco

| Indicador | Status | Detalhe |
|---|---|---|
| **Conectividade** | 🟢 OK | Supabase pooler sa-east-1 |
| **Schema** | 🟢 Alinhado | Migrations aplicadas pelo gate do deploy (não mais manuais via MCP) |
| **RLS** | 🟡 23/27 tabelas | Companies + users sem policy |
| **Performance** | 🟡 Sem monitoramento | Sem slow query log |
| **Backup** | 🟢 Local + B2 | `verified=true` |

**Links:** [[technical/banco]] · [[maps/multgestor-core/core/banco-de-dados]]

---

## Backup

| Indicador | Status | Detalhe |
|---|---|---|
| **Local** | 🟢 Ativo | Dump diário 02:00 (648KB) |
| **Externo (B2)** | 🟢 Validado | `verified=true`, sha1 match |
| **Scheduler** | 🟢 State=Ready | Task Scheduler, 0 missed |
| **Restore** | 🟢 Testado | Restore-check 2026-06-17 |
| **Alerta** | 🔴 Não configurado | A-018 — backlog |
| **Retenção** | 🟢 ≥ 7 dias | 7 dumps na rotação |

**Links:** [[living-os/02-painel-executivo]] · [[audits/AUDITORIA-BACKUP-GOVERNANCA-PROVA-VIVA-2026-06-22]]

---

## RLS (Row-Level Security)

| Indicador | Status | Detalhe |
|---|---|---|
| **RLS ENABLE** | 🟢 23/27 tabelas | Ativo na maioria |
| **Companies policy** | 🔴 Ausente | Maior gap de segurança |
| **Users policy** | 🔴 Ausente | Maior gap de segurança |
| **WITH CHECK** | 🔴 Todas sem | Escrita cross-tenant não bloqueada |
| **Runtime role** | 🔴 BYPASSRLS | Role `postgres` bypassa RLS |

**Links:** [[technical/rls]] · [[maps/multgestor-core/seguranca/rls-seguranca]] · [[decisoes-arquiteturais#ADR-06]]

---

## Agenda (Booking Engine)

| Indicador | Status | Detalhe |
|---|---|---|
| **Booking público** | 🟢 Online | GET validado, POST funcional |
| **Agendamento online** | 🟢 Ativo | Fluxo completo |
| **Confirmação WhatsApp** | 🟡 Mock ativo | Meta API infra existe |
| **Lembrete** | 🟢 Job ativo | AppointmentReminderJob |
| **Engine** | 🟢 19 funções puras | Reutilizável (Barber + Clima) |

**Links:** [[maps/multgestor-core/capabilities/agenda]] · [[technical/workers]]

---

## CRM (Clientes)

| Indicador | Status | Detalhe |
|---|---|---|
| **Cadastro clientes** | 🟢 Funcional | CRUD completo |
| **Histórico** | 🟢 Ativo | Appointment history |
| **Segmentação** | ⚪ Não implementado | Sem CRM formal |
| **Marketing** | ⚪ Não implementado | Sem campanhas |
| **LGPD** | 🔴 Sem compliance | [[strategy/compliance-intelligence]] |

**Links:** [[maps/multgestor-core/capabilities/clientes]]

---

## Atendimento

| Indicador | Status | Detalhe |
|---|---|---|
| **Canal suporte** | 🔴 Não definido | Sem Zendesk/WhatsApp/Email |
| **FAQ** | ⚪ Não existe | |
| **Runbook incidentes** | 🔴 Não documentado | exceto backup-restore |
| **SLA** | ⚪ Não definido | |

**Links:** [[ops/playbooks]] · [[ops/routines]]

---

## Caixa (Financeiro)

| Indicador | Status | Detalhe |
|---|---|---|
| **Vendas** | 🟢 Funcional | Caixa operacional |
| **Comissões** | 🟢 Ativo | Cálculo de comissões |
| **Relatórios** | 🟡 Parcial | Relatórios básicos |
| **Billing** | 🟡 Parcial | AbacatePay + Kiwify |
| **Trial → Pago** | 🔴 Não testado | Fluxo não validado |
| **Feature gate** | 🔴 Inexistente | Inadimplente não bloqueado |

**Links:** [[maps/multgestor-core/capabilities/financeiro]] · [[maps/multgestor-core/capabilities/estoque]]

---

## Analytics

| Indicador | Status | Detalhe |
|---|---|---|
| **Métricas de uso** | ⚪ Não implementado | |
| **MRR/Churn** | ⚪ Não calculado | |
| **Dashboards** | ⚪ Não existem | |
| **Eventos outbox** | 🟢 15 handlers | `failed=0` |

**Links:** [[technical/observabilidade]] · [[technical/eventos]]

---

## Master (Admin)

| Indicador | Status | Detalhe |
|---|---|---|
| **Painel master** | 🟢 Existe | `master-panel-clean` (PR #12) |
| **Isolamento** | 🟢 OK | Master Admin isolado de tenants |
| **Auditoria** | 🟡 Parcial | Logs de ação master |

**Links:** [[maps/multgestor-core/core/multi-tenant]] · [[technical/seguranca]]

---

## JoeFelipe Agent

| Indicador | Status | Detalhe |
|---|---|---|
| **Agente pessoal** | 🟢 V1 ativo | `tools/joefelipe-agent/` |
| **Safety tests** | 🟢 23/23 verdes | PR #13 mergeado |
| **Painel** | 🟢 Localhost:3333 | HTML panel |
| **Modo** | 🟢 READ_ONLY | V1 — leitura apenas |

**Links:** [[agents/joefelipe-agent]] · [[agents/joefelipe-personal-operating-agent]]

---

## Comercial

| Indicador | Status | Detalhe |
|---|---|---|
| **Piloto pago** | 🟡 6/13 critérios | Não pronto |
| **Self-service** | 🔴 0/7 critérios | Longe |
| **Escala multi-nicho** | ⚪ 0/6 critérios | Visão |
| **Landing page** | 🟢 Existe | `barbergestor.com.br` |
| **Planos definidos** | 🟡 Starter/Pro | Tabelas existem |
| **Precificação** | 🟡 Definida | Não testada |

**Links:** [[prontidao-comercial]] · [[strategy/product-futurist-engine]] · [[strategy/niche-radar]]

---

## Roadmap

| Camada | Status | Progresso |
|---|---|---|
| **Camada 1 — Fundação Segura** | 🟡 Em andamento | 7/14 (50%) |
| **Camada 2 — Produto Vendável** | 🟡 Em planejamento | 6/13 (46%) |
| **Camada 3 — Escala Multi-Nicho** | ⚪ Visão | 0/6 (0%) |

**Links:** [[living-os/05-proxima-melhor-acao]] · [[strategy/strategic-decision-log]]

---

## Knowledge OS

| Indicador | Status | Detalhe |
|---|---|---|
| **Health Score Global** | 🟡 72/100 | 152/225 pontos |
| **Arquitetura** | 🟢 13/15 | Bem documentada |
| **Agentes** | 🟢 15/15 | Completo |
| **Prompts** | 🟢 13/15 | Biblioteca organizada |
| **Auditorias** | 🟢 12/15 | Realizadas |
| **Produto** | 🟡 13/20 | PRDs pendentes |
| **Banco** | 🟡 11/15 | Parcial |
| **Backend** | 🟡 11/15 | Parcial |
| **Roadmap** | 🟡 9/15 | Prazos indefinidos |
| **Runbooks** | 🟡 10/15 | Parcial |
| **Incidentes** | 🟡 8/15 | Prevenção pendente |
| **Riscos** | 🟡 9/15 | Monitoramento pendente |
| **Frontend** | 🟡 8/15 | Componentes não mapeados |
| **PRDs** | 🔴 8/15 | Nenhum PRD preenchido |
| **Skills** | 🔴 5/15 | Não catalogadas |
| **Deploy** | 🔴 7/15 | Rollback não testado |

**Links:** [[saude]] · [[dna]] · [[memoria]]

---

## Relacionamentos

- [[00-HOME]] — Homepage (Knowledge OS 3.0)
- [[status-dinamico]] — Estado detalhado
- [[status-atual]] — Estado canônico
- [[ops/digital-ops-center]] — Digital Operations Center
- [[ops/executive-intelligence]] — Executive Intelligence
- [[saude]] — Scorecards de conhecimento
- [[living-os/02-painel-executivo]] — Painel executivo Living OS
- [[living-os/scorecards/prioridade-scorecard]] — Prioridades
- [[living-os/scorecards/risco-scorecard]] — Scorecard riscos
- [[living-os/decisoes/decisoes-executivas]] — Decisões executivas pendentes
