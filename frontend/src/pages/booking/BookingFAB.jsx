import { BarberIcon } from '../../components/barber/BarberUI'

function BookingFAB({ onClick, visible }) {
  return (
    <div className={`booking-fab-wrapper${visible ? ' booking-fab-visible' : ''}`}>
      <button
        className="booking-fab"
        onClick={onClick}
        type="button"
        aria-label="Agendar Horario"
      >
        <BarberIcon name="scissors" />
      </button>
      <span className="booking-fab-label">Agendar Horario</span>
    </div>
  )
}

export default BookingFAB
