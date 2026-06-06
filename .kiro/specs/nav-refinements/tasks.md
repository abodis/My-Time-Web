# Implementation Plan

## Overview

Implement navigation refinements: create MD5/Gravatar utilities, rewrite PillNav with user section + updated positioning/width + full-width mobile bar, simplify AppShell by removing UserActions rendering, and delete the orphaned UserActions component.

## Tasks

- [ ] 1. Create utility modules
  - [ ] 1.1 Create `src/lib/md5.ts` — inline MD5 hash implementation
    - Export `md5(input: string): string` returning 32-char lowercase hex
    - Pure JS implementation (no external dependencies), based on RFC 1321
    - _Requirements: 3.2_
    - **Dependencies:** None

  - [ ] 1.2 Create `src/lib/gravatar.ts` — Gravatar URL utility
    - Export `getGravatarUrl(email: string, size?: number): string`
    - Normalize email: `email.trim().toLowerCase()` before hashing
    - Return URL format: `https://www.gravatar.com/avatar/{md5hash}?s={size}&d=mp`
    - Default size = 80
    - _Requirements: 3.2_
    - **Dependencies:** 1.1

  - [ ]* 1.3 Write property tests for MD5 and Gravatar utilities
    - **Property 1: Gravatar URL generation is deterministic and well-formed**
    - **Property 2: Gravatar URL is case-insensitive and whitespace-insensitive**
    - **Property 3: MD5 round-trip consistency**
    - **Validates: Requirements 3.2**
    - **Dependencies:** 1.1, 1.2

- [ ] 2. Rewrite PillNav component
  - [ ] 2.1 Rewrite `src/components/layout/pill-nav.tsx` with full implementation
    - Import `useNavigate` from react-router-dom, `LogOut` from lucide-react, `useProfile`, `clearAuth`, `getGravatarUrl`
    - Add `handleLogout` function: calls `clearAuth()` then `navigate('/login')`
    - Compute `gravatarUrl` from profile email when available
    - **Desktop nav changes (≥1440px):**
      - Replace `left-8` with `wide:left-[calc(50vw-576px)] ultrawide:left-[calc(50vw-666px)]`
      - Add `w-[252px]` for 150% width increase
      - After nav items: add divider (`my-2 h-px bg-surface-border`)
      - Add user section: Gravatar image (h-10 w-10 rounded-full) + firstName text
      - Add logout button styled like nav items (icon + "Logout" label)
      - Hide Gravatar + firstName when profile is unavailable; always show logout
    - **Mobile nav changes (<1440px):**
      - Remove `rounded-2xl`, `mx-auto`, `justify-center`
      - Add `w-full justify-between`
      - Wrap nav items in left-aligned flex container
      - Add right-aligned user area: Gravatar image + logout icon button (no text)
      - Hide Gravatar when profile email unavailable; always show logout icon
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.2, 5.3_
    - **Dependencies:** 1.2

- [ ] 3. Simplify AppShell
  - [ ] 3.1 Update `src/components/layout/app-shell.tsx`
    - Remove `UserActions` import
    - Remove mobile `<UserActions className="ml-auto wide:hidden" />` from nav wrapper
    - Remove desktop `<UserActions />` wrapper div from main content
    - Remove `flex items-center` and `px-4 wide:px-0 py-1 wide:py-0` from nav wrapper (no longer needed for side-by-side layout)
    - Keep `sticky top-0 z-50 wide:static wide:z-auto wide:block` on nav wrapper
    - Remove the `hidden wide:flex justify-end pb-4` desktop UserActions container div
    - _Requirements: 5.1, 3.6, 4.6_
    - **Dependencies:** 2.1

  - [ ] 3.2 Delete `src/components/layout/user-actions.tsx`
    - File is no longer imported anywhere after AppShell update
    - _Requirements: 5.1_
    - **Dependencies:** 3.1

- [ ] 4. Final checkpoint
  - Ensure `npm run build` succeeds with no TypeScript errors
  - Ensure `npm run lint` passes
  - Ensure all tests pass via `npm run test`
  - Ask the user if questions arise
  - **Dependencies:** 3.2

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The ordering constraint (md5 → gravatar → PillNav → AppShell → delete) is enforced via dependencies and waves
- Property tests validate the MD5/Gravatar utilities' correctness properties from the design doc
- The `wide:` breakpoint corresponds to ≥1440px per the project's Tailwind config
- No new external dependencies needed — MD5 is implemented inline

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "2.1"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2"] }
  ]
}
```
