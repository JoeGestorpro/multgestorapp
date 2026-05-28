import { money, toLocalDateKey, shortDate, addLocalDateDays, formatServiceName, paymentTone, paymentLabel, advanceTone, advanceLabel, appointmentTone, appointmentLabel, collaboratorDisplayName, formatAppointmentSlot, formatAppointmentRange, buildAppointmentStartsAt, getAppointmentDateKey } from './formatters'

export { money, toLocalDateKey, shortDate, addLocalDateDays, formatServiceName, paymentTone, paymentLabel, advanceTone, advanceLabel, appointmentTone, appointmentLabel, collaboratorDisplayName, formatAppointmentSlot, formatAppointmentRange, buildAppointmentStartsAt, getAppointmentDateKey }

export function buildSalesChartData(sales, dailyRevenue = []) {
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

export function buildCollaboratorFinancialParams(filters) {
  const params = {
    period: filters.period || 'month'
  }

  if (params.period === 'custom' && filters.startDate && filters.endDate) {
    params.startDate = filters.startDate
    params.endDate = filters.endDate
  }

  return params
}

export function buildSalesParams(filters) {
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

export function getInitialBarberView(pathname) {
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

  if (normalized.startsWith('/barber/vendas')) return 'sales'

  if (normalized.startsWith('/barber/caixa')) return 'cashier'

  if (normalized.startsWith('/barber/acertos')) return 'settlements'

  if (normalized.startsWith('/barber/colaboradores')) return 'team'

  if (normalized.startsWith('/barber/relatorios')) return 'reports'

  if (normalized.startsWith('/barber/configuracoes')) return 'settings'

  return 'dashboard'
}

export function getBarberViewPath(view) {
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
    sales: '/barber/vendas',
    cashier: '/barber/caixa',
    settlements: '/barber/acertos',
    team: '/barber/colaboradores',
    reports: '/barber/relatorios',
    settings: '/barber/configuracoes'
  }[view] || '/barber/dashboard'
}
