# Requirements Document

## Introduction

Phase 1 of the My Time Blocks web app — the core product. This phase delivers a tracker screen at "/" where users start/stop timers on activity blocks, and a separate entries page at "/entries" for manual time entry management. The tracker replaces the current empty dashboard and represents the primary user-facing feature of the app. Done when a solo user can live their whole day in the app.

## Glossary

- **Tracker**: The primary screen at "/" displaying activity blocks in a grid layout for starting and stopping timers.
- **Activity_Block**: A large, colorful card representing a single assigned activity, displaying tag badge, project name, activity name, and timer display.
- **Timer**: The mechanism that tracks elapsed time for an activity, derived as `now - startTime` from the server's EntryResponse.startTime.
- **Entry**: A completed or in-progress time record (EntryResponse) associated with an activity, containing start time, optional end time, notes, and denormalized names.
- **Tag_Badge**: A colored pill displayed on an Activity_Block, with color deterministically derived from the tag name via a hash function mapped to a fixed palette.
- **Entries_Page**: The "/entries" screen for viewing, creating, editing, and deleting time entries with notes.
- **API_Client**: The generated openapi-fetch client that communicates with the My-Time API.
- **Timer_Store**: A Zustand store holding the running timer's ticker state (current elapsed display) and the active entry reference.
- **Entry_Modal**: A modal dialog for creating or editing time entries with form fields for activity, start time, end time, and notes.

## Requirements

### Requirement 1: Activity Block Display

**User Story:** As a user, I want to see my assigned activities as large colorful blocks on the tracker screen, so that I can quickly identify and select the activity I want to track time for.

#### Acceptance Criteria

1. WHEN the Tracker loads, THE Tracker SHALL fetch projects via GET /projects (with includeArchived omitted or set to false), fetch tags via GET /tags, and for each non-archived project fetch activities via GET /projects/{id}/activities, then display each activity as an Activity_Block in a grid layout.
2. THE Activity_Block SHALL display a Tag_Badge (colored pill showing the tag name resolved by matching the activity's tagId to the tags list), the project name (small text, maximum 100 characters truncated with ellipsis), the activity name (prominent text, maximum 100 characters truncated with ellipsis), and a timer display showing "00:00:00" when idle.
3. SINCE the API does not yet expose a color field on activities, THE Tag_Badge SHALL assign a color from the defined palette (blue, green, red, yellow, orange, teal, purple, lavender) based on the activity's index position in the list, cycling through the 8 colors. In the future, users will set colors per-activity via the API.
4. THE Tracker SHALL support two layout modes: a grid view (large cards in a responsive column grid) and a list view (compact single-row items), toggled by a view switcher control that persists the user's selection for the session.
5. IF the GET /projects or GET /projects/{id}/activities request fails, THEN THE Tracker SHALL display an error message indicating the data could not be loaded and provide a retry action.
6. IF the user has no activities assigned across all non-archived projects, THEN THE Tracker SHALL display an empty state message indicating no activities are available.

### Requirement 2: Timer Start

**User Story:** As a user, I want to click an idle activity block to start its timer, so that I can begin tracking time with a single tap.

#### Acceptance Criteria

1. WHEN the user clicks an idle Activity_Block, THE Activity_Block SHALL display a loading state with click disabled, and THE API_Client SHALL send POST /timer/start with the activity's activityId.
2. WHEN POST /timer/start returns HTTP 201 with an EntryResponse, THE Timer_Store SHALL store the entry's startTime and activityId, and THE Activity_Block SHALL transition to a running state displaying elapsed time updated every 1 second (derived from now minus startTime).
3. IF POST /timer/start returns HTTP 409 (timer already running), THEN THE API_Client SHALL fetch GET /timer/current and THE Tracker SHALL display the already-running timer's state on the correct Activity_Block without showing an error toast.
4. WHILE a timer is running on one Activity_Block, THE Tracker SHALL display all other Activity_Blocks as idle (only one timer runs at a time).
5. IF POST /timer/start returns a network error or an HTTP error other than 201 or 409, THEN THE Activity_Block SHALL revert to idle state and THE Tracker SHALL display an error message indicating the timer failed to start.

### Requirement 3: Timer Stop

**User Story:** As a user, I want to click the running activity block to stop its timer, so that I can complete a time entry with a single tap.

#### Acceptance Criteria

1. WHEN the user clicks the running Activity_Block, THE API_Client SHALL send POST /timer/stop and THE Activity_Block SHALL disable further click events until the response is received.
2. WHEN POST /timer/stop returns a completed EntryResponse, THE Timer_Store SHALL clear the running timer state, THE Activity_Block SHALL transition to idle displaying "00:00:00", and THE Tracker SHALL invalidate the entries query cache so the entry list reflects the new completed entry.
3. IF POST /timer/stop returns an error response (404 no running timer, network failure, or other non-200 status), THEN THE Timer_Store SHALL re-fetch the current timer state via GET /timer/current to reconcile local state with the server, and THE Activity_Block SHALL re-enable click events.

### Requirement 4: Timer Elapsed Display

**User Story:** As a user, I want to see accurate elapsed time on the running block that survives page refresh and tab sleep, so that I can trust the displayed duration.

#### Acceptance Criteria

1. WHILE a timer is running, THE Tracker SHALL display elapsed time formatted as HH:MM:SS computed as `Date.now() - Date.parse(startTime)` derived from the server-provided startTime, updating the display every 1000ms via a setInterval in the Timer_Store.
2. THE Tracker SHALL NOT accumulate elapsed time via client-side ticks; elapsed time SHALL always be recomputed from `Date.now() - Date.parse(startTime)` on each interval tick.
3. WHEN the app loads or the page is refreshed, THE API_Client SHALL fetch GET /timer/current and THE Tracker SHALL rehydrate the running timer state from the response, displaying the computed elapsed time within the first 1000ms tick after the response is received.
4. IF GET /timer/current returns null, THEN THE Tracker SHALL display no running timer and the Timer_Store SHALL clear any previously held startTime.
5. WHEN the document visibility changes from hidden to visible (tab wake), THE Tracker SHALL recompute elapsed time from `Date.now() - Date.parse(startTime)` on the next interval tick, requiring no additional network request because the computation is always derived.
6. IF GET /timer/current fails due to a network error, THEN THE Tracker SHALL retain the previously displayed timer state and retry the fetch on the next page visibility change from hidden to visible.

### Requirement 5: Incomplete/Completed Filter

**User Story:** As a user, I want to filter activity blocks by completion status, so that I can focus on activities I haven't tracked today or review ones I have.

#### Acceptance Criteria

1. THE Tracker SHALL provide a toggle between "Incomplete" and "Completed" filter states, where exactly one state is active at any time.
2. WHEN "Incomplete" is selected, THE Tracker SHALL display only Activity_Blocks for activities that have no entries today with a non-null endTime (fetched via GET /entries with today's date range), including activities whose only entry today is the currently running timer (endTime is null).
3. WHEN "Completed" is selected, THE Tracker SHALL display only Activity_Blocks for activities that have at least one entry today with a non-null endTime and no entry today with a null endTime.
4. WHEN the Tracker view is loaded, THE Tracker SHALL set the filter to "Incomplete" by default.
5. WHEN a running timer is stopped, THE Tracker SHALL re-evaluate the filter and move the activity's Activity_Block from "Incomplete" to "Completed" if no remaining entry for that activity today has a null endTime.

### Requirement 6: Manual Entry Creation

**User Story:** As a user, I want to manually create time entries on the entries page, so that I can log time I forgot to track or add historical entries.

#### Acceptance Criteria

1. WHEN the user clicks the "Add Entry" button on the Entries_Page, THE Entries_Page SHALL display an Entry_Modal with fields for activity selection (activities grouped by project), start time (datetime-local input), end time (datetime-local input), and notes (optional, max 5000 characters).
2. WHEN the user submits a valid entry form, THE API_Client SHALL send POST /entries with activityId, startTime (ISO 8601), endTime (ISO 8601), and optional notes, and THE Entries_Page SHALL close the Entry_Modal and add the new entry to the list by invalidating the entries query cache.
3. IF the user submits an entry form with invalid data (missing activityId, missing startTime, missing endTime, endTime before or equal to startTime, or notes exceeding 5000 characters), THEN THE Entry_Modal SHALL display inline validation errors adjacent to the invalid fields without submitting to the API.
4. IF the API returns an error response (400, 409, or network failure) after form submission, THEN THE Entry_Modal SHALL remain open and display an error message indicating the failure reason returned by the server.
5. WHEN the user dismisses the Entry_Modal without submitting (clicking cancel or closing), THE Entry_Modal SHALL close without sending any API request and without modifying the entries list.

### Requirement 7: Entry List Display

**User Story:** As a user, I want to see my time entries for today or this week on the entries page, so that I can review my tracked time.

#### Acceptance Criteria

1. WHEN the Entries_Page loads, THE API_Client SHALL fetch GET /entries with query params `from` set to the start of today (midnight local time, ISO 8601) and `to` set to the end of today (23:59:59 local time, ISO 8601), and THE Entries_Page SHALL display entries sorted by startTime descending (most recent first) in a list where each row shows activityName, projectName, startTime, endTime, duration, and a notes indicator (visible icon when the entry's `notes` field is non-null and non-empty, hidden otherwise).
2. THE Entries_Page SHALL use denormalized projectName and activityName from EntryResponse without performing client-side joins.
3. WHEN the user selects the "This Week" toggle, THE API_Client SHALL fetch GET /entries with `from` set to the start of Monday (midnight local time, ISO 8601) of the current week and `to` set to the end of Sunday (23:59:59 local time, ISO 8601), and THE Entries_Page SHALL replace the list with the returned entries sorted by startTime descending.
4. IF the API returns an empty array for the selected date range, THEN THE Entries_Page SHALL display an empty state message indicating no entries exist for the selected period (Today or This Week).
5. WHILE an entry has a null endTime (running timer), THE Entries_Page SHALL display its duration as the elapsed time computed from now minus startTime, updating every 1 second, instead of using durationSeconds.

### Requirement 8: Entry Edit

**User Story:** As a user, I want to edit existing time entries, so that I can correct mistakes in start time, end time, activity, or notes.

#### Acceptance Criteria

1. WHEN the user activates the edit action on an entry row, THE Entries_Page SHALL display an Entry_Modal pre-populated with the entry's current startTime, endTime, activityId, and notes.
2. WHEN the user submits the edit form with changed fields that pass client-side validation, THE API_Client SHALL send PUT /entries/{id} containing only the changed fields, and upon a 200 response THE Entries_Page SHALL update the entry in the list and invalidate the entries query cache.
3. IF the user submits the edit form where startTime is not a valid ISO 8601 string, or endTime is not after startTime, or notes exceeds 5000 characters, or activityId is not a valid UUID, THEN THE Entry_Modal SHALL display inline validation errors next to the invalid fields and SHALL NOT submit the request to the API.
4. IF the PUT /entries/{id} request returns a 404 or 409 error, THEN THE Entry_Modal SHALL display an error message indicating the failure reason and SHALL preserve the user's entered data in the form.

### Requirement 9: Entry Delete

**User Story:** As a user, I want to delete time entries, so that I can remove incorrect or duplicate entries.

#### Acceptance Criteria

1. WHEN the user initiates deletion of an entry, THE Entries_Page SHALL display a confirmation dialog that identifies the entry by its activity name and start date/time.
2. WHEN the user confirms deletion in the confirmation dialog, THE API_Client SHALL send DELETE /entries/{id} and THE Entries_Page SHALL remove the entry from the displayed list and invalidate the entries query cache.
3. WHEN the user dismisses or cancels the confirmation dialog, THE Entries_Page SHALL close the dialog and leave the entry unchanged.
4. IF the DELETE /entries/{id} request returns an error response, THEN THE Entries_Page SHALL display an error message indicating the deletion failed and SHALL leave the entry in the list.

### Requirement 10: Entry Notes

**User Story:** As a user, I want to view and add notes on my time entries, so that I can record context about what I worked on.

#### Acceptance Criteria

1. WHEN an entry has one or more associated notes, THE Entries_Page SHALL display a notes indicator on the entry row showing the note count, and THE entry detail (expandable row or edit modal) SHALL show all associated notes in chronological order (oldest first).
2. WHEN the user submits the add-note form, THE API_Client SHALL send POST /entries/{id}/notes with the note content (1–5000 characters), and THE Entries_Page SHALL append the new note to the displayed list upon a 201 response.
3. WHEN the user views notes for an entry, THE API_Client SHALL fetch GET /entries/{id}/notes and THE Entries_Page SHALL display all returned notes in chronological order (oldest first).
4. IF the note content is empty or exceeds 5000 characters, THEN THE Entries_Page SHALL disable the submit button and display a validation message indicating the allowed length (1–5000 characters).
5. IF the POST /entries/{id}/notes request fails, THEN THE Entries_Page SHALL display an error message indicating the note was not saved, and SHALL preserve the user's input in the form field.
