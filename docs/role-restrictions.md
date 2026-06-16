# Role Restrictions

## Account Context

All role checks are **per-account**. A user can have different roles in different accounts (e.g., admin in their own account, user in another). The active account is determined by the `X-Account-Id` header on every request.

## Role Hierarchy

```
user (0) → manager (1) → admin (2)
```

Higher-level roles inherit all permissions of lower levels.

---

## Owner

Each account has exactly one owner (`accounts.owner_id`). Owner is always an admin, but has additional protection:

- Cannot be removed from the account (`403 cannot_remove_owner`)
- Cannot be demoted (implicitly — they're protected from removal)
- One owned account per user (enforced by unique index)

Owner is not a role — it's a property of the account. The owner's role in `account_members` is still `admin`.

---

## Admin (role = `admin`)

Exclusive access to:

| Action | Endpoint |
|--------|----------|
| Update account name/currency | `PUT /account` |
| Invite new member | `POST /account/members` |
| Update member role/rates | `PUT /account/members/{userId}` |
| Remove member | `DELETE /account/members/{userId}` |
| List pending invitations | `GET /account/invitations` |
| Revoke invitation | `DELETE /account/invitations/{invitationId}` |
| Resend invitation | `POST /account/invitations/{invitationId}/resend` |

Additional visibility:
- `GET /account/members` — admin sees financial fields (`costRate`, `utilizationTarget`, `weeklyCapacityHours`); non-admins see basic member info only.

Safety constraints:
- Cannot demote or remove the last admin in an account.
- Cannot remove the account owner.

---

## Manager (role = `manager`)

Minimum role for:

| Action | Endpoint |
|--------|----------|
| Create project | `POST /projects` |
| Update project | `PUT /projects/{id}` |
| Delete project | `DELETE /projects/{id}` |
| Create activity | `POST /projects/{id}/activities` |
| Update activity | `PUT /activities/{id}` |
| Delete activity | `DELETE /activities/{id}` |
| Manage budgets (CRUD) | `/projects/{id}/budgets` |
| Manage assignments (CRUD) | `/activities/{id}/assignments` |
| Create tag | `POST /tags` |
| Update tag | `PUT /tags/{id}` |
| Delete tag | `DELETE /tags/{id}` |
| View other users' entries | `GET /entries?userId={id}` |

Activity visibility:
- `GET /projects/{id}/activities` — managers/admins see all activities; users see only assigned.

Activity assignment bypass:
- Managers/admins can log time to **any** activity without being explicitly assigned.

---

## User (role = `user`)

Permissions:
- Create/update/delete own time entries
- Start/stop own timer
- View own entries only
- View account info and member list (without financial fields)
- Update own profile (`PUT /account/me`)
- List projects and view assigned activities

Restrictions:
- Must be **assigned** to an activity to start a timer or create an entry against it.
- Cannot view other users' entries.
- Cannot create/modify projects, activities, budgets, tags, or assignments.
- Cannot manage account settings or members.

---

## No-Auth Endpoints

These endpoints do **not** require `X-Account-Id`:

| Endpoint | Reason |
|----------|--------|
| `POST /auth/*` | Authentication (no account context yet) |
| `GET /accounts` | User needs to discover their accounts before selecting one |

---

## Enforcement Mechanism

All checks use the `account_members` table (keyed on `account_id + user_id`) with a hierarchical comparison:

```python
ROLE_HIERARCHY = {"user": 0, "manager": 1, "admin": 2}

# Returns 403 if membership role < minimum_role
def require_role(membership, minimum_role): ...
```

Account context is resolved via `get_account_context(user_id, event)`:
1. Extract `X-Account-Id` from headers
2. Validate UUID format
3. Verify user is a member of that account
4. Return `{account_id, role}` or error response

Activity assignment is enforced separately for user-role only:

```python
def check_activity_assignment(user_id, activity_id, role):
    if role in ("manager", "admin"):
        return None  # bypass
    # else check activity_assignments table
```
