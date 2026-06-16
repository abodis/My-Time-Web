# Frontend Integration: Multi-Account Membership

Backend now supports users belonging to multiple accounts. This doc covers what the frontend needs to implement.

## Breaking Change: X-Account-Id Header Required

Every authenticated API request (except `POST /auth/*` and `GET /accounts`) now requires:

```
X-Account-Id: <uuid>
```

If missing → `400 { type: "missing_account_id", message: "X-Account-Id header is required" }`
If invalid UUID → `400 { type: "invalid_account_id", message: "X-Account-Id must be a valid UUID" }`
If user not a member → `403 { type: "not_a_member", message: "You are not a member of this account" }`

### Implementation

Add to your HTTP client (axios interceptor, fetch wrapper, etc.):

```ts
const accountId = getActiveAccountId(); // from localStorage or state
if (accountId) {
  headers["X-Account-Id"] = accountId;
}
```

## New Endpoint: GET /accounts

Returns all accounts the logged-in user belongs to. No `X-Account-Id` header needed.

See `openapi.json` for full response schema. Shape:

```json
[
  { "id": "uuid", "name": "My Business", "role": "admin", "isOwner": true },
  { "id": "uuid", "name": "Client Corp", "role": "user", "isOwner": false }
]
```

## New Endpoints: Invitation Management (Admin Only)

All require `X-Account-Id` header and admin role.

- `GET /account/invitations` — list pending (non-expired) invitations
- `DELETE /account/invitations/{invitationId}` — revoke/cancel invitation
- `POST /account/invitations/{invitationId}/resend` — resend email, reset 7-day expiry

See `openapi.json` for schemas.

## Post-Login Flow

```
1. Login → get tokens
2. GET /accounts → get user's account list
3. If 1 account → auto-select, store in localStorage, proceed
4. If 2+ accounts → show account picker (or auto-select last-used from localStorage)
5. Set active accountId → all subsequent requests include X-Account-Id
```

### First-time users

New users always have exactly one account after registration (their personal account, where `isOwner: true`). Step 3 applies — auto-select, no picker shown.

### Returning users with multiple accounts

Persist `lastAccountId` in localStorage. On login, if it's in the accounts list, auto-select it. Otherwise show picker.

## Account Switcher UI

Show when user has 2+ accounts. Minimum:
- Display current account name in nav/sidebar
- Dropdown or modal listing all accounts with role badge
- Switching updates stored `accountId` and refetches current view data

## Error Handling

If any request returns `400 missing_account_id` or `403 not_a_member`:
- Clear stored `accountId`
- Redirect to account picker / re-fetch `GET /accounts`

This handles edge cases like being removed from an account while active.

## Owner Badge (Optional)

`isOwner: true` in the accounts list indicates the user's personal account. Could display a "My Account" badge vs organization accounts. Owner cannot be removed from their own account.

## What Doesn't Change

- Auth flow (register, confirm, login, refresh, forgot-password) — unchanged
- All existing UI screens — same data, same permissions logic
- URL structure — no account in URL path needed
- Role-based visibility (admin sees cost rates, user doesn't) — unchanged
