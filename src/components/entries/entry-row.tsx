import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, Pencil, Trash2 } from "lucide-react"
import { formatElapsed } from "@/lib/time-utils"
import EntryNotes from "@/components/entries/entry-notes"
import type { components } from "@/api/schema"

type EntryResponse = components["schemas"]["EntryResponse"]

interface EntryRowProps {
  entry: EntryResponse
  onEdit: (entry: EntryResponse) => void
  onDelete: (entry: EntryResponse) => void
  notesOpen: boolean
  onToggleNotes: (entryId: string) => void
}

function computeDuration(entry: EntryResponse): string {
  if (!entry.endTime) {
    // Running timer — caller provides live elapsed
    return formatElapsed(Date.now() - Date.parse(entry.startTime))
  }
  if (entry.durationSeconds != null) {
    return formatElapsed(entry.durationSeconds * 1000)
  }
  return formatElapsed(Date.parse(entry.endTime) - Date.parse(entry.startTime))
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export default function EntryRow({ entry, onEdit, onDelete, notesOpen, onToggleNotes }: EntryRowProps) {
  const [duration, setDuration] = useState(() => computeDuration(entry))

  useEffect(() => {
    if (entry.endTime) return
    // Live ticker for running entries
    const id = setInterval(() => {
      setDuration(formatElapsed(Date.now() - Date.parse(entry.startTime)))
    }, 1000)
    return () => clearInterval(id)
  }, [entry.startTime, entry.endTime])

  // Recompute when entry changes (completed entries)
  useEffect(() => {
    if (entry.endTime) {
      setDuration(computeDuration(entry))
    }
  }, [entry.endTime, entry.durationSeconds, entry.startTime])

  const hasNotes = entry.notes != null && entry.notes.length > 0

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[hsl(var(--border))] last:border-b-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[hsl(var(--card-foreground))] truncate">
            {entry.activityName ?? "Unknown Activity"}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
            {entry.projectName ?? "No Project"}
          </p>
        </div>

        <div className="text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">
          {formatTime(entry.startTime)}
          {" – "}
          {entry.endTime ? formatTime(entry.endTime) : "running"}
        </div>

        <div className="text-sm font-mono font-medium text-[hsl(var(--card-foreground))] w-20 text-right">
          {duration}
        </div>

        <button
          className={`transition-colors ${hasNotes ? "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--card-foreground))]" : "text-[hsl(var(--muted-foreground))]/40 hover:text-[hsl(var(--muted-foreground))]"}`}
          title="Toggle notes"
          onClick={() => onToggleNotes(entry.id)}
        >
          <MessageSquare className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(entry)} aria-label="Edit entry">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(entry)} aria-label="Delete entry">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EntryNotes entryId={entry.id} open={notesOpen} />
    </div>
  )
}
