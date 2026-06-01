# UI Components — Catálogo

> Inventário dos componentes reutilizáveis. Status auditado em 31/05/2026.
> **Regra:** antes de criar componente novo, verifique se já existe abaixo ou em
> `frontend/src/components/design-system/`.

---

## 1. Como usar

```jsx
import { Button, Card, Badge, Input, Empty, Skeleton, Shell } from '../components/design-system'
```

A entrada oficial é o barrel `frontend/src/components/design-system/index.js`.
**Nunca** importe direto de subpastas — sempre via barrel.

## 2. Status por componente

Legenda:
- ✅ **Existe** no DS, pronto para uso
- 🟡 **Parcial** — existe mas precisa evolução ou está duplicado
- ⏳ **Necessário** — não existe, precisa ser criado
- ❌ **Código morto** — existe mas com 0 usos; candidato a deletar

### 2.1 Primitivas (UI atômicas)

| Componente | Status | Onde mora | Variações | Notas |
|---|---|---|---|---|
| **Button** | ✅ | `design-system/ui/Button.jsx` | primary, secondary, ghost, danger, sizes (sm/md/lg) | Use `<Button variant="primary">`. Foco visível obrigatório |
| **Badge** | ✅ | `design-system/ui/Badge.jsx` | success, warning, danger, info, neutral | Tem paralelo `BarberBadge` (25 usos) — migrar |
| **Card** | ✅ | `design-system/ui/Card.jsx` | + `CardHeader`, `CardTitle`, `CardSubtitle`, `CardBody`, `CardFooter` | Sub-compostos permitem estrutura semântica |
| **StatCard** | ✅ | `design-system/ui/StatCard.jsx` | premium variant em `StatCard.premium.css` | Para KPIs (Hoje, Semana, Mês…) |
| **SummaryCard** | ✅ | `design-system/ui/SummaryCard.jsx` | + `SummaryItem` | Listas de métricas (label + valor) |
| **HeroCard** | ✅ | `design-system/ui/HeroCard.jsx` | — | Cabeçalho de página com gradiente |
| **Input** | ✅ | `design-system/ui/Input.jsx` | + `Textarea`, `Select` | Cobre formulários básicos |
| **Modal** | 🟡 | apenas `BarberModal` em `barber/BarberUI.jsx` | — | **Necessário** mover/criar `<Modal>` no DS |
| **Drawer** | 🟡 | apenas `mobile/BottomSheet.jsx` (mobile) e `premium/PremiumSidePanel.jsx` (desktop, 0 usos) | — | **Necessário** unificar como `<Drawer side="right">` no DS |
| **Table** | 🟡 | apenas `BarberTable` em `barber/BarberUI.jsx` | — | **Necessário** mover/criar `<Table>` no DS |
| **Tabs** | 🟡 | apenas `PremiumTabs` (0 usos) | — | **Necessário** criar `<Tabs>` no DS |
| **Toast** | ⏳ | não existe | — | **Necessário** — hoje cada tela mostra erro como string inline |
| **Alert** | ⏳ | não existe | — | **Necessário** — banner inline para mensagens de página |
| **Tooltip** | ⏳ | não existe | — | **Necessário** — usado nos charts via Recharts, mas sem componente DS |

### 2.2 Feedback / estados

| Componente | Status | Onde mora | Notas |
|---|---|---|---|
| **Empty** | ✅ | `design-system/feedback/Empty.jsx` | Há paralelos: `BarberEmptyState`, `PremiumEmptyState` (morto), `CustomEmptyState` — consolidar |
| **Skeleton** | ✅ | `design-system/feedback/Skeleton.jsx` + `SkeletonGroup` | Há paralelo `SkeletonLoader` e `PremiumLoadingSkeleton` (morto) |
| **Loading** | ✅ | `design-system/feedback/Skeleton.jsx` (export Loading) | Pode evoluir para `<Spinner>` separado |
| **PageLoader** | 🟡 | `components/PageLoader.jsx` (raiz) | Usado em `Suspense fallback`. OK no lugar atual |
| **ErrorBoundary** | ✅ | `components/ErrorBoundary.jsx` (raiz) | Envolve toda a app em `main.jsx` |

### 2.3 Layout / estrutura

| Componente | Status | Onde mora | Notas |
|---|---|---|---|
| **Shell** | ✅ | `design-system/layout/Shell.jsx` | Container principal. Envolve sidebar + topbar + conteúdo |
| **Sidebar** | ✅ | `design-system/layout/Sidebar.jsx` | Tenant-aware, colapsável |
| **Topbar** | ✅ | `design-system/layout/Topbar.jsx` | User menu, notifications, search |
| **PageHeader** | ⏳ | inline em cada page (`Barber.jsx` reusa via componente local) | **Necessário** extrair para DS |
| **SectionHeader** | ⏳ | inline | **Necessário** extrair |
| **BottomNav (mobile)** | ✅ | `components/mobile/BottomNav.jsx` | Navegação primária mobile |
| **MobileHeader** | ✅ | `components/mobile/MobileHeader.jsx` | Header mobile com drawer toggle |
| **QuickActionsFAB** | ✅ | `components/mobile/QuickActionsFAB.jsx` | FAB para ação primária em mobile |

### 2.4 Charts

| Componente | Status | Onde mora | Notas |
|---|---|---|---|
| **ChartCard** | ✅ | `design-system/charts/ChartComponents.jsx` | Wrapper de chart com título e ações |
| **ChartTooltip** | ✅ | idem | Tooltip customizado para Recharts |
| **ChartEmptyState** | ✅ | idem | Estado vazio dentro de chart |
| **ChartLoadingState** | ✅ | idem | Skeleton específico de chart |
| **ActivityList / ActivityItem** | ✅ | idem | Lista de atividade recente |
| **RankingList / RankingItem** | ✅ | idem | Ranking de colaboradores, top serviços etc. |

### 2.5 Domain composers (views compostas — não primitivas)

Estes **não** são candidatos a primitivas — são views compostas específicas
de domínio. Devem **consumir** as primitivas do DS.

| View | Status | Onde mora |
|---|---|---|
| `CrmDashboard` | 🟢 vivo | `components/premium/CrmDashboard.jsx` |
| `CustomerSidePanel` | 🟢 vivo | `components/premium/CustomerSidePanel.jsx` |
| `AppointmentHistoryView` | 🟢 vivo | `components/premium/AppointmentHistoryView.jsx` |
| `AgendaCrmView` | 🟢 vivo | `components/premium/AgendaCrmView.jsx` |
| `BookingAvailabilityView` | 🟢 vivo | `components/premium/BookingAvailabilityView.jsx` |
| `ServicesAnalyticsView` | 🟢 vivo | `components/premium/ServicesAnalyticsView.jsx` |

Recomendação: mover para `features/barber/views/` (junto com `DashboardView`, `CashierView` etc.) — pois são específicos do vertical, não compartilhados.

### 2.6 Código morto (deletar com segurança)

Auditoria com grep — **0 imports** no codebase:

| Componente | Onde |
|---|---|
| `PremiumButton` | `components/premium/PremiumButton.jsx` |
| `PremiumBadge` | `components/premium/PremiumBadge.jsx` |
| `PremiumTable` | `components/premium/PremiumTable.jsx` |
| `PremiumMetricCard` | `components/premium/PremiumMetricCard.jsx` |
| `PremiumEmptyState` | `components/premium/PremiumEmptyState.jsx` |
| `PremiumFilterBar` | `components/premium/PremiumFilterBar.jsx` |
| `PremiumTabs` | `components/premium/PremiumTabs.jsx` |
| `PremiumSidePanel` | `components/premium/PremiumSidePanel.jsx` |
| `PremiumCustomerAvatar` | `components/premium/PremiumCustomerAvatar.jsx` |
| `PremiumLoadingSkeleton` | `components/premium/PremiumLoadingSkeleton.jsx` |
| `PremiumActionButton` | `components/premium/PremiumActionButton.jsx` |

Recomendar deletar em sprint dedicado (mexer 11 arquivos + seus CSS, validar build).

### 2.7 Kit paralelo: BarberUI (25 imports — mais usado)

`frontend/src/components/barber/BarberUI.jsx` define em um único arquivo:

| Export | Equivalente DS | Decisão |
|---|---|---|
| `BarberBadge` | `Badge` (DS) | Migrar |
| `BarberButton` | `Button` (DS) | Migrar |
| `BarberCard` | `Card` (DS) | Migrar |
| `BarberModal` | (não existe no DS) | **Promover** ao DS como `<Modal>` |
| `BarberTable` | (não existe no DS) | **Promover** ao DS como `<Table>` |
| `BarberEmptyState` | `Empty` (DS) | Migrar |
| `BarberIcon` | (wrapper Lucide) | Manter ou substituir por uso direto de `lucide-react` |

Estratégia: migração gradual (rota por rota), não big-bang. Ver fase pendente no [`frontend-design-system.md`](./frontend-design-system.md) §7.

## 3. Convenções para componentes do DS

Ao criar/evoluir um componente no DS:

1. **Localização**: `components/design-system/<categoria>/<Nome>.jsx` + `<Nome>.css`
2. **Export**: adicionar ao `components/design-system/index.js`
3. **Props mínimos**: `className`, `children`, `variant`, `size` quando aplicável
4. **Acessibilidade**: aria-label, role, focus management, contraste WCAG AA
5. **Sem hardcode**: todos os valores via tokens (ver `design-tokens.md`)
6. **Responsivo**: testar em 320/768/1024/1280
7. **Documentar** neste catálogo (mover de `⏳ Necessário` para `✅`)

## 4. Próximos componentes prioritários (P0)

Baseado no que falta para padronizar telas existentes:

1. **`<Modal>`** — promover `BarberModal` ao DS (maioria das telas Barber usa)
2. **`<Table>`** — promover `BarberTable` ao DS
3. **`<PageHeader>`** — extrair padrão repetido em todas as telas
4. **`<Tabs>`** — necessário para CRM, configurações, dashboard
5. **`<Toast>`** — sistema de notificação global (hoje só mensagens inline)
6. **`<Alert>`** — banner inline para info/warning/error
