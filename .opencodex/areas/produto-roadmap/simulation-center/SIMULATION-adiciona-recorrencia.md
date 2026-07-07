# 🟡 SIMULATION — O que acontece se adicionarmos recorrência ao agendamento?

> **Data da simulação:** 2026-06-24
> **Gatilho:** Planejado
> **Relacionamentos:** [[product/impact-graph/IMPACT-adicionar-recorrencia]] · [[product/feature-genome/GENOME-agendamento]] · [[product/digital-twin/barbergestor]]

---

## Pergunta

**O que acontece se adicionarmos suporte a agendamentos recorrentes no BarberGestor?**

## Escopo

| Campo | Valor |
|---|---|
| **Pergunta** | Adicionar recorrência ao módulo de Agenda |
| **Área afetada** | Agenda (Booking Engine) + Notificações + Relatórios |
| **Gatilho** | Planejado (funcionalidade desejada) |

## Rastreio no Grafo

### Camada 1 — Conhecimento
- **PRDs:** Novo PRD necessário
- **Digital Twins:** [[product/digital-twin/barbergestor]] — módulo Agenda expandido
- **Feature Genomes:** [[product/feature-genome/GENOME-agendamento]] — atualizar com fluxo de recorrência
- **Impact Graph:** [[product/impact-graph/IMPACT-adicionar-recorrencia]] (detalhado)

### Camada 2 — Contexto
- **Roadmap:** Item "Recuperação de no-show" pode ser combinado
- **Riscos:** Baixo — funcionalidade adicional, não altera existente
- **Produção:** Sem risco de indisponibilidade

### Camada 3 — Inteligência
- **Agentes:** [[agents/product-manager]] (UX), [[agents/platform-architect]] (modelagem), [[agents/database-architect]] (schema), [[agents/frontend-specialist]] (UI)
- **Skills:** Padrão iCalendar (RRULE), lógica de recorrência

### Camada 4 — Produto
- **Nichos:** BarberGestor, potencial para todos os nichos
- **Funcionalidades:** Agendamento expandido, notificações recorrentes, relatórios

### Camada 5 — Engenharia
- **Arquitetura:** Nova entidade/tabela de padrões de recorrência
- **Banco:** Nova tabela `recurring_patterns` ou campo JSON em `appointments`
- **API:** 3 novos endpoints
- **Frontend:** BookingWidget expandido, AgendaView com indicadores
- **Deploy:** Migração de schema
- **Observabilidade:** Métricas de recorrência

### Camada 6 — Operações
- **Playbooks:** Worker de geração de recorrência
- **Incidentes:** Mitigação de conflitos de horário
- **Auditorias:** RLS, performance

### Camada 7 — Memória
- **Decisões:** Registrar decisão de modelagem (JSON vs tabela separada)
- **Timeline:** Registrar implementação

## Análise de Impacto

| Dimensão | Impacto | Severidade |
|---|---|---|
| Técnico | Complexidade média — novo schema + lógica + worker | 🟡 Médio |
| Negócio | Diferencial competitivo para clientes frequentes | 🟢 Positivo |
| Operacional | Worker de geração, gerenciamento de exceções | 🟡 Médio |
| Segurança | Risco mínimo — dados existentes não alterados | 🟢 Baixo |
| Custo | 1-2 semanas de desenvolvimento | 🟡 Médio |

## Resposta

**Adicionar recorrência é uma evolução natural do agendamento com bom custo-benefício.** O impacto é moderado e contido no módulo Agenda, sem risco para funcionalidades existentes.

A complexidade maior está na UX (como o cliente configura e gerencia recorrências) e no tratamento de exceções (pular uma data, cancelar série).

## Recomendações

1. Usar padrão iCalendar (RRULE) para compatibilidade futura
2. Limitar horizonte de recorrência a 6 meses
3. Implementar UI clara para editar/cancelar série completa vs ocorrência individual
4. Criar worker semanal para gerar ocorrências futuras
5. Incluir no PRD como funcionalidade separada do agendamento simples

---

> **Última atualização:** 2026-06-24
> **Cenário:** Planejado — não implementado
> **Links:** [[product/impact-graph/IMPACT-adicionar-recorrencia]] · [[product/feature-genome/GENOME-agendamento]] · [[product/digital-twin/barbergestor]]
