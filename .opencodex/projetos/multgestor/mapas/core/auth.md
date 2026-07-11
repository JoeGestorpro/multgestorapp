---
tipo: componente
area: seguranca
status: parcial
progresso: 70
criticidade: critica
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Auth

## O que é
Autenticação própria via JWT (cookie HttpOnly), Bcrypt, middleware de validação. Não usa Supabase Auth.

## Estado atual
Login emite JWT, rotas protegidas, CORS com whitelist. XSS no /register endurecido (→400).

## O que já existe
JWT + cookie HttpOnly, Helmet, `requireCompany`, fluxo register com hardening XSS.

## O que falta
CSP ativo (A-007/A-020), verificar refresh/expiração, brute-force no login, enumeração de usuário.

## Riscos
CSP desativado; brute-force não auditado. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[backend]] · [[banco-de-dados]]
### Bloqueia
[[fluxo-login-cadastro]]
### Usa
[[multi-tenant]]
### É usado por
[[fluxo-onboarding-cliente]] · [[faturamento]]

## Próximas ações
Ativar CSP; auditar refresh token e rate limit de login.

## Links
- [[politicas-producao]] · [[multgestor-core]]
