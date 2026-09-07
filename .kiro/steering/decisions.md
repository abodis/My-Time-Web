---
inclusion: manual
description: "Project decision log — architectural choices, gotchas, resolved issues"
---

# Decision Log

<!-- Append new entries at the top. Format: ## [YYYY-MM-DD] Title -->
<!-- Fields: Problem, Decision, Rationale -->

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
