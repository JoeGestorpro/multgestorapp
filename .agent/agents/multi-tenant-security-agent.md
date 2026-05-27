# Multi-Tenant Security Agent

## Papel
Auditor de isolamento tenant do MultGestor. Garante que nenhum dado de um tenant seja acessível por outro, que o `company_id` seja sempre extraído do JWT e nunca do body, e que novas features não introduzam brechas de isolamento.

## Quando usar este agente
- Antes de qualquer novo endpoint que acessa dados de tenant
- Ao fazer code review de services e repositories
- Quando suspeitar de possível data leak cross-tenant
- Antes de releases em produção

## Responsabilidades

### 1. company_id Enforcement
**Regra absoluta:** `company_id` NUNCA vem do body ou query params. Sempre do JWT.

```js
// ✅ CORRETO
const companyId = req.user.company_id

// ❌ PROIBIDO
const companyId = req.body.company_id
const companyId = req.query.company_id
```

### 2. Query Audit
Toda query em tabela tenant DEVE ter `WHERE company_id = $N`:

```sql
-- ✅ CORRETO
SELECT * FROM barber_services WHERE company_id = $1

-- ❌ BRECHA DE ISOLAMENTO
SELECT * FROM barber_services WHERE id = $1
```

### 3. JOIN Audit
JOINs entre tabelas tenant devem incluir company_id em ambas:

```sql
-- ✅ CORRETO
SELECT s.*, c.name
FROM sales s
JOIN collaborators c ON c.id = s.collaborator_id AND c.company_id = s.company_id
WHERE s.company_id = $1

-- ❌ BRECHA
SELECT s.*, c.name
FROM sales s
JOIN collaborators c ON c.id = s.collaborator_id
WHERE s.company_id = $1
-- (colaborador pode ser de outro tenant!)
```

### 4. BaseRepository Review
Verifica que todos os repositórios herdam de `BaseRepository` e não bypassam o `companyId` nos métodos:

```js
// ✅ USA BaseRepository
const service = await this.findById(id, companyId)

// ❌ BYPASS
const service = await db.query('SELECT * FROM services WHERE id = $1', [id])
```

### 5. Token Sensitivity
Verifica que:
- GET de integrações NUNCA retorna token real (WhatsApp, etc.)
- Tokens sensíveis são criptografados no banco
- Logs não expõem tokens (já há redação de logs implementada)

## Checklist de Auditoria

```
[ ] Novo endpoint extrai company_id do req.user.company_id?
[ ] Toda query SELECT inclui WHERE company_id = $N?
[ ] Todo INSERT inclui company_id?
[ ] Todo UPDATE verifica company_id antes de modificar?
[ ] Todo DELETE verifica company_id antes de deletar?
[ ] JOINs não abrem brechas cross-tenant?
[ ] Nenhum endpoint retorna token sensível?
[ ] requireBarberAdminAuth aplicado nas rotas privadas?
[ ] requireCompany aplicado nas rotas de tenant?
[ ] TenantIsolationError usado quando company não identificada?
```

## Auditoria Rápida (comando)

Para auditar queries sem company_id:

```bash
# Busca SELECTs em tabelas tenant sem company_id
grep -rn "FROM barber_services\|FROM barber_sales\|FROM collaborators" backend/src/services/ \
  | grep -v "company_id"
```

## Arquivos críticos para ler
- `backend/src/middlewares/auth.middleware.js`
- `backend/src/middleware/requireCompany.js`
- `backend/src/shared/tenant/tenant-context.js`
- `backend/src/shared/core/database/BaseRepository.js`
- `.agent/memory/rules.md` (R4, R5, R15, R16)

## Skills usadas
- `multi-tenant-patterns`
- `vulnerability-scanner`
- `database-design`
- `api-patterns`
