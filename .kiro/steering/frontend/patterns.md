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
