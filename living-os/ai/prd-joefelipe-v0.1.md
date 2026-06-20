# PRD — Agente JoeFelipe: Sistema Operacional Pessoal e Executivo do MultGestor

**Produto:** Agente JoeFelipe
**Versão do PRD:** 0.1
**Status:** Rascunho estratégico
**Data:** 2026-06-19
**Dono do produto:** Joe Felipe
**Contexto:** MultGestor / Living OS / Segundo Cérebro / automação operacional com IA

---

## 1. Visão do Produto

O Agente JoeFelipe deve evoluir de um painel read-only para um **sistema operacional pessoal, técnico e executivo**, capaz de entender o estado real do MultGestor, organizar prioridades, reduzir riscos, gerar planos, acionar ferramentas, supervisionar tarefas e ajudar o humano a tomar decisões melhores.

Ele não deve ser apenas um chatbot.

Ele deve se tornar uma camada viva de inteligência sobre o projeto, combinando:

* leitura do repositório;
* leitura do Living OS;
* leitura do Segundo Cérebro;
* leitura de riscos, decisões e fila;
* integração com LLMs;
* geração de prompts operacionais;
* auditoria de código e governança;
* sugestão de próxima melhor ação;
* monitoramento de produção;
* automações controladas;
* interface visual simples;
* modo seguro com autorização humana.

A visão final é transformar o Agente JoeFelipe no **copiloto executivo do MultGestor**, capaz de responder:

> "Onde estamos?"
> "O que falta para produção?"
> "Qual risco mais perigoso agora?"
> "Qual é a próxima melhor ação?"
> "O que posso pedir para Claude Code, OpenCode ou outro executor fazer?"
> "O que não deve ser feito ainda?"
> "O que está pronto para vender?"
> "O que está bloqueando receita?"
> "O que precisa de decisão humana?"

---

## 2. Problema

O MultGestor está ficando grande demais para ser controlado apenas por memória humana, chats soltos, arquivos espalhados e decisões manuais.

Hoje existem várias camadas importantes:

* código do sistema;
* backend;
* frontend;
* banco de dados;
* Supabase;
* Render;
* Vercel;
* backups;
* CI/CD;
* RLS;
* Redis;
* WhatsApp;
* event bus;
* roadmap;
* auditorias;
* Segundo Cérebro;
* Living OS;
* tarefas em fila;
* decisões pendentes;
* riscos ativos;
* agentes externos como Claude Code, OpenCode e Big Pickle.

O problema principal é que o humano precisa saber, a todo momento:

1. o que está pronto;
2. o que está pendente;
3. o que é perigoso;
4. o que gera receita;
5. o que precisa de commit;
6. o que precisa de autorização;
7. o que deve ser congelado;
8. o que deve ser executado agora.

Sem um agente central, o risco é o projeto virar uma coleção de partes boas, mas sem comando operacional único.

---

## 3. Objetivo do Produto

Criar um agente local, seguro e progressivo que funcione como o **centro de comando do MultGestor**.

O agente deve:

* ler o estado real do projeto;
* respeitar a governança existente;
* não inventar estado;
* não executar ações perigosas sozinho;
* propor planos;
* gerar prompts;
* resumir riscos;
* organizar decisões;
* ajudar a preparar commits;
* orientar a próxima missão;
* futuramente integrar LLMs reais;
* futuramente acionar ferramentas com permissão humana.

---

## 4. Estado Atual — V1

A V1 do Agente JoeFelipe já existe como agente local em modo **READ_ONLY**.

Capacidades atuais:

* painel HTML local;
* endpoint JSON `/api/state`;
* leitura de fontes do projeto;
* exibição de estado do projeto;
* exibição da missão atual;
* exibição da próxima missão;
* exibição da próxima melhor ação;
* exibição de riscos ativos;
* exibição de decisões pendentes;
* leitura do estado Git;
* geração de prompt recomendado;
* modo sem execução perigosa.

Limitação atual:

* não usa LLM real;
* não executa tarefas;
* não altera arquivos;
* não cria branch;
* não faz commit;
* não acessa produção;
* não envia notificações;
* não monitora serviços externos automaticamente;
* não possui memória operacional própria além das fontes lidas.

---

## 5. Princípios do Produto

### 5.1 Segurança em primeiro lugar

O agente nunca deve executar ações destrutivas sem autorização humana.

Ações sensíveis incluem:

* push;
* deploy;
* alteração de secrets;
* alteração de banco;
* alteração de RLS;
* upload real de backup;
* exclusão de arquivos;
* merge;
* alteração de produção;
* envio de mensagens reais para clientes;
* ativação de cobrança real.

### 5.2 Read-first, act-later

O agente deve primeiro ler, entender e explicar. Só depois, em versões futuras, poderá propor execução controlada.

### 5.3 Humano como comandante

O agente pode recomendar, priorizar, simular e preparar.
A decisão final continua sendo humana.

### 5.4 Living OS como autoridade

O Living OS deve ser a fonte executiva principal.
O Segundo Cérebro deve ser a memória oficial.
O código deve ser a fonte da verdade técnica.
O agente não deve criar fonte paralela.

### 5.5 Sem secrets no chat

O agente deve reforçar constantemente que tokens, senhas, keys e credenciais não devem ser colados em chats.

### 5.6 Auditável

Toda ação proposta ou executada futuramente deve deixar rastro claro:

* qual foi a intenção;
* qual arquivo foi lido;
* qual arquivo foi alterado;
* qual risco foi reduzido;
* qual decisão humana autorizou;
* qual foi o resultado.

---

## 6. Personas

### 6.1 Joe — Fundador / Operador / Dono do Produto

Precisa saber o que fazer agora, sem se perder em detalhes técnicos.

Necessidades:

* entender o estado do projeto;
* decidir prioridades;
* autorizar missões;
* saber o que está travando produção;
* saber o que falta para vender;
* transformar auditorias em ação.

### 6.2 Claude Code / Big Pickle — Auditor e Planejador

Precisa receber contexto bem estruturado para auditar, planejar e validar sem bagunçar o projeto.

Necessidades:

* prompt limpo;
* escopo definido;
* regras claras;
* arquivos relevantes;
* proibições explícitas;
* estado atual confiável.

### 6.3 OpenCode — Executor Técnico

Precisa receber tarefas pequenas, seguras e executáveis dentro do VS Code.

Necessidades:

* missão objetiva;
* arquivos permitidos;
* comandos permitidos;
* critérios de validação;
* limites de alteração.

### 6.4 Futuro Cliente do MultGestor

Indiretamente se beneficia porque o agente ajuda o produto a ficar mais estável, seguro, vendável e bem operado.

---

## 7. O que o Agente Pode se Tornar

O Agente JoeFelipe pode evoluir em 7 grandes estágios.

---

### Estágio 1 — Painel Vivo Read-Only

**Objetivo:** Mostrar o estado real do projeto sem alterar nada.

**Capacidades:**

* painel local;
* API `/api/state`;
* leitura de fontes oficiais;
* riscos ativos;
* decisões pendentes;
* próxima melhor ação;
* estado Git;
* prompt recomendado.

**Status:** Já iniciado na V1.

---

### Estágio 2 — Motor de Contexto e LLM Plugável

**Objetivo:** Adicionar uma camada de inteligência capaz de interpretar o estado do projeto e gerar respostas mais estratégicas.

**Capacidades:**

* interface `LlmProvider`;
* interface `LlmEngine`;
* provider mock;
* suporte futuro a OpenRouter;
* suporte futuro a OpenAI;
* suporte futuro a Anthropic;
* suporte futuro a modelo local;
* fallback seguro para mock;
* sem secrets no código;
* leitura de configuração por ambiente;
* resposta com plano, não execução direta.

**Resultado esperado:** O agente deixa de apenas mostrar dados e passa a explicar: por que algo é prioridade, qual missão reduz mais risco, quais arquivos revisar, qual prompt enviar para outro agente, quais decisões estão bloqueando produção.

---

### Estágio 3 — Gerador de Missões Operacionais

**Objetivo:** Transformar riscos e decisões em tarefas pequenas, seguras e executáveis.

**Capacidades:**

* gerar missão para Claude Code;
* gerar missão para OpenCode;
* gerar checklist de validação;
* gerar prompt de commit;
* gerar prompt de auditoria;
* gerar plano de rollback;
* classificar missão como `PLAN_ONLY`, `READ_ONLY`, `SAFE_WRITE`, `HUMAN_GATED` ou `DANGEROUS`.

---

### Estágio 4 — Supervisor de Governança

**Objetivo:** Garantir que o projeto não entre em estado bagunçado.

**Capacidades:**

* detectar arquivos modificados fora do escopo;
* alertar sobre `.obsidian` alterado;
* alertar sobre `archive/` não revisado;
* impedir sugestão de commit com secrets;
* verificar se a missão corresponde à fila;
* verificar se a branch está correta;
* verificar se existe plano antes da execução;
* comparar estado real com Living OS;
* detectar drift entre documentação e código.

**Resultado esperado:** O agente vira um guardião operacional.

---

### Estágio 5 — Orquestrador de Ferramentas

**Objetivo:** Permitir que o agente interaja com ferramentas externas de forma controlada.

**Ferramentas possíveis:** Git, VS Code, PowerShell, Supabase, Render, Vercel, GitHub, Backblaze B2, Obsidian, calendário, e-mail, WhatsApp mock e futuramente WhatsApp real.

**Regras:** O agente só deve executar ações em modos autorizados.
Modos possíveis: `READ_ONLY`, `PLAN_ONLY`, `SAFE_WRITE`, `HUMAN_APPROVAL_REQUIRED`, `EXECUTE_APPROVED`, `LOCKED`.

---

### Estágio 6 — Centro de Produção e Receita

**Objetivo:** Ajudar o MultGestor a sair de "sistema em desenvolvimento" para "produto vendável".

**Capacidades:**

* checklist de produção;
* checklist de vendável;
* score de risco;
* score de receita;
* análise de prontidão comercial;
* análise de prontidão técnica;
* acompanhamento de deploy, backups, testes e clientes piloto;
* detecção de gargalos de receita.

---

### Estágio 7 — Agente Executivo Autônomo com Permissão Humana

**Objetivo:** Permitir que o agente conduza ciclos operacionais completos, com aprovação humana nos pontos sensíveis.

**Fluxo ideal:**

1. Agente lê estado.
2. Agente identifica maior risco.
3. Agente propõe missão.
4. Humano aprova.
5. Agente prepara prompt.
6. Executor implementa.
7. Agente audita resultado.
8. Humano aprova commit.
9. Agente atualiza governança.
10. Agente promove próxima melhor ação.

---

## 8. Requisitos Funcionais

| ID | Requisito |
|---|---|
| RF-001 | Estado consolidado do projeto |
| RF-002 | Próxima melhor ação com justificativa |
| RF-003 | Riscos ativos por prioridade |
| RF-004 | Decisões humanas pendentes |
| RF-005 | Estado Git (branch, arquivos alterados, últimos commits) |
| RF-006 | Prompt recomendado para executor |
| RF-007 | Modos de segurança: `READ_ONLY`, `PLAN_ONLY`, `SAFE_WRITE`, `HUMAN_GATED` |
| RF-008 | Integração LLM plugável com fallback mock |
| RF-009 | Validação de escopo (alertar arquivos fora da missão) |
| RF-010 | Registro de decisões no Living OS |
| RF-011 | Relatório diário (estado, riscos, próximos passos, bloqueios, decisões) |
| RF-012 | Relatório de fechamento (mudanças, commits, pendências, próxima missão) |

---

## 9. Requisitos Não Funcionais

| ID | Requisito |
|---|---|
| RNF-001 | Local-first — funciona sem serviço externo obrigatório |
| RNF-002 | Seguro por padrão — comportamento padrão é read-only |
| RNF-003 | Sem secrets — nenhum secret salvo, impresso ou enviado |
| RNF-004 | Auditável — toda recomendação indica origem ou lógica |
| RNF-005 | Simples de rodar — comando único para iniciar |
| RNF-006 | Baixo custo — V1 funciona sem gastos recorrentes |
| RNF-007 | Extensível — arquitetura permite novos módulos |
| RNF-008 | Compatível com Windows + PowerShell |

---

## 10. Arquitetura Conceitual

O agente deve ser dividido em camadas:

### 10.1 Camada de Fontes

Responsável por ler Living OS, Segundo Cérebro, fila, riscos, decisões, Git, package.json, scripts, docs e estado de runtime.

### 10.2 Camada de Normalização

Transforma arquivos e estados em um modelo único: missão atual, próxima missão, riscos, decisões, status Git, score de prioridade, alertas.

### 10.3 Camada de Inteligência

Pode usar mock ou LLM real. Responsável por explicar, priorizar, resumir, gerar prompts, gerar planos e detectar inconsistências.

### 10.4 Camada de Segurança

Bloqueia ações perigosas. Responsável por classificar ações, exigir aprovação, bloquear secrets, impedir execução indevida e validar escopo.

### 10.5 Camada de Interface

Formas de interação: painel HTML, API JSON, terminal, markdown, futuramente chat local e notificações.

### 10.6 Camada de Execução Futura

Somente para versões futuras. Poderá executar comandos seguros, geração de arquivos, atualização de docs, abertura de checklist, preparação de commit — nunca ações sensíveis sem aprovação.

---

## 11. Roadmap Proposto

- **V1 — Painel Vivo Read-Only:** Status: iniciado. Painel local, API de estado, leitura de fontes, riscos, decisões, Git, prompt recomendado.
- **V2 — LLM Core Plugável:** Interfaces de LLM, mock provider, configuração por ambiente, fallback seguro.
- **V3 — Mission Builder:** Gerador de prompt para Claude Code/OpenCode, classificação de risco, checklist de aceite, plano de validação e rollback.
- **V4 — Governance Guard:** Alerta de arquivo fora do escopo, alerta de `.obsidian`, alerta de secrets, validação de fila vs ação.
- **V5 — Operations Copilot:** Health check backend/frontend, status backup/CI/deploy, resumo diário/semanal, alertas de risco.
- **V6 — Revenue Copilot:** Score de vendável/produção/receita, análise de cliente piloto, checklist comercial, priorização por vertical.
- **V7 — Controlled Execution Agent:** Execução controlada, aprovações humanas, logs, rollback, atualização de governança, ciclo completo.

---

## 12. Métricas de Sucesso

**Produto:** Menos tempo para entender estado, menos decisões esquecidas, menos risco operacional, mais clareza da próxima missão, mais velocidade para produção e receita.

**Técnica:** 100% das fontes críticas lidas, zero secrets impressos, zero ações perigosas sem aprovação, comandos simples, fallback seguro.

**Governança:** Living OS atualizado, Segundo Cérebro coerente, fila sem divergência, riscos classificados, decisões pendentes visíveis, auditorias conectadas ao roadmap.

---

## 13. Fora de Escopo Inicial

Não faz parte das primeiras versões: executar deploy automaticamente, alterar banco, mexer em secrets, fazer push/merge, enviar WhatsApp real, ativar cobrança real, substituir o humano nas decisões, substituir Claude Code/OpenCode, criar IA autônoma sem controle.

---

## 14. Riscos do Produto

- **R1 — Agente virar fonte paralela.** Mitigação: sempre apontar para Living OS, Segundo Cérebro e código como fontes oficiais.
- **R2 — Execução perigosa.** Mitigação: modo read-only por padrão e aprovação humana obrigatória.
- **R3 — LLM inventar estado.** Mitigação: LLM só responde com base em contexto carregado.
- **R4 — Complexidade excessiva.** Mitigação: evoluir por versões pequenas.
- **R5 — Secrets vazarem.** Mitigação: nunca ler ou imprimir secrets.

---

## 15. Decisões em Aberto

1. O agente será apenas local ou poderá ter versão web privada?
2. Qual LLM será usada primeiro em produção?
3. O agente poderá executar comandos ou apenas gerar prompts?
4. Qual será o primeiro modo além de read-only?
5. O agente terá memória própria ou só lerá fontes oficiais?
6. O agente deve ter integração com Obsidian?
7. O agente deve gerar relatórios automáticos diários?
8. O agente deve supervisionar backup, deploy e CI?
9. O agente será usado só no MultGestor ou também em outros projetos?
10. O agente poderá futuramente virar produto separado?

---

## 16. Critérios de Aceite da Próxima Evolução

A próxima evolução do Agente JoeFelipe deve ser considerada aceita quando:

* existir camada LLM plugável;
* existir provider mock seguro;
* nenhuma chave real for necessária;
* o agente continuar funcionando sem internet;
* o modo read-only continuar preservado;
* o agente conseguir gerar explicações da próxima melhor ação;
* o agente conseguir gerar prompt operacional com escopo;
* houver documentação em `living-os/ai/`;
* houver validação de que nenhuma ação perigosa é executada diretamente.

---

## 17. Resumo Executivo

O Agente JoeFelipe pode se tornar o **sistema operacional inteligente do MultGestor**.

Hoje ele já funciona como painel vivo read-only.

A evolução natural é:

1. painel vivo;
2. LLM plugável;
3. gerador de missões;
4. guardião de governança;
5. copiloto operacional;
6. copiloto de receita;
7. executor controlado com aprovação humana.

O objetivo não é criar uma IA solta.
O objetivo é criar um agente confiável, seguro e útil, que ajude Joe Felipe a comandar o MultGestor com clareza, velocidade e controle.
