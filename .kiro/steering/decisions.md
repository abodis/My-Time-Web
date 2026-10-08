---
inclusion: manual
description: "Project decision log — architectural choices, gotchas, resolved issues"
---

# Decision Log

<!-- Append new entries at the top. Format: ## [YYYY-MM-DD] Title -->
<!-- Fields: Problem, Decision, Rationale. Keep entries tight. UI/DnD/CSS rules live in frontend/* steering, not here. -->

## [2026-09-24] Raw execute-api URL locked — frontend must use api.mytimeblocks.app edge

**Problem:** API team added Cloudflare edge protection. The raw API Gateway URL (`https://ioxrzx7f9h.execute-api.eu-south-2.amazonaws.com`) now returns `403 forbidden_origin`; all API traffic must route through the edge.
**Decision:** Changed `.env.production` → `VITE_API_BASE_URL=https://api.mytimeblocks.app` (was the raw execute-api URL), rebuilt, redeployed frontend (`./deploy.sh prod`: build + cdk no-change + S3 sync + CF invalidation `I1H69ECGZH2CUUXG67YMMKDLK0`). Verified new URL baked into `dist/assets`, old URL gone. Browser origin (`app.mytimeblocks.app`) unchanged → CORS untouched. WebSocket (if separate) unaffected.
**Rationale:** Edge lock-down is a backend/infra invariant confirmed by the API team; the only frontend action is the base-URL swap. The raw URL must not reappear in any env/config — it is now dead (403). project-config.md updated to mark the raw URL as locked.

## [2026-09-20] Logout landed on /onboarding instead of /login — SPA-navigate race

**Problem:** After completing onboarding → tracker → clicking Logout, the app showed `/onboarding` (stale wizard), not `/login`. `handleLogout` (PillNav) SPA-navigated `navigate('/login')` while synchronously `clearAccountState()`. Clearing `activeAccountId` re-renders the still-mounted `ProtectedRoute` (status already `"authenticated"`) → it redirects to `/select-account`, winning the race. `/select-account` fetches `/accounts` + `/me`; locally these return the default dev user (no token, onboarding-incomplete) → routes to `/onboarding`.
**Decision:** `handleLogout` keeps `clearAuth()` + `clearAccountState()` (they also purge localStorage: refresh token + `lastAccountId`, which a reload won't), then HARD-navigates `window.location.assign('/login')`. Removed now-orphaned `useNavigate`/`queryClient`. Full reload remounts the router so `ProtectedRoute` re-checks the cleared session and drops all in-memory state (query cache, account + onboarding stores).
**Rationale:** In-app SPA-navigate on logout races the protected-subtree redirect that clearing account state triggers; a hard reload is the deterministic teardown. Prod would have surfaced this as `/select-account`→`/login` (401 without token) rather than `/onboarding` (local no-token → dev user), but the race is env-agnostic. Verified live (Playwright) + build + 143 tests.

## [2026-09-20] Duplicate-email identity + invited-user auto-account — fixed API-side

**Problem:** (1) Registering an already-registered email silently created a SECOND user/account. (2) An invited email that registered got an auto-created personal account plus the invited membership, landing login on `/select-account`.
**Decision:** Both fixed at API/Cognito, live on UAT + local. Email unique per identity, lowercased server-side across all auth calls; `POST /auth/register` and `/auth/confirm` → `409 { type: "email_exists" }` on duplicate (case-insensitive, in openapi.json). Invited register+confirm joins ONLY the invited account (invited role), no auto personal account. Frontend UNCHANGED — register/confirm already surface server `message` via `extractErrorMessage`.
**Rationale:** Email uniqueness is an identity-provider invariant — enforce at Cognito/API, never client-side. Rule now in 01-common #9/#10. OPEN (product, deferred): whether invite acceptance drops user into invited account vs. a picker. UAT demo logins (Password123!): alex@/dana@/evan@/faye@/gus@ demo.test.

## [2026-09-20] Local dev auth model + how to test flows

**How local auth works:** Backend `python3 local_server.py` → `localhost:8000`, Vite proxies `/api` (502 = backend down). No `X-User-Id` and no bearer → default user `0000…0000` (`dev@localhost`). `X-User-Id: <uuid>` overrides; unknown uuid → 404. The SPA uses real register/login (bearer), NOT `X-User-Id` — through the UI you are whoever you registered. `POST /auth/login` validates creds (bad → 401); register auto-confirms; confirm accepts any code. Data IS isolated per registered user.
**Recipe to get a FRESH owner into the wizard:** `localStorage.clear()` → reload → **Register** a UNIQUE VALID-FORMAT email (needs a TLD — `dev@localhost` FAILS `z.email()`; use `owner+<ts>@example.com`) + password ≥8 → **Confirm** (any code) → **Login**. An already-onboarded email routes to `/`, so register a new email per wizard run. Distinct second user (e.g. invitee) = separate register+login; no in-UI user switch.
**Rationale:** default-user + `X-User-Id` is a curl/backend convenience; SPA path is real auth. Assert per-user via the APP's OWN requests (bearer + `X-Account-Id`), NOT agent `fetch('/api/...')` probes — those have no headers, resolve to the default user, and mislead.

## [2026-09-20] Guided onboarding activity absent from tracker — auto-assign creator (API)

**Problem:** New owner completes guided chain (tag→project→activity, all 201), tracker shows "No activities available." `GET /activities` = "list ASSIGNED activities"; creating an activity did NOT auto-assign the creator, and GuidedChain never called `POST /activities/{id}/assignments`.
**Decision:** Fix API-side — `POST /projects/{id}/activities` auto-assigns the creating user (covers guided chain, example-project seed, all future callers). Frontend UNCHANGED. When it lands: document in openapi.json, re-run guided flow to confirm.
**Rationale:** When frontend code/comments assume a server behavior that doesn't exist, fix the contract, not each caller.

## [2026-09-20] GET /account/me 400 missing_account_id — regex matched too broadly

**Problem:** On every app load `GET /account/me` returned `400 missing_account_id` (no `X-Account-Id`), triggering a reload loop.
**Decision:** Root cause in `isAccountAgnosticPath` (`src/api/client.ts`): the bare-identity rule `/(^|\/)me$/` also matched `/account/me`. Fixed: `/(^|\/)me$/.test(p) && !/account\/me$/.test(p) && method==="GET"`. Counterexample unit test in `client.test.ts`. (Also gated `useProfile`/`useAccount` on `activeAccountId` + `clearAccountState()` on clearAuth paths to stop cross-account bleed.)
**Rationale:** A `$`-anchored segment can still be a suffix of a longer path (`/me` inside `/account/me`). When a path classifier misbehaves, re-read the regex against the exact failing path and confirm header presence — don't theorize about timing.

## [2026-06-20] Onboarding wizard bounced to tracker after Profile step

**Problem:** Profile step's `POST /onboarding` invalidates `me`; `OnboardingPage` re-reads `me`, `resolveEntryTarget` returns `"tracker"` (completed=true) and navigated away mid-wizard — owner never reached Path/Fast/Invite/Summary.
**Decision:** Gate the completion→tracker redirect on `useOnboardingStore.step === "profile"` (`wizardInProgress` flag). Past Profile, keep `OwnerWizard` mounted; SummaryStep does the final hand-off nav. Backward-compatible (default step `"profile"`, so already-completed deep-links still redirect).
**Rationale:** Completion is stamped at step 1 of 5, so any reactive redirect on `completed` interrupts the flow it guards. The session-scoped `step` is the correct discriminator between "arriving fresh" and "mid-flow."

## [2026-09-10] Site fully unreachable: registrar clientHold, not a deploy failure

**Problem:** After a routine `./deploy.sh prod`, `app.mytimeblocks.app` returned `DNS_PROBE_POSSIBLE` — apex had no NS from any resolver. Deploy was healthy (CloudFront Deployed, build in S3, cache invalidated, alias present).
**Decision:** Root cause was Amazon Registrar `clientHold` (unverified ICANN registrant email) — the `.app` registry pulls the domain from DNS entirely, so every subdomain goes dark. Fix is registrar-side: verify the registrant email in Route 53 Registered Domains. No DNS change or redeploy.
**Rationale:** A clean deploy + healthy CloudFront + correct zone can still be 100% dark on a registrar hold. When apex has no NS, check `aws route53domains get-domain-detail --query StatusList` early. Gotchas: NS TTL is 172800s so cached negatives linger after the hold clears; StatusList lags — trust public `dig`. `mcp` profile can't read Route 53 (AccessDenied) — use `andras`.

## [2026-09-07] Tag mutations silently dropped defaultRate/rateCurrency

**Problem:** Editing a tag's rate/currency never persisted — the dialog built `defaultRate`/`rateCurrency`, but `useCreateTag`/`useUpdateTag` destructured only `name`/`color` in their `mutationFn`, discarding those fields (no error).
**Decision:** Widened both mutations to accept and forward `defaultRate` and `rateCurrency`. Tag currency field is now a dropdown of `SUPPORTED_CURRENCIES`, defaulting to account currency.
**Rationale:** A mutation's `mutationFn` param destructuring is the real contract — an undestructured field passed from the caller does nothing. When adding a form field, verify the mutation forwards it.

## [2026-09-07] Single money formatter; account currency from useAccount

**Decision:** `formatMoney(value, currency)` in `src/lib/currency.ts` (symbol + 2-decimal, no trailing code). Currency for management pages comes from `useAccount()` (`GET /account`), NOT profile.
**Rationale:** `AccountResponse.currency` is the single source of truth; `/account/me` (`ProfileResponse`) lacks `currency`. Rule now in patterns.md Money Formatting.

## [2026-09-07] API client path checks must be prefix-agnostic (VITE_API_BASE_URL=/api)

**Problem:** A failed login (401 bad creds) flashed the error then hard-reloaded — the client's 401 handler treated it as an expired session (`refreshAccessToken()` → fail → redirect). The guard to skip auth endpoints failed because in dev pathnames are `/api/auth/login`, so root-anchored checks (`startsWith("/auth/")`, `=== "/palette"`) never matched.
**Decision:** In `src/api/client.ts`, match routes with segment-aware regexes that ignore the base prefix: `isAuthPath` = `/(^|\/)auth\//`; `isAccountAgnosticPath` uses `/(^|\/)accounts$/` and `/(^|\/)palette$/`. Auth 401s pass through to the caller instead of triggering refresh/logout.
**Rationale:** `VITE_API_BASE_URL` carries a path prefix in some envs, so pathname is not root-anchored. Any pathname-based client logic must match by segment. A failed login is a surfaced error, not an expired session — never hard-redirect on it.

## [2026-06-20] Brainstorm never creates specs

**Problem:** Brainstorm sessions drifted into creating `.kiro/specs/` folders, duplicating Kiro's native spec workflow.
**Decision:** Brainstorm always and only produces `.kiro/docs/brainstorms/[name].md`. Never creates spec artifacts.
**Rationale:** Kiro has a native spec workflow with its own parser/format. Two competing formats caused contradictions.

## [2026-06-08] Color tokens from API palette, not hardcoded hex

**Decision:** Fetch palette from `GET /palette` (unauthenticated, `staleTime: Infinity`), resolve via `resolveColor()`. Removed `src/lib/tag-colors.ts`.
**Rationale:** Backend owns the palette; frontend maps token names to shades. Allows palette updates without redeploying the SPA. (Full rules in patterns.md + color-palette.md.)
