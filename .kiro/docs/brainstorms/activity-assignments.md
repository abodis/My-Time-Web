# Activity Assignments Brainstorm

## What We're Building

Inline assignment management in the Activities tab (project edit page) — a new "Assigned" column with a popover checklist to toggle users on/off per activity.

## Core Problem

Activities must be assigned to users before those users can track time. The API supports assignments (`POST/GET/DELETE /activities/{id}/assignments`) but there's zero UI for it. Managers currently have no way to assign users through the web app.

## Key Decisions Made

- **UX pattern**: Assignments column + inline popover (🟢 72%) — over dedicated modal or unified edit modal.
  - Rationale: Glanceable state in table, lightweight interaction (popover not modal), one action per surface, no new routes, matches existing table pattern.
- **Role restriction**: Manager+ only (API enforced). No self-assignment for users.
- **Assignment indicator**: People icon + count when assigned, warning icon + 0 when unassigned.
- **Popover content**: Simple name checklist (no avatars, no roles). Toggle = immediate API call.
- **Scope**: One activity at a time. Bulk assignment deferred.

## Constraints Discovered

- API is per-activity: assign one user at a time (`POST` with `{ userId }`), delete one at a time.
- `GET /activities/{id}/assignments` returns `AssignmentResponse[]` (activityId, userId, assignedAt).
- Members list from `GET /account/members` provides the full user roster.
- Desktop-only page (management pages pattern) — no mobile concern.
- Table already has 4 columns (name, tag, rate override, actions). Adding "Assigned" = 5 columns, still fine for desktop.

## Integration Points

- **ActivitiesPanel** (`src/components/manage/activities-panel.tsx`): Add column + popover trigger.
- **useMembers hook** (`src/hooks/use-members.ts`): Provides member roster for the checklist.
- **New hook needed**: `useAssignments(activityId)` — fetch/create/delete assignments.
- **API schema**: Already typed — `AssignmentCreateRequest`, `AssignmentResponse` in `schema.d.ts`.
- **Query invalidation**: On assign/unassign, invalidate `["assignments", activityId]`. The tracker's `["activities"]` query will pick up changes via WebSocket `sync_needed`.

## UI Spec

### Activity Table Row (updated)
```
| Name | Tag | Rate Override | Assigned | Actions |
|------|-----|--------------|----------|---------|
| Design Review | 🟣 Design | — | 👤 2 | ✏️ 🗑️ |
| API Work | 🔵 Dev | $150 | ⚠️ 0 | ✏️ 🗑️ |
```

### Assigned Column States
- **Has assignees**: People icon (Users/UserRound from Lucide) + count badge. Normal color.
- **No assignees**: AlertTriangle or UserX icon + "0". Muted warning color (amber/orange).
- **Clickable**: Entire cell is the popover trigger.

### Assignment Popover
```
┌──────────────────────────┐
│ Assign Members           │
│ ─────────────────────── │
│ ☑ Alex (admin)          │  ← checkbox + name, no role shown (per decision)
│ ☐ Sarah                 │
│ ☑ Mike                  │
│ ☐ Jordan                │
└──────────────────────────┘
```
- Anchored to the "Assigned" cell.
- Closes on outside click (standard Popover behavior).
- Checkbox toggles fire immediately (optimistic add/remove).
- Loading state per-row while API completes.
- If member list is long (>10), add a search filter input at top.

## Verification Plan

1. **API integration**: Assign user → verify `POST /activities/{id}/assignments` fires. Unassign → verify `DELETE`.
2. **Optimistic UI**: Checkbox toggles immediately, reverts on error.
3. **Glanceable state**: Count updates in real-time after toggling.
4. **Warning indicator**: Unassigned activities show warning icon.
5. **Role guard**: Only visible/functional for manager+ (though the page itself is already role-gated).
6. **Tracker sync**: After assignment, user sees activity in their tracker (via WebSocket or next fetch).

## Open Questions

- [ ] Should the popover show member role as secondary text? (Deferred — just names for now.)
- [ ] Bulk assignment UX for assigning one user to many activities? (Deferred.)
- [ ] Should the "Assigned" column be hideable/collapsible? (Probably not — it's always relevant.)

## Next Steps

1. Create `useAssignments` hook (fetch + assign + unassign mutations)
2. Build `AssignmentPopover` component (member checklist + toggle logic)
3. Add "Assigned" column to ActivitiesPanel table
4. Add warning indicator for unassigned activities
5. Visual verification via Playwright screenshot
