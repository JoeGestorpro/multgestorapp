import { useCallback, useMemo, useState } from 'react'
import api from '../../services/api'
import useAgenda from '../barber/agenda/useAgenda'
import AppointmentFormModal from './AppointmentFormModal'
import { CustomerSidePanel } from '../../components/premium'
import './agenda.css'

function parseMinutes(time) {
  if (!time) return null
  const [h, m] = String(time).slice(0, 5).split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function getDateKey(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

const SLOT_START = 7 * 60
const SLOT_END = 22 * 60
const SLOT_STEP = 30
const TOTAL_SLOTS = (SLOT_END - SLOT_START) / SLOT_STEP

export default function AgendaInterna({
  user, isCollaborator, loggedInCollaboratorId, canManageCash,
  collaborators, visibleServices, servicesById,
  appointmentsOverview, scheduleBlocks, workingHours,
  loadData, setError, setSuccess
}) {
  const agenda = useAgenda({
    appointmentsOverview, scheduleBlocks, workingHours,
    user, isCollaborator, loggedInCollaboratorId, canManageCash,
    servicesById, loadData, setError, setSuccess
  })

  const [agendaTab, setAgendaTab] = useState('agenda')
  const [periodFilter, setPeriodFilter] = useState('today')
  const [crmDrawerCustomer, setCrmDrawerCustomer] = useState(null)

  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const selectedDate = agenda.appointmentFilters.date || todayDate
  const isMobile = window.innerWidth <= 768

  const safeCollaborators = useMemo(() => {
    if (isCollaborator) {
      const found = (collaborators || []).find(c => c.id === loggedInCollaboratorId)
      return found ? [found] : []
    }
    return (collaborators || []).filter(c => c.is_active && !c.is_deleted)
  }, [collaborators, isCollaborator, loggedInCollaboratorId])

  const collaboratorIds = useMemo(() => {
    if (agenda.appointmentFilters.collaboratorId === 'all') {
      return safeCollaborators.map(c => c.id)
    }
    return [agenda.appointmentFilters.collaboratorId]
  }, [agenda.appointmentFilters.collaboratorId, safeCollaborators])

  const filteredCollaborators = useMemo(() =>
    safeCollaborators.filter(c => collaboratorIds.includes(c.id)),
    [safeCollaborators, collaboratorIds]
  )

  const dayAppointments = useMemo(() =>
    (agenda.appointmentsWithMeta || [])
      .filter(a => getDateKey(a.starts_at) === selectedDate)
      .sort((a, b) => String(a.starts_at || '').localeCompare(String(b.starts_at || ''))),
    [agenda.appointmentsWithMeta, selectedDate]
  )

  const blockedSlots = useMemo(() =>
    (scheduleBlocks || []).flatMap(block => {
      const start = new Date(block.starts_at)
      const end = new Date(block.ends_at)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []
      const dayStart = new Date(`${selectedDate}T00:00:00`)
      const dayEnd = new Date(`${selectedDate}T23:59:59`)
      if (start >= dayEnd || end <= dayStart) return []
      return filteredCollaborators.map(c => ({
        id: `b-${block.id}-${c.id}`,
        collaborator_id: c.id,
        collaborator_name: c.nickname || c.name,
        customer_name: 'Bloqueado',
        service_name: block.reason || 'Indisponivel',
        status: 'blocked',
        starts_at: block.starts_at,
        ends_at: block.ends_at
      }))
    }),
    [scheduleBlocks, selectedDate, filteredCollaborators]
  )

  const allSlots = useMemo(() => {
    const blocked = blockedSlots
    const occupied = dayAppointments
    const all = [...occupied, ...blocked]

    const slots = []
    for (let m = SLOT_START; m < SLOT_END; m += SLOT_STEP) {
      const time = formatTime(m)
      slots.push({
        minutes: m,
        time,
        label: time,
        isHalfHour: m % 60 !== 0
      })
    }

    const grid = []
    for (const collaborator of filteredCollaborators) {
      const colSlots = slots.map(slot => {
        const apps = all.filter(a => {
          if (a.collaborator_id !== collaborator.id) return false
          const startMin = parseMinutes(a.starts_at?.slice(11, 16))
          const endMin = parseMinutes(a.ends_at?.slice(11, 16))
          if (startMin == null) return false
          const eMin = endMin ?? startMin + 30
          return slot.minutes >= startMin && slot.minutes < eMin
        })
        return { ...slot, appointments: apps }
      })
      grid.push({ collaborator, slots: colSlots })
    }
    return grid
  }, [filteredCollaborators, dayAppointments, blockedSlots])

  const summary = useMemo(() => {
    const total = dayAppointments.length
    const confirmed = dayAppointments.filter(a => ['confirmed', 'arrived', 'in_progress'].includes(a.status)).length
    const pending = dayAppointments.filter(a => a.status === 'scheduled').length
    const cancelled = dayAppointments.filter(a => a.status === 'canceled').length
    const revenue = dayAppointments
      .filter(a => a.status !== 'canceled')
      .reduce((acc, a) => {
        const svc = servicesById?.get?.(a.service_id)
        return acc + Number(svc?.price || a.service_price || 0)
      }, 0)
    return { total, confirmed, pending, cancelled, revenue }
  }, [dayAppointments, servicesById])

  const prevDay = useCallback(() => {
    const d = new Date(`${selectedDate}T12:00:00`)
    d.setDate(d.getDate() - 1)
    agenda.setAppointmentFilters(f => ({ ...f, date: d.toISOString().slice(0, 10) }))
  }, [selectedDate, agenda])

  const nextDay = useCallback(() => {
    const d = new Date(`${selectedDate}T12:00:00`)
    d.setDate(d.getDate() + 1)
    agenda.setAppointmentFilters(f => ({ ...f, date: d.toISOString().slice(0, 10) }))
  }, [selectedDate, agenda])

  const goToday = useCallback(() => {
    agenda.setAppointmentFilters(f => ({ ...f, date: todayDate }))
  }, [agenda, todayDate])

  const handlePeriodFilter = useCallback((period) => {
    setPeriodFilter(period)
    if (period === 'today') goToday()
    else if (period === 'week') {
      const d = new Date(`${selectedDate}T12:00:00`)
      d.setDate(d.getDate() - d.getDay() + 1)
      agenda.setAppointmentFilters(f => ({ ...f, date: d.toISOString().slice(0, 10) }))
    }
  }, [goToday, selectedDate, agenda])

  const openNewAppointment = useCallback((seed = {}) => {
    if (!canManageCash) return
    agenda.openAppointmentComposer({
      appointmentDate: selectedDate,
      collaboratorId: filteredCollaborators[0]?.id || '',
      ...seed
    })
  }, [agenda, canManageCash, selectedDate, filteredCollaborators])

  const selectedDateLabel = useMemo(() =>
    new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(`${selectedDate}T12:00:00`)),
    [selectedDate]
  )

  const selectedDateShort = useMemo(() =>
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${selectedDate}T12:00:00`)),
    [selectedDate]
  )

  return (
    <section className="ag-interna">
      {/* HEADER */}
      <div className="ag-header">
        <div className="ag-header-left">
          <div className="ag-header-title-group">
            <h2 className="ag-title">Agenda Interna</h2>
            <span className="ag-header-badge">{selectedDateShort}</span>
          </div>
          <p className="ag-subtitle">Gerencie os horarios da barbearia em tempo real</p>
        </div>
        <div className="ag-header-right">
          <div className="ag-period-tabs">
            <button className={`ag-period-tab ${periodFilter === 'today' ? 'active' : ''}`} onClick={() => handlePeriodFilter('today')}>Hoje</button>
            <button className={`ag-period-tab ${periodFilter === 'week' ? 'active' : ''}`} onClick={() => handlePeriodFilter('week')}>Semana</button>
            <button className={`ag-period-tab ${periodFilter === 'month' ? 'active' : ''}`} onClick={() => handlePeriodFilter('month')}>Mes</button>
          </div>
          <button className="ag-btn-primary" onClick={() => openNewAppointment()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo agendamento
          </button>
        </div>
      </div>

      {/* RESUMO CARDS */}
      <div className="ag-resumo">
        <div className="ag-resumo-card ag-resumo-total">
          <div className="ag-resumo-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <div className="ag-resumo-info">
            <span className="ag-resumo-label">Agendamentos hoje</span>
            <strong className="ag-resumo-value">{summary.total}</strong>
          </div>
          <div className="ag-resumo-badge ag-resumo-badge-total">{summary.total}</div>
        </div>
        <div className="ag-resumo-card ag-resumo-confirmed">
          <div className="ag-resumo-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
          <div className="ag-resumo-info">
            <span className="ag-resumo-label">Confirmados</span>
            <strong className="ag-resumo-value">{summary.confirmed}</strong>
          </div>
          <div className="ag-resumo-badge ag-resumo-badge-confirmed">{summary.confirmed}</div>
        </div>
        <div className="ag-resumo-card ag-resumo-pending">
          <div className="ag-resumo-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div className="ag-resumo-info">
            <span className="ag-resumo-label">Pendentes</span>
            <strong className="ag-resumo-value">{summary.pending}</strong>
          </div>
          <div className="ag-resumo-badge ag-resumo-badge-pending">{summary.pending}</div>
        </div>
        <div className="ag-resumo-card ag-resumo-cancelled">
          <div className="ag-resumo-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
          <div className="ag-resumo-info">
            <span className="ag-resumo-label">Cancelados</span>
            <strong className="ag-resumo-value">{summary.cancelled}</strong>
          </div>
          <div className="ag-resumo-badge ag-resumo-badge-cancelled">{summary.cancelled}</div>
        </div>
        <div className="ag-resumo-card ag-resumo-revenue">
          <div className="ag-resumo-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div className="ag-resumo-info">
            <span className="ag-resumo-label">Faturamento previsto</span>
            <strong className="ag-resumo-value ag-resumo-value-revenue">R$ {summary.revenue.toFixed(2).replace('.', ',')}</strong>
          </div>
          <div className="ag-resumo-badge ag-resumo-badge-revenue">{summary.total} servicos</div>
        </div>
      </div>

      {/* DATE NAV */}
      <div className="ag-date-nav">
        <button className="ag-date-nav-btn" onClick={prevDay}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="ag-date-nav-info">
          <strong>{selectedDateLabel}</strong>
          <button className="ag-date-nav-today" onClick={goToday}>Hoje</button>
        </div>
        <button className="ag-date-nav-btn" onClick={nextDay}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* COLLABORATOR FILTER */}
      {!isCollaborator && (
        <div className="ag-collab-filter">
          <button
            className={`ag-collab-filter-btn ${agenda.appointmentFilters.collaboratorId === 'all' ? 'active' : ''}`}
            onClick={() => agenda.setAppointmentFilters(f => ({ ...f, collaboratorId: 'all' }))}
          >
            Todos
          </button>
          {safeCollaborators.map(c => (
            <button
              key={c.id}
              className={`ag-collab-filter-btn ${agenda.appointmentFilters.collaboratorId === c.id ? 'active' : ''}`}
              onClick={() => agenda.setAppointmentFilters(f => ({ ...f, collaboratorId: c.id }))}
            >
              <span className="ag-collab-filter-avatar">{c.nickname?.[0] || c.name?.[0] || '?'}</span>
              {c.nickname || c.name}
            </button>
          ))}
        </div>
      )}

      {/* TABS */}
      <div className="ag-tabs">
        <button className={`ag-tab ${agendaTab === 'agenda' ? 'active' : ''}`} onClick={() => setAgendaTab('agenda')}>Agenda</button>
        <button className={`ag-tab ${agendaTab === 'history' ? 'active' : ''}`} onClick={() => setAgendaTab('history')}>Historico</button>
      </div>

      {/* AGENDA TAB */}
      {agendaTab === 'agenda' && (
        <div className="ag-grid-wrapper">
          {filteredCollaborators.length === 0 ? (
            <div className="ag-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span>Nenhum colaborador disponivel</span>
              <span className="ag-empty-hint">Cadastre colaboradores ativos para montar a grade de horarios</span>
            </div>
          ) : (
            <div className="ag-grid">
              {/* HEADER ROW: collaborator names */}
              <div className="ag-grid-header">
                <div className="ag-grid-corner">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                {filteredCollaborators.map(c => (
                  <div className="ag-grid-collab-header" key={c.id}>
                    <div className="ag-collab-avatar">{c.nickname?.[0] || c.name?.[0] || '?'}</div>
                    <div className="ag-collab-info">
                      <strong>{c.nickname || c.name}</strong>
                      <span>{dayAppointments.filter(a => a.collaborator_id === c.id).length} agendamentos</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* SLOT ROWS */}
              <div className="ag-grid-body">
                {Array.from({ length: TOTAL_SLOTS }, (_, idx) => {
                  const minutes = SLOT_START + idx * SLOT_STEP
                  const time = formatTime(minutes)
                  const isHalfHour = minutes % 60 !== 0
                  const currentMin = SLOT_START
                  const now = new Date()
                  const nowMinutes = now.getHours() * 60 + now.getMinutes()
                  const isPast = now.getDate() === new Date(`${selectedDate}T12:00:00`).getDate() && minutes + SLOT_STEP <= nowMinutes
                  const isNow = now.getDate() === new Date(`${selectedDate}T12:00:00`).getDate() && minutes <= nowMinutes && nowMinutes < minutes + SLOT_STEP

                  return (
                    <div className={`ag-grid-row ${isHalfHour ? 'ag-grid-row-half' : ''} ${isPast ? 'ag-grid-row-past' : ''}`} key={idx}>
                      <div className={`ag-grid-time ${isNow ? 'ag-grid-time-now' : ''}`}>
                        {!isHalfHour && <span>{time}</span>}
                      </div>

                      {filteredCollaborators.map(collab => {
                        const slotData = allSlots.find(s => s.collaborator.id === collab.id)
                        const slotApps = slotData?.slots.find(s => s.minutes === minutes)?.appointments || []
                        const appointment = slotApps[0]
                        const isBlocked = appointment?.status === 'blocked'
                        const hasAppointment = !!appointment && !isBlocked

                        return (
                          <div
                            className={`ag-grid-cell ${hasAppointment ? 'ag-cell-filled' : 'ag-cell-empty'} ${isBlocked ? 'ag-cell-blocked' : ''} ${isNow ? 'ag-cell-now' : ''}`}
                            key={collab.id}
                          >
                            {hasAppointment ? (
                              <div
                                className={`ag-appointment-card ag-status-${appointment.status || 'scheduled'}`}
                                onClick={() => agenda.setActiveAgendaAppointment(appointment)}
                              >
                                <div className="ag-appt-time">{appointment.timeLabel}</div>
                                <div className="ag-appt-client">{appointment.customer_name || 'Sem nome'}</div>
                                {!isHalfHour && <div className="ag-appt-service">{appointment.service_name || appointment.service_label || ''}</div>}
                              </div>
                            ) : isBlocked ? (
                              <div className="ag-blocked-label">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                {!isHalfHour && <span>{appointment?.service_name || 'Bloqueado'}</span>}
                              </div>
                            ) : (
                              <button
                                className="ag-empty-slot-btn"
                                onClick={() => openNewAppointment({
                                  appointmentDate: selectedDate,
                                  appointmentTime: time,
                                  collaboratorId: collab.id
                                })}
                                title="Clique para agendar"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {agendaTab === 'history' && (
        <div className="ag-history">
          {dayAppointments.length === 0 ? (
            <div className="ag-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Nenhum agendamento neste dia</span>
              <span className="ag-empty-hint">Clique em Novo agendamento para criar o primeiro horario</span>
            </div>
          ) : (
            <div className="ag-history-list">
              {dayAppointments.map(appt => (
                <div
                  className={`ag-history-item ag-status-${appt.status || 'scheduled'}`}
                  key={appt.id}
                  onClick={() => agenda.setActiveAgendaAppointment(appt)}
                >
                  <div className="ag-history-time">{appt.timeLabel}</div>
                  <div className="ag-history-divider" />
                  <div className="ag-history-info">
                    <strong className="ag-history-name">{appt.customer_name || 'Sem nome'}</strong>
                    <span className="ag-history-service">{appt.service_name || appt.service_label || ''}</span>
                    <span className="ag-history-collab">{appt.collaborator_name || ''}</span>
                  </div>
                  <div className="ag-history-meta">
                    <div className={`ag-appt-status-badge ag-badge-${appt.status || 'scheduled'}`}>
                      {appt.status === 'scheduled' ? 'Agendado' :
                       appt.status === 'confirmed' ? 'Confirmado' :
                       appt.status === 'arrived' ? 'Chegou' :
                       appt.status === 'in_progress' ? 'Em andamento' :
                       appt.status === 'completed' ? 'Concluido' :
                       appt.status === 'canceled' ? 'Cancelado' :
                       appt.status === 'no_show' ? 'Faltou' : appt.status || '-'}
                    </div>
                    <span className="ag-history-value">{appt.service_price_label || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DETAILS PANEL */}
      {agenda.activeAgendaAppointment && (
        <div className="ag-details-overlay" onClick={() => agenda.setActiveAgendaAppointment(null)}>
          <div className="ag-details-panel" onClick={e => e.stopPropagation()}>
            <button className="ag-details-close" onClick={() => agenda.setActiveAgendaAppointment(null)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <div className="ag-details-header">
              <h3>{agenda.activeAgendaAppointment.customer_name || 'Cliente'}</h3>
              <div className={`ag-appt-status-badge ag-badge-${agenda.activeAgendaAppointment.status || 'scheduled'}`}>
                {agenda.activeAgendaAppointment.status === 'scheduled' ? 'Agendado' :
                 agenda.activeAgendaAppointment.status === 'confirmed' ? 'Confirmado' :
                 agenda.activeAgendaAppointment.status === 'arrived' ? 'Chegou' :
                 agenda.activeAgendaAppointment.status === 'in_progress' ? 'Em andamento' :
                 agenda.activeAgendaAppointment.status === 'completed' ? 'Concluido' :
                 agenda.activeAgendaAppointment.status === 'canceled' ? 'Cancelado' :
                 agenda.activeAgendaAppointment.status === 'no_show' ? 'Faltou' : agenda.activeAgendaAppointment.status || '-'}
              </div>
            </div>

            <div className="ag-details-body">
              <div className="ag-details-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>{agenda.activeAgendaAppointment.slotLabel || agenda.activeAgendaAppointment.timeLabel}</span>
              </div>
              <div className="ag-details-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>{agenda.activeAgendaAppointment.collaborator_name || 'Colaborador'}</span>
              </div>
              <div className="ag-details-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span>{agenda.activeAgendaAppointment.service_name || 'Servico'}</span>
              </div>
              {agenda.activeAgendaAppointment.duration_label && (
                <div className="ag-details-row">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>Duracao: {agenda.activeAgendaAppointment.duration_label}</span>
                </div>
              )}
              <div className="ag-details-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span>Valor: {agenda.activeAgendaAppointment.service_price_label || '-'}</span>
              </div>
              {agenda.activeAgendaAppointment.customer_phone && (
                <div className="ag-details-row">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span>{agenda.activeAgendaAppointment.customer_phone}</span>
                </div>
              )}
              {agenda.activeAgendaAppointment.notes && (
                <div className="ag-details-notes">
                  <span>Observacoes</span>
                  <p>{agenda.activeAgendaAppointment.notes}</p>
                </div>
              )}
            </div>

            <div className="ag-details-actions">
              {agenda.activeAgendaAppointment.status === 'scheduled' && (
                <button className="ag-details-btn ag-details-btn-primary" onClick={() => agenda.updateAppointmentStatus(agenda.activeAgendaAppointment.id, 'confirmed')}>
                  Confirmar agendamento
                </button>
              )}
              {agenda.activeAgendaAppointment.status === 'confirmed' && (
                <button className="ag-details-btn ag-details-btn-primary" onClick={() => agenda.updateAppointmentStatus(agenda.activeAgendaAppointment.id, 'arrived')}>
                  Marcar chegada
                </button>
              )}
              {agenda.activeAgendaAppointment.status === 'arrived' && (
                <button className="ag-details-btn ag-details-btn-primary" onClick={() => agenda.updateAppointmentStatus(agenda.activeAgendaAppointment.id, 'in_progress')}>
                  Iniciar atendimento
                </button>
              )}
              {agenda.activeAgendaAppointment.status === 'in_progress' && (
                <button className="ag-details-btn ag-details-btn-primary" onClick={() => agenda.updateAppointmentStatus(agenda.activeAgendaAppointment.id, 'completed')}>
                  Concluir atendimento
                </button>
              )}
              {!['completed', 'canceled', 'no_show'].includes(agenda.activeAgendaAppointment.status || '') && (
                <button className="ag-details-btn ag-details-btn-danger" onClick={() => {
                  const reason = window.prompt('Motivo do cancelamento:')
                  if (reason !== null) agenda.cancelAppointment(agenda.activeAgendaAppointment.id, reason)
                }}>
                  Cancelar agendamento
                </button>
              )}

              {agenda.activeAgendaAppointment.customer_id && (
                <button className="ag-details-btn ag-details-btn-ghost" onClick={() => setCrmDrawerCustomer({
                  id: agenda.activeAgendaAppointment.customer_id,
                  name: agenda.activeAgendaAppointment.customer_name,
                  phone: agenda.activeAgendaAppointment.customer_phone,
                  email: agenda.activeAgendaAppointment.customer_email,
                  status: 'active'
                })}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Abrir CRM do cliente
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* APPOINTMENT FORM MODAL */}
      <AppointmentFormModal
        open={agenda.appointmentComposerOpen}
        form={agenda.appointmentForm}
        collaborators={safeCollaborators}
        services={visibleServices}
        isCollaborator={isCollaborator}
        onClose={agenda.closeAppointmentComposer}
        onChange={agenda.updateAppointmentForm}
        onSubmit={agenda.submitAppointment}
        submitting={agenda.submittingAppointment}
      />

      {/* CRM DRAWER */}
      <CustomerSidePanel
        customer={crmDrawerCustomer}
        open={!!crmDrawerCustomer}
        onClose={() => setCrmDrawerCustomer(null)}
        appointmentContext={agenda.activeAgendaAppointment ? {
          id: agenda.activeAgendaAppointment.id,
          service_name: agenda.activeAgendaAppointment.service_name,
          status: agenda.activeAgendaAppointment.status
        } : null}
      />
    </section>
  )
}
