import { BarberBadge, BarberButton, BarberModal } from '../BarberUI'

const STATUS_TONES = {
  scheduled: 'pending',
  confirmed: 'approved',
  arrived: 'admin',
  in_progress: 'pix',
  completed: 'cash',
  no_show: 'danger',
  canceled: 'neutral'
}

const STATUS_LABELS = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  arrived: 'Chegou',
  in_progress: 'Em atendimento',
  completed: 'Finalizado',
  no_show: 'Falta',
  canceled: 'Cancelado'
}

export default function AppointmentModal({
  open,
  appointment,
  isCollaborator,
  onClose,
  onConfirm,
  onArrived,
  onStart,
  onComplete,
  onReschedule,
  onCancel
}) {
  if (!appointment) {
    return null
  }

  return (
    <BarberModal
      open={open}
      title={appointment.customer_name || 'Detalhes do agendamento'}
      subtitle={appointment.slotLabel}
      onClose={onClose}
    >
      <div className="agenda-modal-content">
        <div className={`agenda-status-hero status-${appointment.status || 'scheduled'}`}>
          <div>
            <span>Status atual</span>
            <strong>{STATUS_LABELS[appointment.status] || appointment.status}</strong>
          </div>
          <BarberBadge tone={STATUS_TONES[appointment.status] || 'neutral'}>
            {STATUS_LABELS[appointment.status] || appointment.status}
          </BarberBadge>
        </div>
        <div className="agenda-modal-grid">
          <div><span>Telefone</span><strong>{appointment.customer_phone || '-'}</strong></div>
          <div><span>Status</span><BarberBadge tone={STATUS_TONES[appointment.status] || 'neutral'}>{STATUS_LABELS[appointment.status] || appointment.status}</BarberBadge></div>
          <div><span>Servico</span><strong>{appointment.service_name || '-'}</strong></div>
          <div><span>Profissional</span><strong>{appointment.collaborator_name || '-'}</strong></div>
          <div><span>Data e horario</span><strong>{appointment.slotLabel || '-'}</strong></div>
          <div><span>Observacao</span><strong>{appointment.notes || 'Sem observacoes'}</strong></div>
        </div>

        <div className="agenda-modal-actions">
          {appointment.status === 'scheduled' && <BarberButton onClick={() => onConfirm(appointment.id)} variant="secondary">Confirmar</BarberButton>}
          {appointment.status === 'confirmed' && <BarberButton onClick={() => onArrived(appointment.id)} variant="secondary">Chegou</BarberButton>}
          {appointment.status === 'arrived' && <BarberButton onClick={() => onStart(appointment.id)} variant="primary">Iniciar atendimento</BarberButton>}
          {appointment.status === 'in_progress' && <BarberButton onClick={() => onComplete(appointment.id)} variant="primary">Finalizar</BarberButton>}
          {!isCollaborator && !['canceled', 'completed', 'no_show'].includes(appointment.status) && (
            <>
              <BarberButton onClick={() => onReschedule(appointment)} variant="ghost">Remarcar</BarberButton>
              <BarberButton onClick={() => onCancel(appointment)} variant="danger">Cancelar</BarberButton>
            </>
          )}
        </div>
      </div>
    </BarberModal>
  )
}
