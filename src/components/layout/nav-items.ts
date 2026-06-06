import type { LucideIcon } from 'lucide-react'
import { Timer, ListChecks, FolderKanban, Users, BarChart3 } from 'lucide-react'

export interface NavItem {
  label: string
  icon: LucideIcon
  to: string
  disabled?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Timer', icon: Timer, to: '/', disabled: false },
  { label: 'Entries', icon: ListChecks, to: '/entries', disabled: false },
  { label: 'Projects', icon: FolderKanban, to: '/projects', disabled: true },
  { label: 'Team', icon: Users, to: '/team', disabled: true },
  { label: 'Reports', icon: BarChart3, to: '/reports', disabled: true },
]
