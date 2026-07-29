declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react'

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number
    absoluteStrokeWidth?: boolean
    color?: string
    strokeWidth?: string | number
  }

  export type LucideIcon = ComponentType<LucideProps>

  // Navigation
  export const Receipt: LucideIcon
  export const LayoutDashboard: LucideIcon
  export const Users: LucideIcon
  export const Settings: LucideIcon
  export const LogOut: LucideIcon
  export const Menu: LucideIcon

  // Actions
  export const Plus: LucideIcon
  export const Pencil: LucideIcon
  export const Trash2: LucideIcon
  export const Search: LucideIcon
  export const Send: LucideIcon
  export const Download: LucideIcon
  export const Eye: LucideIcon
  export const Upload: LucideIcon
  export const Edit: LucideIcon
  export const ArrowLeft: LucideIcon
  export const ArrowRight: LucideIcon
  export const ExternalLink: LucideIcon
  export const Copy: LucideIcon
  export const RefreshCw: LucideIcon
  export const Lock: LucideIcon
  export const Unlock: LucideIcon

  // Status / Icons
  export const CheckCircle: LucideIcon
  export const XCircle: LucideIcon
  export const AlertCircle: LucideIcon
  export const AlertTriangle: LucideIcon
  export const Info: LucideIcon
  export const Check: LucideIcon
  export const X: LucideIcon
  export const Clock: LucideIcon
  export const DollarSign: LucideIcon
  export const TrendingUp: LucideIcon
  export const TrendingDown: LucideIcon
  export const BarChart2: LucideIcon
  export const FileText: LucideIcon
  export const FileCheck: LucideIcon
  export const Building: LucideIcon
  export const Building2: LucideIcon
  export const Phone: LucideIcon
  export const Mail: LucideIcon
  export const MapPin: LucideIcon
  export const Calendar: LucideIcon
  export const Hash: LucideIcon
  export const User: LucideIcon
  export const UserPlus: LucideIcon
  export const Filter: LucideIcon
  export const SortAsc: LucideIcon
  export const SortDesc: LucideIcon
  export const ChevronDown: LucideIcon
  export const ChevronRight: LucideIcon
  export const ChevronLeft: LucideIcon
  export const ChevronUp: LucideIcon
  export const Loader2: LucideIcon
  export const Sparkles: LucideIcon
  export const Zap: LucideIcon
  export const Shield: LucideIcon
  export const Star: LucideIcon
  export const Globe: LucideIcon
  export const Package: LucideIcon
  export const MoreVertical: LucideIcon
  export const MoreHorizontal: LucideIcon
  export const Briefcase: LucideIcon
  export const CreditCard: LucideIcon
  export const Wallet: LucideIcon
}
