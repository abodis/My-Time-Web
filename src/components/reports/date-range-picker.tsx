import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface DateRange {
  from: string
  to: string
}

type PresetId = "last-week" | "this-week" | "this-month" | "last-month" | "all-time" | "custom"

interface Preset {
  id: PresetId
  label: string
  getRange: () => { from: Date; to: Date }
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getEndOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? 0 : 7 - day
  d.setDate(d.getDate() + diff)
  d.setHours(23, 59, 59, 999)
  return d
}

const PRESETS: Preset[] = [
  {
    id: "this-week",
    label: "This Week",
    getRange: () => {
      const now = new Date()
      return { from: getStartOfWeek(now), to: getEndOfWeek(now) }
    },
  },
  {
    id: "last-week",
    label: "Last Week",
    getRange: () => {
      const now = new Date()
      const lastWeek = new Date(now)
      lastWeek.setDate(lastWeek.getDate() - 7)
      return { from: getStartOfWeek(lastWeek), to: getEndOfWeek(lastWeek) }
    },
  },
  {
    id: "this-month",
    label: "This Month",
    getRange: () => {
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      from.setHours(0, 0, 0, 0)
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      to.setHours(23, 59, 59, 999)
      return { from, to }
    },
  },
  {
    id: "last-month",
    label: "Last Month",
    getRange: () => {
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      from.setHours(0, 0, 0, 0)
      const to = new Date(now.getFullYear(), now.getMonth(), 0)
      to.setHours(23, 59, 59, 999)
      return { from, to }
    },
  },
  {
    id: "all-time",
    label: "All Time",
    getRange: () => {
      const from = new Date(2020, 0, 1)
      from.setHours(0, 0, 0, 0)
      const to = new Date()
      to.setHours(23, 59, 59, 999)
      return { from, to }
    },
  },
]

function stripMs(iso: string): string {
  return iso.replace(/\.\d{3}Z$/, "Z")
}

function toIsoRange(from: Date, to: Date): DateRange {
  return {
    from: stripMs(from.toISOString()),
    to: stripMs(to.toISOString()),
  }
}

export interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [activePreset, setActivePreset] = useState<PresetId>("this-week")
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined)
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined)

  const displayFrom = new Date(value.from)
  const displayTo = new Date(value.to)

  function handlePreset(preset: Preset) {
    const { from, to } = preset.getRange()
    setActivePreset(preset.id)
    setCustomFrom(undefined)
    setCustomTo(undefined)
    onChange(toIsoRange(from, to))
    setOpen(false)
  }

  function handleCustomSelect(range: { from?: Date; to?: Date } | undefined) {
    if (!range) return
    const from = range.from
    const to = range.to

    setCustomFrom(from)
    setCustomTo(to)

    // Only close when a true range is selected (from !== to)
    if (from && to && from.getTime() !== to.getTime()) {
      const start = new Date(from)
      start.setHours(0, 0, 0, 0)
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      setActivePreset("custom")
      onChange(toIsoRange(start, end))
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>
            {format(displayFrom, "MMM d, yyyy")} – {format(displayTo, "MMM d, yyyy")}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets sidebar */}
          <div className="flex flex-col gap-1 border-r border-[hsl(var(--border))] p-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePreset(preset)}
                className={[
                  "rounded-md px-3 py-1.5 text-left text-xs font-medium transition-colors whitespace-nowrap",
                  activePreset === preset.id
                    ? "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                    : "text-text-muted hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
                ].join(" ")}
              >
                {preset.label}
              </button>
            ))}
            <div className="mt-1 border-t border-[hsl(var(--border))] pt-1">
              <span className={[
                "block rounded-md px-3 py-1.5 text-left text-xs font-medium",
                activePreset === "custom" ? "text-[hsl(var(--foreground))]" : "text-text-muted",
              ].join(" ")}>
                Custom
              </span>
            </div>
          </div>
          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="range"
              selected={customFrom && customTo ? { from: customFrom, to: customTo } : undefined}
              onSelect={handleCustomSelect}
              numberOfMonths={2}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
