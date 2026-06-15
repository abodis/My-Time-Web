# Implementation Plan

## Overview

Implement team management at `/team` with role-based access control, member list with search, and admin-only dialogs for invite/edit/remove. New components: `RoleGuard`, `TeamListPage`, `InviteMemberDialog`, `EditMemberDialog`, `RemoveMemberDialog`. New hooks in `use-members.ts`. Nav filtering in PillNav by role.

## Tasks

- [x] 1. Create `src/hooks/use-members.ts` with `useMembers` query hook (`GET /account/members`, query key `["members"]`) and three mutation hooks: `useInviteMember` (`POST /account/members`), `useUpdateMember` (`PUT /account/members/{userId}`), `useRemoveMember` (`DELETE /account/members/{userId}`). All mutations invalidate `["members"]` on success. Follow existing patterns from `use-projects.ts`.
  - **Requirement:** #1, #2, #3, #4
  - **Dependencies:** None

- [x] 2. Create `src/components/auth/role-guard.tsx` — `RoleGuard` component with `allowedRoles: string[]` and `children` props. Uses `useProfile()` to get current user role. While loading or profile unavailable: render nothing (fail-closed). If role not in `allowedRoles`: render `<Navigate to="/" replace />`. Otherwise render children.
  - **Requirement:** #5
  - **Dependencies:** None

- [x] 3. Modify `src/components/layout/nav-items.ts` — add optional `minRole` field to `NavItem` interface. Set `minRole: "manager"` on the Team item and remove `disabled: true`. Modify `src/components/layout/pill-nav.tsx` — filter `NAV_ITEMS` using `useProfile()` role, hiding items where the user's role is below `minRole`. Role hierarchy: user < manager < admin.
  - **Requirement:** #5
  - **Dependencies:** None

- [x] 4. Create `src/components/team/invite-member-dialog.tsx` — `InviteMemberDialog` with `open` and `onClose` props. Uses react-hook-form + Zod schema: email (valid format, max 254 chars), role (enum: admin/manager/user, default "user"). On submit calls `useInviteMember`. Handles 409 (already member), 422 (validation), 5xx/network errors inline. Closes on success. Preserves form data on error.
  - **Requirement:** #2, #7
  - **Dependencies:** 1

- [x] 5. Create `src/components/team/edit-member-dialog.tsx` — `EditMemberDialog` with `member`, `open`, `onClose` props. Pre-populates form with member's current role, costRate, utilizationTarget, weeklyCapacityHours (null → empty). Zod schema validates: role required (enum), costRate 0–999999.99 (≤2 decimals), utilizationTarget 0–100 (integer), weeklyCapacityHours 0–168 (≤2 decimals). Empty optional fields → null. Calls `useUpdateMember`. Handles 409 (last admin), 403, 400/422, network errors inline. Preserves values on error.
  - **Requirement:** #3, #6
  - **Dependencies:** 1

- [x] 6. Create `src/components/team/remove-member-dialog.tsx` — `RemoveMemberDialog` with `member`, `open`, `onClose` props. Displays member name and email. Disables both buttons during DELETE. On success: close. On 409 (last admin): re-enable buttons, show error. On other errors: re-enable, show generic error.
  - **Requirement:** #4
  - **Dependencies:** 1

- [x] 7. Create `src/pages/app/team-list.tsx` — `TeamListPage` using `useMembers` + `useProfile`. Renders `SearchToolbar` (search filters members by displayName/email, case-insensitive). Renders `DataTable` with columns: name (displayName or email fallback + "You"/"Pending" badges), email, role, status. Admin-only: financial columns (costRate, utilizationTarget, weeklyCapacityHours), Invite button in toolbar `actionSlot`, edit/remove actions per row (remove hidden for self). Manager: read-only view, no financial columns, no action buttons. Loading state: `LoadingSpinner`. Error state: error message. Empty search: "No members found" message.
  - **Requirement:** #1, #2, #3, #4, #5
  - **Dependencies:** 1, 4, 5, 6

- [x] 8. Register `/team` route in `src/routes.tsx` — lazy-load `TeamListPage`, wrap in `RoleGuard` with `allowedRoles={["admin", "manager"]}`, add inside `AppShell` children alongside other app routes.
  - **Requirement:** #5
  - **Dependencies:** 2, 7

- [x] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - **Requirement:** #1, #2, #3, #4, #5, #6, #7
  - **Dependencies:** 8

- [ ]* 10. Write property tests for member list display logic in `src/components/team/__tests__/team-properties.test.ts` using Vitest + fast-check. Extract pure helper functions (display name resolution, pending badge logic, "You" badge logic, search filtering, financial visibility, remove-self exclusion) and test them:
  - [ ]* 10.1 **Property 1: Display name fallback** — for any member, displayed name equals `displayName` when non-null, else `email`.
    - **Property 1: Display name fallback**
    - **Validates: Requirement 1.2**
  - [ ]* 10.2 **Property 2: Pending badge maps to null joinedAt** — badge shown iff `joinedAt` is null.
    - **Property 2: Pending badge maps to null joinedAt**
    - **Validates: Requirement 1.3**
  - [ ]* 10.3 **Property 3: "You" badge maps to profile ID match** — exactly one member gets "You" badge when IDs match.
    - **Property 3: "You" badge maps to profile ID match**
    - **Validates: Requirement 1.4**
  - [ ]* 10.4 **Property 4: Search filter correctness** — filtered result contains exactly members whose displayName or email includes search string (case-insensitive).
    - **Property 4: Search filter correctness**
    - **Validates: Requirement 1.5**
  - [ ]* 10.5 **Property 5: Financial field visibility is role-gated** — admin sees financial columns, manager does not.
    - **Property 5: Financial field visibility is role-gated**
    - **Validates: Requirement 1.9**
  - [ ]* 10.6 **Property 9: Remove action excludes current user** — remove action hidden for member matching profile ID.
    - **Property 9: Remove action excludes current user**
    - **Validates: Requirement 4.1**
  - **Requirement:** #1, #4
  - **Dependencies:** 7

- [ ]* 11. Write property tests for form validation schemas in `src/components/team/__tests__/validation-properties.test.ts` using Vitest + fast-check:
  - [ ]* 11.1 **Property 6: Email validation rejects invalid formats** — invalid emails rejected, valid emails ≤254 chars accepted.
    - **Property 6: Email validation rejects invalid formats**
    - **Validates: Requirements 2.4, 7.1**
  - [ ]* 11.2 **Property 7: Edit form schema validates field constraints** — schema accepts iff all field constraints met, empty optionals → null.
    - **Property 7: Edit form schema validates field constraints**
    - **Validates: Requirements 3.3, 6.1, 6.2, 6.3, 6.4, 6.6**
  - **Requirement:** #2, #3, #6, #7
  - **Dependencies:** 4, 5

- [ ]* 12. Write property tests for nav and role-guard logic in `src/components/auth/__tests__/role-properties.test.ts` using Vitest + fast-check:
  - [ ]* 12.1 **Property 10: Nav item visibility respects role** — Team nav visible iff role ∈ {"admin", "manager"}.
    - **Property 10: Nav item visibility respects role**
    - **Validates: Requirement 5.2**
  - [ ]* 12.2 **Property 8: Edit dialog pre-populates with member data** — each form field's initial value matches member property (null → empty).
    - **Property 8: Edit dialog pre-populates with member data**
    - **Validates: Requirement 3.2**
  - **Requirement:** #3, #5
  - **Dependencies:** 2, 3, 5

- [ ] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - **Requirement:** #1, #2, #3, #4, #5, #6, #7
  - **Dependencies:** 10, 11, 12

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP.
- The design uses TypeScript throughout — all implementations use React + TypeScript.
- `MemberResponse` type comes from generated `src/api/schema.d.ts` — never hand-write it.
- Financial columns (costRate, utilizationTarget, weeklyCapacityHours) are conditionally included in the DataTable column array based on role, not hidden via CSS.
- Nav filtering uses a role hierarchy helper to compare roles rather than simple string equality.
- Property tests target extracted pure functions (display logic, filtering, validation schemas) — not rendered components.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2", "3"] },
    { "id": 1, "tasks": ["4", "5", "6"] },
    { "id": 2, "tasks": ["7"] },
    { "id": 3, "tasks": ["8", "10.1", "10.2", "10.3", "10.4", "10.5", "10.6", "11.1", "11.2"] },
    { "id": 4, "tasks": ["12.1", "12.2"] },
    { "id": 5, "tasks": ["13"] }
  ]
}
```
