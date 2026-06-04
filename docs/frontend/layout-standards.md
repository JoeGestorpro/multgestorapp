# Layout Standards

> Como toda tela do MultGestor deve se estruturar.
> Fonte da verdade: `frontend/src/components/design-system/layout/` (Shell, Sidebar, Topbar).

---

## 1. Estrutura padrão da aplicação

```
┌───────────────────────────────────────────────────────────┐
│  Topbar (height: --topbar-height = 64px, z: --z-fixed)    │
├──────────────┬────────────────────────────────────────────┤
│              │                                            │
│  Sidebar     │   Conteúdo principal                       │
│  (260px      │   (max-width: --content-max-width = 1400px)│
│   ou 72px    │   padding: --space-6 (= 24px)              │
│   colapsada) │                                            │
│              │                                            │
│              │   ┌──────────────────────────────────────┐ │
│              │   │  Page Header                          │ │
│              │   │  (título, breadcrumb, ações)          │ │
│              │   ├──────────────────────────────────────┤ │
│              │   │  Conteúdo da tela                     │ │
│              │   └──────────────────────────────────────┘ │
│              │                                            │
└──────────────┴────────────────────────────────────────────┘
```

Componente raiz: `<Shell>` de `components/design-system/layout/Shell.jsx`.

```jsx
import { Shell, Sidebar, Topbar } from '../components/design-system'

export default function MinhaPage() {
  return (
    <Shell sidebar={<Sidebar items={…} />} topbar={<Topbar title="…" />}>
      <PageHeader title="…" actions={…} />
      <PageContent />
    </Shell>
  )
}
```

## 2. Sidebar

**Estado:** expandida (260px) por padrão; colapsada (72px) por toggle do usuário.

| Item | Regra |
|---|---|
| Largura expandida | `var(--sidebar-width)` = 260px |
| Largura colapsada | `var(--sidebar-collapsed-width)` = 72px |
| Z-index | `var(--z-sticky)` = 200 |
| Background | `var(--bg-secondary)` |
| Borda direita | `1px solid var(--border-subtle)` |
| Ícones | Lucide React, 20px |
| Item ativo | Background `var(--accent-muted)` + texto `var(--accent-primary)` |
| Hover | Background `var(--bg-elevated)` |

**Mobile (< 768px):** sidebar vira drawer. Mostrar via toggle na Topbar.
Toque no overlay fecha o drawer.

## 3. Topbar

| Item | Regra |
|---|---|
| Altura | `var(--topbar-height)` = 64px |
| Z-index | `var(--z-fixed)` = 300 |
| Background | `var(--bg-surface)` |
| Border-bottom | `1px solid var(--border-subtle)` |
| Backdrop | `backdrop-filter: blur(12px)` (opcional, glass restrito) |
| Conteúdo padrão | Hamburger (mobile) → título → busca → notificações → user menu |
| Posicionamento | `position: sticky; top: 0` (não fixed — preserva scroll) |

## 4. Conteúdo principal

| Item | Regra |
|---|---|
| `max-width` | `var(--content-max-width)` = 1400px |
| `padding` | `var(--space-6)` (24px) em desktop |
| `padding` mobile (< 768px) | `var(--space-4)` (16px) |
| `padding-bottom` mobile | reservar `80px` se houver BottomNav |
| Centralização | `margin: 0 auto` dentro do Shell |
| Background | herda `var(--bg-primary)` |

## 5. Page Header (cabeçalho de tela)

Toda tela interna deve abrir com:

```jsx
<header className="page-header">
  <div className="page-header__breadcrumb">  {/* opcional */}
    <Link to="/parent">Parent</Link> › <span>Atual</span>
  </div>

  <div className="page-header__title-row">
    <h1>Título da tela</h1>
    <div className="page-header__actions">
      <Button variant="ghost">Secundária</Button>
      <Button variant="primary">Primária</Button>
    </div>
  </div>

  <p className="page-header__subtitle">Subtítulo descritivo (opcional)</p>
</header>
```

Regras:
- **Apenas um `<h1>` por tela** (acessibilidade)
- Breadcrumb só quando há hierarquia (> 2 níveis)
- Máximo 2 ações primárias na header (use overflow menu para mais)

## 6. Grids e seções

### Grid de cards (KPI, métricas)

```jsx
<section className="grid-stats">
  <StatCard {...} />
  <StatCard {...} />
  <StatCard {...} />
  <StatCard {...} />
</section>
```

| Breakpoint | Colunas |
|---|---|
| Mobile (< 480px) | 1 coluna |
| Mobile L (480px–768px) | 2 colunas |
| Tablet (768px–1024px) | 3 colunas |
| Desktop (1024px+) | 4 colunas |

`gap: var(--space-4)` (16px) entre cards.

### Grid de conteúdo principal + lateral

Para layouts "lista + detalhe":

```
┌────────────────────────┬──────────────────┐
│  Conteúdo (62%)        │  Detail (38%)    │
│  (proporção áurea)     │                  │
└────────────────────────┴──────────────────┘
```

Em mobile, empilhar (detail abre como drawer/modal).

## 7. Espaçamentos entre seções

| Contexto | Espaçamento |
|---|---|
| Entre seções principais | `var(--space-8)` (32px) |
| Entre cards dentro de seção | `var(--space-4)` (16px) |
| Entre linhas em formulário | `var(--space-4)` (16px) |
| Entre label e input | `var(--space-2)` (8px) |
| Padding interno de card | `var(--space-6)` (24px) desktop, `--space-4` mobile |

## 8. Comportamento mobile

**Mobile-first é obrigatório.** Testar nestes breakpoints:

| Viewport | Categoria | Validar |
|---|---|---|
| 320px | iPhone SE | Tudo legível, sem scroll horizontal |
| 480px | Mobile L | Cards começam a alinhar 2 colunas |
| 768px | Tablet | Sidebar pode aparecer; 3 colunas em grids |
| 1024px | Desktop S | Sidebar expandida por padrão; 4 colunas |
| 1280px+ | Desktop | Layout pleno |

**Adaptações mobile obrigatórias:**
- Sidebar → drawer (BottomSheet ou MobileHeader)
- BottomNav fixa (`components/mobile/BottomNav.jsx`) para navegação primária
- Topbar pode encolher (esconder busca, manter user menu)
- Touch targets mínimo 44×44px
- Padding lateral reduzido (`--space-4` em vez de `--space-6`)

## 9. Anti-patterns (não faça)

- ❌ `position: fixed` em conteúdo que não é overlay (quebra scroll)
- ❌ `width: 100vw` (causa scroll horizontal em mobile com scrollbar)
- ❌ Hardcode de larguras de sidebar/topbar (use tokens)
- ❌ Múltiplos `<h1>` na mesma tela
- ❌ Padding/margin com px direto (use tokens `--space-*`)
- ❌ Z-index "mágico" (use tokens `--z-*`)
- ❌ Layouts que não funcionam em 320px

## 10. Templates de layout por tipo de tela

Ver [`screen-patterns.md`](./screen-patterns.md) para templates específicos:
- CRUD (lista + formulário)
- Dashboard (KPIs + gráficos)
- Configurações (sidebar interna + form)
- Lista com filtros
- Detalhe
- Onboarding
- Página vazia
- Erro
- Carregamento
