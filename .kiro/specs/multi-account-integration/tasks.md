# Implementation Plan

## Overview

Implement multi-account support: Zustand store for account state, API client middleware for X-Account-Id header injection and account error interception, post-login account resolution flow, account picker page, account switcher in navigation, and logout cleanup.

## Tasks

- [x] 1. Create the Zustand account store (`src/stores/account-store.ts`)
  - **Requirement:** #2, #3, #4, #8
  - **Dependencies:** None
  - Create store with `activeAccountId: string | null`, `accounts: AccountItem[]`
  - Actions: `setActiveAccount(id)` (sets state + writes `lastAccountId` to localStorage), `setAccounts(accounts)`, `clearAccountState()` (nulls ID, empties list, removes `lastAccountId` from localStorage)
  - Export `useAccountStore` and `AccountItem` interface

- [x] 2. Extend API client with X-Account-Id header injection
  - **Requirement:** #5
  - **Dependencies:** 1
  - In `src/api/client.ts` `onRequest` hook: after Authorization header, skip if path starts with `/auth/` or is `GET /accounts`; otherwise read `useAccountStore.getState().activeAccountId` and set `X-Account-Id` header if non-null
  - In 401 retry path: ensure retried request also gets the `X-Account-Id` header

- [x] 3. Add account error interceptor to API client
  - **Requirement:** #7
  - **Dependencies:** 1, 2
  - In `src/api/client.ts` `onResponse` hook after 401 handling: check if response is 400/403, parse body, check `body.type` against `missing_account_id`, `invalid_account_id`, `not_a_member`
  - If matched: call `clearAccountState()`, `queryClient.invalidateQueries()`, redirect to `/select-account`
  - Add deduplication guard flag to prevent concurrent error responses from triggering multiple redirects

- [x] 4. Create the account resolution utility (`src/lib/resolve-account.ts`)
  - **Requirement:** #2, #3, #4
  - **Dependencies:** None
  - Pure function `resolveAccount(accounts, lastAccountId)` returning `{ action: "autoSelect", accountId }` or `{ action: "showPicker" }`
  - 1 account → autoSelect; 2+ accounts + valid UUID in list → autoSelect; otherwise → showPicker
  - UUID validation regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`

- [x] 5. Create the Select Account page (`src/pages/app/select-account.tsx`)
  - **Requirement:** #1, #2, #3, #4
  - **Dependencies:** 1, 4
  - On mount: call `GET /accounts` via generated client, show loading spinner
  - If fetch fails or returns empty → `clearAuth()` → navigate `/login`
  - Call `resolveAccount()` with accounts + `localStorage.getItem("lastAccountId")`
  - autoSelect → `setActiveAccount()` + `setAccounts()` → navigate `/`
  - showPicker → render AccountPicker with accounts list

- [x] 6. Create the Account Picker component (`src/components/account/account-picker.tsx`)
  - **Requirement:** #3
  - **Dependencies:** None
  - Props: `accounts: AccountItem[]`, `onSelect: (accountId: string) => void`
  - Centered card list using AuthLayout wrapper; each card shows name, role badge, "Personal" badge if `isOwner`
  - Uses shadcn/ui Card and Badge

- [x] 7. Register the /select-account route
  - **Requirement:** #1
  - **Dependencies:** 5
  - In `src/routes.tsx`: add `/select-account` inside ProtectedRoute but OUTSIDE AppShell (full-page, no nav)
  - Lazy-load SelectAccountPage; route requires auth but not active account

- [x] 8. Extend ProtectedRoute to gate on active account
  - **Requirement:** #5, #7
  - **Dependencies:** 1, 7
  - In `src/components/auth/protected-route.tsx`: after successful auth, check `useAccountStore.getState().activeAccountId`
  - If null and current path is not `/select-account`, redirect to `/select-account`

- [x] 9. Create the Account Switcher component (`src/components/layout/account-switcher.tsx`)
  - **Requirement:** #6
  - **Dependencies:** 1
  - Read `accounts` and `activeAccountId` from store; only render if `accounts.length >= 2`
  - Display current account name truncated to 24 chars with ellipsis
  - Dropdown: all accounts with name, role, "Personal" badge; active account visually distinguished
  - On switch: update store, `queryClient.invalidateQueries()`, close dropdown
  - Outside-click closes (useRef + mousedown listener)

- [x] 10. Integrate Account Switcher into PillNav
  - **Requirement:** #6
  - **Dependencies:** 9
  - In `src/components/layout/pill-nav.tsx`: import and render `<AccountSwitcher />` in the nav
  - Component self-gates on account count

- [x] 11. Integrate logout cleanup
  - **Requirement:** #8
  - **Dependencies:** 1
  - In `src/components/layout/pill-nav.tsx` `handleLogout()`: after `clearAuth()`, call `useAccountStore.getState().clearAccountState()` and `queryClient.clear()`

- [x] 12. Update login page to redirect to /select-account
  - **Requirement:** #1
  - **Dependencies:** 7
  - In login page success handler: navigate to `/select-account` instead of `/`

## Notes

- The `/select-account` route sits inside ProtectedRoute but outside AppShell (no nav shown during account selection)
- The ProtectedRoute must allow `/select-account` through without requiring `activeAccountId`
- Account error interceptor uses `window.location.href` for hard redirect to avoid React Router state issues during concurrent error handling

## Task Dependency Graph

```json
{
  "waves": [
    {"tasks": [1, 4, 6]},
    {"tasks": [2, 5, 9, 11]},
    {"tasks": [3, 7, 10]},
    {"tasks": [8, 12]}
  ]
}
```
