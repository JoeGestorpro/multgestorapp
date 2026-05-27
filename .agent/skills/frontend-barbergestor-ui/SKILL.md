# frontend-barbergestor-ui

## Stack Tecnológica

- **Framework:** React 19
- **Build Tool:** Vite 8
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Ícones:** Lucide React
- **Gráficos:** Recharts

## Design System

### Tokens CSS

- Tokens premium estão em `frontend/src/styles/premium-tokens.css`.
- Backgrounds ambientes estão em `frontend/src/styles/ambient-backgrounds.css`.
- **Regra:** nunca hardcode cores, espaçamentos ou tipografia diretamente em componentes. Sempre usar variáveis CSS dos tokens.

## Padrão de Página

Toda página deve seguir o fluxo estrito:

```
Layout wrapper → AuthContext → API call → Estados
```

1. **Layout wrapper:** envolver com `BarberLayout`, `BookingLayout` ou `Shell` conforme o domínio.
2. **AuthContext:** consumir `useAuth()` ou `useBookingAuth()` para obter `company`, `user`, `token`.
3. **API call:** usar `api.get()` / `api.post()` (Axios instance com interceptors).
4. **Estados:** gerenciar com `useState` / `useReducer`.

## Estados Obrigatórios

Toda página que faz fetch de dados deve implementar explicitamente os 3 estados:

| Estado | Comportamento |
|--------|---------------|
| `loading` | Mostrar `PremiumLoadingSkeleton` ou `PageLoader` |
| `empty` | Mostrar `PremiumEmptyState` com mensagem contextual |
| `error` | Mostrar `ErrorBoundary` ou toast de erro; logar no Sentry |

## Regras de Componente

- Componentes devem ser **puros** quando possível; lógica de side-effect em hooks customizados.
- Usar `React.lazy()` + `ErrorBoundary` para code-splitting de páginas pesadas.
- Ícones: **sempre** usar `lucide-react`; nunca importar SVGs inline exceto em `BrandingEngine`.
- Gráficos: usar `recharts` com tema customizado via `premium-tokens.css`.

## Padrão de Rota

- Rotas protegidas devem verificar `requireActivePlan` e `requirePlanFeature` no backend; no frontend, redirecionar para `/choose-plan` se necessário.
- Rotas de booking público (`/b/:slug/*`) não exigem auth, mas exigem `companySlug` válido.

## Dependências de Documentação

- `frontend-rules.md`
- `ui-patterns/component-patterns.md`
- `ui-patterns/state-management.md`
