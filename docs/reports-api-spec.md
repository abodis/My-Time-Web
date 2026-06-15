# Reports API Specification

Three new read-only endpoints under `/reports`. All require authentication. No new database tables — these aggregate existing entries, budgets, and tags data.

---

## 1. GET /reports/project-budget

**Access:** manager, admin

**Purpose:** Budget vs consumed hours per project, broken down by tag within a date range.

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| from | string (ISO 8601) | yes | Period start |
| to | string (ISO 8601) | yes | Period end |
| projectId | string (UUID) | no | Filter to a single project |

### Response (200)

```json
{
  "projects": [
    {
      "projectId": "uuid",
      "projectName": "string",
      "budgetHours": 100.0,
      "consumedHours": 63.5,
      "tags": [
        {
          "tagId": "uuid",
          "tagName": "string",
          "tagColor": "#16a34a",
          "budgetHours": 40.0,
          "consumedHours": 28.5
        }
      ]
    }
  ]
}
```

### Field Notes

- `budgetHours` at project level = `ProjectResponse.budgetHours` (null if unset)
- `budgetHours` per tag = from `BudgetResponse` for that project+tag pair (null if no budget defined for that tag)
- `consumedHours` = sum of `durationSeconds / 3600` for completed entries in the period, grouped by tag
- Only include projects that have at least one entry in the period OR have budgets defined
- Tags array only includes tags that have entries in the period OR have a budget set
- Running entries (no `endTime`) are excluded from consumption

---

## 2. GET /reports/financial

**Access:** admin only

**Purpose:** Same as project-budget but adds financial columns (billable revenue, cost, margin).

### Query Parameters

Same as `/reports/project-budget`.

### Response (200)

```json
{
  "currency": "USD",
  "projects": [
    {
      "projectId": "uuid",
      "projectName": "string",
      "budgetHours": 100.0,
      "consumedHours": 63.5,
      "billableTotal": 6350.00,
      "costTotal": 3175.00,
      "margin": 3175.00,
      "tags": [
        {
          "tagId": "uuid",
          "tagName": "string",
          "tagColor": "#16a34a",
          "budgetHours": 40.0,
          "consumedHours": 28.5,
          "billableTotal": 2850.00,
          "costTotal": 1425.00,
          "margin": 1425.00
        }
      ]
    }
  ]
}
```

### Field Notes

- `currency` = account's currency (from `AccountResponse.currency`)
- `billableTotal` = sum of `(entry.billableRate × entry.durationSeconds / 3600)` for entries where billableRate is set
- `costTotal` = sum of `(entry.costRate × entry.durationSeconds / 3600)` for entries where costRate is set
- `margin` = `billableTotal - costTotal`
- Entries with null rates contribute 0 to the respective total (still count toward hours)
- Same inclusion/exclusion rules as project-budget

---

## 3. GET /reports/personal-time

**Access:** all authenticated users

**Purpose:** User's own time in a period, grouped by tag or activity.

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| from | string (ISO 8601) | yes | Period start |
| to | string (ISO 8601) | yes | Period end |
| groupBy | "tag" \| "activity" | yes | Grouping dimension |
| userId | string (UUID) | no | View another user (manager/admin only) |

### Response (200)

```json
{
  "totalHours": 32.5,
  "groups": [
    {
      "id": "uuid",
      "name": "string",
      "color": "#16a34a",
      "hours": 18.0,
      "entryCount": 12
    }
  ]
}
```

### Field Notes

- `id` = tagId when `groupBy=tag`, activityId when `groupBy=activity`
- `color` = tag color when `groupBy=tag`, null when `groupBy=activity`
- `hours` = sum of `durationSeconds / 3600` for completed entries
- `entryCount` = number of completed entries in the group
- If `userId` is omitted, returns the authenticated user's own data
- If `userId` is provided by a non-manager/non-admin, return 403
- Running entries excluded

---

## Error Responses

All endpoints follow existing API error patterns:

| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |
| 403 | Role insufficient (e.g., user hitting /reports/financial) |
| 422 | Missing/invalid params (from/to not valid ISO, bad groupBy value) |

---

## Implementation Notes

1. **No new tables.** These are aggregation queries over `entries` joined to `activities` (for tagId), `tags` (for name/color), `budgets`, and `projects`.
2. **Core query pattern:** Filter entries by `startTime >= from AND startTime < to AND endTime IS NOT NULL`, join to get tag/project info, GROUP BY tag (or activity).
3. **Budget join:** LEFT JOIN budgets on project+tag so tags without budgets still appear (with null budgetHours).
4. **Rate calculation:** Use the entry's stored `billableRate`/`costRate` (already snapshot at entry creation time), not the tag's current `defaultRate`.
5. **Performance:** For beta scale (< 10k entries per account) these queries are fine without materialized views. Add indexes on `entries(accountId, startTime)` if not already present.
