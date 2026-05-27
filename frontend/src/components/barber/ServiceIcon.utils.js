import {
  Scissors, Zap, CircleDot, Eye, Sparkles,
  Pipette, Droplets, Waves, Eraser, Wind,
  Fan, Package, Hand, Smile, MoreHorizontal,
  Crown, Baby, Gem, Heart, Leaf, Star,
  GitMerge, Flame, Shield, Sparkle
} from 'lucide-react'

export const SERVICE_CATEGORIES = {
  corte: { label: 'Corte', color: '#8cff4f', colorVar: 'var(--cat-corte)' },
  barba: { label: 'Barba', color: '#f4c86c', colorVar: 'var(--cat-barba)' },
  combo: { label: 'Combo', color: '#a78bfa', colorVar: 'var(--cat-combo)' },
  estetica: { label: 'Estetica', color: '#5ca8ff', colorVar: 'var(--cat-estetica)' },
  coloracao: { label: 'Coloracao', color: '#a78bfa', colorVar: 'var(--cat-estetica)' },
  quimica: { label: 'Quimica', color: '#fb7185', colorVar: 'var(--cat-quimica)' },
  infantil: { label: 'Infantil', color: '#34d399', colorVar: 'var(--cat-infantil)' },
  premium: { label: 'Premium', color: '#f4c86c', colorVar: 'var(--cat-premium)' },
  spa: { label: 'Spa', color: '#c084fc', colorVar: 'var(--cat-spa)' },
  outros: { label: 'Outros', color: '#94a3b8', colorVar: 'var(--cat-outros)' }
}

export const ICON_MAP = {
  scissors: { component: Scissors, category: 'corte' },
  clipper: { component: Zap, category: 'corte' },
  zap: { component: Zap, category: 'corte' },
  beard: { component: CircleDot, category: 'barba' },
  razor: { component: Eraser, category: 'barba' },
  scissors_beard: { component: GitMerge, category: 'combo' },
  eyebrow: { component: Eye, category: 'estetica' },
  sparkles: { component: Sparkles, category: 'corte' },
  dropper: { component: Pipette, category: 'coloracao' },
  pipette: { component: Pipette, category: 'coloracao' },
  droplet: { component: Droplets, category: 'estetica' },
  droplets: { component: Droplets, category: 'estetica' },
  comb: { component: Waves, category: 'corte' },
  waves: { component: Waves, category: 'corte' },
  flask: { component: Package, category: 'quimica' },
  flask_conical: { component: Package, category: 'quimica' },
  hair: { component: Wind, category: 'corte' },
  wind: { component: Wind, category: 'corte' },
  dryer: { component: Fan, category: 'corte' },
  fan: { component: Fan, category: 'corte' },
  jar: { component: Package, category: 'estetica' },
  hands: { component: Hand, category: 'estetica' },
  hand: { component: Hand, category: 'estetica' },
  face: { component: Smile, category: 'estetica' },
  smile: { component: Smile, category: 'estetica' },
  more: { component: MoreHorizontal, category: 'outros' },
  more_horizontal: { component: MoreHorizontal, category: 'outros' },
  crown: { component: Crown, category: 'premium' },
  baby: { component: Baby, category: 'infantil' },
  gem: { component: Gem, category: 'premium' },
  heart: { component: Heart, category: 'spa' },
  leaf: { component: Leaf, category: 'estetica' },
  star: { component: Star, category: 'premium' },
  flame: { component: Flame, category: 'corte' },
  shield: { component: Shield, category: 'premium' },
  sparkle: { component: Sparkle, category: 'estetica' }
}

export const SERVICE_ICON_OPTIONS = [
  { key: 'scissors', label: 'Tesoura', category: 'corte' },
  { key: 'zap', label: 'Maquina', category: 'corte' },
  { key: 'flame', label: 'Fade', category: 'corte' },
  { key: 'sparkles', label: 'Degradê', category: 'corte' },
  { key: 'wind', label: 'Cabelo', category: 'corte' },
  { key: 'fan', label: 'Secagem', category: 'corte' },
  { key: 'waves', label: 'Alisamento', category: 'corte' },
  { key: 'eraser', label: 'Pezinho', category: 'barba' },
  { key: 'circle_dot', label: 'Barba', category: 'barba' },
  { key: 'git_merge', label: 'Tesoura+Barba', category: 'combo' },
  { key: 'sparkle', label: 'Combo', category: 'combo' },
  { key: 'package', label: 'Pacote', category: 'combo' },
  { key: 'eye', label: 'Sobrancelha', category: 'estetica' },
  { key: 'droplets', label: 'Hidratação', category: 'estetica' },
  { key: 'hand', label: 'Massagem', category: 'estetica' },
  { key: 'smile', label: 'Limpeza', category: 'estetica' },
  { key: 'gem', label: 'Estética', category: 'estetica' },
  { key: 'pipette', label: 'Pigmentação', category: 'coloracao' },
  { key: 'heart', label: 'Spa', category: 'spa' },
  { key: 'crown', label: 'VIP', category: 'premium' },
  { key: 'star', label: 'Premium', category: 'premium' },
  { key: 'shield', label: 'Especial', category: 'premium' },
  { key: 'baby', label: 'Infantil', category: 'infantil' },
  { key: 'leaf', label: 'Natural', category: 'estetica' },
  { key: 'more_horizontal', label: 'Outros', category: 'outros' }
]

export function inferServiceIcon(serviceName) {
  const name = String(serviceName || '').toLowerCase()

  if (name.includes('barba')) return 'circle_dot'
  if (name.includes('sobrancelha')) return 'eye'
  if (name.includes('luz') || name.includes('luzes')) return 'sparkles'
  if (name.includes('pigment')) return 'pipette'
  if (name.includes('hidrata')) return 'droplets'
  if (name.includes('alisa')) return 'waves'
  if (name.includes('quim')) return 'package'
  if (name.includes('relax')) return 'waves'
  if (name.includes('pezinho')) return 'eraser'
  if (name.includes('degrad')) return 'sparkles'
  if (name.includes('maquina') || name.includes('máquina')) return 'zap'
  if (name.includes('fade')) return 'flame'
  if (name.includes('corte')) return 'scissors'
  if (name.includes('combo') || name.includes('corte e barba')) return 'git_merge'
  if (name.includes('vip') || name.includes('premium')) return 'crown'
  if (name.includes('infantil') || name.includes('criança')) return 'baby'
  if (name.includes('spa') || name.includes('bem-estar')) return 'heart'
  if (name.includes('massagem')) return 'hand'
  if (name.includes('limpeza')) return 'smile'

  return 'scissors'
}

export function normalizeServiceIcon(icon, serviceName) {
  const normalized = String(icon || '').trim().toLowerCase()

  if (ICON_MAP[normalized]) {
    return normalized
  }

  const legacyMap = {
    'clipper': 'zap',
    'beard': 'circle_dot',
    'scissors_beard': 'git_merge',
    'dropper': 'pipette',
    'droplet': 'droplets',
    'comb': 'waves',
    'flask': 'package',
    'hair': 'wind',
    'dryer': 'fan',
    'jar': 'package',
    'hands': 'hand',
    'face': 'smile',
    'more': 'more_horizontal'
  }

  const mapped = legacyMap[normalized]
  if (mapped && ICON_MAP[mapped]) {
    return mapped
  }

  const inferred = inferServiceIcon(serviceName)
  return inferred || 'scissors'
}

export function getServiceCategory(service) {
  const iconKey = normalizeServiceIcon(service.icon, service.name)
  const iconData = ICON_MAP[iconKey]

  if (iconData) {
    return iconData.category
  }

  return 'corte'
}

export function getCategoryConfig(category) {
  return SERVICE_CATEGORIES[category] || SERVICE_CATEGORIES.outros
}

export function getServiceColor(service) {
  const category = getServiceCategory(service)
  const config = getCategoryConfig(category)
  return config.color
}

export function getIconComponent(iconKey) {
  const normalized = normalizeServiceIcon(iconKey, '')
  const iconData = ICON_MAP[normalized]
  return iconData ? iconData.component : Scissors
}

export const SERVICE_TEMPLATES = [
  {
    id: 'corte',
    name: 'Corte',
    category: 'corte',
    icon: 'scissors',
    time: 45,
    price: 35,
    serviceType: 'service',
    keywords: ['corte', 'haircut', 'cut']
  },
  {
    id: 'degrade',
    name: 'Degradê',
    category: 'corte',
    icon: 'sparkles',
    time: 45,
    price: 40,
    serviceType: 'service',
    keywords: ['degradê', 'degrade', 'fade']
  },
  {
    id: 'barba',
    name: 'Barba',
    category: 'barba',
    icon: 'circle_dot',
    time: 30,
    price: 25,
    serviceType: 'service',
    keywords: ['barba', 'beard']
  },
  {
    id: 'barba_completa',
    name: 'Barba Completa',
    category: 'barba',
    icon: 'eraser',
    time: 40,
    price: 30,
    serviceType: 'service',
    keywords: ['barba completa', 'barba zero', 'barba total']
  },
  {
    id: 'combo_corte_barba',
    name: 'Corte + Barba',
    category: 'combo',
    icon: 'git_merge',
    time: 75,
    price: 55,
    serviceType: 'combo',
    keywords: ['corte e barba', 'combo', 'corte+barba', 'corte barba']
  },
  {
    id: 'combo_completo',
    name: 'Corte + Barba + Sobrancelha',
    category: 'combo',
    icon: 'sparkle',
    time: 90,
    price: 70,
    serviceType: 'combo',
    keywords: ['completo', 'combo completo', 'full']
  },
  {
    id: 'sobrancelha',
    name: 'Sobrancelha',
    category: 'estetica',
    icon: 'eye',
    time: 15,
    price: 15,
    serviceType: 'service',
    keywords: ['sobrancelha', 'eyebrow', 'sobrancela']
  },
  {
    id: 'pigmentacao',
    name: 'Pigmentação',
    category: 'coloracao',
    icon: 'pipette',
    time: 60,
    price: 80,
    serviceType: 'service',
    keywords: ['pigmentacao', 'pigmento', 'preenchimento', 'tattoo']
  },
  {
    id: 'corte_infantil',
    name: 'Corte Infantil',
    category: 'infantil',
    icon: 'baby',
    time: 30,
    price: 30,
    serviceType: 'service',
    keywords: ['infantil', 'crianca', 'kids', 'criança']
  },
  {
    id: 'hidratacao',
    name: 'Hidratação',
    category: 'estetica',
    icon: 'droplets',
    time: 45,
    price: 45,
    serviceType: 'service',
    keywords: ['hidratacao', 'hidrata', 'hydra']
  },
  {
    id: 'progressiva',
    name: 'Progressiva',
    category: 'quimica',
    icon: 'waves',
    time: 120,
    price: 120,
    serviceType: 'service',
    keywords: ['progressiva', 'alisamento', 'escova progressiva']
  },
  {
    id: 'luzes',
    name: 'Luzes',
    category: 'coloracao',
    icon: 'sparkles',
    time: 150,
    price: 150,
    serviceType: 'service',
    keywords: ['luzes', 'mechas', 'colors']
  },
  {
    id: 'vip',
    name: 'Serviço VIP',
    category: 'premium',
    icon: 'crown',
    time: 90,
    price: 100,
    serviceType: 'service',
    keywords: ['vip', 'premium', 'luxo', 'exclusive']
  },
  {
    id: 'pezinho',
    name: 'Pezinho',
    category: 'corte',
    icon: 'eraser',
    time: 15,
    price: 15,
    serviceType: 'service',
    keywords: ['pezinho', 'nuca', 'haircut foot']
  },
  {
    id: 'massagem',
    name: 'Massagem',
    category: 'spa',
    icon: 'hand',
    time: 20,
    price: 25,
    serviceType: 'service',
    keywords: ['massagem', 'massage']
  },
  {
    id: 'limpeza_pele',
    name: 'Limpeza de Pele',
    category: 'estetica',
    icon: 'smile',
    time: 60,
    price: 80,
    serviceType: 'service',
    keywords: ['limpeza', 'pele', 'facial', 'clean']
  }
]

export function inferCategory(serviceName) {
  const name = String(serviceName || '').toLowerCase()

  const categoryRules = [
    { keywords: ['barba', 'barba zero', 'barba completa'], category: 'barba' },
    { keywords: ['combo', 'corte e barba', 'corte+barba', 'corte barba'], category: 'combo' },
    { keywords: ['sobrancelha', 'limpeza', 'pele', 'hidratacao', 'massagem'], category: 'estetica' },
    { keywords: ['luz', 'luzes', 'mechas', 'coloracao', 'pigmentacao', 'tint', 'paint'], category: 'coloracao' },
    { keywords: ['quimica', 'progressiva', 'alisamento', 'relaxamento', 'botox'], category: 'quimica' },
    { keywords: ['infantil', 'infantil', 'crianca', 'kids'], category: 'infantil' },
    { keywords: ['vip', 'premium', 'luxo', 'exclusive'], category: 'premium' },
    { keywords: ['spa', 'bem-estar', 'relax'], category: 'spa' },
    { keywords: ['corte', 'degrade', 'fade', 'maquina', 'navalhado'], category: 'corte' }
  ]

  for (const rule of categoryRules) {
    for (const keyword of rule.keywords) {
      if (name.includes(keyword)) {
        return rule.category
      }
    }
  }

  return 'corte'
}

export function inferServiceType(serviceName) {
  const name = String(serviceName || '').toLowerCase()
  if (name.includes('combo') || name.includes('pacote') || name.includes('bundle')) {
    return 'combo'
  }
  return 'service'
}

export function getDefaultIconForCategory(category) {
  const categoryIconMap = {
    corte: 'scissors',
    barba: 'circle_dot',
    combo: 'sparkle',
    estetica: 'eye',
    coloracao: 'sparkles',
    quimica: 'waves',
    infantil: 'baby',
    premium: 'crown',
    spa: 'heart',
    outros: 'more_horizontal'
  }
  return categoryIconMap[category] || 'scissors'
}

export function findTemplate(name) {
  if (!name) return null
  const lowerName = name.toLowerCase().trim()

  for (const template of SERVICE_TEMPLATES) {
    if (template.name.toLowerCase() === lowerName) {
      return template
    }
    for (const keyword of template.keywords) {
      if (lowerName.includes(keyword)) {
        return template
      }
    }
  }

  return null
}

export function getSuggestions(name, limit = 4) {
  if (!name || name.length < 2) return []

  const lowerName = name.toLowerCase()
  const suggestions = []

  const variations = [
    name,
    name + ' Premium',
    name + ' Completo',
    name + ' Masculino',
    name + ' Feminino'
  ]

  for (const variant of variations) {
    const exists = SERVICE_TEMPLATES.some(t => t.name.toLowerCase() === variant.toLowerCase())
    if (exists && suggestions.length < limit) {
      const template = SERVICE_TEMPLATES.find(t => t.name.toLowerCase() === variant.toLowerCase())
      if (!suggestions.includes(template)) {
        suggestions.push(template)
      }
    }
  }

  for (const template of SERVICE_TEMPLATES) {
    if (template.name.toLowerCase().includes(lowerName) && suggestions.length < limit) {
      if (!suggestions.find(s => s.id === template.id)) {
        suggestions.push(template)
      }
    }
  }

  return suggestions.slice(0, limit)
}

export function getDuplicateFormData(service) {
  return {
    name: `${service.name} (Copia)`,
    description: service.description || '',
    price: service.price || '',
    icon: service.icon || 'scissors',
    serviceType: service.serviceType || 'service',
    commissionType: service.commissionType || 'percentage',
    commissionValue: service.commissionValue || '',
    estimatedTimeMinutes: service.estimatedTimeMinutes || service.estimated_time_minutes || '',
    isActive: true
  }
}