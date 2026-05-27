# Frontend Rules — MultGestor / BarberGestor

## Stack

- React 19 + Vite 6
- React Router DOM (roteamento SPA)
- Recharts (gráficos)
- Lucide React (ícones)
- CSS puro + variáveis CSS + design tokens
- Context API + hooks (sem Redux)

## Estrutura de Páginas

Toda página BarberGestor fica em `frontend/src/pages/Barber.jsx`. A navegação entre views internas é controlada por estado (`activeView`) e reflete na URL via React Router.

## Separação Componentes / Páginas

```
pages/Barber.jsx          → Página principal (orquestra tudo)
components/barber/        → Componentes específicos do módulo
components/design-system/ → Layout, tokens, UI atômicos
components/common/        → Componentes reutilizáveis entre módulos
```

## Integração com API

1. Usar `api` service (`services/api.js`) para chamadas HTTP.
2. `api` é uma instância do axios (ou fetch wrapper) com base URL configurada.
3. Token JWT é enviado automaticamente via header `Authorization`.
4. Tratar erros com `try/catch` e exibir mensagens amigáveis.
5. Nunca expor tokens ou dados sensíveis no frontend.

## UX Premium

1. Design visual escuro premium (background `#070a0d`, painéis glass).
2. Animações suaves (transições CSS, foco, hover).
3. Feedback visual para todas as ações (loading, sucesso, erro).
4. Esqueletos de carregamento (skeleton loader).
5. Estados vazios com mensagem amigável.

## Responsividade

1. Layout adaptável: sidebar fixa em desktop, drawer em mobile.
2. Breakpoints principais: 768px (mobile), 1024px (tablet), 1280px+ (desktop).
3. BottomNav para mobile.
4. Topbar com menu hambúrguer em mobile.
5. Grade de cards adaptável (`grid-template-columns: repeat(auto-fit, ...)`).

## Tratamento de Loading / Erro

1. Estados: `loading`, `error`, `success`, `empty`.
2. Loading: skeleton loader ou spinner.
3. Error: mensagem inline ou toast.
4. Success: feedback visual (toast, badge).
5. Empty: mensagem com call to action.

## Segurança (NUNCA CONFIAR NO FRONTEND)

1. Validação no frontend é para UX, não para segurança.
2. Nunca armazenar tokens sensíveis em `localStorage` sem proteção.
3. Nunca exibir dados que o usuário não tem permissão para ver.
4. Nunca enviar dados sem validação backend.
5. Bloquear ações não autorizadas visualmente (LockedFeature).

## Agenda Online (Booking)

1. Página pública em `/agendamento/:slug`.
2. Cliente seleciona serviço, horário e colaborador.
3. Respeita: horário de funcionamento, bloqueios, duração, antecedência mínima.
4. Confirmação por e-mail via Resend.

## Configurações Visuais do BarberGestor

1. Logo, cores e nome da empresa vêm da API (`/barber/company/branding`).
2. Tema é aplicado via `useTenantTheme()` que combina `ThemeContext` + `useAuth`.
3. Favicons são assets estáticos em `public/`.
4. Logo oficial em `public/branding/barbergestor/`.

## Uso de Assets, Ícones e Logos

1. Ícones: usar Lucide React (`import { Scissors } from 'lucide-react'`).
2. Logos dinâmicos vêm da API via `logoUrl`.
3. Favicons são arquivos estáticos linkados no `<head>` do `index.html`.
4. Assets estáticos (imagens, SVGs) em `public/`.

## Build

```bash
cd frontend
npm run build          # Gera dist/
npx vite build         # Alternativa direta
```
