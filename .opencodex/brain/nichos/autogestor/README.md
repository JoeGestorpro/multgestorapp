# 🚗 AutoGestor

> **Status:** ⚪ VISÃO — Não iniciado
> **Relacionamentos:** [[nichos/README]] · [[maps/multgestor-core/nichos/autogestor]] · [[product/README]] · [[technical/README]] · [[strategy/niche-radar]]

---

## Visão

AutoGestor será o vertical para **oficinas mecânicas, auto centers e serviços automotivos**.

## Diferenciais do Nicho

- Ordem de serviço (OS) como entidade principal
- Controle de peças e serviços
- Mão-de-obra vs peças no faturamento
- Histórico do veículo

## Arquitetura Potencial

- Core: Multi-tenant, Auth, Billing, Storage
- Específico: Módulo OS, controle de peças, histórico veicular
- Desafio: OS é diferente de agenda — exige capability nova

## Roadmap

- [ ] Validar fit com Core (score 3.3/5 — menor)
- [ ] Avaliar capability de OS como novo módulo Core
- [ ] PRD inicial (após boundary map)

## Referências

- [[maps/multgestor-core/nichos/autogestor]] — Detalhamento no mapa vivo
- [[product/README]] — Product Brain
- [[technical/README]] — Technical Brain
- [[strategy/niche-radar]] — Ranking de nichos
