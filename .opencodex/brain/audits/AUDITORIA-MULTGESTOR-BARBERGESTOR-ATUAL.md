# Auditoria Atual MultGestor / BarberGestor

> Data: 2026-06-25
> Branch: `main` (ahead of origin/main by 9 commits)
> Ambiente: Local (Windows)

---

## Resumo executivo

O MultGestor está em estado **avançado de desenvolvimento**. O backend tem arquitetura sólida com isolamento multi-tenant via RLS + middleware, 661 testes unitários passando, e o frontend faz build sem erros. BarberGestor está funcional para uso local com RESTRIÇÕES.

**Problema crítico ativo:** `APP_RUNTIME_URL` não configurada no `.env` — poolTenant conecta com role BYPASSRLS, o que significa **RLS está inerte em produção**. Qualquer usuário autenticado consegue acessar dados de outras empresas se souber os IDs.

---

## Veredito

| Item | Status |
|------|--------|
| **Uso local na barbearia** | ✅ **SIM, COM RESTRIÇÕES** |
| **Uso em produção com cliente real** | ❌ **NÃO** |
| **Commit recomendado** | ✅ **SIM** (auditoria + correções pequenas seguras) |
| **Push recomendado** | ❌ **NÃO** (sem autorização humana) |

### Restrições para uso local
1. **RLS inerte** — `APP_RUNTIME_URL` não configurada, sem isolamento entre empresas
2. **Redis vazio** — rate limit usa fallback in-memory (funciona para dev local)
3. **.env com credenciais de produção** — Supabase, Resend, Meta/WhatsApp API reais
4. **Frontend ThemeContext lê token do localStorage** (ignora authStorage em memória)
5. **Barber.jsx monolítico (4996 linhas)** — difícil manutenção

### Riscos para produção real
1. **RLS inerte** — vazamento de dados entre inquilinos
2. **APP_RUNTIME_URL ausente** — sem role `app_runtime` (NOBYPASSRLS)
3. **Erro de segurança reportado pelo próprio backend** — alerta no startup
4. **Sem testes de frontend** — 0 testes no frontend
5. **Sem testes de integração completos** — alguns testes de integração requerem DB de teste
6. **Credenciais reais em .env local** — risco de exposição

---

## Evidências técnicas

### Backend
- **Linguagem:** Node.js (Express 5)
- **Banco:** PostgreSQL via Supabase (produção: `db.mfayajizbkqkcbhqmean.supabase.co`)
- **Autenticação:** JWT (1h) + Refresh token (httpOnly cookie) — 3 scopes: `barber_admin`, `booking_customer`, `master`
- **Isolamento tenant:** Middleware `requireCompany` + RLS PostgreSQL (role `app_runtime` NOBYPASSRLS) — **MAS APP_RUNTIME_URL não configurada**
- **Rate limit:** Redis com fallback in-memory — **REDIS_URL vazio, usa in-memory**
- **Testes:** 44 suites, 661 testes unitários passando
- **Migrations:** 27 migrations (schema completo)
- **Monitoramento:** Sentry (opcional), Prometheus metrics, Pino logger

### Frontend
- **Framework:** React 19 + Vite 8
- **Roteamento:** React Router DOM 7 — 62 rotas definidas
- **Build:** ✅ Sucesso (7.68s) — avisos de chunk grande (441KB BarberDashboard, 525KB lib)
- **Lint:** não executado (timeout — eslint na raiz do frontend demorou >30s)
- **Testes:** ❌ Zero testes de frontend
- **Auth:** 3 contextos (Auth, BookingAuth, Theme) — ThemeContext lê token do localStorage (inconsistente)
- **Serviços:** apenas `api.js` + `authStorage.js` — chamadas inline nos componentes

### CI/CD
- GitHub Actions configurado (inferido por `.github/`)
- Vercel configurado (`.vercel/` no frontend)

---

## Testes executados

| Teste | Resultado | Detalhes |
|-------|-----------|----------|
| Backend `npm run test:unit` | ✅ **44 suites, 661 testes passaram** | 14.95s |
| Backend `npm run dev` | ✅ **Sobe sem erro** | Conecta Supabase, alerta RLS inerte |
| Frontend `npm run build` | ✅ **Sucesso** | 7.68s, chunk warnings |
| Frontend `npm run lint` | ⏱️ **Timeout (>30s)** | ESLint muito lento, não concluiu |

---

## Problemas encontrados

### 🔴 Críticos
1. **APP_RUNTIME_URL não configurada** — RLS inerte. Backend loga: `ALERTA SEGURANÇA: poolTenant conectado com role BYPASSRLS — RLS inerte em produção`
2. **Credenciais reais de produção no .env local** — Supabase service_role key, Resend API key, Meta access token, JWT secrets

### 🟡 Médios
3. **ThemeContext lê token do localStorage** — ignora `authStorage.js` em memória (arquivo expressamente diz "tokens agora ficam em memoria")
4. **REDIS_URL vazio** — rate limit usa fallback in-memory (aceitável em dev, mas não escala)
5. **Backend .env expõe secrets** — `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `META_ACCESS_TOKEN` estão em texto puro
6. **Monólito Barber.jsx (4996 linhas)** — risco de manutenção
7. **Zero testes de frontend** — sem verificação automatizada de UI
8. **Porta inconsistente** — `api.js` fallback: `localhost:5000`, Vite proxy: `localhost:3000`, .env: `3000`

### 🟢 Leves
9. **Arquivos .bak no backend** — `.env.bak-*` , `inspect-columns.js`
10. **Arquivos root não rastreados** — `barber-dashboard.png/txt`, `barber-login.txt`, `barbergestor-landing.txt`, `barbergestor-smoke-test-2026-06-23.md`
11. **Logs no root** — `server-err.log`, `server-out.log`
12. **body-login.json** — no `.gitignore` mas presente no diretório
13. **Sem TypeScript** — projeto todo em JSX, mesmo com `@types/react` instalado

---

## Riscos

| Risco | Impacto | Probabilidade | Prioridade | Mitigação |
|-------|---------|---------------|------------|-----------|
| RLS inerte | Inquilino A acessa dados do B | Alta | 🔴 P0 | Configurar APP_RUNTIME_URL com role app_runtime |
| Secrets no .env local | Exposição de credenciais | Média | 🔴 P0 | Usar variáveis de ambiente do SO, não .env |
| Token no localStorage | XSS rouba token de autenticação | Média | 🟡 P1 | Corrigir ThemeContext para usar authStorage |
| Sem testes frontend | Regressões não detectadas | Alta | 🟡 P1 | Adicionar testes com Vitest/Testing Library |
| Chunk grande (441KB) | Performance de carregamento | Baixa | 🟢 P2 | Code-splitting do Barber.jsx |
| Barber.jsx monolítico | Manutenção difícil | Média | 🟡 P1 | Refatorar em módulos |

---

## Recomendações

### Imediatas (antes de usar localmente)
1. Configurar `APP_RUNTIME_URL` no backend `.env` com a connection string da role `app_runtime` (sem BYPASSRLS)
2. Substituir secrets do .env por variáveis de ambiente do sistema (Windows `[Environment]::SetEnvironmentVariable`)
3. Corrigir `ThemeContext.jsx` para usar `authStorage` em vez de `localStorage`

### Curto prazo (antes de produção)
4. Adicionar testes de frontend (mínimo: smoke tests nas rotas principais)
5. Configurar `REDIS_URL` para rate limit distribuído
6. Rodar migrations pendentes após configurar `APP_RUNTIME_URL`
7. Executar testes de integração com banco de teste isolado

### Médio prazo
8. Refatorar Barber.jsx em componentes modulares
9. Adicionar service layer no frontend
10. Migrar para TypeScript gradualmente

---

## Arquivos alterados (working tree)

### Backend (código)
- `backend/src/services/barber.service.js` (novo — não rastreado)

### Frontend (código)
- `frontend/src/App.jsx` — rota `/barber/geladeira`
- `frontend/src/components/atendimento/*` — suporte a fridge no carrinho e catálogo
- `frontend/src/components/design-system/layout/Sidebar.jsx` — item "Itens da Geladeira"
- `frontend/src/features/barber/components/CollaboratorFormModal.jsx` — **DELETADO** (substituído por TeamFormModal)
- `frontend/src/features/barber/utils/helpers.js` — view `fridge`
- `frontend/src/features/barber/utils/viewMeta.js` — meta da view fridge
- `frontend/src/features/barber/views/CashierView.jsx` — receita fridge no caixa
- `frontend/src/features/barber/views/DashboardView.jsx` — substituído por BarberOverviewPage
- `frontend/src/features/barber/views/SalesView.jsx` — suporte a fridge items
- `frontend/src/features/barber/views/TeamView.jsx` — refatorado com TeamList/TeamEmptyState
- `frontend/src/pages/Barber.css` — estilos novos (geladeira, time grid, métricas)
- `frontend/src/pages/barber/client/ClientBookingPage.jsx` — novo (placeholder)
- `frontend/src/pages/barber/client/ClientLoginPage.jsx` — novo (placeholder)
- `frontend/src/pages/booking/BookingFlow.jsx` — reorganização de hooks (canProceed, goNext, goBack)

### Documentação/Brain
- `.opencodex/**` — múltiplos arquivos de documentação alterados

---

## Arquivos que NÃO devem entrar no commit

| Arquivo | Motivo |
|---------|--------|
| `.env` (root, backend, frontend) | Secrets |
| `.env.bak-*` | Backups locais |
| `backend/backend.log` | Log |
| `backend/backend.err` | Log de erro |
| `backend/env-err.log` | Log |
| `backend/server-test.err.log` | Log de teste |
| `backend/server-test.out.log` | Log de teste |
| `frontend/vite-dev.err.log` | Log |
| `frontend/vite-dev.out.log` | Log |
| `server-err.log` | Log no root |
| `server-out.log` | Log no root |
| `barber-dashboard.png` | Screenshot (não documentação) |
| `barber-dashboard.txt` | Debug output |
| `barber-login.txt` | Debug output |
| `barbergestor-landing.txt` | Debug output |
| `barbergestor-smoke-test-2026-06-23.md` | Relatório temporário |
| `body-login.json` | Dado sensível |
| `.playwright-mcp/` | Cache de ferramenta |
| `node_modules/` (todos) | Dependências |
| `dist/` (todos) | Build artifacts |
| `backend/coverage/` | Cobertura de testes |
| `backend/node_modules/` | Dependências |
| `frontend/node_modules/` | Dependências |
| `frontend/dist/` | Build |
| `.opencodex/Sem título.canvas` | Metadado Obsidian |
| `.opencodex/crie um link.md` | Lixo |

---

## Próxima ação

1. ✅ Auditoria concluída
2. ⬜ Revisar diff e autorizar commit
3. ⬜ Configurar APP_RUNTIME_URL
4. ⬜ Corrigir ThemeContext (localStorage → authStorage)
5. ⬜ Remover secrets do .env para variáveis de ambiente do SO
