import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useInviteMember } from "@/hooks/use-members"
import { useOnboardingStore } from "@/stores/onboarding-store"

// API roles are hierarchical user → manager → admin; there is no "owner" role.
const INVITE_ROLES = ["user", "manager", "admin"] as const

const inviteSchema = z.object({
  invites: z
    .array(
      z.object({
        email: z.string().trim().email("Enter a valid email address").max(254),
        role: z.enum(INVITE_ROLES),
      })
    )
    .max(20, "You can invite up to 20 people at once"),
})

type InviteFormData = z.infer<typeof inviteSchema>

// Mirrors the getErrorMessage idiom from invite-member-dialog.tsx.
function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Something went wrong. Please try again."
  }
  const err = error as Record<string, unknown>
  if (err.type === "conflict") {
    return "This email is already a member of the account."
  }
  if (Array.isArray(err.detail) && err.detail.length > 0) {
    const first = err.detail[0] as { msg?: string }
    return first.msg ?? "Validation error. Please check your input."
  }
  if (typeof err.message === "string" && err.message.length > 0) {
    return err.message
  }
  return "Something went wrong. Please try again."
}

// Per-entry send outcome surfaced after a fan-out submit (Req 7.7 — identify
// which invites failed so the owner can retry).
interface SendResult {
  email: string
  ok: boolean
}

// Optional, owner-only invite step. Lets the owner invite one or more members
// (email + role) as a fan-out of POST /account/members, shows per-invite
// success/failure, allows skipping, then advances to the summary step.
export function InviteStep() {
  const inviteMember = useInviteMember()
  const [apiError, setApiError] = useState<string | null>(null)
  const [results, setResults] = useState<SendResult[]>([])

  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { invites: [{ email: "", role: "user" }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "invites" })

  const advance = () => {
    useOnboardingStore.getState().goTo("summary")
  }

  // Skip / zero-entry: advance without sending anything (Req 7.2, 7.3, 7.5).
  const handleSkip = () => {
    advance()
  }

  const onSubmit = async (data: InviteFormData) => {
    setApiError(null)
    setResults([])

    // Zero entries is treated as a skip (Req 7.5).
    if (data.invites.length === 0) {
      advance()
      return
    }

    // Fan out one invitation per entry. allSettled so one failure does not
    // abort the rest (design.md fan-out semantics); collect per-entry status.
    const settled = await Promise.allSettled(
      data.invites.map((invite) =>
        inviteMember.mutateAsync({ email: invite.email, role: invite.role })
      )
    )

    const sendResults: SendResult[] = settled.map((outcome, i) => ({
      email: data.invites[i].email,
      ok: outcome.status === "fulfilled",
    }))
    setResults(sendResults)

    const failures = settled.filter(
      (o): o is PromiseRejectedResult => o.status === "rejected"
    )

    // Any failure keeps the owner on the step with retained values for retry
    // (Req 7.7). Only advance when every invite was sent.
    if (failures.length > 0) {
      setApiError(getErrorMessage(failures[0].reason))
      return
    }

    advance()
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
        Set up your team (optional)
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        Invite teammates by email now, or skip and add them later.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        {fields.map((field, index) => {
          const result = results.find((r) => r.email === getValues(`invites.${index}.email`))
          return (
            <div key={field.id} className="flex flex-col gap-1.5">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor={`invite-email-${index}`}>Email</Label>
                  <Input
                    id={`invite-email-${index}`}
                    type="email"
                    placeholder="name@example.com"
                    className="mt-1.5"
                    {...register(`invites.${index}.email`)}
                  />
                </div>
                <div className="w-32">
                  <Label htmlFor={`invite-role-${index}`}>Role</Label>
                  <select
                    id={`invite-role-${index}`}
                    className="mt-1.5 flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
                    {...register(`invites.${index}.role`)}
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Remove invite"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {errors.invites?.[index]?.email && (
                <p className="text-xs text-[hsl(var(--destructive))]">
                  {errors.invites[index]?.email?.message}
                </p>
              )}
              {result && (
                <p
                  className={
                    result.ok
                      ? "text-xs text-[hsl(var(--primary))]"
                      : "text-xs text-[hsl(var(--destructive))]"
                  }
                >
                  {result.ok ? "Invitation sent" : "Could not send invitation"}
                </p>
              )}
            </div>
          )
        })}

        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={fields.length >= 20}
            onClick={() => append({ email: "", role: "user" })}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add another
          </Button>
        </div>

        {apiError && (
          <p className="rounded-md bg-[hsl(var(--destructive))]/10 px-3 py-2 text-xs text-[hsl(var(--destructive))]">
            {apiError}
          </p>
        )}

        <div className="mt-2 flex justify-between">
          <Button type="button" variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send invites"}
          </Button>
        </div>
      </form>
    </div>
  )
}
