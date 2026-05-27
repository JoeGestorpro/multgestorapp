# Deployment Rules — MultGestor / BarberGestor

## Frontend (Vercel)

| Item | Configuração |
|------|-------------|
| Plataforma | Vercel |
| Build | `npm run build` (gera `dist/`) |
| Output dir | `frontend/dist` |
| Framework preset | Vite |
| Node version | 20.x (LTS) |

**Variáveis de ambiente (Vercel):**
```
VITE_API_URL=https://api.barbergestor.com.br
```

## Backend (Render)

| Item | Configuração |
|------|-------------|
| Plataforma | Render (Web Service) |
| Start command | `node backend/server.js` |
| Node version | 20.x (LTS) |
| Health check | `/health` ou similar |

**Variáveis de ambiente (Render):**
```
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://... (Supabase prod)
JWT_SECRET=<secret>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://barbergestor.com.br
RESEND_API_KEY=<key>
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_KEY=<key>
WHATSAPP_TOKEN_ENCRYPTION_KEY=<key>
STORAGE_BUCKET=barbergestor-assets
```

## Banco e Storage (Supabase)

| Item | Configuração |
|------|-------------|
| Provider | Supabase |
| Conexão | SSL obrigatório (`ssl: { rejectUnauthorized: true }`) |
| Pool | `pg.Pool` com `connectionString` |
| Storage Bucket | `barbergestor-assets` (público para imagens) |

## Build

```bash
# Frontend
cd frontend
npm install
npm run build          # Gera dist/

# Backend
cd backend
npm install            # Não precisa de build (Node.js direto)
```

## Testes Antes de Deploy

1. Rodar `npm run build` no frontend — deve passar sem erros.
2. Verificar se variáveis de ambiente estão configuradas na plataforma.
3. Testar localmente com `npm run dev` no frontend e `node backend/server.js`.
4. Verificar se migrations estão aplicadas no banco de produção.

## Logs

- Frontend: logs no console do Vercel (acessível pelo dashboard).
- Backend: logs no dashboard do Render.
- Banco: logs de query no Supabase (se habilitado).

## Domínios

- Frontend produção: `https://barbergestor.com.br` (ou subdomínio Vercel)
- Backend produção: `https://api.barbergestor.com.br` (ou Render URL)
- Frontend dev: `http://localhost:5173`
- Backend dev: `http://localhost:3001`

## FRONTEND_URL

Usado nos e-mails (Resend) para links de:
- Primeiro acesso
- Reset de senha
- Confirmações

NUNCA usar `localhost` em produção.

## Checklist de Deploy

- [ ] `npm run build` passa sem erros
- [ ] Variáveis de ambiente configuradas na plataforma
- [ ] Migrations aplicadas no banco
- [ ] CORS configurado com origem do frontend
- [ ] SSL ativo no banco
- [ ] `FRONTEND_URL` aponta para o domínio correto
- [ ] Logs monitoráveis
- [ ] Backup do banco antes do deploy
