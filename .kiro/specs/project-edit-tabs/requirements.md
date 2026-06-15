# Requirements Document

## Introduction

Add horizontal tab navigation to the project edit screen, enabling users to manage Project Details, Budget allocations, and Activities from a single page. Tabs use pill-shaped buttons matching the existing PillNav visual style. In create mode, only the Project Details tab is shown until the project is saved (Budget and Activities require a persisted projectId).

## Glossary

- **Tab_Navigation**: A horizontal row of pill-shaped buttons inside the FormCard that switches the visible panel content
- **Project_Details_Panel**: The existing project edit form (name, client, dates, toggles)
- **Budget_Panel**: A panel for allocating budget hours per tag for a project
- **Activities_Panel**: A panel for inline CRUD management of project activities
- **Budget**: A record linking a tag to a number of allocated hours for a specific project (`{ id, projectId, tagId, budgetHours }`)
- **Activity**: A record linking a tag and a name to a project with an optional rate override (`{ id, projectId, tagId, name, rateOverride }`)
- **Tag**: A categorization entity with name, color, and default rate
- **FormCard**: The white rounded card container (`rounded-2xl bg-white shadow-lg p-6`) that wraps page content
- **Active_Tab**: The currently selected tab, stored as a URL search parameter (`?tab=details|budget|activities`)

## Requirements

### Requirement 1: Tab Navigation Display

**User Story:** As a user, I want to see pill-shaped tab buttons at the top of the project edit card, so that I can switch between Project Details, Budget, and Activities panels.

#### Acceptance Criteria

1. WHILE the project edit page is in edit mode (route contains a persisted projectId parameter), THE Tab_Navigation SHALL display three tabs labeled "Project Details", "Budget", and "Activities" in a horizontal row inside the FormCard, positioned above the panel content area
2. THE Tab_Navigation SHALL render each tab as a pill-shaped button with `rounded-xl` border radius, applying `bg-brand/10 text-brand` styling to the active tab and `text-text-muted hover:bg-surface-muted` styling to inactive tabs
3. WHEN a tab button is clicked, THE Tab_Navigation SHALL set the active tab's visual styling to `bg-brand/10 text-brand`, remove active styling from previously active tab, and update the URL search parameter `tab` to the corresponding value (`details`, `budget`, or `activities`) without a full page reload
4. WHEN the page loads without a `tab` search parameter or with an unrecognized `tab` value, THE Tab_Navigation SHALL display the "Project Details" panel as active and set the URL search parameter to `details`
5. WHILE the project edit page is in create mode (route has no projectId parameter), THE Tab_Navigation SHALL be hidden and only the Project Details form SHALL be displayed

### Requirement 2: Tab Panel Switching

**User Story:** As a user, I want clicking a tab to show only that tab's content panel, so that the interface stays focused on one concern at a time.

#### Acceptance Criteria

1. WHEN the Active_Tab is "details", THE Project_Details_Panel SHALL be rendered and Budget_Panel and Activities_Panel SHALL NOT be rendered
2. WHEN the Active_Tab is "budget", THE Budget_Panel SHALL be rendered and Project_Details_Panel and Activities_Panel SHALL NOT be rendered
3. WHEN the Active_Tab is "activities", THE Activities_Panel SHALL be rendered and Project_Details_Panel and Budget_Panel SHALL NOT be rendered
4. WHEN the Active_Tab URL parameter contains a value other than "details", "budget", or "activities", THE Tab_Navigation SHALL fall back to rendering the "Project Details" panel

### Requirement 3: Budget Panel — List and Create

**User Story:** As a user, I want to allocate budget hours per tag for a project, so that I can plan resource distribution across categories.

#### Acceptance Criteria

1. WHEN the Budget_Panel is displayed, THE Budget_Panel SHALL fetch and list all existing budgets for the current project, showing the tag name (with color indicator) and allocated hours for each
2. WHEN no budgets exist for the project, THE Budget_Panel SHALL display an empty state message indicating no budgets have been allocated
3. THE Budget_Panel SHALL provide an inline row for creating a new budget with a tag selector (dropdown of available tags) and a budget hours numeric input that accepts values from 0.5 to 99999 in increments of 0.5
4. WHEN the user submits a new budget row with a valid tag selection and a positive hours value, THE Budget_Panel SHALL send a POST request to `/projects/{id}/budgets` and append the new budget to the list on success
5. IF the budget creation request fails, THEN THE Budget_Panel SHALL display an error message to the user without clearing the input values
6. THE Budget_Panel SHALL prevent the user from selecting a tag that already has a budget allocated for the current project by omitting already-budgeted tags from the tag selector dropdown
7. IF all available tags already have budgets allocated for the current project, THEN THE Budget_Panel SHALL disable the budget creation row and display a message indicating all tags are allocated
8. WHILE the budget list is being fetched from the server, THE Budget_Panel SHALL display a loading indicator in place of the budget list

### Requirement 4: Budget Panel — Update and Delete

**User Story:** As a user, I want to edit or remove existing budget allocations, so that I can adjust plans as project needs change.

#### Acceptance Criteria

1. WHEN the user modifies the `budgetHours` value of an existing budget row and confirms the change, THE Budget_Panel SHALL validate that the value is a number greater than 0 and at most 99,999 before sending a PUT request to `/projects/{id}/budgets/{budgetId}` with the updated `budgetHours` value
2. WHEN the PUT request returns a successful response, THE Budget_Panel SHALL update the row in the list to reflect the `budgetHours` value from the server response
3. WHEN the user triggers delete on an existing budget row, THE Budget_Panel SHALL display a confirmation prompt before sending the request
4. WHEN the user confirms deletion, THE Budget_Panel SHALL send a DELETE request to `/projects/{id}/budgets/{budgetId}` and remove the row from the list on success
5. IF a budget update or delete request fails, THEN THE Budget_Panel SHALL display an error message indicating the failure reason and revert the row to its previous state
6. IF the user enters a `budgetHours` value that is not a number greater than 0 or exceeds 99,999, THEN THE Budget_Panel SHALL display a validation error and prevent submission

### Requirement 5: Activities Panel — List and Create

**User Story:** As a user, I want to add activities to a project with a tag and optional rate override, so that I can define billable work items.

#### Acceptance Criteria

1. WHEN the Activities_Panel is displayed, THE Activities_Panel SHALL fetch and list all existing activities for the current project, showing activity name, associated tag name with color indicator, and rate override value (if set)
2. WHEN no activities exist for the project, THE Activities_Panel SHALL display an empty state message indicating no activities have been created
3. THE Activities_Panel SHALL provide an inline row for creating a new activity with fields for name (required, 1–100 characters), tag selector (required, populated from the account's tags list), and rate override (optional numeric input accepting values from 0.01 to 999,999.99)
4. WHEN the user submits a new activity row with a non-empty trimmed name of 1–100 characters and a selected tag, THE Activities_Panel SHALL send a POST request to `/projects/{id}/activities` and append the new activity to the list on success
5. IF the activity creation request fails, THEN THE Activities_Panel SHALL display an error message indicating the failure reason without clearing the input values
6. IF the user submits the new activity row with an empty or whitespace-only name or without a selected tag, THEN THE Activities_Panel SHALL display inline validation messages on the invalid fields and SHALL NOT send a request to the server

### Requirement 6: Activities Panel — Update and Delete

**User Story:** As a user, I want to edit or remove project activities, so that I can keep the activity list accurate over time.

#### Acceptance Criteria

1. WHEN the user edits an existing activity row (name, tagId, or rateOverride) and confirms the change, THE Activities_Panel SHALL send a PUT request to `/activities/{activityId}` containing only the modified fields and update the row with the returned ActivityResponse on success
2. WHEN the user triggers delete on an existing activity row and confirms via a confirmation prompt, THE Activities_Panel SHALL send a DELETE request to `/activities/{activityId}` and remove the row from the list on success
3. IF an activity update request fails, THEN THE Activities_Panel SHALL display an error message indicating the failure reason and revert the row to its previous values without losing the user's position in the list
4. IF an activity delete request fails, THEN THE Activities_Panel SHALL display an error message indicating the failure reason and retain the row in its original position
5. IF the user submits an activity name that is empty or exceeds 100 characters, THEN THE Activities_Panel SHALL display a validation error on the name field and prevent the PUT request from being sent

### Requirement 7: Data Hooks

**User Story:** As a developer, I want TanStack Query hooks for budgets and activity/budget mutations, so that server state is managed consistently with existing patterns.

#### Acceptance Criteria

1. THE useBudgets hook SHALL accept a projectId parameter and return a TanStack Query `UseQueryResult` containing the array of `BudgetResponse` objects for that project, using query key `["budgets", projectId]`
2. IF projectId is falsy, THEN THE useBudgets hook SHALL disable the query by setting `enabled: false` so that no network request is made
3. THE useCreateBudget mutation hook SHALL accept `{ projectId: string; body: BudgetCreateRequest }` as its mutation function parameter and invalidate all queries matching the `["budgets", projectId]` query key on success
4. THE useUpdateBudget mutation hook SHALL accept `{ projectId: string; budgetId: string; body: BudgetUpdateRequest }` as its mutation function parameter and invalidate all queries matching the `["budgets", projectId]` query key on success
5. THE useDeleteBudget mutation hook SHALL accept `{ projectId: string; budgetId: string }` as its mutation function parameter and invalidate all queries matching the `["budgets", projectId]` query key on success
6. THE useCreateActivity mutation hook SHALL accept `{ projectId: string; body: ActivityCreateRequest }` as its mutation function parameter and invalidate all queries matching the `["activities", projectId]` query key on success
7. THE useUpdateActivity mutation hook SHALL accept `{ id: string; projectId: string; body: ActivityUpdateRequest }` as its mutation function parameter and invalidate all queries matching the `["activities", projectId]` query key on success
8. THE useDeleteActivity mutation hook SHALL accept `{ id: string; projectId: string }` as its mutation function parameter and invalidate all queries matching the `["activities", projectId]` query key on success
9. IF a mutation function call receives an error response from the API client, THEN THE mutation hook SHALL throw the error to TanStack Query's error state without invalidating any query keys

### Requirement 8: Accessibility

**User Story:** As a user navigating with assistive technology, I want the tab interface to be keyboard accessible and properly labeled, so that I can use the feature without a mouse.

#### Acceptance Criteria

1. THE Tab_Navigation SHALL use a `role="tablist"` container with each tab button having `role="tab"` and each content panel having `role="tabpanel"`
2. THE Tab_Navigation SHALL support keyboard navigation: Arrow Left/Right to move focus between tabs with focus wrapping from the last tab to the first and vice versa, and Enter/Space to activate the focused tab
3. WHEN a tab is active, THE corresponding tab button SHALL have `aria-selected="true"` and `tabindex="0"`, and the inactive tabs SHALL have `aria-selected="false"` and `tabindex="-1"`
4. THE tab panel SHALL be associated with its tab button via matching `aria-controls` on the tab and `aria-labelledby` on the panel referencing the tab's `id`
5. WHEN a tab is inactive, THE corresponding tab panel SHALL be hidden from assistive technology using the `hidden` attribute or equivalent
