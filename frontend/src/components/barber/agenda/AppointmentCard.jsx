import { memo } from 'react'
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

function AppointmentCard({
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
        <span className="agenda-appointment-status-dot" />
        <span className="agenda-appointment-status">
          {STATUS_LABELS[appointment.status] || 'Agendado'}
        </span>
        <small>{appointment.timeCompactLabel || appointment.timeLabel || '--:--'}</small>
      </div>
      <strong className="agenda-appointment-customer">
        {appointment.customer_name || 'Cliente'}
      </strong>
      <p className="agenda-appointment-service">
        {appointment.service_name || appointment.reason || 'Servico'}
      </p>
      <small className="agenda-appointment-meta">
        {appointment.collaborator_name || appointment.slotLabel || '-'}
        {appointment.duration_label ? ` · ${appointment.duration_label}` : ''}
      </small>
      {appointment.status !== 'blocked' && appointment.customer_avatar_url && (
        <CollaboratorAvatar
          avatarUrl={appointment.customer_avatar_url}
          className="agenda-appointment-avatar"
          name={appointment.customer_name}
          size="sm"
        />
      )}
    </button>
  )
}

export default memo(AppointmentCard)
