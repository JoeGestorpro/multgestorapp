import { useMemo } from 'react'
import { useTenantTheme } from '../../hooks/useTenantTheme'
import './ProgressReport.css'

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(value)
}

function formatPercent(value, previousValue) {
  if (!previousValue || previousValue === 0) return '+100%'
  const change = ((value - previousValue) / previousValue) * 100
  return change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`
}

export default function ProgressReport({ 
  data = {},
  period = 'week',
  onClose 
}) {
  const { primaryColor, companyName } = useTenantTheme()

  const stats = useMemo(() => [
    {
      label: 'Atendimentos',
      value: data.attendances || 0,
      previous: data.previousAttendances || 0,
      icon: 'scissors'
    },
    {
      label: 'Faturamento',
      value: data.revenue || 0,
      previous: data.previousRevenue || 0,
      format: 'money',
      icon: 'money'
    },
    {
      label: 'Comissão média',
      value: data.avgCommission || 0,
      previous: data.previousAvgCommission || 0,
      format: 'money',
      icon: 'percent'
    }
  ], [data])

  const topCollaborator = useMemo(() => {
    if (!data.topCollaborators?.length) return null
    return data.topCollaborators[0]
  }, [data.topCollaborators])

  const topService = useMemo(() => {
    if (!data.topServices?.length) return null
    return data.topServices[0]
  }, [data.topServices])

  const periodLabel = period === 'week' ? 'desta semana' : 'deste mês'

  return (
    <div className="progress-report">
      <div className="progress-report__header">
        <div className="progress-report__title-group">
          <h2>Resumo {periodLabel}</h2>
          <span className="progress-report__company">{companyName}</span>
        </div>
        
        {onClose && (
          <button className="progress-report__close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="progress-report__stats">
        {stats.map((stat) => {
          const change = stat.previous > 0 
            ? ((stat.value - stat.previous) / stat.previous) * 100 
            : stat.value > 0 ? 100 : 0
          const isPositive = change >= 0

          return (
            <div key={stat.label} className="progress-report__stat" style={{ '--accent': primaryColor }}>
              <div className="progress-report__stat-header">
                <span className="progress-report__stat-label">{stat.label}</span>
                <span className={`progress-report__stat-change ${isPositive ? 'positive' : 'negative'}`}>
                  {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(0)}%
                </span>
              </div>
              <div className="progress-report__stat-value">
                {stat.format === 'money' ? formatMoney(stat.value) : stat.value}
              </div>
            </div>
          )
        })}
      </div>

      {(topCollaborator || topService) && (
        <div className="progress-report__highlights">
          {topCollaborator && (
            <div className="progress-report__highlight">
              <span className="progress-report__highlight-label">🏆 Destaque da {periodLabel.split(' ')[1]}</span>
              <div className="progress-report__highlight-content">
                <strong>{topCollaborator.name}</strong>
                <span>{formatMoney(topCollaborator.revenue)} em vendas</span>
              </div>
            </div>
          )}
          
          {topService && (
            <div className="progress-report__highlight">
              <span className="progress-report__highlight-label">✂️ Serviço mais vendido</span>
              <div className="progress-report__highlight-content">
                <strong>{topService.name}</strong>
                <span>{topService.count} atendimentos</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="progress-report__footer">
        <p>Comparado com o período anterior</p>
      </div>
    </div>
  )
}