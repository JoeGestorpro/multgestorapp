import { BarberIcon } from '../../components/barber/BarberUI'

function BookingSideCard({ activeStep, onStart, children, showBooking, company }) {
  const colors = company?.colors || {}
  const ctaBg = colors.primary || 'var(--bf-accent)'
  const ctaTextColor = colors.button_text || '#000000'
  if (!showBooking) {
    return (
      <aside className="booking-side-card">
        <div className="booking-side-welcome">
          <div className="booking-side-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--bf-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 6.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zm0 6a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM20 4L9.6 10.2M20 20L9.6 13.8" />
            </svg>
          </div>
          <h3>Agende seu horario</h3>
          <p>Escolha o servico, profissional e horario ideal para voce</p>
          <button className="booking-hero-cta" onClick={onStart} type="button"
            style={{ background: ctaBg, color: ctaTextColor }}>
            <BarberIcon name="scissors" />
            <span>Agendar Horario</span>
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="booking-side-card">
      <div className="booking-flow-steps">
        {children}
      </div>
    </aside>
  )
}

export default BookingSideCard
