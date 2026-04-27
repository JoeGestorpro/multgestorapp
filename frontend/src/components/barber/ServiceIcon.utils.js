export const SERVICE_ICON_OPTIONS = [
  { key: 'scissors', label: 'Tesoura', category: 'corte' },
  { key: 'clipper', label: 'Maquina', category: 'corte' },
  { key: 'beard', label: 'Barba', category: 'barba' },
  { key: 'scissors_beard', label: 'Tesoura + Barba', category: 'barba' },
  { key: 'eyebrow', label: 'Sobrancelha', category: 'estetica' },
  { key: 'sparkles', label: 'Luzes', category: 'coloracao' },
  { key: 'dropper', label: 'Pigmentacao', category: 'coloracao' },
  { key: 'droplet', label: 'Hidratacao', category: 'estetica' },
  { key: 'comb', label: 'Alisamento', category: 'outros' },
  { key: 'flask', label: 'Quimica', category: 'coloracao' },
  { key: 'waves', label: 'Relaxamento', category: 'coloracao' },
  { key: 'razor', label: 'Pezinho', category: 'corte' },
  { key: 'hair', label: 'Cabelo', category: 'corte' },
  { key: 'dryer', label: 'Finalizacao', category: 'corte' },
  { key: 'jar', label: 'Tratamento', category: 'estetica' },
  { key: 'hands', label: 'Massagem', category: 'estetica' },
  { key: 'face', label: 'Limpeza de pele', category: 'estetica' },
  { key: 'more', label: 'Outros', category: 'outros' }
]

export function inferServiceIcon(serviceName) {
  const name = String(serviceName || '').toLowerCase()

  if (name.includes('barba')) return 'beard'
  if (name.includes('sobrancelha')) return 'eyebrow'
  if (name.includes('luz') || name.includes('luzes')) return 'sparkles'
  if (name.includes('pigment')) return 'dropper'
  if (name.includes('hidrata')) return 'droplet'
  if (name.includes('alisa')) return 'comb'
  if (name.includes('quim')) return 'flask'
  if (name.includes('relax')) return 'waves'
  if (name.includes('pezinho')) return 'razor'
  if (name.includes('degrad')) return 'clipper'
  if (name.includes('maquina')) return 'clipper'
  if (name.includes('corte')) return 'scissors'

  return 'more'
}

export function normalizeServiceIcon(icon, serviceName) {
  const normalized = String(icon || '').trim().toLowerCase()
  const exists = SERVICE_ICON_OPTIONS.some((option) => option.key === normalized)

  if (exists) {
    return normalized
  }

  const inferred = inferServiceIcon(serviceName)
  return inferred || 'scissors'
}
