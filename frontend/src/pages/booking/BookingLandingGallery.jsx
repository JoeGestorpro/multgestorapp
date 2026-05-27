import { MOCK_GALLERY } from './BookingLanding.data'

function BookingLandingGallery({ images, company }) {
  const galleryImages = images || company?.gallery || []
  const gallery = galleryImages.length > 0 ? galleryImages : MOCK_GALLERY

  return (
    <section className="booking-gallery">
      <h2>Galeria</h2>
      <div className="booking-gallery-grid">
        {gallery.map((url, idx) => (
          <div key={idx} className="booking-gallery-item">
            <img
              src={url}
              alt={`Foto ${idx + 1} da barbearia`}
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>
    </section>
  )
}

export default BookingLandingGallery
