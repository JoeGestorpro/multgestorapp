import { Play, Clock, Scissors, User, DollarSign } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardBody, CardFooter } from '../../../../components/design-system/ui/Card'
import Badge from '../../../../components/design-system/ui/Badge'
import Button from '../../../../components/design-system/ui/Button'
import Empty from '../../../../components/design-system/feedback/Empty'
import Loading from '../../../../components/design-system/feedback/Skeleton'
import { getAppointmentStatusLabel, getAppointmentStatusVariant } from '../rules/overviewRules'
import { money } from '../../utils/formatters'

export default function NextAppointmentCard({ appointment, loading }) {
  if (loading) {
    return (
      <Card variant="elevated" className="next-appointment-card next-appointment-card--loading">
        <Loading size="md" />
      </Card>
    )
  }

  if (!appointment) {
    return (
      <Card variant="elevated" className="next-appointment-card">
        <CardHeader>
          <CardTitle>Próximo Atendimento</CardTitle>
        </CardHeader>
        <CardBody>
          <Empty
            title="Nenhum atendimento agendado"
            description="Não há atendimentos pendentes para hoje. Use a agenda para preencher os horários."
            actionLabel="Ir para a agenda"
            onAction={() => {}}
            compact
          />
        </CardBody>
      </Card>
    )
  }

  return (
    <Card variant="elevated" className="next-appointment-card">
      <CardHeader>
        <div className="next-apt__header">
          <div>
            <CardTitle>Próximo Atendimento</CardTitle>
            <p className="next-apt__time-label">
              <Clock size={14} />
              <span>{appointment.time}</span>
            </p>
          </div>
          <Badge variant={getAppointmentStatusVariant(appointment.status)}>
            {getAppointmentStatusLabel(appointment.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardBody>
        <div className="next-apt__body">
          <div className="next-apt__avatar">
            {appointment.clientName?.slice(0, 1) || '?'}
          </div>
          <div className="next-apt__details">
            <div className="next-apt__detail-row">
              <User size={14} />
              <span className="next-apt__client">{appointment.clientName}</span>
            </div>
            <div className="next-apt__detail-row">
              <Scissors size={14} />
              <span>{appointment.serviceName}</span>
            </div>
            <div className="next-apt__detail-row">
              <DollarSign size={14} />
              <span>{money(appointment.value)}</span>
            </div>
            <p className="next-apt__professional">
              Profissional: <strong>{appointment.professionalName}</strong>
            </p>
          </div>
        </div>
      </CardBody>
      <CardFooter>
        <Button variant="primary" size="md" className="next-apt__cta">
          <Play size={16} />
          <span>Iniciar Atendimento</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
