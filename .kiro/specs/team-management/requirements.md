# Requirements Document

## Introduction

Team management screen at `/team` enabling account administrators to list, invite, edit, and remove team members. Provides role-based access control so only authorized roles can view or modify team data. Targets small teams (≤5 members) with no pagination needed for the beta release.

## Glossary

- **Team_Page**: The page rendered at `/team` displaying the team members list and management controls.
- **Members_List**: The DataTable component displaying all account members with their details and inline actions.
- **Invite_Dialog**: A modal dialog for inviting a new member by email and role.
- **Edit_Dialog**: A modal dialog for editing a member's role, cost rate, utilization target, and weekly capacity.
- **Remove_Dialog**: A confirmation dialog shown before removing a member from the account.
- **Role_Guard**: A route-level access control component that restricts page access based on the current user's role.
- **Nav_Filter**: Logic that conditionally shows or hides the Team navigation item based on the current user's role.
- **Current_User**: The authenticated user viewing the Team page, identified via their profile.
- **Member**: A user belonging to the account, represented by a `MemberResponse` from the API.
- **Allowed_Roles**: The set of roles permitted to access the Team page: admin, manager.
- **Admin_Roles**: The set of roles permitted to perform write actions (invite, edit, remove): admin only.

## Requirements

### Requirement 1: View Team Members List

**User Story:** As an admin or manager, I want to see all team members in a searchable list, so that I can review who is on the team and their details.

#### Acceptance Criteria

1. WHEN the Current_User navigates to `/team`, THE Team_Page SHALL display a Members_List containing all account members returned by `GET /account/members`.
2. THE Members_List SHALL display each Member's display name (or email as fallback when `displayName` is null), email, role, and status (active or pending).
3. WHEN a Member has a null `joinedAt` value, THE Members_List SHALL display a "Pending" badge for that Member.
4. WHEN the Current_User's profile ID matches a Member's ID, THE Members_List SHALL display a "You" badge next to that Member's name.
5. WHEN the Current_User types into the search field, THE Members_List SHALL filter members by display name or email containing the search text (case-insensitive), updating results on each keystroke.
6. IF the `GET /account/members` request is in progress, THEN THE Team_Page SHALL display a loading indicator in place of the Members_List.
7. IF the `GET /account/members` request fails, THEN THE Team_Page SHALL display an error message indicating the members could not be loaded.
8. IF no members match the current search text, THEN THE Members_List SHALL display an empty-state message indicating no members were found.
9. WHILE the Current_User has the "admin" role, THE Members_List SHALL display financial fields (costRate, utilizationTarget, weeklyCapacityHours) for each Member. WHILE the Current_User has the "manager" role, THE Members_List SHALL NOT display financial fields.

### Requirement 2: Invite New Member

**User Story:** As an admin, I want to invite a new team member by email with an assigned role, so that they can join the account.

#### Acceptance Criteria

1. WHILE the Current_User has the "admin" role, THE Team_Page SHALL display an "Invite" button in the toolbar.
2. WHEN the Current_User clicks the "Invite" button, THE Team_Page SHALL open the Invite_Dialog containing an email text input and a role dropdown with the options "admin", "manager", and "user" (default selected: "user").
3. WHEN the Current_User submits the Invite_Dialog with an email that is a valid RFC 5322 address (maximum 254 characters) and a selected role, THE Invite_Dialog SHALL send a `POST /account/members` request with the provided email and role.
4. IF the Current_User submits the Invite_Dialog with an empty email field or an email that does not match RFC 5322 format, THEN THE Invite_Dialog SHALL display an inline validation error on the email field and SHALL NOT send the request.
5. WHEN the invite request succeeds, THE Invite_Dialog SHALL close and THE Members_List SHALL refresh to include the newly invited Member.
6. IF the invite request returns a 409 Conflict, THEN THE Invite_Dialog SHALL display an error message indicating the email is already a member.
7. IF the invite request returns a 422 Validation Error, THEN THE Invite_Dialog SHALL display the validation error message.
8. IF the invite request fails due to a network error or an unexpected server error (status 5xx), THEN THE Invite_Dialog SHALL display an error message indicating the invite could not be sent and SHALL retain the entered form data.

### Requirement 3: Edit Member Details

**User Story:** As an admin, I want to edit a member's role, cost rate, utilization target, and weekly capacity, so that I can keep team settings accurate.

#### Acceptance Criteria

1. WHILE the Current_User has the "admin" role, THE Members_List SHALL display an edit action for each Member row.
2. WHEN the Current_User clicks the edit action on a Member row, THE Team_Page SHALL open the Edit_Dialog pre-populated with that Member's current role, costRate, utilizationTarget, and weeklyCapacityHours.
3. WHEN the Current_User submits the Edit_Dialog, THE Edit_Dialog SHALL validate that costRate is a number between 0 and 999,999.99, utilizationTarget is a number between 0 and 100, weeklyCapacityHours is a number between 0 and 168, and role is one of the allowed role values, and SHALL send a `PUT /account/members/{userId}` request only when all fields pass validation.
4. IF the Edit_Dialog validation fails, THEN THE Edit_Dialog SHALL display an error message adjacent to each invalid field indicating the accepted range.
5. WHEN the update request succeeds, THE Edit_Dialog SHALL close and THE Members_List SHALL refresh to reflect the updated values.
6. IF the update request fails with 403 Forbidden, THEN THE Edit_Dialog SHALL display an error message indicating insufficient permissions.
7. IF the update request returns a 409 Conflict (last admin constraint), THEN THE Edit_Dialog SHALL display an error message indicating the last admin cannot be demoted.
8. IF the update request fails with 400 or 422, THEN THE Edit_Dialog SHALL display an error message indicating the submitted data is invalid.
9. IF the update request fails due to a network error or an unexpected status code, THEN THE Edit_Dialog SHALL display a generic error message indicating the update could not be completed and SHALL preserve the user's entered values.

### Requirement 4: Remove Member

**User Story:** As an admin, I want to remove a team member from the account, so that they no longer have access.

#### Acceptance Criteria

1. WHILE the Current_User has the "admin" role, THE Members_List SHALL display a remove action for each Member row except the Current_User's own row.
2. WHEN the Current_User clicks the remove action on a Member row, THE Team_Page SHALL open the Remove_Dialog displaying the Member's name and email.
3. WHEN the Current_User confirms removal in the Remove_Dialog, THE Remove_Dialog SHALL disable the confirm and cancel buttons and send a `DELETE /account/members/{userId}` request.
4. WHEN the removal request succeeds, THE Remove_Dialog SHALL close and THE Members_List SHALL re-fetch the member list so the removed Member no longer appears.
5. IF the removal request returns a 409 Conflict (last admin constraint), THEN THE Remove_Dialog SHALL re-enable buttons, remain open, and display an error message indicating the last admin cannot be removed.
6. IF the removal request fails for any other reason, THEN THE Remove_Dialog SHALL re-enable the confirm and cancel buttons, remain open, and display an error message indicating the member could not be removed.

### Requirement 5: Role-Based Access Control

**User Story:** As a system administrator, I want unauthorized users to be blocked from accessing the Team page, so that sensitive team data is protected.

#### Acceptance Criteria

1. WHILE the Current_User's role is "user", THE Role_Guard SHALL redirect the Current_User to `/` before rendering the Team_Page. THE Role_Guard SHALL not render Team_Page content while the role is still loading (fail-closed during indeterminate state).
2. WHILE the Current_User's role is "user", THE Nav_Filter SHALL hide the "Team" navigation item from the navigation bar.
3. WHILE the Current_User has the "manager" role, THE Team_Page SHALL hide the Invite button, edit actions, and remove actions (view-only mode).
4. IF a user with the "user" role enters `/team` directly via URL, THEN THE Role_Guard SHALL redirect that user to `/`.
5. IF the Current_User's role cannot be determined (profile fetch fails or is loading), THEN THE Role_Guard SHALL not render Team_Page content until the role is confirmed.

### Requirement 6: Edit Dialog Validation

**User Story:** As an admin, I want the edit form to validate my input before submission, so that I avoid sending invalid data to the API.

#### Acceptance Criteria

1. THE Edit_Dialog SHALL validate that costRate, when provided, is a number greater than or equal to 0 and less than or equal to 999999.99, with at most 2 decimal places.
2. THE Edit_Dialog SHALL validate that utilizationTarget, when provided, is an integer between 0 and 100 inclusive.
3. THE Edit_Dialog SHALL validate that weeklyCapacityHours, when provided, is a number greater than or equal to 0 and less than or equal to 168, with at most 2 decimal places.
4. THE Edit_Dialog SHALL validate that role is one of "admin", "manager", or "user" and is always required (non-empty).
5. IF any validation fails, THEN THE Edit_Dialog SHALL display an inline error message adjacent to each invalid field, disable the submit button, and preserve all field values the user has entered.
6. IF all optional numeric fields are left empty, THEN THE Edit_Dialog SHALL treat them as null and allow form submission without validation errors on those fields.

### Requirement 7: Invite Dialog Validation

**User Story:** As an admin, I want the invite form to validate email format before submission, so that only properly formatted invitations are sent.

#### Acceptance Criteria

1. WHEN the user attempts to submit the invite form, THE Invite_Dialog SHALL validate that the email field contains a valid email address (standard user@domain format, maximum 254 characters).
2. WHEN the user attempts to submit the invite form, THE Invite_Dialog SHALL validate that a role has been selected from the role dropdown.
3. IF validation fails on submit, THEN THE Invite_Dialog SHALL display an inline error message adjacent to each invalid field and prevent form submission.
4. WHEN the user corrects a field that previously failed validation, THE Invite_Dialog SHALL remove the inline error message for that field.
