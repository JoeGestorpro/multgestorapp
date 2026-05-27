export const emptyService = {
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

export const emptyCollaborator = {
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

export const emptyProduct = {
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

export const emptySale = {
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

export const saleWizardSteps = [
  { key: 'start', label: 'Iniciar atendimento' },
  { key: 'client', label: 'Cliente' },
  { key: 'items', label: 'Servicos/produtos' },
  { key: 'payment', label: 'Pagamento' },
  { key: 'notes', label: 'Observacoes' },
  { key: 'review', label: 'Revisao' }
]

export const emptyAdvance = {
  collaboratorId: '',
  amount: '',
  reason: ''
}

export const defaultSettlementFilters = {
  collaboratorId: '',
  startDate: '',
  endDate: ''
}

export const emptyDashboard = {
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

export const emptyAppointmentsOverview = {
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

export const defaultAppointmentFilters = {
  date: '',
  collaboratorId: 'all',
  status: 'all'
}

export const agendaWeekdayLabels = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']

export function buildEmptyAppointmentForm(overrides = {}) {
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

export const emptyPersonalReport = {
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

export const emptyBarberSettings = {
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

export const defaultServiceFilters = {
  search: '',
  status: 'all'
}

export const defaultProductFilters = {
  search: '',
  status: 'all',
  category: ''
}

export const defaultCollaboratorFinancialFilters = {
  period: 'month',
  startDate: '',
  endDate: ''
}

export const defaultSalesFilters = {
  collaboratorId: '',
  period: 'today',
  startDate: '',
  endDate: ''
}

export const emptySalesSummary = {
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

export function buildEmptySaleForm(collaboratorId = '') {
  return {
    ...emptySale,
    collaboratorId: collaboratorId || ''
  }
}

export function normalizeServiceForm(service) {
  return {
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price || '',
    icon: service?.icon || 'scissors',
    serviceType: service?.service_type || 'service',
    commissionType: service?.commission_type || 'percentage',
    commissionValue: service?.commission_value || '',
    estimatedTimeMinutes: service?.estimated_time_minutes || '',
    isActive: service?.is_active ?? true
  }
}

export function normalizeProductForm(product) {
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

export function normalizeAvatarFile(file) {
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
