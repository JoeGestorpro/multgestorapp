const planOptions = [
  {
    value: 'free',
    label: 'Free',
    description: 'Entrada controlada para validar adesao e uso inicial do modulo.'
  },
  {
    value: 'pro',
    label: 'Pro',
    description: 'Camada comercial principal para operacao recorrente do cliente.'
  },
  {
    value: 'plus',
    label: 'Plus',
    description: 'Pacote premium preparado para futuras features e automacoes.'
  }
]

function FieldTitle({ label, hint }) {
  return (
    <div className="master-module-field-title">
      <span>{label}</span>
      <i title={hint}>?</i>
    </div>
  )
}

function ModulePlansForm({ form, onPlanToggle, onDefaultPlanChange }) {
  return (
    <section className="master-module-config-block">
      <div className="master-module-config-header">
        <span>Gestao comercial</span>
        <div>
          <strong>Planos do modulo</strong>
          <p>Camada comercial separada da estrutura tecnica, pronta para evoluir para controle de features por plano.</p>
        </div>
      </div>

      <div className="master-module-plan-grid">
        {planOptions.map((plan) => {
          const enabled = form.module_plans.includes(plan.value)
          const isDefault = form.default_plan === plan.value

          return (
            <article key={plan.value} className={`master-module-plan-card ${enabled ? 'enabled' : ''}`}>
              <div className="master-module-plan-card-top">
                <div>
                  <strong>{plan.label}</strong>
                  <p>{plan.description}</p>
                </div>
                <label className="master-module-toggle">
                  <input
                    checked={enabled}
                    type="checkbox"
                    onChange={() => onPlanToggle(plan.value)}
                  />
                  <strong>{enabled ? 'Ativo' : 'Inativo'}</strong>
                </label>
              </div>

              <div className="master-module-plan-card-footer">
                <label className="master-module-radio-row">
                  <input
                    checked={isDefault}
                    disabled={!enabled}
                    name="default_plan"
                    type="radio"
                    onChange={() => onDefaultPlanChange(plan.value)}
                  />
                  <span>{enabled ? 'Definir como plano padrao' : 'Ative o plano para liberar como padrao'}</span>
                </label>
              </div>
            </article>
          )
        })}
      </div>

      <div className="master-module-plan-note">
        <FieldTitle
          label="Proxima etapa preparada"
          hint="Esta estrutura ja deixa o modulo pronto para mapear features por plano no futuro, sem alterar rotas ou autenticacao agora."
        />
        <p>Feature gating por plano ainda nao esta implementado. Nesta etapa, o painel apenas associa planos comerciais ao modulo.</p>
      </div>
    </section>
  )
}

export default ModulePlansForm
