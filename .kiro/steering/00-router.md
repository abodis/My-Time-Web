---
inclusion: always
description: "Steering file index and router"
---

# Steering Router

## Always Loaded
- **00-router.md** (this file)
- **01-common.md** — project conventions

## Knowledge (Manual Inclusion)
- **decisions.md** (manual) — dated decisions, gotchas, resolved issues
- **context.md** (manual) — living component map, active constraints, pending work

## Global (from ~/.kiro/steering/)
- **coding-discipline.md** (always) — think, simplify, be surgical, verify
- **caveman-lite.md** (always) — terse responses, no fluff
- **knowledge-ops.md** (always) — knowledge compounding protocol

## Frontend
- **frontend/patterns.md** (fileMatch: `src/**`) — React/component patterns
- **frontend/testing.md** (fileMatch: `**/*.test.*`, `**/*.spec.*`) — test conventions
- **frontend/dnd-kit.md** (fileMatch: `src/**/*dnd*,*sortable*,*drag*`) — @dnd-kit/react patterns
- **frontend/management-pages.md** (fileMatch: `src/pages/app/**,src/components/manage/**`) — CRUD page patterns

## Infrastructure
- **aws-management.md** (always) — AWS profiles, deployment, tagging
- **project-config.md** (always) — build/deploy commands, environments
- **color-palette.md** (auto) — color token reference values

## Agent Config
- **kiro-agents/task-dispatch.md** — sub-agent bash rules, API type generation

## Reference Docs
- `docs/openapi.json` — API contract, single source of truth
- `docs/Web App - Architecture & Build Plan.md` — phases, decisions, rules
- `docs/My Time Blocks - Application Summary.md` — product context

## Compound Engineering Workflow

Brainstorm → Plan → Work → Review → Reflect
80% planning and review, 20% execution.
