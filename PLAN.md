# Plan.md — Agenda Online Pública Premium (BookingFlow)

> **Foco:** Reformular a página pública de agendamento (`/agendar/:slug`) em uma landing page premium da barbearia + fluxo de reserva.

---

## 1. Diagnóstico do Problema Atual

### O que funciona hoje:
- Fluxo de etapas funcional (serviço → profissional → data/hora → resumo → auth → sucesso)
- Tema escuro com verde neon (#a3ff12)
- CSS com glassmorphism já implementado
- Login, cadastro e perfil migrados para tema consistente

### O que está RUIM:

| Problema | Impacto |
|----------|---------|
| Tela parece formulário genérico | Cliente não sente que está na barbearia |
| Sem identidade visual da barbearia | Apenas o nome no header, sem apresentação |
| Sem hero/banner | Primeira impressão fraca, zero impacto visual |
| Sem informações de contato/local | Cliente não vê endereço, WhatsApp, horários |
| Desktop = mobile esticado | Não aproveita espaço em tela grande |
| Zero diferenciais visuais | Não há fotos, descrição, selos de qualidade |
| Dados limitados do backend | API retorna só `{ id, name, slug }` da empresa |

### Estado atual do backend:

**API `GET /barber/public/:slug/booking-info`** retorna:
```json
{
  "company": { "id": "...", "name": "Barbearia X", "slug": "barbearia-x" },
  "services": [{ id, name, description, price, icon, estimated_time_minutes }],
  "collaborators": [{ id, name, nickname, avatar_url, available_for_booking }],
  "settings": { timezone, slot_interval_minutes, ... }
}
```

**Tabela `companies`** possui apenas: `id`, `name`, `niche_type`, `status`, `created_at`, `public_booking_slug` — sem `description`, `banner_url`, `logo_url`, `phone`, `address`, `instagram`, `working_hours`, `gallery`.

**Estratégia:** Usar fallbacks/mocks no frontend, estrutura preparada para quando o backend fornecer dados reais.

---

## 2. Proposta de Layout

### Mobile (primeiro):
```
┌──────────────────────────┐
│  🖼️ HERO/BANNER          │
│   Nome da Barbearia      │
│   "Sua barbearia..."     │
│   [💈 Agendar Horário]   │  ← CTA principal
├──────────────────────────┤
│ 📍 Informações           │  ← Cards: endereço, WhatsApp, horários
│ 🏆 Diferenciais          │  ← "Profissionais experts", "Ambiente premium"
│ 👨‍💼 Equipe               │  ← Avatares dos profissionais
│ 💈 Serviços/Preços       │  ← Preview dos serviços
├──────────────────────────┤
│   [💈 Agendar Horário]   │  ← Botão CTA no fim (ou fixo)
└──────────────────────────┘
```
Após clicar "Agendar", entra no fluxo de etapas atual, mas com visual refinado.

### Desktop (≥ 1024px):

```
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────────┐  ┌────────────────────────┐ │
│ │      HERO/BANNER        │  │  📋 AGENDAMENTO        │ │
│ │      Nome + tagline     │  │  ┌──────────────────┐  │ │
│ │      [Agendar]          │  │  │ 1. Serviço       │  │ │
│ │                         │  │  │ 2. Profissional  │  │ │
│ │      📍 Informações     │  │  │ 3. Data/Hora     │  │ │
│ │      🏆 Diferenciais    │  │  │ 4. Resumo        │  │ │
│ │      👨‍💼 Equipe         │  │  │    [Confirmar]   │  │ │
│ │      🖼️ Galeria         │  │  └──────────────────┘  │ │
│ │                         │  │  sidebar sticky        │ │
│ └─────────────────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Estrutura Desktop (Split Layout)

```
Desktop (≥ 1024px)
├── .booking-desktop-layout (display: grid; grid-template-columns: 1fr 460px;)
│   ├── .booking-landing (left column, scroll)
│   │   ├── .booking-landing-hero     → Hero image + overlay + CTA
│   │   ├── .booking-landing-info     → Grid 2x2 info cards
│   │   ├── .booking-landing-about    → Descrição da barbearia
│   │   ├── .booking-landing-diffs    → Diferenciais com ícones
│   │   ├── .booking-landing-team     → Avatares da equipe
│   │   └── .booking-landing-gallery  → Grid de fotos
│   │
│   └── .booking-side-card (sticky top: 24px)
│       ├── Mini header "Agende seu horário"
│       ├── Step indicator (progresso)
│       └── Conteúdo do step atual (reutilizar BookingFlow steps)
│           ├── Serviço
│           ├── Profissional
│           ├── Data/Hora
│           ├── Resumo
│           ├── Auth
│           └── Sucesso
```

---

## 4. Estrutura Mobile

```
Mobile (< 1024px)
├── .booking-mobile-layout
│   ├── .booking-mobile-hero (full viewport height)
│   │   ├── Banner imagem de fundo com gradiente overlay
│   │   ├── Nome + descrição + tagline
│   │   └── CTA "Agendar Horário"
│   │
│   ├── .booking-landing-content (scrollável)
│   │   ├── Info cards (2 colunas)
│   │   ├── Sobre
│   │   ├── Diferenciais
│   │   ├── Equipe
│   │   └── Galeria
│   │
│   └── .booking-mobile-cta (botão fixo inferior)
│       └── "Agendar Horário" → abre fluxo de etapas
│
└── .booking-flow-panel (quando ativo)
    ├── Header com "Voltar" + nome da barbearia
    └── Steps (serviço, profissional, data/hora, resumo, auth, sucesso)
```

---

## 5. Componentes a Criar/Alterar

### Novos componentes em `frontend/src/pages/booking/`:

| Componente | Descrição |
|------------|-----------|
| `BookingLanding.data.js` | Dados mockados/fallback + constantes |
| `BookingLandingHero.jsx` | Banner hero responsivo (full/mobile) |
| `BookingLandingInfo.jsx` | Cards de informações (endereço, WhatsApp, etc) |
| `BookingLandingAbout.jsx` | Seção "Sobre a barbearia" |
| `BookingLandingDifferentials.jsx` | Grid de diferenciais com ícones |
| `BookingLandingTeam.jsx` | Preview da equipe |
| `BookingLandingGallery.jsx` | Galeria de fotos (mock) |
| `BookingSideCard.jsx` | Sidebar sticky do fluxo de agendamento (desktop) |
| `BookingDesktopLayout.jsx` | Container split layout desktop |
| `BookingMobileLayout.jsx` | Container hero + conteúdo + CTA mobile |

### Arquivos a modificar:

| Arquivo | Mudança |
|---------|---------|
| `BookingFlow.jsx` | Adicionar modo `LANDING` vs `BOOKING`; renderizar landing antes das etapas |
| `BookingFlow.css` | ~800 linhas novas: hero, info cards, diferenciais, equipe, galeria, split layout, side card, mobile flow |

### NÃO modificar:
- `BookingLogin.jsx`, `BookingSuccess.jsx`, `PublicBookingSignup.jsx`, `BookingProfile.jsx` (já migrados, intactos)
- Backend (dados mockados no frontend por enquanto)
- Lógica de agendamento existente (serviço, profissional, slot, resumo, auth)

---

## 6. Dados Mockados/Fallback

Criar `BookingLanding.data.js`:

```js
export const FALLBACK_COMPANY = {
  description: 'Há mais de 10 anos transformando o visual dos nossos clientes com estilo, tradição e modernidade.',
  banner_url: '/assets/hero-bg.jpg',
  logo_url: null,
  phone: '(11) 99999-9999',
  whatsapp: '5511999999999',
  address: 'Rua Exemplo, 123 - Centro',
  instagram: '@barbearia',
  working_hours: [
    { day: 'Seg-Sex', hours: '08:00 - 19:00' },
    { day: 'Sáb', hours: '08:00 - 17:00' },
    { day: 'Dom', hours: 'Fechado' },
  ],
  rating: 4.8,
  reviews_count: 127,
  gallery: [/* URLs mock */],
  differentials: [
    { icon: 'star', title: 'Profissionais Experts', desc: 'Equipe certificada com anos de experiência' },
    { icon: 'shield', title: 'Ambiente Premium', desc: 'Espaço climatizado e confortável' },
    { icon: 'clock', title: 'Pontualidade', desc: 'Respeitamos seu horário' },
    { icon: 'spray', title: 'Produtos Importados', desc: 'Linha profissional importada' },
  ]
}
```

**Estrutura preparada para dados reais** — quando o backend fornecer estes campos, basta substituir `FALLBACK_COMPANY` pelos dados da API.

---

## 7. Plano de Implementação Seguro

### Fase 1: Estrutura de dados
1. Criar `BookingLanding.data.js` com fallbacks e helpers
2. Criar hook `useLandingData` que mescla API + fallback

### Fase 2: Hero + Info Cards
3. Criar `BookingLandingHero.jsx` — banner full-width com gradiente, nome, CTA
4. Criar `BookingLandingInfo.jsx` — grid 2x2 de info cards com ícones
5. Adicionar CSS correspondente

### Fase 3: Sobre + Diferenciais + Equipe
6. Criar `BookingLandingAbout.jsx` — seção de descrição
7. Criar `BookingLandingDifferentials.jsx` — 4 cards com ícone + título + descrição
8. Criar `BookingLandingTeam.jsx` — grid de avatares dos colaboradores

### Fase 4: Split Layout Desktop
9. Criar `BookingDesktopLayout.jsx` — grid 2 colunas
10. Criar `BookingSideCard.jsx` — container sticky com steps
11. Modificar `BookingFlow.jsx` para renderizar landing ou steps baseado em estado `showBooking`

### Fase 5: Mobile Flow
12. Criar `BookingMobileLayout.jsx` — hero + conteúdo + CTA fixo
13. Integrar com `BookingFlow.jsx` — ao clicar CTA, mostrar steps

### Fase 6: Refinamento
14. Galeria (`BookingLandingGallery.jsx`)
15. Animações de scroll (reveal)
16. Testes responsivos e build final

---

## 8. Checklist de Testes

- [ ] Build sem erros (`npm run build`)
- [ ] Mobile: hero aparece primeiro, CTA leva ao fluxo de etapas
- [ ] Desktop: layout split, side card sticky
- [ ] Fluxo completo de agendamento funciona (serviço → profissional → data/hora → resumo → auth → sucesso)
- [ ] Login/Cadastro com tema consistente
- [ ] Tela de sucesso com animação de celebração
- [ ] Responsivo: 320px, 640px, 768px, 1024px, 1440px
- [ ] Botão "Voltar" funciona em todas as etapas
- [ ] Fallback visual quando API não retorna dados
- [ ] Scroll suave e animações não travam (testar `prefers-reduced-motion`)
- [ ] Nenhuma regressão na agenda interna do barbeiro

---

## 9. Regras de Implementação

1. **Não quebrar backend ou APIs existentes** — fallbacks no frontend
2. **Não remover etapas atuais** — apenas reorganizar e embrulhar
3. **Dados mockados são provisórios** — estruturar para fácil migração quando backend fornecer
4. **Mobile-first** em todas as decisões de layout
5. **Priorizar CSS puro sobre JS** para animações e transições
6. **Manter acessibilidade** (aria-labels, contraste, foco visível)
7. **Código limpo e comentado em português** — fácil de manter

---

## 10. Refinamentos Visuais Pós-Implementação da Agenda Online

> Seção adicionada após a conclusão das 6 fases do plano original.
> Refinamentos aplicados exclusivamente no frontend para elevar o padrão visual da landing page.

### 10.1 Hero com informações da barbearia

O hero exibe agora, além do nome e tagline:

- **Endereço** — ícone `home` + texto do endereço (fallback: "Endereço não informado")
- **Horário de funcionamento** — ícone `clock` + dia/hora do primeiro período cadastrado
- **Avaliação** — estrelas douradas com rating (ex: ★★★★☆ 4.8) + número de avaliações

As informações aparecem em uma row flexível entre a tagline e o CTA, melhorando a primeira impressão e entregando dados úteis sem scroll.

**Arquivos alterados:**
- `BookingLandingHero.jsx` — adicionado bloco `.booking-hero-info` com itens dinâmicos
- `BookingFlow.css` — classes `.booking-hero-info`, `.booking-hero-info-item`, `.booking-hero-rating`, `.booking-hero-stars`

### 10.2 Imagem de fundo/banner com fallback elegante

Se a empresa não possui `banner_url`, o hero usa uma imagem de fallback do Unsplash (landscape de barbearia). O gradiente escuro `rgba(7,9,13,0.2) → rgba(7,9,13,0.75) → var(--bf-bg)` garante legibilidade do texto mesmo em imagens claras. O overlay com grid sutil de linhas verdes neon adiciona textura premium.

**Imagem de fallback alterada** para não conflitar com a galeria (antes usava a mesma foto).

**Arquivos alterados:**
- `BookingLandingHero.jsx` — constante `HERO_BG` alterada para `photo-1558618666-fcd25c85f82e`
- `BookingLanding.data.js` — primeiro item do `MOCK_GALLERY` alterado para `photo-1596728325488-58c87691e9af`

### 10.3 Divisores visuais entre seções

Criado componente `.booking-section-divider` — um `<hr>` com gradiente horizontal `transparent → var(--bf-border) → transparent` que separa visualmente cada bloco da landing:

```
Hero → divisor → Info Cards → divisor → Sobre → divisor →
Diferenciais → divisor → Equipe → divisor → Galeria
```

Isso elimina o aspecto de "lista plana" e dá ritmo visual à página.

**Arquivos alterados:**
- `BookingDesktopLayout.jsx` — adicionados 5 divisores entre seções
- `BookingMobileLayout.jsx` — adicionados 5 divisores entre seções
- `BookingFlow.css` — classe `.booking-section-divider` com `<hr>` gradiente e responsividade

### 10.4 Seção "Sobre a barbearia" mais decorada

- Ícone decorativo de aspas (`<svg>` quote path) em verde neon com opacidade 30%
- Parágrafo com `border-left` sutil (2px) e `padding-left` para efeito de citação
- Layout preservado: título + texto, mas com tratamento editorial premium

**Arquivos alterados:**
- `BookingLandingAbout.jsx` — adicionado `.booking-about-quote` com SVG
- `BookingFlow.css` — classes `.booking-about-quote` e `p` com borda esquerda

### 10.5 Galeria responsiva

Em telas ≤ 640px, a galeria muda de `grid-template-columns: repeat(2)` com primeiro item oculto para `repeat(2)` com primeiro item ocupando `grid-column: 1 / -1` e `aspect-ratio: 16/9`. Antes a 3ª imagem era escondida — agora todas aparecem com destaque na primeira.

**Arquivos alterados:**
- `BookingFlow.css` — media query `.booking-gallery-item:first-child` com full-width

### 10.6 Melhor organização mobile e desktop

- **Semântica dos InfoCards corrigida:** cards não interativos (endereço, horário, Instagram) usam `<div>` em vez de `<button>`, eliminando elementos focáveis falsos. Apenas o card WhatsApp mantém `<button>` com `onClick`.
- **Cursor diferenciado:** classe `.booking-info-card--clickable` aplica `cursor: pointer` e hover/active effects apenas em cards clicáveis.
- **Hero responsivo:** informações extras no hero com `flex-wrap` e `gap` adaptável no mobile (12px → 8px).

**Arquivos alterados:**
- `BookingLandingInfo.jsx` — render condicional `button`/`div` + classe modifier
- `BookingFlow.css` — `.booking-info-card--clickable` e ajustes no hover

### 10.7 Checklist de validação visual

- [ ] Hero exibe nome, descrição, endereço, horário e avaliação visíveis sem scroll
- [ ] Imagem de fundo cobre o hero sem distorção
- [ ] Gradiente overlay mantém texto legível em qualquer imagem
- [ ] Divisores sutis entre todas as seções da landing
- [ ] Seção "Sobre" com aspas decorativas e borda esquerda visíveis
- [ ] Galeria exibe 3 imagens no mobile com primeira em destaque (16:9)
- [ ] Cards de informação não interativos (endereço, horário, Instagram) não mostram cursor pointer
- [ ] Card de WhatsApp clicável mantém hover/active effects
- [ ] Nenhum botão falso ou elemento focável indevido no DOM
- [ ] Build (`npm run build`) compila sem erros ou warnings novos
- [ ] Nenhuma funcionalidade de agendamento foi alterada ou removida
- [ ] Nenhum arquivo do backend foi tocado

### 10.8 Garantia de não alteração no backend

Todos os refinamentos desta seção foram aplicados **exclusivamente no frontend** e **não afetam**:

- Backend (Node.js + Express + PostgreSQL)
- Autenticação (login, cadastro, JWT, authStorage)
- Rotas da aplicação (nenhuma rota criada, alterada ou removida)
- Regras de agendamento (conflito de horários, validação de slots, lógica de serviços/profissionais)
- Fluxo de etapas existente (serviço → profissional → data/hora → resumo → auth → sucesso)
- Componentes de autenticação (`BookingLogin.jsx`, `PublicBookingSignup.jsx`, `BookingSuccess.jsx`, `BookingProfile.jsx`)
- API de dados (nenhuma chamada nova ao backend foi adicionada)

---

## 11. Conclusão

A transformação da agenda online pública em landing page premium requer:

1. **Criação de ~8 novos componentes** para a landing page
2. **~800+ linhas de CSS** para hero, info cards, diferenciais, equipe, galeria, split layout
3. **Modificação controlada do `BookingFlow.jsx`** para integrar landing + steps
4. **Dados mockados** que serão substituídos por dados reais do backend futuramente
5. **Preservação total** da lógica de agendamento existente

O resultado final deve parecer um **site profissional de barbearia** — não um formulário de agendamento. O cliente sente que está visitando a barbearia antes de reservar.