# Sample Data

Run locally: `python3 scripts/seed_data.py`
Run on cloud: `make deploy-seed` (or invoke `my-time-seed` Lambda directly)

**Passwords:**
- Local: `password123`
- Production (Cognito): `Password123!`

## Scenario A — Solo Freelancer

**User:** Alex Rivera (`alex@demo.test`)
**Account:** Alex's Freelance (`aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa010`)
**Role:** admin (owner)
**Cost rate:** $65/h

### Tags
| Tag | Color | Billable Rate |
|-----|-------|---------------|
| Development | blue | $120/h |
| Design | purple | $100/h |
| Meetings | yellow | $0 |
| Admin | — | $0 |

### Projects

| Project | Client | Status | Budget | Start | End |
|---------|--------|--------|--------|-------|-----|
| Acme Corp Website | Acme Corp | ~60% through | 120h | -10 weeks | +4 weeks |
| StartupXYZ App | StartupXYZ | Just started | 200h | -2 weeks | +10 weeks |
| Internal Admin | — | Ongoing, non-billable | — | — | — |

**Acme Corp Website** — Main project. Design wrapping up (ramp_down curve), frontend dev peaking (bell curve), client calls steady. Budget split: Dev 70h, Design 35h, Meetings 15h.

**StartupXYZ App** — Recently kicked off. Only ~10h recorded. All activities ramping up. Budget split: Dev 130h, Design 50h, Meetings 20h.

**Internal Admin** — Non-billable overhead. Invoicing and learning. Low constant volume.

### Running Timer
Alex has a timer running on "Frontend Development" (Acme Corp Website), started 25 min before seed time.

---

## Scenario B — PixelForge Agency

**Account:** PixelForge (`bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb010`)

### Team

| User | Email | Role | Cost Rate | Utilization Target | Capacity |
|------|-------|------|-----------|-------------------|----------|
| Dana Chen | dana@demo.test | admin (owner) | $85/h | 60% | 40h/wk |
| Evan Park | evan@demo.test | manager | $70/h | 75% | 40h/wk |
| Faye Okafor | faye@demo.test | user | $55/h | 85% | 40h/wk |
| Gus Moretti | gus@demo.test | user | $50/h | 80% | 35h/wk |
| Alex Rivera | alex@demo.test | user (cross-account) | $65/h | — | — |

### Tags
| Tag | Color | Billable Rate |
|-----|-------|---------------|
| Development | blue | $150/h |
| Design | purple | $130/h |
| QA | green | $100/h |
| Project Management | orange | $120/h |
| Meetings | — | $0 |
| Marketing | red | $110/h |

### Projects

#### 1. Mobile Checkout Redesign — RECENTLY STARTED
- **Client:** ShopFlow
- **Budget:** 200h (Dev: 120h, Design: 50h, PM: 30h)
- **Timeline:** Started 2 weeks ago → ends in 10 weeks
- **Recorded:** ~15-20h total
- **Story:** Kicked off recently. Discovery calls done, initial UX prototyping started, dev spike underway.
- **Assignments:** Evan + Faye (Checkout API), Gus (UX Prototyping), Dana (Discovery & Planning)

#### 2. Enterprise Portal — 60% THROUGH, TAG VARIANCE
- **Client:** MegaCorp
- **Budget:** 500h (Dev: 300h, Design: 100h, QA: 60h, PM: 40h)
- **Timeline:** Started 10 weeks ago → ends in 6 weeks
- **Recorded:** ~300h total (60% of budget)
- **Tag variance:**
  - Design: ~90% consumed (ramp_down — nearly complete)
  - Development: ~55% consumed (bell curve — peak phase)
  - QA: ~35% consumed (ramp_up — accelerating as dev delivers)
  - PM: ~60% consumed (linear — steady throughout)
- **Story:** Classic mid-lifecycle project. Design phase wrapping, dev in full swing, QA ramping.
- **Assignments:** Evan + Faye (Backend API), Faye + Gus (Frontend Build), Gus (UI/UX Design), Faye + Evan (QA), Dana (Project Coordination)

#### 3. Brand Campaign Site — OVER BUDGET (scope creep)
- **Client:** FreshBrew
- **Budget:** 160h (Dev: 80h, Design: 60h, Meetings: 20h)
- **Timeline:** Started 8 weeks ago → ends in 2 weeks
- **Recorded:** ~175h+ total (OVER BUDGET)
- **Tag variance:**
  - Development: ~90h consumed vs 80h budget (112% — OVER)
  - Design: ~69h consumed vs 60h budget (115% — slightly over)
  - Meetings: ~58h consumed vs 20h budget (290% — WAY OVER, scope creep)
  - Marketing: ~7h consumed, NO budget (unplanned scope)
- **Story:** Client kept requesting changes. Meetings ballooned from endless revision cycles. Marketing work added mid-project with no budget allocation. Financial report shows margin squeeze.
- **Assignments:** Evan + Faye (Site Development), Gus (Visual Design), Dana + Gus (Client Reviews), Dana (Campaign Setup)

#### 4. Internal Ops — NON-BILLABLE
- **Budget:** None
- **Activities:** Team Meetings, Hiring, Tooling & Infra
- **Story:** Steady team overhead. All members attend team meetings. Dana handles hiring. Evan does tooling.

### Running Timer
Faye has a timer running on "Backend API" (Enterprise Portal), started 40 min before seed time. Tests auto-stop behavior.

---

## Lifecycle Curves

The seed uses lifecycle-aware time distribution per activity:
- **linear** — constant rate throughout project
- **bell** — peaks mid-project (typical for core dev work)
- **ramp_up** — starts slow, accelerates (QA, new projects)
- **ramp_down** — heavy at start, tapers off (design in later phases)
- **back_loaded** — accelerates toward end (scope creep pattern)

## What This Exercises

| Feature | Scenario |
|---------|----------|
| Project budget report | Portal (on track), Brand (over), Checkout (barely started) |
| Financial report (margins) | Brand shows cost > revenue on some tags |
| Personal time report | All users have varied distributions |
| Team management | 4 roles, cross-account membership |
| Timer auto-stop | Faye's running timer |
| Non-billable filtering | Internal Ops excluded from financial calcs |
| Activity assignments | User-role users restricted to assigned activities |
| Multi-account | Alex belongs to both accounts |
| Entry notes | ~30% of entries have contextual notes |
| Journal notes | ~15% of noted entries have additional entry_notes |
