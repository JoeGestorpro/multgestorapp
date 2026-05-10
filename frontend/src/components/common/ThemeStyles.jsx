import { useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

export default function ThemeStyles() {
  const { theme, loading } = useTheme()

  useEffect(() => {
    if (loading) return

    const root = document.documentElement
    root.style.setProperty('--theme-primary', theme.primaryColor)
    root.style.setProperty('--theme-secondary', theme.secondaryColor)
    root.style.setProperty('--theme-accent', theme.accentColor)
    root.style.setProperty('--theme-glow', `${theme.primaryColor}33`)
    root.style.setProperty('--theme-border', `${theme.primaryColor}33`)
    root.style.setProperty('--theme-muted', `${theme.primaryColor}1a`)

    if (theme.wallpaperUrl) {
      root.style.setProperty('--theme-wallpaper', `url(${theme.wallpaperUrl})`)
      document.body.classList.add('has-wallpaper')
    } else {
      root.style.setProperty('--theme-wallpaper', 'none')
      document.body.classList.remove('has-wallpaper')
    }
  }, [theme, loading])

  return null
}