import { useState } from 'react'
import PremiumSelect from '../clients/PremiumSelect'

const environmentOptions = [
  { value: 'dev', label: 'Dev' },
  { value: 'staging', label: 'Staging' },
  { value: 'prod', label: 'Prod' }
]

function FieldTitle({ label, hint }) {
  return (
    <div className="master-module-field-title">
      <span>{label}</span>
      <i title={hint}>?</i>
    </div>
  )
}

function ModuleAdvancedConfig({ form, formErrors, onChange, onJsonChange }) {
  const [open, setOpen] = useState(false)

  return (
    <section className="master-module-config-block master-module-config-advanced">
      <button className="master-module-advanced-toggle" type="button" onClick={() => setOpen((current) => !current)}>
        <div>
          <strong>Avancado</strong>
          <p>Feature flags, observabilidade e configuracoes de runtime.</p>
        </div>
        <span>{open ? 'Ocultar' : 'Exibir'}</span>
      </button>

      {open && (
        <div className="master-module-config-grid">
          <div className="master-module-field master-module-field-full">
            <label htmlFor="feature_flags">
              <FieldTitle hint="JSON com chaves de feature flag por modulo." label="Feature flags" />
            </label>
            <textarea
              id="feature_flags"
              name="feature_flags"
              rows="7"
              value={form.feature_flags}
              onChange={onJsonChange}
              placeholder='{"agendaAvancada": true, "painelKanban": false}'
            />
            {formErrors.feature_flags && <small>{formErrors.feature_flags}</small>}
          </div>

          <div className="master-module-field">
            <label htmlFor="rate_limit">
              <FieldTitle hint="Limite de requests por minuto recomendado para este modulo." label="Rate limit (req/min)" />
            </label>
            <input id="rate_limit" min="0" name="rate_limit" type="number" value={form.rate_limit} onChange={onChange} placeholder="120" />
          </div>

          <div className="master-module-field">
            <span>
              <FieldTitle hint="Ambiente alvo de configuracao para este pacote." label="Ambiente" />
            </span>
            <PremiumSelect
              onChange={(value) => onChange({ target: { name: 'environment', value, type: 'text' } })}
              options={environmentOptions}
              placeholder="Selecionar ambiente"
              value={form.environment}
            />
          </div>

          <div className="master-module-field">
            <label className="master-module-toggle">
              <FieldTitle hint="Habilita eventos de logging para auditoria e depuracao." label="Logging habilitado" />
              <input checked={form.logging_enabled} name="logging_enabled" type="checkbox" onChange={onChange} />
              <strong>{form.logging_enabled ? 'Sim' : 'Nao'}</strong>
            </label>
          </div>

          <div className="master-module-field">
            <label htmlFor="db_schema_name">
              <FieldTitle hint="Schema recomendado para isolamento futuro no banco." label="Nome do schema" />
            </label>
            <input id="db_schema_name" name="db_schema_name" type="text" value={form.db_schema_name} onChange={onChange} placeholder="barber_module" />
          </div>
        </div>
      )}
    </section>
  )
}

export default ModuleAdvancedConfig
