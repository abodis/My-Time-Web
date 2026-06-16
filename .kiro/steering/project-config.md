---
inclusion: always
description: "Project-specific configuration"
---

# Project Config

## Cloud
- Profile: mcp
- Region: eu-south-2
- Hosting: S3 + CloudFront (static SPA)
- Naming: my-time-web-[resource]-[env]
- CDK: `infra/` directory (Python, single stack per env)
- Python env: pyenv-virtualenv (auto-activates via .python-version, never use `source .venv/bin/activate`)

## Build
- Dev: `npm run dev`
- Build: `npm run build` (tsc + vite build)
- Test: `npm run test` (vitest --run)
- Lint: `npm run lint`
- API types: `npm run api:generate`
- Deploy: `./deploy.sh prod` (build + cdk + s3 sync + CF invalidation)

## Environments
- Development: `.env.development` (local Vite dev server, proxies `/api` to backend)
- Production: `.env.production` (deployed build, hits live API)
- Staging (future): `.env.staging` (will hit staging API)

## Backend (reference)
- API: `https://api.mytimeblocks.app` (production)
- Raw API: `https://ioxrzx7f9h.execute-api.eu-south-2.amazonaws.com`
- Auth: Cognito (`my-time-user-pool`)
- DB: PostgreSQL 15 (RDS, private subnet)
- Backend repo deploys separately via its own CDK stack (`MyTimeStack`)
- OpenAPI spec: `docs/openapi.json` (source of truth for generated types)
