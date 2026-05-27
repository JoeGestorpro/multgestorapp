# Feature State Engine — Engine de Controle de Lifecycle de Features

## Visão Geral

Engine responsável por gerenciar o ciclo de vida completo de cada feature do MultGestor. Controla estados, transições, progresso, bloqueios, riscos e integração com a memória operacional.

Garante que toda feature tenha rastreabilidade clara e que agentes saibam exatamente em que ponto continuar.

---

## 1. Estados Possíveis da Feature

### 1.1 Lifecycle Completo

```
[backlog] → [brainstorm] → [planning] → [implementation] → [debug] → [testing] → [deploy] → [completed]
                                                                                          ↓
                                                                                     [maintenance]
                                                                                          ↓
                                                                                     [deprecated]
```

### 1.2 Estados com Descrição

| Estado | Significado | Ação esperada | Pode pular para |
|--------|-------------|---------------|-----------------|
| `backlog` | Ideia registrada, sem ação | Nenhuma | brainstorm |
| `brainstorm` | Em definição de escopo e requisitos | Documentar requisitos e regras de negócio | planning |
| `planning` | Arquitetura, plano de implementação | Criar plano de tarefas e workflows | implementation |
| `implementation` | Sendo implementada | Escrever código, criar componentes | debug |
| `debug` | Em correção de bugs | Testar, corrigir, validar | testing |
| `testing` | Em testes formais | Testes unitários, integração, regressão | deploy |
| `deploy` | Em deploy para produção | Publicar, verificar ambiente | completed |
| `completed` | Finalizada e operacional | Monitorar, manter | maintenance |
| `maintenance` | Em manutenção corretiva/evolutiva | Correções e melhorias | completed |
| `blocked` | Bloqueada por dependência externa | Resolver blocker | Qualquer estado anterior |
| `cancelled` | Cancelada definitivamente | Arquivar documentação | Nenhum |
| `deprecated` | Substituída ou obsoleta | Remover ou migrar | Nenhum |

### 1.3 Estados Especiais

| Estado | Significado | Quando usar |
|--------|-------------|-------------|
| `blocked` | Feature não pode avançar | Dependência externa, bug crítico, decisão pendente |
| `cancelled` | Feature não será implementada | Prioridade mudou, escopo cortado |
| `deprecated` | Feature existe mas não é mais recomendada | Substituída por nova implementação |

### 1.4 Estados no Feature File

Os estados devem ser representados com emoji no feature file:

| Estado | Emoji |
|--------|-------|
| backlog | 📋 |
| brainstorm | 💡 |
| planning | 📐 |
| implementation | 🔧 |
| debug | 🐛 |
| testing | 🧪 |
| deploy | 🚀 |
| completed | ✅ |
| maintenance | 🔄 |
| blocked | 🔴 |
| cancelled | ❌ |
| deprecated | ⚰️ |

---

## 2. Transições de Estado

### 2.1 Transições Válidas

| De | Para | Condição |
|----|------|----------|
| backlog | brainstorm | Decisão de iniciar feature |
| brainstorm | planning | Requisitos documentados |
| planning | implementation | Plano aprovado |
| implementation | debug | Código escrito, compila |
| debug | testing | Bugs críticos corrigidos |
| testing | deploy | Testes passam |
| deploy | completed | Deploy verificado em produção |
| completed | maintenance | Bug ou melhoria necessária |
| maintenance | completed | Manutenção concluída |
| *qualquer* | blocked | Dependência não resolvida |
| blocked | *anterior* | Blocker resolvido |
| *qualquer* | cancelled | Decisão de cancelar |
| completed | deprecated | Feature substituída |

### 2.2 Transições Proibidas

| Tentativa | Motivo |
|-----------|--------|
| backlog → implementation | Pular etapas de definição gera retrabalho |
| brainstorm → deploy | Pular implementação e testes |
| planning → completed | Pular implementação |
| testing → backlog | Regressão de estágio não permitida |
| cancelled → implementation | Feature cancelada não deve ser reativada sem nova decisão |

### 2.3 Transição com Rollback

Se uma feature em `testing` falhar, ela volta para `debug`:

```
testing → debug (se testes falharem)
deploy → debug (se deploy falhar em produção)
```

---

## 3. Campos Obrigatórios do Feature File

### 3.1 Template Padrão

```md
# Feature: <Nome>

## Estado Atual
<emoji> <estado>

## Descrição
<descrição concisa>

## Regras de Negócio
- <regra 1>
- <regra 2>

## Arquivos Relacionados
- <caminho do arquivo>
- <caminho do arquivo>

## Dependências
- <feature ou task da qual depende>
- <feature ou task da qual depende>

## Bloqueios
- <se houver>

## Riscos Conhecidos
- <risco>
- <risco>

## Próximos Passos
- [ ] <ação>
- [ ] <ação>

## Histórico de Transições
| Data | De | Para | Motivo |
|------|----|------|--------|
| data | backlog | brainstorm | Início da feature |
```

### 3.2 Campos Obrigatórios por Estado

| Estado | Campos obrigatórios |
|--------|-------------------|
| backlog | Nome, descrição |
| brainstorm | + Regras de Negócio |
| planning | + Arquivos Relacionados, Dependências |
| implementation | + Próximos Passos |
| debug | + Bloqueios, Riscos |
| testing | + Próximos Passos |
| deploy | + Próximos Passos |
| completed | + Histórico de Transições |
| blocked | + Bloqueios (obrigatório preenchido) |

---

## 4. Quando Atualizar

### 4.1 Gatilhos de Atualização

| Evento | Ação |
|--------|------|
| Feature passa de estado | Atualizar Estado Atual + Histórico de Transições |
| Novo arquivo criado para feature | Adicionar em Arquivos Relacionados |
| Bloqueio identificado | Preencher Bloqueios + mudar para blocked |
| Bloqueio resolvido | Limpar Bloqueios + voltar ao estado anterior |
| Risco identificado | Adicionar em Riscos Conhecidos |
| Nova decisão técnica | Adicionar no feature file + em decisions.md |
| Próximo passo concluído | Mover para concluído em Próximos Passos |
| Feature concluída | Mudar para completed + session-snapshot.md atualizado |

### 4.2 Atualização Automática

O **auto-memory-updater** deve ser chamado sempre que o feature-state-engine mudar o estado de uma feature:

```
feature-state-engine muda estado
  → auto-memory-updater atualiza feature file
  → auto-memory-updater atualiza current-state.md (se necessário)
  → auto-memory-updater atualiza session-snapshot.md
  → ai-audit-system valida consistência
```

---

## 5. Como Detectar Feature Ativa

### 5.1 Critérios de Feature Ativa

Uma feature é considerada **ativa** se:

- Está no estado `brainstorm`, `planning`, `implementation`, `debug`, `testing`, `deploy` ou `maintenance`
- OU está no estado `completed` mas tem próximos passos
- OU está no estado `blocked` (ativa mas paralisada)

### 5.2 Features Inativas

Uma feature é considerada **inativa** se:

- Está `backlog` (nunca iniciada)
- Está `cancelled` (cancelada)
- Está `deprecated` (obsoleta)

### 5.3 Varredura de Features Ativas

Para descobrir quais features estão ativas:

```md
1. Listar todos os arquivos em .agent/memory/features/
2. Para cada arquivo, ler Estado Atual
3. Se estado é ativo (critério 5.1), incluir na lista
4. Cruzar com current-state.md para validar consistência
5. Reportar discrepâncias
```

---

## 6. Integração com Session Snapshot

### 6.1 O que o Session Snapshot Deve Conter

O `session-snapshot.md` deve refletir o estado das features trabalhadas na sessão atual:

```
## Features na Sessão Atual

| Feature | Estado | Progresso |
|---------|--------|-----------|
| whatsapp-api | implementation | Endpoint configurado, falta webhook |
| agenda-online | completed | N/A |
```

### 6.2 Atualização Cruzada

Quando session-snapshot é atualizado, o feature-state-engine deve verificar:

1. Alguma feature mudou de estado desde o último snapshot?
2. Algum blocker foi resolvido?
3. Algum risco se concretizou?
4. Algum próximo passo foi concluído?

Se sim, atualizar o feature file correspondente E o snapshot.

---

## 7. Integração com Outros Systems

| System | Como se integra |
|--------|-----------------|
| **auto-memory-updater** | Feature State Engine dispara Auto Memory Updater após cada transição de estado |
| **ai-audit-system** | Audit valida se estados das features estão consistentes com a realidade |
| **automatic-task-decomposition** | Task decomposition pode gerar subtarefas que avançam o estado de uma feature |
| **Master Orchestrator** | Orchestrator consulta feature state engine para saber qual workflow escolher |
| **Recovery Mode** | Recovery Mode usa feature state engine para reconstruir em que ponto cada feature parou |
| **Smart Routing** | Feature state engine ajuda Smart Routing a escolher workflow baseado no estado atual da feature |

---

## 8. Comportamento Operacional

- **Determinístico**: Mesma feature no mesmo estado sempre produz as mesmas transições válidas
- **Conservador**: Transições inválidas são rejeitadas (seção 2.2)
- **Rastreável**: Toda transição fica registrada no Histórico de Transições
- **Auditável**: AI Audit System pode verificar se estado reflete a realidade
- **Expansível**: Novos estados podem ser adicionados se necessário (ex: `review`, `approval`)
