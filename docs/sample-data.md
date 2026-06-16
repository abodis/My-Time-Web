# Sample Data Reference

## Quick Start

```bash
make seed          # Seed or reset sample data (idempotent)
make reset-db      # Full DB nuke + re-seed (drops volumes)
```

## Test Accounts

All accounts use the password: **`password123`**

### Scenario A: Solo Freelancer

| User | Email | UUID | Role |
|------|-------|------|------|
| Alex Rivera | alex@demo.test | `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001` | admin (owner) |

**Account:** Alex's Freelance (`aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa010`) — owner: Alex

### Scenario B: Small Agency (PixelForge)

| User | Email | UUID | Role | Cost Rate | Utilization Target |
|------|-------|------|------|-----------|-------------------|
| Dana Chen | dana@demo.test | `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001` | admin (owner) | $85/hr | 60% |
| Evan Park | evan@demo.test | `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb002` | manager | $70/hr | 75% |
| Faye Okafor | faye@demo.test | `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb003` | user | $55/hr | 85% |
| Gus Moretti | gus@demo.test | `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb004` | user | $50/hr | 80% |
| Alex Rivera | alex@demo.test | `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001` | user | — | — |

**Account:** PixelForge (`bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb010`) — owner: Dana

### Cross-Account Membership

Alex belongs to **two** accounts:
- Alex's Freelance → admin, owner
- PixelForge → user (invited by Dana)

This demonstrates the multi-account model where a user can track time for multiple organizations.

---

## How to Use

### Local server (header-based auth)

Every request (except `/auth/*` and `GET /accounts`) requires the `X-Account-Id` header.

```bash
# Alex working in his own account
curl -H "X-User-Id: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001" \
     -H "X-Account-Id: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa010" \
     http://localhost:8000/projects

# Alex working in PixelForge
curl -H "X-User-Id: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001" \
     -H "X-Account-Id: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb010" \
     http://localhost:8000/timer/current

# Faye in PixelForge
curl -H "X-User-Id: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb003" \
     -H "X-Account-Id: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb010" \
     http://localhost:8000/timer/current

# List accounts for Alex (no X-Account-Id needed)
curl -H "X-User-Id: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001" \
     http://localhost:8000/accounts
```

### Login-based auth (local mock)

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alex@demo.test", "password": "password123"}'
```

---

## Scenario A: Solo Freelancer

Alex is a freelance developer/designer tracking time across client projects.

### Tags (billing rates)

| Tag | Rate | Color |
|-----|------|-------|
| Development | $120/hr | #3B82F6 |
| Design | $100/hr | #8B5CF6 |
| Meetings | $0 | #F59E0B |
| Admin | $0 | #6B7280 |

### Projects

| Project | Client | Billable | Budget | Status |
|---------|--------|----------|--------|--------|
| Acme Corp Website | Acme Corp | ✅ | 80h | ~65% consumed |
| Mobile App MVP | StartupXYZ | ✅ | 120h | ~40% consumed |
| Internal Admin | — | ❌ | — | Ongoing |

### Activities

**Acme Corp Website:**
- Frontend Development → Development tag
- UI Design → Design tag
- Client Calls → Meetings tag

**Mobile App MVP:**
- API Development → Development tag
- App Design → Design tag
- Sprint Planning → Meetings tag

**Internal Admin:**
- Invoicing → Admin tag
- Learning → Admin tag

### What to test
- Budget tracking and burn rate
- Billing rate reports (billable vs non-billable)
- Running timer (active on Frontend Development)
- Time entries filtered by project/tag/date
- Entry notes / journal

---

## Scenario B: Small Agency (PixelForge)

A 4-person agency with role-based access, multiple projects, and financial tracking.

### Tags (billing rates)

| Tag | Rate | Color |
|-----|------|-------|
| Development | $150/hr | #3B82F6 |
| Design | $130/hr | #8B5CF6 |
| QA | $100/hr | #10B981 |
| Project Management | $120/hr | #F97316 |
| Meetings | $0 | #6B7280 |

### Projects

| Project | Client | Billable | Budget | Tag Budgets |
|---------|--------|----------|--------|-------------|
| Enterprise Portal | MegaCorp | ✅ | 400h | Dev 250h, Design 100h, QA 50h |
| Brand Redesign | FreshBrew | ✅ | 160h | Design 120h, Meetings 40h |
| Internal Ops | — | ❌ | — | — |

### Activity Assignments

**Enterprise Portal:**
| Activity | Assigned To |
|----------|-------------|
| Backend API | Evan, Faye |
| Frontend UI | Gus |
| QA Testing | Faye |
| PM Standups | All |

**Brand Redesign:**
| Activity | Assigned To |
|----------|-------------|
| Logo & Identity | Gus |
| Website Mockups | Gus |
| Client Reviews | Evan, Gus |

**Internal Ops:**
| Activity | Assigned To |
|----------|-------------|
| Team Meetings | All |
| Hiring | Dana |
| Tooling | Evan |

### What to test
- Role-based access (admin vs manager vs user)
- Member management and invitations
- Activity assignments (users only see assigned work)
- Cross-user reports and utilization
- Tag budgets per project
- Cost rate vs billable rate (profitability)
- Running timer (active for Faye on Backend API)
- Varying utilization across team members

---

## Data Characteristics

- **History:** 8 weeks of weekday entries (Mon–Fri)
- **Hours/day:** varies by user/role (Alex ~6h, Faye ~7h, Dana ~4h)
- **Entry notes:** ~20% of entries have notes
- **Entry journal notes:** 30 additional notes on select entries
- **Running timers:** 1 per scenario (Alex, Faye)
- **No overlaps:** all entries respect the `no_overlap` constraint
- **Snapshot fields:** billable_rate, cost_rate, tag_name, project_name, activity_name frozen at creation

---

## Re-seeding

The seed script is fully idempotent. It deletes all data belonging to the known seed UUIDs, then re-inserts fresh data with dates relative to "today". Safe to run anytime:

```bash
make seed
```

This does NOT affect any data you created manually with other user IDs.
