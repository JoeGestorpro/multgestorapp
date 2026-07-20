# Próximas Validações — MultGestor Core (pós-Gate 4)

**Data:** 2026-07-20 | **Gate 4:** Reconciliação aplicada

---

## Via MCPs (8)

| ID | Validação | MCP | Prioridade |
|----|-----------|-----|-----------|
| VAL-MCP-01 | RLS cross-tenant | Supabase execute_sql | **Alta** |
| VAL-MCP-02 | schema_migrations | Supabase execute_sql | **Alta** |
| VAL-MCP-03 | Logs auth | Supabase get_logs | Média |
| VAL-MCP-04 | Logs email | Supabase get_logs | Média |
| VAL-MCP-05 | Webhooks billing | Supabase get_logs | Média |
| VAL-MCP-06 | App Runtime role | Supabase execute_sql | **Alta** |
| VAL-MCP-07 | Outbox messages | Supabase execute_sql | Média |
| VAL-MCP-08 | Refresh tokens | Supabase execute_sql | Baixa |

## Via Render (4)

| ID | Validação | Prioridade |
|----|-----------|-----------|
| VAL-RENDER-01 | REDIS_URL configurado? | **Alta** |
| VAL-RENDER-02 | buildCommand real | **Alta** |
| VAL-RENDER-03 | Logs de deploy | Média |
| VAL-RENDER-04 | Migrations no deploy | **Alta** |

## Código (4 restantes)

| ID | Validação | Comando | Prioridade |
|----|-----------|---------|-----------|
| VAL-CODE-01 | barber-core.service.js uso | `rg "barber-core" controllers/` | **Alta** |
| VAL-CODE-02 | Coverage backend | `npm test -- --coverage` | Média |
| VAL-CODE-03 | Frontend build | `npm run build` | Média |
| VAL-CODE-06 | Controllers → barber.service vs core | `rg "require.*barber" controllers/` | **Alta** |

## Documentação (4)

| ID | Documento | Ação |
|----|-----------|------|
| VAL-DOC-01 | AUDIT_REPORT.md | Remover 5 descartadas |
| VAL-DOC-02 | capabilities-map.md | Repository/EventBus → implementados |
| VAL-DOC-03 | runtime-map.md | Refresh token → implementado |
| VAL-DOC-04 | PLATFORM_ARCHITECTURE.md | R9 → resolvido |

## Nicho (3)

| ID | Validação | Prioridade |
|----|-----------|-----------|
| VAL-NICHO-01 | ClimaGestor CRUD via shared kernel | **Alta** |
| VAL-NICHO-02 | Activation flow end-to-end | **Alta** |
| VAL-NICHO-03 | Frontend ModuleRoute para clima | Média |

---

## Faseamento

### Fase 1 (imediato): VAL-MCP-01,02,06 + VAL-CODE-01 + VAL-DOC-01-04
### Fase 2 (semana): VAL-RENDER-01,02 + VAL-MCP-07 + VAL-NICHO-01
### Fase 3 (mês): VAL-CODE-02 + VAL-MCP-03-05 + VAL-NICHO-02-03

---

## Resumo

| Categoria | Qtd |
|-----------|-----|
| Via MCP | 8 |
| Via Render | 4 |
| Código | 4 |
| Documentação | 4 |
| Nicho | 3 |
| **Total** | **23 pendentes** |
| Já executadas | 2 |
