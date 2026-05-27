import { normalizeServiceIcon, ICON_MAP, getServiceColor } from './ServiceIcon.utils'
import {
  Scissors, Zap, CircleDot, Eye, Sparkles,
  Pipette, Droplets, Waves, Eraser, Wind,
  Fan, Package, Hand, Smile, MoreHorizontal,
  Crown, Baby, Gem, Heart, Leaf, Star,
  GitMerge, Flame, Shield, Sparkle
} from 'lucide-react'

const ICON_COMPONENTS = {
  scissors: Scissors,
  zap: Zap,
  circle_dot: CircleDot,
  eye: Eye,
  sparkles: Sparkles,
  pipette: Pipette,
  droplets: Droplets,
  waves: Waves,
  eraser: Eraser,
  wind: Wind,
  fan: Fan,
  package: Package,
  hand: Hand,
  smile: Smile,
  more_horizontal: MoreHorizontal,
  crown: Crown,
  baby: Baby,
  gem: Gem,
  heart: Heart,
  leaf: Leaf,
  star: Star,
  flame: Flame,
  shield: Shield,
  sparkle: Sparkle,
  git_merge: GitMerge
}

function ServiceIcon({ icon, serviceName, size = 24, className = '', showColor = true }) {
  const resolvedIcon = normalizeServiceIcon(icon, serviceName)
  const IconComponent = ICON_COMPONENTS[resolvedIcon] || Scissors

  const color = showColor && serviceName ? getServiceColor({ icon, name: serviceName }) : 'currentColor'

  const classes = ['barber-service-symbol', className].filter(Boolean).join(' ')

  return (
    <IconComponent
      aria-hidden="true"
      className={classes}
      color={color}
      size={size}
      strokeWidth={2}
    />
  )
}

export default ServiceIcon