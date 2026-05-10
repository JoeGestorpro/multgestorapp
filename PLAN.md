# PLAN.md — BARBERGESTOR PREMIUM EXPERIENCE

## Projeto

MultGestor → módulo BarberGestor

## Objetivo Geral

Transformar o BarberGestor em uma experiência SaaS premium, personalizada para cada barbearia, com onboarding guiado, identidade visual dinâmica, dashboard moderno e experiência mobile-first.

O sistema deve deixar de parecer genérico e passar a transmitir sensação de:
- software próprio da barbearia
- profissionalismo
- sofisticação
- organização operacional
- alto valor percebido

---

# VISÃO ESTRATÉGICA

## Resultado Esperado

Quando o cliente entrar no BarberGestor, ele deve sentir:

> "Esse sistema foi feito para minha barbearia."

O sistema deve:
- usar identidade visual da empresa
- mostrar branding da barbearia
- ter onboarding guiado
- reduzir confusão no primeiro uso
- gerar efeito wow pós-compra
- aumentar retenção
- aumentar percepção de valor
- melhorar experiência operacional diária

---

# PILARES PRINCIPAIS

1. **Onboarding Premium** — Fluxo guiado pós-compra
2. **Personalização Visual** — Sistema assume identidade da barbearia
3. **Dashboard Premium** — Experiência operacional moderna
4. **Mobile First** — Experiência pensada para barbeiros usando celular
5. **Sensação SaaS Internacional** — UI moderna, limpa, rápida e refinada

---

# ESCOPO FUNCIONAL

---

# FASE 1 — FUNDAÇÃO VISUAL

## Objetivo

Criar base técnica da personalização visual.

---

## 1. Theme System por Tenant

### Criar estrutura:
- ThemeProvider
- useTenantTheme
- CSS Variables dinâmicas

### Responsabilidade:
Aplicar:
- logo
- nome da empresa
- cores
- branding
- wallpaper
- acentos visuais

---

## 2. Estrutura de tema

### Dados esperados da empresa

```ts
{
  company_id,
  company_name,
  logo_url,
  primary_color,
  secondary_color,
  accent_color,
  wallpaper_url,
  onboarding_completed
}
```

---

## 3. Arquivo de variáveis CSS

### Estrutura base

```css
/* styles/barber-theme.css */
:root {
  /* Padrão (fallback) */
  --bg-primary: #0f0f0f;
  --bg-secondary: #1a1a1a;
  --bg-card: #242424;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --accent: #d4af37;
  --accent-hover: #b8962f;
  --border: rgba(255,255,255,0.08);
  --shadow: 0 4px 6px rgba(0,0,0,0.3);

  /* Dinâmico (substituído via JS/ThemeProvider) */
  --theme-primary: var(--accent);
  --theme-secondary: var(--bg-secondary);
  --theme-border: color-mix(in srgb, var(--theme-primary) 20%, transparent);
  --theme-glow: color-mix(in srgb, var(--theme-primary) 30%, transparent);
}
```

---

## 4. Hook useTenantTheme

### Estrutura

```ts
// hooks/useTenantTheme.ts
const useTenantTheme = () => {
  const { company } = useAuth();

  const theme = useMemo(() => ({
    primary: company?.primary_color || '#d4af37',
    secondary: company?.secondary_color || '#1a1a1a',
    accent: company?.accent_color || '#b8962f',
    logo: company?.logo_url,
    name: company?.company_name,
    wallpaper: company?.wallpaper_url,
  }), [company]);

  return theme;
};
```

---

## 5. ThemeProvider

### Estrutura

```tsx
// context/ThemeContext.tsx
<ThemeProvider>
  <Shell>
    {children}
  </Shell>
</ThemeProvider>

// Aplica data-theme-primary no document.body
// Injeta CSS variables dinamicamente
```

---

## 6. Componentes afetados

- Shell (header, sidebar)
- Todos os cards (StatCard, ChartCard, BarberCard, etc)
- Botões primários
- Badges e highlights
- Links e CTAs
- Bordas e separadores

---

# FASE 2 — ONBOARDING PREMIUM

## Objetivo

Guia fluido pós-compra com wizard de configuração.

---

## 1. Tela de Boas-Vindas

### Estrutura:
- Logo da empresa em destaque
- Mensagem de parabéns
- Preview do dashboard (mock)
- Tempo estimado de configuração
- CTA principal: "Começar configuração"
- CTA secundário: "Ver demo primeiro"

### Emotional triggers:
- Animação de entrada com fade
- Logo com scale suave
- Música/ícone de celebração
- Progress preview

---

## 2. Wizard de Setup

### Etapas:

**Etapa 1: Sua Marca**
- Upload de logo (drag & drop)
- Preview ao vivo
- Nome da barbearia
- Cor primária (color picker)
- Cor secundária (opcional)
- Frase/slogan (opcional)

**Etapa 2: Seu Endereço**
- Campo de endereço (Google Places autocomplete)
- Telefone
- WhatsApp (com link direto)
- Horário de funcionamento (grid visual por dia)
- Mapa preview

**Etapa 3: Sua Equipe**
- Cadastro do dono/gerente (já pré-preenchido)
- Convite para colaboradores (email, link, QR code)
- Skip option clara

**Etapa 4: Seus Serviços**
- Serviço principal (sugestão baseada no tipo da barbearia)
- Preço + duração
- Adicionar mais ou "pular"
- Templates: "Barbearia clássica", "Barbearia moderna", "Barbearia + estética"

**Etapa 5: Configuração Completa**
- Celebração visual (confetti, badge)
- Resumo do que foi configurado
- CTA para primeiro atendimento
- Redirect para dashboard

---

## 3. Progresso Visual

### Barra de progresso:
- Visível durante todo wizard
- Etapas concluídas com checkmark
- Etapa atual destacada
- Etapas restantes com número

### Badge de conclusão:
- Badge "Barbearia configurada" no perfil
- Badge "Fundador" após primeira semana

---

## 4. Checklist de Setup

### Sidebar ou modal:
- Verificação visual do que está completo
- "Falta configurar" com destaque
- Sugestão da próxima etapa
- Acesso direto para cada item

---

# FASE 3 — DASHBOARD PREMIUM

## Objetivo

UI operacional moderna, clara e sofisticada.

---

## 1. Hero Card de Boas-vindas

### Estrutura:
- Saudação contextual (hora do dia)
- Logo da empresa
- Resumo rápido do dia
- Quick stats inline: atendimentos | faturamento | equipe
- CTA principal se vazio

### Exemplo:
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]                      Bom dia, Felipe                │
│                                                             │
│ Você tem 8 atendimentos hoje. Fature R$1.250,00.           │
│                                                             │
│ [8 hoje] [R$1.250] [4 na equipe]                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Seção de Agenda Rápida

### Desktop:
- Cards horizontais滑动
- Próximos 3-5 atendimentos
- Informações essenciais: cliente, horário, serviço
- Quick actions: confirmar, remarcar, cancelar

### Mobile:
- Swipeable cards
- Tap para expandir
- Ações principais via bottom sheet

---

## 3. Cards de Ranking

### Estrutura:
- Título + badge de posição
- Top 3 com destaque visual
- Posição, nome, valor
- Barra de progresso relativo
- Cor primária aplicada na borda/accents

### Animação:
- Entrada staggered
- Atualização com count-up suave

---

## 4. Gráficos Modernos

### Faturamento (7 dias):
- Bar chart com cantos arredondados
- Hover com tooltip estilizado
- Tema aplicado nas cores
- Altura mínima: 280px
- Responsive

### Mix de Pagamentos:
- Bar chart horizontal
- Percentual + valor
- Cores por método
- Labels claros

---

## 5. Atendimentos Recentes

### Card item:
- Avatar/iniciais do cliente
- Nome do serviço + cliente
- Colaborador
- Método de pagamento (badge colorido)
- Valor
- Data/hora

### Desktop: lista vertical com scroll suave
### Mobile: cards horizontais滑动

---

## 6. Empty States Premium

### Estrutura:
- Ilustração ou ícone customizado
- Título descritivo
- Descrição helpful
- CTA de ação

### Exemplos:
- "Nenhum atendimento hoje" + botão para novo
- "Sem colaboradores" + convite
- "Nenhum serviço" + adicionar
- "Sem vendas ainda" + registrar

---

## 7. Skeleton Loaders

### Implementação:
- Shimmer animation suave
- Formato idêntico ao conteúdo real
- Transição suave para conteúdo real

---

## 8. Micro-interações

### Estados:
- Hover: card lift (translateY -4px)
- Click: scale down sutil (0.98)
- Loading: skeleton shimmer
- Success: checkmark animation
- Error: shake + border red
- Update: count-up number

### Transições:
- Todas: 200ms ease-out
- Page transitions: fade + slide
- Modal: scale + fade

---

# FASE 4 — MOBILE FIRST

## Objetivo

Experiência premium para barbeiros usando celular.

---

## 1. Bottom Navigation

### Itens:
- Home (Dashboard)
- Agenda
- Caixa
- Stats
- Config

### Especificações:
- Altura: 64px
- Ícones: 24x24
- Touch target: 48x48
- Indicador ativo com cor primária

---

## 2. Header Mobile

### Estrutura:
- Menu hamburger (left)
- Logo + nome (center)
- Notificações + perfil (right)

### Especificações:
- Altura: 56px
- Sticky
- Blur background option

---

## 3. Quick Actions FAB

### Botão flutuante:
- Posição: bottom-right, 24px de margem
- Tamanho: 56x56
- Cor: primária
- Ícone: + (novo atendimento)
- Shadow elevado

---

## 4. Cards Mobile

### Estrutura otimizada:
- Full width
- Padding generoso (16px)
- Información essencial
- Ações inline ou bottom sheet
- Swipe gestures

### Swipe actions:
- Right: confirmar
- Left: remarcar/cancelar

---

## 5. Thumb Zone

### Zonas de toque:
- Zona primária: centro-inferior (ação principal)
- Zona secundária: cards interativos
- Zona de navegação: bottom nav

### Touch targets:
- Mínimo: 44x44px
- Recomendado: 48x48px

---

## 6. Pull to Refresh

### Implementação:
- Indicador de loading no topo
- Spinner com branding
- Feedback de atualização

---

## 7. Responsive Breakpoints

### Sistema:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Adaptação:
- Cards: 1 coluna mobile → 2-3 desktop
- Sidebar: drawer mobile → fixo desktop
- Grid: fluido mobile →固定 desktop

---

# FASE 5 — EXTRAS PREMIUM

## Objetivo

Diferenciais que aumentam percepção de valor.

---

## 1. Badge System

### Badges conquistáveis:
- 🎉 "Primeiro passo" — Após setup completo
- 🔥 "No ritmo" — 7 dias consecutivos de uso
- 💰 "Contador" — Primeiro R$1.000 em vendas
- 👥 "Expansão" — 5 colaboradores
- ⭐ "Excellence" — 100 atendimentos
- 🏆 "Veterano" — 1 ano de uso

### Exibição:
- Perfil do usuário
- Sidebar (opcional)
- Tela de boas-vindas

---

## 2. Confetti Celebrations

### Triggers:
- Setup completo
- Primeiro atendimento
- Marco de vendas
- Badge desbloqueado

### Implementação:
- Animação de 2-3 segundos
- Cores do tema da barbearia
- Não invasivo

---

## 3. Relatório de Progresso

### Weekly email ou in-app:
- "Sua semana: R$X em vendas"
- "+X atendimentos vs semana passada"
- "Top performer da equipe"
- "Serviço mais vendido"

---

## 4. Video Onboarding

### Conteúdo:
- Vídeo de 60 segundos de explicação
- Telas do sistema em uso real
- Narração ou texto animado
- Disponível para revisitar

---

## 5. Personalização de Wallpaper

### Opções:
- Padrão geométrico sutil
- Gradiente radial
- Foto da barbearia com blur
- Padrão noise texture
- Upload customizado

---

## 6. AI Theme Suggestions

### Funcionalidade:
- Sugerir tema baseado no nome da barbearia
- Paleta de cores harmônicas
- Exemplos visuais

---

## 7. Tutorial Interativo

### Funcionalidade:
- Tooltips nos principais elementos
- Spotlight highlighting
- Skip option
- Progresso salvo

---

# COMPONENTES A CRIAR

## Fase 1

| Componente | Arquivo | Descrição |
|------------|---------|------------|
| ThemeProvider | context/ThemeContext.tsx | Provider de tema |
| useTenantTheme | hooks/useTenantTheme.ts | Hook para acessar tema |
| ThemeStyles | components/ThemeStyles.tsx | Injeta CSS variables |
| CustomizableShell | components/CustomizableShell.tsx | Shell com tema |

---

## Fase 2

| Componente | Arquivo | Descrição |
|------------|---------|------------|
| WelcomeScreen | components/onboarding/WelcomeScreen.tsx | Tela de parabéns |
| SetupWizard | components/onboarding/SetupWizard.tsx | Wizard de configuração |
| StepBrand | components/onboarding/StepBrand.tsx | Etapa: marca |
| StepAddress | components/onboarding/StepAddress.tsx | Etapa: endereço |
| StepTeam | components/onboarding/StepTeam.tsx | Etapa: equipe |
| StepServices | components/onboarding/StepServices.tsx | Etapa: serviços |
| StepComplete | components/onboarding/StepComplete.tsx | Etapa: conclusão |
| ProgressBar | components/onboarding/ProgressBar.tsx | Barra de progresso |
| SetupChecklist | components/onboarding/SetupChecklist.tsx | Checklist lateral |

---

## Fase 3

| Componente | Arquivo | Descrição |
|------------|---------|------------|
| HeroWelcomeCard | components/barber/HeroWelcomeCard.tsx | Card de boas-vindas |
| ModernRankingCard | components/barber/ModernRankingCard.tsx | Card de ranking |
| SalesChartModern | components/barber/SalesChartModern.tsx | Gráfico moderno |
| RecentActivityCard | components/barber/RecentActivityCard.tsx | Atendimentos recentes |
| CustomEmptyState | components/common/CustomEmptyState.tsx | Estado vazio customizado |
| SkeletonLoader | components/common/SkeletonLoader.tsx | Loading skeleton |
| ConfettiCelebration | components/common/ConfettiCelebration.tsx | Celebração |

---

## Fase 4

| Componente | Arquivo | Descrição |
|------------|---------|------------|
| BottomNav | components/mobile/BottomNav.tsx | Navegação inferior |
| MobileHeader | components/mobile/MobileHeader.tsx | Header mobile |
| SwipeableCard | components/mobile/SwipeableCard.tsx | Card com swipe |
| QuickActionsFAB | components/mobile/QuickActionsFAB.tsx | Botão flutuante |
| BottomSheet | components/mobile/BottomSheet.tsx | Sheet inferior |

---

## Fase 5

| Componente | Arquivo | Descrição |
|------------|---------|------------|
| BadgeSystem | components/badges/BadgeSystem.tsx | Sistema de badges |
| BadgeCard | components/badges/BadgeCard.tsx | Card de badge |
| ProgressReport | components/reports/ProgressReport.tsx | Relatório de progresso |
| VideoPlayer | components/onboarding/VideoPlayer.tsx | Player de vídeo |
| TutorialSpotlight | components/tutorial/TutorialSpotlight.tsx | Tutorial interativo |

---

# ESTRUTURA DE ARQUIVOS

```
frontend/src/
├── context/
│   └── ThemeContext.tsx
├── hooks/
│   └── useTenantTheme.ts
├── components/
│   ├── ThemeStyles.tsx
│   ├── CustomizableShell.tsx
│   ├── common/
│   │   ├── CustomEmptyState.tsx
│   │   ├── SkeletonLoader.tsx
│   │   └── ConfettiCelebration.tsx
│   ├── onboarding/
│   │   ├── WelcomeScreen.tsx
│   │   ├── SetupWizard.tsx
│   │   ├── StepBrand.tsx
│   │   ├── StepAddress.tsx
│   │   ├── StepTeam.tsx
│   │   ├── StepServices.tsx
│   │   ├── StepComplete.tsx
│   │   ├── ProgressBar.tsx
│   │   └── SetupChecklist.tsx
│   ├── barber/
│   │   ├── HeroWelcomeCard.tsx
│   │   ├── ModernRankingCard.tsx
│   │   ├── SalesChartModern.tsx
│   │   └── RecentActivityCard.tsx
│   ├── mobile/
│   │   ├── BottomNav.tsx
│   │   ├── MobileHeader.tsx
│   │   ├── SwipeableCard.tsx
│   │   ├── QuickActionsFAB.tsx
│   │   └── BottomSheet.tsx
│   └── badges/
│       ├── BadgeSystem.tsx
│       └── BadgeCard.tsx
└── styles/
    ├── barber-theme.css
    └── variables.css
```

---

# BACKEND — ALTERAÇÕES NECESSÁRIAS

## Entidade Company

```sql
ALTER TABLE companies ADD COLUMN logo_url TEXT;
ALTER TABLE companies ADD COLUMN primary_color VARCHAR(7) DEFAULT '#d4af37';
ALTER TABLE companies ADD COLUMN secondary_color VARCHAR(7) DEFAULT '#1a1a1a';
ALTER TABLE companies ADD COLUMN accent_color VARCHAR(7) DEFAULT '#b8962f';
ALTER TABLE companies ADD COLUMN wallpaper_url TEXT;
ALTER TABLE companies ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN setup_progress INTEGER DEFAULT 0;
```

## Endpoints

```ts
// GET /api/company/:id/theme
// Retorna tema configurado da empresa

// PUT /api/company/:id/theme
// Atualiza tema da empresa

// PUT /api/company/:id/onboarding
// Marca onboarding como completo

// POST /api/company/:id/wizard
// Salva configuração do wizard
```

---

# ORDEM DE IMPLEMENTAÇÃO

## Sprint 1: Fundação Técnica
- ThemeProvider
- CSS Variables
- useTenantTheme hook
- Aplicar tema na Shell

## Sprint 2: Onboarding Core
- WelcomeScreen
- SetupWizard (4 etapas)
- ProgressBar
- API de save

## Sprint 3: Dashboard Premium
- HeroWelcomeCard
- ModernRankingCard
- SkeletonLoader
- EmptyStates
- Micro-interações

## Sprint 4: Mobile Foundation
- BottomNav
- Responsive cards
- SwipeableCard
- QuickActionsFAB

## Sprint 5: Celebrações
- ConfettiCelebration
- BadgeSystem
- ProgressReport
- VideoPlayer

## Sprint 6: Polish
- Tutorial interativo
- AI theme suggestions
- Wallpaper customizado
- Ajustes finais

---

# PRIORIDADES

## Alta Prioridade (Impacto imediato)
1. ThemeProvider + CSS Variables
2. Logo no header/sidebar
3. Onboarding Wizard
4. Empty states premium
5. Skeleton loaders

## Média Prioridade (Valor percebido)
1. Bottom navigation mobile
2. Quick actions FAB
3. Confetti celebrations
4. Badge system básico
5. Hero welcome card

## Baixa Prioridade (Diferencial)
1. Video onboarding
2. AI theme suggestions
3. Tutorial interativo
4. Wallpaper customizado
5. Gamificação avançada

---

# MATRIZ DE RISCO

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Performance com CSS vars | Média | Médio | Testar em dispositivos low-end |
| Conflito de tema | Baixa | Alto | Isolamento via CSS modules |
| Atraso no backend | Alta | Alto | Mockar dados no frontend inicialmente |
| Complexidade do wizard | Média | Médio | Dividir em etapas menores |
| Mobile performance | Alta | Médio | Lazy loading, code splitting |

---

# MÉTRICAS DE SUCESSO

## Quantitativas
- Taxa de conclusão do onboarding
- Tempo médio de configuração
- Taxa de retenção D7, D30
- NPS no primeiro uso
- % de usuários que personalizam cores

## Qualitativas
- Feedback "parece um sistema próprio"
- Redução de tickets de suporte
- Satisfação no onboarding
- Percepção de valor premium

---

# CHECKLIST DE QUALIDADE

- [ ] Tema se aplica corretamente a todos os componentes
- [ ] Logo aparece em todos os pontos estratégicos
- [ ] Onboarding não tem campos duplicados
- [ ] Wizard salva dados corretamente
- [ ] Empty states têm CTAs claros
- [ ] Skeleton loaders idênticos ao conteúdo real
- [ ] Mobile não tem overflow horizontal
- [ ] Touch targets >= 44px
- [ ] Animações suaves (60fps)
- [ ] Performance: LCP < 2.5s
- [ ] Accessibilidade: contraste WCAG AA

---

## Próximo Passo

Começar pela **FASE 1 — Sprint 1**:
- Criar ThemeProvider
- Criar hook useTenantTheme
- Criar arquivo de CSS Variables
- Aplicar logo no Shell/Header