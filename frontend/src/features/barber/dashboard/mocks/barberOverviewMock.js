const pad = (n) => String(n).padStart(2, '0')
const timeStr = (h, m) => `${pad(h)}:${pad(m)}`

const today = new Date()
const nextHour = today.getHours() + 1

export const mockNextAppointment = {
  id: 'apt-001',
  time: timeStr(nextHour, 30),
  clientName: 'Rafael Mendes',
  serviceName: 'Corte + Barba',
  professionalName: 'Bruno Silva',
  value: 65.0,
  status: 'confirmed',
  startsAt: new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    nextHour,
    30
  ).toISOString()
}

export const mockTodayAgenda = {
  totalSlots: 16,
  bookedSlots: 11,
  completedSlots: 6,
  canceledSlots: 2,
  appointments: [
    { id: 'a1', time: timeStr(8, 0), clientName: 'João Silva', serviceName: 'Corte', professional: 'Bruno', status: 'completed' },
    { id: 'a2', time: timeStr(9, 0), clientName: 'Pedro Alves', serviceName: 'Barba', professional: 'Lucas', status: 'completed' },
    { id: 'a3', time: timeStr(10, 0), clientName: 'Carlos Lima', serviceName: 'Corte Degradê', professional: 'Bruno', status: 'completed' },
    { id: 'a4', time: timeStr(11, 0), clientName: 'Marcos Rocha', serviceName: 'Corte + Barba', professional: 'Diego', status: 'completed' },
    { id: 'a5', time: timeStr(12, 30), clientName: 'Paulo Souza', serviceName: 'Pigmentação', professional: 'Lucas', status: 'completed' },
    { id: 'a6', time: timeStr(13, 30), clientName: 'André Lima', serviceName: 'Barba', professional: 'Bruno', status: 'completed' },
    { id: 'a7', time: timeStr(14, 30), clientName: 'Rafael Mendes', serviceName: 'Corte + Barba', professional: 'Bruno', status: 'confirmed' },
    { id: 'a8', time: timeStr(15, 0), clientName: 'Diego Costa', serviceName: 'Barba', professional: 'Lucas', status: 'scheduled' },
    { id: 'a9', time: timeStr(16, 30), clientName: 'Marcelo Neto', serviceName: 'Corte', professional: 'Diego', status: 'scheduled' },
    { id: 'a10', time: timeStr(17, 30), clientName: 'Thiago Alves', serviceName: 'Corte + Barba', professional: 'Bruno', status: 'scheduled' },
    { id: 'a11', time: timeStr(18, 0), clientName: 'Rodrigo Melo', serviceName: 'Barba', professional: 'Lucas', status: 'scheduled' }
  ],
  nextFreeSlots: ['13:00', '19:00', '19:30']
}

export const mockAlerts = [
  {
    id: 'al1',
    title: 'Estoque crítico',
    description: 'Pomada Modeladora com apenas 2 unidades — reposição urgente',
    priority: 'high',
    type: 'stock'
  },
  {
    id: 'al2',
    title: 'Produto esgotado',
    description: 'Cerveja Heineken zerada — repor antes do rush da tarde',
    priority: 'high',
    type: 'stock'
  },
  {
    id: 'al3',
    title: 'Cliente VIP sem retorno',
    description: 'Carlos Henrique há 45 dias sem visita',
    priority: 'medium',
    type: 'crm'
  },
  {
    id: 'al4',
    title: 'Cancelamentos acima do normal',
    description: '2 cancelamentos registrados — verifique o padrão',
    priority: 'medium',
    type: 'agenda'
  },
  {
    id: 'al5',
    title: 'Horário livre esta tarde',
    description: '3 slots vagos entre 13h e 16h — considere divulgar',
    priority: 'low',
    type: 'agenda'
  }
]

export const mockKPIs = {
  revenue: 840.0,
  appointments: 9,
  averageTicket: 93.33,
  occupancy: 56,
  clientsServed: 9,
  expectedCommission: 252.0
}

export const mockDailyGoal = {
  goal: 1500.0,
  realized: 840.0
}

export const mockTeamPerformance = [
  { id: 't1', name: 'Bruno Silva', revenue: 420, appointments: 5, commission: 126 },
  { id: 't2', name: 'Lucas Ferreira', revenue: 280, appointments: 3, commission: 84 },
  { id: 't3', name: 'Diego Costa', revenue: 140, appointments: 1, commission: 42 }
]

export const mockTopServices = [
  { id: 's1', name: 'Corte + Barba', quantity: 12, revenue: 780.0 },
  { id: 's2', name: 'Corte Degradê', quantity: 9, revenue: 450.0 },
  { id: 's3', name: 'Barba Completa', quantity: 7, revenue: 245.0 },
  { id: 's4', name: 'Pigmentação', quantity: 3, revenue: 360.0 }
]

export const mockRecoveryClients = [
  { id: 'rc1', name: 'Carlos Henrique', daysSince: 45, phone: '11999990001', isVip: true },
  { id: 'rc2', name: 'Marcos Oliveira', daysSince: 38, phone: '11999990002', isVip: false },
  { id: 'rc3', name: 'Felipe Santos', daysSince: 32, phone: '11999990003', isVip: false },
  { id: 'rc4', name: 'André Moraes', daysSince: 28, phone: '11999990004', isVip: true }
]

export const mockProducts = [
  { id: 'p1', name: 'Pomada Modeladora', quantity: 2, revenue: 79.80, isLow: true, isOut: false },
  { id: 'p2', name: 'Cerveja Heineken', quantity: 0, revenue: 0, isLow: true, isOut: true },
  { id: 'p3', name: 'Refrigerante Lata', quantity: 12, revenue: 36.00, isLow: false, isOut: false },
  { id: 'p4', name: 'Red Bull', quantity: 4, revenue: 60.00, isLow: false, isOut: false }
]

const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const revenues = [840, 620, 1100, 760, 1380, 1650, 840]

export const mockRevenueChart = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today)
  d.setDate(today.getDate() - (6 - i))
  return {
    label: dayLabels[d.getDay()],
    total: revenues[i],
    date: d.toISOString().slice(0, 10)
  }
})

export const mockPayments = {
  pix: { label: 'PIX', amount: 420.0, count: 5 },
  card: { label: 'Cartão Débito', amount: 280.0, count: 3 },
  cash: { label: 'Dinheiro', amount: 140.0, count: 1 },
  credit: { label: 'Cartão Crédito', amount: 0, count: 0 }
}
