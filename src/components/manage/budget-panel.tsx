import { useState } from "react"
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from "@/hooks/use-budgets"
import { useTags } from "@/hooks/use-tags"
import { Input } from "@/components/ui/input"

interface BudgetPanelProps {
  projectId: string
}

export function BudgetPanel({ projectId }: BudgetPanelProps) {
  const { data: budgets, isLoading } = useBudgets(projectId)
  const { data: tags } = useTags()
  const createBudget = useCreateBudget()
  const updateBudget = useUpdateBudget()
  const deleteBudget = useDeleteBudget()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [newTagId, setNewTagId] = useState("")
  const [newHours, setNewHours] = useState("")
  const [error, setError] = useState<string | null>(null)

  const budgetedTagIds = new Set((budgets ?? []).map((b) => b.tagId))
  const availableTags = (tags ?? []).filter((t) => !budgetedTagIds.has(t.id))
  const allTagsAllocated = (tags ?? []).length > 0 && availableTags.length === 0

  function getTagById(tagId: string) {
    return (tags ?? []).find((t) => t.id === tagId)
  }

  function extractErrorMessage(err: unknown): string {
    if (err && typeof err === "object" && "message" in err) {
      return (err as { message: string }).message
    }
    return "An error occurred. Please try again."
  }

  function handleCreate() {
    if (!newTagId || !newHours) return
    const hours = parseFloat(newHours)
    if (isNaN(hours) || hours <= 0 || hours > 99999) return

    setError(null)
    createBudget.mutate(
      { projectId, body: { tagId: newTagId, budgetHours: hours } },
      {
        onSuccess: () => {
          setNewTagId("")
          setNewHours("")
        },
        onError: (err) => {
          setError(extractErrorMessage(err))
        },
      }
    )
  }

  function handleEditStart(budgetId: string, currentHours: number) {
    setEditingId(budgetId)
    setEditValue(String(currentHours))
    setError(null)
  }

  function handleEditConfirm(budgetId: string, previousHours: number) {
    const hours = parseFloat(editValue)
    if (isNaN(hours) || hours <= 0 || hours > 99999) {
      setError("Hours must be greater than 0 and at most 99,999.")
      return
    }

    setEditingId(null)
    updateBudget.mutate(
      { projectId, budgetId, body: { budgetHours: hours } },
      {
        onError: (err) => {
          setError(extractErrorMessage(err))
          // Revert handled by query invalidation — but show error
          void previousHours
        },
      }
    )
  }

  function handleEditCancel() {
    setEditingId(null)
    setEditValue("")
    setError(null)
  }

  function handleEditKeyDown(e: React.KeyboardEvent, budgetId: string, previousHours: number) {
    if (e.key === "Enter") {
      handleEditConfirm(budgetId, previousHours)
    } else if (e.key === "Escape") {
      handleEditCancel()
    }
  }

  function handleDelete(budgetId: string) {
    if (!window.confirm("Are you sure you want to delete this budget?")) return

    setError(null)
    deleteBudget.mutate(
      { projectId, budgetId },
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
          aria-label="Loading budgets"
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

      {(!budgets || budgets.length === 0) && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-text-muted">No budgets have been allocated yet.</p>
        </div>
      )}

      {budgets && budgets.length > 0 && (
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium uppercase text-text-muted px-3 py-2">Tag</th>
              <th className="text-left text-xs font-medium uppercase text-text-muted px-3 py-2">Hours</th>
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="text-sm">
            {budgets.map((budget, index) => {
              const tag = getTagById(budget.tagId)
              return (
                <tr
                  key={budget.id}
                  className={`border-b border-surface-border ${index % 2 === 1 ? "bg-gray-50/50" : ""}`}
                >
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: tag?.color ?? "#94a3b8" }}
                      />
                      <span>{tag?.name ?? "Unknown"}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {editingId === budget.id ? (
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleEditConfirm(budget.id, budget.budgetHours)}
                        onKeyDown={(e) => handleEditKeyDown(e, budget.id, budget.budgetHours)}
                        min={0.5}
                        max={99999}
                        step={0.5}
                        className="w-24"
                        autoFocus
                      />
                    ) : (
                      <button
                        type="button"
                        className="cursor-pointer rounded px-1 hover:bg-surface-muted"
                        onClick={() => handleEditStart(budget.id, budget.budgetHours)}
                      >
                        {budget.budgetHours}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      className="rounded p-1 text-text-muted hover:bg-[hsl(var(--destructive))]/10 hover:text-[hsl(var(--destructive))]"
                      onClick={() => handleDelete(budget.id)}
                      aria-label="Delete budget"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Create row */}
      {allTagsAllocated ? (
        <p className="text-sm text-text-muted px-3">All tags have been allocated a budget.</p>
      ) : (
        <div className="flex items-center gap-2 px-3 pt-2">
          <select
            value={newTagId}
            onChange={(e) => setNewTagId(e.target.value)}
            className="flex h-9 rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
          >
            <option value="">Select tag...</option>
            {availableTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <Input
            type="number"
            placeholder="Hours"
            value={newHours}
            onChange={(e) => setNewHours(e.target.value)}
            min={0.5}
            max={99999}
            step={0.5}
            className="w-24"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={!newTagId || !newHours || createBudget.isPending}
            className="rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}
