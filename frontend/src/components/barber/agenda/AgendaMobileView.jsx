import { memo } from 'react'
import { BarberButton, BarberIcon } from '../BarberUI'

function AgendaMobileView({
  appointments,
  onSelectAppointment,
  onOpenComposer,
  isCollaborator
}) {
  return (
    <div className="agenda-mobile-view">
      {!isCollaborator && (
        <BarberButton
          className="agenda-mobile-create-btn"
          onClick={onOpenComposer}
          type="button"
          variant="primary"
        >
          <BarberIcon name="plus" />
          Novo Agendamento
        </BarberButton>
      )}

      <div className="agenda-mobile-list">
        {appointments.map((app) => (
          <button
            className={`agenda-mobile-item status-${app.status || 'scheduled'}`}
            key={app.id}
            onClick={() => onSelectAppointment(app)}
            type="button"
          >
            <div className="agenda-mobile-item-head">
              <span className={`agenda-mobile-item-dot status-${app.status || 'scheduled'}`} />
              <strong>{app.customer_name || 'Cliente'}</strong>
              <small>{app.timeCompactLabel || app.timeLabel || '--:--'}</small>
            </div>
            <p>{app.service_name || 'Serviço'}</p>
            <div className="agenda-mobile-item-meta">
              <span>{app.collaborator_name}</span>
              {app.duration_label && <span>{app.duration_label}</span>}
            </div>
          </button>
        ))}
        {appointments.length === 0 && (
          <div className="agenda-mobile-empty">
            <p>Sem atendimentos para o dia selecionado.</p>
          </div>
        )}
      </div>

      {/* FAB */}
      {!isCollaborator && (
        <button
          className="agenda-mobile-fab"
          onClick={onOpenComposer}
          type="button"
          aria-label="Novo agendamento"
        >
          <BarberIcon name="plus" />
        </button>
      )}
    </div>
  )
}

export default memo(AgendaMobileView)
