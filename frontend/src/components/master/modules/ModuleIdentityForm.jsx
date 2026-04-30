function FieldTitle({ label, hint, critical = false }) {
  return (
    <div className="master-module-field-title">
      <span>{label}</span>
      <i className={critical ? 'critical' : ''} title={hint}>?</i>
    </div>
  )
}

function ModuleIdentityForm({ form, formErrors, onChange, slugConflict, readOnly = false, showStatus = true }) {
  return (
    <section className="master-module-config-block">
      <div className="master-module-config-header">
        <span>Bloco 1</span>
        <div>
          <strong>Identidade do modulo</strong>
          <p>Definicao canonica do produto no catalogo tecnico.</p>
        </div>
      </div>

      <div className="master-module-config-grid">
        <div className="master-module-field master-module-field-full">
          <label htmlFor="name">
            <FieldTitle critical hint="Nome canonico definido pelo sistema para identificar o modulo no catalogo." label="Nome do modulo" />
          </label>
          <input id="name" name="name" type="text" value={form.name} onChange={onChange} placeholder="BarberGestor" readOnly={readOnly} />
          {formErrors.name && <small>{formErrors.name}</small>}
        </div>

        <div className="master-module-field">
          <label htmlFor="slug">
            <FieldTitle critical hint="Identificador unico usado no roteamento funcional do sistema." label="Slug" />
          </label>
          <input id="slug" name="slug" type="text" value={form.slug} onChange={onChange} placeholder="barbergestor" readOnly={readOnly} />
          {formErrors.slug && <small>{formErrors.slug}</small>}
          {!formErrors.slug && slugConflict && <small>Este slug ja esta em uso.</small>}
        </div>

        <div className="master-module-field">
          <label htmlFor="version">
            <FieldTitle hint="Versao logica do modulo para controle de evolucao." label="Versao" />
          </label>
          <input id="version" name="version" type="text" value={form.version} onChange={onChange} placeholder="v1" readOnly={readOnly} />
        </div>

        <div className="master-module-field master-module-field-full">
          <label htmlFor="description">
            <FieldTitle hint="Descricao tecnica e operacional do modulo." label="Descricao" />
          </label>
          <textarea
            id="description"
            name="description"
            rows="4"
            value={form.description}
            onChange={onChange}
            readOnly={readOnly}
            placeholder="Escopo funcional, responsabilidade e limites deste modulo."
          />
        </div>

        {showStatus && (
          <div className="master-module-field">
            <label className="master-module-toggle">
              <FieldTitle hint="Controla disponibilidade do modulo sem remover sua configuracao." label="Status" />
              <input checked={form.status} name="status" type="checkbox" onChange={onChange} disabled={readOnly} />
              <strong>{form.status ? 'Ativo' : 'Inativo'}</strong>
            </label>
          </div>
        )}
      </div>
    </section>
  )
}

export default ModuleIdentityForm
