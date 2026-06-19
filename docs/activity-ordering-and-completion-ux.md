# Activity Ordering & Completion — Frontend UX Guide

## Summary

Two new per-user features on the activity list:
1. **Custom sort order** — drag-and-drop reordering
2. **Mark as done** — hide completed activities without deleting them

Both are personal state. User A's ordering and done marks don't affect User B.

---

## Feature 1: Custom Sort Order

### Behavior

- Users can drag activities into any position in their flat activity list.
- The sort is global across all projects (not per-project).
- New activities (never reordered) appear at the bottom, sorted by project name → activity name.
- The order persists across sessions.

### API

**Save new order:** `PATCH /activities/reorder`

```json
{
  "order": [
    { "activityId": "uuid", "sortOrder": 1000 },
    { "activityId": "uuid", "sortOrder": 2000 },
    { "activityId": "uuid", "sortOrder": 3000 }
  ]
}
```

Response: `{ "updated": 3 }`

### UX Guidance

- **Sparse integers:** Assign sort values with 1000-step gaps (1000, 2000, 3000...). When inserting between adjacent values, use the midpoint. If gaps collapse (e.g., 1000 and 1001), rebalance the full list in a single PATCH.
- **Optimistic update:** Reorder the list instantly on drag-drop; fire the PATCH in background.
- **Stale IDs:** If an activity was deleted between fetches, the backend skips it silently. The `updated` count may be less than items sent — no error.
- **Max payload:** 200 items per request. For larger lists, send in chunks.
- **No undo needed:** The user can just drag again.

---

## Feature 2: Mark as Done

### Behavior

- User taps/clicks a "done" action on an activity → it disappears from the active list.
- Done activities are hidden by default but recoverable (not deleted).
- Users can view done activities via a toggle/filter and reactivate them.
- A running timer blocks marking done (user must stop the timer first).
- Starting a timer on a done activity is blocked (user must reactivate first).

### API

**Mark done / undone:** `PATCH /activities/{id}/done`

```json
{ "isDone": true }
```

Response:
```json
{
  "activityId": "uuid",
  "isDone": true,
  "doneAt": "2026-06-19T12:00:00Z"
}
```

### Error States

| Scenario | Status | Code | UX Suggestion |
|----------|--------|------|---------------|
| Timer running for this activity | 409 | `timer_running` | Show toast: "Stop the timer first" |
| Activity not found/not assigned | 404 | `not_found` | Remove from list (stale state) |
| Missing/invalid isDone field | 400 | `validation_error` | Client bug — shouldn't happen |

### UX Guidance

- **Completion gesture:** Checkbox, swipe-to-done, or contextual menu — your choice. The API is a simple boolean toggle.
- **Optimistic hide:** Remove from list immediately on mark-done; restore on API failure.
- **Done count badge:** The `GET /activities` response always includes `meta.doneCount` — use this for a "3 done" indicator or badge on the filter toggle, even when done items are hidden.
- **Reactivation:** When viewing done activities, each should have an "undo" / "reactivate" action that sends `{ "isDone": false }`.
- **Timer guard feedback:** If a user tries to mark an activity done while its timer is running, show a clear message. Consider auto-offering to stop the timer then mark done.

---

## Modified Activity List

### API

**Fetch activities:** `GET /activities` (default hides done)
**Include done:** `GET /activities?includeDone=true`

### Response Shape

```json
{
  "activities": [
    {
      "id": "uuid",
      "name": "Design Review",
      "projectId": "uuid",
      "projectName": "Website Redesign",
      "tagId": "uuid",
      "tagName": "Design",
      "tagColor": "purple",
      "rateOverride": null,
      "runningEntry": null,
      "isDone": false,
      "sortOrder": 2000,
      "doneAt": null
    }
  ],
  "meta": {
    "doneCount": 3
  }
}
```

### New Fields on Each Activity

| Field | Type | Description |
|-------|------|-------------|
| `isDone` | boolean | Whether user marked this activity as done |
| `sortOrder` | int \| null | Custom position (null = not explicitly ordered, sorts to bottom) |
| `doneAt` | ISO 8601 \| null | When it was marked done (null if active) |

### Sorting Rules (Server-Side)

The API returns activities pre-sorted:
1. Explicit `sortOrder` ascending (lower = higher in list)
2. Activities without a `sortOrder` come after all explicitly ordered ones
3. Within unordered activities: project name → activity name (alphabetical)

The frontend should render in the order received — no client-side re-sort needed unless doing optimistic reorder.

---

## WebSocket Notifications

When a user marks an activity done/undone, the server sends `{"event": "sync_needed"}` via WebSocket. The client should re-fetch the activity list on this signal (existing pattern).

---

## State Interactions

| Action | Effect |
|--------|--------|
| Mark done → try start timer | 409 `activity_done` — must reactivate first |
| Timer running → try mark done | 409 `timer_running` — must stop timer first |
| Mark done → activity disappears from default list | Reappears with `includeDone=true` |
| Mark undone | Activity returns to its previous sort position |
| Activity deleted by manager | Disappears entirely (CASCADE cleanup) |
| Activity unassigned then re-assigned | Reappears with prior done/sort state intact |

---

## UI Mockup Suggestions

### Active List (default view)
```
┌─────────────────────────────────────┐
│ ☰ Design Review          ▶ 0:45:12 │  ← drag handle, running timer
│ ☰ API Integration                   │
│ ☰ Unit Tests                        │
│                                     │
│         [Show 3 done activities]    │  ← uses meta.doneCount
└─────────────────────────────────────┘
```

### Done Activities (filter active)
```
┌─────────────────────────────────────┐
│ ☰ Design Review          ▶ 0:45:12 │
│ ☰ API Integration                   │
│ ☰ Unit Tests                        │
│ ─────── Done ───────────────────── │
│ ✓ Wireframes              ↩ Undo   │  ← greyed out, reactivate button
│ ✓ Initial Setup           ↩ Undo   │
│ ✓ Research                ↩ Undo   │
└─────────────────────────────────────┘
```
