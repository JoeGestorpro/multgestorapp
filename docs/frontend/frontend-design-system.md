# Frontend Foundation Layer — Charter

> Status: **OFICIAL** • Versão 1.0 • Criado: 31/05/2026
> Capability do Core: **Frontend Foundation Layer / UI Design System**
> Nível: mesmo das capabilities Shared Kernel, Multi-Tenant Engine, Event Bus, Integration Layer.

---

## 1. Propósito

Garantir **consistência visual, reuso, velocidade de desenvolvimento e identidade
única** em todos os módulos e verticais do MultGestor (BarberGestor hoje;
AgroGestor / PetGestor / AutoGestor no futuro).

Sem essa fundação, cada vertical reinventa botões, cards e layouts — e o produto
deixa de parecer "uma coisa só".

## 2. Por que existe (problema que resolve)

A auditoria de 31/05/2026 identificou **4 sistemas paralelos** de UI em uso:

| Sistema | Onde vive | Status real |
|---|---|---|
| **Design System (DS)** | `frontend/src/components/design-system/` | ✅ Canônico, **9 imports** ativos |
| **BarberUI** | `frontend/src/components/barber/BarberUI.jsx` | ⚠️ Legado vertical, **25 imports** (mais usado) |
| **Premium (primitivas)** | `frontend/src/components/premium/Premium*.jsx` | ❌ **Código morto** (0 imports de Button/Badge/Table/MetricCard/EmptyState) |
| **Premium (views)** | `frontend/src/components/premium/*View.jsx`, `CrmDashboard`, `CustomerSidePanel` | 🟢 Vivo como **views compostas** (não primitivas) |

Há também **tokens duplicados** em 3 locais e uma migração do `Barber.css` (legado, ~7563 linhas) para o DS que parou na Fase 1.

Essa capability existe para:
- **Eleger o DS como fonte única** de primitivas.
- **Documentar a migração** já iniciada (não jogar fora trabalho feito).
- **Bloquear duplicação futura** com regras explícitas de "verifique antes de criar".

## 3. Como se conecta ao Core

```
Shared Kernel  ┐
Multi-Tenant   │
Repository     │
Event Bus      ├──► Backend
Integration    │
Billing        ┘

Frontend Foundation Layer  ──► Frontend (toda tela, toda vertical)
  ├── Design Tokens         (cores, espaçamentos, tipografia, sombras)
  ├── UI Components         (Button, Card, Badge, Input, …)
  ├── Layout Standards      (Shell, Sidebar, Topbar, Grid)
  ├── Screen Patterns       (CRUD, Dashboard, Settings, …)
  └── UX Principles         (mobile-first, clareza, feedback)
```

A Foundation Layer é **horizontal** (todos os verticais consomem).
Verticais (Barber, Clima, futuros) **só compõem** — nunca redefinem primitivas.

## 4. Regra de ouro

> **Antes de criar qualquer tela ou componente novo, verificar:**
> 1. [`design-tokens.md`](./design-tokens.md) — token já existe?
> 2. [`ui-components-catalog.md`](./ui-components-catalog.md) — componente já existe?
> 3. [`layout-standards.md`](./layout-standards.md) — padrão de layout já existe?
> 4. [`screen-patterns.md`](./screen-patterns.md) — template de tela já existe?
> 5. [`docs/capabilities-map.md`](../capabilities-map.md) — qual capability do Core esta tela fortalece?

Se **não existir**, criar dentro do Design System (`components/design-system/`) — não solto em `pages/`.
Se **existir parcialmente**, evoluir o existente — não criar paralelo.

## 5. Limites e responsabilidades

| Decisão | Onde mora |
|---|---|
| Valor de cor, espaçamento, tipografia | `components/design-system/tokens/index.css` (canônico) |
| Componente primitivo (Button, Card…) | `components/design-system/ui/` |
| Layout app (Shell, Sidebar, Topbar) | `components/design-system/layout/` |
| Feedback (Empty, Skeleton, Loading) | `components/design-system/feedback/` |
| Charts | `components/design-system/charts/` |
| **View composta vertical** (CrmDashboard, AppointmentHistoryView) | `components/premium/` ou `features/<vertical>/views/` — compõe primitivas do DS |
| Princípios de design (UX, cor, tipografia, animação) | `.agent/skills/frontend-design/` (skill rica — **não duplicar**) |

## 6. Regras para novas telas

1. **Reutilizar** primitivas do DS (`import { Button, Card, … } from '../components/design-system'`)
2. **Não criar CSS solto** por tela — usar classes do DS e variáveis de token
3. **Não inventar** cores, espaçamentos ou tipografia — usar tokens existentes
4. **Mobile-first**: testar em 320px, 768px, 1024px, 1280px+
5. **Estados obrigatórios**: loading, empty, error (ver `screen-patterns.md`)
6. **Acessibilidade**: aria-labels, contraste WCAG AA, foco visível
7. **Identidade do tenant**: usar `useTenantTheme()` para herdar cor/logo da empresa

## 7. Migração em andamento

| Fase | Escopo | Status |
|---|---|---|
| 1 | Layout (Shell, Sidebar, Topbar) | ✅ Migrado para DS |
| 2 | KPI Cards (.barber-kpi-card → StatCard) | ⏳ Pendente |
| 3 | Charts e Lists | ⏳ Pendente |
| 4 | Services / Products / Forms | ⏳ Pendente |
| 5 | Polish (remover `!important`, código morto) | ⏳ Pendente |
| **+** | **BarberUI → DS** (25 imports a migrar) | ⏳ Não planejado ainda |
| **+** | **Premium primitivas (código morto)** — deletar `PremiumButton/Badge/Table/MetricCard/EmptyState/FilterBar/Tabs/SidePanel/CustomerAvatar/LoadingSkeleton/ActionButton` | ⏳ Limpeza segura (0 imports) |

Detalhes em [`frontend/src/styles/README.md`](../../frontend/src/styles/README.md) e [`conflict-map.js`](../../frontend/src/styles/conflict-map.js).

## 8. Documentos relacionados

- [`design-tokens.md`](./design-tokens.md) — referência canônica de tokens
- [`ui-components-catalog.md`](./ui-components-catalog.md) — inventário de componentes com status
- [`layout-standards.md`](./layout-standards.md) — Shell, Sidebar, Topbar, Grid
- [`screen-patterns.md`](./screen-patterns.md) — templates de tela (CRUD, Dashboard, Settings, …)
- [`ux-principles.md`](./ux-principles.md) — princípios + ponteiro para a skill `frontend-design`
- Skill `.agent/skills/frontend-design/` — princípios profundos (UX psychology, cor, tipografia, animação) — **NÃO duplicar conteúdo aqui**

## 9. Próximos passos recomendados

1. Adicionar a "regra de ouro" (§4) ao `.agent/context/ai-operating-rules.md` (item novo, 1 parágrafo)
2. Atualizar a skill `.agent/skills/frontend-barbergestor-ui/SKILL.md` para apontar `components/design-system/tokens/index.css` como fonte canônica de tokens (hoje aponta para `premium-tokens.css`, que é legado)
3. Iniciar **Sprint Design Foundation P0** (limpeza segura): deletar primitivas Premium de 0 imports + consolidar tokens em um único local
4. Planejar **Sprint Design Foundation P1**: migrar Fase 2-5 do `styles/README.md`
