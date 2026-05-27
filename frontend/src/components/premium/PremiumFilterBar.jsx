import { useState } from 'react'
import './PremiumFilterBar.css'

export default function PremiumFilterBar({ search, onSearchChange, placeholder, filters, onFilterChange, actions }) {
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <div className="pm-filterbar">
      <div className={`pm-filterbar-search ${searchFocused ? 'focused' : ''}`}>
        <svg className="pm-filterbar-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="pm-filterbar-input"
          type="text"
          placeholder={placeholder || 'Buscar...'}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {search && (
          <button className="pm-filterbar-clear" onClick={() => onSearchChange('')} type="button" aria-label="Limpar busca">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      {filters && (
        <div className="pm-filterbar-filters">
          {filters.map((filter) => (
            <select
              key={filter.key}
              className="pm-filterbar-select"
              value={filter.value}
              onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ))}
        </div>
      )}
      {actions && (
        <div className="pm-filterbar-actions">
          {actions}
        </div>
      )}
    </div>
  )
}
