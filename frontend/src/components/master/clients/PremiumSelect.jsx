import { useEffect, useRef, useState } from 'react'

function PremiumSelect({ options, value, onChange, placeholder = 'Selecionar' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = options.find((option) => String(option.value) === String(value))

  return (
    <div className={`master-premium-select ${open ? 'open' : ''}`} ref={rootRef}>
      <button type="button" className="master-premium-select-trigger" onClick={() => setOpen((current) => !current)}>
        <span>{selected?.label || placeholder}</span>
        <strong>{open ? '−' : '+'}</strong>
      </button>

      {open && (
        <div className="master-premium-select-menu">
          {options.map((option) => (
            <button
              key={`${option.value}-${option.label}`}
              type="button"
              className={String(option.value) === String(value) ? 'active' : ''}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PremiumSelect
