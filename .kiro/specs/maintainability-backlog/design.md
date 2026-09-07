# Design Document

## Architecture Overview

Six independent modules, each with a single responsibility and no cross-dependencies between them. All changes are internal refactors — no user-facing behavior changes.

```
src/
  api/
    client.ts         ← EnvelopeAdapter middleware added here
    query-keys.ts     ← NEW: QueryKeyFactory
    schema.d.ts       (unchanged)
  lib/
    optimistic.ts     ← NEW: OptimisticHelper module
  components/
    layout/
      app-shell.tsx   ← wraps Outlet with RouteErrorBoundary
      route-error-boundary.tsx  ← NEW
  routes.tsx          ← exports `paths` const object
  vite.config.ts      ← analyzer plugin + manualChunks
```

---

## Component 1: Query Key Factory

**File:** `src/api/query-keys.ts`

### Design

Hierarchical nested object where each level returns a key tuple. Follows the "query key factory" pattern from TanStack Query docs — each node is a function returning `readonly [...]` tuples.

```typescript
export const queryKeys = {
  projects: {
    all: () => ["projects"] as const,
    list: (params?: { includeArchived?: boolean }) =>
      ["projects", params ?? {}] as const,
    detail: (id: string) => ({
      queryKey: ["projects", id] as const,
      activities: {
        all: () => ["projects", id, "activities"] as const,
        list: () => ["projects", id, "activities", "list"] as const,
      },
    }),
  },
  activities: {
    all: () => ["activities"] as const,
    list: (params?: { includeDone?: boolean }) =>
      ["activities", params ?? {}] as const,
    detail: (id: string) => ({
      queryKey: ["activities", id] as const,
      assignments: {
        all: () => ["activities", id, "assignments"] as const,
        list: () => ["activities", id, "assignments", "list"] as const,
      },
    }),
  },
  entries: {
    all: () => ["entries"] as const,
    list: (params: { from: string; to: string }) =>
      ["entries", params] as const,
  },
  tags: {
    all: () => ["tags"] as const,
    list: () => ["tags", "list"] as const,
  },
  members: {
    all: () => ["members"] as const,
    list: () => ["members", "list"] as const,
  },
  reports: {
    all: () => ["reports"] as const,
    list: (params: Record<string, unknown>) =>
      ["reports", params] as const,
  },
  timer: {
    all: () => ["timer"] as const,
    status: () => ["timer", "status"] as const,
  },
  profile: {
    all: () => ["profile"] as const,
  },
  budgets: {
    all: () => ["budgets"] as const,
    list: () => ["budgets", "list"] as const,
  },
  settings: {
    all: () => ["settings"] as const,
    activityColors: () => ["settings", "activity-colors"] as const,
  },
  entryNotes: {
    all: () => ["entry-notes"] as const,
    byEntry: (entryId: string) => ["entry-notes", entryId] as const,
  },
} as const
```

### Key Structural Invariant

Every child key starts with the parent's segments as a prefix. This enables TanStack Query's `queryClient.invalidateQueries({ queryKey: queryKeys.activities.all() })` to automatically match all child queries.

### Migration

Each hook file replaces inline `queryKey: ["resource", ...]` with `queryKey: queryKeys.resource.method(...)`. No behavioral change — purely a mechanical substitution.

---

## Component 2: Optimistic Update Helpers

**File:** `src/lib/optimistic.ts`

### Interface

```typescript
import type { QueryClient, QueryKey } from "@tanstack/react-query"

interface OptimisticContext<T> {
  previousData: T | undefined
  rollback: () => void
}

export async function listAppend<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  newItem: T,
): Promise<OptimisticContext<T[]>>

export async function listRemove<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  predicate: (item: T) => boolean,
): Promise<OptimisticContext<T[]>>

export async function listReorder<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  reorderFn: (items: T[]) => T[],
): Promise<OptimisticContext<T[]>>
```

### Internal Flow (all three helpers)

1. `await queryClient.cancelQueries({ queryKey })` — prevent in-flight refetch from overwriting.
2. `const previousData = queryClient.getQueryData<T[]>(queryKey)` — snapshot.
3. `queryClient.setQueryData(queryKey, transform(previousData))` — optimistic write.
4. Return `{ previousData, rollback: () => queryClient.setQueryData(queryKey, previousData) }`.

### listReorder Special Case

For `useReorderActivities`, the helper operates across multiple matching queries (via `getQueriesData`). The `listReorder` helper accepts a single `queryKey` for the simple case. The reorder hook will use `getQueriesData` pattern with a custom implementation that still delegates cancel/snapshot/rollback per-query to the helper's internal pattern — or we provide a `listReorderMulti` variant that accepts a key prefix and applies the reorder function across all matching caches.

Chosen approach: `listReorder` handles single-key case. `useReorderActivities` uses a manual loop over `getQueriesData` but delegates the reorder transform logic through a shared `applyReorder` pure function also exported from `optimistic.ts`.

---

## Component 3: Route Error Boundary

**File:** `src/components/layout/route-error-boundary.tsx`

### Design

A class component internally (React requires it for `getDerivedStateFromError`), exported as a named export. Renders a content-area-scoped fallback — no `min-h-screen`, just fills the content area.

```typescript
interface RouteErrorBoundaryProps {
  children: React.ReactNode
}

interface RouteErrorBoundaryState {
  hasError: boolean
}

export class RouteErrorBoundary extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true }
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        // Recovery UI — scoped to content area, not full screen
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2>Something went wrong</h2>
          <p>This page crashed. The rest of the app is fine.</p>
          <button onClick={this.handleRetry}>Try again</button>
        </div>
      )
    }
    return this.props.children
  }
}
```

### Integration into AppShell

```typescript
// app-shell.tsx
import { RouteErrorBoundary } from "./route-error-boundary"

export default function AppShell() {
  return (
    <div className="dot-pattern min-h-screen">
      <div className="sticky top-0 z-50 wide:static wide:z-auto">
        <PillNav />
      </div>
      <GridContainer>
        <main className="col-span-12 wide:col-start-4 wide:col-span-9 pt-4 wide:pt-6">
          <RouteErrorBoundary>
            <Outlet />
          </RouteErrorBoundary>
        </main>
      </GridContainer>
    </div>
  )
}
```

The existing global `<ErrorBoundary>` in `app.tsx` remains unchanged — it catches errors in auth pages, providers, and AppShell itself.

---

## Component 4: Type-Safe Route Paths

**File:** `src/routes.tsx` (exported alongside `router`)

### Interface

```typescript
export const paths = {
  // Auth routes
  login: "/login",
  register: "/register",
  confirm: "/confirm",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  // App routes
  selectAccount: "/select-account",
  tracker: "/",
  entries: "/entries",
  projects: {
    list: "/projects",
    new: "/projects/new",
    edit: (id: string) => `/projects/${id}/edit` as const,
  },
  team: "/team",
  reports: "/reports",
  tags: "/tags",
} as const
```

### Type Safety Mechanism

Since values are `as const`, TypeScript infers literal string types. When a route definition changes in the router config, the developer updates `paths` — all consumers using `paths.projects.edit(id)` get compile-time errors if the shape changes.

Dynamic routes use builder functions returning template literal types, so `paths.projects.edit("abc")` returns `"/projects/abc/edit"` (typed as `` `/projects/${string}/edit` ``).

---

## Component 5: API Response Envelope Adapter

**File:** `src/api/client.ts` (added as second middleware)

### Design

A response middleware registered via `client.use()` that intercepts responses and unwraps the `{ data, error }` envelope structure used by the backend.

```typescript
client.use({
  async onResponse({ response }) {
    // Only process successful JSON responses
    if (!response.ok) return response
    const contentType = response.headers.get("content-type")
    if (!contentType?.includes("application/json")) return response

    const body = await response.clone().json()

    // If the response has an envelope shape with a `data` field, unwrap it
    if (body && typeof body === "object" && "data" in body && Object.keys(body).length <= 2) {
      const unwrapped = new Response(JSON.stringify(body.data), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
      return unwrapped
    }

    return response
  },
})
```

### Constraints

- Thin unwrap only: check for `{ data: ... }` shape, return inner value.
- If envelope contains `error` field (on non-2xx), the existing 401/403 handler already processes it. The adapter only touches `response.ok` responses.
- No pagination, cursor, or normalization logic.
- Incremental: hooks currently accessing `response.data` directly will continue to work as the envelope is peeled off one layer. Hooks can be migrated incrementally.

---

## Component 6: Bundle Analysis and Manual Chunking

**File:** `vite.config.ts`

### Analyzer Plugin

```typescript
import { visualizer } from "rollup-plugin-visualizer"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: "bundle-report/index.html",
      open: false,
      gzipSize: true,
    }),
  ],
  // ...
})
```

Output directory `bundle-report/` added to `.gitignore`.

### Manual Chunks

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        "management": [
          "./src/pages/app/projects-list.tsx",
          "./src/pages/app/project-form.tsx",
          "./src/pages/app/team-list.tsx",
          "./src/pages/app/tags-list.tsx",
          "./src/pages/app/reports.tsx",
        ],
      },
    },
  },
},
```

This groups management page code into a single chunk separate from the tracker critical path. Combined with existing `lazyWithRetry` lazy-loading, the management chunk only loads when the user navigates to those routes.

---

## Error Handling

| Component | Error Scenario | Handling |
|-----------|---------------|----------|
| QueryKeyFactory | Misuse (wrong params) | Compile-time TS error |
| OptimisticHelper | Mutation failure | Rollback restores cache snapshot |
| RouteErrorBoundary | Page component throws | Recovery UI in content area, shell intact |
| PathsObject | Stale route reference | Compile-time TS error |
| EnvelopeAdapter | Non-envelope response | Pass through unchanged |
| BundleAnalyzer | Plugin failure | Build continues (analyzer is optional) |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Key hierarchy prefix invariant

*For any* query key produced by a child node in the QueryKeyFactory, the first N segments of that key SHALL equal the tuple produced by its ancestor node's `all()` method, enabling tree-based invalidation.

**Validates: Requirements 1.3**

### Property 2: listAppend grows list by one

*For any* list of items and any new item, calling `listAppend` SHALL produce a cache state where the list length is `original.length + 1` and the new item is the last element.

**Validates: Requirements 2.1**

### Property 3: listRemove shrinks list by matched items

*For any* list of items and any predicate matching exactly one item, calling `listRemove` SHALL produce a cache state where the list length is `original.length - 1` and no item satisfying the predicate remains.

**Validates: Requirements 2.2**

### Property 4: listReorder preserves set membership

*For any* list of items and any valid reorder function (permutation), calling `listReorder` SHALL produce a cache state containing exactly the same set of items (same IDs) in the new order, with no items added or lost.

**Validates: Requirements 2.3**

### Property 5: Optimistic rollback restores original state (round-trip)

*For any* initial cache state, after applying any optimistic helper (listAppend, listRemove, or listReorder) and then invoking the returned `rollback` function, the cache SHALL equal the original pre-mutation snapshot exactly.

**Validates: Requirements 2.5, 2.6**

### Property 6: Route error boundary isolates page errors from shell

*For any* Error thrown by a child component within the RouteErrorBoundary, the AppShell navigation elements SHALL remain mounted in the DOM and the recovery UI SHALL appear in the content area.

**Validates: Requirements 3.2**

### Property 7: Retry resets error state

*For any* error caught by RouteErrorBoundary, invoking the retry mechanism SHALL clear the error state and re-render the children, allowing recovery without a full page reload.

**Validates: Requirements 3.3**

### Property 8: Path builder produces valid route strings

*For any* valid ID string passed to a parameterized path builder function, the returned string SHALL match the pattern defined in the router configuration for that route (e.g., `paths.projects.edit(id)` returns a string matching `/projects/${id}/edit`).

**Validates: Requirements 4.2**

### Property 9: Envelope unwrap extracts data field

*For any* successful API response containing `{ data: X }` envelope structure, the EnvelopeAdapter SHALL return a response whose parsed JSON body equals `X`.

**Validates: Requirements 5.2**

### Property 10: Envelope adapter passes through non-envelope responses

*For any* successful API response that does NOT match the `{ data: ... }` envelope shape, the EnvelopeAdapter SHALL return the response unchanged.

**Validates: Requirements 5.5**
