import CollaboratorColumn from './CollaboratorColumn'
import TimeColumn from './TimeColumn'
import CollaboratorAvatar from '../CollaboratorAvatar'

const GRID_START_MINUTES = 8 * 60
const GRID_END_MINUTES = 20 * 60
const PIXELS_PER_MINUTE = 1.2
const DAY_MINUTES = GRID_END_MINUTES - GRID_START_MINUTES
const HOUR_ROWS = 12

function parseMinutes(timeValue) {
  if (!timeValue) return null
  const clean = String(timeValue).slice(0, 5)
  const [hours, minutes] = clean.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return (hours * 60) + minutes
}

function parseDateMinutes(dateValue) {
  if (!dateValue) return null
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return null
  return (date.getHours() * 60) + date.getMinutes()
}

function computeEndMinutes(appointment, startMinutes) {
  const fromEndsAt = parseDateMinutes(appointment.ends_at)
  if (typeof fromEndsAt === 'number') return fromEndsAt
  return startMinutes + 40
}

function normalizeAppointments(appointments) {
  return appointments
    .map((appointment) => {
      const startMinutes = parseDateMinutes(appointment.starts_at)
      if (typeof startMinutes !== 'number') return null

      const endMinutes = Math.max(computeEndMinutes(appointment, startMinutes), startMinutes + 20)
      const clampedStart = Math.max(startMinutes, GRID_START_MINUTES)
      const clampedEnd = Math.min(endMinutes, GRID_END_MINUTES)

      if (clampedEnd <= GRID_START_MINUTES || clampedStart >= GRID_END_MINUTES) return null

      return {
        ...appointment,
        __start: startMinutes,
        __end: endMinutes,
        __clampedStart: clampedStart,
        __clampedEnd: clampedEnd
      }
    })
    .filter(Boolean)
    .sort((left, right) => left.__start - right.__start)
}

function layoutOverlaps(items) {
  const active = []
  const output = []

  items.forEach((item) => {
    for (let index = active.length - 1; index >= 0; index -= 1) {
      if (active[index].__end <= item.__start) active.splice(index, 1)
    }

    const usedLanes = new Set(active.map((activeItem) => activeItem.__lane))
    let lane = 0
    while (usedLanes.has(lane)) lane += 1

    const laneCount = Math.max(active.length + 1, lane + 1)
    item.__lane = lane
    item.__laneCount = laneCount
    active.forEach((activeItem) => {
      activeItem.__laneCount = Math.max(activeItem.__laneCount || 1, laneCount)
    })
    active.push(item)
    output.push(item)
  })

  return output
}

export default function AgendaGrid({
  collaborators,
  appointments,
  selectedDate,
  onSelectAppointment,
  onSelectSlot,
  workingHoursByCollaborator
}) {
  const boardHeight = DAY_MINUTES * PIXELS_PER_MINUTE

  const perCollaborator = collaborators.map((collaborator) => {
    const items = appointments.filter((appointment) => appointment.collaborator_id === collaborator.id)
    return {
      collaborator,
      items: layoutOverlaps(normalizeAppointments(items))
    }
  })

  return (
    <div className="agenda-grid-shell">
      <div className="agenda-grid-head">
        <div className="agenda-grid-day">{new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(new Date(`${selectedDate}T00:00:00`))}</div>
        <div className="agenda-grid-collaborators">
          {collaborators.map((collaborator) => (
            <div className="agenda-grid-collab" key={collaborator.id}>
              <CollaboratorAvatar
                avatarUrl={collaborator.avatar_url || collaborator.avatarUrl || ''}
                name={collaborator.nickname || collaborator.name || 'Colaborador'}
              />
              <div>
                <strong>{collaborator.nickname || collaborator.name || 'Colaborador'}</strong>
                <span>{itemsLabel(perCollaborator.find((item) => item.collaborator.id === collaborator.id)?.items?.length || 0)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="agenda-grid-body" style={{ minHeight: `${boardHeight}px` }}>
        <TimeColumn />
        <div className="agenda-grid-columns">
          {perCollaborator.map(({ collaborator, items }) => (
            <CollaboratorColumn
              collaborator={collaborator}
              gridStartMinutes={GRID_START_MINUTES}
              hourRows={HOUR_ROWS}
              items={items}
              key={collaborator.id}
              onSelectAppointment={onSelectAppointment}
              onSelectSlot={onSelectSlot}
              pixelsPerMinute={PIXELS_PER_MINUTE}
              selectedDate={selectedDate}
              workingDay={workingHoursByCollaborator?.[collaborator.id] || null}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function itemsLabel(count) {
  if (count === 1) return '1 horario no dia'
  return `${count} horarios no dia`
}
