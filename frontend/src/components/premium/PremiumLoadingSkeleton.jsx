import './PremiumLoadingSkeleton.css'

export default function PremiumLoadingSkeleton({ rows = 3, type = 'table' }) {
  if (type === 'card') {
    return (
      <div className="pm-skeleton-grid">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="pm-skeleton-card">
            <div className="pm-skeleton-line w-40" />
            <div className="pm-skeleton-line w-70 h-32" />
            <div className="pm-skeleton-line w-50" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="pm-skeleton-table">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="pm-skeleton-row">
          <div className="pm-skeleton-line w-30" />
          <div className="pm-skeleton-line w-50" />
          <div className="pm-skeleton-line w-20" />
          <div className="pm-skeleton-line w-15" />
        </div>
      ))}
    </div>
  )
}

export function PremiumSkeletonLine({ width = '100%', height = 14 }) {
  return (
    <div
      className="pm-skeleton-line"
      style={{ width: typeof width === 'string' ? width : `${width}px`, height }}
    />
  )
}
