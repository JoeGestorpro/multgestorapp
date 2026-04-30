import { useEffect, useMemo, useState } from 'react'
import SectionCard from '../SectionCard'
import PremiumSelect from './PremiumSelect'
import { getPlanCollaboratorLimitLabel, normalizePlanType } from '../../../utils/companyPlans'

const planSourceOptions = [
  { value: 'manual', label: 'Manual' },
  { value: 'gateway', label: 'Gateway' },
  { value: 'kiwify', label: 'Kiwify' }
]

const durationOptions = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: '180', label: '180 dias' },
  { value: '365', label: '365 dias' },
  { value: 'custom', label: 'Personalizado' }
]

const tabs = [
  { id: 'overview', label: 'Visao Geral' },
  { id: 'modules', label: 'Modulos' },
  { id: 'plan', label: 'Plano' },
  { id: 'access', label: 'Acesso' },
  { id: 'gateway', label: 'Assinatura / Gateway' }
]

function formatDateInput(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

function addDaysToDate(dateValue, days) {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  date.setDate(date.getDate() + Number(days || 0))
  return date.toISOString().slice(0, 10)
}

function getInitialDurationMode(durationDays, planType) {
  const fallback = normalizePlanType(planType) === 'trial' ? 7 : 30
  const normalized = Number(durationDays || fallback)
  return [7, 30, 90, 180, 365].includes(normalized) ? String(normalized) : 'custom'
}

function ClientDetailPanel({
  client,
  initialTab,
  nicheOptions,
  sourceOptions,
  companyStatusOptions,
  planOptions,
  savingKey,
  onClose,
  onSaveOverview,
  onToggleModule,
  onSavePlan,
  onCreateManualAccess,
  onSendFirstAccess,
  onResendFirstAccess,
  onCopyFirstAccessLink,
  manualActivationLink
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'overview')
  const [overviewForm, setOverviewForm] = useState(null)
  const [planForm, setPlanForm] = useState(null)
  const [accessForm, setAccessForm] = useState(null)

  const activeModules = useMemo(
    () => (client?.company_modules || []).filter((item) => item.status === 'active'),
    [client]
  )

  useEffect(() => {
    if (!client) {
      return
    }

    const normalizedPlanType = normalizePlanType(client.plan_type)
    const durationDays = client.plan_duration_days || (normalizedPlanType === 'trial' ? 7 : normalizedPlanType === 'free' ? 0 : 30)

    setActiveTab(initialTab || 'overview')
    setOverviewForm({
      company_name: client.name || '',
      document: client.document || '',
      email: client.email || '',
      phone: client.phoneLabel || client.phone || '',
      niche: client.niche || '',
      source: client.source || 'manual',
      company_status: client.company_status || 'lead',
      observations: client.observations || ''
    })
    setPlanForm({
      plan_type: normalizedPlanType,
      source: client.current_subscription?.gateway || 'manual',
      duration_mode: getInitialDurationMode(durationDays, normalizedPlanType),
      duration_days: String(durationDays),
      current_period_start: formatDateInput(client.current_subscription?.current_period_start || client.created_at),
      next_due_date: formatDateInput(client.current_subscription?.next_due_date),
      trial_ends_at: formatDateInput(client.trial_ends_at)
    })
    setAccessForm({
      email: client.owner_user_email || client.email || '',
      password: '',
      confirmPassword: ''
    })
  }, [client, initialTab, activeModules])

  if (!client || !overviewForm || !planForm || !accessForm) {
    return null
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  function handleOverviewChange(event) {
    const { name, value } = event.target
    setOverviewForm((current) => ({ ...current, [name]: value }))
  }

  function handleAccessChange(event) {
    const { name, type, checked, value } = event.target
    setAccessForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function handlePlanChange(name, value) {
    setPlanForm((current) => {
      const nextPlanForm = {
        ...current,
        [name]: value
      }

      if (name === 'duration_mode') {
        nextPlanForm.duration_days = value === 'custom' ? current.duration_days : value
      }

      const nextPlanType = normalizePlanType(nextPlanForm.plan_type)
      const durationDays = Number(nextPlanForm.duration_mode === 'custom' ? nextPlanForm.duration_days : nextPlanForm.duration_mode)

      if (nextPlanType === 'trial') {
        nextPlanForm.trial_ends_at = addDaysToDate(nextPlanForm.current_period_start, durationDays)
        nextPlanForm.next_due_date = ''
        nextPlanForm.source = 'manual'
      } else if (nextPlanType === 'free') {
        nextPlanForm.trial_ends_at = ''
        nextPlanForm.next_due_date = ''
        nextPlanForm.source = 'manual'
      } else {
        nextPlanForm.trial_ends_at = ''
        nextPlanForm.next_due_date = addDaysToDate(nextPlanForm.current_period_start, durationDays)
      }

      return nextPlanForm
    })
  }

  function renderOverviewTab() {
    return (
      <div className="master-client-detail-grid">
        <section className="master-client-detail-card">
          <div className="master-client-section-heading">
            <h3>Dados da empresa</h3>
            <span>Comercial</span>
          </div>

          <div className="master-client-grid">
            <label className="master-client-field master-client-field-full">
              <span>Nome da empresa</span>
              <input name="company_name" value={overviewForm.company_name} onChange={handleOverviewChange} />
            </label>

            <label className="master-client-field">
              <span>Documento</span>
              <input name="document" value={overviewForm.document} onChange={handleOverviewChange} />
            </label>

            <label className="master-client-field">
              <span>Telefone</span>
              <input name="phone" value={overviewForm.phone} onChange={handleOverviewChange} />
            </label>

            <label className="master-client-field master-client-field-full">
              <span>Email da empresa</span>
              <input name="email" type="email" value={overviewForm.email} onChange={handleOverviewChange} />
            </label>

            <div className="master-client-field">
              <span>Nicho</span>
              <PremiumSelect
                value={overviewForm.niche}
                onChange={(nextValue) => setOverviewForm((current) => ({ ...current, niche: nextValue }))}
                options={nicheOptions}
                placeholder="Selecione o nicho"
              />
            </div>

            <div className="master-client-field">
              <span>Origem</span>
              <PremiumSelect
                value={overviewForm.source}
                onChange={(nextValue) => setOverviewForm((current) => ({ ...current, source: nextValue }))}
                options={sourceOptions}
                placeholder="Selecione a origem"
              />
            </div>

            <div className="master-client-field">
              <span>Status</span>
              <PremiumSelect
                value={overviewForm.company_status}
                onChange={(nextValue) => setOverviewForm((current) => ({ ...current, company_status: nextValue }))}
                options={companyStatusOptions}
                placeholder="Selecione o status"
              />
            </div>

            <div className="master-client-field">
              <span>Criado em</span>
              <div className="master-client-readonly">{client.created_label}</div>
            </div>

            <label className="master-client-field master-client-field-full">
              <span>Observacoes</span>
              <textarea name="observations" rows="4" value={overviewForm.observations} onChange={handleOverviewChange} />
            </label>
          </div>

          <div className="master-form-actions">
            <button type="button" disabled={savingKey === 'overview'} onClick={() => onSaveOverview(client, overviewForm)}>
              {savingKey === 'overview' ? 'Salvando...' : 'Salvar dados do cliente'}
            </button>
          </div>
        </section>

        <section className="master-client-detail-card">
          <div className="master-client-section-heading">
            <h3>Resumo atual</h3>
            <span>Painel master</span>
          </div>

          <div className="master-client-overview-list">
            <div>
              <span>Modulo principal</span>
              <strong>{client.primary_module_name || 'Sem modulo ativo'}</strong>
            </div>
            <div>
              <span>Plano</span>
              <strong>{client.plan_summary || 'Trial - configuracao inicial'}</strong>
            </div>
            <div>
              <span>Origem</span>
              <strong>{client.source_label}</strong>
            </div>
            <div>
              <span>Acesso atual</span>
              <strong>{client.owner_user_email || client.pending_activation?.user_email || 'Nao configurado'}</strong>
            </div>
          </div>
        </section>
      </div>
    )
  }

  function renderModulesTab() {
    return (
      <div className="master-client-module-list">
        {client.available_modules.map((module) => {
          const companyModule = client.company_modules.find((item) => String(item.module_id) === String(module.id))
          const isActive = companyModule?.status === 'active'

          return (
            <article key={module.id} className="master-client-module-item">
              <div>
                <strong>{module.name}</strong>
                <p>{module.description || `Slug tecnico: ${module.slug}`}</p>
              </div>
              <div className="master-client-module-item-side">
                <span className={`master-client-status-pill ${isActive ? 'ativo' : 'cancelado'}`}>
                  {isActive ? 'Ativo' : 'Inativo'}
                </span>
                <code>{module.slug}</code>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={savingKey === `module:${module.id}`}
                  onClick={() => onToggleModule(client, module, isActive)}
                >
                  {savingKey === `module:${module.id}` ? 'Salvando...' : isActive ? 'Inativar modulo' : 'Ativar modulo'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  function renderPlanTab() {
    const normalizedPlanType = normalizePlanType(planForm.plan_type)
    const durationDays = Number(planForm.duration_mode === 'custom' ? planForm.duration_days : planForm.duration_mode)
    const limitLabel = getPlanCollaboratorLimitLabel(planForm.plan_type)
    const statusLabel = normalizedPlanType === 'trial' ? 'Trial' : normalizedPlanType === 'free' ? 'Free' : 'Ativo'
    const renewalLabel = normalizedPlanType === 'trial'
      ? (planForm.trial_ends_at || 'Sem vencimento definido')
      : normalizedPlanType === 'free'
        ? 'Sem vencimento definido'
        : (planForm.next_due_date || 'Sem vencimento definido')

    const summary = normalizedPlanType === 'trial'
      ? `Teste gratis com expiracao em ${renewalLabel}. ${limitLabel}.`
      : normalizedPlanType === 'free'
        ? `Plano Gratuito sem cobranca recorrente. ${limitLabel}.`
        : `Plano ${normalizedPlanType === 'essencial' ? 'Essencial' : normalizedPlanType === 'profissional' ? 'Profissional' : 'Premium'} ativo por ${Number.isFinite(durationDays) ? durationDays : 30} dias. ${limitLabel}.`

    return (
      <section className="master-client-detail-card">
        <div className="master-client-section-heading">
          <h3>Plano e cobranca</h3>
          <span>Comercial</span>
        </div>

        {activeModules.length === 0 ? (
          <p className="master-client-empty-copy">Ative um modulo para este cliente antes de configurar o plano.</p>
        ) : (
          <>
            <div className="master-client-grid">
              <div className="master-client-field">
                <span>Modulo ativo</span>
                <div className="master-client-readonly">{client.primary_module_name || 'Sem modulo ativo'}</div>
              </div>

              <div className="master-client-field">
                <span>Plano</span>
                <PremiumSelect
                  value={planForm.plan_type}
                  onChange={(value) => handlePlanChange('plan_type', value)}
                  options={planOptions}
                  placeholder="Selecione o plano"
                />
              </div>

              <div className="master-client-field">
                <span>Origem do plano</span>
                <PremiumSelect
                  value={planForm.source}
                  onChange={(value) => handlePlanChange('source', value)}
                  options={planSourceOptions}
                  placeholder="Selecione a origem"
                />
              </div>

              <label className="master-client-field">
                <span>Data de inicio</span>
                <input
                  type="date"
                  value={planForm.current_period_start}
                  onChange={(event) => handlePlanChange('current_period_start', event.target.value)}
                />
              </label>

              <div className="master-client-field">
                <span>Validade em dias</span>
                <PremiumSelect
                  value={planForm.duration_mode}
                  onChange={(value) => handlePlanChange('duration_mode', value)}
                  options={durationOptions}
                  placeholder="Selecione a validade"
                />
              </div>

              {planForm.duration_mode === 'custom' ? (
                <label className="master-client-field">
                  <span>Validade personalizada</span>
                  <input
                    min="1"
                    type="number"
                    value={planForm.duration_days}
                    onChange={(event) => handlePlanChange('duration_days', event.target.value)}
                  />
                </label>
              ) : null}

              <div className="master-client-field">
                <span>Proxima renovacao / vencimento</span>
                <div className="master-client-readonly">{renewalLabel}</div>
              </div>

              <div className="master-client-field">
                <span>Status</span>
                <div className="master-client-readonly">{statusLabel}</div>
              </div>

              <div className="master-client-field">
                <span>Limite de colaboradores</span>
                <div className="master-client-readonly">{limitLabel}</div>
              </div>

              <div className="master-client-field master-client-field-full">
                <span>Resumo do plano</span>
                <div className="master-client-readonly">{summary}</div>
              </div>
            </div>

            <div className="master-form-actions">
              <button type="button" disabled={savingKey === 'plan'} onClick={() => onSavePlan(client, planForm)}>
                {savingKey === 'plan' ? 'Salvando...' : 'Salvar plano do cliente'}
              </button>
            </div>
          </>
        )}
      </section>
    )
  }

  function renderAccessTab() {
    const firstAccessEmail = client.email || client.owner_user_email || ''

    return (
      <div className="master-client-detail-grid">
        <section className="master-client-detail-card">
          <div className="master-client-section-heading">
            <h3>Criar acesso manual</h3>
            <span>Cliente manual</span>
          </div>

          <div className="master-client-grid">
            <label className="master-client-field master-client-field-full">
              <span>E-mail de login</span>
              <input name="email" type="email" value={accessForm.email} onChange={handleAccessChange} placeholder="cliente@empresa.com" />
            </label>

            <label className="master-client-field">
              <span>Senha inicial</span>
              <input name="password" type="password" value={accessForm.password} onChange={handleAccessChange} placeholder="Minimo de 6 caracteres" />
            </label>

            <label className="master-client-field">
              <span>Confirmar senha</span>
              <input name="confirmPassword" type="password" value={accessForm.confirmPassword} onChange={handleAccessChange} placeholder="Repita a senha" />
            </label>

            <div className="master-client-field master-client-field-full">
              <span>Validacao do acesso</span>
              <div className="master-client-readonly">O e-mail sera marcado como verificado automaticamente para permitir login imediato.</div>
            </div>
          </div>

          <div className="master-form-actions">
            <button type="button" disabled={savingKey === 'manual-access'} onClick={() => onCreateManualAccess(client, accessForm)}>
              {savingKey === 'manual-access' ? 'Salvando...' : 'Criar acesso manual'}
            </button>
          </div>
        </section>

        <section className="master-client-detail-card">
          <div className="master-client-section-heading">
            <h3>Primeiro acesso por link</h3>
            <span>Compra / gateway</span>
          </div>

          <div className="master-client-overview-list">
            <div>
              <span>E-mail usado</span>
              <strong>{firstAccessEmail || 'Defina o e-mail da empresa para usar este fluxo'}</strong>
            </div>
            <div>
              <span>Status da ativacao</span>
              <strong>{client.pending_activation ? 'Pendente' : 'Sem envio pendente'}</strong>
            </div>
            <div>
              <span>Fluxo</span>
              <strong>Cliente define a propria senha pelo link</strong>
            </div>
          </div>

          <div className="master-form-actions">
            {client.pending_activation ? (
              <>
                <button type="button" disabled={savingKey === 'resend-access'} onClick={() => onResendFirstAccess(client)}>
                  {savingKey === 'resend-access' ? 'Enviando...' : 'Reenviar acesso'}
                </button>
                <button type="button" className="button-secondary" disabled={savingKey === 'copy-access'} onClick={() => onCopyFirstAccessLink(client)}>
                  {savingKey === 'copy-access' ? 'Copiando...' : 'Copiar link de acesso'}
                </button>
              </>
            ) : (
              <button type="button" disabled={savingKey === 'send-access'} onClick={() => onSendFirstAccess(client)}>
                {savingKey === 'send-access' ? 'Enviando...' : 'Enviar link de primeiro acesso'}
              </button>
            )}
          </div>

          {manualActivationLink ? (
            <div className="master-client-field master-client-field-full">
              <span>Link de acesso</span>
              <input readOnly value={manualActivationLink} onFocus={(event) => event.target.select()} />
            </div>
          ) : null}
        </section>
      </div>
    )
  }

  function renderGatewayTab() {
    return (
      <section className="master-client-detail-card">
        <div className="master-client-section-heading">
          <h3>Assinatura e gateway</h3>
          <span>Preparado para evolucao</span>
        </div>

        <div className="master-client-overview-list">
          <div>
            <span>Gateway</span>
            <strong>{client.current_subscription?.gateway || 'Manual / nao informado'}</strong>
          </div>
          <div>
            <span>Webhook status</span>
            <strong>{client.current_subscription?.status || 'Nao configurado'}</strong>
          </div>
          <div>
            <span>Proxima cobranca</span>
            <strong>{client.current_subscription?.next_due_date_label || '-'}</strong>
          </div>
          <div>
            <span>Ultimo pagamento</span>
            <strong>{client.current_subscription?.current_period_start_label || '-'}</strong>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div
      aria-modal="true"
      className="master-record-drawer-overlay"
      role="dialog"
      aria-label={`Gerenciar cliente ${client.name}`}
      onClick={handleOverlayClick}
    >
      <SectionCard className="master-client-detail-shell master-record-drawer">
        <div className="master-client-detail-header">
          <div>
            <span className="master-module-kicker">Cliente selecionado</span>
            <h2>{client.name}</h2>
            <p>Gerencie empresa, modulos, plano e acesso sem misturar configuracoes tecnicas do sistema.</p>
          </div>
          <div className="master-client-detail-actions">
            <div className="master-client-detail-badges">
              <span className={`master-client-status-pill ${client.company_status}`}>{client.company_status_label}</span>
              {client.primary_module_name && <span className="master-module-plan-badge">{client.primary_module_name}</span>}
              {client.plan_name && <span className="master-module-plan-badge">{client.plan_name}</span>}
            </div>
            <button type="button" className="button-secondary master-record-drawer-close" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>

        <div className="master-client-tabs" role="tablist" aria-label="Abas do cliente">
          {tabs.map((tab) => (
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

        <div className="master-client-tab-panel">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'modules' && renderModulesTab()}
          {activeTab === 'plan' && renderPlanTab()}
          {activeTab === 'access' && renderAccessTab()}
          {activeTab === 'gateway' && renderGatewayTab()}
        </div>
      </SectionCard>
    </div>
  )
}

export default ClientDetailPanel
