import { useEffect, useState } from 'react'
import MasterLayout from '../components/master/MasterLayout'
import PageHeader from '../components/master/PageHeader'
import StatCard from '../components/master/StatCard'
import ModuleForm from '../components/master/modules/ModuleForm'
import ModuleList from '../components/master/modules/ModuleList'
import api from '../services/api'

const MODULE_META_STORAGE_KEY = 'master-admin-module-meta'
const CLIENT_OWNER_ROLE = 'admin_cliente'
const CLIENT_OWNER_ROLES = [CLIENT_OWNER_ROLE]
const MODULE_PLAN_OPTIONS = ['free', 'pro', 'plus']
const SYSTEM_MODULE_CATALOG = [
  {
    slug: 'barber',
    name: 'BarberGestor',
    version: 'v1',
    description: 'Modulo operacional para barbearias, com agenda, vendas, caixa, servicos, produtos e equipe.',
    base_path: '/barber',
    route_prefix: '/api/barber',
    requires_auth: true,
    multi_tenant_enabled: true,
    operational_profile_label: 'Admin Cliente / Dono da empresa'
  },
  {
    slug: 'clima',
    name: 'ClimaGestor',
    version: 'v1',
    description: 'Modulo para operacao de climatizacao, preparado para evolucao comercial e atendimento especializado.',
    base_path: '/clima',
    route_prefix: '/api/clima',
    requires_auth: true,
    multi_tenant_enabled: true,
    operational_profile_label: 'Admin Cliente / Dono da empresa'
  },
]

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  version: 'v1',
  status: false,
  base_path: '',
  route_prefix: '',
  requires_auth: true,
  allowed_roles: CLIENT_OWNER_ROLES,
  multi_tenant_enabled: true,
  module_plans: MODULE_PLAN_OPTIONS,
  default_plan: 'pro'
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
    module_plans: Array.isArray(form.module_plans) && form.module_plans.length > 0
      ? form.module_plans
      : ['free'],
    default_plan: form.default_plan || 'free'
  }
}

function mergeModulesWithMeta(modules) {
  const metaStore = readStoredModuleMeta()
  const modulesBySlug = new Map(modules.map((module) => [module.slug, module]))

  return SYSTEM_MODULE_CATALOG.map((catalogModule) => {
    const persistedModule = modulesBySlug.get(catalogModule.slug)
    const meta = persistedModule
      ? (metaStore[persistedModule.id] || metaStore[persistedModule.slug] || {})
      : (metaStore[catalogModule.slug] || {})
    const modulePlans = Array.isArray(meta.module_plans) && meta.module_plans.length > 0
      ? meta.module_plans.filter((plan) => MODULE_PLAN_OPTIONS.includes(plan))
      : MODULE_PLAN_OPTIONS

    return {
      id: persistedModule?.id || catalogModule.slug,
      name: persistedModule?.name || catalogModule.name,
      slug: catalogModule.slug,
      description: persistedModule?.description || catalogModule.description,
      version: catalogModule.version,
      is_active: persistedModule?.is_active ?? false,
      created_at: persistedModule?.created_at || null,
      updated_at: persistedModule?.updated_at || null,
      base_path: catalogModule.base_path,
      route_prefix: catalogModule.route_prefix,
      requires_auth: catalogModule.requires_auth,
      allowed_roles: CLIENT_OWNER_ROLES,
      multi_tenant_enabled: catalogModule.multi_tenant_enabled,
      operational_profile_label: catalogModule.operational_profile_label,
      module_plans: modulePlans,
      default_plan: modulePlans.includes(meta.default_plan) ? meta.default_plan : modulePlans[0],
      planSummary: modulePlans.map((plan) => plan.toUpperCase()).join(' / '),
      catalog_source: 'system'
    }
  })
}

function toFormState(module) {
  return {
    name: module.name || '',
    slug: module.slug || '',
    description: module.description || '',
    version: module.version || 'v1',
    status: module.is_active ?? false,
    base_path: module.base_path || '',
    route_prefix: module.route_prefix || '',
    requires_auth: module.requires_auth ?? true,
    allowed_roles: CLIENT_OWNER_ROLES,
    multi_tenant_enabled: module.multi_tenant_enabled ?? true,
    module_plans: Array.isArray(module.module_plans) && module.module_plans.length > 0 ? module.module_plans : MODULE_PLAN_OPTIONS,
    default_plan: module.default_plan || 'free'
  }
}

function Modules() {
  const [modules, setModules] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [selectedModule, setSelectedModule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadData(options = {}) {
    if (options.clearMessage !== false) {
      setError('')
    }

    try {
      const response = await api.get('/master/modules')
      const nextModules = Array.isArray(response.data.data) ? response.data.data : []
      const mergedModules = mergeModulesWithMeta(nextModules)

      setModules(mergedModules)
      setSelectedModule((current) => {
        if (current) {
          return mergedModules.find((module) => String(module.slug) === String(current.slug)) || null
        }

        return null
      })
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

  useEffect(() => {
    if (selectedModule) {
      setForm(toFormState(selectedModule))
    }
  }, [selectedModule])

  function handlePlanToggle(plan) {
    setForm((current) => {
      const currentPlans = Array.isArray(current.module_plans) ? current.module_plans : []
      const nextPlans = currentPlans.includes(plan)
        ? currentPlans.filter((item) => item !== plan)
        : [...currentPlans, plan]

      return {
        ...current,
        module_plans: nextPlans,
        default_plan: nextPlans.includes(current.default_plan) ? current.default_plan : (nextPlans[0] || '')
      }
    })
  }

  function handleDefaultPlanChange(plan) {
    setForm((current) => ({
      ...current,
      default_plan: plan
    }))
  }

  function viewModule(module) {
    setSelectedModule(module)
    setSuccess('')
    setError('')
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

  async function saveModulePlans() {
    if (!selectedModule) {
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await persistFrontendMeta(selectedModule, form)
      setSuccess('Planos do modulo salvos com sucesso')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel salvar os planos do modulo')
    } finally {
      setSaving(false)
    }
  }

  async function toggleModule(module) {
    if (!module.id || !String(module.id).includes('-')) {
      setError('Este modulo ainda nao possui registro persistido para ativacao pelo painel.')
      return
    }

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
        title="Catalogo de Modulos"
        description="Gerencie modulos disponiveis, status comercial e planos associados."
      />

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <section className="master-module-stats">
        <StatCard
          label="Total de modulos"
          value={modules.length}
          detail="Catalogo tecnico controlado pelo sistema"
        />
        <StatCard
          label="Modulos ativos"
          value={modules.filter((module) => module.is_active).length}
          detail="Disponiveis comercialmente no painel master"
        />
        <StatCard
          label="Planos disponiveis"
          value={MODULE_PLAN_OPTIONS.length}
          detail="Free, Pro e Plus preparados por modulo"
        />
      </section>

      <ModuleList
        loading={loading}
        modules={modules.map((module) => ({
          ...module,
          activeCompaniesLabel: module.base_path || 'Catalogado no sistema'
        }))}
        onEdit={viewModule}
        onToggle={toggleModule}
        togglingId={togglingId}
      />

      <ModuleForm
        moduleRecord={selectedModule}
        form={form}
        onPlanToggle={handlePlanToggle}
        onDefaultPlanChange={handleDefaultPlanChange}
        onSavePlans={saveModulePlans}
        onToggleModule={toggleModule}
        saving={saving}
        toggling={selectedModule ? String(selectedModule.id) === String(togglingId) : false}
      />
    </MasterLayout>
  )
}

export default Modules
