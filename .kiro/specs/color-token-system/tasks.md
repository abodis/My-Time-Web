# Implementation Plan

## Overview

Migrate the frontend color system from hardcoded hex values to a token-based system backed by `GET /palette`. Implementation adds a palette hook, color resolution utility, ColorPicker component, and updated mutations — all flowing through the cached palette.

## Tasks

- [x] 1. Create palette types, hook, and color resolution utility
  - [x] 1.1 Create `src/hooks/use-palette.ts` with TanStack Query hook
    - Fetch `GET /palette` unauthenticated (no token middleware)
    - Configure: `staleTime: Infinity`, `gcTime: Infinity`, `retry: 1`, `retryDelay: 2000`
    - Export `Palette`, `ColorShades`, `GreyShades` types
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_
    - **Requirement:** #1
    - **Dependencies:** None

  - [x] 1.2 Create `src/lib/color-utils.ts` with `resolveColor` and `resolveTagColor`
    - Export `ColorToken` type, `SELECTABLE_COLORS` array, `GREY_FALLBACK_HEX` constant
    - `resolveColor(palette, override, tagColor)` → `ResolvedColor { dark, normal, light }`
    - Priority: override → tagColor → "grey"; fallback to `#B2B2B2` when palette undefined
    - `resolveTagColor(palette, tagColor)` → delegates to `resolveColor` with no override
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.5_
    - **Requirement:** #5, #6
    - **Dependencies:** 1.1

  - [x] 1.3 Write property tests for `resolveColor` (Property 6: Color resolution priority and shade correctness)
    - **Property 6: Color resolution priority and shade correctness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 6.1, 6.2, 6.3**
    - Generate arbitrary palettes, override tokens, and tag color tokens with fast-check
    - Assert resolved token is first non-null of override → tagColor → "grey"
    - Assert each shade matches `palette[resolvedToken].<shade>`
    - **Requirement:** #5, #6
    - **Dependencies:** 1.2

  - [x] 1.4 Write property test for palette unavailable fallback (Property 7: Palette unavailable fallback)
    - **Property 7: Palette unavailable fallback**
    - **Validates: Requirements 6.5**
    - For any combination of override and tagColor, when palette is undefined, all three shades return `#B2B2B2`
    - **Requirement:** #6
    - **Dependencies:** 1.2

- [x] 2. Implement ColorPicker component
  - [x] 2.1 Create `src/components/tags/color-picker.tsx`
    - Render 7 circular swatches using `palette[token].normal` as background
    - Show checkmark overlay on selected swatch (accessible without relying on color alone)
    - Accept `value: ColorToken | null`, `onChange: (token: ColorToken) => void`, `disabled?: boolean`
    - Disable interaction when palette is loading
    - Do not include grey as selectable option
    - Emit lowercase token string on selection
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
    - **Requirement:** #2
    - **Dependencies:** 1.1, 1.2

  - [x] 2.2 Write property test for swatch fill colors (Property 1: Swatch fill colors match palette)
    - **Property 1: Swatch fill colors match palette**
    - **Validates: Requirements 2.2**
    - For any valid palette, each swatch background matches `palette[token].normal`
    - **Requirement:** #2
    - **Dependencies:** 2.1

  - [x] 2.3 Write property test for selection indicator (Property 2: Exactly one selection indicator)
    - **Property 2: Exactly one selection indicator**
    - **Validates: Requirements 2.3**
    - For any selected token, exactly one swatch shows the indicator and it matches the selected token
    - **Requirement:** #2
    - **Dependencies:** 2.1

  - [x] 2.4 Write property test for value round-trip (Property 3: ColorPicker value round-trip)
    - **Property 3: ColorPicker value round-trip**
    - **Validates: Requirements 2.6, 2.7**
    - For any token passed as `value`, that swatch is selected; for any click, `onChange` receives that exact token
    - **Requirement:** #2
    - **Dependencies:** 2.1

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - **Requirement:** #1, #2
  - **Dependencies:** 1.3, 1.4, 2.2, 2.3, 2.4

- [x] 4. Implement tag mutations with token names
  - [x] 4.1 Add `useCreateTag` and `useUpdateTag` mutations to `src/hooks/use-tags.ts`
    - Send `color` field as lowercase token string in `POST /tags` and `PUT /tags/{id}`
    - On 400 with type `invalid_color`, surface error to form
    - Invalidate `["tags"]` query on success
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
    - **Requirement:** #3
    - **Dependencies:** 1.2

  - [x] 4.2 Write property test for tag mutations (Property 4: Tag mutations send token names only)
    - **Property 4: Tag mutations send token names only**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - For any ColorToken, the request body `color` field is a plain lowercase string from the allowed set and never matches `/#[0-9a-fA-F]{3,8}/`
    - **Requirement:** #3
    - **Dependencies:** 4.1

- [x] 5. Implement activity color override mutation
  - [x] 5.1 Create `src/hooks/use-activity-colors.ts` with `useUpdateActivityColor`
    - Send `PATCH /settings/activity-colors` with `{ colors: { [activityId]: token } }`
    - On 400 `invalid_color`, show error and do not update local state
    - On 200, invalidate `["settings"]` query
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
    - **Requirement:** #4
    - **Dependencies:** 1.2

  - [x] 5.2 Write property test for activity override request structure (Property 5: Activity override request structure)
    - **Property 5: Activity override request structure**
    - **Validates: Requirements 4.1, 4.2**
    - For any activityId and ColorToken, the request body is `{ colors: { "<activityId>": "<token>" } }` with token as plain lowercase string
    - **Requirement:** #4
    - **Dependencies:** 5.1

- [x] 6. Integrate palette loading and error states into app shell
  - [x] 6.1 Add palette loading gate in app initialization
    - Show loading state while palette fetch in progress
    - On double failure, show full-screen error with retry button
    - Retry button re-triggers the fetch sequence
    - _Requirements: 1.4, 1.5, 1.6_
    - **Requirement:** #1
    - **Dependencies:** 1.1

  - [x] 6.2 Replace `src/lib/tag-colors.ts` usage with palette-based resolution
    - Update all existing consumers of `BLOCK_COLORS` / `getBlockColor` to use `resolveColor` with cached palette
    - Remove hardcoded hex values for token colors
    - _Requirements: 5.4, 6.1, 6.2_
    - **Requirement:** #5, #6
    - **Dependencies:** 1.2, 6.1

- [x] 7. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - **Requirement:** #1, #2, #3, #4, #5, #6
  - **Dependencies:** 4.2, 5.2, 6.2

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The existing `src/lib/tag-colors.ts` with hardcoded hex values will be superseded by palette-based resolution in task 6.2

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "1.4", "2.1", "4.1", "5.1", "6.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "4.2", "5.2", "6.2"] }
  ]
}
```
