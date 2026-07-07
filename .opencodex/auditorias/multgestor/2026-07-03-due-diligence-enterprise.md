# DUE DILIGENCE ENTERPRISE — MultGestor — 2026-07-03

> Pergunta-mãe: **"O que exatamente impede o MultGestor de vender em escala amanhã?"**
> Base: auditoria completa 2026-07-02 + sprint P0 batch 1+2 (29 commits locais, `ace2d05`..`7038f89`,
> nenhum push) + smoke local 20/20 (venda sob app_runtime + rotação/revogação de sessão ao vivo +
> isolamento cross-tenant A/B) + verificação de billing/self-service/IA de 2026-07-03.

### Matriz de evidências (escala usada em todo o documento)

| Tag | Definição |
|---|---|
| **VALIDADO** | Confirmado em produção real (health prod, endpoint prod, incidente real ocorrido) |
| **[FATO]** | Confirmado por código, teste automatizado ou execução local nesta sessão |
| **[PARCIAL]** | Há indícios/código, mas falta validação completa (ex.: env não verificável daqui) |
| **[HIPÓTESE]** | Inferência fundamentada em evidência indireta; precisa de investigação |
| **[INSUFICIENTE]** | Não há dados para responder — declarado em vez de inventado |

---

## EXECUTIVE SUMMARY

```
MULTGESTOR — ENTERPRISE DUE DILIGENCE
Data: 2026-07-03

Status por eixo:
  🟢 Engenharia         🟡 Produto            🟡 Comercial
  🔴 Self-Service        🔴 Compliance/LGPD

Enterprise Maturity Index:  57/100  (era 44,5 em 2026-06-26)

Produção (operação própria):   🟢 pronto — VALIDADO (JoeFelipe em prod desde junho)
Venda assistida (1-5 clientes): 🟡 pronta após o release gate
Venda self-service:             🔴 bloqueada por 3 gaps de ativação
Escala (100 empresas):          🟡 alcançável em ~1 mês (P0+P1)
Escala (1.000 empresas):        🔴 não avaliável ainda — reavaliar com dados reais

Tempo p/ produção comercial (assistida):  ≈ 1 dia (após deploy do batch)
Tempo p/ SaaS self-service real:          ≈ 1 semana de execução P0
Tempo p/ escalar a 100 empresas:          ≈ 3-4 semanas adicionais (P1)

Maior gargalo:      Circuito de receita (ativação pós-pagamento)
Maior risco:        Plano pago não reflete no gating (companies.plan_type) — já causou 1 incidente real (D-016)
Maior oportunidade: Onboarding 100% automático — a infra já existe, falta ligar 3 fios
```

---

## MATRIZ DE CRITICIDADE (usada em todo o roadmap)

| Criticidade | Significado | Aparece nesta auditoria |
|---|---|---|
| **P0** | Bloqueia produção/venda — impede fechar uma venda hoje sem intervenção manual de risco | 6 itens (circuito de receita) |
| **P1** | Bloqueia operação sem susto — funciona, mas quebra silenciosamente ou expõe risco jurídico/reputacional | 6 itens (alertas, WhatsApp, LGPD-op, suporte) |
| **P2** | Bloqueia escala — funciona para poucos clientes, não aguenta crescimento ou gera dívida técnica visível | 6 itens (Redis, billing avançado, E2E, refactor) |
| **P3** | Melhoria importante — não bloqueia nada, mas move a agulha de produto/receita | 2 itens (2º nicho, relatórios) |
| **P4** | Evolução futura/estratégica — decisão de negócio, não de engenharia | 1 item (plataforma/API pública) |

---

## FASE 1 — DIAGNÓSTICO EXECUTIVO

| Pergunta | Resposta | Base |
|---|---|---|
| Prontos para vender? | **Venda assistida: SIM. Self-service: NÃO** | [FATO] gap plan_type + checkout não validado |
| Prontos para escalar? | Não além de ~dezenas de clientes | [HIPÓTESE fundamentada] |
| Prontos para 100 empresas? | Com o P1 desta auditoria, sim | [HIPÓTESE] |
| Prontos para 1.000? | Não (infra single-instance, sem alertas, suporte 1 pessoa) | [FATO+HIPÓTESE] |
| Prontos para franquias? | Não — pré-requisito: self-service estável | [FATO] |
| Prontos para white-label? | Não avaliado como prioridade; theming parcial existe (`company/theme`, branding) | [PARCIAL] |
| Prontos para multi-nicho? | Arquitetura sim (modules/plans/capabilities); operação não (clima incompleto) | [PARCIAL] |

**Síntese em uma frase:** o produto BarberGestor funciona e está seguro para operação própria;
o que impede a venda em escala não é o código do produto — é o **fechamento do circuito
receita→ativação** (3 gaps concretos abaixo) e a **camada comercial/jurídica** que nunca foi construída.

### Os 3 gaps que impedem self-service (a descoberta central desta due diligence)

1. **[FATO] `plan_type` não é atualizado pelo pagamento.** O webhook Kiwify/AbacatePay ativa
   módulo, cria assinatura e atualiza `companies.status` (`billing-provisioning.consumer.js:369-380`),
   mas **não** seta `companies.plan_type` — e `requirePlanFeature` lê exatamente `plan_type`
   (`company-plan.service.js`). Evidência de mundo real: incidente JoeFelipe 2026-06-29 (D-016) —
   empresa pagante bloqueada em colaboradores/caixa até UPDATE manual. **Cliente que pagar hoje
   será bloqueado quando o trial expirar.**
2. **[PARCIAL] Checkout não configurado em prod.** `ChoosePlan.jsx` usa `VITE_KIWIFY_URL_*`;
   `frontend/.env.production` só tem `VITE_API_URL` → links caem em `#`. (Pode estar setado no
   painel Vercel — não verificável daqui. Se não estiver, o botão "Assinar" não leva a lugar nenhum.)
3. **[FATO] `plans` vazia em prod** (auditoria 26/06; sem contra-evidência desde então) — o
   provisioning faz `findPlan(...)` e a empresa nova não tem trilha de plano formal.

O resto do circuito **existe e é bom**: registro cria empresa+trial, webhook idempotente com
`payment_gateway_events`, ativação de módulo automática, invoice sync, e-mail de primeiro acesso
pós-pagamento (`ensureFirstAccess`), e-mails de trial D+4/6/7 (job), bloqueio por trial expirado.
Fechar os 3 gaps fecha o circuito.

---

## SCORECARD — MultGestor Enterprise Maturity Index

| # | Domínio | Nota | Status | Justificativa (evidência) |
|---|---|---|---|---|
| 1 | Arquitetura de software | 62 | 🟡 | Modular real (capabilities, repositories, UoW, outbox); monólitos frontend (Barber.jsx 4.4k) e barber.service 2k+; sem TS |
| 2 | Multi-tenant / RLS | 74 | 🟡→🟢 | Reads enforçados em prod (PR #20); writes fechados **localmente** (`02c5396`, aguarda deploy); 98 testes de enforcement passando; GUC transaction-local validado |
| 3 | Banco de dados | 70 | 🟡 | 30 migrations versionadas + trilha reconciliada; RLS amplo; backup+B2 validado; **não auditado**: EXPLAIN/queries lentas/índices FK completos [INSUFICIENTE] |
| 4 | Segurança (OWASP) | 66 | 🟡 | JWT+cookies HttpOnly, rotação+revogação (local), rate limit público/auth, CSP on (local), secrets fora do git, XSS bloqueado por lint-rule; falta: TLS verify ativado, 2FA, CSRF formal, lockout brute-force |
| 5 | APIs | 58 | 🟡 | Padrão success/error + zod parcial; sem OpenAPI, sem versionamento, paginação inconsistente [FATO por amostragem] |
| 6 | Frontend | 56 | 🟡 | Funciona em prod, lint 0 errors, build ok; 44 warnings react-hooks adiados, 2 design systems, bundle >500kB, zero testes |
| 7 | UX | 50 | 🟠 | Estados vazios/erro inconsistentes (auditorias anteriores); mobile não auditado formalmente [INSUFICIENTE] |
| 8 | Fluxos do produto | 68 | 🟡 | Smoke 20/20 cobriu o core operacional ponta a ponta [FATO]; cancelamento de assinatura/exclusão de conta não existem no produto [FATO] |
| 9 | Self-service | 45 | 🔴 | Circuito arquitetado e 80% construído; **3 gaps** (acima) + onboarding exige master p/ módulo em cadastro orgânico sem pagamento |
| 10 | Billing | 58 | 🟡 | Kiwify+AbacatePay reais (webhook HMAC, eventos idempotentes, invoices); sem upgrade/downgrade/dunning/cupom/NF [FATO] |
| 11 | Infraestrutura | 58 | 🟡 | Render+Vercel+Supabase estáveis; backup automatizado validado; single instance, sem DR formal, migrations deploy `continue-on-error` |
| 12 | Observabilidade | 55 | 🟡 | health/deep ricos, logs estruturados c/ traceId, /metrics; **zero alertas ativos** — queda só é percebida por reclamação; SENTRY_DSN existe no env, ativação não confirmada [PARCIAL] |
| 13 | Performance | 50 | 🟠 | DB 178ms via health; sem load test, sem Lighthouse/CWV formal [INSUFICIENTE] |
| 14 | QA | 66 | 🟡 | 678 unit/integration + 98 enforcement rodando; pre-release gate existe; sem E2E automatizado, zero testes frontend |
| 15 | Governança | 82 | 🟢 | Constitution, fila, runbooks, audits, decisões, memória — acima da média de mercado; furo (divergência main/origin) detectado e mapeado |
| 16 | Comercial | 42 | 🔴 | Landing boa (barbergestor.com.br, pricing section); **sem termos de uso, política de privacidade, contrato, FAQ, tutoriais** [FATO — não encontrados no repo] |
| 17 | Customer Success | 38 | 🔴 | First-access + trial emails automatizados; sem docs de ajuda, sem canal de suporte definido, sem material de treinamento [FATO] |
| 18 | IA / Agentes | 60 | 🟡 | JoeFelipe Agent com safety tests (23/23, PR #13); OpenCodex prompts/missions; não bloqueia venda |
| 19 | Multi-nicho / Extensibilidade | 55 | 🟡 | modules/company_modules/plans por módulo + capabilities = fundação real; naming `barber_*` acopla o vertical; Clima sem auditoria/uso |
| 20 | Compliance / LGPD | 35 | 🔴 | Dados sensíveis (anamnese!) com rota de exclusão, mas **sem política de privacidade, consentimento, retenção definida** [FATO] |

### **MultGestor Enterprise Maturity Index: 57/100** 🟠
(26/06 estava em 44,5 — o sprint P0 subiu ~12 pontos, quase tudo na camada técnica.
O déficit agora é comercial/jurídico/operacional, não de engenharia.)

---

## AUDITORIA DE RECEITA (circuito lead → cobrança recorrente)

| Etapa | Estado | Evidência |
|---|---|---|
| Lead (landing) | 🟢 existe | barbergestor.com.br 200, pricing section |
| Cadastro | 🟢 existe | POST /auth/register cria empresa+user+trial [FATO smoke] |
| Escolha de plano | 🟡 | ChoosePlan.jsx existe; links dependem de env não confirmada [PARCIAL] |
| Pagamento | 🟡 | Kiwify checkout externo; produtos Kiwify criados? [INSUFICIENTE] |
| Ativação | 🔴 **quebra aqui** | módulo ativa, `plan_type` NÃO [FATO] |
| Retenção | 🟡 | trial emails D+4/6/7; sem dunning/reativação automatizada |
| Cobrança recorrente | 🟡 | Kiwify gerencia recorrência; suspensão via webhook mapeada (`suspended`) |
| Cancelamento | 🔴 | sem fluxo no produto (só via Kiwify + webhook `canceled`→inactive) |

**Receita hoje:** 1 empresa pagante (a própria JoeFelipe, promovida manualmente). MRR/ARR/CAC/LTV/churn:
**[INSUFICIENTE]** — não há dados; qualquer número seria invenção.

## AUDITORIA DE CUSTOS OPERACIONAIS [HIPÓTESE — projeção, verificar contra faturas reais]

Stack atual (Render 1 instância + Supabase + Vercel + B2 + Resend): custo fixo estimado
US$ ~25–60/mês. Por cliente: marginal ~zero até ~100 empresas (mesma instância/banco).
Gargalos de custo previsíveis: Supabase (conexões/storage) e WhatsApp API (por conversa) quando
sair do mock. **Com plano Essencial ≥ R$ 50/mês, 10 clientes já pagam a infraestrutura.**
Projeções para 1.000+ exigem decisões não tomadas (sharding? filas?) — [INSUFICIENTE].

## AUDITORIA DE FRICÇÃO HUMANA / DEPENDÊNCIA DO FUNDADOR

O que hoje passa por você manualmente (risco Alto = impede férias):

| Processo | Risco | Automatizável? |
|---|---|---|
| Ativar módulo p/ empresa sem pagamento (demo/orgânico) | Alto | ✅ IA/código (trial já deveria ativar barber por default no registro de nicho barber) |
| Corrigir `plan_type` pós-pagamento | Alto | ✅ código (P0-SS1) |
| Merge/push/deploy | Alto | Parcial (CI existe; decisão é humana por governança) |
| Suporte (não há canal) | Alto | Parcial (FAQ/docs primeiro) |
| Backup restore drill | Médio | ✅ agendável |
| Configurar Kiwify/DNS/CA TLS/Meta WhatsApp | Médio | ❌ humano (contas/credenciais) |
| Verificação B2 / objeto 0 bytes | Baixo | ✅ |

## AUDITORIA DE OPERAÇÃO REAL

Proxy executado: smoke 20/20 num servidor real cobrindo o dia-a-dia (agenda, cliente, serviço,
colaborador, caixa aberto→venda→fechamento, dashboard) [FATO]. A JoeFelipe opera em prod desde
junho [FATO]. **Simulação de 7 dias corridos** com remarcações/cancelamentos/no-show: não executada
nesta sessão — proposta como missão `qa/operacao-semana-simulada` (IA consegue rodar sozinha
localmente). Gargalos já conhecidos: lembretes WhatsApp são mock [FATO], relatório geladeira zerado
até vendas reais [FATO memória BG-001].

## AUDITORIA DE VERDADE COMERCIAL

Uma pessoa que nunca falou com você consegue: entender (🟢 landing), confiar (🔴 sem termos/CNPJ
visível/política/portfólio), contratar (🟡 checkout incerto), usar sozinha (🔴 gaps de ativação +
zero documentação de ajuda). **Veredito: hoje o desconhecido não fecha sozinho.** [FATO por ausência
dos artefatos no repo]

---

## MATRIZ DE RESPONSABILIDADES (itens decisivos)

| Item | Prio | IA | Humano | Bloqueia venda? | Tempo |
|---|---|---|---|---|---|
| Merge origin/main + push + deploy do batch (29 commits) | P0 | assiste | **decide/executa** | SIM (nada local vale até deployar) | 1-2h |
| Webhook setar `companies.plan_type`+`trial_ends_at` (P0-SS1) | P0 | ✅ | revisa | SIM | 2-4h |
| Popular `plans` em prod + produtos no Kiwify | P0 | ✅ SQL/código | ✅ conta Kiwify | SIM | 2h |
| Configurar `VITE_KIWIFY_URL_*` no Vercel | P0 | ❌ | ✅ | SIM | 15min |
| Teste E2E de pagamento real (R$ 1 ou sandbox) | P0 | assiste | ✅ | SIM | 1h |
| Ativar módulo barber automático no registro (nicho barber) | P0 | ✅ | revisa | SIM (self-service) | 2h |
| Termos de Uso + Política de Privacidade (LGPD) | P0 | ✅ rascunho | **✅ revisão/advogado** | SIM (juridicamente) | 1-3d |
| CA TLS no Render | P1 | ❌ | ✅ | não | 30min |
| WhatsApp provider real (credenciais Meta) | P1 | código pronto | ✅ conta Meta | não (mas mata o "uau") | 0.5-2d |
| Alertas (UptimeRobot/Sentry ativo) | P1 | config | ✅ contas | não | 2h |
| FAQ + 3 tutoriais + página de suporte | P1 | ✅ | revisa | venda em escala sim | 1-2d |
| Fluxo cancelamento/exclusão de conta no produto | P1 | ✅ | revisa | escala sim | 2-3d |
| Redis em prod (rate limit distribuído) | P2 | config | ✅ addon | só em multi-instância | 1h |
| Refatorar Barber.jsx + warnings react-hooks | P2 | ✅ | — | não | 3-5d |
| E2E Playwright do funil | P2 | ✅ | — | não | 2-3d |
| Upgrade/downgrade/dunning no billing | P2 | ✅ | revisa | escala sim | 3-5d |
| 2º nicho piloto (validar extensibilidade) | P3 | ✅ | decide nicho | não | 1-2sem |
| API pública/marketplace/franquia | P4 | — | decisão estratégica | não | — |

---

## GAP ANALYSIS

- **Vender hoje (assistido):** deploy do batch + smoke prod + você no loop de ativação. ~1 dia.
- **Vender sem suporte (self-service):** + P0-SS1 (plan_type) + plans/Kiwify + env Vercel + teste
  de pagamento real + termos/LGPD + ativação automática no registro. **~1 semana de trabalho real.**
- **Escalar (100):** + alertas + FAQ/suporte + cancelamento no produto + WhatsApp real + Redis. ~3-4 semanas.
- **Operar sozinho:** tudo acima + dunning + restore drill agendado + runbook de incidente.
- **Franquear/white-label:** self-service estável por 90 dias + theming completo + contrato. [P4]
- **Novos nichos:** fundação pronta; custo estimado do 2º nicho: 1-2 semanas se usar capabilities
  existentes [HIPÓTESE — validar com piloto].
- **API pública/plataforma:** exige versionamento+OpenAPI+API keys+quotas (R-003). [P4]

## PRODUCTION READINESS

Checklist única — responde "está pronto ou não?" sem precisar ler o resto do documento.

```
Arquitetura        ✔
Banco              ✔
Segurança          ✔  (TLS verify e CSP prontos no código, ativação em prod pendente)
RLS                ✔  (reads em prod; writes prontos localmente, aguardando deploy)
Deploy/CI          ✔
Backup/Restore     ✔  (restore drill periódico ainda não é rotina — P1)
Billing (técnico)  ✔  (webhook, idempotência, invoices)
Billing (gating)   ❌  (plan_type não é setado — P0-1)
Landing            ✔
Checkout           ❌  (env Vercel não confirmada, plans vazia em prod)
Onboarding self-service  ❌  (módulo não ativa sozinho no registro)
LGPD/Termos        ❌
Suporte/FAQ        ❌
Monitoramento/Alertas  ❌  (health existe, ninguém é avisado se cair)
```

**Leitura:** a coluna técnica está praticamente toda ✔. A coluna comercial/self-service/legal
está quase toda ❌. Isso confirma o diagnóstico: **o gargalo não é mais engenharia.**

---

## RELEASE GATE — checklist antes de qualquer deploy do batch atual

```
Banco (migrations idempotentes testadas)   ☑
Smoke local (20/20)                        ☑
Backup pré-deploy verificado                ☑
Plano de rollback (kill-switch documentado) ☑
Suíte completa (unit+integration)           ☑
Merge origin/main resolvido                 ☐  ← humano
Billing/webhook seta plan_type              ☐  ← P0-1, ainda não implementado
Plano (plans populada em prod)              ☐  ← P0-2
Self-service (auto-ativação módulo)         ☐  ← P0-3
LGPD (termos publicados)                    ☐  ← P0-4
Monitoramento (alerta pós-deploy)           ☐  ← P1

Pode liberar o BATCH ATUAL (fixes técnicos)?           SIM — é seguro e não depende do resto
Pode declarar "pronto para self-service"?              NÃO — faltam os 5 itens marcados ☐
```

---

## DEFINITION OF DONE — ENTERPRISE

Uma funcionalidade só é considerada concluída quando:

```
[ ] Código implementado
[ ] Testes (unit/integration) cobrindo o caminho feliz e o de erro
[ ] Smoke local ou prod executado com evidência registrada
[ ] Documentação técnica atualizada (se mudou contrato de API/schema)
[ ] Roadmap mestre e fila de missões refletindo o novo estado
[ ] Segundo Cérebro (.opencodex/brain) sincronizado — sem divergência código×docs
[ ] Changelog/commit com mensagem que explica o porquê, não só o quê
[ ] Deploy em produção (não vale só "está no código")
[ ] Monitoramento cobrindo o novo caminho (se crítico)
[ ] Plano de rollback conhecido antes do deploy
```

Aplicar esse critério retroativamente explica por que o sprint P0 desta auditoria está
classificado como **[FATO]** e não **VALIDADO**: passou em tudo acima exceto "deploy em produção".

---

## MAPA DE DEPENDÊNCIAS — circuito de receita

```
  Landing / Registro
        │
        ▼
   Escolha de Plano ──────► Checkout (Kiwify/AbacatePay)
        │                         │
        │                         ▼
        │                  Webhook de Pagamento
        │                         │
        │                         ▼
        │                  companies.status ✔   companies.plan_type ❌ (P0-1)
        │                         │
        ▼                         ▼
   Empresa criada  ◄──────  company_modules (ativação)
        │
        ▼
   Gating (requirePlanFeature lê plan_type)
        │
        ▼
   Dashboard / Agenda / Caixa / Colaboradores / Clientes
```

**Leitura de impacto:** qualquer empresa que siga o caminho da esquerda (registro orgânico)
funciona hoje em trial. Qualquer empresa que pague (caminho da direita) fica com
`companies.status = active` mas `plan_type` desatualizado — o Gating não libera os recursos
pagos até alguém corrigir na mão. É o único elo quebrado de uma corrente inteira que já funciona.

---

## ESTIMATIVA DE ESFORÇO — itens P0 (circuito de receita)

| Item | Horas estimadas |
|---|---:|
| Webhook seta `plan_type`+`trial_ends_at` | 2–4h |
| Popular `plans` em prod + produtos Kiwify | 2h |
| Configurar `VITE_KIWIFY_URL_*` no Vercel | 15min |
| Auto-ativar módulo barber no registro | 2h |
| Termos de Uso + Política de Privacidade (rascunho IA) | 3–4h (+ revisão humana/advogado) |
| Teste de pagamento real/sandbox ponta a ponta | 1h |
| Merge origin/main + push + deploy + canário | 1–2h |
| **Total P0 (execução, exclui revisão jurídica)** | **≈ 11–15h — 2 dias úteis** |

---

## BURNDOWN DE PRODUÇÃO (visão por prioridade, 2026-07-03)

```
P0 — Circuito de receita
████░░░░░░  40%   (writes RLS e sessão prontos; plan_type/plans/checkout/LGPD faltando)

P1 — Operação sem susto
███░░░░░░░  30%   (backup e rate-limit prontos; alertas/WhatsApp/suporte/cancelamento faltando)

P2 — Escala e qualidade
██░░░░░░░░  20%   (testes/CI fortes; Redis/billing avançado/E2E/refactor pendentes)

P3/P4 — Crescimento e plataforma
░░░░░░░░░░   0%   (não iniciado — correto para o estágio atual)
```

---

## PLANO DOS PRÓXIMOS 30 DIAS

```
Semana 1 — Circuito de receita (P0)
  Merge + deploy do batch · webhook plan_type · plans em prod
  Kiwify produtos + env Vercel · auto-ativação no registro
  Termos/LGPD (rascunho) · 1 pagamento real de teste

Semana 2 — Confiança e compliance (P0 fecha / P1 começa)
  Publicar termos/LGPD revisados · FAQ + página de suporte
  Alertas de uptime/erro (Sentry ativo, UptimeRobot)
  Restore drill agendado

Semana 3 — Self-service sem sustos (P1)
  WhatsApp provider real (credenciais Meta)
  Fluxo de cancelamento/exclusão de conta no produto
  Limpeza de artefatos do repo (lista aprovada)

Semana 4 — Preparar escala (P1→P2)
  Redis em prod · CA TLS ativo no Render
  Primeiras métricas reais de billing (MRR/churn com dados de verdade)
  Decisão: seguir para 100 empresas ou consolidar mais 30 dias
```

---

## ROADMAP EXECUTIVO

**P0 — "Circuito de receita" (1 semana):**
1. `release/push-p0-batch` (humano; gate já documentado em queue/next-task.md)
2. `billing/plan-type-provisioning-fix` (IA; aceite: pagamento em sandbox seta plan_type+módulo+status, teste integração cobrindo o consumer)
3. `billing/seed-plans-prod` + produtos Kiwify + env Vercel (ambos; aceite: botão Assinar leva ao checkout real)
4. `onboarding/auto-activate-barber-on-register` (IA; aceite: registro nicho barber sai com módulo ativo em trial, smoke sem toque de master)
5. `legal/termos-privacidade-lgpd` (IA rascunha, humano valida; aceite: páginas públicas linkadas no registro)
6. Smoke prod completo (roteiro da auditoria 02/07) + 1 pagamento real de teste

**P1 — "Operação sem susto" (2-3 semanas):** TLS CA · WhatsApp real · alertas uptime/Sentry ·
FAQ+tutoriais+suporte · cancelamento/exclusão no produto · restore drill · limpeza artefatos (lista humana)

**P2 — "Escala e qualidade":** Redis · upgrade/downgrade/dunning · E2E Playwright · refactor
Barber.jsx+warnings · paginação/OpenAPI · índices/EXPLAIN audit · load test k6

**P3 — "Crescimento":** 2º nicho piloto · relatórios avançados · marketplace de módulos interno ·
migração TS gradual

**P4 — "Plataforma":** API pública (R-003 backbone) · franquia · white-label · multi-região

---

## VEREDITO FINAL

1. **Pode entrar em produção?** JÁ ESTÁ, para operação própria. Para clientes: após o release gate (P0-1).
2. **Pode vender hoje?** Assistido, para 1-5 clientes próximos: **sim** (você ativa na mão). Self-service: **não**.
3. **Pode operar sem intervenção humana?** Não — 3 gaps de ativação + zero camada de suporte.
4. **Pode escalar?** Tecnicamente aguenta dezenas; comercialmente não há máquina de venda/suporte.
5. **100 empresas?** Sim, após P0+P1 (~1 mês de trabalho focado).
6. **1.000 empresas?** Não. Reavaliar após 100 reais (dados > projeção).
7. **Maiores riscos (top):** deploy do batch divergente mal resolvido · cliente pago bloqueado (plan_type) · ausência jurídica LGPD com dados de anamnese · zero alertas (queda silenciosa) · dependência total do fundador · WhatsApp mock (promessa não cumprida) · migrations continue-on-error · restore nunca re-testado · suporte inexistente · monólito frontend freando evolução.
8. **Maiores bloqueadores:** os 6 itens P0 acima — nenhum é grande; todos são fecháveis em 1 semana.
9. **Maiores oportunidades:** circuito billing 80% pronto (raro nesse estágio) · governança/testes acima da média (vende confiança) · agenda pública como canal de aquisição do cliente final · geladeira/anamnese/fidelidade como upsell premium · arquitetura multi-nicho genuína · JoeFelipe como case real com números.
10. **Caminho mínimo para SaaS self-service vendável:** executar o P0 na ordem (deploy → plan_type → plans/Kiwify → auto-ativação → termos → pagamento real de teste). **É 1 semana de execução, não 1 trimestre.** O sistema técnico já chegou; falta ligar a caixa registradora e assinar o jurídico.

---
*Documento de auditoria. Fontes: `.opencodex/audits/2026-07-02-auditoria-completa-e-sprint-p0.md`,
smoke 20/20, health prod, código citado inline. Atualizar após cada release gate.*
*O manual de execução vivo (estado + gates + roadmap sempre sincronizados) é
[`EXECUTION-PLAYBOOK-PRODUCAO.md`](../brain/EXECUTION-PLAYBOOK-PRODUCAO.md) — esta auditoria é
uma de suas fontes históricas, não o documento operacional do dia a dia.*
