import './HeroCard.css'

export default function HeroCard({ 
  overline, 
  title, 
  description, 
  stats = [],
  className = '',
  children,
  ...props 
}) {
  return (
    <div className={`ds-hero-card ${className}`} {...props}>
      {overline && <span className="ds-hero-card__overline">{overline}</span>}
      {title && <h2 className="ds-hero-card__title">{title}</h2>}
      {description && <p className="ds-hero-card__description">{description}</p>}
      {stats.length > 0 && (
        <div className="ds-hero-card__stats">
          {stats.map((stat, index) => (
            <span key={index} className="ds-hero-card__stat">{stat}</span>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}