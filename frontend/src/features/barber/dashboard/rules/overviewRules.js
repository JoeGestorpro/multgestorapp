export function calcOccupancy(booked, total) {
  if (!total || total <= 0) return 0
  return Math.round((booked / total) * 100)
}

export function calcGoalProgress(goal, realized) {
  if (!goal || goal <= 0) return 0
  return Math.min(100, Math.round((realized / goal) * 100))
}

export function calcAverageTicket(revenue, count) {
  if (!count || count <= 0) return 0
  return revenue / count
}

export function calcExpectedCommission(revenue, rate = 0.3) {
  if (!revenue || revenue <= 0) return 0
  return revenue * rate
}

export function getOccupancyLabel(rate) {
  if (rate >= 80) return 'Alta'
  if (rate >= 50) return 'Média'
  return 'Baixa'
}

export function getOccupancyVariant(rate) {
  if (rate >= 80) return 'success'
  if (rate >= 50) return 'warning'
  return 'danger'
}

export function getGoalStatus(progress) {
  if (progress >= 100) return 'achieved'
  if (progress >= 75) return 'ontrack'
  if (progress >= 40) return 'behind'
  return 'critical'
}

export function getGoalStatusLabel(status) {
  return { achieved: 'Meta atingida!', ontrack: 'No caminho certo', behind: 'Precisa acelerar', critical: 'Atenção urgente' }[status] || ''
}

export function getGoalStatusVariant(status) {
  return { achieved: 'success', ontrack: 'info', behind: 'warning', critical: 'danger' }[status] || 'neutral'
}

export function getAlertPriorityOrder(priority) {
  return { high: 0, medium: 1, low: 2 }[priority] ?? 3
}

export function sortAlertsByPriority(alerts) {
  return [...alerts].sort((a, b) => getAlertPriorityOrder(a.priority) - getAlertPriorityOrder(b.priority))
}

export function getAlertPriorityVariant(priority) {
  return { high: 'danger', medium: 'warning', low: 'info' }[priority] ?? 'neutral'
}

export function getAlertPriorityLabel(priority) {
  return { high: 'Alta', medium: 'Média', low: 'Baixa' }[priority] ?? ''
}

export function getAppointmentStatusLabel(status) {
  return {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    arrived: 'Chegou',
    in_progress: 'Em andamento',
    completed: 'Concluído',
    canceled: 'Cancelado',
    no_show: 'Falta'
  }[status] || status
}

export function getAppointmentStatusVariant(status) {
  return {
    scheduled: 'info',
    confirmed: 'accent',
    arrived: 'warning',
    in_progress: 'success',
    completed: 'neutral',
    canceled: 'danger',
    no_show: 'danger'
  }[status] || 'neutral'
}

export function buildWhatsAppUrl(phone, clientName) {
  const cleaned = String(phone || '').replace(/\D/g, '')
  const msg = encodeURIComponent(`Olá ${clientName}, sentimos sua falta! Que tal agendar um horário?`)
  return `https://wa.me/55${cleaned}?text=${msg}`
}
