# 🔴 IMPACT — Migrar de PostgreSQL para Outro Banco

> **Severidade:** 🔴 Crítico
> **Data da análise:** 2026-06-24

---

## 1. Informações Básicas

| Campo | Valor |
|---|---|
| **Alteração** | Migrar banco de dados de PostgreSQL (Supabase) para outra solução |
| **Motivação** | Hipótese: sair do Supabase por limitações de plano ou vendor lock-in |
| **Severidade** | 🔴 Crítico |

## 2. Impacto por Categoria

| Categoria | Afetado? | Detalhes |
|---|---|---|
| **APIs** | ✅ Sim | Todas — camada de dados precisa ser reescrita |
| **Telas** | 🟡 Indireto | Nenhuma alteração direta, mas dados podem mudar |
| **Tabelas** | ✅ Sim | Migração de schema + dados |
| **Componentes** | ❌ Não | Abstração via API |
| **Serviços** | ✅ Sim | Todos os services que acessam banco |
| **Testes** | ✅ Sim | Testes de integração (conexão com banco) |
| **Auditorias** | ✅ Sim | Segurança, performance, RLS, backup |
| **PRDs** | ❌ Não | PRDs de funcionalidades não mudam |
| **Agentes** | ✅ Sim | Database Architect, Platform Architect, Security, QA |
| **Skills** | ✅ Sim | Migração de dados, novo banco |
| **Riscos** | ✅ Sim | Múltiplos |

## 3. Análise Detalhada

### APIs
| Funcionalidade | Mudança |
|---|---|
| Todas as queries SQL | Precisam ser adaptadas ao dialeto do novo banco |
| RLS (Row Level Security) | Pode não existir no novo banco — reimplementar na app |

### Tabelas
| Aspecto | Mudança |
|---|---|
| Schema | Migração de tipos, constraints, índices |
| Dados | Exportação + importação |
| RLS | Perda total — reimplementar |

### Serviços
| Componente | Mudança |
|---|---|
| Prisma ORM | Trocar driver ou ORM |
| Queries nativas | Reescrever |
| Migrações | Novo sistema de migrations |
| Backups | Nova estratégia |

## 4. Testes Necessários

- [x] Testes de integração (refatorar)
- [x] Testes de migração de dados
- [x] Testes de performance comparativa
- [x] Regressão completa do sistema

## 5. Auditorias Necessárias

- [x] Segurança (novo modelo de isolamento)
- [x] Performance (latência, throughput)
- [x] RLS (perda total — mitigação necessária)
- [x] Backup (nova estratégia)

## 6. Agentes Envolvidos

| Agente | Papel |
|---|---|
| [[agents/platform-architect]] | Decisão arquitetural |
| [[agents/database-architect]] | Migração de dados |
| [[agents/security]] | Segurança pós-migração |
| [[agents/qa]] | Testes de regressão |

## 7. Riscos Introduzidos

| Risco | Impacto | Mitigação |
|---|---|---|
| Perda de RLS | Alto | Implementar na camada de aplicação |
| Downtime longo | Alto | Migração blue-green |
| Incompatibilidade de dados | Alto | PoC + validação |
| Custo operacional | Médio | Benchmark antes |

## 8. Recomendação

- [ ] Aprovado
- [ ] Aprovado com ressalvas
- [x] Recusado (sem justificativa validada)

---

> **Última atualização:** 2026-06-24
> **Cenário:** Simulação — não implementado
> **Links:** [[product/impact-graph/IMPACT-remover-tabela]] · [[product/simulation-center/SIMULATION-migra-banco]]
