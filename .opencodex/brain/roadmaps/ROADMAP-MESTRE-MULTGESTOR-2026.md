# 🗺️ Roadmap Mestre MultGestor — 2026

> **Criado:** 2026-06-18 · **Autor:** Claude Code (Sonnet 4.6), como estrategista de produto/arquitetura/engenharia/operação/segurança/receita
> **Base factual:** `state_version: 13` · auditoria `.opencodex/audits/auditoria-completa-2026-06-18.md` (24 seções, 24 achados) · runbook `.opencodex/brain/runbooks/auditoria-completa-padrao.md` · `.opencodex/brain/capabilities-map.md` (2026-06-07)
> **Status:** PROPOSTA — não commitado, não promovido à fila. Aguarda aprovação humana.
> **Regra de honestidade:** nada aqui é invenção. Cada afirmação de estado tem origem citada (achado A-xxx, commit, arquivo). O que é aspiracional está marcado **[VISÃO — não iniciado]**.

---

## 1. Visão-mãe do MultGestor

```txt
MultGestor é uma plataforma SaaS multi-nicho, multi-tenant, orientada a eventos,
integrações e IA operacional.

BarberGestor é o primeiro vertical ativo, mas o Core precisa sustentar PetGestor,
AutoGestor, AgroGestor, MultAcademy, Barber Store e futuros nichos — sem reescrever
a fundação a cada novo mercado.
```

**O erro a evitar:** virar "só sistema de barbearia". O valor defensável do MultGestor não é a agenda — é o **Core reutilizável** (multi-tenant, event-driven, billing, booking engine, integration layer) que transforma cada novo nicho num *vertical* e não num projeto novo.

**A pergunta que o roadmap responde:**
> Como saímos do estado atual auditado e chegamos a um MultGestor **vendável, seguro, escalável e preparado para vários nichos** — sem quebrar cliente real no caminho?

**Evidência de que a fundação multi-nicho já existe** (`capabilities-map.md`):
- Multi-Tenant Engine — ✅ Produção (`company_id` em toda query)
- Booking Engine reutilizável — ✅ usado por Barber **e** Clima (`shared/capabilities/booking-engine/`)
- Billing/Planos compartilhável — ✅ (`shared/capabilities/billing/`)
- Integration Layer / Channel Adapter — ✅ (`integrations/`)

---

## 2. Estado atual auditado

> Foto oficial em 2026-06-18, `state_version: 13`. Fonte: auditoria completa + capabilities-map.

| Área | Estado atual | Evidência |
|---|---|---|
| Backend Render | 🟢 saudável | `/api/health/deep` → 200 healthy (audit §4) |
| Frontend Vercel | 🟡 parcial — build CI passa, UX não validada em produção | audit §5, §13 |
| Supabase | 🟢 saudável, schema em sync (23 migrations) | audit §6 |
| Backup | 🟡 validado mas **só local** (sem cópia externa) | A-002 / audit §10 |
| Restore | 🟢 evidenciado via MCP (contagens match) | audit §10 |
| EventBus/outbox | 🟢 **A-003 RESOLVIDO** — `failed=0` | commit `642343a`, state_version 13 |
| RLS `companies`/`users` | 🔴 RLS=true mas **0 policies** | A-001 / audit §7 |
| RLS runtime | 🟡 inerte — runtime usa `postgres` (BYPASSRLS) | A-011 / capabilities-map |
| Redis produção | 🔴 não configurado, fallback in-memory | A-004 / audit §4 |
| CI/CD migrations | 🔴 `continue-on-error: true` | A-005 / audit §11 |
| Testes E2E | 🔴 ausente; GET público validado só manualmente | A-008/A-009 / audit §11 |
| Email (Resend) | 🟢 configurado | audit §4 |
| WhatsApp | ⚠️ **divergência:** capabilities-map diz "Produção"; health check diz **mock** | A-010 vs capabilities-map → decisão pendente §18 |
| Billing | 🟡 Kiwify/AbacatePay integrados, não testado E2E | A-022 / audit §19 |
| Governança `.opencodex` | 🟢 atualizada, coerente, state_version 13 | audit §3 |
| Verticais | BarberGestor ✅ completo · ClimaGestor 🟡 scaffold | capabilities-map |

**Veredito da auditoria base (2026-06-18):** `APROVADO PARA PRÓXIMA MISSÃO — COM BLOQUEIOS P1 CONHECIDOS`.

---

## 3. Veredito estratégico atual

```txt
VEREDITO ESTRATÉGICO 2026-06-18:

FUNDAÇÃO SÓLIDA, PRODUÇÃO SAUDÁVEL, MAS AINDA NÃO VENDÁVEL COM SEGURANÇA.

O projeto tem arquitetura correta (multi-tenant real, event-driven, capabilities
reutilizáveis) e produção operante. Porém 4 riscos P1 impedem vender para cliente
pagante sem risco operacional ou de dados:

  1. Backup só local      → perda do HD = perda de todos os backups (A-002)
  2. RLS companies/users   → defesa em profundidade ausente nas 2 tabelas-mãe (A-001)
  3. Redis ausente em prod → rate limit/cache voláteis a cada cold start (A-004)
  4. Migrations silenciosas → deploy prossegue com migration falhada (A-005)

E um bloqueador de confiança:
  5. Sem E2E do fluxo público → não há rede de segurança contra regressão (A-008/9)

CAMINHO: fechar a Camada 1 (Fundação Segura) ANTES de investir em produto/receita.
Vender sobre fundação frágil multiplica o custo de cada bug por cada cliente real.

PRÓXIMO PASSO LÓGICO: ops/backup-external-copy (menor blast radius, maior redução
de risco catastrófico).
```

---

## 4. Princípios de execução

1. **Auditoria antes de opinião.** Cada missão nasce de um achado com evidência (A-xxx), não de palpite.
2. **Uma missão por vez.** A fila `.opencodex` é serial. `current-task.md` idle = pode promover; ocupado = espera.
3. **Fundação antes de receita.** Não vender sobre risco P1 aberto. Segurança/backup/CI são pré-requisito, não "depois".
4. **Gate de entrada explícito.** Toda missão declara: arquivos permitidos, ambiente, gate de entrada, critério de aceite, critério de rollback, evidências obrigatórias.
5. **Dry-run antes de escrita em dado real.** Padrão consagrado em `ops/reconcile-orphaned-outbox-messages`: SELECT → backup verificado → UPDATE → verificação.
6. **Sem push/merge/deploy sem aprovação humana.** O agente nunca cria/troca branch; nunca `git clean`. (Incidente 2026-06-04.)
7. **Core vs Vertical.** Toda feature pergunta: "isto é Core reutilizável ou específico de barbearia?". Hardcode de `barber` é dívida multi-nicho.
8. **Estado real, sempre.** Governança não pode mentir. Se foi feito só no plano, não está "executado". Divergências são registradas (ex.: WhatsApp mock vs capabilities-map).
9. **Evidência como entrega.** Toda missão fecha com prova: output de comando, contagem de banco, commit, log — não "feito".
10. **Reversibilidade.** Toda missão de risco declara como desfazer. Sem rollback definido, não entra na fila.

---

## 5. Trilhas estratégicas

> Achados da auditoria transformados em trilhas vivas (não ficam soltos).

| Achado / fato | Trilha estratégica | Camada |
|---|---|---|
| Backup só local (A-002) | **Resiliência operacional** | 1 |
| RLS sem policy companies/users (A-001) + runtime inerte (A-011) | **Segurança multi-tenant** | 1 |
| Redis ausente (A-004) | **Infra de produção** | 1 |
| Migrations continue-on-error (A-005) | **CI/CD confiável** | 1 |
| Sem E2E (A-008/A-009) | **Qualidade e validação de fluxo** | 1→2 |
| UX não testada (A-014 cold start, §13) | **Produto pronto para cliente** | 2 |
| Email OK / WhatsApp mock (A-010) | **Comunicação real** | 2→6 |
| Billing parcial (A-022) | **Receita real** | 3 |
| 90% código barber-specific (A-024) | **Escala multi-nicho** | 5 |
| Capabilities aspiracionais não implementadas | **Automação & IA operacional** | 6 |
| Sem alertas externos (A-018) | **Observabilidade** | 1→7 |
| LGPD não verificada (A-019/A-023) | **Conformidade** | 1→3 |

---

## 6. Roadmap por horizonte

> Janelas a partir de 2026-06-18. Datas são metas de planejamento, não compromissos contratuais.

### 0–7 dias (até 2026-06-25) — Fechamento operacional imediato
- `ops/backup-external-copy` (P1) — elimina single point of failure local
- `security/rls-companies-users-policy` (P1) — fecha gap RLS nas tabelas-mãe
- **Saída:** dois maiores P1 de dados/segurança mitigados.

### 8–15 dias (até 2026-07-03) — Infra e CI confiáveis
- `infra/redis-production-config` (P1) — rate limit/cache persistentes
- `cicd/migrations-fail-fast` (P1, **gated** por OPS-SUPAVISOR — ver §13) — deploy não prossegue com migration falhada
- **Saída:** produção resiliente; pipeline honesto.

### 16–30 dias (até 2026-07-18) — Rede de segurança + produto vendável mínimo
- `e2e-public-booking-validation` (P2, versão automatizada) — testes de integração do fluxo público
- `booking-public-flow-hardening` (P2) — robustez de erros/estados vazios
- `owner-dashboard-minimum` (P2) — painel do dono utilizável
- **Saída:** BarberGestor que uma barbearia usa sem suporte ao lado.

### 31–60 dias (até 2026-08-17) — Comunicação real + receita
- `email-real-production` (P2) — transacional confiável
- `whatsapp-official-decision-or-integration` (P2) — resolver a divergência mock/produção
- `billing-trial-to-paid-flow` (P2) — trial → pago ponta a ponta
- **Saída:** cliente paga e recebe confirmação real.

### 61–90 dias (até 2026-09-16) — Piloto pago + UX
- `kiwify-webhook-e2e` · `feature-gates-by-plan` · `tenant-payment-status-enforcement`
- `frontend-booking-ux-polish`
- **Saída:** primeiro piloto pago controlado; acesso liberado/bloqueado corretamente.

### 90–180 dias (até 2026-12-15) — Operação do negócio + início multi-nicho
- Operação: `cash-sales-commission-hardening`, `stock-basic-flow-validation`, `reports-owner-dashboard`, `customer-history-crm`, `no-show-and-cancellation-policy`
- Multi-nicho: `core-vs-vertical-boundary-map`, `vertical-template-engine`
- **Saída:** MultGestor vira gestão (não só agenda); Core formalmente separado do vertical.

### 180–365 dias (até 2027-06-18) — Diferenciação e escala comercial
- Verticais novos (discovery): `petgestor-discovery`, `autogestor-discovery`, `agrogestor-prd`, `multacademy-learning-engine-prd`
- Automação/IA: `automation-engine-v1`, `customer-retention-automation`, `ai-operational-layer-v1`
- Comercial: precificação, onboarding comercial, métricas de MRR/churn, rotina semanal de auditoria
- **Saída:** plataforma multi-nicho com diferenciação por automação/IA e operação comercial.

---

## 7. Roadmap por prioridade

| Prioridade | Significado (runbook §20) | Itens |
|---|---|---|
| **P0** | Bloqueia produção / perda-vazamento de dados | _Nenhum aberto._ A-003 (era o candidato) foi resolvido. |
| **P1** | Risco sério com mitigação temporária | A-001 RLS companies/users · A-002 backup externo · A-004 Redis prod · A-005 migrations fail-fast |
| **P2** | Importante, não bloqueia tudo | A-006 RLS billing tables · A-007/A-020 CSP · A-008/A-009 E2E · A-010 WhatsApp · A-011 app_runtime · A-014 cold start · billing E2E |
| **P3** | Melhoria / limpeza | A-013 (corrigido) · A-015 ClimaGestor scaffold · A-016 versão semântica · A-017 push branch · A-018 alertas · A-019 PII em logs |
| **P4** | Estratégico / futuro | A-021 POST agendamento prod · A-022 billing E2E prod · A-023 LGPD completa · A-024 multi-nicho |

---

## 8. Roadmap por camada

> 7 camadas. Cada uma é um portão: não se avança com a anterior aberta em P0/P1.

### Camada 1 — Fundação segura  *(não podemos quebrar cliente real)*
backup externo/cloud · restore documentado · RPO/RTO · RLS `companies/users` · revisão role runtime (`app_runtime`) · secrets rotation (deferred) · LGPD mínima · CSP/XSS/CSRF · migrations sem `continue-on-error` · Redis produção · observabilidade mínima (alertas).
**Origem:** A-001, A-002, A-004, A-005, A-007, A-011, A-018, A-019.

### Camada 2 — Produto vendável inicial  *(barbearia usa sem suporte ao lado)*
booking público E2E · cadastro de empresa · serviços · colaboradores · horários · agenda · painel do dono · login/cadastro sem atrito · notificações reais · email real · WhatsApp real ou decisão formal · onboarding simples · fluxo do cliente final · suporte básico.
**Origem:** A-008, A-009, A-010, A-014, audit §5/§13/§19.

### Camada 3 — Receita e cobrança  *(cliente paga e sistema libera/bloqueia)*
trial · plano pago · Kiwify ou AbacatePay/Pix · webhook de pagamento · ativação/bloqueio por plano · feature gates · inadimplência · recibo · planos Starter/Pro · dashboard de assinatura · tenant pago/inativo.
**Origem:** A-022, capabilities-map (billing ✅), audit §19.

### Camada 4 — Operação real do negócio  *(vira gestão, não só agenda)*
caixa · vendas · comanda · comissão · estoque · relatórios · CRM básico · lembretes · cancelamento · reagendamento · no-show · histórico do cliente · painel financeiro · indicadores do dono.
**Origem:** audit §13 (vertical barber completa no front), capabilities-map.

### Camada 5 — Escala multi-nicho  *(plataforma, não sistema preso em barbearia)*
separação Core vs Vertical · template de vertical · capabilities reutilizáveis · nomenclatura sem hardcode `barber` · BarberGestor · ClimaGestor · onboarding por nicho · permissões por capability · planos por vertical.
**Origem:** A-024, capabilities-map.

### Camada 6 — Automação, integrações e IA  *(diferenciação)*
WhatsApp oficial · email transacional · automações · EventBus persistente (já ✅ outbox) · Integration Layer (já ✅) · N8N bridge (se usado) · agente operacional · alertas inteligentes · marketing automation · recuperação de inativos · recomendação de horários · análise de receita · IA de suporte/operação.
**Origem:** capabilities-map (lacunas aspiracionais — **não implementadas**, não tratar como reais).

### Camada 7 — Escala comercial e governança  *(o projeto vira empresa)*
piloto pago · cliente ideal · onboarding comercial · precificação · suporte · documentação · treinamento · métricas (MRR/churn/ativação/funil) · roadmap interno · rotina semanal de auditoria · governança `.opencodex` · fila de missões · critérios de "pronto".

---

## 9. Roadmap técnico

| Camada técnica | Estado | Próximos passos | Origem |
|---|---|---|---|
| **Backend** | 🟢 estrutura limpa (routes→controllers→services→repos) | remover `_archive/legacy`, versão semântica, ativar CSP | A-007, A-016, audit §14 |
| **Frontend** | 🟡 build OK, zero testes, UX não validada | testes de runtime, UX booking, estados vazios | A-008, audit §13 |
| **Supabase/RLS** | 🔴 companies/users sem policy; runtime BYPASSRLS | policies companies/users → RLS billing tables → `app_runtime` em staging | A-001, A-006, A-011 |
| **EventBus/outbox** | 🟢 durável, idempotente, `failed=0` | decidir handler vs descarte p/ `cash_session.*` futuros; tirar `sale.created` da quarentena (fase-c) | resolvido A-003; fase-c backlog |
| **Backup/restore** | 🟡 local diário OK; sem cópia externa | cópia cloud → restore documentado → RPO/RTO formal | A-002, audit §10 |
| **CI/CD** | 🔴 migrations continue-on-error | fail-fast (gated por OPS-SUPAVISOR) → reativar migrations no CI | A-005, OPS-SUPAVISOR |
| **Observabilidade** | 🟡 Pino+Sentry+Prometheus; sem alertas externos | alertas de backup/outbox/uptime; auditar PII em logs | A-018, A-019 |
| **Redis/cache** | 🔴 não configurado em prod | provisionar Redis no Render (ou aceitar+documentar risco) | A-004 |
| **Segurança** | 🟡 XSS resolvido; CSP off; CSRF não auditado | CSP no Helmet; revisar CSRF; brute-force login | A-007, A-020, audit §8 |
| **LGPD** | 🔴 não verificada | exclusão de conta · consentimento · política de privacidade · retenção | A-019, A-023 |

---

## 10. Roadmap de produto

| Domínio de produto | Estado | Próximo passo |
|---|---|---|
| Booking público | 🟡 GET validado manualmente | E2E automatizado + hardening de erros |
| Painel do dono | 🟡 rotas existem (`/barber/*`) | `owner-dashboard-minimum` utilizável |
| Agenda | 🟢 funcional | reagendamento/cancelamento/no-show |
| Serviços | 🟢 15 ativos em prod | validação de edição/desativação |
| Colaboradores | 🟢 filtro bookable correto | UX de gestão |
| Caixa/vendas | 🟡 vertical existe no front | `cash-sales-commission-hardening` |
| Estoque | 🟡 tabelas existem | `stock-basic-flow-validation` |
| Comissões | 🟡 existe | hardening junto com caixa/vendas |
| CRM | 🟡 client notes/events/tags em prod | `customer-history-crm` |
| Relatórios | 🟡 rotas/controllers existem | `reports-owner-dashboard` |
| Notificações | 🟡 email ✅ / WhatsApp mock | email real + decisão WhatsApp |
| Onboarding | 🟢 first-access flow | onboarding por nicho (multi-vertical) |

---

## 11. Roadmap de receita

| Item | Estado | Próximo passo | Evidência |
|---|---|---|---|
| Trial | 🟢 TrialEmailJob ativo | ligar trial ao gate de plano | audit §4 |
| Planos | 🟡 `plans`/`modules` existem | Starter/Pro definidos | audit §7 |
| Billing | 🟡 capability ✅, não testado E2E | `billing-trial-to-paid-flow` | A-022, capabilities-map |
| Kiwify | 🟡 integrado | `kiwify-webhook-e2e` | capabilities-map |
| AbacatePay/Pix | 🟡 provider existe | `abacatepay-pix-evaluation` | capabilities-map |
| Feature gates | 🟡 `requireActivePlan`/`requirePlanFeature` existem | `feature-gates-by-plan` | audit §14 |
| Inadimplência | 🔴 não verificado | política de bloqueio/grace | — |
| MRR | 🔴 não medido | dashboard de assinatura + métrica | — |
| Piloto pago | 🔴 não iniciado | critérios §15 | — |

---

## 12. Roadmap multi-nicho

| Vertical | Estado real | Próximo passo |
|---|---|---|
| **BarberGestor** | 🟢 completo (vertical 1) | manter como referência de "vertical completo" |
| **ClimaGestor** | 🟡 scaffold + agendamento (reusa Booking Engine) | decidir: investir ou congelar |
| **PetGestor** | ⚪ **[VISÃO — não iniciado]** | `petgestor-discovery` |
| **AutoGestor** | ⚪ **[VISÃO — não iniciado]** | `autogestor-discovery` |
| **AgroGestor** | ⚪ **[VISÃO — não iniciado]** | `agrogestor-prd` |
| **MultAcademy** | ⚪ **[VISÃO — não iniciado]** | `multacademy-learning-engine-prd` |
| **Barber Store** | ⚪ **[VISÃO — não iniciado]** | discovery (e-commerce/estoque sobre Core) |
| **Template de vertical** | 🔴 não existe formalmente | `vertical-template-engine` |
| **Capabilities reutilizáveis** | 🟢 Core forte (multi-tenant, booking, billing, integration) | `core-vs-vertical-boundary-map` formaliza fronteira |

> **Honestidade de estado:** apenas BarberGestor e ClimaGestor existem em código (`capabilities-map.md`). Os demais são visão de produto — entram como *discovery/PRD*, não como implementação. O pré-requisito de todos é `core-vs-vertical-boundary-map`.

---

## 13. Dependências e gates

```txt
ops/backup-external-copy
    └── gate: backup diário OK (last-status.json exit_code=0) ✅ já satisfeito

security/rls-companies-users-policy
    └── gate: backup externo ativo (rollback seguro de DDL) ← depende de #1
    └── gate: decisão BYPASSRLS documentada vs policies formais

infra/redis-production-config
    └── gate: decisão custo (Render Redis pago vs aceitar in-memory)
    └── sem dependência técnica de #1/#2

cicd/migrations-fail-fast
    └── ⛔ GATE CRÍTICO: OPS-SUPAVISOR bloqueado (Supavisor sa-east-1 rejeita tenant)
    └── ⛔ GATE: SECURITY-SECRETS-ROTATION pausada — confirmar que nenhum log/CI
        exibirá DATABASE_URL antes de reativar migrations no CI
    └── NÃO remover continue-on-error até essas duas condições

e2e-public-booking-validation (automatizado)
    └── gate: ambiente de teste com banco descartável OU mocks
    └── independe de #1-#4

booking-public-flow-hardening
    └── depende de e2e existir (rede de segurança contra regressão)

email-real-production
    └── gate: Resend já configurado ✅; validar domínio/SPF/DKIM

whatsapp-official-decision-or-integration
    └── ⚠️ resolver divergência: capabilities-map diz "Produção", health diz "mock"
    └── decisão humana: Meta Cloud API real vs manter mock documentado

billing-trial-to-paid-flow
    └── gate: feature gates funcionando; webhook testável
    └── depende de fundação (#1-#4) para cobrar sobre base segura

core-vs-vertical-boundary-map
    └── sem dependência técnica; é discovery/documentação
    └── pré-requisito de TODO vertical novo
```

**Gate-mãe (toda missão):** `current-task.md` idle + working tree sem mudança de código fora de `.opencodex/` + branch correta. (Preflight `.opencodex`.)

---

## 14. Métricas de sucesso

| Categoria | Métrica | Alvo inicial |
|---|---|---|
| **Resiliência** | RPO (perda máxima) | ≤ 24h (já) → ≤ 1h com cópia externa frequente |
| | RTO (tempo de restore) | ≤ 1h documentado e testado |
| | Backups com cópia externa | 100% dos dumps diários |
| **Segurança** | Tabelas críticas com RLS efetivo | companies + users com policy |
| | Vulnerabilidades P0/P1 abertas | 0 antes de piloto pago |
| **Confiabilidade** | Cobertura E2E do fluxo público | booking-info + slots + (POST gated) |
| | Deploy com migration falhada | 0 (fail-fast ativo) |
| | Uptime backend | ≥ 99% (com mitigação cold start) |
| **Produto** | Tempo até primeiro agendamento (onboarding) | < 10 min sem suporte |
| | Cold start percebido | < 1s (warm-up ou paid tier) |
| **Receita** | Trial → pago (conversão) | medível (hoje 0/não medido) |
| | MRR | > R$ 0 (primeiro piloto pago) |
| | Churn | medível e < 10%/mês no piloto |
| **Multi-nicho** | Verticais sobre o mesmo Core | 2 ativos (Barber + 1) sem fork |
| | % código barber-hardcoded | ↓ de ~90% (A-024) |

---

## 15. Critérios de pronto para piloto pago

> Todos obrigatórios. Um "não" = não inicia piloto pago.

- [ ] Backup com **cópia externa** ativa e restore documentado (RPO/RTO) — A-002
- [ ] RLS efetivo em `companies` + `users` OU BYPASSRLS documentado como decisão consciente — A-001
- [ ] Redis em produção OU risco in-memory aceito e documentado — A-004
- [ ] CI **não** faz deploy com migration falhada — A-005
- [ ] E2E mínimo do fluxo público (booking-info + slots) verde em CI — A-008/A-009
- [ ] POST de agendamento testado em produção pelo menos 1x (gated) — A-021
- [ ] Email transacional real confirmado (confirmação chega ao cliente)
- [ ] WhatsApp: decisão formal tomada (real ou mock documentado ao cliente) — A-010
- [ ] Fluxo trial → pago testado E2E (cliente paga, sistema libera) — A-022
- [ ] Feature gate bloqueia tenant inadimplente
- [ ] Política de privacidade + consentimento mínimos (LGPD) — A-023
- [ ] Alerta externo se backup ou outbox falhar — A-018

---

## 16. Critérios de pronto para escala

> Além de "piloto pago", para abrir para muitos clientes / múltiplos nichos.

- [ ] `core-vs-vertical-boundary-map` publicado — fronteira Core/Vertical clara
- [ ] `vertical-template-engine` — novo vertical sem reescrever fundação
- [ ] Pelo menos 2 verticais em produção sobre o mesmo Core, sem fork de código
- [ ] Observabilidade com alertas (backup, outbox, uptime, erro com request-id)
- [ ] MRR/churn/ativação medidos em dashboard
- [ ] Onboarding self-service por nicho (sem suporte manual)
- [ ] Custo por tenant previsível (Supabase/Render/Vercel) sem estourar plano
- [ ] Rotina semanal de auditoria `.opencodex` rodando
- [ ] Runbook de incidente (perda de banco, deploy ruim, vazamento) testado
- [ ] LGPD completa (exclusão de conta, retenção, DPO/canal)

---

## 17. Riscos principais

| Risco | Severidade | Impacto | Mitigação | Origem |
|---|---|---|---|---|
| Perda do HD local = perda de todos backups | **P1** | catastrófico (perda total) | cópia externa (#1) | A-002 |
| RLS inerte → bug de filtro = cross-tenant leak | **P1** | vazamento entre clientes | policies + `app_runtime` | A-001, A-011 |
| Migration falha silenciosa → schema drift em prod | **P1** | dados/código incoerentes | fail-fast (gated) | A-005 |
| Redis ausente → rate limit reseta a cada restart | **P1** | brute-force/abuso facilitado | Redis prod | A-004 |
| Sem E2E → regressão silenciosa no booking | **P2** | cliente não consegue agendar | E2E automatizado | A-008/9 |
| Cold start 4s → cliente acha que quebrou | **P2** | abandono no primeiro uso | warm-up/paid tier | A-014 |
| WhatsApp mock → confirmação não chega | **P2** | cliente sem aviso → no-show | decisão WhatsApp | A-010 |
| Billing não testado E2E → cobra e não libera | **P2** | receita perdida/suporte | billing E2E | A-022 |
| 90% barber-hardcoded → reescrever p/ cada nicho | **P4** | custo de escala alto | boundary map + template | A-024 |
| OPS-SUPAVISOR bloqueia CI de migrations | **infra** | migrations manuais via MCP | resolver tenant sa-east-1 | OPS-SUPAVISOR |

---

## 18. Decisões pendentes

> Decisões humanas que travam ou redirecionam trilhas. Não decididas pelo agente.

1. **RLS companies/users:** criar policies formais **ou** documentar BYPASSRLS como intencional? (afeta `app_runtime` Fase 2/3)
2. **Redis em produção:** pagar Redis no Render **ou** aceitar in-memory e documentar o risco?
3. **WhatsApp — divergência crítica:** `capabilities-map.md` declara "✅ Produção (Meta Cloud API)" mas a auditoria 2026-06-18 (health check) reporta **mock**. Qual é a verdade em produção? Decidir: integrar Meta Cloud API real **ou** corrigir capabilities-map para refletir mock.
4. **OutboxWorker `break` vs `continue`:** gate de `fase-c-integracao-e-testes`. Define se `sale.created` sai da quarentena.
5. **Migrations CI:** quando reativar (depende de OPS-SUPAVISOR + confirmação de que secrets não vazam em log).
6. **ClimaGestor:** investir como 2º vertical real **ou** congelar e priorizar Pet/Auto?
7. **Branch `ops/backup-restore-check`:** push/merge para main? (6+ commits locais não pushed — A-017)
8. **Pagamento primário:** Kiwify (externo) vs AbacatePay/Pix in-app como fluxo principal?

---

## 19. Próximas 10 missões recomendadas

> Formato canônico. **Status sugerido = não promovido.** Promoção à fila exige aprovação humana explícita (princípio #2/#6). Ordem conforme direção aprovada.

### `ops/backup-external-copy`

- **Prioridade:** P1
- **Camada:** 1 — Fundação segura
- **Objetivo:** Adicionar cópia automática do dump diário para destino externo (cloud) ao fluxo já existente, eliminando o single point of failure local.
- **Origem/evidência:** A-002 (audit §10) — "Cópia externa/cloud ❌ AUSENTE — apenas local Windows".
- **Por que vem agora:** Maior redução de risco catastrófico com menor blast radius. Backup local já funciona (`last-status.json` OK, dump 635KB) — só falta redundância off-site.
- **Arquivos permitidos:** `ops/backup/run-backup.ps1`, novo script de upload (ex.: `ops/backup/upload-external.ps1`), `.opencodex/brain/runbooks/backup-restore-plan.md`. **Nenhum** arquivo de código de aplicação.
- **Ambiente:** Local Windows + provedor cloud (Google Drive API / S3 / Backblaze). Credenciais em env file off-repo (padrão `brchk.env`).
- **Gate de entrada:** backup diário local OK (já satisfeito); decisão humana do provedor cloud.
- **Critério de aceite:** dump diário copiado para destino externo automaticamente; verificação de integridade pós-upload; `last-status.json` registra status do upload externo.
- **Critério de rollback:** desabilitar passo de upload no script; backup local permanece intacto (não-destrutivo por design).
- **Evidências obrigatórias:** log de upload bem-sucedido; listagem do arquivo no destino externo; checksum local == remoto.
- **Status sugerido:** PRONTO PARA PROMOÇÃO (não promovido).

### `security/rls-companies-users-policy`

- **Prioridade:** P1
- **Camada:** 1 — Fundação segura
- **Objetivo:** Fechar o gap de RLS nas duas tabelas-mãe: criar policies de isolamento por `company_id` para `companies` e `users`, **ou** documentar formalmente BYPASSRLS como decisão.
- **Origem/evidência:** A-001 (audit §7) — "companies + users com RLS=true mas 0 policies".
- **Por que vem agora:** São as tabelas-raiz do multi-tenant. Sem policy, qualquer migração futura para role não-bypass retorna 0 linhas; e a defesa em profundidade está ausente justo onde mais importa.
- **Arquivos permitidos:** `backend/src/database/*.sql` (nova migration de policies), `docs/SECURITY-TENANT-ISOLATION.md`. Aplicação via MCP **somente após** dry-run + backup externo ativo.
- **Ambiente:** Supabase produção (via MCP) + CI. DDL — exige cuidado redobrado.
- **Gate de entrada:** `ops/backup-external-copy` concluído (rollback seguro de DDL); decisão humana #1 (§18) tomada.
- **Critério de aceite:** policies criadas e testadas (SELECT como role não-bypass retorna apenas linhas do tenant) **ou** ADR documentando BYPASSRLS; `tenant-isolation-rls.test.js` cobre companies/users.
- **Critério de rollback:** `DROP POLICY` das policies criadas (DDL reversível); estado anterior é "RLS enabled, 0 policies" — restaurável.
- **Evidências obrigatórias:** output de `pg_policies` antes/depois; resultado do teste de isolamento; backup verificado pré-DDL.
- **Status sugerido:** AGUARDA #1.

### `infra/redis-production-config`

- **Prioridade:** P1
- **Camada:** 1 — Fundação segura / infra
- **Objetivo:** Configurar Redis em produção (Render) para rate limiting e cache persistentes, **ou** registrar decisão formal de aceitar o fallback in-memory com mitigações.
- **Origem/evidência:** A-004 (audit §4) — health check: "redis: degraded — não configurado, fallback in-memory ativo".
- **Por que vem agora:** Rate limit volátil facilita brute-force a cada cold start; é pré-requisito de segurança antes de expor a clientes pagantes.
- **Arquivos permitidos:** config de ambiente Render (humano), `backend/src/shared/core/cache/*` apenas se necessário ajuste de conexão, `.opencodex/brain/project-state.md` (registro). Sem mudança de lógica de domínio.
- **Ambiente:** Render (provisionar Redis) + env vars.
- **Gate de entrada:** decisão humana #2 (§18) — custo Redis pago vs aceitar risco.
- **Critério de aceite:** `/api/health/deep` reporta `redis: ok`; rate limit persiste entre restarts; **ou** ADR de aceite de risco com mitigação documentada.
- **Critério de rollback:** remover REDIS_URL → volta ao fallback in-memory (já é o estado atual; sem perda).
- **Evidências obrigatórias:** health check pós-config; teste de persistência de rate limit entre dois restarts.
- **Status sugerido:** AGUARDA decisão #2.

### `cicd/migrations-fail-fast`

- **Prioridade:** P1
- **Camada:** 1 — Fundação segura / CI-CD
- **Objetivo:** Remover `continue-on-error: true` do job de migrations para que deploy **não** prossiga com migration falhada.
- **Origem/evidência:** A-005 (audit §11) — "Migrations com continue-on-error: true — falha não bloqueia deploy".
- **Por que vem agora:** É a causa de drift recorrente (022/023 aplicadas manualmente). Porém **gated** — não pode ser feito antes de resolver OPS-SUPAVISOR.
- **Arquivos permitidos:** `.github/workflows/deploy.yml` (ou `ci.yml`). Apenas o job de migrations.
- **Ambiente:** GitHub Actions + Supabase (pooler sa-east-1).
- **Gate de entrada:** ⛔ OPS-SUPAVISOR resolvido (Supavisor aceita tenant) **E** SECURITY-SECRETS-ROTATION confirmada (DATABASE_URL não vaza em log de CI). Sem isso, **não executar** (project-state deploy_blockers).
- **Critério de aceite:** migration falhada faz o job falhar e bloqueia deploy; migration OK segue normal; nenhum secret em log.
- **Critério de rollback:** restaurar `continue-on-error: true` (1 linha).
- **Evidências obrigatórias:** run de CI com migration intencionalmente quebrada → job vermelho + deploy bloqueado; run normal → verde.
- **Status sugerido:** BLOQUEADO (OPS-SUPAVISOR).

### `e2e-public-booking-validation` *(versão automatizada)*

- **Prioridade:** P2
- **Camada:** 1→2 — Qualidade / produto
- **Objetivo:** Criar testes de integração automatizados do fluxo público (booking-info + available-slots), distintos da validação READ_ONLY manual já concluída em 2026-06-18.
- **Origem/evidência:** A-008/A-009 (audit §11) — "Sem testes E2E; fluxo público sem cobertura automatizada". A validação manual (`next-task.md` anterior) provou que funciona, mas não protege contra regressão.
- **Por que vem agora:** Rede de segurança antes de fazer hardening/UX. Sem ela, qualquer mudança no booking pode quebrar silenciosamente.
- **Arquivos permitidos:** `backend/tests/integration/public-booking*.test.js` (novo), fixtures de teste. Sem mudança de código de produção.
- **Ambiente:** CI (Postgres descartável) + mocks. **Não** contra produção.
- **Gate de entrada:** ambiente de teste com banco descartável disponível.
- **Critério de aceite:** testes verdes em CI cobrindo: booking-info 200, slots 200 com serviceId, 400 sem serviceId, slug inválido tratado; sem skip/xfail.
- **Critério de rollback:** remover arquivos de teste (não afeta produção).
- **Evidências obrigatórias:** run de CI verde; relatório de cobertura dos endpoints públicos.
- **Status sugerido:** PRONTO (após ambiente de teste).

### `booking-public-flow-hardening`

- **Prioridade:** P2
- **Camada:** 2 — Produto vendável
- **Objetivo:** Endurecer o fluxo público: estados vazios claros, mensagens de erro úteis, validação de slug, tratamento de "sem horários/serviço/colaborador".
- **Origem/evidência:** audit §5/§11/§13 — UX não testada; runbook §11 lista casos (slug sem working hours, bookingSettings null, serviceId obrigatório).
- **Por que vem agora:** Depois da rede de segurança (E2E), tornar o fluxo robusto para um cliente real que erra/explora.
- **Arquivos permitidos:** controllers/services do booking público, componentes frontend do fluxo `/agendar/:slug`. Coberto pelos testes da missão anterior.
- **Ambiente:** dev local + CI.
- **Gate de entrada:** `e2e-public-booking-validation` automatizado verde (proteção contra regressão).
- **Critério de aceite:** todos os casos de borda do runbook §11 tratados com resposta clara; testes cobrindo cada caso.
- **Critério de rollback:** reverter commit da missão (feature branch isolada).
- **Evidências obrigatórias:** testes dos casos de borda verdes; screenshots/responses dos estados vazios.
- **Status sugerido:** AGUARDA E2E.

### `email-real-production`

- **Prioridade:** P2
- **Camada:** 2→6 — Comunicação real
- **Objetivo:** Confirmar e endurecer o envio transacional real via Resend (domínio verificado, SPF/DKIM, templates de confirmação/lembrete chegando ao cliente).
- **Origem/evidência:** audit §4 (email_provider: ok — resend) + §19 (notificações email ✅) — configurado mas entrega real ao cliente não auditada E2E.
- **Por que vem agora:** Email é o canal de notificação que **já funciona**; consolidá-lo antes da decisão de WhatsApp dá ao piloto pago uma via de comunicação confiável.
- **Arquivos permitidos:** `backend/src/services/*email*`, templates, config Resend (domínio). Sem mudança de domínio de negócio.
- **Ambiente:** produção (Resend) + DNS do domínio.
- **Gate de entrada:** Resend configurado (✅); acesso ao DNS do domínio.
- **Critério de aceite:** email de confirmação de agendamento chega à caixa de entrada (não spam) em teste real; SPF/DKIM válidos.
- **Critério de rollback:** reverter config de template/domínio; envio continua via Resend.
- **Evidências obrigatórias:** email recebido (print/headers); validação SPF/DKIM; log de envio.
- **Status sugerido:** PRONTO.

### `whatsapp-official-decision-or-integration`

- **Prioridade:** P2
- **Camada:** 2→6 — Comunicação real
- **Objetivo:** Resolver a **divergência** entre `capabilities-map.md` ("Produção, Meta Cloud API") e auditoria ("mock"), e decidir: integrar Meta Cloud API real **ou** documentar mock formalmente ao cliente.
- **Origem/evidência:** A-010 (audit §4 "whatsapp_provider: degraded — mock") **vs** capabilities-map (WhatsApp ✅ Produção). Conflito de estado a resolver.
- **Por que vem agora:** Confirmação de agendamento por WhatsApp evita no-show. Antes de prometer ao cliente, é preciso saber o estado real e decidir.
- **Arquivos permitidos:** `backend/src/integrations/whatsapp/*`, `consumers/appointment-integration.consumer.js`, capabilities-map.md (corrigir estado). Decisão registrada como ADR.
- **Ambiente:** produção (Meta Cloud API) — **só** se a decisão for integrar.
- **Gate de entrada:** decisão humana #3 (§18); auditoria do estado real do provider em produção.
- **Critério de aceite:** ou WhatsApp real envia confirmação (teste E2E), ou ADR documenta mock + capabilities-map corrigido para refletir a verdade.
- **Critério de rollback:** manter mock (estado atual); sem impacto em produção.
- **Evidências obrigatórias:** estado real do provider verificado; mensagem recebida (se integrado) ou ADR (se mock).
- **Status sugerido:** AGUARDA decisão #3.

### `billing-trial-to-paid-flow`

- **Prioridade:** P2
- **Camada:** 3 — Receita e cobrança
- **Objetivo:** Validar/endurecer o fluxo trial → pago ponta a ponta: cliente assina, webhook processa, sistema ativa o plano e libera features.
- **Origem/evidência:** A-022 (audit §19) — "Fluxo Kiwify/billing não testado E2E"; capabilities-map (billing ✅ mas sem prova E2E).
- **Por que vem agora:** É a ponte entre "produto vendável" e "receita real". Só faz sentido cobrar sobre a fundação P1 fechada.
- **Arquivos permitidos:** `backend/src/integrations/billing/*`, `shared/capabilities/billing/*`, webhooks, testes. Sem tocar dados de produção sem dry-run.
- **Ambiente:** staging/sandbox dos provedores (Kiwify/AbacatePay) + CI.
- **Gate de entrada:** fundação P1 (#1-#4) encaminhada; feature gates funcionando.
- **Critério de aceite:** assinatura sandbox → webhook → plano ativo → feature liberada, testado E2E; inadimplência → bloqueio.
- **Critério de rollback:** feature branch revertível; sem mudança em tenant real de produção.
- **Evidências obrigatórias:** teste E2E do ciclo trial→pago verde; log do webhook; estado do tenant antes/depois.
- **Status sugerido:** AGUARDA fundação.

### `core-vs-vertical-boundary-map`

- **Prioridade:** P3 (estratégico, habilita P4 multi-nicho)
- **Camada:** 5 — Escala multi-nicho
- **Objetivo:** Documentar formalmente a fronteira Core vs Vertical: o que é capability reutilizável vs o que é específico de barbearia, mapeando o caminho para remover hardcode `barber`.
- **Origem/evidência:** A-024 (audit §15) — "~90% código barber-specific"; capabilities-map (Core forte, mas fronteira não formalizada).
- **Por que vem agora:** É discovery/documentação (risco zero) e é **pré-requisito** de qualquer vertical novo. Fazer cedo evita reescrever a cada nicho.
- **Arquivos permitidos:** `.opencodex/brain/capabilities-map.md`, novo doc `.opencodex/brain/roadmaps/core-vs-vertical-boundary.md`. **Somente documentação.**
- **Ambiente:** nenhum (análise de código read-only + escrita de doc).
- **Gate de entrada:** nenhum técnico.
- **Critério de aceite:** mapa publicado listando cada módulo como Core/Vertical/Híbrido, com plano de extração de hardcode `barber` e contrato de "template de vertical".
- **Critério de rollback:** remover o doc (não afeta código).
- **Evidências obrigatórias:** mapa com inventário de arquivos `barber_*`/`controllers/barber/`; classificação Core vs Vertical.
- **Status sugerido:** PRONTO (risco zero).

---

## 20. Plano de execução imediato

```txt
AGORA (sem promover automaticamente — aguardando aprovação humana):

  1. Normalizar a fila (pré-passo, não-missão):
     - next-task.md ainda contém ops/reconcile (concluído). Antes de promover #1,
       repromover next-task.md com ops/backup-external-copy.
     - Atualizar current-task.md (lista de promoção desatualizada — cita card antigo).

  2. Decisões humanas que destravam a sequência (§18):
     - #1 RLS companies/users: policies vs BYPASSRLS documentado
     - #2 Redis: pagar vs aceitar risco
     - #3 WhatsApp: integrar vs documentar mock

  3. Ordem de execução da Camada 1 (Fundação Segura):
     ops/backup-external-copy
       → security/rls-companies-users-policy   (após #1 + backup externo)
       → infra/redis-production-config          (após decisão #2)
       → cicd/migrations-fail-fast              (BLOQUEADO até OPS-SUPAVISOR)

  4. Só então abrir Camada 2 (produto vendável):
     e2e-public-booking-validation (auto) → booking-public-flow-hardening
       → owner-dashboard-minimum → email-real-production

REGRA DE OURO: não vender sobre P1 aberto. Fundação primeiro, receita depois.

NÃO FAZER AGORA: push, merge, deploy, executar missão, promover fila, alterar
banco/código. Este documento é mapa, não execução.
```

---

## Apêndice — Rastreabilidade de evidências

| Afirmação | Fonte |
|---|---|
| state_version 13, A-003 resolvido | `project-state.md`, commit `642343a` |
| 24 achados, veredito P1 | `audits/auditoria-completa-2026-06-18.md` |
| Estrutura canônica de auditoria/missão | `runbooks/auditoria-completa-padrao.md` |
| Core/capabilities reais | `capabilities-map.md` (2026-06-07) |
| Verticais reais (Barber ✅ / Clima scaffold) | `capabilities-map.md` |
| Verticais Pet/Auto/Agro/MultAcademy/Store = visão | ausência em capabilities-map → marcados [VISÃO] |
| Divergência WhatsApp | A-010 (audit) vs capabilities-map |
| OPS-SUPAVISOR / secrets-rotation gates | `project-state.md` deploy_blockers |

> **Fim do Roadmap Mestre.** Documento vivo — revisar a cada auditoria completa ou mudança de `state_version`.
