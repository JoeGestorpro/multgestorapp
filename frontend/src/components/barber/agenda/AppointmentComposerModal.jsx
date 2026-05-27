import { memo } from 'react'
import { BarberButton, BarberModal } from '../BarberUI'

function AppointmentComposerModal({
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
  if (!open) return null

  return (
    <BarberModal
      open={open}
      title="Novo agendamento"
      subtitle="Crie um horário na agenda interna sem sair da grade."
      onClose={onClose}
    >
      <form className="agenda-composer-form" onSubmit={onSubmit}>
        <div className="agenda-composer-layout">
          {/* Coluna Esquerda: Cliente */}
          <div className="agenda-composer-column">
            <div className="agenda-composer-section">
              <span className="agenda-composer-section-title">Cliente</span>
              <div className="agenda-composer-field">
                <label htmlFor="appointment-customer-name">Nome</label>
                <input
                  className="barber-input"
                  id="appointment-customer-name"
                  name="customerName"
                  onChange={onChange}
                  placeholder="Nome do cliente"
                  value={form.customerName}
                />
              </div>
              <div className="agenda-composer-field">
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
              <div className="agenda-composer-field">
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
            </div>
          </div>

          {/* Coluna Direita: Data/Hora */}
          <div className="agenda-composer-column">
            <div className="agenda-composer-section">
              <span className="agenda-composer-section-title">Data & Horário</span>
              <div className="agenda-composer-field">
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
              <div className="agenda-composer-field">
                <label htmlFor="appointment-time">Horário</label>
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
            </div>
          </div>
        </div>

        {/* Serviços */}
        <div className="agenda-composer-section">
          <span className="agenda-composer-section-title">Serviço</span>
          <div className="agenda-composer-services">
            {services.map((service) => {
              const isSelected = form.serviceId === service.id
              const duration = Number(service.estimated_time_minutes || 30)
              const price = Number(service.price || 0)
              return (
                <label
                  key={service.id}
                  className={`agenda-composer-service-card ${isSelected ? 'selected' : ''}`}
                >
                  <input
                    checked={isSelected}
                    className="agenda-composer-service-input"
                    name="serviceId"
                    onChange={onChange}
                    type="radio"
                    value={service.id}
                  />
                  <div className="agenda-composer-service-info">
                    <strong>{service.name}</strong>
                    <div className="agenda-composer-service-meta">
                      <span>{duration} min</span>
                      <span>R$ {price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Profissional */}
        {!isCollaborator && (
          <div className="agenda-composer-section">
            <span className="agenda-composer-section-title">Profissional</span>
            <div className="agenda-composer-professionals">
              {collaborators.map((collab) => {
                const isSelected = form.collaboratorId === collab.id
                return (
                  <label
                    key={collab.id}
                    className={`agenda-composer-professional-card ${isSelected ? 'selected' : ''}`}
                  >
                    <input
                      checked={isSelected}
                      className="agenda-composer-professional-input"
                      name="collaboratorId"
                      onChange={onChange}
                      type="radio"
                      value={collab.id}
                    />
                    <span className="agenda-composer-professional-avatar">
                      {collab.nickname?.[0] || collab.name?.[0] || '?'}
                    </span>
                    <span className="agenda-composer-professional-name">
                      {collab.nickname || collab.name || 'Colaborador'}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* Observações */}
        <div className="agenda-composer-section">
          <span className="agenda-composer-section-title">Observações</span>
          <textarea
            className="barber-textarea"
            id="appointment-notes"
            name="notes"
            onChange={onChange}
            placeholder="Anote preferências, detalhes do horário ou observações do atendimento."
            rows="3"
            value={form.notes}
          />
        </div>

        <div className="agenda-composer-actions">
          <BarberButton onClick={onClose} type="button" variant="ghost">
            Cancelar
          </BarberButton>
          <BarberButton disabled={submitting} type="submit" variant="primary">
            {submitting ? 'Salvando...' : 'Criar agendamento'}
          </BarberButton>
        </div>
      </form>
    </BarberModal>
  )
}

export default memo(AppointmentComposerModal)
