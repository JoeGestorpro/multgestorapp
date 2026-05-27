# MASTER ORCHESTRATOR — REGRAS GLOBAIS MULTGESTOR / BARBERGESTOR

# REGRA GLOBAL DE MEMÓRIA COMPARTILHADA

Antes de qualquer tarefa, plano, análise, implementação, debug ou resposta, este Master Orchestrator deve carregar e respeitar a memória oficial do projeto.

## Arquivos obrigatórios de contexto

- `.agent/context/memory-snapshot.md`
- `.agent/context/ai-operating-rules.md`

Esses arquivos são a **fonte oficial de verdade** do projeto MultGestor / BarberGestor.

Se houver conflito entre memória temporária da sessão, histórico antigo, contexto parcial, inferência do agente ou memória interna da IA, **prevalece o conteúdo desses arquivos**.

## Sequência obrigatória

O agente deve sempre:

1. Ler a memória compartilhada (`.agent/context/memory-snapshot.md` + `.agent/context/ai-operating-rules.md`)
2. Identificar o contexto atual do projeto
3. Identificar os agentes disponíveis
4. Identificar as skills disponíveis
5. Identificar os workflows disponíveis
6. Selecionar a sequência correta de execução
7. Responder em português do Brasil
8. Separar frontend e backend
9. Fazer alterações cirúrgicas
10. Não alterar nada fora do escopo solicitado

## Regras críticas obrigatórias

- Preservar multi-tenant usando `company_id`
- Nunca confiar apenas no frontend
- Preservar autenticação e autorização
- Preservar regras da agenda
- Preservar deploy Vercel / Render / Supabase
- Preservar segurança de tokens
- Preservar integração Resend
- Preservar futuras integrações WhatsApp

## Fluxo obrigatório padrão

```
Brainstorm → Architecture → Plan → Create → Debug → Test → Deploy
```

## Fluxo para correções

```
Context Discovery → Systematic Debugging → Surgical Fix → Test
```

---

## 1. Idioma obrigatório — PT-BR

Antes de executar qualquer agente, skill ou workflow, aplicar esta política obrigatória:

- Toda resposta deve ser em português do Brasil.
- Todo plano deve ser em português do Brasil.
- Todo debug deve ser em português do Brasil.
- Toda documentação gerada deve ser em português do Brasil.
- Todo resumo final deve ser em português do Brasil.
- Todos os checkings, status, logs visíveis, etapas de processamento e mensagens de progresso devem ser em português do Brasil.

Variáveis operacionais:

LANGUAGE_POLICY=pt-BR
OUTPUT_LANGUAGE=pt-BR

### Exceções

Não traduzir:

- nomes de arquivos;
- comandos;
- código;
- rotas;
- variáveis de ambiente;
- nomes de bibliotecas;
- frameworks;
- APIs;
- classes CSS;
- componentes React;
- stack traces;
- logs crus do terminal;
- erros nativos de Node.js, Vite, React, PostgreSQL ou Supabase.

---

## 2. Idioma operacional obrigatório

Além das respostas finais, todos os checkings, status, logs visíveis, etapas de processamento, mensagens intermediárias e descrições de ações executadas pelos agentes devem estar em português do Brasil.

### Exemplos obrigatórios

- `Checking files` → `Verificando arquivos`
- `Reading frontend/src/pages/...` → `Lendo frontend/src/pages/...`
- `Analyzing project structure` → `Analisando estrutura do projeto`
- `Building` → `Construindo`
- `Running tests` → `Executando testes`
- `Validating markdown` → `Validando markdown`
- `Updating memory` → `Atualizando memória`
- `Creating files` → `Criando arquivos`
- `Searching references` → `Buscando referências`
- `Complete` → `Concluído`
- `Queued` → `Na fila`
- `Failed` → `Falhou`
- `Done` → `Finalizado`
- `Error` → `Erro`

Se algum agente/workflow gerar conteúdo em inglês, o Master Orchestrator deve interceptar e reescrever em português antes de continuar.

---

## 3. Context Engineer obrigatório primeiro

Antes de qualquer resposta técnica, plano, implementação, debug, build, teste, deploy, refatoração ou continuação de tarefa, o orquestrador deve chamar primeiro o agente de contexto.

### Agente obrigatório inicial

Arquivo físico:

`.agent/Joe-orchestrators/agents/context-manager.md`

Função operacional:

`context-engineer`

Este agente é responsável por:

- preservar contexto;
- reconstruir estado real do projeto;
- impedir perda de memória após compaction;
- validar arquitetura;
- evitar regressões;
- proteger padrões do MultGestor V2;
- supervisionar continuidade entre workflows;
- verificar arquivos reais antes de responder.

---

## 4. Fluxo obrigatório antes de qualquer ação

Sempre executar esta sequência:

1. Chamar `context-manager.md` como `context-engineer`.
2. Ler `.agent/memory/project-context.md`.
3. Ler `.agent/memory/current-state.md`.
4. Ler `.agent/memory/implementation-log.md`.
5. Ler `.agent/memory/next-actions.md`.
6. Ler `.agent/memory/decisions.md`.
7. Ler `.agent/memory/rules.md`.
8. Ler `.agent/memory/last-session.md`, se existir.
9. Ler `.agent/memory/session-snapshot.md`, se existir.
10. Identificar módulo atual e ler `.agent/memory/modules/<modulo>.md`
11. Ler `PLAN.md`, se existir.
12. Rodar `git status`.
13. Rodar `git diff`.
14. Identificar arquivos modificados recentemente.
15. Identificar implementação incompleta.
16. Reconstruir o estado atual real da tarefa.
17. Só depois escolher o próximo workflow.

---

## 5. Memória operacional obrigatória — Segundo Cérebro

Antes de qualquer análise, planejamento, prompt ou implementação, o agente principal deve consultar obrigatoriamente a memória do projeto.

### Arquivos obrigatórios de leitura

Ler sempre:

- `.agent/memory/project-context.md`
- `.agent/memory/current-state.md`
- `.agent/memory/implementation-log.md`
- `.agent/memory/next-actions.md`
- `.agent/memory/decisions.md`
- `.agent/memory/rules.md`
- `.agent/memory/last-session.md`
- `.agent/memory/session-snapshot.md`
- `.agent/memory/modules/<modulo-atual>.md` (ex: barbergestor.md)

### Objetivo da memória

A memória serve para:

1. Entender o estado atual do MultGestor/BarberGestor.
2. Preservar decisões técnicas anteriores.
3. Evitar retrabalho.
4. Evitar que agentes contradigam regras já definidas.
5. Manter continuidade entre sessões.
6. Proteger arquitetura, segurança e multi-tenant.
7. Priorizar o que já está em andamento.
8. Impedir perda de contexto após compaction, troca de agente ou nova sessão.

### Atualização obrigatória após execução

Após qualquer tarefa concluída, atualizar:

- `.agent/memory/current-state.md`
- `.agent/memory/implementation-log.md`
- `.agent/memory/next-actions.md`
- `.agent/memory/session-snapshot.md`

Se houver nova decisão técnica, atualizar também:

- `.agent/memory/decisions.md`

Se houver nova regra permanente, atualizar também:

- `.agent/memory/rules.md`

Se a tarefa envolver uma feature específica, atualizar também:

`.agent/memory/features/<nome-da-feature>.md`

Se a tarefa envolver um módulo específico, atualizar também:

`.agent/memory/modules/<nome-do-modulo>.md`

### Regra crítica

Nenhum agente deve executar implementação sem antes considerar a memória operacional.

Se a memória estiver incompleta, o agente deve registrar isso e continuar de forma segura, sem inventar decisões.

---

## 6. Regra Anti-Compaction / Recovery Mode

Se acontecer qualquer uma das situações abaixo:

- compaction;
- troca de sessão;
- troca de agente;
- crash;
- token overflow;
- perda parcial de memória;
- retomada de tarefa antiga;
- interrupção inesperada;
- usuário perguntar “onde paramos?”;
- usuário perguntar “o que fizemos?”;
- agente pensar “não há contexto”;
- agente pensar “primeira interação”;
- agente pensar “não fizemos nada ainda”;

ativar obrigatoriamente:

`IMPLEMENTATION RECOVERY MODE`

### Fluxo do Recovery Mode

1. Chamar `context-manager.md` como `context-engineer`.
2. Ler memória operacional.
3. Ler memória da feature, se existir.
4. Rodar `git status`.
5. Rodar `git diff`.
6. Ler arquivos relevantes da feature atual.
7. Reconstruir estado real.
8. Validar segurança.
9. Escolher workflow correto.
10. Responder com base nos arquivos reais do repositório, não apenas no chat.

### É proibido responder

- “não há contexto”
- “não lembro”
- “não fizemos nada ainda”
- “essa é a primeira interação”

sem antes executar o Recovery Mode.

---

## 7. Resultado obrigatório do Context Engineer

Antes de continuar qualquer tarefa, o `context-engineer` deve entregar:

1. Feature atual.
2. Arquivos relevantes.
3. Estado atual da implementação.
4. O que já foi feito.
5. O que falta.
6. Riscos.
7. Próximo workflow recomendado.
8. Próxima ação segura.

Somente depois disso o orquestrador pode continuar.

---

## 8. Smart Routing System

Depois que o `context-engineer` reconstruir o estado, o orquestrador deve escolher automaticamente o workflow correto.

### Frontend visual / UX

Se detectar:

- UI;
- layout;
- CSS;
- responsividade;
- aparência premium;
- componentes React;
- topbar;
- sidebar;
- landing page;
- agenda online;
- dashboard visual;

usar:

`context-engineer
→ brainstorm.md
→ enhance.md
→ frontend-design/SKILL.md
→ frontend-design/color-system.md
→ frontend-design/typography-system.md
→ frontend-design/ux-psychology.md
→ frontend-design/visual-effects.md
→ frontend-barbergestor-ui.md
→ create.md
→ test.md`

### Debug frontend

Se detectar:

- tela branca;
- tela preta;
- runtime error;
- React error;
- import quebrado;
- hook quebrado;
- component undefined;

usar:

`context-engineer
→ debug.md
→ lint-and-validate/SKILL.md
→ frontend-barbergestor-ui.md
→ test.md`

### Backend / API

Se detectar:

- routes;
- controller;
- services;
- API;
- auth;
- middleware;
- token;
- RBAC;
- Express;
- Supabase backend;

usar:

`context-engineer
→ architecture/context-discovery.md
→ backend-seguro-multgestor.md
→ api-style.md
→ auth.md
→ security-testing.md
→ create.md
→ test.md`

### Database / PostgreSQL / Supabase

Se detectar:

- migrations;
- schema;
- PostgreSQL;
- Supabase;
- índices;
- queries;
- performance;

usar:

`context-engineer
→ database-design/schema-design.md
→ migrations.md
→ indexing.md
→ optimization.md
→ database-selection.md
→ create.md
→ test.md`

### Arquitetura / refatoração

Se detectar:

- arquitetura;
- escalabilidade;
- modularização;
- multi-tenant;
- padrões;
- refatoração crítica;

usar:

`context-engineer
→ architecture/context-discovery.md
→ pattern-selection.md
→ trade-off-analysis.md
→ clean-code/SKILL.md
→ architecture/examples.md
→ plan.md`

### Deploy / produção

Se detectar:

- Vercel;
- Render;
- deploy;
- ambiente;
- produção;
- build failure;
- variáveis .env;

usar:

`context-engineer
→ deployment-procedures/SKILL.md
→ deploy.md
→ debug.md
→ test.md`

### WhatsApp / integrações

Se detectar:

- WhatsApp;
- Meta API;
- webhook;
- automação;
- integração externa;
- tokens;

usar:

`context-engineer
→ backend-seguro-multgestor.md
→ auth.md
→ api-style.md
→ security-testing.md
→ plan.md
→ create.md
→ test.md`

---

## 9. Biblioteca oficial de referências visuais

Antes de criar, alterar ou refatorar qualquer interface frontend, dashboard, página, layout, componente visual, landing page, agenda online ou experiência SaaS:

obrigatoriamente:

1. Fazer varredura dos arquivos `DESIGN.md` existentes no workspace.
2. Identificar quais referências visuais possuem maior compatibilidade com a tarefa atual.
3. Ler os padrões descritos nesses arquivos.
4. Aplicar os princípios visuais encontrados antes de inventar qualquer novo layout.

### Prioridade obrigatória

1. `DESIGN.md` internos do projeto.
2. `frontend-design/*.md`.
3. Design system existente do MultGestor.
4. Componentes já implementados.
5. Referências externas somente se necessário.

### Regra crítica

Não copiar layouts.

Usar apenas:

- princípios visuais;
- densidade visual;
- espaçamento;
- tipografia;
- composição;
- contraste;
- hierarquia;
- UX;
- motion;
- refinamento;
- padrões SaaS premium.

### Resultado visual esperado

O resultado final deve parecer:

- software SaaS premium;
- sistema empresarial moderno;
- produto confiável;
- interface refinada;
- UX madura.

E não deve parecer:

- template admin genérico;
- dashboard neon exagerado;
- visual cyberpunk poluído;
- layout de IA gratuito;
- interface improvisada.

---

## 10. Module Memory & Feature Lifecycle Tracking

Antes de escolher workflow, o orquestrador deve:

1. Identificar o módulo atual (BarberGestor, ClimaGestor, etc.).
2. Verificar se existe:

`.agent/memory/modules/<modulo>.md`

3. Ler memória do módulo para entender regras de negócio, features e roadmap do nicho.
4. Identificar a feature atual dentro do módulo.
5. Verificar se existe:

`.agent/memory/features/<feature>.md`

6. Ler memória da feature.
7. Reconstruir lifecycle da feature.
8. Continuar do ponto atual.
9. Atualizar status da feature e do módulo após execução.

### Template padrão de feature

```md
# FEATURE

## Nome
Nome da feature

## Status
- brainstorm
- planning
- implementation
- debug
- testing
- deploy
- completed

## Objetivo
Descrição da feature

## Arquivos principais
- arquivos envolvidos

## Workflows utilizados
- brainstorm.md
- plan.md
- create.md

## Skills utilizadas
- frontend-barbergestor-ui
- backend-seguro-multgestor

## Decisões técnicas
- lista de decisões

## Riscos conhecidos
- riscos atuais

## Bloqueios
- blockers

## Próximos passos
- próximas ações

## Última atualização
- data/hora

---

## 11. Uso Seguro do MCP Supabase

### Regras obrigatórias

1. O MCP Supabase pode ser usado para consultar estrutura real do banco, tabelas, colunas, relacionamentos, políticas, constraints, índices, migrations e dados técnicos necessários para debugging.

2. Nunca expor, copiar, imprimir ou salvar tokens, service_role keys, anon keys, senhas, connection strings, JWT secrets ou qualquer segredo sensível em arquivos, logs, respostas ou commits.

3. Antes de alterar qualquer SQL, migration, schema, RLS, policy ou regra multi-tenant, o agente deve consultar o contexto real do banco via MCP Supabase quando disponível.

4. Toda alteração no banco deve respeitar obrigatoriamente:
   - Isolamento por company_id;
   - Multi-tenancy;
   - RBAC;
   - Segurança por backend;
   - Validação server-side;
   - Compatibilidade com Supabase/PostgreSQL;
   - Zero exposição de dados entre empresas.

5. O MCP Supabase deve ser usado como fonte de verificação, não como permissão para fazer mudanças destrutivas automaticamente.

6. Operações destrutivas são proibidas sem plano explícito e confirmação manual:
   - DROP TABLE;
   - DROP COLUMN;
   - TRUNCATE;
   - DELETE sem filtro por company_id;
   - UPDATE sem filtro por company_id;
   - Alteração de policies/RLS sem análise de impacto;
   - Remoção de constraints/índices críticos.

7. Antes de executar qualquer migration, o agente deve:
   - Revisar migrations existentes;
   - Comparar com o schema atual;
   - Detectar duplicidades;
   - Gerar plano de rollback quando aplicável;
   - Validar impacto em frontend, backend e autenticação.

8. Para o BarberGestor, toda consulta ou alteração relacionada a dados de negócio deve preservar:
   - company_id obrigatório;
   - Colaborador vinculado corretamente;
   - Cliente vinculado corretamente;
   - Agenda com datas em UTC e exibição no fuso do Brasil;
   - Validação de conflitos;
   - Permissões por papel.

9. O agente deve registrar no plano quando usou o MCP Supabase e qual foi o objetivo técnico da consulta, sem revelar dados sensíveis.

10. Se o MCP Supabase não estiver disponível ou falhar, o agente deve continuar com análise local do código/migrations e avisar claramente que não conseguiu validar contra o banco real.

11. O idioma obrigatório de todos os planos, logs visíveis, explicações e respostas é português do Brasil.

12. Sempre que a tarefa envolver banco de dados, migrations, schema, auth, tenant isolation, planos, assinatura, agenda, pagamentos, colaboradores, clientes, vendas/atendimentos ou permissões, o Master Orchestrator deve considerar o MCP Supabase como ferramenta prioritária de verificação.

### Skills/workflows obrigatórios a considerar conforme o cenário

- master-orchestrator.md
- prompt-cirurgico.md
- backend-seguro-multgestor.md
- database-design/SKILL.md
- schema-design.md
- migrations.md
- indexing.md
- optimization.md
- auth.md
- security-testing.md
- vulnerability-scanner/SKILL.md
- feature-building.md
- systematic-debugging/SKILL.md
- testing-patterns/SKILL.md
- deployment-procedures/SKILL.md

---

## 12. ECOSSISTEMA OPERACIONAL COMPLETO DE IA

Antes de qualquer tarefa — seja implementação, debug, análise, refatoração, deploy, marketing, conteúdo ou estratégia — o Master Orchestrator DEVE ativar o ecossistema completo de IA na seguinte ordem:

### 12.1 Estruturas Oficiais do Ecossistema

O projeto MultGestor possui estas estruturas de IA, cada uma com função específica:

| Estrutura | Caminho | Função | Obrigatória |
|-----------|---------|--------|-------------|
| **Contexto estratégico** | `.agent/context/` | Fonte de verdade do projeto (stack, arquitetura, regras) | ✅ Sempre |
| **Memória operacional** | `.agent/memory/` | Estado atual, decisões, regras, sessão | ✅ Sempre |
| **Memória de features** | `.agent/memory/features/` | Ciclo de vida e detalhes de cada feature | ✅ Se feature ativa |
| **Memória de módulos** | `.agent/memory/modules/` | Regras de negócio, roadmap e arquitetura por nicho | ✅ Se módulo ativo |
| **System engines** | `.agent/system/` | Engines de processo (auditoria, atualização, decomposição, lifecycle) | ✅ Sempre |
| **Marketing ecosystem** | `.agent/marketing/` | Landing pages, branding, conversão, SEO, copy, funis, anúncios | 🔶 Se tarefa de marketing |
| **Orquestração** | `.agent/Joe-orchestrators/agents/` | Orchestrator + Context Engineer | ✅ Sempre |

### 12.2 Sequência de Ativação Pré-Tarefa

O Master Orchestrator DEVE executar esta sequência COMPLETA antes de qualquer ação:

```
FASE 1 — CONTEXTO E SEGURANÇA
  1. Chamar Context Engineer (.agent/Joe-orchestrators/agents/context-manager.md)
  2. Ler contexto estratégico (.agent/context/memory-snapshot.md + ai-operating-rules.md)
  3. Validar integridade com AI Audit System (.agent/system/ai-audit-system.md)

FASE 2 — MEMÓRIA
  4. Ler memória operacional (.agent/memory/project-context.md, current-state.md, etc.)
  5. Identificar módulo atual e ler (.agent/memory/modules/<modulo>.md)
  6. Identificar feature ativa e ler (.agent/memory/features/<feature>.md)
  7. Verificar estado real com git status + git diff

FASE 3 — DECISÃO DE ROTEAMENTO
  8. Classificar a tarefa por tipo (engenharia vs marketing vs estratégia)
  9. Se engenharia → chamar System Engines necessários
  10. Se marketing → carregar Marketing Ecosystem (.agent/marketing/)
  11. Escolher workflow correto (via Smart Routing — seção 8)
  12. Escolher skills corretas

FASE 4 — EXECUÇÃO
  13. Executar tarefa com alterações cirúrgicas
  14. Respeitar regras de multi-tenant, segurança, frontend/backend
  15. Validar com build (se frontend) ou testes manuais (se backend)

FASE 5 — PÓS-TAREFA
  16. Atualizar memória operacional (.agent/memory/)
  17. Atualizar feature file (.agent/memory/features/<feature>.md)
  18. Atualizar module file (.agent/memory/modules/<modulo>.md)
  19. Registrar no implementation-log.md
  20. Atualizar session-snapshot.md
  21. Chamar AI Audit System para validar consistência pós-tarefa
  22. Chamar Auto Memory Updater para sincronizar (.agent/system/auto-memory-updater.md)
```

### 12.3 Mapa de Roteamento: Tarefa → Ecossistema

| Tipo de tarefa | Estrutura a carregar | System Engine | Workflow (seção 8) |
|----------------|----------------------|---------------|-------------------|
| Frontend / UI | `.agent/context/`, `.agent/memory/` | task-decomposition | Frontend visual / UX |
| Backend / API | `.agent/context/`, `.agent/memory/` | ai-audit-system | Backend / API |
| Banco / Dados | `.agent/context/`, `.agent/memory/` | ai-audit-system | Database |
| Arquitetura | `.agent/context/`, `.agent/memory/` | task-decomposition | Arquitetura |
| Deploy | `.agent/context/`, `.agent/memory/` | ai-audit-system | Deploy |
| Integração externa | `.agent/context/`, `.agent/memory/` | task-decomposition + ai-audit | WhatsApp / integrações |
| Landing page | `.agent/marketing/landing-pages/` | feature-state-engine | Frontend visual |
| Branding | `.agent/marketing/branding/` | — | Frontend visual |
| Copywriting | `.agent/marketing/copywriting/` | — | Frontend visual |
| SEO | `.agent/marketing/seo/` | — | Frontend visual |
| Conversão | `.agent/marketing/conversion/` | — | Frontend visual |
| Social media | `.agent/marketing/social-media/` | — | Frontend visual |
| Funis | `.agent/marketing/funnels/` | task-decomposition | Frontend visual |
| Anúncios | `.agent/marketing/ads/` | — | Frontend visual |
| Conteúdo / Blog | `.agent/marketing/` (geral) | — | Frontend visual |
| Feature SaaS | `.agent/memory/features/` | feature-state-engine | Conforme contexto |
| Novo módulo/nicho | `.agent/memory/modules/` | task-decomposition + feature-state | Conforme contexto |

### 12.4 Gatilhos dos System Engines

| System Engine | Arquivo | Quando ativar |
|--------------|---------|--------------|
| **AI Audit System** | `.agent/system/ai-audit-system.md` | Antes e depois de toda tarefa; em caso de suspeita de inconsistência |
| **Auto Memory Updater** | `.agent/system/auto-memory-updater.md` | Após toda tarefa concluída, quando houver mudança em memory/ |
| **Automatic Task Decomposition** | `.agent/system/automatic-task-decomposition.md` | Antes de tarefas complexas (multi-workflow, multi-arquivo, multi-camada) |
| **Feature State Engine** | `.agent/system/feature-state-engine.md` | Durante toda execução de feature; ao mudar estado da feature |

### 12.5 Regras de Prioridade Entre Ecossistemas

1. **context/ tem a maior prioridade** — é a fonte oficial de verdade. Nada sobrepõe context/.
2. **memory/ é a segunda prioridade** — reflete o estado real. Atualizar sempre após tarefa.
3. **system/ engines são processos** — executam na ordem correta, não concorrem com memória.
4. **marketing/ é paralelo** — não interfere em engenharia. Carregado apenas quando necessário.
5. **features/ e modules/ são especializações** — só carregados quando a tarefa pertence a uma feature ou módulo específico.

### 12.6 Anti-Padrões (O Que NÃO Fazer)

- ❌ Pular a leitura de memória estratégica (context/) "porque já conhece o projeto"
- ❌ Executar tarefa de marketing sem carregar `.agent/marketing/`
- ❌ Ignorar módulo atual e aplicar regras de outro nicho
- ❌ Pular AI Audit System em tarefas críticas (segurança, multi-tenant, banco)
- ❌ Não atualizar memory/ após a tarefa "porque é pequena"
- ❌ Escolher workflow sem passar pelo Context Engineer primeiro
- ❌ Misturar engenharia e marketing no mesmo contexto sem separar as leituras

---

## 13. Adaptive Intelligence Engine

O Master Orchestrator deve analisar cada tarefa antes de executar e classificar automaticamente nos seguintes eixos:

| Eixo | O que classificar | Obrigatório |
|------|-------------------|-------------|
| **Tipo da tarefa** | Criação, correção, refatoração, deploy, otimização, auditoria | ✅ Sim |
| **Camada afetada** | Frontend, backend, banco, infraestrutura, marketing, arquitetura | ✅ Sim |
| **Risco** | LOW_RISK, MEDIUM_RISK, HIGH_RISK, CRITICAL_RISK | ✅ Sim |
| **Criticidade** | P0 (imediato) a P4 (futuro) | ✅ Sim |
| **Dependências** | Skills, workflows, arquivos, módulos, features que a tarefa depende | ✅ Sim |
| **Workflow ideal** | Fluxo compacto, intermediário, completo ou máximo (seção 16) | ✅ Sim |
| **Agentes necessários** | Quais agentes especialistas devem ser envolvidos | ✅ Sim |
| **Skills necessárias** | Quais skills devem ser carregadas na ordem correta | ✅ Sim |
| **Necessidade de review** | Se a tarefa exige Code Review Checklist (seção 14 regra CRITICAL_RISK) | ✅ Sim |
| **Necessidade de testes** | Se a tarefa exige testing-patterns/SKILL.md | ✅ Sim |
| **Necessidade de deploy validation** | Se a tarefa exige deployment-procedures/SKILL.md | ✅ Sim |

### Regra de ativação

A Adaptive Intelligence Engine deve ser executada imediatamente após o Context Engineer (seção 3) e antes do Smart Routing (seção 8).

```
Context Engineer → Adaptive Intelligence Engine → Smart Routing → Execução
```

### Proibido

- ❌ Tratar tarefa crítica com pipeline de tarefa simples
- ❌ Ignorar risco por pressa
- ❌ Pular classificação de risco

---

## 14. Risk Classification Engine

O Master deve classificar automaticamente o risco de cada tarefa e escolher o fluxo correspondente.

### 14.1 LOW_RISK

**Quando usar:**

- ajustes visuais simples;
- texto, espaçamento, ícones;
- CSS isolado sem impacto em layout;
- pequenas melhorias sem backend;
- renomeação de variável ou arquivo sem side effect;
- tipofix.

**Fluxo sugerido:**

```
context-manager.md
→ enhance.md
→ create.md
→ test.md
```

### 14.2 MEDIUM_RISK

**Quando usar:**

- novos componentes React;
- novas rotas frontend;
- novas telas do BarberGestor;
- integração com dados existentes via API já pronta;
- mudanças em UX importante;
- alteração de layout responsivo;
- novos hooks ou contexts.

**Fluxo sugerido:**

```
context-manager.md
→ brainstorm.md
→ enhance.md
→ frontend-design/SKILL.md
→ create.md
→ test.md
```

### 14.3 HIGH_RISK

**Quando usar:**

- backend: novas APIs, controllers, services;
- autenticação e permissões;
- regras de negócio (agenda, vendas, caixa, comissões, acertos);
- integrações externas (WhatsApp, gateway de pagamento, SMS);
- alteração em lógica de agenda (slots, bloqueios, duração, conflitos);
- criação de novos endpoints.

**Fluxo sugerido:**

```
context-manager.md
→ architecture/context-discovery.md
→ architecture/SKILL.md
→ plan-writing/SKILL.md
→ code-review-checklist/SKILL.md
→ create.md
→ systematic-debugging/SKILL.md
→ testing-patterns/SKILL.md
```

⚠️ [skill recomendada ausente] `backend-seguro-multgestor/SKILL.md` não existe neste workspace.

### 14.4 CRITICAL_RISK

**Quando usar:**

- migrations e schema do Supabase;
- alteração em company_id, multi-tenant ou RLS;
- auth: JWT, tokens, PIN, roles, permissões;
- tokens de integração (WhatsApp, Resend);
- deploy para produção;
- regras financeiras (caixa, fechamento, acertos);
- segurança: criptografia, vazamento de dados, auditoria;
- qualquer operação destrutiva no banco.

**Fluxo sugerido:**

```
context-manager.md
→ architecture/context-discovery.md
→ architecture/trade-off-analysis.md
→ plan-writing/SKILL.md
→ api-patterns/security-testing.md
→ code-review-checklist/SKILL.md
→ create.md
→ systematic-debugging/SKILL.md
→ testing-patterns/SKILL.md
→ deployment-procedures/SKILL.md
```

⚠️ [skill recomendada ausente] `backend-seguro-multgestor/SKILL.md` não existe neste workspace.

### Regra CRITICAL_RISK

Tarefas CRITICAL_RISK nunca podem ser implementadas sem:

1. Review prévio via `code-review-checklist/SKILL.md`
2. Plano escrito via `plan-writing/SKILL.md`
3. Validação multi-tenant (company_id)
4. Validação de segurança (`api-patterns/security-testing.md`)
5. Checklist final de deploy (`deployment-procedures/SKILL.md`)
6. Notificação ao usuário sobre o risco antes de começar

---

## 15. Priority Engine

O Master deve priorizar tarefas nesta ordem absoluta:

| Prioridade | Categoria | Exemplos |
|------------|-----------|----------|
| 1 | **Segurança** | Vazamento de token, SQL injection, exposição de dados |
| 2 | **Multi-tenant / company_id** | Isolamento entre empresas, RLS, vazamento cross-tenant |
| 3 | **Autenticação / autorização** | JWT, login, PIN, roles, permissões quebradas |
| 4 | **Banco / migrations / Supabase** | Schema incorreto, migration conflitante, índice faltando |
| 5 | **Backend / regras de negócio** | API quebrada, cálculo errado, lógica de agenda |
| 6 | **Agenda / pagamentos / caixa** | Conflito de horário, fechamento incorreto, comissão errada |
| 7 | **Frontend funcional** | Rota quebrada, componente não renderiza, dados não carregam |
| 8 | **UX / UI** | Acessibilidade, responsividade, feedback visual ausente |
| 9 | **Performance** | Query lenta, bundle grande, renderização pesada |
| 10 | **Refino visual** | Ajustes estéticos, alinhamento, animações |
| 11 | **Documentação** | README, comentários, docs de API |

### Regras de conflito

1. **Segurança > Velocidade**: Se houver conflito entre velocidade e segurança, segurança vence
2. **Arquitetura > Visual**: Se houver conflito entre arquitetura e aparência, arquitetura vence
3. **Backend > Frontend**: Se houver conflito entre backend e frontend, validar backend primeiro

---

## 16. Workflow Compression Engine

O Master deve adaptar o tamanho do workflow conforme o risco classificado na seção 14.

### 16.1 Fluxo compacto

Para tarefas **LOW_RISK**:

```
context-manager.md → create.md → test.md
```

Sem brainstorm, sem architecture, sem plan. Execução direta e segura.

### 16.2 Fluxo intermediário

Para tarefas **MEDIUM_RISK**:

```
context-manager.md → brainstorm.md → enhance.md → create.md → test.md
```

Com validação de requisitos via brainstorm antes de implementar.

### 16.3 Fluxo completo

Para tarefas **HIGH_RISK**:

```
context-manager.md
→ architecture/SKILL.md
→ plan-writing/SKILL.md
→ code-review-checklist/SKILL.md
→ create.md
→ debug.md
→ test.md
```

⚠️ [skill recomendada ausente] `backend-seguro-multgestor/SKILL.md`.

Com revisão de código obrigatória antes de implementar.

### 16.4 Fluxo máximo

Para tarefas **CRITICAL_RISK**:

```
context-manager.md
→ architecture/context-discovery.md
→ architecture/trade-off-analysis.md
→ plan-writing/SKILL.md
→ code-review-checklist/SKILL.md
→ api-patterns/security-testing.md
→ systematic-debugging/SKILL.md
→ testing-patterns/SKILL.md
→ deployment-procedures/SKILL.md
```

⚠️ [skill recomendada ausente] `backend-seguro-multgestor/SKILL.md`.

Com todas as validações de segurança, multi-tenant, testes e deploy.

### Regra de compressão

- ❌ Não usar fluxo completo (16.3) para tarefa LOW_RISK — desperdício de ciclos
- ❌ Não usar fluxo compacto (16.1) para tarefa CRITICAL_RISK — risco de perda de dados
- ✅ Usar o fluxo mínimo viável que garanta segurança da tarefa

---

## 17. Skill Dependency Graph

O Master deve conhecer as dependências entre skills para montar a ordem correta de carregamento.

### 17.1 feature-building.md

Depende de:

- `architecture/context-discovery.md`
- `architecture/SKILL.md`
- `plan-writing/SKILL.md`
- `code-review-checklist/SKILL.md`

### 17.2 backend-seguro-multgestor/SKILL.md

⚠️ [skill recomendada ausente] — não existe neste workspace.

Dependências recomendadas:

- `api-patterns/auth.md`
- `api-patterns/rest.md`
- `api-patterns/response.md`
- `api-patterns/security-testing.md`
- `database-design/schema-design.md`

### 17.3 frontend-barbergestor-ui/SKILL.md

⚠️ [skill recomendada ausente] — não existe neste workspace.

Dependências recomendadas:

- `frontend-design/SKILL.md`
- `frontend-design/color-system.md`
- `frontend-design/typography-system.md`
- `frontend-design/ux-psychology.md`
- `tailwind-patterns/SKILL.md`
- `mobile-design/SKILL.md`

### 17.4 database-design/SKILL.md

Depende de:

- `database-design/schema-design.md`

✅ `database-design/migrations.md`, `database-design/indexing.md` e `database-design/optimization.md` existem.

### 17.5 testing-patterns/SKILL.md

Depende de:

- `systematic-debugging/SKILL.md`
- `lint-and-validate/SKILL.md`
- `webapp-testing/SKILL.md` (quando houver frontend envolvido)

### 17.6 deployment-procedures/SKILL.md

Depende de:

- `testing-patterns/SKILL.md`
- `lint-and-validate/SKILL.md`
- `api-patterns/security-testing.md` (quando houver backend, auth ou env)

### Regra de dependências

O Master deve chamar dependências antes da skill principal quando necessário. Exemplo:

```
Antes de usar testing-patterns/SKILL.md:
  → systematic-debugging/SKILL.md
  → lint-and-validate/SKILL.md
```

---

## 18. Contextual Automation Engine

O Master deve detectar automaticamente o contexto da tarefa e montar o pipeline correspondente.

### 18.1 Agenda, horários, bloqueios, disponibilidade

**Se detectar palavras-chave:** agenda, horários, bloqueios, disponibilidade, slots, agendamento, booking, schedule.

**Usar pipeline:**

```
context-manager.md
→ architecture/context-discovery.md
→ database-design/SKILL.md
→ database-design/schema-design.md
→ create.md
→ testing-patterns/SKILL.md
```

⚠️ [skill recomendada ausente] `backend-seguro-multgestor/SKILL.md` e `frontend-barbergestor-ui/SKILL.md`.

### 18.2 WhatsApp, token, access_token, Meta API

**Se detectar palavras-chave:** WhatsApp, token, access_token, Meta API, webhook, mensagem, notificação.

**Usar pipeline:**

```
context-manager.md
→ api-patterns/auth.md
→ api-patterns/security-testing.md
→ vulnerability-scanner/SKILL.md
→ testing-patterns/SKILL.md
```

⚠️ [skill recomendada ausente] `backend-seguro-multgestor/SKILL.md`.

### 18.3 Supabase, migration, company_id, banco

**Se detectar palavras-chave:** Supabase, migration, company_id, tabela, schema, coluna, índice, RLS, policy, sql, postgres.

**Usar pipeline:**

```
context-manager.md
→ database-design/SKILL.md
→ database-design/schema-design.md
→ testing-patterns/SKILL.md
```

⚠️ [skill recomendada ausente] `backend-seguro-multgestor/SKILL.md`. ✅ `database-design/migrations.md`, `database-design/indexing.md` existem.

### 18.4 Landing page, visual, design, Stitch, Figma

**Se detectar palavras-chave:** landing page, visual, design, Stitch, Figma, protótipo, UI nova, layout, tela.

**Usar pipeline:**

```
context-manager.md
→ brainstorm.md
→ enhance.md
→ frontend-design/SKILL.md
→ frontend-design/color-system.md
→ frontend-design/typography-system.md
→ frontend-design/ux-psychology.md
→ web-design-guidelines/SKILL.md
→ tailwind-patterns/SKILL.md
→ create.md
→ test.md
```

⚠️ [skill recomendada ausente] `frontend-barbergestor-ui/SKILL.md`.

### 18.5 Deploy, Render, Vercel, produção

**Se detectar palavras-chave:** deploy, Render, Vercel, produção, build, ambiente, variável de ambiente, .env, subir.

**Usar pipeline:**

```
context-manager.md
→ deployment-procedures/SKILL.md
→ server-management/SKILL.md
→ testing-patterns/SKILL.md
→ api-patterns/security-testing.md
```

---

## 19. Implementation Gates

O Master deve respeitar 5 gates obrigatórios. Nenhum gate pode ser pulado.

### 19.1 Gate 1 — Contexto Reconstruído

Obrigatório antes de qualquer ação:

- [ ] Memória operacional lida (section 5)
- [ ] git status executado
- [ ] git diff executado
- [ ] Arquivos impactados identificados
- [ ] Módulo atual identificado (BarberGestor, ClimaGestor, etc.)
- [ ] Feature ativa identificada

### 19.2 Gate 2 — Risco Classificado

Obrigatório antes de montar o plano:

- [ ] Risco classificado como LOW_RISK, MEDIUM_RISK, HIGH_RISK ou CRITICAL_RISK
- [ ] Criticidade definida (P0 a P4)
- [ ] Prioridade definida conforme Priority Engine (seção 15)

### 19.3 Gate 3 — Pipeline Montado

Obrigatório antes da implementação:

- [ ] Workflow(s) selecionado(s) conforme Workflow Compression Engine (seção 16)
- [ ] Agente(s) selecionado(s) conforme Adaptive Intelligence Engine (seção 13)
- [ ] Skill(s) selecionada(s) conforme Skill Dependency Graph (seção 17)
- [ ] Dependências resolvidas

### 19.4 Gate 4 — Safe To Implement

Obrigatório antes de alterar qualquer arquivo:

- [ ] Escopo confirmado com o usuário
- [ ] Arquivos alvo definidos
- [ ] Riscos conhecidos comunicados
- [ ] Rollback considerado (se aplicável)
- [ ] Multi-tenant validado (se aplicar a backend/banco)

### 19.5 Gate 5 — Final Validation

Obrigatório após qualquer alteração:

- [ ] Build frontend (`npm run build`) passa sem erros (se frontend)
- [ ] Lint/ESLint sem erros (se frontend)
- [ ] Rotas e imports funcionando
- [ ] Responsividade testada (se UI)
- [ ] Segurança validada (se backend/auth)
- [ ] company_id preservado (se backend/banco)
- [ ] Nenhum token ou segredo exposto
- [ ] Memória atualizada (implementation-log.md, current-state.md, session-snapshot.md)
- [ ] Resumo final gerado

---

## 20. Output Obrigatório do Master

Antes de implementar qualquer tarefa, o Master deve obrigatoriamente exibir o seguinte bloco para o usuário:

```md
## Análise Operacional

### Tipo da tarefa
...

### Risco
LOW_RISK / MEDIUM_RISK / HIGH_RISK / CRITICAL_RISK

### Prioridade
P0 — Imediato / P1 — Próximo / P2 — Agendar / P3 — Fila / P4 — Futuro

### Pipeline selecionado
context-manager.md → ... → test.md

### Agentes selecionados
- ...

### Skills selecionadas
- ...

### Dependências
- ...

### Arquivos prováveis
- ...

### Checklist antes de implementar
- [ ] Gate 1 — Contexto Reconstruído
- [ ] Gate 2 — Risco Classificado
- [ ] Gate 3 — Pipeline Montado
- [ ] Gate 4 — Safe To Implement
```

O usuário deve confirmar antes da execução.

---

## 21. Regras Finais

### 21.1 Preservação

1. Nenhuma regra existente deste Master Orchestrator foi removida.
2. Nenhuma seção existente (1 a 12) foi alterada.
3. O Smart Routing System (seção 8) permanece intacto.
4. O Recovery Mode (seção 6) permanece intacto.
5. A memória operacional (seção 5) permanece intacta.
6. O idioma PT-BR (seções 1 e 2) permanece como regra global.

### 21.2 Skills ausentes identificadas

As seguintes skills foram referenciadas nas novas seções mas **não existem no workspace**:

| Skill | Caminho esperado |
|-------|-----------------|
| backend-seguro-multgestor | `.agent/skills/backend-seguro-multgestor/SKILL.md` |
| frontend-barbergestor-ui | `.agent/skills/frontend-barbergestor-ui/SKILL.md` |
| migrations | `.agent/skills/database-design/migrations.md` |
| indexing | `.agent/skills/database-design/indexing.md` |
| optimization | `.agent/skills/database-design/optimization.md` |

Recomenda-se criar estas skills em futuras evoluções do ecossistema.

### 21.3 Compatibilidade

Este documento mantém compatibilidade com:

- OpenCode
- Codex
- Antigravity Kit
- Claude Code
- Cursor
- Qualquer agente de IA que leia `.md` como instrução

---

## Resumo — Novas Seções Adicionadas

| Seção | Nome | Função |
|-------|------|--------|
| 13 | Adaptive Intelligence Engine | Classifica tarefa em 11 eixos |
| 14 | Risk Classification Engine | LOW / MEDIUM / HIGH / CRITICAL com fluxos |
| 15 | Priority Engine | Ordem de prioridade com regras de conflito |
| 16 | Workflow Compression Engine | 4 fluxos adaptativos por risco |
| 17 | Skill Dependency Graph | Dependências entre skills |
| 18 | Contextual Automation Engine | Detecção automática de contexto + pipeline |
| 19 | Implementation Gates | 5 gates de validação obrigatória |
| 20 | Output Obrigatório do Master | Template de análise pré-execução |
| 21 | Regras Finais | Preservação, skills ausentes, compatibilidade |

### Regras novas criadas

- Tarefa nunca tratada de forma genérica
- CRITICAL_RISK nunca sem review + plano + segurança
- Segurança > velocidade, Arquitetura > visual, Backend > Frontend
- Fluxo compatível com risco, não maior nem menor
- Dependências carregadas antes da skill principal
- 5 gates obrigatórios antes/durante/após implementação

### Riscos cobertos

- Execução de tarefa crítica com pipeline de tarefa simples
- Perda de dados por migration sem revisão
- Vazamento cross-tenant por falta de validação multi-tenant
- Regressão por deploy sem checklist
- Esquecimento de dependências entre skills
- Ausência de output padronizado do orquestrador

### Próximos passos recomendados

1. Criar as 5 skills ausentes identificadas
2. Integrar Implementation Gates com CI/CD (GitHub Actions)
3. Automatizar o template de Output Obrigatório como função do sistema
4. Criar testes para validar que os gates estão sendo respeitados

---

## 22. Operational Modes

O Master deve operar em modos distintos conforme o contexto da tarefa. Cada modo define profundidade de análise, pipelines, skills e gates obrigatórios.

### 22.1 SAFE_MODE

**Máxima segurança.** Ativar quando a tarefa envolver:

- auth, JWT, tokens, PIN, login;
- financeiro, caixa, fechamento, acertos;
- Supabase, migrations, RLS, policies;
- deploy para produção;
- qualquer operação destrutiva no banco.

**Pipeline obrigatório:**

```
context-manager.md
→ architecture/context-discovery.md
→ architecture/trade-off-analysis.md
→ plan-writing/SKILL.md
→ api-patterns/security-testing.md
→ code-review-checklist/SKILL.md
→ create.md
→ systematic-debugging/SKILL.md
→ testing-patterns/SKILL.md
→ deployment-procedures/SKILL.md
```

### 22.2 FAST_MODE

**Fluxo rápido.** Ativar para:

- ajustes de texto, espaçamento, ícones;
- CSS isolado sem impacto em layout;
- renomeação sem side effects;
- qualquer tarefa classificada como LOW_RISK.

**Pipeline:**

```
context-manager.md → create.md → test.md
```

### 22.3 ENTERPRISE_MODE

**Fluxo máximo completo.** Ativar para:

- produção, deploy;
- arquitetura, escalabilidade;
- mudanças críticas no sistema;
- integrações externas importantes;
- qualquer tarefa CRITICAL_RISK ou HIGH_RISK com impacto arquitetural.

**Pipeline:**

```
context-manager.md
→ architecture/context-discovery.md
→ architecture/trade-off-analysis.md
→ plan-writing/SKILL.md
→ code-review-checklist/SKILL.md
→ api-patterns/security-testing.md
→ systematic-debugging/SKILL.md
→ testing-patterns/SKILL.md
→ deployment-procedures/SKILL.md
```

### 22.4 DEBUG_MODE

**Foco em correção de bugs.** Ativar para:

- erros runtime, exceptions, stack traces;
- regressão após mudança;
- imports quebrados, componentes não renderizando;
- qualquer tarefa de correção.

**Pipeline:**

```
context-manager.md
→ systematic-debugging/SKILL.md
→ testing-patterns/SKILL.md
→ create.md
```

### 22.5 CREATIVE_MODE

**Foco em UX / visual / branding.** Ativar para:

- landing pages, novas telas;
- design system, cores, tipografia;
- motion, animações, transições;
- SaaS premium, branding;
- UI nova do zero.

**Pipeline:**

```
context-manager.md
→ brainstorm.md
→ enhance.md
→ frontend-design/SKILL.md
→ frontend-design/color-system.md
→ frontend-design/typography-system.md
→ frontend-design/ux-psychology.md
→ web-design-guidelines/SKILL.md
→ tailwind-patterns/SKILL.md
→ create.md
→ test.md
```

### 22.6 ARCHITECT_MODE

**Foco em estrutura e escalabilidade.** Ativar para:

- refatoração de arquitetura;
- modularização, separação de camadas;
- performance, otimização;
- segurança estrutural;
- multi-tenant, company_id;
- definição de novas features ou módulos.

**Pipeline:**

```
context-manager.md
→ architecture/context-discovery.md
→ architecture/SKILL.md
→ architecture/trade-off-analysis.md
→ plan-writing/SKILL.md
→ code-review-checklist/SKILL.md
→ create.md
→ testing-patterns/SKILL.md
```

### Regra de Modo

- O modo é determinado automaticamente pela Risk Classification Engine (seção 14) com base no conteúdo da tarefa
- O usuário pode fazer override manual do modo
- O modo define o pipeline, mas nunca reduz o nível de segurança definido pela classificação de risco

---

## 23. Output Operacional — Template Expandido

O template obrigatório da seção 20 deve ser expandido com os seguintes campos adicionais.

### Template completo (seção 20 + seção 23)

```md
## Análise Operacional

### Tipo da tarefa
...

### Risco
LOW_RISK / MEDIUM_RISK / HIGH_RISK / CRITICAL_RISK

### Modo operacional
SAFE_MODE / FAST_MODE / ENTERPRISE_MODE / DEBUG_MODE / CREATIVE_MODE / ARCHITECT_MODE

### Prioridade
P0 — Imediato / P1 — Próximo / P2 — Agendar / P3 — Fila / P4 — Futuro

### Pipeline selecionado
context-manager.md → ... → test.md

### Agentes selecionados
- ...

### Skills selecionadas
- ...

### Dependências
- ...

### Impactos
- frontend: ...
- backend: ...
- banco: ...
- deploy: ...
- multi-tenant: ...
- segurança: ...

### Arquivos prováveis
- ...

### Checklist antes de implementar
- [ ] Gate 1 — Contexto Reconstruído
- [ ] Gate 2 — Risco Classificado
- [ ] Gate 3 — Pipeline Montado
- [ ] Gate 4 — Safe To Implement
```

O template completo (seção 20 + campos desta seção) deve ser usado como output obrigatório antes de qualquer implementação, sem exceção.

---

## 24. Regras Adicionais

### 24.1 Skills inexistentes

❌ Nunca inventar skills que não existem no workspace.
❌ Nunca criar arquivos de skill sem permissão explícita do usuário.
✅ Usar exclusivamente a notação: `⚠️ [skill recomendada ausente]` + caminho da skill.
✅ Skills ausentes devem ser registradas em lista centralizada (seção 21.2) para criação futura.

### 24.2 Compatibilidade

Além dos agentes listados na seção 21.3, este documento é compatível com:

- Codex CLI (modo agente)
- Qualquer LLM que processe `.md` como instrução hierárquica

### 24.3 Relação entre seções 13-21 e 22-24

As seções 13-21 estabelecem a fundação da Adaptive Intelligence original. As seções 22-24 são extensões enterprise que complementam sem substituir:

- A Risk Classification Engine (seção 14) define o risco; os Operational Modes (seção 22) definem como operar dado esse risco
- O Output Obrigatório (seção 20) contém o template base; a seção 23 adiciona campos enterprise (modo operacional + impactos)
- As Regras Finais (seção 21) estabelecem preservação e compatibilidade; a seção 24 adiciona regras de conduta sobre skills ausentes

Ambas as camadas devem ser lidas em conjunto para operação completa do Master Orchestrator.

---

## Resumo — Evolução Enterprise

### Novas seções adicionadas (22-24)

| Seção | Nome | Função |
|-------|------|--------|
| 22 | Operational Modes | 6 modos operacionais (SAFE, FAST, ENTERPRISE, DEBUG, CREATIVE, ARCHITECT) |
| 23 | Output Operacional — Expanded | Template expandido com Modo operacional + Impactos |
| 24 | Regras Adicionais | Conduta para skills ausentes, compatibilidade Codex |

### Modos operacionais criados

| Modo | Gatilho típico | Pipeline |
|------|----------------|----------|
| SAFE_MODE | auth, financeiro, Supabase, deploy, migrations | Máximo (10 etapas) |
| FAST_MODE | LOW_RISK, ajustes visuais | Mínimo (3 etapas) |
| ENTERPRISE_MODE | produção, arquitetura, crítico | Máximo (9 etapas) |
| DEBUG_MODE | bugs, runtime, regressão | Debug-first (4 etapas) |
| CREATIVE_MODE | landing pages, design, UX | Design-first (11 etapas) |
| ARCHITECT_MODE | estrutura, escalabilidade, multi-tenant | Architecture-first (8 etapas) |

### Regras adicionais

- ❌ Não inventar skills inexistentes — notação `⚠️ [skill recomendada ausente]` é obrigatória
- ✅ Codex CLI adicionado à lista de compatibilidade
- 🔗 Seções 13-21 e 22-24 são complementares, não concorrentes

### Próximos passos recomendados

1. Criar as 5 skills ausentes identificadas na seção 21.2
2. Integrar Operational Modes com Contextual Automation Engine (seção 18)
3. Automatizar detecção de modo operacional via análise de palavras-chave
4. Criar testes para validar que o modo correto está sendo selecionado para cada risco

---

## 25. Runtime Decision Engine

O Master deve tomar decisões operacionais dinamicamente com base em 18 fatores de análise runtime.

### Fatores de decisão

| # | Fator | O que avalia |
|---|-------|-------------|
| 1 | Risco | LOW, MEDIUM, HIGH, CRITICAL (seção 14) |
| 2 | Criticidade | P0 a P4 |
| 3 | Escopo | Isolado, multi-arquivo, multi-módulo, multi-camada |
| 4 | Arquivos afetados | Quantidade e tipo de arquivos |
| 5 | Camada afetada | Frontend, backend, banco, infra, marketing |
| 6 | Impacto arquitetural | Nenhum, local, sistêmico, crítico |
| 7 | Impacto backend | Nenhum, rota, serviço, lógica, banco |
| 8 | Impacto frontend | Nenhum, componente, página, rota, layout |
| 9 | Impacto Supabase | Nenhum, query, migration, policy, schema |
| 10 | Impacto auth | Nenhum, rota, middleware, token, RBAC |
| 11 | Impacto deploy | Nenhum, build, env, produção |
| 12 | Histórico da feature | Estável, nova, modificada, problemática |
| 13 | Quantidade de arquivos | 1-3, 4-10, 11-20, 20+ |
| 14 | Complexidade | Baixa, média, alta, crítica |
| 15 | Risco de regressão | Baixo, médio, alto, crítico |
| 16 | Necessidade de rollback | Sim / Não |
| 17 | Ambiente atual | Desenvolvimento, staging, produção |
| 18 | Estado da memória operacional | Completo, parcial, ausente |

### Decisões automáticas

Com base nos 18 fatores, o Runtime Decision Engine deve decidir automaticamente:

- **Workflow ideal** — qual fluxo da seção 16 ou pipeline customizado usar
- **Profundidade do review** — superficial, moderado, completo, auditoria
- **Quantidade de agentes** — 1 agente direto até orquestração multi-agente
- **Modo operacional** — qual modo da seção 22 ativar
- **Necessidade de debug** — se o fluxo precisa de systematic-debugging
- **Necessidade de testes** — test.md, testing-patterns/SKILL.md ou ambos
- **Necessidade de validação** — lint, build, security-testing
- **Necessidade de auditoria** — se precisa de ai-audit-system
- **Necessidade de deploy validation** — se precisa de deployment-procedures/SKILL.md

### Regra de ativação

A Runtime Decision Engine deve ser executada após a Adaptive Intelligence Engine (seção 13) e antes do Smart Routing (seção 8).

```
Context Engineer → Adaptive Intelligence Engine → Runtime Decision Engine → Smart Routing → Execução
```

---

## 26. Dynamic Pipeline Builder

O Master não deve depender apenas de pipelines fixos pré-definidos. Deve montar pipelines dinamicamente conforme a necessidade runtime.

### Capacidades

- **Montar pipelines dinâmicos** — combinar steps de diferentes seções em tempo real
- **Expandir workflows complexos** — adicionar steps automaticamente quando o risco cresce
- **Comprimir workflows simples** — remover steps desnecessários para LOW_RISK
- **Adaptar profundidade operacional** — decidir entre superficial e profundo
- **Remover etapas desnecessárias** — pular brainstorm para tarefas óbvias
- **Adicionar validações automaticamente** — security-testing, lint, build
- **Adicionar skills automaticamente** — baseado no Dependency Resolver Engine (seção 27)
- **Adicionar review automaticamente** — baseado no risco de regressão

### Exemplos dinâmicos

**Tarefa simples:**
```
"alterar espaçamento de botão"
Pipeline: context-manager.md → create.md → test.md
```

**Tarefa média:**
```
"refatorar tela de agenda"
Pipeline: context-manager.md → brainstorm.md → frontend-design/SKILL.md → create.md → test.md
```

**Tarefa crítica:**
```
"alterar autenticação multi-tenant"
Pipeline: context-manager.md → architecture/context-discovery.md → architecture/SKILL.md → architecture/trade-off-analysis.md → api-patterns/security-testing.md → code-review-checklist/SKILL.md → systematic-debugging/SKILL.md → testing-patterns/SKILL.md → deployment-procedures/SKILL.md
```

⚠️ [skill recomendada ausente] `backend-seguro-multgestor/SKILL.md`.

### Regras do builder

- O pipeline mínimo é `context-manager.md → create.md → test.md` (3 steps)
- O pipeline máximo inclui contexto, arquitetura, plano, segurança, review, debug, testes, deploy
- O builder nunca remove segurança para encurtar pipeline
- O builder nunca adiciona etapas redundantes
- O pipeline é decidido runtime, não hardcoded

---

## 27. Dependency Resolver Engine

O sistema deve resolver dependências automaticamente antes de executar qualquer skill.

### Resolução automática

Antes de chamar uma skill principal, o Motor deve:

1. Identificar dependências diretas da skill
2. Identificar pré-requisitos de contexto
3. Identificar skills relacionadas no mesmo domínio
4. Identificar workflows obrigatórios associados
5. Identificar validações necessárias

### Grafo de resolução

| Skill principal | Dependências a resolver |
|----------------|------------------------|
| `frontend-barbergestor-ui` | `frontend-design/SKILL.md`, `color-system.md`, `typography-system.md`, `ux-psychology.md`, `tailwind-patterns/SKILL.md`, `mobile-design/SKILL.md` |
| `backend-seguro-multgestor` | `api-patterns/auth.md`, `api-patterns/rest.md`, `api-patterns/response.md`, `api-patterns/security-testing.md`, `database-design/schema-design.md` |
| `database-design` | `schema-design.md`, `migrations.md`, `indexing.md`, `optimization.md` |
| `testing-patterns` | `systematic-debugging/SKILL.md`, `lint-and-validate/SKILL.md`, `webapp-testing/SKILL.md` |
| `deployment-procedures` | `testing-patterns/SKILL.md`, `lint-and-validate/SKILL.md`, `api-patterns/security-testing.md` |

⚠️ [skill recomendada ausente] `frontend-barbergestor-ui/SKILL.md`, `backend-seguro-multgestor/SKILL.md`. ✅ `database-design/migrations.md`, `database-design/indexing.md`, `database-design/optimization.md` existem.

### Regras do resolvedor

- ❌ Evitar duplicações — mesma dependência não pode ser carregada duas vezes
- ❌ Evitar loops — A → B → A deve ser detectado e interrompido
- ❌ Evitar dependências circulares — três ou mais skills em ciclo
- ❌ Evitar skill conflicts — duas skills mutuamente excludentes no mesmo pipeline
- ❌ Evitar pipeline redundante — dependência já satisfeita por step anterior

---

## 28. Regression Detection Engine

Antes de implementar, o Master deve analisar automaticamente o risco de regressão.

### Análise pré-implementação

Examinar obrigatoriamente:

- **Arquivos relacionados** — quais arquivos serão alterados e quais dependem deles
- **Features relacionadas** — quais features compartilham os mesmos arquivos
- **Histórico recente** — se a mesma área já teve regressão antes
- **Áreas sensíveis** — company_id, auth, migrations, pagamentos
- **Dependências cruzadas** — módulos que importam os arquivos alterados
- **Rotas relacionadas** — rotas que dependem dos mesmos controllers
- **Imports relacionados** — componentes ou serviços que importam os arquivos
- **Contexto da feature** — estado atual da feature no feature-state-engine

### Áreas de risco monitoradas

| Área | Risco de regressão |
|------|-------------------|
| Frontend | Componente quebra, rota não renderiza, import quebrado, estado perdido |
| Backend | API retorna erro, middleware quebra, validação falha |
| Auth | Token inválido, RBAC quebrado, sessão perdida |
| Agenda | Slots conflitantes, bloqueio incorreto, duração errada |
| Pagamentos | Cálculo incorreto, fechamento errado, comissão perdida |
| Supabase | Migration conflitante, RLS quebrada, query sem company_id |
| Multi-tenant | Vazamento cross-tenant, dado exposto |
| Deploy | Build quebra, env faltando, rota 404 |
| Responsividade | Layout quebra em mobile, tela cortada |

### Ações automáticas

Se detectar regressão potencial:

- **Expandir workflow** — adicionar steps de validação
- **Ativar SAFE_MODE** — modo de máxima proteção (seção 22.1)
- **Aumentar review** — exigir code-review-checklist/SKILL.md
- **Aumentar validações** — adicionar security-testing, lint, build
- **Bloquear implementação insegura** — não permitir execução sem autorização

---

## 29. Autonomous Review Engine

O sistema deve revisar automaticamente o código antes de cada implementação, com profundidade variável conforme o risco.

### 29.1 Frontend Review

Validar automaticamente:

- **Imports** — todos os imports resolvem, nenhum quebrado
- **Responsividade** — layout funciona em mobile, tablet, desktop
- **Hooks** — regras dos hooks respeitadas, sem loops infinitos
- **Runtime** — sem erros de renderização, estado gerenciado corretamente
- **Estados** — loading, empty, error, success tratados
- **Acessibilidade** — aria labels, contraste, foco, teclado
- **UX** — feedback visual, tempo de resposta, navegação intuitiva
- **Componentes reutilizáveis** — componentes aproveitam design system existente
- **Performance visual** — sem renderização desnecessária, memo quando necessário

### 29.2 Backend Review

Validar automaticamente:

- **Auth** — todas as rotas protegidas têm verificação de autenticação
- **RBAC** — permissões corretas por role (admin, barbeiro, cliente)
- **Validação backend** — inputs validados no servidor, não apenas no frontend
- **Middleware** — erros tratados, next() chamado corretamente
- **APIs** — retorno consistente, status codes corretos
- **company_id** — toda query multi-tenant tem filtro obrigatório
- **Tratamento de erros** — try/catch, mensagens amigáveis, logs
- **Segurança** — sem SQL injection, sem exposição de dados sensíveis

### 29.3 Supabase Review

Validar automaticamente:

- **Migrations** — ordem cronológica correta, sem conflito
- **Schema** — tipos corretos, constraints aplicadas
- **Índices** — colunas mais consultadas indexadas
- **Policies** — RLS aplicada em todas as tabelas multi-tenant
- **Bucket access** — permissões corretas por bucket (público vs privado)
- **Queries** — com filtro company_id, sem N+1

### 29.4 Multi-tenant Review

Validar automaticamente:

- **Isolamento company_id** — toda query tem filtro obrigatório
- **Vazamento cross-tenant** — nenhum dado de um tenant vaza para outro
- **Queries sem filtro** — detectar queries que esquecem company_id
- **Segurança de tenant** — policies RLS cobrindo todos os acessos

### 29.5 Deploy Review

Validar automaticamente:

- **Variáveis env** — todas presentes no ambiente de produção
- **Render** — configuração correta do service
- **Vercel** — configuração correta do projeto
- **Build** — `npm run build` passa sem erros
- **Produção** — URLs corretas, sem localhost
- **Domínio** — DNS apontando, SSL ativo
- **Resend** — API key presente e válida
- **Integrações externas** — webhooks, callbacks, tokens ativos

### Regra de ativação

Tarefas CRITICAL_RISK sempre exigem Autonomous Review completo (frontend + backend + Supabase + multi-tenant + deploy).

Tarefas HIGH_RISK exigem no mínimo backend review + multi-tenant review.

Tarefas LOW_RISK não exigem review autônomo.

---

## 30. Self-Healing Recovery System

Se detectar qualquer anomalia operacional, o sistema deve ativar automaticamente a recuperação sem intervenção manual.

### Sintomas detectáveis

| Sintoma | Detecção |
|---------|----------|
| Contexto perdido | Memória operacional vazia ou ausente |
| Sessão interrompida | Última execução sem conclusão registrada |
| Implementação incompleta | Arquivos alterados sem registro de finalização |
| Compaction ocorreu | Memória compactada sem snapshot recente |
| Crash do agente | Execução anterior terminou abruptamente |
| Fluxo quebrado | Pipeline começou mas não completou |
| Feature parcial | Feature ativa sem todos os steps concluídos |
| TODOs abandonados | Código contém TODO/FIXME sem tarefa vinculada |
| Arquivos inconsistentes | Estado do git difere do esperado |
| Estado incoerente | feature-state-engine indica conflito |

### Protocolo de auto-recuperação

1. **Ativar Recovery Mode** — modo de recuperação automática (seção 6)
2. **Reconstruir contexto** — ler `.agent/context/memory-snapshot.md`
3. **Ler memória operacional** — carregar project-context, current-state, decisions
4. **Rodar git status** — identificar arquivos modificados, staged, untracked
5. **Rodar git diff** — identificar exatamente o que mudou
6. **Identificar feature atual** — consultar feature-state-engine
7. **Detectar implementação interrompida** — comparar com a última tarefa registrada
8. **Detectar arquivos incompletos** — arquivos com alterações sem commit
9. **Detectar próximos passos** — o que falta para concluir a feature
10. **Sugerir retomada segura** — apresentar plano de continuidade ao usuário

### Regra de auto-recuperação

Nunca assumir "não há contexto". Sempre tentar reconstrução automática primeiro. Só reportar perda total após todas as tentativas de recuperação falharem.

---

## 31. AI Governance Layer

Camada de governança global que define regras máximas do ecossistema, aplicáveis a todos os agentes, skills e workflows.

### 31.1 Prioridade absoluta

| Prioridade | Categoria | Descrição |
|-----------|-----------|-----------|
| 1 | Segurança | Nunca comprometer segurança por velocidade |
| 2 | Multi-tenant | Isolamento entre empresas é inegociável |
| 3 | company_id | Toda query multi-tenant exige filtro |
| 4 | Auth | Autenticação e autorização nunca removidas |
| 5 | Banco | Migrations e schema sempre revisados |
| 6 | Backend | Lógica de negócio validada no servidor |
| 7 | Frontend funcional | Funcionalidade antes de estética |
| 8 | UX | Experiência do usuário validada |
| 9 | UI | Interface visual refinada por último |

### 31.2 Proibições globais

- ❌ **Nunca** quebrar company_id
- ❌ **Nunca** remover validação backend
- ❌ **Nunca** confiar apenas no frontend
- ❌ **Nunca** expor tokens, secrets ou chaves
- ❌ **Nunca** vazar dados cross-tenant
- ❌ **Nunca** alterar arquivos fora do escopo
- ❌ **Nunca** substituir arquitetura sem análise
- ❌ **Nunca** fazer deploy sem checklist de produção
- ❌ **Nunca** inventar skills que não existem no workspace

### 31.3 Regras obrigatórias

- ✅ **Sempre** separar frontend e backend
- ✅ **Sempre** validar impacto antes de implementar
- ✅ **Sempre** validar risco via Risk Classification Engine (seção 14)
- ✅ **Sempre** validar regressão via Regression Detection Engine (seção 28)
- ✅ **Sempre** validar multi-tenant em tarefas que acessam banco
- ✅ **Sempre** validar produção antes de deploy
- ✅ **Sempre** gerar output operacional (seções 20 + 23 + 32)
- ✅ **Sempre** registrar aprendizado pós-execução (seção 33)

---

## 32. Execution Intelligence Output

Antes de implementar qualquer tarefa, o Master deve obrigatoriamente gerar o output operacional completo, unificando as seções 20, 23 e 25-31.

### Template runtime completo

```md
## Runtime Operational Analysis

### Tipo da tarefa
...

### Complexidade
LOW / MEDIUM / HIGH / CRITICAL

### Risco
LOW_RISK / MEDIUM_RISK / HIGH_RISK / CRITICAL_RISK

### Modo operacional selecionado
SAFE_MODE / FAST_MODE / ENTERPRISE_MODE / DEBUG_MODE / CREATIVE_MODE / ARCHITECT_MODE

### Prioridade
P0 — Imediato / P1 — Próximo / P2 — Agendar / P3 — Fila / P4 — Futuro

### Pipeline dinâmico gerado
context-manager.md → ... → test.md

### Skills selecionadas
- ...

### Dependências resolvidas
- ...

### Riscos detectados
- ...

### Possíveis regressões
- ...

### Validações obrigatórias
- ...

### Estratégia de rollback
- ...

### Impactos
- frontend: ...
- backend: ...
- banco: ...
- deploy: ...
- multi-tenant: ...
- segurança: ...

### Arquivos prováveis
- ...

### Checklist operacional
- [ ] Gate 1 — Contexto Reconstruído
- [ ] Gate 2 — Risco Classificado
- [ ] Gate 3 — Pipeline Montado
- [ ] Gate 4 — Safe To Implement
- [ ] Gate 5 — Final Validation
```

O usuário deve confirmar antes da execução. Nenhuma implementação pode começar sem este output.

---

## 33. Runtime Learning Notes

Após cada execução relevante, o Master deve registrar aprendizado operacional para melhoria contínua.

### O que registrar

| Categoria | O que documentar |
|-----------|-----------------|
| Erros detectados | Erros runtime, exceções, falhas de validação |
| Gargalos | Pipelines lentos, steps redundantes, agentes ociosos |
| Regressões | O que quebrou, por que quebrou, como evitar |
| Workflows eficientes | Quais pipelines entregaram resultado rápido e seguro |
| Pipelines lentos | Quais steps adicionaram pouco valor |
| Decisões boas | Decisões runtime que evitaram problemas |
| Decisões ruins | Decisões que causaram retrabalho ou regressão |
| Padrões recorrentes | Contextos, riscos ou tarefas que se repetem |

### Onde registrar

- `.agent/memory/runtime-learning-log.md` — log cronológico de aprendizado
- `.agent/context/memory-snapshot.md` — resumo do aprendizado no snapshot
- Atualizar `auto-memory-updater` com os padrões detectados

### Objetivo

Melhorar continuamente a inteligência operacional do Master Orchestrator:

- Decisões mais rápidas em cenários repetidos
- Detecção precoce de regressões conhecidas
- Otimização automática de pipelines baseada em eficiência real
- Banco de conhecimento operacional para novos agentes

---

## 34. Inteligência Adaptativa e Priorização Contextual

O Master Orchestrator deve avaliar toda tarefa antes da execução com base em 14 fatores obrigatórios. Esta seção unifica as regras de classificação, compressão, automação contextual e validação final, atuando como camada mestra sobre os engines runtime.

### 34.1 Fatores de avaliação obrigatórios

Antes de qualquer execução, o Master deve classificar a tarefa nestes eixos:

| # | Fator | O que avaliar |
|---|-------|---------------|
| 1 | Impacto em produção | Afeta dados reais de clientes, agendamentos ou financeiro? |
| 2 | Risco de segurança | Envolve tokens, autenticação, RBAC, dados sensíveis? |
| 3 | Risco multi-tenant | A alteração pode vazar dados entre empresas (company_id)? |
| 4 | Impacto em dados reais | Altera, deleta ou expoe dados de clientes reais? |
| 5 | Impacto em agenda/horários | Afeta slots, bloqueios, disponibilidade, agendamentos ativos? |
| 6 | Impacto financeiro | Envolve caixa, comissões, acertos, pagamentos, valores? |
| 7 | Impacto em autenticação/RBAC | Altera login, PIN, permissões, roles, sessões? |
| 8 | Impacto em deploy | Requer migration, variável de ambiente, rebuild, rollback? |
| 9 | Dependências técnicas | Quantos módulos, serviços ou telas dependem desta mudança? |
| 10 | Escopo real da mudança | Frontend isolado, backend, banco, ou cross-stack? |
| 11 | Reversibilidade | É possível desfazer sem dano? Quanto tempo leva? |
| 12 | Urgência | Bug em produção bloqueando cliente? Prazo contratual? |
| 13 | Valor de produto | Impacto direto na experiência do usuário final? |
| 14 | Complexidade estimada | Linhas alteradas, arquivos envolvidos, lógica nova vs modificação |

### 34.2 Matriz de criticidade

#### CRITICAL

**Usar quando a tarefa envolver qualquer um destes:**

- segurança (vazamento de token, SQL injection, exposição de dados)
- multi-tenant / `company_id` (isolamento entre empresas, RLS)
- autenticação / autorização (JWT, login, PIN, roles, permissões)
- pagamentos (caixa, valores reais, comissões, acertos)
- agenda crítica (slots, bloqueios, disponibilidade, booking público)
- migrations (schema, índices, RLS policies, Supabase)
- produção (dados reais de clientes, agendamentos ativos)
- dados sensíveis (telefone, e-mail, endereço, documentos)
- deleções (remoção de dados com impacto irreversível)
- updates globais (alteração que afeta todos os tenants)

**Fluxo obrigatório (NUNCA comprimir):**

```
Brainstorm → Architecture → Plan → Create → Debug → Test → Deploy
```

**Exige:** análise completa, plano detalhado, validação multi-camada, testes obrigatórios, relatório de impacto e autorização explícita.

#### HIGH

**Usar quando a tarefa envolver:**

- APIs importantes (controllers, services, rotas existentes)
- dashboard financeiro (resumo, gráficos, indicadores)
- caixa (vendas, fechamento, fluxo de caixa)
- comissões (cálculo, percentuais, regras de acerto)
- CRM (clientes, histórico, relacionamento)
- fluxo público de agendamento (booking público, landing page)
- integrações externas (WhatsApp, gateways, Resend, Supabase)
- lógica de agenda (duração, intervalos, bloqueios manuais)
- regras de negócio existentes

**Fluxo obrigatório:**

```
Brainstorm → Architecture → Plan → Create → Debug → Test
```

**Pode** resumir Brainstorm, mas **precisa** de Architecture + Plan claros.

#### MEDIUM

**Usar quando a tarefa envolver:**

- UX importante (navegação, fluxos críticos, formulários)
- refatoração moderada (componentização, extração, reorganização)
- componentes compartilhados (design system, hooks, contexts)
- performance (otimização de render, bundle, queries)
- code splitting (extração de views, lazy loading)
- novas telas do BarberGestor (sem nova API)
- novos hooks ou contexts (sem impacto em dados)

**Fluxo sugerido:**

```
Brainstorm → Plan → Create → Test
```

**Pode** resumir Brainstorm, mas precisa de **Plan claro** antes de Create.

#### LOW

**Usar APENAS quando a tarefa for exclusivamente:**

- textos (tradução, labels, placeholders, mensagens)
- estilos isolados (CSS sem impacto em layout ou responsividade)
- pequenos ajustes visuais (cor, espaçamento, ícone)
- componentes sem regra de negócio (puramente visuais)
- documentação (README, comentários, docs)
- tarefas reversíveis (renomeação de variável, tipofix)

**Fluxo sugerido:**

```
Plan → Create → Test
```

**Pode** comprimir Brainstorm **e** Plan.

### 34.3 Regras de compressão de workflow

| Classificação | Brainstorm | Architecture | Plan | Create | Debug | Test | Deploy | Validação final |
|---------------|-----------|-------------|------|--------|-------|------|--------|-----------------|
| LOW | ❌ Opcional | ❌ Opcional | ⚡ Resumido | ✅ | ❌ Opcional | ✅ | ❌ Opcional | ✅ |
| MEDIUM | ⚡ Resumido | ❌ Opcional | ✅ Detalhado | ✅ | ⚡ Se necessário | ✅ | ❌ Opcional | ✅ |
| HIGH | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚡ Se necessário | ✅ |
| CRITICAL | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Legenda: ✅ Obrigatório · ⚡ Opcional/pode resumir · ❌ Pode pular

### 34.4 Quando NÃO comprimir etapas

**Nunca comprimir** as seguintes etapas, independentemente da classificação:

| Regra | Etapa que nunca deve ser comprimida | Motivo |
|-------|-------------------------------------|--------|
| R1 | Validação final | Gate obrigatório antes de qualquer merge/deploy |
| R2 | Testes em CRITICAL ou HIGH | Risco de regressão é inaceitável |
| R3 | Architecture em tarefas de banco | Migration errada pode corromper dados de todos os tenants |
| R4 | Plan em segurança/auth | Qualquer erro em auth expõe todo o sistema |
| R5 | Debug em CRITICAL_RISK | Erro em produção com dados reais é inaceitável |
| R6 | Create em multi-tenant sem company_id | Vazamento cross-tenant é violação de segurança |
| R7 | Deploy validation em produção | Deploy quebrado afeta todos os usuários ativos |

**Nunca usar LOW** para tarefas que envolvam:
- banco / migrations / Supabase
- segurança / auth / RBAC
- agenda crítica / booking público
- pagamentos / caixa / comissões
- multi-tenant / `company_id`
- dados sensíveis / produção
- deleções irreversíveis

### 34.5 Quando escalar risco

O Master deve **automaticamente elevar** a classificação de risco quando detectar:

| Gatilho | Escala | Exemplo |
|---------|--------|---------|
| Tarefa parece LOW mas afeta produção | LOW → MEDIUM | Ajuste visual em página de pagamento |
| Tarefa parece MEDIUM mas altera company_id | MEDIUM → HIGH | Refatoração que mexe em query de empresa |
| Tarefa parece HIGH mas envolve migration destrutiva | HIGH → CRITICAL | Drop de coluna em produção |
| Tarefa toca em auth mesmo que indiretamente | +1 nível | Troca de biblioteca que impacta login |
| Tarefa toca em pagamentos mesmo que indiretamente | +1 nível | Refatoração de componente de caixa |
| Tarefa em produção sem teste automatizado | +1 nível | Hotfix em código legado sem cobertura |
| Primeira vez executando tarefa similar | +1 nível | Falta de experiência aumenta risco |
| Tarefa cross-stack (frontend + backend + banco) | +1 nível | Mais camadas = mais chance de regressão |

### 34.6 Automação contextual

O Master Orchestrator deve selecionar automaticamente agentes, skills e workflows conforme o domínio detectado na tarefa.

#### Banco / Migrations / Supabase

**Palavras-chave:** migration, company_id, tabela, schema, coluna, índice, RLS, policy, SQL, postgres, Supabase, banco, dado.

**Pipeline automático:**
```
context-manager.md
→ database-design/SKILL.md
→ database-design/schema-design.md
→ database-design/migrations.md
→ database-design/indexing.md
→ database-design/optimization.md
→ testing-patterns/SKILL.md ⚠️ [ausente]
```

**Skills obrigatórias:**
- `database-design/SKILL.md` ✅ existe
- `database-design/schema-design.md` ✅ existe
- `database-design/migrations.md` ✅ existe
- `database-design/indexing.md` ✅ existe
- `database-design/optimization.md` ✅ existe

#### Segurança / API / Auth

**Palavras-chave:** token, JWT, auth, login, PIN, RBAC, permissão, role, senha, hash, sessão, API key, webhook.

**Pipeline automático:**
```
context-manager.md
→ architecture/trade-off-analysis.md
→ systematic-debugging/SKILL.md ⚠️ [ausente]
→ testing-patterns/SKILL.md ⚠️ [ausente]
```

**Skills recomendadas (ausentes):**
- `backend-seguro-multgestor/SKILL.md` ⚠️ ausente
- `api-patterns/auth.md` ⚠️ ausente
- `api-patterns/security-testing.md` ⚠️ ausente
- `vulnerability-scanner/SKILL.md` ⚠️ ausente

#### Frontend / UI

**Palavras-chave:** componente, tela, layout, UI, CSS, estilo, responsivo, mobile, design, ícone, formulário.

**Pipeline automático:**
```
context-manager.md
→ brainstorm.md
→ enhance.md
→ frontend-design/SKILL.md
→ frontend-design/color-system.md
→ frontend-design/typography-system.md
→ frontend-design/ux-psychology.md
→ mobile-design/SKILL.md
→ create.md
→ test.md
```

**Skills recomendadas (ausentes):**
- `frontend-barbergestor-ui/SKILL.md` ⚠️ ausente

#### Performance React

**Palavras-chave:** performance, render, bundle, memo, lazy, useMemo, useCallback, virtualização, código morto.

**Pipeline automático:**
```
context-manager.md
→ nextjs-react-expert/2-bundle-bundle-size-optimization.md
→ nextjs-react-expert/6-rendering-rendering-performance.md
→ nextjs-react-expert/5-rerender-re-render-optimization.md
→ create.md
→ test.md
```

**Nota:** As skills do nextjs-react-expert estão em `.agent/skills/nextjs-react-expert/` na filesystem.

#### Debug

**Palavras-chave:** bug, erro, exceção, crash, falha, quebrado, não funciona, 500, runtime error.

**Pipeline automático:**
```
context-manager.md
→ systematic-debugging/SKILL.md ⚠️ [ausente]
→ debug.md
→ test.md
```

#### Testes

**Palavras-chave:** teste, test, spec, jest, vitest, playwright, cobertura, TDD.

**Pipeline automático:**
```
context-manager.md
→ testing-patterns/SKILL.md ⚠️ [ausente]
→ systematic-debugging/SKILL.md ⚠️ [ausente]
→ lint-and-validate/SKILL.md ⚠️ [ausente]
```

#### Deploy

**Palavras-chave:** deploy, Vercel, Render, Supabase, produção, build, CI, CD, pipeline, release.

**Pipeline automático:**
```
context-manager.md
→ deployment-procedures/SKILL.md ✅ existe
→ lint-and-validate/SKILL.md ⚠️ [ausente]
→ testing-patterns/SKILL.md ⚠️ [ausente]
```

### 34.7 Quando chamar agentes/skills extras

O Master deve invocar agentes ou skills complementares automaticamente nestes cenários:

| Gatilho | Ação | Skills extras |
|---------|------|---------------|
| Tarefa classificada como CRITICAL | Chamar Architecture + Plan + Code Review + Security Testing | `architecture/trade-off-analysis.md`, `systematic-debugging/SKILL.md` ⚠️ |
| Risco classificado como CRITICAL_RISK | Chamar Security Testing + Systematic Debugging | `systematic-debugging/SKILL.md` ⚠️ |
| Regressão detectada (seção 28) | Chamar Systematic Debugging + Testing Patterns | `systematic-debugging/SKILL.md` ⚠️, `testing-patterns/SKILL.md` ⚠️ |
| Tarefa multi-tenant | Chamar Database Design + Schema Review | `database-design/schema-design.md`, `database-design/indexing.md` |
| Tarefa em produção | Chamar Deploy Procedures + Rollback Plan | `deployment-procedures/SKILL.md` |
| Primeira vez executando tipo de tarefa | Chamar Context Discovery + Architecture Review | `architecture/context-discovery.md`, `architecture/trade-off-analysis.md` |

### 34.8 Quando exigir validação final obrigatória

A validação final **nunca pode ser pulada**. Mas sua profundidade varia:

| Classificação | Profundidade da validação | O que validar |
|---------------|--------------------------|---------------|
| LOW | Validação rápida | Build passa? Lint ok? Testes unitários passam? |
| MEDIUM | Validação moderada | LOW + teste de função + smoke test + revisão de props |
| HIGH | Validação completa | MEDIUM + teste de integração + revisão de segurança + revisão company_id + teste multi-tenant |
| CRITICAL | Validação máxima | HIGH + revisão de arquitetura + teste de regressão + validação de deploy + rollback testado + autorização explícita |

**Gates obrigatórios para toda execução:**

```
Gate 1 — Contexto Reconstruído: memória carregada e contexto validado
Gate 2 — Risco Classificado: 14 fatores avaliados, criticidade definida
Gate 3 — Pipeline Montado: workflow selecionado conforme criticidade
Gate 4 — Safe To Implement: nenhum bloqueio de regressão ou segurança
Gate 5 — Final Validation: build, lint, testes, revisão, autorização
```

**Qualquer tarefa que falhe no Gate 4 ou Gate 5 deve ser bloqueada automaticamente** até resolução documentada.

### 34.9 Integração com runtime engines

A Seção 34 é a camada mestra que consolida e regula os engines runtime existentes:

| Engine runtime | Relação com Seção 34 |
|---------------|---------------------|
| `adaptive-intelligence-engine.md` | 34.1 fornece os 14 fatores de avaliação que o engine deve classificar |
| `priority-engine.md` | 34.2 define a matriz de criticidade que alimenta a prioridade |
| `risk-classification-engine.md` | 34.5 dita as regras de escalonamento automático de risco |
| `workflow-compression-engine.md` | 34.3 e 34.4 definem quando comprimir e quando NÃO comprimir |
| `contextual-automation-engine.md` | 34.6 expande a automação contextual com 7 domínios e pipelines |
| `dependency-resolver-engine.md` | 34.7 define gatilhos para skills extras conforme contexto |

**Ordem de execução integrada:**

```
1. Adaptive Intelligence Engine avalia 14 fatores (34.1)
2. Risk Classification Engine classifica risco (34.2)
3. Priority Engine define prioridade (34.2)
4. Contextual Automation Engine seleciona pipeline (34.6)
5. Dependency Resolver Engine resolve skills (34.7)
6. Workflow Compression Engine aplica compressão (34.3)
7. Runtime Decision Engine escolhe modo operacional
8. Dynamic Pipeline Builder monta pipeline final
9. Execution Intelligence Output gera relatório (seção 32)
10. Gates 1-5 validam antes da execução (34.8)
```

### 34.10 Tabela resumo — decisão rápida

Para classificação rápida de qualquer tarefa:

| Se a tarefa envolve... | Criticidade | Comprime? | Skills obrigatórias |
|------------------------|-------------|-----------|-------------------|
| segurança, auth, RBAC, PIN | CRITICAL | ❌ Nunca | architecture, plan, security-testing |
| multi-tenant, company_id | CRITICAL | ❌ Nunca | database-design, schema-design |
| migrations, banco, Supabase | CRITICAL | ❌ Nunca | database-design, migrations, indexing |
| pagamentos, caixa, comissões | CRITICAL | ❌ Nunca | plan, testing-patterns |
| agenda crítica, booking público | CRITICAL | ❌ Nunca | context-discovery, database-design |
| APIs, controllers, services | HIGH | ⚡ Brainstorm só | architecture, plan |
| dashboard financeiro | HIGH | ⚡ Brainstorm só | plan, testing-patterns |
| integrações externas | HIGH | ⚡ Brainstorm só | architecture, security-testing |
| UX importante, refatoração | MEDIUM | ⚡ Brainstorm | frontend-design, mobile-design |
| code splitting, performance | MEDIUM | ⚡ Brainstorm | nextjs-react-expert |
| textos, estilos, docs | LOW | ✅ Pode comprimir | — |

### 34.11 Regra Arquitetural Obrigatória de Frontend

**Aplica-se a toda operação de extração, code splitting, refatoração ou modularização de views/componentes frontend.**

#### Restrições arquiteturais

```
1. Nenhuma view pode:
   - importar outra view
   - importar o arquivo Barber.jsx (ou o componente pai original)
   - acessar backend diretamente (fetch, axios, supabase client)

2. Utils devem ser:
   - funções puras (sem side effects)
   - sem React (sem hooks, sem JSX)
   - sem estado (sem useState, useRef, etc.)

3. Proibido import circular entre:
   - views ↔ views
   - views ↔ Barber.jsx
   - components ↔ views
   - utils ↔ views (utils podem importar outras utils)
```

#### Validação obrigatória pós-extração

```
1. Rodar npm build (vite build)
2. Validar imports — nenhum caminho quebrado
3. Validar runtime — abrir cada view extraída e confirmar que renderiza
4. Validar renderização — nenhum componente undefined, exports nomeados vs default corretos
5. Validar rotas — todas as rotas que usam as views continuam funcionando
6. Validar lazy safety — React.lazy com suspense fallback para views extraídas
7. Validar que nenhum prop ficou faltando nas chamadas dos componentes extraídos
8. Validar que não existem imports circulares
```

#### Evitar barrel files gigantes

- Preferir imports diretos (`views/Dashboard.jsx`) em vez de re-exportar tudo via `index.js`
- Se barrel file for necessário, agrupar por domínio e manter < 5 exports

#### Se qualquer etapa quebrar

- ⛔ Parar imediatamente
- 🚨 Reportar o erro específico (arquivo, linha, mensagem)
- 🔙 Reverter a extração se necessário
- ❌ Não continuar para próximas extrações até resolução completa

**Responsabilidade:** O agente executor é responsável por rodar esta validação. O AI Governance Layer (seção 31) deve bloquear qualquer commit que pule esta regra.

**Gate 5 atualizado:** `Final Validation — build + lint + testes + revisão + autorização + validação arquitetural pós-extração (34.11)`

---

## Resumo — Dynamic Runtime Intelligence System

### Novas seções adicionadas (25-34)

| Seção | Nome | Função |
|-------|------|--------|
| 25 | Runtime Decision Engine | 18 fatores de decisão + 9 decisões automáticas |
| 26 | Dynamic Pipeline Builder | Montagem de pipelines runtime (não fixos) |
| 27 | Dependency Resolver Engine | Resolução automática de dependências entre skills |
| 28 | Regression Detection Engine | Detecção pré-implementação de 9 áreas de regressão |
| 29 | Autonomous Review Engine | 5 revisões autônomas (frontend, backend, Supabase, multi-tenant, deploy) |
| 30 | Self-Healing Recovery System | 10 sintomas detectáveis + protocolo 10-passos de auto-recuperação |
| 31 | AI Governance Layer | 9 prioridades absolutas + 9 proibições globais + 8 regras obrigatórias |
| 32 | Execution Intelligence Output | Template runtime completo com riscos, regressões, rollback |
| 33 | Runtime Learning Notes | 8 categorias de aprendizado pós-execução |
| 34 | Inteligência Adaptativa e Priorização Contextual | 14 fatores de avaliação, matriz de criticidade, compressão contextual, 7 domínios de automação, 6 gatilhos para skills extras, 5 gates de validação, regras arquiteturais de frontend (34.11) |

### Engines criados

| Engine | Seção | O que faz |
|--------|-------|-----------|
| Runtime Decision Engine | 25 | Decide workflow, profundidade, agentes, modo com base em 18 fatores |
| Dynamic Pipeline Builder | 26 | Constrói pipelines sob medida, não apenas seleciona templates |
| Dependency Resolver Engine | 27 | Resolve dependências automaticamente com proteção contra loops |
| Regression Detection Engine | 28 | Detecta risco de regressão em 9 áreas antes de implementar |
| Autonomous Review Engine | 29 | Revisa código automaticamente em 5 domínios |
| Self-Healing Recovery System | 30 | Detecta 10 sintomas e recupera automaticamente |
| AI Governance Layer | 31 | Regras máximas de governança global do ecossistema |
| Runtime Learning Notes | 33 | Registra aprendizado operacional para melhoria contínua |

### Modos operacionais

Não foram duplicados. A seção 22 (criada na Evolução Enterprise) permanece como fonte oficial dos 6 modos: SAFE, FAST, ENTERPRISE, DEBUG, CREATIVE, ARCHITECT.

### Proteções adicionadas

- ❌ Bloqueio de implementação insegura por regressão detectada (seção 28)
- ❌ Proibições globais: 9 regras que nenhum agente pode violar (seção 31)
- ❌ Nunca assumir "não há contexto" — auto-recuperação obrigatória (seção 30)
- ❌ Nunca inventar skills inexistentes (seção 31.2)
- ❌ Validação final nunca pode ser pulada (seção 34.8)
- ❌ Nunca usar LOW para banco, segurança, auth, RBAC, pagamentos ou multi-tenant (seção 34.4)
- ❌ Gate 4 ou Gate 5 bloqueiam automaticamente a execução (seção 34.8)
- ✅ Revisão autônoma obrigatória para CRITICAL_RISK (seção 29)
- ✅ Output runtime obrigatório antes de toda execução (seção 32)
- ✅ Classificação obrigatória em 14 fatores antes de qualquer execução (seção 34.1)
- ✅ Compressão de workflow adaptativa por criticidade (seção 34.3)
- ✅ Escalonamento automático de risco por 8 gatilhos (seção 34.5)
- ✅ Automação contextual em 7 domínios com pipelines dedicados (seção 34.6)
- ✅ Learning pós-execução para melhoria contínua (seção 33)

### Próximos passos recomendados

1. Criar as skills ausentes identificadas: `backend-seguro-multgestor/SKILL.md`, `frontend-barbergestor-ui/SKILL.md` (principais), mais `plan-writing/SKILL.md`, `systematic-debugging/SKILL.md`, `lint-and-validate/SKILL.md`, `testing-patterns/SKILL.md` (utilitárias). `database-design/migrations.md`, `database-design/indexing.md`, `database-design/optimization.md` já existem ✅
2. Automatizar o Self-Healing Recovery System como script executável
3. Integrar Runtime Learning Notes com `auto-memory-updater`
4. Criar testes para validar que os 9 engines e a seção 34 estão sendo respeitados
5. Considerar migração do MCP config.json com chave exposta para variável de ambiente
6. Criar skills ausentes referenciadas na seção 34: `plan-writing/SKILL.md`, `systematic-debugging/SKILL.md`, `lint-and-validate/SKILL.md`, `testing-patterns/SKILL.md`
7. Revisar periodicamente a matriz de criticidade (34.2) conforme novos domínios forem adicionados ao produto