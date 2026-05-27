import { BarberIcon } from '../../components/barber/BarberUI'

const HERO_FALLBACK_GRADIENT = 'linear-gradient(135deg, #161622 0%, #0f0f17 50%, #08080d 100%)'

function BookingLandingHero({ company, onCtaClick }) {
  const hours = company.working_hours?.[0]
  const hoursLabel = hours ? `${hours.day}: ${hours.hours}` : null
  const rating = company.rating
  const ratingStars = rating ? '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating)) : null
  const tagline = company.slogan || company.description
  const ctaText = company.button_text || 'Agendar Horario'
  const colors = company.colors || {}
  const ctaBg = colors.primary || 'var(--bf-accent)'
  const ctaTextColor = colors.button_text || '#000000'

  return (
    <section className="booking-hero">
      <div
        className="booking-hero-bg"
        style={{
          backgroundImage: company.banner_url
            ? `url(${company.banner_url})`
            : HERO_FALLBACK_GRADIENT,
          backgroundSize: company.banner_url ? 'cover' : undefined
        }}
      >
        <div className="booking-hero-overlay" />
      </div>
      <div className="booking-hero-mesh" />
      <div className="booking-hero-content">
        <div className="booking-hero-badge">
          <BarberIcon name="check" />
          <span>Agende Online</span>
        </div>
        <h1 className="booking-hero-title">{company.name || 'Barbearia'}</h1>
        {tagline && <p className="booking-hero-tagline">{tagline}</p>}

        <div className="booking-hero-info">
          {company.address && (
            <div className="booking-hero-info-item">
              <BarberIcon name="home" />
              <span>{company.address}</span>
            </div>
          )}
          {hoursLabel && (
            <div className="booking-hero-info-item">
              <BarberIcon name="clock" />
              <span>{hoursLabel}</span>
            </div>
          )}
          {rating && (
            <div className="booking-hero-info-item booking-hero-rating">
              <span className="booking-hero-stars">{ratingStars}</span>
              <span>{rating.toFixed(1)} ({company.reviews_count || 0} avaliacoes)</span>
            </div>
          )}
        </div>

        <button className="booking-hero-cta" onClick={onCtaClick} type="button"
          style={{ background: ctaBg, color: ctaTextColor }}>
          <BarberIcon name="scissors" />
          <span>{ctaText}</span>
        </button>
        <div className="booking-hero-scroll" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </div>
    </section>
  )
}

export default BookingLandingHero
