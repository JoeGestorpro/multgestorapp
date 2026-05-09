import './Skeleton.css'

export function Skeleton({ variant = 'text', width, height, className = '' }) {
  return (
    <div
      className={[
        'ds-skeleton',
        `ds-skeleton--${variant}`,
        className
      ].filter(Boolean).join(' ')}
      style={{ width, height }}
    />
  )
}

export function SkeletonGroup({ children, count = 3, gap = 'md' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `var(--space-${gap})` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{children}</div>
      ))}
    </div>
  )
}

export default function Loading({ size = 'md', className = '' }) {
  return (
    <div
      className={[
        'ds-loading',
        `ds-loading--${size}`,
        className
      ].filter(Boolean).join(' ')}
    >
      <div className="ds-loading__spinner" />
    </div>
  )
}

Loading.sizes = ['sm', 'md', 'lg']