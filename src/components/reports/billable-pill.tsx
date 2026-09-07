import { CircleDollarSign } from "lucide-react"

// Pill shown beside a project name in reports to indicate the project is
// billable. Uses the same green dollar-sign convention as the projects list.
export function BillablePill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--primary))]/10 px-2 py-0.5 text-xs font-medium text-[hsl(var(--primary))]">
      <CircleDollarSign className="h-3.5 w-3.5" />
      Billable
    </span>
  )
}
