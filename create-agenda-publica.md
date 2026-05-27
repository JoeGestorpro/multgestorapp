# create-agenda-publica.md — Reformular Agenda Online Pública Premium

> **Baseado no PLAN.md (Brainstorm).**
> **Foco total na landing page de barbearia + fluxo de agendamento público.**
> **Não altera a agenda interna do barbeiro nem o backend.**

---

## 1. Estrutura Atual (para referência)

A agenda online pública é renderizada por `PublicBooking.jsx` → `BookingFlow.jsx`, que contém:

```
BookingFlow (componente principal)
├── BookingHeader (header + progress bar)
├── Steps:
│   1. SERVICE   → ServiceCard (lista de serviços)
│   2. PROFESSIONAL → ProfessionalCard (lista de profissionais)
│   3. DATETIME  → Calendar + TimeSlots
│   4. SUMMARY   → BookingSummary (resumo + confirmação)
│   5. AUTH      → AuthForm (login/cadastro)
│   6. SUCCESS   → SuccessScreen (confirmação)
├── Footer (botão "Continuar")
```

**Rotas:**
| Rota | Arquivo |
|------|---------|
| `/agendar/:slug` | `PublicBooking.jsx` → `BookingFlow.jsx` |
| `/agendar/:slug/login` | `BookingLogin.jsx` |
| `/agendar/:slug/cadastro` | `PublicBookingSignup.jsx` |
| `/agendar/:slug/confirmado` | `BookingSuccess.jsx` |
| `/agendar/:slug/perfil` | `BookingProfile.jsx` |

**CSS:** `frontend/src/pages/booking/BookingFlow.css` (~2600 linhas, já com glassmorphism e animações)

**Dados da API `GET /barber/public/:slug/booking-info`:**
```json
{
  "company": { "id": "...", "name": "Barbearia X", "slug": "barbearia-x" },
  "services": [{ id, name, description, price, icon, estimated_time_minutes }],
  "collaborators": [{ id, name, nickname, avatar_url }],
  "settings": { timezone, slot_interval_minutes, ... }
}
```

> ⚠️ Backend retorna apenas `id`, `name`, `slug` da empresa.
> Todo dado visual extra (banner, endereço, WhatsApp, horários, fotos) virá de **fallbacks mockados** no frontend.

---

## 2. Estratégia de Implementação

### Abordagem: Landing page + Side card de agendamento

1. **Preservar todo o fluxo de etapas atual** — nenhuma lógica existente será removida
2. **Adicionar landing page antes das etapas** — hero, info, diferenciais, equipe, galeria
3. **Desktop: split layout** — landing à esquerda, card de agendamento sticky à direita
4. **Mobile: hero + conteúdo + CTA fixo** — ao clicar "Agendar", abre o fluxo em tela cheia
5. **Dados mockados** com estrutura preparada para backend real no futuro
6. **Nova CSS** dentro do próprio `BookingFlow.css` (não criar arquivo separado)

### Justificativa

- `BookingFlow.jsx` já tem a estrutura de etapas correta
- `BookingFlow.css` já tem o tema escuro premium
- A lógica de agendamento (slots, validação, submissão) não é alterada
- A abordagem "landing primeiro, agendamento depois" é testada em marketplaces como Booksy

---

## 3. Arquivos a Criar

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `frontend/src/pages/booking/BookingLanding.data.js` | Dados mockados/fallback para a landing |
| 2 | `frontend/src/pages/booking/BookingLandingHero.jsx` | Banner hero responsivo |
| 3 | `frontend/src/pages/booking/BookingLandingInfo.jsx` | Cards de informações |
| 4 | `frontend/src/pages/booking/BookingLandingAbout.jsx` | Seção "Sobre" |
| 5 | `frontend/src/pages/booking/BookingLandingDifferentials.jsx` | Grid de diferenciais |
| 6 | `frontend/src/pages/booking/BookingLandingTeam.jsx` | Preview da equipe |
| 7 | `frontend/src/pages/booking/BookingLandingGallery.jsx` | Galeria de fotos |
| 8 | `frontend/src/pages/booking/BookingSideCard.jsx` | Sidebar sticky com fluxo (desktop) |
| 9 | `frontend/src/pages/booking/BookingDesktopLayout.jsx` | Container split layout |
| 10 | `frontend/src/pages/booking/BookingMobileLayout.jsx` | Container hero + CTA mobile |

## 4. Arquivos a Modificar

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `BookingFlow.jsx` | Adicionar estado `showBooking`, renderizar `BookingDesktopLayout` ou `BookingMobileLayout` baseado em viewport. Manter todas as etapas intactas. |
| 2 | `BookingFlow.css` | Adicionar ~800-1000 linhas de CSS para hero, info cards, diferenciais, equipe, galeria, split layout, side card, mobile flow |

## 5. Arquivos NÃO Modificados

- `BookingLogin.jsx` — intacto (já migrado)
- `PublicBookingSignup.jsx` — intacto (já migrado)
- `BookingSuccess.jsx` — intacto (já migrado)
- `BookingProfile.jsx` — intacto (já migrado)
- `PublicBooking.jsx` — intacto (entry point)
- `Barber.css` — intacto (não usado pelas booking pages)
- Backend — intacto (dados mockados no frontend)

---

## 6. Fase 1: Dados Mockados / Fallback

### Arquivo: `BookingLanding.data.js`

**O que fazer:** Criar dados mockados completos para a landing page, com estrutura que espelha o que o backend futuramente fornecerá.

**Estrutura do arquivo:**

```js
// BookingLanding.data.js
// Dados mockados/fallback para a landing page da barbearia.
// Quando o backend fornecer estes campos, substituir as funções abaixo.

export const FALLBACK_COMPANY = {
  description: 'Há mais de 10 anos transformando o visual dos nossos clientes com estilo, tradição e modernidade.',
  banner_url: '/assets/hero-bg.jpg',
  logo_url: null,
  phone: '(11) 99999-9999',
  whatsapp: '5511999999999',
  address: 'Rua Exemplo, 123 - Centro, São Paulo - SP',
  instagram: '@barbearia',
  working_hours: [
    { day: 'Seg - Sex', hours: '08:00 - 19:00' },
    { day: 'Sábado', hours: '08:00 - 17:00' },
    { day: 'Domingo', hours: 'Fechado' },
  ],
  rating: 4.8,
  reviews_count: 127,
  gallery: [], // URLs serão preenchidas com imagens de placeholder
  differentials: [
    {
      icon: 'star',
      title: 'Profissionais Experts',
      desc: 'Equipe certificada com anos de experiência no mercado'
    },
    {
      icon: 'shield',
      title: 'Ambiente Premium',
      desc: 'Espaço climatizado, confortável e com estilo industrial'
    },
    {
      icon: 'clock',
      title: 'Pontualidade',
      desc: 'Respeitamos seu horário. Agendamento sem filas'
    },
    {
      icon: 'spray',
      title: 'Produtos Importados',
      desc: 'Linha profissional importada para o melhor cuidado'
    },
  ]
}

export const MOCK_GALLERY = [
  'https://images.unsplash.com/photo-1585747861115-1f2c7c8c2b6c?w=600',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600',
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600',
]

/**
 * Mescla dados da API com fallback.
 * @param {object} apiCompany - company da API ({ id, name, slug })
 * @returns {object} companyData completo com fallbacks
 */
export function buildCompanyData(apiCompany) {
  if (!apiCompany) return FALLBACK_COMPANY
  return {
    ...FALLBACK_COMPANY,
    id: apiCompany.id,
    name: apiCompany.name || FALLBACK_COMPANY.name,
    slug: apiCompany.slug,
  }
}
```

**Regras:**
- Usar imagens do Unsplash ou placeholder como fallback
- `buildCompanyData()` mescla dados da API com fallback
- Comentários em português explicando cada campo

---

## 7. Fase 2: Hero Visual da Barbearia

### Arquivo: `BookingLandingHero.jsx`

**O que fazer:** Componente de banner hero responsivo que ocupa a largura total, com imagem de fundo, gradiente overlay, nome da barbearia, tagline e CTA "Agendar Horário".

**Especificação:**

```
Desktop (≥ 1024px):
┌─────────────────────────────────────────────┐
│  🖼️ Imagem de fundo (cover, parallax)       │
│  ████████████████████████████████████████████ │
│  ██   Grade/overlay escuro                  ██ │
│  ██   ● Nome da barbearia (36px bold)      ██ │
│  ██   ● Tagline (18px muted)               ██ │
│  ██   ● [💈 Agendar Horário] CTA           ██ │
│  ██   ● Scroll indicator (↓)               ██ │
│  ████████████████████████████████████████████ │
│                        min-height: 70vh      │
└─────────────────────────────────────────────┘

Mobile (< 1024px):
┌─────────────────────┐
│  🖼️ Imagem fundo    │
│  █████████████████   │  ← min-height: 85vh
│  ██  Overlay        │
│  ██  Nome (28px)   │
│  ██  Tagline (16px) │
│  ██  [Agendar]      │
│  ██  ↓              │
└─────────────────────┘
```

**Props que recebe:**
- `company` → objeto completo da empresa (já mesclado com fallback)
- `onCtaClick` → função para quando clicar no CTA (inicia fluxo de agendamento)

**Estrutura JSX:**
```jsx
<section className="booking-hero">
  <div className="booking-hero-bg"> {/* imagem com gradiente */}
    <div className="booking-hero-overlay" />
  </div>
  <div className="booking-hero-content">
    <div className="booking-hero-badge"> {/* selo "Agende Online" */}
    <h1 className="booking-hero-title">{company.name}</h1>
    <p className="booking-hero-tagline">{company.description}</p>
    <button className="booking-hero-cta" onClick={onCtaClick}>
      <BarberIcon name="scissors" />
      Agendar Horário
    </button>
    <div className="booking-hero-scroll">↓</div>
  </div>
</section>
```

**CSS necessário (colocar em `BookingFlow.css`):**

```css
/* Hero Section */
.booking-hero {
  position: relative;
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.booking-hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.booking-hero-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(7, 9, 13, 0.3) 0%,
    rgba(7, 9, 13, 0.85) 50%,
    var(--bf-bg) 100%
  );
}

.booking-hero-overlay {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(163,255,18,0.02) 80px, rgba(163,255,18,0.02) 81px),
    repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(163,255,18,0.02) 80px, rgba(163,255,18,0.02) 81px);
}

.booking-hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 640px;
  padding: 24px;
}

.booking-hero-badge {
  /* selo "Agende Online" premium */
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bf-accent-glow);
  border: 1px solid rgba(163, 255, 18, 0.2);
  border-radius: 100px;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--bf-accent);
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.booking-hero-title {
  font-size: 36px;
  font-weight: 900;
  color: var(--bf-text);
  margin: 0 0 12px;
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.booking-hero-tagline {
  font-size: 18px;
  color: var(--bf-muted);
  margin: 0 0 32px;
  line-height: 1.5;
}

.booking-hero-cta {
  /* Botão principal grande */
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, var(--bf-accent), var(--bf-accent-2));
  border: none;
  border-radius: 60px;
  color: #0b0f1a;
  font-size: 18px;
  font-weight: 700;
  padding: 18px 40px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 8px 32px var(--bf-accent-glow);
}

.booking-hero-cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 48px var(--bf-accent-glow);
}

.booking-hero-cta:active {
  transform: translateY(0) scale(0.98);
}

.booking-hero-cta svg {
  width: 22px;
  height: 22px;
}

.booking-hero-scroll {
  margin-top: 48px;
  color: var(--bf-muted-2);
  font-size: 24px;
  animation: bookingBounce 2s ease-in-out infinite;
}

@keyframes bookingBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
}

/* Mobile hero */
@media (max-width: 1023px) {
  .booking-hero {
    min-height: 85vh;
  }
  .booking-hero-title {
    font-size: 28px;
  }
  .booking-hero-tagline {
    font-size: 16px;
  }
  .booking-hero-cta {
    font-size: 16px;
    padding: 16px 32px;
  }
}
```

---

## 8. Fase 3: Cards de Informações da Barbearia

### Arquivo: `BookingLandingInfo.jsx`

**O que fazer:** Grid de 4 cards com informações chave: Endereço, WhatsApp, Horários, Instagram.

**Especificação:**

```
Desktop: grid 2x2 ou 4 colunas
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 📍       │ │ 💬       │ │ 🕐       │ │ 📸       │
│ Endereço │ │ WhatsApp  │ │ Horários │ │ Instagram│
│ Rua ...  │ │ (11) 9... │ │ Seg-Sex  │ │ @barb... │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

Mobile: grid 2x2
┌──────────┐ ┌──────────┐
│ 📍       │ │ 💬       │
│ Endereço │ │ WhatsApp  │
└──────────┘ └──────────┘
┌──────────┐ ┌──────────┐
│ 🕐       │ │ 📸       │
│ Horários │ │ Instagram│
└──────────┘ └──────────┘
```

**Props:** `company` (objeto completo)

**Estrutura JSX:**
```jsx
<section className="booking-info-section">
  <div className="booking-info-grid">
    <div className="booking-info-card">
      <div className="booking-info-icon"><MapPin /></div>
      <div className="booking-info-content">
        <span>Endereço</span>
        <strong>{company.address}</strong>
      </div>
    </div>
    <div className="booking-info-card">
      <div className="booking-info-icon"><Phone /></div>
      <div className="booking-info-content">
        <span>WhatsApp</span>
        <strong>{company.phone}</strong>
      </div>
    </div>
    <div className="booking-info-card">
      <div className="booking-info-icon"><Clock /></div>
      <div className="booking-info-content">
        <span>Horários</span>
        <strong>{company.working_hours[0].day}: {company.working_hours[0].hours}</strong>
      </div>
    </div>
    <div className="booking-info-card">
      <div className="booking-info-icon"><Camera /></div>
      <div className="booking-info-content">
        <span>Instagram</span>
        <strong>{company.instagram}</strong>
      </div>
    </div>
  </div>
</section>
```

**CSS necessário:**

```css
.booking-info-section {
  padding: 48px 24px;
  max-width: 640px;
  margin: 0 auto;
}

.booking-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.booking-info-card {
  background: var(--bf-panel-glass);
  backdrop-filter: blur(8px);
  border: 1px solid var(--bf-border);
  border-radius: var(--bf-radius-lg);
  padding: 20px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  transition: all 0.3s ease;
}

.booking-info-card:hover {
  border-color: rgba(163, 255, 18, 0.2);
  transform: translateY(-2px);
}

.booking-info-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--bf-accent-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bf-accent);
  flex-shrink: 0;
}

.booking-info-icon svg {
  width: 20px;
  height: 20px;
}

.booking-info-content span {
  display: block;
  color: var(--bf-muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.booking-info-content strong {
  display: block;
  color: var(--bf-text);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

@media (min-width: 640px) {
  .booking-info-grid {
    grid-template-columns: repeat(2, 1fr); /* mantém 2x2 até desktop */
  }
  .booking-info-section {
    padding: 64px 24px;
    max-width: 720px;
  }
}

@media (min-width: 1024px) {
  .booking-info-grid {
    grid-template-columns: repeat(4, 1fr); /* 4 colunas no split layout */
  }
}
```

---

## 9. Fase 4: Split Layout Desktop

### Arquivo: `BookingDesktopLayout.jsx`

**O que fazer:** Container que organiza landing page à esquerda e side card de agendamento à direita usando CSS Grid.

**Especificação visual:**

```
Desktop (≥ 1024px):
┌────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────┐  ┌──────────────────────────┐  │
│ │   LANDING (scroll)      │  │  SIDE CARD (sticky)      │  │
│ │                         │  │  ┌────────────────────┐  │  │
│ │   Hero Section          │  │  │ 📋 Agendamento     │  │  │
│ │   Info Cards            │  │  │                    │  │  │
│ │   Sobre                 │  │  │ Step indicator     │  │  │
│ │   Diferenciais          │  │  │ Conteúdo do step   │  │  │
│ │   Equipe                │  │  │ [Continuar]        │  │  │
│ │   Galeria               │  │  └────────────────────┘  │  │
│ │                         │  │                           │  │
│ └─────────────────────────┘  └──────────────────────────┘  │
│   grid-template-columns: 1fr 460px                          │
└────────────────────────────────────────────────────────────┘
```

**Funcionamento:**

- `BookingDesktopLayout` renderiza a landing page completa + `BookingSideCard`
- `BookingSideCard` contém o `BookingFlowSteps` (reaproveita os steps existentes)
- Quando usuário clica "Agendar Horário" no hero ou info, `BookingSideCard` faz scroll suave para o topo e foca no primeiro step
- O side card é `position: sticky; top: 24px` e ocupa `max-height: calc(100vh - 48px)`
- O conteúdo do side card tem scroll interno se exceder a altura

**Estrutura JSX:**
```jsx
function BookingDesktopLayout({ company, services, collaborators, settings, steps, form, ... }) {
  const [activeStep, setActiveStep] = useState('landing') // 'landing' | steps

  return (
    <div className="booking-desktop-layout">
      <div className="booking-landing">
        <BookingLandingHero company={company} onCtaClick={() => setActiveStep('booking')} />
        <BookingLandingInfo company={company} onCtaClick={() => setActiveStep('booking')} />
        <BookingLandingAbout company={company} />
        <BookingLandingDifferentials company={company} />
        <BookingLandingTeam collaborators={collaborators} />
        <BookingLandingGallery />
      </div>

      <aside className="booking-side-card">
        {activeStep === 'landing' ? (
          <div className="booking-side-welcome">
            <div className="booking-side-icon">💈</div>
            <h3>Agende seu horário</h3>
            <p>Escolha o serviço, profissional e horário ideal</p>
            <button className="booking-hero-cta" onClick={() => setActiveStep('booking')}>
              <BarberIcon name="scissors" />
              Agendar Horário
            </button>
          </div>
        ) : (
          <BookingFlowSteps ... /> {/* steps existentes */}
        )}
      </aside>
    </div>
  )
}
```

**CSS necessário:**

```css
.booking-desktop-layout {
  display: grid;
  grid-template-columns: 1fr 460px;
  min-height: 100vh;
}

.booking-landing {
  overflow-y: auto;
  scroll-behavior: smooth;
}

.booking-side-card {
  position: sticky;
  top: 24px;
  height: calc(100vh - 48px);
  padding: 24px 24px 24px 0;
  overflow-y: auto;
}

.booking-side-welcome {
  background: var(--bf-panel-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--bf-border);
  border-radius: var(--bf-radius-xl);
  padding: 40px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.booking-side-icon {
  font-size: 48px;
  line-height: 1;
  margin-bottom: 8px;
}

.booking-side-welcome h3 {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
  color: var(--bf-text);
}

.booking-side-welcome p {
  color: var(--bf-muted);
  font-size: 14px;
  margin: 0;
  max-width: 280px;
}

/* Steps dentro do side card */
.booking-side-card .booking-flow-steps {
  background: var(--bf-panel-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--bf-border);
  border-radius: var(--bf-radius-xl);
  padding: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.booking-side-card .booking-step-header h1 {
  font-size: 20px;
}

.booking-side-card .booking-services,
.booking-side-card .booking-professionals {
  max-height: 360px;
  overflow-y: auto;
}

.booking-side-card .booking-footer {
  display: none; /* footer fixo não precisa no side card */
}
```

---

## 10. Fase 5: Mobile Premium

### Arquivo: `BookingMobileLayout.jsx`

**O que fazer:** Container mobile que mostra hero + conteúdo da barbearia primeiro, e um botão CTA fixo que revela o fluxo de agendamento.

**Especificação:**

```
Mobile (< 1024px):
┌─────────────────────────┐
│  🖼️ HERO (85vh)         │
│   Nome                  │
│   Tagline               │
│   [💈 Agendar]          │
├─────────────────────────┤
│  📍 Info Cards (2x2)    │  ← scroll para ver
│  📖 Sobre               │
│  🏆 Diferenciais        │
│  👨‍💼 Equipe              │
│  🖼️ Galeria              │
├─────────────────────────┤
│  [💈 Agendar Horário]   │  ← botão FIXO inferior
└─────────────────────────┘

Quando clica em "Agendar":
┌─────────────────────────┐
│  ← Voltar  |  Barbearia │
├─────────────────────────┤
│  Fluxo de etapas        │
│  (Serviço, Prof, Data,  │
│   Resumo, Auth, Sucesso)│
│                         │
│  [Continuar]            │
└─────────────────────────┘
```

**Funcionamento:**
- Estado `showBooking` controla se exibe landing ou fluxo
- Botão CTA fixo no fim da landing (ou botão no hero) muda `showBooking` para `true`
- Quando `showBooking = true`, renderiza os steps existentes com um header "Voltar"
- Ícone "Voltar" retorna para `showBooking = false`
- Rolagem suave ao mudar de estado

**Estrutura JSX:**
```jsx
function BookingMobileLayout({ company, services, collaborators, settings, ... }) {
  const [showBooking, setShowBooking] = useState(false)

  if (showBooking) {
    return (
      <div className="booking-mobile-flow">
        <header className="booking-mobile-flow-header">
          <button onClick={() => setShowBooking(false)} className="booking-back-btn">
            <BarberIcon name="arrowLeft" />
          </button>
          <span>{company.name}</span>
          <div className="booking-header-spacer" />
        </header>
        <BookingFlowSteps ... /> {/* steps existentes */}
      </div>
    )
  }

  return (
    <div className="booking-mobile-layout">
      <BookingLandingHero company={company} onCtaClick={() => setShowBooking(true)} />
      <BookingLandingInfo company={company} onCtaClick={() => setShowBooking(true)} />
      <BookingLandingAbout company={company} />
      <BookingLandingDifferentials company={company} />
      <BookingLandingTeam collaborators={collaborators} />
      <BookingLandingGallery />
      <div className="booking-mobile-cta-bar">
        <button className="booking-hero-cta" onClick={() => setShowBooking(true)}>
          <BarberIcon name="scissors" />
          Agendar Horário
        </button>
      </div>
    </div>
  )
}
```

**CSS necessário:**

```css
/* Mobile layout */
.booking-mobile-layout {
  min-height: 100vh;
}

.booking-mobile-cta-bar {
  position: sticky;
  bottom: 0;
  padding: 16px;
  background: var(--bf-panel-glass);
  backdrop-filter: blur(16px);
  border-top: 1px solid var(--bf-border);
  z-index: 40;
}

.booking-mobile-cta-bar .booking-hero-cta {
  width: 100%;
  justify-content: center;
}

/* Mobile flow (quando ativo) */
.booking-mobile-flow {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.booking-mobile-flow-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bf-panel-glass);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--bf-border);
  position: sticky;
  top: 0;
  z-index: 50;
}

.booking-mobile-flow-header span {
  flex: 1;
  font-weight: 700;
  font-size: 16px;
  color: var(--bf-text);
  text-align: center;
}

.booking-mobile-flow .booking-content {
  flex: 1;
  padding-bottom: 24px;
}

.booking-mobile-flow .booking-footer {
  position: sticky;
  bottom: 0;
}

/* Tablet portrait */
@media (min-width: 768px) and (max-width: 1023px) {
  .booking-mobile-layout .booking-info-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 11. Fase 6: Integração com Fluxo de Serviço/Profissional/Data/Horário

### Arquivo: `BookingFlow.jsx` (modificação)

**O que fazer:** Modificar `BookingFlow.jsx` para usar o novo layout (desktop split ou mobile) com base na largura da viewport, mantendo toda a lógica de agendamento intacta.

**Estratégia:**

1. Detectar viewport com `useMediaQuery` ou `window.innerWidth`
2. Se ≥ 1024px → renderizar `BookingDesktopLayout`
3. Se < 1024px → renderizar `BookingMobileLayout`
4. Ambos recebem as mesmas props: `company`, `services`, `collaborators`, `settings`, etc.
5. Os steps (SERVICE, PROFESSIONAL, DATETIME, SUMMARY, AUTH, SUCCESS) continuam sendo renderizados pelos mesmos componentes (`BookingFlowSteps`)
6. `BookingFlowSteps` é um container que renderiza o step atual baseado em `currentStep`
7. O estado `currentStep` e `form` continuam sendo gerenciados pelo `BookingFlow`

**Estrutura do `BookingFlow.jsx` modificado:**

```jsx
function BookingFlow() {
  const { slug } = useParams()
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState(null)
  const [services, setServices] = useState([])
  const [collaborators, setCollaborators] = useState([])
  const [settings, setSettings] = useState(null)
  // ... todo o estado existente continua igual

  // Landing data mesclado
  const landingCompany = useMemo(() => buildCompanyData(company), [company])

  if (loading) return <LoadingState />
  if (error && !company) return <ErrorState />

  return (
    <div className="booking-flow">
      <DesktopLayout>
        <BookingDesktopLayout
          company={landingCompany}
          services={services}
          collaborators={collaborators}
          settings={settings}
          // ... props dos steps
        />
      </DesktopLayout>

      <MobileLayout>
        <BookingMobileLayout
          company={landingCompany}
          services={services}
          collaborators={collaborators}
          settings={settings}
          // ... props dos steps
        />
      </MobileLayout>
    </div>
  )
}
```

**IMPORTANTE:** 
- NÃO remover nenhum estado ou função existente
- NÃO alterar a lógica de `submitAppointment`, `handleAuth`, `loadSlots`, etc.
- Apenas embrulhar o conteúdo visual nos novos layouts
- Extrair os steps para um subcomponente `BookingFlowSteps` se necessário para reuso

---

## 12. Fase 7: Componentes Complementares

### 12.1 `BookingLandingAbout.jsx`

Seção "Sobre a barbearia" com descrição textual e imagem lateral (opcional).

```css
.booking-about {
  padding: 48px 24px;
  max-width: 640px;
  margin: 0 auto;
}

.booking-about h2 {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 16px;
  color: var(--bf-text);
}

.booking-about p {
  color: var(--bf-muted);
  font-size: 15px;
  line-height: 1.7;
  margin: 0;
}
```

### 12.2 `BookingLandingDifferentials.jsx`

Grid de 4 diferenciais com ícone, título e descrição.

```css
.booking-diffs {
  padding: 48px 24px;
  max-width: 640px;
  margin: 0 auto;
}

.booking-diffs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.booking-diff-card {
  background: var(--bf-panel-glass);
  border: 1px solid var(--bf-border);
  border-radius: var(--bf-radius-lg);
  padding: 24px 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.booking-diff-card:hover {
  border-color: rgba(163, 255, 18, 0.2);
  transform: translateY(-3px);
}

.booking-diff-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  background: var(--bf-accent-glow);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bf-accent);
}

.booking-diff-card h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--bf-text);
}

.booking-diff-card p {
  color: var(--bf-muted);
  font-size: 13px;
  margin: 0;
  line-height: 1.5;
}

@media (min-width: 1024px) {
  .booking-diffs-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### 12.3 `BookingLandingTeam.jsx`

Preview dos profissionais com avatares e nomes.

```css
.booking-team {
  padding: 48px 24px;
  max-width: 640px;
  margin: 0 auto;
}

.booking-team h2 {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 20px;
  color: var(--bf-text);
}

.booking-team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

.booking-team-card {
  text-align: center;
  cursor: pointer;
}

.booking-team-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  margin: 0 auto 10px;
  background: var(--bf-bg-2);
  border: 2px solid var(--bf-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bf-muted);
  transition: all 0.3s ease;
  overflow: hidden;
}

.booking-team-card:hover .booking-team-avatar {
  border-color: var(--bf-accent);
  transform: scale(1.05);
}

.booking-team-card strong {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--bf-text);
}

.booking-team-card small {
  display: block;
  font-size: 11px;
  color: var(--bf-muted);
  margin-top: 2px;
}
```

### 12.4 `BookingLandingGallery.jsx`

Grid de fotos da barbearia (mock com imagens Unsplash). Funciona melhor apenas em desktop (mobile pode ser mais compacto).

```css
.booking-gallery {
  padding: 48px 24px;
  max-width: 640px;
  margin: 0 auto;
}

.booking-gallery h2 {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 20px;
  color: var(--bf-text);
}

.booking-gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  border-radius: var(--bf-radius-lg);
  overflow: hidden;
}

.booking-gallery-item {
  aspect-ratio: 1;
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  transition: transform 0.3s ease;
  cursor: pointer;
}

.booking-gallery-item:hover {
  transform: scale(1.03);
}

@media (max-width: 640px) {
  .booking-gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## 13. Resumo de Alterações por Arquivo

### `BookingFlow.jsx`
| Local | Ação |
|-------|------|
| Topo (imports) | Adicionar import dos novos componentes |
| Estado `showBooking` | Gerenciar visibilidade do fluxo vs landing |
| Render principal | Escolher `BookingDesktopLayout` ou `BookingMobileLayout` baseado em viewport |
| Steps e lógica | NÃO ALTERAR (manter intacto) |

### `BookingFlow.css`
| Seção | Linhas aprox. | Ação |
|-------|---------------|------|
| Hero Section | ~150 | Adicionar |
| Info Cards | ~120 | Adicionar |
| Sobre | ~40 | Adicionar |
| Diferenciais | ~90 | Adicionar |
| Equipe | ~80 | Adicionar |
| Galeria | ~70 | Adicionar |
| Split Layout Desktop | ~100 | Adicionar |
| Side Card | ~140 | Adicionar |
| Mobile Layout | ~120 | Adicionar |
| Mobile Flow | ~80 | Adicionar |

### Arquivos novos (10 total)
| Arquivo | Status |
|---------|--------|
| `BookingLanding.data.js` | **Criar** |
| `BookingLandingHero.jsx` | **Criar** |
| `BookingLandingInfo.jsx` | **Criar** |
| `BookingLandingAbout.jsx` | **Criar** |
| `BookingLandingDifferentials.jsx` | **Criar** |
| `BookingLandingTeam.jsx` | **Criar** |
| `BookingLandingGallery.jsx` | **Criar** |
| `BookingSideCard.jsx` | **Criar** |
| `BookingDesktopLayout.jsx` | **Criar** |
| `BookingMobileLayout.jsx` | **Criar** |

---

## 14. Ordem de Implementação Recomendada

```
Fase 1: Dados Mockados
  1.1 Criar BookingLanding.data.js
  ─── Teste: import não quebra, build passa

Fase 2: Hero
  2.1 Criar BookingLandingHero.jsx
  2.2 Adicionar CSS do hero em BookingFlow.css
  ─── Teste: hero aparece com imagem, nome, CTA

Fase 3: Info Cards
  3.1 Criar BookingLandingInfo.jsx
  3.2 Adicionar CSS dos info cards
  ─── Teste: 4 cards visíveis com ícones

Fase 4: Diferenciais + Sobre + Equipe + Galeria
  4.1 Criar BookingLandingAbout.jsx
  4.2 Criar BookingLandingDifferentials.jsx
  4.3 Criar BookingLandingTeam.jsx
  4.4 Criar BookingLandingGallery.jsx
  4.5 Adicionar CSS de cada seção
  ─── Teste: todas as seções visíveis e responsivas

Fase 5: Split Layout Desktop
  5.1 Criar BookingSideCard.jsx
  5.2 Criar BookingDesktopLayout.jsx
  5.3 Adicionar CSS do split layout
  ─── Teste: desktop mostra landing + side card

Fase 6: Mobile
  6.1 Criar BookingMobileLayout.jsx
  6.2 Adicionar CSS mobile
  ─── Teste: mobile mostra hero + CTA fixo

Fase 7: Integração
  7.1 Modificar BookingFlow.jsx
  7.2 Testar fluxo completo
  ─── Teste: agendamento funciona com novo layout
```

---

## 15. Regras de Implementação

1. **NUNCA** alterar a lógica de agendamento existente (serviço, profissional, slots, submissão)
2. **NUNCA** alterar backend
3. **SEMPRE** usar CSS classes com prefixo `booking-` para evitar conflitos
4. **SEMPRE** testar build entre cada fase
5. **Mobile-first**: garantir que funciona em 320px antes de 1440px
6. **Dados mockados** devem ser facilmente substituíveis por API futura
7. **Comentários em português** explicando cada bloco de código
8. **Preservar `BookingLogin.jsx`, `BookingSuccess.jsx`, `PublicBookingSignup.jsx`, `BookingProfile.jsx`** — já estão migrados e funcionais

---

## 16. Checklist de Testes

### Build
- [ ] `npm run build` passa sem erros
- [ ] Nenhum warning novo (além dos pré-existentes)

### Desktop (≥ 1024px)
- [ ] Layout split: landing à esquerda, side card à direita
- [ ] Hero com imagem, gradiente, nome e CTA
- [ ] Info cards com ícones visíveis
- [ ] Sobre, diferenciais, equipe, galeria aparecem
- [ ] Side card sticky funciona (rola a landing, card fixo)
- [ ] CTA "Agendar" no side card inicia o fluxo
- [ ] Steps funcionam dentro do side card
- [ ] Botão "Voltar" nos steps funciona
- [ ] Confirmação e sucesso funcionam

### Mobile (< 1024px)
- [ ] Hero em tela cheia (85vh)
- [ ] Botão CTA "Agendar" no hero
- [ ] Landing scrollável com todas as seções
- [ ] Botão CTA fixo no final
- [ ] Ao clicar "Agendar", fluxo de steps abre
- [ ] Header "Voltar" no fluxo retorna para landing
- [ ] Steps funcionam em mobile
- [ ] Footer fixo com "Continuar" aparece

### Fluxo de Agendamento (não quebrou)
- [ ] Serviço → seleciona, avança
- [ ] Profissional → seleciona, avança
- [ ] Data/Hora → calendário navega, horários carregam
- [ ] Resumo → mostra dados corretos
- [ ] Auth → login/cadastro funcionam
- [ ] Sucesso → animação aparece
- [ ] Rota `/agendar/:slug/login` funciona
- [ ] Rota `/agendar/:slug/cadastro` funciona
- [ ] Rota `/agendar/:slug/confirmado` funciona
- [ ] Rota `/agendar/:slug/perfil` funciona

### Responsivo
- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone)
- [ ] 640px (tablet pequeno)
- [ ] 768px (iPad portrait)
- [ ] 1024px (iPad landscape / desktop pequeno)
- [ ] 1440px (desktop padrão)

### Performance
- [ ] Animações suaves (sem travamentos)
- [ ] Scroll suave na landing
- [ ] Imagens com loading lazy
- [ ] `prefers-reduced-motion` respeitado

---

## 17. Rollback

Se algo quebrar:

1. Reverter `BookingFlow.jsx` para o estado anterior (git checkout)
2. Remover imports dos novos componentes
3. Restaurar CSS removendo as novas seções
4. Verificar que rotas de booking continuam funcionando
5. Testar build

---

## 18. Resultado Esperado

Após implementação:

- **Desktop:** Landing page de barbearia profissional à esquerda, card de agendamento sticky à direita. Cliente vê quem é a barbearia antes de agendar.
- **Mobile:** Hero impactante, seções de conteúdo, botão CTA fixo. Fluxo de agendamento em tela cheia quando ativado.
- **Agendamento:** Nada mudou na lógica — serviço, profissional, data/hora, resumo, auth e sucesso continuam idênticos.
- **Dados:** Estrutura preparada para receber dados reais do backend no futuro.
- **Visual:** Premium, escuro, elegante, com verde neon (#a3ff12) como cor principal.
- **Consistência:** Login, cadastro, sucesso e perfil continuam com o mesmo tema (já migrados).
