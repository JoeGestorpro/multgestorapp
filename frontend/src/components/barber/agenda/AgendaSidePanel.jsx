import { memo } from 'react'
import { BarberButton, BarberIcon } from '../BarberUI'

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

function AgendaSidePanel({
  miniCalendar,
  selectedDate,
  onDateChange,
  todayAppointments,
  stats,
  onViewAll,
  nextOpeningLabel,
  openAppointmentComposer,
  collaboratorsCount
}) {
  const firstDayOfWeek = new Date(miniCalendar.days[0]?.date || Date.now()).getDay()
  const emptyCells = firstDayOfWeek

  if (!miniCalendar?.days) return null

  const appointmentDates = new Set(
    todayAppointments.map((a) => a.dateKey)
  )

  return (
    <aside className="agenda-sidepanel">
      {/* Mini Calendário */}
      <div className="agenda-sidepanel-card">
        <div className="agenda-sidepanel-card-header">
          <span className="agenda-sidepanel-label">Calendário</span>
          <div className="agenda-sidepanel-card-actions">
            <button
              className="agenda-sidepanel-icon-btn"
              onClick={miniCalendar.goPrevMonth}
              type="button"
              aria-label="Mês anterior"
            >
              <BarberIcon name="chevronRight" />
            </button>
            <strong className="agenda-sidepanel-month">
              {miniCalendar.monthLabel}
            </strong>
            <button
              className="agenda-sidepanel-icon-btn"
              onClick={miniCalendar.goNextMonth}
              type="button"
              aria-label="Próximo mês"
            >
              <BarberIcon name="chevronRight" />
            </button>
          </div>
        </div>
        <div className="agenda-sidepanel-calendar-grid">
          {DAY_NAMES.map((day) => (
            <span key={day} className="agenda-sidepanel-day-name">{day}</span>
          ))}
          {Array.from({ length: emptyCells }).map((_, i) => (
            <div key={`empty-${i}`} className="agenda-sidepanel-day empty" />
          ))}
          {miniCalendar.days.map((day) => {
            const isSelected = day.date === selectedDate
            const hasAppointment = appointmentDates.has(day.date)
            return (
              <button
                key={day.key}
                className={[
                  'agenda-sidepanel-day',
                  isSelected ? 'active' : '',
                  day.inMonth ? '' : 'muted',
                  hasAppointment && !isSelected ? 'has-appointment' : ''
                ].filter(Boolean).join(' ')}
                onClick={() => onDateChange(day.date)}
                type="button"
              >
                {day.day}
                {hasAppointment && !isSelected && (
                  <span className="agenda-sidepanel-day-dot" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Hoje — Lista Compacta */}
      <div className="agenda-sidepanel-card">
        <div className="agenda-sidepanel-card-header">
          <span className="agenda-sidepanel-label">Hoje</span>
          {todayAppointments.length > 5 && (
            <button className="agenda-sidepanel-text-btn" onClick={onViewAll} type="button">
              Ver todos
            </button>
          )}
        </div>
        <div className="agenda-sidepanel-today-list">
          {todayAppointments.slice(0, 6).map((appointment) => (
            <div className="agenda-sidepanel-today-item" key={appointment.id}>
              <span className={`agenda-sidepanel-today-dot status-${appointment.status || 'scheduled'}`} />
              <span className="agenda-sidepanel-today-time">
                {appointment.timeCompactLabel || appointment.timeLabel || '--:--'}
              </span>
              <div className="agenda-sidepanel-today-info">
                <strong>{appointment.customer_name || 'Cliente'}</strong>
                <span>{appointment.service_name || 'Serviço'}</span>
              </div>
            </div>
          ))}
          {todayAppointments.length === 0 && (
            <p className="agenda-sidepanel-empty">Sem atendimentos para hoje.</p>
          )}
        </div>
      </div>

      {/* Resumo do Dia */}
      <div className="agenda-sidepanel-card">
        <span className="agenda-sidepanel-label">Resumo</span>
        <div className="agenda-sidepanel-stats">
          <div className="agenda-sidepanel-stat">
            <span className="agenda-sidepanel-stat-value">{stats.total}</span>
            <span className="agenda-sidepanel-stat-label">Total</span>
          </div>
          <div className="agenda-sidepanel-stat">
            <span className="agenda-sidepanel-stat-value">{stats.confirmed}</span>
            <span className="agenda-sidepanel-stat-label">Confirmados</span>
          </div>
          <div className="agenda-sidepanel-stat">
            <span className="agenda-sidepanel-stat-value">{stats.noShow}</span>
            <span className="agenda-sidepanel-stat-label">Faltas</span>
          </div>
          <div className="agenda-sidepanel-stat">
            <span className="agenda-sidepanel-stat-value">{stats.collaborators || collaboratorsCount || '-'}</span>
            <span className="agenda-sidepanel-stat-label">Barbeiros</span>
          </div>
        </div>
        <div className="agenda-sidepanel-hours">
          <BarberIcon name="clock" />
          <span>{nextOpeningLabel || '08:00 - 20:00'}</span>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="agenda-sidepanel-card">
        <span className="agenda-sidepanel-label">Ações</span>
        <div className="agenda-sidepanel-actions">
          <BarberButton onClick={openAppointmentComposer} type="button" variant="primary">
            <BarberIcon name="plus" />
            Novo Agendamento
          </BarberButton>
        </div>
      </div>
    </aside>
  )
}

export default memo(AgendaSidePanel)
