import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Shell, SummaryItem, Card, Badge, Empty, Button } from '../components/design-system'
import { SkeletonLoader, CustomEmptyState } from '../components/common'
import { ProgressReport } from '../components/reports'
import { TutorialSpotlight } from '../components/tutorial'
import { BottomNav, QuickActionsFAB } from '../components/mobile'
import { useTenantTheme } from '../hooks/useTenantTheme'
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Check,
  Clock,
  CreditCard,
  Image,
  MapPin,
  Palette,
  RefreshCw,
  Save,
  Smartphone,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import CollaboratorAvatar from '../components/barber/CollaboratorAvatar'

import LockedFeature from '../components/common/LockedFeature'
import ServiceIcon from '../components/barber/ServiceIcon'
import { normalizeServiceIcon } from '../components/barber/ServiceIcon.utils'
import AgendaGrid from '../components/barber/agenda/AgendaGrid'
import AppointmentModal from '../components/barber/agenda/AppointmentModal'
import AppointmentComposerModal from '../components/barber/agenda/AppointmentComposerModal'
import AppointmentDetailsPanel from '../components/barber/agenda/AppointmentDetailsPanel'
import AgendaToolbar from '../components/barber/agenda/AgendaToolbar'
import AgendaInterna from '../components/agenda/AgendaInterna'
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
  Users,
  Wallet,
  Lock,
  Settings,
  Crown,
  Menu,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Plus,
  MessageSquare
} from 'lucide-react'
import ClientesBarber from './barber/Clientes'
import { CrmDashboard, CustomerSidePanel } from '../components/premium'
import AppointmentHistoryView from '../components/premium/AppointmentHistoryView'
import AgendaCrmView from '../components/premium/AgendaCrmView'
import BookingAvailabilityView from '../components/premium/BookingAvailabilityView'
import ServicesAnalyticsView from '../components/premium/ServicesAnalyticsView'
import Servicos from './barber/Servicos'
import Produtos from './barber/Produtos'
import ItensGeladeira from './barber/ItensGeladeira'
import AtendimentoWorkspace from '../components/atendimento/AtendimentoWorkspace'
import api from '../services/api'
import {
  emptyFridgeItem,
  defaultFridgeFilters,
  normalizeFridgeItem,
  fridgeItemToPayload
} from '../features/barber/utils/fridgeHelpers'
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
import '../styles/premium-tokens.css'
import '../styles/ambient-backgrounds.css'
import BookingLandingConfig from './booking/BookingLandingConfig'
import DashboardView from '../features/barber/views/DashboardView'
import CashierView from '../features/barber/views/CashierView'
import TeamView from '../features/barber/views/TeamView'
import SettlementsView from '../features/barber/views/SettlementsView'
import ReportsView from '../features/barber/views/ReportsView'
import SettingsView from '../features/barber/views/SettingsView'
import SalesView from '../features/barber/views/SalesView'
import TeamFormModal from '../features/barber/components/team/TeamFormModal'
import CollaboratorSummaryModal from '../features/barber/components/CollaboratorSummaryModal'
import SaleSlideover from '../features/barber/components/SaleSlideover'
import DeleteSaleModal from '../features/barber/components/DeleteSaleModal'
import WatermarkBackground from '../components/watermark/WatermarkBackground'
import BrandingEngine from '../components/common/BrandingEngine'

const emptyService = {
  name: '',
  description: '',
  price: '',
  icon: 'scissors',
  category: 'corte',
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

const _saleWizardSteps = [
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
    created_at: null,
    whatsapp_phone: '',
    address_line: '',
    city: '',
    state: '',
    business_description: '',
    public_display_name: '',
    business_email: '',
    logo_url: '',
    primary_color: '',
    secondary_color: '',
    accent_color: ''
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

function PlaceholderView({ title, description }) {
  return (
    <section style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 20px', textAlign: 'center', gap: '12px',
      background: 'var(--pm-surface)', borderRadius: 'var(--pm-radius-lg)',
      border: '1px solid var(--pm-border)', marginTop: '20px'
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', background: 'var(--pm-surface-hover)',
        border: '1px solid var(--pm-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--pm-primary)'
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--pm-text)', margin: 0 }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--pm-text-muted)', maxWidth: 420, margin: 0, lineHeight: 1.5 }}>{description}</p>
    </section>
  )
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
  fridge: {
    label: 'Itens da Geladeira',
    title: 'Controle de itens da geladeira',
    description: 'Cadastre bebidas, produtos de balcao e itens de consumo rapido com estoque e comissao.'
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
  },
  'appointments-history': {
    label: 'Historico',
    title: 'Historico de agendamentos',
    description: 'Agendamentos anteriores, concluidos, cancelados e no-show.'
  },
  'appointments-crm': {
    label: 'CRM da Agenda',
    title: 'CRM da agenda',
    description: 'Proximos retornos, clientes frequentes e analise de cancelamentos.'
  },
  'appointments-blocks': {
    label: 'Bloqueios',
    title: 'Bloqueios e horarios',
    description: 'Configure disponibilidade, horarios de trabalho e bloqueios.'
  },
  'customers-crm': {
    label: 'Historico e CRM',
    title: 'Historico e CRM',
    description: 'Acompanhe o desempenho da barbearia com metricas completas de clientes e relacionamento.'
  },
  'customers-birthdays': {
    label: 'Aniversariantes',
    title: 'Aniversariantes',
    description: 'Clientes que fazem aniversario neste periodo.'
  },
  'customers-inactive': {
    label: 'Inativos',
    title: 'Clientes inativos',
    description: 'Clientes sem atendimento ou agendamento ha mais de 90 dias.'
  },
  'customers-vip': {
    label: 'VIP / Fidelidade',
    title: 'Clientes VIP',
    description: 'Clientes classificados como Fiel ou VIP com base nas metricas de fidelidade.'
  },
  'services-top': {
    label: 'Mais vendidos',
    title: 'Servicos mais vendidos',
    description: 'Ranking dos servicos com maior saida na barbearia.'
  },
  'services-favorites': {
    label: 'Favoritos',
    title: 'Servicos favoritos dos clientes',
    description: 'Servicos mais utilizados por cada cliente e com maior taxa de retorno.'
  },
  'services-commissions': {
    label: 'Comissoes',
    title: 'Comissoes por servico',
    description: 'Configure e acompanhe as comissoes por servico para cada colaborador.'
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

function _advanceTone(status) {
  return {
    approved: 'approved',
    pending: 'pending',
    rejected: 'rejected',
    liquidated: 'liquidated'
  }[status] || 'neutral'
}

function _advanceLabel(status) {
  return {
    approved: 'Aprovado',
    pending: 'Pendente',
    rejected: 'Rejeitado',
    liquidated: 'Liquidado'
  }[status] || status || 'Nao informado'
}

function _appointmentTone(status) {
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

function _appointmentLabel(status) {
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

function _formatAppointmentSlot(appointment) {
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

  if (normalized.startsWith('/barber/agenda/historico')) return 'appointments-history'
  if (normalized.startsWith('/barber/agenda/crm')) return 'appointments-crm'
  if (normalized.startsWith('/barber/agenda/bloqueios')) return 'appointments-blocks'
  if (normalized.startsWith('/barber/agenda') || normalized.startsWith('/barber/agendamentos') || normalized.startsWith('/barber/minha-agenda')) {
    return 'appointments'
  }

  if (normalized.startsWith('/barber/servicos/mais-vendidos')) return 'services-top'
  if (normalized.startsWith('/barber/servicos/favoritos')) return 'services-favorites'
  if (normalized.startsWith('/barber/servicos/comissoes')) return 'services-commissions'
  if (normalized.startsWith('/barber/servicos')) return 'services'

  if (normalized.startsWith('/barber/clientes/crm')) return 'customers-crm'
  if (normalized.startsWith('/barber/clientes/aniversariantes')) return 'customers-birthdays'
  if (normalized.startsWith('/barber/clientes/inativos')) return 'customers-inactive'
  if (normalized.startsWith('/barber/clientes/vip')) return 'customers-vip'
  if (normalized.startsWith('/barber/clientes')) return 'customers'

  if (normalized.startsWith('/barber/produtos')) return 'products'

  if (normalized.startsWith('/barber/geladeira')) return 'fridge'

  if (normalized.startsWith('/barber/vendas')) return 'sales'

  if (normalized.startsWith('/barber/caixa')) return 'cashier'

  if (normalized.startsWith('/barber/acertos')) return 'settlements'

  if (normalized.startsWith('/barber/colaboradores')) return 'team'

  if (normalized.startsWith('/barber/relatorios')) return 'reports'

  if (normalized.startsWith('/barber/configuracoes')) return 'settings'

  return 'dashboard'
}

function getBarberViewPath(view) {
  return {
    dashboard: '/barber/dashboard',
    appointments: '/barber/agenda',
    'appointments-history': '/barber/agenda/historico',
    'appointments-crm': '/barber/agenda/crm',
    'appointments-blocks': '/barber/agenda/bloqueios',
    customers: '/barber/clientes',
    'customers-crm': '/barber/clientes/crm',
    'customers-birthdays': '/barber/clientes/aniversariantes',
    'customers-inactive': '/barber/clientes/inativos',
    'customers-vip': '/barber/clientes/vip',
    services: '/barber/servicos',
    'services-top': '/barber/servicos/mais-vendidos',
    'services-favorites': '/barber/servicos/favoritos',
    'services-commissions': '/barber/servicos/comissoes',
    products: '/barber/produtos',
    fridge: '/barber/geladeira',
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
  const { primaryColor, companyName: themeCompanyName, logoUrl, wallpaperUrl } = useTenantTheme()
  const [activeView, setActiveView] = useState(() => getInitialBarberView(window.location.pathname))
  const [useNewAtendimentoLayout, _setUseNewAtendimentoLayout] = useState(true)
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
  const [fridgeCatalog, setFridgeCatalog] = useState([])
  const [fridgeFilters, setFridgeFilters] = useState(defaultFridgeFilters)
  const [fridgeForm, setFridgeForm] = useState(emptyFridgeItem)
  const [editingFridgeId, setEditingFridgeId] = useState('')
  const [fridgeReport, setFridgeReport] = useState(null)
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
  const [_deletePassword, setDeletePassword] = useState('')
  const [deletePin, setDeletePin] = useState('')
  const [submittingSale, setSubmittingSale] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth <= 768)
  const [_sidebarOpen, setSidebarOpen] = useState(false)
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
  const [companyProfileSaving, setCompanyProfileSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState('')
  const [_settingsTab, _setSettingsTab] = useState('general')
  const [settingsSection, setSettingsSection] = useState('menu')
  const [brandingForm, setBrandingForm] = useState({ logo_url: '', name: '', display_name: '', primary_color: '#a3ff12', secondary_color: '#0c1017', accent_color: '#7fe11e' })
  const [brandingLoading, setBrandingLoading] = useState(false)
  const [brandingSaving, setBrandingSaving] = useState(false)
  const [brandingLogoPreview, setBrandingLogoPreview] = useState('')
  const [integrationConfig, setIntegrationConfig] = useState(null)
  const [integrationLoading, setIntegrationLoading] = useState(false)
  const [integrationSaving, setIntegrationSaving] = useState(false)
  const [integrationForm, setIntegrationForm] = useState({
    providerType: 'mock',
    phoneNumberId: '',
    accessToken: '',
    businessAccountId: '',
    apiUrl: '',
    integrationEnabled: false
  })
  const [integrationTestPhone, setIntegrationTestPhone] = useState('')
  const [integrationTestResult, setIntegrationTestResult] = useState(null)
  const [integrationTestSending, setIntegrationTestSending] = useState(false)
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
  const [crmDrawerCustomer, setCrmDrawerCustomer] = useState(null)

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

  const loadFridgeCatalog = useCallback(async (filters = fridgeFilters, options = {}) => {
    try {
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.status && filters.status !== 'all') params.status = filters.status
      if (filters.location) params.location = filters.location
      if (filters.category) params.category = filters.category
      const response = await api.get('/barber/products', { params: { ...params, product_type: 'fridge' } })
      setFridgeCatalog(response.data.data)
      const reportResponse = await api.get('/barber/fridge-items/report')
      setFridgeReport(reportResponse.data.data)
    } catch (err) {
      if (options.showError !== false) {
        setError(err.response?.data?.error || 'Nao foi possivel carregar os itens da geladeira')
      }
    }
  }, [fridgeFilters])

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

      requests.push(api.get('/barber/products', { params: { product_type: 'fridge' } }))

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

      {
        const fridgeResponse = restResponses[responseIndex]
        if (fridgeResponse) {
          setFridgeCatalog(fridgeResponse.data.data)
          responseIndex += 1
        }
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

  useEffect(() => {
    if (settingsSection === 'branding') {
      loadBranding()
    } else if (settingsSection === 'integrations') {
      loadIntegrationConfig()
    }
  }, [settingsSection])

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

  function handleCompanyFieldChange(field, value) {
    setSettingsData((current) => ({
      ...current,
      company: {
        ...emptyBarberSettings.company,
        ...(current.company || {}),
        [field]: value
      }
    }))
  }

  function _handleLogoSelect(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Formato nao suportado. Aceitamos apenas JPEG, PNG ou WebP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem deve ter no maximo 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  function _handleLogoRemove() {
    setLogoPreview('')
    setSettingsData((current) => ({
      ...current,
      company: {
        ...emptyBarberSettings.company,
        ...(current.company || {}),
        logo_url: ''
      }
    }))
  }

  async function handleCompanyProfileSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const company = settingsData.company || {}
    const payload = {}
    const fields = ['name', 'email', 'phone', 'whatsapp_phone', 'address_line', 'city', 'state', 'business_description', 'public_display_name', 'business_email']

    for (const field of fields) {
      if (company[field] !== undefined && company[field] !== emptyBarberSettings.company[field]) {
        payload[field] = company[field]
      }
    }

    if (Object.keys(payload).length === 0) {
      setSuccess('Nenhuma alteracao para salvar.')
      return
    }

    try {
      setCompanyProfileSaving(true)
      const response = await api.patch('/barber/company/profile', payload)
      setSettingsData(response.data?.data || emptyBarberSettings)
      setLogoPreview('')
      setSuccess('Perfil da empresa atualizado com sucesso.')
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel atualizar o perfil.')
    } finally {
      setCompanyProfileSaving(false)
    }
  }

  async function _handleLogoColorsSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const company = settingsData.company || {}
    const payload = {}
    const logoValue = logoPreview || company.logo_url
    if (logoValue) payload.logo_url = logoValue
    if (company.primary_color) payload.primary_color = company.primary_color
    if (company.secondary_color) payload.secondary_color = company.secondary_color
    if (company.accent_color) payload.accent_color = company.accent_color

    if (Object.keys(payload).length === 0) {
      setSuccess('Nenhuma alteracao para salvar.')
      return
    }

    try {
      setCompanyProfileSaving(true)
      await api.put('/barber/company/theme', payload)
      setSuccess('Identidade visual atualizada com sucesso.')
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel atualizar a identidade visual.')
    } finally {
      setCompanyProfileSaving(false)
    }
  }

  async function loadBranding() {
    setBrandingLoading(true)
    setError('')
    try {
      const response = await api.get('/barber/company/branding')
      const data = response.data?.data || {}
      setBrandingForm({
        logo_url: data.logo_url || '',
        name: data.name || '',
        display_name: data.display_name || '',
        primary_color: data.primary_color || '#a3ff12',
        secondary_color: data.secondary_color || '#0c1017',
        accent_color: data.accent_color || '#7fe11e'
      })
      setBrandingLogoPreview('')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar dados de branding.')
    } finally {
      setBrandingLoading(false)
    }
  }

  function handleBrandingFieldChange(field, value) {
    setBrandingForm((current) => ({ ...current, [field]: value }))
  }

  function handleBrandingLogoSelect(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Formato nao suportado. Aceitamos apenas JPEG, PNG ou WebP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem deve ter no maximo 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setBrandingLogoPreview(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  function handleBrandingLogoRemove() {
    setBrandingLogoPreview('')
    setBrandingForm((current) => ({ ...current, logo_url: '' }))
  }

  async function handleBrandingSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setBrandingSaving(true)

    try {
      const payload = { ...brandingForm }
      if (brandingLogoPreview) payload.logo_url = brandingLogoPreview
      if (!payload.name || !payload.name.trim()) {
        setError('Informe o nome da empresa.')
        return
      }
      await api.put('/barber/company/branding', payload)
      setSuccess('Identidade visual salva com sucesso.')
      setBrandingLogoPreview('')
      loadSettings({ clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar identidade visual.')
    } finally {
      setBrandingSaving(false)
    }
  }

  async function loadIntegrationConfig() {
    setIntegrationLoading(true)
    setError('')
    try {
      const response = await api.get('/barber/integrations/whatsapp')
      const data = response.data?.data
      if (data && data.configured !== false) {
        setIntegrationConfig(data)
        setIntegrationForm({
          providerType: data.providerType || 'mock',
          phoneNumberId: data.phoneNumberId || '',
          accessToken: '',
          businessAccountId: data.businessAccountId || '',
          apiUrl: data.apiUrl || '',
          integrationEnabled: data.integrationEnabled !== false
        })
      } else {
        setIntegrationConfig(null)
        setIntegrationForm({
          providerType: 'mock',
          phoneNumberId: '',
          accessToken: '',
          businessAccountId: '',
          apiUrl: '',
          integrationEnabled: false
        })
      }
      setIntegrationTestResult(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar configuracao de integracao.')
    } finally {
      setIntegrationLoading(false)
    }
  }

  function handleIntegrationFormChange(field, value) {
    setIntegrationForm((current) => ({ ...current, [field]: value }))
  }

  async function handleIntegrationSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIntegrationSaving(true)

    try {
      const payload = {
        providerType: integrationForm.providerType,
        phoneNumberId: integrationForm.phoneNumberId,
        businessAccountId: integrationForm.businessAccountId || undefined,
        apiUrl: integrationForm.apiUrl || undefined,
        integrationEnabled: integrationForm.integrationEnabled
      }
      if (integrationForm.accessToken) {
        payload.accessToken = integrationForm.accessToken
      }
      await api.put('/barber/integrations/whatsapp', payload)
      setSuccess('Configuracao do WhatsApp salva com sucesso.')
      await loadIntegrationConfig()
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar configuracao de integracao.')
    } finally {
      setIntegrationSaving(false)
    }
  }

  async function handleIntegrationDelete() {
    if (!window.confirm('Deseja realmente remover a integracao com WhatsApp?')) {
      return
    }
    setError('')
    setSuccess('')
    try {
      await api.delete('/barber/integrations/whatsapp')
      setSuccess('Integracao do WhatsApp removida.')
      setIntegrationConfig(null)
      setIntegrationForm({
        providerType: 'mock',
        phoneNumberId: '',
        accessToken: '',
        businessAccountId: '',
        apiUrl: '',
        integrationEnabled: false
      })
      setIntegrationTestResult(null)
      setIntegrationTestPhone('')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao remover integracao.')
    }
  }

  async function handleIntegrationTest() {
    setError('')
    setIntegrationTestResult(null)

    const phone = integrationTestPhone.replace(/\D/g, '')
    if (phone.length < 10) {
      setError('Numero de telefone invalido. Use no minimo 10 digitos (ex: 5511999999999)')
      return
    }

    setIntegrationTestSending(true)
    try {
      const response = await api.post('/barber/integrations/whatsapp/test', { to: phone })
      setIntegrationTestResult(response.data?.data || { success: true })
    } catch (err) {
      setIntegrationTestResult({
        success: false,
        error: err.response?.data?.error || 'Falha ao enviar mensagem de teste.'
      })
    } finally {
      setIntegrationTestSending(false)
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

  useEffect(() => {
    if (activeView !== 'fridge') {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      loadFridgeCatalog(fridgeFilters, { keepFullList: true })
    }, 220)

    return () => window.clearTimeout(timeoutId)
  }, [activeView, loadFridgeCatalog, fridgeFilters])

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

  function _addSaleItem() {
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

  async function submitService(event, options = {}) {
    if (event) event.preventDefault()
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

      if (options.saveAndContinue) {
        setServiceForm({
          ...emptyService,
          category: serviceForm.category,
          icon: serviceForm.icon
        })
        setServiceDrawerOpen(true)
        setSuccess('Servico salvo! Continue cadastrando.')
      } else {
        resetServiceEditor()
      }

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

  function duplicateService(service) {
    const newForm = {
      name: `${service.name} (Copia)`,
      description: service.description || '',
      price: String(service.price || ''),
      icon: service.icon || 'scissors',
      serviceType: service.serviceType || 'service',
      commissionType: service.commissionType || 'percentage',
      commissionValue: service.commissionValue || '',
      estimatedTimeMinutes: service.estimated_time_minutes ? String(service.estimated_time_minutes) : '',
      isActive: true
    }
    setEditingServiceId('')
    setServiceForm(newForm)
    setServiceDrawerOpen(true)
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

  function resetFridgeEditor() {
    setEditingFridgeId('')
    setFridgeForm(emptyFridgeItem)
  }

  function updateFridgeForm(event) {
    const { name, value } = event.target
    setFridgeForm((current) => ({
      ...current,
      [name]: name === 'isActive' ? value === 'true' : value
    }))
  }

  function updateFridgeFilters(event) {
    const { name, value } = event.target
    setFridgeFilters((current) => ({ ...current, [name]: value }))
  }

  async function submitFridgeItem(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const payload = { ...fridgeItemToPayload(fridgeForm), productType: 'fridge' }

    try {
      if (editingFridgeId) {
        await api.put(`/barber/products/${editingFridgeId}`, payload)
        setSuccess('Item atualizado')
      } else {
        await api.post('/barber/products', payload)
        setSuccess('Item cadastrado')
      }

      resetFridgeEditor()
      await loadData()

      if (activeView === 'fridge') {
        await loadFridgeCatalog(fridgeFilters, { keepFullList: true, showError: false })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel salvar o item')
    }
  }

  async function editFridgeItem(itemId) {
    setError('')
    setSuccess('')

    try {
      const response = await api.get(`/barber/products/${itemId}`)
      setEditingFridgeId(itemId)
      setFridgeForm(normalizeFridgeItem(response.data.data))
      navigateView('fridge')
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel carregar o item')
    }
  }

  async function toggleFridgeStatus(item) {
    setError('')
    setSuccess('')

    try {
      const currentIsActive = item.is_active ?? item.isActive
      await api.patch(`/barber/products/${item.id}/status`, { is_active: !currentIsActive })
      setSuccess(currentIsActive ? 'Item desativado' : 'Item ativado')
      await loadData()
      await loadFridgeCatalog(fridgeFilters, { keepFullList: true, showError: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel atualizar o status do item')
    }
  }

  async function toggleFridgeFavorite(item) {
    setError('')
    setSuccess('')

    try {
      await api.patch(`/barber/fridge-items/${item.id}/favorite`)
      const currentIsFavorite = item.is_favorite ?? item.isFavorite
      setSuccess(currentIsFavorite ? 'Item removido dos favoritos' : 'Item marcado como favorito')
      await loadData()
      await loadFridgeCatalog(fridgeFilters, { keepFullList: true, showError: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel atualizar o favorito')
    }
  }

  async function removeFridgeItem(itemId) {
    if (!window.confirm('Deseja realmente excluir este item?')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await api.delete(`/barber/products/${itemId}`)
      if (editingFridgeId === itemId) {
        resetFridgeEditor()
      }
      setSuccess('Item excluido')
      await loadData()
      await loadFridgeCatalog(fridgeFilters, { keepFullList: true, showError: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel excluir o item')
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
    const action = collaborator.is_active ? 'desativar' : 'ativar'
    const name = collaboratorDisplayName(collaborator)
    if (!window.confirm(`Tem certeza que deseja ${action} o colaborador "${name}"?`)) {
      return
    }

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

  async function _deleteAppointment(appointmentId) {
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

  async function handleSlideoverSubmit(saleData) {
    setError('')
    setSuccess('')
    setSubmittingSale(true)
    try {
      await api.post('/barber/sales', saleData)
      closeSaleModal()
      resetSaleWizard('success')
      setSuccess('Atendimento concluido com sucesso')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao registrar atendimento')
      throw err
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

  function _renderServices() {
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
        onDuplicate={duplicateService}
        onEdit={editService}
        onFilterChange={updateServiceFilters}
        onFormChange={updateServiceForm}
        onOpenCreate={openServiceCreateDrawer}
        onDeletePasswordChange={setDeleteServicePassword}
        onDeletePinChange={setDeleteServicePin}
        onSaveAndContinue={(e) => submitService(e, { saveAndContinue: true })}
        onSubmit={submitService}
        onToggleStatus={toggleServiceStatus}
        services={serviceCatalog}
      />
    )
  }

  function _renderProducts() {
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

  function _renderAppointments() {
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
          { label: 'Agendamentos hoje', value: appointmentsOverview.summary?.appointments_today ?? 0, tone: 'cash' },
          { label: 'Confirmados', value: appointmentGroups.active.length, tone: 'approved' },
          { label: 'Faltas', value: filteredAppointments.filter((appointment) => appointment.status === 'no_show').length, tone: 'danger' },
          { label: 'Ocupacao do dia', value: `${Math.max(0, Math.min(100, Math.round((appointmentGroups.today.length / Math.max(appointmentsOverview.summary?.available_collaborators || 1, 1)) * 25)))}%`, tone: 'pix' }
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
    const _todayList = appointmentsWithMeta.filter((appointment) => appointment.dateKey === todayDate)
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

    const _miniCalendar = {
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
            <Card className="barber-appointments-link-card" padding="md">
              <div className="barber-table-header">
                <div>
                  <h2>Link publico da agenda</h2>
                  <p>Compartilhe com seus clientes para receber agendamentos online.</p>
                </div>
                <Button onClick={copyBookingLink} variant="primary">Copiar link</Button>
              </div>
              <div className="barber-appointments-link-box">
                <strong>{publicBookingUrl || 'Configurando link...'}</strong>
              </div>
            </Card>

            <div className="barber-kpi-grid">
              {summaryCards.map((card) => (
                <Card key={card.label} padding="md">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </Card>
              ))}
            </div>
          </div>
        )}

        {isCollaborator && (
          <div className="barber-kpi-grid">
            {summaryCards.map((card) => (
              <Card key={card.label} padding="md">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </Card>
            ))}
          </div>
        )}

        <Card className="barber-appointments-workspace" padding="md">
          <div className="agenda-board-shell">
            <div className="agenda-board-main">
              <div className="barber-table-header agenda-board-header">
                <div>
                  <h2>{isCollaborator ? 'Minha agenda' : 'Agenda da barbearia'}</h2>
                  <p>{isCollaborator ? 'Veja seus horarios do dia e avance cada atendimento com poucos cliques.' : 'Gerencie a operacao do dia em uma grade clara, moderna e pronta para escalar.'}</p>
                </div>
                <div className="barber-inline-actions">
                  {!isCollaborator && (
                    <Button
                      onClick={() => openAppointmentComposer({
                        appointmentDate: agendaDate,
                        collaboratorId: collaboratorsForGrid[0]?.id || ''
                      })}
                      type="button"
                      variant="primary"
                    >
                      + Novo agendamento
                    </Button>
                  )}
                  {!isCollaborator && publicBookingUrl && (
                    <Button onClick={copyBookingLink} type="button" variant="ghost">
                      Copiar link publico
                    </Button>
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
                    <Button onClick={() => setAppointmentFilters({ ...defaultAppointmentFilters, date: todayDate })} type="button" variant="ghost">
                      Limpar filtros
                    </Button>
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
                        <Button
                          className="agenda-mobile-create"
                          onClick={() => openAppointmentComposer({
                            appointmentDate: agendaDate,
                            collaboratorId: collaboratorsForGrid[0]?.id || ''
                          })}
                          type="button"
                          variant="secondary"
                        >
                          + Novo agendamento
                        </Button>
                      )}
                      {appointmentsForSelectedDay.map((app) => (
                        <button className={`agenda-mobile-item status-${app.status || 'scheduled'}`} key={app.id} onClick={() => { setActiveAgendaAppointment(app); setAgendaModalOpen(true) }} type="button">
                          <strong>{app.customer_name}</strong>
                          <p>{app.service_name}</p>
                          <small>{app.slotLabel}</small>
                        </button>
                      ))}
                      {appointmentsForSelectedDay.length === 0 && (
                        <Empty description="Sem atendimentos para o dia selecionado." title="Dia sem reservas" />
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
                      <Empty description={isCollaborator ? 'Seu perfil ainda nao foi vinculado a um colaborador ativo para montar a agenda.' : 'Cadastre colaboradores ativos para distribuir a grade da agenda.'} title="Sem colaboradores" />
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
                  <Button onClick={() => {
                    const collab = window.prompt('ID do Colaborador (vazio para todos):')
                    const start = window.prompt('Inicio (AAAA-MM-DD HH:MM):')
                    const end = window.prompt('Fim (AAAA-MM-DD HH:MM):')
                    const reason = window.prompt('Motivo:')
                    if (start && end) saveScheduleBlock({ collaboratorId: collab, startsAt: start, endsAt: end, reason })
                  }} variant="primary">Novo bloqueio</Button>
                </div>
                <BarberTable columns={['Inicio', 'Fim', 'Motivo', 'Acoes']}>
                  {scheduleBlocks.map(block => (
                    <tr key={block.id}>
                      <td>{fullDate(block.starts_at)}</td>
                      <td>{fullDate(block.ends_at)}</td>
                      <td>{block.reason}</td>
                      <td><Button onClick={() => deleteScheduleBlock(block.id)} variant="danger">Remover</Button></td>
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
        </Card>

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

  function _renderSalesV2() {
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
              {recentSales.map((sale, idx) => (
                <div className="barber-sales-recent-card" key={sale?.id || `recent-${idx}`}>
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

  function handleBackToMenu() {
    setSettingsSection('menu')
  }

function renderActiveView() {
    if (loading) {
      return (
        <Card padding="md">
          <p>Carregando BarberGestor...</p>
        </Card>
      )
    }

    if (!isAdmin && currentView === 'dashboard' && user?.can_view_own_dashboard === false) {
      return (
        <Card padding="md">
          <Empty
            description="O admin da barbearia desativou o acesso ao seu dashboard proprio."
            title="Dashboard indisponivel"
          />
        </Card>
      )
    }

    if (!isAdmin && currentView === 'sales' && !user?.can_launch_sales) {
      return (
        <Card padding="md">
          <Empty
            description="O lancamento de vendas pelo celular precisa ser liberado pelo admin."
            title="Lancamento de vendas indisponivel"
          />
        </Card>
      )
    }

    if (!isAdmin && currentView === 'products') {
      return (
        <Card padding="md">
          <Empty
            description="O catalogo de produtos fica disponivel apenas para perfis gestores da barbearia."
            title="Produtos indisponiveis"
          />
        </Card>
      )
    }

    if (!isAdmin && currentView === 'fridge') {
      return (
        <Card padding="md">
          <Empty
            description="O modulo Itens da Geladeira fica disponivel apenas para perfis gestores da barbearia."
            title="Itens da Geladeira indisponivel"
          />
        </Card>
      )
    }

    if (!isAdmin && !isCollaborator && currentView === 'appointments') {
      return (
        <Card padding="md">
          <Empty
            description="A area interna de agendamentos fica disponivel apenas para a equipe de gestao."
            title="Agendamentos indisponiveis"
          />
        </Card>
      )
    }

    if (!isAdmin && currentView === 'customers') {
      return (
        <Card padding="md">
          <Empty
            description="A base de clientes online fica disponivel apenas para perfis gestores da barbearia."
            title="Clientes indisponiveis"
          />
        </Card>
      )
    }

    if (lockedViews[currentView]) {
      return (
        <Card padding="md">
          <Empty
            description={lockedViews[currentView]}
            title="Recurso bloqueado pelo plano"
          />
        </Card>
      )
    }

    if (!canManageCash && currentView === 'cashier') {
      return (
        <Card padding="md">
<Empty
            description="O caixa geral da barbearia fica visivel apenas para perfis autorizados."
            title="Caixa indisponivel"
          />
        </Card>
      )
    }

    if (!isAdmin && currentView === 'settlements') {
      return (
        <Card padding="md">
          <Empty
            description="Os acertos de colaboradores ficam disponiveis apenas para perfis gestores."
            title="Acertos indisponiveis"
          />
        </Card>
      )
    }

    if (!isAdmin && currentView === 'reports' && user?.can_view_own_reports === false) {
      return (
        <Card padding="md">
          <Empty
            description="O admin da barbearia desativou o acesso ao seu relatorio pessoal."
            title="Relatorio indisponivel"
          />
        </Card>
      )
    }

    switch (currentView) {
      case 'appointments':
        return (
          <AgendaInterna
            appointmentsOverview={appointmentsOverview}
            canManageCash={canManageCash}
            collaborators={collaborators}
            isCollaborator={isCollaborator}
            loadData={loadData}
            loggedInCollaboratorId={loggedInCollaboratorId}
            scheduleBlocks={scheduleBlocks}
            servicesById={servicesById}
            setError={setError}
            setSuccess={setSuccess}
            user={user}
            visibleServices={visibleServices}
            workingHours={workingHours}
          />
        )
      case 'appointments-history':
        return <AppointmentHistoryView />
      case 'appointments-crm':
        return <AgendaCrmView />
      case 'appointments-blocks':
        return <BookingAvailabilityView />
      case 'customers':
        return <CrmDashboard variant="list" />
      case 'customers-crm':
        return <CrmDashboard variant="crm" />
      case 'customers-birthdays':
        return <CrmDashboard variant="list" initialTab="aniversariantes" />
      case 'customers-inactive':
        return <CrmDashboard variant="list" initialTab="inativos" />
      case 'customers-vip':
        return <CrmDashboard variant="vip" />
      case 'services':
        return <Servicos
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
          onDuplicate={duplicateService}
          onEdit={editService}
          onFilterChange={updateServiceFilters}
          onFormChange={updateServiceForm}
          onOpenCreate={openServiceCreateDrawer}
          onDeletePasswordChange={setDeleteServicePassword}
          onDeletePinChange={setDeleteServicePin}
          onSaveAndContinue={(e) => submitService(e, { saveAndContinue: true })}
          onSubmit={submitService}
          onToggleStatus={toggleServiceStatus}
          services={serviceCatalog}
        />
      case 'services-top':
        return <ServicesAnalyticsView variant="top" />
      case 'services-favorites':
        return <ServicesAnalyticsView variant="favorites" />
      case 'services-commissions':
        return <ServicesAnalyticsView variant="commissions" />
      case 'products':
        return <Produtos
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
      case 'fridge':
        return <ItensGeladeira
          filters={fridgeFilters}
          form={fridgeForm}
          isEditing={Boolean(editingFridgeId)}
          isAdmin={isAdmin}
          money={money}
          onCancelEdit={resetFridgeEditor}
          onDelete={removeFridgeItem}
          onEdit={editFridgeItem}
          onFilterChange={updateFridgeFilters}
          onFormChange={updateFridgeForm}
          onSubmit={submitFridgeItem}
          onToggleStatus={toggleFridgeStatus}
          onToggleFavorite={toggleFridgeFavorite}
          items={fridgeCatalog}
        />
      case 'sales':
        return <SalesView
          useNewAtendimentoLayout={useNewAtendimentoLayout}
          services={services}
          products={products}
          fridgeItems={fridgeCatalog}
          collaborators={collaborators}
          sales={sales}
          salesSummary={salesSummary}
          collaboratorMetrics={collaboratorMetrics}
          user={user}
          saleForm={saleForm}
          saleFilters={salesFilters}
          salePaymentOptions={salePaymentOptions}
          saleWizardStep={saleWizardStep}
          saleItemsCount={saleItemsCount}
          saleEffectiveTotal={saleEffectiveTotal}
          saleEffectiveCommission={saleEffectiveCommission}
          saleEffectiveNet={saleEffectiveNet}
          saleChangeDue={saleChangeDue}
          isCashPayment={isCashPayment}
          submittingSale={submittingSale}
          servicePickerOpen={servicePickerOpen}
          saleCatalogItems={saleCatalogItems}
          saleCatalogSearch={saleCatalogSearch}
          saleCatalogFilter={saleCatalogFilter}
          canManageCash={canManageCash}
          isCollaborator={isCollaborator}
          isAdmin={isAdmin}
          loggedInCollaboratorId={loggedInCollaboratorId}
          loggedInCollaborator={loggedInCollaborator}
          activeSaleCollaborator={activeSaleCollaborator}
          setError={setError}
          setSaleWizardStep={setSaleWizardStep}
          updateSaleForm={updateSaleForm}
          updateSalesFilters={updateSalesFilters}
          createSale={createSale}
          loadData={loadData}
          resetSaleWizard={resetSaleWizard}
          openServicePicker={openServicePicker}
          closeServicePicker={closeServicePicker}
          removeSaleItem={removeSaleItem}
          startDeleteSale={startDeleteSale}
          setSaleCatalogSearch={setSaleCatalogSearch}
          setSaleCatalogFilter={setSaleCatalogFilter}
          appendSaleItemFromCatalog={appendSaleItemFromCatalog}
          setCrmDrawerCustomer={setCrmDrawerCustomer}
          updateSaleItemQuantity={updateSaleItemQuantity}
          onSubmit={async (saleData) => {
            setError('')
            setSuccess('')
            setSubmittingSale(true)
            try {
              await api.post('/barber/sales', saleData)
              setSuccess('Atendimento registrado com sucesso.')
              await loadData()
              if (activeView === 'sales') {
                await loadServiceCatalog(serviceFilters, { keepFullList: true, showError: false })
                await loadProductCatalog(productFilters, { keepFullList: true, showError: false })
              }
            } catch (err) {
              setError(err.response?.data?.error || 'Nao foi possivel registrar o atendimento')
            } finally {
              setSubmittingSale(false)
            }
          }}
          onRefresh={async () => {
            setError('')
            try {
              await loadData()
            } catch (_err) {
              setError('Nao foi possivel atualizar os dados')
            }
          }}
        />
      case 'cashier':
        return <CashierView
          sales={sales}
          dashboard={dashboard}
          setSaleForm={setSaleForm}
          buildEmptySaleForm={buildEmptySaleForm}
          loggedInCollaboratorId={loggedInCollaboratorId}
          setSaleModalOpen={setSaleModalOpen}
          loadData={loadData}
          paymentChartData={paymentChartData}
          fridgeReport={fridgeReport}
        />
      case 'settlements':
        return <SettlementsView
          isAdmin={isAdmin}
          collaborators={collaborators}
          settlementPreview={settlementPreview}
          settlements={settlements}
          advances={advances}
          settlementFilters={settlementFilters}
          settlementCollaboratorId={settlementCollaboratorId}
          updateSettlementFilters={updateSettlementFilters}
          loadSettlementPreview={loadSettlementPreview}
          createSettlement={createSettlement}
          approvalPassword={approvalPassword}
          approvalPin={approvalPin}
          setApprovalPassword={setApprovalPassword}
          setApprovalPin={setApprovalPin}
          advanceForm={advanceForm}
          createAdvance={createAdvance}
          updateAdvanceForm={updateAdvanceForm}
          updateAdvanceStatus={updateAdvanceStatus}
        />
      case 'team':
        return <TeamView
          isAdmin={isAdmin}
          collaborators={collaborators}
          visibleCollaboratorFinancialSummary={visibleCollaboratorFinancialSummary}
          currentCollaboratorFinancialSummary={currentCollaboratorFinancialSummary}
          collaboratorFinancialFilters={collaboratorFinancialFilters}
          updateCollaboratorFinancialFilters={updateCollaboratorFinancialFilters}
          openCollaboratorSummary={openCollaboratorSummary}
          editCollaborator={editCollaborator}
          setAdvanceForm={setAdvanceForm}
          navigateView={navigateView}
          openCollaboratorCreateModal={openCollaboratorCreateModal}
          toggleCollaboratorStatus={toggleCollaboratorStatus}
          removeCollaborator={removeCollaborator}
        />
      case 'reports':
        return <ReportsView
          isAdmin={isAdmin}
          personalReport={personalReport}
          settlements={settlements}
          money={money}
          fullDate={fullDate}
          shortDate={shortDate}
          services={services}
          visibleServices={visibleServices}
          products={products}
          lowStockProducts={lowStockProducts}
          fridgeItems={fridgeCatalog}
          fridgeReport={fridgeReport}
        />
      case 'settings':
        return <SettingsView
          isAdmin={isAdmin}
          settingsData={settingsData}
          settingsSection={settingsSection}
          settingsLoading={settingsLoading}
          brandingForm={brandingForm}
          brandingLoading={brandingLoading}
          brandingLogoPreview={brandingLogoPreview}
          logoPreview={logoPreview}
          user={user}
          fullDate={fullDate}
          emptyBarberSettings={emptyBarberSettings}
          setSettingsSection={setSettingsSection}
          loadBranding={loadBranding}
          handleBackToMenu={handleBackToMenu}
          handleBrandingSubmit={handleBrandingSubmit}
          handleBrandingFieldChange={handleBrandingFieldChange}
          handleBrandingLogoSelect={handleBrandingLogoSelect}
          handleBrandingLogoRemove={handleBrandingLogoRemove}
          brandingSaving={brandingSaving}
          handleCompanyProfileSubmit={handleCompanyProfileSubmit}
          handleCompanyFieldChange={handleCompanyFieldChange}
          companyProfileSaving={companyProfileSaving}
          handleAgendaSettingsSubmit={handleAgendaSettingsSubmit}
          handleAgendaSettingsChange={handleAgendaSettingsChange}
          settingsSaving={settingsSaving}
          pinRecoveryOpen={pinRecoveryOpen}
          pinRecoveryStep={pinRecoveryStep}
          pinRecoveryForm={pinRecoveryForm}
          pinRecoverySubmitting={pinRecoverySubmitting}
          handlePinRecoveryRequest={handlePinRecoveryRequest}
          handlePinResetSubmit={handlePinResetSubmit}
          handlePinRecoveryFieldChange={handlePinRecoveryFieldChange}
          resetPinRecoveryFlow={resetPinRecoveryFlow}
          openPinRecovery={openPinRecovery}
          integrationConfig={integrationConfig}
          integrationLoading={integrationLoading}
          integrationSaving={integrationSaving}
          integrationForm={integrationForm}
          integrationTestPhone={integrationTestPhone}
          integrationTestResult={integrationTestResult}
          integrationTestSending={integrationTestSending}
          handleIntegrationFormChange={handleIntegrationFormChange}
          handleIntegrationSubmit={handleIntegrationSubmit}
          handleIntegrationDelete={handleIntegrationDelete}
          handleIntegrationTest={handleIntegrationTest}
          setIntegrationTestPhone={setIntegrationTestPhone}
        />
      default:
        return <DashboardView
          isAdmin={isAdmin}
          isMobileViewport={isMobileViewport}
          advances={advances}
          collaboratorMetrics={collaboratorMetrics}
          collaboratorRecentAttendances={collaboratorRecentAttendances}
          user={user}
          setSaleForm={setSaleForm}
          buildEmptySaleForm={buildEmptySaleForm}
          loggedInCollaboratorId={loggedInCollaboratorId}
          setSaleModalOpen={setSaleModalOpen}
          dashboard={dashboard}
          collaborators={collaborators}
          todaySalesCount={todaySalesCount}
          ranking={ranking}
          topCollaborator={topCollaborator}
          salesChartData={salesChartData}
          visibleCollaboratorSummary={visibleCollaboratorSummary}
          appointmentsOverview={appointmentsOverview}
        />
    }
  }

  const sidebarUser = {
    name: user?.name || 'Usuário',
    role: isAdmin ? 'Administrador' : 'Colaborador',
    avatar: user?.avatar_url || user?.avatarUrl || null
  }

  const effectiveCompanyName = themeCompanyName || user?.company_name || user?.companyName || 'Barbearia'
  const effectiveLogoUrl = logoUrl || settingsData.company?.logo_url || null
  const effectiveWallpaperUrl = wallpaperUrl || settingsData.company?.wallpaper_url || null

  return (
    <>
      <BrandingEngine
        primaryColor={primaryColor || settingsData.company?.primary_color}
        logoUrl={effectiveLogoUrl}
        wallpaperUrl={effectiveWallpaperUrl}
      />
      <WatermarkBackground logoUrl={effectiveLogoUrl} companyName={effectiveCompanyName} />
      <Shell
        sidebarProps={{
          activeItem: currentView,
          onNavigate: navigateView,
          companyName: effectiveCompanyName,
          logoUrl: effectiveLogoUrl,
          primaryColor: primaryColor || settingsData.company?.primary_color || null,
          planName: planLabel,
          user: sidebarUser
        }}
        topbarProps={{
          title: currentView === 'dashboard' ? effectiveCompanyName : meta.label,
          subtitle: currentView === 'dashboard' ? 'Visão geral do dia' : meta.title,
          user: sidebarUser,
          onMenuClick: () => setSidebarOpen((prev) => !prev),
          onSearchClick: () => {},
          onLogout: handleLogout,
          onNavigate: navigateView,
          notifications: appointmentsOverview.summary?.appointments_today || 0
        }}
      >
        <section className="barber-page" data-module={currentView}>
          <header className="barber-page-hero">
            <div>
              <span className="barber-overline">BarberGestor {currentView === 'dashboard' ? '• Visão geral' : `• ${meta.label}`}</span>
              <h1>{currentView === 'dashboard' ? (themeCompanyName || user?.company_name || 'Barbearia') : meta.label}</h1>
              <p>{meta.description}</p>
              <div className="barber-page-hero-meta">
                <div className="barber-plan-summary">
                  <span>Plano</span>
                  <strong>{planLabel}</strong>
                </div>
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

      <TeamFormModal
        collaboratorModalOpen={collaboratorModalOpen}
        closeCollaboratorModal={closeCollaboratorModal}
        isEditingCollaborator={isEditingCollaborator}
        collaboratorForm={collaboratorForm}
        updateCollaboratorForm={updateCollaboratorForm}
        updateCollaboratorAvatar={updateCollaboratorAvatar}
        removeCollaboratorAvatarPreview={removeCollaboratorAvatarPreview}
        createCollaborator={createCollaborator}
        canUseExtraPermissionsFeature={canUseExtraPermissionsFeature}
        getLockedFeatureMessage={getLockedFeatureMessage}
        handleLockedFeature={handleLockedFeature}
        isAdmin={isAdmin}
      />

      <CollaboratorSummaryModal
        collaboratorSummaryId={collaboratorSummaryId}
        closeCollaboratorSummary={closeCollaboratorSummary}
        collaboratorSummaryTarget={collaboratorSummaryTarget}
        collaboratorSummarySales={collaboratorSummarySales}
        collaboratorSummaryAdvances={collaboratorSummaryAdvances}
      />

      <SaleSlideover
        open={saleModalOpen}
        onClose={closeSaleModal}
        services={visibleServices}
        products={visibleProducts}
        collaborators={collaborators}
        cashSession={dashboard.cashSession}
        loggedInCollaboratorId={loggedInCollaboratorId}
        canManageCash={canManageCash}
        isCollaborator={isCollaborator}
        user={user}
        onSubmit={handleSlideoverSubmit}
      />

      <DeleteSaleModal
        deleteSaleId={deleteSaleId}
        deleteSaleTarget={deleteSaleTarget}
        deleteReason={deleteReason}
        setDeleteReason={setDeleteReason}
        deletePin={deletePin}
        setDeletePin={setDeletePin}
        deleteSale={deleteSale}
        setDeleteSaleId={setDeleteSaleId}
      />

      <BottomNav
        activeItem={currentView}
        onNavigate={navigateView}
        show={!isMobileViewport || currentView !== 'settings'}
      />

      <QuickActionsFAB
        mainAction={() => {
          if (isAdmin) {
            setSaleModalOpen(true)
          } else {
            setSaleForm(buildEmptySaleForm(loggedInCollaboratorId))
            setSaleModalOpen(true)
          }
        }}
        mainActionLabel="Novo atendimento"
        show={!isMobileViewport || currentView !== 'settings'}
      />

      <CustomerSidePanel
        customer={crmDrawerCustomer}
        open={!!crmDrawerCustomer}
        onClose={() => setCrmDrawerCustomer(null)}
      />
    </>
  )
}

export default Barber
