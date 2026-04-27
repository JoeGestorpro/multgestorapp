import { useEffect, useMemo, useState } from 'react'
import MasterLayout from '../components/master/MasterLayout'
import PageHeader from '../components/master/PageHeader'
import SectionCard from '../components/master/SectionCard'
import ModuleForm from '../components/master/modules/ModuleForm'
import ModuleList from '../components/master/modules/ModuleList'
import api from '../services/api'

const MODULE_META_STORAGE_KEY = 'master-admin-module-meta'

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  version: 'v1',
  status: true,
  base_path: '',
  route_prefix: '',
  requires_auth: true,
  allowed_roles: ['master_admin'],
  multi_tenant_enabled: true,
  requires_subscription: false,
  requires_onboarding: false,
  trial_enabled: false,
  trial_days: '0',
  auto_activate_on_payment: false,
  allow_manual_activation: true,
  payment_gateway: 'manual',
  webhook_enabled: false,
  webhook_url: '',
  external_api_base_url: '',
  integration_key: '',
  feature_flags: '{\n  \n}',
  rate_limit: '120',
  logging_enabled: true,
  environment: 'prod',
  db_schema_name: ''
}

const scaleReadiness = [
  'Roteamento desacoplado',
  'Autorizacao por perfil',
  'Integracoes por gateway',
  'Escala multi-tenant'
]

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeBasePath(value) {
  const sanitized = String(value || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/\/+/g, '/')

  if (!sanitized) {
    return ''
  }

  return sanitized.startsWith('/') ? sanitized : `/${sanitized}`
}

function normalizeRoutePath(value) {
  return normalizeBasePath(value)
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value))
}

function readStoredModuleMeta() {
  try {
    const raw = window.localStorage.getItem(MODULE_META_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStoredModuleMeta(value) {
  window.localStorage.setItem(MODULE_META_STORAGE_KEY, JSON.stringify(value))
}

function buildModuleMeta(form) {
  return {
    version: form.version,
    base_path: form.base_path,
    route_prefix: form.route_prefix,
    requires_auth: form.requires_auth,
    allowed_roles: form.allowed_roles,
    multi_tenant_enabled: form.multi_tenant_enabled,
    requires_subscription: form.requires_subscription,
    requires_onboarding: form.requires_onboarding,
    trial_enabled: form.trial_enabled,
    trial_days: form.trial_days,
    auto_activate_on_payment: form.auto_activate_on_payment,
    allow_manual_activation: form.allow_manual_activation,
    payment_gateway: form.payment_gateway,
    webhook_enabled: form.webhook_enabled,
    webhook_url: form.webhook_url,
    external_api_base_url: form.external_api_base_url,
    integration_key: form.integration_key,
    feature_flags: form.feature_flags,
    rate_limit: form.rate_limit,
    logging_enabled: form.logging_enabled,
    environment: form.environment,
    db_schema_name: form.db_schema_name
  }
}

function mergeModulesWithMeta(modules) {
  const metaStore = readStoredModuleMeta()

  return modules.map((module) => {
    const meta = metaStore[module.id] || metaStore[module.slug] || {}

    return {
      ...module,
      version: meta.version || 'v1',
      base_path: meta.base_path || '',
      route_prefix: meta.route_prefix || '',
      requires_auth: meta.requires_auth ?? true,
      allowed_roles: Array.isArray(meta.allowed_roles) && meta.allowed_roles.length > 0 ? meta.allowed_roles : ['master_admin'],
      multi_tenant_enabled: meta.multi_tenant_enabled ?? true,
      requires_subscription: Boolean(meta.requires_subscription),
      requires_onboarding: Boolean(meta.requires_onboarding),
      trial_enabled: Boolean(meta.trial_enabled),
      trial_days: String(meta.trial_days ?? '0'),
      auto_activate_on_payment: Boolean(meta.auto_activate_on_payment),
      allow_manual_activation: meta.allow_manual_activation ?? true,
      payment_gateway: meta.payment_gateway || 'manual',
      webhook_enabled: Boolean(meta.webhook_enabled),
      webhook_url: meta.webhook_url || '',
      external_api_base_url: meta.external_api_base_url || '',
      integration_key: meta.integration_key || '',
      feature_flags: meta.feature_flags || '{\n  \n}',
      rate_limit: String(meta.rate_limit ?? '120'),
      logging_enabled: meta.logging_enabled ?? true,
      environment: meta.environment || 'prod',
      db_schema_name: meta.db_schema_name || ''
    }
  })
}

function toFormState(module) {
  return {
    name: module.name || '',
    slug: module.slug || '',
    description: module.description || '',
    version: module.version || 'v1',
    status: module.is_active ?? true,
    base_path: module.base_path || '',
    route_prefix: module.route_prefix || '',
    requires_auth: module.requires_auth ?? true,
    allowed_roles: Array.isArray(module.allowed_roles) && module.allowed_roles.length > 0 ? module.allowed_roles : ['master_admin'],
    multi_tenant_enabled: module.multi_tenant_enabled ?? true,
    requires_subscription: Boolean(module.requires_subscription),
    requires_onboarding: Boolean(module.requires_onboarding),
    trial_enabled: Boolean(module.trial_enabled),
    trial_days: String(module.trial_days ?? '0'),
    auto_activate_on_payment: Boolean(module.auto_activate_on_payment),
    allow_manual_activation: module.allow_manual_activation ?? true,
    payment_gateway: module.payment_gateway || 'manual',
    webhook_enabled: Boolean(module.webhook_enabled),
    webhook_url: module.webhook_url || '',
    external_api_base_url: module.external_api_base_url || '',
    integration_key: module.integration_key || '',
    feature_flags: module.feature_flags || '{\n  \n}',
    rate_limit: String(module.rate_limit ?? '120'),
    logging_enabled: module.logging_enabled ?? true,
    environment: module.environment || 'prod',
    db_schema_name: module.db_schema_name || ''
  }
}

function Modules() {
  const [modules, setModules] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingModule, setEditingModule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [slugTouched, setSlugTouched] = useState(false)

  async function loadData(options = {}) {
    if (options.clearMessage !== false) {
      setError('')
    }

    try {
      const response = await api.get('/master/modules')
      const nextModules = Array.isArray(response.data.data) ? response.data.data : []
      setModules(mergeModulesWithMeta(nextModules))
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar os modulos')
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

  const slugConflict = useMemo(() => {
    const normalizedSlug = normalizeSlug(form.slug)

    if (!normalizedSlug) {
      return false
    }

    return modules.some((module) => {
      if (editingModule && String(module.id) === String(editingModule.id)) {
        return false
      }

      return module.slug === normalizedSlug
    })
  }, [editingModule, form.slug, modules])

  const basePathConflict = useMemo(() => {
    const normalizedBasePath = normalizeBasePath(form.base_path)

    if (!normalizedBasePath) {
      return false
    }

    return modules.some((module) => {
      if (editingModule && String(module.id) === String(editingModule.id)) {
        return false
      }

      return normalizeBasePath(module.base_path) === normalizedBasePath
    })
  }, [editingModule, form.base_path, modules])

  function handleFieldChange(event) {
    const { name, type, checked, value } = event.target

    setFormErrors((current) => ({
      ...current,
      [name]: ''
    }))

    if (name === 'name') {
      setForm((current) => ({
        ...current,
        name: value,
        slug: slugTouched ? current.slug : normalizeSlug(value)
      }))
      return
    }

    if (name === 'slug') {
      setSlugTouched(true)
      setForm((current) => ({
        ...current,
        slug: normalizeSlug(value)
      }))
      return
    }

    if (name === 'base_path') {
      setForm((current) => ({
        ...current,
        base_path: normalizeBasePath(value)
      }))
      return
    }

    if (name === 'route_prefix') {
      setForm((current) => ({
        ...current,
        route_prefix: normalizeRoutePath(value)
      }))
      return
    }

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  function handleJsonChange(event) {
    const { name, value } = event.target

    setFormErrors((current) => ({
      ...current,
      [name]: ''
    }))

    setForm((current) => ({
      ...current,
      [name]: value
    }))
  }

  function handleMultiSelectChange(name, selectedValue) {
    setForm((current) => {
      const currentValues = Array.isArray(current[name]) ? current[name] : []
      const nextValues = currentValues.includes(selectedValue)
        ? currentValues.filter((item) => item !== selectedValue)
        : [...currentValues, selectedValue]

      return {
        ...current,
        [name]: nextValues
      }
    })
  }

  function resetForm() {
    setEditingModule(null)
    setForm(emptyForm)
    setFormErrors({})
    setSlugTouched(false)
  }

  function startEdit(module) {
    setEditingModule(module)
    setForm(toFormState(module))
    setFormErrors({})
    setSlugTouched(false)
    setSuccess('')
    setError('')
  }

  function validateForm() {
    const nextErrors = {}

    if (!String(form.name || '').trim()) {
      nextErrors.name = 'Nome obrigatorio'
    }

    if (!String(form.slug || '').trim()) {
      nextErrors.slug = 'Slug obrigatorio'
    } else if (slugConflict) {
      nextErrors.slug = 'Este slug ja esta em uso'
    }

    if (!String(form.base_path || '').trim()) {
      nextErrors.base_path = 'Base path obrigatorio'
    } else if (basePathConflict) {
      nextErrors.base_path = 'Este base path ja esta em uso'
    }

    if (form.requires_auth && !String(form.route_prefix || '').trim()) {
      nextErrors.route_prefix = 'Prefixo de rota obrigatorio quando o modulo exige autenticacao'
    }

    if (!form.multi_tenant_enabled) {
      nextErrors.multi_tenant_enabled = 'Multi-tenant habilitado deve permanecer verdadeiro'
    }

    if (form.webhook_enabled && !String(form.webhook_url || '').trim()) {
      nextErrors.webhook_url = 'URL do webhook obrigatoria quando o webhook estiver habilitado'
    }

    if (form.trial_enabled && Number(form.trial_days || 0) <= 0) {
      nextErrors.trial_days = 'Informe uma quantidade valida de dias para trial'
    }

    if (String(form.feature_flags || '').trim()) {
      try {
        JSON.parse(form.feature_flags)
      } catch {
        nextErrors.feature_flags = 'Feature flags precisa ser um JSON valido'
      }
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function persistFrontendMeta(moduleRecord, sourceForm) {
    const metaStore = readStoredModuleMeta()
    const meta = buildModuleMeta(sourceForm)
    const nextStore = {
      ...metaStore,
      [moduleRecord.id]: meta,
      [moduleRecord.slug]: meta
    }

    writeStoredModuleMeta(nextStore)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      name: form.name.trim(),
      slug: normalizeSlug(form.slug),
      description: form.description.trim(),
      is_active: Boolean(form.status)
    }

    try {
      const response = editingModule
        ? await api.patch(`/master/modules/${editingModule.id}`, payload)
        : await api.post('/master/modules', payload)

      const moduleRecord = response.data.data
      await persistFrontendMeta(moduleRecord, form)

      setSuccess(editingModule ? 'Modulo atualizado com sucesso' : 'Modulo criado com sucesso')
      resetForm()
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel salvar o modulo')
    } finally {
      setSaving(false)
    }
  }

  async function toggleModule(module) {
    setError('')
    setSuccess('')
    setTogglingId(String(module.id))

    try {
      await api.patch(`/master/modules/${module.id}`, {
        is_active: !module.is_active
      })

      setSuccess(module.is_active ? 'Modulo inativado' : 'Modulo ativado')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel alterar o modulo')
    } finally {
      setTogglingId('')
    }
  }

  return (
    <MasterLayout title="Modulos">
      <PageHeader
        title="Gestao de Modulos"
        description="Configure cada modulo como uma entidade tecnica de sistema com roteamento, acesso, regras operacionais e integracoes."
      />

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <section className="master-module-grid">
        <ModuleForm
          editingModule={editingModule}
          form={form}
          formErrors={formErrors}
          onCancel={resetForm}
          onChange={handleFieldChange}
          onJsonChange={handleJsonChange}
          onMultiSelectChange={handleMultiSelectChange}
          onSubmit={handleSubmit}
          saving={saving}
          slugConflict={slugConflict}
          basePathConflict={basePathConflict}
        />

        <SectionCard className="master-module-aside">
          <div className="master-module-aside-copy">
            <span className="master-module-kicker">Painel de configuracao tecnica</span>
            <h2>Modulo tratado como nucleo configuravel de produto SaaS.</h2>
            <p>
              Os metadados avancados ficam preservados no frontend para preparar o backend escalavel sem alterar o contrato
              atual de cadastro de modulos.
            </p>
          </div>

          <div className="master-module-roadmap">
            {scaleReadiness.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>

          <div className="master-module-summary">
            <div>
              <strong>{modules.length}</strong>
              <span>modulos configurados</span>
            </div>
            <div>
              <strong>{modules.filter((module) => module.is_active).length}</strong>
              <span>ativos em producao</span>
            </div>
          </div>
        </SectionCard>
      </section>

      <ModuleList
        loading={loading}
        modules={modules.map((module) => ({
          ...module,
          createdLabel: formatDate(module.created_at),
          activeCompaniesLabel: module.base_path || 'Em breve'
        }))}
        onEdit={startEdit}
        onToggle={toggleModule}
        togglingId={togglingId}
      />
    </MasterLayout>
  )
}

export default Modules
