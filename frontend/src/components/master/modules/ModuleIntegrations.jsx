import PremiumSelect from '../clients/PremiumSelect'

const gatewayOptions = [
  { value: 'kiwify', label: 'Kiwify' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'manual', label: 'Manual' }
]

function FieldTitle({ label, hint, critical = false }) {
  return (
    <div className="master-module-field-title">
      <span>{label}</span>
      <i className={critical ? 'critical' : ''} title={hint}>?</i>
    </div>
  )
}

function ModuleIntegrations({ form, formErrors, onChange }) {
  return (
    <section className="master-module-config-block">
      <div className="master-module-config-header">
        <span>Bloco 4</span>
        <div>
          <strong>Integracoes</strong>
          <p>Concentrador tecnico para gateways, webhooks e dependencias externas.</p>
        </div>
      </div>

      <div className="master-module-config-grid">
        <div className="master-module-field">
          <span>
            <FieldTitle hint="Gateway padrao para faturamento e automacoes financeiras." label="Gateway de pagamento" />
          </span>
          <PremiumSelect
            onChange={(value) => onChange({ target: { name: 'payment_gateway', value, type: 'text' } })}
            options={gatewayOptions}
            placeholder="Selecionar gateway"
            value={form.payment_gateway}
          />
        </div>

        <div className="master-module-field">
          <label className="master-module-toggle">
            <FieldTitle hint="Define se o modulo recebera eventos externos por webhook." label="Webhook habilitado" />
            <input checked={form.webhook_enabled} name="webhook_enabled" type="checkbox" onChange={onChange} />
            <strong>{form.webhook_enabled ? 'Sim' : 'Nao'}</strong>
          </label>
        </div>

        <div className="master-module-field master-module-field-full">
          <label htmlFor="webhook_url">
            <FieldTitle critical hint="URL usada para recepcao de eventos. Obrigatoria se webhook estiver habilitado." label="URL do webhook" />
          </label>
          <input
            id="webhook_url"
            name="webhook_url"
            type="text"
            value={form.webhook_url}
            onChange={onChange}
            placeholder="https://api.seudominio.com/webhooks/barber"
          />
          {formErrors.webhook_url && <small>{formErrors.webhook_url}</small>}
        </div>

        <div className="master-module-field">
          <label htmlFor="external_api_base_url">
            <FieldTitle hint="Base opcional para APIs terceiras ou servicos acoplados." label="URL base da API externa" />
          </label>
          <input
            id="external_api_base_url"
            name="external_api_base_url"
            type="text"
            value={form.external_api_base_url}
            onChange={onChange}
            placeholder="https://api.externa.com"
          />
        </div>

        <div className="master-module-field">
          <label htmlFor="integration_key">
            <FieldTitle hint="Chave sensivel para autenticacao com sistemas externos." label="Chave de integracao" />
          </label>
          <input
            id="integration_key"
            name="integration_key"
            type="password"
            value={form.integration_key}
            onChange={onChange}
            placeholder="chave-segura-do-modulo"
            autoComplete="new-password"
          />
        </div>
      </div>
    </section>
  )
}

export default ModuleIntegrations
