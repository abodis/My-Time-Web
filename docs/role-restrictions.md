# Role Restrictions

## Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| user | 0 | Basic team member — track time on assigned activities |
| manager | 1 | Team lead — manage projects, tags, assignments, view reports |
| admin | 2 | Account owner — full access including financials and members |

Higher roles inherit all permissions of lower roles.

## Endpoint Permissions

### No role requirement (any authenticated member)
- `GET /entries` — list own entries
- `POST /entries` — create entry (must be assigned to activity if role=user)
- `PUT /entries/{id}` — update own entry
- `DELETE /entries/{id}` — delete own entry
- `POST /entries/{id}/notes` — add note to own entry
- `GET /entries/{id}/notes` — list notes on own entry
- `POST /timer/start` — start timer (assignment check for user role)
- `POST /timer/stop` — stop own timer
- `GET /timer/current` — get own running timer
- `GET /projects` — list projects in account
- `GET /projects/{id}` — get project details
- `GET /projects/{id}/activities` — list activities
- `GET /tags` — list tags in account
- `GET /reports/personal-time` — own time report
- `GET /account/me` — own profile
- `PUT /account/me` — update own profile (display_name, timezone)
- `GET /accounts` — list own account memberships
- `POST /sync` — sync offline entries
- `GET /settings` — own settings
- `PATCH /settings` — update own settings
- `PATCH /settings/activity-colors` — update own activity colors

### Requires manager+
- `POST /projects` — create project
- `PUT /projects/{id}` — update project
- `DELETE /projects/{id}` — delete project
- `POST /projects/{id}/activities` — create activity
- `PUT /projects/{id}/activities/{id}` — update activity
- `DELETE /projects/{id}/activities/{id}` — delete activity
- `POST /activities/{id}/assignments` — assign user to activity
- `DELETE /activities/{id}/assignments/{userId}` — remove assignment
- `POST /projects/{id}/budgets` — create tag budget
- `PUT /projects/{id}/budgets/{id}` — update budget
- `DELETE /projects/{id}/budgets/{id}` — delete budget
- `POST /tags` — create tag
- `PUT /tags/{id}` — update tag
- `DELETE /tags/{id}` — delete/archive tag
- `GET /reports/project-budget` — project budget vs consumed
- `GET /reports/personal-time?userId=X` — view another user's time

### Requires admin
- `PUT /account` — update account name/currency
- `GET /account/members` — list members
- `PUT /account/members/{id}` — update member role/cost_rate/targets
- `DELETE /account/members/{id}` — remove member
- `POST /account/members` — invite new member
- `GET /account/invitations` — list pending invitations
- `DELETE /account/invitations/{id}` — revoke invitation
- `POST /account/invitations/{id}/resend` — resend invitation
- `GET /reports/financial` — revenue, cost, margin report

## Activity Assignment Check

For `role=user` only:
- Starting a timer or creating an entry requires assignment to the activity
- Managers and admins bypass this check
- Implemented in `check_activity_assignment()`

## Multi-Account Context

- All requests (except `/auth/*` and `/accounts`) require `X-Account-Id` header
- User must be a member of the specified account
- Role is per-account (a user can be admin in one account, user in another)
