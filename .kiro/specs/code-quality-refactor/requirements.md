# Requirements Document

## Introduction

This feature addresses high and medium impact code quality issues identified through a SOLID principles and React/Vite best practices review. The refactoring targets Single Responsibility Principle violations, testability concerns, accessibility gaps, performance issues, and code hygiene problems across the My Time Web application.

## Glossary

- **Tracker_Page**: The main time-tracking page component at `src/pages/app/tracker.tsx` that displays activity blocks and manages timer interactions
- **Error_Boundary**: A React class component that catches JavaScript errors in its child component tree and renders a fallback UI instead of crashing the entire application
- **Auth_Hooks**: Custom React hooks in `src/hooks/use-auth.ts` that handle authentication mutations (login, register, confirm, forgot-password, reset-password)
- **Entry_Modal**: The form dialog component at `src/components/entries/entry-modal.tsx` used for creating and editing time entries
- **Delete_Confirm_Dialog**: The confirmation dialog component at `src/components/entries/delete-confirm-dialog.tsx` shown before deleting an entry
- **Route_Module**: The route definition file at `src/routes.tsx` that maps URL paths to page components
- **Timer_Store**: The Zustand store at `src/stores/timer-store.ts` managing real-time timer UI state
- **Radix_Dialog**: The accessible dialog primitive from Radix UI that provides role="dialog", aria-modal, focus trapping, and Escape key handling out of the box

## Requirements

### Requirement 1: Decompose TrackerPage into Focused Hooks

**User Story:** As a developer, I want the TrackerPage logic separated into focused custom hooks, so that each concern is independently testable and the component remains readable.

**Dependencies:** Requirements 7, 8, and 9 must be completed first (pre-cleanup before extraction).

#### Acceptance Criteria

1. THE Tracker_Page SHALL delegate data fetching (projects, tags, activities per non-archived project, today's entries, current timer) to a `useTrackerData` hook that returns an object containing: `isLoading` (boolean), `isError` (boolean), `allActivities` (flat list with project name), `tagMap`, `activityElapsedMap`, `currentTimer`, and a `refetchProjects` function
2. THE Tracker_Page SHALL delegate interval-based timer tick management to a `useTimerTick` hook that starts a 1-second interval calling `useTimerStore.getState().tick()` when the Zustand store transitions to running, clears the interval when it transitions to stopped, clears the interval on unmount, and rehydrates the store from `currentTimer` data when it indicates an active timer (no `endTime`)
3. THE Tracker_Page SHALL delegate activity block click handling to a `useBlockClick` hook that accepts the `startTicking`/`stopTicking` controls from `useTimerTick`, manages a `loadingActivityId` state, calls start/stop mutations, updates the Zustand store on success, invalidates `["timer", "current"]` and `["entries"]` query keys, and returns `{ handleBlockClick, loadingActivityId }`
4. WHEN the refactored Tracker_Page renders, THE Tracker_Page SHALL produce identical DOM structure and user-visible behavior as the pre-refactor version, verified by the existing test suite passing and a manual before/after visual comparison of loading, error, empty, idle, and running states
5. THE Tracker_Page component body SHALL contain only hook calls (`useTrackerData`, `useTimerTick`, `useBlockClick`, `useTimerStore` selectors), derived values (computed from hook return values without side effects), and JSX return statements — no `useEffect`, `useCallback`, `useRef`, `useMutation`, or `setInterval` calls directly in the component
6. THE three new hooks SHALL be structured such that each can be rendered via `renderHook` in a test harness with mocked API responses without requiring TrackerPage to be mounted (writing the tests themselves is out of scope for this spec)

### Requirement 2: Add Error Boundary

**User Story:** As a user, I want the application to gracefully recover from runtime errors, so that a crash in one component does not unmount the entire application.

#### Acceptance Criteria

1. THE Error_Boundary SHALL catch JavaScript errors thrown during rendering, lifecycle methods, or constructors of its child component tree
2. WHEN an error is caught, THE Error_Boundary SHALL render a fallback UI that displays a heading indicating something went wrong, a non-technical description of the failure, and a retry button labeled "Try again"
3. WHEN the user clicks the retry button, THE Error_Boundary SHALL reset its error state and attempt to re-render the child component tree
4. IF the child component tree throws again immediately after a retry, THEN THE Error_Boundary SHALL render the fallback UI again without entering an infinite re-render loop
5. THE Error_Boundary SHALL wrap the RouterProvider in `src/app.tsx` so that all routed components are protected
6. IF a rendering error occurs in a child component, THEN THE Error_Boundary SHALL prevent the entire application from unmounting
7. THE Error_Boundary fallback UI SHALL be keyboard-accessible with the retry button focusable and operable via Enter or Space keys

### Requirement 3: Decouple Auth Hooks from Navigation

**User Story:** As a developer, I want auth hooks to return mutation results without performing navigation, so that hooks are testable in isolation and calling components control their own routing.

#### Acceptance Criteria

1. THE Auth_Hooks SHALL return TanStack Query mutation objects without embedding `useNavigate` or calling `navigate()` internally
2. WHEN a login mutation succeeds, THE Auth_Hooks SHALL store the received idToken, accessToken, and refreshToken via `setTokens()` and return the mutation result to the caller without navigating
3. WHEN a register, confirm, forgot-password, or reset-password mutation succeeds, THE Auth_Hooks SHALL return the mutation result to the caller without navigating
4. THE calling page components SHALL perform post-success navigation by passing an `onSuccess` callback to the mutation's `mutate()` call that invokes `navigate()` with the target route
5. THE Auth_Hooks SHALL remain free of any `react-router-dom` imports after refactoring
6. WHEN a login mutation succeeds, THE LoginPage SHALL navigate to "/"; WHEN a register mutation succeeds, THE RegisterPage SHALL navigate to "/confirm"; WHEN a confirm mutation succeeds, THE ConfirmPage SHALL navigate to "/login"; WHEN a forgot-password mutation succeeds, THE ForgotPasswordPage SHALL navigate to "/reset-password"; WHEN a reset-password mutation succeeds, THE ResetPasswordPage SHALL navigate to "/login"

### Requirement 4: Standardize Zod Imports

**User Story:** As a developer, I want all Zod imports to use a consistent import path, so that the codebase does not mix incompatible module versions at runtime.

#### Acceptance Criteria

1. THE Entry_Modal SHALL import Zod schema constructors from `zod/v4` instead of the bare `zod` module
2. WHEN any file in the codebase uses Zod validation, THE file SHALL import from `zod/v4` exclusively
3. THE application SHALL have zero import paths referencing the bare `zod` module for schema construction across all source files in `src/`
4. THE build SHALL produce no runtime warnings or errors related to Zod module resolution after standardization

### Requirement 5: Lazy Load Route Components

**User Story:** As a user, I want page components loaded on demand, so that the initial bundle size is smaller and the application loads faster.

#### Acceptance Criteria

1. THE Route_Module SHALL import all page components (LoginPage, RegisterPage, ConfirmPage, ForgotPasswordPage, ResetPasswordPage, TrackerPage, EntriesPage) using `React.lazy()` dynamic imports, while keeping route guards (ProtectedRoute, PublicOnlyRoute) and layout shells (AppShell) as eager imports
2. THE Route_Module SHALL wrap lazy-loaded routes in a `React.Suspense` boundary with a loading fallback
3. WHEN navigating to a route for the first time, THE Route_Module SHALL load the page component chunk on demand rather than including it in the initial bundle
4. THE loading fallback SHALL display a centered visual indicator that does not unmount or obscure previously rendered page content, and that includes an accessible label (aria-label or visible text) describing the loading state
5. IF a lazy-loaded chunk fails to load due to a network error, THEN a `lazyWithRetry` wrapper utility SHALL retry the dynamic import up to 2 times before surfacing a user-facing error message with a "Reload page" action

### Requirement 6: Make Dialogs Accessible

**User Story:** As a user relying on assistive technology, I want dialogs to follow WAI-ARIA dialog patterns, so that I can navigate and interact with them using a keyboard and screen reader.

#### Acceptance Criteria

1. THE project SHALL add `@radix-ui/react-dialog` as a dependency and generate a shadcn-style `Dialog` component in `src/components/ui/dialog.tsx` as the foundation for accessible modals
2. THE Entry_Modal SHALL use Radix_Dialog primitives to provide `role="dialog"`, `aria-modal="true"`, focus trapping, and Escape key dismissal
3. THE Delete_Confirm_Dialog SHALL use Radix_Dialog primitives to provide `role="dialog"`, `aria-modal="true"`, focus trapping, and Escape key dismissal
3. WHEN a dialog opens, THE dialog component SHALL move focus to the first focusable element inside the dialog within 100ms of the dialog becoming visible
4. WHEN the user presses the Escape key while a dialog is open, THE dialog component SHALL close the dialog and return focus to the element that was focused immediately before the dialog opened
5. WHILE a dialog is open, THE dialog component SHALL trap keyboard focus within the dialog boundary so that pressing Tab on the last focusable element cycles focus to the first focusable element, and pressing Shift+Tab on the first focusable element cycles focus to the last focusable element
6. THE Entry_Modal SHALL associate its dialog element with the dialog heading via `aria-labelledby` so that screen readers announce the dialog title when the dialog receives focus
7. THE Delete_Confirm_Dialog SHALL associate its dialog element with the dialog heading via `aria-labelledby` so that screen readers announce the dialog title when the dialog receives focus
8. WHILE a dialog is open, THE dialog component SHALL prevent scrolling of the background page content behind the dialog overlay

### Requirement 7: Remove Side Effect from useMemo

**User Story:** As a developer, I want the accumulated time computation free of side effects, so that the code is safe under React 18 concurrent mode where useMemo may execute multiple times.

#### Acceptance Criteria

1. THE Tracker_Page SHALL compute `activityElapsedMap` inside `useMemo` using only its dependency values (`todayEntries`) and local variables, without writing to refs, calling console methods, or mutating any state external to the memo function
2. THE accumulated time map SHALL be derived purely from `todayEntries` data by summing `endTime - startTime` for each completed entry grouped by `activityId`, producing an identical Map output for identical `todayEntries` input regardless of how many times the computation executes
3. WHEN `handleBlockClick` requires the accumulated elapsed time for an activity, THE Tracker_Page SHALL read the value from the `activityElapsedMap` memo result or an effect-synchronized ref rather than from a ref written inside `useMemo`

### Requirement 8: Remove console.log Statements from Production Code

**User Story:** As a developer, I want debug logging removed from production source code, so that sensitive timer state is not exposed in user browser consoles.

#### Acceptance Criteria

1. THE Tracker_Page source file (`src/pages/app/tracker.tsx`) SHALL contain zero `console.log` statements
2. THE Tracker_Page SHALL produce no console output when timer start, stop, or accumulated-time operations execute at runtime
3. WHEN any `console.log` statement is removed, THE Tracker_Page SHALL preserve identical timer start, stop, and elapsed-display behavior with no functional regression

### Requirement 9: Eliminate Duplicated Time Formatting

**User Story:** As a developer, I want a single source of truth for time formatting, so that formatting logic is consistent and maintainable.

#### Acceptance Criteria

1. THE Tracker_Page SHALL NOT define a local `fmt()` function in `src/pages/app/tracker.tsx`
2. THE Tracker_Page SHALL NOT contain any import or reference to a local time-formatting function that duplicates logic already exported from `src/lib/time-utils.ts`
3. IF a future formatting need arises in the Tracker_Page that requires milliseconds-to-string conversion, THEN THE Tracker_Page SHALL import and use a named export from `src/lib/time-utils.ts` rather than defining a local implementation
4. IF the existing `formatElapsed` export does not cover the required output format, THEN a new named export SHALL be added to `src/lib/time-utils.ts` to provide the needed format
