import { useEffect } from "react"
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
import { useCreateEntry, useUpdateEntry } from "@/hooks/use-entries"
import { useProjects, useActivities } from "@/hooks/use-projects"
import type { components } from "@/api/schema"

type EntryResponse = components["schemas"]["EntryResponse"]

const entryFormSchema = z.object({
  activityId: z.string().uuid(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  notes: z.string().max(5000, "Notes must be 5000 characters or less").optional(),
}).refine((d) => new Date(d.endTime) > new Date(d.startTime), {
  message: "End time must be after start time",
  path: ["endTime"],
})

type EntryFormData = z.infer<typeof entryFormSchema>

interface EntryModalProps {
  mode: "create" | "edit"
  entry?: EntryResponse
  open: boolean
  onClose: () => void
}

function toDatetimeLocal(iso: string): string {
  return iso.slice(0, 16)
}

function toISOString(datetimeLocal: string): string {
  return new Date(datetimeLocal).toISOString()
}

export default function EntryModal({ mode, entry, open, onClose }: EntryModalProps) {
  const createEntry = useCreateEntry()
  const updateEntry = useUpdateEntry()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormData>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      activityId: "",
      startTime: "",
      endTime: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (!open) return
    if (mode === "edit" && entry) {
      reset({
        activityId: entry.activityId,
        startTime: entry.startTime ? toDatetimeLocal(entry.startTime) : "",
        endTime: entry.endTime ? toDatetimeLocal(entry.endTime) : "",
        notes: entry.notes ?? "",
      })
    } else {
      reset({ activityId: "", startTime: "", endTime: "", notes: "" })
    }
    createEntry.reset()
    updateEntry.reset()
  }, [open, mode, entry])

  const { data: projects = [] } = useProjects()

  const onSubmit = async (data: EntryFormData) => {
    const payload = {
      activityId: data.activityId,
      startTime: toISOString(data.startTime),
      endTime: toISOString(data.endTime),
      notes: data.notes || null,
    }

    if (mode === "create") {
      await createEntry.mutateAsync(payload)
      onClose()
    } else if (entry) {
      const changed: Record<string, string | null> = {}
      if (payload.activityId !== entry.activityId) changed.activityId = payload.activityId
      if (payload.startTime !== entry.startTime) changed.startTime = payload.startTime
      if (payload.endTime !== entry.endTime) changed.endTime = payload.endTime
      if (payload.notes !== (entry.notes ?? null)) changed.notes = payload.notes
      if (Object.keys(changed).length > 0) {
        await updateEntry.mutateAsync({ id: entry.id, body: changed })
      }
      onClose()
    }
  }

  const apiError = createEntry.error ?? updateEntry.error

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Entry" : "Edit Entry"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activityId">Activity</Label>
            <select
              id="activityId"
              {...register("activityId")}
              className="flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
            >
              <option value="">Select an activity...</option>
              {projects.map((project) => (
                <ActivityOptions key={project.id} projectId={project.id} projectName={project.name} />
              ))}
            </select>
            {errors.activityId && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.activityId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startTime">Start Time</Label>
            <Input id="startTime" type="datetime-local" {...register("startTime")} />
            {errors.startTime && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.startTime.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="endTime">End Time</Label>
            <Input id="endTime" type="datetime-local" {...register("endTime")} />
            {errors.endTime && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.endTime.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              {...register("notes")}
              rows={3}
              className="flex w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] resize-none"
              placeholder="Optional notes..."
            />
            {errors.notes && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.notes.message}</p>
            )}
          </div>

          {apiError && (
            <p className="text-xs text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 rounded-md px-3 py-2">
              {(apiError as { message?: string }).message ?? "An error occurred. Please try again."}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface ActivityOptionsProps {
  projectId: string
  projectName: string
}

function ActivityOptions({ projectId, projectName }: ActivityOptionsProps) {
  const { data: activities = [] } = useActivities(projectId)
  if (activities.length === 0) return null
  return (
    <optgroup label={projectName}>
      {activities.map((activity) => (
        <option key={activity.id} value={activity.id}>
          {activity.name}
        </option>
      ))}
    </optgroup>
  )
}
