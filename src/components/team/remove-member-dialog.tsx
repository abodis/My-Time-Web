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
import { useRemoveMember } from "@/hooks/use-members"
import type { components } from "@/api/schema"

type MemberResponse = components["schemas"]["MemberResponse"]

interface RemoveMemberDialogProps {
  member: MemberResponse | null
  open: boolean
  onClose: () => void
}

export default function RemoveMemberDialog({ member, open, onClose }: RemoveMemberDialogProps) {
  const removeMember = useRemoveMember()
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = () => {
    if (!member) return
    setError(null)
    removeMember.mutate(member.id, {
      onSuccess: () => {
        onClose()
      },
      onError: (err: unknown) => {
        const status = (err as { status?: number })?.status
        if (status === 409) {
          setError("Cannot remove — this is the last admin on the account.")
        } else {
          setError("Something went wrong. Please try again.")
        }
      },
    })
  }

  const handleCancel = () => {
    setError(null)
    onClose()
  }

  const displayName = member?.displayName ?? member?.email ?? ""

  return (
    <Dialog open={open && !!member} onOpenChange={(isOpen) => { if (!isOpen) handleCancel() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this member from the account?
          </DialogDescription>
        </DialogHeader>

        {member && (
          <div className="rounded-md bg-[hsl(var(--muted))] p-3">
            <p className="text-sm font-medium text-[hsl(var(--card-foreground))]">
              {displayName}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {member.email}
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={removeMember.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={removeMember.isPending}
          >
            {removeMember.isPending ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
