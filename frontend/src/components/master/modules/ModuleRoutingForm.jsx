function FieldTitle({ label, hint, critical = false }) {
  return (
    <div className="master-module-field-title">
      <span>{label}</span>
      <i className={critical ? 'critical' : ''} title={hint}>?</i>
    </div>
  )
}

function ModuleRoutingForm({ form, formErrors, onChange, readOnly = false }) {
  return (
    <section className="master-module-config-block">
      <div className="master-module-config-header">
        <span>Bloco 2</span>
        <div>
          <strong>Roteamento e acesso</strong>
          <p>Controla path publico, prefixos internos e a configuracao de acesso operacional do modulo.</p>
        </div>
      </div>

      <div className="master-module-config-grid">
        <div className="master-module-field">
          <label htmlFor="base_path">
            <FieldTitle critical hint="Rota base publica controlada pelo sistema. Fica visivel para auditoria, mas nao pode ser alterada pelo painel." label="Base path" />
          </label>
          <input id="base_path" name="base_path" type="text" value={form.base_path} onChange={onChange} placeholder="/barber" readOnly={readOnly} />
          {formErrors.base_path && <small>{formErrors.base_path}</small>}
        </div>

        <div className="master-module-field">
          <label htmlFor="route_prefix">
            <FieldTitle critical hint="Prefixo tecnico controlado pelo sistema para evitar quebra de rotas e APIs." label="Prefixo de rota" />
          </label>
          <input id="route_prefix" name="route_prefix" type="text" value={form.route_prefix} onChange={onChange} placeholder="/api/barber" readOnly={readOnly} />
          {formErrors.route_prefix && <small>{formErrors.route_prefix}</small>}
        </div>

        <div className="master-module-field">
          <label className="master-module-toggle">
            <FieldTitle hint="Define se o modulo depende de sessao autenticada para acesso." label="Requer autenticacao" />
            <input checked={form.requires_auth} name="requires_auth" type="checkbox" onChange={onChange} disabled={readOnly} />
            <strong>{form.requires_auth ? 'Sim' : 'Nao'}</strong>
          </label>
        </div>

        <div className="master-module-field">
          <label className="master-module-toggle">
            <FieldTitle critical hint="Obrigatorio para modulos de cliente no modelo SaaS multiempresa. Fica bloqueado no painel." label="Multi-tenant habilitado" />
            <input checked={form.multi_tenant_enabled} name="multi_tenant_enabled" type="checkbox" onChange={onChange} disabled={readOnly} />
            <strong>{form.multi_tenant_enabled ? 'Obrigatorio' : 'Invalido'}</strong>
          </label>
          {formErrors.multi_tenant_enabled && <small>{formErrors.multi_tenant_enabled}</small>}
        </div>

        <div className="master-module-field master-module-field-full">
          <FieldTitle
            hint="Nos modulos de cliente, a operacao principal pertence ao Admin Cliente / Dono da empresa. Colaboradores sao gerenciados dentro do proprio modulo."
            label="Perfil operacional"
          />
          <div className="master-module-role-pill active">
            <span>Perfil operacional principal: Admin Cliente / Dono da empresa</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ModuleRoutingForm
