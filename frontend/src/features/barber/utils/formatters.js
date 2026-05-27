export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function money(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0))
}

export function formatServiceName(name) {
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

function parseLocalDateString(value) {
  const match = String(value || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    return null
  }

  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}

export function shortDate(value) {
  if (!value) {
    return '-'
  }

  const localDate = typeof value === 'string' ? parseLocalDateString(value) : null

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  }).format(localDate || new Date(value))
}

export function toLocalDateKey(value) {
  if (!value) {
    return ''
  }

  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function addLocalDateDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

export function fullDate(value) {
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

export function sameDay(dateA, dateB) {
  const first = new Date(dateA)
  const second = new Date(dateB)

  return (
    first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate()
  )
}

export function paymentTone(method) {
  return {
    approved: 'approved',
    pending: 'pending',
    rejected: 'rejected',
    liquidated: 'liquidated'
  }[method] || 'neutral'
}

export function paymentLabel(method) {
  return {
    approved: 'Aprovado',
    pending: 'Pendente',
    rejected: 'Rejeitado',
    liquidated: 'Liquidado'
  }[method] || method || 'Nao informado'
}

export function advanceTone(status) {
  return {
    approved: 'approved',
    pending: 'pending',
    rejected: 'rejected',
    liquidated: 'liquidated'
  }[status] || 'neutral'
}

export function advanceLabel(status) {
  return {
    approved: 'Aprovado',
    pending: 'Pendente',
    rejected: 'Rejeitado',
    liquidated: 'Liquidado'
  }[status] || status || 'Nao informado'
}

export function appointmentTone(status) {
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

export function appointmentLabel(status) {
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

export function collaboratorDisplayName(collaborator) {
  return collaborator?.name || collaborator?.collaborator_name || collaborator?.nickname || 'Colaborador'
}

export function formatAppointmentSlot(appointment) {
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

export function formatAppointmentRange(appointment) {
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

export function buildAppointmentStartsAt(date, time) {
  const normalizedDate = String(date || '').trim()
  const normalizedTime = String(time || '').trim()

  if (!normalizedDate || !normalizedTime) {
    return ''
  }

  const parsed = new Date(`${normalizedDate}T${normalizedTime}:00`)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}

export function getAppointmentDateKey(appointment) {
  if (!appointment?.starts_at) {
    return ''
  }

  const parsed = new Date(appointment.starts_at)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toISOString().slice(0, 10)
}
