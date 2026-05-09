import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLocation, useNavigate } from 'react-router-dom'
import { Shell, StatCard, ChartCard, ChartTooltip } from '../components/design-system'
import {
  DollarSign,
  CalendarCheck,
  Percent,
  Banknote,
  Smartphone,
  Repeat,
  CreditCard,
  Landmark,
  TrendingUp
} from 'lucide-react'
import CollaboratorAvatar from '../components/barber/CollaboratorAvatar'
import CollaboratorMobileDashboard from '../components/barber/CollaboratorMobileDashboard'
import LockedFeature from '../components/common/LockedFeature'
import ServiceIcon from '../components/barber/ServiceIcon'
import { normalizeServiceIcon } from '../components/barber/ServiceIcon.utils'
import AgendaGrid from '../components/barber/agenda/AgendaGrid'
import AppointmentModal from '../components/barber/agenda/AppointmentModal'
import AppointmentComposerModal from '../components/barber/agenda/AppointmentComposerModal'
import AppointmentDetailsPanel from '../components/barber/agenda/AppointmentDetailsPanel'
import AgendaToolbar from '../components/barber/agenda/AgendaToolbar'
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
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Package,
  Users,
  Wallet,
  BarChart3,
  Lock,
  Settings,
  Crown,
  Menu,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Plus
} from 'lucide-react'
import ClientesBarber from './barber/Clientes'
import Servicos from './barber/Servicos'
import Produtos from './barber/Produtos'
import api from '../services/api'
import {
  canUseFeature,
  getLockedFeatureMessage,
  getPlanDisplayLabel,
  normalizeFeaturePlanType
} from '../utils/planFeatures'
import {
  buildPaymentOptions,
  getPaymentMethodChartColor,
  getPaymentMethodLabel,
  getPaymentMethodTone,
  normalizePaymentMethod
} from '../utils/paymentMethods'
import '../styles/globals.css'
import '../styles/compatibility.css'
import '../styles/ds-encapsulation.css'
import '../styles/dashboard-grid.css'
import '../styles/chart-premium.css'
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
  canMakeBarter: false,
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

const saleWizardSteps = [
  { key: 'start', label: 'Iniciar atendimento' },
  { key: 'client', label: 'Cliente' },
  { key: 'items', label: 'Servicos/produtos' },
  { key: 'payment', label: 'Pagamento' },
  { key: 'notes', label: 'Observacoes' },
  { key: 'review', label: 'Revisao' }
]

const emptyAdvance = {
  collaboratorId: '',
  amount: '',
  reason: ''
}

const defaultSettlementFilters = {
  collaboratorId: '',
  startDate: '',
  endDate: ''
}

const emptyDashboard = {
  totalDaySales: 0,
  totalPix: 0,
  totalCash: 0,
  totalCredit: 0,
  totalDebit: 0,
  totalPermuta: 0,
  totalCommissions: 0,
  dailyRevenue: [],
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

const defaultAppointmentFilters = {
  date: '',
  collaboratorId: 'all',
  status: 'all'
}

const agendaWeekdayLabels = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']

function buildEmptyAppointmentForm(overrides = {}) {
  return {
    serviceId: '',
    collaboratorId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    appointmentDate: new Date().toISOString().slice(0, 10),
    appointmentTime: '08:00',
    notes: '',
    ...overrides
  }
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

const emptyBarberSettings = {
  company: {
    id: '',
    name: '',
    email: '',
    phone: '',
    public_booking_slug: '',
    created_at: null
  },
  security: {
    recovery_email: '',
    pin_configured: null,
    expires_in_minutes: 10
  },
  agenda: {
    timezone: 'America/Cuiaba',
    slot_interval_minutes: 30,
    online_min_advance_enabled: false,
    online_min_advance_value: 0,
    minimum_notice_minutes: 0,
    cancellation_limit_hours: 0,
    allow_customer_select_collaborator: true,
    allow_any_collaborator: true,
    confirmation_message: ''
  },
  plan: null
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

const defaultSalesFilters = {
  collaboratorId: '',
  period: 'today',
  startDate: '',
  endDate: ''
}

const emptySalesSummary = {
  total_sales: 0,
  total_amount: 0,
  total_commission: 0,
  total_discount: 0,
  total_by_payment_method: [],
  total_by_collaborator: [],
  totals_day: { total_amount: 0, total_sales: 0 },
  totals_week: { total_amount: 0, total_sales: 0 },
  totals_month: { total_amount: 0, total_sales: 0 }
}

const viewMeta = {
  dashboard: {
    label: 'Visao Geral',
    title: 'Visao geral do dia',
    description: 'Indicadores de hoje para caixa, atendimentos, comissoes, permutas e recebimentos.'
  },
  appointments: {
    label: 'Agenda',
    title: 'Agenda da barbearia',
    description: 'Controle horarios, disponibilidade da equipe e reservas em um fluxo unico.'
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
    label: 'Atendimentos',
    title: 'Operacao de atendimentos',
    description: 'Registre atendimentos com clareza, acompanhe pagamentos e trate exclusoes com aprovacao.'
  },
  cashier: {
    label: 'Caixa',
    title: 'Fluxo financeiro do dia',
    description: 'Resumo por forma de pagamento, vales, aprovacoes e fechamento individual de colaboradores.'
  },
  settlements: {
    label: 'Acertos',
    title: 'Acertos',
    description: 'Fechamento de comissoes e pagamentos dos colaboradores.'
  },
  team: {
    label: 'Colaboradores',
    title: 'Desempenho e equipe',
    description: 'Gerencie sua equipe, comissoes e desempenho individual.'
  },
  reports: {
    label: 'Relatorios',
    title: 'Relatorios e fechamento',
    description: 'Historico diario, semanal, mensal, por periodo, colaborador, pagamento, servico, permuta e caixa.'
  },
  settings: {
    label: 'Configuracoes',
    title: 'Seguranca, empresa e controles sensiveis',
    description: 'Gerencie recuperacao de PIN, dados principais da empresa e a base para configuracoes futuras.'
  }
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
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

  const localDate = typeof value === 'string' ? parseLocalDateString(value) : null

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  }).format(localDate || new Date(value))
}

function parseLocalDateString(value) {
  const match = String(value || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    return null
  }

  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}

function toLocalDateKey(value) {
  if (!value) {
    return ''
  }

  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function addLocalDateDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
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

function buildSalesChartData(sales, dailyRevenue = []) {
  const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
  const today = new Date()
  const dailyRevenueMap = new Map(
    (dailyRevenue || []).map((item) => [String(item.date || '').slice(0, 10), Number(item.revenue || item.total || 0)])
  )

  return Array.from({ length: 7 }, (_, index) => {
    const date = addLocalDateDays(today, -(6 - index))
    const dateKey = toLocalDateKey(date)

    const total = dailyRevenueMap.has(dateKey)
      ? dailyRevenueMap.get(dateKey)
      : sales.reduce((sum, sale) => {
        const saleLocalDate = String(sale.sale_date_local || '').slice(0, 10)
        const fallbackDateKey = saleLocalDate || toLocalDateKey(sale.created_at)
        return fallbackDateKey === dateKey ? sum + Number(sale.total_amount || 0) : sum
      }, 0)

    return {
      label: formatter.format(date).replace('.', ''),
      total,
      date: dateKey,
      fullDate: shortDate(date)
    }
  })
}

function paymentTone(method) {
  return getPaymentMethodTone(method)
}

function paymentLabel(method) {
  return getPaymentMethodLabel(method)
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

function buildSalesParams(filters) {
  const params = {
    period: filters.period || 'today'
  }

  if (filters.collaboratorId) {
    params.collaborator_id = filters.collaboratorId
  }

  if (params.period === 'custom' && filters.startDate && filters.endDate) {
    params.start_date = filters.startDate
    params.end_date = filters.endDate
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
    arrived: 'admin',
    in_progress: 'pix',
    completed: 'cash',
    canceled: 'danger',
    no_show: 'admin'
  }[status] || 'neutral'
}

function appointmentLabel(status) {
  return {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    arrived: 'Chegou',
    in_progress: 'Em atendimento',
    completed: 'Concluido',
    canceled: 'Cancelado',
    no_show: 'Nao compareceu'
  }[status] || status || 'Nao informado'
}

function collaboratorDisplayName(collaborator) {
  return collaborator?.name || collaborator?.collaborator_name || collaborator?.nickname || 'Colaborador'
}

function formatAppointmentSlot(appointment) {
  if (!appointment?.starts_at) {
    return '-'
  }

  const startsAt = new Date(appointment.starts_at)
  if (Number.isNaN(startsAt.getTime())) {
    return '-'
  }

  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(startsAt)

  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(startsAt)

  return time ? `${date} às ${time}` : date
}

function formatAppointmentRange(appointment) {
  if (!appointment?.starts_at) {
    return '-'
  }

  const startsAt = new Date(appointment.starts_at)
  if (Number.isNaN(startsAt.getTime())) {
    return '-'
  }

  const start = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(startsAt)

  const end = appointment?.ends_at
    ? new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date(appointment.ends_at))
    : ''

  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  }).format(startsAt)

  if (start && end) {
    return `${date} • ${start} - ${end}`
  }

  return start ? `${date} • ${start}` : date
}

function buildAppointmentStartsAt(date, time) {
  const normalizedDate = String(date || '').trim()
  const normalizedTime = String(time || '').trim()

  if (!normalizedDate || !normalizedTime) {
    return ''
  }

  const parsed = new Date(`${normalizedDate}T${normalizedTime}:00`)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}

function getAppointmentDateKey(appointment) {
  if (!appointment?.starts_at) {
    return ''
  }

  const parsed = new Date(appointment.starts_at)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toISOString().slice(0, 10)
}

function buildEmptySaleForm(collaboratorId = '') {
  return {
    ...emptySale,
    collaboratorId: collaboratorId || ''
  }
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

  if (normalized.startsWith('/barber/agenda') || normalized.startsWith('/barber/agendamentos') || normalized.startsWith('/barber/minha-agenda')) {
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

  if (normalized.startsWith('/barber/acertos')) {
    return 'settlements'
  }

  if (normalized.startsWith('/barber/colaboradores')) {
    return 'team'
  }

  if (normalized.startsWith('/barber/relatorios')) {
    return 'reports'
  }

  if (normalized.startsWith('/barber/configuracoes')) {
    return 'settings'
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
    settlements: '/barber/acertos',
    team: '/barber/colaboradores',
    reports: '/barber/relatorios',
    settings: '/barber/configuracoes'
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

  const value = payload[0]?.value || 0
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)

  return (
    <div className="ds-chart-tooltip">
      <div className="ds-chart-tooltip__label">{label}</div>
      <div className="ds-chart-tooltip__value">{formattedValue}</div>
    </div>
  )
}

function Barber() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, modules, logout, planLoading } = useAuth()
  const [activeView, setActiveView] = useState(() => getInitialBarberView(window.location.pathname))
  const [dashboard, setDashboard] = useState(emptyDashboard)
  const [appointmentsOverview, setAppointmentsOverview] = useState(emptyAppointmentsOverview)
  const [services, setServices] = useState([])
  const [serviceCatalog, setServiceCatalog] = useState([])
  const [serviceFilters, setServiceFilters] = useState(defaultServiceFilters)
  const [serviceForm, setServiceForm] = useState(emptyService)
  const [editingServiceId, setEditingServiceId] = useState('')
  const [serviceDrawerOpen, setServiceDrawerOpen] = useState(false)
  const [submittingService, setSubmittingService] = useState(false)
  const [deleteServiceId, setDeleteServiceId] = useState('')
  const [deleteServicePassword, setDeleteServicePassword] = useState('')
  const [deleteServicePin, setDeleteServicePin] = useState('')
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
  const [salesFilters, setSalesFilters] = useState(defaultSalesFilters)
  const [salesSummary, setSalesSummary] = useState(emptySalesSummary)
  const [collaboratorForm, setCollaboratorForm] = useState(emptyCollaborator)
  const [editingCollaboratorId, setEditingCollaboratorId] = useState('')
  const [collaboratorModalOpen, setCollaboratorModalOpen] = useState(false)
  const [collaboratorSummaryId, setCollaboratorSummaryId] = useState('')
  const [saleForm, setSaleForm] = useState(emptySale)
  const [saleCatalogSearch, setSaleCatalogSearch] = useState('')
  const [saleCatalogFilter, setSaleCatalogFilter] = useState('all')
  const [servicePickerOpen, setServicePickerOpen] = useState(false)
  const [saleWizardStep, setSaleWizardStep] = useState('start')
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [advanceForm, setAdvanceForm] = useState(emptyAdvance)
  const [settlementCollaboratorId, setSettlementCollaboratorId] = useState('')
  const [settlementFilters, setSettlementFilters] = useState(defaultSettlementFilters)
  const [settlementPreview, setSettlementPreview] = useState(null)
  const [approvalPassword, setApprovalPassword] = useState('')
  const [approvalPin, setApprovalPin] = useState('')
  const [deleteSaleId, setDeleteSaleId] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deletePin, setDeletePin] = useState('')
  const [submittingSale, setSubmittingSale] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth <= 768)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settingsData, setSettingsData] = useState(emptyBarberSettings)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [pinRecoveryOpen, setPinRecoveryOpen] = useState(false)
  const [pinRecoveryStep, setPinRecoveryStep] = useState('request')
  const [pinRecoverySubmitting, setPinRecoverySubmitting] = useState(false)
  const [pinRecoveryForm, setPinRecoveryForm] = useState({
    email: normalizeEmail(user?.email || ''),
    code: '',
    newPin: '',
    confirmPin: ''
  })
  const [scheduleBlocks, setScheduleBlocks] = useState([])
  const [workingHours, setWorkingHours] = useState([])
  const [appointmentViewTab, setAppointmentViewTab] = useState('list') // 'calendar', 'list', 'blocks', 'hours'
  const [agendaMode, setAgendaMode] = useState('week')
  const [agendaMonthCursor, setAgendaMonthCursor] = useState(() => new Date().toISOString().slice(0, 10))
  const [activeAgendaAppointment, setActiveAgendaAppointment] = useState(null)
  const [agendaModalOpen, setAgendaModalOpen] = useState(false)
  const [appointmentFilters, setAppointmentFilters] = useState(defaultAppointmentFilters)
  const [appointmentComposerOpen, setAppointmentComposerOpen] = useState(false)
  const [submittingAppointment, setSubmittingAppointment] = useState(false)
  const [appointmentForm, setAppointmentForm] = useState(() => buildEmptyAppointmentForm())
  const [showAgendaFilters, setShowAgendaFilters] = useState(true)

  const isAdmin = ['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin'].includes(user?.role)
  const canManageCash = ['admin', 'owner', 'master_admin', 'tenant_owner', 'tenant_admin', 'secretary'].includes(user?.role)
  const currentView = getInitialBarberView(location.pathname) || activeView
  const meta = viewMeta[currentView]
  const isEditingCollaborator = Boolean(editingCollaboratorId)
  const isCollaborator = user?.role === 'collaborator'
  const loggedInCollaboratorId = user?.collaborator_id || user?.collaboratorId || ''
  const currentPlanType = planLoading ? null : normalizeFeaturePlanType(user?.plan_type)
  const planLabel = planLoading ? 'Carregando plano...' : getPlanDisplayLabel(currentPlanType)
  const canUseCollaboratorsFeature = canUseFeature(currentPlanType, 'collaborators')
  const canUseAdvancedReportsFeature = canUseFeature(currentPlanType, 'advanced_reports')
  const canUseFinancialDashboardFeature = canUseFeature(currentPlanType, 'financial_dashboard')
  const canUseAdvancedScheduleFeature = canUseFeature(currentPlanType, 'advanced_schedule')
  const canUseExtraPermissionsFeature = canUseFeature(currentPlanType, 'extra_permissions')
  const loggedInCollaborator = useMemo(() => {
    if (!isCollaborator) {
      return null
    }

    return dashboard?.collaborator
      || personalReport?.collaborator
      || collaborators.find((collaborator) => collaborator.id === loggedInCollaboratorId)
      || null
  }, [collaborators, dashboard?.collaborator, isCollaborator, loggedInCollaboratorId, personalReport?.collaborator])

  const lockedViews = useMemo(() => {
    const nextLockedViews = {}

    if (planLoading) {
      return nextLockedViews
    }

    if ((isAdmin || canManageCash) && !canUseAdvancedScheduleFeature) {
      nextLockedViews.appointments = getLockedFeatureMessage('advanced_schedule')
    }

    if (canManageCash && !canUseFinancialDashboardFeature) {
      nextLockedViews.cashier = getLockedFeatureMessage('financial_dashboard')
    }

    if (isAdmin && !canUseCollaboratorsFeature) {
      nextLockedViews.team = getLockedFeatureMessage('collaborators')
    }

    if (!canUseAdvancedReportsFeature) {
      nextLockedViews.reports = getLockedFeatureMessage('advanced_reports')
      nextLockedViews.settlements = getLockedFeatureMessage('advanced_reports')
    }

    return nextLockedViews
  }, [
    canManageCash,
    canUseAdvancedReportsFeature,
    canUseAdvancedScheduleFeature,
    canUseCollaboratorsFeature,
    canUseFinancialDashboardFeature,
    isAdmin
    ,
    planLoading
  ])

  const handleLockedFeature = useCallback((message) => {
    setSuccess('')
    setError(message || 'Este recurso nao esta disponivel no plano gratuito. Faca upgrade para liberar.')
  }, [])

  const loadSettings = useCallback(async (options = {}) => {
    if (options.clearMessage !== false) {
      setError('')
    }

    setSettingsLoading(true)

    try {
      const response = await api.get('/barber/settings')
      const nextSettings = response.data?.data || emptyBarberSettings

      setSettingsData(nextSettings)
      setPinRecoveryForm((current) => ({
        ...current,
        email: current.email || nextSettings.security?.recovery_email || nextSettings.company?.email || normalizeEmail(user?.email || '')
      }))
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar as configuracoes')
    } finally {
      setSettingsLoading(false)
    }
  }, [user?.email])

  const resetPinRecoveryFlow = useCallback((emailValue = '') => {
    setPinRecoveryStep('request')
    setPinRecoveryOpen(false)
    setPinRecoverySubmitting(false)
    setPinRecoveryForm({
      email: normalizeEmail(emailValue || settingsData.security?.recovery_email || settingsData.company?.email || user?.email || ''),
      code: '',
      newPin: '',
      confirmPin: ''
    })
  }, [settingsData.company?.email, settingsData.security?.recovery_email, user?.email])

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
        api.get(isCollaborator ? '/barber/my-dashboard' : '/barber/dashboard'),
        api.get('/barber/services'),
        api.get(isCollaborator ? '/barber/my-sales' : '/barber/sales', {
          params: isCollaborator ? {} : buildSalesParams(salesFilters)
        }),
        api.get('/barber/advances')
      ]

      if (!isCollaborator) {
        requests.push(api.get('/barber/sales/summary', {
          params: buildSalesParams(salesFilters)
        }))
      }

      if (!isCollaborator && canUseAdvancedReportsFeature) {
        requests.push(api.get('/barber/settlements'))
        requests.push(api.get('/barber/collaborators/financial-summary', {
          params: buildCollaboratorFinancialParams(collaboratorFinancialFilters)
        }))
      }

      if ((isAdmin || canManageCash || isCollaborator) && canUseAdvancedScheduleFeature) {
        requests.push(api.get('/barber/appointments'))

        if (!isCollaborator) {
          requests.push(api.get('/barber/schedule/blocks'))
          requests.push(api.get('/barber/working-hours'))
        }
      }

      if (isCollaborator && canUseAdvancedReportsFeature) {
        requests.push(api.get('/barber/my-report'))
      }

      if (isAdmin) {
        requests.push(api.get('/barber/products'))
        requests.push(api.get('/barber/suppliers'))
      }

      if ((isAdmin || canManageCash) && canUseCollaboratorsFeature) {
        requests.push(api.get('/barber/collaborators'))
      }

      const responses = await Promise.all(requests)
      const [
        dashboardResponse,
        servicesResponse,
        salesResponse,
        advancesResponse,
        ...restResponses
      ] = responses

      setDashboard(dashboardResponse.data.data)
      setServices(servicesResponse.data.data)
      setServiceCatalog(servicesResponse.data.data)
      setSales(salesResponse.data.data)
      setAdvances(advancesResponse.data.data)

      let responseIndex = 0

      if (!isCollaborator) {
        setSalesSummary(restResponses[responseIndex].data.data || emptySalesSummary)
        responseIndex += 1
      } else {
        setSalesSummary(emptySalesSummary)
      }

      if (!isCollaborator && canUseAdvancedReportsFeature) {
        setSettlements(restResponses[responseIndex].data.data.settlements)
        responseIndex += 1
        setCollaboratorFinancialSummary(restResponses[responseIndex].data.data || [])
        responseIndex += 1
      } else {
        setSettlements([])
        setCollaboratorFinancialSummary([])
      }

      if ((isAdmin || canManageCash || isCollaborator) && canUseAdvancedScheduleFeature) {
        setAppointmentsOverview(restResponses[responseIndex].data.data || emptyAppointmentsOverview)
        responseIndex += 1

        if (!isCollaborator) {
          setScheduleBlocks(restResponses[responseIndex].data.data || [])
          responseIndex += 1
          setWorkingHours(restResponses[responseIndex].data.data || [])
          responseIndex += 1
        } else {
          setScheduleBlocks([])
          setWorkingHours([])
        }
      } else {
        setAppointmentsOverview(emptyAppointmentsOverview)
        setScheduleBlocks([])
        setWorkingHours([])
      }

      if (isCollaborator && canUseAdvancedReportsFeature) {
        setPersonalReport(restResponses[responseIndex].data.data)
        responseIndex += 1
      } else {
        setPersonalReport(emptyPersonalReport)
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

      if ((isAdmin || canManageCash) && canUseCollaboratorsFeature) {
        const collaboratorsResponse = restResponses[responseIndex]?.data?.data
        const nextCollaborators = Array.isArray(collaboratorsResponse)
          ? collaboratorsResponse
          : collaboratorsResponse?.collaborators
            || collaboratorsResponse?.items
            || collaboratorsResponse?.rows
            || []

        setCollaborators(nextCollaborators)
        responseIndex += 1
      } else {
        setCollaborators([])
      }

    } catch (err) {
      console.error('Erro ao carregar dados do BarberGestor:', err)
      setError(err.response?.data?.error || 'Nao foi possivel carregar o BarberGestor')
    } finally {
      setLoading(false)
    }
  }, [
    canManageCash,
    canUseAdvancedReportsFeature,
    canUseAdvancedScheduleFeature,
    canUseCollaboratorsFeature,
    collaboratorFinancialFilters,
    isAdmin,
    isCollaborator,
    salesFilters
  ])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadData({ clearMessage: false })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  useEffect(() => {
    if (!isCollaborator) {
      return
    }

    setSaleForm((current) => {
      if (current.collaboratorId === loggedInCollaboratorId) {
        return current
      }

      return {
        ...current,
        collaboratorId: loggedInCollaboratorId
      }
    })
  }, [isCollaborator, loggedInCollaboratorId])

  useEffect(() => {
    if (currentView === 'settings' && isAdmin) {
      loadSettings({ clearMessage: false })
    }
  }, [currentView, isAdmin, loadSettings])

  useEffect(() => {
    function handleResize() {
      setIsMobileViewport(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navigateView = useCallback((view) => {
    const lockMessage = lockedViews[view]

    if (lockMessage) {
      handleLockedFeature(lockMessage)
      return
    }

    setActiveView(view)

    const targetPath = getBarberViewPath(view)

    if (location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }, [handleLockedFeature, location.pathname, lockedViews, navigate])

  function handlePinRecoveryFieldChange(field, value) {
    setPinRecoveryForm((current) => ({
      ...current,
      [field]: field === 'email' ? normalizeEmail(value) : value
    }))
  }

  function handleAgendaSettingsChange(field, value) {
    setSettingsData((current) => ({
      ...current,
      agenda: {
        ...(current.agenda || emptyBarberSettings.agenda),
        [field]: value
      }
    }))
  }

  function openPinRecovery() {
    setError('')
    setSuccess('')
    setPinRecoveryOpen(true)
    setPinRecoveryStep('request')
    setPinRecoveryForm((current) => ({
      ...current,
      email: current.email || settingsData.security?.recovery_email || settingsData.company?.email || normalizeEmail(user?.email || ''),
      code: '',
      newPin: '',
      confirmPin: ''
    }))
  }

  async function handlePinRecoveryRequest(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!pinRecoveryForm.email) {
      setError('Informe o e-mail de acesso para recuperar o PIN.')
      return
    }

    setPinRecoverySubmitting(true)

    try {
      const response = await api.post('/barber/settings/pin/forgot', {
        email: pinRecoveryForm.email
      })

      setPinRecoveryStep('reset')
      setSuccess(response.data?.message || 'Se o e-mail estiver correto, enviaremos um codigo de recuperacao.')
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel enviar o codigo de recuperacao.')
    } finally {
      setPinRecoverySubmitting(false)
    }
  }

  async function handlePinResetSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!/^\d{4,}$/.test(pinRecoveryForm.newPin)) {
      setError('Informe um novo PIN com pelo menos 4 digitos.')
      return
    }

    if (pinRecoveryForm.newPin !== pinRecoveryForm.confirmPin) {
      setError('A confirmacao do PIN nao confere.')
      return
    }

    setPinRecoverySubmitting(true)

    try {
      const response = await api.post('/barber/settings/pin/reset', {
        email: pinRecoveryForm.email,
        code: pinRecoveryForm.code,
        newPin: pinRecoveryForm.newPin
      })

      setSuccess(response.data?.message || 'PIN atualizado com sucesso.')
      resetPinRecoveryFlow(pinRecoveryForm.email)
      await loadSettings({ clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel redefinir o PIN.')
    } finally {
      setPinRecoverySubmitting(false)
    }
  }

  async function handleAgendaSettingsSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const enabled = settingsData.agenda?.online_min_advance_enabled === true
    const value = Number(settingsData.agenda?.online_min_advance_value || 0)
    const allowedAdvanceValues = [1, 2, 4, 8, 12, 24]

    if (enabled && !allowedAdvanceValues.includes(value)) {
      setError('Selecione uma antecedencia minima valida em horas para o agendamento online.')
      return
    }

    try {
      setSettingsSaving(true)
      const response = await api.patch('/barber/settings', {
        online_min_advance_enabled: enabled,
        online_min_advance_value: enabled ? value : 0
      })

      setSettingsData(response.data?.data || emptyBarberSettings)
      setSuccess('Configuracoes da agenda online atualizadas com sucesso.')
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel atualizar as configuracoes da agenda.')
    } finally {
      setSettingsSaving(false)
    }
  }

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
  const canUseBarterForSale = Boolean(activeSaleCollaborator?.can_make_barter || activeSaleCollaborator?.canMakeBarter)
  const salePaymentOptions = useMemo(() => {
    return buildPaymentOptions({ includeBarter: canUseBarterForSale })
  }, [canUseBarterForSale])

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

  const salesChartData = useMemo(() => buildSalesChartData(sales, dashboard.dailyRevenue), [dashboard.dailyRevenue, sales])

  const paymentChartData = useMemo(() => {
    const totals = sales.reduce((accumulator, sale) => {
      const key = normalizePaymentMethod(sale.payment_method)
      accumulator[key] = (accumulator[key] || 0) + Number(sale.total_amount || 0)
      return accumulator
    }, {})

    return ['cash', 'pix', 'credit', 'debit', 'barter'].map((method) => ({
      name: getPaymentMethodLabel(method),
      value: totals[method] || 0,
      fill: getPaymentMethodChartColor(method)
    }))
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
  const visibleServices = Array.isArray(services)
    ? services.filter((service) => service.is_active !== false && service.is_deleted !== true)
    : []
  const servicesById = useMemo(() => {
    return new Map(visibleServices.map((service) => [service.id, service]))
  }, [visibleServices])
  const visibleProducts = products.filter((product) => product.is_active && !product.is_deleted)
  const filteredAppointments = useMemo(() => {
    const appointments = appointmentsOverview.appointments || []

    return appointments.filter((appointment) => {
      if (appointmentFilters.date && getAppointmentDateKey(appointment) !== appointmentFilters.date) {
        return false
      }

      if (appointmentFilters.status !== 'all' && appointment.status !== appointmentFilters.status) {
        return false
      }

      if (!isCollaborator && appointmentFilters.collaboratorId !== 'all' && appointment.collaborator_id !== appointmentFilters.collaboratorId) {
        return false
      }

      return true
    })
  }, [appointmentFilters.collaboratorId, appointmentFilters.date, appointmentFilters.status, appointmentsOverview.appointments, isCollaborator])

  const appointmentGroups = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const appointments = filteredAppointments

    return {
      today: appointments.filter((appointment) => getAppointmentDateKey(appointment) === today && appointment.status !== 'canceled'),
      upcoming: appointments.filter((appointment) => getAppointmentDateKey(appointment) >= today && ['scheduled', 'confirmed', 'arrived', 'in_progress'].includes(appointment.status)),
      active: appointments.filter((appointment) => ['confirmed', 'arrived', 'in_progress'].includes(appointment.status)),
      completed: appointments.filter((appointment) => appointment.status === 'completed'),
      canceled: appointments.filter((appointment) => appointment.status === 'canceled')
    }
  }, [filteredAppointments])
  const appointmentsWithMeta = useMemo(() => {
    return filteredAppointments.map((appointment) => ({
      ...appointment,
      dateKey: getAppointmentDateKey(appointment),
      timeLabel: appointment.starts_at ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(appointment.starts_at)) : '--:--',
      timeCompactLabel: appointment.starts_at ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(appointment.starts_at)) : '--:--',
      slotLabel: formatAppointmentRange(appointment),
      appointment_date_label: appointment.starts_at ? shortDate(appointment.starts_at) : '-',
      duration_label: appointment.ends_at && appointment.starts_at
        ? `${Math.max(0, Math.round((new Date(appointment.ends_at) - new Date(appointment.starts_at)) / 60000))} min`
        : '-',
      service_price_label: money(servicesById.get(appointment.service_id)?.price || appointment.service_price || 0)
    }))
  }, [filteredAppointments, servicesById])

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
    setSaleForm(buildEmptySaleForm(loggedInCollaboratorId))
    setSaleWizardStep('start')
  }

  function resetSaleWizard(nextStep = 'start') {
    setSaleForm(buildEmptySaleForm(isCollaborator ? loggedInCollaboratorId : ''))
    setSaleCatalogSearch('')
    setSaleCatalogFilter('all')
    setServicePickerOpen(false)
    setSaleWizardStep(nextStep)
  }

  function openServicePicker() {
    setError('')
    setSaleCatalogSearch('')
    setSaleCatalogFilter('all')
    setServicePickerOpen(true)
  }

  function closeServicePicker() {
    setServicePickerOpen(false)
  }

  function calculateSaleItemPreview(source, quantity) {
    const qty = Number(quantity || 1)
    const unitPrice = Number(source?.price ?? source?.sale_price ?? 0)
    const totalPrice = unitPrice * qty
    const collaboratorCommissionType = activeSaleCollaborator?.commission_type || activeSaleCollaborator?.commissionType
    const collaboratorCommissionRate = Number(activeSaleCollaborator?.commission_rate ?? activeSaleCollaborator?.commissionRate ?? 0)
    const sourceType = source?.type || source?.service_type || (source?.sale_price !== undefined ? 'product' : 'service')
    const useCollaboratorCommission = sourceType === 'service' && ['percentage', 'fixed'].includes(collaboratorCommissionType)
    const commissionType = useCollaboratorCommission ? collaboratorCommissionType : (source?.commission_type || source?.commissionType || 'fixed')
    const commissionValue = useCollaboratorCommission
      ? collaboratorCommissionRate
      : Number(source?.commission_value ?? source?.commissionValue ?? 0)
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

  function appendSaleItemFromCatalog(source, itemType, quantity = 1, options = {}) {
    const qty = Math.max(Number(quantity || 1), 1)
    const preview = calculateSaleItemPreview(source, qty)

    setSaleForm((current) => ({
      ...current,
      catalogType: 'service',
      serviceId: '',
      productId: '',
      quantity: 1,
      items: [
        ...current.items,
        {
          key: `${itemType}-${source.id}-${Date.now()}`,
          itemType,
          itemId: source.id,
          name: source.name,
          icon: itemType === 'product' ? 'product' : normalizeServiceIcon(source.icon, source.name),
          unitPrice: Number(source.price ?? source.sale_price ?? 0),
          quantity: qty,
          ...preview
        }
      ]
    }))

    setError('')

    if (options.closeAfterAdd) {
      setServicePickerOpen(false)
    }
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

    appendSaleItemFromCatalog({
      ...source,
      id: itemId
    }, itemType, quantity)
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
    setServiceDrawerOpen(false)
    setSubmittingService(false)
  }

  function openServiceCreateDrawer() {
    setEditingServiceId('')
    setServiceForm(emptyService)
    setServiceDrawerOpen(true)
  }

  function closeServiceDeleteModal() {
    setDeleteServiceId('')
    setDeleteServicePassword('')
    setDeleteServicePin('')
  }

  function closeCollaboratorModal() {
    setCollaboratorModalOpen(false)
    setEditingCollaboratorId('')
    setCollaboratorForm(emptyCollaborator)
  }

  function openCollaboratorCreateModal() {
    if (!canUseCollaboratorsFeature) {
      handleLockedFeature(getLockedFeatureMessage('collaborators'))
      return
    }

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
      if (isCollaborator && name === 'collaboratorId') {
        return {
          ...current,
          collaboratorId: loggedInCollaboratorId
        }
      }

      const next = { ...current, [name]: value }

      if (name === 'paymentMethod' && !['cash', 'dinheiro'].includes(value)) {
        next.amountReceived = ''
        next.changeAmount = ''
      }

      if (isCollaborator) {
        next.collaboratorId = loggedInCollaboratorId
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
    setSubmittingService(true)

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
        setSuccess('Servico atualizado com sucesso.')
      } else {
        await api.post('/barber/services', payload)
        setSuccess('Servico cadastrado com sucesso.')
      }

      resetServiceEditor()
      await loadData()

      if (activeView === 'services') {
        await loadServiceCatalog(serviceFilters, { keepFullList: true, showError: false })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel salvar o servico')
    } finally {
      setSubmittingService(false)
    }
  }

  async function editService(serviceId) {
    setError('')
    setSuccess('')

    try {
      const response = await api.get(`/barber/services/${serviceId}`)
      setEditingServiceId(serviceId)
      setServiceForm(normalizeServiceForm(response.data.data))
      setServiceDrawerOpen(true)
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

  function requestServiceDelete(serviceId) {
    setDeleteServiceId(serviceId)
  }

  async function removeService() {
    setError('')
    setSuccess('')

    if (!deleteServicePassword && !deleteServicePin) {
      setError('Informe a senha admin ou PIN para excluir')
      return
    }

    try {
      await api.delete(`/barber/services/${deleteServiceId}`, {
        data: {
          adminPassword: deleteServicePassword,
          pin: deleteServicePin
        }
      })
      if (editingServiceId === deleteServiceId) {
        resetServiceEditor()
      }
      closeServiceDeleteModal()
      setSuccess('Servico excluido com seguranca.')
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

    if (!canUseCollaboratorsFeature) {
      handleLockedFeature(getLockedFeatureMessage('collaborators'))
      return
    }

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
        canMakeBarter: collaboratorForm.canMakeBarter,
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
      console.error('Erro ao salvar colaborador:', err)
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
        canMakeBarter: Boolean(collaborator.can_make_barter),
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

  async function cancelAppointment(appointmentId, reason = '') {
    setError('')
    setSuccess('')

    try {
      await api.patch(`/barber/appointments/${appointmentId}/cancel`, { reason })
      setSuccess('Agendamento cancelado')
      await loadData({ clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel cancelar o agendamento')
    }
  }

  async function rescheduleAppointment(appointmentId, date, time) {
    setError('')
    setSuccess('')

    try {
      const startsAt = buildAppointmentStartsAt(date, time)
      await api.patch(`/barber/appointments/${appointmentId}/reschedule`, {
        startsAt
      })
      setSuccess('Agendamento remarcado')
      await loadData({ clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel remarcar o agendamento')
    }
  }

  async function deleteAppointment(appointmentId) {
    if (!window.confirm('Excluir permanentemente este agendamento?')) return

    setError('')
    setSuccess('')

    try {
      await api.delete(`/barber/appointments/${appointmentId}`)
      setSuccess('Agendamento excluido')
      await loadData({ clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel excluir o agendamento')
    }
  }

  async function saveWorkingHours(hoursData) {
    setError('')
    setSuccess('')
    try {
      await api.post('/barber/working-hours', hoursData)
      setSuccess('Horario de funcionamento atualizado')
      await loadData({ clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar horario')
    }
  }

  function updateAppointmentForm(event) {
    const { name, value } = event.target
    setAppointmentForm((current) => ({
      ...current,
      [name]: value
    }))
  }

  function updateSalesFilters(event) {
    const { name, value } = event.target
    setSalesFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === 'period' && value !== 'custom' ? { startDate: '', endDate: '' } : {})
    }))
  }

  function closeAppointmentComposer() {
    setAppointmentComposerOpen(false)
    setAppointmentForm(buildEmptyAppointmentForm({
      appointmentDate: appointmentFilters.date || new Date().toISOString().slice(0, 10),
      collaboratorId: isCollaborator ? loggedInCollaboratorId : ''
    }))
  }

  function openAppointmentComposer(seed = {}) {
    if (!canManageCash) {
      return
    }

    setError('')
    setSuccess('')
    setAppointmentForm(buildEmptyAppointmentForm({
      appointmentDate: appointmentFilters.date || new Date().toISOString().slice(0, 10),
      collaboratorId: isCollaborator ? loggedInCollaboratorId : '',
      ...seed
    }))
    setAppointmentComposerOpen(true)
  }

  async function submitAppointment(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmittingAppointment(true)

    try {
      const startsAt = buildAppointmentStartsAt(appointmentForm.appointmentDate, appointmentForm.appointmentTime)
      await api.post('/barber/appointments', {
        serviceId: appointmentForm.serviceId,
        collaboratorId: appointmentForm.collaboratorId,
        customerName: appointmentForm.customerName,
        customerPhone: appointmentForm.customerPhone,
        customerEmail: appointmentForm.customerEmail,
        notes: appointmentForm.notes,
        startsAt
      })
      setSuccess('Agendamento criado com sucesso')
      closeAppointmentComposer()
      await loadData({ clearMessage: false })
    } catch (err) {
      console.error('Erro ao criar agendamento:', err)
      setError(err.response?.data?.error || 'Nao foi possivel criar o agendamento')
    } finally {
      setSubmittingAppointment(false)
    }
  }

  async function saveScheduleBlock(blockData) {
    setError('')
    setSuccess('')
    try {
      await api.post('/barber/schedule/blocks', blockData)
      setSuccess('Bloqueio de agenda criado')
      await loadData({ clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar bloqueio')
    }
  }

  async function deleteScheduleBlock(blockId) {
    setError('')
    setSuccess('')
    try {
      await api.delete(`/barber/schedule/blocks/${blockId}`)
      setSuccess('Bloqueio removido')
      await loadData({ clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao remover bloqueio')
    }
  }

  async function createSale(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const effectiveCollaboratorId = isCollaborator
      ? loggedInCollaboratorId
      : saleForm.collaboratorId

    const saleItemsPayload = saleForm.items.length > 0
      ? saleForm.items.map((item) => ({
        itemType: item.itemType,
        itemId: item.itemId,
        service_id: item.itemType === 'service' ? item.itemId : undefined,
        product_id: item.itemType === 'product' ? item.itemId : undefined,
        collaborator_id: effectiveCollaboratorId || undefined,
        quantity: Number(item.quantity || 1)
      }))
      : selectedSaleSource
        ? [{
          itemType: selectedSaleItemType,
          itemId: selectedSaleSource.id,
          service_id: selectedSaleItemType === 'service' ? selectedSaleSource.id : undefined,
          product_id: selectedSaleItemType === 'product' ? selectedSaleSource.id : undefined,
          collaborator_id: effectiveCollaboratorId || undefined,
          quantity: Number(saleForm.quantity || 1)
        }]
        : []

    if (!effectiveCollaboratorId && canManageCash) {
      setError('Selecione um colaborador')
      return
    }

    if (isCollaborator && !effectiveCollaboratorId) {
      setError('Nao foi possivel identificar o colaborador autenticado')
      return
    }

    if (saleItemsPayload.length === 0) {
      setError('Adicione ao menos um servico')
      return
    }

    if (saleForm.paymentMethod === 'permuta' && !canUseBarterForSale) {
      setError('Permuta nao liberada pelo administrador.')
      return
    }

    if (isCashPayment && saleChangeDue < 0) {
      setError('Valor recebido menor que o valor do servico')
      return
    }

    try {
      setSubmittingSale(true)
      await api.post('/barber/sales', {
        collaboratorId: effectiveCollaboratorId || null,
        clientName: saleForm.clientName || null,
        paymentMethod: saleForm.paymentMethod,
        amountReceived: isCashPayment ? Number(saleForm.amountReceived || 0) : undefined,
        changeAmount: isCashPayment ? Math.max(0, saleChangeDue) : 0,
        notes: saleForm.notes,
        items: saleItemsPayload
      })

      setSaleModalOpen(false)
      resetSaleWizard('success')
      setSuccess('Atendimento concluido com sucesso')
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

  async function loadSettlementPreview(nextFilters = settlementFilters) {
    const collaboratorId = nextFilters.collaboratorId || ''
    setSettlementCollaboratorId(collaboratorId)
    setSettlementFilters(nextFilters)
    setSettlementPreview(null)

    if (!collaboratorId) {
      return
    }

    try {
      const response = await api.get('/barber/settlements', {
        params: {
          collaboratorId,
          startDate: nextFilters.startDate || undefined,
          endDate: nextFilters.endDate || undefined
        }
      })
      setSettlementPreview(response.data.data.preview)
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel calcular o fechamento')
    }
  }

  function updateSettlementFilters(event) {
    const { name, value } = event.target
    setSettlementFilters((current) => {
      const next = { ...current, [name]: value }
      if (name === 'collaboratorId') {
        setSettlementCollaboratorId(value)
        setSettlementPreview(null)
      }
      return next
    })
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
        collaboratorId: settlementCollaboratorId,
        startDate: settlementFilters.startDate || undefined,
        endDate: settlementFilters.endDate || undefined
      })

      setSuccess('Fechamento registrado')
      setSettlementPreview(null)
      setSettlementCollaboratorId('')
      setSettlementFilters(defaultSettlementFilters)
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

    const canceledSaleId = deleteSaleId

    if (!canceledSaleId) {
      return
    }

    if (!deleteReason.trim()) {
      setError('Informe o motivo da exclusao')
      return
    }

    if (!deletePin) {
      setError('Informe o PIN admin para cancelar')
      return
    }

    try {
      await api.post(`/barber/sales/${canceledSaleId}/cancel`, {
        reason: deleteReason,
        pin: deletePin
      })

      setSales((current) => current.filter((sale) => sale.id !== canceledSaleId))
      setDashboard((current) => ({
        ...current,
        recentSales: Array.isArray(current.recentSales)
          ? current.recentSales.filter((sale) => sale.id !== canceledSaleId)
          : current.recentSales
      }))
      setPersonalReport((current) => ({
        ...current,
        recentSales: Array.isArray(current.recentSales)
          ? current.recentSales.filter((sale) => sale.id !== canceledSaleId)
          : current.recentSales,
        sales: Array.isArray(current.sales)
          ? current.sales.filter((sale) => sale.id !== canceledSaleId)
          : current.sales
      }))
      setDeleteSaleId('')
      setDeleteReason('')
      setDeletePassword('')
      setDeletePin('')
      setSuccess('Atendimento cancelado')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel cancelar o atendimento')
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
              setSaleForm(buildEmptySaleForm(loggedInCollaboratorId))
              setSaleModalOpen(true)
            }}
            recentAttendances={collaboratorRecentAttendances}
            user={user}
          />
        )
      }

      const collaboratorTodayCommission = collaboratorMetrics.today?.commission ?? collaboratorMetrics.todayCommission ?? 0
      const collaboratorTodayBarterTotal = collaboratorMetrics.today?.barterTotal ?? collaboratorMetrics.todayBarterTotal ?? 0
      const collaboratorTodayBarterCommission = collaboratorMetrics.today?.barterCommission ?? collaboratorMetrics.todayBarterCommission ?? 0
      const collaboratorWeekCommission = collaboratorMetrics.week?.commission ?? collaboratorMetrics.weekCommission ?? 0
      const collaboratorMonthCommission = collaboratorMetrics.month?.commission ?? collaboratorMetrics.monthCommission ?? 0
      const collaboratorTodayAttendances = collaboratorMetrics.today?.appointments ?? collaboratorMetrics.todayAttendances ?? 0
      const collaboratorTodayServices = collaboratorMetrics.today?.services ?? collaboratorMetrics.todayServices ?? collaboratorTodayAttendances
      const collaboratorMonthAttendances = collaboratorMetrics.month?.appointments ?? collaboratorMetrics.monthAttendances ?? 0
      const collaboratorNetBalance = collaboratorMetrics.mySettlementBalance || collaboratorMetrics.netCommission || 0
      const pendingAdvancesCount = advances.filter((advance) => advance.status === 'pending').length

      const collaboratorCards = [
        {
          title: 'Comissao do dia',
          value: money(collaboratorTodayCommission),
          detail: 'Baseado nos atendimentos que voce lancou hoje',
          glow: 'green'
        },
        {
          title: 'Atendimentos hoje',
          value: `${collaboratorTodayAttendances}`,
          detail: 'Somente registros vinculados ao seu usuario',
          glow: 'blue'
        },
        {
          title: 'Servicos executados',
          value: `${collaboratorTodayServices}`,
          detail: 'Servicos do dia retornados pelo resumo pessoal',
          glow: 'gold'
        },
        {
          title: 'Permutas hoje',
          value: money(collaboratorTodayBarterTotal),
          detail: 'Valor cheio lancado como permuta',
          glow: 'red'
        },
        {
          title: 'Desconto por permuta',
          value: money(-Math.abs(collaboratorTodayBarterCommission)),
          detail: 'Comissao de permuta debitada do saldo',
          glow: 'red'
        },
        {
          title: 'Saldo liquido atual',
          value: money(collaboratorNetBalance),
          detail: `${pendingAdvancesCount} vale(s) pendente(s), quando houver`,
          glow: Number(collaboratorNetBalance) < 0 ? 'red' : 'green'
        }
      ]

      return (
        <>
          <section className="barber-hero-grid">
            <div className="barber-hero-card barber-hero-card-compact">
              <span className="barber-overline">Barber Store colaborador</span>
              <h2>Sua producao e sua comissao em tempo real</h2>
              <p>
                Painel focado apenas nos seus atendimentos, comissao acumulada e historico pessoal,
                sem expor valores financeiros da barbearia.
              </p>
              <div className="barber-inline-kpis">
                <span>{collaboratorTodayAttendances} atendimentos hoje</span>
                <span>{collaboratorRecentAttendances.length} registros recentes</span>
                <span>{pendingAdvancesCount} vales pendentes</span>
              </div>
            </div>

            <BarberCard>
              <div className="barber-list-header">
                <div>
                  <h2>Resumo pessoal</h2>
                  <p>Indicadores liberados para o seu perfil.</p>
                </div>
                <BarberBadge tone="admin">{money(collaboratorNetBalance)}</BarberBadge>
              </div>

              <div className="barber-summary-grid">
                <div className="barber-summary-item">
                  <div>
                    <strong>Liquido previsto</strong>
                    <p>Comissao menos permutas e adiantamentos</p>
                  </div>
                  <strong>{money(collaboratorNetBalance)}</strong>
                </div>
                <div className="barber-summary-item">
                  <div>
                    <strong>Comissao do dia</strong>
                    <p>Gerada nos seus atendimentos de hoje</p>
                  </div>
                  <strong>{money(collaboratorTodayCommission)}</strong>
                </div>
                <div className="barber-summary-item">
                  <div>
                    <strong>Permutas do dia</strong>
                    <p>Total de atendimentos marcados como permuta</p>
                  </div>
                  <strong>{money(collaboratorTodayBarterTotal)}</strong>
                </div>
                <div className="barber-summary-item">
                  <div>
                    <strong>Desconto por permuta</strong>
                    <p>Débito aplicado ao seu saldo</p>
                  </div>
                  <strong>{money(-Math.abs(collaboratorTodayBarterCommission))}</strong>
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
                      <span>{paymentLabel(sale.payment_method)} - {fullDate(sale.created_at)}</span>
                    </div>
                    <div className="barber-activity-value">
                      <strong>{sale.commission_effect === 'debit' ? money(-Math.abs(Number(sale.commission_amount || 0))) : money(sale.commission_amount || 0)}</strong>
                      <BarberBadge tone={paymentTone(sale.payment_method)}>{sale.commission_effect === 'debit' ? 'Permuta' : 'Comissao'}</BarberBadge>
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

    const cashBalance = dashboard.cashSession?.current_balance
      ?? dashboard.cashSession?.net_total
      ?? dashboard.cashSession?.netTotal
      ?? dashboard.cashBalance
      ?? (
        Number(dashboard.totalCash || 0)
        + Number(dashboard.totalPix || 0)
        + Number(dashboard.totalCredit || 0)
        + Number(dashboard.totalDebit || 0)
      )

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
        title: 'Atendimentos do dia',
        value: `${todaySalesCount}`,
        detail: 'Movimento registrado hoje',
        glow: 'blue',
        highlight: 'positive',
        meta: 'Operacao'
      },
      {
        title: 'Comissao gerada hoje',
        value: money(dashboard.totalCommissions),
        detail: 'Comissao consolidada da equipe',
        glow: 'green',
        highlight: 'positive',
        meta: 'Equipe'
      },
      {
        title: 'Dinheiro recebido',
        value: money(dashboard.totalCash),
        detail: 'Entradas no caixa fisico',
        glow: 'gold',
        highlight: 'gold',
        meta: 'Presencial'
      },
      {
        title: 'Pix recebido',
        value: money(dashboard.totalPix),
        detail: 'Recebimentos digitais do dia',
        glow: 'blue',
        highlight: 'positive',
        meta: 'Liquidez'
      },
      {
        title: 'Permutas do dia',
        value: money(dashboard.totalPermuta),
        detail: 'Registro separado do caixa recebido',
        glow: 'red',
        highlight: 'gold',
        meta: 'Permuta'
      },
      {
        title: 'Cartão Crédito',
        value: money(dashboard.totalCredit),
        detail: 'Pagamentos em crédito',
        glow: 'blue',
        highlight: 'positive',
        meta: 'Cartão'
      },
      {
        title: 'Cartão Débito',
        value: money(dashboard.totalDebit),
        detail: 'Pagamentos em débito',
        glow: 'green',
        highlight: 'positive',
        meta: 'Cartão'
      },
      {
        title: 'Saldo do caixa',
        value: money(cashBalance),
        detail: 'Permutas ficam fora do caixa recebido',
        glow: 'gold',
        highlight: 'gold',
        meta: 'Caixa'
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
        <section className="barber-hero-grid barber-overview-intro">
          <div className="barber-hero-card barber-hero-card-compact">
            <span className="barber-overline">Barber Store</span>
            <h2>Visao geral do dia da barbearia</h2>
            <p>
              Painel diario com dados reais de atendimentos, caixa, pagamentos, comissoes e permutas,
              sem misturar relatorios semanais ou mensais.
            </p>
            <div className="barber-inline-kpis">
              <span>{todaySalesCount} atendimentos hoje</span>
              <span>{money(dashboard.totalDaySales)} faturados hoje</span>
              <span>{money(dashboard.totalPermuta)} em permutas</span>
              <span>{collaborators.filter((collaborator) => collaborator.is_active).length} colaboradores ativos</span>
            </div>
          </div>

          <ChartCard
            title="Ranking do dia"
            subtitle="Resumo de desempenho carregado pelo dashboard atual."
            badge={`${ranking.length} no radar`}
            badgeVariant="info"
          >
            {ranking.length > 0 ? (
              <div className="ds-ranking-list">
                {ranking.map((item, index) => (
                  <RankingItem
                    key={item.collaborator_id || item.collaborator_name}
                    index={index + 1}
                    name={item.collaborator_name}
                    detail={`${money(item.total_commission)} em comissao acumulada`}
                    value={money(item.total_sales)}
                  />
                ))}
              </div>
            ) : (
              <div className="ds-chart-empty">
                <div className="ds-chart-empty__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48 }}>
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="ds-chart-empty__title">Sem ranking disponivel</h3>
                <p className="ds-chart-empty__description">As vendas do periodo vao preencher o ranking automaticamente.</p>
              </div>
            )}
          </ChartCard>
        </section>

        <section className="barber-kpi-grid">
          {dashboardCards.map((card, index) => {
            const iconMap = {
              green: { icon: TrendingUp, variant: 'success' },
              blue: { icon: CalendarCheck, variant: 'info' },
              gold: { icon: DollarSign, variant: 'warning' },
              red: { icon: Repeat, variant: 'danger' }
            }
            const { icon: CardIcon, variant: iconVariant } = iconMap[card.glow] || { icon: TrendingUp, variant: 'accent' }

            return (
              <StatCard
                key={card.title}
                compact={index > 0}
                primary={index === 0}
                icon={CardIcon}
                iconVariant={iconVariant}
                label={card.title}
                trendLabel={card.detail}
                value={card.value}
              />
            )
          })}
        </section>

        <section className="barber-secondary-kpis">
          {secondaryCards.map((card) => {
            const iconMap = {
              green: { icon: Percent, variant: 'success' },
              blue: { icon: CalendarCheck, variant: 'info' },
              gold: { icon: Landmark, variant: 'warning' },
              red: { icon: TrendingUp, variant: 'danger' }
            }
            const { icon: CardIcon, variant: iconVariant } = iconMap[card.glow] || { icon: TrendingUp, variant: 'accent' }

            return (
              <StatCard
                key={card.title}
                compact
                icon={CardIcon}
                iconVariant={iconVariant}
                label={card.title}
                trendLabel={card.detail}
                value={card.value}
              />
            )
          })}
        </section>

        <section className="barber-grid-two">
          <ChartCard
            title="Faturamento por dia"
            subtitle="Últimos 7 dias com leitura rápida de tendência."
            badge="Receita"
            badgeVariant="cash"
            value={money(salesChartData.reduce((sum, item) => sum + item.total, 0))}
          >
            {salesChartData.length > 0 ? (
              <div style={{ width: '100%', minHeight: 280, height: 280 }}>
                <ResponsiveContainer debounce={50} height="100%" minHeight={280} minWidth={260} width="100%">
                  <BarChart data={salesChartData}>
                    <defs>
                      <linearGradient id="barberSalesGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="var(--success)" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border-subtle)" vertical={false} strokeDasharray="0" />
                    <XAxis
                      dataKey="label"
                      stroke="var(--text-muted)"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      tickFormatter={(value) => `R$${Math.round(value / 1000)}k`}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      width={48}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="total" fill="url(#barberSalesGradient)" radius={[8, 8, 4, 4]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="ds-chart-empty">
                <div className="ds-chart-empty__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 56, height: 56 }}>
                    <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 16l4-4 4 4 5-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="ds-chart-empty__title">Sem dados para o gráfico</h3>
                <p className="ds-chart-empty__description">As vendas dos últimos dias aparecerão aqui assim que o caixa tiver movimentação.</p>
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Últimas vendas"
            subtitle="Atividades mais recentes para auditoria rápida."
            badge={`${dashboard.recentSales.length} registros`}
            badgeVariant="info"
          >
            {dashboard.recentSales.length > 0 ? (
              <div className="ds-activity-list">
                {dashboard.recentSales.map((sale) => (
                  <div className="ds-activity-item" key={sale.id}>
                    <div className="ds-activity-item__avatar">
                      {(sale.collaborator_name || 'S').slice(0, 1)}
                    </div>
                    <div className="ds-activity-item__content">
                      <div className="ds-activity-item__title">{sale.collaborator_name || 'Sem colaborador'}</div>
                      <div className="ds-activity-item__meta">{paymentLabel(sale.payment_method)} - {fullDate(sale.created_at)}</div>
                    </div>
                    <div className="ds-activity-item__value">
                      <span className="ds-activity-item__amount">{money(sale.total_amount)}</span>
                      <span className={`ds-activity-item__badge ds-chart-stat__badge--${paymentTone(sale.payment_method)}`}>
                        {paymentLabel(sale.payment_method)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ds-chart-empty">
                <div className="ds-chart-empty__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 9h6M9 13h4" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="ds-chart-empty__title">Sem atividades recentes</h3>
                <p className="ds-chart-empty__description">Assim que novas vendas entrarem, elas aparecem aqui com pagamento e responsável.</p>
              </div>
            )}
          </ChartCard>
        </section>

      </>
    )
  }

  function renderServices() {
    return (
      <Servicos
        deletePassword={deleteServicePassword}
        deletePin={deleteServicePin}
        deleteTarget={serviceCatalog.find((service) => service.id === deleteServiceId) || null}
        deleteOpen={Boolean(deleteServiceId)}
        filters={serviceFilters}
        form={serviceForm}
        isAdmin={isAdmin}
        isEditing={isEditingService}
        isSaving={submittingService}
        isDrawerOpen={serviceDrawerOpen}
        money={money}
        onCancelEdit={resetServiceEditor}
        onCloseDelete={closeServiceDeleteModal}
        onCloseDrawer={resetServiceEditor}
        onDelete={requestServiceDelete}
        onDeleteConfirm={removeService}
        onEdit={editService}
        onFilterChange={updateServiceFilters}
        onFormChange={updateServiceForm}
        onOpenCreate={openServiceCreateDrawer}
        onDeletePasswordChange={setDeleteServicePassword}
        onDeletePinChange={setDeleteServicePin}
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

    const summaryCards = isCollaborator
      ? [
          { label: 'Hoje', value: appointmentGroups.today.length, tone: 'cash' },
          { label: 'Confirmados', value: appointmentGroups.active.length, tone: 'approved' },
          { label: 'Finalizados', value: appointmentGroups.completed.length, tone: 'admin' },
          { label: 'Faltas', value: filteredAppointments.filter((appointment) => appointment.status === 'no_show').length, tone: 'danger' }
        ]
      : [
          { label: 'Agendamentos hoje', value: appointmentsOverview.summary.appointments_today, tone: 'cash' },
          { label: 'Confirmados', value: appointmentGroups.active.length, tone: 'approved' },
          { label: 'Faltas', value: filteredAppointments.filter((appointment) => appointment.status === 'no_show').length, tone: 'danger' },
          { label: 'Ocupacao do dia', value: `${Math.max(0, Math.min(100, Math.round((appointmentGroups.today.length / Math.max(appointmentsOverview.summary.available_collaborators || 1, 1)) * 25)))}%`, tone: 'pix' }
        ]

    const collaboratorOptions = isCollaborator
      ? [loggedInCollaborator].filter(Boolean)
      : collaborators.filter((collaborator) => collaborator.is_active && !collaborator.is_deleted)
    const agendaDate = appointmentFilters.date || new Date().toISOString().slice(0, 10)
    const currentDate = new Date(`${agendaDate}T00:00:00`)
    const currentMonth = new Date(`${agendaMonthCursor.slice(0, 7)}-01T00:00:00`)
    const selectedCollaboratorIds = isCollaborator
      ? [loggedInCollaboratorId]
      : appointmentFilters.collaboratorId === 'all'
        ? collaboratorOptions.map((collaborator) => collaborator.id)
        : [appointmentFilters.collaboratorId]
    const collaboratorsForGrid = collaboratorOptions.filter((collaborator) => selectedCollaboratorIds.includes(collaborator.id))
    const todayDate = new Date().toISOString().slice(0, 10)
    const todayList = appointmentsWithMeta.filter((appointment) => appointment.dateKey === todayDate)
    const selectedDateLabel = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    }).format(currentDate)
    const shiftAgendaDate = (amount) => {
      const next = new Date(currentDate)
      next.setDate(next.getDate() + amount)
      const nextDate = next.toISOString().slice(0, 10)
      setAppointmentFilters((current) => ({ ...current, date: nextDate }))
      setAgendaMonthCursor(nextDate)
      setActiveAgendaAppointment(null)
    }
    const selectedWeekday = currentDate.getDay()
    const fallbackWorkingHours = agendaWeekdayLabels.map((_, weekday) => ({
      id: `fallback-${weekday}`,
      company_id: user?.company_id || '',
      collaborator_id: null,
      weekday,
      opens_at: '08:00',
      closes_at: '20:00',
      is_closed: false
    }))
    const effectiveWorkingHours = workingHours.length > 0 ? workingHours : fallbackWorkingHours
    const workingHoursByCollaborator = Object.fromEntries(
      collaboratorsForGrid.map((collaborator) => {
        const specific = effectiveWorkingHours.find((item) => item.weekday === selectedWeekday && item.collaborator_id === collaborator.id)
        const companyWide = effectiveWorkingHours.find((item) => item.weekday === selectedWeekday && !item.collaborator_id)
        return [collaborator.id, specific || companyWide || null]
      })
    )
    const dayWorkingHours = effectiveWorkingHours.find((item) => item.weekday === selectedWeekday && !item.collaborator_id) || null
    const nextOpeningLabel = dayWorkingHours?.is_closed
      ? 'Dia fechado'
      : `${dayWorkingHours?.opens_at || '08:00'} - ${dayWorkingHours?.closes_at || '20:00'}`
    const blockedAppointmentsForSelectedDay = scheduleBlocks.flatMap((block) => {
      const startsAt = new Date(block.starts_at)
      const endsAt = new Date(block.ends_at)
      const dayStart = new Date(`${agendaDate}T00:00:00`)
      const dayEnd = new Date(`${agendaDate}T23:59:59`)

      if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
        return []
      }

      if (!(startsAt < dayEnd && endsAt > dayStart)) {
        return []
      }

      const targetCollaborators = block.collaborator_id
        ? collaboratorsForGrid.filter((collaborator) => collaborator.id === block.collaborator_id)
        : collaboratorsForGrid

      return targetCollaborators.map((collaborator) => ({
        id: `blocked-${block.id}-${collaborator.id}`,
        company_id: user?.company_id || '',
        collaborator_id: collaborator.id,
        collaborator_name: collaborator.nickname || collaborator.name || 'Colaborador',
        customer_name: 'Horario bloqueado',
        customer_phone: '',
        service_name: block.reason || 'Bloqueio manual',
        reason: block.reason || 'Bloqueio manual',
        status: 'blocked',
        starts_at: block.starts_at,
        ends_at: block.ends_at,
        appointment_date_label: shortDate(block.starts_at),
        timeLabel: `${String(startsAt.getHours()).padStart(2, '0')}:${String(startsAt.getMinutes()).padStart(2, '0')}`,
        timeCompactLabel: `${String(startsAt.getHours()).padStart(2, '0')}:${String(startsAt.getMinutes()).padStart(2, '0')}`,
        slotLabel: `${String(startsAt.getHours()).padStart(2, '0')}:${String(startsAt.getMinutes()).padStart(2, '0')} - ${String(endsAt.getHours()).padStart(2, '0')}:${String(endsAt.getMinutes()).padStart(2, '0')}`,
        dateKey: agendaDate,
        duration_label: `${Math.max(0, Math.round((endsAt - startsAt) / 60000))} min`,
        service_price_label: '-',
        notes: block.reason || 'Horario indisponivel para novos agendamentos.'
      }))
    })
    const appointmentsForSelectedDay = [
      ...appointmentsWithMeta.filter((appointment) => appointment.dateKey === agendaDate),
      ...blockedAppointmentsForSelectedDay
    ].sort((left, right) => String(left.starts_at || '').localeCompare(String(right.starts_at || '')))
    const appointmentsForGrid = appointmentsForSelectedDay.filter((appointment) => collaboratorsForGrid.some((collaborator) => collaborator.id === appointment.collaborator_id))

    const weekDays = Array.from({ length: 7 }, (_, index) => {
      const base = new Date(currentDate)
      base.setDate(currentDate.getDate() - currentDate.getDay() + index)
      const dateKey = base.toISOString().slice(0, 10)
      return {
        key: dateKey,
        label: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(base),
        day: String(base.getDate()).padStart(2, '0')
      }
    })

    const firstDay = new Date(currentMonth)
    const start = new Date(firstDay)
    start.setDate(1 - firstDay.getDay())
    const monthMatrix = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return {
        key: date.toISOString(),
        date: date.toISOString().slice(0, 10),
        day: date.getDate(),
        inMonth: date.getMonth() === currentMonth.getMonth()
      }
    })

    const miniCalendar = {
      monthLabel: new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentMonth),
      days: monthMatrix,
      goPrevMonth: () => {
        const next = new Date(currentMonth)
        next.setMonth(next.getMonth() - 1)
        setAgendaMonthCursor(next.toISOString().slice(0, 10))
      },
      goNextMonth: () => {
        const next = new Date(currentMonth)
        next.setMonth(next.getMonth() + 1)
        setAgendaMonthCursor(next.toISOString().slice(0, 10))
      }
    }

    return (
      <section className="barber-page">
        {!isCollaborator && (
          <div className="barber-grid-two">
            <BarberCard className="barber-appointments-link-card">
              <div className="barber-table-header">
                <div>
                  <h2>Link publico da agenda</h2>
                  <p>Compartilhe com seus clientes para receber agendamentos online.</p>
                </div>
                <BarberButton onClick={copyBookingLink} variant="primary">Copiar link</BarberButton>
              </div>
              <div className="barber-appointments-link-box">
                <strong>{publicBookingUrl || 'Configurando link...'}</strong>
              </div>
            </BarberCard>

            <div className="barber-kpi-grid">
              {summaryCards.map((card) => (
                <BarberCard key={card.label}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </BarberCard>
              ))}
            </div>
          </div>
        )}

        {isCollaborator && (
          <div className="barber-kpi-grid">
            {summaryCards.map((card) => (
              <BarberCard key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </BarberCard>
            ))}
          </div>
        )}

        <BarberCard className="barber-appointments-workspace">
          <div className="agenda-board-shell">
            <div className="agenda-board-main">
              <div className="barber-table-header agenda-board-header">
                <div>
                  <h2>{isCollaborator ? 'Minha agenda' : 'Agenda da barbearia'}</h2>
                  <p>{isCollaborator ? 'Veja seus horarios do dia e avance cada atendimento com poucos cliques.' : 'Gerencie a operacao do dia em uma grade clara, moderna e pronta para escalar.'}</p>
                </div>
                <div className="barber-inline-actions">
                  {!isCollaborator && (
                    <BarberButton
                      onClick={() => openAppointmentComposer({
                        appointmentDate: agendaDate,
                        collaboratorId: collaboratorsForGrid[0]?.id || ''
                      })}
                      type="button"
                      variant="primary"
                    >
                      + Novo agendamento
                    </BarberButton>
                  )}
                  {!isCollaborator && publicBookingUrl && (
                    <BarberButton onClick={copyBookingLink} type="button" variant="ghost">
                      Copiar link publico
                    </BarberButton>
                  )}
                </div>
              </div>

              <AgendaToolbar
                mode={agendaMode}
                onModeChange={setAgendaMode}
                onNext={() => shiftAgendaDate(agendaMode === 'week' ? 7 : 1)}
                onPrev={() => shiftAgendaDate(agendaMode === 'week' ? -7 : -1)}
                onToday={() => {
                  setAppointmentFilters((current) => ({ ...current, date: todayDate }))
                  setAgendaMonthCursor(todayDate)
                  setActiveAgendaAppointment(null)
                }}
                onToggleFilters={() => setShowAgendaFilters((current) => !current)}
                selectedDate={agendaDate}
                showFilters={showAgendaFilters}
              />

              {showAgendaFilters && (
                <div className="agenda-filters-panel">
                  <label className="barber-form-block">
                    <span>Data</span>
                    <input
                      className="barber-input"
                      type="date"
                      value={agendaDate}
                      onChange={(event) => {
                        const nextDate = event.target.value
                        setAppointmentFilters((current) => ({ ...current, date: nextDate }))
                        setAgendaMonthCursor(nextDate || new Date().toISOString().slice(0, 10))
                        setActiveAgendaAppointment(null)
                      }}
                    />
                  </label>

                  {!isCollaborator && (
                    <label className="barber-form-block">
                      <span>Colaborador</span>
                      <select
                        className="barber-select"
                        value={appointmentFilters.collaboratorId}
                        onChange={(event) => setAppointmentFilters((current) => ({ ...current, collaboratorId: event.target.value }))}
                      >
                        <option value="all">Toda a equipe</option>
                        {collaboratorOptions.map((collaborator) => (
                          <option key={collaborator.id} value={collaborator.id}>
                            {collaborator.nickname || collaborator.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <label className="barber-form-block">
                    <span>Status</span>
                    <select
                      className="barber-select"
                      value={appointmentFilters.status}
                      onChange={(event) => setAppointmentFilters((current) => ({ ...current, status: event.target.value }))}
                    >
                      <option value="all">Todos</option>
                      <option value="scheduled">Agendado</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="arrived">Chegou</option>
                      <option value="in_progress">Em atendimento</option>
                      <option value="completed">Finalizado</option>
                      <option value="no_show">Faltou</option>
                      <option value="canceled">Cancelado</option>
                    </select>
                  </label>

                  <div className="agenda-filters-actions">
                    <BarberButton onClick={() => setAppointmentFilters({ ...defaultAppointmentFilters, date: todayDate })} type="button" variant="ghost">
                      Limpar filtros
                    </BarberButton>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isCollaborator && (
            <div className="barber-tabs">
              {['list', 'blocks', 'hours'].map((tab) => (
                <button
                  key={tab}
                  className={`barber-tab ${appointmentViewTab === tab ? 'active' : ''}`}
                  onClick={() => setAppointmentViewTab(tab)}
                >
                  {tab === 'list' ? 'Agenda' : tab === 'blocks' ? 'Bloqueios' : 'Funcionamento'}
                </button>
              ))}
            </div>
          )}

          <div className="barber-tab-content">
            {(isCollaborator || appointmentViewTab === 'list') && (
              <div className="agenda-studio-layout">
                <div className="agenda-main-panel">
                  <div className="agenda-summary-strip">
                    <div className="agenda-summary-card">
                      <span>Data selecionada</span>
                      <strong>{selectedDateLabel}</strong>
                    </div>
                    <div className="agenda-summary-card">
                      <span>Agendamentos do dia</span>
                      <strong>{appointmentsForSelectedDay.filter((appointment) => appointment.status !== 'blocked').length}</strong>
                    </div>
                    <div className="agenda-summary-card">
                      <span>Confirmados</span>
                      <strong>{appointmentsForSelectedDay.filter((appointment) => ['confirmed', 'arrived', 'in_progress'].includes(appointment.status)).length}</strong>
                    </div>
                    <div className="agenda-summary-card">
                      <span>Funcionamento</span>
                      <strong>{nextOpeningLabel}</strong>
                    </div>
                  </div>

                  {agendaMode === 'week' && (
                    <div className="agenda-week-days">
                      {weekDays.map((day) => (
                        <button
                          className={day.key === agendaDate ? 'active' : ''}
                          key={day.key}
                          onClick={() => setAppointmentFilters((current) => ({ ...current, date: day.key }))}
                          type="button"
                        >
                          <span>{day.label}</span>
                          <strong>{day.day}</strong>
                        </button>
                      ))}
                    </div>
                  )}

                  {isMobileViewport ? (
                    <div className="agenda-mobile-list">
                      {!isCollaborator && (
                        <BarberButton
                          className="agenda-mobile-create"
                          onClick={() => openAppointmentComposer({
                            appointmentDate: agendaDate,
                            collaboratorId: collaboratorsForGrid[0]?.id || ''
                          })}
                          type="button"
                          variant="secondary"
                        >
                          + Novo agendamento
                        </BarberButton>
                      )}
                      {appointmentsForSelectedDay.map((app) => (
                        <button className={`agenda-mobile-item status-${app.status || 'scheduled'}`} key={app.id} onClick={() => { setActiveAgendaAppointment(app); setAgendaModalOpen(true) }} type="button">
                          <strong>{app.customer_name}</strong>
                          <p>{app.service_name}</p>
                          <small>{app.slotLabel}</small>
                        </button>
                      ))}
                      {appointmentsForSelectedDay.length === 0 && (
                        <BarberEmptyState description="Sem atendimentos para o dia selecionado." title="Dia sem reservas" />
                      )}
                    </div>
                  ) : (
                    collaboratorsForGrid.length > 0 ? (
                      <>
                        <p style={{ textAlign: 'center', color: 'var(--barber-muted)', fontSize: '13px', marginBottom: '16px' }}>
                          Clique em um horario livre na grade para criar um agendamento.
                        </p>
                        <AgendaGrid
                          appointments={appointmentsForGrid}
                          collaborators={collaboratorsForGrid}
                          onSelectAppointment={(appointment) => {
                            setActiveAgendaAppointment(appointment)
                          }}
                          onSelectSlot={!isCollaborator ? (slot) => openAppointmentComposer({
                            appointmentDate: agendaDate,
                            appointmentTime: slot.time,
                            collaboratorId: slot.collaboratorId
                          }) : undefined}
                          selectedDate={agendaDate}
                          workingHoursByCollaborator={workingHoursByCollaborator}
                        />
                      </>
                    ) : (
                      <BarberEmptyState description={isCollaborator ? 'Seu perfil ainda nao foi vinculado a um colaborador ativo para montar a agenda.' : 'Cadastre colaboradores ativos para distribuir a grade da agenda.'} title="Sem colaboradores" />
                    )
                  )}
                </div>

                <AppointmentDetailsPanel
                  appointment={activeAgendaAppointment}
                  isCollaborator={isCollaborator}
                  onArrived={(id) => updateAppointmentStatus(id, 'arrived')}
                  onCancel={(appointment) => {
                    const reason = window.prompt('Motivo do cancelamento:')
                    if (reason !== null) {
                      cancelAppointment(appointment.id, reason)
                    }
                  }}
                  onClose={() => setActiveAgendaAppointment(null)}
                  onComplete={(id) => updateAppointmentStatus(id, 'completed')}
                  onConfirm={(id) => updateAppointmentStatus(id, 'confirmed')}
                  onReschedule={(appointment) => {
                    const startsAt = appointment?.starts_at ? new Date(appointment.starts_at) : null
                    const defaultDate = startsAt && !Number.isNaN(startsAt.getTime()) ? startsAt.toISOString().slice(0, 10) : ''
                    const defaultTime = startsAt && !Number.isNaN(startsAt.getTime())
                      ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(startsAt)
                      : ''
                    const newDate = window.prompt('Nova data (AAAA-MM-DD):', defaultDate)
                    const newTime = window.prompt('Novo horario (HH:MM):', defaultTime)
                    if (newDate && newTime) {
                      rescheduleAppointment(appointment.id, newDate, newTime)
                    }
                  }}
                  onStart={(id) => updateAppointmentStatus(id, 'in_progress')}
                />
              </div>
            )}

            {!isCollaborator && appointmentViewTab === 'blocks' && (
              <div className="barber-blocks-view">
                <div className="barber-table-header">
                  <h3>Bloqueios de agenda</h3>
                  <BarberButton onClick={() => {
                    const collab = window.prompt('ID do Colaborador (vazio para todos):')
                    const start = window.prompt('Inicio (AAAA-MM-DD HH:MM):')
                    const end = window.prompt('Fim (AAAA-MM-DD HH:MM):')
                    const reason = window.prompt('Motivo:')
                    if (start && end) saveScheduleBlock({ collaboratorId: collab, startsAt: start, endsAt: end, reason })
                  }} variant="primary">Novo bloqueio</BarberButton>
                </div>
                <BarberTable columns={['Inicio', 'Fim', 'Motivo', 'Acoes']}>
                  {scheduleBlocks.map(block => (
                    <tr key={block.id}>
                      <td>{fullDate(block.starts_at)}</td>
                      <td>{fullDate(block.ends_at)}</td>
                      <td>{block.reason}</td>
                      <td><BarberButton onClick={() => deleteScheduleBlock(block.id)} variant="danger">Remover</BarberButton></td>
                    </tr>
                  ))}
                </BarberTable>
              </div>
            )}

            {!isCollaborator && appointmentViewTab === 'hours' && (
              <div className="barber-hours-view">
                <h3>Horarios de funcionamento</h3>
                <p>Defina a janela base da agenda online. Se nada estiver salvo, o sistema assume 08:00-20:00.</p>
                <div className="barber-working-hours-grid">
                  {agendaWeekdayLabels.map((day, idx) => {
                    const h = effectiveWorkingHours.find(wh => wh.weekday === idx && !wh.collaborator_id)
                    return (
                      <div key={day} className="barber-hour-row">
                        <span>{day}</span>
                        <input type="time" defaultValue={h?.opens_at || '08:00'} onBlur={(e) => saveWorkingHours({ weekday: idx, opensAt: e.target.value, closesAt: h?.closes_at || '20:00', isClosed: false })} />
                        <input type="time" defaultValue={h?.closes_at || '20:00'} onBlur={(e) => saveWorkingHours({ weekday: idx, opensAt: h?.opens_at || '08:00', closesAt: e.target.value, isClosed: false })} />
                        <label><input type="checkbox" defaultChecked={h?.is_closed} onChange={(e) => saveWorkingHours({ weekday: idx, opensAt: h?.opens_at || '08:00', closesAt: h?.closes_at || '20:00', isClosed: e.target.checked })} /> Fechado</label>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </BarberCard>

        <AppointmentModal
          appointment={activeAgendaAppointment}
          isCollaborator={isCollaborator}
          onArrived={(id) => updateAppointmentStatus(id, 'arrived')}
          onCancel={(appointment) => {
            const reason = window.prompt('Motivo do cancelamento:')
            if (reason !== null) {
              cancelAppointment(appointment.id, reason)
            }
          }}
          onClose={() => {
            setAgendaModalOpen(false)
            setActiveAgendaAppointment(null)
          }}
          onComplete={(id) => updateAppointmentStatus(id, 'completed')}
          onConfirm={(id) => updateAppointmentStatus(id, 'confirmed')}
          onReschedule={(appointment) => {
            const startsAt = appointment?.starts_at ? new Date(appointment.starts_at) : null
            const defaultDate = startsAt && !Number.isNaN(startsAt.getTime()) ? startsAt.toISOString().slice(0, 10) : ''
            const defaultTime = startsAt && !Number.isNaN(startsAt.getTime())
              ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(startsAt)
              : ''
            const newDate = window.prompt('Nova data (AAAA-MM-DD):', defaultDate)
            const newTime = window.prompt('Novo horario (HH:MM):', defaultTime)
            if (newDate && newTime) {
              rescheduleAppointment(appointment.id, newDate, newTime)
            }
          }}
          onStart={(id) => updateAppointmentStatus(id, 'in_progress')}
          open={agendaModalOpen && isMobileViewport}
        />

        <AppointmentComposerModal
          collaborators={collaboratorOptions}
          form={appointmentForm}
          isCollaborator={isCollaborator}
          onChange={updateAppointmentForm}
          onClose={closeAppointmentComposer}
          onSubmit={submitAppointment}
          open={appointmentComposerOpen}
          services={visibleServices}
          submitting={submittingAppointment}
        />
      </section>
    )
  }

  function renderSalesV2() {
    const paymentOptions = salePaymentOptions
    const activeCollaborators = collaborators.filter((collaborator) => collaborator.is_active && !collaborator.is_deleted)
    const recentSales = sales.slice(0, 8)
    const periodOptions = [
      { value: 'today', label: 'Hoje' },
      { value: 'week', label: 'Semana' },
      { value: 'month', label: 'Mes' },
      { value: 'custom', label: 'Periodo' }
    ]
    const salesSummaryCards = [
      {
        key: 'today',
        label: 'Hoje',
        value: money(salesSummary.totals_day?.total_amount || 0),
        hint: `${salesSummary.totals_day?.total_sales || 0} atendimento(s)`
      },
      {
        key: 'week',
        label: 'Semana',
        value: money(salesSummary.totals_week?.total_amount || 0),
        hint: `${salesSummary.totals_week?.total_sales || 0} atendimento(s)`
      },
      {
        key: 'month',
        label: 'Mes',
        value: money(salesSummary.totals_month?.total_amount || 0),
        hint: `${salesSummary.totals_month?.total_sales || 0} atendimento(s)`
      },
      {
        key: 'commission',
        label: 'Comissao total',
        value: money(salesSummary.total_commission || 0),
        hint: `${salesSummary.total_sales || 0} venda(s) no filtro`
      }
    ]
    const collaboratorSalesCards = [
      {
        key: 'today-commission',
        label: 'Minha comissao hoje',
        value: money(collaboratorMetrics.todayCommission || collaboratorMetrics.totalCommission || 0),
        hint: 'baseado nos meus atendimentos'
      },
      {
        key: 'week-commission',
        label: 'Minha comissao na semana',
        value: money(collaboratorMetrics.weekCommission || 0),
        hint: 'somente meus atendimentos'
      },
      {
        key: 'month-commission',
        label: 'Minha comissao no mes',
        value: money(collaboratorMetrics.monthCommission || 0),
        hint: 'acumulado pessoal'
      },
      {
        key: 'my-attendances',
        label: 'Meus atendimentos',
        value: `${collaboratorMetrics.totalAttendances || collaboratorMetrics.todayAttendances || sales.length || 0}`,
        hint: 'historico pessoal'
      }
    ]

    return (
      <>
        {isCollaborator ? (
          <section className="barber-sales-control-panel">
            <div className="barber-sales-summary-grid">
              {collaboratorSalesCards.map((card) => (
                <BarberCard className="barber-sales-summary-kpi" key={card.key}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <small>{card.hint}</small>
                </BarberCard>
              ))}
            </div>
          </section>
        ) : (
        <section className="barber-sales-control-panel">
          <div className="barber-sales-summary-grid">
            {salesSummaryCards.map((card) => (
              <BarberCard className="barber-sales-summary-kpi" key={card.key}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.hint}</small>
              </BarberCard>
            ))}
          </div>

          <BarberCard className="barber-sales-filter-card">
            <div className="barber-table-header">
              <div>
                <h2>Filtros de atendimentos</h2>
                <p>Resumo calculado no backend, sempre filtrado por empresa e vendas ativas.</p>
              </div>
              <BarberButton onClick={() => loadData({ clearMessage: false })} type="button" variant="ghost">
                <BarberIcon name="refresh" />
                <span>Atualizar</span>
              </BarberButton>
            </div>

            <div className="barber-sales-filter-grid">
              {canManageCash ? (
                <div className="barber-form-block">
                  <label htmlFor="sales-filter-collaborator">Colaborador</label>
                  <select className="barber-select" id="sales-filter-collaborator" name="collaboratorId" onChange={updateSalesFilters} value={salesFilters.collaboratorId}>
                    <option value="">Todos</option>
                    {activeCollaborators.map((collaborator) => (
                      <option key={collaborator.id} value={collaborator.id}>
                        {collaborator.name || collaborator.nickname}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="barber-form-block">
                <label htmlFor="sales-filter-period">Periodo</label>
                <select className="barber-select" id="sales-filter-period" name="period" onChange={updateSalesFilters} value={salesFilters.period}>
                  {periodOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {salesFilters.period === 'custom' ? (
                <>
                  <div className="barber-form-block">
                    <label htmlFor="sales-filter-start">Inicio</label>
                    <input className="barber-input" id="sales-filter-start" name="startDate" onChange={updateSalesFilters} type="date" value={salesFilters.startDate} />
                  </div>
                  <div className="barber-form-block">
                    <label htmlFor="sales-filter-end">Fim</label>
                    <input className="barber-input" id="sales-filter-end" name="endDate" onChange={updateSalesFilters} type="date" value={salesFilters.endDate} />
                  </div>
                </>
              ) : null}
            </div>
          </BarberCard>
        </section>
        )}

        <form className="barber-sales-workspace" onSubmit={createSale}>
          <section className="barber-sales-main">
            <BarberCard className="barber-sales-hero">
              <div className="barber-sales-hero-copy">
                <span className="barber-overline">Operacao BarberGestor</span>
                <h2>Atendimentos</h2>
                <p>Registre atendimentos com servicos reais, colaborador vinculado e fechamento integrado ao caixa.</p>
              </div>

              <div className="barber-sales-hero-meta">
                <BarberBadge tone="cash">{isCollaborator ? `${collaboratorMetrics.todayAttendances || 0} meus atendimentos hoje` : `${todaySalesCount} atendimentos hoje`}</BarberBadge>
                <BarberBadge tone="admin">{visibleServices.length} servicos ativos</BarberBadge>
              </div>

              <div className="barber-sales-steps">
                {['Servicos', 'Resumo', 'Finalizar'].map((step, index) => (
                  <div className={`barber-sales-step ${index === 0 ? 'active' : ''}`} key={step}>
                    <span>{index + 1}</span>
                    <strong>{step}</strong>
                  </div>
                ))}
              </div>
            </BarberCard>

            <BarberCard className="barber-sales-catalog-panel barber-sales-launcher-panel">
              <div className="barber-table-header">
                <div>
                  <h2>Adicionar servico</h2>
                  <p>Abra o catalogo sob demanda e selecione apenas o que entra no atendimento atual.</p>
                </div>
              </div>

              <div className="barber-sales-launcher">
                <BarberButton onClick={openServicePicker} type="button" variant="secondary">
                  <BarberIcon name="plus" />
                  <span>Adicionar servico</span>
                </BarberButton>

              <div className="barber-sales-inline-form">
                <div className="barber-form-block">
                  <label htmlFor="sale-quantity">Quantidade base</label>
                  <input className="barber-input" id="sale-quantity" min="1" name="quantity" onChange={updateSaleForm} step="1" type="number" value={saleForm.quantity} />
                </div>

                <div className="barber-sales-selection-chip">
                  <span>Selecionado agora</span>
                  <strong>{selectedSaleSource ? formatServiceName(selectedSaleSource.name) : 'Nenhum servico selecionado'}</strong>
                  <small>
                    {selectedSaleSource
                      ? `${selectedSaleItemType === 'product' ? 'Produto' : 'Servico'} • ${money(selectedSaleSource.price ?? selectedSaleSource.sale_price ?? 0)}`
                      : 'Escolha um card para preparar o atendimento.'}
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
                  description="Nenhum servico ativo encontrado. Cadastre servicos para comecar a registrar atendimentos."
                  title="Catalogo vazio"
                />
              )}
              </div>
            </BarberCard>

            <BarberCard className="barber-sales-items-panel">
              <div className="barber-table-header">
                <div>
                  <h2>Servicos do atendimento</h2>
                  <p>Controle os servicos adicionados, a quantidade e o subtotal antes de finalizar o atendimento.</p>
                </div>
                <BarberBadge tone="admin">{saleItemsCount} servico(s)</BarberBadge>
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
                          <span>{collaboratorDisplayName(activeSaleCollaborator) || user?.name || 'Colaborador vinculado no envio'}</span>
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
                  description="Toque em um card do catalogo para adicionar servicos ou produtos reais no atendimento."
                  title="Nenhum servico no atendimento"
                />
              )}
            </BarberCard>
          </section>

          <aside className="barber-sales-sidebar">
            <BarberCard className="barber-sales-summary-card">
              <div className="barber-panel-header">
                <div>
                  <h3>Resumo do atendimento</h3>
                  <p>Cliente, colaborador e pagamento organizados em um fluxo unico de fechamento.</p>
                </div>
                <BarberBadge tone="cash">{money(saleEffectiveTotal)}</BarberBadge>
              </div>

              <div className="barber-sales-summary-list">
                <div className="barber-sales-summary-row">
                  <span>Servicos</span>
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

              <div className="barber-sales-checkout-block">
                <div className="barber-sales-checkout-header">
                  <strong>Dados do atendimento</strong>
                  <span>Cliente, profissional e forma de pagamento</span>
                </div>

                <div className="barber-form-block">
                  <label htmlFor="sale-client-name">Cliente</label>
                  <input className="barber-input" id="sale-client-name" name="clientName" onChange={updateSaleForm} placeholder="Opcional" value={saleForm.clientName} />
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
                    <strong>Colaborador vinculado automaticamente</strong>
                    <p>O atendimento sera registrado no perfil autenticado do colaborador.</p>
                  </div>
                )}

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
                  <>
                    <div className="barber-form-block">
                      <label htmlFor="sale-amount-received">Valor recebido</label>
                      <input className="barber-input" id="sale-amount-received" min={saleEffectiveTotal || 0} name="amountReceived" onChange={updateSaleForm} step="0.01" type="number" value={saleForm.amountReceived} />
                    </div>

                    <div className="barber-sales-summary-highlight">
                      <span>Troco</span>
                      <strong>{money(Math.max(0, saleChangeDue))}</strong>
                    </div>
                  </>
                )}

                <div className="barber-form-block">
                  <label htmlFor="sale-notes">Observacoes</label>
                  <textarea className="barber-textarea" id="sale-notes" name="notes" onChange={updateSaleForm} placeholder="Anotacoes do atendimento, observacoes do cliente ou detalhes do procedimento..." rows="4" value={saleForm.notes} />
                </div>
              </div>

              {isCashPayment && saleForm.amountReceived && saleChangeDue < 0 && (
                <div className="barber-message barber-message-error">
                  Valor recebido menor que o total do atendimento.
                </div>
              )}

              <BarberButton className="barber-sales-submit" disabled={submittingSale} type="submit" variant="primary">
                <BarberIcon name="plus" />
                <span>{submittingSale ? 'Registrando atendimento...' : 'Finalizar atendimento'}</span>
              </BarberButton>
            </BarberCard>
          </aside>
        </form>

        <BarberCard className="barber-sales-recent-panel">
          <div className="barber-table-header">
            <div>
              <h2>Atendimentos recentes</h2>
              <p>Ultimos atendimentos registrados no sistema, com pagamento e colaborador responsavel.</p>
            </div>
            <BarberBadge tone="admin">{sales.length} registros</BarberBadge>
          </div>

          {recentSales.length > 0 ? (
            <div className="barber-sales-recent-list">
              {recentSales.map((sale) => (
                <div className="barber-sales-recent-card" key={sale.id}>
                  <div className="barber-sales-recent-main">
                    <strong>{sale.service_name || sale.client_name || 'Atendimento registrado'}</strong>
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
              description="Assim que o primeiro atendimento for registrado, o historico aparece aqui automaticamente."
              title="Nenhum atendimento registrado"
            />
          )}
        </BarberCard>
      </>
    )
  }

  function renderAttendancesWorkspace() {
    const paymentOptions = salePaymentOptions
    const activeCollaborators = collaborators.filter((collaborator) => collaborator.is_active && !collaborator.is_deleted)
    const recentSales = sales.slice(0, 8)
    const periodOptions = [
      { value: 'today', label: 'Hoje' },
      { value: 'week', label: 'Semana' },
      { value: 'month', label: 'Mes' },
      { value: 'custom', label: 'Periodo' }
    ]
    const salesSummaryCards = [
      {
        key: 'today',
        label: 'Hoje',
        value: money(salesSummary.totals_day?.total_amount || 0),
        hint: `${salesSummary.totals_day?.total_sales || 0} atendimento(s)`
      },
      {
        key: 'week',
        label: 'Semana',
        value: money(salesSummary.totals_week?.total_amount || 0),
        hint: `${salesSummary.totals_week?.total_sales || 0} atendimento(s)`
      },
      {
        key: 'month',
        label: 'Mes',
        value: money(salesSummary.totals_month?.total_amount || 0),
        hint: `${salesSummary.totals_month?.total_sales || 0} atendimento(s)`
      },
      {
        key: 'commission',
        label: 'Comissao total',
        value: money(salesSummary.total_commission || 0),
        hint: `${salesSummary.total_sales || 0} venda(s) no filtro`
      }
    ]
    const collaboratorTodayCommission = collaboratorMetrics.today?.commission ?? collaboratorMetrics.todayCommission ?? 0
    const collaboratorTodayAttendances = collaboratorMetrics.today?.appointments ?? collaboratorMetrics.todayAttendances ?? 0
    const lastPersonalSale = recentSales[0]
    const collaboratorDayCards = [
      {
        key: 'today-commission',
        label: 'Comissao de hoje',
        value: money(collaboratorTodayCommission),
        hint: 'Baseado nos atendimentos que voce lancou hoje'
      },
      {
        key: 'today-attendances',
        label: 'Atendimentos de hoje',
        value: `${collaboratorTodayAttendances}`,
        hint: 'Somente registros do seu perfil'
      },
      {
        key: 'last-sale',
        label: 'Ultimo atendimento lancado',
        value: lastPersonalSale?.service_name || 'Nenhum atendimento',
        hint: lastPersonalSale ? fullDate(lastPersonalSale.created_at) : 'Aguardando seu primeiro lancamento do dia'
      },
      {
        key: 'day-status',
        label: 'Status do dia',
        value: collaboratorTodayAttendances > 0 ? 'Em andamento' : 'Sem lancamentos',
        hint: collaboratorTodayAttendances > 0 ? 'Comissao pendente de fechamento' : 'Lance um atendimento para atualizar o saldo'
      }
    ]
    const saleWizardStepIndex = Math.max(0, saleWizardSteps.findIndex((step) => step.key === saleWizardStep))
    const effectiveSaleCollaboratorId = isCollaborator ? loggedInCollaboratorId : saleForm.collaboratorId
    const lockedCollaboratorLabel = collaboratorDisplayName(loggedInCollaborator) || user?.name || 'Voce'
    const goToSaleWizardStep = (stepKey) => {
      setError('')
      setSaleWizardStep(stepKey)
    }
    const goToNextSaleStep = () => {
      if (saleWizardStep === 'start' && !effectiveSaleCollaboratorId) {
        setError(isCollaborator ? 'Nao foi possivel identificar o colaborador autenticado' : 'Selecione um colaborador')
        return
      }

      if (saleWizardStep === 'items' && saleItemsCount <= 0) {
        setError('Adicione ao menos um servico ou produto')
        return
      }

      if (saleWizardStep === 'payment' && isCashPayment && saleChangeDue < 0) {
        setError('Valor recebido menor que o total do atendimento')
        return
      }

      const nextStep = saleWizardSteps[Math.min(saleWizardStepIndex + 1, saleWizardSteps.length - 1)]
      goToSaleWizardStep(nextStep.key)
    }
    const goToPreviousSaleStep = () => {
      const previousStep = saleWizardSteps[Math.max(saleWizardStepIndex - 1, 0)]
      goToSaleWizardStep(previousStep.key)
    }
    const renderSaleWizardActions = (nextLabel = 'Continuar') => (
      <div className="barber-sales-wizard-actions">
        {saleWizardStepIndex > 0 ? (
          <BarberButton onClick={goToPreviousSaleStep} type="button" variant="ghost">
            Voltar
          </BarberButton>
        ) : <span />}
        <BarberButton onClick={goToNextSaleStep} type="button" variant="primary">
          {nextLabel}
        </BarberButton>
      </div>
    )

    return (
      <>
        {isCollaborator ? (
          <section className="barber-sales-control-panel barber-sales-control-panel-personal">
            <div className="barber-sales-summary-grid">
              {collaboratorDayCards.map((card) => (
                <BarberCard className="barber-sales-summary-kpi" key={card.key}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <small>{card.hint}</small>
                </BarberCard>
              ))}
            </div>

            <BarberCard className="barber-sales-filter-card barber-sales-personal-balance">
              <div className="barber-table-header">
                <div>
                  <h2>Seu saldo de comissoes hoje</h2>
                  <p>Baseado nos atendimentos que voce lancou hoje, sem expor o faturamento da barbearia.</p>
                </div>
                <BarberButton onClick={() => loadData({ clearMessage: false })} type="button" variant="ghost">
                  <BarberIcon name="refresh" />
                  <span>Atualizar</span>
                </BarberButton>
              </div>
            </BarberCard>
          </section>
        ) : (
          <section className="barber-sales-control-panel">
            <div className="barber-sales-summary-grid">
              {salesSummaryCards.map((card) => (
                <BarberCard className="barber-sales-summary-kpi" key={card.key}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <small>{card.hint}</small>
                </BarberCard>
              ))}
            </div>

            <BarberCard className="barber-sales-filter-card">
              <div className="barber-table-header">
                <div>
                  <h2>Filtros de atendimentos</h2>
                  <p>Resumo calculado no backend, sempre filtrado por empresa e vendas ativas.</p>
                </div>
                <BarberButton onClick={() => loadData({ clearMessage: false })} type="button" variant="ghost">
                  <BarberIcon name="refresh" />
                  <span>Atualizar</span>
                </BarberButton>
              </div>

              <div className="barber-sales-filter-grid">
                {canManageCash ? (
                  <div className="barber-form-block">
                    <label htmlFor="sales-filter-collaborator">Colaborador</label>
                    <select className="barber-select" id="sales-filter-collaborator" name="collaboratorId" onChange={updateSalesFilters} value={salesFilters.collaboratorId}>
                      <option value="">Todos</option>
                      {activeCollaborators.map((collaborator) => (
                        <option key={collaborator.id} value={collaborator.id}>
                          {collaborator.name || collaborator.nickname}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="barber-form-block">
                  <label htmlFor="sales-filter-period">Periodo</label>
                  <select className="barber-select" id="sales-filter-period" name="period" onChange={updateSalesFilters} value={salesFilters.period}>
                    {periodOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {salesFilters.period === 'custom' ? (
                  <>
                    <div className="barber-form-block">
                      <label htmlFor="sales-filter-start">Inicio</label>
                      <input className="barber-input" id="sales-filter-start" name="startDate" onChange={updateSalesFilters} type="date" value={salesFilters.startDate} />
                    </div>
                    <div className="barber-form-block">
                      <label htmlFor="sales-filter-end">Fim</label>
                      <input className="barber-input" id="sales-filter-end" name="endDate" onChange={updateSalesFilters} type="date" value={salesFilters.endDate} />
                    </div>
                  </>
                ) : null}
              </div>
            </BarberCard>
          </section>
        )}

        {saleWizardStep === 'success' ? (
          <BarberCard className="barber-sales-success-card barber-card-full">
            <div className="barber-sales-success-icon">
              <BarberIcon name="check" />
            </div>
            <div>
              <span className="barber-overline">Atendimento finalizado</span>
              <h2>Registro salvo com sucesso</h2>
              <p>
                {isCollaborator
                  ? 'Seu atendimento foi vinculado ao seu perfil e ja entra na sua comissao conforme as regras atuais.'
                  : 'O atendimento ja entra no caixa, dashboard, relatorios e comissoes conforme as regras atuais.'}
              </p>
            </div>
            <div className="barber-inline-actions">
              <BarberButton onClick={() => resetSaleWizard('start')} type="button" variant="primary">
                Novo atendimento
              </BarberButton>
              <BarberButton onClick={() => loadData({ clearMessage: false })} type="button" variant="ghost">
                Atualizar dados
              </BarberButton>
            </div>
          </BarberCard>
        ) : (
          <>
            <div className="barber-sales-steps barber-sales-wizard-steps">
              {saleWizardSteps.map((step, index) => (
                <button
                  className={`barber-sales-step ${index === saleWizardStepIndex ? 'active' : ''} ${index < saleWizardStepIndex ? 'done' : ''}`}
                  key={step.key}
                  onClick={() => goToSaleWizardStep(step.key)}
                  type="button"
                >
                  <span>{index + 1}</span>
                  <strong>{step.label}</strong>
                </button>
              ))}
            </div>

            <form className="barber-sales-workspace barber-sales-wizard-workspace" onSubmit={createSale}>
              <section className="barber-sales-main">
                {saleWizardStep === 'start' && (
                  <BarberCard className="barber-sales-hero">
                    <div className="barber-sales-hero-copy">
                      <span className="barber-overline">{isCollaborator ? 'Modo colaborador' : 'Modo gestor'}</span>
                      <h2>Iniciar atendimento</h2>
                      <p>{isCollaborator ? 'Fluxo rapido para celular, com seu perfil fixo e sem dados administrativos.' : 'Escolha o responsavel e avance pelo atendimento em etapas.'}</p>
                    </div>

                    <div className="barber-sales-start-grid">
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
                          <strong>{lockedCollaboratorLabel}</strong>
                          <p>Colaborador fixo neste atendimento.</p>
                        </div>
                      )}

                      <div className="barber-sales-launcher-summary">
                        <span>Catalogo disponivel</span>
                        <strong>{visibleServices.length} servicos ativos</strong>
                        <small>{isCollaborator ? 'Sem faturamento bruto da barbearia' : `${activeCollaborators.length} colaborador(es) ativos`}</small>
                      </div>
                    </div>

                    {renderSaleWizardActions('Iniciar atendimento')}
                  </BarberCard>
                )}

                {saleWizardStep === 'client' && (
                  <BarberCard className="barber-sales-items-panel">
                    <div className="barber-table-header">
                      <div>
                        <h2>Cliente</h2>
                        <p>Identifique o cliente quando fizer sentido. O campo pode ficar vazio para atendimento rapido.</p>
                      </div>
                    </div>
                    <div className="barber-form-block">
                      <label htmlFor="sale-client-name">Cliente</label>
                      <input className="barber-input" id="sale-client-name" name="clientName" onChange={updateSaleForm} placeholder="Nome do cliente" value={saleForm.clientName} />
                    </div>
                    {renderSaleWizardActions('Continuar')}
                  </BarberCard>
                )}

                {saleWizardStep === 'items' && (
                  <>
                    <div className="barber-sales-launcher-bar">
                      <BarberButton className="barber-sales-launcher-button" onClick={openServicePicker} type="button" variant="secondary">
                        <BarberIcon name="plus" />
                        <span>Adicionar servico/produto</span>
                      </BarberButton>

                      <div className="barber-sales-launcher-summary">
                        <span>Resumo do atendimento</span>
                        <strong>{saleItemsCount > 0 ? `${saleItemsCount} item(ns)` : 'Nenhum item'}</strong>
                        <small>{isCollaborator ? money(saleEffectiveCommission) : money(saleEffectiveTotal)}</small>
                      </div>
                    </div>

                    <BarberCard className="barber-sales-items-panel">
                      <div className="barber-table-header">
                        <div>
                          <h2>Servicos/produtos</h2>
                          <p>Adicione itens do catalogo e ajuste quantidades antes do pagamento.</p>
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
                                  <span>{isCollaborator ? lockedCollaboratorLabel : collaboratorDisplayName(activeSaleCollaborator) || 'Colaborador selecionado'}</span>
                                </div>
                              </div>

                              <div className="barber-sales-item-qty">
                                <button onClick={() => updateSaleItemQuantity(item.key, -1)} type="button">-</button>
                                <span>{item.quantity}</span>
                                <button onClick={() => updateSaleItemQuantity(item.key, 1)} type="button">+</button>
                              </div>

                              <div className="barber-sales-item-values">
                                <strong>{isCollaborator ? money(item.commissionAmount) : money(item.totalPrice)}</strong>
                                <span>{isCollaborator ? 'minha comissao estimada' : `${money(item.unitPrice)} unitario`}</span>
                              </div>

                              <button className="barber-sales-item-remove" onClick={() => removeSaleItem(item.key)} type="button">
                                <BarberIcon name="trash" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <BarberEmptyState
                          description="Use o botao acima para abrir o catalogo e adicionar servicos ou produtos."
                          title="Nenhum item no atendimento"
                        />
                      )}

                      {renderSaleWizardActions('Ir para pagamento')}
                    </BarberCard>
                  </>
                )}

                {saleWizardStep === 'payment' && (
                  <BarberCard className="barber-sales-items-panel">
                    <div className="barber-table-header">
                      <div>
                        <h2>Pagamento</h2>
                        <p>Escolha a forma de pagamento do atendimento.</p>
                      </div>
                      <BarberBadge tone="cash">{isCollaborator ? `${saleItemsCount} item(ns)` : money(saleEffectiveTotal)}</BarberBadge>
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
                      <>
                        <div className="barber-form-block">
                          <label htmlFor="sale-amount-received">Valor recebido</label>
                          <input className="barber-input" id="sale-amount-received" min={saleEffectiveTotal || 0} name="amountReceived" onChange={updateSaleForm} step="0.01" type="number" value={saleForm.amountReceived} />
                        </div>

                        <div className="barber-sales-summary-highlight">
                          <span>Troco</span>
                          <strong>{money(Math.max(0, saleChangeDue))}</strong>
                        </div>
                      </>
                    )}

                    {isCashPayment && saleForm.amountReceived && saleChangeDue < 0 && (
                      <div className="barber-message barber-message-error">
                        Valor recebido menor que o total do atendimento.
                      </div>
                    )}

                    {renderSaleWizardActions('Continuar')}
                  </BarberCard>
                )}

                {saleWizardStep === 'notes' && (
                  <BarberCard className="barber-sales-items-panel">
                    <div className="barber-table-header">
                      <div>
                        <h2>Observacoes</h2>
                        <p>Inclua detalhes do atendimento, preferencia do cliente ou algo importante para o historico.</p>
                      </div>
                    </div>
                    <div className="barber-form-block">
                      <label htmlFor="sale-notes">Observacoes</label>
                      <textarea className="barber-textarea" id="sale-notes" name="notes" onChange={updateSaleForm} placeholder="Opcional" rows="5" value={saleForm.notes} />
                    </div>
                    {renderSaleWizardActions('Revisar')}
                  </BarberCard>
                )}

                {saleWizardStep === 'review' && (
                  <BarberCard className="barber-sales-items-panel">
                    <div className="barber-table-header">
                      <div>
                        <h2>Revisao</h2>
                        <p>Confira os dados antes de finalizar.</p>
                      </div>
                      <BarberBadge tone="cash">{isCollaborator ? money(saleEffectiveCommission) : money(saleEffectiveTotal)}</BarberBadge>
                    </div>

                    <div className="barber-sales-summary-list">
                      <div className="barber-sales-summary-row">
                        <span>Cliente</span>
                        <strong>{saleForm.clientName || 'Nao informado'}</strong>
                      </div>
                      <div className="barber-sales-summary-row">
                        <span>Colaborador</span>
                        <strong>{isCollaborator ? lockedCollaboratorLabel : collaboratorDisplayName(activeSaleCollaborator) || 'Nao selecionado'}</strong>
                      </div>
                      <div className="barber-sales-summary-row">
                        <span>Itens</span>
                        <strong>{saleItemsCount}</strong>
                      </div>
                      <div className="barber-sales-summary-row">
                        <span>Pagamento</span>
                        <strong>{paymentLabel(saleForm.paymentMethod)}</strong>
                      </div>
                      <div className="barber-sales-summary-row">
                        <span>{isCollaborator ? 'Minha comissao prevista' : 'Comissao'}</span>
                        <strong>{money(saleEffectiveCommission)}</strong>
                      </div>
                      {!isCollaborator && (
                        <>
                          <div className="barber-sales-summary-row">
                            <span>Total</span>
                            <strong>{money(saleEffectiveTotal)}</strong>
                          </div>
                          <div className="barber-sales-summary-row">
                            <span>Total liquido</span>
                            <strong>{money(saleEffectiveNet)}</strong>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="barber-sales-wizard-actions">
                      <BarberButton onClick={goToPreviousSaleStep} type="button" variant="ghost">
                        Voltar
                      </BarberButton>
                      <BarberButton className="barber-sales-submit" disabled={submittingSale} type="submit" variant="primary">
                        <BarberIcon name="plus" />
                        <span>{submittingSale ? 'Finalizando...' : 'Finalizar atendimento'}</span>
                      </BarberButton>
                    </div>
                  </BarberCard>
                )}
              </section>

              <aside className="barber-sales-sidebar">
                <BarberCard className="barber-sales-summary-card">
                  <div className="barber-panel-header">
                    <div>
                      <h3>Resumo rapido</h3>
                      <p>{isCollaborator ? 'Somente seus itens e sua comissao prevista.' : 'Totais do atendimento atual.'}</p>
                    </div>
                    <BarberBadge tone="cash">{isCollaborator ? money(saleEffectiveCommission) : money(saleEffectiveTotal)}</BarberBadge>
                  </div>

                  <div className="barber-sales-summary-list">
                    <div className="barber-sales-summary-row">
                      <span>Itens</span>
                      <strong>{saleItemsCount}</strong>
                    </div>
                    <div className="barber-sales-summary-row">
                      <span>{isCollaborator ? 'Minha comissao' : 'Comissao'}</span>
                      <strong>{money(saleEffectiveCommission)}</strong>
                    </div>
                    {!isCollaborator && (
                      <>
                        <div className="barber-sales-summary-row">
                          <span>Subtotal</span>
                          <strong>{money(saleEffectiveTotal)}</strong>
                        </div>
                        <div className="barber-sales-summary-row">
                          <span>Total liquido</span>
                          <strong>{money(saleEffectiveNet)}</strong>
                        </div>
                      </>
                    )}
                  </div>
                </BarberCard>
              </aside>
            </form>
          </>
        )}

        <BarberCard className="barber-sales-recent-panel">
          <div className="barber-table-header">
            <div>
              <h2>Atendimentos recentes</h2>
              <p>Ultimos atendimentos registrados no sistema, com pagamento e colaborador responsavel.</p>
            </div>
            <BarberBadge tone="admin">{sales.length} registros</BarberBadge>
          </div>

          {recentSales.length > 0 ? (
            <div className="barber-sales-recent-list">
              {recentSales.map((sale) => (
                <div className="barber-sales-recent-card" key={sale.id}>
                  <div className="barber-sales-recent-main">
                    <strong>{sale.service_name || sale.client_name || 'Atendimento registrado'}</strong>
                    <span>{isCollaborator ? fullDate(sale.created_at) : `${sale.collaborator_name || 'Sem colaborador'} - ${fullDate(sale.created_at)}`}</span>
                  </div>

                  <div className="barber-sales-recent-meta">
                    {!isCollaborator && <BarberBadge tone={paymentTone(sale.payment_method)}>
                      {paymentLabel(sale.payment_method)}
                    </BarberBadge>}
                    <strong>{money(isCollaborator && sale.commission_effect === 'debit' ? -Math.abs(Number(sale.commission_amount || 0)) : (isCollaborator ? sale.commission_amount || 0 : sale.total_amount))}</strong>
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
              description="Assim que o primeiro atendimento for registrado, o historico aparece aqui automaticamente."
              title="Nenhum atendimento registrado"
            />
          )}
        </BarberCard>

        <BarberCard className="barber-sales-table-card barber-card-full">
          <div className="barber-table-header">
            <div>
              <h2>Lista de atendimentos</h2>
              <p>Vendas persistidas no banco, filtradas por periodo e colaborador.</p>
            </div>
            {!isCollaborator && <BarberBadge tone="cash">{money(salesSummary.total_amount || 0)}</BarberBadge>}
          </div>

          <BarberTable columns={isCollaborator ? ['Data', 'Servico', 'Cliente', 'Status', 'Minha comissao'] : ['Colaborador', 'Cliente', 'Data', 'Pagamento', 'Total', 'Comissao', 'Status', 'Acoes']}>
            {sales.length > 0 ? (
              sales.map((sale) => {
                const commissionAmount = Number(sale.item_commission_amount ?? sale.commission_amount ?? 0)
                const displayCommission = sale.commission_effect === 'debit'
                  ? -Math.abs(commissionAmount)
                  : commissionAmount
                const saleStatus = sale.status || 'active'

                return isCollaborator ? (
                  <tr key={sale.id}>
                    <td>{fullDate(sale.created_at)}</td>
                    <td>{sale.service_name || 'Atendimento registrado'}</td>
                    <td>{sale.customer_name || sale.client_name || 'Nao informado'}</td>
                    <td>
                      <BarberBadge tone={saleStatus === 'canceled' ? 'danger' : 'approved'}>
                        {saleStatus === 'canceled' ? 'Cancelado' : 'Ativo'}
                      </BarberBadge>
                    </td>
                    <td>{money(displayCommission)}</td>
                  </tr>
                ) : (
                  <tr key={sale.id}>
                    <td>
                      <strong>{sale.collaborator_name || 'Sem colaborador'}</strong>
                      <span>{sale.service_name || 'Atendimento registrado'}</span>
                    </td>
                    <td>
                      <strong>{sale.customer_name || sale.client_name || 'Nao informado'}</strong>
                      <span>{sale.customer_phone || sale.notes || '-'}</span>
                    </td>
                    <td>{fullDate(sale.created_at)}</td>
                    <td>
                      <BarberBadge tone={paymentTone(sale.payment_method)}>
                        {paymentLabel(sale.payment_method)}
                      </BarberBadge>
                    </td>
                    <td>{money(sale.total_amount)}</td>
                    <td>{money(displayCommission)}</td>
                    <td>
                      <BarberBadge tone={saleStatus === 'canceled' ? 'danger' : 'approved'}>
                        {saleStatus === 'canceled' ? 'Cancelado' : 'Ativo'}
                      </BarberBadge>
                    </td>
                    <td>
                      {isAdmin && saleStatus !== 'canceled' ? (
                        <BarberButton onClick={() => startDeleteSale(sale.id)} type="button" variant="danger">
                          <BarberIcon name="trash" />
                          <span>Cancelar atendimento</span>
                        </BarberButton>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={isCollaborator ? '5' : '8'}>
                  <BarberEmptyState
                    description="Nenhum atendimento encontrado para os filtros atuais."
                    title="Sem registros no periodo"
                  />
                </td>
              </tr>
            )}
          </BarberTable>
        </BarberCard>

        <BarberModal
          onClose={closeServicePicker}
          open={servicePickerOpen}
          subtitle="Busque no catalogo e adicione servicos ou produtos sem poluir a tela principal."
          title="Adicionar servico ao atendimento"
        >
          <div className="barber-modal-content">
            <div className="barber-sales-picker-toolbar">
              <div className="barber-form-block barber-sales-search">
                <label htmlFor="sales-search-modal">Buscar</label>
                <input
                  className="barber-input"
                  id="sales-search-modal"
                  onChange={(event) => setSaleCatalogSearch(event.target.value)}
                  placeholder="Buscar servico ou produto..."
                  value={saleCatalogSearch}
                />
              </div>

              <div className="barber-sales-filter-group" role="tablist" aria-label="Filtros do catalogo">
                {[
                  { key: 'all', label: 'Todos' },
                  { key: 'service', label: 'Servicos' },
                  { key: 'product', label: 'Produtos' }
                ].map((filter) => (
                  <button
                    className={`barber-sales-filter ${saleCatalogFilter === filter.key ? 'active' : ''}`}
                    key={filter.key}
                    onClick={() => setSaleCatalogFilter(filter.key)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {saleCatalogItems.length > 0 ? (
              <div className="barber-sales-picker-grid">
                {saleCatalogItems.map((item) => (
                  <div className="barber-sales-picker-card" key={`${item.type}-${item.id}`}>
                    <div className="barber-sales-picker-main">
                      <span className="barber-sales-catalog-icon">
                        {item.type === 'product'
                          ? <BarberIcon name="product" />
                          : <ServiceIcon icon={item.icon} serviceName={item.name} />}
                      </span>

                      <div className="barber-sales-catalog-copy">
                        <div className="barber-sales-catalog-name">{formatServiceName(item.name)}</div>
                        <div className="barber-sales-catalog-type">
                          {item.type === 'product' ? item.category || 'Produto' : item.category === 'combo' ? 'Combo' : 'Servico'}
                        </div>
                      </div>
                    </div>

                    <div className="barber-sales-picker-side">
                      <strong className="barber-sales-catalog-price">{money(item.price)}</strong>
                      <BarberButton onClick={() => appendSaleItemFromCatalog(item, item.type, 1, { closeAfterAdd: true })} type="button" variant="secondary">
                        <BarberIcon name="plus" />
                        <span>Adicionar</span>
                      </BarberButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <BarberEmptyState
                description="Nenhum item encontrado para este filtro. Ajuste a busca ou o tipo do catalogo."
                title="Catalogo vazio"
              />
            )}

            <div className="barber-modal-actions">
              <BarberButton onClick={closeServicePicker} type="button" variant="ghost">
                Fechar
              </BarberButton>
            </div>
          </div>
        </BarberModal>
      </>
    )
  }

  function renderSales() {
    return renderAttendancesWorkspace()
  }

  function RenderSalesLegacy() {
    return (
      <>
        <section className="barber-grid-two">
          <BarberCard>
            <div className="barber-panel-header">
              <div>
                <h3>Registrar atendimento</h3>
                <p>Monte um atendimento com os servicos ativos da barbearia e mantenha o caixa sincronizado com dados reais.</p>
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
                    <strong>Atendimento vinculado ao seu usuario</strong>
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
                    {salePaymentOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
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
                  <textarea className="barber-textarea" id="sale-notes" name="notes" onChange={updateSaleForm} placeholder="Observacoes do atendimento, preferencias do cliente ou detalhes do servico..." rows="4" value={saleForm.notes} />
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
                        description="Adicione servicos do catalogo para montar o atendimento."
                        title="Nenhum servico no atendimento"
                      />
                    </td>
                  </tr>
                )}
              </BarberTable>

              <div className="barber-page-actions">
                <BarberButton disabled={submittingSale} type="submit" variant="primary">
                  <BarberIcon name="plus" />
                  <span>{submittingSale ? 'Registrando atendimento...' : 'Finalizar atendimento'}</span>
                </BarberButton>
                <div className="barber-placeholder" style={{ padding: 14 }}>
                  <strong>{saleForm.items.length ? `${saleForm.items.length} servico(s) no atendimento` : 'Resumo do atendimento'}</strong>
                  <p>
                    {saleForm.items.length
                      ? `${money(saleTotal)} bruto • ${money(saleCommissionTotal)} comissao • ${money(saleShopNetTotal)} liquido`
                      : 'Adicione servicos para visualizar subtotal, comissao do colaborador e liquido da barbearia.'}
                    {activeSaleCollaborator ? ` • ${collaboratorDisplayName(activeSaleCollaborator)}` : ''}
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
                  <p>Media dos ultimos 50 atendimentos carregados</p>
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
                  <strong>Atendimentos com colaborador</strong>
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

        <BarberCard className="barber-card-full">
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
      .filter((sale) => normalizePaymentMethod(sale.payment_method) === 'cash')
      .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)
    const pixTotal = sales
      .filter((sale) => normalizePaymentMethod(sale.payment_method) === 'pix')
      .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)
    const creditTotal = sales
      .filter((sale) => normalizePaymentMethod(sale.payment_method) === 'credit')
      .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)
    const debitTotal = sales
      .filter((sale) => normalizePaymentMethod(sale.payment_method) === 'debit')
      .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)

    return (
      <>
        <section className="barber-grid-two barber-cash-layout">
          <BarberCard>
            <div className="barber-panel-header">
              <div>
                <h3>Resumo financeiro</h3>
                <p>Consolidado das vendas reais retornadas pelos endpoints existentes.</p>
              </div>
              <div className="barber-inline-actions">
                <BarberBadge tone="cash">Somente dados reais</BarberBadge>
                <BarberButton onClick={() => {
                  setSaleForm(buildEmptySaleForm(loggedInCollaboratorId))
                  setSaleModalOpen(true)
                }} type="button" variant="primary">
                  <BarberIcon name="plus" />
                  <span>Nova venda</span>
                </BarberButton>
              </div>
            </div>

            <div className="barber-finance-grid">
              <div className="cash-metric-card">
                <div>
                  <span>Bruto total</span>
                  <p>Soma das vendas carregadas</p>
                </div>
                <strong className="cash-metric-value">{money(grossTotal)}</strong>
              </div>
              <div className="cash-metric-card">
                <div>
                  <span>Dinheiro</span>
                  <p>Entradas em espécie</p>
                </div>
                <strong className="cash-metric-value">{money(cashTotal)}</strong>
              </div>
              <div className="cash-metric-card">
                <div>
                  <span>Pix</span>
                  <p>Recebimentos instantâneos</p>
                </div>
                <strong className="cash-metric-value">{money(pixTotal)}</strong>
              </div>
              <div className="cash-metric-card">
                <div>
                  <span>Cartão Crédito</span>
                  <p>Credicard no período</p>
                </div>
                <strong className="cash-metric-value">{money(creditTotal)}</strong>
              </div>
              <div className="cash-metric-card">
                <div>
                  <span>Cartão Débito</span>
                  <p>Débitocard no período</p>
                </div>
                <strong className="cash-metric-value">{money(debitTotal)}</strong>
              </div>
              <div className="cash-metric-card">
                <div>
                  <span>Total de vendas</span>
                  <p>Registros retornados pela API</p>
                </div>
                <strong className="cash-metric-value">{sales.length}</strong>
              </div>
              <div className="cash-metric-card">
                <div>
                  <span>Comissões</span>
                  <p>Resumo do dashboard</p>
                </div>
                <strong className="cash-metric-value">{money(dashboard.totalCommissions)}</strong>
              </div>
            </div>
          </BarberCard>

          <BarberCard>
            <div className="barber-chart-header">
              <div>
                <h2>Mix de pagamentos</h2>
                <p>Distribuição baseada apenas em vendas reais.</p>
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
      </>
    )
  }

  function renderTeam() {
    const financialSummary = visibleCollaboratorFinancialSummary
    const hasOperationalCollaborators = collaborators.length > 0
    const hasFinancialSummary = financialSummary.length > 0
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
          {hasFinancialSummary ? (
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
                      {isAdmin && <BarberBadge tone={index === 0 ? 'permuta' : 'admin'}>#{index + 1}</BarberBadge>}
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
              )
            })
          ) : (
            <BarberCard className="barber-collaborator-card">
              <BarberEmptyState
                description={isAdmin
                  ? hasOperationalCollaborators
                    ? 'A equipe ja foi cadastrada, mas ainda nao gerou movimentacao no periodo selecionado.'
                    : 'Nenhum colaborador cadastrado ainda.'
                  : 'Seu resumo financeiro aparecera aqui assim que houver vendas reais no periodo.'}
                title={isAdmin
                  ? hasOperationalCollaborators
                    ? 'Equipe sem movimentacao no periodo'
                    : 'Nenhum colaborador cadastrado'
                  : 'Sem resumo financeiro'}
              />
              {isAdmin && !hasOperationalCollaborators && (
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
          <BarberCard className="barber-card-full">
            <div className="barber-panel-header">
              <div>
                <h3>{isAdmin ? 'Equipe cadastrada' : 'Seu resumo profissional'}</h3>
                <p>
                  {isAdmin
                    ? 'Lista operacional da equipe com acesso rapido para editar e acompanhar desempenho.'
                    : 'Seus indicadores individuais com base nas vendas reais do periodo.'}
                </p>
              </div>
            </div>

            {isAdmin ? (
              <BarberTable columns={['Colaborador', 'Comissao', 'Permissoes', 'Status', 'Acoes']}>
                {collaborators.length > 0 ? (
                  collaborators.map((collaborator) => {
                    const rank = financialSummary.findIndex((item) => item.collaborator_id === collaborator.id)

                    return (
                      <tr key={collaborator.id}>
                        <td>
                          <div className="barber-collaborator-main-cell">
                            <CollaboratorAvatar
                              avatarUrl={collaborator.avatar_url}
                              name={collaboratorDisplayName(collaborator)}
                              size="sm"
                            />
                            <div>
                              <strong>
                                {collaborator.name || collaborator.nickname}
                                {rank >= 0 ? <span> #{rank + 1}</span> : null}
                              </strong>
                              <span>{collaborator.email || 'Sem email'}</span>
                              <span>{collaborator.phone || 'Sem telefone'} - {collaborator.role || 'collaborator'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {collaborator.commission_type === 'fixed'
                            ? money(collaborator.commission_rate)
                            : `${collaborator.commission_rate}%`}
                        </td>
                        <td>
                          <div className="barber-status-grid">
                            {collaborator.can_view_own_dashboard && <BarberBadge tone="success">Dashboard</BarberBadge>}
                            {collaborator.can_view_own_reports && <BarberBadge tone="pix">Relatorio</BarberBadge>}
                            {collaborator.can_launch_sales && <BarberBadge tone="permuta">Vendas</BarberBadge>}
                          </div>
                        </td>
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
                    <td colSpan="5">
                      <BarberEmptyState
                        description="Cadastre colaboradores para montar o ranking e a distribuicao das comissoes."
                        title="Nenhum colaborador cadastrado"
                      />
                    </td>
                  </tr>
                )}
              </BarberTable>
            ) : currentCollaboratorFinancialSummary ? (
              <>
                <div className="barber-summary-grid">
                  <div className="barber-summary-item">
                    <div>
                      <strong>Atendimentos</strong>
                      <p>Quantidade lancada por voce no periodo</p>
                    </div>
                    <strong>{currentCollaboratorFinancialSummary.sales_count || 0}</strong>
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
            )}
          </BarberCard>
        </section>
      </>
    )
  }

  function renderSettlements() {
    if (!isAdmin) {
      return (
        <BarberCard>
          <BarberEmptyState
            description="Os acertos de colaboradores ficam disponiveis apenas para perfis gestores."
            title="Acertos indisponiveis"
          />
        </BarberCard>
      )
    }

    const activeSettlementSummary = settlementPreview || {}
    const totalAttendances = activeSettlementSummary.total_attendances || activeSettlementSummary.totalAttendances || 0
    const totalCommission = activeSettlementSummary.total_commission || 0
    const totalAdvances = activeSettlementSummary.total_advances || 0
    const netAmount = activeSettlementSummary.net_amount || 0
    const totalSettlementsPaid = settlements.reduce((sum, settlement) => sum + Number(settlement.net_amount || 0), 0)
    const totalSettlementsCommission = settlements.reduce((sum, settlement) => sum + Number(settlement.total_commission || 0), 0)
    const pendingAdvances = advances.filter((advance) => advance.status === 'pending').length

    return (
      <section className="settlements-page">
        <BarberCard className="settlements-card settlements-header">
          <div className="barber-panel-header">
            <div>
              <span className="barber-overline">Fechamento</span>
              <h3>Acertos</h3>
              <p>Fechamento de comissoes e pagamentos dos colaboradores.</p>
            </div>
            <BarberBadge tone="admin">Gestao</BarberBadge>
          </div>
        </BarberCard>

        <BarberCard className="settlements-card settlements-filters-card">
          <div className="barber-panel-header">
            <div>
              <span className="barber-overline">Periodo atual</span>
              <h3>Fechamento por colaborador</h3>
              <p>Selecione o colaborador e o periodo antes de calcular ou fechar o pagamento.</p>
            </div>
            <BarberBadge tone="cash">Comissoes</BarberBadge>
          </div>

          <div className="settlements-filters-grid">
            <div className="barber-form-block">
              <label htmlFor="settlement-collaborator">Colaborador</label>
              <select
                className="barber-select"
                id="settlement-collaborator"
                name="collaboratorId"
                onChange={updateSettlementFilters}
                value={settlementCollaboratorId}
              >
                <option value="">Selecione</option>
                {collaborators
                  .filter((collaborator) => collaborator.is_active && !collaborator.is_deleted)
                  .map((collaborator) => (
                    <option key={collaborator.id} value={collaborator.id}>
                      {collaborator.name || collaborator.nickname}
                    </option>
                  ))}
              </select>
            </div>
            <div className="barber-form-block">
              <label htmlFor="settlement-start-date">Data inicial</label>
              <input
                className="barber-input"
                id="settlement-start-date"
                name="startDate"
                onChange={updateSettlementFilters}
                type="date"
                value={settlementFilters.startDate}
              />
            </div>
            <div className="barber-form-block">
              <label htmlFor="settlement-end-date">Data final</label>
              <input
                className="barber-input"
                id="settlement-end-date"
                name="endDate"
                onChange={updateSettlementFilters}
                type="date"
                value={settlementFilters.endDate}
              />
            </div>
            <div className="settlements-filter-actions">
              <BarberButton onClick={() => loadSettlementPreview(settlementFilters)} type="button" variant="secondary">
                Atualizar
              </BarberButton>
              <BarberButton onClick={createSettlement} type="button" variant="primary">
                Fechar acerto
              </BarberButton>
            </div>
          </div>
        </BarberCard>

        <div className="settlements-summary-grid">
          <div className="settlements-summary-card">
            <span>Total de atendimentos</span>
            <strong>{totalAttendances}</strong>
            <p>No periodo selecionado</p>
          </div>
          <div className="settlements-summary-card">
            <span>Comissao gerada</span>
            <strong>{money(totalCommission)}</strong>
            <p>Antes dos vales</p>
          </div>
          <div className="settlements-summary-card">
            <span>Vales/adiantamentos</span>
            <strong>{money(totalAdvances)}</strong>
            <p>Aprovados no periodo</p>
          </div>
          <div className="settlements-summary-card settlements-summary-card-highlight">
            <span>Valor liquido a pagar</span>
            <strong>{money(netAmount)}</strong>
            <p>Valor previsto</p>
          </div>
        </div>

        {!settlementPreview ? (
          <div className="settlements-empty-state">
            <strong>Fechamento aguardando filtros</strong>
            <p>Escolha um colaborador e clique em Atualizar para carregar o resumo do periodo.</p>
          </div>
        ) : null}

        <div className="settlements-detail-grid">
          <BarberCard className="settlements-card">
            <div className="barber-panel-header">
              <div>
                <h3>Detalhes de vales e adiantamentos</h3>
                <p>Mantenha as movimentacoes internas da equipe dentro do mesmo fluxo de acertos.</p>
              </div>
              <BarberBadge tone="pending">{pendingAdvances} pendentes</BarberBadge>
            </div>

            <form className="settlements-advance-form" onSubmit={createAdvance}>
              <div className="settlements-advance-grid">
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
                      .filter((collaborator) => collaborator.is_active && !collaborator.is_deleted)
                      .map((collaborator) => (
                        <option key={collaborator.id} value={collaborator.id}>
                          {collaborator.name || collaborator.nickname}
                        </option>
                      ))}
                  </select>
                </div>
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
                <div className="barber-form-block settlements-advance-reason">
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

              <div className="settlements-advance-footer">
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
                <BarberButton type="submit" variant="primary">
                  Solicitar vale
                </BarberButton>
              </div>
            </form>

            <BarberTable className="settlements-table-wrapper" columns={['Data', 'Colaborador', 'Valor', 'Status', 'Acoes']}>
              {advances.slice(0, 6).length > 0 ? (
                advances.slice(0, 6).map((advance) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    <BarberEmptyState
                      description="Nenhum vale ou adiantamento encontrado para acompanhar agora."
                      title="Sem movimentacoes"
                    />
                  </td>
                </tr>
              )}
            </BarberTable>
          </BarberCard>

          <BarberCard className="settlements-card">
            <div className="barber-panel-header">
              <div>
                <h3>Resumo dos acertos</h3>
                <p>Leitura rapida dos fechamentos ja registrados.</p>
              </div>
              <BarberBadge tone="admin">{settlements.length} registros</BarberBadge>
            </div>

            <div className="settlements-mini-summary">
              <div>
                <span>Total pago</span>
                <strong>{money(totalSettlementsPaid)}</strong>
                <p>Soma liquida dos fechamentos</p>
              </div>
              <div>
                <span>Comissoes</span>
                <strong>{money(totalSettlementsCommission)}</strong>
                <p>Comissao bruta fechada</p>
              </div>
              <div>
                <span>Historico</span>
                <strong>{settlements.length}</strong>
                <p>Acertos anteriores</p>
              </div>
            </div>
          </BarberCard>
        </div>

        <BarberCard className="settlements-card settlements-history-card">
          <div className="barber-panel-header">
            <div>
              <h3>Historico de acertos anteriores</h3>
              <p>Historico separado do fechamento atual para auditoria e conferencia de pagamentos.</p>
            </div>
            <BarberBadge tone="admin">{settlements.length} registros</BarberBadge>
          </div>

          <BarberTable className="settlements-table-wrapper" columns={['Data do fechamento', 'Colaborador', 'Periodo', 'Valor', 'Comissao', 'Vales']}>
            {settlements.length > 0 ? (
              settlements.map((settlement) => (
                <tr key={settlement.id}>
                  <td>{fullDate(settlement.created_at)}</td>
                  <td>{settlement.collaborator_name}</td>
                  <td>
                    <span>
                      {settlement.period_start
                        ? `${shortDate(settlement.period_start)} ate ${shortDate(settlement.period_end)}`
                        : 'Inicio ate fechamento'}
                      </span>
                  </td>
                  <td><strong>{money(settlement.net_amount)}</strong></td>
                  <td>{money(settlement.total_commission)}</td>
                  <td>{money(settlement.total_advances)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">
                  <BarberEmptyState
                    description="Nenhum acerto encontrado para este periodo."
                    title="Historico vazio"
                  />
                </td>
              </tr>
            )}
          </BarberTable>
        </BarberCard>
      </section>
    )
  }

  function renderReports() {
    if (!isAdmin) {
return (
      <>
        <section className="barber-grid-two barber-cash-layout">
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
        <BarberCard className="barber-report-hub">
          <div className="barber-panel-header">
            <div>
              <span className="barber-overline">Relatorios</span>
              <h3>Central historica da barbearia</h3>
              <p>Use esta area para analisar periodos, formas de pagamento, servicos, permutas, comissoes e caixa.</p>
            </div>
            <BarberBadge tone="admin">Historico real</BarberBadge>
          </div>

          <div className="barber-report-scope-grid">
            {[
              'Diario',
              'Semanal',
              'Mensal',
              'Periodo personalizado',
              'Por colaborador',
              'Por forma de pagamento',
              'Por servico',
              'Por permuta',
              'Por comissao',
              'Por caixa'
            ].map((scope) => (
              <span className="barber-report-scope" key={scope}>{scope}</span>
            ))}
          </div>
        </BarberCard>

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
              <div className="barber-summary-item">
                <div>
                  <strong>Total de produtos</strong>
                  <p>Catalogo disponivel para revenda futura</p>
                </div>
                <strong>{products.length}</strong>
              </div>
              <div className="barber-summary-item">
                <div>
                  <strong>Estoque baixo</strong>
                  <p>Produtos que pedem reposicao imediata</p>
                </div>
                <strong>{lowStockProducts.length}</strong>
              </div>
            </div>
          </BarberCard>

        </section>
      </>
    )
  }

  function renderSettings() {
    if (!isAdmin) {
      return (
        <BarberCard>
          <div className="barber-panel-header">
            <div>
              <span className="barber-overline">Configuracoes</span>
              <h3>Acesso restrito</h3>
              <p>Apenas o dono/admin da barbearia pode gerenciar PIN e dados sensiveis da empresa.</p>
            </div>
            <BarberBadge tone="danger">Restrito</BarberBadge>
          </div>
        </BarberCard>
      )
    }

    const companyName = settingsData.company?.name || user?.company_name || 'Barbearia'
    const companyEmail = settingsData.company?.email || '-'
    const companyPhone = settingsData.company?.phone || '-'
    const publicBookingSlug = settingsData.company?.public_booking_slug || ''
    const publicBookingUrl = publicBookingSlug ? `${window.location.origin}/agendar/${publicBookingSlug}` : ''
    const onlineMinAdvanceEnabled = settingsData.agenda?.online_min_advance_enabled === true
    const onlineMinAdvanceValue = Number(settingsData.agenda?.online_min_advance_value || 0)

    return (
      <>
        <section className="barber-grid-two barber-settings-grid">
          <BarberCard className="barber-settings-card">
            <div className="barber-panel-header">
              <div>
                <span className="barber-overline">Empresa</span>
                <h3>Identidade da barbearia</h3>
                <p>Base pronta para nome, logo e presenca visual do modulo.</p>
              </div>
              <BarberBadge tone="neutral">Em breve</BarberBadge>
            </div>

            <div className="barber-settings-preview">
              <div className="barber-settings-logo-placeholder">
                <BarberIcon name="catalog" />
              </div>
              <div>
                <strong>{companyName}</strong>
                <p>Marca d'agua, upload de logo e identidade visual entram nesta area na proxima etapa.</p>
              </div>
            </div>

            <div className="barber-settings-meta">
              <div className="barber-settings-meta-item">
                <span>Nome da barbearia</span>
                <strong>{companyName}</strong>
              </div>
              <div className="barber-settings-meta-item">
                <span>E-mail comercial</span>
                <strong>{companyEmail}</strong>
              </div>
              <div className="barber-settings-meta-item">
                <span>Telefone</span>
                <strong>{companyPhone}</strong>
              </div>
              <div className="barber-settings-meta-item">
                <span>Link publico</span>
                <strong>{publicBookingUrl || 'Sera exibido quando a agenda publica estiver configurada.'}</strong>
              </div>
            </div>
          </BarberCard>

          <BarberCard className="barber-settings-card">
            <div className="barber-panel-header">
              <div>
                <span className="barber-overline">Agenda</span>
                <h3>Antecedencia para agendamento online</h3>
                <p>Defina se o cliente precisa reservar com horas minimas de antecedencia no link publico.</p>
              </div>
              <BarberBadge tone={onlineMinAdvanceEnabled ? 'success' : 'neutral'}>
                {onlineMinAdvanceEnabled ? 'Ativa' : 'Desativada'}
              </BarberBadge>
            </div>

            <form className="barber-form-grid" onSubmit={handleAgendaSettingsSubmit}>
              <label className="barber-settings-toggle">
                <span>Exigir antecedencia minima para agendamentos online</span>
                <input
                  checked={onlineMinAdvanceEnabled}
                  onChange={(event) => handleAgendaSettingsChange('online_min_advance_enabled', event.target.checked)}
                  type="checkbox"
                />
              </label>

              {onlineMinAdvanceEnabled ? (
                <div className="barber-input-grid">
                  <label>
                    <span>Antecedencia minima</span>
                    <input
                      inputMode="numeric"
                      min="1"
                      onChange={(event) => handleAgendaSettingsChange('online_min_advance_value', Number(event.target.value || 0))}
                      placeholder="1, 2, 4, 8, 12 ou 24"
                      step="1"
                      type="number"
                      value={onlineMinAdvanceValue || ''}
                    />
                  </label>
                </div>
              ) : null}

              <div className="barber-settings-hint">
                <BarberIcon name="clock" />
                <span>
                  {onlineMinAdvanceEnabled
                    ? `Clientes so verao horarios com pelo menos ${onlineMinAdvanceValue || 1} horas de antecedencia.`
                    : 'Com a regra desativada, o cliente podera reservar qualquer horario disponivel no link online.'}
                </span>
              </div>

              <div className="barber-settings-actions">
                <BarberButton disabled={settingsSaving} type="submit" variant="primary">
                  <BarberIcon name="check" />
                  <span>{settingsSaving ? 'Salvando...' : 'Salvar agenda'}</span>
                </BarberButton>
              </div>
            </form>
          </BarberCard>

          <BarberCard className="barber-settings-card">
            <div className="barber-panel-header">
              <div>
                <span className="barber-overline">Seguranca</span>
                <h3>Recuperacao e troca de PIN</h3>
                <p>Use este fluxo para redefinir o PIN do dono/admin sem expor dados sensiveis no painel.</p>
              </div>
              <BarberBadge tone="admin">Prioridade</BarberBadge>
            </div>

            <div className="barber-settings-security-callout">
              <div>
                <strong>PIN sensivel da operacao</strong>
                <p>O codigo enviado por e-mail expira em {settingsData.security?.expires_in_minutes || 10} minutos.</p>
              </div>
              <BarberButton onClick={openPinRecovery} type="button" variant="primary">
                <BarberIcon name="refresh" />
                <span>Esqueci meu PIN</span>
              </BarberButton>
            </div>

            {settingsLoading ? (
              <div className="barber-settings-loading">
                <p>Carregando configuracoes de agenda e seguranca...</p>
              </div>
            ) : null}

            {pinRecoveryOpen ? (
              <div className="barber-settings-security-flow">
                <div className="barber-settings-stepper">
                  <span className={pinRecoveryStep === 'request' ? 'active' : ''}>1. Validar e-mail</span>
                  <span className={pinRecoveryStep === 'reset' ? 'active' : ''}>2. Redefinir PIN</span>
                </div>

                {pinRecoveryStep === 'request' ? (
                  <form className="barber-form-grid" onSubmit={handlePinRecoveryRequest}>
                    <label>
                      <span>E-mail de recuperacao</span>
                      <input
                        onChange={(event) => handlePinRecoveryFieldChange('email', event.target.value)}
                        placeholder="dono@barbearia.com.br"
                        type="email"
                        value={pinRecoveryForm.email}
                      />
                    </label>

                    <div className="barber-settings-actions">
                      <BarberButton disabled={pinRecoverySubmitting} type="submit" variant="primary">
                        <BarberIcon name="check" />
                        <span>{pinRecoverySubmitting ? 'Enviando codigo...' : 'Enviar codigo'}</span>
                      </BarberButton>
                      <BarberButton
                        onClick={() => resetPinRecoveryFlow(pinRecoveryForm.email)}
                        type="button"
                        variant="ghost"
                      >
                        <BarberIcon name="close" />
                        <span>Fechar</span>
                      </BarberButton>
                    </div>
                  </form>
                ) : (
                  <form className="barber-form-grid" onSubmit={handlePinResetSubmit}>
                    <label>
                      <span>E-mail de recuperacao</span>
                      <input
                        onChange={(event) => handlePinRecoveryFieldChange('email', event.target.value)}
                        type="email"
                        value={pinRecoveryForm.email}
                      />
                    </label>

                    <div className="barber-input-grid">
                      <label>
                        <span>Codigo de 6 digitos</span>
                        <input
                          inputMode="numeric"
                          maxLength={6}
                          onChange={(event) => handlePinRecoveryFieldChange('code', event.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          value={pinRecoveryForm.code}
                        />
                      </label>

                      <label>
                        <span>Novo PIN</span>
                        <input
                          inputMode="numeric"
                          onChange={(event) => handlePinRecoveryFieldChange('newPin', event.target.value.replace(/\D/g, ''))}
                          placeholder="Minimo 4 digitos"
                          type="password"
                          value={pinRecoveryForm.newPin}
                        />
                      </label>

                      <label>
                        <span>Confirmar PIN</span>
                        <input
                          inputMode="numeric"
                          onChange={(event) => handlePinRecoveryFieldChange('confirmPin', event.target.value.replace(/\D/g, ''))}
                          placeholder="Repita o PIN"
                          type="password"
                          value={pinRecoveryForm.confirmPin}
                        />
                      </label>
                    </div>

                    <div className="barber-settings-hint">
                      <BarberIcon name="clock" />
                      <span>Use apenas numeros. O novo PIN precisa ter pelo menos 4 digitos.</span>
                    </div>

                    <div className="barber-settings-actions">
                      <BarberButton disabled={pinRecoverySubmitting} type="submit" variant="primary">
                        <BarberIcon name="check" />
                        <span>{pinRecoverySubmitting ? 'Salvando PIN...' : 'Salvar novo PIN'}</span>
                      </BarberButton>
                      <BarberButton
                        onClick={() => resetPinRecoveryFlow(pinRecoveryForm.email)}
                        type="button"
                        variant="ghost"
                      >
                        <BarberIcon name="close" />
                        <span>Cancelar</span>
                      </BarberButton>
                    </div>
                  </form>
                )}
              </div>
            ) : null}

            {!pinRecoveryOpen ? (
              <div className="barber-settings-meta">
                <div className="barber-settings-meta-item">
                  <span>E-mail padrao</span>
                  <strong>{settingsData.security?.recovery_email || user?.email || '-'}</strong>
                </div>
                <div className="barber-settings-meta-item">
                  <span>Ultima revisao da area</span>
                  <strong>{settingsData.company?.created_at ? fullDate(settingsData.company.created_at) : 'Nao informado'}</strong>
                </div>
              </div>
            ) : null}
          </BarberCard>
        </section>
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

    if (!isAdmin && !isCollaborator && currentView === 'appointments') {
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

    if (lockedViews[currentView]) {
      return (
        <BarberCard>
          <BarberEmptyState
            description={lockedViews[currentView]}
            title="Recurso bloqueado pelo plano"
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

    if (!isAdmin && currentView === 'settlements') {
      return (
        <BarberCard>
          <BarberEmptyState
            description="Os acertos de colaboradores ficam disponiveis apenas para perfis gestores."
            title="Acertos indisponiveis"
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
      case 'settlements':
        return renderSettlements()
      case 'team':
        return renderTeam()
      case 'reports':
        return renderReports()
      case 'settings':
        return renderSettings()
      default:
        return renderDashboard()
    }
  }

  const sidebarUser = {
    name: user?.name || 'Usuário',
    role: isAdmin ? 'Administrador' : 'Colaborador',
    avatar: user?.avatar_url || user?.avatarUrl || null
  }

  return (
    <>
      <Shell
        sidebarProps={{
          activeItem: currentView,
          onNavigate: navigateView,
          companyName: user?.company_name || user?.companyName || 'Barbearia',
          planName: planLabel,
          user: sidebarUser
        }}
        topbarProps={{
          title: meta.label,
          subtitle: meta.title,
          user: sidebarUser,
          onMenuClick: () => setSidebarOpen((prev) => !prev),
          onSearchClick: () => {}
        }}
      >
        <section className="barber-page">
          <header className="barber-page-hero">
            <div>
              <span className="barber-overline">{isAdmin ? 'Modo gestor' : 'Modo colaborador'}</span>
              <h1>{currentView === 'dashboard' ? 'BarberGestor' : meta.label}</h1>
              <p>{meta.description}</p>
              <div className="barber-plan-summary">
                <span>Plano atual</span>
                <strong>{planLabel}</strong>
              </div>
            </div>

            <div className="barber-page-actions">
              {currentView === 'team' && isAdmin && (
                <LockedFeature
                  inline
                  locked={!canUseCollaboratorsFeature}
                  message={getLockedFeatureMessage('collaborators')}
                  onLockedClick={handleLockedFeature}
                >
                  <div className="barber-inline-lock-target">
                    <BarberButton onClick={openCollaboratorCreateModal} type="button" variant="primary">
                      <BarberIcon name="plus" />
                      <span>Adicionar colaborador</span>
                    </BarberButton>
                  </div>
                </LockedFeature>
              )}
              <BarberButton
                onClick={() => (currentView === 'settings' ? loadSettings() : loadData())}
                type="button"
                variant="ghost"
              >
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
      </Shell>

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
                <LockedFeature
                  locked={!canUseExtraPermissionsFeature}
                  message={getLockedFeatureMessage('extra_permissions')}
                  onLockedClick={handleLockedFeature}
                >
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
                </LockedFeature>
                {isAdmin && (
                  <label className="barber-permission-item">
                    <input
                      checked={collaboratorForm.canMakeBarter}
                      name="canMakeBarter"
                      onChange={updateCollaboratorForm}
                      type="checkbox"
                    />
                    <span>
                      Pode lancar permuta
                      <small className="barber-form-hint">Permite registrar atendimentos como permuta. A comissao da permuta sera descontada do saldo do colaborador e pode deixar o saldo negativo.</small>
                    </span>
                  </label>
                )}
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
        subtitle={canManageCash
          ? 'Selecione um servico ativo, vincule o colaborador e registre a venda direto no caixa.'
          : 'Selecione um servico ativo e registre a venda vinculada automaticamente ao colaborador autenticado.'}
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

              {canManageCash ? (
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
              ) : (
                <div className="barber-form-block">
                  <label>Colaborador</label>
                  <div className="barber-inline-hint">
                    {collaboratorDisplayName(loggedInCollaborator) || user?.name || 'Colaborador autenticado'}
                  </div>
                </div>
              )}

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
                  {salePaymentOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
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
                    <p>{activeSaleCollaborator ? `Aplicada para ${collaboratorDisplayName(activeSaleCollaborator)}` : 'Escolha o colaborador responsavel'}</p>
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
        size="small"
        subtitle={deleteSaleTarget ? `Atendimento de ${money(deleteSaleTarget.total_amount)} em ${fullDate(deleteSaleTarget.created_at)}` : ''}
        title="Cancelar atendimento"
      >
        <div className="barber-modal-content">
          <div className="barber-form-block">
            <label htmlFor="delete-reason">Motivo do cancelamento</label>
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
              <label htmlFor="delete-pin">PIN admin</label>
              <input
                className="barber-input"
                id="delete-pin"
                inputMode="numeric"
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
              <span>Cancelar atendimento</span>
            </BarberButton>
          </div>
        </div>
      </BarberModal>
    </>
  )
}

export default Barber
