---
inclusion: fileMatch
fileMatchPattern: "src/**"
description: "React and component patterns for the frontend"
---

# Frontend Patterns

## Components
- Functional only. No class components.
- Props via interface, not type alias. Export interface if consumed externally.
- Destructure props in signature.
- Co-locate component + styles. No separate CSS files (Tailwind handles it).
- shadcn/ui for primitives — copy into `src/components/ui/`, own the code.

## State Management
- Server state: TanStack Query (`useQuery`, `useMutation`). Never `useState` for API data.
- UI state: Zustand store for cross-component UI (timer tick, modals). Local `useState` for component-scoped UI.
- Form state: react-hook-form. Never controlled inputs with `useState`.

## Zustand in Effects
- NEVER put the whole store (`useMyStore()`) in useEffect/useCallback dependency arrays — causes infinite loops.
- Use selectors for reactive reads: `useMyStore((s) => s.value)`
- Use `getState()` for imperative calls in effects/callbacks: `useMyStore.getState().action()`
- Actions called via `getState()` don't need to be in dependency arrays.

## API Layer
- All API calls via generated `openapi-fetch` client in `src/api/client.ts`.
- Never hand-write fetch calls or type API responses.
- Query keys: `[resource, ...params]` — e.g., `['entries', { from, to }]`.
- Mutations invalidate relevant query keys on success.
- For optional boolean query params (like `includeArchived`): pass `true` when on, `undefined` when off. Don't send `false` — let the API use its default.
- Use `placeholderData: (prev) => prev` when query keys change to avoid flash of empty state.

## CSS Variable Colors (Tailwind 4)
- NEVER use bare `bg-primary`, `text-primary`, `ring-primary` etc. — they don't resolve to `:root` CSS variables in this Tailwind 4 setup.
- ALWAYS use bracket syntax: `bg-[hsl(var(--primary))]`, `text-[hsl(var(--destructive))]`, `ring-[hsl(var(--ring))]`.
- This matches how all existing shadcn components reference theme colors.
- For opacity: `bg-[hsl(var(--primary))]/90`.
- Exception: custom `@theme` colors like `bg-brand`, `text-text-muted`, `bg-surface-muted` work fine — they're defined as `--color-*` tokens.

## Color System
- `--primary` (green `#16a34a`, HSL `142.1 76.2% 36.3%`) = action buttons, switches, confirmations.
- `--color-brand` (blue `#2563eb`) = nav active highlight, brand accent. Separate from primary.
- `--destructive` (red) = error states, destructive actions.
- Never use raw color classes (`bg-green-600`, `bg-blue-500`) for themed elements — always go through CSS variables.

## Imports
- Always import from `react-router-dom`, never bare `react-router`.
- Always import from `zod/v4`, never bare `zod`.

## Auth Pattern
- Tokens stored: access + id in memory (Zustand), refresh in localStorage.
- `src/lib/auth.ts` handles token storage, refresh logic, logout cleanup.
- API client middleware auto-attaches access token, auto-refreshes on 401.
- Protected routes via `<ProtectedRoute>` wrapper checking auth state.

## Routing
- React Router v7, library mode (not framework mode).
- Route definitions in `src/routes.tsx`.
- Lazy load page components for code splitting.
- Auth pages under `/auth/*`, app pages under `/app/*`.

## Error Handling
- TanStack Query `onError` for API errors.
- Global error boundary at app root for crashes.
- 401 → auto-refresh → retry once → logout if still failing.
- 409 on timer start → show "timer already running" state, not error toast.

## Layout & Alignment

### Content-Nav Alignment
- AppShell main content uses `wide:pt-6` to align with PillNav's `top-6` fixed position.
- ALL page wrappers must use `p-6 wide:pt-0` — the shell handles top alignment on wide, pages only provide mobile top padding.
- This applies to every page (tracker, entries, projects, etc.), not just management pages.

### Universal Card Styling
- All content cards: `rounded-2xl bg-white shadow-lg` — same elevation as nav card.
- Never use `shadow-sm` or `shadow-md` for content cards. `shadow-lg` is the single elevation level.
- Consistent internal padding: `p-6`.

### Spacing Principles
- When stacking related elements with different logical groupings, use explicit margins (`mt-4`, `mt-1`) not `space-y-*`. This gives precise control over visual hierarchy.
- Tightly related items (title + subtitle): `mt-1` (4px gap).
- Loosely related items (back link → title): `mt-4` (16px gap).
- Sections: `gap-6` between distinct content blocks.

## Dropdowns & Popovers
- Any dropdown that opens on click MUST close on outside click.
- Pattern: `useRef` on container + `useEffect` with `document.addEventListener("mousedown", ...)` when open.
- Clean up listener on close or unmount.
- For multi-step popovers (e.g., date range pickers requiring two clicks), use `<Popover modal>` to prevent Radix from closing on intermediate interactions.
- react-day-picker v9 range mode: `onSelect` fires on EVERY click with `{ from, to }` — on first click both are the same date. Only treat as complete range when `from.getTime() !== to.getTime()`.

## Visual Verification
- For any UI styling change, verify with a Playwright screenshot before claiming it's done — do not edit CSS blind.
- Login for local testing: alex@demo.test / password123
- Playwright MCP writes screenshots only to /tmp/.playwright-mcp; copy into `test-screenshots/` (gitignored) to view.
- Dev server may run on 5174 if 5173 is taken — check process output for the actual port.
- When matching a reference mockup, compare side by side: tag shape, text sizes, spacing, and that nothing overflows the container.

## Activity Block Visual Spec
- True square via wrapper `padding-bottom: 100%` + `absolute inset-0` inner button.
- Layout (top→bottom, left-aligned): pill tag badge (rounded-full) → project name (text-sm, ~75% opacity) → activity name (text-2xl bold, line-clamp-2) → timer (text-4xl bold font-mono tracking-tight, mt-auto).
- text-4xl is the max timer size that fits a 4-column block without overflow; text-5xl clips.
- Running state: bg = color.dark, text = color.light, badge inverts (light bg, dark text).
- Idle state: bg = color.light, text = color.dark, badge = dark bg + white text.
- Elapsed display = accumulated duration from today's completed entries + live timer elapsed (if running). Never show 0 for a stopped activity that has entries today.

## Fixed-Position Centering
- To center a fixed element within a horizontal zone: set `left` to the zone's midpoint, then apply `-translate-x-1/2`.
- Formula: `left: calc(zoneStart + zoneWidth/2)` + `transform: translateX(-50%)`
- Always verify positioning with Playwright measurements (`getBoundingClientRect`) before iterating on calc formulas.

## CSS 3D Flip Card Layout
- Front face must be `relative` (not `absolute inset-0`) so it defines the container's intrinsic height.
- Only the back face uses `absolute inset-0` to overlay.
- Both faces need `backface-visibility: hidden`.
- If both faces are absolute, the container collapses to 0 height since nothing provides intrinsic dimensions.

## Activity Color Overrides
- Per-activity color overrides are stored in `GET /settings/activity-colors` (returns `Record<activityId, colorToken>`).
- They are NOT part of the `EnrichedActivityItem` response.
- When resolving card colors, pass the override as the second param: `resolveColor(palette, activityColorOverrides?.[activity.id], tagColor)`.
- After `PATCH /settings/activity-colors`, invalidate `["settings", "activity-colors"]` to trigger re-render.

### Optimistic Updates with getQueriesData
- `getQueriesData({ queryKey: ["resource"] })` matches ALL queries starting with that prefix (e.g. `["activities"]` matches both `["activities", { includeDone }]` and `["activities", projectId]`).
- Always guard the data shape before accessing nested properties: `if (!data || !data.activities || !data.meta) return`.
- If `onMutate` throws, TanStack Query silently skips `mutationFn` — no API call is made and no error is logged to console.

## Drag-and-Drop State Sync
- When syncing local `items` state with query data via render-time comparisons (`if (items !== queryIds) setItems(queryIds)`), always guard with `!isDragActive`.
- Without this guard, `onDragOver` → `setItems(move(...))` triggers a re-render where the sync block immediately resets items to the original order, making `handleDragEnd` compute an empty payload (no change detected → no API call).
- Pattern: `if (!isDragActive && items !== queryIds) setItems(queryIds)`
