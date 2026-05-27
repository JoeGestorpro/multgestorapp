import { memo } from 'react'
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

function AppointmentDetailsPanel({
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
  if (!appointment) return null

  return (
    <>
      <div className="barber-drawer-backdrop" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999 }} />
      <aside className="agenda-details-panel">
        <div className="agenda-details-header">
          <div className="agenda-details-header-info">
            <span>Agendamento</span>
            <strong>{appointment.service_name || appointment.reason || 'Detalhes'}</strong>
          </div>
          <button className="agenda-details-close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="agenda-details-scroll">
          {/* Status Hero */}
          <div className={`agenda-details-hero status-${appointment.status || 'scheduled'}`}>
            <div className="agenda-details-hero-info">
              <span>Status</span>
              <strong>{STATUS_LABELS[appointment.status] || appointment.status || 'Agendado'}</strong>
            </div>
            <BarberBadge tone={STATUS_TONES[appointment.status] || 'neutral'}>
              {STATUS_LABELS[appointment.status] || appointment.status || 'Agendado'}
            </BarberBadge>
          </div>

          {/* Cliente */}
          <div className="agenda-details-client">
            <CollaboratorAvatar
              avatarUrl={appointment.customer_avatar_url || ''}
              className="agenda-details-client-avatar"
              name={appointment.customer_name || 'Cliente'}
            />
            <div className="agenda-details-client-info">
              <strong>{infoValue(appointment.customer_name)}</strong>
              <span>{infoValue(appointment.customer_phone)}</span>
            </div>
          </div>

          {/* Data e Hora */}
          <div className="agenda-details-meta">
            <div className="agenda-details-meta-row">
              <span className="agenda-details-meta-label">Data</span>
              <strong className="agenda-details-meta-value">{infoValue(appointment.appointment_date_label)}</strong>
            </div>
            <div className="agenda-details-meta-row">
              <span className="agenda-details-meta-label">Horário</span>
              <strong className="agenda-details-meta-value">{infoValue(appointment.slotLabel)}</strong>
            </div>
          </div>

          {/* Detalhes do Serviço */}
          <div className="agenda-details-section">
            <div className="agenda-details-meta-row">
              <span className="agenda-details-meta-label">Serviço</span>
              <strong className="agenda-details-meta-value">{infoValue(appointment.service_name || appointment.reason)}</strong>
            </div>
            <div className="agenda-details-meta-row">
              <span className="agenda-details-meta-label">Profissional</span>
              <strong className="agenda-details-meta-value">{infoValue(appointment.collaborator_name)}</strong>
            </div>
            <div className="agenda-details-meta-row">
              <span className="agenda-details-meta-label">Valor</span>
              <strong className="agenda-details-meta-value">{appointment.service_price_label || '-'}</strong>
            </div>
            <div className="agenda-details-meta-row">
              <span className="agenda-details-meta-label">Duração</span>
              <strong className="agenda-details-meta-value">{appointment.duration_label || '-'}</strong>
            </div>
          </div>

          {/* Observações */}
          <div className="agenda-details-section">
            <span className="agenda-details-meta-label">Observações</span>
            <p className="agenda-details-notes">{appointment.notes || appointment.canceled_reason || 'Sem observações registradas.'}</p>
          </div>
        </div>

        {/* Ações */}
        {appointment.status !== 'blocked' && (
          <div className="agenda-details-actions">
            {appointment.status === 'scheduled' && (
              <BarberButton onClick={() => onConfirm(appointment.id)} type="button" variant="secondary">
                Confirmar presença
              </BarberButton>
            )}
            {appointment.status === 'confirmed' && (
              <BarberButton onClick={() => onArrived(appointment.id)} type="button" variant="secondary">
                Cliente chegou
              </BarberButton>
            )}
            {appointment.status === 'arrived' && (
              <BarberButton onClick={() => onStart(appointment.id)} type="button" variant="primary">
                Iniciar atendimento
              </BarberButton>
            )}
            {appointment.status === 'in_progress' && (
              <BarberButton onClick={() => onComplete(appointment.id)} type="button" variant="primary">
                Finalizar
              </BarberButton>
            )}
            {!isCollaborator && !['canceled', 'completed', 'no_show'].includes(appointment.status) && (
              <div className="agenda-details-secondary-actions">
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

export default memo(AppointmentDetailsPanel)
