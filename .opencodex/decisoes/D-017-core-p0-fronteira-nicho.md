# D-017 — Fechar 4 acoplamentos indevidos Core×Nicho (P0 da auditoria 2026-07-03)

> **Status:** DECIDIDO
> **Data:** 2026-07-03
> **Responsável:** execução Claude Code (missão autorizada); commit local, sem push
> **Relacionamentos:** [[decisions/README]] · [[decisions/DECISION-GRAPH]] ·
> [[../../audits/2026-07-03-core-vs-nicho-audit]] · [[../MULTGESTOR-PLATFORM-SPECIFICATION]] ·
> [[../01-CURRENT-STATE]]

---

## Problema

A auditoria Core×Nicho de 2026-07-03 encontrou 4 pontos de acoplamento indevido em arquivos
que já se declaravam genéricos: `company.service.js` importava `barber-helpers` e tinha
defaults `'Barbearia'` hardcoded; `clima.routes.js` usava `requireBarberAdminAuth` (guard de
outro módulo); `ModuleRoute.jsx`/`AuthContext.jsx` tinham scopes fixos `'barber_admin'`/`'master'`
como literais soltos. Isso bloqueava qualquer nicho novo e, no caso do clima, era um bug de
segurança real (autorização emprestada de outro módulo).

## Contexto

Nenhum desses arquivos podia ser corrigido "generalizando de verdade" sem inventar capacidade
que não existe: hoje só existe UM auth_scope de tenant (`barber_admin`) para todas as empresas,
independente do nicho — não há um escopo por módulo no sistema. Criar uma API que fingisse
suportar isso seria desonesto (viola o princípio §2.5 da Platform Specification).

## Alternativas

### Alternativa A — Reescrever o sistema de auth_scope para ser por módulo agora
Resolveria a raiz, mas é uma mudança grande, arriscada, e não pedida pela missão (que
explicitamente proíbe "implementar registry dinâmico agora"). **Rejeitada por escopo.**

### Alternativa B — Deixar como está, documentar como dívida
Não resolve o bug de segurança real do clima (autorização de outro módulo). **Rejeitada.**

### Alternativa C — Correção pontual + nomes honestos ✅ ESCOLHIDA
Extrair o que é genuinamente Core para dentro do Core (guards de tenant, defaults), mover o que
é genuinamente Nicho para dentro do módulo (join com `barber_collaborators`), e criar um alias
genérico (`requireTenantAdminAuth`) que documenta a limitação real em vez de escondê-la.

## Decisão

Implementado (commits locais, sem push):
1. `shared/tenant/guards.js` ganhou `ensureCompany`/`ensureAdmin` genéricos (Core), reusando
   `ForbiddenError` já existente — zero divergência de comportamento (`toAppError` já convertia
   o erro plano em `ForbiddenError` antes; agora é direto).
2. `company.service.js` não importa mais `utils/barber-helpers`; `getBarberMe` (join com
   `barber_collaborators`) foi movido para `barber-core.service.js` — dentro da fronteira do
   módulo barber, onde essa tabela pertence.
3. `auth.middleware.js` ganhou `requireTenantAdminAuth` como alias explícito de
   `requireBarberAdminAuth`, com comentário documentando que hoje é a mesma implementação
   porque não existe scope por módulo — `clima.routes.js` passou a usar o alias.
4. Frontend: `constants/authScopes.js` novo, com `AUTH_SCOPE_MASTER`/`AUTH_SCOPE_TENANT_ADMIN`
   substituindo literais em `ModuleRoute.jsx` e `AuthContext.jsx`.

## Justificativa

Menor raio de mudança possível que resolve os 4 achados sem inventar capacidade inexistente.
Todas as trocas de import mantêm exatamente a mesma assinatura/comportamento (confirmado por
leitura de `toAppError.js` para os erros, e por reexecução completa da suíte de testes).

## Impacto

### Positivo
- `company.service.js` agora é Core de verdade — nenhuma referência a tabela/helper de nicho.
- Bug de segurança do clima corrigido (guard próprio, não emprestado do barber) — embora hoje
  ainda resolva para a mesma checagem de scope, o nome deixa de mentir sobre o que verifica.
- 3 testes unitários realocados para `barber-core-service.test.js` (mesma cobertura, local correto).
- `MULTGESTOR-PLATFORM-SPECIFICATION.md` criado como documento constitucional formal.

### Negativo / Riscos
- `requireTenantAdminAuth` é hoje literalmente o mesmo código que `requireBarberAdminAuth` —
  não resolve a limitação de fundo (um único scope para todos os nichos). Isso é dívida
  documentada explicitamente (§2.5, §9 da Platform Specification), não uma correção completa.
- Nenhum push feito — mudança existe só localmente até autorização humana.

### Arquivos Afetados
`backend/src/shared/tenant/guards.js`, `backend/src/shared/tenant/index.js`,
`backend/src/services/company.service.js`, `backend/src/services/barber-core.service.js`,
`backend/src/middlewares/auth.middleware.js`, `backend/src/routes/clima.routes.js`,
`frontend/src/routes/ModuleRoute.jsx`, `frontend/src/contexts/AuthContext.jsx`,
`frontend/src/constants/authScopes.js` (novo),
`backend/tests/unit/company-service.test.js`, `backend/tests/unit/barber-core-service.test.js`.

## Commits/PRs Relacionados

Commits locais desta missão (sem push) — ver `git log` a partir de `7046bd4`.

## Lições Aprendidas

- "Corrigir acoplamento" nem sempre significa "generalizar mais" — às vezes significa nomear
  honestamente uma limitação real em vez de escondê-la atrás de uma API genérica falsa.
- `toAppError` (Core errors) já normaliza qualquer erro com `.statusCode` — isso tornou seguro
  trocar `createError()` ad-hoc por `AppError`/`NotFoundError` sem risco de mudar resposta HTTP.

## Checklist

- [x] Decisão registrada
- [x] Impacto documentado
- [x] Segundo Cérebro sincronizado (Platform Specification, current-state, next-task)
- [x] Próximos passos definidos (registry dinâmico de rotas — P1, condicionado a decisão sobre
      o destino do ClimaGestor)
