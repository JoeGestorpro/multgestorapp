import './SkeletonLoader.css'

export function Skeleton({ width, height, borderRadius = 'var(--radius-md)', className = '' }) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  )
}

export function SkeletonText({ lines = 3, width = '100%' }) {
  return (
    <div className="skeleton-text">
      {[...Array(lines)].map((_, i) => (
        <div 
          key={i} 
          className="skeleton-text__line"
          style={{ 
            width: i === lines - 1 ? '60%' : width,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ height = 120 }) {
  return (
    <div className="skeleton-card" style={{ height }}>
      <div className="skeleton-card__header">
        <Skeleton width={40} height={40} borderRadius="var(--radius-md)" />
        <div className="skeleton-card__header-text">
          <Skeleton width={120} height={14} />
          <Skeleton width={80} height={12} />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table__header">
        {[...Array(cols)].map((_, i) => (
          <Skeleton key={i} width="80%" height={12} />
        ))}
      </div>
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table__row">
          {[...Array(cols)].map((_, colIndex) => (
            <Skeleton key={colIndex} width="70%" height={14} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart({ height = 200 }) {
  return (
    <div className="skeleton-chart" style={{ height }}>
      <div className="skeleton-chart__bars">
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <div key={i} className="skeleton-chart__bar" style={{ '--bar-height': `${h}%`, '--delay': `${i * 0.1}s` }} />
        ))}
      </div>
      <div className="skeleton-chart__axis">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} width={24} height={10} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonList({ items = 3, avatar = true }) {
  return (
    <div className="skeleton-list">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="skeleton-list__item" style={{ '--delay': `${i * 0.1}s` }}>
          {avatar && <Skeleton width={40} height={40} borderRadius="var(--radius-full)" />}
          <div className="skeleton-list__content">
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={12} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SkeletonLoader({ variant = 'card', count = 1, ...props }) {
  const variants = {
    card: <SkeletonCard {...props} />,
    table: <SkeletonTable {...props} />,
    chart: <SkeletonChart {...props} />,
    list: <SkeletonList {...props} />,
    text: <SkeletonText {...props} />
  }

  if (count === 1) {
    return variants[variant] || variants.card
  }

  return (
    <div className="skeleton-group">
      {[...Array(count)].map((_, i) => (
        <div key={i}>{variants[variant] || variants.card}</div>
      ))}
    </div>
  )
}