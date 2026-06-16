# Technical Design

## Overview

Implements the Reports feature as a single `/reports` page with role-filtered tabs, period preset selection, and three report panels. No new dependencies — uses existing TanStack Query, openapi-fetch client, shadcn/ui components, Tailwind CSS progress bars, and Zustand account store for role access.

## Architecture

### Component Hierarchy

```
ReportsPage (src/pages/app/reports.tsx)
├── PeriodPills (src/components/reports/period-pills.tsx)
├── Tab Bar (inline, role-filtered)
└── Active Panel
    ├── PersonalTimePanel (src/components/reports/personal-time-panel.tsx)
    ├── ProjectBudgetPanel (src/components/reports/project-budget-panel.tsx)
    └── FinancialPanel (src/components/reports/financial-panel.tsx)

Shared:
├── ProgressBar (src/components/reports/progress-bar.tsx)
└── useReports hooks (src/hooks/use-reports.ts)
```

### Data Flow

```
Period Selection (useState) ──┐
Tab Selection (useState) ─────┼──► Active Panel ──► useQuery(queryKey) ──► API
Role (account store) ─────────┘                         │
                                                        ▼
                                                  Render Table + ProgressBar
```

## Components

### ReportsPage (`src/pages/app/reports.tsx`)

- **State:** `period` (useState: "this-week" | "this-month" | "last-month"), `activeTab` (useState: string)
- **Role access:** `useAccountStore(s => s.accounts)` + `activeAccountId` to derive active role
- **Tab filtering:** Build tabs array based on role hierarchy, render only permitted tabs
- **Period computation:** Calls `getDateRange(period)` to produce `{from, to}` passed to active panel
- **Layout:** Standard page wrapper (`p-6 wide:pt-0`), card container (`rounded-2xl bg-white shadow-lg p-6`)

### PeriodPills (`src/components/reports/period-pills.tsx`)

```typescript
interface PeriodPillsProps {
  value: PeriodPreset
  onChange: (preset: PeriodPreset) => void
}

type PeriodPreset = "this-week" | "this-month" | "last-month"
```

- Renders 3 pill buttons with active state styling
- Pure presentational — no date computation inside

### ProgressBar (`src/components/reports/progress-bar.tsx`)

```typescript
interface ProgressBarProps {
  consumed: number
  budget: number | null
  color?: string | null
}
```

- **Logic:**
  - `percentage = budget && budget > 0 ? Math.min((consumed / budget) * 100, 100) : 0`
  - `isWarning = percentage > 90`
  - `isOverBudget = budget != null && budget > 0 && consumed > budget`
- **Rendering:**
  - Container: `h-2 w-full rounded-full bg-[hsl(var(--muted))]`
  - Fill: inline `width` style, background from props or CSS variable
  - Color logic: `isWarning ? hsl(var(--destructive)) : (color ?? hsl(var(--primary)))`
  - Over-budget text: `"{consumed.toFixed(1)} / {budget.toFixed(1)} hrs"` rendered beside bar
- **Accessibility:** `role="progressbar"`, `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax`

### PersonalTimePanel (`src/components/reports/personal-time-panel.tsx`)

```typescript
interface PersonalTimePanelProps {
  from: string
  to: string
}
```

- **State:** `groupBy` (useState: "tag" | "activity", default "tag")
- **Query:** `usePersonalTimeReport({ from, to, groupBy })`
- **Table columns:** Name (with color dot when tag), Hours, Entry Count, Progress Bar
- **Progress bar:** Proportion-based: `(group.hours / totalHours) * 100` — uses tag color, no warning threshold

### ProjectBudgetPanel (`src/components/reports/project-budget-panel.tsx`)

```typescript
interface ProjectBudgetPanelProps {
  from: string
  to: string
}
```

- **State:** `selectedProjectId` (useState: string | undefined)
- **Query:** `useProjectBudgetReport({ from, to, projectId: selectedProjectId })`
- **Dropdown:** Populated from `data.projects` array — shows "All Projects" when unselected
- **Table:** One section per project (with project name header), tag rows beneath with ProgressBar

### FinancialPanel (`src/components/reports/financial-panel.tsx`)

```typescript
interface FinancialPanelProps {
  from: string
  to: string
}
```

- **State:** `selectedProjectId` (useState: string | undefined)
- **Query:** `useFinancialReport({ from, to, projectId: selectedProjectId })`
- **Dropdown:** Same pattern as ProjectBudgetPanel
- **Table:** Project summary rows + tag detail rows. Monetary columns formatted: `{currency} {value.toFixed(2)}`
- **Columns:** Tag, Budget Hrs, Consumed Hrs, Billable, Cost, Margin, Progress Bar

## Hooks

### `src/hooks/use-reports.ts`

```typescript
export function usePersonalTimeReport({ from, to, groupBy }: {
  from: string; to: string; groupBy: "tag" | "activity"
}) {
  return useQuery({
    queryKey: ["reports", "personal-time", { from, to, groupBy }],
    queryFn: async () => {
      const { data, error } = await client.GET("/reports/personal-time", {
        params: { query: { from, to, groupBy } },
      })
      if (error) throw error
      return data
    },
    placeholderData: (prev) => prev,
  })
}

export function useProjectBudgetReport({ from, to, projectId }: {
  from: string; to: string; projectId?: string
}) {
  return useQuery({
    queryKey: ["reports", "project-budget", { from, to, projectId }],
    queryFn: async () => {
      const { data, error } = await client.GET("/reports/project-budget", {
        params: { query: { from, to, projectId } },
      })
      if (error) throw error
      return data
    },
    placeholderData: (prev) => prev,
  })
}

export function useFinancialReport({ from, to, projectId }: {
  from: string; to: string; projectId?: string
}) {
  return useQuery({
    queryKey: ["reports", "financial", { from, to, projectId }],
    queryFn: async () => {
      const { data, error } = await client.GET("/reports/financial", {
        params: { query: { from, to, projectId } },
      })
      if (error) throw error
      return data
    },
    placeholderData: (prev) => prev,
  })
}
```

- `placeholderData: (prev) => prev` prevents flash of empty state on parameter changes (Req 6.5)
- TanStack Query auto-cancels stale requests via AbortSignal when query keys change (Req 6.4)

## Time Utilities Addition

Add to `src/lib/time-utils.ts`:

```typescript
export function getStartOfMonth(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), 1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function getEndOfMonth(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export type PeriodPreset = "this-week" | "this-month" | "last-month"

export function getDateRange(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date()
  switch (preset) {
    case "this-week":
      return { from: getStartOfWeek(now), to: getEndOfWeek(now) }
    case "this-month":
      return { from: getStartOfMonth(now), to: getEndOfMonth(now) }
    case "last-month": {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return { from: getStartOfMonth(prev), to: getEndOfMonth(prev) }
    }
  }
}
```

## Routing Integration

Add to `src/routes.tsx` inside the AppShell children:

```typescript
const ReportsPage = lazyWithRetry(() => import("@/pages/app/reports"))

// Route entry (no RoleGuard — tabs handle visibility):
{
  path: "/reports",
  element: (
    <Suspense fallback={<LoadingSpinner />}>
      <ReportsPage />
    </Suspense>
  ),
}
```

Enable in `src/components/layout/nav-items.ts`: change `disabled: true` → `disabled: false` on Reports item.

## Role Access Pattern

```typescript
// In ReportsPage:
const activeAccountId = useAccountStore((s) => s.activeAccountId)
const accounts = useAccountStore((s) => s.accounts)
const activeRole = accounts.find((a) => a.id === activeAccountId)?.role ?? "user"

const ROLE_LEVEL: Record<string, number> = { user: 0, manager: 1, admin: 2 }
const userLevel = ROLE_LEVEL[activeRole] ?? 0

const tabs = [
  { id: "my-time", label: "My Time", minLevel: 0 },
  { id: "project-budget", label: "Project Budget", minLevel: 1 },
  { id: "financial", label: "Financial", minLevel: 2 },
].filter((tab) => userLevel >= tab.minLevel)
```

## Error Handling

- Non-403 errors: Show inline error with retry button (calls `refetch()` from the query)
- 403: Silently hidden — should not occur if role filtering works, but gracefully degrades
- Use existing `isError`/`error` from useQuery; check `error` shape for status code

## Components and Interfaces

### Exported Interfaces

```typescript
// src/components/reports/period-pills.tsx
export type PeriodPreset = "this-week" | "this-month" | "last-month"
export interface PeriodPillsProps {
  value: PeriodPreset
  onChange: (preset: PeriodPreset) => void
}

// src/components/reports/progress-bar.tsx
export interface ProgressBarProps {
  consumed: number
  budget: number | null
  color?: string | null
}

// src/components/reports/personal-time-panel.tsx
export interface PersonalTimePanelProps {
  from: string
  to: string
}

// src/components/reports/project-budget-panel.tsx
export interface ProjectBudgetPanelProps {
  from: string
  to: string
}

// src/components/reports/financial-panel.tsx
export interface FinancialPanelProps {
  from: string
  to: string
}
```

### Hook Signatures

```typescript
// src/hooks/use-reports.ts
export function usePersonalTimeReport(params: { from: string; to: string; groupBy: "tag" | "activity" }): UseQueryResult
export function useProjectBudgetReport(params: { from: string; to: string; projectId?: string }): UseQueryResult
export function useFinancialReport(params: { from: string; to: string; projectId?: string }): UseQueryResult
```

### Utility Additions

```typescript
// src/lib/time-utils.ts (additions)
export function getStartOfMonth(date?: Date): string
export function getEndOfMonth(date?: Date): string
export function getDateRange(preset: PeriodPreset): { from: string; to: string }
```

## Data Models

All data types are generated from `docs/openapi.json` via `npm run api:generate`. No hand-written types.

### API Response Shapes (reference only)

```typescript
// GET /reports/personal-time
interface PersonalTimeResponse {
  totalHours: number
  groups: Array<{
    id: string
    name: string
    color?: string | null
    hours: number
    entryCount: number
  }>
}

// GET /reports/project-budget
interface ProjectBudgetResponse {
  projects: Array<{
    projectId: string
    projectName: string
    budgetHours?: number | null
    consumedHours: number
    tags: Array<{
      tagId: string
      tagName: string
      tagColor?: string | null
      budgetHours?: number | null
      consumedHours: number
    }>
  }>
}

// GET /reports/financial
interface FinancialResponse {
  currency?: string
  projects: Array<{
    projectId: string
    projectName: string
    budgetHours?: number | null
    consumedHours: number
    billableTotal: number
    costTotal: number
    margin: number
    tags: Array<{
      tagId: string
      tagName: string
      tagColor?: string | null
      budgetHours?: number | null
      consumedHours: number
      billableTotal: number
      costTotal: number
      margin: number
    }>
  }>
}
```

### Local UI State

```typescript
// ReportsPage state (useState, not persisted)
period: PeriodPreset        // default: "this-week"
activeTab: string           // default: first visible tab for role

// PersonalTimePanel state
groupBy: "tag" | "activity" // default: "tag"

// ProjectBudgetPanel / FinancialPanel state
selectedProjectId: string | undefined  // default: undefined (all projects)
```

## Correctness Properties

### Property 1: Role Tab Visibility is Monotonic

A higher role always sees all tabs of lower roles plus their own. Admin sees 3 tabs, manager sees 2, user sees 1. Never a case where a higher role misses a lower role's tab.

**Validates: Requirements 1.5, 1.6, 1.7**

### Property 2: Period Computation is Deterministic

Same preset + same system clock instant = same `from`/`to` ISO strings. No timezone drift between computation and API call. `getDateRange` is a pure function of the current Date.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 3: Progress Bar Percentage is Bounded

Always renders between 0% and 100% width inclusive. Division by zero is guarded: null or zero budget produces 0% width. Over-budget shows 100% width with text indicator.

**Validates: Requirements 7.1, 7.4, 7.5, 7.7**

### Property 4: No Stale Data Cross-Contamination

`placeholderData` shows previous result during refetch, but query key change guarantees a new network request. The rendered data always corresponds to the currently selected period/tab combination.

**Validates: Requirements 6.4, 6.5**

### Property 5: 403 Responses are Silent

If the API returns 403 (role mismatch), no error UI is displayed. Client-side tab filtering prevents this path; the guard exists as defense-in-depth.

**Validates: Requirements 6.2**

## Testing Strategy

### Unit Tests (Vitest)
- `time-utils.ts`: Test `getStartOfMonth`, `getEndOfMonth`, `getDateRange` for edge cases (year boundaries, Feb 28/29, DST transitions)
- `progress-bar.tsx`: Test color logic (tag color, primary fallback, warning threshold, over-budget text)
- Role filtering logic: Given role X, verify correct tabs array

### Integration Tests (Vitest + RTL)
- `PersonalTimePanel`: Mock API, verify table renders groups, groupBy toggle triggers refetch
- `ProjectBudgetPanel`: Mock API, verify project dropdown filters, over-budget styling appears
- `FinancialPanel`: Mock API, verify currency prefix, monetary formatting
- Loading/error states: Verify spinner on pending, error message + retry on failure

### E2E Tests (Playwright — if needed)
- Navigate to /reports as admin, verify all 3 tabs visible
- Switch periods, verify data refreshes
- Not a priority for initial implementation (smoke test level only)

## File Manifest

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/app/reports.tsx` | Create | Main reports page |
| `src/components/reports/period-pills.tsx` | Create | Period preset pill selector |
| `src/components/reports/progress-bar.tsx` | Create | Reusable progress bar |
| `src/components/reports/personal-time-panel.tsx` | Create | Personal time report panel |
| `src/components/reports/project-budget-panel.tsx` | Create | Project budget report panel |
| `src/components/reports/financial-panel.tsx` | Create | Financial report panel |
| `src/hooks/use-reports.ts` | Create | TanStack Query hooks for report endpoints |
| `src/lib/time-utils.ts` | Modify | Add getStartOfMonth, getEndOfMonth, getDateRange |
| `src/routes.tsx` | Modify | Add /reports route |
| `src/components/layout/nav-items.ts` | Modify | Enable Reports nav item |
| `src/api/schema.d.ts` | Regenerate | Run `npm run api:generate` for report types |
