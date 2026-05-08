import { BarberBadge, BarberButton } from '../BarberUI'
import CollaboratorAvatar from '../CollaboratorAvatar'

const STATUS_TONES = {
  scheduled: 'pending',
  confirmed: 'approved',
  arrived: 'admin',
  in_progress: 'pix',
  completed: 'cash',
  no_show: 'danger',
  canceled: 'neutral',
  blocked: 'neutral'
}

const STATUS_LABELS = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  arrived: 'Chegou',
  in_progress: 'Em atendimento',
  completed: 'Finalizado',
  no_show: 'Faltou',
  canceled: 'Cancelado',
  blocked: 'Bloqueado'
}

function infoValue(value) {
  return value || '-'
}

export default function AppointmentDetailsPanel({
  appointment,
  isCollaborator,
  onConfirm,
  onArrived,
  onStart,
  onComplete,
  onCancel,
  onReschedule,
  onClose
}) {
  if (!appointment) return null;

  return (
    <>
      <div className="barber-drawer-backdrop" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999 }} />
      <aside className="agenda-details-panel">
        <div className="agenda-details-header">
          <div>
            <span>Agendamento</span>
            <strong>{appointment.service_name || appointment.reason || 'Detalhes do agendamento'}</strong>
          </div>
          <button className="agenda-details-close" onClick={onClose} type="button" style={{ background: 'transparent', border: 0, color: 'var(--barber-soft)', fontSize: '14px', cursor: 'pointer' }}>
            ✕ Fechar
          </button>
        </div>

        <div className={`agenda-details-status status-${appointment.status || 'scheduled'}`}>
          <div>
            <span>Status</span>
            <strong>{STATUS_LABELS[appointment.status] || appointment.status || 'Agendado'}</strong>
          </div>
          <BarberBadge tone={STATUS_TONES[appointment.status] || 'neutral'}>
            {STATUS_LABELS[appointment.status] || appointment.status || 'Agendado'}
          </BarberBadge>
        </div>

        <div className="agenda-details-meta">
          <div className="agenda-details-meta-row">
            <span>Data</span>
            <strong>{infoValue(appointment.appointment_date_label || appointment.appointment_date)}</strong>
          </div>
          <div className="agenda-details-meta-row">
            <span>Horario</span>
            <strong>{infoValue(appointment.slotLabel)}</strong>
          </div>
        </div>

        <div className="agenda-details-client">
          <CollaboratorAvatar
            avatarUrl={appointment.customer_avatar_url || ''}
            className="agenda-details-client-avatar"
            name={appointment.customer_name || 'Cliente'}
          />
          <div>
            <strong>{infoValue(appointment.customer_name)}</strong>
            <span>{infoValue(appointment.customer_phone)}</span>
          </div>
        </div>

        <div className="agenda-details-section">
          <div className="agenda-details-meta-row">
            <span>Servico</span>
            <strong>{infoValue(appointment.service_name || appointment.reason)}</strong>
          </div>
          <div className="agenda-details-meta-row">
            <span>Profissional</span>
            <strong>{infoValue(appointment.collaborator_name)}</strong>
          </div>
          <div className="agenda-details-meta-row">
            <span>Valor</span>
            <strong>{appointment.service_price_label || '-'}</strong>
          </div>
          <div className="agenda-details-meta-row">
            <span>Duracao</span>
            <strong>{appointment.duration_label || '-'}</strong>
          </div>
        </div>

        <div className="agenda-details-section">
          <span>Observacoes</span>
          <p style={{ color: 'var(--barber-soft)' }}>{appointment.notes || appointment.canceled_reason || 'Sem observacoes registradas.'}</p>
        </div>

        {appointment.status !== 'blocked' && (
          <div className="agenda-details-actions" style={{ display: 'grid', gap: '10px', marginTop: 'auto' }}>
            {appointment.status === 'scheduled' && (
              <BarberButton onClick={() => onConfirm(appointment.id)} type="button" variant="secondary">
                Confirmar
              </BarberButton>
            )}
            {appointment.status === 'confirmed' && (
              <BarberButton onClick={() => onArrived(appointment.id)} type="button" variant="secondary">
                Chegou
              </BarberButton>
            )}
            {appointment.status === 'arrived' && (
              <BarberButton onClick={() => onStart(appointment.id)} type="button" variant="primary">
                Iniciar
              </BarberButton>
            )}
            {appointment.status === 'in_progress' && (
              <BarberButton onClick={() => onComplete(appointment.id)} type="button" variant="primary">
                Finalizar
              </BarberButton>
            )}
            {!isCollaborator && !['canceled', 'completed', 'no_show'].includes(appointment.status) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <BarberButton onClick={() => onReschedule(appointment)} type="button" variant="ghost">
                  Remarcar
                </BarberButton>
                <BarberButton onClick={() => onCancel(appointment)} type="button" variant="danger">
                  Cancelar
                </BarberButton>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
