# Implementation Plan

## Overview

Implement the Reports feature: a single `/reports` page with role-filtered tabs (My Time, Project Budget, Financial), period preset pills (This Week / This Month / Last Month), and three report panels with table-based display and Tailwind CSS progress bars. New files: page, 4 components, 1 hook file. Modifications: time-utils, routes, nav-items. API types regenerated.

## Tasks

- [x] 1. Add period utility functions to `src/lib/time-utils.ts` — add `getStartOfMonth(date?)`, `getEndOfMonth(date?)`, export `PeriodPreset` type, and `getDateRange(preset)` function. Follow existing patterns (setHours, toISOString). Add unit tests in `src/lib/__tests__/time-utils.test.ts` covering: month boundaries, year rollover (Jan → Dec), February 28/29, and last-month preset.
  - **Requirement:** #2
  - **Dependencies:** None

- [x] 2. Create `src/components/reports/progress-bar.tsx` — ProgressBar component with props: `consumed`, `budget` (number | null), `color` (string | null). Renders container with filled inner element using inline width style. Color logic: tag color → primary fallback → destructive when >90%. Over-budget: 100% width + red + text. Accessibility: `role="progressbar"`, `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax`. Add unit test in `src/components/reports/__tests__/progress-bar.test.tsx` verifying color thresholds, over-budget text, zero/null budget handling.
  - **Requirement:** #7
  - **Dependencies:** None

- [x] 3. Create `src/components/reports/period-pills.tsx` — PeriodPills component with props: `value` (PeriodPreset), `onChange`. Renders 3 pill buttons ("This Week", "This Month", "Last Month") with active state styling using existing pill/button patterns.
  - **Requirement:** #1
  - **Dependencies:** None

- [x] 4. Create `src/hooks/use-reports.ts` — three TanStack Query hooks: `usePersonalTimeReport({ from, to, groupBy })`, `useProjectBudgetReport({ from, to, projectId? })`, `useFinancialReport({ from, to, projectId? })`. Each uses the generated openapi-fetch client with appropriate query keys and `placeholderData: (prev) => prev`. Run `npm run api:generate` first to ensure report endpoint types exist in schema.
  - **Requirement:** #6
  - **Dependencies:** None

- [x] 5. Create `src/components/reports/personal-time-panel.tsx` — PersonalTimePanel with props `{ from, to }`. Contains groupBy toggle (useState: "tag" | "activity", default "tag"). Uses `usePersonalTimeReport`. Displays totalHours summary (1 decimal + "h"). Table with columns: Name (color dot when tag + color exists), Hours, Entry Count, Progress Bar (proportion-based: hours/totalHours). Empty state, error state with retry.
  - **Requirement:** #3
  - **Dependencies:** 2, 4

- [x] 6. Create `src/components/reports/project-budget-panel.tsx` — ProjectBudgetPanel with props `{ from, to }`. Contains project selector dropdown (populated from response, "All Projects" default). Uses `useProjectBudgetReport`. Table per project: tag rows with color dot, budget hrs, consumed hrs, ProgressBar. Over-budget styling. Empty state, error state with retry.
  - **Requirement:** #4
  - **Dependencies:** 2, 4

- [x] 7. Create `src/components/reports/financial-panel.tsx` — FinancialPanel with props `{ from, to }`. Contains project selector dropdown. Uses `useFinancialReport`. Displays currency prefix. Project summary rows + nested tag rows. Columns: Tag, Budget Hrs, Consumed Hrs, Billable (2dp), Cost (2dp), Margin (2dp), ProgressBar. Empty state, error state with retry.
  - **Requirement:** #5
  - **Dependencies:** 2, 4

- [x] 8. Create `src/pages/app/reports.tsx` — ReportsPage with period state (default "this-week") and activeTab state. Derives role from account store. Filters tabs by role level. Renders PeriodPills + tab bar + active panel. Passes computed `{from, to}` from `getDateRange(period)` to panels. Loading spinner for panel area.
  - **Requirement:** #1, #6
  - **Dependencies:** 1, 3, 5, 6, 7

- [x] 9. Register `/reports` route in `src/routes.tsx` (lazy-loaded, no RoleGuard) and enable Reports nav item in `src/components/layout/nav-items.ts` (change `disabled: true` → `disabled: false`).
  - **Requirement:** #1
  - **Dependencies:** 8

- [x] 10. Checkpoint — Run `npm run build` and `npm run test` to verify no type errors or test failures. Fix any issues.
  - **Requirement:** #1, #2, #3, #4, #5, #6, #7
  - **Dependencies:** 9

## Notes

- All API response types come from generated `src/api/schema.d.ts` via `npm run api:generate` — never hand-write them.
- Use `placeholderData: (prev) => prev` in all report hooks to prevent flash of empty state on parameter changes.
- No RoleGuard on the route — tabs handle role-based visibility internally.
- Progress bar in PersonalTimePanel uses proportion (hours/totalHours), not budget-based.
- Progress bar in Budget/Financial panels uses budget-based calculation with >90% warning threshold.
- CSS colors use bracket syntax: `bg-[hsl(var(--primary))]`, `bg-[hsl(var(--destructive))]`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2", "3", "4"] },
    { "id": 1, "tasks": ["5", "6", "7"] },
    { "id": 2, "tasks": ["8"] },
    { "id": 3, "tasks": ["9"] },
    { "id": 4, "tasks": ["10"] }
  ]
}
```
