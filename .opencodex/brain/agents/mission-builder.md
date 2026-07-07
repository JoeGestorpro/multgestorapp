# 🏗️ Mission Builder — Construção de Missões

> **Status:** OFICIAL • VIVO
> **Camada:** 3 — Inteligência
> **Propósito:** Documentar como as missões do MultGestor são construídas, estruturadas e priorizadas.
> **Relacionamentos:** [[agents/README]] · [[agents/planner]] · [[agents/agent-skill-matrix]] · [[ops/mission-closing-protocol]]

---

## O que é o Mission Builder

O **Mission Builder** é o processo que transforma uma necessidade em uma **missão executável**. Ele define:
- Escopo
- Agentes necessários
- Skills necessárias
- Documentos a consultar
- Documentos a atualizar
- Critérios de aceite

## Estrutura de uma Missão

```
MISSÃO: [Título curto e descritivo]

CONTEXTO:
- Por que esta missão existe?
- Qual problema resolve?
- Qual o impacto esperado?

ESCOPO:
- O que será feito (inclusions)
- O que NÃO será feito (exclusions)

AGENTES:
- Agente primário
- Agentes de suporte

SKILLS:
- Skills necessárias

CONSULTAR:
- Documentos a ler antes de executar

ATUALIZAR:
- Documentos a atualizar após execução

CRITÉRIOS DE ACEITE:
- [ ] Critério 1
- [ ] Critério 2

MODO:
- SAFE_WRITE / NORMAL

APROVAÇÃO:
- Automática / Humana
```

## Tipos de Missão

| Tipo | Descrição | Agente Primário | Requer Aprovação |
|---|---|---|---|
| **Feature** | Implementar nova funcionalidade | JoeFelipe Agent | Humana |
| **Bugfix** | Corrigir erro | JoeFelipe Agent | Humana |
| **Documentação** | Atualizar Knowledge OS | JoeFelipe Agent | Humana |
| **Auditoria** | Revisar segurança/qualidade | QA / Security | Humana |
| **Estratégia** | Definir roadmap/visão | Product Manager | Humana |
| **Cleanup** | Refatorar/limpar código | JoeFelipe Agent | Humana |
| **Infra** | Configurar infraestrutura | Platform Architect | Humana |

## Fluxo de Criação de Missão

```
NECESSIDADE IDENTIFICADA
  ↓
ANÁLISE DE ESCOPO
  ├── Qual o problema?
  ├── Qual a solução?
  └── Qual o impacto?
  ↓
SELEÇÃO DE AGENTES
  ├── Primário (executa)
  └── Suporte (consulta)
  ↓
CONSULTA AO KNOWLEDGE OS
  ├── Digital Twin (módulo afetado)
  ├── Feature Genome (funcionalidades)
  ├── Impact Graph (impacto)
  └── Decision Graph (decisões anteriores)
  ↓
DEFINIÇÃO DE CRITÉRIOS DE ACEITE
  ↓
REGISTRO EM next-task.md
  ↓
EXECUÇÃO
```

## Boas Práticas

1. **Uma missão por vez** — nunca múltiplas missões simultâneas
2. **Escopo cirúrgico** — menor unidade de valor entregável
3. **Contexto suficiente** — CHECK 0 deve ser ≥ 95 para executar
4. **SAFE_WRITE** em missões de documentação
5. **NUNCA** `git add -A` — stage seletivo
6. **Toda missão termina com Mission Closing Protocol**

## Referências

- [[agents/README]] — AI Brain
- [[agents/planner]] — Geração de planos
- [[agents/agent-skill-matrix]] — Matriz de agentes
- [[ops/mission-closing-protocol]] — Protocolo de encerramento
- [[../queue/next-task]] — Próxima missão
- [[../queue/current-task]] — Missão atual
- [[../queue/backlog]] — Backlog
