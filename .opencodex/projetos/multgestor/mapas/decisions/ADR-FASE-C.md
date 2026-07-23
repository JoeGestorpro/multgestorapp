---
tipo: decisao
area: dominio
status: aprovado
progresso: 0
criticidade: alta
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-07-20
---

# ADR-FASE-C — Promover billing consumers com auditoria e feature flag

> **Status:** APROVADA (Decisão D-M1-FASE_C, 2026-07-20). Nenhuma ativação, mudança de código ou deploy autorizada.

## O que é

Decisão sobre o destino dos consumers da Fase C (`sale.created` → loyalty accrual + package redemption), atualmente em quarentena lógica desde 2026-06-03.

## Contexto

Em `server.js:418-426`, o wiring dos consumers de `sale.created` está comentado com a seguinte justificativa:

```javascript
// ⚠️ QUARENTENA FASE C (governança Claude Code, 2026-06-03) ⚠️
// O wiring abaixo foi implementado pelo executor FORA DE ORDEM (Fase C estava BLOCKED
// no backlog, dependendo da aprovação da corretiva Fase A). Está DESATIVADO até a Fase C
// ser formalmente promovida via .opencodex/queue/next-task.md e auditada.
```

Risco identificado: manter código implementado mas inativo cria uma diferença perigosa entre:
```text
funcionalidade implementada
≠
funcionalidade operacional
```

## Decisão

```text
FASE_C_DECISION: PROMOVER_COM_AUDITORIA

- ativação protegida por feature flag;
- iniciar desabilitada por padrão;
- validar migrations e contratos;
- validar idempotência;
- validar rollback;
- validar eventos e créditos;
- ativar primeiro em ambiente controlado;
- acompanhar logs e métricas;
- somente depois habilitar para produção geral.
```

### Validações obrigatórias antes da ativação

- [ ] crédito duplicado em loyalty
- [ ] perda de crédito em package redemption
- [ ] reprocessamento de mensagens falhas
- [ ] cancelamento de venda e estorno de créditos
- [ ] concorrência (múltiplos eventos simultâneos)
- [ ] isolamento por tenant (company_id)
- [ ] falha parcial entre transação principal e evento
- [ ] idempotência do handler (outbox_message_handlers)
- [ ] rollback em caso de falha no consumer

## Estado atual

| Aspecto | Hoje (quarentena) | Alvo (promovido) |
|---------|-------------------|------------------|
| Wiring | Comentado em server.js | Ativo via feature flag (default: off) |
| Código | Existe e compila | Mesmo código, sem alterações |
| Testes | Existem | Validar cobertura |
| Risco | Funcionalidade não operacional | Controlado por feature flag + auditoria |

## Relações

### Depende de
- Auditoria das validações obrigatórias listadas acima

### Bloqueia
- BILL-001 (Fase C em quarentena)

### Usa
- `outboxWorker.register('sale.created', ...)` em server.js
- `integrations/consumers/handleSaleLoyaltyAccrual.js`
- `integrations/consumers/handleSalePackageRedemption.js`

## Próximas ações

1. ✅ Decisão tomada (2026-07-20).
2. Criar feature flag para `sale.created` consumers.
3. Executar auditoria de idempotência, rollback, concorrência e isolamento.
4. Ativar em ambiente controlado, acompanhar logs.
5. Nenhuma ativação, mudança de código ou deploy está autorizada sem missão própria.

## Links
- [[08-ARQUITETURA-CANONICA-CORE-MULTGESTOR]] — seção DECISÕES TOMADAS
- [[../07-debitos-conflitos-lacunas]] — BILL-001
- `backend/src/server.js:418-426`
- `backend/src/integrations/consumers/index.js`
