# Requirements Document

## Introduction

A single `/reports` page providing role-filtered reporting tabs for time tracking data. Three report types cover personal time summaries, project budget consumption, and financial metrics. All reports use table-based display with Tailwind CSS progress bars — no charting library dependencies. Data is fetched from three aggregation API endpoints and displayed within selectable date period presets.

## Glossary

- **Reports_Page**: The `/reports` route containing period selection, role-filtered tabs, and active report panel
- **Personal_Time_Panel**: Report panel showing the authenticated user's time entries grouped by tag or activity
- **Project_Budget_Panel**: Report panel showing budget versus consumed hours for projects, broken down by tag
- **Financial_Panel**: Report panel showing budget, consumed hours, billable revenue, cost, and margin per project and tag
- **Period_Selector**: UI control offering preset date range pills (This Week, This Month, Last Month)
- **Progress_Bar**: A Tailwind CSS width-percentage bar displaying consumption relative to budget
- **Role_Hierarchy**: Permission model where user (0) < manager (1) < admin (2), with higher roles inheriting lower permissions
- **Group_By_Toggle**: UI control to switch personal time report grouping between "By Tag" and "By Activity"

## Requirements

### Requirement 1: Reports Page Navigation and Layout

**User Story:** As a user, I want a single reports page with period selection and role-filtered tabs, so that I can access the reports relevant to my role within a chosen time period.

#### Acceptance Criteria

1. WHEN a user navigates to `/reports`, THE Reports_Page SHALL display the Period_Selector with three preset pills: "This Week", "This Month", and "Last Month"
2. WHEN the Reports_Page loads initially, THE Reports_Page SHALL set the Period_Selector to "This Week" and activate the first tab visible to the user's role
3. WHEN the user selects a period pill, THE Reports_Page SHALL compute the `from` and `to` ISO 8601 date strings in local time using Monday as the week start day, where `from` is the start of the period at 00:00:00 and `to` is the end of the period at 23:59:59, and pass them to the active report panel while preserving the currently selected tab
4. THE Reports_Page SHALL display a tab bar containing only the tabs permitted by the authenticated user's role in the active account
5. WHEN the user's role is "user", THE Reports_Page SHALL display only the "My Time" tab
6. WHEN the user's role is "manager", THE Reports_Page SHALL display the "My Time" and "Project Budget" tabs
7. WHEN the user's role is "admin", THE Reports_Page SHALL display the "My Time", "Project Budget", and "Financial" tabs
8. WHEN a tab is selected, THE Reports_Page SHALL render the corresponding report panel with the current period's `from` and `to` values

### Requirement 2: Period Preset Computation

**User Story:** As a user, I want period presets to compute correct date ranges, so that I see accurate data for standard time periods.

#### Acceptance Criteria

1. WHEN "This Week" is selected, THE Period_Selector SHALL compute `from` as Monday 00:00:00.000 of the current week in local time and `to` as Sunday 23:59:59.999 of the current week in local time, and output both values as ISO 8601 UTC strings via toISOString()
2. WHEN "This Month" is selected, THE Period_Selector SHALL compute `from` as the 1st of the current month at 00:00:00.000 in local time and `to` as the last calendar day of the current month at 23:59:59.999 in local time, and output both values as ISO 8601 UTC strings via toISOString()
3. WHEN "Last Month" is selected, THE Period_Selector SHALL compute `from` as the 1st of the previous month at 00:00:00.000 in local time and `to` as the last calendar day of the previous month at 23:59:59.999 in local time, and output both values as ISO 8601 UTC strings via toISOString()
4. THE Period_Selector SHALL use the client system clock at the moment of selection as the reference date for all "current" and "previous" period computations

### Requirement 3: Personal Time Report

**User Story:** As a user, I want to see my time entries grouped by tag or activity for a selected period, so that I can understand how I spent my time.

#### Acceptance Criteria

1. THE Personal_Time_Panel SHALL display a Group_By_Toggle with options "By Tag" and "By Activity", defaulting to "By Tag"
2. WHEN the Personal_Time_Panel mounts or the Group_By_Toggle value changes or the period selection changes, THE Personal_Time_Panel SHALL fetch data from `GET /reports/personal-time` with the current `groupBy` value and current period's `from` and `to` parameters
3. THE Personal_Time_Panel SHALL display the `totalHours` value formatted to one decimal place with an "h" suffix as a summary above the table
4. THE Personal_Time_Panel SHALL display a table with columns: Name, Hours (formatted to one decimal place), Entry Count, and a Progress_Bar
5. IF `groupBy` is "tag" and a group has a `color` value, THEN THE Personal_Time_Panel SHALL display the tag color as a colored dot next to the group name
6. IF `totalHours` is greater than 0, THEN THE Personal_Time_Panel SHALL calculate the Progress_Bar width percentage for each group as `(group.hours / totalHours) * 100`, capped at 100; IF `totalHours` is 0, THEN THE Personal_Time_Panel SHALL display Progress_Bar at 0% width
7. IF the API returns an empty `groups` array, THEN THE Personal_Time_Panel SHALL display an empty state message indicating no time entries exist for the selected period
8. IF the API request fails, THEN THE Personal_Time_Panel SHALL display an error message indicating the data could not be loaded

### Requirement 4: Project Budget Report

**User Story:** As a manager, I want to see budget versus consumed hours for a project broken down by tag, so that I can monitor project resource utilization.

#### Acceptance Criteria

1. IF the user's role is lower than "manager", THEN THE Reports_Page SHALL hide the "Project Budget" tab from the navigation
2. THE Project_Budget_Panel SHALL display a project selector dropdown populated from the projects array in the API response
3. WHEN no project is selected, THE Project_Budget_Panel SHALL fetch data from `GET /reports/project-budget` without a `projectId` parameter, returning all projects with activity in the period
4. WHEN a project is selected from the dropdown, THE Project_Budget_Panel SHALL fetch data from `GET /reports/project-budget` with the selected `projectId` parameter
5. THE Project_Budget_Panel SHALL display a table with columns: Tag (with color dot), Budget Hours, Consumed Hours, and Progress_Bar
6. THE Project_Budget_Panel SHALL calculate the Progress_Bar percentage as `Math.min((consumedHours / budgetHours) * 100, 100)` when `budgetHours` is a number greater than zero
7. WHEN `budgetHours` is null or zero for a tag, THE Project_Budget_Panel SHALL display the Progress_Bar at 0% width and show only the consumed hours value
8. WHEN `consumedHours` exceeds `budgetHours` for a tag, THE Project_Budget_Panel SHALL display the Progress_Bar in red color at 100% width and show the text formatted as "consumed / budget hrs" with values rounded to one decimal place
9. IF the API returns an empty `projects` array, THEN THE Project_Budget_Panel SHALL display an empty state message indicating no project data exists for the selected period
10. THE Project_Budget_Panel SHALL send the currently selected date-range `from` and `to` parameters (ISO 8601 format) with every request to `GET /reports/project-budget`
11. IF the API request to `GET /reports/project-budget` fails, THEN THE Project_Budget_Panel SHALL display an error message indicating the data could not be loaded and allow the user to retry the request

### Requirement 5: Financial Report

**User Story:** As an admin, I want to see billable revenue, cost, and margin alongside budget consumption, so that I can assess project financial health.

#### Acceptance Criteria

1. IF the user's role is lower than "admin", THEN THE Reports_Page SHALL hide the "Financial" tab so that it is not visible or navigable
2. THE Financial_Panel SHALL display a project selector dropdown populated from the projects in the response
3. WHEN no project is selected, THE Financial_Panel SHALL fetch data from `GET /reports/financial` without a `projectId` parameter, using the current report period `from` and `to` dates, returning all projects with activity in the period
4. WHEN a project is selected from the dropdown, THE Financial_Panel SHALL fetch data from `GET /reports/financial` with the selected `projectId` parameter and the current report period `from` and `to` dates
5. THE Financial_Panel SHALL display the `currency` value from the response as a prefix symbol for all monetary values, and SHALL format monetary values to exactly 2 decimal places
6. THE Financial_Panel SHALL display one row per tag (nested under each project), with columns: Tag (with color dot using `tagColor`), Budget Hours, Consumed Hours, Billable, Cost, Margin, and Progress_Bar
7. THE Financial_Panel SHALL calculate the Progress_Bar percentage as `Math.min((consumedHours / budgetHours) * 100, 100)` when `budgetHours` is defined
8. WHEN `budgetHours` is null for a tag, THE Financial_Panel SHALL display the Progress_Bar at 0% width
9. WHEN `consumedHours` exceeds `budgetHours`, THE Financial_Panel SHALL display the Progress_Bar in red color and show the consumed and budget values in "X.X / Y.Y hrs" format indicating over-budget status
10. IF the API returns an empty `projects` array, THEN THE Financial_Panel SHALL display an empty state message indicating no financial data exists for the selected period
11. IF the API request fails due to a network error or non-success status code, THEN THE Financial_Panel SHALL display an error message indicating the data could not be loaded and SHALL allow the user to retry the request
12. WHEN multiple projects are returned, THE Financial_Panel SHALL display a summary row per project showing the project name, the project-level `budgetHours`, `consumedHours`, `billableTotal`, `costTotal`, and `margin` values, with tag rows grouped beneath each project

### Requirement 6: Data Fetching and Loading States

**User Story:** As a user, I want clear feedback while reports are loading or when errors occur, so that I understand the current state of the application.

#### Acceptance Criteria

1. WHILE report data is being fetched for the first time for a given query key, THE Reports_Page SHALL display a loading indicator within the active panel area in place of panel content
2. IF the API returns a 403 status code, THEN THE Reports_Page SHALL not display an error to the user and SHALL hide the corresponding tab (server-side role enforcement aligns with client-side filtering)
3. IF the API returns an error other than 403, THEN THE Reports_Page SHALL display an error message within the active panel area indicating the operation failed, and SHALL provide a retry action that re-fetches the failed request
4. WHEN the user changes the selected period or tab, THE Reports_Page SHALL cancel any in-flight requests for the previous selection and initiate new requests for the updated selection
5. WHEN report data is being re-fetched after a period or tab change where previous data exists, THE Reports_Page SHALL continue displaying the previous data until the new data loads (no flash of empty state)
6. IF the API returns a successful response with zero data groups (empty result set), THEN THE Reports_Page SHALL display an empty-state message within the active panel area indicating no data exists for the selected period

### Requirement 7: Progress Bar Display

**User Story:** As a user, I want visual progress bars showing consumption against budgets, so that I can quickly assess utilization levels.

#### Acceptance Criteria

1. THE Progress_Bar SHALL render as a container element with a filled inner element whose inline `width` style is set to `min(percentage, 100)%`, where percentage equals `(consumptionHours / budgetHours) × 100`, rounded to the nearest integer
2. WHEN a tag has a `color` value defined, THE Progress_Bar SHALL use that hex color as the bar fill background color
3. WHEN no tag color is defined, THE Progress_Bar SHALL use the application's primary CSS variable (`--primary`) as the bar fill background color
4. WHEN the consumption percentage exceeds 90% but is at or below 100%, THE Progress_Bar SHALL display the bar fill in the destructive CSS variable color (`--destructive`) instead of the tag or primary color
5. WHEN consumption exceeds the budget (percentage > 100%), THE Progress_Bar SHALL display at 100% width in the destructive CSS variable color and render text in the format "{consumed} / {budget} hrs" where both values are shown to one decimal place
6. THE Progress_Bar SHALL include `role="progressbar"`, `aria-valuenow` set to the current consumption hours, `aria-valuemin` set to 0, and `aria-valuemax` set to the budget hours, so that screen readers convey utilization level
7. WHEN consumption is 0%, THE Progress_Bar SHALL render the container with no visible fill (0% width) while still displaying the empty track at its full width
