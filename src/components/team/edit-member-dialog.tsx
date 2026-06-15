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
import { useUpdateMember } from "@/hooks/use-members"
import type { components } from "@/api/schema"

type MemberResponse = components["schemas"]["MemberResponse"]

const editMemberSchema = z.object({
  role: z.enum(["admin", "manager", "user"]),
  costRate: z
    .union([
      z.literal(""),
      z.coerce
        .number()
        .min(0, "Must be at least 0")
        .max(999999.99, "Must be at most 999,999.99")
        .refine(
          (v) => Number((v % 1).toFixed(2)) === v % 1,
          "At most 2 decimal places"
        ),
    ])
    .transform((v) => (v === "" ? null : v)),
  utilizationTarget: z
    .union([
      z.literal(""),
      z.coerce
        .number()
        .int("Must be a whole number")
        .min(0, "Must be at least 0")
        .max(100, "Must be at most 100"),
    ])
    .transform((v) => (v === "" ? null : v)),
  weeklyCapacityHours: z
    .union([
      z.literal(""),
      z.coerce
        .number()
        .min(0, "Must be at least 0")
        .max(168, "Must be at most 168")
        .refine(
          (v) => Number((v % 1).toFixed(2)) === v % 1,
          "At most 2 decimal places"
        ),
    ])
    .transform((v) => (v === "" ? null : v)),
})

type EditMemberFormData = z.input<typeof editMemberSchema>

interface EditMemberDialogProps {
  member: MemberResponse | null
  open: boolean
  onClose: () => void
}

function getApiErrorMessage(error: unknown): string {
  const err = error as { status?: number }
  switch (err.status) {
    case 409:
      return "Cannot change role — this is the last admin on the account."
    case 403:
      return "You don't have permission to perform this action."
    case 400:
    case 422:
      return "The submitted data is invalid. Please check your entries."
    default:
      return "Something went wrong. Please try again."
  }
}

export default function EditMemberDialog({ member, open, onClose }: EditMemberDialogProps) {
  const updateMember = useUpdateMember()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditMemberFormData>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      role: "user",
      costRate: "",
      utilizationTarget: "",
      weeklyCapacityHours: "",
    },
  })

  useEffect(() => {
    if (!open) return
    if (member) {
      reset({
        role: (member.role as "admin" | "manager" | "user") ?? "user",
        costRate: member.costRate != null ? member.costRate : "",
        utilizationTarget: member.utilizationTarget != null ? member.utilizationTarget : "",
        weeklyCapacityHours: member.weeklyCapacityHours != null ? member.weeklyCapacityHours : "",
      })
    }
    setApiError(null)
  }, [open, member, reset])

  const onSubmit = async (data: EditMemberFormData) => {
    if (!member) return
    setApiError(null)

    const parsed = editMemberSchema.safeParse(data)
    if (!parsed.success) return

    try {
      await updateMember.mutateAsync({
        userId: member.id,
        body: {
          role: parsed.data.role,
          costRate: parsed.data.costRate,
          utilizationTarget: parsed.data.utilizationTarget,
          weeklyCapacityHours: parsed.data.weeklyCapacityHours,
        },
      })
      onClose()
    } catch (error: unknown) {
      setApiError(getApiErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              {...register("role")}
              className="flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
            </select>
            {errors.role && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.role.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="costRate">Cost Rate</Label>
            <Input
              id="costRate"
              type="number"
              step="0.01"
              min="0"
              max="999999.99"
              placeholder="Optional"
              {...register("costRate")}
            />
            {errors.costRate && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.costRate.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="utilizationTarget">Utilization Target (%)</Label>
            <Input
              id="utilizationTarget"
              type="number"
              step="1"
              min="0"
              max="100"
              placeholder="Optional"
              {...register("utilizationTarget")}
            />
            {errors.utilizationTarget && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.utilizationTarget.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="weeklyCapacityHours">Weekly Capacity (hours)</Label>
            <Input
              id="weeklyCapacityHours"
              type="number"
              step="0.01"
              min="0"
              max="168"
              placeholder="Optional"
              {...register("weeklyCapacityHours")}
            />
            {errors.weeklyCapacityHours && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.weeklyCapacityHours.message}</p>
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
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
