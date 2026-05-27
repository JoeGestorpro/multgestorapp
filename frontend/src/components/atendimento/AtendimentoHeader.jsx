import { RefreshCw, Plus, Search, Calendar, ChevronDown } from 'lucide-react'

const periodOptions = [
  { value: 'today', label: 'Hoje' },
  { value: '7days', label: '7 Dias' },
  { value: '30days', label: '30 Dias' },
  { value: 'custom', label: 'Personalizado' }
]

function PeriodFilter({ value, onChange }) {
  return (
    <div className="at-period-filter">
      <Calendar size={14} className="at-period-icon" />
      {periodOptions.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`at-period-btn ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function SearchBar({ value, onChange }) {
  return (
    <div className="at-search-bar">
      <Search size={14} className="at-search-icon" />
      <input
        type="text"
        placeholder="Buscar cliente ou serviço..."
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function StatusBadge({ label }) {
  if (!label) return null
  return <span className="at-status-badge">{label}</span>
}

function AtendimentoHeader({
  onRefresh,
  onNewAttendance,
  itemCount,
  total,
  periodFilter = 'today',
  onPeriodChange = () => {},
  searchTerm = '',
  onSearchChange = () => {},
  statusBadge = null
}) {
  return (
    <div className="at-workspace-header">
      <div className="at-header-top">
        <div className="at-workspace-title">
          <h2>Atendimentos</h2>
          {itemCount > 0 && (
            <span className="at-header-count">{itemCount} item(ns) • {total}</span>
          )}
          <StatusBadge label={statusBadge} />
        </div>

        <div className="at-workspace-actions">
          <button
            className="barber-button barber-button-ghost"
            onClick={onRefresh}
            type="button"
          >
            <RefreshCw size={14} />
            <span>Atualizar</span>
          </button>
          <button
            className="barber-button barber-button-primary"
            onClick={onNewAttendance}
            type="button"
          >
            <Plus size={14} />
            <span>Novo Atendimento</span>
          </button>
        </div>
      </div>

      <div className="at-header-filters">
        <PeriodFilter value={periodFilter} onChange={onPeriodChange} />
        <SearchBar value={searchTerm} onChange={onSearchChange} />
      </div>
    </div>
  )
}

export default AtendimentoHeader
