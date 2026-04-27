import { useEffect, useMemo, useState } from 'react'
import MasterLayout from '../components/master/MasterLayout'
import PageHeader from '../components/master/PageHeader'
import SectionCard from '../components/master/SectionCard'
import PremiumSelect from '../components/master/clients/PremiumSelect'
import api from '../services/api'

const CLIENT_META_STORAGE_KEY = 'master-admin-client-meta'
const EXTRA_NICHES_STORAGE_KEY = 'master-admin-client-extra-niches'

const nicheOptionsBase = ['Barbearia', 'Climatizacao', 'Terraplanagem', 'Estetica', 'Outros']
const sourceOptions = [
  { value: 'manual', label: 'Manual' },
  { value: 'kiwify', label: 'Kiwify' },
  { value: 'gateway', label: 'Gateway' },
  { value: 'indicacao', label: 'Indicacao' }
]

const billingOptions = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' }
]

const companyStatusOptions = [
  { value: 'lead', label: 'Lead' },
  { value: 'trial', label: 'Trial' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inadimplente', label: 'Inadimplente' },
  { value: 'cancelado', label: 'Cancelado' }
]

const defaultPlanOptions = [
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' }
]

const emptyForm = {
  company_name: '',
  document: '',
  email: '',
  phone: '',
  niche: '',
  module_id: '',
  plan_name: 'starter',
  monthly_value: '',
  billing_cycle: 'monthly',
  source: 'manual',
  company_status: 'lead',
  create_access_now: false,
  user_name: '',
  user_email: '',
  user_role: 'admin',
  observations: ''
}

function readJsonStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeJsonStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function normalizeDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function formatCpfCnpj(value) {
  const digits = normalizeDigits(value).slice(0, 14)

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function formatPhoneBr(value) {
  const digits = normalizeDigits(value).slice(0, 11)

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '-'
}

function mapBackendStatusToCommercial(status, meta = {}) {
  if (meta.company_status) {
    return meta.company_status
  }

  if (status === 'active') {
    return 'ativo'
  }

  if (status === 'suspended') {
    return 'inadimplente'
  }

  if (status === 'inactive') {
    return 'cancelado'
  }

  return 'lead'
}

function mapCommercialStatusToBackend(status) {
  const map = {
    lead: 'pending',
    trial: 'pending',
    ativo: 'active',
    inadimplente: 'suspended',
    cancelado: 'inactive'
  }

  return map[status] || 'pending'
}

function mapCommercialStatusToSubscription(status) {
  const map = {
    lead: 'pending',
    trial: 'pending',
    ativo: 'active',
    inadimplente: 'late',
    cancelado: 'canceled'
  }

  return map[status] || 'pending'
}

function buildClientMeta(form, extras = {}) {
  return {
    source: form.source,
    company_status: form.company_status,
    observations: form.observations,
    module_id: form.module_id,
    plan_name: form.plan_name,
    monthly_value: form.monthly_value,
    billing_cycle: form.billing_cycle,
    create_access_now: form.create_access_now,
    user_name: form.user_name,
    user_email: form.user_email,
    user_role: form.user_role,
    first_access_link: extras.first_access_link || '',
    subscription_id: extras.subscription_id || '',
    subscription_status: extras.subscription_status || '',
    module_activation_status: extras.module_activation_status || ''
  }
}

function mergeCompanyWithMeta(company, meta) {
  return {
    ...company,
    source: meta.source || 'manual',
    company_status: mapBackendStatusToCommercial(company.status, meta),
    observations: meta.observations || '',
    module_id: meta.module_id || '',
    plan_name: meta.plan_name || '',
    monthly_value: meta.monthly_value || '',
    billing_cycle: meta.billing_cycle || 'monthly',
    first_access_link: meta.first_access_link || '',
    subscription_status: meta.subscription_status || '',
    module_activation_status: meta.module_activation_status || ''
  }
}

function getStoredCompaniesMeta() {
  return readJsonStorage(CLIENT_META_STORAGE_KEY, {})
}

function saveCompanyMeta(companyId, meta) {
  const current = getStoredCompaniesMeta()
  writeJsonStorage(CLIENT_META_STORAGE_KEY, {
    ...current,
    [companyId]: {
      ...(current[companyId] || {}),
      ...meta
    }
  })
}

function readExtraNiches() {
  const stored = readJsonStorage(EXTRA_NICHES_STORAGE_KEY, [])
  return Array.isArray(stored) ? stored : []
}

function createInitialForm(company) {
  if (!company) {
    return emptyForm
  }

  return {
    company_name: company.name || '',
    document: formatCpfCnpj(company.document || ''),
    email: company.email || '',
    phone: formatPhoneBr(company.phone || ''),
    niche: company.niche || company.niche_type || '',
    module_id: company.module_id || '',
    plan_name: company.plan_name || 'starter',
    monthly_value: company.monthly_value || '',
    billing_cycle: company.billing_cycle || 'monthly',
    source: company.source || 'manual',
    company_status: company.company_status || 'lead',
    create_access_now: false,
    user_name: '',
    user_email: '',
    user_role: 'admin',
    observations: company.observations || ''
  }
}

function Clients() {
  const [companies, setCompanies] = useState([])
  const [modules, setModules] = useState([])
  const [planCatalog, setPlanCatalog] = useState(defaultPlanOptions)
  const [extraNiches, setExtraNiches] = useState([])
  const [filters, setFilters] = useState({ q: '', company_status: '' })
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formErrors, setFormErrors] = useState({})

  async function loadData() {
    setError('')
    setLoading(true)

    try {
      const [companiesResponse, modulesResponse, subscriptionsResponse] = await Promise.all([
        api.get('/master/companies'),
        api.get('/master/modules'),
        api.get('/master/subscriptions', {
          params: {
            page: 1,
            limit: 100
          }
        })
      ])

      const companiesData = Array.isArray(companiesResponse.data.data) ? companiesResponse.data.data : []
      const modulesData = Array.isArray(modulesResponse.data.data) ? modulesResponse.data.data : []
      const subscriptionsData = subscriptionsResponse.data.data?.items || []
      const storedMeta = getStoredCompaniesMeta()

      setCompanies(
        companiesData.map((company) => mergeCompanyWithMeta(company, storedMeta[company.id] || {}))
      )
      setModules(modulesData.filter((module) => module.is_active))
      setExtraNiches(readExtraNiches())

      const planNames = Array.from(
        new Set(
          subscriptionsData
            .map((subscription) => String(subscription.plan_name || '').trim())
            .filter(Boolean)
        )
      )

      const mergedPlans = [...defaultPlanOptions]
      planNames.forEach((plan) => {
        if (!mergedPlans.some((item) => item.label.toLowerCase() === plan.toLowerCase())) {
          mergedPlans.push({ value: plan.toLowerCase().replace(/\s+/g, '-'), label: plan })
        }
      })
      setPlanCatalog(mergedPlans)
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar os clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const nicheOptions = useMemo(() => {
    return [...nicheOptionsBase, ...extraNiches]
      .filter((value, index, array) => array.indexOf(value) === index)
      .map((item) => ({ value: item, label: item }))
  }, [extraNiches])

  const filteredCompanies = useMemo(() => {
    const search = filters.q.trim().toLowerCase()

    return companies.filter((company) => {
      const matchStatus = !filters.company_status || company.company_status === filters.company_status
      const haystack = [
        company.name,
        company.email,
        company.document,
        company.phone,
        company.niche,
        company.source,
        company.plan_name
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchSearch = !search || haystack.includes(search)
      return matchStatus && matchSearch
    })
  }, [companies, filters])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function handleFormChange(event) {
    const { name, type, checked, value } = event.target

    setFormErrors((current) => ({ ...current, [name]: '' }))

    if (name === 'document') {
      setForm((current) => ({ ...current, document: formatCpfCnpj(value) }))
      return
    }

    if (name === 'phone') {
      setForm((current) => ({ ...current, phone: formatPhoneBr(value) }))
      return
    }

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  function handleSelectChange(name, value) {
    setFormErrors((current) => ({ ...current, [name]: '' }))
    setForm((current) => ({ ...current, [name]: value }))
  }

  function addNewNiche() {
    const niche = window.prompt('Digite o nome do novo nicho')

    if (!niche) {
      return
    }

    const normalized = niche.trim()
    if (!normalized) {
      return
    }

    const nextNiches = [...extraNiches]
    if (!nextNiches.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      nextNiches.push(normalized)
      setExtraNiches(nextNiches)
      writeJsonStorage(EXTRA_NICHES_STORAGE_KEY, nextNiches)
    }

    setForm((current) => ({ ...current, niche: normalized }))
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormErrors({})
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  function openEdit(company) {
    setEditing(company)
    setForm(createInitialForm(company))
    setFormErrors({})
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(emptyForm)
    setFormErrors({})
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.company_name.trim()) {
      nextErrors.company_name = 'Nome da empresa obrigatorio'
    }

    if (!form.niche) {
      nextErrors.niche = 'Selecione um nicho'
    }

    if (!form.company_status) {
      nextErrors.company_status = 'Selecione um status'
    }

    if (form.create_access_now) {
      if (!form.user_name.trim()) {
        nextErrors.user_name = 'Nome do usuario obrigatorio'
      }

      if (!form.user_email.trim()) {
        nextErrors.user_email = 'Email do usuario obrigatorio'
      }
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const companyPayload = {
      name: form.company_name.trim(),
      document: normalizeDigits(form.document),
      email: form.email.trim(),
      phone: normalizeDigits(form.phone),
      niche: form.niche,
      status: mapCommercialStatusToBackend(form.company_status)
    }

    try {
      const companyResponse = editing
        ? await api.put(`/master/companies/${editing.id}`, companyPayload)
        : await api.post('/master/companies', companyPayload)

      const companyRecord = companyResponse.data.data
      let subscriptionId = ''
      let firstAccessLink = ''
      let moduleActivationStatus = ''
      let subscriptionStatus = ''

      if (form.module_id) {
        try {
          await api.post('/master/company-modules/activate', {
            company_id: companyRecord.id,
            module_id: form.module_id,
            status: 'active'
          })
          moduleActivationStatus = 'active'
        } catch (moduleError) {
          if (moduleError.response?.status !== 409) {
            throw moduleError
          }
          moduleActivationStatus = 'active'
        }
      }

      if (form.plan_name) {
        const subscriptionPayload = {
          company_id: companyRecord.id,
          plan_name: form.plan_name,
          price: Number(form.monthly_value || 0),
          billing_cycle: form.billing_cycle,
          status: mapCommercialStatusToSubscription(form.company_status)
        }

        if (editing) {
          const storedMeta = getStoredCompaniesMeta()[companyRecord.id] || {}
          if (storedMeta.subscription_id) {
            const updateResponse = await api.put(`/master/subscriptions/${storedMeta.subscription_id}`, subscriptionPayload)
            subscriptionId = updateResponse.data.data.id
            subscriptionStatus = updateResponse.data.data.status
          } else {
            const createResponse = await api.post('/master/subscriptions', subscriptionPayload)
            subscriptionId = createResponse.data.data.id
            subscriptionStatus = createResponse.data.data.status
          }
        } else {
          const createResponse = await api.post('/master/subscriptions', subscriptionPayload)
          subscriptionId = createResponse.data.data.id
          subscriptionStatus = createResponse.data.data.status
        }
      }

      if (form.create_access_now) {
        const firstAccessResponse = await api.post('/master/first-access/generate', {
          companyId: companyRecord.id,
          name: form.user_name.trim(),
          email: form.user_email.trim(),
          role: form.user_role
        })
        const token = firstAccessResponse.data.data.firstAccess.token
        firstAccessLink = `${window.location.origin}/first-access?token=${token}`
      }

      saveCompanyMeta(
        companyRecord.id,
        buildClientMeta(form, {
          first_access_link: firstAccessLink,
          subscription_id: subscriptionId,
          subscription_status: subscriptionStatus,
          module_activation_status: moduleActivationStatus
        })
      )

      setSuccess(editing ? 'Cliente atualizado com sucesso' : 'Cliente criado com fluxo completo')
      closeForm()
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel salvar o cliente')
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(company, commercialStatus) {
    setError('')
    setSuccess('')

    try {
      await api.patch(`/master/companies/${company.id}/status`, {
        status: mapCommercialStatusToBackend(commercialStatus)
      })
      saveCompanyMeta(company.id, { company_status: commercialStatus })
      setSuccess('Status atualizado com sucesso')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel alterar o status')
    }
  }

  async function deleteCompany(company) {
    if (!window.confirm(`Excluir ${company.name}?`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await api.delete(`/master/companies/${company.id}`)
      setSuccess('Cliente excluido com sucesso')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel excluir o cliente')
    }
  }

  return (
    <MasterLayout title="Clientes">
      <PageHeader
        title="Novo Cliente"
        description="Estruture cadastro, modulo inicial, plano, ativacao e onboarding em um fluxo unico pronto para automacao."
        actions={<button type="button" onClick={openCreate}>Novo cliente</button>}
      />

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <SectionCard className="master-client-form-shell">
          <div className="panel-title">
            <div>
              <h2>{editing ? 'Editar cliente' : 'Cadastro completo de cliente'}</h2>
              <span>Cliente, modulo, plano e acesso conectados em um unico fluxo.</span>
            </div>
          </div>

          <form className="master-client-form" onSubmit={handleSubmit}>
            <section className="master-client-section">
              <div className="master-client-section-header">
                <span>01</span>
                <div>
                  <strong>Empresa</strong>
                  <p>Dados principais da empresa e classificacao comercial.</p>
                </div>
              </div>

              <div className="master-client-grid">
                <label className="master-client-field master-client-field-full">
                  <span>Nome da empresa</span>
                  <input name="company_name" value={form.company_name} onChange={handleFormChange} placeholder="Ex.: Barber Prime" />
                  {formErrors.company_name && <small>{formErrors.company_name}</small>}
                </label>

                <label className="master-client-field">
                  <span>Documento</span>
                  <input name="document" value={form.document} onChange={handleFormChange} placeholder="CPF ou CNPJ" />
                </label>

                <label className="master-client-field">
                  <span>Telefone</span>
                  <input name="phone" value={form.phone} onChange={handleFormChange} placeholder="(65) 99999-9999" />
                </label>

                <label className="master-client-field master-client-field-full">
                  <span>Email da empresa</span>
                  <input name="email" type="email" value={form.email} onChange={handleFormChange} placeholder="contato@empresa.com" />
                </label>

                <div className="master-client-field">
                  <span>Nicho</span>
                  <PremiumSelect
                    onChange={(value) => handleSelectChange('niche', value)}
                    options={nicheOptions}
                    placeholder="Selecione um nicho"
                    value={form.niche}
                  />
                  {formErrors.niche && <small>{formErrors.niche}</small>}
                  <button className="master-inline-link" type="button" onClick={addNewNiche}>
                    + Adicionar novo nicho
                  </button>
                </div>

                <div className="master-client-field">
                  <span>Status comercial</span>
                  <PremiumSelect
                    onChange={(value) => handleSelectChange('company_status', value)}
                    options={companyStatusOptions}
                    placeholder="Selecione um status"
                    value={form.company_status}
                  />
                  {formErrors.company_status && <small>{formErrors.company_status}</small>}
                </div>

                <div className="master-client-field">
                  <span>Origem do cliente</span>
                  <PremiumSelect
                    onChange={(value) => handleSelectChange('source', value)}
                    options={sourceOptions}
                    placeholder="Selecione a origem"
                    value={form.source}
                  />
                </div>
              </div>
            </section>

            <section className="master-client-section">
              <div className="master-client-section-header">
                <span>02</span>
                <div>
                  <strong>Modulo inicial</strong>
                  <p>Escolha um modulo para ativacao imediata no cadastro.</p>
                </div>
              </div>

              <div className="master-client-grid">
                <div className="master-client-field master-client-field-full">
                  <span>Modulo inicial</span>
                  <PremiumSelect
                    onChange={(value) => handleSelectChange('module_id', value)}
                    options={modules.map((module) => ({
                      value: String(module.id),
                      label: `${module.name} (${module.slug})`
                    }))}
                    placeholder="Selecionar modulo"
                    value={form.module_id ? String(form.module_id) : ''}
                  />
                </div>
              </div>
            </section>

            <section className="master-client-section">
              <div className="master-client-section-header">
                <span>03</span>
                <div>
                  <strong>Plano</strong>
                  <p>Preparacao para gateway, recorrencia e automacao futura.</p>
                </div>
              </div>

              <div className="master-client-grid">
                <div className="master-client-field">
                  <span>Plano</span>
                  <PremiumSelect
                    onChange={(value) => handleSelectChange('plan_name', value)}
                    options={planCatalog}
                    placeholder="Selecionar plano"
                    value={form.plan_name}
                  />
                </div>

                <label className="master-client-field">
                  <span>Valor mensal</span>
                  <input
                    name="monthly_value"
                    step="0.01"
                    type="number"
                    value={form.monthly_value}
                    onChange={handleFormChange}
                    placeholder="0,00"
                  />
                </label>

                <div className="master-client-field">
                  <span>Periodicidade</span>
                  <PremiumSelect
                    onChange={(value) => handleSelectChange('billing_cycle', value)}
                    options={billingOptions}
                    placeholder="Selecionar periodicidade"
                    value={form.billing_cycle}
                  />
                </div>
              </div>
            </section>

            <section className="master-client-section">
              <div className="master-client-section-header">
                <span>04</span>
                <div>
                  <strong>Onboarding e acesso</strong>
                  <p>Opcionalmente crie o primeiro acesso do cliente ao final do cadastro.</p>
                </div>
              </div>

              <div className="master-client-access-toggle">
                <label>
                  <input
                    checked={form.create_access_now}
                    name="create_access_now"
                    type="checkbox"
                    onChange={handleFormChange}
                  />
                  <span>Criar acesso agora?</span>
                </label>
              </div>

              {form.create_access_now && (
                <div className="master-client-grid">
                  <label className="master-client-field">
                    <span>Nome do usuario</span>
                    <input name="user_name" value={form.user_name} onChange={handleFormChange} placeholder="Nome do responsavel" />
                    {formErrors.user_name && <small>{formErrors.user_name}</small>}
                  </label>

                  <label className="master-client-field">
                    <span>Email do usuario</span>
                    <input name="user_email" type="email" value={form.user_email} onChange={handleFormChange} placeholder="usuario@empresa.com" />
                    {formErrors.user_email && <small>{formErrors.user_email}</small>}
                  </label>

                  <div className="master-client-field">
                    <span>Perfil</span>
                    <PremiumSelect
                      onChange={(value) => handleSelectChange('user_role', value)}
                      options={[{ value: 'admin', label: 'Admin cliente' }]}
                      placeholder="Selecione um perfil"
                      value={form.user_role}
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="master-client-section">
              <div className="master-client-section-header">
                <span>05</span>
                <div>
                  <strong>Observacoes internas</strong>
                  <p>Notas operacionais para time comercial, onboarding e sucesso do cliente.</p>
                </div>
              </div>

              <label className="master-client-field master-client-field-full">
                <span>Observacoes</span>
                <textarea
                  name="observations"
                  rows="4"
                  value={form.observations}
                  onChange={handleFormChange}
                  placeholder="Informacoes internas, contexto comercial ou particularidades da ativacao."
                />
              </label>
            </section>

            <div className="master-form-actions">
              <button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar cliente'}</button>
              <button className="button-secondary" type="button" onClick={closeForm}>Cancelar</button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard className="master-client-list-card" title="Lista de clientes" meta={`${filteredCompanies.length} registros`}>
        <form className="master-filter-row master-client-filter-row" onSubmit={(event) => event.preventDefault()}>
          <input
            name="q"
            placeholder="Buscar por empresa, documento, nicho, plano ou origem"
            value={filters.q}
            onChange={handleFilterChange}
          />
          <div className="master-client-filter-select">
            <PremiumSelect
              onChange={(value) => setFilters((current) => ({ ...current, company_status: value }))}
              options={[{ value: '', label: 'Todos os status' }, ...companyStatusOptions]}
              placeholder="Todos os status"
              value={filters.company_status}
            />
          </div>
        </form>

        {loading ? (
          <p>Carregando clientes...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Modulo inicial</th>
                  <th>Plano</th>
                  <th>Origem</th>
                  <th>Status</th>
                  <th>Criada em</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <div className="master-client-company-cell">
                        <strong>{company.name}</strong>
                        <small>{company.email || formatPhoneBr(company.phone || '') || '-'}</small>
                      </div>
                    </td>
                    <td>{modules.find((module) => String(module.id) === String(company.module_id))?.name || 'Nao definido'}</td>
                    <td>{company.plan_name || '-'}</td>
                    <td>{sourceOptions.find((item) => item.value === company.source)?.label || 'Manual'}</td>
                    <td>
                      <span className={`master-client-status-pill ${company.company_status}`}>{company.company_status}</span>
                    </td>
                    <td>{formatDate(company.created_at)}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" onClick={() => openEdit(company)}>Editar</button>
                        <button type="button" onClick={() => changeStatus(company, 'ativo')}>Ativar</button>
                        <button type="button" onClick={() => changeStatus(company, 'inadimplente')}>Inadimplente</button>
                        <button className="button-danger" type="button" onClick={() => deleteCompany(company)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCompanies.length === 0 && (
                  <tr>
                    <td colSpan="7">Nenhum cliente encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </MasterLayout>
  )
}

export default Clients
