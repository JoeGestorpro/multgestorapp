import { Clock, Check, Package } from 'lucide-react'
import ServiceIcon from '../barber/ServiceIcon'

function ServiceCard({ service, onSelect, isSelected, isProduct = false }) {
  const handleClick = () => {
    onSelect(service)
  }

  return (
    <button
      className={`at-service-card ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      type="button"
      aria-label={`Adicionar ${service.name}`}
    >
      <div className="at-service-card-icon">
        {isProduct ? (
          <Package size={18} />
        ) : (
          <ServiceIcon icon={service.icon} serviceName={service.name} size={18} />
        )}
      </div>
      <span className="at-service-card-name">{service.name}</span>
      <span className="at-service-card-price">{service.formattedPrice}</span>
      {service.estimated_time_minutes && (
        <span className="at-service-card-time">
          <Clock size={9} />
          {service.estimated_time_minutes}min
        </span>
      )}
      {isSelected && (
        <span className="at-service-card-check">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
    </button>
  )
}

export default ServiceCard
