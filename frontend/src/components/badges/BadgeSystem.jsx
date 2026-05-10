import { useMemo } from 'react'
import { BADGES, getUserTier, TIERS } from './BadgeDefinitions'
import BadgeCard from './BadgeCard'
import { useTenantTheme } from '../../hooks/useTenantTheme'
import './BadgeSystem.css'

export function BadgeGrid({ earnedBadges = [], compact = false, onBadgeClick }) {
  const earnedIds = useMemo(() => 
    new Set(earnedBadges.map(b => typeof b === 'string' ? b : b.id)),
    [earnedBadges]
  )

  return (
    <div className={`badge-grid ${compact ? 'badge-grid--compact' : ''}`}>
      {Object.values(BADGES).map(badge => (
        <BadgeCard
          key={badge.id}
          badge={badge}
          earned={earnedIds.has(badge.id)}
          compact={compact}
          onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
        />
      ))}
    </div>
  )
}

export default function BadgeSystem({ earnedBadges = [], showTier = true, compact = false }) {
  const { primaryColor } = useTenantTheme()
  const earnedIds = useMemo(() => 
    new Set(earnedBadges.map(b => typeof b === 'string' ? b : b.id)),
    [earnedBadges]
  )
  
  const tier = useMemo(() => getUserTier(earnedBadges), [earnedBadges])
  const earnedCount = earnedIds.size
  const totalCount = Object.keys(BADGES).length

  const tierProgress = useMemo(() => {
    const nextTier = tier === TIERS.bronze ? TIERS.silver : tier === TIERS.silver ? TIERS.gold : null
    if (!nextTier) return 100
    
    const required = nextTier.minBadges
    return Math.min(100, (earnedCount / required) * 100)
  }, [tier, earnedCount])

  return (
    <div className="badge-system">
      {showTier && (
        <div className="badge-system__tier" style={{ '--tier-color': tier.color || primaryColor }}>
          <div className="badge-system__tier-header">
            <span className="badge-system__tier-name">{tier.name}</span>
            <span className="badge-system__tier-progress">
              {earnedCount}/{totalCount} badges
            </span>
          </div>
          <div className="badge-system__tier-bar">
            <div 
              className="badge-system__tier-fill"
              style={{ width: `${tierProgress}%` }}
            />
          </div>
          {tier !== TIERS.gold && (
            <p className="badge-system__tier-hint">
              Faltam {TIERS[tier.id === 'gold' ? 'gold' : tier.id === 'silver' ? 'gold' : 'silver'].minBadges - earnedCount} badges para o próximo nível
            </p>
          )}
        </div>
      )}

      <BadgeGrid 
        earnedBadges={earnedBadges} 
        compact={compact}
      />
    </div>
  )
}