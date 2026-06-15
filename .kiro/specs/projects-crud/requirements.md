# Requirements Document

## Introduction

This feature implements the Projects management UI — Phase 2's first deliverable. It provides a list view for browsing projects and a form page for creating/editing them. Management pages are desktop-only (≥1024px). The implementation establishes the reusable CRUD patterns (table, toolbar, form page) that Tags, Team, and Account pages will follow.

## Glossary

- **Projects_List_Page**: The page at `/projects` displaying all projects in a table with search, filters, and a "New Project" action
- **Project_Form_Page**: The page at `/projects/new` (create) or `/projects/:id/edit` (edit) with a form for project details
- **Content_Card**: A `rounded-2xl bg-white shadow-sm` container used consistently for both list and form content
- **Search_Toolbar**: The bar above the content card containing search input, filter controls, and primary action button
- **Data_Table**: A columnar table component rendering rows with header, data, and actions columns
- **Archive_Action**: Soft-removal of a project from active lists while retaining all data; no hard delete

## Requirements

### Requirement 1: Projects List Page

**User Story:** As an admin, I want to see all my projects in a table, so that I can quickly find and manage them.

#### Acceptance Criteria

1. THE Projects_List_Page SHALL be accessible at the route `/projects` within the AppShell layout, visible only at viewport widths ≥1024px (desktop breakpoint)
2. THE Projects_List_Page SHALL display a Search_Toolbar above the Content_Card containing: a search input (placeholder "Search projects by name"), a "Filters" dropdown button, and a "+ New Project" pill button (green background, white text) aligned to the right
3. THE Content_Card SHALL contain a heading "All Projects" and a Data_Table with columns: Project (name), Client, Start, End, Budget (hrs), Billable, Archived, Actions
4. THE Data_Table SHALL render one row per project returned from `GET /projects`, sorted alphabetically by name by default
5. WHEN the search input has a value, THE Data_Table SHALL filter rows client-side to show only projects whose name contains the search term (case-insensitive)
6. THE "Billable" column SHALL display a checkmark icon when `isBillable` is true and an X icon when false
7. THE "Archived" column SHALL display "Active" text when `isArchived` is false and "Archived" text when true
8. THE Actions column SHALL contain an edit icon button (navigates to `/projects/:id/edit`) and an archive toggle icon button
9. WHEN the archive button is clicked, THE page SHALL call `PUT /projects/:id` with `{ isArchived: true }` (or false to unarchive) and invalidate the projects query on success
10. THE Projects_List_Page SHALL show a loading state (skeleton or spinner) while data is fetching and an empty state message when no projects exist
11. THE "Filters" dropdown SHALL include a toggle to "Show archived projects" which calls `GET /projects?includeArchived=true`

### Requirement 2: Project Create Page

**User Story:** As an admin, I want to create a new project with its details, so that my team can start tracking time against it.

#### Acceptance Criteria

1. THE Project_Form_Page SHALL be accessible at `/projects/new` and display a "← Back to Projects" link, a mode indicator showing "Create", a page title "Create New Project", and subtitle "Fill in the details below to initialize a new project workspace."
2. THE form SHALL contain a Content_Card with fields: Project Name (required, text, max 100 chars), Client Name (optional, text, max 255 chars), Budget Hours (optional, number, min 0), Start Date (optional, date), End Date (optional, date), Billable Project (toggle, default true), Archive Status (toggle, default false)
3. THE "Project Name" field SHALL span the full width of the form and be marked with an asterisk (*) indicating it is required, with helper text "This is the primary identifier used across the application."
4. THE "Client Name" and "Budget Hours" fields SHALL be displayed side by side in a 2-column grid
5. THE "Start Date" and "End Date" fields SHALL be displayed side by side in a 2-column grid
6. THE toggle fields SHALL display a label and description text: "Billable Project — Track hours against client budgets." and "Archive Status — Hide from active lists. Data is retained."
7. THE form footer SHALL contain a Cancel button (navigates back to `/projects` without saving) and a "Create Project" primary button (green pill with checkmark icon)
8. WHEN the form is submitted with valid data, THE page SHALL call `POST /projects` with the form values and navigate to `/projects` on success
9. WHEN the form is submitted with invalid data (empty name, name > 100 chars), THE page SHALL display inline validation errors below the relevant fields without submitting
10. WHEN the API returns an error, THE page SHALL display the error message in an alert area within the form card

### Requirement 3: Project Edit Page

**User Story:** As an admin, I want to edit an existing project's details, so that I can update client info, dates, and billing status as projects evolve.

#### Acceptance Criteria

1. THE Project_Form_Page SHALL be accessible at `/projects/:id/edit` and pre-populate all fields with the project's current data fetched from `GET /projects` (filtered by id from the list cache or fetched individually)
2. THE page SHALL display "← Back to Projects", mode indicator "Edit", title "Edit Project", and subtitle showing the project name
3. THE form footer primary button SHALL read "Save Changes" instead of "Create Project"
4. WHEN the form is submitted, THE page SHALL call `PUT /projects/:id` with only the changed fields and navigate to `/projects` on success
5. WHEN the project data is loading, THE form SHALL display a loading state (spinner or skeleton fields)
6. IF the project ID does not exist (404 from API), THE page SHALL display an error state with a link back to the projects list

### Requirement 4: Navigation and Route Integration

**User Story:** As a user, I want to navigate to the Projects page from the main navigation, so that I can manage my projects without memorizing URLs.

#### Acceptance Criteria

1. THE "Projects" nav item in PillNav SHALL be enabled (remove `disabled: true`) and navigate to `/projects`
2. THE routes configuration SHALL include `/projects`, `/projects/new`, and `/projects/:id/edit` as lazy-loaded routes within the ProtectedRoute/AppShell layout
3. WHEN the viewport is below 1024px, THE "Projects" nav item SHALL be hidden from the mobile/tablet navigation bar
4. THE route `/projects/new` and `/projects/:id/edit` SHALL render the same ProjectFormPage component, receiving mode ("create" or "edit") from the route context

### Requirement 5: Shared Management Components

**User Story:** As a developer, I want reusable management UI primitives, so that Tags, Team, and Account pages can be built consistently with minimal duplication.

#### Acceptance Criteria

1. A `DataTable` component SHALL accept a columns configuration (header label, accessor key or render function, width hint) and a data array, rendering a table matching the wireframe style (no cell borders, muted header text, row separators)
2. A `SearchToolbar` component SHALL accept: search placeholder text, onSearch callback, filter slot (ReactNode), and primary action slot (ReactNode)
3. A `FormPageHeader` component SHALL accept: backLabel, backTo, title, subtitle, and mode — rendering the back link, heading, subtitle, and mode indicator
4. A `FormCard` component SHALL be a styled wrapper providing the consistent `rounded-2xl bg-white shadow-sm p-6` card styling for form content
5. A `ToggleField` component SHALL accept: label, description, checked, and onChange — rendering a switch with label and description text
6. ALL shared components SHALL be located in `src/components/manage/` and exported for use by any management page

### Requirement 6: Data Layer

**User Story:** As a developer, I want TanStack Query hooks for project CRUD operations, so that data fetching and mutations follow established patterns.

#### Acceptance Criteria

1. A `useProjects` hook SHALL call `GET /projects` (with optional `includeArchived` parameter) and return the query result, using query key `['projects', { includeArchived }]`
2. A `useUpdateProject` hook SHALL call `PUT /projects/:id` and invalidate `['projects']` on success
3. A `useCreateProject` hook SHALL call `POST /projects` and invalidate `['projects']` on success
4. ALL hooks SHALL use the generated openapi-fetch client and schema types — no hand-written fetch calls or response types
5. THE existing `useProjects` hook in `src/hooks/use-projects.ts` SHALL be extended (not duplicated) if it already provides project list functionality
