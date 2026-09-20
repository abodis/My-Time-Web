# Onboarding Experience Brainstorm

*Status: draft — all decisions locked, non-owner + avatar API questions resolved with backend. Ready to spec.*

## What We're Building

A first-run onboarding flow that gets a new owner from signup to a **non-empty, understood workspace** and hands off to their first timer start — while teaching the MyTime mental model (tags → activities → track → report) inline as they set up, not via a slideshow.

## Core Problem

A brand-new user who lands on an empty tracker doesn't understand the MyTime model (tags as billable codes, activities under projects, live tracking feeding reports) and has nothing to track. Blank workspace + unexplained concepts = confusion and early churn. The flow must both **populate** the workspace and **educate** the user, without forcing an unskippable tour.

## Activation Moment (the north star)

**First timer start on a real activity.** Every step is judged against how fast it gets the user to that moment. Live tracking is the product thesis; the example project exists so reports aren't empty *later*, but the aha is tracking. (Research: define ONE activation event and optimize the whole flow toward it.)

## Key Decisions Made

- **Owner vs non-owner split** (🟢): Owner gets the full setup wizard. Invited (non-owner) users get a lightweight welcome only — no currency/account/seeding steps, since they inherit an already-configured account.
- **Activation = first timer start** (🟢): The wizard ends by handing off to a populated tracker, not by "completing setup."
- **Hybrid setup depth** (🟢): Required profile step (`POST /onboarding`), then the user chooses a workspace path: **fast path** (seed example project) OR **guided path** (create their first real project). Not minimal-only, not full-guided-only.
- **No empty workspace** (🟢): The seeding *decision* is required — user must end with something in their workspace (example OR real project). Which path is their choice; skipping to nothing is not allowed.
- **Teach inline, no slideshow** (🟢): Concepts are explained at the moment they're relevant (on the actual field/step), plus one short "what you set up / what's next" summary. No separate unskippable teaching screens.
- **Guided path walks the full chain** (🟢): tag → project → activity → assign-to-self, with **smart pre-filled defaults** (tag color pre-selected blue, activity auto-assigned to self) so it's guided, not laborious. This is where most teaching lands — the user creates each concept by hand.
- **Flow order = data dependency, framing = value story** (🟢): Sequence follows what's technically required (can't make an activity without a project), but each step is framed with the *why* ("Tags are billable work codes — they connect your time to what clients pay").
- **Required vs skippable** (🟢): `POST /onboarding` (name/timezone/currency) required; workspace seeding required (pick a path); **team invites optional/skippable**, owners only, framed "set up your team (optional)".
- **Hand-off pointer** (🟢): After setup, land on the populated tracker with **one contextual pointer** at an activity card ("Tap to start tracking"), dismissed on first start. No banner, no tour.
- **Avatar deferred from onboarding v1** (🟢): An upload endpoint now exists (`POST /settings/avatar/upload`, presigned S3 POST), but avatar stays OUT of the onboarding wizard. It's account-scoped (needs `X-Account-Id`), a self-contained upload dance, and adds no activation value on the first-run critical path. Belongs with the settings-page avatar spec. Onboarding requests simply omit `avatar`.
- **Timezone default** (🟢): Pre-fill from browser via `Intl.DateTimeFormat().resolvedOptions().timeZone`, user confirms/changes. Never a blind dropdown hunt.
- **Completion semantics** (🟢): `onboarding.completed` is stamped by `POST /onboarding` (the profile step). Optional steps (invites, and the un-chosen seeding path) never re-prompt via the wizard — they're discoverable in-app. One `POST /onboarding` = done forever.

## Proposed Flow

### Owner — full wizard (route: `/onboarding`)

1. **Welcome + Profile** *(required → `POST /onboarding`)*
   - Fields: displayName (default from `GET /me`), timezone (default from browser), currency (dropdown GBP/EUR/USD/PLN).
   - Framing: "Let's set up your account." Currency explained as "what your rates and reports are shown in."
   - On submit: `POST /onboarding` stamps `completed`.
2. **Choose your workspace path** *(required decision)*
   - **Fast path:** "Start with an example project" → `POST /onboarding/example-project` (seeds Example Project + Consulting tag [blue] + Kickoff activity assigned to user + 1 sample entry).
   - **Guided path:** "Create your first project" → inline chain below.
3. **Guided path chain** *(only if guided chosen; each step teaches its concept)*
   - Tag (`useCreateTag`, color pre-filled blue) → "Tags are billable work codes."
   - Project (`useCreateProject`) → "Projects group your work and hold the budget."
   - Activity (`useCreateActivity`, auto-assigned to self) → "Activities are the tasks you actually time."
4. **Invite your team** *(optional, skippable, owners only — `useInviteMember`)*
   - Framed "set up your team (optional)."
5. **Summary + hand-off** → navigate to tracker with one contextual pointer at an activity card.

### Non-owner — lightweight welcome

1. Confirm/set displayName + timezone (per-user, still useful).
2. 1-2 inline cards explaining the track → report model.
3. Point at already-assigned activities on the tracker.
   - **Save path (resolved):** non-owner calls `POST /onboarding/light` (`displayName` + `timezone` required, `avatar` optional, no currency). Returns `{message}` and stamps `onboarding.completed`. The owner `POST /onboarding` (which 404s without an owned account) is never called on this branch.

## Endpoint Map (confirmed against openapi.json)

| Endpoint | Who | Account-scoped | Body | Notes |
|----------|-----|----------------|------|-------|
| `GET /me` | all | No (no `X-Account-Id`) | — | `{user, accounts[], onboarding}`. Gate signal. |
| `POST /onboarding` | owner | needs owned account | `displayName`, `timezone`, `currency` req; `avatar` opt | 404 if no owned account. |
| `POST /onboarding/light` | non-owner | No | `displayName`, `timezone` req; `avatar` opt | No currency. Returns `{message}`. |
| `POST /onboarding/example-project` | owner | yes | none | 201; once-only (409 on repeat). |
| `POST /settings/avatar/upload` | all | yes (`X-Account-Id`) | `contentType` | Presigned S3 POST. **Deferred to settings spec.** |

`GET /me` payload shapes (confirmed): `MeUser{id, email, displayName?, timezone?, avatar?}` — displayName/timezone/avatar all nullable (a fresh user has them null → wizard pre-fills displayName from here but must handle null). `MeAccount{id, name, role, isOwner}` all required — `isOwner` is the branch key. `MeOnboarding{completed, completedAt?}`.

## Constraints Discovered

- **`POST /onboarding` requires an owned account** — 404 if none. Non-owners use `POST /onboarding/light` instead (resolved).
- **`GET /me` is account-agnostic** — called without `X-Account-Id`. The client's `isAccountAgnosticPath` in `src/api/client.ts` must be extended to exclude `/me` (currently only excludes auth, `GET /accounts`, `/palette`).
- **`/me` not in generated schema yet** — must run `npm run api:generate` after the OpenAPI spec is in place, before implementation, or `client.GET("/me")` is untyped (TS errors).
- **`POST /onboarding/example-project` is once-only** — second call → 409. Wizard must not offer it again after success.
- **Currency allow-list**: GBP/EUR/USD/PLN, case-insensitive, else 400. Reuse `SUPPORTED_CURRENCIES` dropdown pattern (`src/lib/currency.ts`) — never free-text.
- **Roles**: user/manager/admin hierarchical + `isOwner` boolean. Owner-only steps gate on `isOwner`, not role.
- **No existing stepper/wizard component** — must build a lightweight step-index component. `/select-account` is the full-screen, no-chrome route precedent; `ProjectTabs` is the closest styling reference.
- **API date format**: sample entry / any timestamps must strip milliseconds (`YYYY-MM-DDTHH:mm:ssZ`), per project rule.

## Integration Points

- **Entry gate**: after login → `/select-account` resolves account → check `GET /me` `onboarding.completed`; if false and owner, route to `/onboarding` instead of tracker. (Injection point: end of `SelectAccountPage` autoSelect branch, or in `ProtectedRoute`.)
- **Route**: new guarded `/onboarding` under `ProtectedRoute`, OUTSIDE `<AppShell />` (mirrors `/select-account`). Add `onboarding: "/onboarding"` to `paths`.
- **Reused hooks**: `useCreateProject`, `useCreateTag`, `useCreateActivity`, `useInviteMember` (existing, unchanged). New hooks needed: `useMe` (`GET /me`), `useCompleteOnboarding` (`POST /onboarding`), `useCompleteLightOnboarding` (`POST /onboarding/light`), `useSeedExampleProject` (`POST /onboarding/example-project`).
- **Forms**: react-hook-form + Zod (`zod/v4`), matching `invite-member-dialog.tsx` idiom.
- **Colors**: tag swatches resolve from `GET /palette`; store color name tokens, not hex (blue default).

## Verification Plan

- **Correct = **: a fresh owner completes profile → picks a path → lands on a populated tracker → can start a timer, with `onboarding.completed` true afterward and no re-prompt on next login.
- **Checks**:
  - `GET /me` gate: fresh account (completed=false) → wizard; returning user (completed=true) → straight to tracker.
  - `POST /onboarding` validation: rejects unsupported currency (400), missing owned account (404).
  - Example-project path: seeds correctly; second attempt handled (409 → no error surfaced, treated as already-done).
  - Guided path: tag/project/activity created and activity assigned to self; tracker shows it.
  - Non-owner branch: no currency/seeding steps shown; lands on assigned activities.
  - Client wiring: `/me` excluded from `X-Account-Id` injection; types regenerated.
- **Human validation zones** (sign-off): the actual instructional copy/tone per step; the non-owner flow once OQ-1 is answered.
- **Tests**: Playwright smoke for the owner happy path (fresh → wizard → tracker → first start) once built. Unit-test the gate decision logic.

## Resolved Questions

- [x] **OQ-1 — non-owner save path:** `POST /onboarding` 404s early for a non-owner (guard runs before any write; nothing saved). Backend added `POST /onboarding/light` (Option B: separate endpoint, profile + stamp, no currency). Non-owner branch uses it.
- [x] **OQ-2 — avatar:** Endpoint now exists (`POST /settings/avatar/upload`, presigned S3 POST; `avatar` field on onboarding = the returned key/reference string, ≤500 chars, not a data URI). Confirmed **deferred** from onboarding to the settings-page avatar spec.

## Open Questions

- [ ] **OQ-3:** Where exactly does the entry gate live — `SelectAccountPage` vs `ProtectedRoute`? (Implementation detail; resolve during spec.)
- [ ] **OQ-4:** Does the un-chosen seeding path stay discoverable in-app (e.g. "add example project" in an empty state), or is it wizard-only? Leaning discoverable, low priority.

## Next Steps

Backend blockers cleared (OQ-1, OQ-2 resolved). Ready to spec — bias toward small, independently testable units.

1. **Prep:** run `npm run api:generate` (picks up `/me`, `/onboarding`, `/onboarding/light`, `/onboarding/example-project`); extend `isAccountAgnosticPath` in `src/api/client.ts` to exclude `/me` and both `/onboarding*` non-scoped calls. (`/onboarding/example-project` and `/settings/avatar/upload` ARE account-scoped — leave them to get `X-Account-Id`.) This is the `decisions.md`-worthy change once done.
2. Spec #1 (small): **entry gate + `useMe` hook** — route fresh users to `/onboarding` when `onboarding.completed` is false; branch owner vs non-owner via `isOwner`. Testable in isolation.
3. Spec #2 (small): **owner wizard shell + profile step** (`POST /onboarding`) — step component + required profile form (displayName pre-filled from `/me`, timezone from browser, currency dropdown).
4. Spec #3 (small): **workspace path** — fast (example project) vs guided (tag→project→activity chain with pre-filled defaults).
5. Spec #4 (small): **optional invites step + summary + tracker hand-off pointer**.
6. Spec #5 (small): **non-owner lightweight welcome** (`POST /onboarding/light`).
7. Later, separate: **settings-page avatar upload** (presigned POST flow) — not part of onboarding.
