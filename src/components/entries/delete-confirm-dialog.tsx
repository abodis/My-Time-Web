import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

  const handleConfirm = () => {
    if (!entry) return
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
    <Dialog open={open && !!entry} onOpenChange={(isOpen) => { if (!isOpen) handleCancel() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Entry</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this entry?
          </DialogDescription>
        </DialogHeader>

        {entry && (
          <div className="rounded-md bg-[hsl(var(--muted))] p-3">
            <p className="text-sm font-medium text-[hsl(var(--card-foreground))]">
              {entry.activityName ?? "Unknown Activity"}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {formatDateTime(entry.startTime)}
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
        )}

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
