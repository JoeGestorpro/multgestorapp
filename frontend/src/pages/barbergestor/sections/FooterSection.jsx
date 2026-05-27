import { Link } from 'react-router-dom'
import { Container } from '../components/Container'
import { COMPANY } from '../data/company'
import './FooterSection.css'

export function FooterSection() {
  return (
    <footer className="bl-footer">
      <Container>
        <div className="bl-footer__grid">
          <div className="bl-footer__brand">
            <Link to="/" className="bl-footer__logo">
              <img
                src="/assets/barbergestor/icon-footer.webp"
                alt="BarberGestor"
                width="28"
                height="28"
                className="bl-footer__icon"
              />
              {COMPANY.name}
            </Link>
            <p className="bl-footer__desc">{COMPANY.description}</p>
            <div className="bl-footer__social">
              <a href={COMPANY.social.instagram} className="bl-footer__social-link" title="Instagram" target="_blank" rel="noopener noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href={COMPANY.social.whatsapp} className="bl-footer__social-link" title="WhatsApp" target="_blank" rel="noopener noreferrer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </a>
              <a href={`mailto:${COMPANY.social.email}`} className="bl-footer__social-link" title="Email">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="bl-footer__col-title">Produto</h4>
            <ul className="bl-footer__links">
              <li><a href="#funcionalidades">Funcionalidades</a></li>
              <li><a href="#precos">Preços</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><Link to="/register">Teste grátis</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="bl-footer__col-title">MultGestor</h4>
            <ul className="bl-footer__links">
              <li><Link to="/">Plataforma</Link></li>
              <li><Link to="/barber/login">Acessar conta</Link></li>
              <li><Link to="/register">Cadastre-se</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="bl-footer__col-title">Contato</h4>
            <ul className="bl-footer__links">
              <li><a href={`mailto:${COMPANY.social.email}`}>{COMPANY.social.email}</a></li>
              <li><a href={COMPANY.social.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
              <li><a href={COMPANY.social.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
            </ul>
          </div>
        </div>

        <div className="bl-footer__bottom">
          <p>© {new Date().getFullYear()} {COMPANY.name}. Todos os direitos reservados.</p>
          <div className="bl-footer__legal">
            <a href="#">Termos de Uso</a>
            <a href="#">Política de Privacidade</a>
          </div>
        </div>
      </Container>
    </footer>
  )
}
