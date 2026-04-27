function FieldTitle({ label, hint }) {
  return (
    <div className="master-module-field-title">
      <span>{label}</span>
      <i title={hint}>?</i>
    </div>
  )
}

function ModuleBusinessRules({ form, formErrors, onChange }) {
  return (
    <section className="master-module-config-block">
      <div className="master-module-config-header">
        <span>Bloco 3</span>
        <div>
          <strong>Regras de negocio</strong>
          <p>Define monetizacao, onboarding, trial e mecanismos de ativacao do modulo.</p>
        </div>
      </div>

      <div className="master-module-config-grid">
        <div className="master-module-field">
          <label className="master-module-toggle">
            <FieldTitle hint="Exige assinatura valida para liberar o modulo ao cliente." label="Requer assinatura" />
            <input checked={form.requires_subscription} name="requires_subscription" type="checkbox" onChange={onChange} />
            <strong>{form.requires_subscription ? 'Sim' : 'Nao'}</strong>
          </label>
        </div>

        <div className="master-module-field">
          <label className="master-module-toggle">
            <FieldTitle hint="Determina se o cliente precisa passar por fluxo inicial guiado." label="Requer onboarding" />
            <input checked={form.requires_onboarding} name="requires_onboarding" type="checkbox" onChange={onChange} />
            <strong>{form.requires_onboarding ? 'Sim' : 'Nao'}</strong>
          </label>
        </div>

        <div className="master-module-field">
          <label className="master-module-toggle">
            <FieldTitle hint="Habilita periodo de trial antes da cobranca recorrente." label="Trial habilitado" />
            <input checked={form.trial_enabled} name="trial_enabled" type="checkbox" onChange={onChange} />
            <strong>{form.trial_enabled ? 'Sim' : 'Nao'}</strong>
          </label>
        </div>

        <div className="master-module-field">
          <label htmlFor="trial_days">
            <FieldTitle hint="Quantidade de dias liberados no trial." label="Dias de trial" />
          </label>
          <input id="trial_days" min="0" name="trial_days" type="number" value={form.trial_days} onChange={onChange} placeholder="7" />
          {formErrors.trial_days && <small>{formErrors.trial_days}</small>}
        </div>

        <div className="master-module-field">
          <label className="master-module-toggle">
            <FieldTitle hint="Ativa automaticamente o modulo apos confirmacao de pagamento." label="Autoativar no pagamento" />
            <input checked={form.auto_activate_on_payment} name="auto_activate_on_payment" type="checkbox" onChange={onChange} />
            <strong>{form.auto_activate_on_payment ? 'Sim' : 'Nao'}</strong>
          </label>
        </div>

        <div className="master-module-field">
          <label className="master-module-toggle">
            <FieldTitle hint="Permite que operadores ativem manualmente o modulo quando necessario." label="Permitir ativacao manual" />
            <input checked={form.allow_manual_activation} name="allow_manual_activation" type="checkbox" onChange={onChange} />
            <strong>{form.allow_manual_activation ? 'Sim' : 'Nao'}</strong>
          </label>
        </div>
      </div>
    </section>
  )
}

export default ModuleBusinessRules
