# INC-001 — Violação L-93 — Migração manual em main

> **Status:** CORRIGIDO
> **Data:** 2026-06-23
> **Severidade:** CRÍTICA
> **Responsável:** — (detectado em auditoria)
> **Relacionamentos:** [[incidents/README]] · [[lessons-learned#L-93]]

---

## Resumo

Migração parcial aplicada manualmente em `main` com alterações experimentais. Schema drift detectado em auditoria.

## Impacto

- Risco de schema drift irreversível
- Alterações experimentais em branch de produção
- Quebra do fluxo de governança (migrations só via CI/MCP)

## Causa

- Acesso direto ao banco de produção via MCP Supabase
- Alteração aplicada sem PR, sem revisão, sem approval
- Ausência de gate que impeça migrations diretas em `main`

## Correção

- Incidente documentado em auditoria ([[audits/AUDITORIA-INCIDENTE-2026-06-23-violacao-l93]])
- Reforço da regra: migrations são aplicadas exclusivamente via CI ou MCP com autorização
- L-93 registrada em [[lessons-learned]]

## Prevenção

- [ ] Implementar gate que bloqueie migrations diretas em `main`
- [ ] Restringir permissão MCP para banco de produção
- [ ] Toda migration precisa de PR aprovado
- [ ] Auditoria periódica de schema drift

## Lição Relacionada

- L-93 — Migração manual em `main` sem PR

## Referências

- [[audits/AUDITORIA-INCIDENTE-2026-06-23-violacao-l93]]
- [[03-TIMELINE#2026-06-23]]
- [[project-state]]
