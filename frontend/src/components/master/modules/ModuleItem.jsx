function ModuleItem({ module, onEdit, onToggle, toggling }) {
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
      <td>{module.activeCompaniesLabel}</td>
      <td>{module.createdLabel}</td>
      <td>
        <div className="table-actions">
          <button type="button" onClick={() => onEdit(module)}>
            Editar
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
