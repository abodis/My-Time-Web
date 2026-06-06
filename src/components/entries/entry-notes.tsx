import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useEntryNotes, useCreateNote } from "@/hooks/use-entry-notes"

interface EntryNotesProps {
  entryId: string
  open: boolean
}

const MIN_LENGTH = 1
const MAX_LENGTH = 5000

export default function EntryNotes({ entryId, open }: EntryNotesProps) {
  const { data: notes = [], isLoading } = useEntryNotes(entryId)
  const createNote = useCreateNote()
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const trimmedLength = content.trim().length
  const isValid = trimmedLength >= MIN_LENGTH && trimmedLength <= MAX_LENGTH
  const showValidation = content.length > 0 && !isValid

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setError(null)
    createNote.mutate(
      { entryId, body: { content: content.trim() } },
      {
        onSuccess: () => {
          setContent("")
        },
        onError: () => {
          setError("Failed to save note. Please try again.")
        },
      }
    )
  }

  // Sort chronologically (oldest first)
  const sortedNotes = [...notes].sort(
    (a, b) => Date.parse(a.createdAt ?? "0") - Date.parse(b.createdAt ?? "0")
  )

  return (
    <div className="mt-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xs font-semibold text-[hsl(var(--card-foreground))]">
          Notes
        </h3>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          ({notes.length})
        </span>
      </div>

      {isLoading ? (
        <p className="text-xs text-[hsl(var(--muted-foreground))]">Loading notes...</p>
      ) : sortedNotes.length > 0 ? (
        <ul className="flex flex-col gap-2 mb-3">
          {sortedNotes.map((note) => (
            <li key={note.id} className="rounded bg-[hsl(var(--card))] p-2 text-xs text-[hsl(var(--card-foreground))]">
              <p className="whitespace-pre-wrap break-words">{note.content}</p>
              {note.createdAt && (
                <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                  {new Date(note.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">No notes yet.</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] resize-y min-h-[60px]"
          placeholder="Add a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
        />

        {showValidation && (
          <p className="text-xs text-[hsl(var(--destructive))]">
            Note must be between 1 and 5,000 characters.
          </p>
        )}

        {error && (
          <p className="text-xs text-[hsl(var(--destructive))]">{error}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
            {trimmedLength}/{MAX_LENGTH}
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={!isValid || createNote.isPending}
          >
            {createNote.isPending ? "Saving..." : "Add Note"}
          </Button>
        </div>
      </form>
    </div>
  )
}
