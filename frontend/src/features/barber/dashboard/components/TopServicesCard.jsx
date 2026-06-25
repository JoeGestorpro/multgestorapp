import Card, { CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../../components/design-system/ui/Card'
import Empty from '../../../../components/design-system/feedback/Empty'
import Loading from '../../../../components/design-system/feedback/Skeleton'
import { RankingList, RankingItem } from '../../../../components/design-system/charts/ChartComponents'
import { money } from '../../utils/formatters'

export default function TopServicesCard({ topServices, loading }) {
  if (loading) {
    return (
      <Card className="top-services-card top-services-card--loading">
        <Loading size="md" />
      </Card>
    )
  }

  return (
    <Card className="top-services-card">
      <CardHeader>
        <CardTitle>Serviços Mais Vendidos</CardTitle>
        <CardSubtitle>Por receita — período atual</CardSubtitle>
      </CardHeader>
      <CardBody>
        {topServices.length > 0 ? (
          <RankingList>
            {topServices.map((service, i) => (
              <RankingItem
                key={service.id}
                index={`#${i + 1}`}
                name={service.name}
                detail={`${service.quantity} atendimento${service.quantity !== 1 ? 's' : ''}`}
                value={money(service.revenue)}
              />
            ))}
          </RankingList>
        ) : (
          <Empty title="Sem dados de serviços" description="Os serviços mais vendidos aparecerão aqui." compact />
        )}
      </CardBody>
    </Card>
  )
}
