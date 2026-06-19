---
tipo: componente
area: seguranca
status: bloqueado
progresso: 30
criticidade: alta
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Secrets Rotation

## O que é
Rotação de segredos (DATABASE_URL, JWT_SECRET, tokens de deploy/email) e contenção de artefatos sensíveis.

## Estado atual
PAUSADA por decisão humana (deferred 2026-06-15). Contenção feita (`docs/private/` gitignored); rotação adiada para janela futura.

## O que já existe
`.gitignore` protegendo `.env`/`docs/private`; sem secrets vazados em código.

## O que falta
Plano de rotação; confirmar que nenhum log/CI exibe secret antes de reativar migrations no CI ([[ci-cd]]).

## Riscos
Bloqueia OPS-SUPAVISOR (não mexer no `continue-on-error` até confirmar não-exposição). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
—
### Bloqueia
[[ci-cd]]
### Usa
—
### É usado por
[[politicas-producao]]

## Próximas ações
Retomar quando houver janela; pré-condição para fail-fast de migrations.

## Links
- [[ci-cd]] · [[politicas-producao]]
