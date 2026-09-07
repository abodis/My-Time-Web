# Implementation Plan: Maintainability Backlog

## Overview

Six independent internal refactors improving query key management, optimistic update patterns, error isolation, route type safety, API envelope handling, and bundle optimization. All modules are independent — no cross-dependencies. Each foundation task is followed by migration tasks that replace inline code with the new centralized utilities.

## Tasks

- [x] 1. Query Key Factory
  - [x] 1.1 Create `src/api/query-keys.ts` with hierarchical key builders
    - Implement the full `queryKeys` object with nested segments for: projects, activities, entries, tags, members, reports, timer, profile, budgets, settings, entryNotes
    - Each node returns `readonly` tuples via `as const`
    - Child keys must start with parent segments as prefix (tree invalidation invariant)
    - _Requirements: 1.1, 1.2, 1.3, 1.6_


  - [x] 1.3 Migrate hook files to use QueryKeyFactory keys
    - Replace all inline `queryKey: ["resource", ...]` arrays across ~20 hook files with `queryKeys.resource.method(...)` imports
    - Replace all `queryClient.invalidateQueries({ queryKey: [...] })` calls with QueryKeyFactory references
    - Verify zero inline query key string-literal arrays remain in hook files
    - _Requirements: 1.4, 1.5, 1.7_

- [x] 2. Optimistic Update Helpers
  - [x] 2.1 Create `src/lib/optimistic.ts` with listAppend, listRemove, listReorder helpers
    - Implement `listAppend<T>` — cancel, snapshot, append, return rollback
    - Implement `listRemove<T>` — cancel, snapshot, filter out by predicate, return rollback
    - Implement `listReorder<T>` — cancel, snapshot, apply reorder function, return rollback
    - Export `applyReorder` pure function for multi-query reorder use case
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 2.2 Write tests for optimistic helpers (`src/lib/optimistic.test.ts`)
    - Test listAppend: grows list by one, new item is last
    - Test listRemove: shrinks list, predicate-matched item gone
    - Test listReorder: same items, new order (set membership preserved)
    - Test rollback round-trip: any helper → rollback → cache equals original
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

  - [x] 2.3 Migrate `use-reorder-activities.ts` and `use-assignments.ts` to use centralized helpers
    - Replace inline cancel/snapshot/rollback logic with `listAppend`, `listRemove`, `listReorder` calls
    - Use `applyReorder` for multi-query reorder in `use-reorder-activities.ts`
    - _Requirements: 2.8_

- [x] 3. Per-Route Error Boundary
  - [x] 3.1 Create `src/components/layout/route-error-boundary.tsx`
    - Implement class component with `getDerivedStateFromError`
    - Render content-area-scoped recovery UI (not full screen) with retry button
    - Retry calls `setState({ hasError: false })` to re-render children
    - _Requirements: 3.2, 3.3, 3.5_

  - [x] 3.2 Integrate RouteErrorBoundary into AppShell
    - Wrap `<Outlet />` with `<RouteErrorBoundary>` inside `app-shell.tsx`
    - Keep existing global ErrorBoundary in `app.tsx` unchanged
    - _Requirements: 3.1, 3.4_


- [x] 4. Type-Safe Route Paths
  - [x] 4.1 Add `paths` const object to `src/routes.tsx`
    - Define all auth routes (login, register, confirm, forgotPassword, resetPassword)
    - Define all app routes (selectAccount, tracker, entries, projects, team, reports, tags)
    - Parameterized routes use builder functions returning template literal types
    - Export as `as const` for literal type inference
    - _Requirements: 4.1, 4.2, 4.5_


  - [x] 4.3 Migrate string-literal route references to use `paths` object
    - Replace all `<Link to="/projects">` and `navigate("/projects")` with `paths.projects.list`
    - Replace all dynamic route references with builder functions
    - _Requirements: 4.3, 4.4_

- [x] 5. API Response Envelope Adapter
  - [x] 5.1 Add envelope unwrap middleware to `src/api/client.ts`
    - Register via `client.use()` as a response middleware
    - Unwrap `{ data: X }` shape on `response.ok` JSON responses only
    - Pass through non-envelope and non-JSON responses unchanged
    - Do not touch non-2xx responses (existing 401/403 handler covers those)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_


- [x] 6. Checkpoint — Verify core modules
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Bundle Analysis and Manual Chunking
  - [x] 7.1 Add rollup-plugin-visualizer to Vite config
    - Install `rollup-plugin-visualizer` as dev dependency
    - Configure output to `bundle-report/index.html` with gzipSize enabled
    - Add `bundle-report/` to `.gitignore`
    - _Requirements: 6.1, 6.2_

  - [x] 7.2 Configure manual chunks in `vite.config.ts`
    - Add `build.rollupOptions.output.manualChunks` with `management` chunk
    - Include: projects-list, project-form, team-list, tags-list, reports
    - Verify tracker entry chunk does not contain management page modules
    - Keep existing `lazyWithRetry` mechanism unchanged
    - _Requirements: 6.3, 6.4, 6.5, 6.6_

- [x] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Sole test task (2.2) covers the only module with non-trivial runtime logic that can fail silently
- Type-enforced modules (query keys, paths, envelope) don't need runtime tests — TypeScript catches misuse at compile time
- Error boundary uses standard React pattern — integration in 3.2 proves it works
- All 6 modules are independent — waves reflect this parallelism
- Migration tasks (1.3, 2.3, 4.3) depend on their foundation tasks (1.1, 2.1, 4.1)
- The envelope adapter (5.1) enables incremental hook migration — no immediate bulk refactor needed
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "4.1", "5.1", "7.1"] },
    { "id": 1, "tasks": ["2.2", "3.2", "4.3", "7.2"] },
    { "id": 2, "tasks": ["1.3", "2.3"] }
  ]
}
```
