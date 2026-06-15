import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import FormPageHeader from "@/components/manage/form-page-header"
import { FormCard } from "@/components/manage/form-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useCreateProject, useProjects, useUpdateProject } from "@/hooks/use-projects"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import ToggleField from "@/components/manage/toggle-field"
import { ProjectTabs, type TabDefinition } from "@/components/manage/project-tabs"
import { BudgetPanel } from "@/components/manage/budget-panel"
import { ActivitiesPanel } from "@/components/manage/activities-panel"

const projectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or fewer"),
  clientName: z.string().max(255, "Client name must be 255 characters or fewer"),
  budgetHours: z.string().refine((v) => v === "" || (Number(v) >= 0 && !isNaN(Number(v))), {
    message: "Must be 0 or greater",
  }),
  startDate: z.string(),
  endDate: z.string(),
  isBillable: z.boolean(),
  isArchived: z.boolean(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

const VALID_TABS = ["details", "budget", "activities"] as const

const TABS: TabDefinition[] = [
  { id: "details", label: "Project Details" },
  { id: "budget", label: "Budget" },
  { id: "activities", label: "Activities" },
]

export default function ProjectFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()

  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get("tab")
  const activeTab = VALID_TABS.includes(tabParam as (typeof VALID_TABS)[number]) ? tabParam! : "details"

  function handleTabChange(tabId: string) {
    setSearchParams({ tab: tabId }, { replace: true })
  }

  // Fetch projects list (used to find project by id in edit mode)
  const { data: projects, isLoading: projectsLoading } = useProjects({ includeArchived: true })
  const project = isEdit ? projects?.find((p) => p.id === id) : undefined
  const projectNotFound = isEdit && !projectsLoading && projects && !project

  // Track original values for diffing on submit
  const originalValues = useRef<ProjectFormValues | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      clientName: "",
      budgetHours: "",
      startDate: "",
      endDate: "",
      isBillable: true,
      isArchived: false,
    },
  })

  // Pre-populate form when project data arrives in edit mode
  useEffect(() => {
    if (project) {
      const values: ProjectFormValues = {
        name: project.name,
        clientName: project.clientName ?? "",
        budgetHours: project.budgetHours != null ? String(project.budgetHours) : "",
        startDate: project.startDate ?? "",
        endDate: project.endDate ?? "",
        isBillable: project.isBillable,
        isArchived: project.isArchived,
      }
      reset(values)
      originalValues.current = values
    }
  }, [project, reset])

  const isBillable = watch("isBillable")
  const isArchived = watch("isArchived")

  const [toast, setToast] = useState<string | null>(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  function onSubmit(data: ProjectFormValues) {
    if (isEdit && id) {
      // Compute changed fields only
      const original = originalValues.current
      const body: Record<string, unknown> = {}

      if (!original || data.name !== original.name) body.name = data.name
      if (!original || data.clientName !== original.clientName)
        body.clientName = data.clientName || undefined
      if (!original || data.isBillable !== original.isBillable) body.isBillable = data.isBillable
      if (!original || data.isArchived !== original.isArchived) body.isArchived = data.isArchived
      if (!original || data.startDate !== original.startDate)
        body.startDate = data.startDate || undefined
      if (!original || data.endDate !== original.endDate) body.endDate = data.endDate || undefined
      if (!original || data.budgetHours !== original.budgetHours)
        body.budgetHours = data.budgetHours ? Number(data.budgetHours) : undefined

      updateProject.mutate(
        { id, body },
        {
          onSuccess: () => {
            originalValues.current = data
            setToast("Project saved successfully.")
          },
        },
      )
    } else {
      createProject.mutate(
        {
          name: data.name,
          clientName: data.clientName || undefined,
          isBillable: data.isBillable,
          startDate: data.startDate || undefined,
          endDate: data.endDate || undefined,
          budgetHours: data.budgetHours ? Number(data.budgetHours) : undefined,
        },
        {
          onSuccess: (result) => {
            setToast("Project created successfully.")
            navigate(`/projects/${result?.id}/edit`, { replace: true })
          },
        },
      )
    }
  }

  const mutationError = isEdit ? updateProject.error : createProject.error
  const isPending = isEdit ? updateProject.isPending : createProject.isPending

  // 404: project not found
  if (projectNotFound) {
    return (
      <div className="space-y-6 p-6 wide:pt-0">
        <FormPageHeader
          backLabel="Back to Projects"
          backTo="/projects"
          title="Project Not Found"
          subtitle="The project you're looking for doesn't exist or has been removed."
          mode="Edit"
        />
        <FormCard>
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="text-sm text-gray-500">
              Could not find a project with the given ID.
            </p>
            <Button variant="ghost" asChild>
              <Link to="/projects">← Back to Projects</Link>
            </Button>
          </div>
        </FormCard>
      </div>
    )
  }

  // Loading state for edit mode
  if (isEdit && projectsLoading) {
    return (
      <div className="space-y-6 p-6 wide:pt-0">
        <FormPageHeader
          backLabel="Back to Projects"
          backTo="/projects"
          title="Edit Project"
          subtitle="Loading project..."
          mode="Edit"
        />
        <FormCard>
          <LoadingSpinner />
        </FormCard>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 wide:pt-0">
      <FormPageHeader
        backLabel="Back to Projects"
        backTo="/projects"
        title={isEdit ? "Edit Project" : "Create New Project"}
        subtitle={
          isEdit
            ? undefined
            : "Fill in the details below to initialize a new project workspace."
        }
        mode={isEdit ? "Edit" : "Create"}
      />
      <FormCard>
        {isEdit && (
          <ProjectTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange}>
            {activeTab === "details" && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name — full width, required */}
                <div className="space-y-1.5">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" {...register("name")} placeholder="Project name" />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                {/* Client Name + Budget Hours — 2-col grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input id="clientName" {...register("clientName")} placeholder="Optional" />
                    {errors.clientName && (
                      <p className="text-xs text-red-500">{errors.clientName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="budgetHours">Budget Hours</Label>
                    <Input
                      id="budgetHours"
                      type="number"
                      min={0}
                      step="any"
                      {...register("budgetHours")}
                      placeholder="0"
                    />
                    {errors.budgetHours && (
                      <p className="text-xs text-red-500">{errors.budgetHours.message}</p>
                    )}
                  </div>
                </div>

                {/* Start Date + End Date — 2-col grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" type="date" {...register("startDate")} />
                    {errors.startDate && (
                      <p className="text-xs text-red-500">{errors.startDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" type="date" {...register("endDate")} />
                    {errors.endDate && (
                      <p className="text-xs text-red-500">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>

                {/* Toggle fields — side by side */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ToggleField
                    label="Billable Project"
                    description="Track hours against client budgets."
                    checked={isBillable}
                    onChange={(checked) => setValue("isBillable", checked)}
                  />
                  <ToggleField
                    label="Archive Status"
                    description="Hide from active lists. Data is retained."
                    checked={isArchived}
                    onChange={(checked) => setValue("isArchived", checked)}
                  />
                </div>

                {/* Footer: Cancel + Submit */}
                {mutationError && (
                  <p className="text-sm text-red-500">
                    {(mutationError as { detail?: string })?.detail ??
                      "Something went wrong. Please try again."}
                  </p>
                )}
                <div className="flex items-center justify-end gap-3 border-t pt-4">
                  <Button variant="ghost" asChild>
                    <Link to="/projects">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={isPending || (isEdit && projectsLoading)}>
                    {isPending
                      ? isEdit
                        ? "Saving…"
                        : "Creating…"
                      : isEdit
                        ? "Save Changes"
                        : "Create Project"}
                  </Button>
                </div>
              </form>
            )}
            {activeTab === "budget" && <BudgetPanel projectId={id!} />}
            {activeTab === "activities" && <ActivitiesPanel projectId={id!} />}
          </ProjectTabs>
        )}
        {!isEdit && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name — full width, required */}
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input id="name" {...register("name")} placeholder="Project name" />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Client Name + Budget Hours — 2-col grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="clientName">Client Name</Label>
                <Input id="clientName" {...register("clientName")} placeholder="Optional" />
                {errors.clientName && (
                  <p className="text-xs text-red-500">{errors.clientName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="budgetHours">Budget Hours</Label>
                <Input
                  id="budgetHours"
                  type="number"
                  min={0}
                  step="any"
                  {...register("budgetHours")}
                  placeholder="0"
                />
                {errors.budgetHours && (
                  <p className="text-xs text-red-500">{errors.budgetHours.message}</p>
                )}
              </div>
            </div>

            {/* Start Date + End Date — 2-col grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" {...register("startDate")} />
                {errors.startDate && (
                  <p className="text-xs text-red-500">{errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" {...register("endDate")} />
                {errors.endDate && (
                  <p className="text-xs text-red-500">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* Toggle fields — side by side */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ToggleField
                label="Billable Project"
                description="Track hours against client budgets."
                checked={isBillable}
                onChange={(checked) => setValue("isBillable", checked)}
              />
              <ToggleField
                label="Archive Status"
                description="Hide from active lists. Data is retained."
                checked={isArchived}
                onChange={(checked) => setValue("isArchived", checked)}
              />
            </div>

            {/* Footer: Cancel + Submit */}
            {mutationError && (
              <p className="text-sm text-red-500">
                {(mutationError as { detail?: string })?.detail ??
                  "Something went wrong. Please try again."}
              </p>
            )}
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button variant="ghost" asChild>
                <Link to="/projects">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isPending || (isEdit && projectsLoading)}>
                {isPending
                  ? isEdit
                    ? "Saving…"
                    : "Creating…"
                  : isEdit
                    ? "Save Changes"
                    : "Create Project"}
              </Button>
            </div>
          </form>
        )}
      </FormCard>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-gray-800 px-4 py-3 text-sm text-white shadow-lg animate-[fadeIn_0.2s_ease-out]">
          {toast}
        </div>
      )}
    </div>
  )
}
