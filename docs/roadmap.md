# My Time Blocks — Roadmap

*Snapshot: August 2026. Living document — update as decisions are made.*

---

## Current State

The web app covers the full daily workflow: **track → manage → report**. Phases 0–3 of the architecture plan are complete and deployed to production at `app.mytimeblocks.app`.

### What's Shipped

| Area | Status | Summary |
|------|--------|---------|
| Auth | ✅ Done | Register, confirm, login, forgot/reset password, token refresh, route guards |
| Timer & Tracker | ✅ Done | Activity grid, one-tap start/stop, server-derived elapsed, rehydration on load, 409 handling |
| Entries | ✅ Done | Date-range list, manual CRUD, notes |
| Multi-Account | ✅ Done | Account picker, switcher, `X-Account-Id` injection, error interceptor |
| Projects | ✅ Done | CRUD, archive, tabbed edit (Details / Budget / Activities) |
| Activities | ✅ Done | CRUD, tag selection, rate overrides, drag-and-drop reorder, mark done, color overrides (flip card) |
| Tags | ✅ Done | CRUD with API-driven color palette, token-based colors |
| Team | ✅ Done | Member list, invite, edit role/cost/utilization, remove (admin-only), RoleGuard |
| Assignments | ✅ Done | Manager/admin assign members to activities, optimistic toggle, 409 handling |
| Reports | ✅ Done | My Time (personal), Project Budget (manager+), Financial (admin), period selection |
| Infrastructure | ✅ Done | S3 + CloudFront, CDK stack, deploy script, CI-ready |

### Not Yet Built

- Account settings page (name, currency editing)
- Avatar upload (endpoint exists, no UI)
- Pagination on list endpoints
- Offline/PWA (Phase 5 — deferred pending beta feedback)
- Server-side aggregate/report endpoints (client-side aggregation for now)

---

## Feature Enhancements (Near-Term)

Improvements that reduce daily friction for existing users. Small scope, high frequency impact.

| # | Enhancement | Rationale |
|---|-------------|-----------|
| 1 | **Quick-switch timer** — tap another activity while running to auto-stop + start | Eliminates stop-then-start double tap. API already supports it. |
| 2 | **Keyboard shortcuts on tracker** — `1`–`9` start activity, `Space` stop, `E` open entries | Power users track dozens of blocks/day. |
| 3 | **Running timer in browser tab title** — `▶ 01:42:31 — Activity Name` | Glanceable without switching tabs. |
| 4 | **Favorite/pin activities** — pin top 3–5 to always appear first | Not all assigned activities are equally frequent. |
| 5 | **Inline entry editing** — click-to-edit duration/notes in entries table | Faster than modal for bulk corrections. |
| 6 | **Empty state onboarding** — contextual prompt when tracker is empty | Reduces first-time user confusion. |
| 7 | **Forgotten timer notification** — optional browser alert after X hours | Catches inflated entries before they happen. |
| 8 | **Account settings page** — edit account name, currency | API exists, needs UI. |
| 9 | **Avatar upload** — profile picture from settings | Endpoint wired, no frontend yet. |

---

## Ideas (Exploratory)

Bigger bets that could change positioning or expand the product's reach. Not committed — evaluate based on beta feedback and business goals.

| # | Idea | What It Would Mean |
|---|------|-------------------|
| 1 | **AI timesheet assistant** | End-of-day prompt suggests entries for untracked gaps based on calendar/patterns. Turns passive gaps into data. |
| 2 | **Focus mode / Pomodoro** | Activity blocks become focus sessions with countdown + break prompts. Tracker becomes a productivity tool. |
| 3 | **Slack/Teams bot** | `/mytime start "Client call"` — control timer from where people work. Push notifications for forgotten timers. |
| 4 | **Client-facing project dashboard** | Read-only branded portal showing budget burn in real time. Replaces "where are my hours?" emails. |
| 5 | **Voice timer (Siri/Google Assistant)** | "Start My Time on client presentation." Removes app-opening friction entirely. |
| 6 | **Predictive scheduling** | Suggest tomorrow's activity blocks based on historical patterns + remaining budget. Reactive → proactive. |
| 7 | **Multi-device handoff** | Timer starts on laptop, phone shows persistent notification. Tap to stop. Server timer supports it — needs PWA + push. |
| 8 | **Team dashboard / live pulse** | Who's tracking right now, total team hours today, idle alerts for managers. Real-time team visibility. |
| 9 | **CSV/PDF export** | Export entries and reports for invoicing and external tools. Table stakes for billing teams. |
| 10 | **Custom report builder** | Drag-and-drop dimensions (project × tag × user × period) to build ad-hoc views. Replaces spreadsheet exports. |

---

## Maintainability Backlog

Technical improvements that don't change user-facing behavior but reduce future cost.

| # | Item | Impact |
|---|------|--------|
| 1 | **Query key factory** (`queryKeys.ts`) | Eliminates string-literal drift across 20+ hooks |
| 2 | **Centralized optimistic update helper** | Reduces mutation boilerplate, ensures silent-throw guard |
| 3 | **Per-route error boundaries** | Crash in reports doesn't kill tracker |
| 4 | **Type-safe route paths** | Prevents broken `<Link>` references as pages grow |
| 5 | **API response envelope adapter** | One-file change when pagination lands, not twenty hooks |
| 6 | **Bundle analysis** | Ensure management deps don't leak into tracker critical path |

---

## Decision Log Reference

Architectural decisions and gotchas are tracked in `.kiro/steering/decisions.md`. Consult before making changes to: timer logic, color system, drag-and-drop, optimistic updates, or Tailwind 4 CSS variables.

---

## How to Use This Document

1. **Before starting a feature** — check if it's listed here, note any dependencies or sequencing.
2. **After shipping** — move from Enhancement/Idea → Current State table, add date.
3. **When deprioritizing** — note why in a comment, don't delete. Context is cheap.
4. **Quarterly** — review Ideas section against actual user feedback. Promote or archive.
