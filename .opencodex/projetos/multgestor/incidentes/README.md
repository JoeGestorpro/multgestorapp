# Incident Library — Second Brain V2

> **Status:** OFICIAL • VIVO
> **Atualizado:** 2026-06-24
> **Propósito:** Biblioteca permanente de incidentes — cada incidente documentado com causa, correção e prevenção.

---

## Template

Cada incidente segue o modelo [[incidents/TEMPLATE-INCIDENT|TEMPLATE-INCIDENT]]:

- Resumo
- Impacto
- Causa
- Correção
- Prevenção
- Arquivos
- Commits
- Deploy
- Responsável
- Data

## Incidentes Registrados

| ID | Título | Data | Severidade | Status |
|---|---|---|---|---|
| INC-001 | Violação L-93 — Migração manual em main | 2026-06-23 | Crítica | ✅ Corrigido |
| INC-002 | Stored XSS em companies.name | 2026-06-14 | Alta | ✅ Corrigido |
| INC-003 | Stored XSS em users.name | 2026-06-14 | Alta | ✅ Corrigido |
| INC-004 | eventBus publish ReferenceError | 2026-06-07 | Crítica | ✅ Corrigido |
| INC-005 | update status='' viola CHECK | 2026-06-07 | Média | ✅ Corrigido |
| INC-006 | Outbox orphaned messages | 2026-06-18 | Média | ✅ Corrigido |
| INC-007 | Exposição anon/PostgREST | 2026-06-22 | Crítica | ✅ Corrigido |

## Referências

- [[lessons-learned]] — Lições aprendidas (fonte consolidada)
- [[lessons/README]] — Lessons Library
- [[linha-do-tempo]] — Timeline de eventos
- [[technical/README]] — Technical Brain
