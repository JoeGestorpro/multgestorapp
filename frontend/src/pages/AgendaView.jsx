import { useCallback, useMemo, useState } from 'react'
import { Button, Card, Empty } from '../components/design-system'
import { BarberTable } from '../components/barber/BarberUI'
import AgendaGrid from '../components/barber/agenda/AgendaGrid'
import AgendaToolbar from '../components/barber/agenda/AgendaToolbar'
import AppointmentModal from '../components/barber/agenda/AppointmentModal'
import AppointmentComposerModal from '../components/barber/agenda/AppointmentComposerModal'
import AppointmentDetailsPanel from '../components/barber/agenda/AppointmentDetailsPanel'
import AgendaSidePanel from '../components/barber/agenda/AgendaSidePanel'
import AgendaMobileView from '../components/barber/agenda/AgendaMobileView'
import useAgenda from '../components/barber/agenda/useAgenda'
import './AgendaView.css'

export default function AgendaView({
  user,
  isCollaborator,
  loggedInCollaboratorId,
  canManageCash,
  collaborators,
  visibleServices,
  servicesById,
  loadData,
  setError,
  setSuccess,
  appointmentsOverview,
  scheduleBlocks,
  workingHours
}) {
  const agenda = useAgenda({
    appointmentsOverview,
    scheduleBlocks,
    workingHours,
    user,
    isCollaborator,
    loggedInCollaboratorId,
    canManageCash,
    servicesById,
    loadData,
    setError,
    setSuccess
  })

  const [appointmentViewTab, setAppointmentViewTab] = useState('list')

  const safeCollaborators = collaborators || []
  const collaboratorOptions = isCollaborator
    ? [safeCollaborators.find((c) => c.id === loggedInCollaboratorId)].filter(Boolean)
    : safeCollaborators.filter((c) => c.is_active && !c.is_deleted)

  const agendaDate = agenda.appointmentFilters.date || new Date().toISOString().slice(0, 10)
  const currentDate = new Date(`${agendaDate}T00:00:00`)
  const currentMonth = new Date(`${agenda.agendaMonthCursor.slice(0, 7)}-01T00:00:00`)
  const todayDate = new Date().toISOString().slice(0, 10)
  const isMobileViewport = window.innerWidth <= 768

  const selectedCollaboratorIds = isCollaborator
    ? [loggedInCollaboratorId]
    : agenda.appointmentFilters.collaboratorId === 'all'
      ? collaboratorOptions.map((c) => c.id)
      : [agenda.appointmentFilters.collaboratorId]

  const collaboratorsForGrid = collaboratorOptions.filter((c) => selectedCollaboratorIds.includes(c.id))

  const todayList = (agenda.appointmentsWithMeta || []).filter((a) => a.dateKey === todayDate)

  const selectedDateLabel = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long'
  }).format(currentDate)

  function shiftAgendaDate(amount) {
    const next = new Date(currentDate)
    next.setDate(next.getDate() + amount)
    const nextDate = next.toISOString().slice(0, 10)
    agenda.setAppointmentFilters((current) => ({ ...current, date: nextDate }))
    agenda.setAgendaMonthCursor(nextDate)
    agenda.setActiveAgendaAppointment(null)
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
  const effectiveWorkingHours = (agenda.workingHours || []).length > 0 ? (agenda.workingHours || []) : fallbackWorkingHours
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

  const blockedAppointments = (agenda.scheduleBlocks || []).flatMap((block) => {
    const startsAt = new Date(block.starts_at)
    const endsAt = new Date(block.ends_at)
    const dayStart = new Date(`${agendaDate}T00:00:00`)
    const dayEnd = new Date(`${agendaDate}T23:59:59`)
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return []
    if (!(startsAt < dayEnd && endsAt > dayStart)) return []
    const target = block.collaborator_id
      ? collaboratorsForGrid.filter((c) => c.id === block.collaborator_id)
      : collaboratorsForGrid
    return target.map((c) => ({
      id: `blocked-${block.id}-${c.id}`,
      company_id: user?.company_id || '',
      collaborator_id: c.id,
      collaborator_name: c.nickname || c.name || 'Colaborador',
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
    ...agenda.appointmentsWithMeta.filter((a) => a.dateKey === agendaDate),
    ...blockedAppointments
  ].sort((a, b) => String(a.starts_at || '').localeCompare(String(b.starts_at || '')))

  const appointmentsForGrid = appointmentsForSelectedDay.filter((a) =>
    collaboratorsForGrid.some((c) => c.id === a.collaborator_id)
  )

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
      agenda.setAgendaMonthCursor(next.toISOString().slice(0, 10))
    },
    goNextMonth: () => {
      const next = new Date(currentMonth)
      next.setMonth(next.getMonth() + 1)
      agenda.setAgendaMonthCursor(next.toISOString().slice(0, 10))
    }
  }

  async function copyBookingLink() {
    if (!agenda.appointmentsOverview.public_booking_path) return
    const bookingUrl = `${window.location.origin}${agenda.appointmentsOverview.public_booking_path}`
    try {
      await navigator.clipboard.writeText(bookingUrl)
      setSuccess('Link de agendamento copiado')
    } catch {
      setError('Nao foi possivel copiar o link de agendamento')
    }
  }

  const safeGroups = agenda.appointmentGroups || { today: [], upcoming: [], active: [], completed: [], canceled: [] }
  const safeFiltered = agenda.filteredAppointments || []
  const safeOverview = agenda.appointmentsOverview || { summary: {} }
  const safeOverviewSummary = safeOverview.summary || {}
  const summaryCards = isCollaborator
    ? [
        { label: 'Hoje', value: safeGroups.today.length, tone: 'cash' },
        { label: 'Confirmados', value: safeGroups.active.length, tone: 'approved' },
        { label: 'Finalizados', value: safeGroups.completed.length, tone: 'admin' },
        { label: 'Faltas', value: safeFiltered.filter((a) => a.status === 'no_show').length, tone: 'danger' }
      ]
    : [
        { label: 'Agendamentos hoje', value: safeOverviewSummary.appointments_today, tone: 'cash' },
        { label: 'Confirmados', value: safeGroups.active.length, tone: 'approved' },
        { label: 'Faltas', value: safeFiltered.filter((a) => a.status === 'no_show').length, tone: 'danger' },
        { label: 'Ocupacao do dia', value: `${Math.max(0, Math.min(100, Math.round((safeGroups.today.length / Math.max(safeOverviewSummary.available_collaborators || 1, 1)) * 25)))}%`, tone: 'pix' }
      ]

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
              <strong>{agenda.appointmentsOverview.public_booking_path
                ? `${window.location.origin}${agenda.appointmentsOverview.public_booking_path}`
                : 'Configurando link...'}</strong>
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
                    onClick={() => agenda.openAppointmentComposer({
                      appointmentDate: agendaDate,
                      collaboratorId: collaboratorsForGrid[0]?.id || ''
                    })}
                    type="button"
                    variant="primary"
                  >
                    + Novo agendamento
                  </Button>
                )}
                {!isCollaborator && agenda.appointmentsOverview.public_booking_path && (
                  <Button onClick={copyBookingLink} type="button" variant="ghost">
                    Copiar link publico
                  </Button>
                )}
              </div>
            </div>

            <AgendaToolbar
              mode={agenda.agendaMode}
              onModeChange={agenda.setAgendaMode}
              onNext={() => shiftAgendaDate(agenda.agendaMode === 'week' ? 7 : 1)}
              onPrev={() => shiftAgendaDate(agenda.agendaMode === 'week' ? -7 : -1)}
              onToday={() => {
                agenda.setAppointmentFilters((current) => ({ ...current, date: todayDate }))
                agenda.setAgendaMonthCursor(todayDate)
                agenda.setActiveAgendaAppointment(null)
              }}
              onToggleFilters={() => agenda.setShowAgendaFilters((current) => !current)}
              selectedDate={agendaDate}
              showFilters={agenda.showAgendaFilters}
            />

            {agenda.showAgendaFilters && (
              <div className="agenda-filters-panel">
                <label className="barber-form-block">
                  <span>Data</span>
                  <input
                    className="barber-input"
                    type="date"
                    value={agendaDate}
                    onChange={(e) => {
                      const nextDate = e.target.value
                      agenda.setAppointmentFilters((current) => ({ ...current, date: nextDate }))
                      agenda.setAgendaMonthCursor(nextDate || new Date().toISOString().slice(0, 10))
                      agenda.setActiveAgendaAppointment(null)
                    }}
                  />
                </label>
                {!isCollaborator && (
                  <label className="barber-form-block">
                    <span>Colaborador</span>
                    <select
                      className="barber-select"
                      value={agenda.appointmentFilters.collaboratorId}
                      onChange={(e) => agenda.setAppointmentFilters((current) => ({ ...current, collaboratorId: e.target.value }))}
                    >
                      <option value="all">Toda a equipe</option>
                      {collaboratorOptions.map((c) => (
                        <option key={c.id} value={c.id}>{c.nickname || c.name}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="barber-form-block">
                  <span>Status</span>
                  <select
                    className="barber-select"
                    value={agenda.appointmentFilters.status}
                    onChange={(e) => agenda.setAppointmentFilters((current) => ({ ...current, status: e.target.value }))}
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
                  <Button onClick={() => agenda.setAppointmentFilters({ date: todayDate, collaboratorId: 'all', status: 'all' })} type="button" variant="ghost">
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
                    <strong>{appointmentsForSelectedDay.filter((a) => a.status !== 'blocked').length}</strong>
                  </div>
                  <div className="agenda-summary-card">
                    <span>Confirmados</span>
                    <strong>{appointmentsForSelectedDay.filter((a) => ['confirmed', 'arrived', 'in_progress'].includes(a.status)).length}</strong>
                  </div>
                  <div className="agenda-summary-card">
                    <span>Funcionamento</span>
                    <strong>{nextOpeningLabel}</strong>
                  </div>
                </div>

                {agenda.agendaMode === 'week' && (
                  <div className="agenda-week-days">
                    {weekDays.map((day) => (
                      <button
                        className={day.key === agendaDate ? 'active' : ''}
                        key={day.key}
                        onClick={() => agenda.setAppointmentFilters((current) => ({ ...current, date: day.key }))}
                        type="button"
                      >
                        <span>{day.label}</span>
                        <strong>{day.day}</strong>
                      </button>
                    ))}
                  </div>
                )}

                {isMobileViewport ? (
                  <AgendaMobileView
                    appointments={appointmentsForSelectedDay}
                    isCollaborator={isCollaborator}
                    onSelectAppointment={(app) => { agenda.setActiveAgendaAppointment(app); agenda.setAgendaModalOpen(true) }}
                    onOpenComposer={() => agenda.openAppointmentComposer({
                      appointmentDate: agendaDate,
                      collaboratorId: collaboratorsForGrid[0]?.id || ''
                    })}
                  />
                ) : (
                  collaboratorsForGrid.length > 0 ? (
                    <>
                      <p style={{ textAlign: 'center', color: 'var(--barber-muted)', fontSize: '13px', marginBottom: '16px' }}>
                        Clique em um horario livre na grade para criar um agendamento.
                      </p>
                      <AgendaGrid
                        appointments={appointmentsForGrid}
                        collaborators={collaboratorsForGrid}
                        onSelectAppointment={(appointment) => agenda.setActiveAgendaAppointment(appointment)}
                        onSelectSlot={!isCollaborator ? (slot) => agenda.openAppointmentComposer({
                          appointmentDate: agendaDate,
                          appointmentTime: slot.time,
                          collaboratorId: slot.collaboratorId
                        }) : undefined}
                        selectedDate={agendaDate}
                        workingHoursByCollaborator={workingHoursByCollaborator}
                      />
                    </>
                  ) : (
                    <Empty
                      description={isCollaborator
                        ? 'Seu perfil ainda nao foi vinculado a um colaborador ativo para montar a agenda.'
                        : 'Cadastre colaboradores ativos para distribuir a grade da agenda.'}
                      title="Sem colaboradores"
                    />
                  )
                )}
              </div>

              {!isMobileViewport && (
                <AgendaSidePanel
                  miniCalendar={miniCalendar}
                  selectedDate={agendaDate}
                  onDateChange={(date) => agenda.setAppointmentFilters((current) => ({ ...current, date }))}
                  todayAppointments={todayList}
                  stats={{
                    total: appointmentsForSelectedDay.filter((a) => a.status !== 'blocked').length,
                    confirmed: appointmentsForSelectedDay.filter((a) => ['confirmed', 'arrived', 'in_progress'].includes(a.status)).length,
                    noShow: agenda.filteredAppointments.filter((a) => a.status === 'no_show').length,
                    collaborators: collaboratorsForGrid.length
                  }}
                  onViewAll={() => {}}
                  nextOpeningLabel={nextOpeningLabel}
                  openAppointmentComposer={() => agenda.openAppointmentComposer({
                    appointmentDate: agendaDate,
                    collaboratorId: collaboratorsForGrid[0]?.id || ''
                  })}
                  collaboratorsCount={collaboratorsForGrid.length}
                />
              )}

              <AppointmentDetailsPanel
                appointment={agenda.activeAgendaAppointment}
                isCollaborator={isCollaborator}
                onArrived={(id) => agenda.updateAppointmentStatus(id, 'arrived')}
                onCancel={(appointment) => {
                  const reason = window.prompt('Motivo do cancelamento:')
                  if (reason !== null) agenda.cancelAppointment(appointment.id, reason)
                }}
                onClose={() => agenda.setActiveAgendaAppointment(null)}
                onComplete={(id) => agenda.updateAppointmentStatus(id, 'completed')}
                onConfirm={(id) => agenda.updateAppointmentStatus(id, 'confirmed')}
                onReschedule={(appointment) => {
                  const startsAt = appointment?.starts_at ? new Date(appointment.starts_at) : null
                  const defaultDate = startsAt && !Number.isNaN(startsAt.getTime()) ? startsAt.toISOString().slice(0, 10) : ''
                  const defaultTime = startsAt && !Number.isNaN(startsAt.getTime())
                    ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(startsAt)
                    : ''
                  const newDate = window.prompt('Nova data (AAAA-MM-DD):', defaultDate)
                  const newTime = window.prompt('Novo horario (HH:MM):', defaultTime)
                  if (newDate && newTime) agenda.rescheduleAppointment(appointment.id, newDate, newTime)
                }}
                onStart={(id) => agenda.updateAppointmentStatus(id, 'in_progress')}
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
                  if (start && end) agenda.saveScheduleBlock({ collaboratorId: collab, startsAt: start, endsAt: end, reason })
                }} variant="primary">Novo bloqueio</Button>
              </div>
              <BarberTable columns={['Inicio', 'Fim', 'Motivo', 'Acoes']}>
                {agenda.scheduleBlocks.map(block => (
                  <tr key={block.id}>
                    <td>{fullDate(block.starts_at)}</td>
                    <td>{fullDate(block.ends_at)}</td>
                    <td>{block.reason}</td>
                    <td><Button onClick={() => agenda.deleteScheduleBlock(block.id)} variant="danger">Remover</Button></td>
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
                      <input type="time" defaultValue={h?.opens_at || '08:00'} onBlur={(e) => agenda.saveWorkingHours({ weekday: idx, opensAt: e.target.value, closesAt: h?.closes_at || '20:00', isClosed: false })} />
                      <input type="time" defaultValue={h?.closes_at || '20:00'} onBlur={(e) => agenda.saveWorkingHours({ weekday: idx, opensAt: h?.opens_at || '08:00', closesAt: e.target.value, isClosed: false })} />
                      <label><input type="checkbox" defaultChecked={h?.is_closed} onChange={(e) => agenda.saveWorkingHours({ weekday: idx, opensAt: h?.opens_at || '08:00', closesAt: h?.closes_at || '20:00', isClosed: e.target.checked })} /> Fechado</label>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      <AppointmentModal
        appointment={agenda.activeAgendaAppointment}
        isCollaborator={isCollaborator}
        onArrived={(id) => agenda.updateAppointmentStatus(id, 'arrived')}
        onCancel={(appointment) => {
          const reason = window.prompt('Motivo do cancelamento:')
          if (reason !== null) agenda.cancelAppointment(appointment.id, reason)
        }}
        onClose={() => {
          agenda.setAgendaModalOpen(false)
          agenda.setActiveAgendaAppointment(null)
        }}
        onComplete={(id) => agenda.updateAppointmentStatus(id, 'completed')}
        onConfirm={(id) => agenda.updateAppointmentStatus(id, 'confirmed')}
        onReschedule={(appointment) => {
          const startsAt = appointment?.starts_at ? new Date(appointment.starts_at) : null
          const defaultDate = startsAt && !Number.isNaN(startsAt.getTime()) ? startsAt.toISOString().slice(0, 10) : ''
          const defaultTime = startsAt && !Number.isNaN(startsAt.getTime())
            ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(startsAt)
            : ''
          const newDate = window.prompt('Nova data (AAAA-MM-DD):', defaultDate)
          const newTime = window.prompt('Novo horario (HH:MM):', defaultTime)
          if (newDate && newTime) agenda.rescheduleAppointment(appointment.id, newDate, newTime)
        }}
        onStart={(id) => agenda.updateAppointmentStatus(id, 'in_progress')}
        open={agenda.agendaModalOpen && isMobileViewport}
      />

      <AppointmentComposerModal
        collaborators={collaboratorOptions}
        form={agenda.appointmentForm}
        isCollaborator={isCollaborator}
        onChange={agenda.updateAppointmentForm}
        onClose={agenda.closeAppointmentComposer}
        onSubmit={agenda.submitAppointment}
        open={agenda.appointmentComposerOpen}
        services={visibleServices}
        submitting={agenda.submittingAppointment}
      />
    </section>
  )
}

const agendaWeekdayLabels = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']

function shortDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR')
}

function fullDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
