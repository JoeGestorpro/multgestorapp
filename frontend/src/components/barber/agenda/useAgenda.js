import { useMemo, useState } from 'react'
import api from '../../../services/api'

const defaultAppointmentFilters = {
  date: '',
  collaboratorId: 'all',
  status: 'all'
}

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

function getAppointmentDateKey(appointment) {
  return (appointment.starts_at || appointment.appointment_date || '').slice(0, 10)
}

function formatAppointmentRange(appointment) {
  const start = appointment.starts_at || appointment.appointment_date
  const end = appointment.ends_at || appointment.appointment_end_time
  if (!start) return '--:--'
  const startTime = start.length >= 16 ? start.slice(11, 16) : start.slice(0, 5)
  const endTime = end ? (end.length >= 16 ? end.slice(11, 16) : end.slice(0, 5)) : ''
  return endTime ? `${startTime} - ${endTime}` : startTime
}

function buildAppointmentStartsAt(date, time) {
  if (!date || !time) return ''
  return `${date}T${time}:00`
}

export default function useAgenda({
  appointmentsOverview = { appointments: [], summary: {} },
  scheduleBlocks = [],
  workingHours = [],
  user: _user,
  isCollaborator,
  loggedInCollaboratorId,
  canManageCash,
  servicesById,
  loadData,
  setError,
  setSuccess
}) {
  const [agendaMode, setAgendaMode] = useState('week')
  const [agendaMonthCursor, setAgendaMonthCursor] = useState(() => new Date().toISOString().slice(0, 10))
  const [activeAgendaAppointment, setActiveAgendaAppointment] = useState(null)
  const [agendaModalOpen, setAgendaModalOpen] = useState(false)
  const [appointmentFilters, setAppointmentFilters] = useState(defaultAppointmentFilters)
  const [appointmentComposerOpen, setAppointmentComposerOpen] = useState(false)
  const [submittingAppointment, setSubmittingAppointment] = useState(false)
  const [appointmentForm, setAppointmentForm] = useState(() => buildEmptyAppointmentForm())
  const [showAgendaFilters, setShowAgendaFilters] = useState(true)

  const filteredAppointments = useMemo(() => {
    const appointments = appointmentsOverview.appointments || []
    return appointments.filter((appointment) => {
      if (appointmentFilters.date && getAppointmentDateKey(appointment) !== appointmentFilters.date) return false
      if (appointmentFilters.status !== 'all' && appointment.status !== appointmentFilters.status) return false
      if (!isCollaborator && appointmentFilters.collaboratorId !== 'all' && appointment.collaborator_id !== appointmentFilters.collaboratorId) return false
      return true
    })
  }, [appointmentFilters, appointmentsOverview.appointments, isCollaborator])

  const appointmentGroups = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return {
      today: filteredAppointments.filter((a) => getAppointmentDateKey(a) === today && a.status !== 'canceled'),
      upcoming: filteredAppointments.filter((a) => getAppointmentDateKey(a) >= today && ['scheduled', 'confirmed', 'arrived', 'in_progress'].includes(a.status)),
      active: filteredAppointments.filter((a) => ['confirmed', 'arrived', 'in_progress'].includes(a.status)),
      completed: filteredAppointments.filter((a) => a.status === 'completed'),
      canceled: filteredAppointments.filter((a) => a.status === 'canceled')
    }
  }, [filteredAppointments])

  const appointmentsWithMeta = useMemo(() => {
    return filteredAppointments.map((appointment) => ({
      ...appointment,
      dateKey: getAppointmentDateKey(appointment),
      timeLabel: appointment.starts_at
        ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(appointment.starts_at))
        : '--:--',
      timeCompactLabel: appointment.starts_at
        ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(appointment.starts_at))
        : '--:--',
      slotLabel: formatAppointmentRange(appointment),
      appointment_date_label: appointment.starts_at
        ? new Date(appointment.starts_at).toLocaleDateString('pt-BR')
        : '-',
      duration_label: appointment.ends_at && appointment.starts_at
        ? `${Math.max(0, Math.round((new Date(appointment.ends_at) - new Date(appointment.starts_at)) / 60000))} min`
        : '-',
      service_price_label: servicesById?.get?.(appointment.service_id)?.price
        ? `R$ ${Number(servicesById.get(appointment.service_id).price).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
        : appointment.service_price
          ? `R$ ${Number(appointment.service_price).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
          : '-'
    }))
  }, [filteredAppointments, servicesById])

  function updateAppointmentForm(event) {
    const { name, value } = event.target
    setAppointmentForm((current) => ({ ...current, [name]: value }))
  }

  function closeAppointmentComposer() {
    setAppointmentComposerOpen(false)
    setAppointmentForm(buildEmptyAppointmentForm({
      appointmentDate: appointmentFilters.date || new Date().toISOString().slice(0, 10),
      collaboratorId: isCollaborator ? loggedInCollaboratorId : ''
    }))
  }

  function openAppointmentComposer(seed = {}) {
    if (!canManageCash) return
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
      setSuccess('Agendamento criado')
      closeAppointmentComposer()
      await loadData({ clearMessage: false })
    } catch (err) {
      setError(err.response?.data?.error || 'Nao foi possivel criar o agendamento')
    } finally {
      setSubmittingAppointment(false)
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
      await api.patch(`/barber/appointments/${appointmentId}/reschedule`, { startsAt })
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

  return {
    appointmentsOverview,
    scheduleBlocks,
    workingHours,
    agendaMode, setAgendaMode,
    agendaMonthCursor, setAgendaMonthCursor,
    activeAgendaAppointment, setActiveAgendaAppointment,
    agendaModalOpen, setAgendaModalOpen,
    appointmentFilters, setAppointmentFilters,
    appointmentComposerOpen,
    submittingAppointment,
    appointmentForm,
    showAgendaFilters, setShowAgendaFilters,
    filteredAppointments,
    appointmentGroups,
    appointmentsWithMeta,
    updateAppointmentForm,
    closeAppointmentComposer,
    openAppointmentComposer,
    submitAppointment,
    updateAppointmentStatus,
    cancelAppointment,
    rescheduleAppointment,
    deleteAppointment,
    saveScheduleBlock,
    deleteScheduleBlock,
    saveWorkingHours
  }
}
