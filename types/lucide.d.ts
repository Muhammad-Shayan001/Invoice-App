declare module 'lucide-react' {
  import { FC, SVGProps } from 'react'
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: string | number
    absoluteStrokeWidth?: boolean
  }
  export type Icon = FC<IconProps>
  
  export const Receipt: Icon
  export const Users: Icon
  export const LayoutDashboard: Icon
  export const Settings: Icon
  export const LogOut: Icon
  export const Menu: Icon
  export const ArrowRight: Icon
  export const TrendingUp: Icon
  export const DollarSign: Icon
  export const Clock: Icon
  export const AlertCircle: Icon
  export const FileText: Icon
  export const XIcon: Icon
  // add any other icons used
}
