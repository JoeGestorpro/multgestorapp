import SectionCard from '../SectionCard'
import PremiumSelect from './PremiumSelect'

function ClientCreateForm({
  form,
  formErrors,
  nicheOptions,
  sourceOptions,
  companyStatusOptions,
  saving,
  onChange,
  onSelectChange,
  onAddNiche,
  onSubmit,
  onCancel
}) {
  return (
    <SectionCard className="master-client-create-card">
      <div className="panel-title">
        <div>
          <h2>Novo cliente</h2>
          <span>Crie a empresa primeiro. Modulos, planos e acesso ficam organizados nas abas de gerenciamento.</span>
        </div>
      </div>

      <form className="master-client-simple-form" onSubmit={onSubmit}>
        <div className="master-client-grid">
          <label className="master-client-field master-client-field-full">
            <span>Nome da empresa</span>
            <input name="company_name" value={form.company_name} onChange={onChange} placeholder="Ex.: Barber Prime" />
            {formErrors.company_name && <small>{formErrors.company_name}</small>}
          </label>

          <label className="master-client-field">
            <span>Documento</span>
            <input name="document" value={form.document} onChange={onChange} placeholder="CPF ou CNPJ" />
          </label>

          <label className="master-client-field">
            <span>Telefone</span>
            <input name="phone" value={form.phone} onChange={onChange} placeholder="(65) 99999-9999" />
          </label>

          <label className="master-client-field master-client-field-full">
            <span>Email da empresa</span>
            <input name="email" type="email" value={form.email} onChange={onChange} placeholder="contato@empresa.com" />
          </label>

          <div className="master-client-field">
            <span>Nicho</span>
            <PremiumSelect
              value={form.niche}
              onChange={(value) => onSelectChange('niche', value)}
              options={nicheOptions}
              placeholder="Selecione um nicho"
            />
            {formErrors.niche && <small>{formErrors.niche}</small>}
            <button className="master-inline-link" type="button" onClick={onAddNiche}>
              + Adicionar novo nicho
            </button>
          </div>

          <div className="master-client-field">
            <span>Origem do cliente</span>
            <PremiumSelect
              value={form.source}
              onChange={(value) => onSelectChange('source', value)}
              options={sourceOptions}
              placeholder="Selecione a origem"
            />
          </div>

          <div className="master-client-field">
            <span>Status comercial</span>
            <PremiumSelect
              value={form.company_status}
              onChange={(value) => onSelectChange('company_status', value)}
              options={companyStatusOptions}
              placeholder="Selecione o status"
            />
            {formErrors.company_status && <small>{formErrors.company_status}</small>}
          </div>

          <label className="master-client-field master-client-field-full">
            <span>Observacoes internas</span>
            <textarea
              name="observations"
              rows="4"
              value={form.observations}
              onChange={onChange}
              placeholder="Contexto comercial, onboarding ou observacoes internas."
            />
          </label>
        </div>

        <div className="master-form-actions">
          <button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Criar cliente'}</button>
          <button className="button-secondary" type="button" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </SectionCard>
  )
}

export default ClientCreateForm
