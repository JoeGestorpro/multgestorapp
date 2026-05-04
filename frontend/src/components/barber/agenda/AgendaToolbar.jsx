import { BarberButton, BarberIcon } from '../BarberUI'

function formatSelectedDate(dateValue, mode) {
  if (!dateValue) {
    return 'Agenda'
  }

  const date = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return 'Agenda'
  }

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    weekday: mode === 'week' ? 'short' : 'long',
    day: '2-digit',
    month: 'long'
  })

  return formatter.format(date)
}

export default function AgendaToolbar({
  selectedDate,
  mode,
  onToday,
  onPrev,
  onNext,
  onToggleFilters,
  showFilters,
  onModeChange
}) {
  return (
    <div className="agenda-toolbar">
      <div className="agenda-toolbar-primary">
        <BarberButton onClick={onToday} type="button" variant="ghost">
          Hoje
        </BarberButton>

        <div className="agenda-toolbar-nav">
          <button className="agenda-toolbar-nav-button" onClick={onPrev} type="button">
            <BarberIcon name="chevron-left" />
          </button>
          <button className="agenda-toolbar-nav-button" onClick={onNext} type="button">
            <BarberIcon name="chevron-right" />
          </button>
        </div>

        <div className="agenda-toolbar-date">
          <strong>{formatSelectedDate(selectedDate, mode)}</strong>
          <span>{mode === 'week' ? 'Semana em foco' : 'Dia em foco'}</span>
        </div>
      </div>

      <div className="agenda-toolbar-secondary">
        <button
          className={`agenda-toolbar-filter-button ${showFilters ? 'active' : ''}`.trim()}
          onClick={onToggleFilters}
          type="button"
        >
          <BarberIcon name="settings" />
          <span>Filtros</span>
        </button>

        <div className="agenda-toolbar-mode">
          <button
            className={mode === 'day' ? 'active' : ''}
            onClick={() => onModeChange('day')}
            type="button"
          >
            Dia
          </button>
          <button
            className={mode === 'week' ? 'active' : ''}
            onClick={() => onModeChange('week')}
            type="button"
          >
            Semana
          </button>
        </div>
      </div>
    </div>
  )
}
