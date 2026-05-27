import './PremiumTabs.css'

export default function PremiumTabs({ tabs, active, onChange }) {
  return (
    <div className="pm-tabs" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            className={`pm-tab ${isActive ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
            role="tab"
            aria-selected={isActive}
            type="button"
          >
            {tab.icon && <span className="pm-tab-icon">{tab.icon}</span>}
            <span className="pm-tab-label">{tab.label}</span>
            {tab.count !== undefined && (
              <span className="pm-tab-count">{tab.count}</span>
            )}
          </button>
        )
      })}
      <div className="pm-tab-indicator" style={{
        transform: `translateX(${tabs.findIndex(t => t.id === active) * 100}%)`,
        width: `${100 / tabs.length}%`
      }} />
    </div>
  )
}
