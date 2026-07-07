# 🪞 Digital Twin — Gêmeo Digital dos Módulos

> **Status:** OFICIAL • VIVO
> **Camada:** 1 — Conhecimento
> **Propósito:** Cada módulo do MultGestor possui um gêmeo digital que mapeia todo seu ecossistema: PRDs, arquitetura, banco, API, frontend, componentes, serviços, workers, deploy, auditorias, roadmap, riscos, agentes, skills e testes.
> **Relacionamentos:** [[product/README]] · [[INDEX#📘-camada-1--conhecimento]] · [[product/feature-genome/README]] · [[product/impact-graph/README]]

---

## O que é

O Digital Twin é uma **representação completa e navegável** de cada módulo do MultGestor. Seu objetivo é permitir que qualquer desenvolvedor, arquiteto ou IA compreenda **totalmente** um módulo em minutos.

Cada Digital Twin cobre:

```
PRDs → Arquitetura → Banco → API → Frontend → Componentes
  → Serviços → Workers → Deploy → Auditorias → Roadmap
  → Riscos → Agentes → Skills → Testes
```

## Módulos

| Módulo | Status | Digital Twin |
|---|---|---|
| [[digital-twin/barbergestor\|💈 BarberGestor]] | 🟢 Produção | Completo |
| [[digital-twin/climagestor\|🌤️ ClimaGestor]] | 🟡 Scaffold | Visão |
| [[digital-twin/fiscalgestor\|📊 FiscalGestor]] | ⚪ Visão | Visão |
| [[digital-twin/petgestor\|🐾 PetGestor]] | ⚪ Visão | Visão |
| [[digital-twin/autogestor\|🚗 AutoGestor]] | ⚪ Visão | Visão |
| [[digital-twin/academygestor\|🎓 AcademyGestor]] | ⚪ Visão | Visão |

## Template

Todo Digital Twin deve seguir a estrutura abaixo:

```markdown
# Módulo — Digital Twin

## Sumário
- PRDs relacionados
- Arquitetura
- Banco (tabelas, RLS)
- API (endpoints)
- Frontend (páginas, componentes)
- Serviços (services, workers)
- Deploy
- Auditorias
- Roadmap
- Riscos
- Agentes envolvidos
- Skills utilizadas
- Testes
```

## Referências

- [[product/feature-genome/README]] — DNA de funcionalidades individuais
- [[product/impact-graph/README]] — Análise de impacto entre módulos
- [[product/simulation-center/README]] — Simulação de cenários
- [[nichos/README]] — Nichos do MultGestor
- [[technical/README]] — Technical Brain
