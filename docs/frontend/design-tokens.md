# Design Tokens — Referência Canônica

> **Fonte da verdade:** `frontend/src/components/design-system/tokens/index.css`
> Este documento é um **cheat sheet humano** dos tokens — para mudar valores, edite o CSS, não este arquivo.

---

## 1. Como usar (regra de ouro)

```jsx
// ✅ CORRETO — sempre via CSS variable
<div style={{ background: 'var(--bg-elevated)', padding: 'var(--space-4)' }} />

// ❌ ERRADO — hardcoded
<div style={{ background: '#111821', padding: '16px' }} />
```

Em CSS:

```css
.minha-classe {
  color: var(--text-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

Componentes do DS já usam tokens internamente. Ao criar novo componente,
**nunca hardcode** valores. Se um valor não existir como token, **adicione ao
`tokens/index.css`** antes de usar.

## 2. Backgrounds

| Token | Valor | Uso |
|---|---|---|
| `--bg-primary` | `#07090d` | Fundo da página |
| `--bg-secondary` | `#0c1017` | Fundo de seção alternativa |
| `--bg-elevated` | `#111821` | Cards e painéis |
| `--bg-surface` | `rgba(14, 18, 24, 0.96)` | Modais, dropdowns |
| `--bg-glass` | `rgba(14, 18, 24, 0.85)` | Glassmorphism (uso restrito) |
| `--bg-overlay` | `rgba(7, 9, 13, 0.8)` | Overlay de modal |

## 3. Accent (cor principal — tenant-aware)

| Token | Valor | Uso |
|---|---|---|
| `--accent-primary` | `#a3ff12` | CTAs, highlights, links |
| `--accent-secondary` | `#7fe11e` | Hover, estados secundários |
| `--accent-muted` | `rgba(163, 255, 18, 0.12)` | Backgrounds suaves de destaque |
| `--accent-glow` | `rgba(163, 255, 18, 0.2)` | Sombras/glow |

> Tokens `--theme-*` (linhas 131–137 do arquivo) sobrescrevem em runtime via `useTenantTheme()`
> conforme a empresa logada. Use `--theme-primary` quando a cor deve refletir o branding do tenant.

## 4. Status

| Token | Valor | Uso |
|---|---|---|
| `--success` / `--success-bg` | `#22c55e` / 12% | Sucesso, confirmação |
| `--warning` / `--warning-bg` | `#f4c86c` / 12% | Aviso, atenção |
| `--danger` / `--danger-bg` | `#fb7185` / 12% | Erro, destrutivo |
| `--info` / `--info-bg` | `#3b82f6` / 12% | Informativo |

## 5. Texto

| Token | Valor | Uso |
|---|---|---|
| `--text-primary` | `#f8fafc` | Conteúdo principal |
| `--text-secondary` | `#d4dee8` | Texto de apoio |
| `--text-muted` | `#7a8a9b` | Labels, hints |
| `--text-disabled` | `#4b5563` | Estados desabilitados |
| `--text-accent` | `var(--accent-primary)` | Links, ênfase |

## 6. Bordas e raios

| Token | Valor | Uso |
|---|---|---|
| `--border-subtle` | `rgba(148, 163, 184, 0.08)` | Divisores leves |
| `--border-default` | `rgba(148, 163, 184, 0.14)` | Bordas de cards/inputs |
| `--border-strong` | `rgba(148, 163, 184, 0.24)` | Bordas com mais peso |
| `--border-accent` | `rgba(163, 255, 18, 0.4)` | Estados ativos/foco |
| `--radius-xs` | `6px` | Tags, badges pequenas |
| `--radius-sm` | `8px` | Inputs, botões pequenos |
| `--radius-md` | `12px` | Botões padrão |
| `--radius-lg` | `16px` | Cards |
| `--radius-xl` | `20px` | Cards grandes |
| `--radius-2xl` | `24px` | Hero cards |
| `--radius-full` | `9999px` | Avatares, pills |

## 7. Sombras

| Token | Valor | Uso |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.3)` | Elevação mínima |
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.35)` | Card padrão |
| `--shadow-md` | `0 8px 24px rgba(0,0,0,0.4)` | Card destacado |
| `--shadow-lg` | `0 16px 48px rgba(0,0,0,0.5)` | Modais |
| `--shadow-xl` | `0 24px 64px rgba(0,0,0,0.6)` | Drawers |
| `--shadow-glow` | `0 0 32px var(--accent-glow)` | Hover em CTAs premium |
| `--shadow-inner` | `inset 0 2px 4px rgba(0,0,0,0.2)` | Inputs em foco |

## 8. Tipografia

| Token | Valor |
|---|---|
| `--font-family` | `'Inter', system-ui sans-serif fallbacks` |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', monospace` |
| `--font-size-xs` → `--font-size-4xl` | `11px → 13 → 15 → 17 → 20 → 24 → 32 → 40px` |
| `--font-weight-normal/medium/semibold/bold` | `400 / 500 / 600 / 700` |
| `--line-height-tight/normal/relaxed` | `1.25 / 1.5 / 1.625` |
| `--letter-spacing-tight/normal/wide` | `-0.02em / 0 / 0.02em` |

**Regras:**
- Body text: `--font-size-base` (15px) com `--line-height-normal`
- Display: `--font-size-3xl`/`4xl` com `--letter-spacing-tight`
- Labels/captions: `--font-size-xs`/`sm` com `--letter-spacing-wide`

## 9. Espaçamento (escala 4px)

| Token | Valor |
|---|---|
| `--space-0` | `0` |
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |
| `--space-16` | `64px` |

## 10. Layout

| Token | Valor | Uso |
|---|---|---|
| `--sidebar-width` | `260px` | Sidebar expandida |
| `--sidebar-collapsed-width` | `72px` | Sidebar colapsada |
| `--topbar-height` | `64px` | Altura da topbar |
| `--content-max-width` | `1400px` | Largura máxima do conteúdo |

## 11. Transições

| Token | Valor | Uso |
|---|---|---|
| `--transition-fast` | `150ms ease` | Hover, foco |
| `--transition-normal` | `250ms ease` | Mudanças de estado |
| `--transition-slow` | `400ms ease` | Entrada/saída de modais |
| `--transition-spring` | `400ms cubic-bezier(0.34, 1.56, 0.64, 1)` | Bounce/playful |

## 12. Z-Index

| Token | Valor | Uso |
|---|---|---|
| `--z-base` | `0` | Camada base |
| `--z-dropdown` | `100` | Dropdowns |
| `--z-sticky` | `200` | Sidebar fixa |
| `--z-fixed` | `300` | Header fixo |
| `--z-overlay` | `400` | Overlay de modal |
| `--z-modal` | `500` | Modal em si |
| `--z-toast` | `600` | Toast (acima de tudo) |

## 13. Breakpoints

| Token | Valor | Categoria |
|---|---|---|
| `--bp-sm` | `480px` | Mobile L |
| `--bp-md` | `768px` | Tablet |
| `--bp-lg` | `1024px` | Desktop S |
| `--bp-xl` | `1280px` | Desktop |
| `--bp-2xl` | `1536px` | Desktop L |

Em media queries, **prefira mobile-first**:

```css
.elemento { /* estilos mobile */ }
@media (min-width: 768px) { .elemento { /* tablet+ */ } }
@media (min-width: 1024px) { .elemento { /* desktop+ */ } }
```

## 14. Tokens duplicados (limpeza pendente)

Há tokens definidos em outros arquivos que precisam ser **consolidados**:

| Arquivo | O que tem | Status |
|---|---|---|
| `frontend/src/components/design-system/tokens/index.css` | **CANÔNICO** | ✅ Usar este |
| `frontend/src/styles/premium-tokens.css` | Tokens legados | ⏳ Migrar e deletar |
| `frontend/src/pages/barbergestor/tokens/{colors,spacing,typography,animations}.css` | Tokens da landing page pública | ⚠️ Escopo isolado — manter por enquanto, considerar unificar depois |
| `frontend/src/styles/compatibility.css` | Aliases de tokens legados (`--barber-*` → `--*`) | ✅ Manter até migração concluída (ver `styles/conflict-map.js`) |

## 15. Adicionar novo token

1. Avalie se o valor pode ser composto a partir de tokens existentes (preferível).
2. Se realmente novo, edite `components/design-system/tokens/index.css` na seção correta.
3. Atualize este documento (`design-tokens.md`) na seção correspondente.
4. Use em componentes via `var(--seu-token)`.
5. **Nunca** hardcode o valor depois de adicionar o token.
