# Implementation Plan

## Overview

Replace the current flex-based sidebar/topbar layout with a 12-column grid system featuring fixed-width containers, floating pill navigation, responsive activity blocks, and a dotted background pattern. All layout tokens defined in Tailwind CSS 4's @theme block.

## Tasks

- [x] 1. Add layout theme tokens to index.css
  - Add `--width-container-*` tokens (xs: 360px, sm: 720px, md: 960px, lg: 1200px, xl: 1440px) to the `@theme` block so Tailwind generates `w-container-*` utilities
  - Add `--spacing-gutter-*` tokens (xs: 12px, sm: 16px, md: 20px, lg: 24px) so Tailwind generates `gap-gutter-*` utilities
  - Add `--breakpoint-mobile: 360px`, `--breakpoint-tablet: 768px`, `--breakpoint-desktop: 1024px`, `--breakpoint-wide: 1440px`, `--breakpoint-ultrawide: 1920px` so Tailwind generates responsive variants (`mobile:`, `tablet:`, etc.)
  - Keep existing default Tailwind breakpoints (sm, md, lg, xl, 2xl) intact
  - Add `@utility dot-pattern` for the radial-gradient background (bg: #f6f6f6, dots: #e2e2e2 1px, spacing: 20px)
  - **Requirement:** #8
  - **Dependencies:** None

- [x] 2. Create GridContainer component
  - Create `src/components/layout/grid-container.tsx`
  - Implement a centered `div` with `display: grid`, 12 equal columns (`grid-cols-12`)
  - Apply responsive width classes: `w-full` base, `mobile:w-container-xs`, `tablet:w-container-sm`, `desktop:w-container-md`, `wide:w-container-lg`, `ultrawide:w-container-xl`
  - Apply responsive gap classes: `gap-gutter-xs` base, `tablet:gap-gutter-sm`, `desktop:gap-gutter-md`, `wide:gap-gutter-lg`, `ultrawide:gap-gutter-lg`
  - Center horizontally with `mx-auto`
  - No CSS transitions on width changes
  - **Requirement:** #1
  - **Dependencies:** 1

- [x] 3. Create nav-items configuration
  - Create `src/components/layout/nav-items.ts`
  - Export `NAV_ITEMS` array with: Timer (/), Entries (/entries), Projects (/projects, disabled), Team (/team, disabled), Reports (/reports, disabled)
  - Use lucide-react icons: Timer, ListChecks, FolderKanban, Users, BarChart3
  - Export the `NavItem` interface
  - **Requirement:** #2
  - **Dependencies:** None

- [x] 4. Create PillNav component
  - Create `src/components/layout/pill-nav.tsx`
  - Desktop (≥1440px / `wide:` variant): render as vertical floating card, `fixed` position, vertically centered, icon + text label for each item
  - Mobile/Tablet (<1440px): render as horizontal bar, `sticky top-0 z-50`, 56px height, icon-only buttons with 44×44px min tap targets
  - White background, `rounded-2xl`, subtle shadow
  - Use `NavLink` from React Router for enabled items with active state styling (highlighted background)
  - Disabled items: 60% opacity, `pointer-events-none`
  - Consume `NAV_ITEMS` from nav-items.ts
  - **Requirement:** #2, #3
  - **Dependencies:** 3

- [x] 5. Create UserActions component
  - Create `src/components/layout/user-actions.tsx`
  - Display logout button (always visible) using existing `clearAuth` + `useNavigate`
  - Display user email via `useProfile()` hook, hidden below 768px (`hidden tablet:block`)
  - Accept `className` prop for positioning flexibility
  - **Requirement:** #9
  - **Dependencies:** None

- [x] 6. Rewrite AppShell with new layout
  - Rewrite `src/components/layout/app-shell.tsx` to use the new grid layout
  - Outermost wrapper: apply `dot-pattern` utility class, full viewport height
  - Render `GridContainer` containing `PillNav` + content area
  - Desktop (≥1440px): content starts at col 4, spans 9 columns (`wide:col-start-4 wide:col-span-9`), full 12 columns otherwise (`col-span-12`)
  - Render `UserActions` top-right on desktop, inside sticky bar on mobile/tablet
  - Below 1440px: add top padding (72px = 56px nav + 16px gap) so content isn't hidden behind sticky nav
  - Desktop: no top offset (PillNav is fixed, not in flow)
  - Use `<Outlet />` for page content
  - **Requirement:** #4, #6, #9
  - **Dependencies:** 2, 4, 5

- [x] 7. Update ActivityBlock for responsive sizing
  - Modify `src/components/tracker/activity-block.tsx`
  - Mobile (<768px): `padding-bottom: 50%` for 2:1 aspect ratio, `p-4` padding
  - Desktop/Tablet (≥768px): keep `padding-bottom: 100%` for 1:1 square, `p-6` padding
  - Apply responsive font sizes: tag badge text-xs always; project name text-xs mobile / text-sm tablet+; activity name text-lg line-clamp-1 mobile / text-2xl line-clamp-2 tablet+; timer text-2xl mobile / text-4xl tablet+
  - Ensure minimum 44×44px tap target at all sizes
  - **Requirement:** #5, #7
  - **Dependencies:** 1

- [x] 8. Update ActivityGrid for new breakpoints
  - Modify `src/components/tracker/activity-grid.tsx`
  - Replace current grid classes with: `grid grid-cols-1 gap-gutter-xs tablet:grid-cols-2 tablet:gap-gutter-sm desktop:grid-cols-3 desktop:gap-gutter-md wide:grid-cols-3 wide:gap-gutter-lg ultrawide:grid-cols-4 ultrawide:gap-gutter-lg`
  - **Requirement:** #5
  - **Dependencies:** 1

- [x] 9. Remove old Sidebar and Topbar components
  - Delete `src/components/layout/sidebar.tsx` (replaced by PillNav)
  - Delete `src/components/layout/topbar.tsx` (replaced by UserActions + PillNav bar)
  - Remove any remaining imports of Sidebar/Topbar from other files
  - **Requirement:** #2, #3, #4
  - **Dependencies:** 6

- [x] 10. Checkpoint
  - Run `npm run build` to verify no TypeScript or build errors
  - Run `npm run lint` to check for lint issues
  - Ensure all tests pass, ask the user if questions arise.
  - **Requirement:** #1, #2, #3, #4, #5, #6, #7, #8, #9
  - **Dependencies:** 7, 8, 9

- [ ]* 11. Write unit tests for PillNav
  - Test correct number of nav items rendered
  - Test disabled items have `pointer-events-none` and reduced opacity
  - Test active item receives highlighted class
  - Test desktop renders icon + label, mobile renders icon-only
  - **Requirement:** #2, #3
  - **Dependencies:** 4

- [ ]* 12. Write unit tests for GridContainer
  - Test renders children within a 12-column grid
  - Test responsive width classes are applied
  - **Requirement:** #1
  - **Dependencies:** 2

- [ ]* 13. Write unit tests for UserActions
  - Test logout button calls clearAuth and navigates to /login
  - Test email displays when profile data available
  - Test email hidden on mobile viewport
  - **Requirement:** #9
  - **Dependencies:** 5

- [ ]* 14. Write Playwright responsive layout tests
  - Screenshot tests at 320px, 360px, 768px, 1024px, 1440px, 1920px viewports
  - Verify nav orientation switches at 1440px boundary
  - Verify no horizontal overflow at 320px
  - Verify sticky nav behavior on scroll below 1440px
  - Verify content not hidden behind sticky nav
  - **Requirement:** #1, #2, #3, #4, #5, #6, #7
  - **Dependencies:** 10

## Task Dependency Graph

```json
{
  "waves": [
    {"tasks": [1, 3, 5]},
    {"tasks": [2, 4, 7, 8]},
    {"tasks": [6]},
    {"tasks": [9, 11, 12, 13]},
    {"tasks": [10]},
    {"tasks": [14]}
  ]
}
```

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The design explicitly states PBT is not applicable (UI layout, not data-driven logic)
- All layout tokens use Tailwind CSS 4 `@theme` block — no arbitrary value syntax for token values
- Existing default breakpoints (sm, md, lg, xl, 2xl) are preserved for backwards compatibility
