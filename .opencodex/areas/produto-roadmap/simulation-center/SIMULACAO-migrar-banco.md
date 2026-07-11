# 🔴 SIMULATION — O que acontece se migrarmos para outro banco?

> **Data da simulação:** 2026-06-24
> **Gatilho:** Hipotético
> **Relacionamentos:** [[product/impact-graph/IMPACT-migrar-banco]] · [[technical/banco]]

---

## Pergunta

**O que acontece se migrarmos de PostgreSQL (Supabase) para outro banco de dados?**

## Escopo

| Campo | Valor |
|---|---|
| **Pergunta** | Migração de banco de dados |
| **Área afetada** | Todo o sistema — todas as camadas |
| **Gatilho** | Hipotético |

## Rastreio no Grafo

### Camada 1 — Conhecimento
- **Digital Twins:** Todos os 6 módulos — todos dependem do banco
- **Feature Genomes:** Todos — toda funcionalidade persiste dados
- **Impact Graph:** [[product/impact-graph/IMPACT-migrar-banco]] (detalhado)

### Camada 2 — Contexto
- **Roadmap:** Paralisação durante migração
- **Riscos:** P0 — indisponibilidade total durante janela de migração
- **Produção:** Downtime programado

### Camada 3 — Inteligência
- **Agentes:** [[agents/platform-architect]], [[agents/database-architect]], [[agents/security]], [[agents/qa]]
- **Skills:** Migração de dados, ORM alternativo, benchmark

### Camada 4 — Produto
- **Nichos:** Todos afetados
- **Funcionalidades:** Todas — camada de dados inteira

### Camada 5 — Engenharia
- **Arquitetura:** Troca de provedor de banco — impacto em ORM, queries, migrations
- **Banco:** Perda de RLS (se novo banco não suportar), mudança de dialeto SQL
- **API:** Queries SQL precisam ser revisadas
- **Frontend:** Indiretamente afetado (mudanças em dados retornados)
- **Deploy:** Nova estratégia de migração
- **Observabilidade:** Novas métricas de banco

### Camada 6 — Operações
- **Incidentes:** Potencial INC (downtime, dados)
- **Auditorias:** RLS, segurança, performance, backup

### Camada 7 — Memória
- **Decisões:** Contraria decisão atual de usar Supabase/PostgreSQL
- **Lições:** INC-002 (XSS) — risco de introduzir novas vulnerabilidades

## Análise de Impacto

| Dimensão | Impacto | Severidade |
|---|---|---|
| Técnico | Reescrever camada de dados, ORM, queries | 🔴 Crítico |
| Negócio | Indisponibilidade durante migração | 🔴 Crítico |
| Operacional | Nova estratégia de backup, monitoramento | 🔴 Alto |
| Segurança | Perda de RLS — reimplementação necessária | 🔴 Crítico |
| Custo | Desenvolvimento + infraestrutura + migração | 🔴 Alto |

## Resposta

**Migrar de banco é um dos eventos de maior impacto possível no sistema.** Afeta todas as 7 camadas do Knowledge OS, todos os módulos, todos os nichos, e introduz riscos de segurança significativos (especialmente a perda de RLS).

O custo-benefício só se justifica se houver um motivo muito forte (custo de Supabase inviável, limitação técnica crítica, ou requisito de cliente).

## Recomendações

1. Não migrar sem uma justificativa de negócio validada
2. Se inevitável, escolher banco com suporte a RLS equivalente
3. Fazer PoC completo antes da migração
4. Planejar janela de downtime e comunicar clientes
5. Revisar e refazer todas as auditorias de segurança pós-migração

---

> **Última atualização:** 2026-06-24
> **Cenário:** Hipotético — não implementado
> **Links:** [[product/impact-graph/IMPACT-migrar-banco]] · [[technical/banco]] · [[technical/rls]]
