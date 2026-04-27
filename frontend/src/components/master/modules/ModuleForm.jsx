import SectionCard from '../SectionCard'
import ModuleAdvancedConfig from './ModuleAdvancedConfig'
import ModuleBusinessRules from './ModuleBusinessRules'
import ModuleIdentityForm from './ModuleIdentityForm'
import ModuleIntegrations from './ModuleIntegrations'
import ModuleRoutingForm from './ModuleRoutingForm'

function ModuleForm({
  editingModule,
  form,
  formErrors,
  onCancel,
  onChange,
  onJsonChange,
  onMultiSelectChange,
  onSubmit,
  saving,
  slugConflict
}) {
  return (
    <SectionCard className="master-module-form-card">
      <div className="panel-title">
        <div>
          <h2>{editingModule ? 'Configurar modulo' : 'Novo nucleo tecnico'}</h2>
          <span>Painel tecnico para identidade, roteamento, regras, integracoes e operacao avancada.</span>
        </div>

        {editingModule && (
          <button className="button-secondary" type="button" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>

      <form className="module-form master-module-form" onSubmit={onSubmit}>
        <ModuleIdentityForm
          form={form}
          formErrors={formErrors}
          onChange={onChange}
          slugConflict={slugConflict}
        />

        <ModuleRoutingForm
          form={form}
          formErrors={formErrors}
          onChange={onChange}
          onMultiSelectChange={onMultiSelectChange}
        />

        <ModuleBusinessRules
          form={form}
          formErrors={formErrors}
          onChange={onChange}
        />

        <ModuleIntegrations
          form={form}
          formErrors={formErrors}
          onChange={onChange}
        />

        <ModuleAdvancedConfig
          form={form}
          formErrors={formErrors}
          onChange={onChange}
          onJsonChange={onJsonChange}
        />

        <div className="master-module-form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : editingModule ? 'Salvar configuracoes' : 'Criar modulo'}
          </button>
        </div>
      </form>
    </SectionCard>
  )
}

export default ModuleForm
