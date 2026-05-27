# Stack Tecnológica — MultGestor / BarberGestor

## Frontend

| Item | Tecnologia |
|------|-----------|
| Framework | React 19 |
| Bundler | Vite 6 |
| Roteamento | React Router DOM |
| Gráficos | Recharts |
| Ícones | Lucide React |
| CSS | CSS puro + variáveis CSS + design tokens |
| Gerenciamento de Estado | Context API + hooks |
| Build | `npx vite build` |
| Dev | `npm run dev` (Vite dev server) |

**Estrutura de diretórios:**
```
frontend/
  src/
    components/        # Componentes reutilizáveis
      barber/          # Componentes específicos do BarberGestor
      design-system/   # Design system (layout, tokens, UI atômicos)
      common/          # Componentes genéricos
      mobile/          # Componentes mobile
      reports/         # Relatórios
      tutorial/        # Tutorial/onboarding
      atendimento/     # Atendimento
      badges/          # Sistema de conquistas
    pages/             # Páginas e views
    hooks/             # Custom hooks
    contexts/          # Context providers
    services/          # API service layer
    utils/             # Utilitários
    styles/            # Estilos globais
  public/              # Assets estáticos
    branding/          # Logos e assets de branding
  scripts/             # Scripts auxiliares (ex: generate-favicons)
```

## Backend

| Item | Tecnologia |
|------|-----------|
| Runtime | Node.js |
| Framework | Express |
| Formato | CommonJS (require/module.exports) |
| ORM | Nenhum (SQL direto) |
| Cliente SQL | `pg` (node-postgres) |
| Autenticação | JWT (jsonwebtoken) |
| Validação | Manual (middlewares) |
| Upload | Multer + Supabase Storage |
| E-mail | Resend SDK |
| Criptografia | crypto (nativo) |

**Estrutura de portas comuns:**
```
BACKEND_PORT=3001           # Local
FRONTEND_PORT=5173          # Vite local
```

## Banco de Dados

| Item | Tecnologia |
|------|-----------|
| Provider | Supabase |
| Engine | PostgreSQL |
| Conexão | `pg` (node-postgres) via SSL |
| Pool | `pg.Pool` com connection string |
| Migrations | Scripts SQL manuais |
| Storage | Supabase Storage (bucket público e privado) |

## Deploy

| Item | Plataforma |
|------|-----------|
| Frontend | Vercel |
| Backend | Render |
| Banco + Storage | Supabase |

## E-mail

| Item | Tecnologia |
|------|-----------|
| Provider | Resend |
| SDK | `resend` (Node.js) |
| Usos | Primeiro acesso, reset de senha, confirmações |

## Variáveis de Ambiente Importantes

```
# Backend
PORT=3001
NODE_ENV=development|production
DATABASE_URL=postgresql://... (Supabase)
JWT_SECRET=...
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173 (dev) / https://... (prod)
RESEND_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
WHATSAPP_TOKEN_ENCRYPTION_KEY=...
STORAGE_BUCKET=...

# Frontend
VITE_API_URL=http://localhost:3001 (dev) / https://... (prod)
```

## Ambientes

| Ambiente | Frontend | Backend | Banco |
|----------|----------|---------|-------|
| Desenvolvimento | `localhost:5173` | `localhost:3001` | Supabase dev |
| Produção | Vercel (domínio próprio) | Render | Supabase prod |
