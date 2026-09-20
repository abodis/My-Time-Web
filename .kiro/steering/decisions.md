---
inclusion: manual
description: "Project decision log — architectural choices, gotchas, resolved issues"
---

# Decision Log

<!-- Append new entries at the top. Format: ## [YYYY-MM-DD] Title -->
<!-- Fields: Problem, Decision, Rationale -->

## [2026-09-20] Duplicate-email identity + invited-user auto-account — fixed API-side (live on UAT)

**Problem:** Two related identity bugs surfaced during onboarding flow testing. (1) Registering an already-registered email silently created a SECOND separate user/account instead of failing — email was not unique per identity. (2) An invited email that registered got an auto-created personal "owner" account in addition to the invited membership, so login landed on `/select-account` with two accounts.
**Decision:** Both fixed at the API/Cognito layer (not frontend) and deployed to UAT (`api.mytimeblocks.app`):
- Email is now unique per identity, normalized to lowercase server-side across ALL auth calls (register/confirm/login/forgot/reset). `POST /auth/register` and `POST /auth/confirm` return `409 { type: "email_exists", message: "An account with this email already exists" }` on a duplicate (case-insensitive). Documented in openapi.json ErrorResponse on both endpoints.
- Invited users who register+confirm now join ONLY the invited account (invited role), no auto personal account. Non-invited sign-ups still get their own account. A "create your own workspace" entry for invited users is now a deliberate flow to build if wanted (won't happen automatically).
**Frontend impact:** No code change required. Register/confirm pages already surface the server `message` via `extractErrorMessage`, which renders the `email_exists` message correctly (no per-`type` branching added — YAGNI; the server message is user-appropriate). Casing normalization is transparent to the client. If a "create your own workspace" affordance for invited users is desired, that's net-new UI, not yet built.
**Verified firsthand on LOCAL (2026-09-20):** local dev DOES enforce uniqueness — duplicate register → `409 email_exists` and the uppercase variant → same `409` (case-insensitive), both shown on the register screen. So the auth-uniqueness assertions are confirmable on local, no UAT round-trip needed (earlier worry that local might return 200 on duplicates was wrong). Guided onboarding `assignCreator: true` also confirmed end-to-end: the created activity appears on the tracker, assigned to the creator, via the app's own `GET /activities` (one activity, correct account), with a single `GET /account/me` 200 and zero `400 missing_account_id`.
**Invited-user flow verified firsthand on LOCAL (2026-09-20):** owner invites `member@…` (role user, `POST /account/members` 201) → member registers+confirms+logs in the SAME email → app's own `GET /me` returns EXACTLY ONE account (the owner's account id, `role:user`, `isOwner:false`) — no auto-created personal account, and login did NOT land on `/select-account`. Acceptance is IMPLICIT (register+confirm links the invited email; there is NO accept-invite endpoint or frontend route — the API only exposes invite/list/revoke/resend). Gate routed the non-owner to NonOwnerWelcome (light onboarding), `POST /onboarding/light` 200 → tracker. Isolation-by-assignment confirmed: member's `GET /activities` is empty (owner's seeded activity NOT visible) even though the member's requests carry the owner's `X-Account-Id` — they see nothing because nothing is assigned to them. Local replicates the UAT fix (no local/UAT gap). NOT yet exercised: a member seeing an activity EXPLICITLY assigned to them (the positive side of isolation), multi-account invitees, and the resend/revoke-invitation endpoints.
**Rationale:** Email uniqueness is an identity-provider invariant — enforce at Cognito/API, never client-side (a client pre-check races the source of truth and is bypassable). OPEN UX QUESTION (product, not bug): whether invite acceptance should drop the user directly into the invited account vs. surface a picker — deferred. Env note: UAT was reset with fresh demo data on this deploy; demo logins (Password123!): alex@, dana@, evan@, faye@, gus@ demo.test.

## [2026-09-20] Local dev auth model + how to test flows (VERIFIED live)

**Problem:** Confusion about local auth. The local backend (`python3 local_server.py` → `http://localhost:8000`, proxied via Vite `/api`) prints `👤 Default user: 00000000-0000-0000-0000-000000000000 / Override with header: X-User-Id: <uuid>`. Earlier I wrongly assumed local is "always one hardcoded user" and that a prior "Alex's Freelance / Acme Corp / StartupXYZ" seed was an immutable fixture. Neither is true.
**Decision — how local auth actually works (all verified via direct `/api` probes):**
- No `X-User-Id` header AND no bearer token → requests resolve to the DEFAULT user `0000…0000` (email `dev@localhost`, one owner account, `onboarding.completed=false`, zero projects/tags/activities on a fresh backend).
- `X-User-Id: <known-uuid>` overrides the user; an UNKNOWN uuid → `404 {"type":"not_found","message":"User not found"}` (only users the backend knows resolve).
- The FRONTEND never sends `X-User-Id` — it authenticates with a Cognito-style bearer (`Authorization`). So **through the browser UI you are whoever you registered/logged in as**, not the default user. `POST /auth/login` DOES validate credentials locally: unknown creds → `401 {"type":"unauthorized","message":"Invalid credentials"}`. `POST /auth/register` auto-confirms and `POST /auth/confirm` accepts ANY code locally.
- Data IS isolated per registered user (confirmed: a freshly-registered `owner1@example.com` saw an empty tracker + only its own created items — no `dev@localhost` demo data). The old "Alex" data was a prior backend state, not a fixture.
**How to test onboarding flows locally (the correct recipe):**
1. Start backend: `python3 local_server.py` (must be running, else Vite `/api` returns 502). Frontend: user runs `npm run dev` (agent CANNOT — built-in execute_bash safeguard blocks it; ask the user for the port).
2. To get a FRESH owner into the wizard: `localStorage.clear()` in the browser, reload → redirected to `/login`. Use the UI **Register** flow with a UNIQUE, VALID-FORMAT email (e.g. `owner+<timestamp>@example.com` — note `dev@localhost` FAILS the client-side `z.email()` check because it has no TLD) and password ≥8 chars → Confirm (any code, e.g. `123456`) → Login. The entry gate routes an incomplete owner to `/onboarding`.
3. A registered user already onboarded stays completed → gate routes to `/` (tracker). To re-test the wizard, register a NEW unique email (reusing an email won't re-show the wizard).
4. Testing a DISTINCT SECOND user (e.g. the non-owner invitee) through the UI: register that email separately and log in as them — each registered email is its own user with its own data. (There is no in-UI `X-User-Id` switch; do it via separate register+login.)
5. Verify via network, not out-of-band probes: an agent `fetch('/api/...')` with no headers resolves to the DEFAULT dev user (wrong account) and will mislead you. Read the APP's own requests in the Playwright network log (they carry the real bearer + `X-Account-Id`), and check response bodies + console errors.
**Rationale:** The default-user + `X-User-Id` override is a dev convenience for curl/backend testing; the SPA path is real register/login. Isolation works — "new user sees only their data" IS reproducible locally via a fresh registration. Do not trust unauthenticated agent probes for per-user assertions.

## [2026-09-20] Guided onboarding activity absent from tracker — fix on API side (auto-assign creator)

**Problem:** New owner completes the guided chain (tag→project→activity, all `201`), lands on the tracker → "No activities available." Verified: the activity WAS created (`POST /projects/{id}/activities` → 201, e.g. "Draft NDA"), but `GET /activities` returned `{"activities":[],"meta":{"doneCount":0}}`. Root cause: `GET /activities` is "List all ASSIGNED activities" (openapi), and creating an activity does NOT auto-assign the creator; GuidedChain never calls `POST /activities/{id}/assignments`. Its `InlineConcept` copy wrongly claims "We'll assign this one to you … server-side."
**Decision:** Fix on the API side — `POST /projects/{id}/activities` should auto-assign the creating user (owner intent per design Req 6.3; also covers the example-project seed and every future create-activity caller in one place). Owned by the API team. Frontend left UNCHANGED (no explicit assignment call added). When the API lands: document the auto-assign in `docs/openapi.json`, then re-run the live guided flow to confirm the created activity appears on the tracker. Also verify the example-project seed assigns its activities so the fast path isn't empty.
**Rationale:** When frontend code/comments already assume a server-side behavior that doesn't exist, the contract — not the client — is the right fix site; one API change fixes all callers rather than each remembering to assign.

## [2026-09-20] GET /account/me 400 missing_account_id — `/(^|\/)me$/` matched /account/me

**Problem:** On every app load, `GET /account/me` (via `useProfile`) returned `400 {"type":"missing_account_id"}` — no `X-Account-Id` header attached — and the resulting account-error interceptor did a `window.location.href` reload, causing a loop. I first chased a "store hydration race"; that was wrong.
**Decision:** Root cause was `isAccountAgnosticPath` in `src/api/client.ts`: the bare-identity rule `/(^|\/)me$/` ALSO matched `/account/me`, so the client deliberately omitted `X-Account-Id` on the account-scoped profile endpoint. Fixed by excluding it: `/(^|\/)me$/.test(p) && !/account\/me$/.test(p) && method==="GET"`. Added a counterexample unit test in `client.test.ts` (asserts `/account/me` is NOT agnostic while bare `/me` still is). Verified live: `GET /account/me` now 200 with `x-account-id` attached. Also (defense-in-depth, separate concern) gated `useProfile`/`useAccount` on `activeAccountId` and added `clearAccountState()` to the three `clearAuth()`-only paths (client 401-refresh-fail, protected-route refresh-fail, select-account empty-accounts) to prevent stale `lastAccountId` cross-account bleed on the DEPLOYED multi-user backend.
**Rationale:** When a path classifier misbehaves, re-read the regex against the exact failing path FIRST and confirm header presence via network request-headers — don't theorize about timing. A `$`-anchored segment can still be a suffix of a longer path (`/me` inside `/account/me`).

## [2026-06-20] Onboarding wizard bounced to tracker after Profile step

**Problem:** The owner happy-path smoke (task 17) never reached Path/Fast/Invite/Summary. The Profile step's `POST /onboarding` (`useCompleteOnboarding`) invalidates `queryKeys.me.all()`; `OnboardingPage` re-reads `me` reactively via `useMe`, `resolveEntryTarget` then returns `"tracker"` (completed=true), and its `useEffect` navigated away mid-wizard. Owner landed on an empty tracker with no Tracker_Pointer (SummaryStep, which arms it, was unreachable). Contradicted design.md, which states post-Profile steps are "post-completion convenience within the same session" the wizard still owns.
**Decision:** In `OnboardingPage`, gate the completion→tracker redirect on `useOnboardingStore.step === "profile"` (via a `wizardInProgress` flag). Once the owner advances past Profile, keep `OwnerWizard` mounted even when `resolveEntryTarget` reports `"tracker"`; SummaryStep performs the final hand-off navigation. Backward-compatible: default step is `"profile"`, so deep-links by an already-completed user still redirect (existing unit tests unchanged, 5/5 pass).
**Rationale:** The gate and the wizard both read the same `me.completed` signal, but completion is stamped at step 1 of 5 — so any reactive redirect on `completed` will interrupt the flow it's supposed to guard. The store's session-scoped `step` is the correct discriminator between "arriving fresh" and "mid-flow." Confirmed end-to-end locally: fresh owner → wizard → Fast seed ("Consulting / Example Project / Kickoff meeting") → tracker with "Start your first timer" pointer.

## [2026-09-10] Site fully unreachable: registrar clientHold, not a deploy failure

**Problem:** After a routine `./deploy.sh prod`, `app.mytimeblocks.app` returned `DNS_PROBE_POSSIBLE` — the entire domain was unresolvable (no NS for the apex from any public resolver). Deploy was healthy: CloudFront `Deployed`, latest build in S3, cache invalidated, alias record present, origin resolved.
**Decision:** Root cause was Amazon Registrar placing `clientHold` on the domain because the ICANN registrant email was never verified. `clientHold` makes the `.app` registry pull the domain from DNS entirely (TLD returns SOA only, no delegation), so every subdomain goes dark. Fix is registrar-side only: verify the registrant email in Route 53 Registered Domains. No DNS change or redeploy needed — the zone and delegation were already correct.
**Rationale:** A clean deploy + healthy CloudFront + correct Route 53 zone/delegation can still be 100% dark if the registrar has a hold. When DNS fails wholesale (apex has no NS), check `aws route53domains get-domain-detail --query StatusList` early. Gotchas: registry republishes NS within minutes of clearing the hold, but NS TTL is 172800s (2 days) so cached negatives linger; `get-domain-detail` StatusList lags and may still show `clientHold` after it clears — trust public `dig` over the status field. `mcp` profile can't read Route 53 (AccessDenied) — use `andras` for zone and `route53domains` queries.

## [2026-09-07] Tag mutations silently dropped defaultRate/rateCurrency

**Problem:** Editing a tag's rate/currency never persisted. The dialog built a payload with `defaultRate`/`rateCurrency`, but `useCreateTag`/`useUpdateTag` destructured only `name`/`color` in their `mutationFn`, so those fields were discarded before the request body was built — no error, just a silent no-op.
**Decision:** Widened both mutations to accept and forward `defaultRate` and `rateCurrency` (both supported by `TagCreateRequest`/`TagUpdateRequest`). Also converted the tag currency field from a free-text input to a dropdown of `SUPPORTED_CURRENCIES` (USD/EUR/GBP/PLN), defaulting new tags to the account currency.
**Rationale:** A mutation's `mutationFn` param destructuring is the real contract — if a field isn't destructured and placed in the body, passing it from the caller does nothing. When adding a form field, verify the mutation actually forwards it.

## [2026-09-07] Single money formatter; account currency from useAccount, not profile

**Problem:** Monetary amounts rendered inconsistently — Team cost rate as `$65` (no decimals, hardcoded `$`), Tags rate as `0 USD` (trailing code), while Financial used proper `Intl` currency formatting.
**Decision:** Added `formatMoney(value, currency)` in `src/lib/currency.ts` (symbol + 2-decimal number, no trailing code) and routed Team, Tags, Activities rate-override, and Financial through it. Currency for management pages comes from a new `useAccount()` hook (`GET /account`).
**Rationale:** `AccountResponse.currency` is the single source of truth (one currency per account). `/account/me` (`ProfileResponse`) does NOT carry `currency`, so profile can't supply it. The currency symbol already identifies the currency, so a trailing `USD`/`EUR` is redundant.

## [2026-09-07] API client path checks must be prefix-agnostic (VITE_API_BASE_URL=/api)

**Problem:** Post-refactor, a failed login (401 on bad credentials) flashed "Invalid credentials" then did a full page reload, wiping the form and the error. The client's 401 handler treated it as an expired session: `refreshAccessToken()` (no token) → fail → `window.location.href = "/login"`. The intended guard to skip auth endpoints failed because in dev `VITE_API_BASE_URL=/api`, so request pathnames are `/api/auth/login` — root-anchored checks (`startsWith("/auth/")`, `pathname === "/palette"`, `=== "/accounts"`) never matched.
**Decision:** In `src/api/client.ts`, match API routes with segment-aware regexes that ignore the base prefix: `isAuthPath` = `/(^|\/)auth\//`; `isAccountAgnosticPath` uses `/(^|\/)accounts$/` and `/(^|\/)palette$/`. 401s from auth endpoints pass through to the caller (`useLogin`) instead of triggering refresh/logout. react-hook-form retains field values by default, so email/password persist.
**Rationale:** `VITE_API_BASE_URL` carries a path prefix in some environments, so pathname is not root-anchored to the API route. Any pathname-based routing logic in the client must match by segment, not from the string start. A failed login is a surfaced error, not an expired session — never hard-redirect on it.

## [2026-06-20] Brainstorm never creates specs

**Problem:** Brainstorm sessions sometimes drifted into creating `.kiro/specs/` folders with requirements/design/tasks, duplicating Kiro's built-in spec workflow.
**Decision:** Brainstorm always and only produces `.kiro/docs/brainstorms/[name].md`. Never creates spec artifacts.
**Rationale:** Kiro has a native spec workflow with its own parser and format expectations. Two competing spec formats caused contradictions and wasted steering space.

## [2026-06-15] Drag-and-drop state sync requires isDragActive guard

**Problem:** Syncing local sortable `items` state with query data during renders caused `onDragOver` optimistic reordering to be immediately overwritten, making `handleDragEnd` compute empty payloads (no API call).
**Decision:** Always guard render-time sync: `if (!isDragActive && items !== queryIds) setItems(queryIds)`.
**Rationale:** Without the guard, the re-render triggered by `setItems(move(...))` hits the sync block, which resets to original order before `handleDragEnd` fires.

## [2026-06-14] CSS 3D flip: front face relative, back face absolute

**Problem:** Card flip animation container collapsed to 0 height when both faces used `absolute inset-0`.
**Decision:** Front face is `relative` (provides intrinsic height), back face is `absolute inset-0` (overlays). Both get `backface-visibility: hidden`.
**Rationale:** A container with only absolute children has no intrinsic dimensions. The front face must participate in normal flow to size the container.

## [2026-06-14] dnd-kit drag handle required for full-cover buttons

**Problem:** Activity cards use `<button>` with `absolute inset-0` for timer click. PointerSensor cannot activate because the button captures all pointer events.
**Decision:** Use `handleRef` from `useSortable` on a dedicated drag handle element (`<GripVertical>` icon). Handle needs `touch-none`.
**Rationale:** Separating drag activation from the click target lets both interactions coexist without event conflicts.

## [2026-06-13] OptimisticSortingPlugin is per-item, not provider-level

**Problem:** Passing `OptimisticSortingPlugin` to `DragDropProvider`'s `plugins` prop caused double-registration and broken sort behavior.
**Decision:** Don't pass it to the provider. It's registered per-sortable-item by default in @dnd-kit/react v0.x.
**Rationale:** Discovered via experimentation. The library's architecture registers plugins at the item level through `useSortable`.

## [2026-06-12] TanStack Query onMutate throws silently skip mutationFn

**Problem:** Optimistic updates in `onMutate` that threw errors (e.g., accessing undefined nested data) silently prevented the API call — no error logged, no network request made.
**Decision:** Always guard data shape in `onMutate`: `if (!data || !data.activities || !data.meta) return`. Use `getQueriesData` prefix matching carefully (it matches ALL queries with that prefix).
**Rationale:** TanStack Query treats `onMutate` exceptions as a signal to abort. No console error is logged, making this extremely hard to debug without knowing the behavior.

## [2026-06-10] Activity color overrides separate from activity response

**Problem:** Needed per-user color overrides for activities. Could be part of `EnrichedActivityItem` or a separate settings endpoint.
**Decision:** Overrides stored in `GET /settings/activity-colors` (returns `Record<activityId, colorToken>`), NOT on the activity item. Resolved client-side via `resolveColor(palette, override, tagColor)`.
**Rationale:** Overrides are per-user settings, not shared activity data. Keeping them in settings avoids polluting the shared activity response and allows independent cache invalidation.

## [2026-06-08] Color tokens from API palette, not hardcoded hex

**Problem:** Hardcoded hex values in `src/lib/tag-colors.ts` made color changes require a frontend deploy.
**Decision:** Fetch palette from `GET /palette` (unauthenticated, cached `staleTime: Infinity`). Resolve via `resolveColor()`. Removed `tag-colors.ts`.
**Rationale:** Backend owns the palette. Frontend just maps token names to shades. Allows palette updates without redeploying the SPA.

## [2026-06-05] Tailwind 4 CSS variable colors require bracket syntax

**Problem:** Bare utility classes like `bg-primary`, `text-primary` don't resolve to `:root` CSS variables in Tailwind 4 + shadcn setup.
**Decision:** Always use bracket syntax: `bg-[hsl(var(--primary))]`. Exception: custom `@theme` colors (`bg-brand`, `text-text-muted`) work because they're `--color-*` tokens.
**Rationale:** Discovered via broken rendering. Tailwind 4 changed how theme values resolve. The bracket syntax directly references the CSS custom property.

## [2026-06-03] react-day-picker v9 range: onSelect fires on every click

**Problem:** Range date picker closed immediately on first click because `onSelect` fired with `{ from, to }` where both were the same date.
**Decision:** Only treat as complete range when `from.getTime() !== to.getTime()`.
**Rationale:** v9 changed behavior from v8. First click sets both from and to to the same date. Second click updates to. Must differentiate single-click from completed range.

## [2026-06-01] Single shadow elevation level

**Problem:** Mixed shadow levels (`shadow-sm`, `shadow-md`, `shadow-lg`) across cards created inconsistent depth hierarchy.
**Decision:** All content cards use `shadow-lg`. Single elevation level matching the nav card.
**Rationale:** Simpler visual language. The app doesn't have enough depth layers to justify a multi-level shadow system.
