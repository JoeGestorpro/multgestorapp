export const BADGES = {
  founder: {
    id: 'founder',
    name: 'Fundador',
    description: 'Completou a configuração inicial',
    icon: '🎉',
    color: '#FFD700',
    tier: 'gold'
  },
  firstSale: {
    id: 'firstSale',
    name: 'Primeiro Passo',
    description: 'Registrou o primeiro atendimento',
    icon: '🚀',
    color: '#22c55e',
    tier: 'bronze'
  },
  consistent: {
    id: 'consistent',
    name: 'No Ritmo',
    description: '7 dias consecutivos de uso',
    icon: '🔥',
    color: '#f97316',
    tier: 'silver'
  },
  earner100: {
    id: 'earner100',
    name: 'Contador',
    description: 'Primeiro R$1.000 em vendas',
    icon: '💰',
    color: '#22c55e',
    tier: 'bronze'
  },
  teamBuilder: {
    id: 'teamBuilder',
    name: 'Expansão',
    description: '5 colaboradores na equipe',
    icon: '👥',
    color: '#a855f7',
    tier: 'silver'
  },
  professional25: {
    id: 'professional25',
    name: 'Expert',
    description: '25 atendimentos registrados',
    icon: '⭐',
    color: '#eab308',
    tier: 'bronze'
  },
  star100: {
    id: 'star100',
    name: 'Excelência',
    description: '100 atendimentos registrados',
    icon: '🏆',
    color: '#FFD700',
    tier: 'gold'
  },
  veteran: {
    id: 'veteran',
    name: 'Veterano',
    description: '1 ano usando o BarberGestor',
    icon: '🎖️',
    color: '#FFD700',
    tier: 'gold'
  },
  earlyBird: {
    id: 'earlyBird',
    name: 'Early Bird',
    description: 'among os primeiros usuários',
    icon: '🐦',
    color: '#3b82f6',
    tier: 'bronze'
  }
}

export const TIERS = {
  bronze: { name: 'Bronze', minBadges: 1 },
  silver: { name: 'Prata', minBadges: 3 },
  gold: { name: 'Ouro', minBadges: 5 }
}

export function getUserTier(earnedBadges) {
  const count = earnedBadges?.length || 0
  if (count >= 5) return TIERS.gold
  if (count >= 3) return TIERS.silver
  return TIERS.bronze
}

export function checkBadgeUnlock(earnedBadges, badgeId) {
  return earnedBadges?.some(b => b.id === badgeId || b === badgeId)
}