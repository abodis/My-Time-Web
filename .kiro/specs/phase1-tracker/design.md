# Technical Design Document

## Overview

Phase 1 implements the core tracker screen and entries page. The tracker screen replaces the empty dashboard at "/" with a grid of activity blocks that serve as one-click timer controls. A separate "/entries" page provides manual entry CRUD with modal forms. The design leverages the existing Phase 0 infrastructure: generated API client, TanStack Query, Zustand, and the app shell layout.

## Architecture

### Component Tree

```
AppShell
├── Tracker (/)
│   ├── TrackerToolbar (Incomplete/Completed toggle + Block/List view toggle)
│   ├── ActivityGrid (grid layout)
│   │   └── ActivityBlock[] (individual cards)
│   └── ActivityList (list layout, alternative to grid)
│       └── ActivityListItem[] (compact rows)
└── EntriesPage (/entries)
    ├── EntriesToolbar (Today/This Week toggle + Add Entry button)
    ├── EntryList
    │   └── EntryRow[] (individual entry rows)
    ├── EntryModal (create/edit)
    └── DeleteConfirmDialog
```

### Data Flow

```
API (openapi-fetch client)
  ↓
TanStack Query (useProjects, useActivities, useTimer, useEntries, useTags)
  ↓
Components (read via query hooks)
  ↓
Zustand Timer_Store (ticker interval, running timer display state)
  ↓
ActivityBlock (renders HH:MM:SS from store)
```

## Components and Interfaces

### New Files

| File | Purpose |
|---|---|
| `src/stores/timer-store.ts` | Zustand store for running timer tick state |
| `src/hooks/use-timer.ts` | TanStack Query hooks for timer operations |
| `src/hooks/use-projects.ts` | useProjects, useActivities query hooks |
| `src/hooks/use-entries.ts` | useEntries, useCreateEntry, useUpdateEntry, useDeleteEntry hooks |
| `src/hooks/use-tags.ts` | useTags query hook |
| `src/hooks/use-entry-notes.ts` | useEntryNotes, useCreateNote hooks |
| `src/lib/tag-colors.ts` | Deterministic tag name → color hash utility |
| `src/lib/time-utils.ts` | formatElapsed(ms), getStartOfDay(), getStartOfWeek() helpers |
| `src/pages/app/tracker.tsx` | Tracker page component (replaces dashboard) |
| `src/pages/app/entries.tsx` | Entries page component |
| `src/components/tracker/activity-block.tsx` | Activity block card |
| `src/components/tracker/activity-list-item.tsx` | Activity list row (compact) |
| `src/components/tracker/activity-grid.tsx` | Grid layout container |
| `src/components/tracker/tracker-toolbar.tsx` | Filter + view toggle toolbar |
| `src/components/entries/entry-row.tsx` | Single entry in the list |
| `src/components/entries/entry-list.tsx` | Entry list container |
| `src/components/entries/entry-modal.tsx` | Create/edit entry modal |
| `src/components/entries/entries-toolbar.tsx` | Date toggle + add button |
| `src/components/entries/delete-confirm-dialog.tsx` | Delete confirmation |
| `src/components/entries/entry-notes.tsx` | Notes list + add form |

### Modified Files

| File | Change |
|---|---|
| `src/routes.tsx` | Replace Dashboard with Tracker at "/", add "/entries" route |
| `src/components/layout/sidebar.tsx` | Activate Timer + Entries nav links |

## Data Models

All types are generated from `openapi-typescript`. Key interfaces used:

```typescript
// From schema.d.ts (generated)
type EntryResponse = components["schemas"]["EntryResponse"]
type TimerStartRequest = components["schemas"]["TimerStartRequest"]
type EntryCreateRequest = components["schemas"]["EntryCreateRequest"]
type EntryUpdateRequest = components["schemas"]["EntryUpdateRequest"]
type ActivityResponse = components["schemas"]["ActivityResponse"]
type ProjectResponse = components["schemas"]["ProjectResponse"]
type TagResponse = components["schemas"]["TagResponse"]
type NoteResponse = components["schemas"]["NoteResponse"]
```

### Zustand Timer Store

```typescript
// src/stores/timer-store.ts
interface TimerState {
  isRunning: boolean
  activityId: string | null
  entryId: string | null
  startTime: string | null  // ISO string from server
  elapsed: number           // milliseconds, recomputed each tick
  start: (entryId: string, activityId: string, startTime: string) => void
  stop: () => void
  tick: () => void          // called by setInterval, computes Date.now() - Date.parse(startTime)
}
```

## API Integration

### Query Keys

```typescript
['projects']                          // GET /projects
['activities', projectId]             // GET /projects/{id}/activities
['tags']                              // GET /tags
['timer', 'current']                  // GET /timer/current
['entries', { from, to }]            // GET /entries?from=&to=
['entry-notes', entryId]             // GET /entries/{id}/notes
```

### Mutation Invalidation Map

| Mutation | Invalidates |
|---|---|
| POST /timer/start | `['timer', 'current']` |
| POST /timer/stop | `['timer', 'current']`, `['entries', *]` |
| POST /entries | `['entries', *]` |
| PUT /entries/{id} | `['entries', *]` |
| DELETE /entries/{id} | `['entries', *]` |
| POST /entries/{id}/notes | `['entry-notes', entryId]` |

## Key Implementation Details

### Timer Tick Mechanism

1. On mount or rehydrate: fetch `GET /timer/current`
2. If response has entry (endTime is null): store startTime in Timer_Store, start 1s setInterval
3. Each tick: `elapsed = Date.now() - Date.parse(startTime)` — never accumulate
4. On stop: clear interval, reset store
5. On visibility change (hidden → visible): no network call needed, next tick auto-corrects

### Block Color Assignment

```typescript
// src/lib/tag-colors.ts
const BLOCK_COLORS = [
  { name: 'blue',     default: '#12aaff', light: '#88d4ff', dark: '#0b6699' },
  { name: 'green',    default: '#89e02d', light: '#c4ef96', dark: '#52861b' },
  { name: 'red',      default: '#ff0000', light: '#ff7f7f', dark: '#990000' },
  { name: 'yellow',   default: '#fbd31f', light: '#fde98f', dark: '#977f13' },
  { name: 'orange',   default: '#ff9000', light: '#ffc77f', dark: '#995600' },
  { name: 'teal',     default: '#2cdba5', light: '#95edd2', dark: '#1a8363' },
  { name: 'purple',   default: '#8358ed', light: '#c1abf6', dark: '#4f358e' },
  { name: 'lavender', default: '#f75aff', light: '#fbacff', dark: '#943699' },
]

function getBlockColor(index: number) {
  return BLOCK_COLORS[index % BLOCK_COLORS.length]
}
```

Phase 1: API has no color field yet. Colors are assigned by cycling through the palette based on activity index. Future: users will set colors per-activity, and a default color in preferences. Light variant = block background, dark variant = badge/text, default = accents.

### Incomplete/Completed Filter Logic

```typescript
// Derive from today's entries + activities list
const todayEntries = useEntries({ from: startOfDay, to: endOfDay })
const completedActivityIds = new Set(
  todayEntries.filter(e => e.endTime !== null).map(e => e.activityId)
)
// "Incomplete": activities NOT in completedActivityIds (or only have running entry)
// "Completed": activities IN completedActivityIds with no null-endTime entries
```

### Entry Modal Form Schema (Zod)

```typescript
const entryFormSchema = z.object({
  activityId: z.string().uuid(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  notes: z.string().max(5000).optional(),
}).refine(d => new Date(d.endTime) > new Date(d.startTime), {
  message: "End time must be after start time",
  path: ["endTime"],
})
```

### Routing Changes

```typescript
// src/routes.tsx additions
{ path: "/", element: <TrackerPage /> }
{ path: "/entries", element: <EntriesPage /> }
```

### Sidebar Navigation

Timer → "/" (active in Phase 1)
Entries → "/entries" (new nav item, or use existing "Projects" slot temporarily)
Projects/Team/Reports remain disabled

## Error Handling

- API errors on timer start/stop: show inline error, reconcile with GET /timer/current
- API errors on entry CRUD: show error in modal, preserve form state
- Network failures on initial load: error state with retry button
- 409 on timer start: silent rehydration (not a user-facing error)

## Correctness Properties

### Property 1: Timer derivation integrity
The displayed elapsed time on any ActivityBlock must always equal `Date.now() - Date.parse(startTime)` where startTime is the server-provided value. No client-side accumulation.
**Validates: Requirements 4.1, 4.2**

### Property 2: Single running timer
At most one ActivityBlock displays a running state at any given time. Starting a timer while another is conceptually running (409) results in displaying the already-running timer.
**Validates: Requirements 2.3, 2.4**

### Property 3: Cache consistency
After any mutation (start, stop, create, update, delete), the relevant TanStack Query caches are invalidated so subsequent renders reflect the latest server state.
**Validates: Requirements 3.2, 6.2, 8.2, 9.2**

### Property 4: Form validation precedes API call
No API request is sent from EntryModal until all Zod validation rules pass client-side.
**Validates: Requirements 6.3, 8.3**

## Testing Strategy

- Unit tests for `time-utils.ts` (formatElapsed, date range helpers) and `tag-colors.ts` (deterministic output)
- Integration tests for timer store (start/stop/tick cycle, rehydration)
- Component tests for ActivityBlock (renders correct states: idle, loading, running)
- Component tests for EntryModal (validation errors, form submission)
- Playwright smoke test: start timer → verify ticking → stop timer → verify entry appears

## Performance Considerations

- Activities fetched per-project (N+1): acceptable at beta scale (<10 projects). If needed later, batch with `Promise.all`.
- Timer tick is a single `setInterval` in the store, not per-component.
- Entry list uses TanStack Query caching — switching Today/Week uses cached data when available.
- View toggle (Block/List) is purely local rendering — no refetch.
