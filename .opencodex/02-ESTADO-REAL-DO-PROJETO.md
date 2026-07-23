---
tipo: estado
projeto: MultGestor
versao_arquitetural: v23
data: 2026-07-23
atualizado_por: KNOWLEDGE-001
regra: "Fonte canônica do ESTADO REAL do projeto. Atualizado após cada missão grande. Evidência prevalece sobre documentação; ausência de evidência = ausência de comprovação."
---

# 🗺️ Estado Real do Projeto — MultGestor (v23)

> Resumo executivo de uma página está em [[PROJECT-SNAPSHOT]]. Este documento é a versão detalhada e evidenciada. Estado operacional de máquina (YAML de fila/agentes) permanece em [[projetos/multgestor/status-atual]].

## Identidade
- **Projeto:** MultGestor — SaaS multi-tenant, Core reutilizável + nichos.
- **Versão arquitetural:** v23 · **Data:** 2026-07-23.
- **Nicho piloto em produção:** BarberGestor. **Segundo nicho:** ClimaGestor (scaffold).
- **origin/main:** `7a313fd` (R-003 mergeado e deployado).

## Fundação (Core)

| Camada | Estado | Evidência |
|---|---|---|
| Governança / Knowledge OS | ✅ | Constitution + Atlas + `.opencodex/rules/`; esta consolidação (KNOWLEDGE-001) |
| CI | ✅ | `ci.yml` — unit + integração (Postgres efêmero + role `app_runtime` NOBYPASSRLS) + lint |
| Deploy | ✅ | Render (back) + Vercel (front); gated por CI; `paths-ignore` cobre `.opencodex/**`, `.opencode/**`, `docs/**` |
| Migrations | ✅ | `buildCommand = npm install && npm run migrate:prod` — automáticas, bloqueantes, estritas, idempotentes (OPS-MIGRATIONS-03D; auditado em OPS-MIGRATIONS-001) |
| Banco / Multi-tenant | ✅ | RLS runtime ativo via role `app_runtime` NOBYPASSRLS (`poolTenant`); `TENANT-001/002` validados em CI |
| RLS rotas públicas | ✅ | `TENANT-003A` — booking público roda em contexto de tenant (`runPublicTenantOperation`) |
| Backend | ✅ | modular; outbox/eventos; rate limiting; billing pluggável (kiwify/abacatepay) |
| Segurança de rota | ✅ | R-003 — webhooks públicos com controle de abuso; rotas de IA/booking já limitadas |
| Observabilidade | 🟡 | Sentry + logs estruturados + `/api/health/deep`; sem SLO/alertas formais |
| Backup | ✅ | local + externo B2 validado (2026-06-22) |

## Produto (BarberGestor) — funcional em código, falta fechar o comercial

| Área | Progresso | Situação |
|---|---|---|
| Infraestrutura | ~95% | Fundação sólida (ver acima) |
| Backend | ~95% | Módulos completos; produção não medida (L-1) |
| Frontend | ~80% | SPA React; `Barber.jsx` monolítico (4.990 linhas, débito) |
| Fluxo operacional | ~60% | Completo em código; uso real/produção não medido |
| Pagamentos / Entitlement | ~35% | Código pronto + gating **genérico** (D-04); falta config externa (Kiwify plans/produtos, `VITE_KIWIFY_URL_*`) + evidência de prod → **não vendável ainda** |
| WhatsApp | ~30% | Provider real existe; em produção está **MOCK** (`whatsapp-mock`) |
| IA operacional | ~10% | `LlmService` com budget/rate/circuit; sem catálogo de tools gated |

> Percentuais são leitura qualitativa de maturidade, não medição formal.

## Bloqueios reais (externos — não resolvíveis só com código)

| Bloqueio | Efeito | Natureza |
|---|---|---|
| Supabase MCP `Unauthorized` | Impede inventário de RLS em produção (`TENANT-003`) e verificação de prod | Acesso/credencial |
| Billing — config Kiwify + secrets | Impede ativar cobrança real (fecha circuito comercial) | Externo + humano |
| TLS do banco sem validação de cert | MITM teórico (`SEC-DATABASE-TLS-001`, aberto) | Requer CA + secret |

## Débitos técnicos registrados (não bloqueiam)
- Timeout próprio do runner de migrations no caminho de produção (só o CI tem teto).
- `schema_migrations` sem metadados (commit/ambiente/executor).
- `payment_gateway_events` sem policy RLS (`BILLING-002`).
- Redis não provisionado em produção (rate limit in-memory por instância) — decisão ADR-REDIS aprovada, não provisionada.
- `Barber.jsx` (4.990 linhas) — débito de manutenção.
- Guards anti-produção de teste duplicados (`jest.setup.js` / `test-db.js`) — consolidar em módulo único.

## Timeline (julho/2026)
```
07-16  Matriz 12.1A + OPS-MIGRATIONS-01 (incógnita de migrations)
07-20  OPS-MIGRATIONS-03D — migrations de produção automáticas e bloqueantes
07-20  ADR-007/008/009 — Booking Engine rebaixado (não promovido ao Core)
07-21  TENANT-003A — rotas públicas de booking com tenant/RLS (deploy live)
07-22  paths-ignore fix (#72); OPS-MIGRATIONS-001 (auditoria do pipeline); ADR-006 atualizado
07-23  R-003-WEBHOOKS — webhooks públicos com controle de abuso (deploy live)
07-23  KNOWLEDGE-001 — consolidação documental (esta missão)
```

## R-003-WEBHOOKS — registro de conclusão
```
Estado:      IMPLEMENTADO · TESTADO · MERGEADO · DEPLOYADO · VALIDADO EM PRODUÇÃO
Commit:      7a313fd (PR #73)
Deploy:      dep-d9glrj3eo5us73ccc440 · live
Migrations:  pendentes 0
Health:      healthy · database ok (177 ms)
Evidência:   [[auditorias/multgestor/2026-07-22-r003-webhooks-abuse-hardening]]
```

## Próxima prioridade ESTRATÉGICA
**Transformar o BarberGestor em produto vendável** — fechar o circuito comercial (ativação de billing em produção). Depende de config externa (Kiwify) + secrets = ação humana.

## Próxima missão EXECUTÁVEL
A de maior rank **desbloqueada** no backlog ([[projetos/multgestor/matriz-consolidacao-core|matriz ANEXO F]]). Com RLS-prod (sem acesso a banco), billing (externo) e R-003 (concluído) fora da fila executável imediata, os candidatos código-side são: escopo de auth por módulo (`IDENT-002`), trilha de auditoria unificada (`AUDIT-001`), gate de segurança bloqueante (`SEC-003`), decomposição de `Barber.jsx`. **Regra:** eleger por rank + desbloqueio real, não por severidade isolada.

## Relações
- [[PROJECT-SNAPSHOT]] · [[projetos/multgestor/status-atual]] · [[projetos/multgestor/matriz-consolidacao-core]]
- [[projetos/multgestor/arquitetura-canonica/00-LEIA-PRIMEIRO]] · [[projetos/multgestor/roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR]]
