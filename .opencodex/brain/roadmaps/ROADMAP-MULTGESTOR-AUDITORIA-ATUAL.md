# Roadmap MultGestor / BarberGestor

> Gerado em: 2026-06-25
> Baseado na auditoria completa do código, testes (661 unitários passando), build frontend e análise de segurança.

---

## 1. Estado atual

### ✅ O que já existe e está funcionando
- **Backend** (Express 5 + PostgreSQL/Supabase)
  - 27 migrations aplicadas (schema completo do BarberGestor)
  - Autenticação JWT (3 scopes: barber_admin, booking_customer, master)
  - CRUD completo de: empresas, serviços, produtos (incluindo fridge), colaboradores, clientes, agendamentos, vendas, caixa, comissões, adiantamentos, acertos
  - Isolamento multi-tenant: middleware `requireCompany` + RLS PostgreSQL (role `app_runtime`)
  - Rate limiting (Redis com fallback in-memory)
  - Outbox pattern para eventos assíncronos
  - Integração WhatsApp (mock ativo, Meta API configurada)
  - Agendamento público (booking flow completo)
  - Painel master (dashboard, financeiro, módulos, clientes, assinaturas)
  - Webhooks (Kiwify, AbacatePay)
  - 661 testes unitários passando (44 suites)
  - Sentry, Prometheus metrics, Pino logger
- **Frontend** (React 19 + Vite 8)
  - 62 rotas definidas (públicas, barber privadas, master privadas, booking privadas)
  - BarberGestor backoffice completo (dashboard, agenda, serviços, produtos, fridge, equipe, caixa, vendas, relatórios)
  - Agendamento público multi-step (6 etapas)
  - Painel master completo (15+ páginas)
  - Design system próprio
  - Onboarding wizard
  - Build bem-sucedido
- **Infra**
  - Docker (opcional)
  - GitHub Actions (CI)
  - Vercel (frontend deploy configurado)

### 🔶 O que está parcialmente pronto
- **Fridge (geladeira)**
  - Backend: CRUD, relatório, favoritos ✅
  - Frontend: catálogo no atendimento, carrinho, sidebar, rota, viewMeta ✅
  - Pendente: página de gestão dedicada (`ItensGeladeira.jsx` é legacy, novo componente não integrado)
- **Client area (área do cliente)**
  - Backend: login, listar/criar/cancelar agendamentos ✅
  - Frontend: `ClientBookingPage.jsx` e `ClientLoginPage.jsx` são placeholders vazios ⚠️
  - `ClientAppointments.jsx` (928 linhas) existe mas não está conectado aos placeholders
- **DashboardView.jsx**
  - Substituído por `BarberOverviewPage` ✅
  - Dashboard antigo removido (`AdminDashboardContent` não mais importado)
- **TeamView.jsx**
  - Refatorado com `TeamList`, `TeamEmptyState` ✅
  - Componentes extraídos para `features/barber/components/team/`

### 🟡 O que ainda é mock/placeholder
- **ClientBookingPage.jsx** — placeholder vazio (apenas h1 + botão)
- **ClientLoginPage.jsx** — placeholder vazio (apenas h1 + botão)
- **Área do cliente mobile** — endpoints existem, frontend incompleto
- **Master CRM** — `Crm.jsx` usa dados mock (pipeline de leads)
- **Master Support** — `Support.jsx` usa dados mock (tickets)
- **Governance** — dados mock/reais misturados

### ❌ O que está quebrado ou incerto
- **APP_RUNTIME_URL não configurada** — RLS inerte (alerta de segurança no startup)
- **ThemeContext lê token do localStorage** — bypass do authStorage em memória
- **Zero testes de frontend** — sem smoke/lint verificados
- **Rate limit usa fallback in-memory** — REDIS_URL vazio
- **Porta inconsistente** — api.js fallback 5000, Vite proxy 3000, .env 3000

---

## 2. Decisão operacional

### Pode usar local na barbearia?
**✅ SIM, COM RESTRIÇÕES**

Restrições:
1. **RLS inerte** — enquanto não configurar `APP_RUNTIME_URL`, dados de empresas diferentes ficam visíveis entre si. Para teste local com UMA empresa, é tolerável.
2. **Credenciais de produção no .env** — risco se .env vazar. Para teste local controlado, aceitável.
3. **Área do cliente incompleta** — placeholders vazios. Clientes não conseguem ver histórico ou cancelar agendamentos online.
4. **Sem backup automático** — dados na Supabase produção, sem snapshot de teste.

### Pode usar em produção com cliente real?
**❌ NÃO**

Motivos:
1. RLS inerte → risco de vazamento de dados entre empresas
2. Sem testes de frontend → risco de regressão não detectada
3. ThemeContext lendo localStorage → vulnerabilidade XSS
4. Sem backup/restore testado
5. Sem monitoramento de erros (Sentry DSN vazio)
6. Sem logging adequado para auditoria de produção

### Cuidados antes de usar
- [ ] Configurar `APP_RUNTIME_URL`
- [ ] Rodar migrations 024-026 (RLS companies/users, WITH CHECK, app_runtime role)
- [ ] Verificar se RLS está ativo (`/internal/security/runtime-check`)
- [ ] Substituir secrets do .env por variáveis de ambiente do SO
- [ ] Configurar Redis para rate limit
- [ ] Corrigir `ThemeContext` para usar `authStorage`

---

## 3. Prioridade P0 — obrigatório antes de uso real

| # | Tarefa | Objetivo | Arquivos prováveis | Critério de pronto |
|---|--------|----------|-------------------|-------------------|
| 1 | **Configurar APP_RUNTIME_URL** | Ativar RLS no PostgreSQL | `backend/.env` | Backend startup SEM alerta "RLS inerte" |
| 2 | **Rodar migrations 024-026** | Aplicar RLS companies/users, WITH CHECK, app_runtime role | `backend/scripts/run-migrations.js` | Migrations aplicadas com sucesso |
| 3 | **Mover secrets do .env para env vars do SO** | Eliminar risco de exposição de credenciais | `backend/.env`, docs | .env contém apenas exemplos, valores reais em env vars |
| 4 | **Corrigir ThemeContext (localStorage → authStorage)** | Eliminar vulnerabilidade XSS | `frontend/src/contexts/ThemeContext.jsx` | ThemeContext usa `authStorage.getToken()` |
| 5 | **Criar empresa real "Barbearia JoeFelipe"** | Dados reais para teste | Seed script ou admin panel | Empresa criada via `/master/clients` |
| 6 | **Cadastrar serviços reais** | Corte, barba, etc. | API `/api/barber/services` | Serviços visíveis no agendamento público |
| 7 | **Cadastrar profissionais reais** | JoeFelipe + colaboradores | API `/api/barber/collaborators` | Profissionais aparecem na agenda |
| 8 | **Testar fluxo completo de agendamento** | Criar agendamento público → aparece na agenda interna | `BookingFlow`, `AgendaInterna` | Agendamento criado e visível |
| 9 | **Verificar isolamento tenant** | Confirmar RLS ativo | `GET /internal/security/runtime-check` | Endpoint retorna `app_runtime` sem BYPASSRLS |

---

## 4. Prioridade P1 — melhorar operação

| # | Tarefa | Objetivo | Arquivos prováveis |
|---|--------|----------|-------------------|
| 10 | **Completar área do cliente** | Cliente ver/cancelar agendamentos | `ClientBookingPage.jsx`, `ClientLoginPage.jsx`, `ClientAppointments.jsx` |
| 11 | **Adicionar testes de frontend** | Smoke tests nas rotas principais | `frontend/tests/` |
| 12 | **Finalizar gestão de fridge** | Tela dedicada de itens da geladeira | `frontend/src/pages/barber/ItensGeladeira.jsx`, `features/barber/` |
| 13 | **Configurar Redis** | Rate limit distribuído | `backend/.env`, `docker-compose.yml` |
| 14 | **Relatórios básicos** | Faturamento diário/semanal/mensal | `reports/`, `DashboardView.jsx` |
| 15 | **Notificações WhatsApp** | Lembretes de agendamento, confirmação | `integration/`, `outbox/` |
| 16 | **Configurações da barbearia** | Horários, branding, landing page | `settings/`, `branding/` |
| 17 | **Configurar Sentry** | Monitoramento de erros | `backend/.env`, `frontend/.env` |

---

## 5. Prioridade P2 — SaaS vendável

| # | Tarefa | Objetivo |
|---|--------|----------|
| 18 | **Onboarding de novas barbearias** | Fluxo completo de cadastro + primeiro acesso |
| 19 | **Planos e cobrança** | Integração Kiwify/AbacatePay funcional |
| 20 | **Painel master completo** | Métricas reais, não mock |
| 21 | **Suporte** | Sistema de tickets real |
| 22 | **Métricas de uso** | DAU, MRR, churn, LTV |
| 23 | **Automações** | Email marketing, recuperação de clientes |
| 24 | **Backup automático** | Snapshot programado do banco |

---

## 6. Prioridade P3 — expansão MultGestor

| # | Tarefa | Objetivo |
|---|--------|----------|
| 25 | **Reutilização para outros nichos** | Template de módulo vertical |
| 26 | **ClimaGestor** | Módulo de climatização (schema existe, frontend placeholder) |
| 27 | **TerraGestor** | Módulo de paisagismo (frontend placeholder) |
| 28 | **PetGestor** | Futuro nicho |
| 29 | **FiscalGestor** | Futuro módulo fiscal |

---

## 7. Checklist para usar na Barbearia JoeFelipe

### Pré-requisitos técnicos
- [ ] `APP_RUNTIME_URL` configurada
- [ ] Migrations 024-026 rodadas
- [ ] RLS verificado como ativo
- [ ] Secrets movidos para env vars do SO
- [ ] Frontend build sem erros
- [ ] Backend 661/661 testes passando

### Setup da barbearia
- [ ] Criar empresa "Barbearia JoeFelipe" via master panel
- [ ] Cadastrar serviços reais (preços, duração)
- [ ] Cadastrar profissionais (nome, email, comissão, foto)
- [ ] Configurar horários de funcionamento
- [ ] Configurar landing page pública (fotos, descrição)
- [ ] Testar link público de agendamento (`/agendar/barbearia-joefelipe`)
- [ ] Criar agendamento teste como cliente
- [ ] Confirmar agendamento aparece na agenda interna
- [ ] Testar alteração/cancelamento
- [ ] Testar login do dono (admin)
- [ ] Testar login de colaborador (se houver)
- [ ] Testar fluxo de caixa (abertura, venda, fechamento)
- [ ] Testar no celular (responsivo)

### Backup
- [ ] Exportar dump do banco antes de operar
- [ ] Configurar backup automático semanal
- [ ] Testar restore

---

## 8. Riscos ativos

| Risco | Impacto | Probabilidade | Prioridade | Mitigação |
|-------|---------|---------------|------------|-----------|
| RLS inerte → dados expostos entre empresas | Catastrófico | Alta | 🔴 P0 | Configurar APP_RUNTIME_URL |
| Secrets no .env local | Alto | Média | 🔴 P0 | Mover para env vars do SO |
| ThemeContext lê localStorage → XSS | Alto | Média | 🟡 P1 | Usar authStorage |
| Zero testes frontend | Médio | Alta | 🟡 P1 | Adicionar smoke tests |
| Redis vazio → rate limit in-memory (sem escala) | Baixo | Média | 🟢 P2 | Configurar Redis |
| Barber.jsx 4996 linhas | Médio | Alta | 🟡 P1 | Refatorar |
| Sem backup de banco | Alto | Baixa | 🟡 P1 | Configurar dump semanal |
| Sentry vazio → sem alerta de erro | Médio | Alta | 🟡 P1 | Configurar DSN |
| Porta inconsistente (5000 vs 3000) | Baixo | Baixa | 🟢 P3 | Padronizar |

---

## 9. Próximas missões recomendadas

### Missão 1: `feat/rls-activation`
**Objetivo:** Configurar APP_RUNTIME_URL e ativar RLS
- **Arquivos:** `backend/.env`, `backend/scripts/run-migrations.js`
- **Testes:** `backend/tests/integration/tenant-isolation-rls.test.js`
- **Critério de pronto:** Backend startup sem alerta "RLS inerte", endpoint `/internal/security/runtime-check` retorna role `app_runtime`

### Missão 2: `fix/theme-context-authstorage`
**Objetivo:** Corrigir ThemeContext para usar authStorage em vez de localStorage
- **Arquivos:** `frontend/src/contexts/ThemeContext.jsx`
- **Testes:** Verificar login barber → theme carrega corretamente
- **Critério de pronto:** `localStorage.getItem('auth_token_barber')` não aparece no código

### Missão 3: `feat/client-area`
**Objetivo:** Completar área do cliente (ver/cancelar agendamentos)
- **Arquivos:** `frontend/src/pages/barber/client/ClientBookingPage.jsx`, `ClientLoginPage.jsx`, `ClientAppointments.jsx`
- **Testes:** Fluxo: login cliente → ver agendamentos → cancelar
- **Critério de pronto:** Cliente consegue ver e cancelar agendamentos pelo celular

### Missão 4: `feat/frontend-tests`
**Objetivo:** Adicionar smoke tests para frontend
- **Arquivos:** `frontend/tests/` (novo)
- **Testes:** Renderização das páginas principais, login flow, booking flow
- **Critério de pronto:** `npm test` no frontend passa com cobertura >30%

### Missão 5: `chore/secrets-to-env-vars`
**Objetivo:** Mover todas as credenciais de .env para variáveis de ambiente do SO
- **Arquivos:** `backend/.env`, `frontend/.env`
- **Testes:** Backend sobe sem as variáveis no .env
- **Critério de pronto:** .env contém apenas variáveis não-sensíveis (portas, URLs, flags)
