# Requirements Document

## Introduction

Three interactive features on the activity tracker grid cards: drag-and-drop reordering with optimistic UI, single-click mark-as-done with fade-out animation, and a per-activity color override via card-flip animation revealing a color picker. All features use existing API endpoints (`GET /activities`, `PATCH /activities/reorder`, `PATCH /activities/{id}/done`, `PATCH /settings/activity-colors`) and integrate with the existing timer, color-token-system, and grid layout.

## Glossary

- **Activity_Grid**: The CSS Grid container that renders all activity cards and wraps them in a dnd-kit `DragDropProvider` for sortable behavior.
- **Activity_Card**: A single card in the Activity_Grid representing one assigned activity. Supports drag, hover icons, and 3D flip.
- **Drag_Provider**: The `@dnd-kit/react` `DragDropProvider` component wrapping the Activity_Grid, configured with `OptimisticSortingPlugin` for jank-free reordering.
- **Distance_Constraint**: A 5-pixel movement threshold that differentiates a tap/click from a drag initiation.
- **Hover_Overlay**: A container positioned top-right of the Activity_Card displaying two action icons (done and color), visible on hover (desktop) or always visible on touch devices.
- **Done_Icon**: The checkmark icon in the Hover_Overlay that triggers the mark-as-done flow.
- **Color_Icon**: The palette icon in the Hover_Overlay that triggers the card-flip and color-picker flow.
- **Card_Flip**: A CSS 3D transform animation (`rotateY(180deg)`, `duration-500`, `perspective`, `transform-style: preserve-3d`) toggling between front (activity content) and back (color picker) faces.
- **Fade_Out_Animation**: A combined opacity-to-zero and scale-down CSS transition applied to an Activity_Card before DOM removal.
- **Sort_Order**: An integer value assigned to each activity determining its position. Uses sparse 1000-step gaps with midpoint insertion and full rebalance when gaps collapse.
- **Timer_Guard**: Logic preventing mark-as-done when a timer is actively running on the target activity (API returns 409 `timer_running`).
- **Color_Picker**: The existing reusable component at `src/components/tags/color-picker.tsx` displaying 7 color token swatches.
- **Optimistic_Update**: Immediate UI state change before API confirmation, with rollback on failure.

## Requirements

### Requirement 1: Activity Data Fetching

**User Story:** As a user, I want the tracker page to load all my assigned activities in a single request, so that the grid renders with correct sort order and done state.

#### Acceptance Criteria

1. WHEN the tracker page mounts, THE Activity_Grid SHALL fetch activities from `GET /activities` and render each activity in the array order returned by the API response (sorted server-side by `sortOrder` ascending, then alphabetical for unordered items).
2. WHILE the done-activities toggle is inactive, THE Activity_Grid SHALL display only activities where `isDone` equals `false`, filtering out any done activities from the rendered grid.
3. WHEN the API response includes `meta.doneCount` greater than zero, THE Activity_Grid SHALL display a "Show N done" toggle (where N is the `meta.doneCount` value) below the active activities grid.
4. WHEN the user activates the done-activities toggle, THE Activity_Grid SHALL re-fetch with `?includeDone=true` and render done activities in a separate section below active activities, visually separated by a labeled divider and with done activity cards rendered at reduced opacity compared to active cards.
5. WHEN the user deactivates the done-activities toggle, THE Activity_Grid SHALL re-fetch with `GET /activities` (without `includeDone`) and remove the done activities section from the rendered grid.
6. IF the `GET /activities` request fails, THEN THE Activity_Grid SHALL display an error state with a message indicating the fetch failure and a retry button that re-issues the `GET /activities` request when activated.
7. WHILE the `GET /activities` request is in-flight, THE Activity_Grid SHALL display a loading skeleton placeholder in the grid area until the response is received or the request fails.

### Requirement 2: Drag-and-Drop Reordering

**User Story:** As a user, I want to drag activity cards into a custom order, so that I can prioritize my most-used activities visually.

#### Acceptance Criteria

1. THE Drag_Provider SHALL wrap the Activity_Grid and enable sortable behavior on all active (non-done) Activity_Card elements using `@dnd-kit/react` with `OptimisticSortingPlugin`.
2. THE Drag_Provider SHALL use a Distance_Constraint of 5 pixels so that pointer movement below 5 pixels registers as a tap (timer click) and movement at or above 5 pixels initiates a drag.
3. WHILE an Activity_Card is being dragged, THE Activity_Grid SHALL display the card at the pointer position with a visual drag indicator (elevated shadow or reduced opacity) and reorder surrounding cards within 100 milliseconds of pointer position change via `OptimisticSortingPlugin`.
4. WHEN a drag completes (drop), THE Activity_Grid SHALL optimistically update the visual order and send a `PATCH /activities/reorder` request containing only the items whose sort order values changed (moved card and any adjacent cards that received new midpoint values).
5. THE Activity_Grid SHALL assign sort order values as integers in the range 0 to 999,999,999 using sparse 1000-step gaps (1000, 2000, 3000...). WHEN inserting between two adjacent activities, THE Activity_Grid SHALL compute the new sort order as the integer midpoint of the two adjacent sort order values.
6. WHEN sort order gaps collapse (adjacent values differ by less than 2), THE Activity_Grid SHALL rebalance all activity sort orders in a single `PATCH /activities/reorder` request with fresh 1000-step gaps.
7. IF the `PATCH /activities/reorder` request fails, THEN THE Activity_Grid SHALL revert the visual order to the pre-drag state and display an error toast indicating that the reorder could not be saved.
8. WHILE an Activity_Card is in the flipped state (back face visible), THE Drag_Provider SHALL disable drag initiation on that card.
9. THE Drag_Provider SHALL support CSS Grid layout with `auto-fill` columns without custom layout calculations.
10. WHILE an Activity_Card has a running timer, THE Drag_Provider SHALL still allow drag initiation on that card (timer state does not block reordering).

### Requirement 3: Hover Action Icons

**User Story:** As a user, I want quick-access action icons on each activity card, so that I can mark activities done or change their color without navigating elsewhere.

#### Acceptance Criteria

1. THE Hover_Overlay SHALL position two icons (Done_Icon and Color_Icon) in the top-right corner of each Activity_Card.
2. WHILE the pointer is not hovering over an Activity_Card on devices with fine pointer (mouse), THE Hover_Overlay SHALL be hidden (opacity 0).
3. WHEN the pointer hovers over an Activity_Card on devices with fine pointer, THE Hover_Overlay SHALL become visible (opacity 1) with a transition duration of no more than 200 milliseconds.
4. WHILE the device reports a coarse pointer capability (touch or hybrid touch+stylus), THE Hover_Overlay SHALL be visible at all times without requiring hover.
5. WHILE a drag is in progress on an Activity_Card, THE Hover_Overlay SHALL be hidden on all cards to prevent accidental icon activation.
6. THE Done_Icon and Color_Icon SHALL have a minimum touch target size of 44x44 CSS pixels for accessibility.

### Requirement 4: Mark Activity as Done

**User Story:** As a user, I want to mark an activity as done with a single click, so that completed activities disappear from my active list.

#### Acceptance Criteria

1. WHEN the user clicks the Done_Icon on an Activity_Card, THE Activity_Card SHALL immediately begin the Fade_Out_Animation (opacity transition to 0 and scale-down over 300ms).
2. WHEN the Fade_Out_Animation completes, THE Activity_Grid SHALL remove the Activity_Card from the DOM.
3. WHEN the user clicks the Done_Icon, THE application SHALL send a `PATCH /activities/{id}/done` request with `{ "isDone": true }`.
4. IF the `PATCH /activities/{id}/done` request returns a 409 status with error code `timer_running`, THEN THE Activity_Grid SHALL cancel the Fade_Out_Animation, restore the Activity_Card to full visibility, and display a toast message "Stop the timer first".
5. IF the `PATCH /activities/{id}/done` request fails with any non-409 error, THEN THE Activity_Grid SHALL cancel the Fade_Out_Animation, restore the Activity_Card to full visibility, and display an error toast indicating the action failed.
6. IF the `PATCH /activities/{id}/done` request returns a 404 status, THEN THE Activity_Grid SHALL remove the Activity_Card from the DOM without animation (stale activity).
7. IF the user has activated the done-activities toggle and views done activities, WHEN the user clicks a reactivate action on a done Activity_Card, THE application SHALL send `PATCH /activities/{id}/done` with `{ "isDone": false }` and move the card back to the active section in its sort-order position.
8. WHILE a timer is running on an activity (runningEntry is not null), THE Done_Icon SHALL appear visually disabled (opacity 0.4) and clicking the Done_Icon SHALL show a toast "Stop the timer first" without sending an API request.
9. WHILE the Fade_Out_Animation is in progress on an Activity_Card, THE Done_Icon SHALL ignore additional clicks (double-click guard).

### Requirement 5: Card Flip and Color Override

**User Story:** As a user, I want to flip an activity card to pick a custom color, so that I can visually distinguish activities beyond their tag color.

#### Acceptance Criteria

1. WHEN the user activates the Color_Icon on an Activity_Card (via click, Enter, or Space), THE Activity_Card SHALL perform the Card_Flip animation (rotateY 180 degrees over 500ms with perspective and preserve-3d).
2. WHILE the Activity_Card is flipped, THE back face SHALL display the Color_Picker component showing 7 color token swatches arranged as a radiogroup with keyboard navigation (arrow keys to move focus, Enter/Space to select).
3. WHEN the user selects a color swatch on the back face, THE application SHALL send a `PATCH /settings/activity-colors` request with `{ "colors": { "<activityId>": "<selectedToken>" } }`.
4. WHEN the user selects a color swatch, THE Activity_Card SHALL begin the reverse Card_Flip animation (back to front face) within 100ms of the selection event.
5. WHEN the reverse flip completes, THE Activity_Card front face SHALL render using the newly selected color token (resolved via the palette).
6. IF the `PATCH /settings/activity-colors` request fails (network error, 4xx, or 5xx response), THEN THE application SHALL display an error toast and revert the card color to its previous value.
7. WHILE the Activity_Card is in the flipped state or mid-animation, THE Activity_Card SHALL NOT respond to drag initiation, timer click events, or additional Color_Icon activations.
8. WHEN the user clicks outside the flipped Activity_Card or presses Escape, THE Activity_Card SHALL perform a reverse Card_Flip animation without changing the color.
9. WHILE the Card_Flip animation is in progress (either direction), IF the user activates the Color_Icon, THEN THE Activity_Card SHALL ignore the activation until the current animation completes.

### Requirement 6: Timer Interaction Safety

**User Story:** As a user, I want the timer tap behavior preserved during all card interactions, so that I never accidentally start or miss a timer action.

#### Acceptance Criteria

1. WHEN the pointer moves less than 5 pixels (below the Distance_Constraint) and is released on the same Activity_Card it started on, THE application SHALL treat it as a tap and trigger the timer start/stop action.
2. WHILE a drag is in progress (pointer moved 5 pixels or more), THE application SHALL NOT trigger any timer action on drop.
3. WHILE an Activity_Card is in the flipped state, THE application SHALL NOT trigger timer actions on that card.
4. WHEN the user clicks the Done_Icon or Color_Icon, THE application SHALL NOT trigger a timer action on the parent Activity_Card.
5. WHILE a timer start/stop mutation is in progress on an Activity_Card, THE application SHALL ignore additional tap events on that card until the mutation resolves (double-tap protection).
