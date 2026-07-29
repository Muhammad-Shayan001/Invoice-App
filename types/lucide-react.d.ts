import type { FC, SVGProps } from 'react'

declare module 'lucide-react' {
  type LucideProps = SVGProps<SVGSVGElement> & {
    size?: number | string
    strokeWidth?: number | string
    absoluteStrokeWidth?: boolean
  }
  type LucideIcon = FC<LucideProps>

  // A
  export const AlertCircle: LucideIcon
  export const AlertTriangle: LucideIcon
  export const ArrowLeft: LucideIcon
  export const ArrowRight: LucideIcon
  export const ArrowUpDown: LucideIcon

  // B
  export const BarChart: LucideIcon
  export const BarChart3: LucideIcon
  export const Building2: LucideIcon

  // C
  export const Calculator: LucideIcon
  export const Calendar: LucideIcon
  export const Check: LucideIcon
  export const CheckCircle: LucideIcon
  export const ChevronDown: LucideIcon
  export const ChevronRight: LucideIcon
  export const Clock: LucideIcon
  export const Command: LucideIcon
  export const Copy: LucideIcon
  export const CreditCard: LucideIcon

  // D
  export const DollarSign: LucideIcon
  export const Download: LucideIcon

  // E
  export const ExternalLink: LucideIcon
  export const Eye: LucideIcon

  // F
  export const FileCheck: LucideIcon
  export const FileSpreadsheet: LucideIcon
  export const FileText: LucideIcon
  export const Filter: LucideIcon

  // G
  export const Globe: LucideIcon

  // H
  export const Hash: LucideIcon
  export const HelpCircle: LucideIcon
  export const History: LucideIcon

  // I
  export const Info: LucideIcon

  // L
  export const LayoutDashboard: LucideIcon
  export const Loader2: LucideIcon
  export const Lock: LucideIcon
  export const LogOut: LucideIcon

  // M
  export const Mail: LucideIcon
  export const MapPin: LucideIcon
  export const Menu: LucideIcon
  export const Moon: LucideIcon

  // P
  export const Pencil: LucideIcon
  export const Percent: LucideIcon
  export const Phone: LucideIcon
  export const Play: LucideIcon
  export const Plus: LucideIcon
  export const Printer: LucideIcon

  // Q
  export const QrCode: LucideIcon

  // R
  export const Receipt: LucideIcon
  export const ReceiptText: LucideIcon
  export const RefreshCw: LucideIcon

  // S
  export const Scale: LucideIcon
  export const Search: LucideIcon
  export const Send: LucideIcon
  export const Settings: LucideIcon
  export const Share2: LucideIcon
  export const Shield: LucideIcon
  export const ShieldCheck: LucideIcon
  export const Sparkles: LucideIcon
  export const Square: LucideIcon
  export const Sun: LucideIcon

  // T
  export const Tag: LucideIcon
  export const Trash2: LucideIcon
  export const TrendingDown: LucideIcon
  export const TrendingUp: LucideIcon

  // U
  export const User: LucideIcon
  export const UserPlus: LucideIcon
  export const Users: LucideIcon

  // W
  export const Wrench: LucideIcon

  // X
  export const X: LucideIcon
  export const XCircle: LucideIcon

  // Z
  export const Zap: LucideIcon
}
