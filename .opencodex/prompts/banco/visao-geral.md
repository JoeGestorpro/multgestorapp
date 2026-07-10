# Prompts de Banco

> **Status:** VIVO
> **Relacionamentos:** [[prompts/visao-geral]] · [[technical/banco]] · [[technical/rls]]

---

## Prompt: Criar Migration

```
Crie uma migration SQL para [FUNÇÃO] no MultGestor.

Stack: PostgreSQL 17 (Supabase)
Estilo: SQL direto (sem ORM)
Padrão: scripts/run-migrations.js

Requisitos:
1. [REQUISITO 1]
2. [REQUISITO 2]

Regras:
- Toda tabela tenant tem company_id + RLS
- Usar CHECK constraints para valores válidos
- Incluir índices para performance
- Migration deve ser idempotente (IF NOT EXISTS)

Contexto: [[technical/banco]]
```

## Prompt: Criar RLS Policy

```
Crie uma RLS policy para a tabela [TABELA] no MultGestor.

Stack: PostgreSQL 17 (Supabase)
Padrão: database/rls_tenant_tables.sql

A policy deve:
1. Isolar por company_id
2. Ter USING (leitura) e WITH CHECK (escrita)
3. Ser ENFORCED para role app_runtime
4. BYPASS para role postgres (admin)

Contexto: [[technical/rls]]
```

## Referências

- [[technical/banco]] — Banco detalhado
- [[technical/rls]] — RLS detalhado
- [[decisoes-arquiteturais#ADR-02]] — Sem ORM
