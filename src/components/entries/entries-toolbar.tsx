import { Button } from "@/components/ui/button"

type DateRange = "today" | "week"

interface EntriesToolbarProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  onAddEntry: () => void
}

export default function EntriesToolbar({ dateRange, onDateRangeChange, onAddEntry }: EntriesToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1 rounded-lg bg-[hsl(var(--muted))] p-1">
        <button
          onClick={() => onDateRangeChange("today")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${dateRange === "today"
              ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
        >
          Today
        </button>
        <button
          onClick={() => onDateRangeChange("week")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${dateRange === "week"
              ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
        >
          This Week
        </button>
      </div>

      <Button onClick={onAddEntry}>Add Entry</Button>
    </div>
  )
}
