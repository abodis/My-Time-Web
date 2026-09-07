import { useFinancialReport } from "@/hooks/use-reports"
import { BillablePill } from "@/components/reports/billable-pill"
import { formatMoney } from "@/lib/currency"

export interface FinancialPanelProps {
  from: string
  to: string
  projectId?: string
  projects: Array<{ id: string; name: string; isBillable?: boolean }>
  selectedProjectId?: string
  onProjectChange: (id: string | undefined) => void
}

function formatHours(consumed: number, budget?: number | null): string {
  const c = consumed.toFixed(1)
  if (budget != null) {
    return `${c} / ${budget.toFixed(1)}`
  }
  return c
}

function formatMargin(margin: number, billable: number, currencyCode: string): string {
  const pct = billable > 0 ? Math.round((margin / billable) * 100) : 0
  return `${formatMoney(margin, currencyCode)} (${pct}%)`
}

// Shared column widths so every project table (and the grand total) line up
// identically. Without a fixed layout, each table sizes columns to its own
// content and the columns drift between projects.
function FinancialColumns() {
  return (
    <colgroup>
      <col className="w-[28%]" />
      <col className="w-[18%]" />
      <col className="w-[18%]" />
      <col className="w-[18%]" />
      <col className="w-[18%]" />
    </colgroup>
  )
}

export function FinancialPanel({ from, to, projectId, projects: projectList, selectedProjectId, onProjectChange }: FinancialPanelProps) {
  const { data, isLoading, isError, refetch } = useFinancialReport({
    from,
    to,
    projectId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <p className="text-sm text-text-muted">Failed to load financial data.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-xl bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--primary))]/90"
        >
          Retry
        </button>
      </div>
    )
  }

  const currency = data?.currency || "USD"
  const projects = data?.projects ?? []
  const billableIds = new Set(projectList.filter((p) => p.isBillable).map((p) => p.id))

  const grandConsumed = projects.reduce((sum, p) => sum + p.consumedHours, 0)
  const grandBillable = projects.reduce((sum, p) => sum + p.billableTotal, 0)
  const grandCost = projects.reduce((sum, p) => sum + p.costTotal, 0)
  const totalMargin = projects.reduce((sum, p) => sum + p.margin, 0)
  const marginPct = grandBillable > 0 ? Math.round((totalMargin / grandBillable) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Summary + project selector */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          Total margin: <span className="font-semibold text-[hsl(var(--foreground))]">{formatMoney(totalMargin, currency)} ({marginPct}%)</span>
        </p>
        <select
          value={selectedProjectId ?? ""}
          onChange={(e) => onProjectChange(e.target.value || undefined)}
          className="rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2 text-xs font-medium text-[hsl(var(--foreground))]"
        >
          <option value="">All Projects</option>
          {projectList.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {projects.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-text-muted">No financial data for the selected period</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.length > 1 && (
            <div className="rounded-xl bg-surface-muted p-4">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <FinancialColumns />
                  <thead>
                    <tr className="border-b text-left text-text-muted">
                      <th className="pb-2 font-bold">Grand Total</th>
                      <th className="pb-2 font-medium text-right">Hours</th>
                      <th className="pb-2 font-medium text-right">Billing</th>
                      <th className="pb-2 font-medium text-right">Cost</th>
                      <th className="pb-2 font-medium text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-semibold">
                      <td className="py-2">All Projects</td>
                      <td className="py-2 text-right">{grandConsumed.toFixed(1)}</td>
                      <td className="py-2 text-right">{formatMoney(grandBillable, currency)}</td>
                      <td className="py-2 text-right">{formatMoney(grandCost, currency)}</td>
                      <td className="py-2 text-right">{formatMargin(totalMargin, grandBillable, currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {projects.map((project) => (
            <div key={project.projectId} className="space-y-2">
              <h3 className="flex items-center gap-2 text-base font-bold">
                {project.projectName}
                {billableIds.has(project.projectId) && <BillablePill />}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <FinancialColumns />
                  <thead>
                    <tr className="border-b text-left text-text-muted">
                      <th className="pb-2 font-medium">Tag</th>
                      <th className="pb-2 font-medium text-right">Hours</th>
                      <th className="pb-2 font-medium text-right">Billing</th>
                      <th className="pb-2 font-medium text-right">Cost</th>
                      <th className="pb-2 font-medium text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.tags.map((tag) => (
                      <tr key={tag.tagId} className="border-b last:border-b-0">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            {tag.tagColor && (
                              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.tagColor }} />
                            )}
                            <span>{tag.tagName}</span>
                          </div>
                        </td>
                        <td className="py-2 text-right">{formatHours(tag.consumedHours, tag.budgetHours)}</td>
                        <td className="py-2 text-right">{formatMoney(tag.billableTotal, currency)}</td>
                        <td className="py-2 text-right">{formatMoney(tag.costTotal, currency)}</td>
                        <td className="py-2 text-right">{formatMargin(tag.margin, tag.billableTotal, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td className="py-2">Total</td>
                      <td className="py-2 text-right">{formatHours(project.consumedHours, project.budgetHours)}</td>
                      <td className="py-2 text-right">{formatMoney(project.billableTotal, currency)}</td>
                      <td className="py-2 text-right">{formatMoney(project.costTotal, currency)}</td>
                      <td className="py-2 text-right">{formatMargin(project.margin, project.billableTotal, currency)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

