function PageHeader({ eyebrow = 'Painel Master', title, description, actions }) {
  return (
    <div className="master-premium-page-header">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="master-premium-page-actions">{actions}</div>}
    </div>
  )
}

export default PageHeader
