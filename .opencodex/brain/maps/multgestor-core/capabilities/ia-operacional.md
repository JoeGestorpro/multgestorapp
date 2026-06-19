---
tipo: capability
area: produto
status: planejado
progresso: 5
criticidade: baixa
bloqueia_producao: false
bloqueia_venda: false
ultima_revisao: 2026-06-19
---

# IA Operacional

## O que é
Camada futura de automação/IA: assistente operacional, alertas inteligentes, recomendação, recuperação de inativos.

## Estado atual
**Aspiracional — NÃO implementado.** Documentado em capabilities-map como lacuna; não tratar como real. Relaciona-se ao Autopilot Runner (Fase 0 inerte, gated).

## O que já existe
EventBus/outbox durável (base técnica); Integration Layer. Política do Autopilot (docs inertes).

## O que falta
Tudo de runtime: Automation Engine, AI layer, WhatsApp AI, insights — todos planejados.

## Riscos
Tratar aspiracional como real (lição registrada). Ver [[RISCOS-MULTGESTOR]].

## Relações
### Depende de
[[notificacoes]] · EventBus durável
### Bloqueia
—
### Usa
—
### É usado por
(futuro)

## Próximas ações
Não iniciar antes da fundação P1 e do boundary-map. Autopilot só avança com autorização explícita.

## Links
- [[ROADMAP-MESTRE-MULTGESTOR-2026]] · [[RISCOS-MULTGESTOR]]
