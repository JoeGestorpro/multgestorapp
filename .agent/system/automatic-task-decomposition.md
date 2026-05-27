# Automatic Task Decomposition — Engine de Decomposição Automática de Tarefas

## Visão Geral

Engine responsável por quebrar tarefas grandes e complexas em subtarefas menores, identificar dependências, escolher workflows corretos, detectar riscos e definir a ordem de execução incremental e segura.

Evita overengineering, retrabalho e execução fora de ordem.

---

## 1. Quando Decompor

### 1.1 Gatilhos de Decomposição

| Gatilho | Descrição | Ação |
|---------|-----------|------|
| Tarefa complexa | Task com múltiplos arquivos, camadas (frontend + backend) ou features | Decompor imediatamente |
| Tarefa ambígua | Descrição vaga ou genérica | Decompor para esclarecer escopo |
| Tarefa multi-workflow | Task que atravessa múltiplos workflows (ex: back end + frontend + deploy) | Decompor por workflow |
| Nova feature | Criação de feature completa | Decompor por fase do lifecycle |
| Correção com impacto | Bug que pode afetar múltiplos módulos | Decompor por módulo |
| Integração externa | Nova integração (WhatsApp, gateway, SMS) | Decompor por camada (config → backend → frontend → teste) |
| Orchestrator solicita | Master Orchestrator identificar tarefa grande | Decompor antes de qualquer ação |

### 1.2 O que NÃO Deve Ser Decomposto

- Tarefas de 1 arquivo ou 1 componente
- Correções triviais (typofix, rename)
- Atualizações de documentação
- Mudanças de configuração
- Leitura/análise sem implementação

---

## 2. Como Decompor

### 2.1 Algoritmo de Decomposição

```
1. Ler descrição completa da tarefa
2. Identificar camadas envolvidas (frontend, backend, banco, deploy)
3. Identificar workflows necessários para cada camada
4. Identificar skills necessárias para cada workflow
5. Listar arquivos que serão afetados
6. Identificar dependências entre subtarefas
7. Identificar riscos de cada subtarefa
8. Definir ordem de execução (topológica)
9. Identificar tarefas paralelizáveis
10. Gerar plano de execução incremental
```

### 2.2 Exemplo de Decomposição

**Tarefa original:** "Implementar integração WhatsApp"

**Decomposição:**

```
Subtarefa 1: Criptografia do token (backend)
  Workflow: Backend crítico
  Dependência: Nenhuma
  Risco: Segurança

Subtarefa 2: Endpoint de configuração (backend)
  Workflow: Backend crítico
  Dependência: Subtarefa 1
  Risco: Baixo

Subtarefa 3: Webhook para mensagens (backend)
  Workflow: Backend crítico
  Dependência: Subtarefa 2
  Risco: Alto (integração externa)

Subtarefa 4: UI de configuração (frontend)
  Workflow: Visual/UI
  Dependência: Subtarefa 2
  Risco: Médio (UX)

Subtarefa 5: Notificação de agendamento (backend)
  Workflow: Backend crítico
  Dependência: Subtarefa 3
  Risco: Médio
```

### 2.3 Classificação de Subtarefas

| Tipo | Exemplo | Workflow Padrão |
|------|---------|-----------------|
| **Backend puro** | Nova rota, controller, service | Backend crítico |
| **Frontend puro** | Novo componente, página, CSS | Visual/UI |
| **Banco de dados** | Migration, query, índice | Database |
| **Full stack** | Feature completa | Misto (decompor por camada) |
| **Configuração** | Variável de ambiente, deploy | Deploy |
| **Integração** | WhatsApp, gateway, SMS | Backend crítico + Visual/UI |
| **Arquitetura** | Refatoração, modularização | Arquitetura |
| **Correção** | Bug fix | Correção pequena |
| **Segurança** | Auditoria, token, permissão | Backend crítico |

---

## 3. Como Definir Prioridade

### 3.1 Matriz de Prioridade

| Impacto / Urgência | Crítico | Alto | Médio | Baixo |
|--------------------|---------|------|-------|-------|
| **Bloqueante** | P0 — Imediato | P0 — Imediato | P1 — Próximo | P2 — Agendar |
| **Alto** | P0 — Imediato | P1 — Próximo | P2 — Agendar | P3 — Fila |
| **Médio** | P1 — Próximo | P2 — Agendar | P3 — Fila | P3 — Fila |
| **Baixo** | P2 — Agendar | P3 — Fila | P3 — Fila | P4 — Futuro |

### 3.2 Definição dos Níveis

| Prioridade | Prazo | Ação |
|------------|-------|------|
| P0 — Imediato | Horas | Executar agora, interromper task atual se necessário |
| P1 — Próximo | Hoje | Próxima task na fila |
| P2 — Agendar | Esta semana | Agendar após tasks P0/P1 |
| P3 — Fila | Próximas semanas | Adicionar em next-actions.md |
| P4 — Futuro | Indefinido | Adicionar em roadmap.md |

---

## 4. Como Escolher Workflows

### 4.1 Mapa Workflow → Subtarefa

| Se subtarefa é... | Workflow |
|-------------------|----------|
| Nova criação (feature, módulo) | Brainstorm → Architecture → Plan → Create → Debug → Test → Deploy |
| Correção de bug | Context Discovery → Surgical Fix → Debug → Test |
| Alteração visual/UI | Context Discovery → Frontend Design → UX/UI Review → Create → Test |
| Backend crítico (auth, segurança, integração) | Context Discovery → Architecture → Backend Security → Database Design → Create → Test |
| Banco de dados (migration, query) | Context Discovery → Database Design → Create → Test |
| Deploy/infra | Context Discovery → Deploy → Test |
| Arquitetura/refatoração | Context Discovery → Architecture → Plan → Create → Test |

### 4.2 Skills Necessárias por Workflow

| Workflow | Skills |
|----------|--------|
| Frontend Design | frontend-barbergestor-ui, design-system |
| Backend Seguro | backend-seguro-multgestor, auth, security-testing |
| Database | database-design, indexing, optimization |
| Deploy | deployment-procedures |
| Debug | systematic-debugging, lint-and-validate |

---

## 5. Como Detectar Riscos

### 5.1 Categorias de Risco

| Categoria | Exemplos | Ação |
|-----------|----------|------|
| **Segurança** | Exposição de token, vazamento company_id | Elevar prioridade, adicionar validação extra |
| **Regressão** | Algo que pode quebrar funcionalidade existente | Adicionar testes, validar com ai-audit-system |
| **Dependência externa** | API de terceiro, webhook, SSL | Adicionar fallback, timeout, log |
| **Performance** | Query sem índice, N+1, sem cache | Adicionar índice, revisar query |
| **Concorrência** | Dois agentes editando mesmo arquivo | Bloquear, usar locks de arquivo |
| **Complexidade** | Tarefa grande com muitos arquivos | Decompor mais, adicionar checkpoints |
| **Dados** | Migração, alteração de schema, perda de dados | Backup obrigatório, rollback planejado |

### 5.2 Risco → Ação

```
Se risco = segurança:
  → Adicionar "Revisão de segurança" como subtarefa obrigatória

Se risco = regressão:
  → Adicionar "Testes de regressão" como subtarefa

Se risco = dependência externa:
  → Adicionar "Timeout/fallback" como requisito

Se risco = dados:
  → Adicionar "Backup" como passo obrigatório antes
```

---

## 6. Ordem de Execução

### 6.1 Grafo de Dependências

```
Subtarefa A (sem dependências) → primeiro
Subtarefa B (depende de A) → segundo
Subtarefa C (depende de A) → pode ser paralelo com B
Subtarefa D (depende de B e C) → quarto (após B e C)
```

### 6.2 Regras de Ordem

1. **Dependências primeiro**: Toda subtarefa deve esperar suas dependências
2. **Paralelização segura**: Subtarefas sem dependências entre si podem ser paralelizadas
3. **Checkpoints**: A cada 3 subtarefas, executar ai-audit-system
4. **Rollback points**: A cada subtarefa com risco ALTO ou CRÍTICO, definir ponto de rollback

### 6.3 Fluxo de Execução Incremental

```
Subtarefa 1 → validar → OK → Subtarefa 2 → validar → OK → Subtarefa 3...
                    ↓                        ↓
              Se falhar:               Se falhar:
              corrigir ou              corrigir ou
              rollback                 rollback
```

---

## 7. Como Evitar Overengineering

### 7.1 Regras Anti-Overengineering

1. **Mínima decomposição viável**: Decompor apenas o suficiente para tornar a task executável com segurança. Não criar 20 subtarefas para uma task de 3 arquivos.
2. **Profundidade máxima**: Máximo de 2 níveis de decomposição (task → subtask → sub-subtask).
3. **Threshold de tamanho**: Tarefas com <= 3 arquivos ou <= 50 linhas de alteração NÃO devem ser decompostas.
4. **Workflow único**: Se a task inteira usa um único workflow, não decompor (a menos que tenha risco alto).

### 7.2 Checklist de Overengineering

- [ ] Todas as subtarefas são necessárias?
- [ ] Alguma subtarefa pode ser fundida com outra?
- [ ] O plano de execução é maior que a implementação?
- [ ] Estou criando abstrações que não existem no código?

Se qualquer resposta for SIM, reduzir a decomposição.

---

## 8. Integração com Outros Systems

| System | Como se integra |
|--------|-----------------|
| **auto-memory-updater** | Task decomposition gera subtarefas → Auto Memory Updater adiciona em next-actions.md |
| **feature-state-engine** | Cada subtarefa pode avançar o estado de uma feature |
| **ai-audit-system** | Audit valida se decomposição gerou plano coerente e sem conflitos |
| **Master Orchestrator** | Orchestrator chama task decomposition antes de tarefas complexas |
| **Smart Routing** | Task decomposition identifica workflow correto para cada subtarefa |

---

## 9. Comportamento Operacional

- **Idempotente**: Mesma task de entrada produz a mesma decomposição
- **Read-only**: Apenas gera plano, não executa subtarefas
- **Conservador**: Prefere menos subtarefas a mais (anti-overengineering)
- **Rastro**: Gera plano escrito que pode ser salvo em `session-snapshot.md` ou `PLAN.md`
- **Adaptável**: Se durante execução uma subtarefa revelar mais complexidade, redecompor apenas aquela subtarefa
