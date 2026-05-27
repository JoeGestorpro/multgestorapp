# AI Audit System — Engine de Auditoria de Consistência

## Visão Geral

Engine responsável por detectar inconsistências, conflitos, memória desatualizada, workflows incorretos, regressões e violações de arquitetura no ecossistema de IA do MultGestor.

Executa validações estruturais e semânticas em todo o ambiente `.agent/` antes, durante e após tarefas.

---

## 1. Quando Executar

### 1.1 Gatilhos Obrigatórios

| Gatilho | Quando | Prioridade |
|---------|--------|-----------|
| Pré-tarefa | Antes de qualquer implementação nova | Alta |
| Pós-tarefa | Após qualquer alteração em `.agent/` | Alta |
| Recovery Mode | Sempre que o orchestrator ativar recovery | Crítica |
| Sessão nova | Início de toda nova sessão de trabalho | Média |
| Periódico | A cada 3 tarefas consecutivas sem auditoria | Média |
| Suspeita | Quando um agente reportar contradição | Alta |

### 1.2 Chamada pelo Orchestrator

O Master Orchestrator deve chamar o AI Audit System:

```
Após context-engineer reconstruir estado:
  → ai-audit-system validar contexto
  → Se problemas encontrados: reportar e travar
  → Se limpo: continuar para workflow

Após tarefa concluída:
  → auto-memory-updater atualizar memória
  → ai-audit-system validar memória atualizada
```

---

## 2. O Que Validar

### 2.1 Validação de Memória (memory/)

| Verificação | O que checa | Ação se falha |
|-------------|-------------|---------------|
| `session-snapshot.md` não vazio | Conteúdo mínimo | Reportar警告 e preencher |
| `current-state.md` reflete estado real | Checkboxes condizentes com implementações registradas | Reportar e agendar correção |
| `next-actions.md` alinhado com `roadmap.md` | Itens do roadmap presentes em next-actions | Reportar divergência |
| `implementation-log.md` cronológico | Datas em ordem, sem lacunas suspeitas | Reportar |
| `decisions.md` sem duplicatas | Decisão única por assunto | Reportar duplicata |
| `rules.md` sem conflitos interno | Regras não se contradizem | Reportar conflito |
| `features/*.md` existem para features ativas | Feature ativa em current-state tem feature file | Reportar ausência |

### 2.2 Validação de Contexto (context/)

| Verificação | O que checa | Ação se falha |
|-------------|-------------|---------------|
| `memory-snapshot.md` vs `project-context.md` | Stack, regras, arquitetura consistentes | Reportar divergência |
| `memory-snapshot.md` vs `current-state.md` | Estado descrito condizente | Reportar divergência |
| `memory-snapshot.md` vs `decisions.md` | Decisões refletidas no snapshot | Reportar omissão |
| `architecture.md` vs `project-context.md` | Arquitetura consistente entre fontes | Reportar divergência |
| `ai-operating-rules.md` vs `rules.md` (R19) | Fluxos de trabalho equivalentes | Reportar divergência |

### 2.3 Validação de Multi-Tenant

| Verificação | O que checa | Ação se falha |
|-------------|-------------|---------------|
| `company_id` como isolamento | Todas as fontes usam `company_id`, não `owner_id` | Reportar violação crítica |
| Master Admin isolado | Regra de separação presente em todas as fontes | Reportar violação crítica |
| Backend como fonte única | Regra presente em context/ e memory/ | Reportar violação |

### 2.4 Validação de Segurança

| Verificação | O que checa | Ação se falha |
|-------------|-------------|---------------|
| Token WhatsApp criptografado | Regra presente em todas as fontes | Reportar violação |
| .env nunca no git | Regra presente | Reportar violação |
| Nunca expor tokens em GET | Regra presente | Reportar violação |
| FRONTEND_URL em produção | Regra de não usar localhost | Reportar violação |

### 2.5 Validação de Workflows

| Verificação | O que checa | Ação se falha |
|-------------|-------------|---------------|
| Workflow escolhido é adequado | Tarefa vs fluxo (criação, correção, UI, backend) | Reportar workflow incorreto |
| Sequência de execução correta | Ordem dos passos no workflow | Reportar sequência errada |
| Skills obrigatórias carregadas | Se task é X, skill Y foi referenciada | Reportar skill faltante |

### 2.6 Validação de Features (features/)

| Verificação | O que checa | Ação se falha |
|-------------|-------------|---------------|
| Feature file existe para cada feature ativa | `features/*.md` presente | Reportar ausência |
| Status da feature é válido | Estado pertence ao lifecycle | Reportar estado inválido |
| Próximos passos da feature em `next-actions.md` | Alinhamento | Reportar divergência |
| Feature file tem campos obrigatórios | Nome, status, descrição, regras, próximos passos | Reportar incompletude |

---

## 3. Como Reportar Problemas

### 3.1 Formato de Relatório

```
[AI AUDIT] <timestamp> — <severidade>: <descrição>

Arquivo(s): <caminhos>
Esperado: <o que deveria ser>
Encontrado: <o que está agora>
Risco: <impacto potencial>
Ação: <correção recomendada>
```

### 3.2 Níveis de Severidade

| Nível | Cor | Ação |
|-------|-----|------|
| CRÍTICO | Vermelho | Travar execução. Correção obrigatória antes de continuar |
| ALTO | Laranja | Reportar e agendar correção. Pode continuar com ressalvas |
| MÉDIO | Amarelo | Reportar. Correção na próxima sessão |
| BAIXO | Azul | Reportar apenas. Sem ação imediata |

### 3.3 Registro de Problemas

Problemas encontrados devem ser registrados em:

```
.agent/system/audit-report-<data>.md
```

Ou, se leve, apenas no `session-snapshot.md` na seção de observações.

---

## 4. Como Evitar Regressão

### 4.1 Regras de Prevenção

1. **Nunca pular auditoria em tarefas críticas** (segurança, multi-tenant, banco)
2. **Sempre auditar após atualização de memória** — garantir que auto-memory-updater não introduziu inconsistência
3. **Auditar Recovery Mode antes de qualquer ação** — garantir que contexto reconstruído é válido
4. **Manter baseline de regras** — `rules.md` é a fonte de verdade para regras permanentes. Toda auditoria compara contra ela

### 4.2 Ciclo Anti-Regressão

```
Tarefa concluída
  → auto-memory-updater atualiza memória
  → ai-audit-system valida memória
  → Se problema: corrigir antes de nova tarefa
  → Se limpo: liberar para próxima tarefa
```

---

## 5. Integração com Outros Systems

| System | Como se integra |
|--------|-----------------|
| **auto-memory-updater** | AI Audit dispara auto-memory-updater se detectar memória desatualizada |
| **feature-state-engine** | Audit valida se feature state engine está consistente com arquivos reais |
| **automatic-task-decomposition** | Audit valida se decomposição gerou subtarefas corretas e sem conflito |
| **Master Orchestrator** | Orchestrator chama audit antes/depois de workflows |
| **Recovery Mode** | Audit é parte obrigatória do Recovery Mode |

---

## 6. Comportamento Operacional

- **Idempotente**: Executar múltiplas vezes produz o mesmo resultado
- **Read-only**: Audit apenas lê e reporta, nunca modifica arquivos
- **Determinístico**: Mesmo estado produz mesmo relatório
- **Priorização**: Problemas críticos sempre primeiro
- **Limite por execução**: Máximo de 10 problemas reportados por execução (para evitar overflow)
