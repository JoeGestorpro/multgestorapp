# 🤖 AI Brain — Ecossistema de Inteligência

> **Status:** OFICIAL • VIVO
> **Camada:** 3 — Inteligência
> **Atualizado:** 2026-07-04
> **Propósito:** Documentação completa do ecossistema de IA do MultGestor — agentes, skills, prompts, providers, pipelines.
> **Relacionamentos:** [[constitution-knowledge-os]] · [[prompts/visao-geral]] · [[indice#🤖-camada-3--inteligência]]

---

## Arquitetura do AI Brain

```
┌─────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE OS (Brain)                      │
│  Fonte oficial da verdade · Camada de conhecimento base     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    AI ORCHESTRATOR                           │
│  Coordena agentes · Distribui tarefas · Gerencia fluxo      │
└──────┬──────────────┬──────────────┬───────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────────────────┐
│  MISSION    │ │  PLANNER   │ │  PROMPT GENERATOR      │
│  BUILDER    │ │  Estratégia│ │  Prompts contextuais    │
└──────┬──────┘ └─────┬──────┘ └─────┬──────────────────┘
       │              │              │
       └──────────────┴──────────────┘
                      │
┌─────────────────────▼──────────────────────────────────────┐
│                    AGENT POOL                                │
│  Product · Platform · Frontend · Database · QA · Security   │
└─────────────────────┬──────────────────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────────────────┐
│                    SKILLS & PROVIDERS                        │
│  Tools · MCP Servers · APIs · Plugins                       │
└─────────────────────────────────────────────────────────────┘
```

## Agentes

| Agente | Função | Modo | Skills Principais |
|---|---|---|---|
| [[agents/product-manager\|Product Manager]] | Define visão, roadmap e prioridades | Planejamento | customize-opencode, find-skills |
| [[agents/product-owner\|Product Owner]] | Traduz visão em PRDs e critérios | Execução | — |
| [[agents/platform-architect\|Platform Architect]] | Projeta e mantém a arquitetura | Decisão | customize-opencode |
| [[agents/frontend-specialist\|Frontend Specialist]] | Implementa UI/UX e componentes | Execução | — |
| [[agents/database-architect\|Database Architect]] | Projeta banco, migrations, RLS | Decisão | supabase |
| [[agents/qa\|QA]] | Testa e valida qualidade | Auditoria | — |
| [[agents/security\|Security]] | Garante segurança e compliance | Auditoria | — |
| [[agents/joefelipe-agent\|JoeFelipe Agent]] | Agente pessoal do fundador | Operacional | all |
| [[agents/global-vision-architect\|Global Vision Architect]] | Estratégia nicho/mercado/internac. | Planejamento | — |
| [[agents/joefelipe-personal-operating-agent\|JoeFelipe Personal Agent]] | SO pessoal | Pessoal | — |

## Pipeline de Execução

```
1. MISSÃO DEFINIDA (Mission Builder)
   ↓
2. PLANO GERADO (Planner)
   ↓
3. CHECK 0 — Context Confidence
   ↓
4. AGENTE SELECIONADO (Orchestrator)
   ↓
5. PROMPT GERADO (Prompt Generator)
   ↓
6. EXECUÇÃO (Agent + Skills)
   ↓
7. AUDITORIA (QA / Security)
   ↓
8. LOOP DE FECHAMENTO (Mission Closing Protocol)
   ↓
9. KNOWLEDGE OS ATUALIZADO
   ↓
10. PRÓXIMA MISSÃO GERADA
```

## Providers

| Provider | Uso | Documentação |
|---|---|---|
| OpenRouter | Modelo principal (DeepSeek) | [[agents/providers\|Providers]] |
| Supabase MCP | Banco de dados | [[agents/providers]] |
| GitHub MCP | Repositório e PRs | [[agents/providers]] |
| Playwright MCP | Testes e2e / browser | [[agents/providers]] |

## Skills

| Skill | Propósito | Localização |
|---|---|---|
| customize-opencode | Configuração do opencode | built-in |
| find-skills | Descoberta de skills | `~/.agents/skills/find-skills/` |
| (demais skills) | A catalogar | `skills/` |

## Matriz de Relacionamento

- [[agents/agent-skill-matrix]] — Mapeamento completo agente × skill
- [[agents/mission-builder]] — Como missions são construídas
- [[agents/planner]] — Como planos são gerados
- [[agents/providers]] — Providers de IA disponíveis
- [[prompts/visao-geral]] — Biblioteca de prompts
- [[constitution-knowledge-os]] — Constituição do Knowledge OS

## Referências

- [[00-HOME]] — Homepage
- [[product/README]] — Product Brain
- [[technical/README]] — Technical Brain
- [[areas/operacao/ops/visao-geral]] — Operational Memory
- [[dna]] — DNA do conhecimento
