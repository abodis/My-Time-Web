import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
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
      <div className="flex items-center gap-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(entry)} aria-label="Edit entry">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(entry)} aria-label="Delete entry">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </Button>
        </div>
      </div>

      <EntryNotes entryId={entry.id} open={notesOpen} />
    </div>
  )
}
