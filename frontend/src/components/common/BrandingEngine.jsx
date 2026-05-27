import { useEffect, useMemo } from 'react'

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return '163,255,18'
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return '163,255,18'
  const num = parseInt(clean, 16)
  if (Number.isNaN(num)) return '163,255,18'
  return `${(num >> 16) & 255},${(num >> 8) & 255},${num & 255}`
}

export default function BrandingEngine({ primaryColor, logoUrl, wallpaperUrl }) {
  const branding = useMemo(() => {
    const hasLogo = Boolean(logoUrl)
    const hasWallpaper = Boolean(wallpaperUrl)
    const hasCustomColor = primaryColor && primaryColor !== '#a3ff12'
    const hasBranding = hasLogo || hasWallpaper || hasCustomColor

    return {
      hasLogo,
      hasWallpaper,
      hasCustomColor,
      hasBranding,
      accentRgb: hexToRgb(primaryColor || '#a3ff12'),
      watermarkOpacity: hasWallpaper ? '0.02' : '0.035',
      glowIntensity: hasCustomColor ? '0.06' : '0.04',
      ambientBlend: hasWallpaper ? 'overlay' : 'normal'
    }
  }, [primaryColor, logoUrl, wallpaperUrl])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--brand-accent-rgb', branding.accentRgb)
    root.style.setProperty('--brand-watermark-opacity', branding.watermarkOpacity)
    root.style.setProperty('--brand-glow-intensity', branding.glowIntensity)
    root.style.setProperty('--brand-ambient-blend', branding.ambientBlend)

    root.classList.toggle('brand-has-logo', branding.hasLogo)
    root.classList.toggle('brand-has-wallpaper', branding.hasWallpaper)
    root.classList.toggle('brand-has-custom-color', branding.hasCustomColor)
    root.classList.toggle('brand-has-any', branding.hasBranding)
  }, [branding])

  return null
}
