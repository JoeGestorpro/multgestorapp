import { BarberIcon } from '../../components/barber/BarberUI'

function InfoCard({ icon, label, value, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  const extraProps = onClick ? { onClick, type: 'button' } : {}
  const cls = 'booking-info-card' + (onClick ? ' booking-info-card--clickable' : '')
  return (
    <Tag className={cls} {...extraProps}>
      <div className="booking-info-icon">
        <BarberIcon name={icon} />
      </div>
      <div className="booking-info-content">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </Tag>
  )
}

function BookingLandingInfo({ company, onCtaClick }) {
  const hours = company.working_hours?.[0]
  const hoursLabel = hours ? `${hours.day}: ${hours.hours}` : 'Consulte horarios'

  return (
    <section className="booking-info-section">
      <div className="booking-info-grid">
        <InfoCard
          icon="home"
          label="Endereco"
          value={company.address || 'Endereco nao informado'}
        />
        <InfoCard
          icon="phone"
          label="WhatsApp"
          value={company.phone || 'Telefone nao informado'}
          onClick={onCtaClick}
        />
        <InfoCard
          icon="clock"
          label="Horarios"
          value={hoursLabel}
        />
        <InfoCard
          icon="users"
          label="Instagram"
          value={company.instagram || '@barbearia'}
        />
      </div>
    </section>
  )
}

export default BookingLandingInfo
