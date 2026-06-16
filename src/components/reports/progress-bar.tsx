export interface ProgressBarProps {
  consumed: number
  budget: number | null
}

export function ProgressBar({ consumed, budget }: ProgressBarProps) {
  const rawPercentage =
    budget && budget > 0 ? (consumed / budget) * 100 : 0
  const barWidth = Math.min(rawPercentage, 100)
  const displayPct = Math.round(rawPercentage)
  const isOverBudget = budget != null && budget > 0 && consumed > budget

  // Color thresholds: <80% green, 80-100% yellow, >100% red
  let fillColor: string
  if (rawPercentage > 100) {
    fillColor = "#ef4444" // red
  } else if (rawPercentage >= 80) {
    fillColor = "#eab308" // yellow
  } else {
    fillColor = "#22c55e" // green
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-9 text-right text-xs font-medium tabular-nums text-[hsl(var(--foreground))]">
        {displayPct}%
      </span>
      <div
        className="h-3 w-full rounded-full bg-[hsl(var(--muted))]"
        role="progressbar"
        aria-valuenow={consumed}
        aria-valuemin={0}
        aria-valuemax={budget ?? 0}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${barWidth}%`,
            backgroundColor: fillColor,
          }}
        />
      </div>
      {isOverBudget && (
        <span className="whitespace-nowrap text-xs font-medium text-[#ef4444]">
          {consumed.toFixed(1)} / {budget!.toFixed(1)} hrs
        </span>
      )}
    </div>
  )
}
