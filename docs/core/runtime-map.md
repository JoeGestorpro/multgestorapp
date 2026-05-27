# Runtime Map — MultGestor Core

**Mapeamento oficial do comportamento em tempo de execução do MultGestor**  
**Versão:** 1.0.0  
**Data:** 2026-05-18  
**Status:** OFICIAL • VINCULANTE  
**Tipo:** Core Foundation — Runtime Architecture  

---

## Índice

1. [Objetivo do Documento](#1-objetivo-do-documento)
2. [Visão Geral do Runtime](#2-visão-geral-do-runtime)
3. [Source of Truth](#3-source-of-truth)
4. [Fluxo de uma Requisição Comum](#4-fluxo-de-uma-requisição-comum)
5. [Fluxo de Evento Futuro](#5-fluxo-de-evento-futuro)
6. [Fluxo de IA Futuro](#6-fluxo-de-ia-futuro)
7. [Fluxo MCP/OpenCode](#7-fluxo-mcp-opencode)
8. [Ambientes](#8-ambientes)
9. [Regras de Runtime](#9-regras-de-runtime)
10. [Riscos Atuais](#10-riscos-atuais)
11. [Runtime Alvo](#11-runtime-alvo)
12. [Checklist Antes de Novas Integrações](#12-checklist-antes-de-novas-integrações)

---

## 1. Objetivo do Documento

Este documento descreve **como o MultGestor funciona em tempo de execução**:

- quais serviços participam de cada operação
- como frontend, backend, banco, storage, deploy, MCPs e futuras integrações se conectam
- quais componentes são **source of truth**
- quais componentes **apenas executam ações** sem deter estado
- qual o fluxo de dados em cada cenário (requisição comum, evento, IA, MCP)

O runtime map é a base para:
- diagnosticar problemas de performance ou arquitetura
- planejar novas integrações sem violar o design do sistema
- onboardar novos desenvolvedores e agentes IA
- validar que cada componente está na camada correta

---

## 2. Visão Geral do Runtime

### 2.1 Diagrama de Fluxo Principal

```
Usuário (Browser / Mobile)
        │
        ▼
┌───────────────────┐    ┌──────────────────┐
│   React + Vite    │    │   Vercel CDN     │
│   Frontend SPA    │◄───│   (static build) │
│   BarberGestor    │    └──────────────────┘
│   Landing Pages   │
│   Dashboard       │
└────────┬──────────┘
         │  HTTPS / REST JSON
         ▼
┌───────────────────┐
│   Node.js/Express │
│   Backend API     │    ┌──────────────────┐
│   Port 3001       │    │   Render (cloud) │
│   JWT Auth        │    │   ou localhost   │
│   Middleware       │    └──────────────────┘
│   Routes          │
└────────┬──────────┘
         │
    ┌────┴────┬──────────┬───────────┐
    ▼         ▼          ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│Services│ │Feature │ │  Auth  │ │Middleware│
│(regras)│ │ Guards │ │ (JWT)  │ │(company) │
└───┬────┘ └────────┘ └────────┘ └──────────┘
    │
    ▼
┌────────────┐
│ Repository │   ← AINDA NÃO EXISTE (futuro)
│   Layer    │      Atualmente: queries diretas com pool
└──────┬─────┘
       │
       ▼
┌──────────────────┐
│  PostgreSQL 15+   │
│   Supabase        │
│  (source of truth)│
└──────────────────┘
```

### 2.2 Integrações Laterais

```
┌──────────────────────────────────────────────────────────────┐
│                     ECOSSISTEMA OPERACIONAL                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐    ┌──────────┐    ┌─────────────────────────┐ │
│  │ OpenCode │    │  GitHub  │    │     Supabase MCP        │ │
│  │ + MCPs   │───►│   MCP    │    │  (schema, migrations,   │ │
│  │ Engine   │    │ (código, │    │   RLS, queries, logs)   │ │
│  │          │    │  branch) │    └─────────────────────────┘ │
│  └──────────┘    └──────────┘                                │
│                                                               │
│  ┌──────────┐    ┌──────────────────┐    ┌────────────────┐  │
│  │  N8N     │───►│   Webhooks API   │◄───│   Event Bus    │  │
│  │(futuro)  │    │   MultGestor     │    │   (futuro)     │  │
│  └──────────┘    └──────────────────┘    └────────────────┘  │
│                                                               │
│  ┌──────────┐    ┌──────────────────┐    ┌────────────────┐  │
│  │WhatsApp  │───►│  Integration     │◄───│  Automation    │  │
│  │(futuro)  │    │  Layer (futuro)  │    │  Engine(futuro)│  │
│  └──────────┘    └──────────────────┘    └────────────────┘  │
│                                                               │
│  ┌──────────┐    ┌──────────────────┐                         │
│  │   IA     │───►│  AI Provider     │                         │
│  │(futuro)  │    │  Layer (futuro)  │                         │
│  └──────────┘    └──────────────────┘                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Stack em Runtime

| Componente | Tecnologia | Onde roda | Porta/DNS | Estado |
|------------|-----------|-----------|-----------|--------|
| Frontend | React 19 + Vite 8 | Browser + Vercel CDN | `multgestor.vercel.app` | ✅ Produção |
| Backend | Node.js + Express 5 | Render (ou local) | `:3001` | ✅ Produção |
| Banco | PostgreSQL 15+ | Supabase Cloud | via SSL | ✅ Produção |
| Storage | Supabase Storage | Supabase Cloud | via API | ✅ Produção |
| Email | Resend API | Cloud Resend | via HTTP | ✅ Produção |
| Auth | JWT (7 dias) | Backend + Supabase | via middleware | ✅ Produção |
| MCPs | OpenCode | Local (VS Code) | via stdio | ✅ Ativo |
| N8N | — | — | — | 🔮 Futuro |
| WhatsApp | — | — | — | 🔮 Futuro |
| IA Provider Layer | — | — | — | 🔮 Futuro |

---

## 3. Source of Truth

Cada componente do ecossistema tem um papel claro: **alguns são fonte da verdade, outros apenas executam ações**.

### 3.1 Matriz de Verdade

| Componente | É source of truth? | O que é verdade | O que NÃO é |
|------------|-------------------|-----------------|-------------|
| **PostgreSQL / Supabase** | ✅ **Sim** | Dados de negócio, usuários, empresas, agendamentos, vendas, financeiro | Regras de negócio, lógica de aplicação, templates |
| **Backend Express** | ✅ **Sim** | Regras de negócio, validação, autorização, fluxos | Dados persistentes, estado de UI |
| **MultGestor Core** | ✅ **Sim** | Arquitetura, contratos, decisões, capacidades | Dados voláteis, configuração de terceiros |
| **Frontend React** | ❌ **Não** | — | Regras de negócio, dados sensíveis, cálculos financeiros |
| **N8N** | ❌ **Nunca** | — | Estados críticos, dados que precisam de consistência |
| **WhatsApp** | ❌ **Não** | — | Regras de negócio, decisões que alteram estado |
| **IA** | ❌ **Nunca** | — | Decisões financeiras, alterações diretas em banco |
| **MCP (GitHub/Supabase)** | ❌ **Nunca** | — | Source of truth de dados de negócio |
| **OpenCode** | ❌ **Não** | — | Decisões de produção sem revisão |
| **Render/Vercel** | ❌ **Não** | — | Código de aplicação (só servem build) |
| **Resend** | ❌ **Não** | — | Templates críticos de email |

### 3.2 Hierarquia de Confiança

```
Nível 1 (máxima confiança)
├── PostgreSQL / Supabase
├── Backend Express
└── MultGestor Core

Nível 2 (confiança operacional)
├── OpenCode + MCPs (para desenvolvimento)
├── Render / Vercel (para deploy)
└── Resend (para email transacional)

Nível 3 (confiança limitada)
├── N8N (automações com validação no backend)
├── WhatsApp (canal de comunicação)
└── IA (inteligência assistida, nunca autônoma sem revisão)
```

### 3.3 Regra Fundamental

> **Nenhum componente de nível 2 ou 3 pode alterar estado no nível 1 sem passar pelo backend.**

Isso significa:
- N8N não altera banco direto — chama API do backend
- IA não acessa banco direto — consulta via API
- MCPs não fazem commit sem revisão — propõem alterações
- Frontend não executa regras de negócio — delega ao backend

---

## 4. Fluxo de uma Requisição Comum

### 4.1 Fluxo Padrão (Sincrono)

```
USUÁRIO                    FRONTEND                   BACKEND                      BANCO
  │                          │                          │                            │
  │  1. Acessa rota          │                          │                            │
  │─────────────────────────►│                          │                            │
  │                          │                          │                            │
  │                          │  2. GET /api/barber/     │                            │
  │                          │     services             │                            │
  │                          │─────────────────────────►│                            │
  │                          │                          │                            │
  │                          │                          │  3. Middleware Auth         │
  │                          │                          │     Verifica JWT           │
  │                          │                          │     Extrai user_id         │
  │                          │                          │                            │
  │                          │                          │  4. Middleware Company      │
  │                          │                          │     Resolve company_id     │
  │                          │                          │     Injeta no req          │
  │                          │                          │                            │
  │                          │                          │  5. Feature Guard          │
  │                          │                          │     Valida plano/recurso   │
  │                          │                          │                            │
  │                          │                          │  6. Router → Controller    │
  │                          │                          │     Chama service          │
  │                          │                          │                            │
  │                          │                          │  7. Service executa regra  │
  │                          │                          │     Valida dados           │
  │                          │                          │     Chama repository       │
  │                          │                          │                            │
  │                          │                          │  8. Repository (futuro)    │
  │                          │                          │     Monta query            │
  │                          │                          │     Adiciona company_id    │
  │                          │                          │───────────────────────────►│
  │                          │                          │                            │
  │                          │                          │  9. PostgreSQL             │
  │                          │                          │     Executa SELECT/INSERT  │
  │                          │                          │◄───────────────────────────┤
  │                          │                          │                            │
  │                          │                          │  10. Audit (parcial)       │
  │                          │                          │      Se ação relevante     │
  │                          │                          │                            │
  │                          │  11. Resposta JSON       │                            │
  │                          │◄─────────────────────────┤                            │
  │                          │                          │                            │
  │  12. Renderiza UI        │                          │                            │
  │◄─────────────────────────┤                          │                            │
```

### 4.2 Responsabilidades por Camada

| Etapa | Camada | O que acontece | Segurança |
|-------|--------|---------------|-----------|
| 1 | Frontend | Usuário interage com UI React | Nenhuma (público) |
| 2 | HTTP | Requisição com JWT no header | TLS |
| 3 | Middleware Auth | Verifica assinatura JWT, expiração | Crítica |
| 4 | Middleware Company | Injeta `company_id` no `req` | Crítica |
| 5 | Feature Guard | Verifica plano da empresa | Crítica |
| 6 | Router/Controller | Valida parâmetros, chama service | Média |
| 7 | Service | Executa regra de negócio | Alta |
| 8 | Repository | Monta query SQL com `company_id` | Crítica |
| 9 | PostgreSQL | Executa query, retorna dados | Máxima |
| 10 | Audit | Registra ação relevante | Média |
| 11 | HTTP | Retorna JSON | TLS |
| 12 | Frontend | Renderiza dados | Nenhuma |

### 4.3 Exemplo Real: Listar Serviços do BarberGestor

```
1. Frontend: Barber.jsx → GET /api/barber/services
2. Backend: router → barber.service.js → getAll(req)
3. Middleware: JWT válido, company_id = 42
4. Service: barberService.getAll(company_id = 42)
5. Query: SELECT * FROM barber_services WHERE company_id = 42
6. Response: [{ id: 1, name: "Corte", price: 50, ... }]
7. Frontend: renderiza tabela de serviços
```

### 4.4 Fluxo de Erro

```
Frontend chama API
    │
    ▼
Backend recebe requisição
    │
    ├── 401: JWT inválido/expirado → redirect login
    ├── 403: Sem permissão para o recurso
    ├── 404: Recurso não encontrado
    ├── 409: Conflito (ex: horário já agendado)
    ├── 422: Dados inválidos (ex: nome vazio)
    └── 500: Erro interno → log + retorno genérico
```

---

## 5. Fluxo de Evento Futuro

### 5.1 Visão Geral

Quando o Event Bus estiver implementado (C-04), o runtime ganhará uma dimensão assíncrona:

```
Ação no sistema (ex: agendamento confirmado)
    │
    ▼
┌──────────────────┐
│   Event Bus      │
│   (Outbox)       │
└────────┬─────────┘
         │
    ┌────┴────┬───────────┐
    ▼         ▼           ▼
┌────────┐ ┌────────┐ ┌──────────┐
│  N8N   │ │  Email │ │  WhatsApp│
│ Bridge │ │ Resend │ │  (futuro)│
└────┬───┘ └────────┘ └──────────┘
     │
     ▼
┌──────────────┐
│ N8N Workflow │
│ (se aplicável)│
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Callback Seguro   │
│ Webhook → Backend │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Backend valida    │
│ e atualiza banco  │
└──────────────────┘
```

### 5.2 Fluxo Completo: appointment.created

```
1. Usuário confirma agendamento no frontend
    │
2. Backend: barberService.confirmAppointment()
    │
3. Service: valida dados, insere no banco
    │
4. Event Bus: publica "appointment.created"
    │
    ├── 4a. Outbox: evento persistido no banco
    │
    ├── 4b. Consumer: Email Service
    │       └── Envia email de confirmação ao cliente
    │
    ├── 4c. Consumer: N8N Bridge
    │       └── Chama webhook do N8N
    │       └── N8N executa workflow (ex: enviar WhatsApp)
    │       └── N8N chama callback do backend
    │       └── Backend valida e registra envio
    │
    └── 4d. Consumer: CRM
            └── Atualiza último contato do cliente
```

### 5.3 Garantias do Event Bus (planejado)

| Garantia | Mecanismo |
|----------|-----------|
| **Entrega garantida** | Outbox pattern (evento persistido antes de publicado) |
| **Idempotência** | Cada evento tem ID único; consumidores devem tratar duplicatas |
| **Ordenação** | Sequential dentro de um aggregate; eventual entre consumidores |
| **Retry** | Backoff exponencial (3 tentativas, depois DLQ) |
| **Dead letter** | Eventos com falha vão para DLQ para análise manual |

### 5.4 Regras para Consumers

- Consumer nunca deve alterar banco direto — sempre via API do backend
- Consumer deve ser idempotente — processar o mesmo evento duas vezes não causa efeito colateral
- Consumer deve ter timeout — se não responder em 30s, evento vai para retry
- Consumer deve logar resultado — sucesso, falha, ou ignorado

---

## 6. Fluxo de IA Futuro

### 6.1 Visão Geral

A IA operacional (C-07) será uma camada plugável que interage com o Core exclusivamente via API:

```
Canal de Entrada (WhatsApp, Chat, Email)
    │
    ▼
┌──────────────────┐
│ Integration Layer│
│ (C-05)           │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Conversation     │
│ Center           │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ AI Provider Layer│
│ (C-07)           │
│                  │
│ OpenAI/Anthropic │
│ Model Router     │
│ Context Builder  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Intent           │
│ Classifier       │
│                  │
│ "agendar"        │
│ "consultar"      │
│ "cancelar"       │
│ "reclamar"       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Backend Valida   │
│ Ação             │
│                  │
│ - JWT válido?    │
│ - company_id?    │
│ - permissão?     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Service executa  │
│ regra de negócio │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Event Bus        │
│ registra ação    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Resposta volta   │
│ pelo canal       │
└──────────────────┘
```

### 6.2 Fluxo Completo: Cliente WhatsApp pergunta horários

```
1. Cliente envia "Quais horários disponíveis amanhã?" no WhatsApp
    │
2. Integration Layer recebe webhook da Meta API
    │
3. Conversation Center identifica empresa (pelo número do WhatsApp)
    │
4. AI Provider Layer envia mensagem + contexto para LLM
    │
5. IA classifica intenção: "consultar_horarios"
    │
6. Backend: GET /api/barber/appointments/available?date=...
    │   (autenticado via api_key da empresa, não JWT de usuário)
    │
7. Service consulta disponibilidade
    │
8. Repository: SELECT com company_id
    │
9. Resposta: ["08:00", "09:00", "10:00"]
    │
10. IA formata resposta natural: "Temos horários às 8h, 9h e 10h"
    │
11. WhatsApp Service envia mensagem
    │
12. Event Bus: "ai_query_completed" (para auditoria)
```

### 6.3 Regras de Segurança para IA

- IA nunca acessa banco direto (violaria source of truth)
- IA nunca executa comandos SQL
- IA nunca altera dados sem confirmação explícita
- Toda ação da IA é registrada em log de auditoria
- IA tem acesso apenas aos dados que a empresa autorizou
- Toda chamada da IA ao backend é autenticada e rate-limited

### 6.4 Modelo de Confiança

```
Ação da IA
    │
    ├── Consulta (leitura): ✅ Pode ser autônoma
    ├── Sugestão: ✅ Pode sugerir, precisa confirmação
    ├── Ação simples (ex: enviar lembrete): ✅ Pode executar
    ├── Ação crítica (ex: cancelar agendamento): ❌ Requer confirmação
    └── Ação financeira (ex: aplicar desconto): ❌ Requer aprovação
```

---

## 7. Fluxo MCP/OpenCode

### 7.1 Visão Geral

O fluxo MCP/OpenCode é o processo pelo qual a IA (via OpenCode) interage com o código, banco e infraestrutura do MultGestor.

```
Você (estratégia, decisão)
    │
    ▼
┌─────────────────────────────────────┐
│           ChatGPT / LLM             │
│  (planejamento estratégico,         │
│   análise, prompt inicial)          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│           OpenCode Engine           │
│   (Orquestrador Principal)          │
│                                     │
│   1. Master Orchestrator            │
│   2. Context Engineer               │
│   3. Adaptive Intelligence          │
│   4. Runtime Decision Engine        │
│   5. Smart Routing                  │
└──────┬──────────────┬───────────────┘
       │              │
       ▼              ▼
┌────────────┐  ┌────────────────┐
│ GitHub MCP │  │ Supabase MCP   │
│ (M-01)     │  │ (M-02)         │
│            │  │                │
│ • git log  │  │ • schema       │
│ • diff     │  │ • migrations   │
│ • branches │  │ • RLS          │
│ • PRs      │  │ • tables       │
│ • search   │  │ • queries      │
└────────────┘  └────────────────┘
       │              │
       └──────┬───────┘
              ▼
┌─────────────────────────────────────┐
│     Filesystem MCP + Terminal MCP   │
│     (M-04 + M-03)                   │
│                                     │
│     • ler/escrever código           │
│     • executar build/testes         │
│     • rodar migrations              │
│     • git commit                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│        Resultado para Revisão       │
│  (código alterado, PR criado,       │
│   schema validado, testes passando) │
└─────────────────────────────────────┘
```

### 7.2 Fluxo Completo: Implementar Nova Feature

```
1. Você: "Preciso de uma tela de relatório de comissões"
    │
2. OpenCode: Master Orchestrator ativa Context Engineer
    │   → Lê memória, git status, estado atual
    │
3. Adaptive Intelligence Engine classifica:
    │   Tipo: feature
    │   Risco: HIGH_RISK (backend + banco + frontend)
    │   Modo: ENTERPRISE_MODE
    │
4. Smart Routing escolhe pipeline:
    │   brainstorm → architecture/context-discovery → plan-writing
    │   → create → test
    │
5. GitHub MCP: consulta histórico, branches, busca código relacionado
    │
6. Supabase MCP: consulta schema real das tabelas de comissões
    │
7. Filesystem MCP: lê código existente de comissões
    │
8. Terminal MCP: executa build para verificar estado atual
    │
9. OpenCode propõe plano de implementação
    │
10. Você revisa e aprova
    │
11. OpenCode executa:
    │   Filesystem: altera backend (controller, service, routes)
    │   Filesystem: altera frontend (componentes, páginas)
    │   Terminal: npm run build
    │   GitHub: git commit + push
    │
12. Resultado: PR aberto, build passando, schema validado
```

### 7.3 O que MCPs NÃO Fazem

- MCPs não são source of truth de dados de negócio
- MCPs não executam código em produção
- MCPs não decidem arquitetura (orquestrador decide)
- MCPs não substituem revisão humana (todo código gerado é revisado)
- MCPs não acessam ambientes de produção sem autorização explícita

### 7.4 Limitações Conhecidas

| Limitação | Impacto | Mitigação |
|-----------|---------|-----------|
| GitHub MCP não enxerga código local | Só vê o que está no GitHub | Usar Filesystem MCP para código local |
| Supabase MCP não executa em staging | Só no projeto ativo | Usar branch de desenvolvimento no Supabase |
| Terminal MCP limitado a PowerShell 5.1 | Comandos Linux não funcionam | Adaptar scripts para Windows |
| MCPs não persistem estado entre sessões | Cada sessão começa do zero | Usar memória operacional (`.agent/memory/`) |

---

## 8. Ambientes

### 8.1 Matriz de Ambientes

| Aspecto | Local Development | Preview/Staging | Production |
|---------|-----------------|-----------------|------------|
| **Frontend** | `npm run dev` (localhost:5173) | Vercel Preview (auto-deploy) | Vercel Production |
| **Backend** | `node backend/server.js` (localhost:3001) | Render Preview (branch) | Render Production |
| **Banco** | Supabase Production (mesmo banco) | Supabase Branch (dev) | Supabase Production |
| **Storage** | Supabase Production | Supabase Branch | Supabase Production |
| **Email** | Resend (modo teste) | Resend (modo teste) | Resend (produção) |
| **MCPs** | OpenCode local | OpenCode local | OpenCode local (apenas emergência) |
| **N8N** | Local (se configurado) | — | Futuro |
| **Git** | Branch feature | Branch preview | `main` |

### 8.2 Local Development

**Responsabilidade:** Toda implementação, debug e teste acontece aqui.

**Stack:**
```
Frontend:  npm run dev     → http://localhost:5173
Backend:   node server.js  → http://localhost:3001
Banco:     Supabase remoto (produção ou dev branch)
MCPs:      OpenCode conectado ao workspace
```

**Regras:**
- Usar banco Supabase remoto (não há banco local)
- Criar branch feature antes de implementar
- Rodar `npm run build` antes de commit para validar
- Testar fluxos críticos manualmente

**Comandos essenciais:**
```powershell
# Backend
cd backend; node server.js

# Frontend
cd frontend; npm run dev

# Full stack
# Dois terminais ou npm-run-all
```

### 8.3 Preview/Staging

**Responsabilidade:** Validar deploy antes de produção.

**Stack:**
```
Frontend: Vercel Preview (auto-deploy a cada push em branch)
Backend:  Render Preview (se configurado)
Banco:    Supabase Branch (dev, schema isolado)
```

**Regras:**
- Toda branch dá deploy automático no Vercel (se configurado)
- Validar integração frontend + backend antes de merge
- Testar fluxos multi-tenant no ambiente preview
- Verificar se variáveis de ambiente estão corretas

### 8.4 Production

**Responsabilidade:** Servir usuários finais com segurança e performance.

**Stack:**
```
Frontend:  https://multgestor.vercel.app (Vercel)
Backend:   https://api.multgestor.com (Render)
Banco:     Supabase Production
Storage:   Supabase Storage
Email:     Resend Production
```

**Regras:**
- **Nunca** alterar direto em produção — sempre via PR + deploy
- **Nunca** rodar migration sem backup recente
- **Nunca** expor tokens, logs devem ser sanitizados
- **Sempre** verificar logs após deploy
- **Sempre** ter rollback planejado

**Acesso restrito:**
- Apenas o arquiteto principal pode fazer deploy em produção
- MCPs não alteram produção sem autorização explícita
- Operações destrutivas (DROP, TRUNCATE) são proibidas em produção

### 8.5 Fluxo de Deploy entre Ambientes

```
Local (branch feature)
    │
    ├── git push
    │       │
    │       ▼
    │   Vercel Preview (frontend)
    │   Render Preview (backend, se configurado)
    │   Supabase Branch (banco, se configurado)
    │
    ├── Testes passam? ──❌──→ Corrigir local
    │       │
    │       ✅
    │       ▼
    │   Pull Request → Code Review
    │       │
    │       ✅ Aprovado
    │       ▼
    ├── git merge main
    │       │
    │       ▼
    │   Vercel Production (auto-deploy)
    │   Render Production (auto-deploy)
    │   Supabase Migration (manual)
    │
    └── Pós-deploy
        └── Verificar logs
        └── Verificar health check
        └── Notificar equipe
```

---

## 9. Regras de Runtime

### 9.1 Regras de Camada

| # | Regra | Violação |
|---|-------|----------|
| R-RT-01 | Frontend nunca contém regra crítica de negócio | Regra de preço, cálculo financeiro, validação de segurança |
| R-RT-02 | N8N nunca altera banco direto | N8N só acessa banco via API do backend |
| R-RT-03 | IA nunca acessa banco direto | IA consulta dados via API, nunca via connection string |
| R-RT-04 | MCP nunca é source of truth | MCPs operam sobre cópia/leitura, nunca detêm estado oficial |
| R-RT-05 | Toda ação sensível passa pelo backend | Nenhum componente externo modifica estado sem passar pelo backend |

### 9.2 Regras de Dados

| # | Regra | Onde se aplica |
|---|-------|----------------|
| R-RT-06 | Toda query precisa respeitar `company_id` | Repository (futuro) ou service (atual) |
| R-RT-07 | Toda integração externa deve ter logs | Webhooks, webhooks out, chamadas de API |
| R-RT-08 | Auditoria obrigatória para ações críticas | Login, criação/edição/exclusão de dados sensíveis |
| R-RT-09 | Validação sempre no backend, nunca confiar no frontend | Frontend pode ser adulterado |

### 9.3 Regras de Deploy

| # | Regra | Exceção |
|---|-------|---------|
| R-RT-10 | Produção exige validação adicional | Deploy de emergência com documentação de motivo |
| R-RT-11 | Rollback planejado antes de qualquer alteração destrutiva | Nenhuma |
| R-RT-12 | Build frontend deve passar antes de commit | Nenhuma |

### 9.4 Regras de Integração Futura

| # | Regra | Quando aplicar |
|---|-------|---------------|
| R-RT-13 | N8N só recebe dados via webhook do backend | Antes de ativar N8N |
| R-RT-14 | WhatsApp nunca toma decisão sozinho | Antes de ativar WhatsApp |
| R-RT-15 | IA só age com validação do backend | Antes de ativar IA operacional |
| R-RT-16 | Event Bus obrigatório antes de qualquer automação externa | Antes de N8N, WhatsApp, IA |

### 9.5 Hierarquia de Regras

```
Regras de Segurança (P0)
├── R-RT-01, R-RT-02, R-RT-03, R-RT-04, R-RT-05
├── R-RT-09, R-RT-15
└── R-RT-16

Regras de Dados (P1)
├── R-RT-06, R-RT-07, R-RT-08
└── R-RT-13, R-RT-14

Regras de Deploy (P2)
├── R-RT-10, R-RT-11
└── R-RT-12
```

---

## 10. Riscos Atuais

### 10.1 Riscos Críticos (P0)

| # | Risco | Impacto | Causa | Mitigação |
|---|-------|---------|-------|-----------|
| RK-01 | **`barber.service.js` god class (~6500 linhas)** | Manutenção impossível, bugs frequentes, onboarding lento | Crescimento sem refatoração | Quebrar em serviços de domínio (Fase 2 roadmap) |
| RK-02 | **`Barber.jsx` monolítico (~4652 linhas)** | Mesmo problema do backend no frontend | Crescimento sem componentização | Extrair hooks e páginas (Fase 3 roadmap) |
| RK-03 | **Repository layer ausente** | SQL espalhado em services, banco não trocável, impossível testar | Nunca foi implementado | Implementar BaseRepository + Kysely (Fase 1 roadmap) |
| RK-04 | **Event bus ausente** | WhatsApp, N8N, IA bloqueados | Nunca foi implementado | Implementar Event Bus com Outbox (Fase 4 roadmap) |

### 10.2 Riscos Altos (P1)

| # | Risco | Impacto | Mitigação |
|---|-------|---------|-----------|
| RK-05 | **Multi-tenant manual** | Query sem `company_id` pode vazar dados entre empresas | Middleware automático + RLS no Supabase |
| RK-06 | **Validação duplicada** | `planFeatures.js` no frontend e no backend podem divergir | Centralizar em `@multgestor/shared` |
| RK-07 | **Error handling inconsistente** | 3 versões de `sendError` no backend | Error classes + middleware centralizado |
| RK-08 | **Zero testes automatizados** | Regressões não detectadas, deploy arriscado | Iniciar com testes unitários nos novos serviços |

### 10.3 Riscos Médios (P2)

| # | Risco | Impacto | Mitigação |
|---|-------|---------|-----------|
| RK-09 | **Sem logger estruturado** | Debug difícil, sem correlação entre eventos | Implementar Pino |
| RK-10 | **Timezone hardcoded** | Expansão para outros fusos bloqueada | Parametrizar timezone por empresa |
| RK-11 | **JWT sem refresh token** | Sessões irrevogáveis até expiração de 7 dias | Implementar refresh token |
| RK-12 | **Rate limiter in-memory** | Não escala horizontalmente | Migrar para Redis (futuro) |

### 10.4 Riscos de Integração Futura

| # | Risco | Impacto | Prevenção |
|---|-------|---------|-----------|
| RK-13 | **Acoplar N8N antes do Event Bus** | N8N vira dependência direta de services | Seguir roadmap: Event Bus → N8N Bridge |
| RK-14 | **Acoplar WhatsApp antes do Integration Layer** | Regras de negócio vazam para o canal | Seguir roadmap: Integration Layer → WhatsApp |
| RK-15 | **Acoplar IA antes da AI Operational Layer** | IA toca banco direto ou toma decisões sem validação | Seguir roadmap: AI Layer depois de Event Bus |

### 10.5 Mapa de Calor

```
RK-01 ■■■■■■■■■■ (crítico, agora)
RK-02 ■■■■■■■■■■ (crítico, agora)
RK-03 ■■■■■■■■■■ (crítico, agora)
RK-04 ■■■■■■■■■■ (crítico, agora)
RK-05 ■■■■■■■■■□ (alto, iminente)
RK-06 ■■■■■■■■□□ (alto)
RK-07 ■■■■■■■■□□ (alto)
RK-08 ■■■■■■■■□□ (alto)
RK-09 ■■■■■■□□□□ (médio)
RK-10 ■■■■■■□□□□ (médio)
RK-11 ■■■■■■□□□□ (médio)
RK-12 ■■■■■■□□□□ (médio)
RK-13 ■■■■■■□□□□ (médio, futuro)
RK-14 ■■■■■■□□□□ (médio, futuro)
RK-15 ■■■■■■□□□□ (médio, futuro)
```

---

## 11. Runtime Alvo

### 11.1 Arquitetura Futura

```
┌─────────────────────────────────────────────────────────────────┐
│                    MULTGESTOR CORE (Runtime Alvo)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     API GATEWAY                          │   │
│  │  (Rate limit, Auth, Tenant resolution, Logging)          │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────┴────────────────────────────────┐   │
│  │                  SHARED KERNEL                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │  Error   │ │  Zod     │ │  Logger  │ │  Utils   │  │   │
│  │  │ Classes  │ │ Schemas  │ │ (Pino)   │ │          │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────┴────────────────────────────────┐   │
│  │              DOMAIN MODULES (Bounded Contexts)           │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │  BarberGestor │  │  OdontoGestor│  │  ClimaGestor │  │   │
│  │  │  Domain       │  │  Domain      │  │  Domain      │  │   │
│  │  │  Services     │  │  Services    │  │  Services    │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │   │
│  │         │                 │                 │           │   │
│  │  ┌──────┴─────────────────┴─────────────────┴───────┐  │   │
│  │  │              REPOSITORY LAYER                     │  │   │
│  │  │  (Kysely, BaseRepository, company_id automático) │  │   │
│  │  └──────────────────────┬───────────────────────────┘  │   │
│  └─────────────────────────┼──────────────────────────────┘   │
│                            │                                   │
│  ┌─────────────────────────┴──────────────────────────────┐   │
│  │              PostgreSQL / Supabase                      │   │
│  │  (Source of truth, RLS, company_id isolation)           │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              EVENT BUS (Outbox Pattern)                   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │  Events  │ │  Outbox  │ │  Retry   │ │   DLQ    │  │   │
│  │  │  Registry│ │  Table   │ │  Queue   │ │          │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └──────────────────────┬─────────────────────────────────┘   │
│                         │                                      │
│  ┌──────────────────────┴─────────────────────────────────┐   │
│  │              INTEGRATION LAYER                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ WhatsApp │ │  Email   │ │Instagram │ │   SMS    │  │   │
│  │  │ Channel  │ │ Channel  │ │ Channel  │ │ Channel  │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └──────────────────────┬─────────────────────────────────┘   │
│                         │                                      │
│  ┌──────────────────────┴─────────────────────────────────┐   │
│  │              AUTOMATION ENGINE                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Triggers │ │Conditions│ │ Actions  │ │ N8N      │  │   │
│  │  │ Registry │ │ Engine   │ │ Registry │ │ Bridge   │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └──────────────────────┬─────────────────────────────────┘   │
│                         │                                      │
│  ┌──────────────────────┴─────────────────────────────────┐   │
│  │              AI OPERATIONAL LAYER                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │Assistant │ │Predictor │ │  Agents  │ │  Context │  │   │
│  │  │  Chat    │ │ (demanda)│ │(scheduler│ │  Builder │  │   │
│  │  │          │ │          │ │ marketer)│ │          │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Ordem de Implementação

```
Fase 1 — Shared Kernel + Repository (2 semanas)
├── Shared Kernel (Error, Zod, Logger)
├── Repository Pattern (BaseRepository, Kysely)
├── Error handling centralizado
└── Validação centralizada

**Plano detalhado:** [shared-kernel-implementation.md](../shared-kernel-implementation.md)

Fase 2 — Desacoplamento (2 semanas)
├── Quebrar barber.service.js em 12 domain services
├── Quebrar Barber.jsx em hooks + páginas
├── Centralizar planFeatures.js
└── Middleware automático de company_id

Fase 3 — Event Bus (2 semanas)
├── Event Bus com Outbox pattern
├── Eventos core: SaleCreated, AppointmentConfirmed, etc.
├── Migrar email para eventos assíncronos
└── Dead letter queue

Fase 4 — Integration + Automation (2 semanas)
├── Integration Layer (ChannelAdapter)
├── WhatsApp Cloud API
├── N8N Bridge
├── Automation Engine (Triggers, Conditions, Actions)
└── Pipeline de QA autônomo (Playwright MCP)

Fase 5 — AI + Omnichannel (4 semanas)
├── AI Operational Layer
├── Omnichannel Layer
├── AI Assistant
└── Analytics Layer
```

### 11.3 Runtime Alvo vs Runtime Atual

| Aspecto | Runtime Atual | Runtime Alvo |
|---------|--------------|--------------|
| **Arquitetura** | Monolito com acoplamento forte | Monolito modular com bounded contexts |
| **Acesso a banco** | SQL direto em services | Repository layer com Kysely |
| **Multi-tenant** | `WHERE company_id` manual | Middleware automático + RLS |
| **Comunicação assíncrona** | Inexistente | Event Bus com Outbox |
| **Integrações** | Email direto (Resend) | Integration Layer com canais plugáveis |
| **Automação** | Manual | Automation Engine + N8N |
| **IA** | Inexistente | AI Operational Layer plugável |
| **Testes** | Zero | Unitários + Integração + E2E |
| **Logs** | `console.log` | Pino estruturado |
| **Validação** | Ad-hoc | Zod centralizado |
| **Feature Guards** | Duplicado front+back | Centralizado em shared kernel |

---

## 12. Checklist Antes de Novas Integrações

### 12.1 Perguntas Obrigatórias

Toda nova integração (MCP, API externa, webhook, canal, automação, IA) deve responder **obrigatoriamente** a estas perguntas antes de ser implementada:

| # | Pergunta | Critério | Resposta |
|---|----------|----------|----------|
| 1 | **Essa integração passa pelo backend?** | Nenhum componente externo fala direto com banco | Sim / Não |
| 2 | **Tem `company_id`?** | Respeita isolamento multi-tenant | Sim / Não |
| 3 | **Tem logs?** | Toda operação é registrada | Sim / Não |
| 4 | **Tem callback seguro?** | Webhook de retorno validado pelo backend | Sim / Não |
| 5 | **Emite evento?** | Gera evento no Event Bus quando age | Sim / Não / Futuro |
| 6 | **Depende de N8N?** | Se sim, Event Bus precisa existir primeiro | Sim / Não |
| 7 | **Depende de IA?** | Se sim, AI Operational Layer precisa existir | Sim / Não |
| 8 | **Altera estado oficial?** | Se sim, passa pelo backend + Event Bus | Sim / Não |
| 9 | **Respeita source of truth?** | Não substitui banco ou backend como verdade | Sim / Não |
| 10 | **Está desacoplada?** | Pode ser removida sem impacto em outras integrações | Sim / Não |

### 12.2 Template de Resposta

```markdown
## Checklist de Integração — [Nome]

| Pergunta | Resposta | Observação |
|----------|----------|------------|
| Passa pelo backend? | sim | API pública do MultGestor |
| Tem company_id? | sim | Filtro obrigatório em toda query |
| Tem logs? | sim | Pino estruturado |
| Callback seguro? | sim | Webhook validado por JWT |
| Emite evento? | sim/futuro/não | — |
| Depende de N8N? | sim/não | — |
| Depende de IA? | sim/não | — |
| Altera estado oficial? | sim/não | — |
| Respeita source of truth? | sim | Banco continua como verdade |
| Desacoplada? | sim | Pode ser desativada sem impacto |

**Decisão:** ✅ Aprovada / ❌ Rejeitada / ⏳ Aguardando dependência

**Justificativa:**
<explicação da decisão>
```

### 12.3 Gatilhos de Rejeição

A integração é **automaticamente rejeitada** se:

- ❌ Altera banco direto (sem passar pelo backend)
- ❌ Não respeita `company_id`
- ❌ Depende de N8N mas Event Bus não existe
- ❌ Depende de IA mas AI Layer não existe
- ❌ Não tem plano de rollback
- ❌ Expõe tokens ou dados sensíveis
- ❌ Viola qualquer regra de runtime (seção 9)

### 12.4 Gatilhos de Aprovação Condicional

A integração é **aprovada condicionalmente** se:

- ⏳ Depende de capability futura → aguardar roadmap
- ⏳ Precisa de ajuste de segurança → aprovar após correção
- ⏳ Precisa de documentação → aprovar após docs criadas

---

## 13. Proteção Arquitetural — Runtime Layer

### 13.1 Riscos de Runtime por Aceleração de IA/Agentes

No estágio atual de evolução do MultGestor (transição para capability-driven core), os maiores riscos de runtime vêm da implementação acelerada por IA sem validação arquitetural:

| # | Risco | Manifestação em Runtime | Impacto |
|---|-------|------------------------|---------|
| PR-RT-01 | **IA implementando fora da ordem topológica** | Serviço consumindo evento de capability que ainda não existe | Runtime error em produção |
| PR-RT-02 | **Automação antes do Event Bus** | N8N chamando webhook de serviço que espera evento | Perda de dado, estado inconsistente |
| PR-RT-03 | **Capability duplicada em runtime** | Dois serviços com a mesma responsabilidade concorrendo | Comportamento imprevisível, race conditions |
| PR-RT-04 | **Middleware de tenant ignorado** | Query sem `company_id` por implementação rápida | Data leak entre empresas |
| PR-RT-05 | **Consumer sem idempotência** | Evento processado duas vezes por falta de validação | Dado duplicado, efeito colateral |

### 13.2 Regras de Proteção de Runtime

| # | Regra | Descrição | Gatilho |
|---|-------|-----------|---------|
| R-RT-17 | **Nenhum serviço pode consumir evento de capability que não existe** | Consumer registrado para evento de capability C-N que não está implementada | Runtime initialization check |
| R-RT-18 | **Nenhum middleware de runtime pode ser pulado por agente de IA** | IA não pode criar rota sem middleware de auth, company, feature guard | Code review obrigatório |
| R-RT-19 | **Nenhum serviço pode ser registrado sem passar pelo runtime initialization** | Service que não passa pelo bootstrap do Event Bus, logger, error handler | Server.start() validation |
| R-RT-20 | **Nenhuma implementação pode ignorar a topologia de dependências do runtime** | Serviço que depende de capability que não está no ar ao iniciar | Dependência verificada no startup |
| R-RT-21 | **Nenhum padrão de runtime paralelo pode coexistir** | Dois mecanismos de autenticação, dois formatos de resposta, duas estratégias de erro | Consolidação obrigatória |

### 13.3 Runtime Gate — Verificação de Startup

Antes de qualquer serviço iniciar em runtime, o sistema DEVE verificar:

- [ ] Todas as capabilities das quais este serviço depende estão active/ready?
- [ ] O Event Bus (se consumido) está operacional?
- [ ] O middleware de tenant está presente em toda rota multi-tenant?
- [ ] O logger está configurado?
- [ ] O error handler centralizado está ativo?
- [ ] Não há conflito de rotas com outros serviços?

### 13.4 Regra Anti-Atalho

> **Nenhuma implementação em runtime pode pular camadas da arquitetura oficial.**

Isso significa que em runtime:
- ❌ Nenhum service pode chamar banco direto sem passar pelo repository (quando implementado)
- ❌ Nenhum consumer pode processar evento sem passar pelo Event Bus
- ❌ Nenhuma rota pode existir sem middleware de autenticação
- ❌ Nenhuma query multi-tenant pode existir sem `company_id`
- ❌ Nenhum serviço externo pode ser chamado sem logging e tracing

---

## Apêndices

### A. Glossário de Runtime

| Termo | Definição |
|-------|-----------|
| **Source of Truth** | Componente que detém a verdade oficial sobre dados ou regras |
| **Runtime** | Comportamento do sistema em execução, incluindo fluxo de dados e interações |
| **Outbox Pattern** | Padrão de eventos onde o evento é persistido no banco antes de ser publicado |
| **DLQ** | Dead Letter Queue — fila de eventos que falharam após todas as tentativas |
| **Bounded Context** | Contexto delimitado de DDD com boundaries claras |
| **Feature Guard** | Mecanismo que libera/restringe features baseado no plano da empresa |
| **company_id** | Chave de isolamento multi-tenant |

### B. Comandos de Runtime

```powershell
# Verificar se backend está rodando
Get-Process -Name "node" -ErrorAction SilentlyContinue

# Verificar porta do backend
netstat -ano | Select-String ":3001"

# Verificar porta do frontend
netstat -ano | Select-String ":5173"

# Verificar ambiente
echo $env:NODE_ENV

# Logs do backend (se configurado)
Get-Content -Path "backend/logs/app.log" -Tail 50
```

### C. Health Check

```powershell
# Backend health
Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get

# Frontend health
Invoke-RestMethod -Uri "http://localhost:5173" -Method Get

# Supabase connection (via MCP)
# Supabase MCP: get_project ou execute_sql "SELECT 1"
```

### D. Referências

| Documento | Caminho |
|-----------|---------|
| MCP Governance | `docs/mcp-governance.md` |
| Architecture Decisions | `docs/architecture-decisions.md` |
| Capabilities Map | `docs/capabilities-map.md` |
| Lessons Learned | `docs/lessons-learned.md` |
| Core History | `docs/MULTGESTOR_CORE_HISTORY.md` |
| Master Orchestrator | `.agent/Joe-orchestrators/agents/master-orchestrator.md` |
| Stack | `.agent/context/stack.md` |
| Architecture | `.agent/context/architecture.md` |
| Roadmap | `.agent/context/roadmap.md` |
| MCP Config | `C:\Users\Joefe\.config\opencode\opencode.json` |

---

*Este documento é vinculante para todas as implementações, integrações e operações de runtime no MultGestor Core.*

*Nenhuma integração nova pode ser adicionada sem passar pelo checklist da seção 12.*

*Dúvidas de runtime devem ser resolvidas consultando o arquiteto de runtime ou o Master Orchestrator.*
