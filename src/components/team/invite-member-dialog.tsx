import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useInviteMember } from "@/hooks/use-members"

const inviteFormSchema = z.object({
  email: z.string().email("Enter a valid email address").max(254, "Email must be 254 characters or less"),
  role: z.enum(["admin", "manager", "user"]),
})

type InviteFormData = z.infer<typeof inviteFormSchema>

interface InviteMemberDialogProps {
  open: boolean
  onClose: () => void
}

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Something went wrong. Please try again."
  }

  const err = error as Record<string, unknown>

  // 409 Conflict — ErrorResponse with type "conflict"
  if (err.type === "conflict") {
    return "This email is already a member of the account."
  }

  // 422 — HTTPValidationError with detail array
  if (Array.isArray(err.detail) && err.detail.length > 0) {
    const first = err.detail[0] as { msg?: string }
    return first.msg ?? "Validation error. Please check your input."
  }

  // Other ErrorResponse (400, 403, etc.) — use message field
  if (typeof err.message === "string" && err.message.length > 0) {
    return err.message
  }

  return "Something went wrong. Please try again."
}

export default function InviteMemberDialog({ open, onClose }: InviteMemberDialogProps) {
  const inviteMember = useInviteMember()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "user",
    },
  })

  useEffect(() => {
    if (!open) return
    reset({ email: "", role: "user" })
    setApiError(null)
    inviteMember.reset()
  }, [open])

  const onSubmit = async (data: InviteFormData) => {
    setApiError(null)
    try {
      await inviteMember.mutateAsync({ email: data.email, role: data.role })
      onClose()
    } catch (err: unknown) {
      setApiError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="name@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              {...register("role")}
              className="flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.role.message}</p>
            )}
          </div>

          {apiError && (
            <p className="text-xs text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 rounded-md px-3 py-2">
              {apiError}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Inviting..." : "Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
