---
tipo: fluxo
area: comercial
status: parcial
progresso: 50
criticidade: alta
bloqueia_producao: false
bloqueia_venda: true
ultima_revisao: 2026-06-19
---

# Fluxo: Onboarding do Cliente

## O que é
Jornada do dono da barbearia: cadastro → configurar empresa/serviços/colaboradores → primeiro agendamento → começar a usar sem suporte.

## Estado atual
First-access flow existe; não medido/validado como self-service.

## O que já existe
Cadastro de empresa; configuração de serviços/colaboradores/horários; landing pública.

## O que falta
Onboarding guiado simples; meta: primeiro agendamento < 10 min sem suporte; onboarding por nicho (futuro).

## Riscos
Atrito no início → abandono. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[frontend]] · [[auth]] · [[notificacoes]]
### Bloqueia
[[SISTEMA-VENDAVEL]]
### Usa
[[fluxo-login-cadastro]] · [[fluxo-agendamento-publico]]
### É usado por
[[barbergestor]]

## Próximas ações
Desenhar onboarding mínimo após fundação P1.

## Links
- [[SISTEMA-VENDAVEL]] · [[frontend]]
