import { useMemo, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { useTags } from "@/hooks/use-tags"
import { usePalette } from "@/hooks/use-palette"
import { resolveTagColor, type ColorToken } from "@/lib/color-utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import SearchToolbar from "@/components/manage/search-toolbar"
import DataTable from "@/components/manage/data-table"
import type { Column } from "@/components/manage/data-table"
import { TagFormDialog } from "@/components/tags/tag-form-dialog"
import { Button } from "@/components/ui/button"
import type { components } from "@/api/schema"
import { client } from "@/api/client"
import { useMutation, useQueryClient } from "@tanstack/react-query"

type Tag = components["schemas"]["TagResponse"]

function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.DELETE("/tags/{id}", {
        params: { path: { id } },
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
    },
  })
}

export default function TagsListPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTag, setEditTag] = useState<{
    id: string
    name: string
    color: ColorToken | null
    defaultRate: number | null | undefined
    rateCurrency: string | null | undefined
  } | null>(null)

  const { data: tags = [], isPending, isError, refetch } = useTags()
  const { data: palette } = usePalette()
  const deleteTag = useDeleteTag()

  const filtered = useMemo(() => {
    if (!searchQuery) return tags
    const q = searchQuery.toLowerCase()
    return tags.filter((t) => t.name.toLowerCase().includes(q))
  }, [tags, searchQuery])

  function handleEdit(tag: Tag) {
    setEditTag({
      id: tag.id,
      name: tag.name,
      color: (tag.color as ColorToken) ?? null,
      defaultRate: tag.defaultRate,
      rateCurrency: tag.rateCurrency,
    })
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditTag(null)
    setDialogOpen(true)
  }

  function handleDelete(tag: Tag) {
    if (!window.confirm(`Delete tag "${tag.name}"? This cannot be undone.`)) return
    deleteTag.mutate(tag.id)
  }

  const columns: Column<Tag>[] = [
    {
      key: "color",
      header: "Color",
      render: (t) => (
        <span
          className="inline-block h-4 w-4 rounded-full"
          style={{ backgroundColor: resolveTagColor(palette, t.color ?? null).normal }}
        />
      ),
      className: "w-16",
    },
    {
      key: "name",
      header: "Name",
      render: (t) => <span className={t.isArchived ? "text-gray-400" : ""}>{t.name}</span>,
    },
    {
      key: "defaultRate",
      header: "Rate",
      render: (t) =>
        t.defaultRate != null
          ? `${t.defaultRate}${t.rateCurrency ? ` ${t.rateCurrency}` : ""}`
          : "—",
    },
    {
      key: "actions",
      header: "",
      render: (t) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-[hsl(var(--foreground))]"
            onClick={() => handleEdit(t)}
            aria-label={`Edit ${t.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-text-muted hover:bg-[hsl(var(--destructive))]/10 hover:text-[hsl(var(--destructive))]"
            onClick={() => handleDelete(t)}
            aria-label={`Delete ${t.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: "w-20",
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6 wide:pt-0">
      <SearchToolbar
        searchPlaceholder="Search tags by name"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actionSlot={
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:bg-[hsl(var(--primary))]/90"
          >
            + New Tag
          </button>
        }
      />

      <div className="rounded-2xl bg-white shadow-lg p-6">
        <h2 className="mb-4 text-lg font-semibold">All Tags</h2>
        {isPending ? (
          <LoadingSpinner />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-sm text-text-muted">Failed to load tags.</p>
            <Button variant="default" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(t) => t.id}
            emptyMessage={
              searchQuery
                ? "No tags found"
                : "No tags yet. Create your first tag to get started."
            }
          />
        )}
      </div>

      <TagFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editTag={editTag}
      />
    </div>
  )
}
