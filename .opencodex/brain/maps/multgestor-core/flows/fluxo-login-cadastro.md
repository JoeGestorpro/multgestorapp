---
tipo: fluxo
area: produto
status: parcial
progresso: 70
criticidade: alta
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Fluxo: Login e Cadastro

## O que é
Jornada de autenticação: cadastro de empresa, login, recuperação de senha.

## Estado atual
Login emite JWT (cookie HttpOnly); `/register` com `<script>` → 400 (XSS endurecido). Reset de senha existe, não testado E2E.

## O que já existe
Fluxo register/login funcional; hardening XSS; CORS whitelist.

## O que falta
Testar reset de senha; CSP; auditar enumeração de usuário e brute-force.

## Riscos
CSP off; brute-force não auditado. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[auth]]
### Bloqueia
[[fluxo-onboarding-cliente]]
### Usa
[[backend]]
### É usado por
[[barbergestor]]

## Próximas ações
Auditar reset/brute-force; ativar CSP ([[politicas-producao]]).

## Links
- [[auth]] · [[politicas-producao]]
