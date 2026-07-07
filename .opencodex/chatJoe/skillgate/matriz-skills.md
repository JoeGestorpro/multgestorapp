# Matriz Skills — SkillGate

> Sugestao automatica de skills por tipo de missao + nivel de risco.

## Legenda

- (1) = aplicavel em risco 1-2 apenas
- (3) = aplicavel em risco 3+
- (4/5) = aplicavel em risco 4-5 apenas
- * = obrigatoria neste nivel

## Matriz

| Tipo | Risco 1-2 | Risco 3 | Risco 4-5 |
|---|---|---|---|
| FE | frontend, ux-ui | + testes | + seguranca |
| BE | backend | + testes*, api-design | + seguranca*, auth-review |
| DB | banco-de-dados | banco-de-dados, testes | banco-de-dados*, rls-review*, seguranca |
| SEC | seguranca | seguranca, auth-review | seguranca*, auth-review*, rls-review* |
| BUG | skill do dominio | skill do dominio + testes* | skill do dominio + seguranca* + testes |
| IMP_CTRL | skill do dominio | skill do dominio + testes* | skill do dominio + seguranca* + testes* |
| PROD | — | producao, devops | producao*, devops*, seguranca* |
| LLM | llm, prompt-engineering | llm, prompt-engineering, agent-architecture | llm*, agent-architecture*, seguranca |
| PRD | produto, prd-mvp | produto, prd-mvp | produto, prd-mvp |
| AUDIT_RO | code-review | code-review + skill do dominio | code-review* + seguranca* |
| CR | code-review | code-review + skill do dominio | code-review* + seguranca |
| DOC | documentacao | documentacao | documentacao |
| PLAN | produto | produto | produto, seguranca |
| ROAD | produto, roadmap | produto, roadmap | produto, roadmap |
| CONV | — | — | — |
| COMPACT | — | — | — |
