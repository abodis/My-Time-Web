# Activity Ordering, Completion & Color Override — Brainstorm

## What We're Building

Three features on the activity tracker grid cards:
1. **Drag-and-drop reordering** — stable, glitch-free repositioning
2. **Mark as done** — single-click icon → fade-out animation → activity hidden
3. **Color override** — icon click → card flip animation → color picker on back → auto-close on selection

## Decisions Made

| Topic | Decision | Rationale |
|-------|----------|-----------|
| DnD library | `@dnd-kit/react` + `@dnd-kit/helpers` | OptimisticSortingPlugin eliminates re-render jank; grid-native; accessible; ~15KB |
| Hover icons | Two icons (done ✓ + color palette) top-right; `opacity-0 group-hover:opacity-100`; always visible on touch (`pointer: coarse`) | Clean desktop UX, discoverable on mobile without extra taps |
| Card flip | Pure CSS 3D transform (`perspective`, `transform-style: preserve-3d`, `rotateY(180deg)`, `duration-500`) | Zero dependencies, GPU-accelerated, simple state toggle |
| Drag activation | Distance constraint (5px movement threshold) — no drag handle | Preserves tap-to-timer, feels natural on large touch targets; avoids visual clutter |
| Done animation | Fade out (opacity 0 + scale-down transition) then remove from DOM | Smooth visual feedback, not jarring |
| Color picker close | Auto-flip back after color selection | One less tap; immediate feedback |
| API readiness | ✅ All endpoints in openapi.json | `GET /activities`, `PATCH /activities/reorder`, `PATCH /activities/{id}/done` |

## Constraints

- **Drag + timer click conflict** — 5px distance threshold differentiates tap from drag. Timer click fires only if no drag initiated.
- **Flipped card not draggable** — Disable drag on cards in flipped state.
- **Grid layout compatibility** — dnd-kit handles CSS Grid with `auto-fill` columns natively.
- **Optimistic reorder** — dnd-kit OptimisticSortingPlugin reorders DOM without React re-renders. PATCH fires in background after drop.
- **Optimistic done** — Remove card immediately (fade out); restore on API failure.
- **Timer guard** — Cannot mark done while timer is running (409 `timer_running`). Show toast.
- **Sparse sort integers** — 1000-step gaps; midpoint on insert; full rebalance when gaps collapse.

## Integration Points

- **`ActivityBlock`** → wraps in sortable item, gains hover icon overlay, gains flip container (front/back faces)
- **`ActivityGrid`** → wraps in dnd-kit `DragDropProvider`
- **`useTrackerData`** → replaces per-project fetch with flat `GET /activities` (`EnrichedActivitiesResponse`)
- **`ColorPicker`** → reused on card back face (already exists at `src/components/tags/color-picker.tsx`)
- **Activity color override mutation** → `PATCH /settings/activity-colors` (already spec'd in color-token-system)
- **Timer store** → `handleBlockClick` gated: no-op during drag, no-op if card flipped

## Implementation Order

1. `npm run api:generate` — pick up `EnrichedActivitiesResponse`, `ReorderRequest`, `ActivityDoneRequest` types
2. **Phase 1: Data layer** — new `useActivities()` hook using `GET /activities`; update tracker page to consume it
3. **Phase 2: Sortable grid** — install `@dnd-kit/react` + `@dnd-kit/helpers`; wrap grid; add reorder mutation
4. **Phase 3: Done** — hover icon overlay; fade-out animation; `PATCH /activities/{id}/done` mutation; toast on timer conflict
5. **Phase 4: Card flip + color** — CSS 3D flip on `ActivityBlock`; color picker on back; `PATCH /settings/activity-colors` mutation; auto-flip-back on selection

## References

- `docs/activity-ordering-and-completion-ux.md` — API contracts, UX guidance, state interactions
- `docs/openapi.json` — schemas: `EnrichedActivityItem`, `ReorderItem`, `ActivityDoneRequest/Response`
- `.kiro/specs/color-token-system/` — existing color picker, palette hook, resolveColor utility
