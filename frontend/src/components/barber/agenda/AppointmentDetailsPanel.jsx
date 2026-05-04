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
  return (
    <aside className={`agenda-details-panel ${appointment ? 'open' : ''}`.trim()}>
      {appointment ? (
        <>
          <div className="agenda-details-header">
            <div>
              <span>Agendamento</span>
              <strong>{appointment.service_name || appointment.reason || 'Detalhes do agendamento'}</strong>
            </div>
            <button className="agenda-details-close" onClick={onClose} type="button">
              Fechar
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
            <p>{appointment.notes || appointment.canceled_reason || 'Sem observacoes registradas.'}</p>
          </div>

          {appointment.status !== 'blocked' && (
            <div className="agenda-details-actions">
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
                <>
                  <BarberButton onClick={() => onCancel(appointment)} type="button" variant="danger">
                    Cancelar
                  </BarberButton>
                  <BarberButton onClick={() => onReschedule(appointment)} type="button" variant="ghost">
                    Remarcar
                  </BarberButton>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="agenda-details-empty">
          <strong>Selecione um horario</strong>
          <p>Clique em um agendamento da grade para abrir o painel lateral com os detalhes completos.</p>
        </div>
      )}
    </aside>
  )
}
