# Phase 0 — Foundation: Design

## Overview
Technical design for the Phase 0 foundation scaffold. Covers project structure, API client generation, auth architecture, routing, and app shell.

## References
- #[[file:.kiro/specs/phase-0-foundation/requirements.md]]
- #[[file:.kiro/docs/brainstorms/phase-0-foundation.md]]
- #[[file:docs/openapi.json]]

---

## 1. Project Structure

```
my-time-web/
├── public/
│   └── favicon.ico                 # from Logos/
├── docs/
│   └── openapi.json                # API spec (source of truth)
├── src/
│   ├── api/
│   │   ├── client.ts               # openapi-fetch instance + auth middleware
│   │   └── schema.d.ts             # generated types (do not edit)
│   ├── lib/
│   │   ├── auth.ts                 # token store + refresh logic
│   │   └── query-client.ts         # TanStack Query client config
│   ├── hooks/
│   │   ├── use-auth.ts             # auth mutations (login, register, etc.)
│   │   └── use-profile.ts          # GET /account/me query
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   ├── confirm.tsx
│   │   │   ├── forgot-password.tsx
│   │   │   └── reset-password.tsx
│   │   └── app/
│   │       └── dashboard.tsx       # empty state placeholder
│   ├── components/
│   │   ├── layout/
│   │   │   ├── app-shell.tsx       # sidebar + topbar + outlet
│   │   │   ├── sidebar.tsx
│   │   │   └── topbar.tsx
│   │   ├── auth/
│   │   │   └── auth-layout.tsx     # centered card layout for auth pages
│   │   └── ui/                     # shadcn/ui primitives
│   ├── routes.tsx                  # all route definitions
│   ├── app.tsx                     # providers (QueryClient, Router)
│   ├── main.tsx                    # ReactDOM entry
│   └── index.css                   # tailwind directives + CSS variables
├── .env.development
├── .env.production
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 2. API Client Architecture

### Generation Pipeline
```
docs/openapi.json → openapi-typescript → src/api/schema.d.ts
```

Script in `package.json`:
```json
"api:generate": "openapi-typescript docs/openapi.json -o src/api/schema.d.ts"
```

### Client Instance (`src/api/client.ts`)
```typescript
import createClient from "openapi-fetch";
import type { paths } from "./schema";
import { getAccessToken, refreshAccessToken, clearAuth } from "../lib/auth";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

const client = createClient<paths>({ baseUrl });

// Auth middleware: attach token, handle 401 refresh
client.use({
  async onRequest({ request }) {
    const token = getAccessToken();
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }
    return request;
  },
  async onResponse({ response, request }) {
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry with new token
        request.headers.set("Authorization", `Bearer ${getAccessToken()}`);
        return fetch(request);
      }
      clearAuth();
      window.location.href = "/login";
    }
    return response;
  },
});

export { client };
```

## 3. Auth Module (`src/lib/auth.ts`)

### Token Storage Strategy
- `accessToken` + `idToken`: module-scoped variables (memory only)
- `refreshToken`: localStorage key `mtb_refresh_token`

### Core Functions
```typescript
// Store tokens after login
setTokens(login: { idToken, accessToken, refreshToken }): void

// Get current access token (for interceptor)
getAccessToken(): string | null

// Attempt refresh — called by interceptor on 401
refreshAccessToken(): Promise<boolean>

// Clear all — called on logout or failed refresh
clearAuth(): void

// Check if user has stored refresh token (for route guard initial check)
hasStoredSession(): boolean
```

### Refresh Logic
1. Read `refreshToken` from localStorage
2. Call `POST /auth/refresh` with `{ refreshToken }` (bypasses the auth interceptor)
3. On success: update in-memory `accessToken` + `idToken`, return `true`
4. On failure: call `clearAuth()`, return `false`

## 4. Routing Design

### Route Map
| Path | Component | Guard |
|---|---|---|
| `/login` | LoginPage | public (redirect if authed) |
| `/register` | RegisterPage | public |
| `/confirm` | ConfirmPage | public |
| `/forgot-password` | ForgotPasswordPage | public |
| `/reset-password` | ResetPasswordPage | public |
| `/` | AppShell → Dashboard | protected |

### Guard Implementation
Two wrapper components:
- `<ProtectedRoute>`: checks `hasStoredSession()` → if no session, redirect to `/login`. On mount, attempts silent refresh to validate.
- `<PublicOnlyRoute>`: if user has valid session, redirect to `/`.

### App Load Sequence
1. `main.tsx` renders `<App />`
2. `<App />` provides `QueryClientProvider` + `RouterProvider`
3. Router evaluates guards
4. `<ProtectedRoute>` calls `refreshAccessToken()` → shows loading spinner → resolves to app shell or redirect

## 5. App Shell Layout

```
┌──────────────────────────────────────────┐
│ [Logo]              user@email.com [Out] │  ← Topbar
├────────┬─────────────────────────────────┤
│ Timer  │                                 │
│ Proj.  │     Main Content (Outlet)       │
│ Team   │                                 │
│ Report │                                 │
├────────┴─────────────────────────────────┤
```

- Sidebar: 240px wide, collapsible to icon-only at <768px
- Nav items disabled with "Coming soon" tooltip until their phase ships
- Topbar: flex row, user email from `GET /account/me`, logout button

## 6. Auth Pages Layout

Centered card on a minimal background:
```
┌─────────────────────────────┐
│         [Logo]              │
│  ┌───────────────────────┐  │
│  │  Form Title           │  │
│  │  [fields...]          │  │
│  │  [Submit Button]      │  │
│  │  Link to other page   │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

Each page uses `react-hook-form` + `zod` resolver. Error messages from API displayed below the form.

## 7. Design Tokens (tailwind.config.ts)

```typescript
colors: {
  brand: { DEFAULT: "#2563eb", light: "#3b82f6", dark: "#1d4ed8" },
  surface: { DEFAULT: "#ffffff", muted: "#f8fafc", border: "#e2e8f0" },
  text: { DEFAULT: "#0f172a", muted: "#64748b", inverse: "#ffffff" },
}
fontFamily: {
  sans: ["Inter", "system-ui", "sans-serif"],
}
```

Note: exact brand colors TBD — starting with blue as primary, adjustable via CSS variables.

## 8. TanStack Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 min — reduce refetches for beta
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

## 9. Testing Strategy

- **Vitest**: auth module unit tests (token store, refresh logic with mocked fetch)
- **RTL**: render auth pages, assert form validation
- **Playwright**: single e2e smoke test — register/login/see shell (runs against real API in CI, optional locally)
