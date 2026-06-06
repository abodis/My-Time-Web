import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useDeleteEntry } from "@/hooks/use-entries"
import type { components } from "@/api/schema"

type EntryResponse = components["schemas"]["EntryResponse"]

interface DeleteConfirmDialogProps {
  entry: EntryResponse | null
  open: boolean
  onClose: () => void
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default function DeleteConfirmDialog({ entry, open, onClose }: DeleteConfirmDialogProps) {
  const deleteEntry = useDeleteEntry()
  const [error, setError] = useState<string | null>(null)

  if (!open || !entry) return null

  const handleConfirm = () => {
    setError(null)
    deleteEntry.mutate(entry.id, {
      onSuccess: () => {
        onClose()
      },
      onError: () => {
        setError("Failed to delete entry. Please try again.")
      },
    })
  }

  const handleCancel = () => {
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-[hsl(var(--card-foreground))]">
          Delete Entry
        </h2>

        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Are you sure you want to delete this entry?
        </p>

        <div className="mt-3 rounded-md bg-[hsl(var(--muted))] p-3">
          <p className="text-sm font-medium text-[hsl(var(--card-foreground))]">
            {entry.activityName ?? "Unknown Activity"}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {formatDateTime(entry.startTime)}
          </p>
        </div>

        {error && (
          <p className="mt-3 text-sm text-[hsl(var(--destructive))]">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={deleteEntry.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteEntry.isPending}
          >
            {deleteEntry.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  )
}
