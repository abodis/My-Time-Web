# Phase 0 — Foundation: Requirements

## Overview
Scaffold the My Time Blocks web application foundation: Vite + React 18 + TypeScript project with generated API client, design system, complete authentication flow, route guards, and app shell. No user-facing features beyond auth — this is infrastructure for Phases 1–5.

## References
- #[[file:docs/Web App - Architecture & Build Plan.md]]
- #[[file:docs/openapi.json]]
- #[[file:.kiro/docs/brainstorms/phase-0-foundation.md]]

## Requirements

### Requirement 1: Project Scaffold & Tooling
**User Story:** As a developer, I need a working Vite + React + TypeScript project with all dependencies installed so that I can build features on a solid foundation.

**Acceptance Criteria:**
- Vite project with React 18 + TypeScript (strict mode) + SWC
- All dependencies installed: react-router v7, @tanstack/react-query, zustand, tailwindcss, react-hook-form, zod, openapi-typescript, openapi-fetch
- Dev tooling: vitest, @testing-library/react, playwright, eslint, prettier
- `npm run dev` starts without errors
- `npm run build` produces static output in `dist/`
- TypeScript strict mode enabled, compiles clean

### Requirement 2: Design System & Tokens
**User Story:** As a developer, I need a consistent design token system and component library so that all future UI is visually cohesive without ad-hoc styling decisions.

**Acceptance Criteria:**
- Tailwind CSS configured with custom tokens (colors, spacing, type scale)
- shadcn/ui initialized with base components (Button, Input, Card, Form, Label)
- Brand logo (`favicon.ico`, nav logo) integrated into the app
- Light theme only; CSS variables structured to support dark mode later
- Base font and spacing render correctly in the shell

### Requirement 3: Generated API Client
**User Story:** As a developer, I need a type-safe API client generated from the OpenAPI spec so that frontend/backend contract stays in sync automatically.

**Acceptance Criteria:**
- `openapi-typescript` generates types from `docs/openapi.json` into `src/api/schema.d.ts`
- `openapi-fetch` client instance created with typed paths
- API base URL sourced from `VITE_API_BASE_URL` environment variable
- `.env.development` set to `http://localhost:8000`
- `.env.production` set to `https://ioxrzx7f9h.execute-api.eu-south-2.amazonaws.com`
- npm script `api:generate` regenerates types from spec

### Requirement 4: Authentication Module
**User Story:** As a user, I need to register, confirm my account, log in, and recover my password so that I can access the application securely.

**Acceptance Criteria:**
- Token store: `accessToken` and `idToken` in memory; `refreshToken` in localStorage
- Fetch interceptor: attaches `Authorization: Bearer <accessToken>` to all protected requests
- Auto-refresh: on 401 response, calls `/auth/refresh` with stored refreshToken, retries original request once
- If refresh fails (e.g., expired refreshToken), clear tokens and redirect to `/login`
- Logout clears all tokens from memory and localStorage

### Requirement 5: Auth Pages (UI)
**User Story:** As a user, I need registration, login, and password recovery pages so that I can manage my account access.

**Acceptance Criteria:**
- **Register page** (`/register`): email + password fields, zod validation (email format, password min 8 chars), submits to `POST /auth/register`, on success navigates to confirm page
- **Confirm page** (`/confirm`): email + code fields, submits to `POST /auth/confirm`, on success navigates to login
- **Login page** (`/login`): email + password fields, submits to `POST /auth/login`, stores tokens, navigates to app
- **Forgot Password page** (`/forgot-password`): email field, submits to `POST /auth/forgot-password`, navigates to reset page
- **Reset Password page** (`/reset-password`): email + code + new password fields, submits to `POST /auth/reset-password`, on success navigates to login
- All pages show API error messages (e.g., "User already exists", "Invalid code")
- Logo displayed on auth pages

### Requirement 6: Routing & Guards
**User Story:** As a user, I should be automatically redirected to login when unauthenticated, and to the app when already logged in, so navigation is seamless.

**Acceptance Criteria:**
- Protected routes: `/` and all `/app/*` paths require valid auth token
- Public routes: `/login`, `/register`, `/confirm`, `/forgot-password`, `/reset-password`
- Unauthenticated access to protected route → redirect to `/login`
- Authenticated access to auth pages → redirect to `/`
- On app load: check for existing refreshToken → attempt silent refresh → render app or redirect to login

### Requirement 7: App Shell
**User Story:** As a logged-in user, I need a consistent layout with navigation so that I can orient myself in the application.

**Acceptance Criteria:**
- Sidebar with logo and nav links (items empty/disabled for future phases: Timer, Projects, Team, Reports)
- Top bar showing current user's email and a logout button
- Main content area renders child routes
- Empty state in main area: "Welcome to My Time Blocks" with brief message
- Responsive: sidebar collapses on mobile widths
- Current user data fetched from `GET /account/me` on app load

### Requirement 8: Testing & Build
**User Story:** As a developer, I need test infrastructure and a production build so that I can validate changes and deploy.

**Acceptance Criteria:**
- Vitest configured with React Testing Library
- At least one smoke test: auth module refresh logic
- Playwright configured (test: login → see app shell)
- `npm run build` produces optimized static files
- Build output is a self-contained SPA (all routes resolve to `index.html`)
