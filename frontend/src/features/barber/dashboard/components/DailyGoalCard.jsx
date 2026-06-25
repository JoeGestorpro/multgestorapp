import Card, { CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../../components/design-system/ui/Card'
import Badge from '../../../../components/design-system/ui/Badge'
import Loading from '../../../../components/design-system/feedback/Skeleton'
import { calcGoalProgress, getGoalStatus, getGoalStatusLabel, getGoalStatusVariant } from '../rules/overviewRules'
import { money } from '../../utils/formatters'

export default function DailyGoalCard({ dailyGoal, loading }) {
  if (loading) {
    return (
      <Card className="daily-goal-card daily-goal-card--loading">
        <Loading size="md" />
      </Card>
    )
  }

  if (!dailyGoal) {
    return (
      <Card className="daily-goal-card">
        <CardHeader>
          <CardTitle>Meta do Dia</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="daily-goal__empty">Meta não configurada</p>
        </CardBody>
      </Card>
    )
  }

  const progress = calcGoalProgress(dailyGoal.goal, dailyGoal.realized)
  const status = getGoalStatus(progress)
  const remaining = Math.max(0, dailyGoal.goal - dailyGoal.realized)

  return (
    <Card className="daily-goal-card" variant="elevated">
      <CardHeader>
        <div className="daily-goal__header">
          <CardTitle>Meta do Dia</CardTitle>
          <Badge variant={getGoalStatusVariant(status)}>{getGoalStatusLabel(status)}</Badge>
        </div>
        <CardSubtitle>Meta: {money(dailyGoal.goal)}</CardSubtitle>
      </CardHeader>
      <CardBody>
        <div className="daily-goal__value-row">
          <span className="daily-goal__realized">{money(dailyGoal.realized)}</span>
          <span className="daily-goal__percent">{progress}%</span>
        </div>

        <div className="daily-goal__track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`daily-goal__bar daily-goal__bar--${status}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {remaining > 0 && (
          <p className="daily-goal__remaining">
            Faltam <strong>{money(remaining)}</strong> para atingir a meta
          </p>
        )}
      </CardBody>
    </Card>
  )
}
