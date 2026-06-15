import type { LucideIcon } from 'lucide-react'
import { Timer, ListChecks, FolderKanban, Users, BarChart3 } from 'lucide-react'

export interface NavItem {
  label: string
  icon: LucideIcon
  to: string
  disabled?: boolean
  /** Hide from mobile/tablet nav bar; show only at desktop breakpoint (≥1024px) */
  desktopOnly?: boolean
  /** Minimum role required to see this nav item. Role hierarchy: user < manager < admin */
  minRole?: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Timer', icon: Timer, to: '/', disabled: false },
  { label: 'Entries', icon: ListChecks, to: '/entries', disabled: false },
  { label: 'Projects', icon: FolderKanban, to: '/projects', disabled: false, desktopOnly: true },
  { label: 'Team', icon: Users, to: '/team', minRole: 'manager', desktopOnly: true },
  { label: 'Reports', icon: BarChart3, to: '/reports', disabled: true, desktopOnly: true },
]
