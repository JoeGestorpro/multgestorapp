import { lazy, Suspense } from 'react'
import Card, { CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../../components/design-system/ui/Card'
import Loading from '../../../../components/design-system/feedback/Skeleton'
import { ChartEmptyState } from '../../../../components/design-system/charts/ChartComponents'
import { money } from '../../utils/formatters'

const LazyChart = lazy(() =>
  import('recharts').then((m) => ({
    default: function RevenueChart({ data }) {
      const { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } = m
      return (
        <ResponsiveContainer width="100%" height={220} debounce={50}>
          <BarChart data={data}>
            <defs>
              <linearGradient id="overviewRevenueGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="var(--success)" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="var(--text-muted)"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            />
            <YAxis
              stroke="var(--text-muted)"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              width={48}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              formatter={(v) => [money(v), 'Faturamento']}
              contentStyle={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: 13
              }}
            />
            <Bar dataKey="total" fill="url(#overviewRevenueGrad)" radius={[6, 6, 2, 2]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      )
    }
  }))
)

export default function RevenueChartCard({ revenueChart, loading }) {
  if (loading) {
    return (
      <Card className="revenue-chart-card revenue-chart-card--loading">
        <Loading size="md" />
      </Card>
    )
  }

  const weekTotal = (revenueChart || []).reduce((sum, d) => sum + d.total, 0)

  return (
    <Card className="revenue-chart-card">
      <CardHeader>
        <div className="revenue-chart__header">
          <div>
            <CardTitle>Tendência de Faturamento</CardTitle>
            <CardSubtitle>Últimos 7 dias</CardSubtitle>
          </div>
          <strong className="revenue-chart__week-total">{money(weekTotal)}</strong>
        </div>
      </CardHeader>
      <CardBody>
        {revenueChart.length > 0 ? (
          <Suspense fallback={<Loading size="sm" />}>
            <LazyChart data={revenueChart} />
          </Suspense>
        ) : (
          <ChartEmptyState title="Sem dados de faturamento" description="Os dados dos últimos 7 dias aparecerão aqui." />
        )}
      </CardBody>
    </Card>
  )
}
