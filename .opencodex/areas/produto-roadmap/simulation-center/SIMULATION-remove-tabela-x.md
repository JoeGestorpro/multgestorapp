# 🔴 SIMULATION — O que acontece se removermos a tabela `appointments`?

> **Data da simulação:** 2026-06-24
> **Gatilho:** Hipotético
> **Relacionamentos:** [[product/impact-graph/IMPACT-remover-tabela]] · [[product/digital-twin/barbergestor]] · [[product/feature-genome/GENOME-agendamento]]

---

## Pergunta

**O que acontece se removermos a tabela `appointments` do banco de dados?**

## Escopo

| Campo | Valor |
|---|---|
| **Pergunta** | Remoção da tabela `appointments` |
| **Área afetada** | Agenda (Booking Engine) — núcleo do BarberGestor |
| **Gatilho** | Hipotético |

## Rastreio no Grafo

### Camada 1 — Conhecimento
- **PRDs:** PRD de agendamento (seria invalidado)
- **Digital Twins:** [[product/digital-twin/barbergestor]] — tabela `appointments` é central
- **Feature Genomes:** [[product/feature-genome/GENOME-agendamento]] — funcionalidade inteira dependente
- **Impact Graph:** [[product/impact-graph/IMPACT-remover-tabela]] (detalhado)

### Camada 2 — Contexto
- **Roadmap:** Funcionalidades dependentes (no-show, recorrência) seriam inviabilizadas
- **Riscos:** P1 de perda de funcionalidade core
- **Produção:** Booking público offline — impacto direto em clientes reais

### Camada 3 — Inteligência
- **Agentes:** [[agents/platform-architect]], [[agents/database-architect]], [[agents/frontend-specialist]], [[agents/qa]]
- **Skills:** Migração de dados, integração com API externa

### Camada 4 — Produto
- **Nichos:** BarberGestor (afetado), ClimaGestor/PetGestor/etc (indiretamente — todos usariam booking no futuro)
- **Funcionalidades:** Agendamento público, gestão de agenda, relatórios, notificações

### Camada 5 — Engenharia
- **Arquitetura:** Booking Engine (19 funções) perderia o repositório de dados
- **Banco:** Perda de dados históricos, constraints FK em `sale_items` e `notifications`
- **API:** 7 endpoints removidos
- **Frontend:** 3 páginas removidas
- **Deploy:** Migração de dados necessária
- **Observabilidade:** Queda em métricas de agendamento

### Camada 6 — Operações
- **Playbooks:** Rollback e migração de emergência
- **Incidentes:** Potencial INC-004
- **Auditorias:** Segurança, dados, performance

### Camada 7 — Memória
- **Decisões:** D-015 (fonte única) contrariada se dados migrarem para sistema externo
- **Lições:** Similar a INC-001 (violação L-93) — alteração sem autorização

## Análise de Impacto

| Dimensão | Impacto | Severidade |
|---|---|---|
| Técnico | Perda de funcionalidade core do sistema | 🔴 Crítico |
| Negócio | Booking offline = clientes não agendam | 🔴 Crítico |
| Operacional | Migração de dados complexa | 🔴 Crítico |
| Segurança | Risco de exposição de dados durante migração | 🔴 Crítico |
| Custo | Desenvolvimento da substituição + migração | 🔴 Alto |

## Resposta

**Remover a tabela `appointments` sem substituto equivalente inviabilizaria o BarberGestor.** O Booking Engine é a funcionalidade core do produto, e a tabela é o centro do grafo de dependências (apontada por `sale_items`, `notifications`, múltiplos services e componentes).

Se houver um substituto (API externa), o impacto ainda é crítico mas gerenciável com:
- Migração de dados históricos
- Período de transição com ambos os sistemas
- Testes de integração extensivos

**Sem substituto: a remoção é inviável.**

## Recomendações

1. Não remover sem um substituto equivalente validado
2. Se necessário, fazer PoC do substituto primeiro
3. Executar migração em ambiente isolado antes de produção
4. Comunicar clientes com antecedência

---

> **Última atualização:** 2026-06-24
> **Cenário:** Hipotético — não implementado
> **Links:** [[product/impact-graph/IMPACT-remover-tabela]] · [[product/digital-twin/barbergestor]] · [[product/feature-genome/GENOME-agendamento]]
