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
  setupProgress: 0
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

  const applyThemeToDOM = useCallback((themeData) => {
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
  }, [])

  const loadTheme = useCallback(async () => {
    const barberToken = localStorage.getItem('auth_token_barber') || 
                        sessionStorage.getItem('auth_token_barber')
    
    if (!barberToken) {
      setLoading(false)
      return
    }

    const fetchedTheme = await fetchCompanyTheme(barberToken)
    setTheme(fetchedTheme)
    applyThemeToDOM(fetchedTheme)
    setLoading(false)
  }, [fetchCompanyTheme, applyThemeToDOM])

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