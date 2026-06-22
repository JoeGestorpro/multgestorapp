export default function FilterBar({ search, onSearchChange, searchPlaceholder = 'Buscar…', filters = [], onFilterChange }) {
  function handleFilterChange(key, value) {
    if (onFilterChange) onFilterChange(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="master-filter-bar">
      <div className="master-filter-search">
        <svg className="master-filter-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
          <path d="M21 21l-5-5M10 18a8 8 0 100-16 8 8 0 000 16z" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          aria-label={searchPlaceholder}
        />
      </div>
      {filters.map(f => (
        <select
          key={f.key}
          className="master-filter-select"
          value={f.value || ''}
          onChange={e => handleFilterChange(f.key, e.target.value)}
          aria-label={f.label}
        >
          <option value="">{f.label}</option>
          {f.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
    </div>
  )
}
