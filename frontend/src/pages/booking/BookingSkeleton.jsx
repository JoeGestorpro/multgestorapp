function SkeletonBlock({ width, height, borderRadius, style }) {
  return (
    <div
      className="booking-shimmer"
      style={{
        width: width || '100%',
        height: height || '16px',
        borderRadius: borderRadius || 'var(--bf-radius-sm)',
        ...style
      }}
    />
  )
}

function BookingSkeletonPage() {
  return (
    <div className="booking-flow" style={{ padding: '24px', gap: '20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <SkeletonBlock width="36px" height="36px" borderRadius="var(--bf-radius-sm)" />
        <div style={{ flex: 1 }}>
          <SkeletonBlock width="160px" height="14px" style={{ marginBottom: '4px' }} />
          <SkeletonBlock width="80px" height="10px" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <SkeletonBlock key={i} width="40px" height="24px" borderRadius="50%" />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
        <SkeletonBlock width="180px" height="20px" style={{ margin: '0 auto' }} />
        <SkeletonBlock width="120px" height="12px" style={{ margin: '0 auto 8px' }} />
        {[1, 2, 3].map(i => (
          <SkeletonBlock key={i} height="72px" borderRadius="var(--bf-radius-lg)" />
        ))}
      </div>
    </div>
  )
}

export { SkeletonBlock, BookingSkeletonPage }
