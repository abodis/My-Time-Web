# Technical Design

## Overview

Extend the project edit page (`project-form.tsx`) with a tabbed interface. The existing form becomes the "Project Details" panel; two new panels ("Budget" and "Activities") are added. A reusable `ProjectTabs` component handles tab rendering and keyboard navigation. Tab state is driven by URL search params via `useSearchParams`.

## Components and Interfaces

### ProjectTabs (new)
- **File:** `src/components/manage/project-tabs.tsx`
- **Props:** `{ tabs: TabDefinition[]; activeTab: string; onTabChange: (tabId: string) => void; children: React.ReactNode }`
- **Interface:** `TabDefinition { id: string; label: string }`
- **Responsibility:** Renders pill-shaped tab bar with ARIA roles and keyboard nav; wraps children in tabpanel

### BudgetPanel (new)
- **File:** `src/components/manage/budget-panel.tsx`
- **Props:** `{ projectId: string }`
- **Responsibility:** Fetches/displays budget list, inline create/edit/delete rows

### ActivitiesPanel (new)
- **File:** `src/components/manage/activities-panel.tsx`
- **Props:** `{ projectId: string }`
- **Responsibility:** Fetches/displays activities list, inline create/edit/delete rows

### Hook Interfaces

```typescript
// use-budgets.ts
function useBudgets(projectId: string): UseQueryResult<BudgetResponse[]>
function useCreateBudget(): UseMutationResult<BudgetResponse, Error, { projectId: string; body: BudgetCreateRequest }>
function useUpdateBudget(): UseMutationResult<BudgetResponse, Error, { projectId: string; budgetId: string; body: BudgetUpdateRequest }>
function useDeleteBudget(): UseMutationResult<void, Error, { projectId: string; budgetId: string }>

// use-activities.ts (mutations only; query stays in use-projects.ts)
function useCreateActivity(): UseMutationResult<ActivityResponse, Error, { projectId: string; body: ActivityCreateRequest }>
function useUpdateActivity(): UseMutationResult<ActivityResponse, Error, { id: string; projectId: string; body: ActivityUpdateRequest }>
function useDeleteActivity(): UseMutationResult<void, Error, { id: string; projectId: string }>
```

## Data Models

Uses existing API schema types — no new models needed:

| Type | Source | Fields Used |
|------|--------|-------------|
| `BudgetResponse` | `components["schemas"]["BudgetResponse"]` | id, projectId, tagId, budgetHours |
| `BudgetCreateRequest` | `components["schemas"]["BudgetCreateRequest"]` | tagId, budgetHours |
| `BudgetUpdateRequest` | `components["schemas"]["BudgetUpdateRequest"]` | budgetHours |
| `ActivityResponse` | `components["schemas"]["ActivityResponse"]` | id, projectId, tagId, name, rateOverride |
| `ActivityCreateRequest` | `components["schemas"]["ActivityCreateRequest"]` | name, tagId, rateOverride |
| `ActivityUpdateRequest` | `components["schemas"]["ActivityUpdateRequest"]` | name, tagId, rateOverride |
| `TagResponse` | `components["schemas"]["TagResponse"]` | id, name, color |

Tab state is a URL search parameter (`?tab=details|budget|activities`), not a persisted model.

## Architecture

### Component Hierarchy

```
ProjectFormPage (existing, modified)
├── FormPageHeader (unchanged)
├── FormCard
│   ├── ProjectTabs (new — tab bar + panel container)
│   │   ├── Tab: "Project Details" → ProjectDetailsPanel (extracted from current form)
│   │   ├── Tab: "Budget" → BudgetPanel (new)
│   │   └── Tab: "Activities" → ActivitiesPanel (new)
```

### New Files

| File | Purpose |
|------|---------|
| `src/components/manage/project-tabs.tsx` | Tab navigation bar component with ARIA roles and keyboard handling |
| `src/components/manage/budget-panel.tsx` | Budget list + inline create/edit/delete |
| `src/components/manage/activities-panel.tsx` | Activities list + inline create/edit/delete |
| `src/hooks/use-budgets.ts` | TanStack Query hooks: useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget |
| `src/hooks/use-activities.ts` | TanStack Query mutation hooks: useCreateActivity, useUpdateActivity, useDeleteActivity (useActivities query already in use-projects.ts) |

### Modified Files

| File | Change |
|------|--------|
| `src/pages/app/project-form.tsx` | Import ProjectTabs, BudgetPanel, ActivitiesPanel. In edit mode, wrap content in tab structure. Extract form body into inline conditional rendering based on active tab. |

## Component Design

### ProjectTabs

```typescript
interface TabDefinition {
  id: string       // "details" | "budget" | "activities"
  label: string    // Display label
}

interface ProjectTabsProps {
  tabs: TabDefinition[]
  activeTab: string
  onTabChange: (tabId: string) => void
  children: React.ReactNode  // The active panel content
}
```

Responsibilities:
- Renders a `role="tablist"` container with pill-shaped buttons
- Manages keyboard navigation (Arrow Left/Right with wrapping, Enter/Space to activate)
- Sets `aria-selected`, `tabindex`, `aria-controls` per ARIA tabs pattern
- Wraps `children` in a `role="tabpanel"` with `aria-labelledby`

Styling: `rounded-xl px-4 py-2 text-sm font-medium` per button. Active: `bg-brand/10 text-brand`. Inactive: `text-text-muted hover:bg-surface-muted`.

### BudgetPanel

```typescript
interface BudgetPanelProps {
  projectId: string
}
```

Internal state:
- `editingId: string | null` — which row is in edit mode (inline)
- `editValue: string` — the input value while editing
- `newTagId: string` — selected tag for new budget row
- `newHours: string` — hours input for new budget row
- `error: string | null` — mutation error message

Data flow:
- `useBudgets(projectId)` → list
- `useTags()` → tag lookup (name, color) + dropdown options
- Available tags = all tags minus those already budgeted (filter by `tagId` presence in budgets list)
- Inline edit: click hours cell → input appears, blur/Enter confirms, Escape cancels
- Delete: click trash icon → confirm prompt → `useDeleteBudget`

### ActivitiesPanel

```typescript
interface ActivitiesPanelProps {
  projectId: string
}
```

Internal state:
- `editingId: string | null` — which row is in inline edit mode
- `editFields: { name: string; tagId: string; rateOverride: string }` — edit state
- `newFields: { name: string; tagId: string; rateOverride: string }` — create row state
- `error: string | null` — mutation error message
- `validationErrors: Record<string, string>` — field-level validation

Data flow:
- `useActivities(projectId)` → list
- `useTags()` → tag lookup + dropdown
- Inline edit: click row edit icon → fields become inputs, save/cancel buttons appear
- Delete: click trash icon → confirm prompt → `useDeleteActivity`

## Hook Design

### use-budgets.ts

```typescript
export function useBudgets(projectId: string) {
  return useQuery({
    queryKey: ["budgets", projectId],
    queryFn: async () => {
      const { data, error } = await client.GET("/projects/{id}/budgets", {
        params: { path: { id: projectId } },
      })
      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, body }: { projectId: string; body: BudgetCreateRequest }) => {
      const { data, error } = await client.POST("/projects/{id}/budgets", {
        params: { path: { id: projectId } },
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.projectId] })
    },
  })
}

export function useUpdateBudget() {
  // Same pattern: PUT /projects/{id}/budgets/{budgetId}, invalidate ["budgets", projectId]
}

export function useDeleteBudget() {
  // Same pattern: DELETE /projects/{id}/budgets/{budgetId}, invalidate ["budgets", projectId]
}
```

### use-activities.ts

```typescript
// useActivities query stays in use-projects.ts (already exists)

export function useCreateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, body }: { projectId: string; body: ActivityCreateRequest }) => {
      const { data, error } = await client.POST("/projects/{id}/activities", {
        params: { path: { id: projectId } },
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["activities", variables.projectId] })
    },
  })
}

export function useUpdateActivity() {
  // PUT /activities/{id}, invalidate ["activities", projectId]
}

export function useDeleteActivity() {
  // DELETE /activities/{id}, invalidate ["activities", projectId]
}
```

## Tab State Management

Tab state via `useSearchParams` from react-router-dom:

```typescript
const [searchParams, setSearchParams] = useSearchParams()
const tabParam = searchParams.get("tab")
const VALID_TABS = ["details", "budget", "activities"] as const
const activeTab = VALID_TABS.includes(tabParam as any) ? tabParam! : "details"

function handleTabChange(tabId: string) {
  setSearchParams({ tab: tabId }, { replace: true })
}
```

- `replace: true` avoids polluting browser history with tab switches
- Default fallback to "details" if param missing or invalid
- In create mode (`!id`), tabs are not rendered — form displays directly

## Project Form Page Refactoring

The existing `ProjectFormPage` changes:
1. Import `useSearchParams`, `ProjectTabs`, `BudgetPanel`, `ActivitiesPanel`
2. In the edit mode render path, wrap content in `ProjectTabs` + conditional panel rendering
3. The form JSX stays in place but only renders when `activeTab === "details"`
4. Budget and Activities panels render when their respective tabs are active
5. Create mode is unchanged — no tabs shown

Conceptual structure of the edit-mode return:

```tsx
<FormCard>
  {isEdit && (
    <ProjectTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange}>
      {/* panel content rendered below based on activeTab */}
    </ProjectTabs>
  )}
  {activeTab === "details" && <form>...</form>}
  {activeTab === "budget" && <BudgetPanel projectId={id} />}
  {activeTab === "activities" && <ActivitiesPanel projectId={id} />}
</FormCard>
```

Note: In create mode, `isEdit` is false, so tabs don't render and the form displays directly (same as today).

## API Endpoints Used

| Operation | Method | Path | Request Body | Response |
|-----------|--------|------|--------------|----------|
| List budgets | GET | `/projects/{id}/budgets` | — | `BudgetResponse[]` |
| Create budget | POST | `/projects/{id}/budgets` | `BudgetCreateRequest` | `BudgetResponse` |
| Update budget | PUT | `/projects/{id}/budgets/{budgetId}` | `BudgetUpdateRequest` | `BudgetResponse` |
| Delete budget | DELETE | `/projects/{id}/budgets/{budgetId}` | — | — |
| List activities | GET | `/projects/{id}/activities` | — | `ActivityResponse[]` |
| Create activity | POST | `/projects/{id}/activities` | `ActivityCreateRequest` | `ActivityResponse` |
| Update activity | PUT | `/activities/{id}` | `ActivityUpdateRequest` | `ActivityResponse` |
| Delete activity | DELETE | `/activities/{id}` | — | — |

## Validation Rules

### Budget
- `budgetHours`: number > 0, ≤ 99,999, step 0.5
- `tagId`: required, must not already have a budget in this project

### Activity
- `name`: required, trimmed, 1–100 characters
- `tagId`: required
- `rateOverride`: optional, if provided: number ≥ 0.01, ≤ 999,999.99

Validation is local (pre-submit). Server errors displayed separately.

## Accessibility

- Tab bar: `role="tablist"`, buttons: `role="tab"`, panel: `role="tabpanel"`
- Keyboard: Arrow Left/Right moves focus (wraps), Enter/Space activates
- Active tab: `aria-selected="true"`, `tabindex="0"`
- Inactive tabs: `aria-selected="false"`, `tabindex="-1"`
- Panel linked via `aria-controls` (on tab) and `aria-labelledby` (on panel)
- Only active panel rendered in DOM (inactive panels not present = naturally hidden from AT)

## Requirement Traceability

| Requirement | Components/Hooks |
|-------------|-----------------|
| #1 Tab Navigation Display | `ProjectTabs`, `ProjectFormPage` (tab rendering logic) |
| #2 Tab Panel Switching | `ProjectFormPage` (conditional rendering based on `activeTab`) |
| #3 Budget Panel — List & Create | `BudgetPanel`, `useBudgets`, `useCreateBudget` |
| #4 Budget Panel — Update & Delete | `BudgetPanel`, `useUpdateBudget`, `useDeleteBudget` |
| #5 Activities Panel — List & Create | `ActivitiesPanel`, `useActivities`, `useCreateActivity` |
| #6 Activities Panel — Update & Delete | `ActivitiesPanel`, `useUpdateActivity`, `useDeleteActivity` |
| #7 Data Hooks | `use-budgets.ts`, `use-activities.ts` |
| #8 Accessibility | `ProjectTabs` (ARIA roles, keyboard handling) |

## Error Handling

| Scenario | Handling |
|----------|----------|
| Budget/Activity fetch fails | TanStack Query `isError` state → error message in panel with retry option |
| Create mutation fails | Error message displayed below create row; input values preserved |
| Update mutation fails | Error message on row; row reverts to previous value |
| Delete mutation fails | Error message displayed; row stays in place |
| Invalid tab param in URL | Falls back to "details" tab silently |
| Network timeout | TanStack Query default retry (3 attempts); then error state |

Error messages extracted from API response `detail` field when available, with generic fallback.

## Correctness Properties

### Property 1: Single Panel Rendered
Only one panel (details, budget, or activities) is rendered in the DOM at any time. Conditional rendering via `activeTab` equality check guarantees mutual exclusion.
- **Validates: Requirements 2.1, 2.2, 2.3**

### Property 2: Budget Tag Uniqueness
The budget creation dropdown only shows tags not already present in the project's budget list. This prevents duplicate tag-budget pairs without relying solely on server-side validation.
- **Validates: Requirements 3.6, 3.7**

### Property 3: Tab State Validity
The `activeTab` derived value is always one of `"details" | "budget" | "activities"`. Any other URL param value (or absence) maps to `"details"` via the fallback logic.
- **Validates: Requirements 1.4, 2.4**

### Property 4: Query Invalidation Scope
Mutation success handlers invalidate only `["budgets", projectId]` or `["activities", projectId]` — scoped to the current project. Other projects' cached data is unaffected.
- **Validates: Requirements 7.3, 7.4, 7.5, 7.6, 7.7, 7.8**

## Testing Strategy

- **Unit tests** (Vitest + RTL):
  - `ProjectTabs`: renders correct active state, keyboard navigation wraps, ARIA attributes correct
  - `BudgetPanel`: renders budget list, create flow, edit flow, delete confirmation, validation errors
  - `ActivitiesPanel`: renders activities list, create flow, edit flow, delete confirmation, validation errors
- **Hook tests** (Vitest):
  - `useBudgets`: returns data, handles disabled state when no projectId
  - Mutation hooks: call correct endpoints, invalidate correct query keys
- **Integration** (Vitest + RTL):
  - `ProjectFormPage`: tabs visible in edit mode, hidden in create mode; tab switching renders correct panel; URL param drives active tab
