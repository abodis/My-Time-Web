# Requirements Document

## Introduction

Inline assignment management for the Activities tab on the project edit page. Adds an "Assigned" column to the activities table with a popover checklist that allows managers to toggle user assignments per activity. This enables managers to control which users can track time against specific activities, using the existing assignment API endpoints.

## Glossary

- **Activities_Panel**: The table component displaying activities within a project edit page (`src/components/manage/activities-panel.tsx`)
- **Assignment_Popover**: A popover UI anchored to the Assigned column cell, containing a checklist of account members
- **Assignment_API**: The REST endpoints for managing activity assignments (`GET/POST/DELETE /activities/{id}/assignments`)
- **Members_API**: The REST endpoint returning all account members (`GET /account/members`)
- **Assignment_Indicator**: The visual cell content in the Assigned column showing assignment count and status icon
- **Manager**: A user with the "manager" or "admin" role who has permission to manage assignments

## Requirements

### Requirement 1: Display Assigned Column

**User Story:** As a manager, I want to see an "Assigned" column in the activities table, so that I can quickly identify which activities have users assigned.

#### Acceptance Criteria

1. THE Activities_Panel SHALL display an "Assigned" column with the header text "Assigned" between the "Rate Override" column and the "Actions" column
2. WHEN an activity has one or more assignments, THE Assignment_Indicator SHALL display a people icon and the count of distinct assigned users as a numeric label
3. WHEN an activity has zero assignments, THE Assignment_Indicator SHALL display a warning icon and the text "0" styled with a muted amber color distinguishable from the default text color
4. THE Assignment_Indicator SHALL differentiate assigned and unassigned states by using a different icon (people icon for assigned, warning icon for unassigned) and a different text color for each state
5. WHILE assignment data for an activity is loading, THE Assignment_Indicator SHALL display a non-interactive placeholder (such as a skeleton or dash) until the assignment count is resolved

### Requirement 2: Fetch Activity Assignments

**User Story:** As a manager, I want assignment data loaded for each activity, so that the Assigned column reflects the current state.

#### Acceptance Criteria

1. WHEN the Activities_Panel mounts or the visible activity list changes, THE Activities_Panel SHALL fetch assignments for each visible activity from the Assignment_API using query key pattern ["assignments", activityId]
2. WHILE assignment data is being fetched for an activity, THE Activities_Panel SHALL display the Assignment_Indicator in a loading state for that activity
3. WHEN the Assignment_API returns a successful response, THE Activities_Panel SHALL display the assignment count as the number of AssignmentResponse items in the returned array
4. IF the Assignment_API returns an error for an activity, THEN THE Activities_Panel SHALL display the Assignment_Indicator in a fallback state showing a dash or placeholder instead of a count, without preventing the rest of the Activities_Panel from rendering
5. IF the Assignment_API returns an empty array for an activity, THEN THE Activities_Panel SHALL display the Assignment_Indicator with a count of 0

### Requirement 3: Open Assignment Popover

**User Story:** As a manager, I want to click an activity's Assigned cell to open a checklist of members, so that I can manage assignments inline.

#### Acceptance Criteria

1. WHEN a manager clicks the Assignment_Indicator cell, THE Assignment_Popover SHALL open anchored to that cell
2. THE Assignment_Popover SHALL display a checklist of all account members fetched from the Members_API, sorted alphabetically by display name, showing each member's displayName if available or their email address as fallback
3. WHEN a member is currently assigned to the activity, THE Assignment_Popover SHALL display that member's checkbox as checked
4. WHEN a member is not assigned to the activity, THE Assignment_Popover SHALL display that member's checkbox as unchecked
5. WHEN the manager clicks outside the Assignment_Popover, THE Assignment_Popover SHALL close
6. WHERE the account has more than 10 members, THE Assignment_Popover SHALL display a text input at the top of the checklist that filters the visible member list in real time by matching the typed string against member display names and email addresses (case-insensitive, substring match)
7. IF the Members_API request fails while the Assignment_Popover is open, THEN THE Assignment_Popover SHALL display an inline error message indicating the member list could not be loaded

### Requirement 4: Assign a User to an Activity

**User Story:** As a manager, I want to check a member's checkbox to assign them to the activity, so that they can track time against it.

#### Acceptance Criteria

1. WHEN a manager checks an unchecked member checkbox, THE Assignment_Popover SHALL immediately toggle the checkbox to checked (optimistic update) and display a loading indicator on that checkbox row until the server responds
2. WHEN a manager checks an unchecked member checkbox, THE Assignment_Popover SHALL send a POST request to the Assignment_API with the selected userId
3. WHEN the POST request succeeds, THE Assignment_Indicator SHALL update the displayed count to reflect the previous count plus one
4. IF the POST request fails with a non-conflict error, THEN THE Assignment_Popover SHALL revert the checkbox to unchecked and display a toast error indication that auto-dismisses after 5 seconds
5. IF the POST request fails with a 409 Conflict (user already assigned), THEN THE Assignment_Popover SHALL keep the checkbox checked and not display an error indication

### Requirement 5: Unassign a User from an Activity

**User Story:** As a manager, I want to uncheck a member's checkbox to remove their assignment, so that they can no longer track time against the activity.

#### Acceptance Criteria

1. WHEN a manager unchecks a checked member checkbox, THE Assignment_Popover SHALL immediately toggle the checkbox to unchecked (optimistic update)
2. WHEN a manager unchecks a checked member checkbox, THE Assignment_Popover SHALL send a DELETE request to the Assignment_API for that userId
3. WHEN the DELETE request succeeds, THE Assignment_Indicator SHALL update the displayed count to reflect the new total
4. IF the DELETE request fails, THEN THE Assignment_Popover SHALL revert the checkbox to checked and display an error indication that auto-dismisses after 5 seconds
5. WHILE a DELETE request is in-flight for a member, THE Assignment_Popover SHALL disable that member's checkbox to prevent duplicate requests
6. IF a manager toggles the same member's checkbox again before the previous request completes, THEN THE Assignment_Popover SHALL ignore the subsequent toggle until the in-flight request resolves or fails

### Requirement 6: Role-Based Access Control

**User Story:** As a product owner, I want only managers and admins to see and use the assignment feature, so that regular users cannot modify assignments.

#### Acceptance Criteria

1. WHILE the current user has a "user" role, THE Activities_Panel SHALL not render the Assigned column or its cells in the DOM
2. WHILE the current user has a "manager" or "admin" role, THE Activities_Panel SHALL display the Assigned column with clickable cells that open the assignment popover for toggling user assignments
3. IF a user with "user" role calls POST /activities/{id}/assignments or DELETE /activities/{id}/assignments/{userId}, THEN THE Assignment_API SHALL reject the request with an authorization error and leave existing assignments unchanged
4. IF the current user's role has not yet been determined, THEN THE Activities_Panel SHALL not render the Assigned column until the role is confirmed as "manager" or "admin"

### Requirement 7: Query Cache Invalidation

**User Story:** As a manager, I want assignment changes to be reflected immediately without manual refresh, so that the UI stays consistent with server state.

#### Acceptance Criteria

1. WHEN an assignment is created successfully, THE Activities_Panel SHALL invalidate the assignments query cache for the affected activity
2. WHEN an assignment is deleted successfully, THE Activities_Panel SHALL invalidate the assignments query cache for the affected activity
3. WHEN a user toggles an assignment checkbox, THE Activities_Panel SHALL optimistically update the cached assignments list and assignment count for the affected activity within 100ms, before server confirmation
4. IF an assignment mutation fails, THEN THE Activities_Panel SHALL revert the optimistic cache update to the previous state and preserve the original assignment count
5. WHEN an assignment mutation settles (success or failure), THE Activities_Panel SHALL invalidate the ["assignments", activityId] query to reconcile optimistic state with server truth
