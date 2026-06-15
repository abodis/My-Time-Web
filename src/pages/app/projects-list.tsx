import React, { useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Archive, ArchiveRestore, CircleDollarSign, Pencil, SlidersHorizontal } from "lucide-react"
import { useProjects, useUpdateProject } from "@/hooks/use-projects"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import SearchToolbar from "@/components/manage/search-toolbar"
import DataTable from "@/components/manage/data-table"
import type { Column } from "@/components/manage/data-table"
import type { components } from "@/api/schema"

type Project = components["schemas"]["ProjectResponse"]

function ProjectActions({ project }: { project: Project }) {
  const { mutate: updateProject } = useUpdateProject()

  return (
    <div className="flex items-center gap-1">
      <Link
        to={`/projects/${project.id}/edit`}
        className="p-1 rounded hover:bg-gray-100"
        aria-label={`Edit ${project.name}`}
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        type="button"
        className="p-1 rounded hover:bg-gray-100"
        aria-label={`${project.isArchived ? "Unarchive" : "Archive"} ${project.name}`}
        onClick={() =>
          updateProject({ id: project.id, body: { isArchived: !project.isArchived } })
        }
      >
        {project.isArchived ? (
          <ArchiveRestore className="h-4 w-4 text-green-600" />
        ) : (
          <Archive className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  return new Date(value).toLocaleDateString()
}

const columns: Column<Project>[] = [
  {
    key: "name",
    header: "Project",
    render: (p) => (
      <span className={`inline-flex items-center gap-1.5 ${p.isArchived ? "text-gray-400" : ""}`}>
        {p.isArchived && <Archive className="h-3.5 w-3.5 text-gray-400" />}
        {p.name}
        {p.isBillable && <CircleDollarSign className="h-3.5 w-3.5 text-green-600" />}
      </span>
    ),
  },
  { key: "clientName", header: "Client", render: (p) => p.clientName ?? "—" },
  { key: "startDate", header: "Start", render: (p) => formatDate(p.startDate) },
  { key: "endDate", header: "End", render: (p) => formatDate(p.endDate) },
  { key: "budgetHours", header: "Budget (hrs)", render: (p) => p.budgetHours ?? "—" },
  {
    key: "actions",
    header: "Actions",
    render: (p) => <ProjectActions project={p} />,
  },
]

function FiltersDropdown({
  includeArchived,
  onIncludeArchivedChange,
}: {
  includeArchived: boolean
  onIncludeArchivedChange: (value: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-2 text-sm hover:bg-gray-50"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border bg-white p-3 shadow-md">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => onIncludeArchivedChange(e.target.checked)}
              className="rounded"
            />
            Show archived
          </label>
        </div>
      )}
    </div>
  )
}

export default function ProjectsListPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [includeArchived, setIncludeArchived] = useState(false)

  const { data: projects = [], isPending, isError, refetch } = useProjects({ includeArchived })

  const filtered = useMemo(() => {
    if (!searchQuery) return projects
    const q = searchQuery.toLowerCase()
    return projects.filter((p) => p.name.toLowerCase().includes(q))
  }, [projects, searchQuery])

  return (
    <div className="flex flex-col gap-6 p-6 wide:pt-0">
      <SearchToolbar
        searchPlaceholder="Search projects by name"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterSlot={
          <FiltersDropdown
            includeArchived={includeArchived}
            onIncludeArchivedChange={setIncludeArchived}
          />
        }
        actionSlot={
          <Link
            to="/projects/new"
            className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:bg-[hsl(var(--primary))]/90"
          >
            + New Project
          </Link>
        }
      />

      <div className="rounded-2xl bg-white shadow-lg p-6">
        <h2 className="mb-4 text-lg font-semibold">All Projects</h2>
        {isPending ? (
          <LoadingSpinner />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-sm text-text-muted">Failed to load projects.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:bg-[hsl(var(--primary))]/90"
            >
              Retry
            </button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(p) => p.id}
            emptyMessage={
              searchQuery
                ? "No projects found"
                : "No projects yet. Create your first project to get started."
            }
          />
        )}
      </div>
    </div>
  )
}
