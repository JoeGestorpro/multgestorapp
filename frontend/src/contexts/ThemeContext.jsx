import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const DEFAULT_THEME = {
  primaryColor: '#a3ff12',
  secondaryColor: '#0c1017',
  accentColor: '#7fe11e',
  logoUrl: null,
  wallpaperUrl: null,
  companyName: 'Barbearia',
  onboardingCompleted: false,
  setupProgress: 0,
  landingConfig: null
}

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  loading: true,
  updateTheme: async () => {},
  isCustomized: false
})

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)

  const fetchCompanyTheme = useCallback(async (token) => {
    try {
      const response = await api.get('/barber/company/theme', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = response.data?.data || {}
      return {
        primaryColor: data.primary_color || data.primaryColor || DEFAULT_THEME.primaryColor,
        secondaryColor: data.secondary_color || data.secondaryColor || DEFAULT_THEME.secondaryColor,
        accentColor: data.accent_color || data.accentColor || DEFAULT_THEME.accentColor,
        logoUrl: data.logo_url || data.logoUrl || null,
        wallpaperUrl: data.wallpaper_url || data.wallpaperUrl || null,
        companyName: data.company_name || data.companyName || DEFAULT_THEME.companyName,
        onboardingCompleted: data.onboarding_completed || data.onboardingCompleted || false,
        setupProgress: data.setup_progress || data.setupProgress || 0
      }
    } catch {
      return DEFAULT_THEME
    }
  }, [])

  const fetchLandingConfig = useCallback(async (token) => {
    try {
      const response = await api.get('/barber/booking/landing', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data?.success && response.data?.data) {
        return response.data.data
      }
      return null
    } catch {
      return null
    }
  }, [])

  const applyThemeToDOM = useCallback((themeData, landingConfig = null) => {
    const root = document.documentElement
    root.style.setProperty('--theme-primary', themeData.primaryColor)
    root.style.setProperty('--theme-secondary', themeData.secondaryColor)
    root.style.setProperty('--theme-accent', themeData.accentColor)
    root.style.setProperty('--theme-glow', `${themeData.primaryColor}33`)
    root.style.setProperty('--theme-border', `${themeData.primaryColor}33`)
    root.style.setProperty('--theme-muted', `${themeData.primaryColor}1a`)
    
    if (themeData.wallpaperUrl) {
      root.style.setProperty('--theme-wallpaper', `url(${themeData.wallpaperUrl})`)
    }

    if (landingConfig) {
      root.style.setProperty('--bf-accent', landingConfig.booking_primary_color || themeData.primaryColor)
      root.style.setProperty('--bf-accent-hover', landingConfig.booking_primary_color ? 
        adjustColorBrightness(landingConfig.booking_primary_color, -15) : 
        adjustColorBrightness(themeData.primaryColor, -15))
      root.style.setProperty('--bf-accent-subtle', (landingConfig.booking_primary_color || themeData.primaryColor) + '1a')
      root.style.setProperty('--bf-border-accent', (landingConfig.booking_primary_color || themeData.primaryColor) + '33')
    }
  }, [])

  function adjustColorBrightness(hex, amount) {
    if (!hex || typeof hex !== 'string') return hex
    const num = parseInt(hex.replace('#', ''), 16)
    if (Number.isNaN(num)) return hex
    const r = Math.max(0, Math.min(255, (num >> 16) + amount))
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount))
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  const loadTheme = useCallback(async () => {
    const barberToken = localStorage.getItem('auth_token_barber') || 
                        sessionStorage.getItem('auth_token_barber')
    
    if (!barberToken) {
      setLoading(false)
      return
    }

    const [fetchedTheme, landingConfig] = await Promise.all([
      fetchCompanyTheme(barberToken),
      fetchLandingConfig(barberToken)
    ])

    const fullTheme = {
      ...fetchedTheme,
      landingConfig
    }
    
    setTheme(fullTheme)
    applyThemeToDOM(fetchedTheme, landingConfig)
    setLoading(false)
  }, [fetchCompanyTheme, fetchLandingConfig, applyThemeToDOM])

  useEffect(() => {
    loadTheme()
  }, [loadTheme])

  const updateTheme = useCallback(async (updates) => {
    const barberToken = localStorage.getItem('auth_token_barber') || 
                        sessionStorage.getItem('auth_token_barber')
    
    if (!barberToken) return

    try {
      await api.put('/barber/company/theme', updates, {
        headers: { Authorization: `Bearer ${barberToken}` }
      })
      
      const newTheme = { ...theme, ...updates }
      setTheme(newTheme)
      applyThemeToDOM(newTheme)
    } catch (error) {
      console.error('Erro ao atualizar tema:', error)
      throw error
    }
  }, [theme, applyThemeToDOM])

  const isCustomized = useMemo(() => {
    return theme.logoUrl || 
           theme.primaryColor !== DEFAULT_THEME.primaryColor ||
           theme.companyName !== DEFAULT_THEME.companyName
  }, [theme])

  const value = useMemo(() => ({
    theme,
    loading,
    updateTheme,
    isCustomized,
    resetTheme: () => {
      setTheme(DEFAULT_THEME)
      applyThemeToDOM(DEFAULT_THEME)
    }
  }), [theme, loading, updateTheme, isCustomized, applyThemeToDOM])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export default ThemeContext