import EntryRow from "@/components/entries/entry-row"
import type { components } from "@/api/schema"

type EntryResponse = components["schemas"]["EntryResponse"]

interface EntryListProps {
  entries: EntryResponse[]
  onEdit: (entry: EntryResponse) => void
  onDelete: (entry: EntryResponse) => void
  notesEntryId: string | null
  onToggleNotes: (entryId: string) => void
}

export default function EntryList({ entries, onEdit, onDelete, notesEntryId, onToggleNotes }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
        <p className="text-sm">No entries for the selected period</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => (
        <EntryRow
          key={entry.id}
          entry={entry}
          onEdit={onEdit}
          onDelete={onDelete}
          notesOpen={notesEntryId === entry.id}
          onToggleNotes={onToggleNotes}
        />
      ))}
    </div>
  )
}
