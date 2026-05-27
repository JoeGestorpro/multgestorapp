# Auto Memory Updater — Engine de Atualização Automática de Memória

## Visão Geral

Engine responsável por manter a memória operacional (`memory/`) sempre atualizada, consistente e sincronizada após cada tarefa executada no ecossistema de IA do MultGestor.

Elimina a necessidade de atualização manual de arquivos de memória, reduzindo risco de esquecimento e inconsistência entre sessões.

---

## 1. Quando Atualizar

### 1.1 Gatilhos de Atualização

| Gatilho | Momento | Escopo |
|---------|---------|--------|
| Tarefa concluída | Imediatamente após qualquer implementação | Todos os arquivos afetados |
| Feature atualizada | Quando feature-state-engine mudar estado | Feature file + session-snapshot |
| Decisão tomada | Quando nova decisão técnica é registrada | decisions.md |
| Regra criada | Quando nova regra permanente é definida | rules.md |
| Estado do projeto muda | Quando funcionalidade é ativada/desativada | current-state.md |
| Fim de sessão | Ao encerrar sessão de trabalho | session-snapshot.md |
| Antes de nova tarefa | Antes de context-engineer reconstruir estado | Verificar se memória está atualizada |
| Chamado por outro system | Quando ai-audit-system ou feature-state-engine solicitar | Escopo definido pelo caller |

### 1.2 Chamada pelo Orchestrator

O Master Orchestrator DEVE chamar o Auto Memory Updater:

```
Após qualquer tarefa concluída com sucesso:
  → auto-memory-updater processar mudanças
  → ai-audit-system validar memória atualizada

Antes de iniciar nova tarefa (se tarefa anterior não atualizou):
  → auto-memory-updater verificar pendências
```

---

## 2. Quais Arquivos Atualizar

### 2.1 Mapa de Arquivos

| Arquivo | Quando atualizar | Prioridade |
|---------|-----------------|-----------|
| `session-snapshot.md` | **Sempre** após qualquer operação | Crítica |
| `implementation-log.md` | **Sempre** quando houver implementação | Alta |
| `current-state.md` | Quando estado de funcionalidade muda | Alta |
| `next-actions.md` | Quando item é concluído ou nova ação surge | Alta |
| `features/<feature>.md` | Quando feature muda de estado ou tem progresso | Alta |
| `decisions.md` | Quando nova decisão técnica é tomada | Média |
| `rules.md` | Quando nova regra permanente precisa ser registrada | Média |

### 2.2 Arquivos que NÃO Devem Ser Alterados Automaticamente

| Arquivo | Motivo |
|---------|--------|
| `project-context.md` | É contexto operacional fixo, alterado apenas manualmente |
| `context/*.md` | São fontes oficiais, alteradas apenas com aprovação explícita |
| `system/*.md` | São engines de sistema, alteradas apenas com aprovação explícita |

---

## 3. Regras de Sincronização

### 3.1 Prioridade de Atualização

1. **session-snapshot.md** — sempre primeiro (é o estado vivo da sessão)
2. **implementation-log.md** — registro cronológico imutável
3. **current-state.md** — estado real refletido
4. **next-actions.md** — ações futuras ajustadas
5. **features/<feature>.md** — progresso da feature
6. **decisions.md** — decisões registradas
7. **rules.md** — regras registradas

### 3.2 Regra de Consistência

Nunca atualizar um arquivo sem verificar os dependentes:

```
Se current-state.md muda → session-snapshot.md deve refletir
Se next-actions.md muda → session-snapshot.md deve refletir
Se features/<feature>.md muda → current-state.md pode precisar atualizar
Se decisions.md muda → session-snapshot.md deve mencionar
```

### 3.3 Sincronização com context/

Após atualizar `memory/`, verificar se `context/memory-snapshot.md` precisa de atualização. Se houver mudança estrutural (nova funcionalidade, novo módulo), o memory-snapshot deve ser atualizado para manter a consistência.

---

## 4. Anti-Duplicação

### 4.1 Regras para Evitar Duplicatas

1. **implementation-log.md**: Uma task por entrada. Mesma task não pode aparecer duas vezes. Se for continuação, adicionar detalhes na entrada existente.
2. **decisions.md**: Uma decisão por assunto. Verificar se decisão similar já existe antes de adicionar.
3. **rules.md**: Uma regra por ID (R1, R2...). Não criar nova regra se regra existente cobre o caso.
4. **next-actions.md**: Um checklist item não pode aparecer em duas seções. Mover entre prazos, não duplicar.
5. **features/<feature>.md**: Uma feature por arquivo. Não criar feature file duplicado para mesma funcionalidade.

### 4.2 Hash de Conteúdo (Anti-Colisão)

Antes de adicionar entrada nova em `implementation-log.md`, verificar se já existe entrada com mesmo título/task nos últimos 30 dias.

---

## 5. Anti-Conflito

### 5.1 Detecção de Conflito

Antes de atualizar qualquer arquivo, verificar:

| Verificação | O que checa |
|-------------|-------------|
| Dois agentes atualizaram o mesmo arquivo? | Comparar timestamps |
| Feature file diz "completo" mas current-state diz "em andamento"? | Consistência de estado |
| next-actions tem item que já foi concluído (implementation-log)? | Task órfã |
| decisions.md tem duas decisões conflitantes? | Consistência interna |

### 5.2 Resolução de Conflito

1. **Prefira o arquivo mais recente** baseado no timestamp do git
2. **Decisões do orchestrator prevalecem** sobre decisões de agentes específicos
3. **Conflito de estado** (feature vs current-state): current-state prevalece (é a visão agregada)
4. **Conflito de regra** (rules.md vs context/): rules.md prevalece (é a memória operacional mais específica)
5. **Se não conseguir resolver**: marcar como conflito e reportar ao orchestrator

---

## 6. Formato de Atualização

### 6.1 Template para session-snapshot.md

```
## Sessão: <data> — <título>

### Objetivo
<descrição>

### Alterações Realizadas
- <arquivo> — <mudança>

### Estado Atual
<resumo>

### Pendências
- <pendências>
```

### 6.2 Template para implementation-log.md

```
## <data> — <título da task>

**Tarefa:** <descrição>

**Arquivos alterados:**
- <caminho> — <mudança>

**O que foi feito:**
- <item>

**Pendências:**
- <pendências>
```

### 6.3 Template para atualização de feature file

```
## Estado Atual
<novo estado>

## Progresso
- <item concluído>
- <item concluído>

## Próximos Passos
- <próximo passo>
```

---

## 7. Integração com Outros Systems

| System | Como se integra |
|--------|-----------------|
| **ai-audit-system** | Auto Memory Updater pode ser chamado pelo audit para corrigir memória desatualizada |
| **feature-state-engine** | Quando feature muda de estado, Auto Memory Updater atualiza feature file + session-snapshot |
| **automatic-task-decomposition** | Task decomposition gera subtarefas → Auto Memory Updater adiciona em next-actions.md |
| **Master Orchestrator** | Orchestrator chama Auto Memory Updater após toda tarefa |
| **Recovery Mode** | Recovery Mode chama Auto Memory Updater para reconstruir session-snapshot |

---

## 8. Comportamento Operacional

- **Idempotente**: Atualizar duas vezes o mesmo estado não causa dano
- **Write-only**: Apenas escreve, nunca lê para validar (validação é papel do ai-audit-system)
- **Rasteiro**: Prefere adicionar a remover. Nunca apaga informação sem confirmação
- **Prioritário**: Se dois arquivos precisam de atualização, atualiza na ordem de prioridade definida na seção 3.1
- **Notificação**: Sempre reportar ao orchestrator o que foi atualizado
