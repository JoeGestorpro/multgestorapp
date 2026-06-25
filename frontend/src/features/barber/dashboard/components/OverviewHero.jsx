import { Calendar, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../../components/design-system/ui/Button'

function buildGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

function buildDate() {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date())
}

export default function OverviewHero({ user, onNewSale }) {
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0] || 'admin'
  const companyName = user?.company_name || 'Barbearia'

  return (
    <section className="overview-hero">
      <div className="overview-hero__info">
        <span className="overview-hero__overline">{companyName} · {buildDate()}</span>
        <h1 className="overview-hero__title">{buildGreeting()}, {firstName}</h1>
        <p className="overview-hero__subtitle">Centro de comando da barbearia — visão operacional completa</p>
      </div>
      <div className="overview-hero__actions">
        <Button variant="primary" size="md" onClick={onNewSale}>
          <Plus size={16} />
          <span>Novo atendimento</span>
        </Button>
        <Button variant="ghost" size="md" onClick={() => navigate('/barber/agenda')}>
          <Calendar size={16} />
          <span>Ver agenda</span>
        </Button>
      </div>
    </section>
  )
}
