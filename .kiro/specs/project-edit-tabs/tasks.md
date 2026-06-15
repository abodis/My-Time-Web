# Implementation Plan

## Overview

Add tabbed navigation to the project edit page with three panels: Project Details (existing form), Budget (tag-based hour allocation), and Activities (inline CRUD). Requires new hooks, new components, and integration into the existing project form page.

## Tasks

- [x] 1. Create `src/hooks/use-budgets.ts` with `useBudgets`, `useCreateBudget`, `useUpdateBudget`, `useDeleteBudget` hooks following existing TanStack Query patterns from `use-projects.ts`. Query key: `["budgets", projectId]`, enabled only when projectId is truthy. Mutations invalidate the budgets query key on success.
  - **Requirement:** #7
  - **Dependencies:** None

- [x] 2. Create `src/hooks/use-activities.ts` with `useCreateActivity`, `useUpdateActivity`, `useDeleteActivity` mutation hooks. The `useActivities` query stays in `use-projects.ts`. Mutations invalidate `["activities", projectId]` on success. `useUpdateActivity` calls `PUT /activities/{id}`, `useDeleteActivity` calls `DELETE /activities/{id}`.
  - **Requirement:** #7
  - **Dependencies:** None

- [x] 3. Create `src/components/manage/project-tabs.tsx` — a `ProjectTabs` component with `TabDefinition` interface. Props: `tabs`, `activeTab`, `onTabChange`, `children`. Renders `role="tablist"` with pill-shaped buttons (active: `bg-brand/10 text-brand`, inactive: `text-text-muted hover:bg-surface-muted`, all `rounded-xl px-4 py-2 text-sm font-medium`). Keyboard nav: Arrow Left/Right with wrapping, Enter/Space activates. ARIA: `aria-selected`, `tabindex`, `aria-controls`, `role="tabpanel"` wrapper with `aria-labelledby`.
  - **Requirement:** #1, #8
  - **Dependencies:** None

- [x] 4. Create `src/components/manage/budget-panel.tsx` — `BudgetPanel` component with `projectId` prop. Uses `useBudgets`, `useTags`, budget mutations. Shows loading spinner, empty state, budget list (tag color + name + hours), inline create row (tag dropdown filtered to exclude already-budgeted tags + hours input min 0.5/max 99999/step 0.5), inline edit on hours (blur/Enter confirms, Escape cancels, validation >0 ≤99999), delete with confirmation. Error messages on mutation failure with revert.
  - **Requirement:** #3, #4
  - **Dependencies:** 1

- [x] 5. Create `src/components/manage/activities-panel.tsx` — `ActivitiesPanel` component with `projectId` prop. Uses `useActivities`, `useTags`, activity mutations. Shows loading spinner, empty state, activities list (name + tag with color + rate override). Inline create row (name required 1-100 chars, tag required, rate override optional 0.01-999999.99). Inline edit with save/cancel (PUT only changed fields). Delete with confirmation. Client-side validation blocks invalid submits. Error messages on failure with revert.
  - **Requirement:** #5, #6
  - **Dependencies:** 2

- [x] 6. Modify `src/pages/app/project-form.tsx` — add `useSearchParams` for tab state, derive `activeTab` with fallback to "details". In edit mode: render `ProjectTabs` inside `FormCard` with three tabs. Conditionally render existing form (details), `BudgetPanel` (budget), or `ActivitiesPanel` (activities) based on `activeTab`. Create mode unchanged (no tabs). Use `replace: true` on setSearchParams to avoid history pollution.
  - **Requirement:** #1, #2
  - **Dependencies:** 3, 4, 5

## Notes

- The `useActivities` query hook already exists in `src/hooks/use-projects.ts` — only mutation hooks go in the new file.
- Tab state is URL-driven (`?tab=details|budget|activities`) so tabs are linkable and survive refresh.
- All panels use conditional rendering (not CSS hide) — only active panel is in the DOM.

## Task Dependency Graph

```json
{
  "waves": [
    {"tasks": [1, 2, 3]},
    {"tasks": [4, 5]},
    {"tasks": [6]}
  ]
}
```
