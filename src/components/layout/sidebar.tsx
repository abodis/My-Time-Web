import { Timer, FolderKanban, Users, BarChart3 } from "lucide-react"

const navItems = [
  { label: "Timer", icon: Timer },
  { label: "Projects", icon: FolderKanban },
  { label: "Team", icon: Users },
  { label: "Reports", icon: BarChart3 },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 flex-col border-r border-surface-border bg-surface">
      <div className="flex items-center gap-2 px-4 py-4">
        <img
          src="/myTimeBlocks-LOGO-50px.png"
          alt="My Time Blocks"
          className="h-8 w-8"
        />
        <span className="text-sm font-semibold text-text">My Time Blocks</span>
      </div>

      <nav className="flex-1 px-2 py-2">
        {navItems.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-text-muted cursor-not-allowed opacity-60"
            title="Coming soon"
          >
            <Icon className="h-5 w-5" />
            <span className="text-sm">{label}</span>
          </div>
        ))}
      </nav>
    </aside>
  )
}
