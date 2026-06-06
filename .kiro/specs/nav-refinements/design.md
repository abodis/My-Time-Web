# Design Document

## Overview

This design covers four navigation refinements: widening and centering the desktop PillNav, integrating a user section (Gravatar + name + logout) into PillNav at both breakpoints, converting the mobile nav to a full-width bar, and removing the standalone UserActions component from AppShell.

## Architecture

### Positioning Strategy — Desktop PillNav Centering

The desktop PillNav is currently positioned with `fixed left-8 top-1/2 -translate-y-1/2`. The goal is to center it within the left 3 columns of the 12-column grid.

**Layout math at `wide:` breakpoint (container = 1200px):**

```
viewportWidth >= 1440px
containerWidth = 1200px
containerLeftEdge = (viewportWidth - containerWidth) / 2
col1to3Width = (3 / 12) * containerWidth = 300px
navWidth = ~252px (widened card)
leftOffset = containerLeftEdge + (col1to3Width - navWidth) / 2
```

This `leftOffset` must be computed dynamically (CSS `calc()` or inline style) since `containerLeftEdge` depends on viewport width.

**Implementation approach:** Use a CSS `left` value via `calc()`:

```css
left: calc((100vw - 1200px) / 2 + (300px - 252px) / 2);
/* simplifies to: calc(50vw - 576px) */
```

At `ultrawide:` (container = 1440px):

```css
left: calc((100vw - 1440px) / 2 + (360px - 252px) / 2);
/* simplifies to: calc(50vw - 666px) */
```

Use Tailwind arbitrary values: `wide:left-[calc(50vw-576px)] ultrawide:left-[calc(50vw-666px)]`.

### Width Increase

Current desktop card width is auto-sized by content (roughly 168px with `px-4 py-3` + icon + label). To achieve 150% width (~252px), apply a fixed width:

```
wide:w-[252px]
```

This gives nav labels comfortable horizontal room without overflow.

### Mobile Full-Width Bar

Replace the current `rounded-2xl mx-auto` mobile nav with a full-viewport-width bar:
- Remove `rounded-2xl` and horizontal margins
- Make it `w-full` with no border-radius at `<wide:` breakpoint
- Keep `sticky top-0 z-50 h-14 bg-white shadow-lg`
- Left-align nav items, right-align user section via `justify-between`

## Components

### Modified: `PillNav` (`src/components/layout/pill-nav.tsx`)

The PillNav component gains:
1. User section with Gravatar + firstName + logout (desktop)
2. User area with Gravatar + logout icon (mobile)
3. Updated positioning and width classes

```tsx
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { useProfile } from '@/hooks/use-profile'
import { clearAuth } from '@/lib/auth'
import { getGravatarUrl } from '@/lib/gravatar'

export function PillNav(): JSX.Element {
  const navigate = useNavigate()
  const { data: profile } = useProfile()

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  const gravatarUrl = profile?.email ? getGravatarUrl(profile.email) : null

  return (
    <>
      {/* Desktop: vertical floating card (≥1440px) */}
      <nav
        className="hidden wide:flex fixed top-1/2 -translate-y-1/2 wide:left-[calc(50vw-576px)] ultrawide:left-[calc(50vw-666px)] z-50 w-[252px] flex-col gap-1 rounded-2xl bg-white p-3 shadow-lg"
        aria-label="Main navigation"
      >
        {/* Nav items */}
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} ...>
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Divider + User Section */}
        <div className="my-2 h-px bg-surface-border" />
        <div className="flex items-center gap-3 px-4 py-2">
          {gravatarUrl && (
            <img src={gravatarUrl} alt="" className="h-10 w-10 rounded-full" />
          )}
          {profile?.firstName && (
            <span className="text-sm font-medium text-text truncate">
              {profile.firstName}
            </span>
          )}
        </div>
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
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} ...>
              <item.icon className="h-5 w-5" />
            </NavLink>
          ))}
        </div>

        {/* User area: right-aligned */}
        <div className="flex items-center gap-2">
          {gravatarUrl && (
            <img src={gravatarUrl} alt="" className="h-10 w-10 rounded-full" />
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
```

### New: `getGravatarUrl` (`src/lib/gravatar.ts`)

Pure utility function. Generates a Gravatar URL from an email address.

```tsx
import { md5 } from '@/lib/md5'

export function getGravatarUrl(email: string, size = 80): string {
  const hash = md5(email.trim().toLowerCase())
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`
}
```

### New: `md5` (`src/lib/md5.ts`)

Inline MD5 implementation (~60 lines). No external dependency needed — MD5 is a simple hash and only used for Gravatar URLs. Use a well-known public-domain implementation (e.g., based on RFC 1321 reference).

```tsx
export function md5(input: string): string {
  // Pure JS MD5 implementation
  // Returns lowercase hex string
}
```

### Modified: `AppShell` (`src/components/layout/app-shell.tsx`)

Remove all UserActions rendering. The nav wrapper simplifies since PillNav now handles user display at all breakpoints.

```tsx
import { Outlet } from 'react-router-dom'
import { GridContainer } from './grid-container'
import { PillNav } from './pill-nav'

export default function AppShell() {
  return (
    <div className="dot-pattern min-h-screen">
      <div className="sticky top-0 z-50 wide:static wide:z-auto wide:block">
        <PillNav />
      </div>

      <GridContainer>
        <main className="col-span-12 wide:col-start-4 wide:col-span-9 pt-4 wide:pt-0">
          <Outlet />
        </main>
      </GridContainer>
    </div>
  )
}
```

### Deprecated: `UserActions` (`src/components/layout/user-actions.tsx`)

This component is no longer rendered. It can be deleted. Its responsibilities (showing user identity + logout) are now handled within PillNav.

## Interfaces

```typescript
// src/lib/gravatar.ts
export function getGravatarUrl(email: string, size?: number): string

// src/lib/md5.ts
export function md5(input: string): string
```

No new component props interfaces beyond what already exists. PillNav remains a zero-prop component — it pulls profile data internally via `useProfile()`.

## Data Models

No new data models. The feature uses existing profile data from `useProfile()` which returns:

```typescript
{ data: { email: string; firstName: string; lastName: string } | undefined }
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Profile loading/error | Hide Gravatar + firstName, show logout only |
| Profile email missing | No Gravatar image rendered (graceful fallback) |
| Gravatar image 404 | URL uses `d=mp` param → Gravatar serves default "mystery person" silhouette |
| clearAuth() failure | Function is synchronous void — cannot fail |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Gravatar URL generation is deterministic and well-formed

*For any* non-empty email string, `getGravatarUrl(email)` SHALL produce a URL of the format `https://www.gravatar.com/avatar/{32-char-hex}?s={size}&d=mp` where the hex portion equals `md5(email.trim().toLowerCase())`.

**Validates: Requirements 3.2**

### Property 2: Gravatar URL is case-insensitive and whitespace-insensitive

*For any* email string `e`, `getGravatarUrl(e)` SHALL equal `getGravatarUrl(e.toUpperCase())` and `getGravatarUrl('  ' + e + '  ')`. The function normalizes input before hashing.

**Validates: Requirements 3.2**

### Property 3: MD5 round-trip consistency

*For any* input string, `md5(input)` SHALL always produce the same 32-character lowercase hexadecimal string, and `md5(a) === md5(b)` if and only if `a === b` (within practical collision resistance for email-length strings).

**Validates: Requirements 3.2**

### Property 4: Desktop PillNav centering formula

*For any* viewport width ≥ 1440px with container width 1200px and nav width 252px, the computed left offset SHALL place the nav's horizontal center at the midpoint of the left 3 grid columns: `leftOffset + navWidth/2 === containerLeftEdge + col1to3Width/2`.

**Validates: Requirements 2.1, 2.3**
