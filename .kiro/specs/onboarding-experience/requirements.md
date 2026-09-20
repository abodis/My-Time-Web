# Requirements Document

## Introduction

This feature delivers a first-run onboarding experience for the My Time Blocks web app. A brand-new user landing on an empty tracker does not understand the MyTime mental model (tags as billable codes, activities under projects, live tracking feeding reports) and has nothing to track. The onboarding flow both populates the workspace and teaches the model inline, guiding the user toward the activation moment: their first timer start on a real activity.

The flow branches on account ownership. Owners get a full setup wizard at `/onboarding` (profile, workspace seeding, guided chain, optional invites, hand-off). Invited non-owner users get a lightweight welcome (profile confirmation, brief model explanation, hand-off to already-assigned activities). Both branches end by stamping `onboarding.completed` so the wizard is never re-shown. Teaching happens inline at the relevant step — no unskippable slideshow.

Avatar upload is explicitly out of scope for this feature and belongs to a separate settings-page spec.

## Glossary

- **Onboarding_System**: The frontend feature that gates first-run users, renders the owner wizard and non-owner welcome, and coordinates onboarding API calls.
- **Entry_Gate**: The logic that, after account selection, inspects `onboarding.completed` and routes the user to onboarding or the tracker.
- **Owner_Wizard**: The full multi-step onboarding flow shown to account owners at route `/onboarding`.
- **Non_Owner_Welcome**: The lightweight onboarding flow shown to invited (non-owner) users.
- **Profile_Step**: The required wizard step collecting displayName, timezone, and currency (owner) or displayName and timezone (non-owner).
- **Workspace_Path_Step**: The required wizard step where an owner chooses the fast path or the guided path.
- **Fast_Path**: The workspace-seeding option that creates an example project via `POST /onboarding/example-project`.
- **Guided_Path**: The workspace-seeding option where the owner manually creates a tag, project, and activity.
- **Guided_Chain**: The ordered sequence of tag creation, project creation, and activity creation in the Guided_Path.
- **Invite_Step**: The optional, skippable, owner-only step for inviting team members.
- **Summary_Step**: The final wizard step that recaps what was set up and hands off to the tracker.
- **Tracker_Pointer**: A single contextual hint rendered at an activity card after hand-off, prompting the first timer start.
- **API_Client**: The openapi-fetch client in `src/api/client.ts`.
- **Account_Agnostic_Path**: An API path called without an `X-Account-Id` header.
- **isOwner**: The boolean flag on a `MeAccount` indicating the user owns the selected account.
- **onboarding.completed**: The boolean flag in the `GET /me` response indicating onboarding is finished.
- **SUPPORTED_CURRENCIES**: The allowed currency list (GBP, EUR, USD, PLN) defined in `src/lib/currency.ts`.

## Requirements

### Requirement 1: API Client and Type Prerequisites

**User Story:** As a developer, I want the API client configured for the onboarding endpoints, so that onboarding calls are correctly typed and correctly scoped.

#### Acceptance Criteria

1. THE Onboarding_System SHALL use generated types for `GET /me`, `POST /onboarding`, `POST /onboarding/light`, and `POST /onboarding/example-project` produced by `npm run api:generate`.
2. WHEN the API_Client sends a request to `GET /me`, THE API_Client SHALL omit the `X-Account-Id` header.
3. WHEN the API_Client sends a request to `POST /onboarding` or `POST /onboarding/light`, THE API_Client SHALL omit the `X-Account-Id` header.
4. WHEN the API_Client sends a request to `POST /onboarding/example-project`, THE API_Client SHALL include the `X-Account-Id` header.
5. IF an onboarding request fails, THEN THE Onboarding_System SHALL surface an error indication and SHALL NOT mark onboarding complete.

### Requirement 2: Entry Gate

**User Story:** As a returning or new user, I want to be routed correctly after signing in, so that new users are onboarded and returning users go straight to work.

#### Acceptance Criteria

1. WHEN a selected account is resolved and the `GET /me` response returns `onboarding.completed` as `false`, THE Entry_Gate SHALL route the user to the onboarding flow instead of the tracker.
2. WHEN a selected account is resolved and the `GET /me` response returns `onboarding.completed` as `true`, THE Entry_Gate SHALL route the user to the tracker.
3. IF the `GET /me` request fails or does not return an `onboarding.completed` value, THEN THE Entry_Gate SHALL keep the user on the account-resolution screen and present an error indication that the onboarding status could not be retrieved, without routing to the tracker or the onboarding flow.
4. WHEN the Entry_Gate routes a user to onboarding AND `isOwner` is `true`, THE Entry_Gate SHALL route the user to the Owner_Wizard.
5. WHEN the Entry_Gate routes a user to onboarding AND `isOwner` is `false`, THE Entry_Gate SHALL route the user to the Non_Owner_Welcome.
6. THE Onboarding_System SHALL expose the Owner_Wizard at route `/onboarding`.
7. WHILE a user is on the `/onboarding` route, THE Onboarding_System SHALL render the flow full-screen outside the application shell, without the application shell navigation and chrome elements.

### Requirement 3: Owner Profile Step

**User Story:** As an account owner, I want to set my profile and account currency first, so that my rates and reports display correctly.

#### Acceptance Criteria

1. THE Profile_Step SHALL present fields for displayName, timezone, and currency.
2. WHEN the Profile_Step loads AND `GET /me` returns a non-null displayName, THE Profile_Step SHALL pre-fill the displayName field with that value.
3. WHEN the Profile_Step loads AND `GET /me` returns a null displayName, THE Profile_Step SHALL present an empty displayName field.
4. WHEN the Profile_Step loads, THE Profile_Step SHALL pre-fill the timezone field from `Intl.DateTimeFormat().resolvedOptions().timeZone`.
5. THE Profile_Step SHALL present the currency field as a dropdown populated from SUPPORTED_CURRENCIES, offering exactly the values GBP, EUR, USD, and PLN.
6. WHEN the owner submits the Profile_Step with a displayName of between 1 and 100 characters, a timezone, and a currency from SUPPORTED_CURRENCIES, THE Onboarding_System SHALL send `POST /onboarding` with displayName, timezone, and currency.
7. THE Onboarding_System SHALL omit the avatar field from the `POST /onboarding` request.
8. IF the owner submits the Profile_Step with a missing displayName, missing timezone, or missing currency, THEN THE Profile_Step SHALL block submission, retain all entered values, and display a validation message identifying the missing field.
9. IF `POST /onboarding` returns a 400 currency-validation error, THEN THE Profile_Step SHALL display an error message, retain all entered values, and keep the user on the Profile_Step.
10. IF `POST /onboarding` returns 404 for a missing owned account, THEN THE Profile_Step SHALL keep the user on the Profile_Step, retain all entered values, and display an error indication.
11. WHEN `POST /onboarding` succeeds, THE Onboarding_System SHALL advance to the Workspace_Path_Step.

### Requirement 4: Workspace Path Decision

**User Story:** As an account owner, I want to choose how to populate my workspace, so that I never end up with an empty tracker.

#### Acceptance Criteria

1. WHEN the Workspace_Path_Step is displayed, THE Workspace_Path_Step SHALL present exactly two selectable choices: the Fast_Path (seed example project) and the Guided_Path (create first real project), each visually labeled with its name and outcome.
2. THE Workspace_Path_Step SHALL require the owner to select exactly one path before the advance control becomes enabled.
3. IF the owner attempts to advance while no path is selected, THEN THE Workspace_Path_Step SHALL block advancement, retain the owner on the Workspace_Path_Step with any prior selection state unchanged, and display an error indication prompting the owner to select one path.
4. WHEN the owner selects the Fast_Path and advances, THE Workspace_Path_Step SHALL seed one example project and complete without leaving the workspace empty.
5. WHEN the owner selects the Guided_Path and advances, THE Workspace_Path_Step SHALL initiate creation of the owner's first real project and complete without leaving the workspace empty.

### Requirement 5: Fast Path Seeding

**User Story:** As an account owner in a hurry, I want an example project seeded, so that my reports are not empty later and I can explore the model.

#### Acceptance Criteria

1. WHEN the owner selects the Fast_Path, THE Onboarding_System SHALL send `POST /onboarding/example-project`.
2. WHEN `POST /onboarding/example-project` returns 201, THE Onboarding_System SHALL treat the seeded example project as containing one project named "Example Project", one tag named "Consulting" with the blue color token, one activity named "Kickoff" assigned to the requesting owner, and one sample time entry, then advance to the Invite_Step.
3. IF `POST /onboarding/example-project` returns 409, THEN THE Onboarding_System SHALL treat the workspace as already seeded, advance to the Invite_Step, and display no error indication to the owner.
4. IF `POST /onboarding/example-project` returns any response other than 201 or 409, or no response is received within 30 seconds, THEN THE Onboarding_System SHALL retain the owner on the Fast_Path, display an error indication that seeding failed, and preserve the option to retry.
5. WHEN the Fast_Path completes, THE Onboarding_System SHALL NOT offer the Fast_Path again within the same wizard session.

### Requirement 6: Guided Path Chain

**User Story:** As an account owner who wants my own setup, I want to create my first tag, project, and activity with guidance, so that I learn the model while building real data.

#### Acceptance Criteria

1. WHEN the owner selects the Guided_Path, THE Guided_Chain SHALL present exactly three steps in order: tag creation first, project creation second, activity creation third.
2. WHEN the tag-creation step loads, THE Guided_Chain SHALL pre-select the tag color as the color-name token "blue".
3. WHERE the activity-creation step is shown, THE Guided_Chain SHALL auto-assign the created activity to the current user.
4. WHEN each step of the chain loads, THE Guided_Chain SHALL display an inline explanation of that step's concept before the owner submits the step.
5. IF the owner submits a step with a required field empty, THEN THE Guided_Chain SHALL reject the submission, retain the entered values, remain on the current step, and display an error indicating which field is required.
6. IF a step's creation request fails, THEN THE Guided_Chain SHALL retain the entered values, remain on the current step, and display an error indicating the creation did not succeed.
7. WHEN the owner completes tag, project, and activity creation, THE Onboarding_System SHALL advance to the Invite_Step.

### Requirement 7: Optional Team Invites

**User Story:** As an account owner, I want to optionally invite my team, so that I can bring others in without being forced to.

#### Acceptance Criteria

1. WHERE the current user is an owner, THE Invite_Step SHALL present an email input for team member invitations and a control labeled to indicate the step is optional ("set up your team (optional)").
2. THE Invite_Step SHALL present a skip control that allows the owner to proceed without entering any invitation.
3. WHEN the owner activates the skip control, THE Onboarding_System SHALL advance to the Summary_Step without sending any invitation.
4. WHEN the owner submits the Invite_Step with one or more email entries and every entry is a syntactically valid email address, THE Onboarding_System SHALL send an invitation for each entry and advance to the Summary_Step.
5. IF the owner activates the submit control with zero email entries, THEN THE Invite_Step SHALL treat the action as a skip and advance to the Summary_Step without sending any invitation.
6. IF the owner submits one or more email entries and any entry is not a syntactically valid email address, THEN THE Invite_Step SHALL reject the submission, remain on the Invite_Step, display an indication identifying each invalid entry, and retain all entered values.
7. IF sending an invitation fails, THEN THE Invite_Step SHALL remain on the Invite_Step, display an indication that the invitation could not be sent, and retain the entered values so the owner can retry.
8. WHERE the current user is not an owner, THE Onboarding_System SHALL NOT present the Invite_Step.

### Requirement 8: Summary and Tracker Hand-off

**User Story:** As a newly set-up user, I want a short recap and a clear next step, so that I know what I built and start tracking.

#### Acceptance Criteria

1. WHEN the Summary_Step is displayed, THE Summary_Step SHALL display a recap of what the user set up and what to do next.
2. THE Summary_Step SHALL reference the created or seeded items (tag, project, and activity) in the recap.
3. WHEN the user completes the Summary_Step, THE Onboarding_System SHALL navigate the user to the tracker.
4. WHEN the tracker loads after hand-off, THE Onboarding_System SHALL display exactly one Tracker_Pointer at an activity card prompting the first timer start.
5. IF navigation to the tracker fails, THEN THE Summary_Step SHALL remain displayed and display an error indication with a retry option.
6. WHEN the user starts a timer for the first time after hand-off, THE Onboarding_System SHALL dismiss the Tracker_Pointer.

### Requirement 9: Non-Owner Lightweight Welcome

**User Story:** As an invited team member, I want a brief welcome that confirms my profile and points me to my work, so that I can start tracking without account-setup steps.

#### Acceptance Criteria

1. THE Non_Owner_Welcome SHALL present fields for displayName and timezone.
2. WHEN the Non_Owner_Welcome loads, THE Non_Owner_Welcome SHALL pre-fill displayName from `GET /me` when non-null and pre-fill timezone from `Intl.DateTimeFormat().resolvedOptions().timeZone`.
3. THE Non_Owner_Welcome SHALL NOT present a currency field.
4. THE Non_Owner_Welcome SHALL NOT present workspace-seeding steps.
5. THE Non_Owner_Welcome SHALL display between one and two inline cards explaining the track-to-report model.
6. WHEN the non-owner submits the Non_Owner_Welcome with a displayName and a timezone, THE Onboarding_System SHALL send `POST /onboarding/light` with displayName and timezone.
7. IF the non-owner submits the Non_Owner_Welcome with a missing displayName or missing timezone, THEN THE Non_Owner_Welcome SHALL block submission and display a validation message identifying the missing field.
8. IF `POST /onboarding/light` fails, THEN THE Non_Owner_Welcome SHALL remain displayed, display an error indication, retain the entered values, and NOT mark onboarding complete.
9. WHEN `POST /onboarding/light` succeeds, THE Onboarding_System SHALL navigate the non-owner to the tracker showing already-assigned activities.

### Requirement 10: Completion Semantics

**User Story:** As any onboarded user, I want onboarding to run once, so that I am never re-prompted after finishing.

#### Acceptance Criteria

1. WHEN `POST /onboarding` returns a success response for an owner, THE Onboarding_System SHALL persist `onboarding.completed` as `true` as reflected by the success response.
2. WHEN `POST /onboarding/light` returns a success response for a non-owner, THE Onboarding_System SHALL persist `onboarding.completed` as `true` as reflected by the success response.
3. WHEN a user whose `onboarding.completed` is `true` signs in again, THE Entry_Gate SHALL route the user to the tracker without re-prompting any onboarding step.
4. WHERE the owner skipped the Invite_Step, THE Onboarding_System SHALL treat onboarding as complete and SHALL NOT re-prompt the Invite_Step through the wizard on subsequent sign-ins.
5. WHEN a workspace path was not chosen during a prior session, THE Onboarding_System SHALL NOT re-prompt the workspace path through the wizard on subsequent sign-ins once `onboarding.completed` is `true`.
6. IF a completion request fails, THEN THE Onboarding_System SHALL NOT mark onboarding complete and the user SHALL remain able to retry.
