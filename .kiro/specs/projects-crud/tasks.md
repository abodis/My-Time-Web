# Implementation Plan

## Overview

Implements Projects CRUD management UI in four waves: shared components and data layer first, then list page, then form page, then integration (routing, nav). Establishes reusable management patterns for subsequent features (Tags, Team, Account).

## Tasks

- [x] 1. Shared management components
  - [x] 1.1 Create DataTable component
    - Create `src/components/manage/data-table.tsx`
    - Accept generic `columns`, `data`, `keyExtractor`, `emptyMessage` props
    - Render semantic `<table>` with muted header row, separator borders between rows
    - Render centered empty message when data array is empty
    - Match wireframe: no cell borders, `text-sm` body, `text-text-muted text-xs font-medium uppercase` headers
  - **Requirement:** #5
  - **Dependencies:** None

  - [x] 1.2 Create SearchToolbar component
    - Create `src/components/manage/search-toolbar.tsx`
    - Accept `searchPlaceholder`, `searchValue`, `onSearchChange`, `filterSlot`, `actionSlot`
    - Layout: search input (left) with search icon, filter slot (center), action slot (`ml-auto` right)
    - Search input: `rounded-full border bg-white` with magnifying glass icon
  - **Requirement:** #5
  - **Dependencies:** None

  - [x] 1.3 Create FormPageHeader component
    - Create `src/components/manage/form-page-header.tsx`
    - Accept `backLabel`, `backTo`, `title`, `subtitle`, `mode`
    - Render: `← backLabel` as Link (top-left), mode text (top-right, muted), title (`text-2xl font-bold`), subtitle (`text-sm text-text-muted`)
  - **Requirement:** #5
  - **Dependencies:** None

  - [x] 1.4 Create FormCard component
    - Create `src/components/manage/form-card.tsx`
    - Simple wrapper: `rounded-2xl bg-white shadow-sm p-6`
    - Accept `children` prop only
  - **Requirement:** #5
  - **Dependencies:** None

  - [x] 1.5 Create ToggleField component
    - Create `src/components/manage/toggle-field.tsx`
    - Accept `label`, `description`, `checked`, `onChange`, `disabled`
    - Layout: label + description text (left), toggle switch (right)
    - Use a styled checkbox or install shadcn Switch primitive
  - **Requirement:** #5
  - **Dependencies:** None

- [x] 2. Data layer — Project hooks
  - [x] 2.1 Extend useProjects hook with includeArchived parameter
    - Update `src/hooks/use-projects.ts`
    - Add optional `{ includeArchived?: boolean }` parameter
    - Update query key to `['projects', { includeArchived }]`
    - Pass `includeArchived` as query param to `GET /projects`
  - **Requirement:** #6
  - **Dependencies:** None

  - [x] 2.2 Create useCreateProject hook
    - Add to `src/hooks/use-projects.ts`
    - Call `POST /projects` with `ProjectCreateRequest` body
    - Invalidate `['projects']` on success
    - Return mutation result
  - **Requirement:** #6
  - **Dependencies:** None

  - [x] 2.3 Create useUpdateProject hook
    - Add to `src/hooks/use-projects.ts`
    - Call `PUT /projects/:id` with `ProjectUpdateRequest` body
    - Accept `{ id: string; body: ProjectUpdateRequest }`
    - Invalidate `['projects']` on success
    - Return mutation result
  - **Requirement:** #6
  - **Dependencies:** None

- [x] 3. Projects List Page
  - [x] 3.1 Create ProjectsListPage component
    - Create `src/pages/app/projects-list.tsx`
    - Local state: `searchQuery` (string), `includeArchived` (boolean, default false)
    - Fetch projects with `useProjects({ includeArchived })`
    - Client-side filter: filter rows where `project.name` includes `searchQuery` (case-insensitive)
    - Compose: SearchToolbar + ContentCard + DataTable
  - **Requirement:** #1
  - **Dependencies:** 1.1, 1.2, 2.1

  - [x] 3.2 Define columns configuration
    - Columns: Project (name), Client (clientName or "—"), Start (formatted date), End (formatted date), Budget (budgetHours or "—"), Billable (checkmark/x icon), Archived (Active/Archived text), Actions
    - Add date formatting helper (reuse from time-utils or add `formatDate` for date-only display)
  - **Requirement:** #1
  - **Dependencies:** 3.1

  - [x] 3.3 Implement ProjectActions inline component
    - Edit button: icon button, navigates to `/projects/:id/edit`
    - Archive button: icon button, calls `useUpdateProject` with `{ isArchived: !current }`
    - Both use Lucide icons (Pencil, Archive)
  - **Requirement:** #1
  - **Dependencies:** 2.3, 3.1

  - [x] 3.4 Implement Filters dropdown
    - "Filters" button that opens a dropdown/popover
    - Contains: "Show archived" checkbox/toggle
    - When toggled, sets `includeArchived` state
    - Can be a simple button + absolute dropdown for now (no complex component library needed)
  - **Requirement:** #1
  - **Dependencies:** 3.1

  - [x] 3.5 Add loading and error states
    - Loading: show skeleton rows or centered spinner inside the content card
    - Error: centered error message with retry button
    - Empty: "No projects yet. Create your first project to get started."
  - **Requirement:** #1
  - **Dependencies:** 3.1

- [x] 4. Project Form Page
  - [x] 4.1 Create ProjectFormPage component
    - Create `src/pages/app/project-form.tsx`
    - Determine mode from route: `useParams().id` exists → edit, otherwise → create
    - Compose: FormPageHeader + FormCard + form fields + footer
  - **Requirement:** #2, #3
  - **Dependencies:** 1.3, 1.4, 1.5

  - [x] 4.2 Implement form with react-hook-form + Zod
    - Define `projectFormSchema` with Zod validation
    - Fields: name (required), clientName, budgetHours, startDate, endDate, isBillable (toggle), isArchived (toggle)
    - Layout: name full-width, clientName + budgetHours side-by-side, startDate + endDate side-by-side, toggles at bottom
    - Inline validation errors below fields
  - **Requirement:** #2
  - **Dependencies:** 4.1

  - [x] 4.3 Implement create mode submission
    - On submit: call `useCreateProject` with form data
    - On success: navigate to `/projects`
    - On error: display API error in form
    - Button text: "Create Project" with checkmark icon
  - **Requirement:** #2
  - **Dependencies:** 2.2, 4.2

  - [x] 4.4 Implement edit mode — data loading and submission
    - Fetch project data (from query cache or API)
    - Pre-populate form with `reset()` when data arrives
    - On submit: call `useUpdateProject` with only changed fields
    - On success: navigate to `/projects`
    - Button text: "Save Changes"
    - Handle 404: show error state with back link
  - **Requirement:** #3
  - **Dependencies:** 2.3, 4.2

  - [x] 4.5 Add loading state for edit mode
    - Show skeleton/spinner while project data loads
    - Disable form submission until data is ready
  - **Requirement:** #3
  - **Dependencies:** 4.4

- [x] 5. Route and navigation integration
  - [x] 5.1 Add project routes to routes.tsx
    - Import ProjectsListPage and ProjectFormPage with `lazyWithRetry`
    - Add routes: `/projects`, `/projects/new`, `/projects/:id/edit`
    - Wrap in Suspense with LoadingSpinner fallback
    - Place inside ProtectedRoute → AppShell children
  - **Requirement:** #4
  - **Dependencies:** 3.1, 4.1

  - [x] 5.2 Enable Projects nav item
    - In `src/components/layout/nav-items.ts`: remove `disabled: true` from Projects
    - In PillNav: hide Projects, Team, Reports items on mobile bar (below desktop breakpoint)
    - Use `hidden desktop:flex` or similar conditional rendering
  - **Requirement:** #4
  - **Dependencies:** None

- [x] 6. Verification checkpoint
  - Run `npm run build` — no TypeScript errors
  - Run `npm run test` — all existing tests still pass
  - Verify Projects nav item is clickable and navigates correctly
  - Verify list page shows projects from API
  - Verify create flow: fill form → submit → appears in list
  - Verify edit flow: click edit → form pre-populated → change field → save → updated in list
  - Verify archive: click archive icon → project shows "Archived" → toggle filter to see it
  - Verify search: type in search → table filters
  - **Requirement:** #1, #2, #3, #4, #5, #6
  - **Dependencies:** 5.1, 5.2

## Notes

- This is the first management page — patterns established here will be reused for Tags, Team, Account
- No hard delete anywhere — archive only
- Management pages are desktop-only; mobile nav hides these items
- No pagination needed at beta scale
- Sub-resources (activities, budgets per project) are Phase 2 follow-up, not in this spec

## Task Dependency Graph

```json
{
  "waves": [
    { "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "2.1", "2.2", "2.3", "5.2"] },
    { "tasks": ["3.1", "4.1"] },
    { "tasks": ["3.2", "3.3", "3.4", "3.5", "4.2"] },
    { "tasks": ["4.3", "4.4", "5.1"] },
    { "tasks": ["4.5", "6"] }
  ]
}
```
