import { BarberSkeleton } from '../barber/BarberUI'

function LoadingState() {
  return (
    <div className="at-loading">
      <div className="at-loading-header">
        <BarberSkeleton width="160px" height="28px" />
        <BarberSkeleton width="100px" height="28px" />
      </div>
      <div className="at-loading-cards">
        <BarberSkeleton width="100%" height="48px" rounded="lg" />
      </div>
      <div className="at-loading-main">
        <div className="at-loading-catalog">
          <BarberSkeleton width="100%" height="36px" />
          <div className="at-loading-grid">
            {[1,2,3,4,5,6].map(i => (
              <BarberSkeleton key={i} width="100%" height="100px" rounded="lg" />
            ))}
          </div>
        </div>
        <div className="at-loading-cart">
          <BarberSkeleton width="100%" height="280px" rounded="lg" />
        </div>
      </div>
    </div>
  )
}

export default LoadingState
