import { useState, useEffect } from 'react'
import { BarberIcon } from '../../components/barber/BarberUI'
import BookingLandingHero from './BookingLandingHero'
import BookingLandingInfo from './BookingLandingInfo'
import BookingLandingAbout from './BookingLandingAbout'
import BookingLandingDifferentials from './BookingLandingDifferentials'
import BookingLandingTeam from './BookingLandingTeam'
import BookingLandingGallery from './BookingLandingGallery'
import BookingBottomSheet from './BookingBottomSheet'
import BookingFAB from './BookingFAB'

function BookingMobileLayout({
  company,
  services,
  collaborators,
  settings,
  stepsChildren,
  flowState,
  onStartBooking,
  onGoBack,
}) {
  const [showBooking, setShowBooking] = useState(false)
  const [showFab, setShowFab] = useState(false)
  const isInFlow = flowState?.currentStep > 0 && showBooking
  const showSections = company?.show_sections || {}
  const buttonText = company?.button_text || 'Agendar Horario'
  const colors = company?.colors || {}
  const ctaBg = colors.primary || 'var(--bf-accent)'
  const ctaTextColor = colors.button_text || '#000000'

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY || window.pageYOffset
      setShowFab(scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function handleCtaClick() {
    setShowBooking(true)
    if (onStartBooking) onStartBooking()
  }

  function handleSheetClose() {
    setShowBooking(false)
    if (onGoBack) onGoBack()
  }

  function handleBack() {
    setShowBooking(false)
    if (onGoBack) onGoBack()
  }

  if (isInFlow && !showBooking) {
    return (
      <div className="booking-mobile-flow booking-mobile-enter">
        {stepsChildren}
      </div>
    )
  }

  return (
    <div className="booking-mobile-layout">
      {showSections.hero !== false && <BookingLandingHero company={company} onCtaClick={handleCtaClick} />}
      {showSections.info !== false && <><div className="booking-section-divider"><hr /></div><BookingLandingInfo company={company} onCtaClick={handleCtaClick} /></>}
      {showSections.about !== false && <><div className="booking-section-divider"><hr /></div><BookingLandingAbout company={company} /></>}
      {showSections.differentials !== false && <><div className="booking-section-divider"><hr /></div><BookingLandingDifferentials company={company} /></>}
      {showSections.team !== false && <><div className="booking-section-divider"><hr /></div><BookingLandingTeam collaborators={collaborators} /></>}
      {showSections.gallery === true && <><div className="booking-section-divider"><hr /></div><BookingLandingGallery company={company} /></>}
      <div className="booking-mobile-cta-bar">
        <button className="booking-hero-cta" onClick={handleCtaClick} type="button"
          style={{ background: ctaBg, color: ctaTextColor }}>
          <BarberIcon name="scissors" />
          <span>{buttonText}</span>
        </button>
      </div>

      <BookingFAB onClick={handleCtaClick} visible={showFab && !showBooking} />

      <BookingBottomSheet isOpen={showBooking} onClose={handleSheetClose}>
        {stepsChildren}
      </BookingBottomSheet>
    </div>
  )
}

export default BookingMobileLayout
