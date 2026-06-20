import { useState } from "react"
import { useActivities } from "@/hooks/use-projects"
import { useCreateActivity, useUpdateActivity, useDeleteActivity } from "@/hooks/use-activities"
import { useTags } from "@/hooks/use-tags"
import { usePalette } from "@/hooks/use-palette"
import { useProfile } from "@/hooks/use-profile"
import { resolveTagColor } from "@/lib/color-utils"
import { Input } from "@/components/ui/input"
import { AssignmentIndicator } from "@/components/manage/assignment-indicator"
import { AssignmentPopover } from "@/components/manage/assignment-popover"

interface ActivitiesPanelProps {
  projectId: string
}

export function ActivitiesPanel({ projectId }: ActivitiesPanelProps) {
  const { data: activities, isLoading } = useActivities(projectId)
  const { data: tags } = useTags()
  const { data: palette } = usePalette()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const createActivity = useCreateActivity()
  const updateActivity = useUpdateActivity()
  const deleteActivity = useDeleteActivity()

  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)

  const showAssignedColumn = !profileLoading && (profile?.role === "manager" || profile?.role === "admin")

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<{ name: string; tagId: string; rateOverride: string }>({
    name: "",
    tagId: "",
    rateOverride: "",
  })
  const [newFields, setNewFields] = useState<{ name: string; tagId: string; rateOverride: string }>({
    name: "",
    tagId: "",
    rateOverride: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  function getTagById(tagId: string) {
    return (tags ?? []).find((t) => t.id === tagId)
  }

  function extractErrorMessage(err: unknown): string {
    if (err && typeof err === "object" && "message" in err) {
      return (err as { message: string }).message
    }
    return "An error occurred. Please try again."
  }

  function validateName(name: string): string | null {
    const trimmed = name.trim()
    if (!trimmed) return "Name is required"
    if (trimmed.length > 100) return "Name must be 100 characters or less"
    return null
  }

  function validateTag(tagId: string): string | null {
    if (!tagId) return "Tag is required"
    return null
  }

  function validateRateOverride(value: string): string | null {
    if (!value.trim()) return null
    const num = parseFloat(value)
    if (isNaN(num) || num < 0.01 || num > 999999.99) {
      return "Rate must be between 0.01 and 999,999.99"
    }
    return null
  }

  function handleCreate() {
    const errors: Record<string, string> = {}
    const nameErr = validateName(newFields.name)
    const tagErr = validateTag(newFields.tagId)
    const rateErr = validateRateOverride(newFields.rateOverride)

    if (nameErr) errors["new-name"] = nameErr
    if (tagErr) errors["new-tag"] = tagErr
    if (rateErr) errors["new-rate"] = rateErr

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setValidationErrors({})
    setError(null)

    const rateOverride = newFields.rateOverride.trim()
      ? parseFloat(newFields.rateOverride)
      : null

    createActivity.mutate(
      {
        projectId,
        body: {
          name: newFields.name.trim(),
          tagId: newFields.tagId,
          ...(rateOverride !== null ? { rateOverride } : {}),
        },
      },
      {
        onSuccess: () => {
          setNewFields({ name: "", tagId: "", rateOverride: "" })
        },
        onError: (err) => {
          setError(extractErrorMessage(err))
        },
      }
    )
  }

  function handleEditStart(activityId: string) {
    const activity = (activities ?? []).find((a) => a.id === activityId)
    if (!activity) return

    setEditingId(activityId)
    setEditFields({
      name: activity.name,
      tagId: activity.tagId,
      rateOverride: activity.rateOverride != null ? String(activity.rateOverride) : "",
    })
    setValidationErrors({})
    setError(null)
  }

  function handleEditSave() {
    if (!editingId) return

    const activity = (activities ?? []).find((a) => a.id === editingId)
    if (!activity) return

    const errors: Record<string, string> = {}
    const nameErr = validateName(editFields.name)
    const rateErr = validateRateOverride(editFields.rateOverride)

    if (nameErr) errors["edit-name"] = nameErr
    if (rateErr) errors["edit-rate"] = rateErr

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setValidationErrors({})
    setError(null)

    // Build payload with only changed fields
    const body: { name?: string | null; tagId?: string | null; rateOverride?: number | null } = {}
    const trimmedName = editFields.name.trim()
    if (trimmedName !== activity.name) {
      body.name = trimmedName
    }
    if (editFields.tagId !== activity.tagId) {
      body.tagId = editFields.tagId
    }
    const newRate = editFields.rateOverride.trim()
      ? parseFloat(editFields.rateOverride)
      : null
    const oldRate = activity.rateOverride ?? null
    if (newRate !== oldRate) {
      body.rateOverride = newRate
    }

    // If nothing changed, just close edit mode
    if (Object.keys(body).length === 0) {
      setEditingId(null)
      return
    }

    setEditingId(null)
    updateActivity.mutate(
      { id: editingId, projectId, body },
      {
        onError: (err) => {
          setError(extractErrorMessage(err))
        },
      }
    )
  }

  function handleEditCancel() {
    setEditingId(null)
    setEditFields({ name: "", tagId: "", rateOverride: "" })
    setValidationErrors({})
    setError(null)
  }

  function handleDelete(activityId: string) {
    if (!window.confirm("Are you sure you want to delete this activity?")) return

    setError(null)
    deleteActivity.mutate(
      { id: activityId, projectId },
      {
        onError: (err) => {
          setError(extractErrorMessage(err))
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div
          className="h-6 w-6 animate-spin rounded-full border-4 border-[hsl(var(--muted))] border-t-[hsl(var(--primary))]"
          role="status"
          aria-label="Loading activities"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-[hsl(var(--destructive))]/10 px-3 py-2 text-sm text-[hsl(var(--destructive))]">
          {error}
        </div>
      )}

      {(!activities || activities.length === 0) && !editingId && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-text-muted">No activities have been created yet.</p>
        </div>
      )}

      {activities && activities.length > 0 && (
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium uppercase text-text-muted px-3 py-2">Name</th>
              <th className="text-left text-xs font-medium uppercase text-text-muted px-3 py-2">Tag</th>
              <th className="text-left text-xs font-medium uppercase text-text-muted px-3 py-2">Rate Override</th>
              {showAssignedColumn && (
                <th className="text-left text-xs font-medium uppercase text-text-muted px-3 py-2">Assigned</th>
              )}
              <th className="w-20 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="text-sm">
            {activities.map((activity, index) => {
              const tag = getTagById(activity.tagId)
              const isEditing = editingId === activity.id

              if (isEditing) {
                return (
                  <tr
                    key={activity.id}
                    className={`border-b border-surface-border ${index % 2 === 1 ? "bg-gray-50/50" : ""}`}
                  >
                    <td className="px-3 py-2">
                      <Input
                        value={editFields.name}
                        onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                        placeholder="Activity name"
                        className="w-full"
                        maxLength={100}
                      />
                      {validationErrors["edit-name"] && (
                        <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{validationErrors["edit-name"]}</p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={editFields.tagId}
                        onChange={(e) => setEditFields({ ...editFields, tagId: e.target.value })}
                        className="flex h-9 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
                      >
                        <option value="">Select tag...</option>
                        {(tags ?? []).map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        value={editFields.rateOverride}
                        onChange={(e) => setEditFields({ ...editFields, rateOverride: e.target.value })}
                        placeholder="Optional"
                        min={0.01}
                        max={999999.99}
                        step={0.01}
                        className="w-28"
                      />
                      {validationErrors["edit-rate"] && (
                        <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{validationErrors["edit-rate"]}</p>
                      )}
                    </td>
                    {showAssignedColumn && (
                      <td className="px-3 py-2 text-sm text-text-muted">—</td>
                    )}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleEditSave}
                          className="rounded-md bg-[hsl(var(--primary))] px-2 py-1 text-xs font-medium text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleEditCancel}
                          className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              }

              return (
                <tr
                  key={activity.id}
                  className={`border-b border-surface-border ${index % 2 === 1 ? "bg-gray-50/50" : ""}`}
                >
                  <td className="px-3 py-3">{activity.name}</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: resolveTagColor(palette, tag?.color ?? null).normal }}
                      />
                      <span>{tag?.name ?? "Unknown"}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {activity.rateOverride != null ? `$${activity.rateOverride}` : "—"}
                  </td>
                  {showAssignedColumn && (
                    <td className="px-3 py-3">
                      <AssignmentIndicator
                        activityId={activity.id}
                        onClick={() => setOpenPopoverId(activity.id)}
                      />
                      <AssignmentPopover
                        activityId={activity.id}
                        open={openPopoverId === activity.id}
                        onOpenChange={(open) => setOpenPopoverId(open ? activity.id : null)}
                      />
                    </td>
                  )}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-[hsl(var(--foreground))]"
                        onClick={() => handleEditStart(activity.id)}
                        aria-label="Edit activity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-text-muted hover:bg-[hsl(var(--destructive))]/10 hover:text-[hsl(var(--destructive))]"
                        onClick={() => handleDelete(activity.id)}
                        aria-label="Delete activity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Create row */}
      <div className="space-y-2 px-3 pt-2">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <Input
              value={newFields.name}
              onChange={(e) => {
                setNewFields({ ...newFields, name: e.target.value })
                if (validationErrors["new-name"]) {
                  setValidationErrors((prev) => {
                    const next = { ...prev }
                    delete next["new-name"]
                    return next
                  })
                }
              }}
              placeholder="Activity name"
              maxLength={100}
            />
            {validationErrors["new-name"] && (
              <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{validationErrors["new-name"]}</p>
            )}
          </div>
          <div>
            <select
              value={newFields.tagId}
              onChange={(e) => {
                setNewFields({ ...newFields, tagId: e.target.value })
                if (validationErrors["new-tag"]) {
                  setValidationErrors((prev) => {
                    const next = { ...prev }
                    delete next["new-tag"]
                    return next
                  })
                }
              }}
              className="flex h-9 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
            >
              <option value="">Select tag...</option>
              {(tags ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {validationErrors["new-tag"] && (
              <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{validationErrors["new-tag"]}</p>
            )}
          </div>
          <div>
            <Input
              type="number"
              value={newFields.rateOverride}
              onChange={(e) => {
                setNewFields({ ...newFields, rateOverride: e.target.value })
                if (validationErrors["new-rate"]) {
                  setValidationErrors((prev) => {
                    const next = { ...prev }
                    delete next["new-rate"]
                    return next
                  })
                }
              }}
              placeholder="Rate (optional)"
              min={0.01}
              max={999999.99}
              step={0.01}
              className="w-32"
            />
            {validationErrors["new-rate"] && (
              <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{validationErrors["new-rate"]}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={createActivity.isPending}
            className="rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
