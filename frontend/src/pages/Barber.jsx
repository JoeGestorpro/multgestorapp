import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLocation, useNavigate } from 'react-router-dom'
import BarberLayout from '../components/barber/BarberLayout'
import CollaboratorAvatar from '../components/barber/CollaboratorAvatar'
import CollaboratorMobileDashboard from '../components/barber/CollaboratorMobileDashboard'
import ServiceIcon from '../components/barber/ServiceIcon'
import { normalizeServiceIcon } from '../components/barber/ServiceIcon.utils'
import {
  BarberBadge,
  BarberButton,
  BarberCard,
  BarberEmptyState,
  BarberIcon,
  BarberModal,
  BarberTable
} from '../components/barber/BarberUI'
import { useAuth } from '../contexts/useAuth'
import ClientesBarber from './barber/Clientes'
import Servicos from './barber/Servicos'
import Produtos from './barber/Produtos'
import api from '../services/api'
import './Barber.css'

const emptyService = {
  name: '',
  description: '',
  price: '',
  icon: 'scissors',
  serviceType: 'service',
  commissionType: 'percentage',
  commissionValue: '',
  estimatedTimeMinutes: '',
  isActive: true
}

const emptyCollaborator = {
  name: '',
  email: '',
  password: '',
  phone: '',
  avatarUrl: '',
  avatarDataUrl: '',
  avatarChanged: false,
  commissionType: 'percentage',
  commissionRate: '',
  isActive: true,
  canLaunchSales: false,
  availableForBooking: false,
  canViewOwnDashboard: true,
  canViewOwnReports: true,
  avatarFile: null
}

const emptyProduct = {
  supplierId: '',
  name: '',
  description: '',
  category: '',
  brand: '',
  internalCode: '',
  costPrice: '',
  salePrice: '',
  stockCurrent: '',
  stockMinimum: '',
  unit: '',
  commissionType: 'fixed',
  commissionValue: '',
  isActive: true
}

const emptySale = {
  catalogType: 'service',
  collaboratorId: '',
  serviceId: '',
  productId: '',
  clientName: '',
  quantity: 1,
  paymentMethod: 'pix',
  amountReceived: '',
  changeAmount: '',
  notes: '',
  items: []
}

const emptyAdvance = {
  collaboratorId: '',
  amount: '',
  reason: ''
}

const emptyDashboard = {
  totalDaySales: 0,
  totalPix: 0,
  totalCash: 0,
  totalCredit: 0,
  totalDebit: 0,
  totalPermuta: 0,
  totalCommissions: 0,
  recentSales: [],
  collaboratorSummary: [],
  viewMode: 'admin'
}

const emptyAppointmentsOverview = {
  company_name: '',
  public_booking_slug: '',
  public_booking_path: '',
  summary: {
    appointments_today: 0,
    upcoming_slots: 0,
    canceled_appointments: 0,
    available_collaborators: 0,
    bookable_services: 0
  },
  appointments: []
}

const emptyPersonalReport = {
  collaborator: null,
  period: null,
  totals: {
    totalSales: 0,
    totalCommission: 0,
    totalAdvances: 0,
    netCommission: 0,
    attendances: 0
  },
  sales: []
}

const defaultServiceFilters = {
  search: '',
  status: 'all'
}

const defaultProductFilters = {
  search: '',
  status: 'all',
  category: ''
}

const defaultCollaboratorFinancialFilters = {
  period: 'month',
  startDate: '',
  endDate: ''
}

const viewMeta = {
  dashboard: {
    label: 'Dashboard',
    title: 'Visao executiva da operacao',
    description: 'KPIs, ranking, faturamento recente e as ultimas movimentacoes da barbearia.'
  },
  appointments: {
    label: 'Agendamentos',
    title: 'Horarios, reservas e atendimento online',
    description: 'Gerencie horarios, profissionais disponiveis e reservas dos seus clientes.'
  },
  customers: {
    label: 'Clientes',
    title: 'Clientes do agendamento online',
    description: 'Cadastros vinculados ao link publico, com status, origem e ultimo acesso.'
  },
  services: {
    label: 'Servicos',
    title: 'Catalogo premium da barbearia',
    description: 'Cadastre, filtre, ative e organize os servicos que abastecem o lancamento de vendas.'
  },
  products: {
    label: 'Produtos',
    title: 'Catalogo de produtos da barbearia',
    description: 'Organize estoque, categorias, fornecedor opcional e precificacao no mesmo padrao premium.'
  },
  sales: {
    label: 'Vendas',
    title: 'Operacao comercial',
    description: 'Registre atendimentos com clareza, acompanhe pagamentos e trate exclusoes com aprovacao.'
  },
  cashier: {
    label: 'Caixa',
    title: 'Fluxo financeiro do dia',
    description: 'Resumo por forma de pagamento, vales, aprovacoes e fechamento individual de colaboradores.'
  },
  team: {
    label: 'Colaboradores',
    title: 'Desempenho e equipe',
    description: 'Gerencie sua equipe, comissoes e desempenho individual.'
  },
  reports: {
    label: 'Relatorios',
    title: 'Historico e fechamento',
    description: 'Acompanhe fechamentos anteriores e a saude operacional da unidade.'
  }
}

function money(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0))
}

function formatServiceName(name) {
  const value = String(name || '').trim()

  const fixes = {
    Degrad: 'Degradê',
    Pigmentacao: 'Pigmentação',
    Hidratacao: 'Hidratação',
    Finalizacao: 'Finalização',
    Quimica: 'Química'
  }

  return fixes[value] || value
}

function shortDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  }).format(new Date(value))
}

function fullDate(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function sameDay(dateA, dateB) {
  const first = new Date(dateA)
  const second = new Date(dateB)

  return (
    first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate()
  )
}

function buildSalesChartData(sales) {
  const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
  const today = new Date()

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))

    const total = sales.reduce((sum, sale) => {
      return sameDay(date, sale.created_at) ? sum + Number(sale.total_amount || 0) : sum
    }, 0)

    return {
      label: formatter.format(date).replace('.', ''),
      total,
      fullDate: shortDate(date)
    }
  })
}

function paymentTone(method) {
  if (method === 'pix') {
    return 'pix'
  }

  if (method === 'permuta' || method === 'trade') {
    return 'permuta'
  }

  if (method === 'credito' || method === 'credit') {
    return 'admin'
  }

  if (method === 'debito' || method === 'debit') {
    return 'success'
  }

  return 'cash'
}

function paymentLabel(method) {
  return {
    dinheiro: 'Dinheiro',
    cash: 'Dinheiro',
    pix: 'Pix',
    credito: 'Credito',
    credit: 'Credito',
    debito: 'Debito',
    debit: 'Debito',
    permuta: 'Permuta'
  }[method] || method || 'Nao informado'
}

function buildCollaboratorFinancialParams(filters) {
  const params = {
    period: filters.period || 'month'
  }

  if (params.period === 'custom' && filters.startDate && filters.endDate) {
    params.startDate = filters.startDate
    params.endDate = filters.endDate
  }

  return params
}

function advanceTone(status) {
  return {
    approved: 'approved',
    pending: 'pending',
    rejected: 'rejected',
    liquidated: 'liquidated'
  }[status] || 'neutral'
}

function advanceLabel(status) {
  return {
    approved: 'Aprovado',
    pending: 'Pendente',
    rejected: 'Rejeitado',
    liquidated: 'Liquidado'
  }[status] || status || 'Nao informado'
}

function appointmentTone(status) {
  return {
    scheduled: 'pending',
    confirmed: 'approved',
    completed: 'cash',
    canceled: 'danger',
    no_show: 'admin'
  }[status] || 'neutral'
}

function appointmentLabel(status) {
  return {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    completed: 'Concluido',
    canceled: 'Cancelado',
    no_show: 'Nao compareceu'
  }[status] || status || 'Nao informado'
}

function formatAppointmentSlot(appointment) {
  if (!appointment?.appointment_date) {
    return '-'
  }

  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(`${appointment.appointment_date}T00:00:00`))

  const time = String(appointment.appointment_time || '').slice(0, 5)
  return time ? `${date} às ${time}` : date
}

function collaboratorDisplayName(collaborator) {
  return collaborator?.name || collaborator?.collaborator_name || collaborator?.nickname || 'Colaborador'
}

function normalizeAvatarFile(file) {
  if (!file) {
    return { error: 'Selecione uma imagem para continuar.' }
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { error: 'Envie uma imagem JPG, PNG ou WEBP de ate 2MB.' }
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: 'A foto do colaborador deve ter no maximo 2MB.' }
  }

  return { error: '' }
}

function getInitialBarberView(pathname) {
  const normalized = String(pathname || '').trim()

  if (normalized.startsWith('/barber/agenda') || normalized.startsWith('/barber/agendamentos')) {
    return 'appointments'
  }

  if (normalized.startsWith('/barber/servicos')) {
    return 'services'
  }

  if (normalized.startsWith('/barber/clientes')) {
    return 'customers'
  }

  if (normalized.startsWith('/barber/produtos')) {
    return 'products'
  }

  if (normalized.startsWith('/barber/vendas')) {
    return 'sales'
  }

  if (normalized.startsWith('/barber/caixa')) {
    return 'cashier'
  }

  if (normalized.startsWith('/barber/colaboradores')) {
    return 'team'
  }

  if (normalized.startsWith('/barber/relatorios')) {
    return 'reports'
  }

  return 'dashboard'
}

function getBarberViewPath(view) {
  return {
    dashboard: '/barber/dashboard',
    appointments: '/barber/agenda',
    customers: '/barber/clientes',
    services: '/barber/servicos',
    products: '/barber/produtos',
    sales: '/barber/vendas',
    cashier: '/barber/caixa',
    team: '/barber/colaboradores',
    reports: '/barber/relatorios'
  }[view] || '/barber/dashboard'
}

function normalizeServiceForm(service) {
  return {
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price || '',
    icon: normalizeServiceIcon(service?.icon, service?.name),
    serviceType: service?.service_type || 'service',
    commissionType: service?.commission_type || 'percentage',
    commissionValue: service?.commission_value || '',
    estimatedTimeMinutes: service?.estimated_time_minutes || '',
    isActive: service?.is_active ?? true
  }
}

function normalizeProductForm(product) {
  return {
    supplierId: product?.supplier_id || '',
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    brand: product?.brand || '',
    internalCode: product?.internal_code || '',
    costPrice: product?.cost_price || '',
    salePrice: product?.sale_price || '',
    stockCurrent: product?.stock_current || '',
    stockMinimum: product?.stock_minimum || '',
    unit: product?.unit || '',
    commissionType: product?.commission_type || 'fixed',
    commissionValue: product?.commission_value || '',
    isActive: product?.is_active ?? true
  }
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="barber-card" style={{ borderRadius: 18, padding: 14 }}>
      <strong>{label}</strong>
      <p className="barber-inline-hint">{money(payload[0].value)}</p>
    </div>
  )
}

function Barber() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, modules, logout } = useAuth()
  const [activeView, setActiveView] = useState(() => getInitialBarberView(window.location.pathname))
  const [dashboard, setDashboard] = useState(emptyDashboard)
  const [appointmentsOverview, setAppointmentsOverview] = useState(emptyAppointmentsOverview)
  const [services, setServices] = useState([])
  const [serviceCatalog, setServiceCatalog] = useState([])
  const [serviceFilters, setServiceFilters] = useState(defaultServiceFilters)
  const [serviceForm, setServiceForm] = useState(emptyService)
  const [editingServiceId, setEditingServiceId] = useState('')
  const [products, setProducts] = useState([])
  const [productCatalog, setProductCatalog] = useState([])
  const [productFilters, setProductFilters] = useState(defaultProductFilters)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [editingProductId, setEditingProductId] = useState('')
  const [suppliers, setSuppliers] = useState([])
  const [collaborators, setCollaborators] = useState([])
  const [sales, setSales] = useState([])
  const [advances, setAdvances] = useState([])
  const [settlements, setSettlements] = useState([])
  const [personalReport, setPersonalReport] = useState(emptyPersonalReport)
  const [collaboratorFinancialSummary, setCollaboratorFinancialSummary] = useState([])
  const [collaboratorFinancialFilters, setCollaboratorFinancialFilters] = useState(defaultCollaboratorFinancialFilters)
  const [collaboratorForm, setCollaboratorForm] = useState(emptyCollaborator)
  const [editingCollaboratorId, setEditingCollaboratorId] = useState('')
  const [collaboratorModalOpen, setCollaboratorModalOpen] = useState(false)
  const [collaboratorSummaryId, setCollaboratorSummaryId] = useState('')
  const [saleForm, setSaleForm] = useState(emptySale)
  const [saleCatalogSearch, setSaleCatalogSearch] = useState('')
  const [saleCatalogFilter, setSaleCatalogFilter] = useState('all')
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [advanceForm, setAdvanceForm] = useState(emptyAdvance)
  const [settlementCollaboratorId, setSettlementCollaboratorId] = useState('')
  const [settlementPreview, setSettlementPreview] = useState(null)
  const [approvalPassword, setApprovalPassword] = useState('')
  const [approvalPin, setApprovalPin] = useState('')
  const [deleteSaleId, setDeleteSaleId] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deletePin, setDeletePin] = useState('')
  const [submittingSale, setSubmittingSale] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth <= 768)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isAdmin = ['admin', 'master_admin'].includes(user?.role)
  const canManageCash = ['admin', 'master_admin', 'secretary'].includes(user?.role)
  const currentView = getInitialBarberView(location.pathname) || activeView
  const meta = viewMeta[currentView]
  const isEditingCollaborator = Boolean(editingCollaboratorId)
  const isCollaborator = user?.role === 'collaborator'

  const loadServiceCatalog = useCallback(async (filters = serviceFilters, options = {}) => {
    try {
      const params = {}

      if (filters.search) {
        params.search = filters.search
      }

      if (filters.status && filters.status !== 'all') {
        params.status = filters.status
      }

      const response = await api.get('/barber/services', { params })
      setServiceCatalog(response.data.data)

      if (!options.keepFullList) {
        const fullResponse = await api.get('/barber/services')
        setServices(fullResponse.data.data)
      }
    } catch (err) {
      if (options.showError !== false) {
        setError(err.response?.data?.error || 'Nao foi possivel carregar o catalogo de servicos')
      }
    }
  }, [serviceFilters])

  const loadProductCatalog = useCallback(async (filters = productFilters, options = {}) => {
    if (!isAdmin) {
      setProductCatalog([])
      return
    }

    try {
      const params = {}

      if (filters.search) {
        params.search = filters.search
      }

      if (filters.status && filters.status !== 'all') {
        params.status = filters.status
      }

      if (filters.category) {
        params.category = filters.category
      }

      const response = await api.get('/barber/products', { params })
      setProductCatalog(response.data.data)

      if (!options.keepFullList) {
        const fullResponse = await api.get('/barber/products')
        setProducts(fullResponse.data.data)
      }
    } catch (err) {
      if (options.showError !== false) {
        setError(err.response?.data?.error || 'Nao foi possivel carregar o catalogo de produtos')
      }
    }
  }, [isAdmin, productFilters])

  const loadData = useCallback(async (options = {}) => {
    if (options.clearMessage !== false) {
      setError('')
    }

    try {
      const requests = [
        api.get('/barber/dashboard'),
        api.get('/barber/services'),
        api.get(isCollaborator ? '/barber/my-sales' : '/barber/sales'),
        api.get('/barber/advances'),
        api.get('/barber/settlements'),
        api.get('/barber/collaborators/financial-summary', {
          params: buildCollaboratorFinancialParams(collaboratorFinancialFilters)
        })
      ]

      if (isAdmin || canManageCash) {
        requests.push(api.get('/barber/appointments'))
      }

      if (isCollaborator) {
        requests.push(api.get('/barber/my-report'))
      }

      if (isAdmin) {
        requests.push(api.get('/barber/products'))
        requests.push(api.get('/barber/suppliers'))
      }

      if (isAdmin || canManageCash) {
        requests.push(api.get('/barber/collaborators'))
      }

      const responses = await Promise.all(requests)
      const [
        dashboardResponse,
        servicesResponse,
        salesResponse,
        advancesResponse,
        settlementsResponse,
        collaboratorFinancialSummaryResponse,
        ...restResponses
      ] = responses

      setDashboard(dashboardResponse.data.data)
      setServices(servicesResponse.data.data)
      setServiceCatalog(servicesResponse.data.data)
      setSales(salesResponse.data.data)
      setAdvances(advancesResponse.data.data)
      setSettlements(settlementsResponse.data.data.settlements)
      setCollaboratorFinancialSummary(collaboratorFinancialSummaryResponse.data.data || [])

      let responseIndex = 0

      if (isAdmin || canManageCash) {
        setAppointmentsOverview(restResponses[responseIndex].data.data || emptyAppointmentsOverview)
        responseIndex += 1
      } else {
        setAppointmentsOverview(emptyAppointmentsOverview)
      }

      if (isAdmin) {
        setProducts(restResponses[responseIndex].data.data)
        setProductCatalog(restResponses[responseIndex].data.data)
        responseIndex += 1
        setSuppliers(restResponses[responseIndex].data.data)
        responseIndex += 1
      } else {
        setProducts([])
        setProductCatalog([])
        setSuppliers([])
      }

      if (isCollaborator) {
        setPersonalReport(restResponses[responseIndex].data.data)
        responseIndex += 1
      } else {
        setPersonalReport(emptyPersonalReport)
      }

      if (isAdmin || canManageCash) {
        setCollaborators(restResponses[responseIndex].data.data)
        responseIndex += 1
      } else {
        setCollaborators([])
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar o BarberGestor')
    } finally {
      setLoading(false)
    }
  }, [canManageCash, collaboratorFinancialFilters, isAdmin, isCollaborator])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadData({ clearMessage: false })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  useEffect(() => {
    function handleResize() {
      setIsMobileViewport(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navigateView = useCallback((view) => {
    setActiveView(view)

    const targetPath = getBarberViewPath(view)

    if (location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    if (activeView !== 'services') {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      loadServiceCatalog(serviceFilters, { keepFullList: true })
    }, 220)

    return () => window.clearTimeout(timeoutId)
  }, [activeView, loadServiceCatalog, serviceFilters])

  useEffect(() => {
    if (activeView !== 'products' || !isAdmin) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      loadProductCatalog(productFilters, { keepFullList: true })
    }, 220)

    return () => window.clearTimeout(timeoutId)
  }, [activeView, isAdmin, loadProductCatalog, productFilters])

  const selectedService = useMemo(() => {
    return services.find((service) => service.id === saleForm.serviceId)
  }, [saleForm.serviceId, services])

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.id === saleForm.productId)
  }, [products, saleForm.productId])

  const selectedSaleSource = useMemo(() => {
    return saleForm.catalogType === 'product' ? selectedProduct : selectedService
  }, [saleForm.catalogType, selectedProduct, selectedService])

  const selectedSaleItemType = useMemo(() => {
    return saleForm.catalogType === 'product' && selectedProduct ? 'product' : 'service'
  }, [saleForm.catalogType, selectedProduct])

  const selectedCollaborator = useMemo(() => {
    return collaborators.find((collaborator) => collaborator.id === saleForm.collaboratorId)
  }, [collaborators, saleForm.collaboratorId])

  const activeSaleCollaborator = selectedCollaborator
    || personalReport?.collaborator
    || dashboard?.collaborator
    || null

  const saleTotal = useMemo(() => {
    return saleForm.items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0)
  }, [saleForm.items])

  const saleEffectiveTotal = useMemo(() => {
    if (saleTotal > 0) {
      return saleTotal
    }

    if (!selectedSaleSource) {
      return 0
    }

    return Number(selectedSaleSource.price ?? selectedSaleSource.sale_price ?? 0) * Math.max(Number(saleForm.quantity || 1), 1)
  }, [saleForm.quantity, saleTotal, selectedSaleSource])

  const saleCommissionTotal = useMemo(() => {
    return saleForm.items.reduce((sum, item) => sum + Number(item.commissionAmount || 0), 0)
  }, [saleForm.items])

  const saleShopNetTotal = useMemo(() => {
    return Math.max(0, saleTotal - saleCommissionTotal)
  }, [saleCommissionTotal, saleTotal])

  const selectedSalePreview = !selectedSaleSource
    ? {
      totalPrice: 0,
      commissionAmount: 0,
      shopNetAmount: 0
    }
    : calculateSaleItemPreview(selectedSaleSource, saleForm.quantity)

  const saleEffectiveCommission = saleForm.items.length > 0
    ? saleCommissionTotal
    : selectedSalePreview.commissionAmount

  const saleEffectiveNet = saleForm.items.length > 0
    ? saleShopNetTotal
    : selectedSalePreview.shopNetAmount

  const isCashPayment = useMemo(() => {
    return ['cash', 'dinheiro'].includes(saleForm.paymentMethod)
  }, [saleForm.paymentMethod])

  const saleChangeDue = useMemo(() => {
    if (!isCashPayment) {
      return 0
    }

    return Number(saleForm.amountReceived || 0) - saleEffectiveTotal
  }, [isCashPayment, saleEffectiveTotal, saleForm.amountReceived])

  const salesChartData = useMemo(() => buildSalesChartData(sales), [sales])

  const paymentChartData = useMemo(() => {
    const totals = sales.reduce((accumulator, sale) => {
      const key = paymentLabel(sale.payment_method)
      accumulator[key] = (accumulator[key] || 0) + Number(sale.total_amount || 0)
      return accumulator
    }, {})

    return [
      { name: 'Dinheiro', value: totals.Dinheiro || 0, fill: '#5cff6b' },
      { name: 'Pix', value: totals.Pix || 0, fill: '#5ca8ff' },
      { name: 'Credito', value: totals.Credito || 0, fill: '#ff8a4c' },
      { name: 'Debito', value: totals.Debito || 0, fill: '#9d7cff' },
      { name: 'Permuta', value: totals.Permuta || 0, fill: '#f4c86c' }
    ]
  }, [sales])

  const todaySalesCount = useMemo(() => {
    const today = new Date()
    return sales.filter((sale) => sameDay(today, sale.created_at)).length
  }, [sales])

  const visibleCollaboratorSummary = useMemo(() => {
    return dashboard.collaboratorSummary || []
  }, [dashboard.collaboratorSummary])

  const visibleCollaboratorFinancialSummary = useMemo(() => {
    return collaboratorFinancialSummary || []
  }, [collaboratorFinancialSummary])

  const currentCollaboratorFinancialSummary = useMemo(() => {
    return visibleCollaboratorFinancialSummary[0] || null
  }, [visibleCollaboratorFinancialSummary])

  const collaboratorSummaryTarget = useMemo(() => {
    return visibleCollaboratorFinancialSummary.find((item) => item.collaborator_id === collaboratorSummaryId) || null
  }, [collaboratorSummaryId, visibleCollaboratorFinancialSummary])

  const collaboratorSummarySales = useMemo(() => {
    if (!collaboratorSummaryId) {
      return []
    }

    return sales
      .filter((sale) => sale.collaborator_id === collaboratorSummaryId)
      .slice(0, 6)
  }, [collaboratorSummaryId, sales])

  const collaboratorSummaryAdvances = useMemo(() => {
    if (!collaboratorSummaryId) {
      return []
    }

    return advances
      .filter((advance) => advance.collaborator_id === collaboratorSummaryId)
      .slice(0, 6)
  }, [advances, collaboratorSummaryId])

  const collaboratorMetrics = useMemo(() => {
    return dashboard.ownMetrics || {}
  }, [dashboard.ownMetrics])

  const collaboratorRecentAttendances = useMemo(() => {
    return personalReport.sales?.length ? personalReport.sales : (dashboard.recentSales || [])
  }, [dashboard.recentSales, personalReport.sales])

  const ranking = visibleCollaboratorSummary.slice(0, 5)
  const topCollaborator = ranking[0]
  const visibleServices = services.filter((service) => service.is_active && !service.is_deleted)
  const visibleProducts = products.filter((product) => product.is_active && !product.is_deleted)
  const appointmentGroups = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const appointments = appointmentsOverview.appointments || []

    return {
      today: appointments.filter((appointment) => appointment.appointment_date === today && appointment.status !== 'canceled'),
      upcoming: appointments.filter((appointment) => appointment.appointment_date >= today && ['scheduled', 'confirmed'].includes(appointment.status)),
      canceled: appointments.filter((appointment) => appointment.status === 'canceled')
    }
  }, [appointmentsOverview.appointments])

  const saleCatalogItems = useMemo(() => {
    const normalizedSearch = saleCatalogSearch.trim().toLowerCase()
    const catalog = [
      ...visibleServices.map((service) => ({
        id: service.id,
        type: 'service',
        name: service.name,
        description: service.description,
        category: service.service_type || 'service',
        price: Number(service.price || 0),
        commissionType: service.commission_type,
        commissionValue: Number(service.commission_value || 0),
        icon: normalizeServiceIcon(service.icon, service.name)
      })),
      ...visibleProducts.map((product) => ({
        id: product.id,
        type: 'product',
        name: product.name,
        description: product.description,
        category: product.category || 'produto',
        price: Number(product.sale_price || 0),
        commissionType: product.commission_type,
        commissionValue: Number(product.commission_value || 0),
        icon: 'product'
      }))
    ]

    return catalog.filter((item) => {
      if (saleCatalogFilter !== 'all' && saleCatalogFilter !== item.type) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [item.name, item.description, item.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    })
  }, [saleCatalogFilter, saleCatalogSearch, visibleProducts, visibleServices])
  const lowStockProducts = products.filter((product) => product.low_stock)
  const deleteSaleTarget = sales.find((sale) => sale.id === deleteSaleId)
  const isEditingService = Boolean(editingServiceId)
  const isEditingProduct = Boolean(editingProductId)
  const saleItemsCount = useMemo(() => {
    if (saleForm.items.length > 0) {
      return saleForm.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    }

    return selectedSaleSource ? Math.max(Number(saleForm.quantity || 1), 1) : 0
  }, [saleForm.items, saleForm.quantity, selectedSaleSource])

  function handleLogout() {
    logout()
    navigate('/barber/login', { replace: true })
  }

  function closeSaleModal() {
    setSaleModalOpen(false)
    setSaleForm(emptySale)
  }

  function calculateSaleItemPreview(source, quantity) {
    const qty = Number(quantity || 1)
    const unitPrice = Number(source?.price ?? source?.sale_price ?? 0)
    const totalPrice = unitPrice * qty
    const collaboratorCommissionType = activeSaleCollaborator?.commission_type || activeSaleCollaborator?.commissionType
    const collaboratorCommissionRate = Number(activeSaleCollaborator?.commission_rate ?? activeSaleCollaborator?.commissionRate ?? 0)
    const useCollaboratorCommission = source?.service_type !== 'product' && collaboratorCommissionType === 'percentage'
    const commissionType = useCollaboratorCommission ? 'percentage' : (source?.commission_type || 'fixed')
    const commissionValue = useCollaboratorCommission
      ? collaboratorCommissionRate
      : Number(source?.commission_value || 0)
    const commissionAmount = commissionType === 'fixed'
      ? commissionValue * qty
      : totalPrice * (commissionValue / 100)

    return {
      totalPrice,
      commissionAmount,
      shopNetAmount: Math.max(0, totalPrice - commissionAmount),
      commissionType,
      commissionValue
    }
  }

  function selectSaleCatalogItem(item) {
    setSaleForm((current) => ({
      ...current,
      catalogType: item.type,
      serviceId: item.type === 'service' ? item.id : '',
      productId: item.type === 'product' ? item.id : ''
    }))
    setError('')
  }

  function addSaleItem() {
    const itemType = selectedSaleItemType
    const source = selectedSaleSource
    const itemId = itemType === 'product' ? saleForm.productId : saleForm.serviceId

    if (!itemId || !source) {
      setError('Selecione um servico ou produto')
      return
    }

    const quantity = Number(saleForm.quantity || 1)

    if (quantity <= 0) {
      setError('Quantidade invalida')
      return
    }

    const preview = calculateSaleItemPreview(source, quantity)

    setSaleForm((current) => ({
      ...current,
      catalogType: 'service',
      serviceId: '',
      productId: '',
      quantity: 1,
      items: [
        ...current.items,
        {
          key: `${itemType}-${itemId}-${Date.now()}`,
          itemType,
          itemId,
          name: source.name,
          icon: itemType === 'product' ? 'product' : normalizeServiceIcon(source.icon, source.name),
          unitPrice: Number(source.price ?? source.sale_price ?? 0),
          quantity,
          ...preview
        }
      ]
    }))
    setError('')
  }

  function removeSaleItem(itemKey) {
    setSaleForm((current) => ({
      ...current,
      items: current.items.filter((item) => item.key !== itemKey)
    }))
  }

  function updateSaleItemQuantity(itemKey, delta) {
    setSaleForm((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.key !== itemKey) {
          return item
        }

        const quantity = Math.max(1, Number(item.quantity || 1) + delta)
        const totalPrice = Number(item.unitPrice || 0) * quantity
        const commissionAmount = item.commissionType === 'fixed'
          ? Number(item.commissionValue || 0) * quantity
          : totalPrice * (Number(item.commissionValue || 0) / 100)

        return {
          ...item,
          quantity,
          totalPrice,
          commissionAmount,
          shopNetAmount: Math.max(0, totalPrice - commissionAmount)
        }
      })
    }))
  }

  function resetServiceEditor() {
    setEditingServiceId('')
    setServiceForm(emptyService)
  }

  function closeCollaboratorModal() {
    setCollaboratorModalOpen(false)
    setEditingCollaboratorId('')
    setCollaboratorForm(emptyCollaborator)
  }

  function openCollaboratorCreateModal() {
    setEditingCollaboratorId('')
    setCollaboratorForm(emptyCollaborator)
    setCollaboratorModalOpen(true)
  }

  function openCollaboratorSummary(collaboratorId) {
    setCollaboratorSummaryId(collaboratorId)
  }

  function closeCollaboratorSummary() {
    setCollaboratorSummaryId('')
  }

  function resetProductEditor() {
    setEditingProductId('')
    setProductForm(emptyProduct)
  }

  function updateServiceForm(event) {
    const { name, value } = event.target
    setServiceForm((current) => ({
      ...current,
      [name]: name === 'isActive' ? value === 'true' : value
    }))
  }

  function updateServiceFilters(event) {
    const { name, value } = event.target
    setServiceFilters((current) => ({ ...current, [name]: value }))
  }

  function updateProductForm(event) {
    const { name, value } = event.target
    setProductForm((current) => ({
      ...current,
      [name]: name === 'isActive' ? value === 'true' : value
    }))
  }

  function updateProductFilters(event) {
    const { name, value } = event.target
    setProductFilters((current) => ({ ...current, [name]: value }))
  }

  function updateCollaboratorForm(event) {
    const { name, type, value, checked } = event.target
    setCollaboratorForm((current) => ({
      ...current,
      [name]: type === 'checkbox'
        ? checked
        : name === 'isActive'
          ? value === 'true'
          : value
    }))
  }

  function removeCollaboratorAvatarPreview() {
    setCollaboratorForm((current) => ({
      ...current,
      avatarUrl: '',
      avatarDataUrl: '',
      avatarFile: null,
      avatarChanged: true
    }))
  }

  function updateCollaboratorAvatar(event) {
    const file = event.target.files?.[0]
    const validation = normalizeAvatarFile(file)

    if (validation.error) {
      setError(validation.error)
      event.target.value = ''
      return
    }

    setError('')

    const reader = new FileReader()
    reader.onload = () => {
      setCollaboratorForm((current) => ({
        ...current,
        avatarUrl: '',
        avatarDataUrl: String(reader.result || ''),
        avatarFile: file,
        avatarChanged: true
      }))
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function updateSaleForm(event) {
    const { name, value } = event.target
    setSaleForm((current) => {
      const next = { ...current, [name]: value }

      if (name === 'paymentMethod' && !['cash', 'dinheiro'].includes(value)) {
        next.amountReceived = ''
        next.changeAmount = ''
      }

      return next
    })
  }

  function updateAdvanceForm(event) {
    const { name, value } = event.target
    setAdvanceForm((current) => ({ ...current, [name]: value }))
  }

  function updateCollaboratorFinancialFilters(event) {
    const { name, value } = event.target
    setCollaboratorFinancialFilters((current) => ({
      ...current,
      [name]: value
    }))
  }

  async function submitService(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const payload = {
      name: serviceForm.name,
      description: serviceForm.description,
      price: Number(serviceForm.price),
      icon: serviceForm.icon,
      serviceType: serviceForm.serviceType,
      estimatedTimeMinutes: serviceForm.estimatedTimeMinutes === ''
        ? null
        : Number(serviceForm.estimatedTimeMinutes),
      isActive: serviceForm.isActive
    }

    try {
      if (isEditingService) {
        await api.put(`/barber/services/${editingServiceId}`, payload)
        setSuccess('Servico atualizado')
      } else {
        await api.post('/barber/services', payload)
        setSuccess('Servico cadastrado')
      }

      resetServiceEditor()
      await loadData()

      if (activeView === 'services') {
        await loadServiceCatalog(serviceFilters, { keepFullList: true, showError: false })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel salvar o servico')
    }
  }

  async function editService(serviceId) {
    setError('')
    setSuccess('')

    try {
      const response = await api.get(`/barber/services/${serviceId}`)
      setEditingServiceId(serviceId)
      setServiceForm(normalizeServiceForm(response.data.data))
      navigateView('services')
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar o servico')
    }
  }

  async function toggleServiceStatus(service) {
    setError('')
    setSuccess('')

    try {
      await api.patch(`/barber/services/${service.id}/status`, {
        isActive: !service.is_active
      })
      setSuccess(service.is_active ? 'Servico desativado' : 'Servico ativado')
      await loadData()
      await loadServiceCatalog(serviceFilters, { keepFullList: true, showError: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel atualizar o status do servico')
    }
  }

  async function removeService(serviceId) {
    if (!window.confirm('Deseja realmente excluir este servico do catalogo?')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await api.delete(`/barber/services/${serviceId}`)
      if (editingServiceId === serviceId) {
        resetServiceEditor()
      }
      setSuccess('Servico excluido')
      await loadData()
      await loadServiceCatalog(serviceFilters, { keepFullList: true, showError: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel excluir o servico')
    }
  }

  async function submitProduct(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const payload = {
      supplierId: productForm.supplierId || null,
      name: productForm.name,
      description: productForm.description,
      category: productForm.category || null,
      brand: productForm.brand || null,
      internalCode: productForm.internalCode || null,
      costPrice: Number(productForm.costPrice || 0),
      salePrice: Number(productForm.salePrice || 0),
      stockCurrent: Number(productForm.stockCurrent || 0),
      stockMinimum: Number(productForm.stockMinimum || 0),
      unit: productForm.unit || null,
      commissionType: productForm.commissionType,
      commissionValue: Number(productForm.commissionValue || 0),
      isActive: productForm.isActive
    }

    try {
      if (isEditingProduct) {
        await api.put(`/barber/products/${editingProductId}`, payload)
        setSuccess('Produto atualizado')
      } else {
        await api.post('/barber/products', payload)
        setSuccess('Produto cadastrado')
      }

      resetProductEditor()
      await loadData()

      if (activeView === 'products') {
        await loadProductCatalog(productFilters, { keepFullList: true, showError: false })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel salvar o produto')
    }
  }

  async function editProduct(productId) {
    setError('')
    setSuccess('')

    try {
      const response = await api.get(`/barber/products/${productId}`)
      setEditingProductId(productId)
      setProductForm(normalizeProductForm(response.data.data))
      navigateView('products')
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar o produto')
    }
  }

  async function toggleProductStatus(product) {
    setError('')
    setSuccess('')

    try {
      await api.patch(`/barber/products/${product.id}/status`, {
        isActive: !product.is_active
      })
      setSuccess(product.is_active ? 'Produto desativado' : 'Produto ativado')
      await loadData()
      await loadProductCatalog(productFilters, { keepFullList: true, showError: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel atualizar o status do produto')
    }
  }

  async function removeProduct(productId) {
    if (!window.confirm('Deseja realmente excluir este produto do catalogo?')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await api.delete(`/barber/products/${productId}`)
      if (editingProductId === productId) {
        resetProductEditor()
      }
      setSuccess('Produto excluido')
      await loadData()
      await loadProductCatalog(productFilters, { keepFullList: true, showError: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel excluir o produto')
    }
  }

  async function createCollaborator(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      const formData = new FormData(event.currentTarget)
      const payload = {
        name: String(formData.get('name') ?? collaboratorForm.name ?? '').trim(),
        email: String(formData.get('email') ?? collaboratorForm.email ?? '').trim(),
        password: String(formData.get('password') ?? collaboratorForm.password ?? ''),
        phone: String(formData.get('phone') ?? collaboratorForm.phone ?? '').trim(),
        commissionType: String(formData.get('commissionType') ?? collaboratorForm.commissionType ?? 'percentage'),
        commissionRate: Number(formData.get('commissionRate') ?? collaboratorForm.commissionRate ?? 0),
        isActive: String(formData.get('isActive') ?? String(collaboratorForm.isActive)) === 'true',
        canLaunchSales: collaboratorForm.canLaunchSales,
        availableForBooking: collaboratorForm.availableForBooking,
        canViewOwnDashboard: collaboratorForm.canViewOwnDashboard,
        canViewOwnReports: collaboratorForm.canViewOwnReports
      }

      let savedCollaboratorId = editingCollaboratorId

      if (isEditingCollaborator) {
        const response = await api.put(`/barber/collaborators/${editingCollaboratorId}`, payload)
        savedCollaboratorId = response.data?.data?.id || editingCollaboratorId
        setSuccess('Colaborador atualizado')
      } else {
        const response = await api.post('/barber/collaborators', payload)
        savedCollaboratorId = response.data?.data?.id || response.data?.data?.collaborator?.id || ''
        setSuccess('Colaborador cadastrado')
      }

      if (savedCollaboratorId && collaboratorForm.avatarChanged) {
        if (collaboratorForm.avatarFile) {
          const formData = new FormData()
          formData.append('avatar', collaboratorForm.avatarFile)

          await api.post(`/barber/collaborators/${savedCollaboratorId}/avatar`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
        } else if (!collaboratorForm.avatarUrl && !collaboratorForm.avatarDataUrl) {
          await api.delete(`/barber/collaborators/${savedCollaboratorId}/avatar`)
        }
      }

      closeCollaboratorModal()
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel salvar o colaborador')
    }
  }

  async function editCollaborator(collaboratorId) {
    setError('')
    setSuccess('')

    try {
      const response = await api.get(`/barber/collaborators/${collaboratorId}`)
      const collaborator = response.data.data

      setEditingCollaboratorId(collaboratorId)
      setCollaboratorForm({
        name: collaborator.name || collaborator.nickname || '',
        email: collaborator.email || '',
        password: '',
        phone: collaborator.phone || '',
        avatarUrl: collaborator.avatar_url || '',
        avatarDataUrl: '',
        avatarFile: null,
        avatarChanged: false,
        commissionType: collaborator.commission_type || 'percentage',
        commissionRate: collaborator.commission_rate || '',
        isActive: collaborator.is_active ?? true,
        canLaunchSales: Boolean(collaborator.can_launch_sales),
        availableForBooking: Boolean(collaborator.available_for_booking),
        canViewOwnDashboard: collaborator.can_view_own_dashboard !== false,
        canViewOwnReports: collaborator.can_view_own_reports !== false
      })
      setCollaboratorModalOpen(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar o colaborador')
    }
  }

  async function toggleCollaboratorStatus(collaborator) {
    setError('')
    setSuccess('')

    try {
      await api.patch(`/barber/collaborators/${collaborator.id}/status`, {
        isActive: !collaborator.is_active
      })
      setSuccess(collaborator.is_active ? 'Colaborador desativado' : 'Colaborador ativado')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel atualizar o status do colaborador')
    }
  }

  async function saveCollaboratorPermissions(collaboratorId, permissions) {
    setError('')
    setSuccess('')

    try {
      await api.patch(`/barber/collaborators/${collaboratorId}/permissions`, permissions)
      setSuccess('Permissoes atualizadas')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel atualizar as permissoes')
    }
  }

  async function removeCollaborator(collaboratorId) {
    if (!window.confirm('Deseja realmente excluir este colaborador?')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await api.delete(`/barber/collaborators/${collaboratorId}`)
      if (editingCollaboratorId === collaboratorId) {
        closeCollaboratorModal()
      }
      setSuccess('Colaborador excluido')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel excluir o colaborador')
    }
  }

  async function copyBookingLink() {
    if (!appointmentsOverview.public_booking_path) {
      setError('Link publico de agendamento indisponivel no momento')
      return
    }

    const bookingUrl = `${window.location.origin}${appointmentsOverview.public_booking_path}`

    try {
      await navigator.clipboard.writeText(bookingUrl)
      setSuccess('Link de agendamento copiado')
    } catch {
      setError('Nao foi possivel copiar o link de agendamento')
    }
  }

  async function updateAppointmentStatus(appointmentId, status) {
    setError('')
    setSuccess('')

    try {
      await api.patch(`/barber/appointments/${appointmentId}`, { status })
      setSuccess('Agendamento atualizado')
      await loadData({ clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel atualizar o agendamento')
    }
  }

  async function cancelAppointment(appointmentId) {
    setError('')
    setSuccess('')

    try {
      await api.patch(`/barber/appointments/${appointmentId}/cancel`)
      setSuccess('Agendamento cancelado')
      await loadData({ clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel cancelar o agendamento')
    }
  }

  async function createSale(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const saleItemsPayload = saleForm.items.length > 0
      ? saleForm.items.map((item) => ({
        itemType: item.itemType,
        itemId: item.itemId,
        quantity: Number(item.quantity || 1)
      }))
      : selectedSaleSource
        ? [{
          itemType: selectedSaleItemType,
          itemId: selectedSaleSource.id,
          quantity: Number(saleForm.quantity || 1)
        }]
        : []

    if (!saleForm.collaboratorId && canManageCash) {
      setError('Selecione um colaborador')
      return
    }

    if (saleItemsPayload.length === 0) {
      setError('Adicione ao menos um servico')
      return
    }

    if (isCashPayment && saleChangeDue < 0) {
      setError('Valor recebido menor que o valor do servico')
      return
    }

    try {
      setSubmittingSale(true)
      await api.post('/barber/sales', {
        collaboratorId: saleForm.collaboratorId || null,
        clientName: saleForm.clientName || null,
        paymentMethod: saleForm.paymentMethod,
        amountReceived: isCashPayment ? Number(saleForm.amountReceived || 0) : undefined,
        changeAmount: isCashPayment ? Math.max(0, saleChangeDue) : 0,
        notes: saleForm.notes,
        items: saleItemsPayload
      })

      closeSaleModal()
      setSuccess('Venda concluida com sucesso')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel registrar a venda')
    } finally {
      setSubmittingSale(false)
    }
  }

  async function createAdvance(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    try {
      await api.post('/barber/advances', {
        collaboratorId: advanceForm.collaboratorId,
        amount: Number(advanceForm.amount),
        reason: advanceForm.reason
      })

      setAdvanceForm(emptyAdvance)
      setSuccess('Vale solicitado')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel solicitar o vale')
    }
  }

  async function updateAdvanceStatus(advanceId, action) {
    setError('')
    setSuccess('')

    if (!approvalPassword && !approvalPin) {
      setError('Informe a senha admin ou PIN para confirmar')
      return
    }

    try {
      await api.patch(`/barber/advances/${advanceId}/${action}`, {
        adminPassword: approvalPassword,
        pin: approvalPin
      })

      setApprovalPassword('')
      setApprovalPin('')
      setSuccess(action === 'approve' ? 'Vale aprovado' : 'Vale rejeitado')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel atualizar o vale')
    }
  }

  async function loadSettlementPreview(collaboratorId) {
    setSettlementCollaboratorId(collaboratorId)
    setSettlementPreview(null)

    if (!collaboratorId) {
      return
    }

    try {
      const response = await api.get(`/barber/settlements?collaboratorId=${collaboratorId}`)
      setSettlementPreview(response.data.data.preview)
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel calcular o fechamento')
    }
  }

  async function createSettlement() {
    setError('')
    setSuccess('')

    if (!settlementCollaboratorId) {
      setError('Selecione um colaborador para fechar')
      return
    }

    try {
      await api.post('/barber/settlements', {
        collaboratorId: settlementCollaboratorId
      })

      setSuccess('Fechamento registrado')
      setSettlementPreview(null)
      setSettlementCollaboratorId('')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel registrar o fechamento')
    }
  }

  function startDeleteSale(saleId) {
    setDeleteSaleId(saleId)
    setDeleteReason('')
    setDeletePassword('')
    setDeletePin('')
  }

  async function deleteSale() {
    setError('')
    setSuccess('')

    if (!deleteSaleId) {
      return
    }

    if (!deleteReason.trim()) {
      setError('Informe o motivo da exclusao')
      return
    }

    if (!deletePassword && !deletePin) {
      setError('Informe a senha admin ou PIN para excluir')
      return
    }

    try {
      await api.delete(`/barber/sales/${deleteSaleId}`, {
        data: {
          reason: deleteReason,
          adminPassword: deletePassword,
          pin: deletePin
        }
      })

      setDeleteSaleId('')
      setDeleteReason('')
      setDeletePassword('')
      setDeletePin('')
      setSuccess('Venda excluida')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel excluir a venda')
    }
  }

  function renderDashboard() {
    if (!isAdmin) {
      if (isMobileViewport) {
        return (
          <CollaboratorMobileDashboard
            advances={advances}
            canLaunchSales={Boolean(user?.can_launch_sales)}
            fullDate={fullDate}
            metrics={collaboratorMetrics}
            money={money}
            onOpenSale={() => {
              setSaleForm(emptySale)
              setSaleModalOpen(true)
            }}
            recentAttendances={collaboratorRecentAttendances}
            user={user}
          />
        )
      }

      const collaboratorCards = [
        {
          title: 'Meus atendimentos hoje',
          value: `${collaboratorMetrics.totalAttendances || collaboratorMetrics.todayAttendances || 0}`,
          detail: 'Quantidade de atendimentos feitos por voce hoje',
          glow: 'blue'
        },
        {
          title: 'Minha comissao acumulada',
          value: money(collaboratorMetrics.myCommissionAccumulated || collaboratorMetrics.totalCommission),
          detail: 'Soma das suas comissoes registradas',
          glow: 'green'
        },
        {
          title: 'Comissao da semana',
          value: money(collaboratorMetrics.weekCommission),
          detail: 'Apurado apenas nas suas vendas',
          glow: 'gold'
        },
        {
          title: 'Adiantamentos',
          value: money(collaboratorMetrics.myAdvances || collaboratorMetrics.totalAdvances),
          detail: 'Vales aprovados ou liquidados no seu nome',
          glow: 'red'
        }
      ]

      return (
        <>
          <section className="barber-hero-grid">
            <div className="barber-hero-card">
              <span className="barber-overline">BarberGestor colaborador</span>
              <h2>Sua producao e sua comissao em tempo real</h2>
              <p>
                Painel focado apenas nos seus atendimentos, comissao acumulada e historico pessoal,
                sem expor valores financeiros da barbearia.
              </p>
              <div className="barber-inline-kpis">
                <span>{collaboratorMetrics.totalAttendances || collaboratorMetrics.todayAttendances || 0} atendimentos hoje</span>
                <span>{collaboratorRecentAttendances.length} registros recentes</span>
                <span>{advances.filter((advance) => advance.status === 'pending').length} vales pendentes</span>
              </div>
            </div>

            <BarberCard>
              <div className="barber-list-header">
                <div>
                  <h2>Resumo pessoal</h2>
                  <p>Indicadores liberados para o seu perfil.</p>
                </div>
                <BarberBadge tone="admin">{money(collaboratorMetrics.mySettlementBalance || collaboratorMetrics.netCommission)}</BarberBadge>
              </div>

              <div className="barber-summary-grid">
                <div className="barber-summary-item">
                  <div>
                    <strong>Liquido previsto</strong>
                    <p>Comissao menos adiantamentos</p>
                  </div>
                  <strong>{money(collaboratorMetrics.mySettlementBalance || collaboratorMetrics.netCommission)}</strong>
                </div>
                <div className="barber-summary-item">
                  <div>
                    <strong>Comissao do mes</strong>
                    <p>Acumulado pessoal do mes</p>
                  </div>
                  <strong>{money(collaboratorMetrics.monthCommission)}</strong>
                </div>
                <div className="barber-summary-item">
                  <div>
                    <strong>Status de vales</strong>
                    <p>Solicitacoes vinculadas a voce</p>
                  </div>
                  <strong>{advances.length}</strong>
                </div>
              </div>
            </BarberCard>
          </section>

          <section className="barber-secondary-kpis">
            {collaboratorCards.map((card) => (
              <article className="barber-kpi-card" key={card.title}>
                <div className="barber-kpi-topline">
                  <span>{card.title}</span>
                  <span className={`barber-kpi-glow ${card.glow}`} />
                </div>
                <strong>{card.value}</strong>
                <p>{card.detail}</p>
              </article>
            ))}
          </section>

          <BarberCard>
            <div className="barber-list-header">
              <div>
                <h2>Meus atendimentos recentes</h2>
                <p>Historico pessoal retornado pelo BarberGestor.</p>
              </div>
              <BarberBadge tone="pix">{collaboratorRecentAttendances.length} registros</BarberBadge>
            </div>

            <div className="barber-activity-list">
              {collaboratorRecentAttendances.length > 0 ? (
                collaboratorRecentAttendances.map((sale) => (
                  <div className="barber-activity-item" key={sale.id}>
                    <span className="barber-activity-avatar">
                      {(sale.service_name || 'A').slice(0, 1)}
                    </span>
                    <div className="barber-activity-meta">
                      <strong>{sale.service_name || 'Atendimento registrado'}</strong>
                      <span>{fullDate(sale.created_at)}</span>
                    </div>
                    <div className="barber-activity-value">
                      <strong>{money(sale.commission_amount || 0)}</strong>
                      <span>Comissao</span>
                    </div>
                  </div>
                ))
              ) : (
                <BarberEmptyState
                  description="Assim que seus atendimentos forem registrados, eles aparecerao aqui."
                  title="Nenhum atendimento encontrado"
                />
              )}
            </div>
          </BarberCard>
        </>
      )
    }

    const dashboardCards = [
      {
        title: 'Faturamento do dia',
        value: money(dashboard.totalDaySales),
        detail: `${todaySalesCount} atendimentos registrados hoje`,
        glow: 'green',
        highlight: 'positive',
        meta: 'Fluxo atualizado'
      },
      {
        title: 'Total em dinheiro',
        value: money(dashboard.totalCash),
        detail: 'Entradas no caixa fisico',
        glow: 'gold',
        highlight: 'gold',
        meta: 'Caixa presencial'
      },
      {
        title: 'Total em Pix',
        value: money(dashboard.totalPix),
        detail: 'Recebimentos digitais',
        glow: 'blue',
        highlight: 'positive',
        meta: 'Liquidez imediata'
      },
      {
        title: 'Total em permuta',
        value: money(dashboard.totalPermuta),
        detail: 'Registro separado da receita liquida',
        glow: 'red',
        highlight: 'gold',
        meta: 'Controle de acordos'
      }
    ]

    const secondaryCards = [
      {
        title: 'Total de atendimentos',
        value: `${todaySalesCount}`,
        detail: 'Movimento registrado hoje',
        glow: 'blue'
      },
      {
        title: isAdmin ? 'Comissao do dia' : 'Minha comissao',
        value: money(isAdmin ? dashboard.totalCommissions : visibleCollaboratorSummary[0]?.total_commission),
        detail: isAdmin ? 'Comissao consolidada da equipe' : 'Bruto antes de vales',
        glow: 'green'
      },
      {
        title: isAdmin ? 'Caixa atual' : 'Liquido previsto',
        value: money(
          isAdmin
            ? Number(dashboard.totalCash || 0) + Number(dashboard.totalPix || 0)
            : visibleCollaboratorSummary[0]?.net_commission
        ),
        detail: isAdmin ? 'Dinheiro + Pix em caixa' : 'Comissao menos vales',
        glow: 'gold'
      },
      {
        title: 'Ranking do dia',
        value: topCollaborator?.collaborator_name || 'Sem dados',
        detail: topCollaborator ? `${money(topCollaborator.total_sales)} em vendas` : 'Nenhum colaborador no ranking',
        glow: 'red'
      }
    ]

    return (
      <>
        <section className="barber-hero-grid">
          <div className="barber-hero-card">
            <span className="barber-overline">BarberGestor premium</span>
            <h2>{isAdmin ? 'Controle sua barbearia em tempo real' : 'Sua performance, caixa e comissao em uma tela'}</h2>
            <p>
              Layout otimizado para leitura rapida, decisoes de caixa e acompanhamento da operacao com servicos,
              vendas e equipe no mesmo padrao visual.
            </p>
            <div className="barber-inline-kpis">
              <span>{visibleServices.length} servicos ativos</span>
              {isAdmin && <span>{visibleProducts.length} produtos ativos</span>}
              {isAdmin && <span>{lowStockProducts.length} em estoque baixo</span>}
              <span>{collaborators.filter((collaborator) => collaborator.is_active).length} colaboradores ativos</span>
              <span>{advances.filter((advance) => advance.status === 'pending').length} vales pendentes</span>
            </div>
          </div>

          <BarberCard>
            <div className="barber-list-header">
              <div>
                <h2>Ranking rapido</h2>
                <p>Quem puxou mais faturamento no periodo atual.</p>
              </div>
              <BarberBadge tone="admin">{ranking.length} no radar</BarberBadge>
            </div>
            <div className="barber-ranking-list">
              {ranking.length > 0 ? (
                ranking.map((item, index) => (
                  <div className="barber-ranking-item" key={item.collaborator_id || item.collaborator_name}>
                    <span className="barber-ranking-index">{index + 1}</span>
                    <div className="barber-ranking-copy">
                      <strong>{item.collaborator_name}</strong>
                      <p>{money(item.total_commission)} em comissao acumulada</p>
                    </div>
                    <strong>{money(item.total_sales)}</strong>
                  </div>
                ))
              ) : (
                <BarberEmptyState
                  description="As vendas do periodo vao preencher o ranking automaticamente."
                  title="Sem ranking disponivel"
                />
              )}
            </div>
          </BarberCard>
        </section>

        <section className="barber-kpi-grid">
          {dashboardCards.map((card, index) => (
            <article
              className={`barber-kpi-card ${index === 0 ? 'barber-kpi-card-primary' : ''}`.trim()}
              key={card.title}
            >
              <div className="barber-kpi-topline">
                <span>{card.title}</span>
                <span className={`barber-kpi-glow ${card.glow}`} />
              </div>
              <strong>{card.value}</strong>
              <div className="barber-kpi-meta">
                <span className={card.highlight}>{card.meta}</span>
                <span>{card.detail}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="barber-secondary-kpis">
          {secondaryCards.map((card) => (
            <article className="barber-kpi-card" key={card.title}>
              <div className="barber-kpi-topline">
                <span>{card.title}</span>
                <span className={`barber-kpi-glow ${card.glow}`} />
              </div>
              <strong>{card.value}</strong>
              <p>{card.detail}</p>
            </article>
          ))}
        </section>

        <section className="barber-grid-two">
          <BarberCard>
            <div className="barber-chart-header">
              <div>
                <h2>Faturamento por dia</h2>
                <p>Ultimos 7 dias com leitura rapida de tendencia.</p>
              </div>
              <div className="barber-chart-stat">
                <BarberBadge tone="cash">Receita</BarberBadge>
                <strong>{money(salesChartData.reduce((sum, item) => sum + item.total, 0))}</strong>
              </div>
            </div>

            <div className="barber-chart-body">
              <div style={{ width: '100%', minHeight: 300, height: 300 }}>
                {salesChartData.length > 0 ? (
                  <ResponsiveContainer debounce={50} height="100%" minHeight={300} minWidth={280} width="100%">
                    <BarChart data={salesChartData}>
                      <defs>
                        <linearGradient id="barberSalesGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#86ff93" />
                          <stop offset="100%" stopColor="#1f7d42" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                      <XAxis dataKey="label" stroke="#7d8c9b" tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="#7d8c9b"
                        tickFormatter={(value) => `R$${Math.round(value / 1000)}k`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="total" fill="url(#barberSalesGradient)" radius={[12, 12, 4, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <BarberEmptyState
                    description="As vendas dos ultimos dias aparecerao aqui assim que o caixa tiver movimentacao."
                    title="Sem dados para o grafico"
                  />
                )}
              </div>
            </div>
          </BarberCard>

          <BarberCard>
            <div className="barber-list-header">
              <div>
                <h2>Ultimas vendas</h2>
                <p>Atividades mais recentes para auditoria rapida.</p>
              </div>
              <BarberBadge tone="pix">{dashboard.recentSales.length} registros</BarberBadge>
            </div>

            <div className="barber-activity-list">
              {dashboard.recentSales.length > 0 ? (
                dashboard.recentSales.map((sale) => (
                  <div className="barber-activity-item" key={sale.id}>
                    <span className="barber-activity-avatar">
                      {(sale.collaborator_name || 'S').slice(0, 1)}
                    </span>
                    <div className="barber-activity-meta">
                      <div>
                        <strong>{sale.collaborator_name || 'Sem colaborador'}</strong>
                        <span>{paymentLabel(sale.payment_method)} • {fullDate(sale.created_at)}</span>
                      </div>
                    </div>
                    <div className="barber-activity-value">
                      <strong>{money(sale.total_amount)}</strong>
                      <BarberBadge tone={paymentTone(sale.payment_method)}>{paymentLabel(sale.payment_method)}</BarberBadge>
                    </div>
                  </div>
                ))
              ) : (
                <BarberEmptyState
                  description="Assim que novas vendas entrarem, elas aparecem aqui com pagamento e responsavel."
                  title="Sem atividades recentes"
                />
              )}
            </div>
          </BarberCard>
        </section>

        <section className="barber-grid-two">
          <BarberCard>
            <div className="barber-panel-header">
              <div>
                <h3>Vales e adiantamentos</h3>
                <p>Mantenha as movimentacoes internas da equipe dentro do mesmo fluxo financeiro.</p>
              </div>
              <BarberBadge tone="pending">
                {advances.filter((advance) => advance.status === 'pending').length} pendentes
              </BarberBadge>
            </div>

            <form className="barber-panel-stack" onSubmit={createAdvance}>
              <div className="barber-form-grid">
                {isAdmin && (
                  <div className="barber-form-block">
                    <label htmlFor="advance-collaborator">Colaborador</label>
                    <select
                      className="barber-select"
                      id="advance-collaborator"
                      name="collaboratorId"
                      onChange={updateAdvanceForm}
                      required
                      value={advanceForm.collaboratorId}
                    >
                      <option value="">Selecione</option>
                      {collaborators
                        .filter((collaborator) => collaborator.is_active)
                        .map((collaborator) => (
                          <option key={collaborator.id} value={collaborator.id}>
                            {collaborator.name || collaborator.nickname}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                <div className="barber-form-block">
                  <label htmlFor="advance-amount">Valor</label>
                  <input
                    className="barber-input"
                    id="advance-amount"
                    min="0.01"
                    name="amount"
                    onChange={updateAdvanceForm}
                    required
                    step="0.01"
                    type="number"
                    value={advanceForm.amount}
                  />
                </div>
                <div className="barber-form-block barber-form-block-full">
                  <label htmlFor="advance-reason">Motivo</label>
                  <textarea
                    className="barber-textarea"
                    id="advance-reason"
                    name="reason"
                    onChange={updateAdvanceForm}
                    rows="3"
                    value={advanceForm.reason}
                  />
                </div>
              </div>

              <BarberButton type="submit" variant="primary">
                Solicitar vale
              </BarberButton>
            </form>

            {isAdmin && (
              <>
                <div className="barber-advance-credentials">
                  <div className="barber-form-block">
                    <label htmlFor="approval-password">Senha admin</label>
                    <input
                      className="barber-input"
                      id="approval-password"
                      onChange={(event) => setApprovalPassword(event.target.value)}
                      type="password"
                      value={approvalPassword}
                    />
                  </div>
                  <div className="barber-form-block">
                    <label htmlFor="approval-pin">PIN</label>
                    <input
                      className="barber-input"
                      id="approval-pin"
                      onChange={(event) => setApprovalPin(event.target.value)}
                      type="password"
                      value={approvalPin}
                    />
                  </div>
                </div>

                <BarberTable columns={['Data', 'Colaborador', 'Valor', 'Status', 'Acoes']}>
                  {advances.slice(0, 6).map((advance) => (
                    <tr key={advance.id}>
                      <td>{fullDate(advance.created_at)}</td>
                      <td>{advance.collaborator_name}</td>
                      <td>{money(advance.amount)}</td>
                      <td>
                        <BarberBadge tone={advanceTone(advance.status)}>{advanceLabel(advance.status)}</BarberBadge>
                      </td>
                      <td>
                        {advance.status === 'pending' ? (
                          <div className="barber-inline-actions">
                            <BarberButton onClick={() => updateAdvanceStatus(advance.id, 'approve')} type="button" variant="primary">
                              Aprovar
                            </BarberButton>
                            <BarberButton onClick={() => updateAdvanceStatus(advance.id, 'reject')} type="button" variant="danger">
                              Rejeitar
                            </BarberButton>
                          </div>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </BarberTable>
              </>
            )}
          </BarberCard>

          <BarberCard>
            <div className="barber-panel-header">
              <div>
                <h3>Fechamento por colaborador</h3>
                <p>O caixa diario convive com o acerto individual da equipe, sem misturar os dois fluxos.</p>
              </div>
            </div>

            <div className="barber-settlement-box">
              <div className="barber-form-block">
                <label htmlFor="settlement-collaborator">Colaborador</label>
                <select
                  className="barber-select"
                  id="settlement-collaborator"
                  onChange={(event) => loadSettlementPreview(event.target.value)}
                  value={settlementCollaboratorId}
                >
                  <option value="">Selecione</option>
                  {collaborators.map((collaborator) => (
                    <option key={collaborator.id} value={collaborator.id}>
                      {collaborator.name || collaborator.nickname}
                    </option>
                  ))}
                </select>
              </div>

              {settlementPreview ? (
                <div className="barber-summary-grid">
                  <div className="barber-summary-item">
                    <div>
                      <strong>Total vendido</strong>
                      <p>Periodo atual</p>
                    </div>
                    <strong>{money(settlementPreview.total_sales)}</strong>
                  </div>
                  <div className="barber-summary-item">
                    <div>
                      <strong>Comissao</strong>
                      <p>Antes dos vales</p>
                    </div>
                    <strong>{money(settlementPreview.total_commission)}</strong>
                  </div>
                  <div className="barber-summary-item">
                    <div>
                      <strong>Liquido</strong>
                      <p>Valor previsto</p>
                    </div>
                    <strong>{money(settlementPreview.net_amount)}</strong>
                  </div>
                </div>
              ) : (
                <BarberEmptyState
                  description="Escolha um colaborador para ver o preview antes do fechamento."
                  title="Fechamento individual aguardando selecao"
                />
              )}

              <BarberButton onClick={createSettlement} type="button" variant="secondary">
                Fechar colaborador
              </BarberButton>
            </div>
          </BarberCard>
        </section>
      </>
    )
  }

  function renderServices() {
    return (
      <Servicos
        filters={serviceFilters}
        form={serviceForm}
        isAdmin={isAdmin}
        isEditing={isEditingService}
        money={money}
        onCancelEdit={resetServiceEditor}
        onDelete={removeService}
        onEdit={editService}
        onFilterChange={updateServiceFilters}
        onFormChange={updateServiceForm}
        onSubmit={submitService}
        onToggleStatus={toggleServiceStatus}
        services={serviceCatalog}
      />
    )
  }

  function renderProducts() {
    return (
      <Produtos
        filters={productFilters}
        form={productForm}
        isEditing={isEditingProduct}
        money={money}
        onCancelEdit={resetProductEditor}
        onDelete={removeProduct}
        onEdit={editProduct}
        onFilterChange={updateProductFilters}
        onFormChange={updateProductForm}
        onSubmit={submitProduct}
        onToggleStatus={toggleProductStatus}
        products={productCatalog}
        suppliers={suppliers}
      />
    )
  }

  function renderAppointments() {
    const publicBookingUrl = appointmentsOverview.public_booking_path
      ? `${window.location.origin}${appointmentsOverview.public_booking_path}`
      : ''

    const summaryCards = [
      {
        label: 'Agendamentos de hoje',
        value: appointmentsOverview.summary.appointments_today,
        tone: 'cash'
      },
      {
        label: 'Proximos horarios',
        value: appointmentsOverview.summary.upcoming_slots,
        tone: 'pix'
      },
      {
        label: 'Profissionais disponiveis',
        value: appointmentsOverview.summary.available_collaborators,
        tone: 'admin'
      },
      {
        label: 'Servicos agendaveis',
        value: appointmentsOverview.summary.bookable_services,
        tone: 'permuta'
      }
    ]

    const renderAppointmentCards = (items, emptyTitle, emptyDescription) => {
      if (items.length === 0) {
        return (
          <BarberEmptyState
            description={emptyDescription}
            title={emptyTitle}
          />
        )
      }

      return (
        <div className="barber-appointments-list">
          {items.map((appointment) => (
            <article className="barber-appointment-card" key={appointment.id}>
              <div className="barber-appointment-card-top">
                <div>
                  <strong>{appointment.customer_name}</strong>
                  <p>{appointment.customer_phone}</p>
                </div>
                <BarberBadge tone={appointmentTone(appointment.status)}>
                  {appointmentLabel(appointment.status)}
                </BarberBadge>
              </div>

              <div className="barber-appointment-card-grid">
                <div>
                  <span>Servico</span>
                  <strong>{appointment.service_name}</strong>
                </div>
                <div>
                  <span>Profissional</span>
                  <strong>{appointment.collaborator_name}</strong>
                </div>
                <div>
                  <span>Horario</span>
                  <strong>{formatAppointmentSlot(appointment)}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{appointmentLabel(appointment.status)}</strong>
                </div>
              </div>

              {appointment.notes && (
                <div className="barber-appointment-notes">
                  <span>Observacoes</span>
                  <p>{appointment.notes}</p>
                </div>
              )}

              <div className="barber-inline-actions">
                {appointment.status === 'scheduled' && (
                  <BarberButton onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')} type="button" variant="secondary">
                    Confirmar
                  </BarberButton>
                )}
                {['scheduled', 'confirmed'].includes(appointment.status) && (
                  <BarberButton onClick={() => updateAppointmentStatus(appointment.id, 'completed')} type="button" variant="primary">
                    Concluir
                  </BarberButton>
                )}
                {appointment.status !== 'canceled' && appointment.status !== 'completed' && (
                  <BarberButton onClick={() => cancelAppointment(appointment.id)} type="button" variant="danger">
                    Cancelar
                  </BarberButton>
                )}
              </div>
            </article>
          ))}
        </div>
      )
    }

    return (
      <section className="barber-page barber-appointments-page">
        <div className="barber-grid-two">
          <BarberCard className="barber-appointments-link-card">
            <div className="barber-table-header">
              <div>
                <h2>Seu link de agendamento</h2>
                <p>Compartilhe este link com os clientes para receber reservas online da sua barbearia.</p>
              </div>
              <BarberButton onClick={copyBookingLink} type="button" variant="primary">
                <BarberIcon name="copy" />
                <span>Copiar link de agendamento</span>
              </BarberButton>
            </div>

            {publicBookingUrl ? (
              <div className="barber-appointments-link-box">
                <span>Link publico da barbearia</span>
                <strong>{publicBookingUrl}</strong>
              </div>
            ) : (
              <BarberEmptyState
                description="O link publico sera disponibilizado assim que o slug da barbearia estiver pronto."
                title="Link ainda indisponivel"
              />
            )}
          </BarberCard>

          <div className="barber-kpi-grid barber-appointments-summary">
            {summaryCards.map((card) => (
              <BarberCard className="barber-appointment-summary-card" key={card.label}>
                <div className="barber-kpi-topline">
                  <span>{card.label}</span>
                  <BarberBadge tone={card.tone}>{card.value}</BarberBadge>
                </div>
                <strong>{card.value}</strong>
              </BarberCard>
            ))}
          </div>
        </div>

        <div className="barber-grid-three barber-appointments-columns">
          <BarberCard>
            <div className="barber-table-header">
              <div>
                <h2>Hoje</h2>
                <p>Reservas previstas para a data atual.</p>
              </div>
              <BarberBadge tone="cash">{appointmentGroups.today.length}</BarberBadge>
            </div>
            {renderAppointmentCards(
              appointmentGroups.today,
              'Nenhum agendamento encontrado.',
              'Quando novos clientes reservarem horarios, eles aparecerao aqui.'
            )}
          </BarberCard>

          <BarberCard>
            <div className="barber-table-header">
              <div>
                <h2>Proximos</h2>
                <p>Confirmacoes futuras e reservas em andamento.</p>
              </div>
              <BarberBadge tone="pix">{appointmentGroups.upcoming.length}</BarberBadge>
            </div>
            {renderAppointmentCards(
              appointmentGroups.upcoming,
              'Nenhum horario futuro confirmado.',
              'Assim que houver reservas para os proximos dias, elas serao listadas aqui.'
            )}
          </BarberCard>

          <BarberCard>
            <div className="barber-table-header">
              <div>
                <h2>Cancelados</h2>
                <p>Historico recente de cancelamentos.</p>
              </div>
              <BarberBadge tone="danger">{appointmentGroups.canceled.length}</BarberBadge>
            </div>
            {renderAppointmentCards(
              appointmentGroups.canceled,
              'Nenhum agendamento cancelado.',
              'Os cancelamentos aparecem aqui para acompanhamento da equipe.'
            )}
          </BarberCard>
        </div>
      </section>
    )
  }

  function renderSalesV2() {
    const paymentOptions = [
      { value: 'pix', label: 'Pix', icon: 'money' },
      { value: 'cash', label: 'Dinheiro', icon: 'wallet' },
      { value: 'credit', label: 'Cartao', icon: 'catalog' },
      { value: 'debit', label: 'Debito', icon: 'catalog' },
      { value: 'permuta', label: 'Permuta', icon: 'switch' }
    ]
    const activeCollaborators = collaborators.filter((collaborator) => collaborator.is_active && !collaborator.is_deleted)
    const recentSales = sales.slice(0, 8)

    return (
      <>
        <form className="barber-sales-workspace" onSubmit={createSale}>
          <section className="barber-sales-main">
            <BarberCard className="barber-sales-hero">
              <div className="barber-sales-hero-copy">
                <span className="barber-overline">PDV BarberGestor</span>
                <h2>Vendas</h2>
                <p>Registre uma nova venda de forma rapida e intuitiva.</p>
              </div>

              <div className="barber-sales-hero-meta">
                <BarberBadge tone="cash">{todaySalesCount} vendas hoje</BarberBadge>
                <BarberBadge tone="admin">{visibleServices.length} servicos ativos</BarberBadge>
              </div>

              <div className="barber-sales-steps">
                {['Itens', 'Pagamento', 'Finalizar'].map((step, index) => (
                  <div className={`barber-sales-step ${index === 0 ? 'active' : ''}`} key={step}>
                    <span>{index + 1}</span>
                    <strong>{step}</strong>
                  </div>
                ))}
              </div>
            </BarberCard>

            <BarberCard className="barber-sales-catalog-panel">
              <div className="barber-table-header">
                <div>
                  <h2>Catalogo interativo</h2>
                  <p>Toque em um servico ou produto real para montar a venda sem digitacao manual.</p>
                </div>
                <BarberButton onClick={addSaleItem} type="button" variant="secondary">
                  <BarberIcon name="plus" />
                  <span>Adicionar item</span>
                </BarberButton>
              </div>

              <div className="barber-sales-toolbar">
                <div className="barber-form-block barber-sales-search">
                  <label htmlFor="sales-search">Buscar</label>
                  <input className="barber-input" id="sales-search" onChange={(event) => setSaleCatalogSearch(event.target.value)} placeholder="Buscar servico ou produto..." value={saleCatalogSearch} />
                </div>

                <div className="barber-sales-filter-group" role="tablist" aria-label="Filtros do catalogo">
                  {[
                    { key: 'all', label: 'Todos' },
                    { key: 'service', label: 'Servicos' },
                    { key: 'product', label: 'Produtos' }
                  ].map((filter) => (
                    <button className={`barber-sales-filter ${saleCatalogFilter === filter.key ? 'active' : ''}`} key={filter.key} onClick={() => setSaleCatalogFilter(filter.key)} type="button">
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="barber-sales-inline-form">
                <div className="barber-form-block">
                  <label htmlFor="sale-quantity">Quantidade base</label>
                  <input className="barber-input" id="sale-quantity" min="1" name="quantity" onChange={updateSaleForm} step="1" type="number" value={saleForm.quantity} />
                </div>

                <div className="barber-sales-selection-chip">
                  <span>Selecionado agora</span>
                  <strong>{selectedSaleSource ? formatServiceName(selectedSaleSource.name) : 'Nenhum item selecionado'}</strong>
                  <small>
                    {selectedSaleSource
                      ? `${selectedSaleItemType === 'product' ? 'Produto' : 'Servico'} • ${money(selectedSaleSource.price ?? selectedSaleSource.sale_price ?? 0)}`
                      : 'Escolha um card para preparar a venda.'}
                  </small>
                </div>
              </div>

              {saleCatalogItems.length > 0 ? (
                <div className="barber-sales-catalog-grid">
                  {saleCatalogItems.map((item) => {
                    const isSelected = item.type === 'product'
                      ? saleForm.productId === item.id
                      : saleForm.serviceId === item.id

                    return (
                      <button className={`barber-sales-catalog-card ${isSelected ? 'selected' : ''}`} key={`${item.type}-${item.id}`} onClick={() => selectSaleCatalogItem(item)} type="button">
                        <span className="barber-sales-catalog-icon">
                          {item.type === 'product'
                            ? <BarberIcon name="product" />
                            : <ServiceIcon icon={item.icon} serviceName={item.name} />}
                        </span>
                        <div className="barber-sales-catalog-copy">
                          <div className="barber-sales-catalog-name">{formatServiceName(item.name)}</div>
                          <div className="barber-sales-catalog-type">
                            {item.type === 'product' ? item.category || 'Produto' : item.category === 'combo' ? 'Combo' : 'Serviço'}
                          </div>
                        </div>
                        <div className="barber-sales-catalog-meta">
                          <strong className="barber-sales-catalog-price">{money(item.price)}</strong>
                          <span className="barber-sales-catalog-add">+</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <BarberEmptyState
                  description="Nenhum servico ativo encontrado. Cadastre servicos para comecar a vender."
                  title="Catalogo vazio"
                />
              )}
            </BarberCard>

            <BarberCard className="barber-sales-items-panel">
              <div className="barber-table-header">
                <div>
                  <h2>Itens da venda</h2>
                  <p>Controle os itens adicionados, quantidade e subtotal antes de finalizar.</p>
                </div>
                <BarberBadge tone="admin">{saleItemsCount} item(ns)</BarberBadge>
              </div>

              {saleForm.items.length > 0 ? (
                <div className="barber-sales-items-list">
                  {saleForm.items.map((item) => (
                    <div className="barber-sales-item-row" key={item.key}>
                      <div className="barber-sales-item-main">
                        <span className="barber-sales-item-icon">
                          {item.itemType === 'product'
                            ? <BarberIcon name="product" />
                            : <ServiceIcon icon={item.icon} serviceName={item.name} />}
                        </span>
                        <div>
                          <strong>{item.name}</strong>
                          <span>{selectedCollaborator?.name || selectedCollaborator?.nickname || user?.name || 'Colaborador vinculado no envio'}</span>
                        </div>
                      </div>

                      <div className="barber-sales-item-qty">
                        <button onClick={() => updateSaleItemQuantity(item.key, -1)} type="button">-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateSaleItemQuantity(item.key, 1)} type="button">+</button>
                      </div>

                      <div className="barber-sales-item-values">
                        <strong>{money(item.totalPrice)}</strong>
                        <span>{money(item.unitPrice)} unitario</span>
                      </div>

                      <button className="barber-sales-item-remove" onClick={() => removeSaleItem(item.key)} type="button">
                        <BarberIcon name="trash" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <BarberEmptyState
                  description="Toque em um card do catalogo para adicionar servicos ou produtos reais na venda."
                  title="Nenhum item na venda"
                />
              )}
            </BarberCard>
          </section>

          <aside className="barber-sales-sidebar">
            <BarberCard className="barber-sales-summary-card">
              <div className="barber-panel-header">
                <div>
                  <h3>Resumo da venda</h3>
                  <p>Painel rapido para cliente, pagamento, troco e finalizacao.</p>
                </div>
                <BarberBadge tone="cash">{money(saleEffectiveTotal)}</BarberBadge>
              </div>

              <div className="barber-sales-summary-list">
                <div className="barber-sales-summary-row">
                  <span>Itens</span>
                  <strong>{saleItemsCount}</strong>
                </div>
                <div className="barber-sales-summary-row">
                  <span>Subtotal</span>
                  <strong>{money(saleEffectiveTotal)}</strong>
                </div>
                <div className="barber-sales-summary-row">
                  <span>Comissao</span>
                  <strong>{money(saleEffectiveCommission)}</strong>
                </div>
                <div className="barber-sales-summary-row">
                  <span>Total liquido</span>
                  <strong>{money(saleEffectiveNet)}</strong>
                </div>
              </div>

              {canManageCash ? (
                <div className="barber-form-block">
                  <label htmlFor="sale-collaborator">Colaborador</label>
                  <select className="barber-select" id="sale-collaborator" name="collaboratorId" onChange={updateSaleForm} value={saleForm.collaboratorId}>
                    <option value="">Selecione o colaborador</option>
                    {activeCollaborators.map((collaborator) => (
                      <option key={collaborator.id} value={collaborator.id}>
                        {collaborator.name || collaborator.nickname}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="barber-placeholder">
                  <strong>Venda vinculada ao seu usuario</strong>
                  <p>Como colaborador, a API associa o atendimento ao seu perfil automaticamente.</p>
                </div>
              )}

              <div className="barber-form-block">
                <label htmlFor="sale-client-name">Cliente</label>
                <input className="barber-input" id="sale-client-name" name="clientName" onChange={updateSaleForm} placeholder="Opcional" value={saleForm.clientName} />
              </div>

              <div className="barber-form-block">
                <label>Pagamento</label>
                <div className="barber-sales-payment-grid">
                  {paymentOptions.map((option) => (
                    <button
                      className={`barber-sales-payment-card ${saleForm.paymentMethod === option.value ? 'active' : ''}`}
                      key={option.value}
                      onClick={() => updateSaleForm({ target: { name: 'paymentMethod', value: option.value } })}
                      type="button"
                    >
                      <BarberIcon name={option.icon} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {isCashPayment && (
                <div className="barber-form-block">
                  <label htmlFor="sale-amount-received">Valor recebido</label>
                  <input className="barber-input" id="sale-amount-received" min={saleEffectiveTotal || 0} name="amountReceived" onChange={updateSaleForm} step="0.01" type="number" value={saleForm.amountReceived} />
                </div>
              )}

              <div className="barber-sales-summary-highlight">
                <span>Troco</span>
                <strong>{isCashPayment ? money(Math.max(0, saleChangeDue)) : money(0)}</strong>
              </div>

              <div className="barber-form-block">
                <label htmlFor="sale-notes">Observacoes</label>
                <textarea className="barber-textarea" id="sale-notes" name="notes" onChange={updateSaleForm} placeholder="Anotacoes da venda, observacoes do cliente ou detalhes do atendimento..." rows="4" value={saleForm.notes} />
              </div>

              {isCashPayment && saleForm.amountReceived && saleChangeDue < 0 && (
                <div className="barber-message barber-message-error">
                  Valor recebido menor que o total da venda.
                </div>
              )}

              <BarberButton className="barber-sales-submit" disabled={submittingSale} type="submit" variant="primary">
                <BarberIcon name="plus" />
                <span>{submittingSale ? 'Lancando venda...' : 'Finalizar venda'}</span>
              </BarberButton>
            </BarberCard>
          </aside>
        </form>

        <BarberCard className="barber-sales-recent-panel">
          <div className="barber-table-header">
            <div>
              <h2>Vendas recentes</h2>
              <p>Ultimas operacoes reais registradas no sistema, com pagamento e colaborador.</p>
            </div>
            <BarberBadge tone="admin">{sales.length} registros</BarberBadge>
          </div>

          {recentSales.length > 0 ? (
            <div className="barber-sales-recent-list">
              {recentSales.map((sale) => (
                <div className="barber-sales-recent-card" key={sale.id}>
                  <div className="barber-sales-recent-main">
                    <strong>{sale.service_name || sale.client_name || 'Venda registrada'}</strong>
                    <span>{sale.collaborator_name || 'Sem colaborador'} • {fullDate(sale.created_at)}</span>
                  </div>

                  <div className="barber-sales-recent-meta">
                    <BarberBadge tone={paymentTone(sale.payment_method)}>
                      {paymentLabel(sale.payment_method)}
                    </BarberBadge>
                    <strong>{money(sale.total_amount)}</strong>
                  </div>

                  {isAdmin ? (
                    <button className="barber-sales-recent-remove" onClick={() => startDeleteSale(sale.id)} type="button">
                      <BarberIcon name="trash" />
                    </button>
                  ) : (
                    <span className="barber-sales-recent-id">{String(sale.id).slice(0, 8)}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <BarberEmptyState
              description="Assim que a primeira venda for registrada, o historico aparece aqui automaticamente."
              title="Nenhuma venda registrada"
            />
          )}
        </BarberCard>
      </>
    )
  }

  function renderSales() {
    return renderSalesV2()
  }

  function RenderSalesLegacy() {
    return (
      <>
        <section className="barber-grid-two">
          <BarberCard>
            <div className="barber-panel-header">
              <div>
                <h3>Registrar nova venda</h3>
                <p>Monte uma venda com os servicos ativos da barbearia e mantenha o caixa sincronizado com dados reais.</p>
              </div>
              <BarberBadge tone="cash">{saleForm.items.length ? money(saleTotal) : 'Adicione itens'}</BarberBadge>
            </div>

            <form className="barber-panel-stack" onSubmit={createSale}>
              <div className="barber-form-grid">
                <div className="barber-form-block">
                  <label htmlFor="sale-service">Servico</label>
                  <select className="barber-select" id="sale-service" name="serviceId" onChange={updateSaleForm} value={saleForm.serviceId}>
                    <option value="">Selecione o servico</option>
                    {visibleServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {money(service.price)}
                      </option>
                    ))}
                  </select>
                </div>

                {canManageCash ? (
                  <div className="barber-form-block">
                    <label htmlFor="sale-collaborator">Colaborador</label>
                    <select className="barber-select" id="sale-collaborator" name="collaboratorId" onChange={updateSaleForm} value={saleForm.collaboratorId}>
                      <option value="">Selecione o colaborador</option>
                      {collaborators
                        .filter((collaborator) => collaborator.is_active && !collaborator.is_deleted)
                        .map((collaborator) => (
                          <option key={collaborator.id} value={collaborator.id}>
                            {collaborator.name || collaborator.nickname}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div className="barber-placeholder">
                    <strong>Venda vinculada ao seu usuario</strong>
                    <p>Como colaborador, a API ja garante que o registro fique associado ao seu perfil.</p>
                  </div>
                )}

                <div className="barber-form-block">
                  <label htmlFor="sale-quantity">Quantidade</label>
                  <input className="barber-input" id="sale-quantity" min="1" name="quantity" onChange={updateSaleForm} step="1" type="number" value={saleForm.quantity} />
                </div>

                <div className="barber-form-block">
                  <label htmlFor="sale-client-name">Cliente</label>
                  <input className="barber-input" id="sale-client-name" name="clientName" onChange={updateSaleForm} placeholder="Opcional" value={saleForm.clientName} />
                </div>

                <div className="barber-form-block">
                  <label htmlFor="payment-method">Pagamento</label>
                  <select className="barber-select" id="payment-method" name="paymentMethod" onChange={updateSaleForm} value={saleForm.paymentMethod}>
                    <option value="pix">Pix</option>
                    <option value="cash">Dinheiro</option>
                    <option value="credit">Credito</option>
                    <option value="debit">Debito</option>
                  </select>
                </div>

                {isCashPayment && (
                  <div className="barber-form-block">
                    <label htmlFor="sale-amount-received">Valor recebido</label>
                    <input className="barber-input" id="sale-amount-received" min={saleEffectiveTotal || 0} name="amountReceived" onChange={updateSaleForm} step="0.01" type="number" value={saleForm.amountReceived} />
                  </div>
                )}

                <div className="barber-form-block">
                  <label htmlFor="change-amount">Troco</label>
                  <input className="barber-input" id="change-amount" readOnly step="0.01" type="number" value={isCashPayment ? Math.max(0, saleChangeDue) : 0} />
                </div>

                <div className="barber-form-block barber-form-block-full">
                  <label htmlFor="sale-notes">Observacoes</label>
                  <textarea className="barber-textarea" id="sale-notes" name="notes" onChange={updateSaleForm} placeholder="Anotacoes da venda, observacoes do cliente ou detalhes do atendimento..." rows="4" value={saleForm.notes} />
                </div>
              </div>

              <div className="barber-inline-actions">
                <BarberButton onClick={addSaleItem} type="button" variant="secondary">
                  <BarberIcon name="plus" />
                  <span>Adicionar item</span>
                </BarberButton>
              </div>

              <BarberTable columns={['Tipo', 'Item', 'Qtd', 'Valor', 'Comissao', 'Liquido', 'Acoes']}>
                {saleForm.items.length > 0 ? (
                  saleForm.items.map((item) => (
                    <tr key={item.key}>
                      <td>Servico</td>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{money(item.totalPrice)}</td>
                      <td>{money(item.commissionAmount)}</td>
                      <td>{money(item.shopNetAmount)}</td>
                      <td>
                        <BarberButton onClick={() => removeSaleItem(item.key)} type="button" variant="danger">
                          Remover
                        </BarberButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">
                      <BarberEmptyState
                        description="Adicione servicos do catalogo para montar a venda."
                        title="Nenhum item na venda"
                      />
                    </td>
                  </tr>
                )}
              </BarberTable>

              <div className="barber-page-actions">
                <BarberButton disabled={submittingSale} type="submit" variant="primary">
                  <BarberIcon name="plus" />
                  <span>{submittingSale ? 'Lancando venda...' : 'Lancar venda do colaborador'}</span>
                </BarberButton>
                <div className="barber-placeholder" style={{ padding: 14 }}>
                  <strong>{saleForm.items.length ? `${saleForm.items.length} item(ns) na venda` : 'Resumo da venda'}</strong>
                  <p>
                    {saleForm.items.length
                      ? `${money(saleTotal)} bruto • ${money(saleCommissionTotal)} comissao • ${money(saleShopNetTotal)} liquido`
                      : 'Adicione itens para visualizar subtotal, comissao do colaborador e liquido da barbearia.'}
                    {selectedCollaborator ? ` • ${selectedCollaborator.nickname}` : ''}
                  </p>
                </div>
              </div>
            </form>
          </BarberCard>

          <BarberCard>
            <div className="barber-panel-header">
              <div>
                <h3>Resumo operacional</h3>
                <p>Indicadores rapidos para acompanhar conversao e mix de pagamento.</p>
              </div>
              <BarberButton onClick={() => loadData()} type="button" variant="ghost">
                <BarberIcon name="refresh" />
                <span>Atualizar</span>
              </BarberButton>
            </div>

            <div className="barber-summary-grid">
              <div className="barber-summary-item">
                <div>
                  <strong>Ticket medio estimado</strong>
                  <p>Media das ultimas 50 vendas carregadas</p>
                </div>
                <strong>
                  {money(
                    sales.length
                      ? sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) / sales.length
                      : 0
                  )}
                </strong>
              </div>
              <div className="barber-summary-item">
                <div>
                  <strong>Pagamento mais usado</strong>
                  <p>Canal dominante no periodo</p>
                </div>
                <strong>{paymentChartData.slice().sort((a, b) => b.value - a.value)[0]?.name || 'Sem dados'}</strong>
              </div>
              <div className="barber-summary-item">
                <div>
                  <strong>Vendas com colaborador</strong>
                  <p>Atendimentos associados a um profissional</p>
                </div>
                <strong>{sales.filter((sale) => sale.collaborator_name).length}</strong>
              </div>
              <div className="barber-summary-item">
                <div>
                  <strong>Catalogo ativo</strong>
                  <p>Servicos disponiveis para lancamento</p>
                </div>
                <strong>{visibleServices.length}</strong>
              </div>
            </div>

            <div className="barber-notes-list">
              <div className="barber-notes-item">
                <strong>Selecao sem digitacao manual</strong>
                <p>O seletor usa apenas servicos ativos da propria empresa para evitar erro de lancamento.</p>
              </div>
              <div className="barber-notes-item">
                <strong>Exclusao segura</strong>
                <p>Toda venda removida exige motivo e autenticacao por senha admin ou PIN.</p>
              </div>
            </div>
          </BarberCard>
        </section>

        <BarberCard>
          <div className="barber-table-header">
            <div>
              <h2>Lista de vendas</h2>
              <p>Visual moderno com badges de pagamento e acoes rapidas.</p>
            </div>
            <BarberBadge tone="admin">{sales.length} registros</BarberBadge>
          </div>

          <BarberTable columns={['Cliente', 'Servico', 'Valor', 'Pagamento', 'Colaborador', 'Data', 'Acoes']}>
            {sales.length > 0 ? (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <strong>{sale.notes ? 'Cliente informado nas observacoes' : 'Nao informado'}</strong>
                    <span>{sale.notes || 'Campo de cliente ainda nao faz parte da estrutura atual da venda.'}</span>
                  </td>
                  <td>
                      <strong>{sale.service_name || sale.client_name || 'Venda registrada'}</strong>
                    <span>{sale.client_name ? `Cliente ${sale.client_name}` : 'Itens salvos a partir do catalogo da venda.'}</span>
                  </td>
                  <td>
                    <strong>{money(sale.total_amount)}</strong>
                    <span>{sale.change_amount ? `Troco ${money(sale.change_amount)}` : 'Sem troco'}</span>
                  </td>
                  <td>
                    <BarberBadge tone={paymentTone(sale.payment_method)}>
                      {paymentLabel(sale.payment_method)}
                    </BarberBadge>
                  </td>
                  <td>{sale.collaborator_name || 'Sem colaborador'}</td>
                  <td>{fullDate(sale.created_at)}</td>
                  <td>
                    {isAdmin ? (
                      <div className="barber-inline-actions">
                        <BarberButton onClick={() => startDeleteSale(sale.id)} type="button" variant="danger">
                          <BarberIcon name="trash" />
                          <span>Deletar</span>
                        </BarberButton>
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">
                  <BarberEmptyState
                    description="Registre a primeira venda para preencher o historico desta tela."
                    title="Nenhuma venda registrada"
                  />
                </td>
              </tr>
            )}
          </BarberTable>
        </BarberCard>
      </>
    )
  }

  function renderCashier() {
    const grossTotal = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)
    const cashTotal = sales
      .filter((sale) => ['cash', 'dinheiro'].includes(sale.payment_method))
      .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)
    const pixTotal = sales
      .filter((sale) => sale.payment_method === 'pix')
      .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)
    const creditTotal = sales
      .filter((sale) => ['credit', 'credito'].includes(sale.payment_method))
      .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)
    const debitTotal = sales
      .filter((sale) => ['debit', 'debito'].includes(sale.payment_method))
      .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)

    return (
      <>
        <section className="barber-grid-two">
          <BarberCard>
            <div className="barber-panel-header">
              <div>
                <h3>Resumo financeiro</h3>
                <p>Consolidado das vendas reais retornadas pelos endpoints existentes.</p>
              </div>
              <div className="barber-inline-actions">
                <BarberBadge tone="cash">Somente dados reais</BarberBadge>
                <BarberButton onClick={() => {
                  setSaleForm(emptySale)
                  setSaleModalOpen(true)
                }} type="button" variant="primary">
                  <BarberIcon name="plus" />
                  <span>Nova venda</span>
                </BarberButton>
              </div>
            </div>

            <div className="barber-summary-grid">
              <div className="barber-summary-item">
                <div>
                  <strong>Bruto total</strong>
                  <p>Soma das vendas carregadas</p>
                </div>
                <strong>{money(grossTotal)}</strong>
              </div>
              <div className="barber-summary-item">
                <div>
                  <strong>Dinheiro</strong>
                  <p>Entradas em especie</p>
                </div>
                <strong>{money(cashTotal)}</strong>
              </div>
              <div className="barber-summary-item">
                <div>
                  <strong>Pix</strong>
                  <p>Recebimentos instantaneos</p>
                </div>
                <strong>{money(pixTotal)}</strong>
              </div>
              <div className="barber-summary-item">
                <div>
                  <strong>Credito / Debito</strong>
                  <p>Cartoes no periodo</p>
                </div>
                <strong>{money(creditTotal + debitTotal)}</strong>
              </div>
              <div className="barber-summary-item">
                <div>
                  <strong>Total de vendas</strong>
                  <p>Registros retornados pela API</p>
                </div>
                <strong>{sales.length}</strong>
              </div>
              <div className="barber-summary-item">
                <div>
                  <strong>Comissoes</strong>
                  <p>Resumo do dashboard</p>
                </div>
                <strong>{money(dashboard.totalCommissions)}</strong>
              </div>
            </div>
          </BarberCard>

          <BarberCard>
            <div className="barber-chart-header">
              <div>
                <h2>Mix de pagamentos</h2>
                <p>Distribuicao baseada apenas em vendas reais.</p>
              </div>
              <BarberButton onClick={() => loadData()} type="button" variant="ghost">
                Atualizar dados
              </BarberButton>
            </div>

            <div className="barber-chart-body">
              <div style={{ width: '100%', minHeight: 300, height: 300 }}>
                {paymentChartData.some((entry) => entry.value > 0) ? (
                  <ResponsiveContainer debounce={50} height="100%" minHeight={300} minWidth={280} width="100%">
                    <BarChart data={paymentChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid stroke="rgba(148, 163, 184, 0.08)" horizontal={false} />
                      <XAxis type="number" stroke="#7d8c9b" tickFormatter={(value) => `R$${Math.round(value)}`} />
                      <YAxis dataKey="name" type="category" stroke="#7d8c9b" width={96} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="value" radius={[12, 12, 12, 12]}>
                        {paymentChartData.map((entry) => (
                          <Cell fill={entry.fill} key={entry.name} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <BarberEmptyState
                    description="Assim que houver vendas reais, o mix de pagamentos aparece aqui."
                    title="Sem dados de pagamento"
                  />
                )}
              </div>
            </div>
          </BarberCard>
        </section>

        <BarberCard>
          <div className="barber-table-header">
            <div>
              <h2>Movimentacoes recentes</h2>
              <p>Historico financeiro usando somente o endpoint de vendas.</p>
            </div>
            <BarberBadge tone="admin">{sales.length} registros</BarberBadge>
          </div>

          <BarberTable columns={['Data', 'Servico', 'Colaborador', 'Pagamento', 'Valor']}>
            {sales.length > 0 ? (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{fullDate(sale.created_at)}</td>
                  <td>
                    <strong>{sale.service_name || sale.client_name || 'Venda registrada'}</strong>
                    <span>{sale.notes || 'Registro vindo do endpoint real de vendas.'}</span>
                  </td>
                  <td>{sale.collaborator_name || 'Sem colaborador'}</td>
                  <td>
                    <BarberBadge tone={paymentTone(sale.payment_method)}>
                      {paymentLabel(sale.payment_method)}
                    </BarberBadge>
                  </td>
                  <td>{money(sale.total_amount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">
                  <BarberEmptyState
                    description="Sem chamadas para /cash/*, usando apenas os dados reais de vendas."
                    title="Nenhuma movimentacao encontrada"
                  />
                </td>
              </tr>
            )}
          </BarberTable>
        </BarberCard>
      </>
    )
  }

  function renderTeam() {
    const financialSummary = visibleCollaboratorFinancialSummary
    const selectedPeriodLabel = {
      today: 'Hoje',
      week: 'Semana',
      month: 'Mes',
      custom: 'Periodo personalizado'
    }[collaboratorFinancialFilters.period] || 'Mes'

    return (
      <>
        <BarberCard>
          <div className="barber-panel-header">
            <div>
              <h3>{isAdmin ? 'Colaboradores' : 'Seu resumo financeiro'}</h3>
              <p>
                {isAdmin
                  ? 'Gerencie sua equipe, comissoes e desempenho individual.'
                  : 'Acompanhe apenas seu bruto gerado, comissao, vales e liquido a receber.'}
              </p>
            </div>
            <BarberBadge tone="admin">{selectedPeriodLabel}</BarberBadge>
          </div>

          <div className="barber-toolbar">
            <div className="barber-form-block">
              <label htmlFor="collaborator-financial-period">Periodo</label>
              <select
                className="barber-select"
                id="collaborator-financial-period"
                name="period"
                onChange={updateCollaboratorFinancialFilters}
                value={collaboratorFinancialFilters.period}
              >
                <option value="today">Hoje</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {collaboratorFinancialFilters.period === 'custom' && (
              <>
                <div className="barber-form-block">
                  <label htmlFor="collaborator-financial-start">Inicio</label>
                  <input
                    className="barber-input"
                    id="collaborator-financial-start"
                    name="startDate"
                    onChange={updateCollaboratorFinancialFilters}
                    type="date"
                    value={collaboratorFinancialFilters.startDate}
                  />
                </div>
                <div className="barber-form-block">
                  <label htmlFor="collaborator-financial-end">Fim</label>
                  <input
                    className="barber-input"
                    id="collaborator-financial-end"
                    name="endDate"
                    onChange={updateCollaboratorFinancialFilters}
                    type="date"
                    value={collaboratorFinancialFilters.endDate}
                  />
                </div>
              </>
            )}
          </div>
        </BarberCard>

        <section className="barber-collaborator-grid">
          {financialSummary.length > 0 ? (
            financialSummary.map((collaborator, index) => {
              const collaboratorRecord = collaborators.find((item) => item.id === collaborator.collaborator_id) || {}

              return (
                <BarberCard className="barber-collaborator-card" key={collaborator.collaborator_id || collaborator.collaborator_name}>
                  <div className="barber-collaborator-top">
                    <div className="barber-collaborator-heading">
                      <CollaboratorAvatar
                        avatarUrl={collaboratorRecord.avatar_url || collaborator.avatar_url}
                        name={collaboratorRecord.name || collaborator.collaborator_name}
                        size="md"
                      />
                      <div>
                        <h3>{collaborator.collaborator_name}</h3>
                        <p>
                          {collaborator.commission_type === 'fixed'
                            ? `Comissao fixa de ${money(collaborator.commission_rate)}`
                            : `${collaborator.commission_rate}% de comissao cadastrada`}
                        </p>
                      </div>
                    </div>
                    <div className="barber-collaborator-top-badges">
                      {isAdmin && (
                        <BarberBadge tone={index === 0 ? 'permuta' : 'admin'}>
                          #{index + 1}
                        </BarberBadge>
                      )}
                      {isAdmin && (
                        <BarberBadge tone={collaborator.is_active ? 'success' : 'danger'}>
                          {collaborator.is_active ? 'Ativo' : 'Inativo'}
                        </BarberBadge>
                      )}
                    </div>
                  </div>
                  <div className="barber-collaborator-stats">
                    <div>
                      <span>Faturamento bruto</span>
                      <strong>{money(collaborator.gross_revenue)}</strong>
                    </div>
                    <div>
                      <span>Comissao gerada</span>
                      <strong>{money(collaborator.commission_total)}</strong>
                    </div>
                    <div>
                      <span>Adiantamentos</span>
                      <strong>{money(collaborator.advances_total)}</strong>
                    </div>
                    <div>
                      <span>Liquido a receber</span>
                      <strong>{money(collaborator.net_to_receive)}</strong>
                    </div>
                    <div>
                      <span>Atendimentos</span>
                      <strong>{collaborator.sales_count || 0}</strong>
                    </div>
                    <div>
                      <span>Ultima venda</span>
                      <strong>{collaborator.last_sale_at ? fullDate(collaborator.last_sale_at) : '-'}</strong>
                    </div>
                  </div>
                  {Number(collaborator.sales_count || 0) === 0 && (
                    <p className="barber-inline-hint">Este colaborador ainda nao gerou vendas no periodo.</p>
                  )}
                  <div className="barber-inline-actions">
                    <BarberButton onClick={() => openCollaboratorSummary(collaborator.collaborator_id)} type="button" variant="secondary">
                      Ver resumo
                    </BarberButton>
                    {isAdmin && (
                      <BarberButton onClick={() => editCollaborator(collaborator.collaborator_id)} type="button" variant="ghost">
                        Editar
                      </BarberButton>
                    )}
                    {isAdmin && (
                      <BarberButton
                        onClick={() => {
                          setAdvanceForm((current) => ({ ...current, collaboratorId: collaborator.collaborator_id }))
                          navigateView('cashier')
                        }}
                        type="button"
                        variant="ghost"
                      >
                        Registrar adiantamento
                      </BarberButton>
                    )}
                  </div>
                </BarberCard>
            )})
          ) : (
            <BarberCard className="barber-collaborator-card">
              <BarberEmptyState
                description={isAdmin
                  ? 'Nenhum colaborador cadastrado ainda.'
                  : 'Seu resumo financeiro aparecera aqui assim que houver vendas reais no periodo.'}
                title={isAdmin ? 'Nenhum colaborador cadastrado' : 'Sem resumo financeiro'}
              />
              {isAdmin && (
                <div className="barber-inline-actions">
                  <BarberButton onClick={openCollaboratorCreateModal} type="button" variant="primary">
                    Adicionar primeiro colaborador
                  </BarberButton>
                </div>
              )}
            </BarberCard>
          )}
        </section>

        <section className="barber-grid-two">
          <BarberCard>
            <div className="barber-panel-header">
              <div>
                <h3>{isAdmin ? 'Equipe cadastrada' : 'Seu resumo profissional'}</h3>
                <p>{isAdmin ? 'Lista operacional da equipe com acesso rapido para editar e acompanhar desempenho.' : 'Seus indicadores individuais com base nas vendas reais do periodo.'}</p>
              </div>
            </div>

            {isAdmin ? (
              <BarberTable columns={['Nome', 'Contato', 'Comissao', 'Permissoes', 'Ranking', 'Status', 'Acoes']}>
                {collaborators.length > 0 ? (
                  collaborators.map((collaborator) => {
                    const rank = financialSummary.findIndex(
                      (item) => item.collaborator_id === collaborator.id
                    )

                    return (
                      <tr key={collaborator.id}>
                        <td>
                          <div className="barber-collaborator-row">
                            <CollaboratorAvatar
                              avatarUrl={collaborator.avatar_url}
                              name={collaboratorDisplayName(collaborator)}
                              size="sm"
                            />
                            <div>
                              <strong>{collaborator.name || collaborator.nickname}</strong>
                              <span>{collaborator.email || 'Sem email'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong>{collaborator.phone || '-'}</strong>
                          <span>{collaborator.role || 'collaborator'}</span>
                        </td>
                        <td>
                          {collaborator.commission_type === 'fixed'
                            ? money(collaborator.commission_rate)
                            : `${collaborator.commission_rate}%`}
                        </td>
                        <td>
                          <div className="barber-status-grid">
                            <BarberBadge tone={collaborator.can_view_own_dashboard ? 'success' : 'danger'}>
                              Dashboard
                            </BarberBadge>
                            <BarberBadge tone={collaborator.can_view_own_reports ? 'pix' : 'danger'}>
                              Relatorio
                            </BarberBadge>
                            <BarberBadge tone={collaborator.can_launch_sales ? 'permuta' : 'danger'}>
                              Vendas
                            </BarberBadge>
                          </div>
                        </td>
                        <td>{rank >= 0 ? `#${rank + 1}` : '-'}</td>
                        <td>
                          <BarberBadge tone={collaborator.is_active ? 'success' : 'danger'}>
                            {collaborator.is_active ? 'Ativo' : 'Inativo'}
                          </BarberBadge>
                        </td>
                        <td>
                          <div className="barber-inline-actions">
                            <BarberButton onClick={() => openCollaboratorSummary(collaborator.id)} type="button" variant="secondary">
                              Ver resumo
                            </BarberButton>
                            <BarberButton onClick={() => editCollaborator(collaborator.id)} type="button" variant="ghost">
                              Editar
                            </BarberButton>
                            <BarberButton
                              onClick={() => toggleCollaboratorStatus(collaborator)}
                              type="button"
                              variant={collaborator.is_active ? 'secondary' : 'primary'}
                            >
                              {collaborator.is_active ? 'Desativar' : 'Ativar'}
                            </BarberButton>
                            <BarberButton
                              onClick={() => saveCollaboratorPermissions(collaborator.id, {
                                canLaunchSales: !collaborator.can_launch_sales,
                                canViewOwnDashboard: collaborator.can_view_own_dashboard,
                                canViewOwnReports: collaborator.can_view_own_reports
                              })}
                              type="button"
                              variant="ghost"
                            >
                              {collaborator.can_launch_sales ? 'Bloquear vendas' : 'Liberar vendas'}
                            </BarberButton>
                            <BarberButton
                              onClick={() => {
                                setAdvanceForm((current) => ({ ...current, collaboratorId: collaborator.id }))
                                navigateView('cashier')
                              }}
                              type="button"
                              variant="ghost"
                            >
                              Registrar adiantamento
                            </BarberButton>
                            <BarberButton onClick={() => removeCollaborator(collaborator.id)} type="button" variant="danger">
                              Excluir
                            </BarberButton>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="7">
                      <BarberEmptyState
                        description="Cadastre colaboradores para montar o ranking e a distribuicao das comissoes."
                        title="Nenhum colaborador cadastrado"
                      />
                    </td>
                  </tr>
                )}
              </BarberTable>
              ) : (
              currentCollaboratorFinancialSummary ? (
                <>
                  <div className="barber-summary-grid">
                    <div className="barber-summary-item">
                      <div>
                        <strong>Faturamento bruto</strong>
                        <p>Total vendido por voce no periodo</p>
                      </div>
                      <strong>{money(currentCollaboratorFinancialSummary.gross_revenue)}</strong>
                    </div>
                    <div className="barber-summary-item">
                      <div>
                        <strong>Comissao gerada</strong>
                        <p>Total real da sua comissao</p>
                      </div>
                      <strong>{money(currentCollaboratorFinancialSummary.commission_total)}</strong>
                    </div>
                    <div className="barber-summary-item">
                      <div>
                        <strong>Adiantamentos</strong>
                        <p>Somente vales aprovados ou liquidados</p>
                      </div>
                      <strong>{money(currentCollaboratorFinancialSummary.advances_total)}</strong>
                    </div>
                    <div className="barber-summary-item">
                      <div>
                        <strong>Liquido a receber</strong>
                        <p>Comissao menos adiantamentos</p>
                      </div>
                      <strong>{money(currentCollaboratorFinancialSummary.net_to_receive)}</strong>
                    </div>
                  </div>
                  <div className="barber-inline-actions">
                    <BarberButton onClick={() => openCollaboratorSummary(currentCollaboratorFinancialSummary.collaborator_id)} type="button" variant="secondary">
                      Ver resumo
                    </BarberButton>
                  </div>
                </>
              ) : (
                <BarberEmptyState
                  description="Seu resumo financeiro aparecera aqui assim que houver vendas reais no periodo."
                  title="Sem dados financeiros"
                />
              )
            )}
          </BarberCard>
        </section>
      </>
    )
  }

  function renderReports() {
    if (!isAdmin) {
      return (
        <>
          <section className="barber-report-grid">
            <BarberCard>
              <div className="barber-panel-header">
                <div>
                  <h3>Meu relatorio</h3>
                  <p>Resumo apenas dos seus atendimentos, comissoes e adiantamentos.</p>
                </div>
              </div>

              <div className="barber-summary-grid">
                <div className="barber-summary-item">
                  <div>
                    <strong>Atendimentos</strong>
                    <p>Total no periodo carregado</p>
                  </div>
                  <strong>{personalReport.totals?.attendances || 0}</strong>
                </div>
                <div className="barber-summary-item">
                  <div>
                    <strong>Comissao acumulada</strong>
                    <p>Total das suas comissoes</p>
                  </div>
                  <strong>{money(personalReport.totals?.totalCommission)}</strong>
                </div>
                <div className="barber-summary-item">
                  <div>
                    <strong>Adiantamentos</strong>
                    <p>Somente valores do seu historico</p>
                  </div>
                  <strong>{money(personalReport.totals?.totalAdvances)}</strong>
                </div>
                <div className="barber-summary-item">
                  <div>
                    <strong>Liquido previsto</strong>
                    <p>Comissao menos adiantamentos</p>
                  </div>
                  <strong>{money(personalReport.totals?.netCommission)}</strong>
                </div>
              </div>
            </BarberCard>

            <BarberCard>
              <div className="barber-panel-header">
                <div>
                  <h3>Meus fechamentos</h3>
                  <p>Historico pessoal de pagamentos ja fechados.</p>
                </div>
                <BarberBadge tone="admin">{settlements.length} registros</BarberBadge>
              </div>

              <BarberTable columns={['Data', 'Comissao', 'Vales', 'Liquido pago', 'Periodo']}>
                {settlements.length > 0 ? (
                  settlements.map((settlement) => (
                    <tr key={settlement.id}>
                      <td>{fullDate(settlement.created_at)}</td>
                      <td>{money(settlement.total_commission)}</td>
                      <td>{money(settlement.total_advances)}</td>
                      <td>{money(settlement.net_amount)}</td>
                      <td>
                        {settlement.period_start
                          ? `${shortDate(settlement.period_start)} ate ${shortDate(settlement.period_end)}`
                          : 'Inicio ate fechamento'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">
                      <BarberEmptyState
                        description="Seus fechamentos aparecerao aqui quando forem registrados pelo admin."
                        title="Nenhum fechamento disponivel"
                      />
                    </td>
                  </tr>
                )}
              </BarberTable>
            </BarberCard>
          </section>

          <BarberCard>
            <div className="barber-table-header">
              <div>
                <h2>Meus atendimentos</h2>
                <p>Lista pessoal de atendimentos retornada pelo seu relatorio.</p>
              </div>
              <BarberBadge tone="pix">{personalReport.sales?.length || 0} registros</BarberBadge>
            </div>

            <BarberTable columns={['Data', 'Servico', 'Comissao', 'Observacoes']}>
              {personalReport.sales?.length > 0 ? (
                personalReport.sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{fullDate(sale.created_at)}</td>
                    <td>
                      <strong>{sale.service_name || 'Atendimento registrado'}</strong>
                      <span>{shortDate(sale.sale_date_local)}</span>
                    </td>
                    <td>{money(sale.commission_amount)}</td>
                    <td>{sale.client_name || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">
                    <BarberEmptyState
                      description="Seu historico pessoal aparecera aqui assim que houver atendimentos no periodo."
                      title="Nenhum atendimento encontrado"
                    />
                  </td>
                </tr>
              )}
            </BarberTable>
          </BarberCard>
        </>
      )
    }

    return (
      <>
        <section className="barber-report-grid">
          <BarberCard>
            <div className="barber-panel-header">
              <div>
                <h3>Catalogo em numeros</h3>
                <p>Visao consolidada do cadastro de servicos desta barbearia.</p>
              </div>
            </div>

            <div className="barber-summary-grid">
              <div className="barber-summary-item">
                <div>
                  <strong>Total de servicos</strong>
                  <p>Itens cadastrados e nao excluidos</p>
                </div>
                <strong>{services.length}</strong>
              </div>
              <div className="barber-summary-item">
                <div>
                  <strong>Servicos ativos</strong>
                  <p>Disponiveis no lancamento de venda</p>
                </div>
                <strong>{visibleServices.length}</strong>
              </div>
              <div className="barber-summary-item">
                <div>
                  <strong>Tempo medio do catalogo</strong>
                  <p>Media dos servicos com tempo informado</p>
                </div>
                <strong>
                  {services.filter((service) => service.estimated_time_minutes).length
                    ? `${Math.round(
                      services
                        .filter((service) => service.estimated_time_minutes)
                        .reduce((sum, service) => sum + Number(service.estimated_time_minutes || 0), 0)
                      / services.filter((service) => service.estimated_time_minutes).length
                    )} min`
                    : '-'}
                </strong>
              </div>
              {isAdmin && (
                <div className="barber-summary-item">
                  <div>
                    <strong>Total de produtos</strong>
                    <p>Catalogo disponivel para revenda futura</p>
                  </div>
                  <strong>{products.length}</strong>
                </div>
              )}
              {isAdmin && (
                <div className="barber-summary-item">
                  <div>
                    <strong>Estoque baixo</strong>
                    <p>Produtos que pedem reposicao imediata</p>
                  </div>
                  <strong>{lowStockProducts.length}</strong>
                </div>
              )}
            </div>
          </BarberCard>

          <BarberCard>
            <div className="barber-panel-header">
              <div>
                <h3>Fechamentos anteriores</h3>
                <p>Historico consolidado para auditoria e conferencia de pagamentos.</p>
              </div>
              <BarberBadge tone="admin">{settlements.length} registros</BarberBadge>
            </div>

            <BarberTable columns={['Data', 'Colaborador', 'Vendas', 'Comissao', 'Vales', 'Liquido pago']}>
              {settlements.length > 0 ? (
                settlements.slice(0, 6).map((settlement) => (
                  <tr key={settlement.id}>
                    <td>{fullDate(settlement.created_at)}</td>
                    <td>{settlement.collaborator_name}</td>
                    <td>{money(settlement.total_sales)}</td>
                    <td>{money(settlement.total_commission)}</td>
                    <td>{money(settlement.total_advances)}</td>
                    <td>{money(settlement.net_amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <BarberEmptyState
                      description="Os fechamentos registrados pelo admin aparecerao aqui automaticamente."
                      title="Nenhum fechamento disponivel"
                    />
                  </td>
                </tr>
              )}
            </BarberTable>
          </BarberCard>
        </section>

        <BarberCard>
          <div className="barber-table-header">
            <div>
              <h2>{isAdmin ? 'Fechamentos anteriores' : 'Meus fechamentos'}</h2>
              <p>Historico consolidado para auditoria e conferencia de pagamentos.</p>
            </div>
            <BarberBadge tone="admin">{settlements.length} registros</BarberBadge>
          </div>

          <BarberTable columns={['Data', 'Colaborador', 'Vendas', 'Comissao', 'Vales', 'Liquido pago']}>
            {settlements.length > 0 ? (
              settlements.map((settlement) => (
                <tr key={settlement.id}>
                  <td>{fullDate(settlement.created_at)}</td>
                  <td>{settlement.collaborator_name}</td>
                  <td>{money(settlement.total_sales)}</td>
                  <td>{money(settlement.total_commission)}</td>
                  <td>{money(settlement.total_advances)}</td>
                  <td>
                    <strong>{money(settlement.net_amount)}</strong>
                    <span>
                      {settlement.period_start
                        ? `${shortDate(settlement.period_start)} ate ${shortDate(settlement.period_end)}`
                        : 'Inicio ate fechamento'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">
                  <BarberEmptyState
                    description="Os fechamentos registrados pelo admin aparecerao aqui automaticamente."
                    title="Nenhum fechamento disponivel"
                  />
                </td>
              </tr>
            )}
          </BarberTable>
        </BarberCard>
      </>
    )
  }

  function renderActiveView() {
    if (loading) {
      return (
        <BarberCard>
          <p>Carregando BarberGestor...</p>
        </BarberCard>
      )
    }

    if (!isAdmin && currentView === 'dashboard' && user?.can_view_own_dashboard === false) {
      return (
        <BarberCard>
          <BarberEmptyState
            description="O admin da barbearia desativou o acesso ao seu dashboard proprio."
            title="Dashboard indisponivel"
          />
        </BarberCard>
      )
    }

    if (!isAdmin && currentView === 'sales' && !user?.can_launch_sales) {
      return (
        <BarberCard>
          <BarberEmptyState
            description="O lancamento de vendas pelo celular precisa ser liberado pelo admin."
            title="Lancamento de vendas indisponivel"
          />
        </BarberCard>
      )
    }

    if (!isAdmin && currentView === 'products') {
      return (
        <BarberCard>
          <BarberEmptyState
            description="O catalogo de produtos fica disponivel apenas para perfis gestores da barbearia."
            title="Produtos indisponiveis"
          />
        </BarberCard>
      )
    }

    if (!isAdmin && currentView === 'appointments') {
      return (
        <BarberCard>
          <BarberEmptyState
            description="A area interna de agendamentos fica disponivel apenas para a equipe de gestao."
            title="Agendamentos indisponiveis"
          />
        </BarberCard>
      )
    }

    if (!isAdmin && currentView === 'customers') {
      return (
        <BarberCard>
          <BarberEmptyState
            description="A base de clientes online fica disponivel apenas para perfis gestores da barbearia."
            title="Clientes indisponiveis"
          />
        </BarberCard>
      )
    }

    if (!canManageCash && currentView === 'cashier') {
      return (
        <BarberCard>
          <BarberEmptyState
            description="O caixa geral da barbearia fica visivel apenas para perfis autorizados."
            title="Caixa indisponivel"
          />
        </BarberCard>
      )
    }

    if (!isAdmin && currentView === 'reports' && user?.can_view_own_reports === false) {
      return (
        <BarberCard>
          <BarberEmptyState
            description="O admin da barbearia desativou o acesso ao seu relatorio pessoal."
            title="Relatorio indisponivel"
          />
        </BarberCard>
      )
    }

    switch (currentView) {
      case 'appointments':
        return renderAppointments()
      case 'customers':
        return <ClientesBarber />
      case 'services':
        return renderServices()
      case 'products':
        return renderProducts()
      case 'sales':
        return renderSales()
      case 'cashier':
        return renderCashier()
      case 'team':
        return renderTeam()
      case 'reports':
        return renderReports()
      default:
        return renderDashboard()
    }
  }

  return (
    <>
      <BarberLayout
        activeLabel={meta.label}
        activeView={currentView}
        isAdmin={isAdmin}
        modulesCount={modules.length}
        onLogout={handleLogout}
        onNavigate={navigateView}
        onSwitchModule={() => navigate('/select-module')}
        title={meta.title}
        user={user}
      >
        <section className="barber-page">
          <header className="barber-page-hero">
            <div>
              <span className="barber-overline">{isAdmin ? 'Modo gestor' : 'Modo colaborador'}</span>
              <h1>{currentView === 'dashboard' ? 'BarberGestor' : meta.label}</h1>
              <p>{meta.description}</p>
            </div>

            <div className="barber-page-actions">
              {currentView === 'team' && isAdmin && (
                <BarberButton onClick={openCollaboratorCreateModal} type="button" variant="primary">
                  <BarberIcon name="plus" />
                  <span>Adicionar colaborador</span>
                </BarberButton>
              )}
              <BarberButton onClick={() => loadData()} type="button" variant="ghost">
                <BarberIcon name="refresh" />
                <span>Atualizar dados</span>
              </BarberButton>
              {modules.length > 1 && (
                <BarberButton onClick={() => navigate('/select-module')} type="button" variant="secondary">
                  <BarberIcon name="switch" />
                  <span>Trocar modulo</span>
                </BarberButton>
              )}
            </div>
          </header>

          {error && <div className="barber-message barber-message-error">{error}</div>}
          {success && <div className="barber-message barber-message-success">{success}</div>}

          {renderActiveView()}
        </section>
      </BarberLayout>

      <BarberModal
        onClose={closeCollaboratorModal}
        open={collaboratorModalOpen}
        subtitle="Cadastro com login proprio, permissoes de acesso e controle de lancamento pelo celular."
        title={isEditingCollaborator ? 'Editar colaborador' : 'Novo colaborador'}
      >
        <div className="barber-modal-content">
          <form className="barber-panel-stack" onSubmit={createCollaborator}>
            <div className="barber-avatar-upload">
              <CollaboratorAvatar
                avatarUrl={collaboratorForm.avatarDataUrl || collaboratorForm.avatarUrl}
                name={collaboratorForm.name || 'Colaborador'}
                selected={Boolean(collaboratorForm.avatarDataUrl || collaboratorForm.avatarUrl)}
                size="xl"
              />
              <div className="barber-avatar-upload-copy">
                <strong>Foto do colaborador</strong>
                <p>Essa foto aparecera na agenda publica para seus clientes escolherem o profissional.</p>
                <div className="barber-avatar-upload-actions">
                  <label className="barber-button barber-button-ghost" htmlFor="collaborator-avatar-input">
                    {collaboratorForm.avatarDataUrl || collaboratorForm.avatarUrl ? 'Trocar foto' : 'Adicionar foto'}
                  </label>
                  {(collaboratorForm.avatarDataUrl || collaboratorForm.avatarUrl) && (
                    <BarberButton onClick={removeCollaboratorAvatarPreview} type="button" variant="ghost">
                      Remover
                    </BarberButton>
                  )}
                </div>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="barber-avatar-upload-input"
                  id="collaborator-avatar-input"
                  onChange={updateCollaboratorAvatar}
                  type="file"
                />
                <small className="barber-form-hint">Formatos aceitos: JPG, PNG e WEBP com ate 2MB.</small>
              </div>
            </div>
            <div className="barber-form-grid">
              <div className="barber-form-block">
                <label htmlFor="collaborator-name">Nome</label>
                <input
                  className="barber-input"
                  id="collaborator-name"
                  name="name"
                  onChange={updateCollaboratorForm}
                  required
                  value={collaboratorForm.name}
                />
              </div>
              <div className="barber-form-block">
                <label htmlFor="collaborator-email">Email</label>
                <input
                  className="barber-input"
                  id="collaborator-email"
                  name="email"
                  onChange={updateCollaboratorForm}
                  required
                  type="email"
                  value={collaboratorForm.email}
                />
              </div>
              <div className="barber-form-block">
                <label htmlFor="collaborator-password">Senha inicial {isEditingCollaborator ? '(opcional)' : ''}</label>
                <input
                  className="barber-input"
                  id="collaborator-password"
                  name="password"
                  onChange={updateCollaboratorForm}
                  required={!isEditingCollaborator}
                  type="password"
                  value={collaboratorForm.password}
                />
              </div>
              <div className="barber-form-block">
                <label htmlFor="collaborator-phone">Telefone</label>
                <input
                  className="barber-input"
                  id="collaborator-phone"
                  name="phone"
                  onChange={updateCollaboratorForm}
                  value={collaboratorForm.phone}
                />
              </div>
              <div className="barber-form-block">
                <label htmlFor="collaborator-commission-type">Tipo de comissao</label>
                <select
                  className="barber-select"
                  id="collaborator-commission-type"
                  name="commissionType"
                  onChange={updateCollaboratorForm}
                  value={collaboratorForm.commissionType}
                >
                  <option value="percentage">Percentual</option>
                  <option value="fixed">Valor fixo</option>
                </select>
              </div>
              <div className="barber-form-block">
                <label htmlFor="commission-rate">Comissao</label>
                <input
                  className="barber-input"
                  id="commission-rate"
                  min="0"
                  name="commissionRate"
                  onChange={updateCollaboratorForm}
                  step="0.01"
                  type="number"
                  value={collaboratorForm.commissionRate}
                />
              </div>
              <div className="barber-form-block">
                <label htmlFor="collaborator-status">Status</label>
                <select
                  className="barber-select"
                  id="collaborator-status"
                  name="isActive"
                  onChange={updateCollaboratorForm}
                  value={String(collaboratorForm.isActive)}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
              <div className="barber-form-block barber-form-block-full">
                <label>Agenda publica</label>
                <label className="barber-permission-item">
                  <input
                    checked={collaboratorForm.availableForBooking}
                    name="availableForBooking"
                    onChange={updateCollaboratorForm}
                    type="checkbox"
                  />
                  <span>
                    Disponivel para agendamentos
                    <small className="barber-form-hint">Quando ativado, este colaborador aparece no link publico de agendamento da barbearia.</small>
                  </span>
                </label>
              </div>
              <div className="barber-form-block barber-form-block-full">
                <label>Permissoes</label>
                <div className="barber-permission-list">
                  <label className="barber-permission-item">
                    <input
                      checked={collaboratorForm.canViewOwnDashboard}
                      name="canViewOwnDashboard"
                      onChange={updateCollaboratorForm}
                      type="checkbox"
                    />
                    <span>Pode acessar dashboard proprio</span>
                  </label>
                  <label className="barber-permission-item">
                    <input
                      checked={collaboratorForm.canViewOwnReports}
                      name="canViewOwnReports"
                      onChange={updateCollaboratorForm}
                      type="checkbox"
                    />
                    <span>Pode visualizar relatorio pessoal</span>
                  </label>
                  <label className="barber-permission-item">
                    <input
                      checked={collaboratorForm.canLaunchSales}
                      name="canLaunchSales"
                      onChange={updateCollaboratorForm}
                      type="checkbox"
                    />
                    <span>Pode lancar vendas pelo celular</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="barber-modal-actions">
              <BarberButton onClick={closeCollaboratorModal} type="button" variant="ghost">
                Cancelar
              </BarberButton>
              <BarberButton type="submit" variant="primary">
                <BarberIcon name="plus" />
                <span>{isEditingCollaborator ? 'Salvar colaborador' : 'Salvar colaborador'}</span>
              </BarberButton>
            </div>
          </form>
        </div>
      </BarberModal>

      <BarberModal
        onClose={closeCollaboratorSummary}
        open={Boolean(collaboratorSummaryId)}
        subtitle={collaboratorSummaryTarget ? `Resumo financeiro de ${collaboratorSummaryTarget.collaborator_name} no periodo selecionado.` : ''}
        title={collaboratorSummaryTarget ? `Resumo de ${collaboratorSummaryTarget.collaborator_name}` : 'Resumo do colaborador'}
      >
        <div className="barber-modal-content">
          {collaboratorSummaryTarget ? (
            <>
              <div className="barber-summary-grid">
                <div className="barber-summary-item">
                  <div>
                    <strong>Faturamento bruto</strong>
                    <p>Total vendido no periodo</p>
                  </div>
                  <strong>{money(collaboratorSummaryTarget.gross_revenue)}</strong>
                </div>
                <div className="barber-summary-item">
                  <div>
                    <strong>Comissao gerada</strong>
                    <p>Com base nas vendas reais</p>
                  </div>
                  <strong>{money(collaboratorSummaryTarget.commission_total)}</strong>
                </div>
                <div className="barber-summary-item">
                  <div>
                    <strong>Adiantamentos</strong>
                    <p>Vales aprovados ou liquidados</p>
                  </div>
                  <strong>{money(collaboratorSummaryTarget.advances_total)}</strong>
                </div>
                <div className="barber-summary-item">
                  <div>
                    <strong>Liquido a receber</strong>
                    <p>Comissao menos adiantamentos</p>
                  </div>
                  <strong>{money(collaboratorSummaryTarget.net_to_receive)}</strong>
                </div>
                <div className="barber-summary-item">
                  <div>
                    <strong>Atendimentos</strong>
                    <p>Quantidade de vendas no periodo</p>
                  </div>
                  <strong>{collaboratorSummaryTarget.sales_count || 0}</strong>
                </div>
                <div className="barber-summary-item">
                  <div>
                    <strong>Ultima venda</strong>
                    <p>Ultimo registro valido</p>
                  </div>
                  <strong>{collaboratorSummaryTarget.last_sale_at ? fullDate(collaboratorSummaryTarget.last_sale_at) : '-'}</strong>
                </div>
              </div>

              <BarberCard>
                <div className="barber-table-header">
                  <div>
                    <h2>Vendas recentes</h2>
                    <p>Ultimos lancamentos reais deste colaborador no periodo.</p>
                  </div>
                  <BarberBadge tone="pix">{collaboratorSummarySales.length} registros</BarberBadge>
                </div>
                <BarberTable columns={['Data', 'Servico', 'Pagamento', 'Valor']}>
                  {collaboratorSummarySales.length > 0 ? (
                    collaboratorSummarySales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{fullDate(sale.created_at)}</td>
                        <td>
                          <strong>{sale.service_name || sale.client_name || 'Venda registrada'}</strong>
                          <span>{sale.notes || '-'}</span>
                        </td>
                        <td>
                          <BarberBadge tone={paymentTone(sale.payment_method)}>
                            {paymentLabel(sale.payment_method)}
                          </BarberBadge>
                        </td>
                        <td>{money(sale.total_amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">
                        <BarberEmptyState
                          description="Este colaborador ainda nao possui vendas no periodo."
                          title="Sem vendas no periodo"
                        />
                      </td>
                    </tr>
                  )}
                </BarberTable>
              </BarberCard>

              {collaboratorSummaryAdvances.length > 0 && (
                <BarberCard>
                  <div className="barber-table-header">
                    <div>
                      <h2>Adiantamentos</h2>
                      <p>Movimentacoes de vales associadas a este colaborador.</p>
                    </div>
                    <BarberBadge tone="pending">{collaboratorSummaryAdvances.length} registros</BarberBadge>
                  </div>
                  <BarberTable columns={['Data', 'Motivo', 'Status', 'Valor']}>
                    {collaboratorSummaryAdvances.map((advance) => (
                      <tr key={advance.id}>
                        <td>{fullDate(advance.created_at)}</td>
                        <td>{advance.reason || '-'}</td>
                        <td>
                          <BarberBadge tone={advanceTone(advance.status)}>
                            {advanceLabel(advance.status)}
                          </BarberBadge>
                        </td>
                        <td>{money(advance.amount)}</td>
                      </tr>
                    ))}
                  </BarberTable>
                </BarberCard>
              )}
            </>
          ) : (
            <BarberEmptyState
              description="Nao foi possivel localizar os detalhes financeiros deste colaborador."
              title="Resumo indisponivel"
            />
          )}
        </div>
      </BarberModal>

      <BarberModal
        onClose={closeSaleModal}
        open={saleModalOpen}
        subtitle="Selecione um servico ativo, vincule o colaborador e registre a venda direto no caixa."
        title="Nova venda"
      >
        <div className="barber-modal-content">
          <form className="barber-panel-stack" onSubmit={createSale}>
            <div className="barber-form-grid">
              <div className="barber-form-block">
                <label htmlFor="cash-sale-service">Servico</label>
                <select
                  className="barber-select"
                  id="cash-sale-service"
                  name="serviceId"
                  onChange={updateSaleForm}
                  value={saleForm.serviceId}
                >
                  <option value="">Selecione o servico</option>
                  {visibleServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {money(service.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="barber-form-block">
                <label htmlFor="cash-sale-collaborator">Colaborador</label>
                <select
                  className="barber-select"
                  id="cash-sale-collaborator"
                  name="collaboratorId"
                  onChange={updateSaleForm}
                  required
                  value={saleForm.collaboratorId}
                >
                  <option value="">Selecione o colaborador</option>
                  {collaborators
                    .filter((collaborator) => collaborator.is_active)
                    .map((collaborator) => (
                      <option key={collaborator.id} value={collaborator.id}>
                        {collaborator.name || collaborator.nickname}
                      </option>
                    ))}
                </select>
              </div>

              <div className="barber-form-block">
                <label htmlFor="cash-sale-quantity">Quantidade</label>
                <input
                  className="barber-input"
                  id="cash-sale-quantity"
                  min="1"
                  name="quantity"
                  onChange={updateSaleForm}
                  step="1"
                  type="number"
                  value={saleForm.quantity}
                />
              </div>

              <div className="barber-form-block">
                <label htmlFor="cash-sale-client">Cliente</label>
                <input
                  className="barber-input"
                  id="cash-sale-client"
                  name="clientName"
                  onChange={updateSaleForm}
                  placeholder="Opcional"
                  value={saleForm.clientName}
                />
              </div>

              <div className="barber-form-block">
                <label htmlFor="cash-sale-payment">Pagamento</label>
                <select
                  className="barber-select"
                  id="cash-sale-payment"
                  name="paymentMethod"
                  onChange={updateSaleForm}
                  required
                  value={saleForm.paymentMethod}
                >
                  <option value="pix">Pix</option>
                  <option value="cash">Dinheiro</option>
                  <option value="credit">Credito</option>
                  <option value="debit">Debito</option>
                </select>
              </div>

              {isCashPayment && (
                <div className="barber-form-block">
                  <label htmlFor="cash-sale-received">Valor recebido</label>
                  <input
                    className="barber-input"
                    id="cash-sale-received"
                    min={saleEffectiveTotal || 0}
                    name="amountReceived"
                    onChange={updateSaleForm}
                    step="0.01"
                    type="number"
                    value={saleForm.amountReceived}
                  />
                </div>
              )}

              <div className="barber-form-block barber-form-block-full">
                <label htmlFor="cash-sale-notes">Observacoes</label>
                <textarea
                  className="barber-textarea"
                  id="cash-sale-notes"
                  name="notes"
                  onChange={updateSaleForm}
                  rows="3"
                  value={saleForm.notes}
                />
              </div>
            </div>

            <div className="barber-inline-actions">
              <BarberButton onClick={addSaleItem} type="button" variant="secondary">
                <BarberIcon name="plus" />
                <span>Adicionar item</span>
              </BarberButton>
            </div>

            <BarberTable columns={['Tipo', 'Item', 'Qtd', 'Valor', 'Comissao', 'Liquido', 'Acoes']}>
              {saleForm.items.length > 0 ? (
                saleForm.items.map((item) => (
                  <tr key={item.key}>
                    <td>Servico</td>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{money(item.totalPrice)}</td>
                    <td>{money(item.commissionAmount)}</td>
                    <td>{money(item.shopNetAmount)}</td>
                    <td>
                      <BarberButton onClick={() => removeSaleItem(item.key)} type="button" variant="danger">
                        Remover
                      </BarberButton>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <BarberEmptyState
                        description="Adicione servicos do catalogo para registrar a operacao."
                        title="Nenhum item na venda"
                      />
                  </td>
                </tr>
              )}
            </BarberTable>

            <div className="barber-summary-grid">
              <div className="barber-summary-item">
                <div>
                  <strong>Total bruto</strong>
                  <p>{saleForm.items.length ? `${saleForm.items.length} item(ns) na operacao` : 'Adicione itens para montar a venda'}</p>
                </div>
                <strong>{money(saleTotal)}</strong>
              </div>
              <div className="barber-summary-item">
                <div>
                  <strong>Comissao total</strong>
                  <p>{selectedCollaborator ? `Aplicada para ${selectedCollaborator.name || selectedCollaborator.nickname}` : 'Escolha o colaborador responsavel'}</p>
                </div>
                <strong>{money(saleCommissionTotal)}</strong>
              </div>
              <div className="barber-summary-item">
                <div>
                  <strong>Liquido da barbearia</strong>
                  <p>Total menos a comissao dos itens</p>
                </div>
                <strong>{money(saleShopNetTotal)}</strong>
              </div>
              <div className="barber-summary-item">
                <div>
                  <strong>Troco</strong>
                  <p>{isCashPayment ? 'Calculado em tempo real' : 'Nao se aplica'}</p>
                </div>
                <strong style={isCashPayment && saleChangeDue < 0 ? { color: '#ff7d7d' } : undefined}>
                  {isCashPayment ? money(Math.max(0, saleChangeDue)) : money(0)}
                </strong>
              </div>
            </div>

            {isCashPayment && saleForm.amountReceived && saleChangeDue < 0 && (
              <div className="barber-message barber-message-error">
                Valor recebido menor que o total da venda.
              </div>
            )}

            <div className="barber-modal-actions">
              <BarberButton onClick={closeSaleModal} type="button" variant="ghost">
                Cancelar
              </BarberButton>
              <BarberButton disabled={submittingSale} type="submit" variant="primary">
                <BarberIcon name="plus" />
                <span>{submittingSale ? 'Lancando venda...' : 'Lancar venda do colaborador'}</span>
              </BarberButton>
            </div>
          </form>
        </div>
      </BarberModal>

      <BarberModal
        onClose={() => setDeleteSaleId('')}
        open={Boolean(deleteSaleId)}
        subtitle={deleteSaleTarget ? `Venda de ${money(deleteSaleTarget.total_amount)} em ${fullDate(deleteSaleTarget.created_at)}` : ''}
        title="Confirmar exclusao da venda"
      >
        <div className="barber-modal-content">
          <div className="barber-form-block">
            <label htmlFor="delete-reason">Motivo</label>
            <textarea
              className="barber-textarea"
              id="delete-reason"
              onChange={(event) => setDeleteReason(event.target.value)}
              rows="4"
              value={deleteReason}
            />
          </div>
          <div className="barber-form-grid">
            <div className="barber-form-block">
              <label htmlFor="delete-password">Senha admin</label>
              <input
                className="barber-input"
                id="delete-password"
                onChange={(event) => setDeletePassword(event.target.value)}
                type="password"
                value={deletePassword}
              />
            </div>
            <div className="barber-form-block">
              <label htmlFor="delete-pin">PIN</label>
              <input
                className="barber-input"
                id="delete-pin"
                onChange={(event) => setDeletePin(event.target.value)}
                type="password"
                value={deletePin}
              />
            </div>
          </div>
          <div className="barber-modal-actions">
            <BarberButton onClick={() => setDeleteSaleId('')} type="button" variant="ghost">
              Cancelar
            </BarberButton>
            <BarberButton onClick={deleteSale} type="button" variant="danger">
              <BarberIcon name="trash" />
              <span>Excluir venda</span>
            </BarberButton>
          </div>
        </div>
      </BarberModal>
    </>
  )
}

export default Barber

