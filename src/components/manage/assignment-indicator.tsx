import { AlertTriangle, Users } from "lucide-react"
import { useAssignments } from "@/hooks/use-assignments"

interface AssignmentIndicatorProps {
  activityId: string
  onClick: () => void
}

export function AssignmentIndicator({ activityId, onClick }: AssignmentIndicatorProps) {
  const { data, isLoading, isError } = useAssignments(activityId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1">
        <div className="h-4 w-4 animate-pulse rounded bg-[hsl(var(--muted))]" />
        <div className="h-4 w-6 animate-pulse rounded bg-[hsl(var(--muted))]" />
      </div>
    )
  }

  if (isError) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Manage assignments"
        className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-text-muted hover:bg-surface-muted"
      >
        —
      </button>
    )
  }

  const count = data?.length ?? 0

  if (count === 0) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Manage assignments"
        className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-amber-600 hover:bg-surface-muted"
      >
        <AlertTriangle className="h-4 w-4" />
        <span>0</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Manage assignments"
      className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-text-muted hover:bg-surface-muted"
    >
      <Users className="h-4 w-4" />
      <span>{count}</span>
    </button>
  )
}
