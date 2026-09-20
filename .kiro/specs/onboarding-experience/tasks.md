# Implementation Plan: Onboarding Experience

## Overview

Incremental, test-driven build of the first-run onboarding flow. Types and API-client scoping come first (everything else depends on them), then the server-state hooks, then the pure entry-gate + routing, then session UI state, then the owner wizard steps in flow order, then the non-owner welcome, then the Tracker_Pointer hand-off, closing with a Playwright smoke of the owner happy path. One property test (fast-check, ≥100 iterations) covers the entry-gate decision; remaining tests are behavior-focused unit and integration tests on the money paths. Tests are written alongside their unit. TypeScript strict (no `any`), functional components, TanStack Query for server state, Zustand for UI-only state, react-hook-form + Zod (`zod/v4`), kebab-case files, PascalCase components, `@/*` alias. Run tests with `vitest --run`.

## Tasks

- [x] 1. Generate API types for onboarding endpoints
  - [x] 1.1 Regenerate the API schema
    - Run `npm run api:generate` to regenerate `src/api/schema.d.ts` from `docs/openapi.json`, picking up `MeResponse`, `OnboardingRequest`, `LightOnboardingRequest`, `ExampleProjectResponse` and the paths `GET /me`, `POST /onboarding`, `POST /onboarding/light`, `POST /onboarding/example-project`
    - Confirm the generated schema contains the four types so `client.GET("/me")` / `client.POST("/onboarding")` are typed (no TS2554 / untyped-path errors)
    - _Requirements: 1.1_

- [x] 2. Scope the API client for onboarding endpoints
  - [x] 2.1 Extend `isAccountAgnosticPath` in `src/api/client.ts`
    - Add anchored predicates: `GET /me`, `POST /onboarding$`, `POST /onboarding/light$` are account-agnostic (omit `X-Account-Id` and skip the account-error redirect); the `$`-anchored `onboarding$` must NOT match `onboarding/example-project`, and `/onboarding/example-project` stays account-scoped (keeps `X-Account-Id`)
    - Do not broaden any existing exclusions (auth, `GET /accounts`, `/palette`, `/settings/avatar/upload`)
    - _Requirements: 1.2, 1.3, 1.4_
  - [x] 2.2 Write unit tests for `isAccountAgnosticPath`
    - Assert `GET /me`, `POST /onboarding`, `POST /onboarding/light` are agnostic
    - Assert `POST /onboarding/example-project` is NOT agnostic (the counterexample), and that a `GET /onboarding` variant does not accidentally match a `POST`-only rule
    - _Requirements: 1.2, 1.3, 1.4_

- [x] 3. Add onboarding server-state hooks and query key
  - [x] 3.1 Add the `me` query key
    - Add `me: { all: () => ["me"] as const }` to `src/api/query-keys.ts`
    - _Requirements: 1.1_
  - [x] 3.2 Implement `useMe` in `src/hooks/use-me.ts`
    - `GET /me` via the generated client; `queryKey: queryKeys.me.all()`; typed `MeResponse`; throw on error to match existing hook shape
    - _Requirements: 1.1, 2.1, 2.2_
  - [x] 3.3 Implement completion/seed mutations in `src/hooks/use-onboarding.ts`
    - `useCompleteOnboarding` (`POST /onboarding`) → on success invalidate `me`, `account`, `profile`
    - `useCompleteLightOnboarding` (`POST /onboarding/light`) → on success invalidate `me`, `profile`
    - `useSeedExampleProject` (`POST /onboarding/example-project`) → on success (201) invalidate `projects`, `tags`, `activities`
    - Every completion mutation MUST invalidate `queryKeys.me.all()` so the gate re-reads `completed = true`; all hooks `throw error` on failure
    - _Requirements: 1.1, 1.5, 5.2, 10.1, 10.2, 10.6_
  - [x] 3.4 Write unit tests for the hooks
    - Mock the client; assert each mutation invalidates the documented keys on success and throws on failure; assert failure does not invalidate `me`
    - _Requirements: 1.5, 10.1, 10.2, 10.6_

- [x] 4. Entry gate: pure decision + routing wiring
  - [x] 4.1 Implement `resolveEntryTarget(me)` pure function
    - Place in `src/lib/` (e.g. `onboarding-gate.ts`); return `"tracker"` when `onboarding.completed` is `true`; else `"wizard"` when resolved account `isOwner` is `true`, `"welcome"` when `isOwner` is `false`; `"stay"` when onboarding status is absent/malformed
    - No `any`; typed against generated `MeResponse`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 10.3, 10.4, 10.5_
  - [x] 4.2 Write property test for `resolveEntryTarget` (fast-check, ≥100 iterations)
    - **Property 1: Entry-gate decision is totally determined by (completed, isOwner)**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 10.3, 10.4, 10.5**
    - Generators: random `MeResponse` with `completed` bool/absent, `isOwner` bool, nullable displayName, 0..n accounts; tag `// Feature: onboarding-experience, Property 1`
  - [x] 4.3 Add the `/onboarding` route and path
    - Add `onboarding: "/onboarding"` to `paths`; register a guarded `/onboarding` route under `ProtectedRoute` but OUTSIDE `<AppShell />` (full-screen, no chrome), mirroring `/select-account`
    - _Requirements: 2.6, 2.7_
  - [x] 4.4 Wire the gate into `SelectAccountPage`
    - Replace the two `navigate(paths.tracker, ...)` calls with a call through `resolveEntryTarget(me)` (reading `useMe`): route to `/onboarding` for wizard/welcome, `/` for tracker; on `"stay"` remain on the account-resolution screen and show an error that onboarding status could not be retrieved (no routing)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 4.5 Write unit tests for the gate wiring
    - Mock `useMe`; assert completed→tracker, incomplete+owner→`/onboarding`, incomplete+non-owner→`/onboarding`, error/absent→stay with error message
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Onboarding session UI store
  - [x] 5.1 Implement `src/stores/onboarding-store.ts` (Zustand)
    - UI-only, session-scoped (not persisted): `step`, `chosenPath`, `seededExample`, `createdSummary`, `showTrackerPointer` and actions `goTo`, `choosePath`, `markSeeded`, `recordCreated`, `armTrackerPointer`, `dismissTrackerPointer`, `reset`
    - Follow Zustand-in-effects rules (selector reads, imperative `getState()` writes in callbacks)
    - _Requirements: 4.1, 5.5, 8.2, 8.4, 8.6, 10.4, 10.5_

- [x] 6. Onboarding page shell + owner/non-owner branch
  - [x] 6.1 Implement `OnboardingPage` in `src/pages/app/onboarding.tsx`
    - Read `useMe`; guard: `completed`→redirect to tracker, error→inline message; branch `isOwner`→`OwnerWizard`, else→`NonOwnerWelcome`; full-screen, no shell
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_
  - [x] 6.2 Write unit tests for `OnboardingPage`
    - Mock `useMe`; assert redirect when completed and error-guard render on failure (per-`isOwner` branch rendering is covered by the Playwright smoke)
    - _Requirements: 2.2, 2.3_

- [x] 7. Owner wizard shell + stepper
  - [x] 7.1 Implement `WizardStepper` in `src/components/onboarding/wizard-stepper.tsx`
    - Presentational numbered-dots + labels indicator; props `steps: string[]`, `currentIndex: number`
    - _Requirements: 2.7_
  - [x] 7.2 Implement `OwnerWizard` in `src/components/onboarding/owner-wizard.tsx`
    - Orchestrate the step machine from the onboarding store (`profile → path → guided|fast → invite → summary`); render current step + `WizardStepper`
    - _Requirements: 2.4, 2.6_

- [x] 8. Profile step
  - [x] 8.1 Implement `ProfileStep` + `profileSchema` in `src/components/onboarding/profile-step.tsx`
    - Fields displayName / timezone / currency; `profileSchema` (`zod/v4`): displayName trim 1–100, timezone required, currency `z.enum` from `SUPPORTED_CURRENCIES` (GBP, EUR, USD, PLN); currency dropdown populated from `SUPPORTED_CURRENCIES`; pre-fill displayName from `me.user.displayName ?? ""`, timezone from `Intl.DateTimeFormat().resolvedOptions().timeZone`
    - Submit via `useCompleteOnboarding` with displayName/timezone/currency ONLY (avatar omitted); on success advance to `path`; on 400 currency / 404 missing-owned-account stay on step, retain values, show error; validation blocks submit before request
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_
  - [x] 8.2 Write integration tests for Profile step error branches
    - Mock the mutation: assert 400 and 404 keep the user on the step with values retained and an error shown; assert success advances and (via invalidation) `me` reflects completed
    - _Requirements: 3.9, 3.10, 3.11, 10.1_

- [x] 9. Workspace path step
  - [x] 9.1 Implement `WorkspacePathStep` in `src/components/onboarding/workspace-path-step.tsx`
    - Two selectable cards (Fast / Guided) each labeled with name + outcome; advance disabled until exactly one selected; attempting to advance with none selected blocks and shows a prompt to select one; write choice via `choosePath`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 10. Fast path seeding
  - [x] 10.1 Implement `FastPathSeeder` in `src/components/onboarding/fast-path-seeder.tsx`
    - Fire `useSeedExampleProject`; on 201 mark `seededExample` and advance to invite; on 409 treat as already-seeded, advance, show NO error; on other status or >30s (via `AbortController`) stay, show "seeding failed", preserve retry; never re-offer Fast path once completed in-session
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 10.2 Write integration tests for `FastPathSeeder`
    - Mock 201 / 409 / 500 / timeout: assert advance-and-mark, silent-advance, and stay-with-retry respectively
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 11. Guided path chain
  - [x] 11.1 Implement `InlineConcept` in `src/components/onboarding/inline-concept.tsx`
    - Small presentational explainer card (reused by guided chain + non-owner welcome)
    - _Requirements: 6.4_
  - [x] 11.2 Implement `GuidedChain` in `src/components/onboarding/guided-chain.tsx`
    - Ordered sub-steps tag → project → activity; per-sub-step Zod schemas (`zod/v4`); tag color forced to `"blue"` token; activity auto-assigned to current user; inline concept copy before each submit; reuse `useCreateTag` / `useCreateProject` / `useCreateActivity`; on required-field-empty reject + retain + stay + field error; on create failure retain + stay + error; on all three created advance to invite and `recordCreated`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 12. Optional team invites
  - [x] 12.1 Implement `InviteStep` in `src/components/onboarding/invite-step.tsx`
    - Owner-only; dynamic email list + skip control labeled optional; `inviteSchema` (`zod/v4`, each entry `.email()`, max 20); skip or zero-entry submit advances to summary sending nothing; all-valid submit sends one `useInviteMember` per entry then advances; any invalid entry rejects, stays, identifies each invalid entry, retains values; send failure stays with error + retained values for retry
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  - [x] 12.2 Write integration test for invite fan-out
    - Mock `useInviteMember`: assert an all-valid list sends one invite per entry and advances to summary; assert any-invalid list rejects, sends nothing, identifies each invalid entry, and retains values; assert send failure stays with error and retained values
    - _Requirements: 7.4, 7.6, 7.7_

- [x] 13. Summary step and tracker hand-off
  - [x] 13.1 Implement `SummaryStep` in `src/components/onboarding/summary-step.tsx`
    - Recap of created/seeded items from `createdSummary` (tag, project, activity) + next-step copy; on complete `armTrackerPointer` and navigate to tracker; on navigation failure remain on step with error + retry
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [x] 14. Tracker pointer hand-off
  - [x] 14.1 Implement `TrackerPointer` in `src/components/tracker/tracker-pointer.tsx`
    - Render exactly one contextual hint at the first activity card when `showTrackerPointer` is set
    - _Requirements: 8.4_
  - [x] 14.2 Wire arm + dismiss into the tracker
    - Show pointer on hand-off (store `showTrackerPointer`); dismiss on first timer start by calling `dismissTrackerPointer()` after the successful start inside the existing `useBlockClick(timerControls)` path in `tracker.tsx` (no new timer-start code path)
    - _Requirements: 8.4, 8.6_

- [x] 15. Non-owner lightweight welcome
  - [x] 15.1 Implement `NonOwnerWelcome` + `welcomeSchema` in `src/components/onboarding/non-owner-welcome.tsx`
    - Fields displayName / timezone (no currency, no seeding); `welcomeSchema` (`zod/v4`) displayName trim 1–100, timezone required; pre-fill displayName from `me.user.displayName ?? ""`, timezone from `Intl.DateTimeFormat().resolvedOptions().timeZone`; 1–2 `InlineConcept` explainer cards on the track-to-report model; submit `useCompleteLightOnboarding` with displayName/timezone; missing field blocks + validation message; on failure stay + error + retain values + not complete; on success navigate to tracker
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_
  - [x] 15.2 Write integration test for light-onboarding failure/success
    - Mock the mutation: assert failure stays with error + retained values + not complete; assert success navigates to tracker and invalidation reflects completed
    - _Requirements: 9.8, 9.9, 10.2_

- [x] 16. Checkpoint - Ensure all tests pass
  - Run `vitest --run` and ensure all unit, integration, and property tests pass; ask the user if questions arise.

- [x] 17. Playwright owner happy-path smoke
  - Fresh owner account → Profile step → pick a path → populated tracker → first timer start; assert `onboarding.completed` afterward and no re-prompt on reload; local login `alex@demo.test / password123`
  - _Requirements: 2.1, 3.11, 4.4, 8.3, 8.6, 10.3_

## Notes

- Tasks marked with `*` are optional (tests and the smoke) and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each task references specific requirement clauses for traceability.
- The OQ-4 tracker empty-state "add example project" affordance is out of scope per the design and is intentionally omitted.
- Only Property 1 (`resolveEntryTarget`, task 4.2) remains a fast-check property test (≥100 iterations); do not hand-roll generators. The design still documents P2–P4, but per the testing steering those are not exercised as property tests here (they would test Zod itself or a render output). The remaining `*` tests are behavior-focused unit/integration tests on the money paths.
- `npm run api:generate` (task 1) MUST run before any code that calls `client.GET("/me")` / onboarding paths, or those calls are untyped.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "3.3", "4.1", "5.1"] },
    { "id": 3, "tasks": ["3.4", "4.2", "4.3"] },
    { "id": 4, "tasks": ["4.4", "6.1", "7.1", "11.1"] },
    { "id": 5, "tasks": ["4.5", "6.2", "7.2", "8.1", "9.1", "15.1"] },
    { "id": 6, "tasks": ["8.2", "10.1", "11.2", "12.1", "13.1", "15.2"] },
    { "id": 7, "tasks": ["10.2", "12.2", "14.1"] },
    { "id": 8, "tasks": ["14.2"] },
    { "id": 9, "tasks": ["17"] }
  ]
}
```
