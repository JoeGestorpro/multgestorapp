# Arquitetura — MultGestor / BarberGestor

## Separação Frontend / Backend

Frontend e backend são projetos independentes dentro do mesmo repositório:

```
/MultGestor.v2
  frontend/          # React + Vite
  backend/           # Node.js + Express
  .agent/context/    # Memória compartilhada para IA
```

A comunicação é via API REST. O frontend nunca acessa o banco diretamente.

## Arquitetura Multi-Tenant

Cada empresa (tenant) é isolada por `company_id`.

### Estrutura das Tabelas

- Tabelas do sistema master (admin): `master_users`, `tenants`
- Tabelas tenant: TODAS têm coluna `company_id`
- Tabelas públicas/globais: sem `company_id` (ex.: `plans`)

### Isolamento por company_id (REGRRA DE SEGURANÇA CRÍTICA)

```
-- CORRETO (obrigatório):
SELECT * FROM sales WHERE company_id = $1

-- ERRADO (nunca fazer):
SELECT * FROM sales WHERE owner_id = $1
```

Toda query que acessa dados de um tenant DEVE incluir `WHERE company_id = $companyId`. Isso vale para SELECT, INSERT, UPDATE e DELETE.

### Master Admin

- Tabela separada: `master_users`
- Rotas separadas: `/master/*`
- NUNCA acessa dados operacionais dos tenants
- Usa `owner_id` (diferente do tenant que usa `company_id`)

## Padrão de Rotas

### Backend

```
/barber/...           → Rotas do módulo BarberGestor (autenticadas)
/master/...           → Rotas do Master Admin
/agendamento/...      → Rotas públicas de agendamento (sem auth)
/auth/...             → Autenticação (login, register, etc.)
```

### Frontend

```
/barber/dashboard     → Visão geral do dia
/barber/agenda        → Agenda / agendamentos
/barber/clientes      → Clientes
/barber/servicos      → Catálogo de serviços
/barber/produtos      → Catálogo de produtos
/barber/vendas        → Atendimentos / vendas
/barber/caixa         → Caixa / financeiro
/barber/acertos       → Acertos de comissões
/barber/colaboradores → Equipe
/barber/relatorios    → Relatórios
/barber/configuracoes → Configurações da empresa
/master/...           → Painel master admin
/agendamento/...      → Agendamento online público
```

## Padrão de Controllers / Services

```
backend/
  routes/
    barber.js          # Rotas do BarberGestor
    master.js          # Rotas master admin
    booking.js         # Rotas públicas de agendamento
    auth.js            # Rotas de autenticação
  middlewares/
    auth.js            # Verificação de JWT
    tenant.js          # Isolamento company_id
    validate.js        # Validação de dados
  controllers/
    barber/            # Controllers do BarberGestor
    master/            # Controllers master admin
  services/
    barber/            # Lógica de negócio
    email/             # Serviço de e-mail (Resend)
    whatsapp/          # Integração WhatsApp
  db/
    queries/           # Queries SQL organizadas
    migrations/        # Scripts de migração
```

## Padrão de Validação

- Toda entrada do usuário é validada no backend
- Frontend faz validação para UX, mas **nunca é confiável**
- Validações de negócio: services
- Validações de entrada: middlewares

## Padrão de Segurança

- JWT para autenticação
- company_id extraído do token e injetado em toda query
- PIN opcional para ações sensíveis
- Tokens de integração (WhatsApp) criptografados no banco
- CORS configurado para aceitar apenas origens conhecidas
- Headers de segurança (Helmet ou manual)

## Cuidados com Escalabilidade

- Queries SQL otimizadas com índices
- Pool de conexão com PostgreSQL
- Separação de concerns (controller → service → query)
- Sem ORM pesado (SQL direto para performance)
- Storage externo (não salvar arquivos no servidor)
