function ModuleItem({ module, onEdit, onToggle, toggling, variant = 'table' }) {
  if (variant === 'card') {
    return (
      <article className="master-module-list-item">
        <div className="master-module-list-item-top">
          <div className="master-module-name-cell">
            <span className="master-module-color-dot" style={{ background: module.is_active ? '#60a5fa' : '#64748b' }} />
            <div>
              <strong>{module.name}</strong>
              <small>{module.version || 'v1'}</small>
            </div>
          </div>
          <span className={`master-module-status-badge ${module.is_active ? 'active' : 'inactive'}`}>
            {module.is_active ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        <div className="master-module-card-meta">
          <div>
            <span>Slug</span>
            <code>{module.slug}</code>
          </div>
          <div>
            <span>Planos</span>
            <strong>{module.planSummary}</strong>
          </div>
          <div>
            <span>Base path</span>
            <code>{module.activeCompaniesLabel}</code>
          </div>
        </div>

        <div className="table-actions">
          <button type="button" onClick={() => onEdit(module)}>
            Gerenciar
          </button>
          <button className="button-secondary" type="button" disabled={toggling} onClick={() => onToggle(module)}>
            {toggling ? 'Salvando...' : module.is_active ? 'Inativar' : 'Ativar'}
          </button>
        </div>
      </article>
    )
  }

  return (
    <tr>
      <td>
        <div className="master-module-name-cell">
          <span className="master-module-color-dot" style={{ background: module.is_active ? '#60a5fa' : '#64748b' }} />
          <div>
            <strong>{module.name}</strong>
            <small>{module.version || 'v1'}</small>
          </div>
        </div>
      </td>
      <td>
        <code>{module.slug}</code>
      </td>
      <td>
        <span className={`master-module-status-badge ${module.is_active ? 'active' : 'inactive'}`}>
          {module.is_active ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td>{module.planSummary}</td>
      <td>{module.activeCompaniesLabel}</td>
      <td>
        <div className="table-actions">
          <button type="button" onClick={() => onEdit(module)}>
            Gerenciar
          </button>
          <button className="button-secondary" type="button" disabled={toggling} onClick={() => onToggle(module)}>
            {toggling ? 'Salvando...' : module.is_active ? 'Inativar' : 'Ativar'}
          </button>
        </div>
      </td>
    </tr>
  )
}

export default ModuleItem
