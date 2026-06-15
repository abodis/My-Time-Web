import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { NAV_ITEMS, type NavItem } from '@/components/layout/nav-items'
import { useProfile } from '@/hooks/use-profile'
import { clearAuth } from '@/lib/auth'
import { getGravatarUrl } from '@/lib/gravatar'

const ROLE_HIERARCHY = ['user', 'manager', 'admin'] as const

function isRoleAtLeast(userRole: string, minRole: string): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole as (typeof ROLE_HIERARCHY)[number])
  const minIndex = ROLE_HIERARCHY.indexOf(minRole as (typeof ROLE_HIERARCHY)[number])
  return userIndex >= minIndex
}

function filterNavItems(items: NavItem[], userRole: string | undefined): NavItem[] {
  return items.filter((item) => {
    if (!item.minRole) return true
    if (!userRole) return false
    return isRoleAtLeast(userRole, item.minRole)
  })
}

export function PillNav(): JSX.Element {
  const navigate = useNavigate()
  const { data: profile } = useProfile()

  const visibleItems = filterNavItems(NAV_ITEMS, profile?.role)

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  const gravatarUrl = profile?.email ? getGravatarUrl(profile.email) : null

  return (
    <>
      {/* Desktop: vertical floating card (≥1440px) */}
      <nav
        className="hidden wide:flex fixed top-6 -translate-x-1/2 wide:left-[calc((100vw-1200px)/2+150px)] ultrawide:left-[calc((100vw-1440px)/2+180px)] z-50 w-[252px] flex-col gap-1 rounded-2xl bg-white p-3 shadow-lg"
        aria-label="Main navigation"
      >
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            aria-disabled={item.disabled}
            tabIndex={item.disabled ? -1 : undefined}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                item.disabled && 'opacity-60 pointer-events-none',
                isActive && !item.disabled && 'bg-brand/10 text-brand',
                !isActive && !item.disabled && 'text-text-muted hover:bg-surface-muted',
              ]
                .filter(Boolean)
                .join(' ')
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Divider */}
        <div className="my-2 h-px bg-surface-border" />

        {/* User section */}
        {(gravatarUrl || profile?.displayName) && (
          <div className="flex items-center gap-3 px-4 py-2">
            {gravatarUrl && (
              <img src={gravatarUrl} alt="" className="h-8 w-8 rounded-full" />
            )}
            {profile?.displayName && (
              <span className="text-sm font-medium text-text truncate">
                {profile.displayName}
              </span>
            )}
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-text-muted hover:bg-surface-muted transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Logout</span>
        </button>
      </nav>

      {/* Mobile/Tablet: full-width sticky bar (<1440px) */}
      <nav
        className="flex wide:hidden sticky top-0 z-50 h-14 w-full items-center justify-between bg-white px-3 shadow-lg"
        aria-label="Main navigation"
      >
        {/* Left side: nav items */}
        <div className="flex items-center gap-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              aria-disabled={item.disabled}
              tabIndex={item.disabled ? -1 : undefined}
              className={({ isActive }) =>
                [
                  'items-center justify-center rounded-xl min-w-[44px] min-h-[44px] p-2 transition-colors',
                  item.desktopOnly ? 'hidden desktop:flex' : 'flex',
                  item.disabled && 'opacity-60 pointer-events-none',
                  isActive && !item.disabled && 'bg-brand/10 text-brand',
                  !isActive && !item.disabled && 'text-text-muted hover:bg-surface-muted',
                ]
                  .filter(Boolean)
                  .join(' ')
              }
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" />
            </NavLink>
          ))}
        </div>

        {/* Right side: user area */}
        <div className="flex items-center gap-2">
          {gravatarUrl && (
            <img src={gravatarUrl} alt="" className="h-8 w-8 rounded-full" />
          )}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center rounded-xl min-w-[44px] min-h-[44px] p-2 text-text-muted hover:bg-surface-muted transition-colors"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </nav>
    </>
  )
}
