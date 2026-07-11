# 🔍 Auditoria Arquitetural READ_ONLY — Mapa Mestre de Conclusão

> **Data:** 2026-07-10 · **Modo:** READ_ONLY (nenhum código, banco, deploy, push ou migration alterado)
> **Referência canônica:** [[roadmap/00-MAPA-MESTRE-CONCLUSAO-MULTGESTOR]]
> **Método:** inspeção direta da raiz real (código, migrations, rotas, testes, CI, integrações, git) — **não** confiança em documentação. Cada estado cita evidência por arquivo/rota/migration.
> **Limitações declaradas:** auditoria estática do repositório local. NÃO executei testes, NÃO consultei o banco de produção, NÃO li `.env` reais (apenas estrutura). Afirmações sobre PROD baseiam-se em código + `status-atual.md` (state_version 21) + auditorias anteriores, marcadas como tal. "Funciona em prod" só é afirmado quando há evidência de código + configuração; caso contrário o estado é conservador.

---

## 10.1 Resumo executivo

**Estado geral:** o MultGestor é um monolito modular **substancialmente mais maduro do que o painel `NÃO AUDITADO` sugeria**. As camadas de base (governança, banco/RLS, identidade, back-end, front-end) estão de `VALIDADO EM DESENVOLVIMENTO` a `PRODUÇÃO CONTROLADA`. O gargalo **não é técnico-estrutural** — é **ativação em produção** de capacidades cujo código já existe (pagamento) e **profundidade operacional** de capacidades scaffoldadas (WhatsApp real, IA com ferramentas).

**Riscos de maior prioridade (severidade revista após crítica — ver nota):**
- **P1 operacional — 14 commits locais não publicados** (`origin/main..HEAD = 14`) — inclui feature de IA, `npm audit fix` 13/14 e migration 031. Nada recente chegou à produção; divergência main/origin é o primeiro dominó. *Não é P0 técnico* (sem incidente ativo em prod); **eleva a P0** apenas se o lote contiver correção de segurança explorável em aberto.
- **P1 (bloqueador de lançamento comercial) — entitlement de pagamento não fecha em PROD** — webhook (assinatura+idempotência) pronto, mas a ativação de plano (`companies.plan_type`, tabela `plans`, produtos Kiwify, `VITE_KIWIFY_URL_*`) é config de produção pendente (raiz do incidente D-016). **Eleva a P0** se houver cobrança real via gateway aguardando ativação — **não confirmado** (a única conta premium em prod, JoeFelipe, foi promovida manualmente, não via webhook).

> **Nota de severidade:** a auditoria estática não encontrou evidência de vendas reais via gateway nem de incidente ativo em produção. Sem esse gatilho, ambos são **P1** (bloqueadores de lançamento/operação), não **P0** (risco imediato a dados/dinheiro). A severidade acompanha o ambiente real, não o potencial. Reavaliar se/quando houver cobranças reais.

**Maiores bloqueadores estruturais:**
- WhatsApp resolve para **mock por padrão** em produção (sem token cifrado por tenant) → Fase 9 (IA+WhatsApp) permanece BLOQUEADA.
- IA tem **engine real mas sem catálogo de ferramentas/ações** com permissão → é IA de *insights read-only*, não IA *operacional* no sentido da Fase 8.

**Módulos avançados (mais fortes):** billing (assinatura+idempotência+outbox), RLS runtime (role `app_runtime` NOBYPASSRLS + `withTenantContext`), outbox/event-bus com retry+DLQ, rate-limiting consistente, CI com Postgres+Redis+RLS reais.

**Módulos incompletos:** WhatsApp real (mock em prod), IA operacional (sem tools), homologação (sem staging), escala (sem load test), observabilidade (sem alertas formais).

**Próxima fase recomendada:** **Fase 6 — fechar o circuito comercial de entitlement em produção** (código pronto, dependências 1–5 atendidas, maior alavanca de valor, protege receita). Pré-condição: publicar o batch pendente (gate humano).

---

## 10.2 Matriz de fases

| Fase | Estado auditado | Evidência-âncora | Bloqueador | Próxima ação |
| ---- | --------------- | ---------------- | ---------- | ------------ |
| 0. Diagnóstico | **VALIDADO EM DESENVOLVIMENTO** | este relatório | — | Manter o painel sincronizado |
| 1. Governança | **PRODUÇÃO CONTROLADA** | `.github/workflows/{ci,deploy,security-audit}.yml` | 14 commits unpushed | Publicar batch (gate humano) |
| 2. Banco / RLS | **PRODUÇÃO CONTROLADA** | migrations 024-029; `config/database.js` `poolTenant`/`withTenantContext`; `tests/integration/tenant-isolation-rls.test.js` | writes por `pool.connect` podem bypassar (P1-a) | Migrar writes p/ poolTenant |
| 3. Identidade | **VALIDADO EM DESENVOLVIMENTO** | `auth.routes.js`, `auth.service.js`, migration 030 (refresh rotation) | MFA ausente | Backlog MFA p/ acessos sensíveis |
| 4. Back-end | **VALIDADO EM DESENVOLVIMENTO** | `services/*`, outbox/UoW/event-bus, `rate-limit.middleware.js` | — | Contratos documentados (OpenAPI) |
| 5. Front-end | **PRODUÇÃO CONTROLADA** | `frontend/src/services/api.js` (VITE_API_URL real); pages barber/master/booking | — | Cobrir fluxos de plano/cobrança |
| 6. Pagamentos | **IMPLEMENTADO NÃO VALIDADO** | `billing-manager.js` (assinatura+idempotência+outbox); `providers/{kiwify,abacatepay}.provider.js` | config prod (plans, produtos, env, D-016) | **PRÓXIMA MISSÃO** |
| 7. WhatsApp | **PARCIAL / MOCK em prod** | `whatsapp-resolver.js` (default mock), `whatsapp-provider.js` (meta_cloud_api), `whatsapp-webhook.js` | sem token cifrado por tenant em prod | Onboarding de credenciais por tenant |
| 8. IA Core | **PARCIAL** | `services/llm/LlmService.js` (OpenRouter/Nvidia/Mock + budget/rate/circuit + gate externalCallsEnabled); migration 031; `barber-ai.routes.js` | sem catálogo de ferramentas/ações c/ permissão | Definir tool-calling gated |
| 9. IA + WhatsApp | **BLOQUEADO** | depende de 7 (mock) e 8 (sem tools) | Fases 7 e 8 | Concluir 7 e 8 |
| 10. Painel Master | **VALIDADO EM DESENVOLVIMENTO** | `master.routes.js`, `master.service.js`, `master-finance.service.js`, `pages/master` | dados de custo IA/WhatsApp parciais | Consolidar métricas reais |
| 11. Core reutilizável | **PARCIAL** | `shared/capabilities/*`, `integrations/*`; audit core-vs-nicho 52/100; D-017 implementado | registry dinâmico de rotas (P1) | Decidir D-005 (ClimaGestor) |
| 12. Nichos | **PARCIAL** | BarberGestor completo; ClimaGestor scaffold (`services/clima-core`, migrations clima) | — | Provar reuso via 2º nicho |
| 13. Observabilidade | **PARCIAL** | Sentry (`@sentry/node`), `appLogger`, `/api/health` + `/api/health/deep`, outbox retry+DLQ | sem alertas/SLO formais | Alertas operacionais |
| 14. Segurança final | **PARCIAL** | ciclo XSS fechado, RLS, rate-limits, `npm audit` 13/14; `security-audit.yml` | sem pentest formal | Pentest pós-estabilização |
| 15. Escala | **NÃO EXISTE (inicial)** | apenas `barber-services.perf.test.js` | sem métricas reais | Load/stress test futuros |
| 16. Homologação | **BLOQUEADO** | sem workflow/env de staging | Fases anteriores + staging | Criar ambiente de homologação |

---

## 10.3 Achados por camada

**Governança** — CI (`ci.yml`) com 3 jobs: unit (sem DB), integração (Postgres 16 + Redis 7 + role `app_runtime` least-privilege + RLS), frontend lint+build. Deploy (`deploy.yml`) roda CI → migrations (`continue-on-error`, mitigação Supavisor) → Render + Vercel; `paths-ignore` para `.opencodex/`, `CLAUDE.md`, `AGENTS.md`. `security-audit.yml` semanal (`--audit-level=high`, não bloqueante). **⚠️ Precisão (corrige afirmação genérica):** o `paths-ignore` pertence **só ao deploy**. `ci.yml` dispara em `push: branches: ['**']` **sem** `paths-ignore` → um push contendo apenas `.opencodex/**` **roda CI (testes)**, mas **não** dispara deploy, migrations, Render nem Vercel. Logo: `não altera a aplicação` ✓, `não dispara deploy` ✓, `não dispara CI` ✗ (dispara). **Git: branch `main`, 14 commits à frente de `origin/main`, 7 arquivos não commitados** (docs/roadmap + este ciclo).

**Banco / RLS** — 8 migrations numeradas (024-031) + ~27 nomeadas. RLS: `poolTenant` usa `APP_RUNTIME_URL` (role `app_runtime` NOBYPASSRLS); `withTenantContext` faz `set_config('app.current_company_id', …, true)`. `requireCompany.js` abre conexão via `poolTenant.connect()` e seta o contexto. Fallback documentado: sem `APP_RUNTIME_URL`, RLS fica inerte (kill-switch). Testes de isolamento reais.

**Segurança** — sanitização de chave de API em logs do LlmService (`API_KEY_PATTERN` → `[REDACTED]`); billing com `timingSafeEqual` (AbacatePay); XSS fechado; sem MFA; sem pentest formal.

**Back-end** — modular (controllers/services/repositories/routes), outbox + unit-of-work + event-bus, jobs (trial-email, appointment-reminder), rate-limit por IP e por tenant.

**Front-end** — React 19 + Vite, cliente HTTP real (`api.js` resolve `VITE_API_URL`), páginas barber/master/booking/public, design-system próprio.

**Pagamento** — `BillingManager.handleWebhook`: verifica assinatura → parse/normalize → `requireFinanceTables()` → INSERT idempotente em `payment_gateway_events` (`ON CONFLICT (gateway,event_id) DO NOTHING`) → evento de domínio via outbox → commit; erros marcam `processing_status='error'`. Providers Kiwify (token) e AbacatePay (HMAC-SHA256). Consumers de provisioning presentes.

**WhatsApp** — `WhatsAppResolver` por tenant, cache 5min, token cifrado (`encryption.decrypt`); **cai em mock** se sem config/desabilitado/sem token → em prod é mock. `whatsapp-webhook.js` presente.

**IA** — `LlmService` singleton, providers reais atrás de wrappers (Budget→RateLimit→CircuitBreaker); `externalCallsEnabled` só liga com provider real + API key; fallback seguro sempre (nunca propaga erro do provider); modos no request. Exposição via `barber-ai.routes.js` (auth + módulo + 3 rate-limits, o `/refresh` a 5/h por tenant). Migration 031 `ai_suggestions`. **Não há catálogo de tools/ações executáveis com permissão** → escopo atual = insights read-only.

**Painel Master** — rotas/serviços/páginas presentes; finanças master implementadas.

**Core / Nichos** — `shared/capabilities` (billing) + `integrations` (adapters/providers/consumers/webhooks) = espinha reutilizável; BarberGestor completo, ClimaGestor scaffold. Core Completion Index 52/100 (audit 2026-07-03).

**Observabilidade** — Sentry + logger estruturado + health/deep + outbox retry (`max_retries` → `status='failed'` = DLQ funcional). Sem SLO/alertas formais.

**Deploy** — Render (back) + Vercel (front) via hooks; migrations em CI com `continue-on-error` (drift acumula se não aplicadas via MCP — risco conhecido).

**Escala** — apenas 1 teste de performance; sem load/stress.

---

## 10.4 Lista de mocks

| Mock | Local | Ativo em prod? | Observação |
| ---- | ----- | -------------- | ---------- |
| `mock-whatsapp.provider.js` | `integrations/whatsapp/` | **SIM** (default) | Todo tenant sem token cifrado usa mock — nenhuma mensagem real sai |
| `MockProvider` (LLM) | `services/llm/providers/` | **SIM** salvo API key | `externalCallsEnabled=false` força mock com aviso `[Bloqueado]` |
| `mock-safe-v1` fallback | `LlmService.complete` | Sob falha | Fallback seguro em timeout/429/5xx do provider real |

---

## 10.5 Lista de riscos

- **P1 op. — 14 commits não publicados.** Feature de IA + `npm audit fix` 13/14 + migration 031 presos localmente; divergência main/origin. Eleva a P0 se houver fix de segurança explorável no lote. *Ação:* gate humano `release/push-p0-batch`.
- **P1 (lançamento) — Entitlement de pagamento não fecha em prod.** Webhook grava evento mas ativação de plano depende de config (plans/produtos/env/D-016). Eleva a P0 se houver cobrança real via gateway pendente (não confirmado). *Ação:* próxima missão.
- **P1 — Writes por `pool.connect` podem bypassar RLS.** Reads já enforçados; alguns writes usam pool admin. *Ação:* migrar mutation paths para `poolTenant`/`withTenantContext`.
- **P1 — Migrations em CI com `continue-on-error`.** Drift silencioso se novas migrations não forem aplicadas via MCP. *Ação:* resolver tenant Supavisor sa-east-1 ou gate explícito.
- **P1 — WhatsApp real inexistente por tenant em prod.** Bloqueia Fase 9 e lembretes/confirmações reais.
- **P2 — IA sem ferramentas operacionais.** Não executa ações; apenas sugere/lê. Esperado para o estágio, mas é o gap p/ "IA operacional".
- **P2 — Sem MFA** para acessos sensíveis (master/owner).
- **P3 — Sem alertas/SLO formais**; observabilidade reativa.
- **P3 — Sem ambiente de staging**; homologação (Fase 16) sem trilho.
- **P4 — Sem load/stress test**; capacidade real desconhecida.

---

## 10.6 Dependências externas

| Serviço | Finalidade | Ambiente | Status código | Risco |
| ------- | ---------- | -------- | ------------- | ----- |
| Supabase (Postgres) | Banco multi-tenant + RLS | prod (pooler sa-east-1) | Integrado; migrations via MCP | Supavisor rejeita tenant → migrations manuais |
| Render | Deploy backend | prod | Hook de deploy no CI | — |
| Vercel | Deploy frontend | prod | Deploy no CI | — |
| Kiwify | Gateway de assinatura | prod (config pendente) | Provider + webhook prontos | Produtos/`VITE_KIWIFY_URL`/secret pendentes |
| AbacatePay | Gateway (PIX) | — | Provider + HMAC prontos | Config de secret |
| Resend | E-mail transacional | prod | `providers/email` | — |
| OpenRouter / Nvidia NIM | LLM | opcional | Providers reais atrás de gate | Custo; só liga com API key |
| Meta Cloud API (WhatsApp) | Mensageria | não conectado | Provider pronto, sem credenciais | Prod usa mock |
| Backblaze B2 | Backup externo | prod | Rotina diária ativa | Objeto 0 bytes a limpar |
| Sentry | Erros | prod | `@sentry/node` | — |

---

## 10.7 Próxima missão recomendada

**Nome:** `fase6/ativacao-entitlement-pagamento-prod` — Fechar o circuito de webhook → ativação de plano → liberação de recursos em produção.

**Justificativa:** o código de recepção (assinatura + idempotência + outbox) está pronto e validado em estrutura; o que falta é a ponta que **transforma o evento de pagamento em acesso liberado** (`companies.plan_type`, tabela `plans`, produtos no gateway, env no Vercel). É a maior alavanca de valor (destrava receita), tem todas as dependências arquiteturais (Fases 1-5) atendidas e protege o negócio contra o incidente D-016.

**Dependências:** já atendidas (banco, auth, organizações, back-end, event-bus, billing manager). **Pré-condição:** publicar o batch de 14 commits (gate humano `release/push-p0-batch`) — sem isso nada recente chega ao ambiente.

**Arquivos envolvidos:** `shared/capabilities/billing/billing-manager.js`, `integrations/consumers/billing-provisioning.consumer.js`, `services/company-plan.service.js`, migration de `plans`, config Vercel (`VITE_KIWIFY_URL_*`), secrets Kiwify.

**Riscos:** liberar acesso sem confirmação segura (deve ser sempre via webhook validado, nunca por retorno de página); duplicidade (mitigada por idempotência existente).

**Testes:** integração do consumer (evento pago → `plan_type` ativado → módulo barber liberado); teste de duplicata; teste de assinatura inválida → 401.

**Critérios de conclusão:** pagamento de teste real (sandbox) → webhook validado → assinatura registrada → recurso liberado → evento auditado; sem regressão nos testes RLS/outbox.

**O que desbloqueia:** Fase 16 (homologação comercial), lançamento controlado, e a operação de cobrança que sustenta os demais nichos.

**Missão paralela segura (não bloqueia):** onboarding de credenciais WhatsApp por tenant (Fase 7) — desacoplado, começa a destravar a Fase 9.

---

## Ordem recomendada das próximas missões

1. **[gate humano]** Publicar batch pendente (`release/push-p0-batch`) — resolve P0 governança.
2. **`fase6/ativacao-entitlement-pagamento-prod`** — resolve P0 receita (código pronto).
3. **`fase2/writes-via-poolTenant`** — fecha P1-a (bypass de RLS em writes).
4. **`fase7/onboarding-credenciais-whatsapp-tenant`** — destrava WhatsApp real (paralelizável).
5. **`fase8/tool-calling-gated`** — dá ferramentas à IA (rumo à IA operacional).
6. **`fase9/ia-whatsapp-integracao`** — só após 7 e 8.

---

*Fim da auditoria READ_ONLY 2026-07-10. Nenhum arquivo de código, migration, banco ou deploy foi alterado. Entregáveis desta auditoria: este relatório + atualização do painel de estado no Mapa Mestre (Seção 15).*
