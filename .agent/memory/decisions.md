# Decisões Técnicas do Projeto

Cada decisão contém: decisão, motivo, impacto, risco evitado.

---

## company_id como chave de isolamento multi-tenant

| Campo | Valor |
|-------|-------|
| **Decisão** | Usar `company_id` em vez de `owner_id` como chave principal de isolamento |
| **Motivo** | Uma empresa (company) pode ter múltiplos owners. Isolar por `company_id` garante que todos os usuários da mesma empresa compartilhem os dados corretamente |
| **Impacto** | Toda query tenant precisa de `WHERE company_id = $1` |
| **Risco evitado** | Vazamento de dados entre empresas do mesmo owner |

---

## UTC no banco, timezone Brasil no frontend

| Campo | Valor |
|-------|-------|
| **Decisão** | Todas as datas armazenadas em UTC no PostgreSQL. Conversão para timezone local feita no frontend |
| **Motivo** | Padrão internacional, evita ambiguidade de horário de verão, facilita relatórios |
| **Impacto** | Backend sempre trabalha com UTC; frontend converte para America/Cuiaba (padrão) |
| **Risco evitado** | Agendamentos em horário errado devido a fuso |

---

## Vercel para frontend

| Campo | Valor |
|-------|-------|
| **Decisão** | Frontend hospedado na Vercel |
| **Motivo** | Integração nativa com Vite, deploy automático via git, preview deployments |
| **Impacto** | Build configurado para output `frontend/dist` |
| **Risco evitado** | Complexidade de configurar servidor próprio para SPA |

---

## Render para backend

| Campo | Valor |
|-------|-------|
| **Decisão** | Backend hospedado no Render |
| **Motivo** | Suporte a Node.js, SSL automático, bom custo-benefício |
| **Impacto** | Backend como Web Service, start command `node backend/server.js` |
| **Risco evitado** | Gerenciamento manual de servidor |

---

## Supabase PostgreSQL + Storage

| Campo | Valor |
|-------|-------|
| **Decisão** | Banco PostgreSQL e storage de arquivos no Supabase |
| **Motivo** | PostgreSQL gerenciado, storage integrado, bom plano gratuito |
| **Impacto** | Conexão SSL obrigatória, pool configurado com `connectionString` |
| **Risco evitado** | Gerenciamento manual de banco e servidor de arquivos |

---

## Resend para e-mails transacionais

| Campo | Valor |
|-------|-------|
| **Decisão** | Usar Resend como provedor de e-mail |
| **Motivo** | API simples, bom plano gratuito, confiabilidade |
| **Impacto** | SDK Resend no backend, `FRONTEND_URL` nos links dos e-mails |
| **Risco evitado** | E-mails marcados como spam |

---

## Express com CommonJS

| Campo | Valor |
|-------|-------|
| **Decisão** | Backend em Node.js + Express, CommonJS |
| **Motivo** | Estabilidade, ecossistema maduro, sem necessidade de ESM |
| **Impacto** | `require`/`module.exports` em todo o backend |
| **Risco evitado** | Problemas de compatibilidade com pacotes legados |

---

## Frontend/Backend separados no mesmo repositório

| Campo | Valor |
|-------|-------|
| **Decisão** | Frontend e backend no mesmo repositório, mas como projetos independentes |
| **Motivo** | Facilidade de versionamento, CI/CD unificado, mas com responsabilidades separadas |
| **Impacto** | Cada pasta tem seu próprio `package.json`, scripts e configs |
| **Risco evitado** | Acoplamento acidental entre as camadas |

---

## Context Engineer obrigatório primeiro

| Campo | Valor |
|-------|-------|
| **Decisão** | Antes de qualquer ação, chamar o context-engineer para reconstruir estado |
| **Motivo** | Evitar perda de contexto entre sessões, garantir continuidade |
| **Impacto** | Master Orchestrator sempre executa context-engineer antes de qualquer workflow |
| **Risco evitado** | Regressões por falta de contexto |

---

## Regra global de memória compartilhada

| Campo | Valor |
|-------|-------|
| **Decisão** | `.agent/context/memory-snapshot.md` e `.agent/context/ai-operating-rules.md` são fontes oficiais de verdade |
| **Motivo** | Unificar o entendimento do projeto entre diferentes agentes e sessões |
| **Impacto** | Qualquer IA deve ler esses arquivos antes de qualquer ação |
| **Risco evitado** | Contradições entre sessões, perda de regras críticas |

---

## System Engines em `.agent/system/` como engines operacionais de IA

| Campo | Valor |
|-------|-------|
| **Decisão** | Criar 4 system engines em `.agent/system/` como engines operacionais do ecossistema de IA, separadas da memória e do contexto |
| **Motivo** | Systems têm responsabilidades diferentes de context/ (fonte de verdade) e memory/ (estado). Systems são engines de processo, não de dados |
| **Impacto** | `.agent/system/` contém 4 engines que coordenam auditoria, atualização de memória, decomposição de tarefas e lifecycle de features |
| **Risco evitado** | Misturar regras de processo com dados de estado, dificultando manutenção e evolução |

---

## Module Memory em `.agent/memory/modules/`

| Campo | Valor |
|-------|-------|
| **Decisão** | Criar memória por módulo/nicho em `.agent/memory/modules/`, separada da memória de features e da memória operacional geral |
| **Motivo** | Cada módulo (barbergestor, climagestor, etc.) tem regras de negócio, roadmap e arquitetura únicos. Misturar tudo em um único arquivo criaria um documento gigante e difícil de manter |
| **Impacto** | Todo módulo ganha seu próprio arquivo com visão geral, features, regras, roadmap e próximos passos. Orchestrator lê o módulo atual antes de escolher workflow |
| **Risco evitado** | Perda de contexto específico do nicho ao alternar entre módulos |

---

## AI Marketing Ecosystem em `.agent/marketing/`

| Campo | Valor |
|-------|-------|
| **Decisão** | Criar ecossistema completo de marketing, branding e conversão orientado por IA em `.agent/marketing/`, separado da memória operacional e dos system engines |
| **Motivo** | Marketing tem escopo e dinâmica próprios (criativos, funis, SEO, anúncios) que não se encaixam em memory/ (estado) nem em system/ (processo). Precisa de estrutura dedicada para escalar multi-nicho |
| **Impacto** | `.agent/marketing/` contém 54 arquivos em 8 categorias: landing-pages, branding, conversion, social-media, seo, copywriting, funnels, ads |
| **Risco evitado** | Misturar estratégia de marketing com regras de engenharia, poluindo ambos os contextos |

---

## Marketing Ecosystem integrado ao Smart Routing

| Campo | Valor |
|-------|-------|
| **Decisão** | Master Orchestrator pode rotear tarefas de marketing para `.agent/marketing/` quando o contexto for de branding, conversão, SEO, anúncios ou conteúdo |
| **Motivo** | O ecossistema de IA precisa reconhecer quando uma tarefa é de marketing vs engenharia e escolher o contexto correto |
| **Impacto** | Smart Routing ganha nova categoria de roteamento: marketing. Tarefas de landing page, copy, SEO, etc. usam `.agent/marketing/` como fonte |
| **Risco evitado** | Aplicar regras de engenharia (company_id, segurança) em contexto de marketing, causando ruído |

---

## Module Memory integrada ao Master Orchestrator

| Campo | Valor |
|-------|-------|
| **Decisão** | O Master Orchestrator DEVE identificar o módulo atual e ler `.agent/memory/modules/<modulo>.md` como parte do fluxo obrigatório antes de qualquer ação |
| **Motivo** | Sem essa leitura, o agente pode aplicar regras do BarberGestor no ClimaGestor ou vice-versa |
| **Impacto** | Fluxo obrigatório do orchestrator ganhou +1 passo (identificar módulo). Section 10 foi renomeada para "Module Memory & Feature Lifecycle Tracking" |
| **Risco evitado** | Aplicar regras de negócio erradas no módulo errado |

---

## Context Engineer como coordenador dos System Engines

| Campo | Valor |
|-------|-------|
| **Decisão** | O Context Engineer (`.agent/Joe-orchestrators/agents/context-manager.md`) coordena os 4 system engines, chamando cada um no momento correto do fluxo |
| **Motivo** | Evitar que cada engine decida independentemente quando executar, causando conflitos de timing |
| **Impacto** | Context Engineer tem sequência clara: audit → memória → feature-state → git → relatório |
| **Risco evitado** | Execução fora de ordem, engines conflitando entre si |

---

## GitHub MCP como Capability Core Foundation

| Campo | Valor |
|-------|-------|
| **Decisão** | GitHub MCP registrado como capability oficial do Core Foundation do MultGestor |
| **Motivo** | Permite análise de repositório, histórico, branches, PRs, versionamento e rastreabilidade arquitetural por agentes e workflows |
| **Impacto** | GitHub MCP deve ser usado para histórico/versões, Filesystem MCP para código local. Cada MCP tem responsabilidade definida |
| **Risco evitado** | Confundir responsabilidades entre MCPs, usar GitHub MCP para ler código que já existe no workspace local |
| **Data** | 2026-05-18 |

---

## Datas da agenda tratadas com cuidado

| Campo | Valor |
|-------|-------|
| **Decisão** | Agenda deve evitar conflitos de horário, respeitar working hours, bloqueios, duração do serviço e antecedência mínima |
| **Motivo** | Agendamentos conflitantes geram insatisfação do cliente e do barbeiro |
| **Impacto** | Validações no backend antes de criar appointment |
| **Risco evitado** | Dupla reserva no mesmo horário para o mesmo colaborador |
