import { useMemo } from 'react'
import { useTenantTheme } from '../../hooks/useTenantTheme'
import './ModernRankingCard.css'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(value)
}

export default function ModernRankingCard({ title, items = [], metric = 'value', metricLabel = 'R$' }) {
  const { primaryColor } = useTenantTheme()

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => (b[metric] || 0) - (a[metric] || 0)).slice(0, 5)
  }, [items, metric])

  const maxValue = useMemo(() => {
    return Math.max(...sortedItems.map(item => item[metric] || 0), 1)
  }, [sortedItems, metric])

  const getRankStyle = (index) => {
    if (index === 0) return { background: '#FFD700', color: '#000' }
    if (index === 1) return { background: '#C0C0C0', color: '#000' }
    if (index === 2) return { background: '#CD7F32', color: '#fff' }
    return { background: 'var(--bg-elevated)', color: 'var(--text-muted)' }
  }

  if (sortedItems.length === 0) {
    return (
      <div className="ranking-card ranking-card--empty">
        <div className="ranking-card__header">
          <h3>{title}</h3>
        </div>
        <div className="ranking-card__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
          <span>Sem dados ainda</span>
        </div>
      </div>
    )
  }

  return (
    <div className="ranking-card" style={{ '--ranking-accent': primaryColor }}>
      <div className="ranking-card__header">
        <h3>{title}</h3>
        <span className="ranking-card__badge">{sortedItems.length} no radar</span>
      </div>

      <div className="ranking-card__list">
        {sortedItems.map((item, index) => {
          const percentage = ((item[metric] || 0) / maxValue) * 100
          const rankStyle = getRankStyle(index)

          return (
            <div 
              key={item.id || item.collaborator_id || index}
              className="ranking-card__item"
              style={{ '--delay': `${index * 0.1}s` }}
            >
              <div className="ranking-card__rank" style={rankStyle}>
                {index < 3 ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              <div className="ranking-card__avatar">
                {item.avatar ? (
                  <img src={item.avatar} alt={item.name || item.collaborator_name} />
                ) : (
                  getInitials(item.name || item.collaborator_name)
                )}
              </div>

              <div className="ranking-card__info">
                <span className="ranking-card__name">
                  {item.name || item.collaborator_name || 'Usuário'}
                </span>
                <div className="ranking-card__bar">
                  <div 
                    className="ranking-card__bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div className="ranking-card__value">
                <span>{metricLabel} {formatMoney(item[metric] || 0)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}