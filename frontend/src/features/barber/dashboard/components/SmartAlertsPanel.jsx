import { AlertTriangle, Info, ShieldAlert } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardBody } from '../../../../components/design-system/ui/Card'
import Badge from '../../../../components/design-system/ui/Badge'
import { sortAlertsByPriority, getAlertPriorityVariant, getAlertPriorityLabel } from '../rules/overviewRules'

const PRIORITY_ICONS = {
  high: ShieldAlert,
  medium: AlertTriangle,
  low: Info
}

function AlertRow({ alert }) {
  const Icon = PRIORITY_ICONS[alert.priority] || Info
  const variant = getAlertPriorityVariant(alert.priority)

  return (
    <div className={`smart-alert smart-alert--${alert.priority}`}>
      <div className={`smart-alert__icon smart-alert__icon--${alert.priority}`}>
        <Icon size={18} />
      </div>
      <div className="smart-alert__content">
        <div className="smart-alert__title">{alert.title}</div>
        <p className="smart-alert__desc">{alert.description}</p>
      </div>
      <Badge variant={variant} className="smart-alert__badge">
        {getAlertPriorityLabel(alert.priority)}
      </Badge>
    </div>
  )
}

export default function SmartAlertsPanel({ alerts, loading }) {
  if (loading || !alerts?.length) return null

  const sorted = sortAlertsByPriority(alerts)
  const highCount = sorted.filter((a) => a.priority === 'high').length

  return (
    <Card className="smart-alerts-panel">
      <CardHeader>
        <div className="smart-alerts__header">
          <CardTitle>Alertas Inteligentes</CardTitle>
          {highCount > 0 && (
            <Badge variant="danger">{highCount} urgente{highCount !== 1 ? 's' : ''}</Badge>
          )}
        </div>
      </CardHeader>
      <CardBody>
        <div className="smart-alerts__list">
          {sorted.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
