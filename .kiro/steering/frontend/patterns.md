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
