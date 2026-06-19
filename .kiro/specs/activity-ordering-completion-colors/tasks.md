# Implementation Plan

## Overview

Implement drag-and-drop reordering, mark-as-done with fade-out, and card-flip color override on the activity tracker grid. Follows the implementation order: api:generate → data layer → sortable grid → done → card flip + color. Uses `@dnd-kit/react` with OptimisticSortingPlugin, CSS 3D transforms for flip, and sparse integer sort orders with midpoint insertion.

## Tasks

- [x] 1. Generate API types and create sort-order utilities
  - [x] 1.1 Run `npm run api:generate` to pick up `EnrichedActivitiesResponse`, `ReorderRequest`, `ReorderItem`, `ActivityDoneRequest`, `ActivityDoneResponse` types from openapi.json
    - Verify generated types in `src/api/schema.d.ts` include the new endpoints
    - _Requirements: 1.1, 2.4, 2.5, 4.3_
    - **Requirement:** #1, #2, #4
    - **Dependencies:** None

  - [x] 1.2 Create `src/lib/sort-order-utils.ts` with pure sort-order functions
    - Export `SORT_GAP = 1000`, `MAX_SORT_ORDER = 999_999_999`
    - Implement `computeMidpoint(before, after)` returning integer midpoint
    - Implement `needsRebalance(sortedOrders)` detecting collapsed gaps (adjacent diff < 2)
    - Implement `rebalance(activityIds)` producing fresh 1000-step gap sort orders
    - Implement `computeReorderPayload(items, movedId, newIndex)` returning only changed `ReorderItem[]`
    - _Requirements: 2.4, 2.5, 2.6_
    - **Requirement:** #2
    - **Dependencies:** 1.1

  - [ ]* 1.3 Write property test: Midpoint insertion preserves order invariant
    - **Property 1: Midpoint insertion preserves order invariant**
    - **Validates: Requirements 2.5**
    - For any sorted integer pair (a, b) with gap >= 2 in [0, 999_999_999], midpoint is strictly between a and b
    - **Requirement:** #2
    - **Dependencies:** 1.2

  - [ ]* 1.4 Write property test: Rebalance produces valid sparse sort orders
    - **Property 2: Rebalance produces valid sparse sort orders**
    - **Validates: Requirements 2.5, 2.6**
    - For any string array (1–200 length), rebalance produces strictly increasing values with 1000-step gaps starting at 1000, all within [0, 999_999_999]
    - **Requirement:** #2
    - **Dependencies:** 1.2

  - [ ]* 1.5 Write property test: Reorder payload contains only changed items
    - **Property 3: Reorder payload contains only changed items**
    - **Validates: Requirements 2.4**
    - For any valid activity list and move operation, payload includes only items with changed sort orders and applying it yields correct visual order
    - **Requirement:** #2
    - **Dependencies:** 1.2

  - [ ]* 1.6 Write property test: Needs-rebalance detects collapsed gaps
    - **Property 4: Needs-rebalance detects collapsed gaps**
    - **Validates: Requirements 2.6**
    - Returns true iff at least one adjacent pair differs by < 2
    - **Requirement:** #2
    - **Dependencies:** 1.2

- [x] 2. Implement data layer hooks
  - [x] 2.1 Update `src/hooks/use-activities.ts` to fetch from `GET /activities` with optional `includeDone` param
    - Return `{ activities, doneCount, isLoading, isError, refetch }`
    - Query key: `["activities", { includeDone }]`
    - Render activities in API response order (server-sorted by sortOrder ascending)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
    - **Requirement:** #1
    - **Dependencies:** 1.1

  - [x] 2.2 Create `src/hooks/use-reorder-activities.ts` mutation hook
    - Send `PATCH /activities/reorder` with changed `ReorderItem[]`
    - Optimistic cache update: reorder items in `["activities"]` query cache
    - Rollback on error: restore previous cache snapshot
    - On settled: invalidate `["activities"]` queries
    - _Requirements: 2.4, 2.7_
    - **Requirement:** #2
    - **Dependencies:** 1.2, 2.1

  - [x] 2.3 Create `src/hooks/use-mark-activity-done.ts` mutation hook
    - Send `PATCH /activities/{id}/done` with `{ isDone: true/false }`
    - Optimistic removal from cache (for `isDone: true`)
    - On 409 `timer_running`: return specific error for toast handling
    - On 404: treat as success (stale activity, remove from cache)
    - On other failures: rollback to previous cache state
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7_
    - **Requirement:** #4
    - **Dependencies:** 2.1

- [x] 3. Checkpoint — Data layer complete
  - Ensure all tests pass, ask the user if questions arise.
  - **Requirement:** #1, #2, #4
  - **Dependencies:** 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3

- [x] 4. Implement sortable grid with drag-and-drop
  - [x] 4.1 Install `@dnd-kit/react` and `@dnd-kit/helpers` packages
    - _Requirements: 2.1_
    - **Requirement:** #2
    - **Dependencies:** None

  - [x] 4.2 Modify `src/components/tracker/activity-grid.tsx` to wrap in `DragDropProvider`
    - Configure `OptimisticSortingPlugin` from `@dnd-kit/helpers`
    - Set distance constraint of 5px to differentiate tap from drag
    - Support CSS Grid with `auto-fill` columns (no custom layout calculations)
    - Consume `useActivities` hook instead of `useTrackerData` for activity list
    - Add done-activities toggle: "Show N done" when `doneCount > 0`, re-fetch with `includeDone=true`
    - Render done activities in separate section with divider and reduced opacity
    - Show loading skeleton during fetch and error state with retry on failure
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.9_
    - **Requirement:** #1, #2
    - **Dependencies:** 2.1, 2.2, 4.1

  - [x] 4.3 Create `src/components/tracker/sortable-activity-card.tsx`
    - Use `useSortable` from `@dnd-kit/react` to make each card draggable
    - Wrap existing `ActivityBlock` as front face content
    - Pass through timer click handler (fires only on tap, not drag)
    - Track `isDragActive` global state to hide hover overlays during drag
    - Disable drag when card is in flipped state
    - Allow drag even when timer is running on the card
    - On drop: call `computeReorderPayload` then `useReorderActivities` mutation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.8, 2.10, 6.1, 6.2_
    - **Requirement:** #2, #6
    - **Dependencies:** 1.2, 4.2

  - [ ]* 4.4 Write property test: Distance constraint classifies tap vs drag
    - **Property 5: Distance constraint classifies tap vs drag**
    - **Validates: Requirements 2.2, 6.1, 6.2**
    - For any non-negative distance, < 5px → tap, >= 5px → drag; mutually exclusive and exhaustive
    - **Requirement:** #2, #6
    - **Dependencies:** 4.3

- [x] 5. Implement hover overlay and mark-as-done flow
  - [x] 5.1 Create `src/components/tracker/hover-overlay.tsx`
    - Position two icon buttons (Done_Icon checkmark, Color_Icon palette) top-right of card
    - Hidden on desktop (opacity 0), visible on hover with ≤200ms transition
    - Always visible on coarse pointer devices (touch)
    - Hidden on all cards during drag
    - Minimum 44x44 CSS pixel touch targets for accessibility
    - Done icon disabled (opacity 0.4, click-inert) when activity has running timer
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.8_
    - **Requirement:** #3, #4
    - **Dependencies:** 4.3

  - [x] 5.2 Implement fade-out animation and done flow in `SortableActivityCard`
    - On Done_Icon click: start fade-out (opacity 0 + scale-down, 300ms)
    - On animation complete: remove card from DOM
    - On 409 response: cancel animation, restore card, show "Stop the timer first" toast
    - On non-409 error: cancel animation, restore card, show error toast
    - On 404: remove card immediately (stale)
    - Double-click guard: ignore clicks during active fade-out
    - When timer running: show toast without sending API request
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8, 4.9_
    - **Requirement:** #4
    - **Dependencies:** 2.3, 5.1

  - [x] 5.3 Implement done-activities reactivation
    - In done section: allow clicking reactivate action to send `PATCH /activities/{id}/done` with `{ isDone: false }`
    - On success: move card back to active section in sort-order position
    - On failure: show error toast, keep card in done section
    - _Requirements: 4.7_
    - **Requirement:** #4
    - **Dependencies:** 5.2

  - [ ]* 5.4 Write property test: Done-icon disabled state matches timer running state
    - **Property 6: Done-icon disabled state matches timer running state**
    - **Validates: Requirements 4.8**
    - Done icon is disabled (opacity 0.4, click-inert) iff activity has non-null `runningEntry`
    - **Requirement:** #4
    - **Dependencies:** 5.1

  - [ ]* 5.5 Write property test: Active-only filtering excludes all done activities
    - **Property 7: Active-only filtering excludes all done activities**
    - **Validates: Requirements 1.2**
    - Filtering for active-only produces exactly those items where `isDone === false`, preserving relative order
    - **Requirement:** #1
    - **Dependencies:** 2.1

- [x] 6. Checkpoint — Sortable grid and done flow complete
  - Ensure all tests pass, ask the user if questions arise.
  - **Requirement:** #1, #2, #3, #4, #6
  - **Dependencies:** 4.4, 5.3, 5.4, 5.5

- [x] 7. Implement card flip and color override
  - [x] 7.1 Create `src/components/tracker/flip-card.tsx`
    - CSS 3D flip container: `perspective`, `transform-style: preserve-3d`, `rotateY(180deg)`
    - Accept `isFlipped`, `front`, `back` slots, `onFlipComplete` callback
    - Flip duration 500ms
    - Front face: existing activity content; back face: slot for color picker
    - _Requirements: 5.1, 5.7, 5.9_
    - **Requirement:** #5
    - **Dependencies:** None

  - [x] 7.2 Integrate `FlipCard` into `SortableActivityCard` with color picker on back face
    - Color_Icon click triggers flip (also via Enter/Space for accessibility)
    - Back face renders existing `ColorPicker` component (7 swatches) as radiogroup with keyboard nav
    - On color selection: send `PATCH /settings/activity-colors`, auto-flip back within 100ms
    - On reverse flip complete: render card with newly selected color
    - On API failure: error toast, revert to previous color
    - Escape or outside click: reverse flip without color change
    - Block drag, timer, and additional Color_Icon clicks while flipped or mid-animation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6.3, 6.4_
    - **Requirement:** #5, #6
    - **Dependencies:** 5.1, 7.1

  - [x] 7.3 Wire timer interaction safety into `SortableActivityCard`
    - Tap (< 5px movement) on card body triggers timer start/stop
    - No timer action during drag (≥ 5px movement)
    - No timer action when card is flipped
    - No timer action when Done_Icon or Color_Icon clicked (event isolation)
    - Double-tap protection: ignore taps while timer mutation in progress
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
    - **Requirement:** #6
    - **Dependencies:** 7.2

- [x] 8. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - **Requirement:** #1, #2, #3, #4, #5, #6
  - **Dependencies:** 7.3

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the 7 correctness properties from the design document
- The existing `useActivities` hook (from color-token-system) will be updated, not created from scratch
- The existing `ColorPicker` component at `src/components/tags/color-picker.tsx` is reused on the flip back face
- The existing `useUpdateActivityColor` hook at `src/hooks/use-activity-colors.ts` is reused for color override mutations

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "4.1", "7.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["1.3", "1.4", "1.5", "1.6", "2.2", "2.3"] },
    { "id": 3, "tasks": ["4.2"] },
    { "id": 4, "tasks": ["4.3", "5.5"] },
    { "id": 5, "tasks": ["4.4", "5.1"] },
    { "id": 6, "tasks": ["5.2", "5.4"] },
    { "id": 7, "tasks": ["5.3", "7.2"] },
    { "id": 8, "tasks": ["7.3"] }
  ]
}
```
