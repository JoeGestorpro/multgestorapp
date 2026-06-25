import { MessageCircle, Crown } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../../components/design-system/ui/Card'
import Badge from '../../../../components/design-system/ui/Badge'
import Button from '../../../../components/design-system/ui/Button'
import Empty from '../../../../components/design-system/feedback/Empty'
import Loading from '../../../../components/design-system/feedback/Skeleton'
import { buildWhatsAppUrl } from '../rules/overviewRules'

export default function RecoveryClientsCard({ recoveryClients, loading }) {
  if (loading) {
    return (
      <Card className="recovery-card recovery-card--loading">
        <Loading size="md" />
      </Card>
    )
  }

  return (
    <Card className="recovery-card">
      <CardHeader>
        <CardTitle>Clientes para Recuperação</CardTitle>
        <CardSubtitle>Sem visita nos últimos 28+ dias</CardSubtitle>
      </CardHeader>
      <CardBody>
        {recoveryClients.length > 0 ? (
          <div className="recovery-list">
            {recoveryClients.map((client) => (
              <div className="recovery-item" key={client.id}>
                <div className="recovery-item__avatar">
                  {client.name.slice(0, 1)}
                </div>
                <div className="recovery-item__info">
                  <div className="recovery-item__name">
                    {client.name}
                    {client.isVip && (
                      <Crown size={12} className="recovery-item__vip" />
                    )}
                  </div>
                  <span className="recovery-item__days">
                    {client.daysSince} dias sem retorno
                  </span>
                </div>
                <div className="recovery-item__actions">
                  <Badge variant={client.daysSince >= 45 ? 'danger' : client.daysSince >= 35 ? 'warning' : 'info'}>
                    {client.daysSince}d
                  </Badge>
                  <a
                    href={buildWhatsAppUrl(client.phone, client.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={-1}
                  >
                    <Button variant="ghost" size="sm" iconOnly>
                      <MessageCircle size={16} />
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="Nenhum cliente para recuperar" description="Todos os seus clientes visitaram recentemente." compact />
        )}
      </CardBody>
    </Card>
  )
}
