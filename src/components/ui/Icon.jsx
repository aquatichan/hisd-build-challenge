import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChartColumn,
  Code,
  Cpu,
  Flag,
  Gift,
  GraduationCap,
  Handshake,
  Heart,
  Leaf,
  Lightbulb,
  MapPin,
  Menu,
  Pause,
  Play,
  Scissors,
  Search,
  Sparkles,
  Ticket,
  Trophy,
  Users,
  Video,
  Wrench,
  X,
} from 'lucide-react'

// One icon vocabulary for the whole site (lucide-react), addressed by meaning rather than by glyph name.
const ICONS = {
  ideate: Lightbulb,
  build: Wrench,
  share: Video,
  exhibit: Trophy,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  arrowUpRight: ArrowUpRight,
  search: Search,
  pause: Pause,
  play: Play,
  menu: Menu,
  close: X,
  pin: MapPin,
  users: Users,
  calendar: CalendarDays,
  flag: Flag,
  school: GraduationCap,
  spark: Sparkles,
  leaf: Leaf,
  gear: Cpu,
  access: Accessibility,
  chart: ChartColumn,
  heart: Heart,
  code: Code,
  ticket: Ticket,
  gift: Gift,
  partners: Handshake,
  scissors: Scissors,
  bell: Bell,
}

export default function Icon({ name, size = 24, className = '', title, strokeWidth = 1.75 }) {
  // solid map pin (yellow body, ink outline + eye) used on the school map
  if (name === 'pinSolid')
    return (
      <MapPin
        size={size}
        className={`icon ${className}`}
        fill="currentColor"
        stroke="var(--ink)"
        strokeWidth={1.6}
        aria-hidden="true"
      />
    )
  const Glyph = ICONS[name]
  if (!Glyph) return null
  return (
    <Glyph
      size={size}
      strokeWidth={strokeWidth}
      className={`icon ${className}`}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? 'img' : undefined}
    />
  )
}
