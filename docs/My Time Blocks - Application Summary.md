# My Time Blocks — Application Summary

*Prepared from legacy project documentation (2012–2014) as a foundation for the relaunch.*

## What it is

My Time Blocks is a real-time, project-based time tracking and profitability platform for teams and individuals who bill by the hour. Unlike traditional timesheets, where people reconstruct their week from memory, My Time Blocks uses live stopwatch tracking: a user starts a timer when they begin a task and stops it when they finish, capturing effort to the second. The result is an accurate, continuous record of where time actually goes — and what business value it created.

The original positioning was deliberate: this is a *time management framework*, not a *time entry tool*. The legacy whitepaper draws the analogy to a heart monitor — time is measured as work happens, rather than guessed at after the fact. That distinction is the core product thesis and the reason accuracy, adoption, and profitability insight all improve at once.

## The problem it solves

Most organizations track time badly. Web-form timesheets digitize paper without fixing its flaws: entries are retroactive, inaccurate, and often padded to fill an eight-hour day. Project management tools focus on scheduling and task distribution but lack real-time reporting, so managers can plan but can't see what's happening on the ground until reports arrive weeks late. That gap between plan and reality drives project delays, budget overruns, and lost revenue.

My Time Blocks closes the gap by making accurate tracking effortless enough that people actually do it, then turning that data into live insight into project health, profitability, and team utilization.

## Who it's for

Teams and businesses that bill hourly or need to understand the cost and profitability of their work — agencies, consultancies, professional services firms, and freelancers. The platform serves multiple levels at once: individuals gain self-awareness and focus; project managers get real-time visibility into progress and resourcing; and executives get accurate data for forecasting, staffing, and ROI decisions.

## How it works — core model

Work is organized through a small set of connected building blocks:

**Users** are team members who track time. Each has a role (Owner, Administrator, Manager, or User), a default cost per hour, and a billable percentage target that sets the expected ratio of billable to non-billable work.

**Tags** are billable work codes tied to a rate card — for example, a "Graphics" tag billed at a set rate per hour. Tags connect activities to the rates clients are charged.

**Clients** are the organizations work is performed for; every project is assigned to one.

**Projects** are the core of the system. Each project carries a budget broken down by tag, an assigned team (with the option to override any user's default cost per hour for that project), and a set of activities.

**Activities** are the specific tasks ("develop logo concepts," "client correspondence") that belong to a tag and are assigned to one or more users. Once assigned, an activity appears instantly on each team member's tracking dashboard, ready to time.

**Time blocks** are the tracked entries themselves — captured live via stopwatch, with support for manual adjustment, notes, and color coding.

## Reporting and insight

The reporting layer turns tracked time into decisions. A dashboard shows total recorded hours, the billable vs. non-billable split, the company-wide billable ratio, who has timers running right now, and time logged by project and by tag. Project reports compare budgeted hours against actual time consumed — surfacing whether each project is on track or over budget, broken down by activity type, with resource-cost and time-variance analysis. User reports measure team utilization to inform hiring and workload decisions. Report data exports to CSV by client and project.

## Design principles (from the original team)

The legacy documentation emphasizes four pillars that should carry into the rebuild:

- **User experience first** — adoption is the hardest problem in time tracking; a frictionless, task-driven interface is what makes the data accurate and trustworthy.
- **Multi-device flow** — track where you work; a timer can be paused on one device and resumed on another, with a consistent interface across desktop, laptop, tablet, and phone.
- **Customization** — businesses track time differently, so the system adapts to projects, rate cards, and workflows rather than enforcing one model (including the ability to brand it).
- **Open and integrable** — built on open standards with a documented RESTful API, designed to integrate with existing systems and authentication rather than locking customers in.

## Origins and technical lineage

The product began as an iPad app ("myTIME," App Store v1.0.2) from The Development Factory / myTIME Inc. in Toronto, then evolved into an HTML5 web/enterprise version branded "My Time Blocks" (legacy builds reached v0.9.3). The legacy stack was a CakePHP 2.5.2 backend on MySQL exposing a RESTful API, with a Backbone/Marionette front end (HTML5, jQuery, Bootstrap). The data model was migrated from single-user to multi-user — a sign the platform was being readied for team and enterprise use when the project was paused.

## In one line

My Time Blocks captures where time actually goes — live, by project, by activity, by person — and turns it into a real-time picture of effort, cost, billable value, and project profitability.
