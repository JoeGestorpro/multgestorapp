function BookingLandingAbout({ company }) {
  return (
    <section className="booking-about">
      <div className="booking-about-quote" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21c3 0 5-2 5-5V7H3v7c0 2 2 3 4 3m10 0c3 0 5-2 5-5V7h-5v7c0 2 2 3 4 3" />
        </svg>
      </div>
      <h2>Sobre a barbearia</h2>
      <p>{company.description}</p>
    </section>
  )
}

export default BookingLandingAbout
