---
inclusion: manual
description: "Living component map — updated as architecture evolves"
---

# Component Context

## Key Components

- **Auth**: Cognito-based, token refresh on 401, memory tokens + stored refreshToken
- **API Client**: openapi-fetch generated from `docs/openapi.json`, typed paths
- **Timer**: Sacred — elapsed derived from server `startTime`, never client tick
- **State**: TanStack Query (server), Zustand (UI-only: timer ticker, modals, selected date)
- **Routing**: React Router v7 library mode, role-guarded routes
- **UI**: shadcn/ui + Tailwind CSS 4, custom color palette system
- **Entries**: Time entries with drag-and-drop ordering (dnd-kit), completion states
- **Tags**: Rate-tagged activities, currency from account level

## Active Constraints / Gotchas

- API rejects milliseconds in ISO timestamps — strip `.SSS` before `Z`
- Single currency per account (denormalized on tags/entries)
- Roles: user → manager → admin (hierarchical, no "owner")
- S3 bucket region: eu-south-2, ACM cert: us-east-1 (CloudFront requirement)
- `npm run api:generate` must run before referencing new endpoints

## Pending / Planned

- Staging environment (`.env.staging`, separate CDK stack)

## Recently Completed

- Color token system — palette hook, `resolveColor`, ColorPicker, activity-color overrides
- Activity ordering & completion — drag-and-drop reordering, mark-as-done, card-flip color picker
