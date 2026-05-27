# backend-seguro-multgestor

## Stack Tecnológica

- **Runtime:** Node.js 24 (LTS)
- **Framework:** Express 5
- **Database:** PostgreSQL via `pg` pool raw queries
- **Validação:** Zod
- **Logging:** Pino (estruturado)
- **Auth:** JWT (`jsonwebtoken`) + `bcryptjs`
- **Testes:** Jest + Supertest

## Padrões Arquiteturais

### Controller

- **Regra de ouro:** delegar 100% da lógica para o service.
- O controller deve apenas:
  1. Extrair e validar inputs (via Zod schemas)
  2. Chamar o service correspondente
  3. Retornar a resposta usando helpers de `shared/core/responses/`
- **Proibido:** queries SQL, lógica de negócio, manipulação direta de `req.user` além de passar `company_id` para o service.

### Service

- **Regra de ouro:** usar repository para acesso a dados; emitir eventos via `EventBus`.
- Todo service deve receber `company_id` explicitamente (nunca inferir do contexto).
- Eventos de domínio devem ser publicados via `eventBus.publish(eventName, payload)` com `company_id` incluído no payload.
- **Eventos críticos** (pagamentos, agendamentos, mudanças de plano) devem passar pelo **Outbox Pattern** (`shared/core/outbox/`) para garantir entrega at-least-once.

### Repository

- **Regra de ouro:** herdar de `BaseRepository` (`shared/core/database/BaseRepository.js`).
- Todo método de query deve incluir `company_id` como parâmetro obrigatório.
- **Proibido:** queries sem filtro de tenant (`company_id`).
- Usar prepared statements do `pg` pool; nunca concatenar strings SQL.

## Regras de Segurança

### Autenticação & Autorização

- `company_id` deve ser extraído **SEMPRE** de `req.user.company_id`.
- **NUNCA** aceitar `company_id` do `body`, `query` ou `params` do request.
- Usar middlewares `requireCompany`, `requireActivePlan` e `requirePlanFeature` em todas as rotas protegidas.

### Validação

- Usar Zod schemas localizados em `shared/core/validation/schemas/`.
- Usar `validateRequest(schema)` como middleware antes do controller.
- Schemas devem validar tipos, ranges e formatos; rejeitar campos desconhecidos (`strict()` ou `strip()` com cuidado).

### Erros

- Usar classes de erro do `shared/core/errors/`:
  - `AppError` — erro genérico da aplicação
  - `ValidationError` — dados inválidos
  - `NotFoundError` — recurso não encontrado
  - `UnauthorizedError` — não autenticado
  - `ForbiddenError` — sem permissão
  - `ConflictError` — conflito de estado
  - `IntegrationError` — falha em serviço externo
  - `TenantIsolationError` — violação de isolamento multi-tenant
- **Proibido:** lançar `Error` genérico ou retornar `res.status(500).json()` manualmente.

### Responses

- Usar helpers de `shared/core/responses/`:
  - `success(data, message?)`
  - `fail(message, statusCode?)`
  - `pagination(data, meta)`

### Multi-Tenant

- **Toda query** ao banco deve incluir `company_id` como filtro obrigatório.
- Verificar isolamento de tenant em testes de integração (`tenant-isolation.test.js`).

## Observabilidade

### Logs

- Usar **Pino** estruturado (`logger.info`, `logger.error`, `logger.warn`).
- **Proibido:** `console.log`, `console.error`, `console.warn`.
- Incluir `traceId` (correlation-id) em todo log. O middleware `correlation-id.middleware.js` injeta o `traceId` no `req`.

### Rate Limiting

- Aplicar `rate-limit.middleware.js` em rotas críticas:
  - Auth (`/auth/login`, `/auth/register`, `/auth/forgot-password`)
  - Webhooks (`/webhooks/*`)
  - API pública (`/api/public/*`)

## Dependências de Documentação

- `api-patterns/auth.md`
- `api-patterns/rest.md`
- `api-patterns/response.md`
- `api-patterns/security-testing.md`
- `database-design/schema-design.md`
