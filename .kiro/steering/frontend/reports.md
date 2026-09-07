---
inclusion: fileMatch
fileMatchPattern: "src/components/reports/**,src/pages/app/reports.tsx"
description: "Reports panel patterns — totals, column alignment, billable indicator"
---

# Reports

## Totals
- Per-project total row: use the API's project-level fields (e.g. `FinancialProjectItem`/`ProjectBudgetItem` carry `consumedHours`, `billableTotal`, `margin`), not a re-sum of tag rows.
- Grand total: render only when more than one project is shown (`projects.length > 1`). A single-project view already shows that project's total.

## Column Alignment
- Each project renders its own `<table>`. Use `table-fixed` + a shared `<colgroup>` so columns line up across projects — auto layout drifts per table content.

## Billable Indicator
- `isBillable` lives on the projects list (`ProjectResponse` via `useProjects()`), NOT on report items (`FinancialProjectItem`/`ProjectBudgetItem`). Build a `Set` of billable project IDs from the projects prop and look up by `projectId`.
- Render `<BillablePill />` (`src/components/reports/billable-pill.tsx`) beside the project name.
