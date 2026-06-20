# Implementation Plan: Activity Assignments

## Overview

Adds an inline "Assigned" column to the Activities table with a popover checklist for toggling user assignments per activity. Implementation follows the existing TanStack Query + shadcn/ui patterns, with optimistic updates and role-based access control.

## Tasks

- [x] 1. Create assignment hooks
  - [x] 1.1 Implement `useAssignments`, `useAssignActivity`, and `useUnassignActivity` hooks
    - Create `src/hooks/use-assignments.ts`
    - `useAssignments(activityId)` — query with key `["assignments", activityId]`, calls `GET /activities/{id}/assignments`
    - `useAssignActivity(activityId)` — mutation with optimistic append to cache, rollback on error, invalidate on settle
    - `useUnassignActivity(activityId)` — mutation with optimistic filter from cache, rollback on error, invalidate on settle
    - Handle 409 Conflict on POST as success (keep checkbox checked, no error)
    - _Requirements: 2.1, 2.3, 4.1, 4.2, 4.5, 5.1, 5.2, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 1.2 Write property tests for optimistic update logic
    - **Property 5: Optimistic toggle consistency** — verify assign appends to cache and unassign removes from cache immediately
    - **Property 6: Count mutation delta** — verify array length is previous ± 1 after optimistic update
    - **Validates: Requirements 4.1, 4.3, 5.1, 5.3, 7.3**

- [x] 2. Create AssignmentIndicator component
  - [x] 2.1 Implement `AssignmentIndicator` component
    - Create `src/components/manage/assignment-indicator.tsx`
    - Accept `activityId` and `onClick` props
    - Call `useAssignments(activityId)` to get assignment data
    - Loading state: render skeleton placeholder (non-interactive)
    - Error state: render dash fallback
    - Count 0: AlertTriangle icon + "0" in amber/muted color
    - Count > 0: Users icon + numeric count
    - Entire cell is clickable (triggers `onClick`)
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.2 Write property test for assignment count accuracy
    - **Property 1: Assignment count accuracy** — generate random-length arrays (0–50), verify displayed count equals array length
    - **Validates: Requirements 1.2, 2.3, 2.5**

- [x] 3. Create AssignmentPopover component
  - [x] 3.1 Implement `AssignmentPopover` component
    - Create `src/components/manage/assignment-popover.tsx`
    - Accept `activityId`, `open`, `onOpenChange` props
    - Use shadcn/ui `Popover` component
    - Fetch members via `useMembers()`, sort alphabetically by `displayName ?? email` (case-insensitive)
    - Cross-reference members with assignments to determine checkbox state
    - Display member's `displayName` if available, fallback to `email`
    - Show search filter input when members > 10 (case-insensitive substring match on name/email)
    - Disable checkbox during in-flight mutation for that member
    - Show inline error if members API fails
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 3.2 Write property test for member list ordering
    - **Property 2: Member list alphabetical ordering** — generate random member lists with mixed null/present displayNames, verify sort order
    - **Validates: Requirements 3.2**

  - [ ]* 3.3 Write property test for checkbox state correctness
    - **Property 3: Checkbox state reflects assignment membership** — generate random member roster + random assignment subset, verify checkbox checked iff userId in assignments
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 3.4 Write property test for search filter visibility
    - **Property 4: Search filter visibility threshold** — generate random member counts (1–100), verify search input rendered iff count > 10
    - **Validates: Requirements 3.6**

  - [ ]* 3.5 Write property test for in-flight disable behavior
    - **Property 7: In-flight mutation disables checkbox** — generate random in-flight states per member, verify disabled attribute matches
    - **Validates: Requirements 5.5, 5.6**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Integrate into ActivitiesPanel
  - [x] 5.1 Add Assigned column to ActivitiesPanel with role gating
    - Modify `src/components/manage/activities-panel.tsx`
    - Import `useProfile` to check current user role
    - Conditionally render "Assigned" column header and cells only for manager/admin roles
    - Hide column entirely while profile is loading (role undetermined)
    - Add "Assigned" header between "Rate Override" and the actions column
    - Render `AssignmentIndicator` in each activity row
    - Manage popover open state (track which activityId has popover open)
    - Render `AssignmentPopover` triggered by indicator click
    - _Requirements: 1.1, 6.1, 6.2, 6.4_

  - [ ]* 5.2 Write unit tests for role-based column visibility
    - Test column renders for manager/admin roles
    - Test column hidden for "user" role
    - Test column hidden while profile is loading
    - Test clicking indicator opens popover
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The `useProfile` hook is already available in the codebase for role checking
- The `useMembers` hook already exists at `src/hooks/use-members.ts`
- shadcn/ui Popover component should be used for the assignment popover
- All API types are already generated in `src/api/schema.d.ts`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4", "3.5", "5.1"] },
    { "id": 3, "tasks": ["5.2"] }
  ]
}
```
