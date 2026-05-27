import { BarberIcon } from '../../components/barber/BarberUI'

function BookingLandingTeam({ collaborators }) {
  if (!collaborators || collaborators.length === 0) return null

  return (
    <section className="booking-team">
      <h2>Nossa equipe</h2>
      <div className="booking-team-grid">
        {collaborators.map((collab) => (
          <div key={collab.id} className="booking-team-card">
            <div className="booking-team-avatar">
              {collab.avatar_url ? (
                <img src={collab.avatar_url} alt={collab.name} loading="lazy" decoding="async" />
              ) : (
                <BarberIcon name="users" />
              )}
            </div>
            <strong>{collab.name || collab.nickname}</strong>
            {collab.nickname && collab.nickname !== collab.name && (
              <small>{collab.nickname}</small>
            )}
            <small>Profissional</small>
          </div>
        ))}
      </div>
    </section>
  )
}

export default BookingLandingTeam
