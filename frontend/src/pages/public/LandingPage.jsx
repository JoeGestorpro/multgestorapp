import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './LandingPage.css'
import felipe1 from '../../assets/founder/felipe-1.jpeg'
import felipe2 from '../../assets/founder/felipe-2.jpeg'
import felipe3 from '../../assets/founder/felipe-3.jpeg'

const gestores = [
  {
    id: 'barber',
    icon: '✂️',
    name: 'BarberGestor',
    description: 'Sistema completo para barbearias: agenda, caixa, financeiro, colaboradores, relatórios e agendamento online.',
    features: ['Agenda', 'Caixa', 'Financeiro', 'Colaboradores', 'Relatórios', 'Agendamento Online'],
    status: 'available',
    link: '/barbergestor'
  },
  {
    id: 'clima',
    icon: '❄️',
    name: 'ClimaGestor',
    description: 'Sistema para técnicos de climatização e refrigeração, com gestão de serviços, clientes e roteiros.',
    features: ['Ordens de Serviço', 'Roteiros', 'Clientes', 'Financeiro', 'Relatórios'],
    status: 'development',
    link: '/clima'
  },
  {
    id: 'oficina',
    icon: '🔧',
    name: 'OficinaGestor',
    description: 'Sistema inteligente para oficinas mecânicas com controle de veículos, peças e serviços.',
    features: ['Veículos', 'Peças', 'Serviços', 'Caixa', 'Relatórios'],
    status: 'planned',
    link: '#'
  },
  {
    id: 'auto',
    icon: '🚗',
    name: 'AutoGestor',
    description: 'Gestão automotiva moderna para concessionárias e oficinas com foco em eficiência.',
    features: ['Estoque', 'Vendas', 'Clientes', 'Financeiro', 'KPIs'],
    status: 'planned',
    link: '#'
  },
  {
    id: 'terra',
    icon: '🚜',
    name: 'TerraGestor',
    description: 'Gestão completa para terraplanagem e máquinas pesadas com controle de obras e equipamentos.',
    features: ['Obras', 'Equipamentos', 'Funcionários', 'Financeiro', 'Relatórios'],
    status: 'planned',
    link: '#'
  }
]

const diferenciais = [
  { icon: '🏢', title: 'Multiempresa', desc: 'Gerencie múltiplas empresas em uma única plataforma.' },
  { icon: '🔒', title: 'Multi-tenant Seguro', desc: 'Isolamento total de dados entre inquilinos.' },
  { icon: '📈', title: 'Escalável', desc: 'Infraestrutura que cresce com seu negócio.' },
  { icon: '☁️', title: 'Cloud', desc: 'Acesse de qualquer lugar, a qualquer momento.' },
  { icon: '📅', title: 'Agenda Inteligente', desc: 'Otimização automática de horários e profissionais.' },
  { icon: '📊', title: 'Relatórios Avançados', desc: 'Dashboards e métricas para decisões precisas.' },
  { icon: '⚡', title: 'Automação', desc: 'Tarefas repetitivas automatizadas.' },
  { icon: '🔌', title: 'Integrações Futuras', desc: 'APIs e integrações com ferramentas populares.' },
  { icon: '🤖', title: 'IA Aplicada', desc: 'Inteligência artificial para insights e previsões.' },
  { icon: '💰', title: 'Controle Financeiro', desc: 'Fluxo de caixa, receitas e despesas completos.' },
  { icon: '📱', title: 'Responsividade Total', desc: 'Perfeito em desktop, tablet e mobile.' },
  { icon: '🎯', title: 'Foco no Resultado', desc: 'Indicadores de performance em tempo real.' }
]

function useScrollAnimation() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])
}

function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <div className="logo-icon">M</div>
          <span className="logo-text">Mult<span>Gestor</span></span>
        </Link>

        <nav className="header-nav">
          <a href="#gestores" className="nav-link">Gestores</a>
          <a href="#diferenciais" className="nav-link">Diferenciais</a>
          <a href="#sugerir" className="nav-link">Sugerir</a>
          <a href="#criador" className="nav-link">Criador</a>
        </nav>

        <div className="header-actions">
          <Link to="/master/login" className="btn btn-secondary btn-sm">Acessar</Link>
          <Link to="#cta" className="btn btn-primary btn-sm">Testar Grátis</Link>
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="hero section">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-badge-group">
              <span className="hero-badge free">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                7 dias grátis
              </span>
              <span className="hero-badge cloud">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
                Cloud SaaS
              </span>
              <span className="hero-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Escalável
              </span>
              <span className="hero-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
                Multi-tenant
              </span>
            </div>

            <h1 className="hero-title">
              Transforme qualquer negócio em uma <span className="highlight">operação inteligente.</span>
            </h1>

            <p className="hero-subtitle">
              O MultGestor é uma plataforma SaaS moderna criada para automatizar, organizar e escalar negócios reais através de gestores especializados.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Começar teste grátis
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <a href="#gestores" className="btn btn-secondary btn-lg">
                Conhecer gestores
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-mockup">
              <div className="hero-mockup-inner">
                <div className="mockup-header">
                  <div className="mockup-dots">
                    <div className="mockup-dot"></div>
                    <div className="mockup-dot"></div>
                    <div className="mockup-dot"></div>
                  </div>
                </div>
                <div className="mockup-sidebar">
                  <div className="mockup-nav-item active">📊 Dashboard</div>
                  <div className="mockup-nav-item">📅 Agenda</div>
                  <div className="mockup-nav-item">💰 Financeiro</div>
                  <div className="mockup-nav-item">👥 Clientes</div>
                  <div className="mockup-nav-item">📈 Relatórios</div>
                </div>
                <div className="mockup-content">
                  <div className="mockup-stats">
                    <div className="mockup-stat-card">
                      <div className="mockup-stat-value">R$ 45.2K</div>
                      <div className="mockup-stat-label">Receita Mensal</div>
                    </div>
                    <div className="mockup-stat-card">
                      <div className="mockup-stat-value">127</div>
                      <div className="mockup-stat-label">Atendimentos</div>
                    </div>
                    <div className="mockup-stat-card">
                      <div className="mockup-stat-value">98%</div>
                      <div className="mockup-stat-label">Satisfação</div>
                    </div>
                  </div>
                  <div className="mockup-chart-area">
                    <div className="mockup-bar" style={{ height: '45%' }}></div>
                    <div className="mockup-bar" style={{ height: '65%' }}></div>
                    <div className="mockup-bar" style={{ height: '55%' }}></div>
                    <div className="mockup-bar" style={{ height: '80%' }}></div>
                    <div className="mockup-bar" style={{ height: '70%' }}></div>
                    <div className="mockup-bar" style={{ height: '90%' }}></div>
                    <div className="mockup-bar" style={{ height: '85%' }}></div>
                    <div className="mockup-bar" style={{ height: '95%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="hero-glow"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

function GestoresSection() {
  const navigate = useNavigate()

  function handleCardClick(link) {
    navigate(link)
  }

  return (
    <section id="gestores" className="section">
      <div className="container">
        <div className="section-header fade-in">
          <div className="section-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Gestores
          </div>
          <h2 className="section-title">Soluções especializadas para cada nicho</h2>
          <p className="section-subtitle">
            Escolha o gestor perfeito para o seu negócio ou sugira um novo nicho para desenvolvermos juntos.
          </p>
        </div>

        <div className="gestores-grid">
          {gestores.map((gestor, index) => (
            <div
              key={gestor.id}
              className={`gestor-card fade-in stagger-${index + 1}`}
              onClick={() => handleCardClick(gestor.link)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(gestor.link) }}
            >
              <div className="gestor-card-header">
                <div className="gestor-icon">{gestor.icon}</div>
                <span className={`gestor-status ${gestor.status}`}>
                  {gestor.status === 'available' && 'Disponível'}
                  {gestor.status === 'development' && 'Em desenvolvimento'}
                  {gestor.status === 'planned' && 'Planejado'}
                </span>
              </div>
              <h3 className="gestor-name">{gestor.name}</h3>
              <p className="gestor-description">{gestor.description}</p>
              <div className="gestor-features">
                {gestor.features.slice(0, 4).map((feature) => (
                  <span key={feature} className="gestor-feature">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {feature}
                  </span>
                ))}
                {gestor.features.length > 4 && (
                  <span className="gestor-feature">+{gestor.features.length - 4} mais</span>
                )}
              </div>
              <div className="gestor-card-footer">
                <span className="gestor-arrow" onClick={(e) => { e.stopPropagation(); handleCardClick(gestor.link) }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DiferenciaisSection() {
  return (
    <section id="diferenciais" className="section" style={{ background: 'var(--bg-secondary)' }}>
      <div className="container">
        <div className="section-header fade-in">
          <div className="section-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Diferenciais
          </div>
          <h2 className="section-title">Por que escolher o MultGestor?</h2>
          <p className="section-subtitle">
            Tecnologia de ponta combinada com praticidade para transformar sua operação.
          </p>
        </div>

        <div className="diferenciais-grid">
          {diferenciais.map((item, index) => (
            <div key={item.title} className={`diferencial-card fade-in stagger-${(index % 6) + 1}`}>
              <div className="diferencial-icon">{item.icon}</div>
              <h3 className="diferencial-title">{item.title}</h3>
              <p className="diferencial-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SuggestSection() {
  const [form, setForm] = useState({ name: '', niche: '', idea: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    alert('Obrigado pela sua sugestão! Nossa equipe entrará em contato em breve.')
    setForm({ name: '', niche: '', idea: '' })
  }

  return (
    <section id="sugerir" className="section suggest-section">
      <div className="container">
        <div className="suggest-grid">
          <div className="suggest-content fade-in">
            <h2>Seu nicho ainda não existe no MultGestor?</h2>
            <p>
              Envie sua ideia e participe da evolução da plataforma. Cada gestor que criamos começa com uma sugestão de alguém como você.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="hero-badge free">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                Totalmente gratuito
              </div>
              <div className="hero-badge cloud">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Ouvimos você
              </div>
            </div>
          </div>

          <form className="suggest-form fade-in" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Seu nome</label>
              <input
                type="text"
                className="form-input"
                placeholder="Como podemos te chamar?"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Qual o nicho?</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: PetShop, Clínica estética, Oficina..."
                value={form.niche}
                onChange={(e) => setForm({ ...form, niche: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sua ideia</label>
              <textarea
                className="form-textarea"
                placeholder="Conte-nos mais sobre o que você precisa para gerenciar esse tipo de negócio..."
                value={form.idea}
                onChange={(e) => setForm({ ...form, idea: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Enviar sugestão
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

function CreatorSection() {
  const [selectedImage, setSelectedImage] = useState(0)
  const images = [felipe1, felipe2, felipe3]

  return (
    <section id="criador" className="section creator-section">
      <div className="creator-bg-glow"></div>
      <div className="container">
        <div className="creator-grid">
          <div className="creator-image-wrapper fade-in">
            <div className="creator-image-glow"></div>
            <div className="creator-showcase">
              <div className="creator-main-image">
                <img src={images[selectedImage]} alt="Felipe Fragoso" />
                <div className="creator-image-overlay"></div>
              </div>
              <div className="creator-image-thumbnails">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`creator-thumbnail ${selectedImage === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img src={img} alt={`Felipe Fragoso ${idx + 1}`} />
                  </button>
                ))}
              </div>
              <div className="creator-floating-badge">
                <span className="creator-badge-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </span>
                <span>Fundador MultGestor</span>
              </div>
            </div>
          </div>

          <div className="creator-content fade-in">
            <div className="section-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              Fundador
            </div>
            <h2 className="creator-name">Felipe Fragoso</h2>
            <p className="creator-bio">
              Desenvolvedor e criador do MultGestor, focado em construir soluções SaaS modernas para transformar negócios reais através da tecnologia.
            </p>
            <div className="creator-badges">
              <span className="creator-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                SaaS Builder
              </span>
              <span className="creator-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                Full Stack
              </span>
              <span className="creator-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4c0 1.1-.4 2.1-1 2.9l.7.7a4 4 0 0 1-1.4 6.6l-.3.3a4 4 0 0 1-6.6 0l-.7-.7a4 4 0 0 1 0-5.8l.7-.7A4 4 0 0 1 12 2z"/><circle cx="12" cy="10" r="2"/><line x1="12" y1="14" x2="12" y2="20"/></svg>
                IA + Automação
              </span>
              <span className="creator-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Founder
              </span>
            </div>
            <div className="creator-stats">
              <div className="creator-stat">
                <span className="creator-stat-value">1</span>
                <span className="creator-stat-label">Plataforma</span>
              </div>
              <div className="creator-stat">
                <span className="creator-stat-value">5+</span>
                <span className="creator-stat-label">Gestores</span>
              </div>
              <div className="creator-stat">
                <span className="creator-stat-value">SaaS</span>
                <span className="creator-stat-label">Modelo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section id="cta" className="section cta-section">
      <div className="cta-glow"></div>
      <div className="container">
        <div className="fade-in">
          <h2 className="cta-title">
            Comece agora a evolução<br />do seu negócio.
          </h2>
          <p className="cta-subtitle">
            Teste gratuitamente por 7 dias e descubra o poder do MultGestor.
          </p>
          <div className="cta-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              Começar agora
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <a href="mailto:contato@multgestor.com.br" className="btn btn-secondary btn-lg">
              Falar com equipe
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="logo">
              <div className="logo-icon">M</div>
              <span className="logo-text">Mult<span>Gestor</span></span>
            </Link>
            <p>
              Plataforma SaaS multi-gestores para automatizar, organizar e escalar negócios reais através de tecnologia moderna.
            </p>
            <div className="footer-social">
              <a href="mailto:contato@multgestor.com.br" className="social-link" title="Email">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </a>
              <a href="https://wa.me/5511999999999" className="social-link" title="WhatsApp" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </a>
              <a href="https://instagram.com/multgestor" className="social-link" title="Instagram" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="footer-col-title">Gestores</h4>
            <ul className="footer-links">
              <li><Link to="/barber">BarberGestor</Link></li>
              <li><Link to="/clima">ClimaGestor</Link></li>
              <li><a href="#gestores">TerraGestor</a></li>
              <li><a href="#gestores">OficinaGestor</a></li>
              <li><a href="#gestores">AutoGestor</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Recursos</h4>
            <ul className="footer-links">
              <li><a href="#diferenciais">Diferenciais</a></li>
              <li><a href="#sugerir">Sugerir Gestor</a></li>
              <li><a href="#cta">Teste Grátis</a></li>
              <li><a href="/register">Cadastro</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Contato</h4>
            <ul className="footer-links">
              <li><a href="mailto:contato@multgestor.com.br">contato@multgestor.com.br</a></li>
              <li><a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
              <li><Link to="/master/login">Acessar conta</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} MultGestor. Todos os direitos reservados.
          </p>
          <div className="footer-legal">
            <a href="#">Termos de Uso</a>
            <a href="#">Política de Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function GradientBackground() {
  return (
    <div className="gradient-bg">
      <div className="gradient-orb gradient-orb-1"></div>
      <div className="gradient-orb gradient-orb-2"></div>
      <div className="gradient-orb gradient-orb-3"></div>
    </div>
  )
}

function LandingPage() {
  useScrollAnimation()

  return (
    <div className="landing-page">
      <GradientBackground />
      <Header />
      <main>
        <HeroSection />
        <GestoresSection />
        <DiferenciaisSection />
        <SuggestSection />
        <CreatorSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage
