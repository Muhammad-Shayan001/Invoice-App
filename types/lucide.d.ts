declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react'

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number
    absoluteStrokeWidth?: boolean
    color?: string
    strokeWidth?: string | number
  }

  export type LucideIcon = ComponentType<LucideProps>

  export const Receipt: LucideIcon
  export const Users: LucideIcon
  export const LayoutDashboard: LucideIcon
  export const Settings: LucideIcon
  export const LogOut: LucideIcon
  export const Menu: LucideIcon
  export const DollarSign: LucideIcon
  export const Clock: LucideIcon
  export const AlertCircle: LucideIcon
  export const FileText: LucideIcon
  export const ArrowRight: LucideIcon
  export const TrendingUp: LucideIcon
  export const X: LucideIcon
  export const ChevronRight: LucideIcon
  export const Check: LucideIcon
  export const ChevronDown: LucideIcon
  export const ChevronUp: LucideIcon
}
