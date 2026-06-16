import { usePersonalTimeReport } from "@/hooks/use-reports"
import { ProgressBar } from "@/components/reports/progress-bar"

export interface PersonalTimePanelProps {
  from: string
  to: string
  groupBy: "tag" | "activity"
}

export function PersonalTimePanel({ from, to, groupBy }: PersonalTimePanelProps) {
  const { data, isLoading, isError, refetch } = usePersonalTimeReport({
    from,
    to,
    groupBy,
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
        <p className="text-sm text-text-muted">Failed to load report data.</p>
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

  const totalHours = data?.totalHours ?? 0
  const groups = data?.groups ?? []

  const hours = Math.floor(totalHours)
  const minutes = Math.round((totalHours - hours) * 60)

  return (
    <div className="space-y-4">
      {/* Total hours summary */}
      <p className="text-sm text-text-muted">
        Total hours recorded: <span className="font-semibold text-[hsl(var(--foreground))]">{hours}h {minutes}m</span>
      </p>

      {/* Empty state */}
      {groups.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-text-muted">
            No time entries for the selected period
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-text-muted">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Hours</th>
                <th className="pb-2 font-medium">Entries</th>
                <th className="pb-2 font-medium">Progress</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} className="border-b last:border-b-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {groupBy === "tag" && group.color && (
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                      )}
                      <span>{group.name}</span>
                    </div>
                  </td>
                  <td className="py-3">{group.hours.toFixed(1)}</td>
                  <td className="py-3">{group.entryCount}</td>
                  <td className="w-1/3 py-3">
                    <ProgressBar
                      consumed={group.hours}
                      budget={totalHours}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
