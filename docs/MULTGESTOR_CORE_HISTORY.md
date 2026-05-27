# MULTGESTOR CORE HISTORY

**Linha do tempo oficial do MultGestor Core**  
**Versão:** 1.0.0  
**Data:** 2026-05-18  
**Status:** OFICIAL • VIVO  
**Tipo:** Core Foundation — Memória Histórica  

---

## Propósito deste documento

Este documento é a **memória histórica oficial** do MultGestor Core.  

Ele existe para que:
- OpenCode e agentes IA
- Futuros desenvolvedores e arquitetos
- IA operacional futura
- Stakeholders técnicos

entendam:
- **como** o sistema evoluiu
- **por que** decisões foram tomadas
- **quais problemas** já existiram e foram resolvidos
- **quais padrões** nunca devem retornar
- **qual a direção** do produto

---

## Cronologia resumida

```
2025.Q4  →  Início do projeto como SaaS nichado (BarberGestor)
2026.Q1  →  Crescimento acelerado, primeiros clientes
2026.Q2  →  Supabase + PostgreSQL, saída do SQLite
2026.Q2  →  Descoberta dos gargalos arquiteturais
2026.Q2  →  Nascimento do conceito MultGestor Core
2026.Q2  →  MCP Revolution + auditorias arquiteturais
2026.Q2  →  Decisão oficial: monolito modular + Event Bus + Repository
2026.Q2  →  Documentação da arquitetura oficial
2026.Q3+  →  Execução do roadmap de desacoplamento
```

---

## 1. Origem do Projeto

### 1.1 O início

O MultGestor nasceu como **BarberGestor** — um SaaS focado exclusivamente em barbearias.

A premissa era simples: um sistema de gestão para barbearias com:
- Agenda visual
- Controle de vendas
- Comissão de colaboradores
- Caixa diário
- Agendamento online público

O objetivo inicial era **funcionar rápido**. Não havia preocupação com:
- Múltiplos nichos
- Arquitetura multi-tenant complexa
- IA operacional
- Automações
- Omnichannel

### 1.2 O crescimento

O BarberGestor começou a crescer. Clientes pediam mais funcionalidades:
- Relatórios financeiros
- Controle de estoque
- CRM de clientes
- Landing pages personalizadas
- Integração com WhatsApp

Cada feature era adicionada **no mesmo lugar**: o `barber.controller.js` chamava o `barber.service.js` que consultava o banco via `pool.query()` direto. Não havia:

- Repository layer
- Event Bus
- Domínios separados
- Testes unitários
- Documentação de API
- TypeScript

### 1.3 O ponto de virada

Duas percepções mudaram o rumo do projeto:

1. **BarberGestor não poderia ser o único módulo.**  
   Clientes de clínicas, salões e consultórios queriam o mesmo sistema. Copiar o BarberGestor para cada nicho geraria uma explosão de manutenção.

2. **O código não suportaria IA, automações ou integrações.**  
   O `barber.service.js` com ~6.500 linhas era um monólito dentro do monólito. Toda automação exigiria modificar esse arquivo. Toda integração (WhatsApp, Instagram) também.

Surgiu o conceito do **MultGestor Core**: um core compartilhado que orquestra módulos verticais especializados por nicho.

---

## 2. Primeira Arquitetura

### 2.1 Stack inicial

```
Frontend: React + Vite (JavaScript, sem TypeScript)
Backend:  Node.js + Express (CommonJS)
Banco:    PostgreSQL via pg.Pool (sem ORM)
Auth:     JWT (7 dias, sem refresh)
Email:    Resend + SMTP fallback
Storage:  Supabase Storage
Deploy:   Vercel + Render
```

### 2.2 Estrutura de diretórios inicial

```
backend/
  src/
    controllers/      ← 5 controllers
    services/         ← 8 services (um com 6.500 linhas)
    routes/           ← 9 route files
    middleware/       ← 6 middlewares
    database/         ← 11 SQL files de migration
    config/           ← database.js, supabase.js
    providers/email/  ← Resend + SMTP + Mock

frontend/
  src/
    pages/            ← Barber.jsx com 4.652 linhas
    components/       ← dezenas de componentes
    services/         ← api.js (axios)
    contexts/         ← Auth, Theme, Booking
    hooks/            ← useTenantTheme
```

### 2.3 O problema: fazer funcionar vs fazer escalar

A pressão por entregar features rapidamente gerou:

| Problema | Onde | Tamanho |
|----------|------|---------|
| God class | `barber.service.js` | ~6.500 linhas |
| Mega-componente | `Barber.jsx` | ~4.652 linhas |
| SQL inline | Todos os services | Nenhum repository |
| Código duplicado | `sendError` em 3 controllers | Mesmo padrão em 3 lugares |
| Validação ad-hoc | Todos os endpoints | Regex soltas, sem Zod/Joi |
| Zero testes | Frontend + backend | Apenas 2 testes de integração |

### 2.4 Lição da primeira arquitetura

> **Rapidez inicial gera dívida arquitetural.**  
> A dívida não é um problema se você sabe que existe e tem um plano para pagá-la.  
> O problema é quando você **acha** que a arquitetura está boa.

---

## 3. Migração para PostgreSQL / Supabase

### 3.1 Contexto

O projeto originalmente usava SQLite como banco de dados. A migração para PostgreSQL gerenciado (Supabase) foi necessária por:

- **Concorrência**: SQLite não lida bem com múltiplos acessos simultâneos
- **Multi-tenant**: Isolamento de dados entre empresas exigia um banco robusto
- **Storage**: Supabase Storage integrado para upload de logos, banners e galeria
- **Gerenciamento**: Supabase oferecia backup, SSL e interface administrativa

### 3.2 Problemas encontrados na migração

| Problema | Impacto | Solução |
|----------|---------|---------|
| Queries SQL incompatíveis | SQLite ≠ PostgreSQL em funções de data/string | Reescrita de queries |
| Pool de conexão | SQLite é single-thread, PostgreSQL exige pool | Implementação de `pg.Pool` |
| SSL obrigatório | Supabase exige conexão SSL `rejectUnauthorized: false` | Configuração de SSL no pool |
| UUID vs auto-increment | SQLite usa `INTEGER PRIMARY KEY`, PostgreSQL usa UUID | Migração para `gen_random_uuid()` |
| Migrations manuais | Sem sistema automatizado de migrations | Script SQL sequencial `run-migrations.js` |

### 3.3 O que a migração revelou

A migração expôs fragilidades:

- **Acoplamento com banco**: Toda query SQL era específica do SQLite. A migração exigiu reescrever queries em todos os services.
- **Falta de abstração**: Sem repository layer, cada service precisava ser modificado individualmente.
- **Testes impossíveis**: Testar a migração exigia ambiente real de banco.

### 3.4 company_id como padrão multi-tenant

Durante a migração, definiu-se:

> **`company_id` é a chave oficial de isolamento multi-tenant.**  
> `owner_id` nunca é usado para isolar dados.  
> Uma empresa pode ter múltiplos owners. Isolar por `owner_id` vazaria dados.

Toda tabela tenant ganhou:
- Coluna `company_id` (UUID, FK → companies.id)
- `ON DELETE CASCADE` (deletar empresa = deletar todos os dados)
- Queries sempre filtradas por `WHERE company_id = $1`

### 3.5 Melhorias estruturais pós-migração

- **35+ tabelas** com UUID como PK
- **95+ índices** otimizados para queries comuns
- **Check constraints** para integridade de dados (preços >= 0, status válidos, etc.)
- **Partial indexes** para soft deletes (`WHERE is_deleted = false`)
- **JSONB** para dados flexíveis (metadata, gallery, diffs)
- **Views** (ex: `appointments` como view sobre `barber_appointments`)

---

## 4. Descoberta do Problema de Escalabilidade

### 4.1 O diagnóstico

Em Maio de 2026, uma auditoria arquitetural completa revelou problemas estruturais graves.

#### 4.1.1 God classes

| Arquivo | Linhas | Responsabilidades |
|---------|--------|-------------------|
| `barber.service.js` | ~6.500 | 12+ domínios misturados |
| `Barber.jsx` | ~4.652 | 80+ estados, 50+ handlers |
| `barber.controller.js` | ~1.488 | 70 métodos |

#### 4.1.2 Acoplamento excessivo

```
Controllers → Services → pool.query() (sem abstração)
              ↓
          Nenhum Repository
              ↓
          Nenhum Event Bus
              ↓
          Nenhuma Interface/Contract
              ↓
          Zero Dependency Injection
```

#### 4.1.3 Ausência de camadas críticas

| Camada | Status | Impacto |
|--------|--------|---------|
| Repository | ❌ Inexistente | SQL em todo lugar, banco não pode ser trocado |
| Event Bus | ❌ Inexistente | Tudo síncrono, sem hooks para automações |
| Validation | ❌ Ad-hoc | Regex duplicadas, sem schemas centralizados |
| Error handling | ❌ Duplicado | 3 versões de `sendError()`, 8 de `createError()` |
| Logger | ❌ `console.error()` | Sem logs estruturados, sem correlação |
| Dependency Injection | ❌ `require()` direto | Impossível mockar para testes |
| TypeScript | ❌ 0% do código | Sem segurança de tipos |

#### 4.1.4 Duplicação massiva

```
sendError()          → 3 controllers (implementações diferentes)
createError()        → 8 services
normalizeEmail()     → 5 services
columnExists()       → 5 services
tableExists()        → 2 services
Schema introspection → 5 services (cada um com getXQueryConfig próprio)
planFeatures.js      → Backend + Frontend (cópias independentes)
Constants            → Barber.jsx + features/barber/utils/constants.js
Formatters           → Barber.jsx + features/barber/utils/formatters.js
viewMeta             → Barber.jsx + features/barber/utils/viewMeta.js
```

### 4.2 Impacto para IA e automações

#### IA não consegue operar num sistema assim porque:

- **Sem eventos**: IA não sabe o que aconteceu no sistema
- **Sem domínios claros**: IA não distingue fronteiras de responsabilidade
- **Sem boundaries**: IA não sabe o que pode e não pode fazer
- **Sem logs estruturados**: IA não tem dados históricos
- **Sem API contracts**: IA não tem contratos claros de entrada/saída
- **Contexto estoura**: Código de 6.500 linhas não cabe no contexto de nenhum LLM

#### Automações não funcionam porque:

- **Sem Event Bus**: Toda automação precisaria modificar services existentes
- **Webhooks processam inline**: Sem fila, sem retry, sem idempotência
- **N8N não tem hooks**: Não há eventos para N8N se conectar
- **Tudo é síncrono**: Uma automação lenta bloquearia a request do usuário

### 4.3 Impacto para multi-nicho

Criar um segundo nicho (OdontoGestor, ClimaGestor) exigiria:

- Copiar `barber.service.js` → ~6.500 linhas
- Copiar `barber.controller.js` → ~1.488 linhas
- Copiar `Barber.jsx` → ~4.652 linhas
- Criar tabelas `odonto_*` ou `clima_*`
- Duplicar todas as validações, regras e fluxos
- **Manter tudo em sync** quando algo mudasse no core

**Conclusão: sem core compartilhado, MultiGestor é inviável.**

---

## 5. Nascimento do Conceito de CAPABILITIES

### 5.1 A mudança de pensamento

Antes da auditoria, o pensamento era:

```
"vamos criar WhatsApp"
"vamos criar IA"
"vamos criar automações"
"vamos criar omnichannel"
```

Cada um seria um projeto isolado, integrado diretamente nos services existentes.

Depois da auditoria, o pensamento mudou para:

```
"vamos criar Integration Layer"     ← canal genérico
"vamos criar AI Operational Layer"  ← IA plugável
"vamos criar Automation Engine"     ← workflow engine
"vamos criar Omnichannel Layer"     ← inbox unificada
```

### 5.2 O que é uma Capability

**Capability** é um bloco de infraestrutura compartilhada que **qualquer módulo** pode usar.

```
┌──────────────────────────────────────────────────────────────┐
│                     MULTGESTOR CORE                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Multi-  │  │  Event   │  │Integra-  │  │Automation│    │
│  │  Tenant  │  │   Bus    │  │  tion    │  │  Engine  │    │
│  │  Engine  │  │          │  │  Layer   │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │    AI    │  │Omnichan- │  │   N8N    │                   │
│  │Operatio- │  │   nel    │  │   Inte-  │                   │
│  │nal Layer │  │  Layer   │  │  gration │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
         ▲           ▲           ▲           ▲
         │           │           │           │
┌────────┴───────────┴───────────┴───────────┴────────────────┐
│                    MÓDULOS VERTICAIS                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ BarberGestor │  │ OdontoGestor │  │ ClimaGestor  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 Capabilities definidas

| Capability | Função | Prioridade |
|------------|--------|-----------|
| **Multi-Tenant Engine** | Companies, Users, Modules, Plans, Subscriptions, Billing | Core |
| **Event Bus** | Comunicação assíncrona entre domínios | Essencial |
| **Integration Layer** | Adaptadores de canal (WhatsApp, Instagram, Email, SMS) | Essencial |
| **Automation Engine** | Triggers, conditions, actions, workflows | Essencial |
| **AI Operational Layer** | Assistente, predições, agentes autônomos | Estratégico |
| **Omnichannel Layer** | Inbox unificada, campanhas multicanal | Estratégico |
| **N8N Integration** | Orquestrador externo (nunca source of truth) | Tático |

### 5.4 O que muda na prática

**Antes:**
```javascript
// barber.service.js — WhatsApp integrado diretamente
async function createSale(data) {
  const sale = await pool.query(`INSERT INTO barber_sales ...`);
  await sendWhatsApp(sale.customer_phone, "Venda criada!");
  return sale;
}
```

**Depois:**
```javascript
// sales.service.js — emite evento, não sabe de WhatsApp
async function createSale(data) {
  const sale = await salesRepository.create(data);
  eventBus.emit("SaleCreated", { saleId: sale.id, companyId: sale.company_id });
  return sale;
}

// whatsapp.integration.js — reage ao evento
eventBus.on("SaleCreated", async (event) => {
  const sale = await salesRepository.findById(event.saleId);
  await whatsappChannel.send(sale.customerPhone, "Venda criada!");
});
```

---

## 6. MCP Revolution

### 6.1 O que mudou

A introdução dos MCPs (Model Context Protocol) no OpenCode transformou a forma como o MultGestor é desenvolvido.

| Antes | Depois |
|-------|--------|
| IA trabalhava com contexto parcial fornecido pelo usuário | IA lê código real do projeto via Filesystem MCP |
| Decisões baseadas em suposição do que o código fazia | Decisões baseadas em análise real do código |
| Auditoria manual e inconsistente | Auditoria automatizada via GitHub MCP |
| Schema do banco descrito em texto (desatualizado) | Schema validado via Supabase MCP |
| Erros ignorados até quebrar em produção | Erros detectados por diagnóstico contínuo |
| Versão do código desconhecida | Histórico completo via GitHub MCP |

### 6.2 GitHub MCP — Capability Core Foundation

O GitHub MCP foi registrado como capability oficial do Core Foundation.

**Responsabilidades:**
- Verificar commits recentes
- Analisar histórico do repositório
- Revisar branches e PRs
- Comparar versões do código
- Investigar regressões
- Rastrear mudanças arquiteturais
- Sincronizar contexto operacional do projeto

**Limites (o que NÃO faz):**
- Não substitui leitura do workspace local
- Não edita código diretamente
- Não substitui Terminal MCP (execução)
- Não substitui Supabase MCP (schema/banco)

### 6.3 Erro real descoberto pelo GitHub MCP

O arquivo `opencode.json` estava configurado com o pacote `@github/github-mcp-server`, que **não existe no npm** (404).

**Sintoma:**
```
MCP error -32000: Connection closed local mcp startup failed
github FAILED
supabase connected
```

**Causa:** Nome do pacote incorreto. O correto é `@modelcontextprotocol/server-github`.

**Solução:**
```json
{
  "command": ["npx", "-y", "@modelcontextprotocol/server-github"]
}
```

**Lição:** Sempre validar nomes de pacotes npm. Erro `-32000` pode ser apenas configuração errada.

### 6.4 Supabase MCP — Validação de Schema

O Supabase MCP permitiu:
- Listar todas as tabelas, colunas, índices e constraints
- Validar RLS (Row-Level Security)
- Revisar migrations aplicadas
- Analisar performance de queries
- Verificar estrutura multi-tenant

### 6.5 OpenCode como engenheiro principal

O OpenCode (v1.15.4) opera com 5 MCPs:

```
1. Filesystem/Workspace MCP  → código local
2. GitHub MCP                → histórico/versões
3. Supabase MCP              → schema/banco
4. Terminal MCP              → execução/comandos
5. Playwright MCP            → UX/frontend (futuro)
```

Cada MCP tem responsabilidade definida. Nenhum substitui o outro.

### 6.6 Impacto nos agentes IA

A estrutura de agentes foi organizada em:

```
.agent/
├── context/          ← Fonte de verdade compartilhada
├── memory/           ← Estado do projeto
│   ├── features/     ← Features específicas
│   └── modules/      ← Memória por módulo/nicho
├── system/           ← Engines operacionais de IA
├── marketing/        ← Ecossistema de marketing
├── skills/           ← Habilidades dos agentes
├── Joe-orchestrators/ ← Orquestradores mestres
└── agents/           ← Definições de agentes
```

---

## 7. Decisão Oficial de Arquitetura

### 7.1 As 12 decisões

Em 18 de Maio de 2026, as seguintes decisões arquiteturais foram oficializadas no documento `docs/architecture-decisions.md`:

| # | Decisão | Tipo |
|---|---------|------|
| 1 | **Monolito modular, não microservices** | Estrutural |
| 2 | **Domain-Driven Design parcial** | Estrutural |
| 3 | **Core/Shared Kernel antes de novas features** | Prioridade |
| 4 | **Repository Pattern obrigatório** | Técnica |
| 5 | **Event Bus obrigatório antes de N8N/WhatsApp/IA** | Dependência |
| 6 | **TypeScript gradual, backend primeiro** | Evolução |
| 7 | **Zod para validação centralizada** | Técnica |
| 8 | **company_id como chave multi-tenant oficial** | Segurança |
| 9 | **IA como camada plugável, nunca como core** | Arquitetural |
| 10 | **N8N como orquestrador externo, nunca source of truth** | Integração |
| 11 | **WhatsApp como canal, não como sistema** | Integração |
| 12 | **Multi-tenant automático (não manual)** | Evolução |

### 7.2 As 9 regras proibidas

| Regra | Descrição |
|-------|-----------|
| P1 | Nunca criar novo nicho copiando `barber.service.js` |
| P2 | Nunca adicionar WhatsApp antes do Event Bus |
| P3 | Nunca adicionar IA operacional antes de domínios claros |
| P4 | Nunca colocar lógica crítica no frontend |
| P5 | Nunca deixar N8N alterar banco direto |
| P6 | Nunca deixar IA acessar banco direto |
| P7 | Nunca criar automações sem eventos |
| P8 | Nunca usar `owner_id` para multi-tenant |
| P9 | Nunca expor tokens no frontend |

### 7.3 Os 10 padrões proibidos

| Padrão | Por quê |
|--------|---------|
| God class (arquivos > 1.000 linhas) | Impossível manter, testar ou evoluir |
| Código duplicado | Cada duplicação dobra custo de manutenção |
| SQL solto em services | Trocar banco = reescrever tudo |
| Mega-componente React | 80 estados, 50 handlers, ninguém entende |
| Concatenação de string para SQL | Risco de SQL injection |
| Timezone hardcoded | Quebra expansão multi-região |
| Prop drilling excessivo | Acoplamento frontend-backend |
| Validação ad-hoc com regex | Inconsistente e frágil |
| `window.prompt()` para input | Sem validação, sem UX, sem acessibilidade |
| Cópia de nicho | Duplica bugs, dívida e complexidade |

---

## 8. Roadmap Oficial do Core

### Fase 1 — Shared Kernel (Semanas 1-3)

**Entrega:** Fundação compartilhada para todos os módulos

- Extrair Error classes, BaseRepository, Validation utils
- Implementar Repository Pattern para entidade piloto
- Zod schemas para endpoints críticos
- Central error handling middleware
- Logger estruturado (Pino)
- Criar `@multgestor/core` (npm workspace)

### Fase 2 — Repository + Desacoplamento (Semanas 4-6)

**Entrega:** Services independentes, queries abstraídas

- Quebrar `barber.service.js` em ~12 domain services
- Quebrar `barber.controller.js` em controllers por domínio
- Migrar queries para Repository Pattern
- Extrair `Barber.jsx` em hooks customizados e views independentes
- Dependency Injection container

### Fase 3 — Event Bus (Semanas 7-8)

**Entrega:** Comunicação assíncrona entre domínios

- EventEmitter + persistência em banco (Outbox pattern)
- Eventos: SaleCreated, AppointmentConfirmed, CollaboratorAdded, CompanyPlanChanged
- Migrar webhooks (Kiwify) para eventos
- Migrar envio de email para eventos assíncronos
- Multi-tenant middleware automático

### Fase 4 — Integration Layer (Semanas 9-10)

**Entrega:** Abstraction de canais de comunicação

- ChannelAdapter interface (send, receive, status)
- WhatsApp Cloud API como primeiro canal
- Templates de mensagens
- Fila de envio com retry
- Webhook receiver unificado

### Fase 5 — Automation Engine (Semanas 11-12)

**Entrega:** Motor de automação baseado em eventos

- Trigger registry: "quando evento X acontecer"
- Condition engine: "se Y for verdadeiro"
- Action registry: "executar Z"
- Templates de automação por nicho
- Integração com N8N

### Fase 6 — Omnichannel (Semanas 13-14)

**Entrega:** Inbox unificada multicanal

- Inbox multi-canal (WhatsApp, Instagram, Email)
- CRM conversacional
- Histórico omnichannel por cliente
- Campanhas multicanal

### Fase 7 — AI Operational Layer (Semanas 15-18)

**Entrega:** IA operacional plugável

- Assistente conversacional com contexto do sistema
- Predições de demanda, churn e receita
- Agentes autônomos (scheduler, marketer, analyst)
- AI context layer

### Fase 8 — Novos Nichos (Semanas 19+)

**Entrega:** Expansão vertical

- OdontoGestor
- ClimaGestor
- Outros nichos sob demanda

---

## 9. Regras Que Nunca Devem Ser Quebradas

### 🔴 Definitivas

Estas regras são **absolutas**. Qualquer violação intencional é considerada falha arquitetural crítica.

| # | Regra | Razão |
|---|-------|-------|
| 1 | **Nunca copiar nichos inteiros** | Core compartilhado é o que torna o MultiGestor viável. Copiar nichos = dívida exponencial |
| 2 | **Nunca criar novo `barber.service.js` gigante** | Todo service deve ter no máximo 1.000 linhas. Acima disso, quebrar |
| 3 | **Nunca deixar IA acessar banco direto** | IA acessa dados via API. IA nunca tem connection string |
| 4 | **Nunca deixar automação ser source of truth** | N8N e afins são orquestradores. Backend é a verdade oficial |
| 5 | **Nunca quebrar multi-tenant** | Toda query tenant deve ter `company_id`. RLS no futuro |
| 6 | **Nunca remover `company_id`** | Nem pensar. É a única garantia de isolamento entre empresas |
| 7 | **Nunca criar integração sem Event Bus** | Toda integração deve reagir a eventos, não modificar services |
| 8 | **Nunca criar IA sem boundaries claros** | IA sem domínios definidos toma decisões com contexto errado |
| 9 | **Nunca colocar regra crítica no frontend** | Frontend é descartável. Backend é a única fonte de verdade |
| 10 | **Nunca pular fases do roadmap** | A ordem existe por um motivo. Pular fases gera dívida técnica |

---

## 10. Visão Futura do MultGestor

### 10.1 O que o MultGestor será

O MultGestor não é apenas um SaaS. É um **sistema operacional inteligente multi-nicho**.

```
MULTGESTOR CORE
│
├── ORIENTADO A EVENTOS
│   ├── Toda ação relevante emite um evento
│   ├── Sistemas reagem a eventos, não a comandos
│   └── Event Bus com Outbox pattern (entrega garantida)
│
├── IA PLUGÁVEL
│   ├── IA opera sobre dados do core, nunca dentro dele
│   ├── Modelos podem ser trocados sem impacto no core
│   └── Agentes autônomos com boundaries claros
│
├── AUTOMAÇÃO OPERACIONAL
│   ├── Triggers + Conditions + Actions
│   ├── N8N como executor externo
│   └── Automações nunca são source of truth
│
├── OMNICHANNEL
│   ├── Inbox unificada (WhatsApp, Instagram, Email)
│   ├── CRM conversacional
│   └── Campanhas multicanal
│
├── CAPABILITIES COMPARTILHADAS
│   ├── Todo módulo usa as mesmas capabilities
│   ├── Novo nicho = novo módulo fino, não cópia
│   └── Core evolui, todos os nichos se beneficiam
│
└── ARQUITETURA ENTERPRISE INCREMENTAL
    ├── Monolito modular (não microservices)
    ├── TypeScript gradual
    ├── Repository Pattern
    └── Event-Driven
```

### 10.2 O que NÃO será

| Não será | Por quê |
|----------|---------|
| Microservices | Complexidade desnecessária para o time atual |
| Next.js | SPA atual é suficiente |
| Prisma/ORM pesado | Perda de controle sobre SQL |
| IA como core | IA é volátil, core precisa ser estável |
| Plataforma fechada | API-first desde o início |
| Monolito acoplado | Desacoplamento é prioridade |

### 10.3 Acrônimo final

**M**ulti-nicho  
**U**nified  
**L**ayered  
**T**enant-aware  
**G**overnance-driven  
**E**vent-driven  
**S**calable  
**T**ype-safe  
**O**perational  
**R**epository-pattern  

---

## Apêndice A — Marcos Históricos

| Data | Marco | Documento |
|------|-------|-----------|
| 2025.Q4 | Início do BarberGestor | — |
| 2026.Q1 | Primeiros clientes | — |
| 2026.Q2 | Migração para Supabase/PostgreSQL | `backend/src/database/*.sql` |
| 2026-04-27 | Primeiro commit no GitHub | Repositório `JoeGestorpro/multgestorapp` |
| 2026-05-13 | Estrutura completa de memória IA | `.agent/context/`, `.agent/memory/` |
| 2026-05-13 | System Engines | `.agent/system/` (4 engines) |
| 2026-05-13 | Module Memory | `.agent/memory/modules/` |
| 2026-05-13 | Marketing Ecosystem | `.agent/marketing/` (54 arquivos) |
| 2026-05-13 | Master Orchestrator + Context Engineer | `.agent/Joe-orchestrators/` |
| 2026-05-15 | Protótipos Stitch (Agenda Premium) | Projeto Stitch `4126685810349795181` |
| 2026-05-18 | Diagnóstico arquitetural completo | Auditoria com GitHub + Supabase MCP |
| 2026-05-18 | GitHub MCP Registry | `.agent/memory/github-mcp-registry.md` |
| 2026-05-18 | Arquitetura oficial | `docs/architecture-decisions.md` |
| 2026-05-18 | Lessons Learned | `docs/lessons-learned.md` |
| 2026-05-18 | MultGestor Core History | `docs/MULTGESTOR_CORE_HISTORY.md` |
| 2026-05-18 | Capabilities Map | `docs/capabilities-map.md` |
| 2026-05-18 | MCP Governance | `docs/mcp-governance.md` (48.8 KB) |
| 2026-05-18 | Event Bus Architecture | `docs/event-bus-architecture.md` (70.3 KB) |
| 2026-05-18 | Runtime Map | `docs/core/runtime-map.md` (53.4 KB) |
| 2026-05-18 | Supabase token secured | `SUPABASE_ACCESS_TOKEN` env var, removed hardcoded `sbp_` from `opencode.json` |
| 2026-05-18 | Proteção Arquitetural (Gate 6) | 29 regras em 5 documentos (V-01 a V-13, PR-01 a PR-05) |
| 2026-05-18 | Stitch token secured | `STITCH_API_KEY` env var, removed hardcoded key from `.agent/mcp_config.json` |
| 2026-05-18 | Architectural diagnosis | SaaS comum, documentação enterprise, ecossistema IA maduro |
| 2026-05-18 | Shared Kernel Implementation Plan | `docs/shared-kernel-implementation.md` (6 fases, 37h estimadas) |

---

## Apêndice B — Referências

### Documentos oficiais

| Documento | Caminho |
|-----------|---------|
| Decisões arquiteturais | `docs/architecture-decisions.md` |
| Lições aprendidas | `docs/lessons-learned.md` |
| Histórico do Core | `docs/MULTGESTOR_CORE_HISTORY.md` (este) |
| Decisões técnicas | `.agent/memory/decisions.md` |
| Registro de implementações | `.agent/memory/implementation-log.md` |
| GitHub MCP Registry | `.agent/memory/github-mcp-registry.md` |
| Arquitetura | `.agent/context/architecture.md` |
| Roadmap | `.agent/context/roadmap.md` |
| Stack | `.agent/context/stack.md` |

### Código fonte

| Componente | Caminho |
|------------|---------|
| Backend | `backend/src/` |
| Frontend | `frontend/src/` |
| Database migrations | `backend/src/database/` |
| Testes | `backend/tests/` |

---

*Este documento é a memória histórica oficial do MultGestor Core.*  
*Deve ser atualizado sempre que uma decisão arquitetural significativa for tomada.*  
*Mantenha a cronologia. Preserve o contexto. Evite que os mesmos erros se repitam.*
