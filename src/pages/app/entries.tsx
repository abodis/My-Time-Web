import { useMemo, useState } from "react"
import { useEntries } from "@/hooks/use-entries"
import { getStartOfDay, getEndOfDay, getStartOfWeek, getEndOfWeek } from "@/lib/time-utils"
import EntriesToolbar from "@/components/entries/entries-toolbar"
import EntryList from "@/components/entries/entry-list"
import EntryModal from "@/components/entries/entry-modal"
import DeleteConfirmDialog from "@/components/entries/delete-confirm-dialog"
import type { components } from "@/api/schema"

type EntryResponse = components["schemas"]["EntryResponse"]
type DateRange = "today" | "week"

export default function EntriesPage() {
  const [dateRange, setDateRange] = useState<DateRange>("today")
  const [deletingEntry, setDeletingEntry] = useState<EntryResponse | null>(null)
  const [notesEntryId, setNotesEntryId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [editingEntry, setEditingEntry] = useState<EntryResponse | undefined>(undefined)

  const { from, to } = useMemo(() => {
    if (dateRange === "today") {
      return { from: getStartOfDay(), to: getEndOfDay() }
    }
    return { from: getStartOfWeek(), to: getEndOfWeek() }
  }, [dateRange])

  const { data: entries = [], isLoading, isError } = useEntries({ from, to })

  const sorted = useMemo(() => {
    return [...entries].sort(
      (a, b) => Date.parse(b.startTime) - Date.parse(a.startTime)
    )
  }, [entries])

  const handleEdit = (entry: EntryResponse) => {
    setEditingEntry(entry)
    setModalMode("edit")
    setModalOpen(true)
  }

  const handleDelete = (entry: EntryResponse) => {
    setDeletingEntry(entry)
  }

  const handleAddEntry = () => {
    setEditingEntry(undefined)
    setModalMode("create")
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingEntry(undefined)
  }

  const handleToggleNotes = (entryId: string) => {
    setNotesEntryId((prev) => (prev === entryId ? null : entryId))
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[hsl(var(--destructive))]">
        <p className="text-sm">Failed to load entries. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      <EntriesToolbar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onAddEntry={handleAddEntry}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
          <p className="text-sm">Loading entries...</p>
        </div>
      ) : (
        <EntryList
          entries={sorted}
          onEdit={handleEdit}
          onDelete={handleDelete}
          notesEntryId={notesEntryId}
          onToggleNotes={handleToggleNotes}
        />
      )}

      <DeleteConfirmDialog
        entry={deletingEntry}
        open={deletingEntry !== null}
        onClose={() => setDeletingEntry(null)}
      />

      <EntryModal
        mode={modalMode}
        entry={editingEntry}
        open={modalOpen}
        onClose={handleModalClose}
      />
    </div>
  )
}
