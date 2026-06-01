# frontend-barbergestor-ui

> **Skill específica do vertical BarberGestor.** Para princípios gerais de design e UX, ver `frontend-design`. Para a fundação compartilhada (tokens, componentes, layout, padrões de tela), ver `docs/frontend/`.

## Stack Tecnológica

- **Framework:** React 19
- **Build Tool:** Vite 8
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Ícones:** Lucide React
- **Gráficos:** Recharts

## Design System (Frontend Foundation Layer)

A capability **Frontend Foundation Layer** é a fonte oficial de tokens, componentes e padrões. Telas do BarberGestor **consomem**, não redefinem.

### Fontes oficiais (em ordem de prioridade)

| Recurso | Localização | Doc |
|---|---|---|
| **Tokens** (cores, espaços, sombras, tipografia) | `frontend/src/components/design-system/tokens/index.css` | [`docs/frontend/design-tokens.md`](../../../docs/frontend/design-tokens.md) |
| **Componentes primitivos** (Button, Card, Badge, Input, Empty, Skeleton, …) | `frontend/src/components/design-system/` | [`docs/frontend/ui-components-catalog.md`](../../../docs/frontend/ui-components-catalog.md) |
| **Layout** (Shell, Sidebar, Topbar, grids, breakpoints) | `frontend/src/components/design-system/layout/` | [`docs/frontend/layout-standards.md`](../../../docs/frontend/layout-standards.md) |
| **Templates de tela** (CRUD, Dashboard, Settings, Empty, Erro, Loading) | — | [`docs/frontend/screen-patterns.md`](../../../docs/frontend/screen-patterns.md) |
| **Princípios** (UX, persona, acessibilidade) | — | [`docs/frontend/ux-principles.md`](../../../docs/frontend/ux-principles.md) + skill `frontend-design` |
| **Charter da capability** | — | [`docs/frontend/frontend-design-system.md`](../../../docs/frontend/frontend-design-system.md) |

### Regra fundamental

```jsx
// ✅ CORRETO — importar primitivas via barrel do DS
import { Button, Card, Badge, Input, Empty, Skeleton, Shell } from '../components/design-system'

// ✅ CORRETO — valores via CSS variable (tokens)
<div style={{ background: 'var(--bg-elevated)', padding: 'var(--space-4)' }} />

// ❌ ERRADO — hardcode de cor, espaçamento, tipografia
<div style={{ background: '#111821', padding: '16px' }} />

// ❌ ERRADO — usar primitivas legadas (Premium* ou BarberUI*) em código novo
import { PremiumButton } from '../components/premium/PremiumButton' // código morto (0 imports)
```

### Status do legado (a migrar — não usar em código novo)

| Legado | Substituir por | Status |
|---|---|---|
| `frontend/src/styles/premium-tokens.css` | `components/design-system/tokens/index.css` | ⏳ Migração pendente |
| `PremiumButton`, `PremiumBadge`, `PremiumTable`, `PremiumMetricCard`, `PremiumEmptyState`, `PremiumLoadingSkeleton`, `PremiumFilterBar`, `PremiumTabs`, `PremiumSidePanel`, `PremiumCustomerAvatar`, `PremiumActionButton` | DS primitives (`Button`, `Badge`, `Empty`, `Skeleton`, …) | ❌ Código morto (0 imports) — deletar em sprint dedicado |
| `BarberBadge`, `BarberButton`, `BarberCard`, `BarberEmptyState`, `BarberIcon` (em `components/barber/BarberUI.jsx`) | DS primitives | ⏳ 25 imports — migrar rota por rota |
| `BarberModal`, `BarberTable` (em `BarberUI.jsx`) | **Promover** ao DS como `<Modal>` e `<Table>` (não existem ainda) | ⏳ P1 — fazer antes da próxima tela que precise |

Ver inventário completo em [`docs/frontend/ui-components-catalog.md`](../../../docs/frontend/ui-components-catalog.md) §2.

## Padrão de Página

Toda página deve seguir o fluxo estrito:

```
Layout wrapper → AuthContext → API call → Estados
```

1. **Layout wrapper:** envolver com `<Shell>` (do DS). Para verticais futuros, manter o mesmo Shell — só muda a Sidebar interna.
2. **AuthContext:** consumir `useAuth()` ou `useBookingAuth()` para obter `company`, `user`, `token`.
3. **API call:** usar `api.get()` / `api.post()` (Axios instance com interceptors).
4. **Estados:** gerenciar com `useState` / `useReducer`.

Templates específicos por tipo de tela (CRUD, Dashboard, Configurações etc.) em [`docs/frontend/screen-patterns.md`](../../../docs/frontend/screen-patterns.md).

## Estados Obrigatórios

Toda página que faz fetch de dados deve implementar explicitamente os 3 estados, **usando primitivas do DS**:

| Estado | Componente DS | Fallback (legado a evitar) |
|---|---|---|
| `loading` | `<Skeleton>` / `<SkeletonGroup>` ou `<PageLoader>` (em `Suspense fallback`) | ~~`PremiumLoadingSkeleton`~~ |
| `empty` | `<Empty title="…" description="…" action={…} />` | ~~`PremiumEmptyState`~~, ~~`CustomEmptyState`~~, ~~`BarberEmptyState`~~ |
| `error` | `<Empty tone="danger" action={<Button>Tentar novamente</Button>}>` ou `<ErrorBoundary>` para falhas graves | toast simples (aceitável temporariamente) |

Detalhes em [`docs/frontend/screen-patterns.md`](../../../docs/frontend/screen-patterns.md) §9.

## Regras de Componente

- Componentes devem ser **puros** quando possível; lógica de side-effect em hooks customizados.
- Usar `React.lazy()` + `<ErrorBoundary>` para code-splitting de páginas pesadas (já implementado em `App.jsx`).
- **Ícones:** sempre `lucide-react`; nunca importar SVGs inline (exceto em `BrandingEngine`).
- **Gráficos:** usar `recharts` com componentes do DS (`<ChartCard>`, `<ChartTooltip>`, `<ChartEmptyState>`, `<ChartLoadingState>`) em `components/design-system/charts/`.
- **Tema do tenant:** usar `useTenantTheme()` para herdar cor/logo da empresa logada (sobrescreve `--accent-primary` via `--theme-primary` em runtime).

## Padrão de Rota

- Rotas protegidas devem verificar `requireActivePlan` e `requirePlanFeature` no backend; no frontend, redirecionar para `/escolher-plano` se necessário (já implementado via interceptor em `services/api.js`).
- Rotas de booking público (`/agendar/:slug/*`) não exigem auth, mas exigem `companySlug` válido.

## Antes de criar nova tela / componente

Cumprir a **Regra Zero** de `.agent/context/ai-operating-rules.md`:
1. Já existe componente equivalente no DS? Ver `docs/frontend/ui-components-catalog.md`.
2. Há template de tela? Ver `docs/frontend/screen-patterns.md`.
3. Qual capability do Core esta tela fortalece? Ver `docs/capabilities-map.md`.
4. Se algo realmente precisa ser criado, **criar no DS** (não solto em `pages/`).

## Dependências de Documentação

- `.agent/context/ai-operating-rules.md` (Regra Zero)
- `.agent/context/frontend-rules.md` (estrutura geral)
- `docs/frontend/*.md` (Foundation Layer — 6 docs)
- `.agent/skills/frontend-design/SKILL.md` (princípios profundos)
- `.agent/skills/web-design-guidelines/SKILL.md` (auditoria pós-implementação)
