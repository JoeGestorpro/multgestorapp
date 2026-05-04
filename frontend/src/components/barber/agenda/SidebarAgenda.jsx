import { BarberButton, BarberCard } from '../BarberUI'

export default function SidebarAgenda({
  miniCalendar,
  selectedDate,
  onDateChange,
  todayAppointments,
  stats,
  onViewAll,
  nextOpeningLabel
}) {
  return (
    <aside className="agenda-sidebar">
      <BarberCard className="agenda-sidebar-card">
        <div className="agenda-mini-calendar-header">
          <strong>{miniCalendar.monthLabel}</strong>
          <div className="agenda-mini-calendar-nav">
            <button onClick={miniCalendar.goPrevMonth} type="button">-</button>
            <button onClick={miniCalendar.goNextMonth} type="button">+</button>
          </div>
        </div>
        <div className="agenda-mini-calendar-grid">
          {miniCalendar.days.map((day) => (
            <button
              className={`agenda-mini-day ${day.date === selectedDate ? 'active' : ''} ${day.inMonth ? '' : 'muted'}`}
              key={day.key}
              onClick={() => onDateChange(day.date)}
              type="button"
            >
              {day.day}
            </button>
          ))}
        </div>
      </BarberCard>

      <BarberCard className="agenda-sidebar-card">
        <div className="agenda-sidebar-title-row">
          <h3>Hoje</h3>
          <button onClick={onViewAll} type="button">Ver tudo</button>
        </div>
        <div className="agenda-today-list">
          {todayAppointments.slice(0, 6).map((appointment) => (
            <div className="agenda-today-item" key={appointment.id}>
              <span>{appointment.timeLabel}</span>
              <strong>{appointment.customer_name}</strong>
              <small>{appointment.service_name}</small>
            </div>
          ))}
          {todayAppointments.length === 0 && <p className="agenda-sidebar-empty">Sem atendimentos para hoje.</p>}
        </div>
      </BarberCard>

      <BarberCard className="agenda-sidebar-card agenda-stats-card">
        <div>
          <span>Total do dia</span>
          <strong>{stats.total}</strong>
        </div>
        <div>
          <span>Confirmados</span>
          <strong>{stats.confirmed}</strong>
        </div>
        <div>
          <span>Faltas</span>
          <strong>{stats.noShow}</strong>
        </div>
        <div>
          <span>Funcionamento</span>
          <strong>{nextOpeningLabel || '08:00 - 20:00'}</strong>
        </div>
      </BarberCard>
    </aside>
  )
}
