export default function TeamCommissionSection({
  form,
  onChange
}) {
  return (
    <div className="barber-form-grid">
      <div className="barber-form-block">
        <label htmlFor="team-commission-type">Tipo de comissao</label>
        <select
          className="barber-select"
          id="team-commission-type"
          name="commissionType"
          onChange={onChange}
          value={form.commissionType}
        >
          <option value="percentage">Percentual (%)</option>
          <option value="fixed">Valor fixo (R$)</option>
        </select>
      </div>

      <div className="barber-form-block">
        <label htmlFor="team-commission-rate">
          {form.commissionType === 'fixed' ? 'Valor da comissao (R$)' : 'Percentual (%)'}
        </label>
        <input
          className="barber-input"
          id="team-commission-rate"
          min="0"
          name="commissionRate"
          onChange={onChange}
          step="0.01"
          type="number"
          value={form.commissionRate}
        />
        <small className="barber-form-hint">
          {form.commissionType === 'fixed'
            ? 'Valor fixo por venda lancada.'
            : 'Porcentagem sobre o valor de cada venda.'}
        </small>
      </div>
    </div>
  )
}
