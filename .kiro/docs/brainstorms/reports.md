# Reports Feature Brainstorm

## What We're Building

A single `/reports` page with role-filtered tabs showing three reports:
- **My Time** (all users) — personal hours grouped by tag or activity
- **Project Budget** (manager+) — budget vs consumed hours for a selected project, by tag
- **Financial** (admin only) — same as budget but with billable/cost/margin in account currency

## Decisions Made

- **Charts:** None. Tables + Tailwind progress bars only. No chart library.
- **Navigation:** Single `/reports` page with tabs. Tabs filtered by role.
- **Period selection:** Preset pills (This Week / This Month / Last Month). No custom date picker.
- **Personal report grouping:** Toggle pills "By Tag" / "By Activity".
- **Project budget scope:** Per-project. User selects a project from dropdown.
- **Personal report scope:** Own data only. No userId param exposed in UI (future: manager per-user report).
- **Currency:** Single per account. Financial report displays `currency` from response.

## API Endpoints (confirmed in openapi.json)

### GET /reports/project-budget (manager+)
- Params: `from` (required), `to` (required), `projectId` (optional)
- Returns: `{ projects: [{ projectId, projectName, budgetHours?, consumedHours, tags: [{ tagId, tagName, tagColor?, budgetHours?, consumedHours }] }] }`

### GET /reports/financial (admin only)
- Params: `from` (required), `to` (required), `projectId` (optional)
- Returns: `{ currency?, projects: [{ projectId, projectName, budgetHours?, consumedHours, billableTotal, costTotal, margin, tags: [{ tagId, tagName, tagColor?, budgetHours?, consumedHours, billableTotal, costTotal, margin }] }] }`

### GET /reports/personal-time (all users)
- Params: `from` (required), `to` (required), `groupBy` ("tag" | "activity", required), `userId` (optional, manager+ only)
- Returns: `{ totalHours, groups: [{ id, name, color?, hours, entryCount }] }`

## Constraints

- No chart deps — progress bars via Tailwind width-% + tag colors
- Role filtering in UI only (API enforces 403 server-side anyway)
- No pagination on report endpoints (aggregated data, always small)
- Period presets derive from/to ISO strings client-side (use existing time-utils pattern)

## UI Structure

```
/reports
├── ReportsPage
│   ├── Period pills (This Week | This Month | Last Month)
│   ├── Tab bar (filtered by role)
│   │   ├── "My Time" (all users)
│   │   ├── "Project Budget" (manager+)
│   │   └── "Financial" (admin)
│   └── Active tab content
│       ├── PersonalTimePanel
│       │   ├── GroupBy toggle (By Tag | By Activity)
│       │   ├── Total hours summary
│       │   └── Table: name | hours | entry count | progress bar
│       ├── ProjectBudgetPanel
│       │   ├── Project selector dropdown
│       │   └── Table: tag (with color dot) | budget hrs | consumed hrs | progress bar
│       └── FinancialPanel
│           ├── Project selector dropdown
│           └── Table: tag | budget hrs | consumed hrs | billable | cost | margin | bar
```

## Component Plan

| File | Purpose |
|------|---------|
| `src/pages/app/reports.tsx` | Main page — period pills, tabs, role filtering |
| `src/components/reports/personal-time-panel.tsx` | groupBy toggle + table |
| `src/components/reports/project-budget-panel.tsx` | project selector + budget table |
| `src/components/reports/financial-panel.tsx` | project selector + financial table |
| `src/components/reports/period-pills.tsx` | Reusable This Week / This Month / Last Month |
| `src/components/reports/progress-bar.tsx` | Tailwind progress bar (consumed/budget %) |
| `src/hooks/use-reports.ts` | TanStack Query hooks for the 3 endpoints |

## Data Hooks

```typescript
// use-reports.ts
useProjectBudgetReport({ from, to, projectId })
useFinancialReport({ from, to, projectId })
usePersonalTimeReport({ from, to, groupBy })
```

Query keys: `["reports", "project-budget", { from, to, projectId }]`, etc.

## Integration Points

- **Route:** Add `/reports` to routes.tsx (lazy loaded, no RoleGuard on the route itself — tabs handle visibility)
- **Nav:** Change `disabled: true` → `disabled: false` on Reports nav item
- **API types:** Run `npm run api:generate` to pick up new report schemas
- **Existing patterns:** Reuse DataTable for tables, SearchToolbar-style layout for toolbar area

## Progress Bar Logic

```
percentage = budgetHours ? Math.min((consumedHours / budgetHours) * 100, 100) : 0
color = percentage > 90 ? destructive : tag color or primary
```

Over-budget indicated by bar hitting 100% + red color + showing "X.X / Y.Y hrs" text.

## Period Presets

| Pill | from | to |
|------|------|----|
| This Week | Monday 00:00 (local) | Sunday 23:59:59 (local) |
| This Month | 1st of month 00:00 | Last day 23:59:59 |
| Last Month | 1st of prev month 00:00 | Last day of prev month 23:59:59 |

Reuse `getStartOfWeek`/`getEndOfWeek` pattern from time-utils. Add month equivalents.

## Next Steps

1. Create spec with requirements + tasks
2. Generate API types (`npm run api:generate`)
3. Build hooks → page → panels
