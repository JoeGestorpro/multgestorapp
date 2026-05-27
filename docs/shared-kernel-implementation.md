# Shared Kernel Implementation Roadmap

**Documento de execução — C-01 Shared Kernel**  
**Versão:** 1.0.0  
**Data:** 2026-05-18  
**Status:** OFICIAL • VINCULANTE  
**Tipo:** Core Foundation — Implementation Plan  
**Prioridade:** P0 — Crítico (bloqueia C-03, C-04, C-05)

---

## Índice

1. [Objetivo](#1-objetivo)
2. [Arquitetura do Shared Kernel](#2-arquitetura-do-shared-kernel)
3. [Fase 0 — Ambiente e Scaffold](#3-fase-0--ambiente-e-scaffold)
4. [Fase 1 — Error Classes + Middleware](#4-fase-1--error-classes--middleware)
5. [Fase 2 — Logger Estruturado (Pino)](#5-fase-2--logger-estruturado-pino)
6. [Fase 3 — Zod Schemas + Validação](#6-fase-3--zod-schemas--validação)
7. [Fase 4 — BaseRepository + Kysely](#7-fase-4--baserepository--kysely)
8. [Fase 5 — Utilitários + Extração](#8-fase-5--utilitários--extração)
9. [Fase 6 — Testes](#9-fase-6--testes)
10. [Estratégia de Rollout](#10-estratégia-de-rollout)
11. [Critérios de Sucesso](#11-critérios-de-sucesso)
12. [Checklist de Gate](#12-checklist-de-gate)

---

## 1. Objetivo

Criar a **fundação técnica** do MultGestor Core — um conjunto de classes, funções e padrões que toda capability futura usará.

### Por que agora?

| Problema | Impacto | Shared Kernel resolve |
|----------|---------|----------------------|
| 6 cópias de `createError()` em 6 services | Inconsistência, bug propagation | 1 error hierarchy |
| `console.log` espalhado | Zero observabilidade | Pino estruturado |
| Regex de validação duplicado | Falhas silenciosas | Zod schemas |
| SQL direto em services | Intestável, sem isolamento | BaseRepository + Kysely |
| `normalizeEmail()` em 5 services | Código duplicado | 1 utility function |
| `columnExists()` em 5 services | Acoplamento a schema interno | 1 utility function |

### O que NÃO entra

| Item | Motivo | Destino |
|------|--------|---------|
| Regras de negócio de nicho | Shared Kernel é genérico | `src/services/*` domain |
| Config de APIs externas | Varia por ambiente | `.env` |
| Rotas Express | Camada de apresentação | `src/routes/*` |
| Componentes React | Frontend isolado | `frontend/src/` |
| Templates de email | Específico de canal | Integration Layer (futuro) |

---

## 2. Arquitetura do Shared Kernel

```
backend/src/
├── shared/                          ← Shared Kernel (criar)
│   ├── errors/
│   │   ├── AppError.js              ← Classe base
│   │   ├── ValidationError.js
│   │   ├── NotFoundError.js
│   │   ├── AuthError.js
│   │   ├── ForbiddenError.js
│   │   └── middleware.js            ← Error handling middleware
│   ├── logger/
│   │   └── index.js                 ← Pino setup
│   ├── validation/
│   │   ├── index.js                 ← Re-export all schemas
│   │   ├── appointment.schema.js
│   │   ├── sale.schema.js
│   │   ├── collaborator.schema.js
│   │   ├── service.schema.js
│   │   ├── product.schema.js
│   │   ├── company.schema.js
│   │   └── auth.schema.js
│   ├── database/
│   │   ├── BaseRepository.js        ← CRUD genérico + company_id
│   │   ├── KyselyBuilder.js         ← Kysely instance factory
│   │   └── migrations.js            ← Migration runner helper
│   └── utils/
│       ├── string.js                ← normalizeEmail, slugify, etc.
│       ├── database.js              ← columnExists, tableExists, etc.
│       ├── pagination.js            ← paginate helper
│       └── correlation.js           ← generateCorrelationId, generateTraceId
├── services/                        ← Existentes, mantidos
├── controllers/                     ← Existentes, mantidos
└── server.js                        ← Adiciona error middleware import
```

### Princípios

1. **Drop-in, não rewrite**: cada fase deve funcionar sem alterar código existente
2. **Adoção gradual**: serviços existentes continuam funcionando; código novo usa Shared Kernel
3. **Zero breaking change**: nenhuma fase quebra o que já funciona
4. **Testável desde o dia 1**: cada componente tem testes unitários

---

## 3. Fase 0 — Ambiente e Scaffold

### Dependências a instalar

```bash
npm install zod pino kysely
npm install --save-dev vitest
```

### Estrutura a criar

```bash
mkdir -p src/shared/{errors,logger,validation,database,utils}
```

### server.js — Adicionar import do error middleware

```diff
+ const { errorHandler } = require('./shared/errors/middleware');

  // Existing middleware stack
  app.use(cors());
  app.use(express.json({ limit: '3mb' }));

  // Existing routes...

+ // Error handler (must be last)
+ app.use(errorHandler);
```

### Config do Kysely

```javascript
// src/shared/database/KyselyBuilder.js
const { Pool } = require('pg');
const { Kysely, PostgresDialect } = require('kysely');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const db = new Kysely({
  dialect: new PostgresDialect({ pool }),
});

module.exports = { db, pool };
```

### Duração estimada: 1 hora

---

## 4. Fase 1 — Error Classes + Middleware

### AppError (classe base)

```javascript
// src/shared/errors/AppError.js
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
```

### Subclasses

```javascript
// src/shared/errors/ValidationError.js
const { AppError } = require('./AppError');
class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}
```

```javascript
// src/shared/errors/NotFoundError.js
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}
```

```javascript
// src/shared/errors/AuthError.js
class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
  }
}
```

```javascript
// src/shared/errors/ForbiddenError.js
class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}
```

### Error middleware centralizado

```javascript
// src/shared/errors/middleware.js
const { AppError } = require('./AppError');

function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      ...(err.errors && { errors: err.errors }),
    });
  }

  console.error('[UNHANDLED ERROR]', err);
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };
```

### O que muda nos controllers

```diff
- function sendError(res, error, fallbackMessage) { ... }
+ const { asyncHandler } = require('../shared/errors/middleware');

- router.get('/appointments', async (req, res) => {
-   try { ... } catch (err) { sendError(res, err, '...'); }
- });
+ router.get('/appointments', asyncHandler(async (req, res) => {
+   ...
+ }));
```

### O que muda nos services

```diff
- function createError(message, statusCode) { ... }
- throw createError('Invalid data', 400);
+ const { ValidationError } = require('../shared/errors/ValidationError');
+ throw new ValidationError('Invalid data');
```

### Duração estimada: 4 horas

---

## 5. Fase 2 — Logger Estruturado (Pino)

### Setup do logger

```javascript
// src/shared/logger/index.js
const pino = require('pino');
const { generateCorrelationId } = require('../utils/correlation');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty' }
    : undefined,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
});

function childLogger(correlationId) {
  return logger.child({ correlationId: correlationId || generateCorrelationId() });
}

module.exports = { logger, childLogger };
```

### Express middleware de correlation ID

```javascript
// src/shared/middleware/correlation.js (criar)
const { generateCorrelationId } = require('../utils/correlation');
const { childLogger } = require('../logger');

function correlationMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
  req.correlationId = correlationId;
  req.log = childLogger(correlationId);
  res.setHeader('x-correlation-id', correlationId);
  next();
}
```

### Adoção gradual

- Services existentes continuam com `console.log` (não tocar)
- Novo código usa `req.log.info(...)`, `req.log.error(...)`
- Após Fase 4 (BaseRepository), repositories logam automaticamente

### Duração estimada: 2 horas

---

## 6. Fase 3 — Zod Schemas + Validação

### Schema de agendamento (exemplo)

```javascript
// src/shared/validation/appointment.schema.js
const { z } = require('zod');

const createAppointmentSchema = z.object({
  collaboratorId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  clientName: z.string().min(1).max(100).optional(),
  clientPhone: z.string().regex(/^\+?\d{10,15}$/).optional(),
  notes: z.string().max(500).optional(),
});

const updateAppointmentSchema = createAppointmentSchema.partial();

module.exports = { createAppointmentSchema, updateAppointmentSchema };
```

### Schema de venda (exemplo)

```javascript
// src/shared/validation/sale.schema.js
const { z } = require('zod');

const saleItemSchema = z.object({
  productId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1),
  paymentMethod: z.enum(['cash', 'credit', 'debit', 'pix', 'transfer']),
  customerId: z.string().uuid().optional(),
  discount: z.number().min(0).optional(),
});

module.exports = { createSaleSchema, saleItemSchema };
```

### Middleware de validação

```javascript
// src/shared/validation/middleware.js (criar)
const { ValidationError } = require('../errors/ValidationError');

function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }
    req.validatedBody = result.data;
    next();
  };
}

module.exports = { validate };
```

### Uso nas rotas

```diff
+ const { validate } = require('../shared/validation/middleware');
+ const { createAppointmentSchema } = require('../shared/validation/appointment.schema');

- router.post('/appointments', controller.create);
+ router.post('/appointments', validate(createAppointmentSchema), controller.create);
```

### Duração estimada: 6 horas

---

## 7. Fase 4 — BaseRepository + Kysely

### BaseRepository genérico

```javascript
// src/shared/database/BaseRepository.js
const { db, pool } = require('./KyselyBuilder');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db;
  }

  async findById(id, companyId) {
    let query = this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('id', '=', id);

    if (companyId) {
      query = query.where('company_id', '=', companyId);
    }

    return query.executeTakeFirst();
  }

  async findAll({ companyId, page = 1, limit = 50, orderBy = 'created_at', order = 'desc' } = {}) {
    let query = this.db
      .selectFrom(this.tableName)
      .selectAll();

    if (companyId) {
      query = query.where('company_id', '=', companyId);
    }

    const offset = (page - 1) * limit;

    const results = await query
      .orderBy(orderBy, order)
      .limit(limit)
      .offset(offset)
      .execute();

    const countResult = await this.db
      .selectFrom(this.tableName)
      .select(this.db.fn.count('id').as('total'))
      .executeTakeFirst();

    return {
      data: results,
      pagination: {
        page,
        limit,
        total: Number(countResult?.total || 0),
        totalPages: Math.ceil(Number(countResult?.total || 0) / limit),
      },
    };
  }

  async create(data) {
    const [result] = await this.db
      .insertInto(this.tableName)
      .values(data)
      .returningAll()
      .execute();

    return result;
  }

  async update(id, data, companyId) {
    let query = this.db
      .updateTable(this.tableName)
      .set({ ...data, updated_at: new Date().toISOString() })
      .where('id', '=', id);

    if (companyId) {
      query = query.where('company_id', '=', companyId);
    }

    const [result] = await query.returningAll().execute();
    return result;
  }

  async delete(id, companyId) {
    let query = this.db
      .deleteFrom(this.tableName)
      .where('id', '=', id);

    if (companyId) {
      query = query.where('company_id', '=', companyId);
    }

    const [result] = await query.returningAll().execute();
    return result;
  }

  async transaction(callback) {
    return this.db.transaction().execute(async (trx) => {
      return callback(trx);
    });
  }
}

module.exports = { BaseRepository };
```

### Exemplo de uso (domain repository)

```javascript
// src/services/repositories/AppointmentRepository.js (criar)
const { BaseRepository } = require('../../shared/database/BaseRepository');

class AppointmentRepository extends BaseRepository {
  constructor() {
    super('appointments');
  }

  async findByDate(companyId, date) {
    return this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('company_id', '=', companyId)
      .where('date', '=', date)
      .orderBy('start_time', 'asc')
      .execute();
  }

  async findByCollaborator(companyId, collaboratorId, date) {
    return this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('company_id', '=', companyId)
      .where('collaborator_id', '=', collaboratorId)
      .where('date', '=', date)
      .execute();
  }

  async countByStatus(companyId, status, dateStart, dateEnd) {
    const result = await this.db
      .selectFrom(this.tableName)
      .select(this.db.fn.count('id').as('total'))
      .where('company_id', '=', companyId)
      .where('status', '=', status)
      .where('date', '>=', dateStart)
      .where('date', '<=', dateEnd)
      .executeTakeFirst();

    return Number(result?.total || 0);
  }
}
```

### Estratégia de migração

| Etapa | Ação | Risco |
|-------|------|-------|
| 1 | Criar 1 repository (ex: Appointment) | Baixo — novo código só |
| 2 | Mover 1 função do service para o repository | Médio — testar exaustivamente |
| 3 | Trocar chamada no service | Médio — feature flag opcional |
| 4 | Repetir para cada entidade | Baixo — padrão validado |
| 5 | Remover `pool.query` do service | Baixo — repository assume |

### Duração estimada: 12 horas

---

## 8. Fase 5 — Utilitários + Extração

### Utilitários

```javascript
// src/shared/utils/string.js
function normalizeEmail(email) {
  if (!email) return null;
  return email.toLowerCase().trim();
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

module.exports = { normalizeEmail, slugify };
```

```javascript
// src/shared/utils/database.js
const { pool } = require('../database/KyselyBuilder');

async function columnExists(table, column) {
  const result = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = $1 AND column_name = $2
  `, [table, column]);
  return result.rows.length > 0;
}

async function tableExists(table) {
  const result = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_name = $1
  `, [table]);
  return result.rows.length > 0;
}

module.exports = { columnExists, tableExists };
```

```javascript
// src/shared/utils/pagination.js
function paginate(page = 1, limit = 50) {
  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  return {
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
    page: safePage,
  };
}

module.exports = { paginate };
```

```javascript
// src/shared/utils/correlation.js
const { randomUUID } = require('crypto');

function generateCorrelationId() {
  return randomUUID();
}

module.exports = { generateCorrelationId };
```

### Extração de padrões existentes

| Padrão | Onde está hoje | Para onde vai |
|--------|---------------|---------------|
| `normalizeEmail()` | 5 services | `shared/utils/string.js` |
| `columnExists()` | 5 services | `shared/utils/database.js` |
| Schema introspection | master.service.js | `shared/utils/database.js` |
| Formatação de data | Vários | `shared/utils/date.js` |
| `isEmptyValue()` | Vários | `shared/utils/string.js` |

### Duração estimada: 4 horas

---

## 9. Fase 6 — Testes

### Setup Vitest

```bash
npm install --save-dev vitest
```

```javascript
// vitest.config.js (na raiz do backend)
const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
```

### Testes do Error Handler

```javascript
// src/shared/errors/middleware.test.js
const { describe, it, expect } = require('vitest');
const { AppError } = require('./AppError');
const { ValidationError } = require('./ValidationError');
const { errorHandler } = require('./middleware');

describe('errorHandler', () => {
  it('returns 400 for ValidationError', () => {
    const err = new ValidationError('Invalid', [{ field: 'name', message: 'Required' }]);
    const res = { status: () => ({ json: () => {} }) };
    // ... assertion
  });
});
```

### Testes do BaseRepository

```javascript
// src/shared/database/BaseRepository.test.js
// Integration test with testcontainers or a dedicated test DB
```

### Duração estimada: 8 horas

---

## 10. Estratégia de Rollout

### Fases e Duração

| Fase | O que | Duração | Impacto | Risco |
|------|-------|---------|---------|-------|
| 0 | Scaffold + deps | 1h | Nenhum | Mínimo |
| 1 | Error classes + middleware | 4h | Nenhum (drop-in) | Baixo |
| 2 | Pino logger | 2h | Nenhum (console.log mantido) | Baixo |
| 3 | Zod schemas | 6h | Nenhum (middleware opcional) | Baixo |
| 4 | BaseRepository + Kysely | 12h | Nenhum (novo código só) | Médio |
| 5 | Utilitários | 4h | Nenhum (extração pura) | Baixo |
| 6 | Testes | 8h | Nenhum | Mínimo |

**Total estimado: ~37 horas (1 semana)**

### Ordem recomendada de adoção nos services

```
1. AppointmentRepository    → primeiro (mais isolado)
2. SaleRepository           → segundo (depende de appointments)
3. CollaboratorRepository   → terceiro
4. ServiceRepository        → quarto
5. ProductRepository        → quinto
6. CompanyRepository        → sexto (já tem master.service.js)
```

### Feature flags (opcionais)

```javascript
// Para rollback seguro, usar env var:
const USE_REPOSITORY = process.env.USE_REPOSITORY === 'true';
// Ou feature flag por entidade:
const REPOSITORY_FLAGS = {
  appointment: true,
  sale: false,  // ainda não migrado
};
```

---

## 11. Critérios de Sucesso

### Fase 1 — Error Classes

- [ ] Nenhum `createError()` novo foi criado (só os 6 existentes permanecem)
- [ ] Pelo menos 1 controller migrou de `sendError` para `asyncHandler`
- [ ] Error middleware substitui 3 versões de `sendError`

### Fase 2 — Logger

- [ ] Correlation middleware ativo em server.js
- [ ] Pelo menos 1 service recebeu logs estruturados
- [ ] `console.log` removido em 1 módulo

### Fase 3 — Zod Schemas

- [ ] Schemas existem para: appointment, sale, collaborator, service, product
- [ ] Pelo menos 1 rota usa `validate()` middleware
- [ ] Nenhuma regex de validação nova foi criada

### Fase 4 — BaseRepository

- [ ] BaseRepository existe e funciona
- [ ] Pelo menos 1 entidade tem repository dedicado
- [ ] Pelo menos 1 service usa repository (reduzindo `pool.query`)

### Fase 5 — Utilitários

- [ ] `normalizeEmail` removido de todos os services (usa shared)
- [ ] `columnExists` centralizado
- [ ] Feature guards (planFeatures.js) não duplicados no frontend

### Fase 6 — Testes

- [ ] Error classes têm testes unitários
- [ ] BaseRepository tem teste de integração
- [ ] Pelo menos 1 schema Zod tem teste
- [ ] Cobertura mínima: 30% no shared kernel

---

## 12. Checklist de Gate

### Gate obrigatório antes de iniciar a Fase 1

- [ ] V-01: Nenhuma capability foi implementada fora de ordem (C-01 é a única ativa)
- [ ] V-02: Nenhum agente/IA está implementando C-03, C-04 ou C-05
- [ ] V-03: Plano de rollback documentado (este documento)
- [ ] V-04: Nenhuma feature nova em desenvolvimento que dependa de Shared Kernel
- [ ] V-05: `barber.service.js` não foi alterado durante a implementação

### Gate obrigatório entre fases

| # | Gate | Quem valida |
|---|------|-------------|
| 1 | Testes da fase anterior passam | `npm test` |
| 2 | Nenhum regression nos services existentes | Testes manuais (auth, email) |
| 3 | Nenhum breaking change introduzido | `git diff` review |
| 4 | Próxima fase não depende de código ainda não existente | Dependências checadas |

---

## Apêndice A — Mapa de Migração

### Arquivos a criar (novos)

```
src/shared/errors/AppError.js
src/shared/errors/ValidationError.js
src/shared/errors/NotFoundError.js
src/shared/errors/AuthError.js
src/shared/errors/ForbiddenError.js
src/shared/errors/middleware.js
src/shared/errors/index.js
src/shared/logger/index.js
src/shared/middleware/correlation.js
src/shared/validation/index.js
src/shared/validation/middleware.js
src/shared/validation/appointment.schema.js
src/shared/validation/sale.schema.js
src/shared/validation/collaborator.schema.js
src/shared/validation/service.schema.js
src/shared/validation/product.schema.js
src/shared/validation/company.schema.js
src/shared/validation/auth.schema.js
src/shared/database/KyselyBuilder.js
src/shared/database/BaseRepository.js
src/shared/database/index.js
src/shared/utils/string.js
src/shared/utils/database.js
src/shared/utils/pagination.js
src/shared/utils/correlation.js
src/shared/utils/date.js
src/shared/utils/index.js
src/services/repositories/AppointmentRepository.js
src/services/repositories/SaleRepository.js
src/services/repositories/CollaboratorRepository.js
src/services/repositories/ServiceRepository.js
src/services/repositories/ProductRepository.js
src/services/repositories/CompanyRepository.js
```

### Arquivos a modificar

```
server.js                              → Adicionar error middleware + correlation
barber.controller.js                   → Migrar para asyncHandler (gradual)
auth.controller.js                      → Migrar para asyncHandler (gradual)
master.controller.js                    → Migrar para asyncHandler (gradual)
barber.service.js                       → Adicionar log estruturado (futuro)
```

### Arquivos a NÃO modificar (ainda)

```
frontend/                               → Sem mudanças até Fase 3+
Barber.jsx                              → Sem mudanças até Fase 2 de desacoplamento
planFeatures.js (frontend)              → Aguardar centralização em Fase 5
```

---

## Apêndice B — Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Kysely não suporta query compatível com SQL atual | Baixa | Médio | BaseRepository usa `db.raw()` como fallback |
| Pino no `console.log` existente quebra logs | Baixa | Baixo | Console.log mantido, Pino adicionado |
| Zod schema mais restritivo que dados reais | Média | Alto | `safeParse` + log de warning, não block |
| Repository aumenta latência | Baixa | Baixo | Kysely é thin wrapper sobre pool.query |
| Time não consegue adotar gradualmente | Média | Alto | Feature flags por entidade |
| Express 5 incompatibilidade com middleware | Baixa | Alto | Testar errorHandler antes de deploy |
