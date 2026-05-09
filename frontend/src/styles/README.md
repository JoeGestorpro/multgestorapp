/**
 * ============================================
 * CSS COEXISTENCE STRATEGY
 * ============================================
 * 
 * Arquivo central de documentação da estratégia
 * de coexistência entre Barber.css e Design System
 * 
 * Created: 2026-05-09
 * Status: ACTIVE
 * 
 * ============================================
 */

# CSS COEXISTENCE STRATEGY

## Visão Geral

Durante a migração gradual do BarberGestor para o novo Design System,
existem dois sistemas de CSS coexistindo:

1. **Barber.css** (legacy) - ~7563 linhas, ~300KB
2. **Design System** (novo) - ~2000 linhas, modular

## Arquitetura de CSS

```
styles/
├── globals.css              # Reset e base
├── compatibility.css        # Tokens unificados
├── ds-encapsulation.css     # CSS isolation
├── conflict-map.js          # Documentação de conflitos
└── migration-guide.css      # Guia de migração

pages/
├── Barber.css               # Estilos legacy (~7563 linhas)
└── Barber.jsx               # Componente principal

components/
└── design-system/          # CSS modular (~178 classes .ds-*)
    ├── tokens/
    ├── ui/
    ├── layout/
    └── feedback/
```

## Ordem de Import

1. `globals.css` - Reset básico
2. `Barber.css` - Estilos legacy (carrega primeiro)
3. `compatibility.css` - Tokens unificados
4. `ds-encapsulation.css` - Isolamento DS
5. CSS do Design System - Vem nos componentes via import

**Resultado**: DS CSS vence por cascata.

## Tokens Unificados

### Backgrounds
| Token Barber | Token DS | Valor |
|-------------|----------|-------|
| --barber-bg | --bg-primary | #070a0d |
| --barber-bg-2 | --bg-secondary | #0c1017 |
| --barber-panel | --bg-surface | rgba(14,18,24,0.96) |

### Textos
| Token Barber | Token DS | Valor |
|-------------|----------|-------|
| --barber-text | --text-primary | #f8fafc |
| --barber-soft | --text-secondary | #d4dee8 |
| --barber-muted | --text-muted | #93a6b4 |

### Accent
| Token Barber | Token DS | Valor |
|-------------|----------|-------|
| --barber-accent | --accent-primary | ~#8cff4f |
| - | --accent-secondary | #7fe11e |

### Status
| Token DS | Valor |
|----------|-------|
| --success | #22c55e |
| --warning | #f4c86c |
| --danger | #fb7185 |
| --info | #3b82f6 |

## Classes de Prefixo

### Barber.css (Legacy)
- `.barber-*` - Classes legado
- Prefixo único, sem namespaces
- ~200+ classes

### Design System (Novo)
- `.ds-*` - Classes DS
- Ex: `.ds-card`, `.ds-button`, `.ds-badge`
- Encapsulated via !important em ds-encapsulation.css

## Conflitos Conhecidos

### Resolvidos
1. Button radius - Encapsulation resolve
2. Card background - Encapsulation resolve
3. Sidebar z-index - CSS vars harmony
4. Page padding - Contexto diferente

### Pendentes
1. Border-radius (24px vs 16px)
2. Accent color (8cff4f vs a3ff12)

## Estratégia de Migração

### Fase 1: Layout ✅
- Shell/Layout substituído
- Sidebar migrada
- Topbar migrada
- Nenhum conflito

### Fase 2: KPI Cards ⏳
- Substituir .barber-kpi-card por .ds-stat-card
- Usar encapsulation se necessário
- Testar visual

### Fase 3: Charts/Lists
- Manter estrutura, mudar classes
- Testar responsividade

### Fase 4: Services/Products
- Migrar cards de serviço
- Migrar formulários

### Fase 5: Polish
- Remover regras !important temporárias
- Simplificar CSS
- Limpar código morto

## Verificação

### Build
```bash
npm run build
# Deve compilar sem erros
```

### Console
```javascript
// Verificar:
// - Nenhum erro de CSS
// - Nenhum warning de specificity
```

### Visual
```bash
# Testar em:
// - 320px (mobile small)
// - 768px (tablet)
// - 1024px (desktop)
// - 1280px+ (large desktop)
```

## Rollback

Se algo quebrar durante migração:

1. Reverter import order
2. Manter classes antigas
3. Documentar problema
4. Corrigir offline

## Contato

Para dúvidas sobre estratégia CSS:
- Consultar `conflict-map.js`
- Consultar `migration-guide.css`
- Verificar `compatibility.css`