import { useEffect, useMemo, useState } from 'react'
import SectionCard from '../SectionCard'
import ModulePlansForm from './ModulePlansForm'

const moduleTabs = [
  { id: 'overview', label: 'Visao Geral' },
  { id: 'plans', label: 'Planos' },
  { id: 'technical', label: 'Tecnico' },
  { id: 'control', label: 'Controle' }
]

const planLabels = {
  free: 'Free',
  pro: 'Pro',
  plus: 'Plus'
}

function ModuleForm({
  moduleRecord,
  form,
  onDefaultPlanChange,
  onPlanToggle,
  onSavePlans,
  onToggleModule,
  saving,
  toggling
}) {
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (moduleRecord) {
      setActiveTab('overview')
    }
  }, [moduleRecord])

  const activePlans = useMemo(
    () => (Array.isArray(form.module_plans) ? form.module_plans : []).map((plan) => planLabels[plan] || plan),
    [form.module_plans]
  )

  if (!moduleRecord) {
    return (
      null
    )
  }

  return (
    <SectionCard className="master-module-detail-card">
      <div className="master-module-detail-header">
        <div>
          <span className="master-module-kicker">Modulo selecionado</span>
          <h2>{moduleRecord.name}</h2>
          <p>Catalogo controlado pelo sistema. O painel master gerencia apenas visao comercial e disponibilidade.</p>
        </div>
        <div className="master-module-detail-badges">
          <span className={`master-module-status-badge ${moduleRecord.is_active ? 'active' : 'inactive'}`}>
            {moduleRecord.is_active ? 'Ativo' : 'Inativo'}
          </span>
          {activePlans.map((plan) => (
            <span key={plan} className="master-module-plan-badge">{plan}</span>
          ))}
        </div>
      </div>

      <div className="master-module-tabs" role="tablist" aria-label="Abas do modulo">
        {moduleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="master-module-tab-panel">
        {activeTab === 'overview' && (
          <div className="master-module-overview-grid">
            <section className="master-module-overview-card">
              <div className="master-module-section-heading">
                <h3>Visao Geral</h3>
                <span>Comercial</span>
              </div>
              <div className="master-module-overview-list">
                <div>
                  <span>Nome do modulo</span>
                  <strong>{moduleRecord.name}</strong>
                </div>
                <div>
                  <span>Versao</span>
                  <strong>{moduleRecord.version || 'v1'}</strong>
                </div>
                <div>
                  <span>Status comercial</span>
                  <strong>{moduleRecord.is_active ? 'Ativo' : 'Inativo'}</strong>
                </div>
                <div>
                  <span>Plano padrao</span>
                  <strong>{planLabels[form.default_plan] || form.default_plan || '-'}</strong>
                </div>
              </div>
            </section>

            <section className="master-module-overview-card">
              <div className="master-module-section-heading">
                <h3>Resumo comercial</h3>
                <span>Painel master</span>
              </div>
              <p className="master-module-overview-text">
                {moduleRecord.description || 'Sem descricao cadastrada para este modulo.'}
              </p>
              <div className="master-module-callout">
                <strong>Separacao de responsabilidade</strong>
                <p>Configuracoes tecnicas pertencem ao sistema. Planos e disponibilidade comercial pertencem ao painel master.</p>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="module-form master-module-form">
            <ModulePlansForm
              form={form}
              onPlanToggle={onPlanToggle}
              onDefaultPlanChange={onDefaultPlanChange}
            />

            <div className="master-module-form-actions">
              <button type="button" disabled={saving} onClick={onSavePlans}>
                {saving ? 'Salvando...' : 'Salvar planos do modulo'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'technical' && (
          <div className="master-module-technical-grid">
            <section className="master-module-overview-card">
              <div className="master-module-section-heading">
                <h3>Configuracao tecnica</h3>
                <span>Somente leitura</span>
              </div>
              <div className="master-module-code-grid">
                <div>
                  <span>Slug</span>
                  <code>{form.slug || '-'}</code>
                </div>
                <div>
                  <span>Base path</span>
                  <code>{form.base_path || '-'}</code>
                </div>
                <div>
                  <span>Prefixo de rota da API</span>
                  <code>{form.route_prefix || '-'}</code>
                </div>
                <div>
                  <span>Perfil operacional</span>
                  <code>Admin Cliente / Dono da empresa</code>
                </div>
              </div>
            </section>

            <section className="master-module-overview-card">
              <div className="master-module-section-heading">
                <h3>Politicas do sistema</h3>
                <span>Protegido</span>
              </div>
              <div className="master-module-policy-list">
                <div>
                  <span>Requer autenticacao</span>
                  <strong>{form.requires_auth ? 'Sim' : 'Nao'}</strong>
                </div>
                <div>
                  <span>Multi-tenant habilitado</span>
                  <strong>{form.multi_tenant_enabled ? 'Sim' : 'Nao'}</strong>
                </div>
                <div>
                  <span>Origem da configuracao</span>
                  <strong>Codigo do sistema</strong>
                </div>
              </div>
              <p className="master-module-technical-note">
                Slug, base path e prefixo de API permanecem bloqueados para evitar quebra de rotas, APIs e isolamento entre empresas.
              </p>
            </section>
          </div>
        )}

        {activeTab === 'control' && (
          <div className="master-module-control-card">
            <div className="master-module-section-heading">
              <h3>Controle comercial</h3>
              <span>Disponibilidade</span>
            </div>
            <p>
              Ativar ou inativar um modulo altera sua disponibilidade comercial no painel master. A estrutura interna do sistema,
              autenticacao e roteamento tecnico permanecem controlados pelo codigo.
            </p>
            <div className="master-module-control-actions">
              <button
                type="button"
                className={moduleRecord.is_active ? 'button-secondary' : ''}
                disabled={toggling}
                onClick={() => onToggleModule(moduleRecord)}
              >
                {toggling ? 'Salvando...' : moduleRecord.is_active ? 'Inativar modulo' : 'Ativar modulo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

export default ModuleForm
