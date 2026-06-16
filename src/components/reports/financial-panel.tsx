import { useFinancialReport } from "@/hooks/use-reports"

export interface FinancialPanelProps {
  from: string
  to: string
  projectId?: string
  projects: Array<{ id: string; name: string }>
  selectedProjectId?: string
  onProjectChange: (id: string | undefined) => void
}

function formatMoney(value: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currencyCode} ${value.toFixed(2)}`
  }
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

  const totalMargin = projects.reduce((sum, p) => sum + p.margin, 0)
  const totalBillable = projects.reduce((sum, p) => sum + p.billableTotal, 0)
  const marginPct = totalBillable > 0 ? Math.round((totalMargin / totalBillable) * 100) : 0

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
          {projects.map((project) => (
            <div key={project.projectId} className="space-y-2">
              <h3 className="text-base font-bold">{project.projectName}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
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
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

