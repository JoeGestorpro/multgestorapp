# Lessons Learned — MultGestor Core

**Documento oficial de aprendizados arquiteturais**  
**Versão:** 1.0.0  
**Data:** 2026-05-18  
**Status:** OFICIAL • VINCULANTE  
**Tipo:** Core Foundation

---

## 1. Objetivo do Documento

### 1.1 Por que este arquivo existe

Este documento registra **erros reais cometidos** durante o desenvolvimento do MultGestor, **gargalos identificados** na arquitetura atual, **decisões que deram certo** e **padrões que não devem jamais retornar**.

### 1.2 Importância da memória arquitetural

Projetos de software esquecem. Times mudam. Arquitetos saem. Código se perde.  
Ter a memória dos erros em um documento acessível impede que o mesmo buraco seja cavado duas vezes.

### 1.3 Objetivos

- Evitar repetição de erros arquiteturais
- Preservar escalabilidade futura
- Acelerar onboarding de novos desenvolvedores
- Servir como justificativa para regras proibidas do projeto
- Manter a coerência entre decisões passadas e futuras
- Impedir que pressa por features destrua arquitetura

---

## 2. Lições Importantes

### 2.1 Monolito Gigante Gera Gargalos

#### O que aconteceu

O arquivo `backend/src/services/barber.service.js` cresceu para **~6.500 linhas** de código. Ele gerencia:

- Colaboradores (CRUD, permissões, avatar)
- Serviços (CRUD, status, tipos)
- Produtos (CRUD, estoque, fornecedores)
- Vendas (CRUD, cancelamento, comissões)
- Caixa (abertura, fechamento, pré-fechamento, histórico)
- Agendamentos (CRUD, status, reagendamento)
- Agenda (grade, disponibilidade, blocos)
- CRM (notas, tags, eventos, score)
- Branding (tema, logo, wallpaper)
- Landing pages (banner, galeria, configuração)
- Onboarding (status, wizard)
- Analytics (dashboard, relatórios, métricas)

#### Sintomas identificados

| Sintoma | Impacto |
|---------|---------|
| Funções de 150-250 linhas | Impossível entender o que uma função faz |
| 50+ métodos exportados | Nenhum desenvolvedor conhece o arquivo inteiro |
| SQL misturado com regra de negócio | Trocar banco = reescrever tudo |
| Validação inline com SQL | Duas responsabilidades no mesmo método |
| Variáveis de ambiente lidas no meio do arquivo | Configuração espalhada |
| `createError()` reimplementado em 8 services | Código duplicado, comportamentos inconsistentes |

#### Impacto na IA

A IA (tanto agentes do OpenCode quanto IA operacional futura) **não consegue operar** num arquivo de 6.500 linhas. Os motivos:

- O contexto necessário para entender uma função vizinha estoura o limite de tokens
- A IA não consegue distinguir fronteiras de domínio — tudo parece "barber"
- Modificações em uma área podem quebrar áreas não relacionadas sem que a IA perceba
- Automações não têm hooks claros porque eventos não são emitidos

#### Impacto em automações

Automações precisam de **eventos** para reagir. Neste arquivo:

- Nada emite eventos
- Tudo é síncrono
- N8N não tem hooks para se conectar
- Webhooks processam inline

#### Impacto em múltiplos nichos

Criar um segundo nicho (ex: OdontoGestor) exigiria **copiar este arquivo inteiro** — duplicando bugs, dívida e complexidade.

#### Lição aprendida

> **Separe domínios CEDO.**  
> Quando um arquivo passa de 500 linhas, já é hora de quebrar.  
> Aos 1.000, é crítico. Aos 6.500, é uma god class que precisa de atenção urgente.

#### O que deve ser feito

- Extrair shared kernel (`@multgestor/core`) com BaseRepository, Error classes, Validation
- Quebrar em ~12 domain services independentes
- Criar repository layer para isolar SQL
- Cada service deve ter no máximo 300-500 linhas

---

### 2.2 Código Duplicado Gera Inconsistência

#### O que aconteceu

Padrões inteiros de código foram copiados entre arquivos:

| Padrão duplicado | Onde aparece | Consequência |
|-----------------|--------------|-------------|
| `sendError()` | 3 controllers (barber, auth, client-booking) | Comportamento de erro diferente em cada um |
| `createError()` | 8 services | Mensagens de erro não padronizadas |
| `normalizeEmail()` | 5 services | Lógica de normalização espalhada |
| `columnExists()` | 5 services | Mesma query de schema introspection repetida |
| `planFeatures.js` | Backend + Frontend | Definições de plano fora de sync |
| Constantes (emptyService, emptyCollaborator...) | `Barber.jsx` + `features/barber/utils/constants.js` | Mesmo objeto definido em dois lugares |
| Formatters (money, shortDate, etc.) | `Barber.jsx` + `features/barber/utils/formatters.js` | Mudar formato = mudar em dois lugares |
| `viewMeta` | `Barber.jsx` + `features/barber/utils/viewMeta.js` | Views definidas duas vezes |
| Schema introspection pattern | 5 services | Cada um reimplementa `getXQueryConfig()` |

#### Lição aprendida

> **Código duplicado é dívida técnica com juros compostos.**  
> Cada duplicação dobra o custo de manutenção.  
> Toda vez que um padrão aparece pela segunda vez, ele deve ser extraído.

#### O que deve ser feito

- Extrair `sendError()` para middleware centralizado de erro
- Extrair `createError()` para `@multgestor/core` com Error hierarchy
- Extrair `normalizeEmail()`, `columnExists()` para utils compartilhadas
- Centralizar `planFeatures.js` em `@multgestor/shared`
- Eliminar duplicação entre `Barber.jsx` e `features/barber/utils/`

---

### 2.3 Componente Monstruoso no Frontend

#### O que aconteceu

O arquivo `frontend/src/pages/Barber.jsx` atingiu **4.652 linhas** com:

- ~80 variáveis de estado com `useState`
- ~50 handlers de eventos
- Prop drilling de 20-30 props por componente filho
- Lógica de formatação, constantes e metadados **copiados** de arquivos dedicados
- `window.prompt()` para entrada do usuário em cancelamentos e reagendamentos

#### Impacto

- Qualquer modificação pode quebrar visualizações não relacionadas
- Time não consegue trabalhar em paralelo no mesmo componente
- Testes são impossíveis de escrever
- A IA comete erros de regressão constantemente

#### Lição aprendida

> **Um componente React com mais de 500 linhas é um sinal de alerta.**  
> Aos 1.000, já deveria ter sido quebrado em subcomponentes.  
> Estado global demais sem contexto ou store gera acoplamento.

#### O que deve ser feito

- Extrair hooks customizados (useServices, useSales, useAppointments...)
- Separar views em páginas independentes
- Eliminar dependência de `Barber.jsx` para estado global
- Remover `window.prompt()` e criar modais dedicados

---

### 2.4 Copiar Nichos É Perigoso

#### O que aconteceu (potencial)

O módulo BarberGestor foi construído sem uma abstração de nicho. As tabelas são prefixadas com `barber_` (ex: `barber_services`, `barber_sales`). O service principal se chama `barber.service.js`.

Isso significa que criar **OdontoGestor** exigiria:

- Copiar `barber.service.js` → `odonto.service.js` (~6.500 linhas)
- Copiar `barber.controller.js` → `odonto.controller.js`
- Criar tabelas `odonto_services`, `odonto_sales`, etc.
- Duplicar todas as validações, regras e fluxos

#### Risco real

- **Explosão de manutenção**: cada bug corrigido no BarberGestor precisaria ser corrigido no OdontoGestor
- **Explosão de bugs**: cada nicho teria suas próprias variações
- **Impossibilidade de evoluir**: mudar o core exigiria mudar N nichos

#### Lição aprendida

> **Nunca copie um módulo para criar outro.**  
> Toda lógica comum deve viver no Core.  
> Nichos devem ser finos — apenas o que é específico do negócio.

#### O que deve ser feito

- Extrair Core compartilhado com capabilities reutilizáveis
- Nichos devem usar módulos desacoplados
- Tabelas de nicho devem herdar do core, não replicá-lo
- A abstração de nicho deve existir **antes** do segundo nicho

---

### 2.5 IA Antes do Core Gera Caos

#### O que aconteceu

O ecossistema de IA do MultGestor (Master Orchestrator, Context Engineer, System Engines, Marketing Ecosystem, Module Memory) foi construído **antes** do código backend estar desacoplado.

Isso gerou uma situação onde:

- A IA tem regras claras de arquitetura, mas o código não as segue
- O Master Orchestrator sabe que `barber.service.js` deveria ser 12 serviços, mas eles ainda não existem
- Os System Engines auditam consistência, mas encontram contradições constantes
- As regras de multi-tenant estão documentadas, mas o código ainda usa `WHERE company_id = $1` manual

#### Impacto

A IA opera em um **estado desejado** que não corresponde ao **estado real** do código.

#### Lição aprendida

> **A IA deve ser a última camada, não a primeira.**  
> Primeiro organize o código, depois coloque IA para operar sobre ele.  
> Caso contrário, a IA vira um "documento de intenções" sem efeito real.

#### O que a IA operacional precisa para funcionar

| Requisito | Por quê |
|-----------|---------|
| Eventos | IA precisa saber o que aconteceu no sistema |
| Domínios claros | IA precisa saber onde cada coisa vive |
| Boundaries | IA precisa saber o que pode e não pode fazer |
| Logs estruturados | IA precisa de dados históricos para aprender |
| Feature guards | IA precisa saber o que cada plano permite |
| Repository pattern | IA precisa de uma interface limpa para dados |
| API definitions | IA precisa de contratos claros de entrada/saída |

#### O que deve ser feito

- IA operacional só deve entrar após:
  - Event Bus implementado
  - Shared kernel consolidado
  - Desacoplamento inicial do `barber.service.js`
  - Repository pattern operacional
- Até lá, a IA existente (agentes OpenCode) deve focar em **refatorar o código**, não em criar features

---

### 2.6 Automações Não Podem Ser Source of Truth

#### O que aconteceu (potencial)

O projeto planeja usar N8N como orquestrador de automações. Sem as regras corretas, N8N poderia:

- Alterar banco diretamente
- Ignorar regras de negócio do backend
- Processar webhooks sem idempotência
- Criar estado inconsistente

#### Lição aprendida

> **Automações reagem ao sistema, não o substituem.**  
> O backend é a fonte única de verdade.  
> N8N nunca deve ter credenciais de banco.

#### Regras estabelecidas

- N8N só se comunica via API pública do MultGestor
- N8N nunca altera banco direto
- Toda automação é gatilhada por evento do Event Bus
- MultGestor é sempre source of truth
- Arquitetura orientada a eventos (Event-Driven)

---

### 2.7 Frontend Não Pode Conter Regra Crítica

#### O que aconteceu

O frontend atualmente:

- Faz validações de formulário (para UX, sem confiar)
- Renderiza dados do backend
- Gerencia estado de UI

**Mas** algumas regras de exibição de features são calculadas tanto no backend (`requirePlanFeature`) quanto no frontend (`canUseFeature()`, `planFeatures.js`). Isso significa que:

- Mudar uma regra de plano exige deploy de frontend + backend
- Frontend e backend podem ficar fora de sync
- Um usuário malicioso pode inspecionar o frontend e ver regras que não deveria

#### Lição aprendida

> **Toda regra de negócio vive no backend.**  
> Frontend exibe o que o backend autoriza.  
> Se o frontend decide o que mostrar, a segurança está comprometida.

#### O que deve ser feito

- `canUseFeature()` deve ser uma chamada de API, não uma função local
- `planFeatures.js` no frontend deve ser apenas para UX (pré-renderização)
- Backend deve sempre validar permissão de feature antes de retornar dados
- Feature guards devem ser aplicados no backend primeiro

---

### 2.8 Tabelas Sem `company_id` São Risco de Data Leak

#### O que aconteceu

O schema atual tem tabelas que **não** possuem `company_id`:

- `audit_logs` (master admin)
- `auth_audit_logs`
- `modules` (catálogo global)
- `plans` (catálogo global)
- `settings` (plataforma)

Essas estão corretas por serem globais. Porém, a auditoria revelou que algumas queries do `master.service.js` usam **concatenação de string** para nomes de tabela:

```javascript
const result = await pool.query(
  `SELECT COUNT(*)::int AS total FROM ${tableName} ${whereClause}`
);
```

Isso é um risco de SQL injection e de vazamento de dados entre contexts.

#### Lição aprendida

> **company_id não é negociável.**  
> Toda query tenant DEVE ter company_id.  
> Nenhuma query deve usar string concatenation para nomes de tabela.  
> Futuramente, Row-Level Security no PostgreSQL deve ser o padrão.

---

### 2.9 MCPs Mudaram o Projeto

#### O que aconteceu

A introdução dos MCPs (GitHub, Supabase, Terminal) transformou a engenharia do MultGestor:

| Antes | Depois |
|-------|--------|
| IA trabalhava com contexto parcial | IA lê código real do projeto |
| Decisões baseadas em suposição | Decisões baseadas em análise real |
| Auditoria manual e inconsistente | Auditoria automatizada via GitHub MCP |
| Schema do banco documentado em texto | Schema validado via Supabase MCP |
| Erros ignorados até quebrar | Erros detectados por diagnóstico contínuo |

#### Impacto específico do GitHub MCP

- Histórico de commits disponível para análise
- Comparação entre versões possível
- Branches e PRs auditáveis
- Rastreabilidade arquitetural preservada
- Erro `-32000` do `@github/github-mcp-server` identificado e corrigido

#### Lição aprendida

> **MCPs transformam IA de "achismo" em "engenharia real".**  
> Um ambiente com MCPs bem configurados é mais produtivo que qualquer framework ou biblioteca.  
> A combinação GitHub + Supabase + Terminal + Filesystem cobre 90% das necessidades de diagnóstico.

---

### 2.10 Erro Real: `@github/github-mcp-server` Não Existe

#### O que aconteceu

O arquivo `opencode.json` foi configurado originalmente com:

```json
{
  "github": {
    "command": ["npx", "-y", "@github/github-mcp-server"]
  }
}
```

Este pacote **não existe no npm** (retorna 404). O OpenCode tentava iniciar o servidor, recebia erro 404 e fechava a conexão com:

```
MCP error -32000: Connection closed local mcp startup failed
```
```
github FAILED
```

#### Causa raiz

O nome correto do pacote é `@modelcontextprotocol/server-github` — não `@github/github-mcp-server`.

#### Impacto

- GitHub MCP ficou offline por sessões inteiras
- Erro `-32000` sem mensagem clara
- Perda de tempo investigando token, rede e permissões quando o problema era o nome do pacote

#### Lição aprendida

> **Sempre valide o nome de pacotes npm antes de configurar.**  
> **Erro -32000 pode ser apenas um pacote que não existe.**  
> A ordem de debug deve ser: config → pacote → token → rede.

#### O que foi feito

Config corrigida para:

```json
{
  "github": {
    "command": ["npx", "-y", "@modelcontextprotocol/server-github"]
  }
}
```

---

### 2.11 Inconsistência de Memória Entre Sessões

#### O que aconteceu

Durante o desenvolvimento, o arquivo `session-snapshot.md` foi encontrado **vazio** em uma sessão. O diretório `features/` não existia no disco, embora estivesse referenciado em outros arquivos. Alguns arquivos de contexto estavam em locais aninhados incorretamente (`.agent/context/.agent/.agent/...`).

#### Impacto

- IA perdia contexto entre sessões
- Decisões tomadas em uma sessão eram ignoradas na seguinte
- Arquivos órfãos acumulavam sem referência

#### Lição aprendida

> **Memória compartilhada precisa ser validada constantemente.**  
> Toda sessão deve verificar se os arquivos existem, estão preenchidos e consistentes.  
> Context Engineer foi criado exatamente para isso.

#### O que foi feito

- Criado `ai-audit-system` para validar consistência da memória
- Criado `auto-memory-updater` para sincronizar alterações
- Toda sessão agora começa com validação de consistência

---

### 2.12 Geração de Favicon Ensinou Sobre Processamento de Imagem

#### O que aconteceu

Foram necessárias **3 iterações** para gerar o favicon correto do BarberGestor:

1. Primeira tentativa: IA criou SVG artificial com "BG" — violava identidade visual
2. Segunda tentativa: Imagem com transparência gerava bordas brancas no .ico
3. Terceira tentativa: `fit: contain` + fundo preto + sem trim — favicon correto

#### Lição aprendida

> **Imagens são parte do produto, não um detalhe.**  
> Processamento de imagem exige conhecimento específico (sharp, formatos, tamanhos).  
> IA tende a criar atalhos visuais que violam a identidade da marca.  
> Sempre validar output visual antes de considerar pronto.

---

### 2.13 Marketing Ecosystem Precisava Ser Separado da Engenharia

#### O que aconteceu

Inicialmente, conteúdo de marketing, branding e conversão estava misturado com regras de engenharia na memória compartilhada. Isso poluía ambos os contextos:

- IA de engenharia recebia regras de CTA e funis
- IA de marketing recebia regras de `company_id` e segurança

#### Lição aprendida

> **Contextos diferentes exigem memórias diferentes.**  
> Misturar marketing com engenharia faz ambos os lados sofrerem.  
> A separação em `.agent/marketing/` foi uma das melhores decisões do projeto.

---

### 2.14 Auditar a Capability Antes de "Implementar" (e idempotência de jobs)

#### O que aconteceu

A missão "WhatsApp real" foi tratada inicialmente como construção. A auditoria do código revelou que o
WhatsApp **já estava ~90% pronto**: provider real Meta Cloud API, resolver per-tenant (token cifrado),
consumer de confirmação/cancelamento e endpoints de config. Faltava **apenas o lembrete agendado**.

#### Lições aprendidas

> **Audite o que já existe antes de implementar.** Metade do trabalho de uma "feature nova" pode já estar no
> código. Reconstruir o que existe é duplicação (P02) disfarçada de novidade.

> **Job agendado customer-facing exige idempotência na origem.** Marcar o estado (`reminder_sent_at`) **antes**
> de emitir, com guarda `WHERE ... IS NULL`, garante no-double-send mesmo com ticks concorrentes — sem depender
> de retry durável. Para timers que disparam mensagem real, idempotência frágil = spam de cliente.

#### O que deve ser feito

- Todo card de "implementar X" começa com auditoria do que já existe (provider/resolver/consumer/rotas).
- Jobs agendados marcam o estado **antes** do efeito colateral externo; testar o cenário de reentrada.

---

### 2.15 Ambiente Oficial é Windows + PowerShell — Comandos Unix Quebram o Executor

#### O que aconteceu

Prompts e cards operacionais frequentemente assumem shell Unix (`head`, `tail`, `grep`, `sed`, `awk`,
`xargs`, `2>/dev/null`). O ambiente **oficial local do MultGestor é Windows + PowerShell**, onde esses
comandos não existem (ou se comportam diferente), fazendo o executor falhar ou produzir saída inválida.

#### Lição aprendida

> **Escreva comandos compatíveis com PowerShell por padrão.** Comandos Unix (`head`/`tail`/`grep`/`sed`/
> `awk`/`xargs`) são **proibidos** em cards/missões, salvo confirmação explícita de Git Bash, WSL ou Linux.

#### Equivalências obrigatórias

| Unix | PowerShell |
|------|------------|
| `head -n N` | `Select-Object -First N` |
| `tail -n N` | `Select-Object -Last N` |
| `grep "x"` | `Select-String "x"` |
| `cat arquivo` | `Get-Content arquivo` |
| `rm -rf caminho` | `Remove-Item -Recurse -Force caminho` |

#### O que deve ser feito

- **Preflight obrigatório:** confirmar o shell antes de executar qualquer `next-task`
  (ver `.opencodex/templates/preflight-check.md` → "Ambiente Oficial — Windows + PowerShell").
- Cards do Claude Code já nascem com comandos PowerShell; comando Unix sem confirmação de Bash/WSL → traduzir ou PARAR.

---

## 3. Padrões Que Não Devem Voltar

### 🔴 P01 — God Class

`barber.service.js` com 6.500+ linhas. **Nunca mais.** Nenhum arquivo no MultGestor deve ultrapassar 1.000 linhas. Acima disso, deve ser quebrado.

### 🔴 P02 — Código Duplicado

`sendError()` em 3 controllers, `createError()` em 8 services, `normalizeEmail()` em 5 places. **Nunca mais.** Toda segunda ocorrência de um padrão deve ser extraída.

### 🔴 P03 — SQL Solto em Services

`pool.query(...)` chamado diretamente de dentro de regras de negócio. **Nunca mais.** Todo acesso a banco deve passar por um Repository.

### 🔴 P04 — Mega-Componente React

`Barber.jsx` com 4.652 linhas e ~80 estados. **Nunca mais.** Nenhum componente deve ultrapassar 500 linhas.

### 🔴 P05 — Concatenação de String para SQL

`SELECT COUNT(*) FROM ${tableName}`. **Nunca mais.** Toda query deve ser parametrizada ou usar query builder.

### 🔴 P06 — Timezone Hardcoded

`America/Cuiaba` literal em 3 arquivos. **Nunca mais.** Timezone deve ser configurável por empresa.

### 🔴 P07 — Prop Drilling Excessivo

20-30 props passadas para componentes filhos. **Nunca mais.** Usar composição, context ou store.

### 🔴 P08 — Validação Ad-Hoc

Regex `'/^\d{4}-\d{2}-\d{2}$/'` duplicado em múltiplos arquivos. **Nunca mais.** Zod centralizado para toda validação.

### 🔴 P09 — window.prompt() para Input de Usuário

Sem validação, sem UX, sem acessibilidade. **Nunca mais.** Usar modais dedicados com formulários controlados.

### 🔴 P10 — Cópia de Nicho

Copiar `barber.service.js` para criar `odonto.service.js`. **Nunca mais.** Nichos devem ser finos, baseados no Core compartilhado.

---

## 4. Decisões Que Deram Certo

### ✅ company_id como chave multi-tenant

Apesar de manual, o padrão `company_id` é consistente em todas as tabelas tenant. Nenhuma tabela usa `owner_id` como isolamento. Isso evitou data leak.

### ✅ Separação Frontend/Backend no mesmo repositório

Facilita versionamento e CI/CD sem acoplar as camadas.

### ✅ Express com CommonJS

Pode parecer antiquado, mas evitou problemas de compatibilidade com pacotes legados e manteve a estabilidade.

### ✅ Supabase PostgreSQL + Storage

Banco gerenciado + storage integrado sem custo adicional. Bom para o estágio atual.

### ✅ MCPs como Capabilities Oficiais

GitHub MCP + Supabase MCP + Terminal MCP transformaram a qualidade do desenvolvimento orientado por IA.

### ✅ Marketing Ecosystem Separado

`.agent/marketing/` como diretório independente de `.agent/memory/` evitou poluição de contexto.

### ✅ Module Memory por Nicho

`.agent/memory/modules/barbergestor.md` e `climagestor.md` como memórias separadas evitaram que regras de um nicho vazassem para outro.

### ✅ System Engines como Processos

`ai-audit-system`, `auto-memory-updater`, `automatic-task-decomposition`, `feature-state-engine` como engines separadas da memória e do contexto.

---

## 5. Regras Para o Futuro

Toda feature nova deve responder **obrigatoriamente** a estas perguntas:

| # | Pergunta | Critério de aprovação |
|---|----------|----------------------|
| 1 | **Isso pertence ao Core ou ao nicho?** | Core = compartilhado, Nicho = específico |
| 2 | **Isso emite evento?** | Se outro sistema precisa reagir → sim |
| 3 | **Isso impacta IA futura?** | Se cria/altera dados que IA consome → documentar |
| 4 | **Isso impacta automação?** | Se N8N ou workflows usam isso → evento |
| 5 | **Isso respeita company_id?** | Se acessa dados de tenant → obrigatório |
| 6 | **Isso aumenta acoplamento?** | Se sim → reavaliar abordagem |
| 7 | **Isso cria dependência perigosa?** | Ex: N8N alterando banco → proibido |
| 8 | **Isso escala?** | Se não escala horizontalmente → reavaliar |
| 9 | **Isso é testável?** | Se não pode ser testado isoladamente → refatorar |
| 10 | **Isso está documentado?** | Se não estiver → pendente de documentação |

---

## 6. Conclusão

### Visão final

O MultGestor não é apenas um SaaS.  
É uma **plataforma operacional inteligente multi-nicho**.

A arquitetura precisa priorizar:

| Prioridade | Área | Por quê |
|-----------|------|---------|
| 1º | **Desacoplamento** | Sem isso, nada mais funciona |
| 2º | **Eventos** | Base para automação, IA e integrações |
| 3º | **Core compartilhado** | Nichos precisam de fundação comum |
| 4º | **Repository pattern** | Testabilidade e evolução de banco |
| 5º | **IA plugável** | IA opera sobre o core, nunca dentro dele |
| 6º | **Escalabilidade** | Horizontal, não vertical |
| 7º | **Evolução incremental** | Bloco por bloco, não tudo de uma vez |

### O maior aprendizado de todos

> **Arquitetura não se conserta depois.**  
> Toda linha de código que você escreve hoje é uma dívida ou um investimento.  
> O barber.service.js de 6.500 linhas não surgiu em um dia — surgiu porque ninguém disse "isso já está grande demais".

### Próximo passo

Shared Kernel (`@multgestor/core`) + Repository Pattern.  
Antes de qualquer feature nova.

---

## Referências

| Documento | Caminho |
|-----------|---------|
| Decisões arquiteturais oficiais | `docs/architecture-decisions.md` |
| Decisões técnicas do projeto | `.agent/memory/decisions.md` |
| Registro de implementações | `.agent/memory/implementation-log.md` |
| Contexto do projeto | `.agent/memory/project-context.md` |
| Regras operacionais | `.agent/memory/rules.md` |
| Arquitetura atual | `.agent/context/architecture.md` |
| Stack definida | `.agent/context/stack.md` |
| Diagnóstico arquitetural | `.agent/context/memory-snapshot.md` |
| Roadmap | `.agent/context/roadmap.md` |
| GitHub MCP Registry | `.agent/memory/github-mcp-registry.md` |
