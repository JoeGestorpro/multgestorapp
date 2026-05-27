# Workflow: /prepare-release

## Quando usar
Antes de qualquer deploy em produção.

## Trigger
```
/prepare-release [--version <semver>]
```

---

## Checklist de Release

### SEGURANÇA
```
[ ] CORS configurado com allowlist (não cors() aberto)
[ ] JWT_SECRET definido e não é valor padrão
[ ] Nenhum console.log expõe token, senha ou PII
[ ] .env não está commitado no repositório
[ ] Tokens de integração (WhatsApp, Kiwify) criptografados no banco
[ ] Rate limiting ativo nos endpoints críticos
[ ] SQL injection impossível (todas as queries parametrizadas)
[ ] Nenhuma query sem company_id em tabela de tenant
```

### BANCO DE DADOS
```
[ ] Migrations testadas em banco de dev com sucesso
[ ] Migrations idempotentes (IF NOT EXISTS)
[ ] Nenhum DROP TABLE sem plano de rollback
[ ] Índices criados para queries frequentes
[ ] Backup do banco de produção feito antes do deploy
```

### BACKEND
```
[ ] npm run build ou equivalente passou sem erros
[ ] Variáveis de ambiente de produção configuradas no Render
[ ] PORT, DATABASE_URL, JWT_SECRET, APP_BASE_URL, EMAIL_PROVIDER definidos
[ ] /api/health retorna 200
[ ] /api/db-test retorna 200
[ ] OutboxWorker iniciado (verificar logs)
[ ] Pino em modo JSON (NODE_ENV=production)
```

### FRONTEND
```
[ ] npm run build passou sem erros
[ ] VITE_API_URL aponta para URL de produção
[ ] Sem referências a localhost no bundle de produção
[ ] Assets otimizados (bundle < 500KB gzipped idealmente)
[ ] Favicon e manifest.json corretos
```

### FUNCIONALIDADE
```
[ ] Login barber admin funciona em produção
[ ] Login master funciona em produção
[ ] Login cliente (booking) funciona em produção
[ ] Criação de venda funciona
[ ] Agendamento online público funciona
[ ] Upload de logo funciona
[ ] Email de primeiro acesso é enviado
[ ] Email de reset de senha é enviado
```

### OBSERVABILIDADE
```
[ ] Logs estruturados em JSON aparecendo no Render
[ ] Erros 500 logados com stack trace
[ ] Correlation ID aparecendo nos headers de resposta
[ ] /api/health funcionando
```

### ROLLBACK PLAN
```
[ ] Versão anterior identificada
[ ] Como reverter o deploy (Render permite rollback por deploy)
[ ] Como reverter migrations se necessário
[ ] Equipe notificada do deploy
```

---

## Sequência de Deploy

```
1. git tag v<version>
2. Push para main/master
3. Vercel deploy automático (frontend)
4. Render deploy automático (backend)
5. Executar migrations: npm run migrate (via Render shell ou script)
6. Verificar /api/health
7. Verificar /api/db-test
8. Smoke test manual (login, criar venda, agendar)
9. Monitorar logs por 15 minutos
10. Confirmar deploy bem-sucedido
```

---

## Variáveis de produção obrigatórias (Backend — Render)

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://... (Supabase prod)
JWT_SECRET=<string longa e aleatória>
APP_BASE_URL=https://barbergestor.com.br
API_URL=https://api.barbergestor.com.br
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
EMAIL_FROM=MultGestor <no-reply@barbergestor.com.br>
WHATSAPP_PROVIDER=mock  (até implementar real)
WHATSAPP_TOKEN_ENCRYPTION_KEY=<chave de 32 bytes hex>
MASTER_ADMIN_EMAIL=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Variáveis de produção obrigatórias (Frontend — Vercel)

```
VITE_API_URL=https://api.barbergestor.com.br
```
