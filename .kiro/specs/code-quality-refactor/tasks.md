# Implementation Plan

## Overview

Implements nine code quality improvements in three tiers: pre-cleanup (remove side effects, console.log, duplicate formatting), extraction & restructuring (focused hooks, decoupled auth, lazy routes), and cross-cutting improvements (error boundary, Zod standardization, accessible dialogs).

## Tasks

- [x] 1. Pre-cleanup: Remove side effects, console.log, and duplicate formatting
  - [x] 1.1 Remove console.log statements from TrackerPage
    - Delete all `console.log` calls in `src/pages/app/tracker.tsx`
    - Verify timer start/stop/elapsed behavior unchanged
    - _Requirements: 8.1, 8.2, 8.3_
  - **Requirement:** #8
  - **Dependencies:** None

  - [x] 1.2 Remove local `fmt()` function and use `formatElapsed` from time-utils
    - Delete the local `fmt()` function in `src/pages/app/tracker.tsx`
    - Replace all `fmt()` calls with `formatElapsed` imported from `@/lib/time-utils`
    - Note: `formatElapsed` outputs `HH:MM:SS` format — if the old `XhYYmZZs` format is needed anywhere visible to users, add a new export to `src/lib/time-utils.ts`
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - **Requirement:** #9
  - **Dependencies:** 1.1

  - [x] 1.3 Remove side effect from `useMemo` (activityElapsedMap)
    - Remove the `accumulatedRef.current = map` assignment from inside `useMemo`
    - Remove the `console.log('[Timer] accumulated updated:',...)` call from inside `useMemo`
    - If `accumulatedRef` is still needed by `handleBlockClick`, synchronize it via a `useEffect` that watches `activityElapsedMap`
    - Ensure `activityElapsedMap` is a pure computation of `todayEntries`
    - _Requirements: 7.1, 7.2, 7.3_
  - **Requirement:** #7
  - **Dependencies:** 1.1

- [x] 2. Extract TrackerPage into focused hooks
  - [x] 2.1 Create `useTrackerData` hook
    - Create `src/hooks/use-tracker-data.ts`
    - Move data fetching logic (useProjects, useTags, useCurrentTimer, useEntries, useQueries for activities) into this hook
    - Move derived memos (allActivities, tagMap, activityElapsedMap) into this hook
    - Extract `computeElapsedMap` as a pure exported function for testability
    - Return `{ isLoading, isError, allActivities, tagMap, activityElapsedMap, currentTimer, refetchProjects }`
    - _Requirements: 1.1, 1.6_
  - **Requirement:** #1
  - **Dependencies:** 1.2, 1.3

  - [x] 2.2 Create `useTimerTick` hook
    - Create `src/hooks/use-timer-tick.ts`
    - Move interval ref, `startTicking`/`stopTicking` callbacks, unmount cleanup effect, and rehydration effect
    - Accept `currentTimer` parameter, return `{ startTicking, stopTicking }`
    - Start ticking when `currentTimer` has no `endTime`; stop when null
    - _Requirements: 1.2, 1.6_
  - **Requirement:** #1
  - **Dependencies:** 1.3

  - [x] 2.3 Create `useBlockClick` hook
    - Create `src/hooks/use-block-click.ts`
    - Move click handler logic, `loadingActivityId` state, start/stop mutations, query invalidation
    - Accept `TimerTickControls` parameter, return `{ handleBlockClick, loadingActivityId }`
    - _Requirements: 1.3, 1.6_
  - **Requirement:** #1
  - **Dependencies:** 2.2

  - [x] 2.4 Refactor TrackerPage to use extracted hooks
    - Replace all extracted logic in `src/pages/app/tracker.tsx` with hook calls
    - Component body should contain only hook calls, derived values, and JSX
    - No `useEffect`, `useCallback`, `useRef`, `useMutation`, or `setInterval` directly in component
    - Verify identical DOM structure and behavior
    - _Requirements: 1.4, 1.5_
  - **Requirement:** #1
  - **Dependencies:** 2.1, 2.2, 2.3

  - [x] 2.5 Write property test for `computeElapsedMap`
    - **Property 1: Elapsed map accumulation is correct and idempotent**
    - **Validates: Requirements 7.1, 7.2**
    - Create `src/lib/__tests__/compute-elapsed-map.test.ts`
    - Use fast-check to generate random entry arrays with UUIDs and ISO timestamps
    - Assert sum correctness and idempotency (calling twice yields same result)
  - **Requirement:** #7
  - **Dependencies:** 2.1

  - [x] 2.6 Write property test for `flattenActivities`
    - **Property 2: Activity flattening preserves all activities with correct project names**
    - **Validates: Requirements 1.1**
    - Create `src/hooks/__tests__/flatten-activities.test.ts`
    - Use fast-check to generate random project/activity arrays
    - Assert total count equals sum of activity arrays and projectName is correct
  - **Requirement:** #1
  - **Dependencies:** 2.1

- [x] 3. Checkpoint - Verify TrackerPage refactor
  - Ensure all tests pass, ask the user if questions arise.
  - **Requirement:** #1
  - **Dependencies:** 2.4

- [x] 4. Decouple auth hooks from navigation
  - [x] 4.1 Refactor auth hooks to return mutation objects only
    - Remove `useNavigate` import and all `navigate()` calls from `src/hooks/use-auth.ts`
    - Remove `react-router-dom` import entirely
    - Keep `setTokens()` call in `useLogin` onSuccess
    - Return raw mutation objects to callers
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  - **Requirement:** #3
  - **Dependencies:** None

  - [x] 4.2 Move navigation to page components
    - Update `src/pages/auth/login.tsx` to navigate "/" on login success
    - Update `src/pages/auth/register.tsx` to navigate "/confirm" on register success
    - Update `src/pages/auth/confirm.tsx` to navigate "/login" on confirm success
    - Update `src/pages/auth/forgot-password.tsx` to navigate "/reset-password" on success
    - Update `src/pages/auth/reset-password.tsx` to navigate "/login" on success
    - Use `mutate(data, { onSuccess: () => navigate(...) })` pattern
    - _Requirements: 3.4, 3.6_
  - **Requirement:** #3
  - **Dependencies:** 4.1

  - [x] 4.3 Write unit tests for decoupled auth hooks
    - Test that `useLogin` calls `setTokens` on success and returns mutation result
    - Test that no navigation occurs within the hook
    - Test that `react-router-dom` is not imported
    - _Requirements: 3.1, 3.5_
  - **Requirement:** #3
  - **Dependencies:** 4.1

- [x] 5. Standardize Zod imports to `zod/v4`
  - [x] 5.1 Update all Zod imports across the codebase
    - Change `import { z } from "zod"` to `import { z } from "zod/v4"` in `src/components/entries/entry-modal.tsx`
    - Search for and update any other files importing from bare `zod`
    - Verify build produces no Zod-related warnings
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - **Requirement:** #4
  - **Dependencies:** None

- [x] 6. Add Error Boundary
  - [x] 6.1 Create ErrorBoundary component
    - Create `src/components/error-boundary.tsx`
    - Implement as class component with `getDerivedStateFromError`
    - Render fallback with heading, description, and keyboard-accessible "Try again" button
    - Retry resets `hasError` to false to re-attempt child render
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_
  - **Requirement:** #2
  - **Dependencies:** None

  - [x] 6.2 Wrap RouterProvider with ErrorBoundary in App
    - Update `src/app.tsx` to wrap `RouterProvider` inside `ErrorBoundary`
    - _Requirements: 2.5_
  - **Requirement:** #2
  - **Dependencies:** 6.1

  - [x] 6.3 Write unit tests for ErrorBoundary
    - Test catches render error and shows fallback
    - Test retry resets and re-renders children
    - Test re-throw shows fallback again (no infinite loop)
    - Test button is keyboard accessible (focusable, operable via Enter/Space)
    - _Requirements: 2.1, 2.3, 2.4, 2.7_
  - **Requirement:** #2
  - **Dependencies:** 6.1

- [x] 7. Lazy load route components
  - [x] 7.1 Create `lazyWithRetry` utility
    - Create `src/lib/lazy-with-retry.ts`
    - Wrap `React.lazy` with retry logic: up to 2 retries on import failure
    - After exhausting retries, throw error (caught by ErrorBoundary)
    - _Requirements: 5.5_
  - **Requirement:** #5
  - **Dependencies:** 6.1

  - [x] 7.2 Create `LoadingSpinner` suspense fallback
    - Create `src/components/ui/loading-spinner.tsx`
    - Centered spinner with `aria-label="Loading page"`
    - _Requirements: 5.4_
  - **Requirement:** #5
  - **Dependencies:** None

  - [x] 7.3 Convert route imports to lazy loading
    - Update `src/routes.tsx` to use `lazyWithRetry` for all page components
    - Keep `ProtectedRoute`, `PublicOnlyRoute`, `AppShell` as eager imports
    - Wrap lazy routes in `React.Suspense` with `LoadingSpinner` fallback
    - _Requirements: 5.1, 5.2, 5.3_
  - **Requirement:** #5
  - **Dependencies:** 7.1, 7.2

  - [x] 7.4 Write unit test for `lazyWithRetry`
    - Test succeeds after 1 failure (retry works)
    - Test fails after 3 total failures (retries exhausted)
    - _Requirements: 5.5_
  - **Requirement:** #5
  - **Dependencies:** 7.1

- [x] 8. Checkpoint - Verify lazy loading and error boundary
  - Ensure all tests pass, ask the user if questions arise.
  - **Requirement:** #5
  - **Dependencies:** 7.3, 6.2

- [x] 9. Make dialogs accessible with Radix Dialog
  - [x] 9.1 Add `@radix-ui/react-dialog` and create shadcn Dialog component
    - Install `@radix-ui/react-dialog` dependency
    - Create `src/components/ui/dialog.tsx` with standard shadcn exports (Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose)
    - _Requirements: 6.1_
  - **Requirement:** #6
  - **Dependencies:** None

  - [x] 9.2 Refactor EntryModal to use Radix Dialog
    - Replace custom modal markup in `src/components/entries/entry-modal.tsx` with Radix Dialog primitives
    - Ensure `role="dialog"`, `aria-modal="true"`, focus trapping, Escape dismissal
    - Add `aria-labelledby` pointing to dialog title
    - Radix handles scroll lock automatically
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.8_
  - **Requirement:** #6
  - **Dependencies:** 9.1

  - [x] 9.3 Refactor DeleteConfirmDialog to use Radix Dialog
    - Replace custom modal markup in `src/components/entries/delete-confirm-dialog.tsx` with Radix Dialog primitives
    - Ensure `role="dialog"`, `aria-modal="true"`, focus trapping, Escape dismissal
    - Add `aria-labelledby` pointing to dialog title
    - _Requirements: 6.3, 6.4, 6.5, 6.7, 6.8_
  - **Requirement:** #6
  - **Dependencies:** 9.1

  - [x] 9.4 Write accessibility tests for dialogs
    - Test EntryModal: role="dialog", aria-modal, aria-labelledby, Escape closes, focus trap
    - Test DeleteConfirmDialog: same accessibility assertions
    - _Requirements: 6.2, 6.3, 6.7_
  - **Requirement:** #6
  - **Dependencies:** 9.2, 9.3

- [x] 10. Add `formatElapsed` property test
  - [x] 10.1 Write property test for time formatting
    - **Property 3: Time formatting correctness**
    - **Validates: Requirements 9.4**
    - Create or extend `src/lib/__tests__/time-utils.test.ts`
    - Use fast-check to generate random non-negative integers
    - Assert round-trip: parsing `HH:MM:SS` back yields `Math.floor(ms / 1000)` total seconds
    - Assert zero-padding and range constraints (minutes/seconds in [0, 59])
  - **Requirement:** #9
  - **Dependencies:** 1.2

- [x] 11. Final checkpoint - Full verification
  - Ensure all tests pass, ask the user if questions arise.
  - Run `npm run build` to confirm no TypeScript or bundling errors
  - Verify zero bare `zod` imports with grep
  - Verify zero `console.log` in tracker.tsx
  - Verify no local `fmt()` in tracker.tsx
  - **Requirement:** #1, #2, #3, #4, #5, #6, #7, #8, #9
  - **Dependencies:** 3, 4.2, 5.1, 8, 9.3, 10.1

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Pre-cleanup tasks (tier 1) must complete before TrackerPage extraction (tier 2)
- Auth decoupling, Zod standardization, Error Boundary, and Dialog work are independent of each other

## Task Dependency Graph

```json
{
  "waves": [
    { "tasks": ["1.1", "4.1", "5.1", "6.1", "7.2", "9.1"] },
    { "tasks": ["1.2", "1.3", "4.2", "4.3", "6.2", "6.3", "7.1", "9.2", "9.3"] },
    { "tasks": ["2.1", "2.2", "7.3", "7.4", "9.4", "10.1"] },
    { "tasks": ["2.3", "2.5", "2.6"] },
    { "tasks": ["2.4"] }
  ]
}
```
