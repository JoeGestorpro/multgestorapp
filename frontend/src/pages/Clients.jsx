import { useEffect, useMemo, useState } from 'react'
import MasterLayout from '../components/master/MasterLayout'
import PageHeader from '../components/master/PageHeader'
import SectionCard from '../components/master/SectionCard'
import StatCard from '../components/master/StatCard'
import ClientCatalogList from '../components/master/clients/ClientCatalogList'
import ClientCreateForm from '../components/master/clients/ClientCreateForm'
import ClientDetailPanel from '../components/master/clients/ClientDetailPanel'
import PremiumSelect from '../components/master/clients/PremiumSelect'
import api from '../services/api'
import {
  PLAN_OPTIONS,
  defaultPlanOptions,
  getPlanCollaboratorLimitLabel,
  getPlanLabel,
  getPlanLimits,
  normalizePlanType
} from '../utils/companyPlans'

const CLIENT_META_STORAGE_KEY = 'master-admin-client-meta'
const EXTRA_NICHES_STORAGE_KEY = 'master-admin-client-extra-niches'

const nicheOptionsBase = ['Barbearia', 'Climatizacao', 'Terraplanagem', 'Estetica', 'Outros']
const sourceOptions = [
  { value: 'manual', label: 'Manual' },
  { value: 'kiwify', label: 'Kiwify' },
  { value: 'gateway', label: 'Outro gateway' },
  { value: 'indicacao', label: 'Indicacao' }
]
const companyStatusOptions = [
  { value: 'lead', label: 'Lead' },
  { value: 'trial', label: 'Trial' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inadimplente', label: 'Atrasado' },
  { value: 'cancelado', label: 'Cancelado' }
]
const emptyCreateForm = {
  company_name: '',
  document: '',
  email: '',
  phone: '',
  niche: '',
  source: 'manual',
  company_status: 'lead',
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

  if (!digits) {
    return ''
  }

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

function getDurationDaysBetween(startDate, endDate, fallback = 30) {
  if (!startDate || !endDate) {
    return fallback
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return fallback
  }

  const diffInDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return diffInDays > 0 ? diffInDays : fallback
}

function mapBackendStatusToCommercial(status, fallback = 'lead') {
  const normalized = String(status || '').toLowerCase()

  if (normalized === 'active') {
    return 'ativo'
  }

  if (normalized === 'suspended' || normalized === 'late') {
    return 'inadimplente'
  }

  if (normalized === 'inactive' || normalized === 'canceled' || normalized === 'refunded') {
    return 'cancelado'
  }

  if (normalized === 'pending') {
    return fallback === 'trial' ? 'trial' : 'lead'
  }

  return fallback
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

function getStatusLabel(value) {
  return companyStatusOptions.find((item) => item.value === value)?.label || value
}

function getSourceLabel(value) {
  return sourceOptions.find((item) => item.value === value)?.label || 'Manual'
}

function buildClientMeta(base = {}, overrides = {}) {
  return {
    source: overrides.source ?? base.source ?? 'manual',
    observations: overrides.observations ?? base.observations ?? ''
  }
}

function sortByDateDesc(items, getDate) {
  return [...items].sort((a, b) => {
    const left = new Date(getDate(a) || 0).getTime()
    const right = new Date(getDate(b) || 0).getTime()
    return right - left
  })
}

function getTrialDaysRemaining(trialEndsAt) {
  if (!trialEndsAt) {
    return 0
  }

  const diff = new Date(trialEndsAt).getTime() - Date.now()
  if (Number.isNaN(diff)) {
    return 0
  }

  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0)
}

function isTrialExpired(company) {
  if (String(company.plan_type || 'trial').toLowerCase() !== 'trial') {
    return false
  }

  if (!company.trial_ends_at) {
    return false
  }

  return new Date(company.trial_ends_at).getTime() < Date.now()
}

function getEffectivePlanType(company, currentSubscription) {
  const subscriptionPlanType = normalizePlanType(currentSubscription?.plan_name || '')

  if (currentSubscription?.plan_name && subscriptionPlanType !== 'trial') {
    return subscriptionPlanType
  }

  if (currentSubscription?.plan_name && currentSubscription?.status === 'pending' && subscriptionPlanType === 'trial') {
    return 'trial'
  }

  return normalizePlanType(company.plan_type)
}

function getPlanPresentation(company) {
  const planType = normalizePlanType(company.plan_type)
  const currentSubscription = company.current_subscription || null
  const expired = isTrialExpired(company)
  const trialDaysRemaining = getTrialDaysRemaining(company.trial_ends_at)
  const limitLabel = getPlanCollaboratorLimitLabel(planType)
  const maxCollaborators = company.max_collaborators ?? getPlanLimits(planType).max_collaborators
  const nextDueDateLabel = currentSubscription?.next_due_date ? formatDate(currentSubscription.next_due_date) : ''
  const currentPeriodStartLabel = currentSubscription?.current_period_start ? formatDate(currentSubscription.current_period_start) : ''
  const sourceLabel = getSourceLabel(currentSubscription?.gateway || 'manual')
  const durationDays = getDurationDaysBetween(currentSubscription?.current_period_start, currentSubscription?.next_due_date, planType === 'trial' ? 7 : 30)

  if (planType === 'trial') {
    const trialSummary = expired
      ? 'Teste grátis expirado.'
      : trialDaysRemaining === 0
        ? 'Teste grátis: vence hoje.'
        : `Teste grátis: ${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'dia restante' : 'dias restantes'}.`

    return {
      planLabel: 'Teste grátis',
      planSummary: trialSummary,
      limitLabel,
      maxCollaborators,
      trialDaysRemaining,
      isExpired: expired,
      statusLabel: 'Trial',
      sourceLabel: 'Manual',
      currentPeriodStartLabel,
      nextDueDateLabel: '',
      durationDays: durationDays || trialDaysRemaining || 7
    }
  }

  if (planType === 'free') {
    return {
      planLabel: 'Gratuito',
      planSummary: 'Plano Gratuito sem vencimento definido',
      limitLabel,
      maxCollaborators,
      trialDaysRemaining: 0,
      isExpired: false,
      statusLabel: 'Free',
      sourceLabel,
      currentPeriodStartLabel,
      nextDueDateLabel: '',
      durationDays: 0
    }
  }

  return {
    planLabel: getPlanLabel(planType),
    planSummary: nextDueDateLabel
      ? `Plano ${getPlanLabel(planType)} ativo ate ${nextDueDateLabel}`
      : `Plano ${getPlanLabel(planType)} ativo sem vencimento definido`,
    limitLabel,
    maxCollaborators,
    trialDaysRemaining: 0,
    isExpired: false,
    statusLabel: 'Ativo',
    sourceLabel,
    currentPeriodStartLabel,
    nextDueDateLabel,
      durationDays
  }
}

function buildCompanyRecord(company, meta, modules, companyModules, subscriptions, activations) {
  const companyModuleRows = companyModules.filter((item) => String(item.company_id) === String(company.id))
  const companySubscriptionRows = sortByDateDesc(
    subscriptions.filter((item) => String(item.company_id) === String(company.id)),
    (item) => item.updated_at || item.created_at
  )
  const activeModuleRows = companyModuleRows.filter((item) => item.status === 'active')
  const currentSubscription = companySubscriptionRows[0] || null
  const primaryModule =
    activeModuleRows.find((item) => String(item.module_id) === String(currentSubscription?.module_id)) ||
    activeModuleRows[0] ||
    companyModuleRows[0] ||
    null
  const primaryModuleInfo = modules.find((item) => String(item.id) === String(primaryModule?.module_id)) || null
  const pendingActivation = sortByDateDesc(
    activations.filter((item) => String(item.company_id) === String(company.id) && item.status === 'pending'),
    (item) => item.created_at
  )[0] || null

  const effectivePlanType = getEffectivePlanType(company, currentSubscription)
  const source = meta.source || (currentSubscription?.gateway ? String(currentSubscription.gateway).toLowerCase() : 'manual')
  const companyStatus = mapBackendStatusToCommercial(
    currentSubscription?.status || company.status,
    company.status === 'pending' && effectivePlanType === 'trial' ? 'trial' : 'lead'
  )
  const currentSubscriptionRecord = currentSubscription
    ? {
        ...currentSubscription,
        next_due_date_label: formatDate(currentSubscription.next_due_date),
        current_period_start_label: formatDate(currentSubscription.current_period_start)
      }
    : null
  const planPresentation = getPlanPresentation({
    ...company,
    plan_type: effectivePlanType,
    trial_ends_at: effectivePlanType === 'trial'
      ? (company.trial_ends_at || currentSubscription?.next_due_date || null)
      : null,
    current_subscription: currentSubscriptionRecord
  })
  const primaryModuleFromCompany = modules.find((item) => item.slug === company.module_slug) || null

  return {
    ...company,
    plan_type: effectivePlanType,
    source,
    source_label: getSourceLabel(source),
    company_status: companyStatus,
    company_status_label: getStatusLabel(companyStatus),
    observations: meta.observations || '',
    company_modules: companyModuleRows,
    active_modules: activeModuleRows,
    available_modules: modules,
    current_subscription: currentSubscriptionRecord,
    pending_activation: pendingActivation,
    primary_module_id: primaryModuleFromCompany?.id || primaryModuleInfo?.id || primaryModule?.module_id || '',
    primary_module_name: primaryModuleFromCompany?.name || primaryModuleInfo?.name || primaryModule?.module_name || '',
    primary_module_slug: primaryModuleFromCompany?.slug || primaryModuleInfo?.slug || primaryModule?.module_slug || '',
    plan_name: planPresentation.planLabel,
    plan_summary: planPresentation.planSummary,
    plan_status_label: planPresentation.statusLabel,
    plan_source_label: planPresentation.sourceLabel,
    plan_limit_label: planPresentation.limitLabel,
    max_collaborators_label: planPresentation.limitLabel,
    max_collaborators_value: planPresentation.maxCollaborators,
    plan_duration_days: planPresentation.durationDays,
    trial_days_remaining: planPresentation.trialDaysRemaining,
    plan_expired: planPresentation.isExpired,
    created_label: formatDate(company.created_at),
    phoneLabel: formatPhoneBr(company.phone || ''),
    documentLabel: formatCpfCnpj(company.document || '')
  }
}

function Clients() {
  const [companies, setCompanies] = useState([])
  const [modules, setModules] = useState([])
  const [companyModules, setCompanyModules] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [activations, setActivations] = useState([])
  const [planOptions, setPlanOptions] = useState(defaultPlanOptions)
  const [extraNiches, setExtraNiches] = useState([])
  const [filters, setFilters] = useState({ q: '', company_status: '' })
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [createErrors, setCreateErrors] = useState({})
  const [selectedClientId, setSelectedClientId] = useState('')
  const [detailInitialTab, setDetailInitialTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState('')
  const [statusBusyId, setStatusBusyId] = useState('')
  const [accessBusyId, setAccessBusyId] = useState('')
  const [manualActivationLink, setManualActivationLink] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadData(options = {}) {
    if (options.clearMessage !== false) {
      setError('')
    }

    setLoading(true)

    try {
      const responses = await Promise.allSettled([
        api.get('/master/companies'),
        api.get('/master/modules'),
        api.get('/master/company-modules'),
        api.get('/master/subscriptions', { params: { page: 1, limit: 100 } }),
        api.get('/master/activations')
      ])

      const companiesResponse = responses[0]
      const modulesResponse = responses[1]
      const companyModulesResponse = responses[2]
      const subscriptionsResponse = responses[3]
      const activationsResponse = responses[4]

      if (companiesResponse.status !== 'fulfilled') {
        throw companiesResponse.reason
      }

      const companiesData = Array.isArray(companiesResponse.value.data.data)
        ? companiesResponse.value.data.data
        : companiesResponse.value.data.data.items || []
      const modulesData = modulesResponse.status === 'fulfilled'
        ? (Array.isArray(modulesResponse.value.data.data) ? modulesResponse.value.data.data : [])
        : []
      const companyModulesData = companyModulesResponse.status === 'fulfilled'
        ? (Array.isArray(companyModulesResponse.value.data.data) ? companyModulesResponse.value.data.data : [])
        : []
      const subscriptionsData = subscriptionsResponse.status === 'fulfilled'
        ? (subscriptionsResponse.value.data.data.items || [])
        : []
      const activationsData = activationsResponse.status === 'fulfilled'
        ? (Array.isArray(activationsResponse.value.data.data) ? activationsResponse.value.data.data : [])
        : []
      const storedMeta = getStoredCompaniesMeta()

      const nextCompanies = companiesData.map((company) =>
        buildCompanyRecord(
          company,
          storedMeta[company.id] || {},
          modulesData,
          companyModulesData,
          subscriptionsData,
          activationsData
        )
      )

      setCompanies(nextCompanies)
      setModules(modulesData)
      setCompanyModules(companyModulesData)
      setSubscriptions(subscriptionsData)
      setActivations(activationsData)
      setExtraNiches(readJsonStorage(EXTRA_NICHES_STORAGE_KEY, []))

      setPlanOptions(PLAN_OPTIONS)

      setSelectedClientId((current) => {
        if (options.selectedClientId) {
          return options.selectedClientId
        }

        if (current && nextCompanies.some((item) => String(item.id) === String(current))) {
          return current
        }

        return ''
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar os clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadData({ clearMessage: false })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const nicheOptions = useMemo(
    () => [...nicheOptionsBase, ...extraNiches]
      .filter((value, index, array) => array.indexOf(value) === index)
      .map((item) => ({ value: item, label: item })),
    [extraNiches]
  )

  const filteredCompanies = useMemo(() => {
    const search = filters.q.trim().toLowerCase()

    return companies.filter((company) => {
      const matchStatus = !filters.company_status || company.company_status === filters.company_status
      const haystack = [
        company.name,
        company.email,
        company.document,
        company.niche,
        company.primary_module_name,
        company.plan_name,
        company.source_label
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return matchStatus && (!search || haystack.includes(search))
    })
  }, [companies, filters])

  const selectedClient = useMemo(
    () => companies.find((item) => String(item.id) === String(selectedClientId)) || null,
    [companies, selectedClientId]
  )

  useEffect(() => {
    if (!selectedClient) {
      document.body.style.overflow = ''
      return undefined
    }

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedClient])

  const summary = useMemo(() => ({
    total: companies.length,
    active: companies.filter((item) => item.company_status === 'ativo').length,
    trial: companies.filter((item) => item.company_status === 'trial').length,
    lateOrCanceled: companies.filter((item) => ['inadimplente', 'cancelado'].includes(item.company_status)).length
  }), [companies])

  function handleCreateChange(event) {
    const { name, value } = event.target

    setCreateErrors((current) => ({ ...current, [name]: '' }))

    if (name === 'document') {
      setCreateForm((current) => ({ ...current, document: formatCpfCnpj(value) }))
      return
    }

    if (name === 'phone') {
      setCreateForm((current) => ({ ...current, phone: formatPhoneBr(value) }))
      return
    }

    setCreateForm((current) => ({ ...current, [name]: value }))
  }

  function handleCreateSelectChange(name, value) {
    setCreateErrors((current) => ({ ...current, [name]: '' }))
    setCreateForm((current) => ({ ...current, [name]: value }))
  }

  function openCreate() {
    setShowCreateForm(true)
    setCreateForm(emptyCreateForm)
    setCreateErrors({})
    setError('')
    setSuccess('')
  }

  function closeCreate() {
    setShowCreateForm(false)
    setCreateForm(emptyCreateForm)
    setCreateErrors({})
  }

  function openManage(client, initialTab = 'overview') {
    setSelectedClientId(client.id)
    setDetailInitialTab(initialTab)
    setManualActivationLink('')
    setError('')
    setSuccess('')
  }

  function closeManage() {
    setSelectedClientId('')
    setManualActivationLink('')
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

    setCreateForm((current) => ({ ...current, niche: normalized }))
  }

  function validateCreateForm() {
    const nextErrors = {}

    if (!createForm.company_name.trim()) {
      nextErrors.company_name = 'Nome da empresa obrigatorio'
    }

    if (!createForm.niche) {
      nextErrors.niche = 'Selecione um nicho'
    }

    if (!createForm.company_status) {
      nextErrors.company_status = 'Selecione o status comercial'
    }

    setCreateErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleCreateSubmit(event) {
    event.preventDefault()

    if (!validateCreateForm()) {
      return
    }

    setSavingKey('create')
    setError('')
    setSuccess('')

    try {
      const companyPayload = {
        name: createForm.company_name.trim(),
        document: normalizeDigits(createForm.document),
        email: createForm.email.trim(),
        phone: normalizeDigits(createForm.phone),
        niche: createForm.niche,
        status: mapCommercialStatusToBackend(createForm.company_status)
      }

      const response = await api.post('/master/companies', companyPayload)
      const company = response.data.data

      saveCompanyMeta(company.id, buildClientMeta({}, createForm))
      setSuccess('Cliente criado com sucesso. Agora voce pode gerenciar modulo, plano e acesso.')
      setShowCreateForm(false)
      await loadData({ selectedClientId: company.id })
      setDetailInitialTab('overview')
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel criar o cliente')
    } finally {
      setSavingKey('')
    }
  }

  async function handleSaveOverview(client, overviewForm) {
    setSavingKey('overview')
    setError('')
    setSuccess('')

    try {
      await api.put(`/master/companies/${client.id}`, {
        name: overviewForm.company_name.trim(),
        document: normalizeDigits(overviewForm.document),
        email: overviewForm.email.trim(),
        phone: normalizeDigits(overviewForm.phone),
        niche: overviewForm.niche,
        status: mapCommercialStatusToBackend(overviewForm.company_status)
      })

      saveCompanyMeta(client.id, buildClientMeta(getStoredCompaniesMeta()[client.id] || {}, overviewForm))
      setSuccess('Dados do cliente atualizados com sucesso')
      await loadData({ selectedClientId: client.id, clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel salvar os dados do cliente')
    } finally {
      setSavingKey('')
    }
  }

  async function handleToggleStatus(client) {
    const nextCommercialStatus = client.company_status === 'ativo' ? 'cancelado' : 'ativo'

    setStatusBusyId(client.id)
    setError('')
    setSuccess('')

    try {
      await api.patch(`/master/companies/${client.id}/status`, {
        status: mapCommercialStatusToBackend(nextCommercialStatus)
      })

      setSuccess(nextCommercialStatus === 'ativo' ? 'Cliente ativado com sucesso' : 'Cliente inativado com sucesso')
      await loadData({ selectedClientId: selectedClientId || client.id, clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel alterar o status do cliente')
    } finally {
      setStatusBusyId('')
    }
  }

  async function handleToggleModule(client, module, isActive) {
    setSavingKey(`module:${module.id}`)
    setError('')
    setSuccess('')

    try {
      if (isActive) {
        await api.post('/master/company-modules/deactivate', {
          company_id: client.id,
          module_id: module.id
        })
      } else {
        await api.post('/master/company-modules/activate', {
          company_id: client.id,
          module_id: module.id
        })
      }

      setSuccess(isActive ? 'Modulo inativado para o cliente' : 'Modulo ativado para o cliente')
      await loadData({ selectedClientId: client.id, clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel alterar o modulo do cliente')
    } finally {
      setSavingKey('')
    }
  }

  async function handleSavePlan(client, planForm) {
    const selectedPlanType = normalizePlanType(planForm.plan_type)

    if (!client.primary_module_slug && !['trial', 'free'].includes(selectedPlanType)) {
      setError('Ative um modulo para este cliente antes de salvar o plano.')
      return
    }

    setSavingKey('plan')
    setError('')
    setSuccess('')

    try {
      await api.post(`/master/clients/${client.id}/plan`, {
        plan_type: planForm.plan_type,
        source: planForm.source,
        duration_days: Number(planForm.duration_mode === 'custom' ? planForm.duration_days : planForm.duration_mode),
        current_period_start: planForm.current_period_start || null,
        next_due_date: planForm.next_due_date || null
      })

      setSuccess('Plano do cliente atualizado com sucesso.')
      await loadData({ selectedClientId: client.id, clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel salvar o plano do cliente')
    } finally {
      setSavingKey('')
    }
  }

  async function handleCreateManualAccess(client, accessForm) {
    setSavingKey('manual-access')
    setError('')
    setSuccess('')

    try {
      await api.post(`/master/clients/${client.id}/access/manual`, {
        email: accessForm.email.trim(),
        password: accessForm.password,
        confirmPassword: accessForm.confirmPassword
      })

      setSuccess('Acesso manual criado com sucesso. O cliente ja pode entrar com email e senha.')
      await loadData({ selectedClientId: client.id, clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel criar o acesso manual')
    } finally {
      setSavingKey('')
    }
  }

  async function handleSendFirstAccess(client) {
    if (!client.email) {
      setError('Defina o email da empresa antes de enviar o primeiro acesso')
      return
    }

    const moduleSlug = client.primary_module_slug || client.active_modules[0]?.module_slug
    if (!moduleSlug) {
      setError('Ative um modulo para este cliente antes de enviar o primeiro acesso')
      return
    }

    setSavingKey('send-access')
    setAccessBusyId(client.id)
    setManualActivationLink('')
    setError('')
    setSuccess('')

    try {
      await api.post('/master/first-access/generate', {
        companyId: client.id,
        name: client.name,
        email: client.email,
        role: 'owner'
      })

      setSuccess('Link de primeiro acesso enviado com sucesso')
      await loadData({ selectedClientId: client.id, clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel enviar o primeiro acesso')
    } finally {
      setSavingKey('')
      setAccessBusyId('')
    }
  }

  async function handleResendFirstAccess(client) {
    if (!client.pending_activation?.id) {
      setError('Nao existe ativacao pendente para reenviar')
      return
    }

    setSavingKey('resend-access')
    setAccessBusyId(client.id)
    setManualActivationLink('')
    setError('')
    setSuccess('')

    try {
      await api.patch(`/master/activations/${client.pending_activation.id}/resend`)
      setSuccess('Acesso reenviado com sucesso')
      await loadData({ selectedClientId: client.id, clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel reenviar o acesso')
    } finally {
      setSavingKey('')
      setAccessBusyId('')
    }
  }

  async function handleCopyFirstAccessLink(client) {
    if (!client.pending_activation?.id) {
      setError('Nao existe ativacao pendente para este cliente.')
      return
    }

    setSavingKey('copy-access')
    setAccessBusyId(client.id)
    setManualActivationLink('')
    setError('')
    setSuccess('')

    try {
      const response = await api.get(`/master/activations/${client.pending_activation.id}/link`)
      const link = response.data?.data?.activation_url

      if (!link) {
        throw new Error('LINK_NOT_FOUND')
      }

      try {
        await navigator.clipboard.writeText(link)
        setSuccess('Link de acesso copiado com sucesso.')
      } catch {
        setManualActivationLink(link)
        setSuccess('Nao foi possivel copiar automaticamente. Copie o link abaixo manualmente.')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel copiar o link de acesso.')
    } finally {
      setSavingKey('')
      setAccessBusyId('')
    }
  }

  function handleAccessAction(client) {
    if (client.pending_activation) {
      handleResendFirstAccess(client)
      return
    }

    openManage(client, 'access')
  }

  return (
    <MasterLayout title="Clientes">
      <PageHeader
        title="Clientes"
        description="Gerencie empresas, modulos, planos, acesso e status comercial."
        actions={<button type="button" onClick={openCreate}>Novo cliente</button>}
      />

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <section className="master-client-stats">
        <StatCard label="Total de clientes" value={summary.total} detail="Empresas cadastradas no painel master" />
        <StatCard label="Clientes ativos" value={summary.active} detail="Com disponibilidade comercial liberada" />
        <StatCard label="Clientes em trial" value={summary.trial} detail="Acompanhamento de onboarding e conversao" />
        <StatCard label="Atrasados / cancelados" value={summary.lateOrCanceled} detail="Clientes que exigem acao comercial" />
      </section>

      {showCreateForm && (
        <ClientCreateForm
          form={createForm}
          formErrors={createErrors}
          nicheOptions={nicheOptions}
          sourceOptions={sourceOptions}
          companyStatusOptions={companyStatusOptions}
          saving={savingKey === 'create'}
          onChange={handleCreateChange}
          onSelectChange={handleCreateSelectChange}
          onAddNiche={addNewNiche}
          onSubmit={handleCreateSubmit}
          onCancel={closeCreate}
        />
      )}

      <SectionCard className="master-client-filter-card">
        <form className="master-filter-row master-client-filter-row" onSubmit={(event) => event.preventDefault()}>
          <input
            name="q"
            placeholder="Buscar por empresa, nicho, modulo, plano ou origem"
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
          />
          <div className="master-client-filter-select">
            <PremiumSelect
              value={filters.company_status}
              onChange={(value) => setFilters((current) => ({ ...current, company_status: value }))}
              options={[{ value: '', label: 'Todos os status' }, ...companyStatusOptions]}
              placeholder="Todos os status"
            />
          </div>
        </form>
      </SectionCard>

      <ClientCatalogList
        loading={loading}
        clients={filteredCompanies}
        onManage={openManage}
        onToggleStatus={handleToggleStatus}
        onAccessAction={handleAccessAction}
        statusBusyId={statusBusyId}
        accessBusyId={accessBusyId}
      />

      {selectedClient && (
        <ClientDetailPanel
          client={selectedClient}
          initialTab={detailInitialTab}
          nicheOptions={nicheOptions}
          sourceOptions={sourceOptions}
          companyStatusOptions={companyStatusOptions}
          planOptions={planOptions}
          savingKey={savingKey}
          onClose={closeManage}
          onSaveOverview={handleSaveOverview}
          onToggleModule={handleToggleModule}
          onSavePlan={handleSavePlan}
          onCreateManualAccess={handleCreateManualAccess}
          onSendFirstAccess={handleSendFirstAccess}
          onResendFirstAccess={handleResendFirstAccess}
          onCopyFirstAccessLink={handleCopyFirstAccessLink}
          manualActivationLink={manualActivationLink}
        />
      )}
    </MasterLayout>
  )
}

export default Clients
