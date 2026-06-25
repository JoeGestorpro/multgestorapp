import { useNavigate } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter } from '../../../../components/design-system/ui/Card'
import Badge from '../../../../components/design-system/ui/Badge'
import Button from '../../../../components/design-system/ui/Button'
import Empty from '../../../../components/design-system/feedback/Empty'
import Loading from '../../../../components/design-system/feedback/Skeleton'
import { getAppointmentStatusLabel, getAppointmentStatusVariant, calcOccupancy } from '../rules/overviewRules'

export default function TodayAgendaCard({ agenda, loading }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <Card className="today-agenda-card today-agenda-card--loading">
        <Loading size="md" />
      </Card>
    )
  }

  if (!agenda) {
    return (
      <Card className="today-agenda-card">
        <CardHeader>
          <CardTitle>Agenda de Hoje</CardTitle>
        </CardHeader>
        <CardBody>
          <Empty title="Agenda sem dados" description="Nenhuma informação de agenda disponível." compact />
        </CardBody>
      </Card>
    )
  }

  const occupancy = calcOccupancy(agenda.bookedSlots, agenda.totalSlots)
  const upcoming = (agenda.appointments || []).filter(
    (a) => a.status === 'scheduled' || a.status === 'confirmed'
  )

  return (
    <Card className="today-agenda-card">
      <CardHeader>
        <div className="agenda-card__header">
          <div>
            <CardTitle>Agenda de Hoje</CardTitle>
            <CardSubtitle>
              {agenda.bookedSlots} de {agenda.totalSlots} horários ocupados
            </CardSubtitle>
          </div>
          <Badge variant={occupancy >= 80 ? 'success' : occupancy >= 50 ? 'warning' : 'danger'}>
            {occupancy}% ocupado
          </Badge>
        </div>
      </CardHeader>
      <CardBody>
        <div className="agenda-card__progress-track">
          <div
            className="agenda-card__progress-bar"
            style={{ width: `${occupancy}%` }}
            role="progressbar"
            aria-valuenow={occupancy}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {upcoming.length > 0 ? (
          <div className="agenda-card__list">
            {upcoming.slice(0, 5).map((apt) => (
              <div className="agenda-card__item" key={apt.id}>
                <span className="agenda-card__item-time">{apt.time}</span>
                <div className="agenda-card__item-info">
                  <span className="agenda-card__item-client">{apt.clientName}</span>
                  <span className="agenda-card__item-service">{apt.serviceName} · {apt.professional}</span>
                </div>
                <Badge variant={getAppointmentStatusVariant(apt.status)} className="agenda-card__item-badge">
                  {getAppointmentStatusLabel(apt.status)}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="agenda-card__empty-note">Sem agendamentos pendentes.</p>
        )}

        {agenda.nextFreeSlots?.length > 0 && (
          <div className="agenda-card__free-slots">
            <span className="agenda-card__free-label">Próximos horários livres:</span>
            <div className="agenda-card__free-chips">
              {agenda.nextFreeSlots.map((slot) => (
                <span key={slot} className="agenda-card__free-chip">{slot}</span>
              ))}
            </div>
          </div>
        )}
      </CardBody>
      <CardFooter>
        <Button variant="secondary" size="sm" onClick={() => navigate('/barber/agenda')}>
          <CalendarPlus size={14} />
          <span>Preencher Agenda</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
