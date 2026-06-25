const BADGE_VARIANTS = {
  active: { className: 'barber-badge barber-badge-success', label: 'Ativo' },
  inactive: { className: 'barber-badge barber-badge-danger', label: 'Inativo' },
  noEmail: { className: 'barber-badge barber-badge-warning', label: 'Sem email' },
  noCommission: { className: 'barber-badge barber-badge-warning', label: 'Sem comissao' },
  booking: { className: 'barber-badge barber-badge-admin', label: 'Agenda publica' },
  noBooking: { className: 'barber-badge', label: 'Sem agenda' },
  sales: { className: 'barber-badge barber-badge-success', label: 'Vendas' },
  dashboard: { className: 'barber-badge barber-badge-pix', label: 'Dashboard' },
  report: { className: 'barber-badge barber-badge-pix', label: 'Relatorio' },
  barter: { className: 'barber-badge barber-badge-permuta', label: 'Permuta' }
}

export default function TeamStatusBadge({ type, label, className = '' }) {
  const variant = BADGE_VARIANTS[type] || { className: 'barber-badge', label: label || type }
  return (
    <span className={`${variant.className} ${className}`.trim()}>
      {label || variant.label}
    </span>
  )
}
