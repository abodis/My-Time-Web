---
inclusion: manual
description: "Project decision log — architectural choices, gotchas, resolved issues"
---

# Decision Log

<!-- Append new entries at the top. Format: ## [YYYY-MM-DD] Title -->
<!-- Fields: Problem, Decision, Rationale -->

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
