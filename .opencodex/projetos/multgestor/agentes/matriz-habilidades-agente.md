# 📊 Agent × Skill Matrix

> **Status:** OFICIAL • VIVO
> **Camada:** 3 — Inteligência
> **Propósito:** Mapear cada agente do ecossistema às skills que utiliza, com especialidade, contexto ideal, entradas, saídas, limitações e casos de uso.
> **Relacionamentos:** [[agents/README]] · [[prompts/visao-geral]]

---

## Matriz Completa

| Agente | Skills | Prioridade | Especialidade | Contexto Ideal |
|---|---|---|---|---|
| [[gerente-produto]] | customize-opencode, find-skills | 1 | Visão de produto, roadmap, mercado | Brain → product/ → nichos/ |
| [[dono-produto]] | — | 2 | PRDs, critérios de aceite, fluxos | product/ → technical/ |
| [[arquiteto-plataforma]] | customize-opencode, supabase | 1 | Arquitetura, decisões técnicas | technical/ → decisions/ |
| [[frontend-specialist]] | — | 1 | UI/UX, componentes React | technical/frontend → maps/ |
| [[arquiteto-banco-dados]] | supabase | 1 | Schema, migrations, RLS | technical/banco → maps/ |
| [[qa]] | — | 3 | Testes, qualidade, regressão | technical/ → incidents/ |
| [[projetos/multgestor/agentes/seguranca]] | — | 1 | Segurança, compliance, RLS | technical/seguranca → rules/ |
| [[joefelipe-agent]] | all | 0 | Operacional geral | brain/ completo |

## Detalhamento por Agente

### Product Manager
| Campo | Descrição |
|---|---|
| **Skills** | `customize-opencode`, `find-skills` |
| **Ordem de prioridade** | 1 (mais alta entre agentes de produto) |
| **Especialidade** | Visão de produto, análise de mercado, definição de roadmap, ICP/personas |
| **Contexto ideal** | Brain → product/ → nichos/ → strategy/ |
| **Entradas** | Feedbacks, dados de mercado, objetivos de negócio |
| **Saídas** | Roadmap, PRDs, hipóteses, priorização |
| **Limitações** | Não implementa código, não define arquitetura técnica |
| **Casos de uso** | Planejamento de sprint, definição de MVP, análise de concorrência |

### Platform Architect
| Campo | Descrição |
|---|---|
| **Skills** | `customize-opencode`, `supabase` |
| **Ordem de prioridade** | 1 (decisões arquiteturais) |
| **Especialidade** | Arquitetura de sistemas, banco de dados, segurança, deploy |
| **Contexto ideal** | technical/ → decisions/ → maps/ → rules/ |
| **Entradas** | Requisitos de produto, PRDs, restrições técnicas |
| **Saídas** | ADRs, decisões arquiteturais, diagramas, runbooks |
| **Limitações** | Não implementa features de produto |
| **Casos de uso** | Decisão de tecnologia, revisão de arquitetura, definição de RLS |

### Database Architect
| Campo | Descrição |
|---|---|
| **Skills** | `supabase` |
| **Ordem de prioridade** | 1 (schema e dados) |
| **Especialidade** | Modelagem de dados, migrations, RLS, performance de queries |
| **Contexto ideal** | technical/banco → technical/rls → maps/ |
| **Entradas** | PRDs, fluxos de dados, requisitos de performance |
| **Saídas** | Migrations, schema, políticas RLS, índices |
| **Limitações** | Não define regras de negócio |
| **Casos de uso** | Criação de tabelas, definição de RLS, otimização de queries |

### QA
| Campo | Descrição |
|---|---|
| **Skills** | — |
| **Ordem de prioridade** | 3 (execução pós-desenvolvimento) |
| **Especialidade** | Testes, qualidade, regressão, auditoria |
| **Contexto ideal** | technical/ → incidents/ → rules/ |
| **Entradas** | PRDs, critérios de aceite, código implementado |
| **Saídas** | Relatórios de teste, bugs, auditorias |
| **Limitações** | Não implementa funcionalidades |
| **Casos de uso** | Validação pós-implementação, regressão, auditoria de qualidade |

### Security
| Campo | Descrição |
|---|---|
| **Skills** | — |
| **Ordem de prioridade** | 1 (segurança é prioridade) |
| **Especialidade** | Segurança, compliance, RLS, proteção de dados |
| **Contexto ideal** | technical/seguranca → rules/ → incidents/ |
| **Entradas** | Código, configurações, arquitetura |
| **Saídas** | Relatórios de segurança, recomendações, bloqueios |
| **Limitações** | Não desenvolve features |
| **Casos de uso** | Auditoria de segurança, revisão de RLS, detecção de vulnerabilidades |

### JoeFelipe Agent
| Campo | Descrição |
|---|---|
| **Skills** | Todas disponíveis |
| **Ordem de prioridade** | 0 (executor geral) |
| **Especialidade** | Operacional geral — executa qualquer missão |
| **Contexto ideal** | Brain completo |
| **Entradas** | Missão definida, contexto do projeto |
| **Saídas** | Implementação, documentação, decisões |
| **Limitações** | Requer aprovação humana para push/deploy |
| **Casos de uso** | Execução de missões, implementação, documentação |

## Skills no Ecossistema

| Skill | Agentes que utilizam | Propósito |
|---|---|---|
| `customize-opencode` | Product Manager, Platform Architect | Configuração do opencode |
| `find-skills` | Product Manager | Descoberta de novas skills |
| `supabase` | Platform Architect, Database Architect | Operações de banco |
| `playwright` | QA | Testes de browser |
| `github` | Platform Architect | Gestão de repositório |

## Prioridade de Agentes por Tipo de Missão

| Tipo de Missão | Agente Primário | Agente Secundário |
|---|---|---|
| Produto | Product Manager | Product Owner |
| Arquitetura | Platform Architect | Database Architect |
| Implementação | JoeFelipe Agent | Frontend Specialist |
| Banco | Database Architect | Platform Architect |
| Testes | QA | Frontend Specialist |
| Segurança | Security | Platform Architect |
| Documentação | JoeFelipe Agent | Product Manager |
| Estratégia | Global Vision Architect | Product Manager |

## Referências

- [[agents/README]] — AI Brain (índice completo)
- [[agents/mission-builder]] — Construção de missões
- [[agents/planner]] — Geração de planos
- [[agents/providers]] — Providers de IA
- [[prompts/visao-geral]] — Biblioteca de prompts
