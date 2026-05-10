import { useMemo } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/useAuth'

export function useTenantTheme() {
  const { theme, loading, isCustomized } = useTheme()
  const { user } = useAuth()

  const tenantData = useMemo(() => ({
    companyId: user?.company_id || null,
    companyName: theme.companyName || user?.company_name || 'Barbearia',
    logoUrl: theme.logoUrl || null,
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    accentColor: theme.accentColor,
    wallpaperUrl: theme.wallpaperUrl || null,
    onboardingCompleted: theme.onboardingCompleted,
    setupProgress: theme.setupProgress || 0,
    isCustomized
  }), [theme, user, isCustomized])

  const branding = useMemo(() => ({
    hasLogo: Boolean(tenantData.logoUrl),
    hasCustomColors: tenantData.primaryColor !== '#a3ff12',
    hasWallpaper: Boolean(tenantData.wallpaperUrl),
    brandColor: tenantData.primaryColor,
    brandName: tenantData.companyName
  }), [tenantData])

  return {
    ...tenantData,
    branding,
    loading
  }
}

export default useTenantTheme