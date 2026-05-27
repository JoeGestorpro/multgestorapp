# Contexto do Projeto

## Visão Geral

**MultGestor** é uma plataforma SaaS multi-tenant com módulos especializados por nicho de mercado. O sistema permite que diferentes tipos de negócio utilizem a mesma infraestrutura compartilhada, com dados isolados por empresa.

**BarberGestor** é o primeiro módulo do MultGestor. Sistema completo de gestão para barbearias, incluindo agenda visual, vendas, caixa, comissões, colaboradores, relatórios e agendamento online público.

## Stack Tecnológica

### Frontend
- React 19 + Vite 6
- React Router DOM (roteamento SPA)
- Recharts (gráficos)
- Lucide React (ícones)
- CSS puro + variáveis CSS + design tokens
- Context API + hooks (sem Redux/ Zustand)
- Build: `npx vite build` (gera `dist/`)
- Dev: `npm run dev` (Vite dev server, porta 5173)

### Backend
- Node.js + Express
- CommonJS (`require` / `module.exports`)
- API RESTful
- PostgreSQL via `pg` (node-postgres, Pool)
- JWT (`jsonwebtoken`) para autenticação
- Multer para upload de arquivos
- Supabase Storage para armazenamento

### Banco de Dados
- Supabase PostgreSQL
- Sem ORM (SQL direto parametrizado)
- Pool de conexão com SSL
- Migrations: scripts SQL manuais

### Serviços Terceiros
- **Resend**: E-mails transacionais (primeiro acesso, reset de senha, confirmações)
- **WhatsApp Business API**: Em planejamento (token criptografado no banco)
- **Supabase Storage**: Bucket para uploads (logos, banners, galeria)

### Deploy
- Frontend: Vercel
- Backend: Render
- Banco + Storage: Supabase

## Arquitetura

### Separação Frontend/Backend
Projetos independentes no mesmo repositório:
```
/MultGestor.v2
  frontend/   → React + Vite
  backend/    → Node.js + Express
  .agent/     → Memória compartilhada para IA
```

### Multi-Tenancy
Isolamento obrigatório por `company_id`:
- Toda tabela tenant tem coluna `company_id`
- Toda query filtra por `WHERE company_id = $1`
- `owner_id` NUNCA é usado como chave de isolamento
- Master Admin tem tabela e rotas separadas

### Estrutura de Rotas
```
/barber/*       → Rotas autenticadas do módulo BarberGestor
/master/*       → Rotas do Master Admin (isolado)
/agendamento/*  → Rotas públicas (booking online)
/auth/*         → Autenticação (login, registro)
```

### Padrão de Código (Backend)
```
routes/       → Valida entrada + chama controller
controllers/  → Orquestra lógica + chama services
services/     → Regras de negócio
db/queries/   → SQL puro parametrizado
```

## Regras Críticas

1. **company_id é obrigatório** em toda query tenant
2. **Backend é a fonte única de verdade** — frontend nunca é confiável
3. **Nunca retornar tokens sensíveis** em respostas GET
4. **WhatsApp token criptografado** no banco
5. **Datas em UTC** no banco, timezone Brasil no frontend
6. **Nunca usar localhost** em produção (usar FRONTEND_URL)
7. **.env nunca vai para o GitHub**

## Agenda Online (Booking)
- Rota pública: `/agendamento/:slug`
- Cliente seleciona serviço → horário → colaborador
- Respeita: horário func., bloqueios, duração do serviço, antecedência mínima
- Confirmação por e-mail via Resend

## Segurança
- JWT em toda rota autenticada
- PIN opcional para ações sensíveis (excluir venda, fechar caixa)
- CORS configurado com origens autorizadas
- Headers de segurança ativos
- Validação de tipo/tamanho em uploads (2MB, JPG/PNG/WEBP)

## MCP Capabilities Oficiais

O projeto utiliza múltiplos MCPs com responsabilidades distintas e complementares:

| MCP | Responsabilidade | Prioridade |
|-----|-----------------|------------|
| **Filesystem/Workspace** | Leitura/edição de código local | 1º — sempre analisar local primeiro |
| **GitHub** | Histórico, branches, PRs, versionamento, rastreabilidade | 2º — quando necessário histórico |
| **Supabase** | Schema, tabelas, migrations, RLS, índices, queries | 3º — validação de banco |
| **Terminal** | Comandos, build, testes, migrations, lint | 4º — execução operacional |
| **Playwright** | UX, fluxos, responsividade, testes visuais | 5º — validação frontend |

Registro oficial do GitHub MCP: `.agent/memory/github-mcp-registry.md`

## IA Orchestration
- Master Orchestrator em `.agent/Joe-orchestrators/agents/master-orchestrator.md`
- Context Engineer em `.agent/Joe-orchestrators/agents/context-manager.md`
- Memória operacional em `.agent/memory/`
- Contexto compartilhado em `.agent/context/`
- Toda IA deve ler `.agent/context/memory-snapshot.md` primeiro
