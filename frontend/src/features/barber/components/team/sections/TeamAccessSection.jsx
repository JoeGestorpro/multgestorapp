export default function TeamAccessSection({
  form,
  onChange,
  isEditing
}) {
  return (
    <div className="barber-form-grid">
      <div className="barber-form-block">
        <label htmlFor="team-email">Email</label>
        <input
          className="barber-input"
          id="team-email"
          name="email"
          onChange={onChange}
          required
          type="email"
          value={form.email}
        />
      </div>

      <div className="barber-form-block">
        <label htmlFor="team-password">
          Senha {isEditing ? '(deixe em branco para manter)' : ''}
        </label>
        <input
          className="barber-input"
          id="team-password"
          name="password"
          onChange={onChange}
          required={!isEditing}
          type="password"
          value={form.password}
        />
        <small className="barber-form-hint">Minimo de 6 caracteres.</small>
      </div>

      <div className="barber-form-block barber-form-block-full">
        <label>Status de acesso</label>
        <select
          className="barber-select"
          name="isActive"
          onChange={onChange}
          value={String(form.isActive)}
        >
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </select>
      </div>

      <div className="barber-form-block barber-form-block-full">
        <label className="barber-permission-item">
          <input
            checked={form.availableForBooking}
            name="availableForBooking"
            onChange={onChange}
            type="checkbox"
          />
          <span>
            Disponivel para agendamentos
            <small className="barber-form-hint">Quando ativado, este colaborador aparece no link publico de agendamento da barbearia.</small>
          </span>
        </label>
      </div>
    </div>
  )
}
