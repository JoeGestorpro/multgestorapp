# Workflow: /audit-tenant-isolation

## Quando usar
Antes de qualquer release. Quando suspeitar de possível data leak. Ao adicionar novo endpoint de tenant.

## Trigger
```
/audit-tenant-isolation [--file <caminho>] [--full]
```

---

## O que este workflow verifica

1. Queries sem `company_id` em tabelas de tenant
2. Endpoints que não aplicam `requireCompany`
3. JOINs com potencial cross-tenant
4. Eventos publicados sem `company_id`
5. Rotas públicas que acessam dados privados

---

## Passo 1 — Identificar tabelas de tenant

Tabelas que DEVEM ter `company_id` em toda query:
- `barber_services`
- `barber_sales`
- `collaborators`
- `barber_suppliers`
- `barber_products`
- `appointments`
- `customers`
- `cash_sessions`
- `crm_interactions`
- qualquer outra com `company_id` no schema

---

## Passo 2 — Buscar queries sem company_id

```bash
# Busca SELECTs em tabelas tenant sem filtro de company_id
grep -rn "FROM barber_services\|FROM barber_sales\|FROM collaborators\|FROM appointments" \
  backend/src/services/ backend/src/repositories/ \
  | grep -v "company_id\|--\|#"

# Busca INSERTs sem company_id
grep -rn "INSERT INTO barber_services\|INSERT INTO barber_sales\|INSERT INTO collaborators" \
  backend/src/services/ backend/src/repositories/ \
  | grep -v "company_id"
```

---

## Passo 3 — Verificar middlewares nas rotas

```bash
# Rotas barber devem ter requireBarberAdminAuth + requireCompany
grep -n "router\." backend/src/routes/barber.routes.js \
  | grep -v "requireAuth\|requireBarberAdminAuth\|requireCompany\|public\|collaborator-login"
```

---

## Passo 4 — Verificar JOINs suspeitos

Buscar JOINs que não incluem `company_id` em ambas as tabelas:

```bash
grep -rn "JOIN collaborators\|JOIN barber_services\|JOIN appointments" \
  backend/src/services/ backend/src/repositories/ \
  | grep -v "AND.*company_id\|company_id.*AND"
```

---

## Passo 5 — Verificar eventos sem company_id

```bash
grep -rn "eventBus.publish" backend/src/ \
  | grep -v "company_id"
```

---

## Passo 6 — Verificar BaseRepository usado

```bash
# Repositories que NÃO herdam BaseRepository (podem ter queries custom sem company_id)
grep -rn "class.*Repository" backend/src/repositories/ \
  | grep -v "BaseRepository"
```

---

## Report de Auditoria

Para cada problema encontrado, classificar como:
- 🔴 CRÍTICO: query sem company_id em tabela tenant (brecha ativa)
- 🟠 ALTO: JOIN suspeito (potencial brecha dependendo dos dados)
- 🟡 MÉDIO: evento sem company_id (rastreabilidade perdida)
- 🟢 INFO: rota pública sem middleware (OK se for realmente pública)

---

## Checklist de aprovação

```
[ ] Nenhuma query SELECT em tabela tenant sem WHERE company_id = $N
[ ] Nenhum INSERT em tabela tenant sem company_id no payload
[ ] Nenhum UPDATE/DELETE em tabela tenant sem AND company_id = $N
[ ] Nenhum JOIN que permite acesso cross-tenant
[ ] Nenhum evento publicado sem company_id no metadata
[ ] Todas as rotas de tenant com requireCompany aplicado
[ ] TenantIsolationError lançado quando company não identificada
```
