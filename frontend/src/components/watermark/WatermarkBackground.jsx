import { useState, useMemo } from 'react'
import { Scissors } from 'lucide-react'
import './WatermarkBackground.css'

export default function WatermarkBackground({ logoUrl, companyName }) {
  const [imgError, setImgError] = useState(false)
  const hasLogo = Boolean(logoUrl) && !imgError

  const initials = useMemo(() => {
    if (!companyName) return 'BG'
    return companyName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [companyName])

  return (
    <div className="ds-watermark" aria-hidden="true">
      {hasLogo ? (
        <img
          className="ds-watermark__img"
          src={logoUrl}
          alt=""
          draggable={false}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="ds-watermark__text">{initials}</div>
      )}
      <div className="ds-watermark__icon">
        <Scissors size={24} />
      </div>
    </div>
  )
}
