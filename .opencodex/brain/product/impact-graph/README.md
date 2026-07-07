# ⚡ Impact Graph — Mapa de Impacto

> **Status:** OFICIAL • VIVO
> **Camada:** 1 — Conhecimento
> **Propósito:** Responder "Se eu alterar X... quais APIs, telas, tabelas, componentes, testes, auditorias, PRDs, agentes e skills serão afetados?"
> **Relacionamentos:** [[digital-twin/README]] · [[feature-genome/README]] · [[simulation-center/README]] · [[technical/DEPENDENCY-MAP]]

---

## O que é

O **Impact Graph** é uma matriz de impacto que permite rastrear as consequências de qualquer alteração no sistema. Diferente do Dependency Map (técnico), este é um mapa **funcional e operacional**.

## Categorias de Impacto

| Categoria | O que é afetado |
|---|---|
| **APIs** | Endpoints REST que precisam ser alterados |
| **Telas** | Páginas e componentes frontend |
| **Tabelas** | Estruturas de banco de dados |
| **Componentes** | Componentes React compartilhados |
| **Serviços** | Services e workers |
| **Testes** | Testes unitários, integração, E2E |
| **Auditorias** | Auditorias que precisam ser refeitas |
| **PRDs** | PRDs que precisam ser atualizados |
| **Agentes** | Agentes que devem participar |
| **Skills** | Skills necessárias para a alteração |
| **Riscos** | Novos riscos introduzidos |

## Impactos Documentados

| Impacto | Tipo | Severidade |
|---|---|---|
| [[impact-graph/IMPACT-remover-tabela\|Remover tabela `appointments`]] | 🔴 Crítico | Alto |
| [[impact-graph/IMPACT-migrar-banco\|Migrar de PostgreSQL para outro banco]] | 🔴 Crítico | Alto |
| [[impact-graph/IMPACT-adicionar-recorrencia\|Adicionar recorrência ao agendamento]] | 🟡 Moderado | Médio |

## Template

O template do Impact Graph está em [[impact-graph/IMPACT-TEMPLATE]].

## Referências

- [[digital-twin/README]] — Visão macro dos módulos
- [[feature-genome/README]] — DNA de funcionalidades
- [[simulation-center/README]] — Simulação de cenários
- [[technical/DEPENDENCY-MAP]] — Mapa de dependências técnicas
