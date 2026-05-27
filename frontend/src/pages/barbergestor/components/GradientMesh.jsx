export function GradientMesh({ className = '', style }) {
  return (
    <svg
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        ...style,
      }}
      viewBox="0 0 1440 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mesh-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5e9d4" stopOpacity="0.15" />
          <stop offset="25%" stopColor="#f96bee" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#533afd" stopOpacity="0.1" />
          <stop offset="75%" stopColor="#ea2261" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#533afd" stopOpacity="0.12" />
        </linearGradient>
        <radialGradient id="mesh-rad-1" cx="30%" cy="20%" r="50%">
          <stop offset="0%" stopColor="#533afd" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#533afd" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mesh-rad-2" cx="70%" cy="80%" r="40%">
          <stop offset="0%" stopColor="#ea2261" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ea2261" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="800" fill="url(#mesh-grad-1)" />
      <rect width="1440" height="800" fill="url(#mesh-rad-1)" />
      <rect width="1440" height="800" fill="url(#mesh-rad-2)" />
    </svg>
  )
}
