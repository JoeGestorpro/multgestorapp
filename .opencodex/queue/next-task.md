# 📥 NEXT TASK — Bloco A: sanitização dos registros XSS já armazenados

> Escrito pelo **Claude Code**. Execução via **MCP Supabase** (não via OpenCode Executor).
> **Pré-requisito JÁ ATENDIDO:** o portão de entrada (Bloco B) está **live em produção** —
> nenhum payload HTML novo entra durante a limpeza.

---
status: pending
task_id: xss-data-sanitization-block-a
title: Sanitizar `companies.name` dos 3 registros maliciosos remanescentes (stored XSS)
mode: MCP_SUPABASE_GUARDED
requires_human_approval: true
created_by: Claude Code
created_at: 2026-06-14
depends_on: fix-xss-register-hardening (DONE — b75d34a, deployado)
---

## Contexto
3 empresas têm payloads de XSS armazenados em `companies.name` (sessão de pentest 2026-04-28).
O frontend React escapa por padrão (sem `dangerouslySetInnerHTML`) e os emails escapam via
`baseLayout`, então **não há exploração ativa** — mas os dados devem ser neutralizados.

## IDs autorizados (e SOMENTE estes 3)
- `ceff8114-b490-4103-9ba8-6b1e7b4133e9`
- `ae9a18dc-9bda-4a94-9c90-2ba09baba58a`
- `db0aaf31-baf2-48b2-af52-e9180983f76e`

## Procedimento obrigatório (nesta ordem)
1. **SELECT prévio** (confirmar os 3 IDs e o conteúdo malicioso atual):
   ```sql
   SELECT id, name FROM companies
   WHERE id IN ('ceff8114-b490-4103-9ba8-6b1e7b4133e9',
                'ae9a18dc-9bda-4a94-9c90-2ba09baba58a',
                'db0aaf31-baf2-48b2-af52-e9180983f76e');
   ```
2. **APROVAÇÃO HUMANA explícita** antes de qualquer escrita.
3. **UPDATE somente nos 3 IDs** (idempotente, sem DELETE):
   ```sql
   UPDATE companies
   SET name = 'Empresa (nome sanitizado)', updated_at = NOW()
   WHERE id IN ('ceff8114-b490-4103-9ba8-6b1e7b4133e9',
                'ae9a18dc-9bda-4a94-9c90-2ba09baba58a',
                'db0aaf31-baf2-48b2-af52-e9180983f76e');
   ```
4. **SELECT pós-validação** (esperado: 0 linhas):
   ```sql
   SELECT count(*) FROM companies WHERE name ~ '[<>]';
   ```

## Proibições (vinculantes)
- ❌ DELETE / DROP / TRUNCATE.
- ❌ UPDATE fora dos 3 IDs listados.
- ❌ Qualquer alteração de código (backend/frontend).
- ❌ Deploy manual.
- ❌ Mudança em `DATABASE_URL` / secrets.
- ❌ Executar sem o SELECT prévio e sem aprovação humana.

## Critérios de aceite
- [ ] SELECT prévio confirmou os 3 IDs.
- [ ] Aprovação humana registrada.
- [ ] UPDATE afetou exatamente 3 linhas.
- [ ] SELECT pós → `count = 0` para `name ~ '[<>]'`.
