# Implementation Plan

## Overview

Phase 1 implementation delivers the tracker screen (activity blocks with timer start/stop) and the entries page (manual entry CRUD with notes). Tasks are ordered bottom-up: utilities → hooks → components → pages → routing.

## References
- #[[file:.kiro/specs/phase1-tracker/requirements.md]]
- #[[file:.kiro/specs/phase1-tracker/design.md]]

## Tasks

- [x] 1. Create `src/stores/timer-store.ts` (Zustand store: isRunning, activityId, entryId, startTime, elapsed, start/stop/tick methods), `src/lib/time-utils.ts` (formatElapsed, getStartOfDay, getEndOfDay, getStartOfWeek, getEndOfWeek), and `src/lib/tag-colors.ts` (BLOCK_COLORS array of 8 named colors with default/light/dark hex values, getBlockColor(index) cycles through palette — API has no color field yet, assign by activity index). Verify: `npm run build` passes.
  - **Requirement:** #1, #4
  - **Dependencies:** None
- [x] 2. Create `src/hooks/use-timer.ts` (useCurrentTimer query for GET /timer/current, useStartTimer mutation with 409→refetch handling, useStopTimer mutation invalidating entries+timer caches), `src/hooks/use-projects.ts` (useProjects for GET /projects non-archived, useActivities for GET /projects/{id}/activities), and `src/hooks/use-tags.ts` (useTags for GET /tags). Verify: `npm run build` passes.
  - **Requirement:** #1, #2, #3
  - **Dependencies:** 1
- [x] 3. Create `src/hooks/use-entries.ts` (useEntries with from/to params, useCreateEntry, useUpdateEntry, useDeleteEntry — all invalidating entries cache) and `src/hooks/use-entry-notes.ts` (useEntryNotes, useCreateNote). Verify: `npm run build` passes.
  - **Requirement:** #6, #7, #8, #9, #10
  - **Dependencies:** 1
- [x] 4. Create `src/components/tracker/activity-block.tsx` (tag badge with color, project name, activity name, timer display 00:00:00 or ticking, click handler), `src/components/tracker/activity-grid.tsx` (responsive grid container), `src/components/tracker/activity-list-item.tsx` (compact row), and `src/components/tracker/tracker-toolbar.tsx` (Incomplete/Completed toggle + Block/List view toggle). Verify: `npm run build` passes.
  - **Requirement:** #1, #4, #5
  - **Dependencies:** 2, 3
- [x] 5. Create `src/pages/app/tracker.tsx` — orchestrates fetching projects, activities per project, tags, timer current, and today's entries. Renders TrackerToolbar + ActivityGrid/List. Manages filter state (Incomplete default) and view mode (Block default). Passes timer store state to blocks. Verify: `npm run build` passes.
  - **Requirement:** #1, #5
  - **Dependencies:** 4
- [x] 6. Wire timer start/stop in tracker: ActivityBlock click → useStartTimer (idle) or useStopTimer (running). Loading state on block during API call. 409 handling silently shows running timer on correct block. Start 1s setInterval on successful start/rehydrate, clear on stop. Rehydrate on mount from useCurrentTimer. Verify: `npm run build` passes.
  - **Requirement:** #2, #3, #4
  - **Dependencies:** 5
- [x] 7. Implement Incomplete/Completed filter: compute completedActivityIds from today's entries with non-null endTime, filter blocks accordingly, default to Incomplete, re-evaluate after timer stop via cache invalidation. Verify: `npm run build` passes.
  - **Requirement:** #5
  - **Dependencies:** 6
- [x] 8. Create `src/components/entries/entry-row.tsx`, `src/components/entries/entry-list.tsx`, `src/components/entries/entries-toolbar.tsx` (Today/This Week toggle + Add Entry button), and `src/pages/app/entries.tsx` (fetches entries with date range, sorts descending, renders list with empty state). Verify: `npm run build` passes.
  - **Requirement:** #7
  - **Dependencies:** 2, 3
- [x] 9. Create `src/components/entries/entry-modal.tsx` (shared create/edit form: activity selector grouped by project, datetime-local inputs, notes textarea, Zod validation, react-hook-form, API error display). Wire Add Entry → create mode, entry row edit → edit mode. POST /entries or PUT /entries/{id} on submit, invalidate cache. Verify: `npm run build` passes.
  - **Requirement:** #6, #8
  - **Dependencies:** 8
- [x] 10. Create `src/components/entries/delete-confirm-dialog.tsx` (shows entry activity name + start time) and `src/components/entries/entry-notes.tsx` (notes list chronological, count indicator, add-note form with 1-5000 char validation). Wire delete action and notes into entry rows. Verify: `npm run build` passes.
  - **Requirement:** #9, #10
  - **Dependencies:** 8
- [x] 11. Update `src/routes.tsx` (replace Dashboard with TrackerPage at "/", add EntriesPage at "/entries"), update `src/components/layout/sidebar.tsx` (activate Timer link to "/", add Entries link to "/entries", keep others disabled), remove `src/pages/app/dashboard.tsx`. Verify: `npm run build` and `npm run lint` pass.
  - **Requirement:** #1, #7
  - **Dependencies:** 7, 9, 10

## Notes

- Tasks 2-3 can be done in parallel (independent hook sets)
- Tasks 4 and 8 can be done in parallel (tracker components vs entries components)
- Task 11 (routing) should be last since it wires everything together
- Each task verifies via `npm run build` to catch type errors early
