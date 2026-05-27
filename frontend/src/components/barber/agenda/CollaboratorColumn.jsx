import AppointmentCard from './AppointmentCard'

function parseMinutes(timeValue) {
  if (!timeValue) return null
  const [hours, minutes] = String(timeValue).slice(0, 5).split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return (hours * 60) + minutes
}

export default function CollaboratorColumn({
  collaborator,
  items,
  hourRows,
  pixelsPerMinute,
  gridStartMinutes,
  onSelectAppointment,
  onSelectSlot,
  workingDay,
  selectedDate
}) {
  const slotMinutes = 30
  const slots = Array.from({ length: hourRows * 2 }, (_, index) => gridStartMinutes + (index * slotMinutes))
  const today = new Date().toISOString().slice(0, 10)
  const isToday = selectedDate === today
  const nowMinutes = isToday ? (new Date().getHours() * 60) + new Date().getMinutes() : null
  const opensAt = parseMinutes(workingDay?.opens_at)
  const closesAt = parseMinutes(workingDay?.closes_at)
  const isClosed = workingDay?.is_closed === true

  function isSlotAvailable(slotStart) {
    if (isClosed) {
      return false
    }

    if (typeof opensAt !== 'number' || typeof closesAt !== 'number') {
      return true
    }

    return slotStart >= opensAt && (slotStart + slotMinutes) <= closesAt
  }

  const topOverlayHeight = typeof opensAt === 'number' && opensAt > gridStartMinutes
    ? (opensAt - gridStartMinutes) * pixelsPerMinute
    : 0

  const bottomOverlayHeight = typeof closesAt === 'number' && closesAt < (gridStartMinutes + (hourRows * 60))
    ? ((gridStartMinutes + (hourRows * 60)) - closesAt) * pixelsPerMinute
    : 0

  return (
    <div className="agenda-grid-column" key={collaborator.id}>
      {Array.from({ length: hourRows }).map((_, index) => (
        <div className="agenda-grid-hour-line" key={index} />
      ))}
      <div className="agenda-grid-slot-layer">
        {slots.map((slotStart) => {
          const enabled = isSlotAvailable(slotStart)
          const hour = String(Math.floor(slotStart / 60)).padStart(2, '0')
          const minute = String(slotStart % 60).padStart(2, '0')
          const time = `${hour}:${minute}`

          return (
            <button
              className={`agenda-grid-slot ${enabled ? '' : 'disabled'}`.trim()}
              disabled={!enabled || !onSelectSlot}
              key={`${collaborator.id}-${time}`}
              onClick={() => onSelectSlot?.({
                collaboratorId: collaborator.id,
                collaboratorName: collaborator.nickname || collaborator.name || 'Colaborador',
                time
              })}
              style={{
                top: `${(slotStart - gridStartMinutes) * pixelsPerMinute}px`,
                height: `${slotMinutes * pixelsPerMinute}px`
              }}
              type="button"
            >
              <span>+</span>
            </button>
          )
        })}
      </div>
      {isClosed ? (
        <div className="agenda-grid-closed-overlay full">
          <strong>Fechado</strong>
        </div>
      ) : (
        <>
          {topOverlayHeight > 0 && (
            <div
              className="agenda-grid-closed-overlay top"
              style={{ height: `${topOverlayHeight}px` }}
            >
              <strong>Antes da abertura</strong>
            </div>
          )}
          {bottomOverlayHeight > 0 && (
            <div
              className="agenda-grid-closed-overlay bottom"
              style={{ height: `${bottomOverlayHeight}px` }}
            >
              <strong>Fora do expediente</strong>
            </div>
          )}
        </>
      )}
      {isToday && typeof nowMinutes === 'number' && nowMinutes >= gridStartMinutes && nowMinutes <= gridStartMinutes + (hourRows * 60) && (
        <div
          className="agenda-now-indicator"
          style={{ top: `${(nowMinutes - gridStartMinutes) * pixelsPerMinute}px` }}
        />
      )}
      {items.map((appointment) => (
        <AppointmentCard
          appointment={appointment}
          height={(appointment.__clampedEnd - appointment.__clampedStart) * pixelsPerMinute}
          key={appointment.id}
          laneCount={appointment.__laneCount || 1}
          laneIndex={appointment.__lane || 0}
          onClick={onSelectAppointment}
          top={(appointment.__clampedStart - gridStartMinutes) * pixelsPerMinute}
        />
      ))}
    </div>
  )
}
