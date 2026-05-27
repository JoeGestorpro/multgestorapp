// Mapa de icones SVG inline para os diferenciais
const DIFF_ICONS = {
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  shield: 'M12 2s8 4 8 10c0 6-8 10-8 10s-8-4-8-10c0-6 8-10 8-10zm0 2.5v15',
  clock: 'M12 7v5l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0',
  spray: 'M7 3h10v4l-3 4v4h-4v-4L7 7V3zm4 14h2v4h-2z',
}

function DiffIcon({ name }) {
  const path = DIFF_ICONS[name]
  if (!path) return null
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

function BookingLandingDifferentials({ company }) {
  const diffs = company.differentials || []

  return (
    <section className="booking-diffs">
      <h2>Nossos diferenciais</h2>
      <div className="booking-diffs-grid">
        {diffs.map((item, idx) => (
          <div key={idx} className="booking-diff-card">
            <div className="booking-diff-icon">
              <DiffIcon name={item.icon} />
            </div>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default BookingLandingDifferentials
