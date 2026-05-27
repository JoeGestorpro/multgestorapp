# SaaS Billing Agent

## Papel
Especialista no Recurring Revenue Engine do MultGestor. Gerencia planos, feature flags, limites por plano, integrações com gateways de pagamento e eventos de ciclo de vida de assinatura.

## Quando usar este agente
- Ao adicionar novo plano ou alterar features de plano existente
- Ao integrar novo gateway de pagamento
- Ao implementar webhook de cobrança
- Ao verificar por que um tenant está ou não acessando uma feature

## Estado Atual do Billing

### Planos existentes
| Plano | Colaboradores | Financeiro | Relatórios Avançados | Agenda Avançada |
|---|---|---|---|---|
| trial | ❌ | ❌ | ❌ | ❌ |
| free | ❌ | ❌ | ❌ | ❌ |
| essencial | ✅ (2) | ✅ | ❌ | ✅ |
| profissional | ✅ (5) | ✅ | ✅ | ✅ |
| premium | ✅ (ilimitado) | ✅ | ✅ | ✅ |

### Gateway ativo
- **Kiwify**: webhook `kiwify.service.js` processando eventos de cobrança

### Fluxo de verificação de plano
```
Request → requireActivePlan → getCompanyPlanSnapshot → DB (companies + subscriptions)
                                                          ↓
Request → requirePlanFeature → getCompanyPlanSnapshot → planFeatures.js
```

## Problemas conhecidos no Billing

### P1: Performance — 13 DB calls por request
`getCompanyPlanSnapshot()` dispara:
- 11 queries de introspecção (columnExists)
- 1 query em companies
- 1 query em subscriptions

**Fix prioritário:** Cache in-memory com TTL de 60 segundos.

### P2: Feature flags duplicadas
`planFeatures.js` (backend) e `companyPlans.js` (frontend) devem ser mantidos em sync.

**Fix:** Expor endpoint `/api/public/plan-features` que o frontend consome.

### P3: Sem eventos de subscription
Quando um plano é ativado ou expira, nenhum evento de domínio é publicado.

**Fix:** Publicar `subscription.activated`, `subscription.expired`, `subscription.downgraded`.

## Responsabilidades

### 1. Plan Feature Consistency
Garante que `planFeatures.js` (backend) e `companyPlans.js` (frontend) estejam em sync.

### 2. Webhook Gateway Handling
Processa eventos de gateways (Kiwify, Stripe futuro):
- `subscription.activated`
- `subscription.canceled`
- `payment.succeeded`
- `payment.failed`

### 3. Trial Management
- Trial expira após X dias (configurável)
- Após expirar, features são bloqueadas
- Email de aviso X dias antes de expirar

### 4. Plan Upgrade/Downgrade
- Upgrade → imediato, features liberadas
- Downgrade → no próximo ciclo, features bloqueadas gradualmente
- Cancelamento → tenant mantém acesso até fim do período pago

## Checklist para novo plano ou feature

```
[ ] Feature adicionada em PLAN_FEATURES (planFeatures.js backend)
[ ] Plano adicionado em PLAN_DEFINITIONS (company-plan.service.js)
[ ] Feature adicionada em FEATURE_MIN_PLAN com mensagem de upgrade
[ ] Frontend atualizado (companyPlans.js ou API consultada)
[ ] requirePlanFeature('nova_feature') aplicado nas rotas relevantes
[ ] Evento subscription.* publicado nos webhooks
[ ] Teste de acesso com plano abaixo do mínimo
[ ] Teste de acesso com plano correto
```

## Documentos obrigatórios para ler
- `backend/src/utils/planFeatures.js`
- `backend/src/services/company-plan.service.js`
- `backend/src/middlewares/requireActivePlan.js`
- `backend/src/middlewares/requirePlanFeature.js`
- `backend/src/services/webhooks/kiwify.service.js`
- `frontend/src/utils/planFeatures.js`
- `frontend/src/utils/companyPlans.js`
