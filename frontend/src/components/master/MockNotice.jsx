export default function MockNotice({ message = 'DADOS MOCKADOS — substituir por API futura' }) {
  return (
    <div className="master-mock-notice">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
        <path d="M12 9v4m0 4h.01M10.29 3.86l-8.1 14c-.6 1.04.15 2.14 1.21 2.14h15.2c1.06 0 1.81-1.1 1.21-2.14l-8.1-14c-.6-1.04-2.14-1.04-2.74 0z" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>{message}</span>
    </div>
  )
}
