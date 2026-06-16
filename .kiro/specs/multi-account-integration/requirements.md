# Requirements Document

## Introduction

Multi-account integration enables users who belong to multiple accounts to select, switch between, and persist their active account context. The backend now requires an `X-Account-Id` header on all authenticated requests (except auth and account-listing endpoints). The frontend must orchestrate account selection post-login, inject the header into the API client, provide an account switcher UI, and handle account-related errors gracefully.

## Glossary

- **API_Client**: The `openapi-fetch` HTTP client instance (`src/api/client.ts`) that executes all authenticated API requests
- **Account_Picker**: A full-page UI presented after login when the user belongs to two or more accounts, allowing selection of the active account
- **Account_Switcher**: A dropdown or popover in the application navigation that lets users change their active account without logging out
- **Account_Store**: The Zustand store responsible for holding the active account ID and account list in UI state
- **Active_Account_Id**: The UUID of the currently selected account, sent as the `X-Account-Id` header on every authenticated request
- **Accounts_List**: The array of account objects returned by `GET /accounts`, each containing id, name, role, and isOwner fields
- **Post_Login_Flow**: The sequence of steps after successful authentication: fetch accounts, resolve which account to activate, then proceed to the app

## Requirements

### Requirement 1: Fetch Accounts After Authentication

**User Story:** As an authenticated user, I want the system to retrieve my account memberships after login, so that the correct account context can be established before I use the app.

#### Acceptance Criteria

1. WHEN a user completes login successfully, THE Post_Login_Flow SHALL call `GET /accounts` to retrieve the Accounts_List
2. WHILE the Accounts_List is being fetched, THE Post_Login_Flow SHALL display a visible loading indicator
3. IF the `GET /accounts` request returns a non-2xx HTTP response or a network error occurs, THEN THE Post_Login_Flow SHALL clear all authentication tokens and redirect the user to the login page
4. IF the Accounts_List returned from the API is empty, THEN THE Post_Login_Flow SHALL clear the stored authentication session and redirect the user to the login page

### Requirement 2: Automatic Account Selection for Single-Account Users

**User Story:** As a user with one account, I want the system to automatically select my account, so that I proceed to the app without extra steps.

#### Acceptance Criteria

1. WHEN the Accounts_List contains exactly one account, THE Post_Login_Flow SHALL automatically set that account's id as the Active_Account_Id in application state
2. WHEN the Accounts_List contains exactly one account, THE Post_Login_Flow SHALL store the Active_Account_Id in localStorage as `lastAccountId`
3. WHEN the Accounts_List contains exactly one account, THE Post_Login_Flow SHALL navigate the user to the `/` route without displaying the Account_Picker

### Requirement 3: Account Picker for Multi-Account Users

**User Story:** As a user with multiple accounts, I want to see an account picker after login, so that I can choose which account context to work in.

#### Acceptance Criteria

1. IF the Accounts_List contains two or more accounts AND no valid `lastAccountId` exists in localStorage (or the stored `lastAccountId` is not present in the Accounts_List), THEN THE Post_Login_Flow SHALL display the Account_Picker
2. THE Account_Picker SHALL display each account's name and the user's role within that account
3. WHERE the account has `isOwner: true`, THE Account_Picker SHALL display a "Personal" badge next to the account name
4. WHEN the user selects an account from the Account_Picker, THE Account_Store SHALL set the selected account's id as the Active_Account_Id
5. WHEN the user selects an account from the Account_Picker, THE Post_Login_Flow SHALL store the Active_Account_Id in localStorage as `lastAccountId`
6. WHEN the user selects an account from the Account_Picker, THE Post_Login_Flow SHALL navigate the user to the app home page

### Requirement 4: Returning User Auto-Selection

**User Story:** As a returning user with multiple accounts, I want the system to remember my last-used account, so that I skip the picker when my previous choice is still valid.

#### Acceptance Criteria

1. WHEN the Accounts_List contains two or more accounts AND a `lastAccountId` value exists in localStorage AND that value matches an id in the Accounts_List, THE Post_Login_Flow SHALL automatically set the matching account's id as the Active_Account_Id and navigate the user to the authenticated app without displaying the Account_Picker
2. WHEN the Accounts_List contains two or more accounts AND a `lastAccountId` value exists in localStorage AND that value does NOT match any id in the Accounts_List, THE Post_Login_Flow SHALL remove the `lastAccountId` entry from localStorage and display the Account_Picker
3. WHEN the Accounts_List contains two or more accounts AND no `lastAccountId` value exists in localStorage, THE Post_Login_Flow SHALL display the Account_Picker
4. IF the `lastAccountId` value in localStorage is not a valid UUID, THEN THE Post_Login_Flow SHALL treat it as absent, remove it from localStorage, and display the Account_Picker

### Requirement 5: X-Account-Id Header Injection

**User Story:** As an authenticated user, I want all my API requests to include the active account context, so that the backend processes requests against the correct account.

#### Acceptance Criteria

1. WHILE an Active_Account_Id is set, THE API_Client SHALL include an `X-Account-Id` header with the Active_Account_Id value on every outgoing request
2. THE API_Client SHALL NOT include the `X-Account-Id` header on requests to `POST /auth/*` endpoints
3. THE API_Client SHALL NOT include the `X-Account-Id` header on requests to `GET /accounts`
4. IF no Active_Account_Id is set, THEN THE API_Client SHALL NOT include the `X-Account-Id` header on any outgoing request
5. WHEN the API_Client retries a request after a 401 token refresh, THE API_Client SHALL include the `X-Account-Id` header on the retried request if an Active_Account_Id is set

### Requirement 6: Account Switcher UI

**User Story:** As a user with multiple accounts, I want an account switcher in the app navigation, so that I can change my active account without logging out.

#### Acceptance Criteria

1. WHILE the Accounts_List contains two or more accounts, THE Account_Switcher SHALL be visible in the application navigation
2. WHILE the Accounts_List contains exactly one account, THE Account_Switcher SHALL NOT be rendered
3. THE Account_Switcher SHALL display the name of the currently active account, truncated with an ellipsis if the name exceeds 24 characters
4. WHEN the user opens the Account_Switcher, THE Account_Switcher SHALL display all accounts from the Accounts_List with their name and role, with the currently active account visually distinguished from the others
5. WHERE an account has `isOwner: true`, THE Account_Switcher SHALL display a "Personal" badge next to the account name
6. WHEN the user selects a different account in the Account_Switcher, THE Account_Store SHALL update the Active_Account_Id to the selected account's id
7. WHEN the user selects a different account in the Account_Switcher, THE Account_Store SHALL store the new Active_Account_Id in localStorage as `lastAccountId`
8. WHEN the Active_Account_Id changes via the Account_Switcher, THE API_Client SHALL invalidate all cached TanStack Query data and refetch active queries
9. WHEN the user selects an account or clicks outside the Account_Switcher, THE Account_Switcher SHALL close the dropdown

### Requirement 7: Account Error Handling

**User Story:** As a user, I want the system to recover gracefully when my account context becomes invalid, so that I can re-select a valid account instead of seeing broken screens.

#### Acceptance Criteria

1. WHEN any API response returns `400` with type `missing_account_id`, THEN THE API_Client SHALL clear the Active_Account_Id from the Account_Store and localStorage, and invalidate all cached query data
2. WHEN any API response returns `400` with type `invalid_account_id`, THEN THE API_Client SHALL clear the Active_Account_Id from the Account_Store and localStorage, and invalidate all cached query data
3. WHEN any API response returns `403` with type `not_a_member`, THEN THE API_Client SHALL clear the Active_Account_Id from the Account_Store and localStorage, and invalidate all cached query data
4. WHEN the Active_Account_Id is cleared due to an account error, THE Post_Login_Flow SHALL redirect the user to the Account_Picker within the same navigation cycle, regardless of how many concurrent API responses triggered the error
5. WHEN the user is redirected to the Account_Picker due to an account error, THE Post_Login_Flow SHALL re-fetch the Accounts_List from `GET /accounts` before displaying the picker
6. IF the re-fetch of `GET /accounts` during error recovery fails, THEN THE Post_Login_Flow SHALL display an error message indicating the accounts list could not be loaded, and provide a retry action

### Requirement 8: Logout Cleanup

**User Story:** As a user, I want account state to be fully cleared on logout, so that subsequent logins start with a clean slate.

#### Acceptance Criteria

1. WHEN the user logs out, THE Account_Store SHALL set the Active_Account_Id to null in memory
2. WHEN the user logs out, THE Account_Store SHALL remove the `lastAccountId` value from localStorage
3. WHEN the user logs out, THE API_Client SHALL stop including the `X-Account-Id` header on subsequent requests
4. WHEN the user logs out, THE System SHALL clear the TanStack Query cache so that no account-scoped server data persists for the next session
