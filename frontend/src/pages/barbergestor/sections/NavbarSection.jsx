import { Link } from 'react-router-dom'
import { useNavbarSolid } from '../hooks/useNavbarSolid'
import { Container } from '../components/Container'
import { Button } from '../components/Button'
import { NAV_LINKS } from '../data/navigation'
import './NavbarSection.css'

export function NavbarSection() {
  const solid = useNavbarSolid(80)

  return (
    <nav className={`bl-navbar${solid ? ' bl-navbar--solid' : ''}`}>
      <Container className="bl-navbar__inner">
        <Link to="/" className="bl-navbar__logo">
          <img
            src="/assets/barbergestor/icon-nav.webp"
            alt="BarberGestor"
            width="32"
            height="32"
            className="bl-navbar__icon"
          />
          <span>BarberGestor</span>
        </Link>

        <div className="bl-navbar__links">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="bl-navbar__link">{link.label}</a>
          ))}
        </div>

        <div className="bl-navbar__actions">
          <Link to="/barber/login" className="bl-navbar__signin">Entrar</Link>
          <Button as={Link} to="/register" variant="primary" size="sm">Começar grátis</Button>
        </div>
      </Container>
    </nav>
  )
}
