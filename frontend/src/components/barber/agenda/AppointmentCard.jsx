import CollaboratorAvatar from '../CollaboratorAvatar'

const STATUS_LABELS = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  arrived: 'Chegou',
  in_progress: 'Em atendimento',
  completed: 'Finalizado',
  no_show: 'Falta',
  canceled: 'Cancelado',
  blocked: 'Bloqueado'
}

export default function AppointmentCard({
  appointment,
  top,
  height,
  laneIndex,
  laneCount,
  onClick
}) {
  const laneWidth = 100 / Math.max(laneCount, 1)
  const left = laneWidth * laneIndex

  return (
    <button
      className={`agenda-appointment-card status-${appointment.status || 'scheduled'}`}
      onClick={() => onClick(appointment)}
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 36)}px`,
        left: `calc(${left}% + 4px)`,
        width: `calc(${laneWidth}% - 8px)`
      }}
      type="button"
    >
      <div className="agenda-appointment-head">
        <span className="agenda-appointment-status">
          {STATUS_LABELS[appointment.status] || 'Agendado'}
        </span>
        <small>{appointment.timeCompactLabel || appointment.timeLabel || '--:--'}</small>
      </div>
      <strong>{appointment.service_name || appointment.reason || 'Servico'}</strong>
      <p>{appointment.customer_name || 'Cliente'}</p>
      <small>{appointment.slotLabel || '-'}</small>
      {appointment.status !== 'blocked' && (
        <CollaboratorAvatar
          avatarUrl={appointment.customer_avatar_url || ''}
          className="agenda-appointment-avatar"
          name={appointment.customer_name}
          size="sm"
        />
      )}
    </button>
  )
}
