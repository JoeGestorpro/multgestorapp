# Workflow: /smoke-test

**Trigger:** `/smoke-test [--env staging|production]`
**Responsável:** DevOps Engineer + QA Engineer
**Risco:** **LOW** — apenas leitura e validação

---

## 1. OBJETIVO

Validar que a aplicação MultGestor está funcional após deploy, migration ou hotfix. Este workflow **NÃO** altera dados críticos (usa dados de teste sempre que possível).

---

## 2. CONFIGURAÇÃO PRÉ-TESTE

```bash
# Definir variáveis de ambiente
export BASE_URL="https://multgestor-backend.onrender.com"  # staging ou production
export FRONTEND_URL="https://multgestor.vercel.app"
export TEST_COMPANY_SLUG="demo-barber"
export TEST_EMAIL="test@example.com"
export TEST_PASSWORD="Test@123456"
```

---

## 3. CHECKLIST BACKEND

### 3.1 Health Check Básico

```bash
curl -s "$BASE_URL/api/health" | jq .
```

- [ ] **Status 200**
- [ ] Response contém `"status": "healthy"`

### 3.2 Health Check Profundo

```bash
curl -s "$BASE_URL/api/health/deep" | jq .
```

- [ ] **Status 200**
- [ ] `database: "connected"`
- [ ] `redis: "connected"` (se aplicável)
- [ ] `email_provider: "connected"`
- [ ] Nenhum serviço com `"status": "unhealthy"`

### 3.3 Correlation-ID nos Headers

```bash
curl -i -s "$BASE_URL/api/health" | grep -i "x-correlation-id"
```

- [ ] Header `x-correlation-id` presente na resposta
- [ ] UUID válido (ex: `550e8400-e29b-41d4-a716-446655440000`)

### 3.4 Autenticação — Login Barber Admin

```bash
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"'$TEST_EMAIL'","password":"'$TEST_PASSWORD'","type":"barber"}' | jq .
```

- [ ] **Status 200**
- [ ] Response contém `token` (JWT)
- [ ] Response contém `user` com `company_id`
- [ ] Cookie `refreshToken` presente (se `sameSite` configurado)

### 3.5 Autenticação — Login Master

```bash
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"master@multgestor.com","password":"***","type":"master"}' | jq .
```

- [ ] **Status 200**
- [ ] Response contém `token` com role `master`

---

## 4. CHECKLIST FRONTEND

### 4.1 Landing Page Principal

```bash
curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL"
```

- [ ] **Status 200**
- [ ] Carrega sem erro de console (verificar DevTools)
- [ ] Favicon carregado corretamente
- [ ] Meta tags OG presentes

### 4.2 Login Barber Admin (UI)

1. Acessar `$FRONTEND_URL/login`
2. Preencher credenciais de barber admin
3. Clicar em "Entrar"

- [ ] Redirecionamento para `/dashboard` em < 3s
- [ ] Nenhum erro 401/403 no Network tab
- [ ] Dados do dashboard carregam (vendas do dia, agendamentos)

### 4.3 Login Master (UI)

1. Acessar `$FRONTEND_URL/admin`
2. Preencher credenciais master

- [ ] Redirecionamento para `/master/dashboard`
- [ ] Métricas de tenants visíveis

### 4.4 Booking Público

```bash
curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/booking/$TEST_COMPANY_SLUG"
```

- [ ] **Status 200**
- [ ] Página de agendamento carrega
- [ ] Horários disponíveis listados
- [ ] Formulário de agendamento funcional

---

## 5. CHECKLIST DE FUNCIONALIDADE

### 5.1 Criar Venda Simples

1. Logar como barber admin
2. Navegar para "Atendimentos" → "Nova Venda"
3. Selecionar serviço + colaborador
4. Finalizar venda

- [ ] Venda salva com sucesso (200/201)
- [ ] Valor correto registrado
- [ ] Comissão do colaborador calculada

### 5.2 Criar Agendamento

1. Logar como barber admin
2. Navegar para "Agenda"
3. Clicar em horário livre
4. Preencher dados do cliente
5. Salvar

- [ ] Agendamento aparece na grade
- [ ] Notificação (se habilitada) disparada

### 5.3 Email de Primeiro Acesso

1. Criar novo colaborador no sistema
2. Verificar caixa de entrada (ou logs do Resend)

- [ ] Email enviado com link de primeiro acesso
- [ ] Link contém token temporário válido
- [ ] Colaborador consegue definir PIN

### 5.4 Upload de Logo

1. Logar como barber admin
2. Navegar para "Configurações" → "Marca"
3. Fazer upload de imagem PNG/JPG

- [ ] Upload completa sem erro
- [ ] Logo aparece no dashboard e landing page
- [ ] URL da imagem acessível publicamente

---

## 6. CHECKLIST DE SEGURANÇA

### 6.1 CORS — Bloqueio de Origem Não Autorizada

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Origin: https://evil-site.com" \
  "$BASE_URL/api/health"
```

- [ ] **Status 403** ou header `Access-Control-Allow-Origin` não contém `evil-site.com`

### 6.2 Rota Protegida Sem Token

```bash
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/master/companies"
```

- [ ] **Status 401**
- [ ] Response contém `"error": "Unauthorized"`

### 6.3 Tenant Isolation

```bash
# Logar como Tenant A
token_a=$(curl -s -X POST "$BASE_URL/api/auth/login" -d '{...tenant_a...}' | jq -r .token)

# Tentar acessar dados de Tenant B com token de Tenant A
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $token_a" \
  "$BASE_URL/api/barber/companies/<tenant_b_id>/sales"
```

- [ ] **Status 403** ou array vazio `[]`
- [ ] Nenhum dado de Tenant B exposto

### 6.4 Rate Limiting

```bash
# Enviar 10 requests rápidos para /auth/login
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code}\n" "$BASE_URL/api/auth/login"
done
```

- [ ] Após 5-6 requests: **Status 429** (Too Many Requests)

---

## 7. ROLLBACK TRIGGER

Se **QUALQUER** item crítico falhar (marcado com 🔴 abaixo), acionar rollback imediato:

| Severidade | Item |
|------------|------|
| 🔴 CRÍTICO | Health check retorna 500 |
| 🔴 CRÍTICO | Login não funciona (401 em todas as tentativas) |
| 🔴 CRÍTICO | Tenant isolation falha (dados vazados) |
| 🟡 ALTO | Booking público retorna 404/500 |
| 🟡 ALTO | Smoke test falha em > 30% dos itens |
| 🟢 MÉDIO | Upload de logo lento (> 10s) |
| 🟢 MÉDIO | Email de primeiro acesso com delay |

### Procedimento de Rollback

1. **Render:** Dashboard → Deploys → "Rollback" no deploy anterior
2. **Vercel:** Dashboard → Deployments → "Promote to Production" no deploy anterior
3. **Supabase:** Se migration causou o problema, executar rollback plan (ver `/run-migrations` seção 7)
4. **Notificar:** Equipe via Slack/Discord com link do Sentry para investigação

---

## 8. COMANDO RÁPIDO

```bash
# Executar smoke test completo (automático)
./scripts/smoke-test.sh --env production

# Ou manualmente, item por item, seguindo este workflow
```
