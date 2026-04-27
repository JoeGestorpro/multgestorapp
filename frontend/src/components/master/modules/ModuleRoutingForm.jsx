const roleOptions = [
  { value: 'master_admin', label: 'Master Admin' },
  { value: 'admin_cliente', label: 'Admin Cliente' },
  { value: 'colaborador', label: 'Colaborador' }
]

function FieldTitle({ label, hint, critical = false }) {
  return (
    <div className="master-module-field-title">
      <span>{label}</span>
      <i className={critical ? 'critical' : ''} title={hint}>?</i>
    </div>
  )
}

function ModuleRoutingForm({ form, formErrors, onChange, onMultiSelectChange }) {
  return (
    <section className="master-module-config-block">
      <div className="master-module-config-header">
        <span>Bloco 2</span>
        <div>
          <strong>Roteamento e acesso</strong>
          <p>Controla path publico, prefixos internos e matriz de autorizacao por papel.</p>
        </div>
      </div>

      <div className="master-module-config-grid">
        <div className="master-module-field">
          <label htmlFor="base_path">
            <FieldTitle critical hint="Rota base publica do modulo. Nao pode duplicar com outro modulo." label="Base path" />
          </label>
          <input id="base_path" name="base_path" type="text" value={form.base_path} onChange={onChange} placeholder="/barber" />
          {formErrors.base_path && <small>{formErrors.base_path}</small>}
        </div>

        <div className="master-module-field">
          <label htmlFor="route_prefix">
            <FieldTitle critical hint="Prefixo tecnico para APIs e servicos internos. Obrigatorio quando requer autenticacao." label="Prefixo de rota" />
          </label>
          <input id="route_prefix" name="route_prefix" type="text" value={form.route_prefix} onChange={onChange} placeholder="/api/barber" />
          {formErrors.route_prefix && <small>{formErrors.route_prefix}</small>}
        </div>

        <div className="master-module-field">
          <label className="master-module-toggle">
            <FieldTitle hint="Define se o modulo depende de sessao autenticada para acesso." label="Requer autenticacao" />
            <input checked={form.requires_auth} name="requires_auth" type="checkbox" onChange={onChange} />
            <strong>{form.requires_auth ? 'Sim' : 'Nao'}</strong>
          </label>
        </div>

        <div className="master-module-field">
          <label className="master-module-toggle">
            <FieldTitle critical hint="Mantido verdadeiro para compatibilidade com arquitetura SaaS multiempresa." label="Multi-tenant habilitado" />
            <input checked={form.multi_tenant_enabled} name="multi_tenant_enabled" type="checkbox" onChange={onChange} />
            <strong>{form.multi_tenant_enabled ? 'Obrigatorio' : 'Invalido'}</strong>
          </label>
          {formErrors.multi_tenant_enabled && <small>{formErrors.multi_tenant_enabled}</small>}
        </div>

        <div className="master-module-field master-module-field-full">
          <FieldTitle hint="Selecione quais perfis podem operar este modulo." label="Perfis permitidos" />
          <div className="master-module-multiselect">
            {roleOptions.map((role) => {
              const checked = form.allowed_roles.includes(role.value)
              return (
                <label key={role.value} className={`master-module-role-pill ${checked ? 'active' : ''}`}>
                  <input
                    checked={checked}
                    type="checkbox"
                    onChange={() => onMultiSelectChange('allowed_roles', role.value)}
                  />
                  <span>{role.label}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ModuleRoutingForm
