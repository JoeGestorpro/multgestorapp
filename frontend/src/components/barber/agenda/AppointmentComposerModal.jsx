import { BarberButton, BarberModal } from '../BarberUI'

export default function AppointmentComposerModal({
  open,
  form,
  collaborators,
  services,
  isCollaborator,
  onClose,
  onChange,
  onSubmit,
  submitting
}) {
  if (!open) {
    return null
  }

  return (
    <BarberModal
      open={open}
      title="Novo agendamento"
      subtitle="Crie um horario na agenda interna sem sair da grade."
      onClose={onClose}
    >
      <form className="agenda-composer-form" onSubmit={onSubmit}>
        <div className="agenda-composer-grid">
          <div className="barber-form-block">
            <label htmlFor="appointment-service">Servico</label>
            <select
              className="barber-select"
              id="appointment-service"
              name="serviceId"
              onChange={onChange}
              value={form.serviceId}
            >
              <option value="">Selecione o servico</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - {Number(service.estimated_time_minutes || 30)} min
                </option>
              ))}
            </select>
          </div>

          {!isCollaborator && (
            <div className="barber-form-block">
              <label htmlFor="appointment-collaborator">Profissional</label>
              <select
                className="barber-select"
                id="appointment-collaborator"
                name="collaboratorId"
                onChange={onChange}
                value={form.collaboratorId}
              >
                <option value="">Selecione o profissional</option>
                {collaborators.map((collaborator) => (
                  <option key={collaborator.id} value={collaborator.id}>
                    {collaborator.nickname || collaborator.name || 'Colaborador'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="barber-form-block">
            <label htmlFor="appointment-date">Data</label>
            <input
              className="barber-input"
              id="appointment-date"
              name="appointmentDate"
              onChange={onChange}
              type="date"
              value={form.appointmentDate}
            />
          </div>

          <div className="barber-form-block">
            <label htmlFor="appointment-time">Horario</label>
            <input
              className="barber-input"
              id="appointment-time"
              name="appointmentTime"
              onChange={onChange}
              step="1800"
              type="time"
              value={form.appointmentTime}
            />
          </div>

          <div className="barber-form-block">
            <label htmlFor="appointment-customer-name">Cliente</label>
            <input
              className="barber-input"
              id="appointment-customer-name"
              name="customerName"
              onChange={onChange}
              placeholder="Nome do cliente"
              value={form.customerName}
            />
          </div>

          <div className="barber-form-block">
            <label htmlFor="appointment-customer-phone">WhatsApp</label>
            <input
              className="barber-input"
              id="appointment-customer-phone"
              name="customerPhone"
              onChange={onChange}
              placeholder="(00) 00000-0000"
              value={form.customerPhone}
            />
          </div>

          <div className="barber-form-block barber-form-block-full">
            <label htmlFor="appointment-customer-email">E-mail</label>
            <input
              className="barber-input"
              id="appointment-customer-email"
              name="customerEmail"
              onChange={onChange}
              placeholder="Opcional"
              type="email"
              value={form.customerEmail}
            />
          </div>

          <div className="barber-form-block barber-form-block-full">
            <label htmlFor="appointment-notes">Observacoes</label>
            <textarea
              className="barber-textarea"
              id="appointment-notes"
              name="notes"
              onChange={onChange}
              placeholder="Anote preferencias, detalhes do horario ou observacoes do atendimento."
              rows="4"
              value={form.notes}
            />
          </div>
        </div>

        <div className="agenda-composer-actions">
          <BarberButton onClick={onClose} type="button" variant="ghost">
            Fechar
          </BarberButton>
          <BarberButton disabled={submitting} type="submit" variant="primary">
            {submitting ? 'Salvando...' : 'Criar agendamento'}
          </BarberButton>
        </div>
      </form>
    </BarberModal>
  )
}
