# 📐 EVENT CONTRACTS — Regra obrigatória ao tocar eventos (canônico)

> **Decisão humana 2026-06-07 (REGRA OBRIGATÓRIA).** Vale para **qualquer** mudança em `EventBus`, `Outbox`,
> `Consumers` ou `Services` que **publicam eventos**. Repo = fonte da verdade.
> Motivação: o sistema tem **dois formatos de evento divergentes** (in-memory vs outbox). Acessar campos
> soltos (`event_name`, `company_id`, `aggregate_id` sem origem) causa drift silencioso e bugs de consumer.

## Contrato real (fonte única)
- **`backend/src/shared/core/events/contracts.js`** — define cada evento: `event_name`, `aggregate_type`,
  `required_fields`, `optional_fields`, e o helper **`validateEventPayload(contract, payload)`**.
- Antes de publicar/consumir um evento, **localize o contrato** ali. Se não existir, **crie o contrato** antes do código.

## ⚠️ Os DOIS formatos (a causa do drift)
| | In-memory (`eventBus`) | Outbox (`OutboxWorker`) |
|---|---|---|
| Origem | `event-bus.js` `publish()` | linha `outbox_messages` + `context` |
| Entregue ao consumer | objeto `event` completo | `handler(payload, context)` |
| Nome do evento | `event.event_name` | `event.type` (na linha) — **NÃO** há `event_name` no handler |
| Empresa | `event.company_id` | `context.companyId` (linha: `company_id`) |
| Aggregate | `event.aggregate_type` / `event.aggregate_id` | colunas `aggregate_type`/`aggregate_id` (linha) |
| ID do evento | `event.event_id` | `context.eventId` (linha: `id`) |
| Payload | `event.payload` | 1º argumento `payload` |

> Consequência: um consumer escrito para o bus in-memory **quebra** se registrado na outbox (e vice-versa),
> porque os campos têm nomes/posições diferentes. Foi o tipo de divergência que originou esta regra.

## Regras obrigatórias (checklist antes de mexer em eventos)
1. **Localizar o contrato real** do evento em `contracts.js` (criar se não existir).
2. **Nunca** usar variáveis soltas (`event_name`, `company_id`, `aggregate_id`) sem origem explícita.
3. **Sempre acessar campos pelo objeto do evento** no formato correto do caminho:
   - in-memory: `event.event_name`, `event.company_id`, `event.aggregate_type`, `event.aggregate_id`
   - outbox handler: `payload.*` + `context.companyId` / `context.eventId` / `context.traceId`
4. **Se o campo puder variar entre os dois formatos → helper centralizado** (normalizador único; não inline em cada consumer).
5. **Criar ou atualizar o teste unitário do EventBus/Outbox/consumer** cobrindo o acesso ao campo.
6. **Rodar o teste específico antes da integração completa** (`npx jest tests/unit/<arquivo>` antes de `test:integration`).

## Producers — validar payload contra o contrato
- Ao publicar, validar com `validateEventPayload(AppointmentCreated, payload)` (ou o contrato correspondente)
  para garantir os `required_fields`. Hoje `sale.service`/`appointment.service` **não** validam — ao tocá-los,
  adicionar a validação é a aplicação direta desta regra.

## Aplicação no fluxo de missões
- Toda missão que toque eventos deve referenciar esta regra no card (`next-task.md`) e incluir os passos 5 e 6 nos **Critérios de aceite**.
- O **Auditor** (OpenCode + Claude Code) deve **reprovar** (REQUEST_CHANGES) diffs de evento que violem os itens 2–4 ou não tragam o teste do item 5.
