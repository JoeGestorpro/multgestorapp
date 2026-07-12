# MISSÃO
Implementar a **Billing Capability** do MultGestor Core com **Provider Pattern** e
arquitetura **event-driven**, tornando o billing **vendor-agnostic** — sem quebrar
o fluxo atual da Kiwify. Você (OpenCode) é o engenheiro executor.

# CONTEXTO
Projeto: MultGestor v2 (SaaS multi-tenant, capability/event-driven).
Backend Node.js + Express 5 (CommonJS) em `backend/`. Raiz: `C:\MultGestor.v2`.
Branch de trabalho: `principal`. Branch de deploy: `main` (NÃO tocar).

Capacidade do Core que isto fortalece: **Billing Capability** (nova, de domínio)
+ **Event Bus** (billing passa a ser event-driven) + **Integration Layer / Provider Pattern**.

Estado atual (auditado — confie nestas evidências, mas confirme ao ler):
- Kiwify vive em 3 arquivos: `src/services/webhooks/kiwify.service.js` (~654 linhas),
  `src/controllers/webhooks.controller.js`, `src/routes/webhooks.routes.js`.
- `kiwify.service.js` mistura **parse + verificação de assinatura + orquestração +
  side-effects** (ensureCompany/ensureSubscriptionRecord/syncInvoice/activateCompanyModule/
  createSubscriptionEvent/ensureFirstAccess + envio de e-mail) escrevendo direto via
  `pool.connect()`/`client.query` — **não usa Event Bus, não usa Outbox, não usa repositories**.
- Idempotência já existe: tabela `payment_gateway_events` (UNIQUE `gateway, event_id`) com `ON CONFLICT`.
- Read-model já é agnóstico: `company-plan.service.js` e `master-finance.service.js`
  leem `subscriptions`/`invoices` por coluna genérica `gateway`. NÃO mexer nisso.
- **NÃO existem** eventos de billing. Contratos em `src/shared/core/events/contracts.js`
  cobrem só `appointment.*`. `eventBus.publish(eventName, payload, metadata)`.
- **Outbox** é escrito transacionalmente em `src/shared/core/database/unit-of-work.js`
  (`INSERT INTO outbox_messages`) e despachado por `src/shared/core/outbox/outbox-worker.js`
  (`register(eventType, handler)` + poll). Ver `src/database/outbox.sql` para o schema.
- **NÃO existe** teste para o webhook Kiwify.
- Capability de referência já existente: `src/shared/capabilities/booking-engine/` (siga o padrão).
- Registry de mensageria existe (`src/integrations/core/provider-registry.js`) mas resolve
  por `channel:companyName` — semântica diferente de pagamento.

# OBJETIVO
1. Criar uma `billing` capability que define um **contrato único de evento de pagamento**.
2. Introduzir uma **PaymentProvider interface** (adapter stateless: verify + parse + normalize).
3. Transformar a Kiwify num **adapter** (`KiwifyProvider`) sem perder nenhum comportamento.
4. Tornar o billing **event-driven**: o webhook persiste o evento normalizado (idempotente)
   e publica eventos de domínio; a **orquestração migra para um consumer**.
5. Deixar o sistema pronto para adicionar AbacatePay/Mercado Pago/Stripe **sem tocar regra de negócio**.

# REGRAS
- **Não quebrar** `POST /api/webhooks/kiwify`. Em nenhum checkpoint a rota pode regredir.
- **Reutilizar antes de criar:** `payment_gateway_events` (idempotência), `unit-of-work.js`
  (outbox transacional), `eventBus`, schema `subscriptions`/`invoices`/`company_modules`,
  `masterService.generateFirstAccess`, `emailService`. NÃO criar tabelas novas sem necessidade comprovada.
- Mudança cirúrgica e incremental por FASE. Se uma fase exigir mais que o descrito, PARE e reporte.
- Não tocar `main`, não dar `git push` nem merge sem confirmação do usuário.
- Não alterar `company-plan.service.js`, `planFeatures.js` nem `master-finance.service.js`
  (read-model já agnóstico).
- Trabalhar em branch `feat/billing-capability` criada a partir de `principal`.
- Commits atômicos por fase (Conventional Commits). Responder em PT-BR.

# TAREFAS (executar em fases, com checkpoint de testes verdes entre elas)

## FASE 0 — Preflight
- `git checkout -b feat/billing-capability`
- `cd backend && npm ci` ; baseline `npm run test:unit` (registrar total atual).
- LER: `kiwify.service.js`, `webhooks.controller.js`, `webhooks.routes.js`,
  `shared/core/events/{event-bus,contracts,consumers}.js`,
  `shared/core/database/unit-of-work.js`, `shared/core/outbox/outbox-worker.js`,
  `database/outbox.sql`, `shared/capabilities/booking-engine/` (padrão de capability).

## FASE A — Rede de segurança (testes de caracterização) — SEM refatorar
- Criar `tests/unit/kiwify-webhook.characterization.test.js` que trava o comportamento
  ATUAL de `processKiwifyWebhook` (mockando `pool`/`client` e `masterService`/`emailService`):
  - assinatura inválida → 401; `KIWIFY_WEBHOOK_SECRET` ausente → 500;
  - evento duplicado (`ON CONFLICT`) → retorno `duplicate:true`;
  - compra aprovada → cria company/subscription/invoice, ativa módulo, dispara first-access;
  - mapeamento de status (aprovada/renovada/atrasada/cancelada/reembolso/chargeback).
- Commit: `test(billing): characterization tests for current kiwify webhook`
- CHECKPOINT A: testes verdes (estes serão o gate de todas as fases seguintes).

## FASE B — Scaffolding da capability (puramente aditivo, não liga no fluxo ainda)
- Criar `src/shared/capabilities/billing/`:
  - `contracts.js` — definir `NormalizedBillingEvent` (campos: `provider`, `event_id`,
    `event_type` normalizado, `company`, `customer`, `finance`, `raw`) + contratos de
    domínio no mesmo estilo de `core/events/contracts.js`:
    `payment.approved`, `payment.failed`, `subscription.created`, `subscription.renewed`,
    `subscription.canceled`, `subscription.refunded`. (Mapear a partir de `mapEventToStatuses`.)
  - `payment-provider.js` — classe base `PaymentProvider` com métodos a sobrescrever:
    `verifySignature(req) -> bool`, `parse(req) -> rawPayload`, `normalize(rawPayload) -> NormalizedBillingEvent`.
    Adapter é **stateless**: sem DB, sem side-effects.
  - `provider-registry.js` — registry keyed por nome de gateway (`kiwify`, ...). ANTES de criar,
    avaliar reuso de `integrations/core/provider-registry.js`; se a semântica não servir
    (resolve por channel:company), justificar no README e criar o billing registry mínimo.
  - `README.md` — documentar a capability, o contrato e como adicionar um novo provider.
- Testes unitários do contrato/registry.
- Commit: `feat(billing): scaffold billing capability (contracts, provider interface, registry)`
- CHECKPOINT B: unit verde (incl. Fase A intacta).

## FASE C — Extrair KiwifyProvider (parse/verify/normalize) — comportamento idêntico
- Criar `src/shared/capabilities/billing/providers/kiwify.provider.js` movendo as funções
  puras de `kiwify.service.js`: `resolveWebhookSecret`, `validateWebhookSecret`→`verifySignature`,
  `extractEvent/extractCustomer/extractCompany/extractFinancialPayload`→`normalize`, `mapEventToStatuses`.
- `kiwify.service.js` passa a USAR o provider para verify/parse/normalize (orquestração
  permanece por ora). Sem mudança de comportamento observável.
- Registrar o provider no registry (`kiwify`).
- Testes unitários do KiwifyProvider (normalize cobrindo todos os tipos de evento).
- Commit: `refactor(billing): extract KiwifyProvider adapter (parse/verify/normalize)`
- CHECKPOINT C: Fase A + novos testes verdes.

## FASE D — Event-driven: BillingManager + Outbox + consumer de provisionamento
- `src/shared/capabilities/billing/billing-manager.js`:
  - `handleWebhook(providerName, req)`: resolve provider no registry → `verifySignature`
    (401 se falhar) → `parse` → `normalize`.
  - Idempotência: gravar em `payment_gateway_events` (reusar lógica/UNIQUE existente).
  - **Transacional via `unit-of-work.js`**: na MESMA transação, gravar o evento e inserir
    a mensagem normalizada em `outbox_messages` (usar colunas reais do `outbox.sql`).
  - Publicar o evento de domínio (`payment.approved` etc.) — entrega confiável via Outbox.
- `src/integrations/consumers/billing-provisioning.consumer.js`:
  - Reage ao evento normalizado (registrar no OutboxWorker via `register(eventType, handler)`
    em `server.js`, seguindo o padrão dos consumers existentes).
  - Move a orquestração de `kiwify.service.js`: ensureCompany / ensureSubscription / syncInvoice /
    activateModule / createSubscriptionEvent / ensureFirstAccess+email. **Idempotente** (re-dispatch seguro).
- `webhooks.controller.js` passa a chamar `billingManager.handleWebhook('kiwify', req)`.
- `kiwify.service.js` reduzido a (ou removido em favor de) provider + consumer — sem perder testes.
- Garantir captura do **raw body** na rota do webhook se a verificação de assinatura exigir
  (usar `verify` callback do `express.json()` só nessa rota; ver Fase 2/HMAC se aplicável).
- Commit: `feat(billing): event-driven billing via BillingManager + outbox consumer`
- CHECKPOINT D: **todos** os testes verdes, incluindo a caracterização da Fase A
  (comportamento do webhook idêntico ao original).

# VALIDAÇÕES
- `cd backend && npm run test:unit` — 100% verde em cada checkpoint (A→D).
- `npm run test:integration` — não regredir (rodar se houver Postgres; senão, validar no CI).
- Conferir que `POST /api/webhooks/kiwify` continua: 401 p/ assinatura inválida,
  `duplicate` p/ evento repetido, e provisiona corretamente em compra aprovada.
- `grep` de sanidade: `kiwify` deve aparecer **apenas** no provider/registry e adapters —
  **não** em regra de negócio, controller genérico ou read-model.
- Confirmar que nenhum evento de billing é publicado fora do BillingManager.

# CRITÉRIOS DE ACEITAÇÃO
- [ ] Existe `shared/capabilities/billing/` com contracts + PaymentProvider + registry + README.
- [ ] `KiwifyProvider` é stateless (verify/parse/normalize) e cobre todos os tipos de evento.
- [ ] Webhook roteado por `BillingManager`; orquestração vive num **consumer** disparado por evento/outbox.
- [ ] Eventos de domínio de billing existem e são publicados (payment.* / subscription.*).
- [ ] Idempotência preservada (reuso de `payment_gateway_events`); re-dispatch do consumer é seguro.
- [ ] Testes de caracterização (Fase A) continuam verdes — comportamento do webhook inalterado.
- [ ] Adicionar um novo gateway agora = criar 1 arquivo `providers/<x>.provider.js` + registrar,
      **sem** tocar regra de negócio (documentar esse caminho no README).
- [ ] `company-plan.service.js`, `planFeatures.js`, `master-finance.service.js` **inalterados**.
- [ ] Nenhum `git push`/merge sem confirmação.

# RESULTADO ESPERADO
Billing vendor-agnostic e event-driven: Kiwify é só um adapter; a orquestração reage a
eventos de domínio; adicionar AbacatePay/Mercado Pago/Stripe vira plugar um provider novo.
Entregar relatório final: tabela (fase | status | arquivos | testes n/n | risco residual),
saídas reais dos testes, lista de commits da branch `feat/billing-capability`, e a pergunta:
"Posso fazer push da branch e abrir PR para `principal`?"

# CONDIÇÕES DE PARADA
- Baseline vermelho no preflight; caracterização (Fase A) não estabiliza;
- qualquer checkpoint vermelho após mudança; necessidade de refatoração além do descrito;
- necessidade de criar tabela nova (reportar antes — provavelmente é reuso).
