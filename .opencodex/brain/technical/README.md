# Technical Brain — Second Brain V2

> **Status:** OFICIAL • VIVO
> **Atualizado:** 2026-07-04
> **Propósito:** Área exclusiva de Engenharia — arquitetura, infra, segurança, deploy e operações.

---

## Índice

| Documento | Propósito |
|---|---|
| [[technical/arquitetura\|Arquitetura]] | Arquitetura geral do sistema |
| [[technical/frontend\|Frontend]] | React 19 SPA |
| [[technical/backend\|Backend]] | Node/Express 5 API |
| [[technical/banco\|Banco]] | PostgreSQL + Supabase |
| [[technical/infra\|Infra]] | Infraestrutura e cloud |
| [[technical/seguranca\|Segurança]] | Práticas e políticas de segurança |
| [[technical/ci-cd\|CI/CD]] | Pipeline de integração e deploy |
| [[technical/deploy\|Deploy]] | Estratégia e processo de deploy |
| [[technical/performance\|Performance]] | Métricas e otimizações |
| [[technical/observabilidade\|Observabilidade]] | Logs, métricas, tracing |
| [[technical/workers\|Workers]] | Jobs assíncronos e background |
| [[technical/integracoes\|Integrações]] | Sistemas externos |
| [[technical/eventos\|Eventos]] | Event-driven architecture |
| [[technical/rls\|RLS]] | Row-Level Security |
| [[technical/rate-limit\|Rate Limit]] | Controle de abuso |
| [[technical/storage\|Storage]] | Armazenamento de arquivos |
| [[technical/DEPENDENCY-MAP\|Dependency Map]] | Mapa completo de dependências |

---

## Stack

| Camada | Tecnologia | Status |
|---|---|---|
| Frontend | React 19 + Vite | 🟢 Produção |
| Backend | Node 18 + Express 5 (CommonJS) | 🟢 Produção |
| Banco | PostgreSQL 17 (Supabase) | 🟢 Produção |
| Cache | Redis 7 (fallback in-memory) | 🟡 Parcial |
| Eventos | In-memory EventBus + Outbox durável | 🟢 Produção |
| Deploy | Vercel (front) + Render (back) | 🟢 Ativo |
| Monitoramento | Sentry + Pino | 🟢 Ativo |

---

## Relacionamentos

- [[product/README]] — O Product Brain define o que o Technical Brain implementa
- [[maps/multgestor-core/MAPA-MULTGESTOR-CORE]] — Mapa vivo do Core
- [[maps/multgestor-core/core/backend]] — Backend detalhado
- [[maps/multgestor-core/core/frontend]] — Frontend detalhado
- [[maps/multgestor-core/core/banco-de-dados]] — Banco detalhado
- [[architecture-decisions]] — ADRs vinculantes
- [[capabilities-map]] — Status das capacidades
- [[ops/README]] — Operações e runbooks
- [[product/prds/README]] — PRDs que este technical brain implementa
