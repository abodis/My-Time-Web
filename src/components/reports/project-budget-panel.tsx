import { useProjectBudgetReport } from "@/hooks/use-reports"
import { ProgressBar } from "@/components/reports/progress-bar"

export interface ProjectBudgetPanelProps {
  from: string
  to: string
  projectId?: string
  projects: Array<{ id: string; name: string }>
  selectedProjectId?: string
  onProjectChange: (id: string | undefined) => void
}

export function ProjectBudgetPanel({ from, to, projectId, projects: projectList, selectedProjectId, onProjectChange }: ProjectBudgetPanelProps) {
  const { data, isLoading, isError, refetch } = useProjectBudgetReport({
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
        <p className="text-sm text-text-muted">Failed to load project budget data.</p>
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

  const reportProjects = data?.projects ?? []

  const totalConsumed = reportProjects.reduce((sum, p) => sum + p.consumedHours, 0)
  const totalBudget = reportProjects.reduce((sum, p) => sum + (p.budgetHours ?? 0), 0)
  const consumedH = Math.floor(totalConsumed)
  const consumedM = Math.round((totalConsumed - consumedH) * 60)
  const budgetH = Math.floor(totalBudget)
  const budgetM = Math.round((totalBudget - budgetH) * 60)

  return (
    <div className="space-y-4">
      {/* Summary + project selector */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          Hours consumed: <span className="font-semibold text-[hsl(var(--foreground))]">{consumedH}h {consumedM}m</span>
          {totalBudget > 0 && (
            <> / Budget: <span className="font-semibold text-[hsl(var(--foreground))]">{budgetH}h {budgetM}m</span></>
          )}
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

      {reportProjects.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-text-muted">No project data for the selected period.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reportProjects.map((project) => (
            <div key={project.projectId} className="space-y-2">
              <h3 className="text-base font-bold">{project.projectName}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-text-muted">
                      <th className="pb-2 font-medium">Tag</th>
                      <th className="pb-2 font-medium">Budget Hrs</th>
                      <th className="pb-2 font-medium">Consumed Hrs</th>
                      <th className="w-1/3 pb-2 font-medium">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.tags.map((tag) => (
                      <tr key={tag.tagId} className="border-b last:border-b-0">
                        <td className="py-2">
                          <span className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: tag.tagColor ?? "hsl(var(--muted-foreground))" }}
                            />
                            {tag.tagName}
                          </span>
                        </td>
                        <td className="py-2">
                          {tag.budgetHours != null ? tag.budgetHours.toFixed(1) : "—"}
                        </td>
                        <td className="py-2">{tag.consumedHours.toFixed(1)}</td>
                        <td className="py-2">
                          <ProgressBar consumed={tag.consumedHours} budget={tag.budgetHours ?? null} />
                        </td>
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
