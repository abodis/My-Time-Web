# Requirements Document

## Introduction

Six internal maintainability improvements that reduce future cost without changing user-facing behavior. Covers query key management, optimistic update patterns, error isolation, route type safety, API envelope handling, and bundle optimization.

## Glossary

- **QueryKeyFactory**: A hierarchical object that produces typed, consistent TanStack Query cache keys mirroring the API resource tree
- **OptimisticHelper**: A set of pattern-specific utility functions that encapsulate cancel/snapshot/rollback logic for TanStack Query mutations
- **RouteErrorBoundary**: A React error boundary component placed inside AppShell layout that catches page-level crashes without unmounting shell chrome
- **PathsObject**: A typed const object exported from routes.tsx containing all route path strings as properties
- **EnvelopeAdapter**: A thin middleware layer on the openapi-fetch client that unwraps API response envelope structure
- **BundleAnalyzer**: A Vite plugin that generates visual reports of bundle composition and chunk sizes
- **AppShell**: The authenticated layout component providing sidebar and navigation chrome
- **HookFile**: A TypeScript file in `src/hooks/` that exports TanStack Query hooks for a specific API resource

## Requirements

### Requirement 1: Query Key Factory

**User Story:** As a developer, I want a single source of truth for all query cache keys, so that invalidation is predictable and typos are caught at compile time.

#### Acceptance Criteria

1. THE QueryKeyFactory SHALL define hierarchical key builders for every resource currently using inline string-literal keys across the 20 hook files in `src/hooks/`.
2. THE QueryKeyFactory SHALL produce readonly tuple types so TypeScript reports misuse at compile time.
3. THE QueryKeyFactory SHALL support tree-based invalidation by structuring keys as nested segments (e.g., `queryKeys.projects.detail(id).activities.list()` invalidates all activity queries under a project).
4. WHEN a HookFile references a query key, THE HookFile SHALL import the key from the QueryKeyFactory instead of using an inline string literal.
5. WHEN a mutation invalidates related queries, THE mutation SHALL reference QueryKeyFactory keys for the invalidation call.
6. THE QueryKeyFactory SHALL reside in a single file at `src/api/query-keys.ts`.
7. WHEN the QueryKeyFactory is fully adopted, THE codebase SHALL contain zero inline query key string-literal arrays in hook files.

### Requirement 2: Centralized Optimistic Update Helpers

**User Story:** As a developer, I want reusable optimistic update helpers, so that new mutations follow a proven pattern without reimplementing cancel/snapshot/rollback logic.

#### Acceptance Criteria

1. THE OptimisticHelper module SHALL export a `listAppend` helper that handles cancel, snapshot, optimistic insert, and rollback for list-type queries.
2. THE OptimisticHelper module SHALL export a `listRemove` helper that handles cancel, snapshot, optimistic removal, and rollback for list-type queries.
3. THE OptimisticHelper module SHALL export a `listReorder` helper that handles cancel, snapshot, optimistic sort-order update, and rollback for list-type queries.
4. WHEN an optimistic update helper is invoked, THE helper SHALL cancel in-flight queries for the target key before modifying the cache.
5. WHEN an optimistic update helper is invoked, THE helper SHALL capture a snapshot of current cache data and return a rollback function.
6. IF the associated mutation fails, THEN THE rollback function SHALL restore the cache to the pre-mutation snapshot.
7. THE OptimisticHelper module SHALL reside at `src/lib/optimistic.ts`.
8. WHEN `use-reorder-activities.ts` and `use-assignments.ts` are refactored, THE hooks SHALL use the centralized helpers instead of inline cancel/snapshot/rollback code.

### Requirement 3: Per-Route Error Boundaries

**User Story:** As a developer, I want page-level error boundaries, so that a crash in one page does not take down the entire app shell.

#### Acceptance Criteria

1. THE RouteErrorBoundary SHALL wrap the content outlet inside AppShell so shell chrome (sidebar, navigation) remains visible when a page crashes.
2. WHEN a child page component throws an unhandled error, THE RouteErrorBoundary SHALL render a recovery UI in the content area without unmounting AppShell.
3. THE RouteErrorBoundary recovery UI SHALL include a retry mechanism that resets the error state and re-renders the page component.
4. THE existing global ErrorBoundary at app root SHALL remain as a fallback for errors outside AppShell (auth pages, provider failures).
5. THE RouteErrorBoundary SHALL be implemented as a functional-style wrapper using React's error boundary API (class component internally is acceptable since React requires it for getDerivedStateFromError).

### Requirement 4: Type-Safe Route Paths

**User Story:** As a developer, I want a typed paths object, so that broken links are caught at compile time when routes change.

#### Acceptance Criteria

1. THE PathsObject SHALL be exported from `src/routes.tsx` as a `const` object containing string values for every route path defined in the router configuration.
2. THE PathsObject SHALL include parameterized path builder functions for dynamic routes (e.g., `paths.projects.edit(id)` returns `/projects/${id}/edit`).
3. WHEN a `<Link to="...">` or `navigate("...")` call references an app route, THE call SHALL use the PathsObject instead of a string literal.
4. WHEN a route path string is changed in the router configuration, THE developer SHALL only need to update the PathsObject definition and TypeScript will flag all stale references.
5. THE PathsObject SHALL cover all public auth routes and all authenticated app routes currently defined in the router.

### Requirement 5: API Response Envelope Adapter

**User Story:** As a developer, I want the API client to unwrap response envelopes automatically, so that hook code deals with domain data directly.

#### Acceptance Criteria

1. THE EnvelopeAdapter SHALL be implemented as an openapi-fetch middleware in `src/api/client.ts`.
2. WHEN the API returns a response with an envelope structure containing a `data` field, THE EnvelopeAdapter SHALL unwrap and return the `data` payload to the caller.
3. WHEN the API returns a response with an envelope structure containing an `error` field, THE EnvelopeAdapter SHALL propagate the error to the caller in a consistent format.
4. THE EnvelopeAdapter SHALL not implement pagination unwrapping, cursor handling, or response normalization beyond simple data/error extraction.
5. THE EnvelopeAdapter SHALL not break existing hook code that already handles the current response shape — migration can be incremental.

### Requirement 6: Bundle Analysis and Manual Chunking

**User Story:** As a developer, I want visibility into bundle composition and control over chunk boundaries, so that management pages do not bloat the tracker critical path.

#### Acceptance Criteria

1. THE BundleAnalyzer plugin SHALL be added to the Vite configuration and produce a visual report on each production build.
2. THE BundleAnalyzer output SHALL be generated to a gitignored location so reports are not committed.
3. WHEN manual chunks are configured, THE Vite build SHALL separate management page code (projects, team, tags, reports) into a distinct chunk from the tracker critical path.
4. THE manual chunk configuration SHALL reside in `vite.config.ts` under `build.rollupOptions.output.manualChunks`.
5. WHEN a production build completes, THE tracker entry chunk SHALL not include code from management page modules (`pages/app/projects-list`, `pages/app/team-list`, `pages/app/tags-list`, `pages/app/reports`).
6. THE existing lazy-loading via `lazyWithRetry` SHALL remain the primary code-splitting mechanism — manual chunks supplement it by controlling shared-dependency boundaries.
