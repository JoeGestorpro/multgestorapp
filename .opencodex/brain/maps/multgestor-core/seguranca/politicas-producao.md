---
tipo: componente
area: seguranca
status: parcial
progresso: 50
criticidade: alta
bloqueia_producao: true
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# Políticas de Produção

## O que é
Conjunto de políticas e controles mínimos de segurança/operação antes de expor a clientes pagantes.

## Estado atual
Parcial: XSS endurecido; CSP off; sem alertas externos; LGPD não verificada.

## O que já existe
Helmet, CORS whitelist, correlation ID, Sentry, guards de backup.

## O que falta
CSP ativo (A-007/A-020); alertas de backup/outbox/uptime (A-018); LGPD (exclusão de conta, consentimento, privacidade — A-019/A-023); brute-force no login.

## Riscos
Falhas silenciosas sem alerta; vetor XSS residual sem CSP. Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[auth]] · [[secrets-rotation]]
### Bloqueia
[[PRODUCAO]]
### Usa
[[rls-seguranca]]
### É usado por
[[SISTEMA-VENDAVEL]]

## Próximas ações
Ativar CSP; configurar alertas externos; planejar LGPD mínima.

## Links
- [[rls-seguranca]] · [[RISCOS-MULTGESTOR]]
