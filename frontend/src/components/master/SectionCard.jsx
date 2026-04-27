function SectionCard({ title, meta, children, className = '' }) {
  return (
    <article className={`master-premium-card ${className}`.trim()}>
      {(title || meta) && (
        <div className="master-premium-card-title">
          <h2>{title}</h2>
          {meta && <span>{meta}</span>}
        </div>
      )}
      {children}
    </article>
  )
}

export default SectionCard
