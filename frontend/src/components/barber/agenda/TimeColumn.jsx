const HOURS = Array.from({ length: 13 }, (_, index) => 8 + index)

export default function TimeColumn() {
  return (
    <div className="agenda-time-column" aria-hidden="true">
      {HOURS.map((hour) => (
        <div className="agenda-time-slot" key={hour}>
          <span>{`${String(hour).padStart(2, '0')}:00`}</span>
        </div>
      ))}
    </div>
  )
}
