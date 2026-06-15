# Design Document

## Overview

This design implements the Projects CRUD management pages — the first management feature built on top of the patterns defined in `management-pages.md` steering. It introduces reusable components (`DataTable`, `SearchToolbar`, `FormPageHeader`, `FormCard`, `ToggleField`) that all subsequent management pages (Tags, Team, Account) will reuse.

The architecture is intentionally simple: flat routes, TanStack Query for data, react-hook-form for the form page, and shared layout components that enforce visual consistency.

## Architecture

```
Routes:
  /projects          → ProjectsListPage (lazy)
  /projects/new      → ProjectFormPage mode="create" (lazy)
  /projects/:id/edit → ProjectFormPage mode="edit" (lazy)

Data Flow:
  GET /projects → useProjects hook → ProjectsListPage → DataTable
  POST /projects → useCreateProject hook → ProjectFormPage (create)
  PUT /projects/:id → useUpdateProject hook → ProjectFormPage (edit)
```

```
src/
  components/manage/
    data-table.tsx          — generic table component
    search-toolbar.tsx      — search + filters + action slot
    form-page-header.tsx    — back link + title + mode
    form-card.tsx           — white card wrapper
    toggle-field.tsx        — switch + label + description
  hooks/
    use-projects.ts         — extended with includeArchived, create, update
  pages/app/
    projects-list.tsx       — list page
    project-form.tsx        — create/edit form page
```

## Components and Interfaces

### DataTable (`src/components/manage/data-table.tsx`)

```typescript
interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  emptyMessage?: string
}

function DataTable<T>({ columns, data, keyExtractor, emptyMessage }: DataTableProps<T>): JSX.Element
```

Renders a semantic `<table>` with:
- Header: `text-sm font-medium text-text-muted`, no borders
- Rows: `border-b border-surface-border` between rows
- Empty state: centered muted message when `data.length === 0`
- No pagination (beta scale — API returns all projects)

### SearchToolbar (`src/components/manage/search-toolbar.tsx`)

```typescript
interface SearchToolbarProps {
  searchPlaceholder: string
  searchValue: string
  onSearchChange: (value: string) => void
  filterSlot?: React.ReactNode
  actionSlot?: React.ReactNode
}

function SearchToolbar({ searchPlaceholder, searchValue, onSearchChange, filterSlot, actionSlot }: SearchToolbarProps): JSX.Element
```

Layout: `flex items-center gap-4` — search input (left), filter slot (center), action slot (right, `ml-auto`).

### FormPageHeader (`src/components/manage/form-page-header.tsx`)

```typescript
interface FormPageHeaderProps {
  backLabel: string
  backTo: string
  title: string
  subtitle?: string
  mode: 'Create' | 'Edit'
}

function FormPageHeader({ backLabel, backTo, title, subtitle, mode }: FormPageHeaderProps): JSX.Element
```

Layout:
- Top row: `← backLabel` link (left) + mode text (right, muted)
- Title: `text-2xl font-bold`
- Subtitle: `text-sm text-text-muted`

### FormCard (`src/components/manage/form-card.tsx`)

```typescript
interface FormCardProps {
  children: React.ReactNode
}

function FormCard({ children }: FormCardProps): JSX.Element
```

Just `<div className="rounded-2xl bg-white shadow-sm p-6">{children}</div>`. Simple wrapper for consistency.

### ToggleField (`src/components/manage/toggle-field.tsx`)

```typescript
interface ToggleFieldProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function ToggleField({ label, description, checked, onChange, disabled }: ToggleFieldProps): JSX.Element
```

Layout: label + description (left), switch (right). Uses a shadcn Switch component (to be installed) or a native checkbox styled as toggle.

### ProjectsListPage (`src/pages/app/projects-list.tsx`)

```typescript
export default function ProjectsListPage(): JSX.Element
```

State:
- `searchQuery: string` (local useState)
- `includeArchived: boolean` (local useState, default false)

Data: `useProjects({ includeArchived })`

Filtering: client-side filter on `searchQuery` against `project.name`

Columns config:
```typescript
const columns: Column<ProjectResponse>[] = [
  { key: 'name', header: 'Project' },
  { key: 'clientName', header: 'Client', render: (p) => p.clientName ?? '—' },
  { key: 'startDate', header: 'Start', render: (p) => formatDate(p.startDate) },
  { key: 'endDate', header: 'End', render: (p) => formatDate(p.endDate) },
  { key: 'budgetHours', header: 'Budget (hrs)', render: (p) => p.budgetHours ?? '—' },
  { key: 'isBillable', header: 'Billable', render: (p) => <BillableIcon value={p.isBillable} /> },
  { key: 'isArchived', header: 'Archived', render: (p) => p.isArchived ? 'Archived' : 'Active' },
  { key: 'actions', header: 'Actions', render: (p) => <ProjectActions project={p} /> },
]
```

### ProjectFormPage (`src/pages/app/project-form.tsx`)

```typescript
interface ProjectFormPageProps {
  // Mode derived from route: /projects/new → create, /projects/:id/edit → edit
}

export default function ProjectFormPage(): JSX.Element
```

Uses `useParams()` to determine mode. If `id` param exists → edit mode, fetch project data. Otherwise → create mode.

Form schema (Zod):
```typescript
const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Max 100 characters"),
  clientName: z.string().max(255).optional().or(z.literal("")),
  budgetHours: z.coerce.number().min(0).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  isBillable: z.boolean(),
  isArchived: z.boolean(),
})
```

Submit behavior:
- Create: `POST /projects` → navigate `/projects`
- Edit: `PUT /projects/:id` with changed fields only → navigate `/projects`

## Data Models

Uses generated types from `src/api/schema.d.ts`:

```typescript
type ProjectResponse = components["schemas"]["ProjectResponse"]
// { id, accountId, name, clientName, isArchived, isBillable, startDate, endDate, budgetHours, createdAt }

type ProjectCreateRequest = components["schemas"]["ProjectCreateRequest"]
// { name, clientName?, isBillable?, startDate?, endDate?, budgetHours? }

type ProjectUpdateRequest = components["schemas"]["ProjectUpdateRequest"]
// { name?, clientName?, isBillable?, isArchived?, startDate?, endDate?, budgetHours? }
```

## Hooks

### Extended `useProjects` (`src/hooks/use-projects.ts`)

```typescript
// Already exists — extend with options parameter
function useProjects(options?: { includeArchived?: boolean }): UseQueryResult<ProjectResponse[]>

// New hooks
function useCreateProject(): UseMutationResult<ProjectResponse, Error, ProjectCreateRequest>
function useUpdateProject(): UseMutationResult<ProjectResponse, Error, { id: string; body: ProjectUpdateRequest }>
```

Query keys:
- List: `['projects', { includeArchived }]`
- Mutations invalidate: `['projects']` (all project queries)

## Routing Changes

In `src/routes.tsx`, add three routes inside the ProtectedRoute/AppShell children:

```typescript
const ProjectsListPage = lazyWithRetry(() => import("@/pages/app/projects-list"))
const ProjectFormPage = lazyWithRetry(() => import("@/pages/app/project-form"))

// Inside AppShell children:
{ path: "/projects", element: <Suspense fallback={<LoadingSpinner />}><ProjectsListPage /></Suspense> },
{ path: "/projects/new", element: <Suspense fallback={<LoadingSpinner />}><ProjectFormPage /></Suspense> },
{ path: "/projects/:id/edit", element: <Suspense fallback={<LoadingSpinner />}><ProjectFormPage /></Suspense> },
```

In `src/components/layout/nav-items.ts`:
- Remove `disabled: true` from Projects nav item
- Add responsive visibility logic (hide below desktop breakpoint) — handled in PillNav component

## Responsive Gating

The PillNav mobile bar already shows all nav items. For management pages:
- PillNav mobile bar: hide Projects/Team/Reports nav items below `desktop:` breakpoint
- Routes still exist (no 404), but nav doesn't expose them on small screens
- Optional: show a "Switch to desktop" message if user navigates directly to `/projects` on mobile

## Error Handling

| Scenario | Handler | User Experience |
|----------|---------|----------------|
| Projects fetch fails | useProjects error state | Error message + retry in list page |
| Project not found (404 on edit) | ProjectFormPage checks response | Error message + "Back to Projects" link |
| Create/update mutation fails | Form displays API error | Inline error message in form card |
| Network error on archive toggle | Mutation error callback | Toast or inline error (TBD — start with inline) |

## shadcn Components Needed

Install before implementation:
- **Switch** — for toggle fields (billable, archive)
- **Badge** — for status indicators (optional, can use text instead)
- **Tooltip** — for icon-only action buttons (edit, archive)

## Testing Strategy

### What to Test
- `useProjects` hook: returns data, handles `includeArchived` param
- `useCreateProject` / `useUpdateProject`: calls correct endpoint, invalidates cache
- `DataTable`: renders columns, handles empty state
- `ProjectFormPage`: validates required fields, submits correctly, displays errors
- Client-side search filtering logic

### What NOT to Test
- Static rendering of FormCard, FormPageHeader (no logic)
- shadcn Switch/Tooltip primitives
- Visual layout (verified via Playwright screenshot if needed)
