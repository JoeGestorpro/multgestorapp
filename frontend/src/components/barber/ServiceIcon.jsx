import { normalizeServiceIcon } from './ServiceIcon.utils'

function renderIconShape(icon) {
  switch (icon) {
    case 'clipper':
      return (
        <>
          <path d="M8 6h8v3H8z" />
          <path d="M9 9v7a3 3 0 003 3 3 3 0 003-3V9" />
          <path d="M10 5V3m2 2V3m2 2V3" />
        </>
      )
    case 'beard':
      return (
        <>
          <path d="M7 9a5 5 0 0110 0" />
          <path d="M8 12c0 4 2 6 4 7 2-1 4-3 4-7-1 1-2 1-3 1-1 0-2-.6-3-1.4-.8.8-1.8 1.4-3 1.4-.9 0-1.8-.2-2-.6z" />
          <path d="M10 8h4" />
        </>
      )
    case 'scissors_beard':
      return (
        <>
          <circle cx="7" cy="8" r="2.2" />
          <circle cx="7" cy="16" r="2.2" />
          <path d="M9 9.5l10-5.5M9 14.5L19 20M9.5 12H14" />
          <path d="M13 8a3.5 3.5 0 017 0" />
          <path d="M13.5 12c0 2.8 1.3 4.5 3 5.5 1.7-1 3-2.7 3-5.5-.8.6-1.4.8-2.1.8-.7 0-1.3-.3-1.9-.8-.5.5-1.2.8-2 .8-.3 0-.7 0-1-.2z" />
        </>
      )
    case 'eyebrow':
      return (
        <>
          <path d="M4 14c2.5-3 5.2-4.5 8-4.5S17.5 11 20 14" />
          <path d="M6.5 14c1.6-1.3 3.4-2 5.5-2s3.9.7 5.5 2" />
        </>
      )
    case 'sparkles':
      return (
        <>
          <path d="M7 5l1.2 2.8L11 9l-2.8 1.2L7 13l-1.2-2.8L3 9l2.8-1.2z" />
          <path d="M17 4l.8 2L20 7l-2.2 1-.8 2-.8-2L14 7l2.2-1z" />
          <path d="M17 13l1.4 3.1L22 17.5l-3.6 1.4L17 22l-1.4-3.1L12 17.5l3.6-1.4z" />
        </>
      )
    case 'dropper':
      return (
        <>
          <path d="M14 4l6 6" />
          <path d="M9 15l8-8 2 2-8 8H9z" />
          <path d="M7 17c0 1.7-1.3 3-3 3" />
        </>
      )
    case 'droplet':
      return (
        <>
          <path d="M12 3c3.5 4.3 5 7 5 9.5A5 5 0 017 12.5C7 10 8.5 7.3 12 3z" />
          <path d="M10 15.5a2.2 2.2 0 002 .8" />
        </>
      )
    case 'comb':
      return (
        <>
          <path d="M6 9h11M6 13h8" />
          <path d="M5 17l4-10m2 10l4-10m2 10l2-5" />
        </>
      )
    case 'flask':
      return (
        <>
          <path d="M10 3h4" />
          <path d="M11 3v5l-5 9a2 2 0 001.7 3h8.6a2 2 0 001.7-3l-5-9V3" />
          <path d="M9 14h6" />
        </>
      )
    case 'waves':
      return (
        <>
          <path d="M7 5c1 1.5 1 3 0 4.5s-1 3 0 4.5" />
          <path d="M12 5c1 1.5 1 3 0 4.5s-1 3 0 4.5" />
          <path d="M17 5c1 1.5 1 3 0 4.5s-1 3 0 4.5" />
        </>
      )
    case 'razor':
      return (
        <>
          <path d="M5 16l4-4 7 7" />
          <path d="M9 12l5-5 5 5-3 3" />
          <path d="M14 7l2-2" />
        </>
      )
    case 'hair':
      return (
        <>
          <path d="M7 19v-5a5 5 0 0110 0v5" />
          <path d="M8 10c1-3 3-4 6-4 1.6 0 3.1.7 4 2" />
          <path d="M9 19c.4-2.6 1.6-4 3-4s2.6 1.4 3 4" />
        </>
      )
    case 'dryer':
      return (
        <>
          <path d="M5 9h7a3 3 0 110 6H9" />
          <path d="M9 12v7" />
          <path d="M15 10l4-2v8l-4-2" />
        </>
      )
    case 'jar':
      return (
        <>
          <path d="M8 6h8" />
          <path d="M7 8h10v9a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
          <path d="M10 12h4" />
        </>
      )
    case 'hands':
      return (
        <>
          <path d="M8 12V7a1 1 0 012 0v5" />
          <path d="M10 12V6a1 1 0 012 0v6" />
          <path d="M12 12V7a1 1 0 012 0v5" />
          <path d="M14 12V8a1 1 0 012 0v6c0 2.5-1.8 5-4 6-2.2-1-4-3.5-4-6v-2" />
        </>
      )
    case 'face':
      return (
        <>
          <path d="M8 9c1-3 3-4 4-4s3 .8 4 4v4c0 3-2 5-4 6-2-1-4-3-4-6z" />
          <path d="M10 11h.01M14 11h.01" />
          <path d="M10.5 14c1 .8 2 .8 3 0" />
          <path d="M18 6l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
        </>
      )
    case 'more':
      return (
        <>
          <circle cx="7" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="17" cy="12" r="1.6" />
        </>
      )
    case 'scissors':
      return (
        <>
          <circle cx="7" cy="8" r="2.2" />
          <circle cx="7" cy="16" r="2.2" />
          <path d="M9 9.5L20 4M9 14.5L20 20M9.5 12H14" />
        </>
      )
  }

  return (
    <>
      <circle cx="7" cy="8" r="2.2" />
      <circle cx="7" cy="16" r="2.2" />
      <path d="M9 9.5L20 4M9 14.5L20 20M9.5 12H14" />
    </>
  )
}

export default function ServiceIcon({ icon, serviceName, className = '' }) {
  const resolvedIcon = normalizeServiceIcon(icon, serviceName)

  return (
    <svg
      aria-hidden="true"
      className={`barber-service-symbol ${className}`.trim()}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      viewBox="0 0 24 24"
    >
      {renderIconShape(resolvedIcon)}
    </svg>
  )
}
