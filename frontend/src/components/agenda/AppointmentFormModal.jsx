import { useMemo } from 'react'

export default function AppointmentFormModal({
  open, form, collaborators, services, isCollaborator,
  onClose, onChange, onSubmit, submitting
}) {
  const selectedService = useMemo(() => {
    if (!form.serviceId) return null
    return services.find(s => s.id === form.serviceId) || null
  }, [form.serviceId, services])

  const selectedCollaborator = useMemo(() => {
    if (!form.collaboratorId) return null
    return collaborators.find(c => c.id === form.collaboratorId) || null
  }, [form.collaboratorId, collaborators])

  const duration = selectedService?.estimated_time_minutes || 30
  const price = Number(selectedService?.price || 0)

  const endTime = useMemo(() => {
    if (!form.appointmentTime) return ''
    const [h, m] = form.appointmentTime.split(':').map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return ''
    const totalMin = h * 60 + m + Number(duration)
    const endH = Math.floor(totalMin / 60) % 24
    const endM = totalMin % 60
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  }, [form.appointmentTime, duration])

  if (!open) return null

  return (
    <div className="ag-modal-overlay" onClick={onClose}>
      <div className="ag-modal" onClick={e => e.stopPropagation()}>
        <div className="ag-modal-top">
          <div className="ag-modal-top-text">
            <h3>Novo agendamento</h3>
            <p>Preencha os dados para criar um horario na agenda</p>
          </div>
          <button className="ag-modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form className="ag-modal-form" onSubmit={onSubmit}>
          <div className="ag-modal-grid">
            {/* LEFT COLUMN */}
            <div className="ag-modal-col">
              <div className="ag-field-group">
                <label className="ag-field-label">Cliente</label>
                <input className="ag-field-input" name="customerName" value={form.customerName} onChange={onChange} placeholder="Nome completo do cliente" />
              </div>
              <div className="ag-field-group">
                <label className="ag-field-label">Telefone / WhatsApp</label>
                <input className="ag-field-input" name="customerPhone" value={form.customerPhone} onChange={onChange} placeholder="(00) 00000-0000" />
              </div>
              <div className="ag-field-group">
                <label className="ag-field-label">E-mail</label>
                <input className="ag-field-input" name="customerEmail" value={form.customerEmail} onChange={onChange} placeholder="Opcional" type="email" />
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="ag-modal-col">
              <div className="ag-field-group">
                <label className="ag-field-label">Data</label>
                <input className="ag-field-input" name="appointmentDate" value={form.appointmentDate} onChange={onChange} type="date" />
              </div>
              <div className="ag-field-group">
                <label className="ag-field-label">Horario</label>
                <input className="ag-field-input" name="appointmentTime" value={form.appointmentTime} onChange={onChange} type="time" step="1800" />
              </div>
              <div className="ag-field-group">
                <label className="ag-field-label">Servico</label>
                <select className="ag-field-input ag-field-select" name="serviceId" value={form.serviceId} onChange={onChange}>
                  <option value="">Selecione um servico</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} — R$ {Number(s.price || 0).toFixed(2).replace('.', ',')} / {s.estimated_time_minutes || 30}min
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* COLLABORATOR SELECTION */}
          {!isCollaborator && (
            <div className="ag-field-group">
              <label className="ag-field-label">Profissional</label>
              <div className="ag-collab-row-list">
                {collaborators.map(c => {
                  const sel = form.collaboratorId === c.id
                  return (
                    <label key={c.id} className={`ag-collab-row ${sel ? 'ag-collab-row-selected' : ''}`}>
                      <input type="radio" name="collaboratorId" value={c.id} checked={sel} onChange={onChange} className="ag-radio-hidden" />
                      <span className="ag-collab-row-avatar">{c.nickname?.[0] || c.name?.[0] || '?'}</span>
                      <span className="ag-collab-row-name">{c.nickname || c.name}</span>
                      {sel && (
                        <svg className="ag-collab-row-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* OBSERVATIONS */}
          <div className="ag-field-group">
            <label className="ag-field-label">Observacoes</label>
            <textarea className="ag-field-textarea" name="notes" value={form.notes} onChange={onChange} placeholder="Anote preferencias, detalhes do horario ou observacoes do atendimento" rows="2" />
          </div>

          {/* SUMMARY */}
          <div className="ag-summary-bar">
            <div className="ag-summary-item">
              <span className="ag-summary-label">Servico</span>
              <span className="ag-summary-value">{selectedService?.name || '-'}</span>
            </div>
            <div className="ag-summary-divider" />
            <div className="ag-summary-item">
              <span className="ag-summary-label">Profissional</span>
              <span className="ag-summary-value">{selectedCollaborator?.nickname || selectedCollaborator?.name || '-'}</span>
            </div>
            <div className="ag-summary-divider" />
            <div className="ag-summary-item">
              <span className="ag-summary-label">Duracao</span>
              <span className="ag-summary-value">{duration} min</span>
            </div>
            <div className="ag-summary-divider" />
            <div className="ag-summary-item">
              <span className="ag-summary-label">Horario</span>
              <span className="ag-summary-value">{form.appointmentTime || '--:--'} - {endTime || '--:--'}</span>
            </div>
            <div className="ag-summary-divider" />
            <div className="ag-summary-item ag-summary-item-highlight">
              <span className="ag-summary-label">Valor</span>
              <span className="ag-summary-value ag-summary-value-highlight">R$ {price.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="ag-modal-actions">
            <button type="button" className="ag-btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="ag-btn-primary ag-btn-full" disabled={submitting || !form.customerName || !form.serviceId || !form.collaboratorId || !form.appointmentTime}>
              {submitting ? (
                <><span className="ag-spinner" /> Salvando...</>
              ) : (
                'Confirmar agendamento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
