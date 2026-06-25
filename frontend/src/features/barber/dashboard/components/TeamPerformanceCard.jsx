import Card, { CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../../components/design-system/ui/Card'
import Empty from '../../../../components/design-system/feedback/Empty'
import Loading from '../../../../components/design-system/feedback/Skeleton'
import { RankingList, RankingItem } from '../../../../components/design-system/charts/ChartComponents'
import { money } from '../../utils/formatters'

const MEDALS = ['🥇', '🥈', '🥉']

export default function TeamPerformanceCard({ teamPerformance, loading }) {
  if (loading) {
    return (
      <Card className="team-perf-card team-perf-card--loading">
        <Loading size="md" />
      </Card>
    )
  }

  return (
    <Card className="team-perf-card">
      <CardHeader>
        <CardTitle>Performance da Equipe</CardTitle>
        <CardSubtitle>Ranking de hoje</CardSubtitle>
      </CardHeader>
      <CardBody>
        {teamPerformance.length > 0 ? (
          <RankingList>
            {teamPerformance.map((member, i) => (
              <RankingItem
                key={member.id}
                index={MEDALS[i] || `#${i + 1}`}
                name={member.name}
                detail={`${member.appointments} atend. · comissão: ${money(member.commission)}`}
                value={money(member.revenue)}
              />
            ))}
          </RankingList>
        ) : (
          <Empty title="Sem dados de equipe" description="Os dados de performance aparecerão aqui." compact />
        )}
      </CardBody>
    </Card>
  )
}
