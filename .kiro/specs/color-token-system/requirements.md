# Requirements Document

## Introduction

The backend API has migrated from raw hex color values to a color token system. Tags and activity color overrides now store token names (e.g., "blue", "teal") instead of hex strings. A new unauthenticated `GET /palette` endpoint provides the token-to-hex mapping. The frontend must be updated to fetch this palette, use token names in all write operations, resolve tokens to hex for rendering, and present a 7-swatch color picker for tag creation/editing.

## Glossary

- **Color_Token**: A string identifier from the allowed set (blue, green, red, yellow, orange, teal, purple) representing a color. Defined by the `ColorToken` enum in the API schema.
- **Palette**: A mapping of Color_Token names to hex shade variants (dark, normal, light). Retrieved from `GET /palette` and cached in-memory.
- **Palette_Store**: The frontend module responsible for fetching, caching, and exposing the Palette data to the application.
- **Color_Picker**: The UI component displaying 7 color swatches that allows users to select a Color_Token when creating or editing a tag.
- **Color_Resolver**: The logic that determines which hex value to render for a given activity or tag, by looking up the resolved Color_Token in the cached Palette.
- **Grey_Default**: The reserved "grey" color used as a fallback when no Color_Token is assigned. Grey is not user-selectable.
- **Activity_Color_Override**: A per-user, per-activity Color_Token preference stored in user settings that takes priority over the tag color.
- **Shade**: A variant of a color (dark, normal, light) used for different visual contexts.

## Requirements

### Requirement 1: Palette Fetching and Caching

**User Story:** As a user, I want the application to load the color palette on startup, so that color tokens can be resolved to hex values for rendering throughout the app.

#### Acceptance Criteria

1. WHEN the application initializes, THE Palette_Store SHALL fetch the Palette from `GET /palette` without authentication credentials.
2. THE Palette_Store SHALL cache the Palette response in memory for the duration of the application session (until page unload or full-page refresh).
3. THE Palette_Store SHALL make the cached Palette available to all components that need to resolve Color_Token values to hex strings.
4. IF the `GET /palette` request fails (network error, non-200 response, or no response within 10 seconds), THEN THE Palette_Store SHALL retry the request once after a 2-second delay.
5. IF the `GET /palette` request fails after retry, THEN THE Palette_Store SHALL display a full-screen error state with a message indicating the application cannot load color data, and SHALL provide a manual retry action that re-triggers the fetch sequence from criterion 1.
6. WHILE the Palette fetch is in progress (before success or final failure), THE Palette_Store SHALL expose a loading state so that dependent components can defer rendering until the Palette is available.

### Requirement 2: Tag Color Picker

**User Story:** As a user, I want to select a color from 7 predefined swatches when creating or editing a tag, so that my tags are visually distinguishable.

#### Acceptance Criteria

1. WHEN a user creates or edits a tag, THE Color_Picker SHALL display exactly 7 swatches corresponding to the allowed Color_Token values: blue, green, red, yellow, orange, teal, purple.
2. THE Color_Picker SHALL render each swatch as a filled circle using the "normal" Shade hex value from the cached Palette; IF the Palette is not yet cached, THEN THE Color_Picker SHALL disable swatch interaction until the Palette becomes available.
3. WHEN a user selects a swatch, THE Color_Picker SHALL visually indicate the selected Color_Token by rendering a visible border or checkmark overlay on the selected swatch that is distinguishable from unselected swatches without relying on color alone.
4. THE Color_Picker SHALL require the user to select exactly one Color_Token before the tag form can be submitted.
5. THE Color_Picker SHALL NOT include grey as a selectable option.
6. WHEN the user opens the Color_Picker to edit an existing tag that has a non-null color value, THE Color_Picker SHALL pre-select the swatch corresponding to that tag's current Color_Token.
7. WHEN the tag form is submitted, THE Color_Picker SHALL emit the selected Color_Token name as a lowercase string (e.g., "blue", "teal") rather than a hex value.

### Requirement 3: Tag Create/Update with Token Names

**User Story:** As a user, I want my tag color selections to be sent as token names to the API, so that color data is stored consistently.

#### Acceptance Criteria

1. WHEN a user submits a tag creation form, THE application SHALL include the selected Color_Token name as the `color` field in the `POST /tags` request body.
2. WHEN a user submits a tag edit form, THE application SHALL include the selected Color_Token name as the `color` field in the `PUT /tags/{id}` request body.
3. THE application SHALL send Color_Token names as plain lowercase strings from the set (blue, green, red, yellow, orange, teal, purple) and SHALL NOT send hex values in tag create or update requests.
4. IF the API responds with a 400 error of type "invalid_color", THEN THE application SHALL display a validation error message near the color field, and SHALL preserve the form data so the user can correct and retry.

### Requirement 4: Activity Color Override with Token Names

**User Story:** As a user, I want my activity color override preferences to use token names, so that overrides are consistent with the token system.

#### Acceptance Criteria

1. WHEN a user sets a color override for an activity, THE application SHALL send a `PATCH /settings/activity-colors` request with body `{ "colors": { "<activityId>": "<ColorToken>" } }` where the value is one of the 7 allowed ColorToken names (blue, green, orange, purple, red, teal, yellow).
2. THE application SHALL send ColorToken values as plain strings (e.g., "blue") in the `colors` object of activity color override requests and SHALL NOT send hex values, RGB values, or any format other than the token name.
3. IF the API responds with a 400 status and error type "invalid_color" for an activity color override request, THEN THE application SHALL display a validation error message indicating the submitted color is not allowed, and SHALL NOT update the local activity color state.
4. WHEN the API responds with a 200 status to a `PATCH /settings/activity-colors` request, THEN THE application SHALL update the local activity color state to reflect the new override.

### Requirement 5: Color Token Resolution for Rendering

**User Story:** As a user, I want all colors displayed in the app to be resolved from the palette, so that rendering is consistent with the token system.

#### Acceptance Criteria

1. WHEN rendering a tag color, IF the tag's Color_Token is non-null, THEN THE Color_Resolver SHALL look up the token in the cached Palette and return the "normal" shade hex value. IF the tag's Color_Token is null, THEN THE Color_Resolver SHALL return the "normal" shade of "grey" from the cached Palette.
2. WHEN rendering an activity color, THE Color_Resolver SHALL resolve the color using the following priority order: Activity_Color_Override first, then the activity's tag color, then "grey" as default.
3. THE Color_Resolver SHALL use the first non-null Color_Token found in the priority order and return the "normal" shade hex value from the cached Palette for primary fills and badges, the "dark" shade for text on light backgrounds, and the "light" shade for background fills and hover states.
4. THE Color_Resolver SHALL NOT use hardcoded hex values for any color that has a corresponding Color_Token in the Palette.
5. IF the cached Palette is not yet loaded or unavailable, THEN THE Color_Resolver SHALL defer rendering color-dependent elements until the Palette is successfully fetched, rather than falling back to hardcoded values.

### Requirement 6: Grey Fallback for Missing Colors

**User Story:** As a user, I want activities and tags with missing color data to render in grey, so that the UI remains visually complete even in error cases.

#### Acceptance Criteria

1. IF a tag has a null or undefined color value, THEN THE Color_Resolver SHALL render the tag using the Grey_Default hex value (palette.grey.normal) from the cached Palette.
2. IF an activity has no Activity_Color_Override and its associated tag has a null or undefined color value, THEN THE Color_Resolver SHALL render the activity using the Grey_Default hex value (palette.grey.normal) from the cached Palette.
3. THE Color_Resolver SHALL use the "normal" shade of grey from the Palette as the Grey_Default hex value.
4. THE Color_Resolver SHALL NOT include grey in the set of user-selectable color options presented in the color picker.
5. IF the cached Palette is unavailable when color resolution is attempted, THEN THE Color_Resolver SHALL render the element using a hardcoded Grey_Default hex value of #B2B2B2.
