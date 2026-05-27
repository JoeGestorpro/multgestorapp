import { useState } from 'react'
import BookingLandingHero from './BookingLandingHero'
import BookingLandingInfo from './BookingLandingInfo'
import BookingLandingAbout from './BookingLandingAbout'
import BookingLandingDifferentials from './BookingLandingDifferentials'
import BookingLandingTeam from './BookingLandingTeam'
import BookingLandingGallery from './BookingLandingGallery'
import BookingSideCard from './BookingSideCard'

function BookingDesktopLayout({
  company,
  services,
  collaborators,
  settings,
  stepsChildren,
  flowState,
  onStartBooking,
}) {
  const [showBooking, setShowBooking] = useState(false)
  const showSections = company?.show_sections || {}
  const buttonText = company?.button_text || 'Agendar Horario'

  function handleCtaClick() {
    setShowBooking(true)
    if (onStartBooking) onStartBooking()
  }

  return (
    <div className="booking-desktop-layout">
      <div className="booking-landing">
        {showSections.hero !== false && <BookingLandingHero company={company} onCtaClick={handleCtaClick} />}
        {showSections.info !== false && <><div className="booking-section-divider"><hr /></div><BookingLandingInfo company={company} onCtaClick={handleCtaClick} /></>}
        {showSections.about !== false && <><div className="booking-section-divider"><hr /></div><BookingLandingAbout company={company} /></>}
        {showSections.differentials !== false && <><div className="booking-section-divider"><hr /></div><BookingLandingDifferentials company={company} /></>}
        {showSections.team !== false && <><div className="booking-section-divider"><hr /></div><BookingLandingTeam collaborators={collaborators} /></>}
        {showSections.gallery === true && <><div className="booking-section-divider"><hr /></div><BookingLandingGallery company={company} /></>}
      </div>

      <BookingSideCard
        activeStep={flowState?.currentStep}
        onStart={handleCtaClick}
        showBooking={showBooking}
        buttonText={buttonText}
        company={company}
      >
        {stepsChildren}
      </BookingSideCard>
    </div>
  )
}

export default BookingDesktopLayout
